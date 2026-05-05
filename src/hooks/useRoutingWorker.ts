// src/hooks/useRoutingWorker.ts
// Hook React — cycle de vie du Web Worker routing
// Worker stocké en useRef (non-sérialisable, jamais dans Zustand — anti-pattern RESEARCH.md)
import { useEffect, useRef } from 'react'
import { useCanalStore } from '../store/canalStore'
import type { RoutingResult } from '../types/routing'

export function useRoutingWorker() {
  const workerRef = useRef<Worker | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const routingStart = useCanalStore((s) => s.routingStart)
  const routingEnd   = useCanalStore((s) => s.routingEnd)
  const routingState = useCanalStore((s) => s.routingState)

  // Lancer le worker quand routingState passe à 'computing'
  useEffect(() => {
    if (routingState !== 'computing' || !routingStart || !routingEnd) return

    // Calcul de résolution via distance approximative (évite import @turf dans le hook)
    const s = routingStart
    const e = routingEnd
    const distKm = Math.hypot(
      (e[0] - s[0]) * 111 * Math.cos(s[1] * Math.PI / 180),
      (e[1] - s[1]) * 111,
    )

    // CR-06 : guard start ≈ end — évite grille dégénérée + DOS auto-infligé sur l'API
    if (distKm < 0.1) {
      useCanalStore.getState().setRoutingState('error')
      return
    }

    const resolution: 10 | 15 = distKm <= 100 ? 10 : 15

    // PATTERN OBLIGATOIRE — new URL() littéral statique (Pitfall 3 RESEARCH.md)
    workerRef.current = new Worker(
      new URL('../workers/routingWorker.ts', import.meta.url),
      { type: 'module' },
    )

    // Timeout 30s — DoS self-protection (locked CONTEXT.md + STRIDE T-03-T02-02)
    timeoutRef.current = setTimeout(() => {
      workerRef.current?.terminate()
      workerRef.current = null
      useCanalStore.getState().setRoutingState('timeout')
    }, 30_000)

    workerRef.current.onmessage = (ev: MessageEvent<RoutingResult>) => {
      // Annuler le timeout dès réception d'une réponse
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
      workerRef.current?.terminate()
      workerRef.current = null

      const result = ev.data
      if (result.type === 'result') {
        // Utiliser getState() — handler hors cycle React (anti-stale-closure, pattern Phase 1/2)
        useCanalStore.getState().finalizeRoutedCanal(result.path)
      } else if (result.type === 'no-path') {
        useCanalStore.getState().setRoutingState('no-path')
      } else {
        console.error('[routing] Worker error:', result.message)
        useCanalStore.getState().setRoutingState('error')
      }
    }

    workerRef.current.onerror = (e: ErrorEvent) => {
      console.error('[routing] Worker onerror:', e.message, e.filename, e.lineno)
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
      workerRef.current?.terminate()
      workerRef.current = null
      useCanalStore.getState().setRoutingState('error')
    }

    workerRef.current.postMessage({
      start: routingStart,
      end: routingEnd,
      resolution,
    })

    // Cleanup : si le composant démonte pendant le calcul
    return () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [routingState, routingStart, routingEnd])
}

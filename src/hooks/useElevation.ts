// src/hooks/useElevation.ts
// Orchestrateur : sélection canal → fetch élévation → mise à jour store
// Dépend uniquement de selectedCanalId — canals lu via getState() pour éviter
// que setElevationLoading() déclenche un cleanup qui annule le fetch en cours
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { samplePoints, fetchElevations, buildProfile } from '../services/elevationApi'

export function useElevation() {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const setElevation = useCanalStore((s) => s.setElevation)
  const setElevationLoading = useCanalStore((s) => s.setElevationLoading)
  const setElevationError = useCanalStore((s) => s.setElevationError)

  useEffect(() => {
    if (!selectedCanalId) return
    // getState() lit l'état courant sans s'abonner — évite que canals soit une dépendance
    const canal = useCanalStore.getState().canals.find((c) => c.id === selectedCanalId)
    if (!canal) return
    if (canal.elevation) return        // Cache mémoire — pas de re-fetch
    if (canal.elevationLoading) return // Déjà en cours (reprise après erreur réseau)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    let cancelled = false

    const run = async () => {
      setElevationLoading(selectedCanalId, true)
      try {
        const sampledCoords = samplePoints(canal.points, 100)
        const altitudes = await fetchElevations(sampledCoords, controller.signal)
        if (cancelled) return
        const profile = buildProfile(sampledCoords, altitudes)
        setElevation(selectedCanalId, profile)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        setElevationError(selectedCanalId, message)
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) setElevationLoading(selectedCanalId, false)
      }
    }

    run()

    // Cleanup : annule le fetch uniquement si le canal sélectionné change
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [selectedCanalId, setElevation, setElevationLoading, setElevationError])
}

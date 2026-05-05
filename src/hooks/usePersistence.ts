// src/hooks/usePersistence.ts
// Hydration au montage + subscribe Zustand → écriture Dexie à chaque mutation.
// Appelé dans SidePanel.tsx (même pattern que useElevation + useRoutingWorker).
// RESEARCH.md Pattern 2 — subscribe basique (sans subscribeWithSelector) pour
// éviter de modifier la signature TypeScript du store existant.
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { db } from '../services/db'
import { DEFAULT_CALC_PARAMS } from '../types/calculation'
import type { StoredCanal } from '../types/canal'

/**
 * Orchestre la persistance locale :
 * 1. Hydrate le store Zustand depuis IndexedDB au montage de SidePanel
 * 2. Synchronise Zustand → IndexedDB à chaque mutation de canals ou calcParams
 *
 * Exclusion elevation* : Canal.elevation non persistée (RESEARCH.md Pitfall 2 + 5).
 */
export function usePersistence() {
  useEffect(() => {
    let cancelled = false

    // ── 2. Subscribe Zustand → sync Dexie à chaque mutation ─────────────────
    // Pattern subscribe basique avec comparaison de références (RESEARCH.md Pattern 2)
    // Évite subscribeWithSelector qui modifie la signature TypeScript du store.
    // Déclaré AVANT hydrate() pour que la closure de hydrate puisse mettre à jour
    // prevCanals après hydrateCanals() — évite l'aller-retour DB inutile (WR-01).
    let prevCanals = useCanalStore.getState().canals
    let prevCalcParams = useCanalStore.getState().calcParams

    const unsub = useCanalStore.subscribe(async (state) => {
      if (cancelled) return

      const canalsChanged = state.canals !== prevCanals
      const paramsChanged = state.calcParams !== prevCalcParams

      if (!canalsChanged && !paramsChanged) return

      prevCanals = state.canals
      prevCalcParams = state.calcParams

      try {
        if (canalsChanged) {
          // Exclure elevation* avant persistance (Pitfall 2 + 5)
          const toStore: StoredCanal[] = state.canals.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ elevation: _e, elevationLoading: _el, elevationError: _ee, ...rest }) => rest,
          )
          await db.canals.bulkPut(toStore)

          // Supprimer les canaux supprimés du store (Pitfall 6 — bulkPut ne supprime pas)
          const currentIds = new Set(state.canals.map((c) => c.id))
          const all = await db.canals.toArray()
          const toDelete = all
            .filter((c) => !currentIds.has(c.id))
            .map((c) => c.id)
          if (toDelete.length > 0) await db.canals.bulkDelete(toDelete)
        }

        if (paramsChanged) {
          await db.settings.put({ key: 'calcParams', value: state.calcParams })
        }
      } catch (err) {
        console.warn('[persistence] Sync failed:', err)
      }
    })

    // ── 1. Hydration au montage ──────────────────────────────────────────────
    const hydrate = async () => {
      try {
        const [storedCanals, settings] = await Promise.all([
          db.canals.toArray(),
          db.settings.get('calcParams'),
        ])
        if (cancelled) return
        const store = useCanalStore.getState()
        if (storedCanals.length > 0) {
          // CR-04 : filtrer les canaux avec coordonnées invalides avant hydration
          const validCanals = storedCanals.filter(
            (c) => Array.isArray(c.points) && c.points.length >= 2 &&
                   c.points.every(([lng, lat]) =>
                     typeof lng === 'number' && typeof lat === 'number' &&
                     lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
                   )
          ) as StoredCanal[]
          store.hydrateCanals(validCanals)
          // WR-01 : sync prevCanals après hydration pour éviter l'aller-retour DB inutile
          prevCanals = useCanalStore.getState().canals
        }
        // CR-04 : valider calcParams avant injection dans le store
        const raw = settings?.value
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          const p = raw as Record<string, unknown>
          const width = typeof p.width === 'number' && Number.isFinite(p.width) && p.width > 0
            ? p.width : DEFAULT_CALC_PARAMS.width
          const depth = typeof p.depth === 'number' && Number.isFinite(p.depth) && p.depth > 0
            ? p.depth : DEFAULT_CALC_PARAMS.depth
          store.setCalcParams({ width, depth })
        }
      } catch (err) {
        // Graceful fallback : navigation privée Firefox, quota dépassé, etc.
        // RESEARCH.md Pitfall 3
        console.warn('[persistence] Hydration failed, starting fresh:', err)
      }
    }

    hydrate()

    return () => {
      cancelled = true
      unsub()
    }
  }, [])  // [] — montage unique (SidePanel ne se démonte pas)
}

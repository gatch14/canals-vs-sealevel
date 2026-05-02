// src/hooks/useDashboard.ts
// Hook orchestrateur Phase 6 — lit TOUS les canaux du store, mémoïse le dashboard.
// Différence clé vs useCalculation/useEcology : lit canals[] entier, pas selectedCanalId.
// Pitfall 2 RESEARCH.md : useMemo obligatoire sinon recalcul à chaque keydown.
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import { computeDashboardResult } from '../lib/dashboardEngine'
import type { DashboardResult } from '../types/dashboard'

export function useDashboard(): DashboardResult | null {
  const canals     = useCanalStore((s) => s.canals)
  const calcParams = useCanalStore((s) => s.calcParams)

  return useMemo<DashboardResult | null>(() => {
    return computeDashboardResult(canals, calcParams)
  }, [canals, calcParams.width, calcParams.depth])
}

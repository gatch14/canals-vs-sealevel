// src/hooks/useCalculation.ts
// Hook orchestrateur Phase 4 — lit le store + canal sélectionné, mémoïse le résultat.
// Pitfall 2 RESEARCH.md : useMemo obligatoire sinon recalcul à chaque keydown.
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import {
  computeCalculation,
  computePartialImpact,
} from '../lib/calculationEngine'
import type { CalculationResult, PartialImpactResult } from '../types/calculation'

export interface CalculationHookResult {
  result:  CalculationResult  | null  // null si pas de canal / pas de profile / dimensions invalides
  partial: PartialImpactResult | null  // null si canal entièrement gravitaire
}

export function useCalculation(): CalculationHookResult {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals          = useCanalStore((s) => s.canals)
  const calcParams      = useCanalStore((s) => s.calcParams)

  const result = useMemo<CalculationResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal) return null
    return computeCalculation(
      selectedCanal,
      selectedCanal.elevation ?? null,
      calcParams.width,
      calcParams.depth,
    )
  }, [selectedCanalId, canals, calcParams.width, calcParams.depth])

  const partial = useMemo<PartialImpactResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || !selectedCanal.elevation) return null
    return computePartialImpact(
      selectedCanal,
      selectedCanal.elevation,
      calcParams.width,
      calcParams.depth,
    )
  }, [selectedCanalId, canals, calcParams.width, calcParams.depth])

  return { result, partial }
}

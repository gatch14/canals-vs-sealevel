// src/hooks/useEcology.ts
// Hook orchestrateur Phase 5 — lit le canal sélectionné, mémoïse l'analyse écologique.
// Pattern identique à useCalculation.ts — useMemo obligatoire (Pitfall P2 RESEARCH.md).
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import { computeEcologyAnalysis } from '../lib/ecologyEngine'
import type { EcologyResult } from '../types/ecology'

export function useEcology(): EcologyResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  return useMemo<EcologyResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal) return null
    return computeEcologyAnalysis(selectedCanal)
  }, [selectedCanalId, canals])
}

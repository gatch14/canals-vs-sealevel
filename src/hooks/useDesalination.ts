// src/hooks/useDesalination.ts
// Hook orchestrateur Phase 9 — lit le canal sélectionné, mémoïse l'analyse dessalement.
// Pattern identique à useEcology.ts — useMemo obligatoire (Pitfall P2 RESEARCH.md).
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { DesalinationResult } from '../types/desalination'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useDesalination(): DesalinationResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  return useMemo<DesalinationResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)

    return computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )
  }, [selectedCanalId, canals])
}

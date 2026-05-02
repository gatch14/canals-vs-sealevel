// src/hooks/useCircular.ts
// Hook orchestrateur Phase 11 — lit le canal sélectionné, mémoïse l'analyse circulaire.
// Pattern identique à useDesalination.ts — useMemo obligatoire (Pitfall P2 RESEARCH.md).
// Architecture : le store ne contient pas desalinationResult, on recalcule DesalinationResult
// en interne — pas d'import de useDesalination (no hook-in-hook, Pitfall P1).
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import { computeCircularAnalysis } from '../lib/circularEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { CircularResult } from '../types/circular'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useCircular(): CircularResult | null {
  const selectedCanalId     = useCanalStore((s) => s.selectedCanalId)
  const canals              = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)

  return useMemo<CircularResult | null>(() => {
    if (!desalinationEnabled) return null

    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line        = lineString(selectedCanal.points)
    const lengthKm    = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)
    const desalResult = computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )

    if (!desalResult || desalResult.nodes === 0) return null

    const params = {
      nodes:           desalResult.nodes,
      habitableZones:  desalResult.habitableZones,
      saltValue:       desalResult.saltValue,
      waterProduction: desalResult.waterProduction,
      points:          selectedCanal.points,
      lengthKm,
    }

    return computeCircularAnalysis(params, DESERT_FEATURES)
  }, [selectedCanalId, canals, desalinationEnabled])
}

// src/hooks/useMeteorology.ts
// Hook React Phase 10 — calcul météorologique automatique pour le canal sélectionné.
// Pattern : useDesalination.ts — 3 sélecteurs Zustand + find() INSIDE useMemo.
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeMeteorologyAnalysis } from '../lib/meteorologyEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { MeteorologyResult } from '../types/meteorology'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useMeteorology(): MeteorologyResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const calcParams = useCanalStore((s) => s.calcParams)

  return useMemo<MeteorologyResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null
    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    return computeMeteorologyAnalysis(
      { lengthKm, widthM: calcParams.width, points: selectedCanal.points },
      DESERT_FEATURES,
    )
  }, [selectedCanalId, canals, calcParams.width])
}

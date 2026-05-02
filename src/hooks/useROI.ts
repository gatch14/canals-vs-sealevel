// src/hooks/useROI.ts
// Hook orchestrateur Phase 12 — lit le canal sélectionné, mémoïse l'analyse ROI.
// Pattern identique à useCircular.ts — useMemo obligatoire (Pitfall P2 RESEARCH.md).
// Architecture : recalcule calcResult + desalResult + circResult en interne —
// pas d'import de useDesalination/useCircular (no hook-in-hook, Pitfall P1).
// Différence clé vs useCircular : pas de guard sur desalinationEnabled (canal sans
// désal a quand même un ROI basé sur le coût de construction).
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeCalculation } from '../lib/calculationEngine'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import { computeCircularAnalysis } from '../lib/circularEngine'
import { computeRoiAnalysis } from '../lib/roiEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { RoiResult } from '../types/roi'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useROI(): RoiResult | null {
  const selectedCanalId     = useCanalStore((s) => s.selectedCanalId)
  const canals              = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
  const calcParams          = useCanalStore((s) => s.calcParams)

  return useMemo<RoiResult | null>(() => {
    const canal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!canal || canal.points.length < 2) return null

    if (!canal.elevation || canal.elevationLoading) return null

    const calcResult = computeCalculation(
      canal,
      canal.elevation,
      calcParams.width,
      calcParams.depth,
    )
    if (!calcResult) return null

    const line        = lineString(canal.points)
    const lengthKm    = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(canal.points)
    const desalResult = computeDesalinationAnalysis(
      { lengthKm, points: canal.points, solarFactor },
      DESERT_FEATURES,
    )

    const desal = desalinationEnabled && desalResult
      ? desalResult
      : {
          nodes: 0,
          desalinationCost: [0, 0] as Interval,
          waterProduction: [0, 0] as Interval,
          saltValue: [0, 0] as Interval,
          habitableZones: [0, 0] as Interval,
        }

    let spirulineValue: Interval = [0, 0]
    let aquacultureValue: Interval = [0, 0]
    let mineralsValue: Interval = [0, 0]

    if (desalinationEnabled && desal.nodes > 0) {
      const circResult = computeCircularAnalysis(
        {
          nodes: desal.nodes,
          habitableZones: desal.habitableZones,
          saltValue: desal.saltValue,
          waterProduction: desal.waterProduction,
          points: canal.points,
          lengthKm,
        },
        DESERT_FEATURES,
      )
      if (circResult) {
        spirulineValue = circResult.spirulineValue
        aquacultureValue = circResult.aquacultureValue
        mineralsValue = circResult.mineralsValue
      }
    }

    return computeRoiAnalysis({
      costMEur: calcResult.costMEur,
      desalinationCostEur: desal.desalinationCost,
      waterProductionM3PerDay: desal.waterProduction,
      saltValueEurPerYear: desal.saltValue,
      spirulineValueEurPerYear: spirulineValue,
      aquacultureValueEurPerYear: aquacultureValue,
      mineralsValueEurPerYear: mineralsValue,
    })
  }, [selectedCanalId, canals, desalinationEnabled, calcParams])
}

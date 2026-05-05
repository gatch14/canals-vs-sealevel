// src/lib/roiEngine.ts
// Moteur ROI & Break-even Phase 12 — pur TypeScript, sans React, sans Zustand.
// Même pattern que circularEngine.ts : fonctions pures, intervalles [min, max].
// Wave 0 : stubs retournent [0,0] / null / [Infinity,Infinity] / [].
// Wave 1 (T02) : implémentation complète pour faire passer les tests en GREEN.
import { length, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import type { Interval, CalcParams } from '../types/calculation'
import type { RoiParams, RoiResult, RoiSummary } from '../types/roi'
import type { Canal } from '../types/canal'
import { computeCalculation } from './calculationEngine'
import { computeDesalinationAnalysis, calcSolarFactor } from './desalinationEngine'
import { computeCircularAnalysis } from './circularEngine'

// ─── Constantes prix eau (€/m³) ──────────────────────────────────────────────

export const WATER_PRICE_MIN = 0.5
export const WATER_PRICE_MAX = 2.0

// ─── ROI-01 : Valeur annuelle totale ─────────────────────────────────────────

/**
 * Calcule la valeur annuelle totale en M€ à partir de toutes les sources :
 * eau douce, sel, spiruline, aquaculture, minéraux.
 * Retourne [min, max] en millions d'euros par an.
 * CRITIQUE : toutes les valeurs en €/an sont divisées par 1_000_000 → M€/an.
 */
export function calcTotalAnnualValue(params: RoiParams): Interval {
  const waterMin = (params.waterProductionM3PerDay[0] * 365 * WATER_PRICE_MIN) / 1_000_000
  const waterMax = (params.waterProductionM3PerDay[1] * 365 * WATER_PRICE_MAX) / 1_000_000

  const totalMin =
    waterMin +
    params.saltValueEurPerYear[0] / 1_000_000 +
    params.spirulineValueEurPerYear[0] / 1_000_000 +
    params.aquacultureValueEurPerYear[0] / 1_000_000 +
    params.mineralsValueEurPerYear[0] / 1_000_000

  const totalMax =
    waterMax +
    params.saltValueEurPerYear[1] / 1_000_000 +
    params.spirulineValueEurPerYear[1] / 1_000_000 +
    params.aquacultureValueEurPerYear[1] / 1_000_000 +
    params.mineralsValueEurPerYear[1] / 1_000_000

  return [totalMin, totalMax]
}

// ─── ROI-02 : Coût total ──────────────────────────────────────────────────────

/**
 * Calcule le coût total (construction canal + désalinisation) en M€.
 * costMEur = coût canal en M€, desalinationCostEur converti en M€ (÷1_000_000).
 * Retourne [min, max] en millions d'euros.
 */
export function calcTotalCost(params: RoiParams): Interval {
  return [
    params.costMEur[0] + params.desalinationCostEur[0] / 1_000_000,
    params.costMEur[1] + params.desalinationCostEur[1] / 1_000_000,
  ]
}

// ─── ROI-03 : Break-even ──────────────────────────────────────────────────────

/**
 * Calcule le nombre d'années pour atteindre le break-even.
 * breakEven = totalCostMEur / annualValueMEur
 * Arithmétique d'intervalles : min = costMin / annualMax (optimiste), max = costMax / annualMin (pessimiste).
 * Retourne [Infinity, Infinity] si valeur annuelle est [0,0] (jamais rentable).
 */
export function calcBreakEven(
  totalCostMEur: Interval,
  annualValueMEur: Interval,
): Interval {
  if (annualValueMEur[0] <= 0 || annualValueMEur[1] <= 0) return [Infinity, Infinity]
  return [
    totalCostMEur[0] / annualValueMEur[1],  // optimiste : coûtMin / annualMax
    totalCostMEur[1] / annualValueMEur[0],  // pessimiste : coûtMax / annualMin
  ]
}

// ─── ROI-04 : ROI cumulé sur N années ────────────────────────────────────────

/**
 * Calcule le ROI net cumulé après `years` années en M€ :
 * roiMin = annualValueMEur.min × years - totalCostMEur.max  (scénario pessimiste)
 * roiMax = annualValueMEur.max × years - totalCostMEur.min  (scénario optimiste)
 * Les valeurs négatives avant le break-even sont intentionnelles.
 */
export function calcCumulativeRoi(
  annualValueMEur: Interval,
  totalCostMEur: Interval,
  years: number,
): Interval {
  return [
    annualValueMEur[0] * years - totalCostMEur[1],
    annualValueMEur[1] * years - totalCostMEur[0],
  ]
}

// ─── ROI-05 : Analyse complète ────────────────────────────────────────────────

/**
 * Orchestrateur : calcule l'analyse ROI complète pour un ensemble de paramètres.
 * Retourne null si les params sont tous à zéro (canal sans données).
 */
export function computeRoiAnalysis(params: RoiParams): RoiResult | null {
  if (params.costMEur[0] === 0 && params.costMEur[1] === 0) return null

  const totalAnnualValueMEur = calcTotalAnnualValue(params)
  const totalCostMEur = calcTotalCost(params)
  const breakEvenYears = calcBreakEven(totalCostMEur, totalAnnualValueMEur)
  const roi25 = calcCumulativeRoi(totalAnnualValueMEur, totalCostMEur, 25)
  const roi50 = calcCumulativeRoi(totalAnnualValueMEur, totalCostMEur, 50)
  const roi100 = calcCumulativeRoi(totalAnnualValueMEur, totalCostMEur, 100)

  return { totalAnnualValueMEur, totalCostMEur, breakEvenYears, roi25, roi50, roi100 }
}

// ─── ROI-06 : Analyse multi-canaux ───────────────────────────────────────────

/**
 * Calcule le ROI de tous les canaux et retourne un tableau de résumés.
 * Trié par breakEvenYears[0] croissant (meilleurs candidats en premier).
 * Utilisé par le dashboard global.
 */
export function calcAllCanalsRoi(
  canals: Canal[],
  calcParams: CalcParams,
  desertFeatures: FeatureCollection,
): RoiSummary[] {
  const summaries: RoiSummary[] = []

  for (const canal of canals) {
    if (!canal.elevation) continue  // pas de profil → impossible de calculer le coût

    const calcResult = computeCalculation(canal, canal.elevation, calcParams.width, calcParams.depth)
    if (!calcResult) continue

    const line = lineString(canal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(canal.points)
    const desalResult = computeDesalinationAnalysis(
      { lengthKm, points: canal.points, solarFactor },
      desertFeatures,
    )

    const desal = desalResult ?? {
      nodes: 0,
      desalinationCost: [0, 0] as Interval,
      waterProduction: [0, 0] as Interval,
      saltValue: [0, 0] as Interval,
      habitableZones: [0, 0] as Interval,
    }

    let spirulineValue: Interval = [0, 0]
    let aquacultureValue: Interval = [0, 0]
    let mineralsValue: Interval = [0, 0]

    if (desal.nodes > 0) {
      const circResult = computeCircularAnalysis(
        {
          nodes: desal.nodes,
          habitableZones: desal.habitableZones,
          saltValue: desal.saltValue,
          waterProduction: desal.waterProduction,
          points: canal.points,
          lengthKm,
        },
        desertFeatures,
      )
      if (circResult) {
        spirulineValue = circResult.spirulineValue
        aquacultureValue = circResult.aquacultureValue
        mineralsValue = circResult.mineralsValue
      }
    }

    const roiParams: RoiParams = {
      costMEur: calcResult.costMEur,
      desalinationCostEur: desal.desalinationCost,
      waterProductionM3PerDay: desal.waterProduction,
      saltValueEurPerYear: desal.saltValue,
      spirulineValueEurPerYear: spirulineValue,
      aquacultureValueEurPerYear: aquacultureValue,
      mineralsValueEurPerYear: mineralsValue,
    }

    const roiResult = computeRoiAnalysis(roiParams)
    if (!roiResult) continue

    summaries.push({
      canalId: canal.id,
      canalName: canal.name,
      totalCostMEur: roiResult.totalCostMEur,
      totalAnnualValueMEur: roiResult.totalAnnualValueMEur,
      breakEvenYears: roiResult.breakEvenYears,
      roi25: roiResult.roi25,
      roi50: roiResult.roi50,
      roi100: roiResult.roi100,
    })
  }

  return summaries.sort((a, b) => a.breakEvenYears[0] - b.breakEvenYears[0])
}

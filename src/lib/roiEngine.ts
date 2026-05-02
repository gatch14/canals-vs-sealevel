// src/lib/roiEngine.ts
// Moteur ROI & Break-even Phase 12 — pur TypeScript, sans React, sans Zustand.
// Même pattern que circularEngine.ts : fonctions pures, intervalles [min, max].
// Wave 0 : stubs retournent [0,0] / null / [Infinity,Infinity] / [].
// Wave 1 (T02) : implémentation complète pour faire passer les tests en GREEN.
import type { FeatureCollection } from 'geojson'
import type { Interval, CalcParams } from '../types/calculation'
import type { RoiParams, RoiResult, RoiSummary } from '../types/roi'
import type { Canal } from '../types/canal'

// ─── Constantes prix eau (€/m³) ──────────────────────────────────────────────

export const WATER_PRICE_MIN = 0.5
export const WATER_PRICE_MAX = 2.0

// ─── ROI-01 : Valeur annuelle totale ─────────────────────────────────────────

/**
 * Calcule la valeur annuelle totale en M€ à partir de toutes les sources :
 * eau douce, sel, spiruline, aquaculture, minéraux.
 * Retourne [min, max] en millions d'euros par an.
 */
export function calcTotalAnnualValue(_params: RoiParams): Interval {
  return [0, 0]
}

// ─── ROI-02 : Coût total ──────────────────────────────────────────────────────

/**
 * Calcule le coût total (construction canal + désalinisation) en M€.
 * costMEur = coût canal, desalinationCostEur converti en M€.
 * Retourne [min, max] en millions d'euros.
 */
export function calcTotalCost(_params: RoiParams): Interval {
  return [0, 0]
}

// ─── ROI-03 : Break-even ──────────────────────────────────────────────────────

/**
 * Calcule le nombre d'années pour atteindre le break-even.
 * breakEven = totalCostMEur / annualValueMEur
 * Retourne [Infinity, Infinity] si valeur annuelle est [0,0] (jamais rentable).
 */
export function calcBreakEven(
  _totalCostMEur: Interval,
  _annualValueMEur: Interval,
): Interval {
  return [Infinity, Infinity]
}

// ─── ROI-04 : ROI cumulé sur N années ────────────────────────────────────────

/**
 * Calcule le ROI net cumulé après `years` années :
 * roi = annualValueMEur × years - totalCostMEur
 * Retourne [min, max] en millions d'euros.
 */
export function calcCumulativeRoi(
  _annualValueMEur: Interval,
  _totalCostMEur: Interval,
  _years: number,
): Interval {
  return [0, 0]
}

// ─── ROI-05 : Analyse complète ────────────────────────────────────────────────

/**
 * Orchestrateur : calcule l'analyse ROI complète pour un ensemble de paramètres.
 * Retourne null si les params sont tous à zéro (canal sans données).
 */
export function computeRoiAnalysis(_params: RoiParams): RoiResult | null {
  return null
}

// ─── ROI-06 : Analyse multi-canaux ───────────────────────────────────────────

/**
 * Calcule le ROI de tous les canaux et retourne un tableau de résumés.
 * Utilisé par le dashboard global.
 */
export function calcAllCanalsRoi(
  _canals: Canal[],
  _calcParams: CalcParams,
  _desertFeatures: FeatureCollection,
): RoiSummary[] {
  return []
}

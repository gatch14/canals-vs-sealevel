// src/lib/circularEngine.ts
// Moteur économique circulaire Phase 11 — pur TypeScript, sans React, sans Zustand.
// Même pattern que desalinationEngine.ts : fonctions pures, intervalles [min, max].
// Wave 0 : stubs retournant [0,0] / null — implémentation en Wave 1 (T02).
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { CircularParams, CircularResult } from '../types/circular'

// ─── CIRC-01 : Production spiruline ──────────────────────────────────────────

/**
 * Calcule la production de spiruline et sa valeur économique.
 * Base : surfaces en bassins peu profonds (~10 cm) dans les zones habitables.
 * Stub Wave 0 — retourne toujours [0,0].
 */
export function calcSpirulineProduction(
  habitableZones: Interval,
  _solarFactor: number,
): { tonnes: Interval; value: Interval } {
  return { tonnes: [0, 0], value: [0, 0] }
}

// ─── CIRC-02 : Aquaculture ────────────────────────────────────────────────────

/**
 * Calcule la production aquacole (poissons, crevettes) et sa valeur économique.
 * Base : cages flottantes sur le canal dans les zones habitables.
 * Stub Wave 0 — retourne toujours [0,0].
 */
export function calcAquacultureProduction(
  habitableZones: Interval,
): { tonnes: Interval; value: Interval } {
  return { tonnes: [0, 0], value: [0, 0] }
}

// ─── CIRC-03 : Extraction minérale ───────────────────────────────────────────

/**
 * Calcule l'extraction de minéraux (Mg, K, Ca) issus des saumures de dessalement.
 * Concentrations océaniques : Mg = 0.13%, K = 0.04%, Ca = 0.04%.
 * waterProductionMinDaily en m³/jour (plancher de la fourchette).
 * Stub Wave 0 — retourne toujours [0,0].
 */
export function calcMineralExtraction(
  waterProductionMinDaily: number,
  _solarFactor: number,
): { mgTonnes: Interval; kTonnes: Interval; caTonnes: Interval; value: Interval } {
  return { mgTonnes: [0, 0], kTonnes: [0, 0], caTonnes: [0, 0], value: [0, 0] }
}

// ─── CIRC-04 : Terres arables ─────────────────────────────────────────────────

/**
 * Calcule la superficie de terres arables créées par irrigation depuis le canal.
 * Base : 1 m³/jour irrigue 3 m² (heuristique désert aride).
 * Stub Wave 0 — retourne toujours [0,0].
 */
export function calcArableLand(waterProductionMinDaily: number): Interval {
  return [0, 0]
}

// ─── CIRC-05 : Durée de vie ───────────────────────────────────────────────────

/**
 * Calcule la durée de vie estimée du canal en années.
 * Dépend de la longueur et du facteur d'aridité (zones désertiques = moins d'érosion).
 * aridityFactor : 1.0 pour désert, 0.4 pour zone humide.
 * Stub Wave 0 — retourne toujours [0,0].
 */
export function calcLifespan(
  lengthKm: number,
  aridityFactor: number,
): Interval {
  return [0, 0]
}

// ─── CIRC-06 : Timeline habitabilité ─────────────────────────────────────────

/**
 * Calcule le délai avant que les zones autour du canal deviennent habitables.
 * Dépend de la disponibilité en eau et de la valeur économique des minéraux.
 * Stub Wave 0 — retourne toujours [0,0].
 */
export function calcHabitabilityTimeline(
  waterProductionMin: Interval,
  mineralsValue: Interval,
): Interval {
  return [0, 0]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/**
 * Calcule le résultat complet de l'analyse économique circulaire pour un canal.
 * Retourne null si nodes === 0 (pas de nœuds de dessalement = pas d'économie circulaire).
 * Stub Wave 0 — retourne toujours null.
 */
export function computeCircularAnalysis(
  params: CircularParams,
  _desertFeatures: FeatureCollection,
): CircularResult | null {
  return null
}

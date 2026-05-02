// src/types/calculation.ts
// Types et constantes du moteur de calcul Phase 4 — UX-01 strict (Interval partout)
import type { Coord } from './canal'

// ─── Arithmétique d'intervalles ──────────────────────────────────────────────

/** Tuple [min, max] — toutes les valeurs numériques du moteur respectent UX-01 */
export type Interval = [number, number]

// ─── Classification terrain (CALC-03) ────────────────────────────────────────

export type TerrainType = 'plain' | 'mixed' | 'mountain'

export interface TerrainBreakdown {
  plain:    number  // km de plaine (pente < 50 m/km)
  mixed:    number  // km de mixte (pente 50–200 m/km)
  mountain: number  // km de montagne (pente > 200 m/km)
  totalKm:  number  // somme — devrait égaler la longueur totale du profil
}

// ─── Résultat principal du moteur (CALC-01 à CALC-04) ────────────────────────

export interface CalculationResult {
  lengthKm:          Interval         // ±1% turf.length() — UX-01
  volumeKm3:         Interval         // V = L × W × D / 1e9 — UX-01
  deltaSLmm:         Interval         // ΔSL = V / 361.8 — formule centrale — UX-01
  costMEur:          Interval         // somme par terrain — UX-01
  ipccPercent:       Interval         // ΔSL / 4.5 × 100 — UX-01
  terrainBreakdown:  TerrainBreakdown // décomposition affichée
}

// ─── Impact partiel (CALC-05) ────────────────────────────────────────────────

export interface PartialImpactResult {
  reachableKm:    number     // km jusqu'au premier obstacle (uphillSegments[0].distanceStart)
  stopCoord:      Coord      // [lng, lat] — via turf.along()
  lengthKm:       Interval   // longueur partielle ±2% — UX-01
  volumeKm3:      Interval   // UX-01
  deltaSLmm:      Interval   // UX-01
  costMEur:       Interval   // UX-01
  percentOfFull:  number     // (reachableKm / totalKm) × 100
}

// ─── Paramètres globaux du store (D-01) ──────────────────────────────────────

export interface CalcParams {
  width: number   // m — défaut 50 (D-01)
  depth: number   // m — défaut 5 (D-01)
}

// ─── Constantes locked (CONTEXT.md decisions) ────────────────────────────────

/** Surface des océans en millions de km² — formule ΔSL = V / 361.8 (non-négociable) */
export const OCEAN_AREA_DIVISOR = 361.8

/** Rythme IPCC montée des eaux (mm/an) = 100% pour CALC-04 */
export const IPCC_ANNUAL_RATE_MM = 4.5

/** Seuils de classification terrain en m/km (D-03) */
export const TERRAIN_THRESHOLDS = {
  plain: 50,   // pente < 50 m/km → plaine
  mixed: 200,  // pente 50–200 m/km → mixte ; > 200 → montagne
} as const

/** Coût en M€/km par type de terrain (D-03 — fourchettes locked) */
export const COST_PER_KM: Record<TerrainType, Interval> = {
  plain:    [1,   5],
  mixed:    [10,  50],
  mountain: [100, 500],
}

/** Paramètres de calcul par défaut (D-01) — affichés au mount du panel */
export const DEFAULT_CALC_PARAMS: CalcParams = {
  width: 50,
  depth: 5,
}

/** Tolérances d'ingénierie (RESEARCH.md Pattern 7 — A1 assumed) */
export const TOLERANCE = {
  length: 0.01,  // ±1% (turf geodesic)
  width:  0.05,  // ±5%
  depth:  0.10,  // ±10%
  partialLength: 0.02,  // ±2% (interpolation segment)
} as const

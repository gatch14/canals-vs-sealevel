// src/lib/meteorologyEngine.ts
// Moteur météorologique Phase 10 — pur TypeScript, sans React, sans Zustand.
// T01 : stubs compilables — tous les tests sont RED.
// T02 : implémentation complète — tous les tests passent GREEN.
import { booleanIntersects, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'
import type { Interval } from '../types/calculation'
import type { MeteorologyParams, MeteorologyResult, WeatherRisk } from '../types/meteorology'

// ─── Facteur d'aridité ────────────────────────────────────────────────────────

/** Retourne 1.0 si le tracé intersecte une zone désertique, 0.4 sinon. */
export function calcAridityFactor(
  _points: Coord[],
  _desertFeatures: FeatureCollection,
): number {
  return 0  // stub — T02 implémente
}

// ─── METEO-01 : Évaporation annuelle ─────────────────────────────────────────

/** Calcule le volume d'évaporation [min, max] km³/an. */
export function calcEvaporation(
  _surfaceKm2: number,
  _aridityFactor: number,
): Interval {
  return [0, 0]  // stub — T02 implémente
}

// ─── METEO-02 : Rayon d'influence climatique ──────────────────────────────────

/** Calcule le rayon d'influence climatique [min, max] km. */
export function calcInfluenceRadius(
  _lengthKm: number,
  _aridityFactor: number,
): Interval {
  return [0, 0]  // stub — T02 implémente
}

// ─── METEO-03 : Précipitations induites ───────────────────────────────────────

/** Calcule les précipitations supplémentaires induites [min, max] mm/an. */
export function calcInducedPrecipitation(
  _evapKm3: Interval,
  _aridityFactor: number,
): Interval {
  return [0, 0]  // stub — T02 implémente
}

// ─── METEO-04 : Refroidissement local ─────────────────────────────────────────

/** Calcule le refroidissement local [min, max] °C (valeurs négatives). */
export function calcCoolingDelta(
  _surfaceKm2: number,
  _aridityFactor: number,
): Interval {
  return [0, 0]  // stub — T02 implémente
}

// ─── METEO-05 : Indice de risque météorologique ───────────────────────────────

/** Classifie le risque météorologique selon longueur et aridité. */
export function classifyWeatherRisk(
  _lengthKm: number,
  _aridityFactor: number,
): WeatherRisk {
  return 'low'  // stub — T02 implémente
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/** Calcule le résultat complet de l'analyse météorologique. Retourne null si < 2 points. */
export function computeMeteorologyAnalysis(
  _params: MeteorologyParams,
  _desertFeatures: FeatureCollection,
): MeteorologyResult | null {
  return null  // stub — T02 implémente
}

// Suppress unused import warnings for stubs (used in T02 implementation)
void booleanIntersects
void lineString

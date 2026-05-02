// src/lib/meteorologyEngine.ts
// Moteur météorologique Phase 10 — pur TypeScript, sans React, sans Zustand.
// Même pattern que desalinationEngine.ts : fonctions pures, intervalles [min, max], Turf.js.
import { booleanIntersects, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'
import type { Interval } from '../types/calculation'
import type { MeteorologyParams, MeteorologyResult, WeatherRisk } from '../types/meteorology'

// ─── Facteur d'aridité ────────────────────────────────────────────────────────

/**
 * Retourne 1.0 si le tracé intersecte une zone désertique (desertZones.geojson),
 * 0.4 sinon (zone humide / tempérée).
 */
export function calcAridityFactor(
  points: Coord[],
  desertFeatures: FeatureCollection,
): number {
  if (points.length < 2) return 0.4

  const line = lineString(points)

  for (const feature of desertFeatures.features) {
    if (booleanIntersects(line, feature)) return 1.0
  }

  return 0.4
}

// ─── METEO-01 : Évaporation annuelle ─────────────────────────────────────────

/**
 * Calcule le volume d'évaporation annuel [min, max] km³/an.
 * Formule : surfaceKm2 × [0.5, 2.0] m/an × aridityFactor → km³/an (÷ 1000)
 * UX-01 : intervalle [min, max] — jamais valeur ponctuelle.
 */
export function calcEvaporation(
  surfaceKm2: number,
  aridityFactor: number,
): Interval {
  if (surfaceKm2 === 0) return [0, 0]
  const rateMin = 0.5 * aridityFactor
  const rateMax = 2.0 * aridityFactor
  return [
    (surfaceKm2 * rateMin) / 1000,
    (surfaceKm2 * rateMax) / 1000,
  ]
}

// ─── METEO-02 : Rayon d'influence climatique ──────────────────────────────────

/**
 * Calcule le rayon d'influence climatique [min, max] km.
 * Heuristique : [50, 150] km × aridityFactor × scale
 * scale = min(1 + lengthKm/5000, 3.0)
 * UX-01 : intervalle [min, max].
 */
export function calcInfluenceRadius(
  lengthKm: number,
  aridityFactor: number,
): Interval {
  const scale = Math.min(1.0 + lengthKm / 5000, 3.0)
  return [
    50 * aridityFactor * scale,
    150 * aridityFactor * scale,
  ]
}

// ─── METEO-03 : Précipitations induites ───────────────────────────────────────

/**
 * Calcule les précipitations supplémentaires induites [min, max] mm/an.
 * 20–40% de l'évaporation retombe sur la zone d'influence (aire km²).
 * Conversion : km³ × fraction × 1e6 / influenceAreaKm2 → mm/an
 * UX-01 : intervalle [min, max].
 */
export function calcInducedPrecipitation(
  evapKm3: Interval,
  aridityFactor: number,
  influenceAreaKm2: number,
): Interval {
  if (evapKm3[0] === 0 && evapKm3[1] === 0) return [0, 0]
  if (influenceAreaKm2 <= 0) return [0, 0]
  const pMin = 0.20 * (1 + aridityFactor)
  const pMax = 0.40 * (1 + aridityFactor)
  return [
    (evapKm3[0] * pMin * 1e6) / influenceAreaKm2,
    (evapKm3[1] * pMax * 1e6) / influenceAreaKm2,
  ]
}

// ─── METEO-04 : Refroidissement local ─────────────────────────────────────────

/**
 * Calcule le refroidissement local par évapotranspiration [min, max] °C.
 * Convention : valeurs NÉGATIVES — [0] est le refroidissement maximum (plus négatif),
 *              [1] est le refroidissement minimum (moins négatif).
 * Formule : [-2.0 × aridityFactor × base, -0.5 × aridityFactor × base]
 * base = min(surfaceKm2 / 1000, 1.0)
 * UX-01 : intervalle [min, max].
 */
export function calcCoolingDelta(
  surfaceKm2: number,
  aridityFactor: number,
): Interval {
  if (surfaceKm2 === 0) return [0, 0]
  const base = Math.min(surfaceKm2 / 1000, 1.0)
  return [
    -2.0 * aridityFactor * base,
    -0.5 * aridityFactor * base,
  ]
}

// ─── METEO-05 : Indice de risque météorologique ───────────────────────────────

/**
 * Classifie le risque météorologique selon les critères locked CONTEXT.md :
 * - 'low'      : zone humide (aridityFactor < 0.5) OU canal < 500 km
 * - 'high'     : zone désertique (aridityFactor >= 1.0) ET longueur > 1500 km
 * - 'moderate' : tous les autres cas
 */
export function classifyWeatherRisk(
  lengthKm: number,
  aridityFactor: number,
): WeatherRisk {
  const isHumid = aridityFactor < 0.5
  const isDesert = aridityFactor >= 1.0

  if (isHumid || lengthKm < 500) return 'low'
  if (isDesert && lengthKm > 1500) return 'high'
  return 'moderate'
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/**
 * Calcule le résultat complet de l'analyse météorologique pour un canal.
 * Retourne null si moins de 2 points (guard entrée invalide).
 * widthM (mètres) → surfaceKm2 : diviser par 1000 avant multiplication.
 */
export function computeMeteorologyAnalysis(
  params: MeteorologyParams,
  desertFeatures: FeatureCollection,
): MeteorologyResult | null {
  if (params.points.length < 2) return null

  const aridityFactor = calcAridityFactor(params.points, desertFeatures)
  const surfaceKm2 = (params.widthM / 1000) * params.lengthKm
  const evaporationKm3 = calcEvaporation(surfaceKm2, aridityFactor)
  const influenceRadiusKm = calcInfluenceRadius(params.lengthKm, aridityFactor)
  const midRadius = (influenceRadiusKm[0] + influenceRadiusKm[1]) / 2
  const influenceAreaKm2 = Math.PI * midRadius * midRadius

  return {
    evaporationKm3,
    influenceRadiusKm,
    precipitationMmY: calcInducedPrecipitation(evaporationKm3, aridityFactor, influenceAreaKm2),
    coolingDeltaC: calcCoolingDelta(surfaceKm2, aridityFactor),
    weatherRisk: classifyWeatherRisk(params.lengthKm, aridityFactor),
  }
}

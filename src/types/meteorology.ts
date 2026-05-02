// src/types/meteorology.ts
// Types du moteur météorologique Phase 10 — METEO-01 à METEO-05
// Toutes les valeurs numériques respectent UX-01 (Interval [min, max])
import type { Coord } from './canal'
import type { Interval } from './calculation'

// ─── METEO-05 : Indice de risque météorologique ───────────────────────────────

/**
 * Indice de risque lié aux gradients d'humidité (METEO-05).
 * - 'low'      : zone humide OU canal < 500 km
 * - 'moderate' : zone semi-aride OU 500–1500 km
 * - 'high'     : zone désertique ET > 1500 km
 */
export type WeatherRisk = 'low' | 'moderate' | 'high'

// ─── Paramètres d'entrée ──────────────────────────────────────────────────────

/** Paramètres pour le calcul des effets météorologiques (METEO-01 à METEO-05) */
export interface MeteorologyParams {
  /** Longueur totale du canal (km) */
  lengthKm: number
  /** Largeur du canal (m) — depuis calcParams.width, défaut 50 m */
  widthM: number
  /** Points du tracé [lng, lat] WGS84 */
  points: Coord[]
}

// ─── Résultat du moteur météorologique ───────────────────────────────────────

/** Résultat complet de l'analyse météorologique pour un canal (METEO-01 à METEO-05) */
export interface MeteorologyResult {
  /** Volume d'évaporation annuel [min, max] km³/an (METEO-01, UX-01)
   *  Convention : valeurs positives, min < max */
  evaporationKm3: Interval
  /** Rayon d'influence climatique [min, max] km (METEO-02, UX-01) */
  influenceRadiusKm: Interval
  /** Précipitations supplémentaires induites [min, max] mm/an (METEO-03, UX-01) */
  precipitationMmY: Interval
  /** Refroidissement local par évapotranspiration [min, max] °C (METEO-04, UX-01)
   *  Convention : valeurs NÉGATIVES — [0] est le refroidissement maximum (ex: -2.0),
   *               [1] est le refroidissement minimum (ex: -0.5), donc [0] < [1] < 0 */
  coolingDeltaC: Interval
  /** Indice de risque météorologique (METEO-05) */
  weatherRisk: WeatherRisk
}

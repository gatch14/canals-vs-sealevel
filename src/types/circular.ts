// src/types/circular.ts
// Types du moteur économique circulaire Phase 11 — CIRC-01 à CIRC-07
// Toutes les valeurs numériques respectent UX-01 (Interval [min, max])
import type { Coord } from './canal'
import type { Interval } from './calculation'

// ─── Paramètres d'entrée ──────────────────────────────────────────────────────

/** Paramètres pour le calcul de l'économie circulaire autour du canal */
export interface CircularParams {
  /** Nombre de nœuds de dessalement (issu de DesalinationResult.nodes) */
  nodes: number
  /** Superficie zones habitables potentielles [min, max] km² (DESAL-04) */
  habitableZones: Interval
  /** Valeur économique des sels récupérés [min, max] €/an (DESAL-03) */
  saltValue: Interval
  /** Volume d'eau douce produit [min, max] m³/jour (DESAL-02) */
  waterProduction: Interval
  /** Points du tracé [lng, lat] WGS84 */
  points: Coord[]
  /** Longueur totale du canal (km) */
  lengthKm: number
}

// ─── Résultat du moteur économique circulaire ─────────────────────────────────

/** Résultat complet de l'analyse économique circulaire pour un canal */
export interface CircularResult {
  /** Production spiruline [min, max] tonnes/an (CIRC-01) */
  spirulineTonnes: Interval
  /** Valeur économique spiruline [min, max] €/an (CIRC-01) */
  spirulineValue: Interval
  /** Production aquaculture [min, max] tonnes/an (CIRC-02) */
  aquacultureTonnes: Interval
  /** Valeur économique aquaculture [min, max] €/an (CIRC-02) */
  aquacultureValue: Interval
  /** Extraction magnésium [min, max] tonnes/an (CIRC-03) */
  mgTonnes: Interval
  /** Extraction potassium [min, max] tonnes/an (CIRC-03) */
  kTonnes: Interval
  /** Extraction calcium [min, max] tonnes/an (CIRC-03) */
  caTonnes: Interval
  /** Valeur économique totale minéraux [min, max] €/an (CIRC-03) */
  mineralsValue: Interval
  /** Terres arables créées par irrigation [min, max] km² (CIRC-04) */
  arableLandKm2: Interval
  /** Durée de vie estimée du canal [min, max] années (CIRC-05) */
  lifespanYears: Interval
  /** Timeline habitabilité — délai avant zones colonisables [min, max] années (CIRC-06) */
  habitabilityYears: Interval
}

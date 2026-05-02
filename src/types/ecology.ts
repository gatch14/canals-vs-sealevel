// src/types/ecology.ts
// Types du moteur écologique Phase 5 — ECO-01 à ECO-04
import type { Interval } from './calculation'

// ─── Classification d'aridité (Koppen-Geiger simplifié) ──────────────────────

/** Classe d'aridité basée sur la classification Koppen-Geiger */
export type AridityClass = 'hyperarid' | 'arid' | 'semiarid'

// ─── ECO-01 : Intersection désertique ────────────────────────────────────────

/** Résultat de l'analyse d'intersection avec les zones désertiques */
export interface DesertIntersection {
  /** Longueur totale du canal traversant des zones désertiques (km) */
  totalDesertKm: number
  /** Classe d'aridité la plus sévère des zones traversées */
  aridityClass: AridityClass
  /** Superficie potentiellement verdissable (km²) — Interval ±10% (UX-01) */
  areaKm2: Interval
}

// ─── ECO-03 : Alerte bassin endorheïque ──────────────────────────────────────

/** Alerte si le canal aboutit dans un bassin endorheïque (risque salinisation) */
export interface EndorheicAlert {
  /** true si l'endpoint du canal tombe dans un bassin endorheïque */
  detected: boolean
  /** Nom du bassin détecté (ex. "Mer Caspienne") */
  basinName?: string
  /** Exemples historiques de salinisation (ex. "Mer d'Aral, Salton Sea") */
  examples?: string
}

// ─── ECO-01 à ECO-04 : Résultat global ───────────────────────────────────────

/** Résultat complet de l'analyse écologique pour un canal */
export interface EcologyResult {
  /** Intersection avec zones désertiques — null si aucun désert traversé (ECO-01) */
  desertIntersection: DesertIntersection | null
  /** Timeline de verdissement en années — null si aucun désert traversé (ECO-02) */
  greeningTimeline: Interval | null
  /** Alerte bassin endorheïque — detected: false si pas de risque (ECO-03) */
  endorheicAlert: EndorheicAlert
  /** Risque climatique (eau en zone aride ≤35° lat) — flag booléen (ECO-04) */
  climateRiskFlag: boolean
}

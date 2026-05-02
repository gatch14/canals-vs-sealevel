// src/types/desalination.ts
// Types du moteur dessalement Phase 9 — ECO-05, DESAL-01 à DESAL-05
// Toutes les valeurs numériques respectent UX-01 (Interval [min, max])
import type { Coord } from './canal'
import type { Interval } from './calculation'

// ─── ECO-05 : Classification impact eau salée ─────────────────────────────────

/**
 * Niveau d'impact de l'eau salée selon l'écosystème traversé (ECO-05).
 * - 'low'      : zone désertique aride — impact faible, sol déjà salin
 * - 'neutral'  : zone non-classifiée — impact modéré inconnu
 * Note : 'critical' (cours d'eau/zones agricoles) reporté jusqu'à disponibilité GeoJSON dédié
 */
export type EcosystemImpactLevel = 'low' | 'neutral'

// ─── Paramètres d'entrée ──────────────────────────────────────────────────────

/** Paramètres pour le calcul des nœuds de dessalement (DESAL-01 à DESAL-05) */
export interface DesalinationParams {
  /** Longueur totale du canal (km) — utilisée pour calcDesalinationNodes */
  lengthKm: number
  /** Points du tracé [lng, lat] WGS84 — utilisés pour latitude heuristique */
  points: Coord[]
  /** Facteur solaire : 1.0 si latitude < 35°N/S, 0.7 sinon */
  solarFactor: number
}

// ─── Résultat du moteur dessalement ──────────────────────────────────────────

/** Résultat complet de l'analyse dessalement pour un canal (DESAL-01 à DESAL-05 + ECO-05) */
export interface DesalinationResult {
  /** Nombre de nœuds de dessalement — floor(lengthKm / 500) (DESAL-01) */
  nodes: number
  /** Volume d'eau douce produit [min, max] m³/jour (DESAL-02, UX-01) */
  waterProduction: Interval
  /** Valeur économique des sels récupérés [min, max] €/an (DESAL-03, UX-01) */
  saltValue: Interval
  /** Superficie zones habitables potentielles [min, max] km² (DESAL-04, UX-01) */
  habitableZones: Interval
  /** Coût infrastructure dessalement [min, max] € (DESAL-05, UX-01) */
  desalinationCost: Interval
  /** Niveau d'impact eau salée selon écosystème traversé (ECO-05) */
  ecosystemImpact: EcosystemImpactLevel
}

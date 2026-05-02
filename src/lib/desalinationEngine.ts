// src/lib/desalinationEngine.ts
// Moteur de dessalement Phase 9 — pur TypeScript, sans React, sans Zustand.
// Wave 0 : stubs RED — T02 implémente les fonctions pour faire passer les tests GREEN.
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'
import type { Interval } from '../types/calculation'
import type { DesalinationParams, DesalinationResult, EcosystemImpactLevel } from '../types/desalination'

// ─── ECO-05 : Classification écosystème ──────────────────────────────────────

/**
 * Classifie le niveau d'impact de l'eau salée selon l'écosystème traversé.
 * - Réutilise desertZones.geojson pour détecter les zones désertiques (low)
 * - Heuristique Turf.js pour cours d'eau/zones agricoles (critical)
 * STUB — retourne 'neutral' en attendant T02
 */
export function classifyEcosystem(
  _points: Coord[],
  _desertFeatures: FeatureCollection,
): EcosystemImpactLevel {
  return 'neutral'
}

// ─── DESAL-01 : Nombre de nœuds ───────────────────────────────────────────────

/**
 * Calcule le nombre de nœuds de dessalement solaires = floor(lengthKm / 500).
 * 1 nœud par tranche de 500 km (D-01 CONTEXT.md).
 * STUB — retourne 0 en attendant T02
 */
export function calcDesalinationNodes(_lengthKm: number): number {
  return 0
}

// ─── DESAL-01+02 : Facteur solaire ────────────────────────────────────────────

/**
 * Heuristique latitude → facteur solaire.
 * < 35°N/S (zones tropicales/désertiques) = 1.0 (fort ensoleillement)
 * >= 35°N/S (zones tempérées) = 0.7
 * STUB — retourne 1.0 en attendant T02
 */
export function calcSolarFactor(_points: Coord[]): number {
  return 1.0
}

// ─── DESAL-02 : Production eau douce ─────────────────────────────────────────

/**
 * Calcule la production d'eau douce [min, max] m³/jour.
 * Base : 10 000 m³/jour par nœud × solarFactor, fourchette ±20%.
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcWaterProduction(
  _nodes: number,
  _solarFactor: number,
): Interval {
  return [0, 0]
}

// ─── DESAL-03 : Valeur économique des sels ────────────────────────────────────

/**
 * Calcule la valeur économique des sels et minéraux [min, max] €/an.
 * Base : salinité 35 g/L × débit annuel × prix NaCl marché (0.05–0.15 €/kg).
 * Fourchette pilotée par prix marché min/max.
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcSaltValue(
  _nodes: number,
  _lengthKm: number,
): Interval {
  return [0, 0]
}

// ─── DESAL-04 : Zones habitables ─────────────────────────────────────────────

/**
 * Calcule la superficie de zones habitables potentielles [min, max] km².
 * Base : 500 km² par nœud (rayon ~12.6 km), fourchette ±30%.
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcHabitableZones(_nodes: number): Interval {
  return [0, 0]
}

// ─── DESAL-05 : Coût infrastructure ──────────────────────────────────────────

/**
 * Calcule le coût d'infrastructure dessalement [min, max] €.
 * Base : 50 M€ à 150 M€ par nœud (D-01 CONTEXT.md).
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcDesalinationCost(_nodes: number): Interval {
  return [0, 0]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/**
 * Calcule le résultat complet de l'analyse dessalement pour un canal.
 * STUB — retourne null si < 2 points, sinon résultat avec valeurs placeholder.
 */
export function computeDesalinationAnalysis(
  params: DesalinationParams,
  desertFeatures: FeatureCollection,
): DesalinationResult | null {
  if (params.points.length < 2) return null

  const nodes = calcDesalinationNodes(params.lengthKm)
  return {
    nodes,
    waterProduction: calcWaterProduction(nodes, params.solarFactor),
    saltValue: calcSaltValue(nodes, params.lengthKm),
    habitableZones: calcHabitableZones(nodes),
    desalinationCost: calcDesalinationCost(nodes),
    ecosystemImpact: classifyEcosystem(params.points, desertFeatures),
  }
}

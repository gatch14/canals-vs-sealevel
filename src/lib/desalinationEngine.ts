// src/lib/desalinationEngine.ts
// Moteur de dessalement Phase 9 — pur TypeScript, sans React, sans Zustand.
// Même pattern qu'ecologyEngine.ts : fonctions pures, intervalles [min, max], Turf.js.
import { booleanIntersects, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import desertZones from '../data/desertZones.geojson'
import type { Coord } from '../types/canal'
import type { Interval } from '../types/calculation'
import type { DesalinationParams, DesalinationResult, EcosystemImpactLevel } from '../types/desalination'

// ─── ECO-05 : Classification écosystème ──────────────────────────────────────

/**
 * Classifie le niveau d'impact de l'eau salée selon l'écosystème traversé.
 * - Réutilise desertZones.geojson pour détecter les zones désertiques (low)
 * - Si aucune intersection avec un désert → retourne 'neutral'
 * - Note : 'critical' est réservé pour cours d'eau/zones agricoles (déféré CONTEXT.md)
 */
export function classifyEcosystem(
  points: Coord[],
  desertFeatures: FeatureCollection,
): EcosystemImpactLevel {
  if (points.length < 2) return 'neutral'

  const line = lineString(points)

  for (const feature of desertFeatures.features) {
    if (booleanIntersects(line, feature)) {
      return 'low'
    }
  }

  return 'neutral'
}

// ─── DESAL-01 : Nombre de nœuds ───────────────────────────────────────────────

/**
 * Calcule le nombre de nœuds de dessalement solaires = floor(lengthKm / 500).
 * 1 nœud par tranche de 500 km (D-01 CONTEXT.md).
 */
export function calcDesalinationNodes(lengthKm: number): number {
  return Math.floor(lengthKm / 500)
}

// ─── DESAL-01+02 : Facteur solaire ────────────────────────────────────────────

/**
 * Heuristique latitude → facteur solaire.
 * Si TOUS les points ont abs(lat) < 35 → 1.0 (fort ensoleillement, zones tropicales)
 * Sinon → 0.7 (conservateur dès qu'un point sort des tropiques)
 * Coord = [lng, lat], index 1 = latitude.
 */
export function calcSolarFactor(points: Coord[]): number {
  const allTropical = points.every(([_lng, lat]) => Math.abs(lat) < 35)
  return allTropical ? 1.0 : 0.7
}

// ─── DESAL-02 : Production eau douce ─────────────────────────────────────────

/**
 * Calcule la production d'eau douce [min, max] m³/jour.
 * Base : 10 000 m³/jour par nœud × solarFactor, fourchette ±20% (UX-01).
 * Retourne [nodes × 10_000 × solarFactor × 0.8, nodes × 10_000 × solarFactor × 1.2]
 */
export function calcWaterProduction(
  nodes: number,
  solarFactor: number,
): Interval {
  if (nodes === 0) return [0, 0]
  const base = nodes * 10_000 * solarFactor
  return [base * 0.8, base * 1.2]
}

// ─── DESAL-03 : Valeur économique des sels ────────────────────────────────────

/**
 * Calcule la valeur économique des sels et minéraux [min, max] €/an.
 * Débit plancher = nodes × 10_000 × 0.8 m³/jour
 * Volume annuel = débit × 365 m³/an
 * Masse sel = volume × 35 kg/m³ (salinité océanique)
 * Prix NaCl marché : min = 0.05 €/kg, max = 0.15 €/kg
 */
export function calcSaltValue(
  nodes: number,
  solarFactor: number,
): Interval {
  if (nodes === 0) return [0, 0]
  const dailyFlowMin = nodes * 10_000 * solarFactor * 0.8  // m³/jour (débit plancher, cohérent avec calcWaterProduction)
  const annualVolume = dailyFlowMin * 365     // m³/an
  const saltMassKg = annualVolume * 35        // kg (35 kg/m³ = salinité océanique)
  return [saltMassKg * 0.05, saltMassKg * 0.15]  // €/an
}

// ─── DESAL-04 : Zones habitables ─────────────────────────────────────────────

/**
 * Calcule la superficie de zones habitables potentielles [min, max] km².
 * Base : 500 km² par nœud (rayon ~12.6 km), fourchette ±30% (UX-01).
 */
export function calcHabitableZones(nodes: number): Interval {
  if (nodes === 0) return [0, 0]
  const base = nodes * 500
  return [base * 0.7, base * 1.3]
}

// ─── DESAL-05 : Coût infrastructure ──────────────────────────────────────────

/**
 * Calcule le coût d'infrastructure dessalement [min, max] €.
 * Base : 50 M€ à 150 M€ par nœud (D-01 CONTEXT.md, fourchette locked).
 */
export function calcDesalinationCost(nodes: number): Interval {
  if (nodes === 0) return [0, 0]
  return [nodes * 50_000_000, nodes * 150_000_000]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/**
 * Calcule le résultat complet de l'analyse dessalement pour un canal.
 * Retourne null si moins de 2 points.
 * Utilise solarFactor fourni dans params (pre-calculé ou calculé en interne).
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
    saltValue: calcSaltValue(nodes, params.solarFactor),
    habitableZones: calcHabitableZones(nodes),
    desalinationCost: calcDesalinationCost(nodes),
    ecosystemImpact: classifyEcosystem(params.points, desertFeatures),
  }
}

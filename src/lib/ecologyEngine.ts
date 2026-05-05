// src/lib/ecologyEngine.ts
// Moteur d'analyse écologique Phase 5 — pur TypeScript, sans React, sans Zustand.
// Patterns vérifiés in-session dans RESEARCH.md — voir Pattern 1 et 2 pour l'algorithme complet.
import {
  booleanIntersects,
  lineIntersect,
  lineSlice,
  length,
  booleanPointInPolygon,
  point,
  lineString,
} from '@turf/turf'
import type { Feature, LineString, Polygon, FeatureCollection } from 'geojson'
import desertZones from '../data/desertZones.geojson'
import endorheicBasins from '../data/endorheicBasins.geojson'
import type { Canal } from '../types/canal'
import type { AridityClass, DesertIntersection, EndorheicAlert, EcologyResult } from '../types/ecology'
import type { Interval } from '../types/calculation'

// ─── Helpers internes ──────────────────────────────────────────────────────────

/** Sévérité : hyperarid > arid > semiarid */
function mergeAridityClass(
  current: AridityClass | null,
  incoming: string | undefined,
): AridityClass | null {
  if (!incoming) return current
  const ORDER: Record<string, number> = { hyperarid: 3, arid: 2, semiarid: 1 }
  const incomingClass = incoming as AridityClass
  if (!current) return incomingClass
  return (ORDER[incomingClass] ?? 0) > (ORDER[current] ?? 0) ? incomingClass : current
}

// ─── ECO-01 : Longueur canal dans un polygone désert (3 cas) ─────────────────

export function computeDesertLengthKm(
  canal: Feature<LineString>,
  desertPolygon: Feature<Polygon>,
): number {
  // Guard rapide — court-circuit si pas d'intersection (Pitfall P7)
  if (!booleanIntersects(canal, desertPolygon)) return 0

  const intersectionPts = lineIntersect(canal, desertPolygon)

  // Cas 1 : 0 point → canal entièrement à l'intérieur (Pitfall P2)
  if (intersectionPts.features.length === 0) {
    const startPt = point(canal.geometry.coordinates[0])
    if (booleanPointInPolygon(startPt, desertPolygon)) {
      return length(canal, { units: 'kilometers' })
    }
    return 0
  }

  // Cas 2 : ≥2 points → entrée et sortie (cas normal)
  if (intersectionPts.features.length >= 2) {
    const entry = intersectionPts.features[0]
    const exit = intersectionPts.features[intersectionPts.features.length - 1]
    try {
      const slice = lineSlice(entry, exit, canal)
      return length(slice, { units: 'kilometers' })
    } catch {
      return 0  // Pitfall P3 : lineSlice peut échouer si points identiques
    }
  }

  // Cas 3 : 1 point → canal entre/sort par un seul bord
  const coords = canal.geometry.coordinates
  const startPt = point(coords[0])
  const endPt = point(coords[coords.length - 1])
  const singleIntersect = intersectionPts.features[0]
  try {
    if (booleanPointInPolygon(startPt, desertPolygon)) {
      const slice = lineSlice(startPt, singleIntersect, canal)
      return length(slice, { units: 'kilometers' })
    } else {
      const slice = lineSlice(singleIntersect, endPt, canal)
      return length(slice, { units: 'kilometers' })
    }
  } catch (e) {
    console.warn('[ecologyEngine] lineSlice failed (1-intersection case):', e)
    return 0
  }
}

// ─── ECO-01 : Analyse complète des intersections désertiques ─────────────────

export function analyzeDesertIntersection(
  canal: Canal,
  desertFeatures: FeatureCollection,
): DesertIntersection | null {
  if (canal.points.length < 2) return null

  const canalLine = lineString(canal.points)  // Coord = [lng, lat] — conforme Turf

  let totalDesertKm = 0
  let maxAridityClass: AridityClass | null = null

  for (const feature of desertFeatures.features) {
    const km = computeDesertLengthKm(canalLine, feature as Feature<Polygon>)
    if (km > 0) {
      totalDesertKm += km
      maxAridityClass = mergeAridityClass(
        maxAridityClass,
        (feature.properties as { aridity?: string }).aridity,
      )
    }
  }

  if (totalDesertKm === 0 || !maxAridityClass) return null

  // D-02 : superficie = longueur × largeur d'influence (2km) ±10%
  const areaKm2: Interval = [totalDesertKm * 2 * 0.9, totalDesertKm * 2 * 1.1]

  return { totalDesertKm, aridityClass: maxAridityClass, areaKm2 }
}

// ─── ECO-02 : Timeline de verdissement (D-03 locked) ─────────────────────────

export function computeGreeningTimeline(
  aridityClass: AridityClass | null,
): Interval | null {
  switch (aridityClass) {
    case 'hyperarid': return [50, 100]  // BWh/BWk — Sahara, Atacama, Namib
    case 'arid':      return [20, 50]   // BSh/BSk — Sahel, steppes
    case 'semiarid':  return [5, 20]    // semi-arides — Thar, Negev
    default:          return null
  }
}

// ─── ECO-03 : Détection bassin endorheïque (D-04) ─────────────────────────────

export function detectEndorheicBasin(
  canal: Canal,
  basinFeatures: FeatureCollection,
): EndorheicAlert {
  if (canal.points.length < 1) return { detected: false }

  // Dernier point du canal — coordonnées [lng, lat] (Pitfall P4)
  const lastCoord = canal.points[canal.points.length - 1]
  const lastPt = point(lastCoord)

  for (const feature of basinFeatures.features) {
    if (booleanPointInPolygon(lastPt, feature as Feature<Polygon>)) {
      const props = feature.properties as { name?: string; examples?: string }
      return {
        detected: true,
        basinName: props.name,
        examples: props.examples,
      }
    }
  }

  return { detected: false }
}

// ─── ECO-04 : Flag risque climatique (D-05) ───────────────────────────────────

export function detectClimateRisk(
  canal: Canal,
  hasDesertIntersection: boolean,
): boolean {
  if (!hasDesertIntersection) return false
  // Coord = [lng, lat] → index 1 = latitude
  return canal.points.some(([_lng, lat]) => Math.abs(lat) <= 35)
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

export function computeEcologyAnalysis(canal: Canal): EcologyResult | null {
  if (canal.points.length < 2) return null

  const desertIntersection = analyzeDesertIntersection(canal, desertZones as unknown as FeatureCollection)
  const greeningTimeline = computeGreeningTimeline(desertIntersection?.aridityClass ?? null)
  const endorheicAlert = detectEndorheicBasin(canal, endorheicBasins as unknown as FeatureCollection)
  const climateRiskFlag = detectClimateRisk(canal, desertIntersection !== null)

  return { desertIntersection, greeningTimeline, endorheicAlert, climateRiskFlag }
}

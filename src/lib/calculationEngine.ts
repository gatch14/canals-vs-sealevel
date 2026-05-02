// src/lib/calculationEngine.ts
// Moteur de calcul scientifique Phase 4 — pur TypeScript, sans React, sans Zustand.
// UX-01 strict : toutes les fonctions numériques retournent Interval (jamais number nu).
// Wave 1 (T02) : implémentation complète — tous les tests GREEN.
import { length, along, lineString } from '@turf/turf'
import type { Canal, Coord } from '../types/canal'
import type { ElevationProfile, ElevationPoint } from '../types/elevation'
import type {
  Interval,
  TerrainType,
  TerrainBreakdown,
  CalculationResult,
  PartialImpactResult,
} from '../types/calculation'
import {
  OCEAN_AREA_DIVISOR,
  IPCC_ANNUAL_RATE_MM,
  TERRAIN_THRESHOLDS,
  COST_PER_KM,
  TOLERANCE,
} from '../types/calculation'

// ─── Arithmétique d'intervalles (helpers internes — exportés pour testabilité) ─

export function mulIntervals(a: Interval, b: Interval): Interval {
  // Hypothèse : tous nos intervalles sont positifs (longueurs, dimensions, volumes)
  // Pour intervalles positifs strictement : [aMin*bMin, aMax*bMax]
  return [a[0] * b[0], a[1] * b[1]]
}

export function addIntervals(a: Interval, b: Interval): Interval {
  return [a[0] + b[0], a[1] + b[1]]
}

export function divByConst(a: Interval, k: number): Interval {
  // k > 0 attendu (361.8, 4.5...) — pas de protection contre k négatif (hors scope)
  return [a[0] / k, a[1] / k]
}

// ─── Dimensions avec tolérances d'ingénierie (Pattern 7) ─────────────────────

export function widthInterval(widthM: number): Interval {
  return [widthM * (1 - TOLERANCE.width), widthM * (1 + TOLERANCE.width)]
}

export function depthInterval(depthM: number): Interval {
  return [depthM * (1 - TOLERANCE.depth), depthM * (1 + TOLERANCE.depth)]
}

// ─── CALC-01 : Longueur géodésique avec ±1% ──────────────────────────────────

export function computeLengthInterval(points: Coord[]): Interval {
  if (points.length < 2) return [0, 0]
  const line = lineString(points)
  const km = length(line, { units: 'kilometers' })
  return [km * (1 - TOLERANCE.length), km * (1 + TOLERANCE.length)]
}

// ─── CALC-01 : Volume km³ propagé en intervalle ──────────────────────────────

export function computeVolume(
  lengthKm: Interval,
  widthM: Interval,
  depthM: Interval,
): Interval {
  // Convertir longueur km → m, puis V = L × W × D, enfin / 1e9 pour km³
  const lengthM: Interval = [lengthKm[0] * 1000, lengthKm[1] * 1000]
  const volM3 = mulIntervals(mulIntervals(lengthM, widthM), depthM)
  return [volM3[0] / 1e9, volM3[1] / 1e9]
}

// ─── CALC-02 : ΔSL (formule centrale non-négociable) ─────────────────────────

export function computeDeltaSL(volumeKm3: Interval): Interval {
  return divByConst(volumeKm3, OCEAN_AREA_DIVISOR)
}

// ─── CALC-03 : Classification terrain depuis profil élévation ────────────────

export function classifyTerrain(points: ElevationPoint[]): TerrainBreakdown {
  const breakdown: TerrainBreakdown = { plain: 0, mixed: 0, mountain: 0, totalKm: 0 }
  if (points.length < 2) return breakdown

  for (let i = 1; i < points.length; i++) {
    const dDist = points[i].distance - points[i - 1].distance
    if (dDist <= 0) continue  // segment dégénéré, on saute

    const dAlt  = Math.abs(points[i].altitude - points[i - 1].altitude)
    const slopeMperKm = dAlt / dDist

    const type: TerrainType =
      slopeMperKm < TERRAIN_THRESHOLDS.plain ? 'plain' :
      slopeMperKm < TERRAIN_THRESHOLDS.mixed ? 'mixed' :
      'mountain'

    breakdown[type]   += dDist
    breakdown.totalKm += dDist
  }
  return breakdown
}

// ─── CALC-03 : Coût total en M€ ──────────────────────────────────────────────

export function computeCost(breakdown: TerrainBreakdown): Interval {
  let costMin = 0
  let costMax = 0
  for (const type of ['plain', 'mixed', 'mountain'] as TerrainType[]) {
    const segKm = breakdown[type]
    costMin += segKm * COST_PER_KM[type][0]
    costMax += segKm * COST_PER_KM[type][1]
  }
  return [costMin, costMax]
}

// ─── CALC-04 : Pourcentage IPCC ──────────────────────────────────────────────

export function computeIPCCPercent(deltaSLmm: Interval): Interval {
  return [
    (deltaSLmm[0] / IPCC_ANNUAL_RATE_MM) * 100,
    (deltaSLmm[1] / IPCC_ANNUAL_RATE_MM) * 100,
  ]
}

// ─── CALC-01 à CALC-04 : Orchestrateur ───────────────────────────────────────

export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null {
  // Garde-fous (Pitfall 5 : éviter division par zéro / NaN)
  if (!profile) return null
  if (widthM <= 0 || depthM <= 0) return null
  if (!Number.isFinite(widthM) || !Number.isFinite(depthM)) return null
  if (canal.points.length < 2) return null

  const lengthKm = computeLengthInterval(canal.points)
  const widthIv  = widthInterval(widthM)
  const depthIv  = depthInterval(depthM)
  const volumeKm3 = computeVolume(lengthKm, widthIv, depthIv)
  const deltaSLmm = computeDeltaSL(volumeKm3)
  const ipccPercent = computeIPCCPercent(deltaSLmm)
  const terrainBreakdown = classifyTerrain(profile.points)
  const costMEur = computeCost(terrainBreakdown)

  return {
    lengthKm,
    volumeKm3,
    deltaSLmm,
    costMEur,
    ipccPercent,
    terrainBreakdown,
  }
}

// ─── CALC-05 : Impact partiel — canal stoppé au premier obstacle ─────────────

/** Helper interne : clippe les points du profil à reachableKm pour Pitfall 4 */
function clipProfileToKm(points: ElevationPoint[], maxKm: number): ElevationPoint[] {
  const clipped: ElevationPoint[] = []
  for (const p of points) {
    if (p.distance <= maxKm) {
      clipped.push(p)
    } else {
      // Interpolation simple sur le dernier segment chevauché
      if (clipped.length > 0) {
        const last = clipped[clipped.length - 1]
        if (last.distance < maxKm) {
          const t = (maxKm - last.distance) / (p.distance - last.distance)
          clipped.push({
            distance: maxKm,
            altitude: last.altitude + t * (p.altitude - last.altitude),
          })
        }
      }
      break
    }
  }
  return clipped
}

export function computePartialImpact(
  canal: Canal,
  profile: ElevationProfile,
  widthM: number,
  depthM: number,
): PartialImpactResult | null {
  // Conditions de non-déclenchement
  if (profile.isFullyGravity) return null
  if (profile.uphillSegments.length === 0) return null
  if (widthM <= 0 || depthM <= 0) return null
  if (canal.points.length < 2) return null

  const reachableKm = profile.uphillSegments[0].distanceStart
  if (reachableKm <= 0) return null

  // stopCoord via Turf along (Pattern 5 RESEARCH.md)
  const line = lineString(canal.points)
  const stopPoint = along(line, reachableKm, { units: 'kilometers' })
  const stopCoord = stopPoint.geometry.coordinates as Coord

  // Longueur partielle avec tolérance ±2%
  const lengthKm: Interval = [
    reachableKm * (1 - TOLERANCE.partialLength),
    reachableKm * (1 + TOLERANCE.partialLength),
  ]

  // Volume + ΔSL partiels (propagation Interval)
  const widthIv = widthInterval(widthM)
  const depthIv = depthInterval(depthM)
  const volumeKm3 = computeVolume(lengthKm, widthIv, depthIv)
  const deltaSLmm = computeDeltaSL(volumeKm3)

  // Coût partiel : clipper le profil aux X premiers km AVANT classifyTerrain (Pitfall 4)
  const partialPoints = clipProfileToKm(profile.points, reachableKm)
  const partialBreakdown = classifyTerrain(partialPoints)
  const costMEur = computeCost(partialBreakdown)

  // % du tracé total réalisable
  const totalKm = length(line, { units: 'kilometers' })
  const percentOfFull = totalKm > 0 ? (reachableKm / totalKm) * 100 : 0

  return {
    reachableKm,
    stopCoord,
    lengthKm,
    volumeKm3,
    deltaSLmm,
    costMEur,
    percentOfFull,
  }
}

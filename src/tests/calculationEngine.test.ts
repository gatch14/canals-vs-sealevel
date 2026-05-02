// src/tests/calculationEngine.test.ts
// Tests Wave 0 — RED. Les stubs retournent [0,0] ou null, donc tous les tests échouent.
// T02 (Wave 1) implémente les fonctions et fait passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  computeLengthInterval,
  computeVolume,
  computeDeltaSL,
  classifyTerrain,
  computeCost,
  computeIPCCPercent,
  computePartialImpact,
  computeCalculation,
  widthInterval,
  depthInterval,
} from '../lib/calculationEngine'
import type { Coord } from '../types/canal'
import type { ElevationProfile } from '../types/elevation'
import type { Canal } from '../types/canal'
import { OCEAN_AREA_DIVISOR } from '../types/calculation'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockPoints: Coord[] = [
  [2.35, 48.85],   // Paris
  [3.0,  48.0],
  [4.5,  47.0],
  [5.0,  46.0],    // ~250 km canal très approximatif
]

function makeProfile(opts: {
  totalKm: number
  uphills?: Array<{ distanceStart: number; distanceEnd: number; altitudeGain: number }>
  pointsByKm?: Array<{ distance: number; altitude: number }>
}): ElevationProfile {
  return {
    points: opts.pointsByKm ?? [
      { distance: 0,            altitude: 0 },
      { distance: opts.totalKm, altitude: 0 },
    ],
    uphillSegments: opts.uphills ?? [],
    totalUphillGain: (opts.uphills ?? []).reduce((s, u) => s + u.altitudeGain, 0),
    isFullyGravity: (opts.uphills ?? []).length === 0,
    fetchedAt: Date.now(),
  }
}

function makeCanal(points: Coord[]): Canal {
  return {
    id: 'test-canal',
    points,
    name: 'Test Canal',
    createdAt: Date.now(),
  }
}

// ─── CALC-01 : Volume depuis dimensions ──────────────────────────────────────

describe('calculationEngine — CALC-01 (volume)', () => {
  it('computeLengthInterval retourne ±1% autour de turf.length()', () => {
    const interval = computeLengthInterval(mockPoints)
    // Sanity: min < max, max-min ~ 2% du milieu
    expect(interval[0]).toBeGreaterThan(0)
    expect(interval[1]).toBeGreaterThan(interval[0])
    const mid = (interval[0] + interval[1]) / 2
    const spread = interval[1] - interval[0]
    expect(spread / mid).toBeCloseTo(0.02, 2)  // ±1% chaque côté = 2% spread
  })

  it('computeVolume([100,101] km, [47.5,52.5] m, [4.5,5.5] m) propage l intervalle', () => {
    // V_min = 100km × 47.5m × 4.5m = 100000 × 47.5 × 4.5 = 21 375 000 m³ = 0.021375 km³
    // V_max = 101km × 52.5m × 5.5m = 101000 × 52.5 × 5.5 = 29 163 750 m³ = 0.0291637 km³
    const result = computeVolume([100, 101], [47.5, 52.5], [4.5, 5.5])
    expect(result[0]).toBeCloseTo(0.021375, 5)
    expect(result[1]).toBeCloseTo(0.0291637, 4)
  })

  it('widthInterval(50) retourne [47.5, 52.5] (±5%)', () => {
    const w = widthInterval(50)
    expect(w[0]).toBeCloseTo(47.5, 4)
    expect(w[1]).toBeCloseTo(52.5, 4)
  })

  it('depthInterval(5) retourne [4.5, 5.5] (±10%)', () => {
    const d = depthInterval(5)
    expect(d[0]).toBeCloseTo(4.5, 4)
    expect(d[1]).toBeCloseTo(5.5, 4)
  })
})

// ─── CALC-02 : ΔSL = Volume / 361.8 ──────────────────────────────────────────

describe('calculationEngine — CALC-02 (ΔSL formule centrale)', () => {
  it('computeDeltaSL([0.016, 0.036] km³) = volume/361.8 mm', () => {
    const result = computeDeltaSL([0.016, 0.036])
    expect(result[0]).toBeCloseTo(0.016 / OCEAN_AREA_DIVISOR, 8)
    expect(result[1]).toBeCloseTo(0.036 / OCEAN_AREA_DIVISOR, 8)
  })

  it('computeDeltaSL Qattara 1000 km³ → ~2.76 mm (ancre du projet)', () => {
    const result = computeDeltaSL([1000, 1000])
    expect(result[0]).toBeCloseTo(2.764, 2)
    expect(result[1]).toBeCloseTo(2.764, 2)
  })
})

// ─── CALC-03 : Classification terrain + coût ─────────────────────────────────

describe('calculationEngine — CALC-03 (terrain + coût)', () => {
  it('classifyTerrain — 100% plaine (pente 0)', () => {
    const profile = makeProfile({
      totalKm: 100,
      pointsByKm: Array.from({ length: 11 }, (_, i) => ({ distance: i * 10, altitude: 0 })),
    })
    const breakdown = classifyTerrain(profile.points)
    expect(breakdown.plain).toBeCloseTo(100, 0)
    expect(breakdown.mixed).toBeCloseTo(0, 0)
    expect(breakdown.mountain).toBeCloseTo(0, 0)
    expect(breakdown.totalKm).toBeCloseTo(100, 0)
  })

  it('classifyTerrain — segment montagne (>200 m/km)', () => {
    // 10 km plats puis 10 km à +3000m (300 m/km → montagne)
    const profile = makeProfile({
      totalKm: 20,
      pointsByKm: [
        { distance: 0,  altitude: 0 },
        { distance: 10, altitude: 0 },
        { distance: 20, altitude: 3000 },
      ],
    })
    const breakdown = classifyTerrain(profile.points)
    expect(breakdown.plain).toBeCloseTo(10, 0)
    expect(breakdown.mountain).toBeCloseTo(10, 0)
  })

  it('computeCost — breakdown 100km plaine retourne [100, 500] M€', () => {
    const breakdown = { plain: 100, mixed: 0, mountain: 0, totalKm: 100 }
    const cost = computeCost(breakdown)
    expect(cost[0]).toBeCloseTo(100, 0)   // 100 × 1 M€/km min
    expect(cost[1]).toBeCloseTo(500, 0)   // 100 × 5 M€/km max
  })

  it('computeCost — max >= min toujours (UX-01 monotone)', () => {
    const breakdown = { plain: 30, mixed: 50, mountain: 20, totalKm: 100 }
    const cost = computeCost(breakdown)
    expect(cost[1]).toBeGreaterThanOrEqual(cost[0])
  })
})

// ─── CALC-04 : Pourcentage IPCC ──────────────────────────────────────────────

describe('calculationEngine — CALC-04 (IPCC %)', () => {
  it('computeIPCCPercent([0.001, 0.002]) → [0.0222%, 0.0444%] approx', () => {
    const result = computeIPCCPercent([0.001, 0.002])
    expect(result[0]).toBeCloseTo((0.001 / 4.5) * 100, 4)
    expect(result[1]).toBeCloseTo((0.002 / 4.5) * 100, 4)
  })

  it('computeIPCCPercent([4.5, 4.5]) = [100, 100]%', () => {
    const result = computeIPCCPercent([4.5, 4.5])
    expect(result[0]).toBeCloseTo(100, 4)
    expect(result[1]).toBeCloseTo(100, 4)
  })
})

// ─── CALC-05 : Impact partiel ────────────────────────────────────────────────

describe('calculationEngine — CALC-05 (impact partiel)', () => {
  it('computePartialImpact retourne null si isFullyGravity', () => {
    const profile = makeProfile({ totalKm: 100 })
    expect(profile.isFullyGravity).toBe(true)
    const result = computePartialImpact(makeCanal(mockPoints), profile, 50, 5)
    expect(result).toBeNull()
  })

  it('computePartialImpact retourne null si uphillSegments vide', () => {
    const profile = makeProfile({ totalKm: 100, uphills: [] })
    const result = computePartialImpact(makeCanal(mockPoints), profile, 50, 5)
    expect(result).toBeNull()
  })

  it('computePartialImpact avec obstacle au km 47 retourne reachableKm=47 + stopCoord défini', () => {
    const profile = makeProfile({
      totalKm: 100,
      uphills: [{ distanceStart: 47, distanceEnd: 55, altitudeGain: 200 }],
    })
    const result = computePartialImpact(makeCanal(mockPoints), profile, 50, 5)
    expect(result).not.toBeNull()
    expect(result!.reachableKm).toBeCloseTo(47, 4)
    expect(result!.stopCoord).toHaveLength(2)
    expect(typeof result!.stopCoord[0]).toBe('number')
    expect(typeof result!.stopCoord[1]).toBe('number')
    expect(result!.percentOfFull).toBeGreaterThan(0)
    expect(result!.percentOfFull).toBeLessThan(100)
    // Volume partiel doit être positif et un Interval valide
    expect(result!.volumeKm3[0]).toBeGreaterThan(0)
    expect(result!.volumeKm3[1]).toBeGreaterThan(result!.volumeKm3[0])
  })
})

// ─── CALC-01 à CALC-04 orchestrés via computeCalculation ─────────────────────

describe('calculationEngine — orchestrateur computeCalculation', () => {
  it('retourne null si profile manquant', () => {
    const result = computeCalculation(makeCanal(mockPoints), null, 50, 5)
    expect(result).toBeNull()
  })

  it('retourne null si width <= 0', () => {
    const profile = makeProfile({ totalKm: 100 })
    const result = computeCalculation(makeCanal(mockPoints), profile, 0, 5)
    expect(result).toBeNull()
  })

  it('retourne null si depth <= 0', () => {
    const profile = makeProfile({ totalKm: 100 })
    const result = computeCalculation(makeCanal(mockPoints), profile, 50, 0)
    expect(result).toBeNull()
  })

  it('retourne CalculationResult complet pour canal valide', () => {
    const profile = makeProfile({ totalKm: 100 })
    const result = computeCalculation(makeCanal(mockPoints), profile, 50, 5)
    expect(result).not.toBeNull()
    expect(result!.lengthKm[0]).toBeGreaterThan(0)
    expect(result!.lengthKm[1]).toBeGreaterThan(result!.lengthKm[0])
    expect(result!.volumeKm3[1]).toBeGreaterThan(result!.volumeKm3[0])
    expect(result!.deltaSLmm[1]).toBeGreaterThan(result!.deltaSLmm[0])
    expect(result!.costMEur[1]).toBeGreaterThanOrEqual(result!.costMEur[0])
    expect(result!.ipccPercent[1]).toBeGreaterThan(result!.ipccPercent[0])
    expect(result!.terrainBreakdown.totalKm).toBeGreaterThan(0)
  })
})

// ─── UX-01 : tous les retours numériques sont des Interval ───────────────────

describe('calculationEngine — UX-01 (Interval partout)', () => {
  it('toutes les fonctions de calcul retournent des tuples [number, number]', () => {
    // Vérification structurelle : chaque retour est un Array de 2 numbers
    const checks: Array<unknown> = [
      computeLengthInterval(mockPoints),
      computeVolume([100, 101], [47.5, 52.5], [4.5, 5.5]),
      computeDeltaSL([1, 2]),
      computeCost({ plain: 10, mixed: 5, mountain: 1, totalKm: 16 }),
      computeIPCCPercent([0.001, 0.002]),
      widthInterval(50),
      depthInterval(5),
    ]
    for (const c of checks) {
      expect(Array.isArray(c)).toBe(true)
      expect((c as unknown[]).length).toBe(2)
      expect(typeof (c as number[])[0]).toBe('number')
      expect(typeof (c as number[])[1]).toBe('number')
    }
  })
})

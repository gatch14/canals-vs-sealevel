// src/tests/ecologyEngine.test.ts
// Wave 0 — tous les tests doivent ÉCHOUER (RED state).
// T02 les fera passer (GREEN).
import { describe, it, expect } from 'vitest'
import { polygon } from '@turf/turf'
import {
  computeGreeningTimeline,
  detectEndorheicBasin,
  detectClimateRisk,
  analyzeDesertIntersection,
} from '../lib/ecologyEngine'
import type { Canal } from '../types/canal'
import type { Coord } from '../types/canal'

// ─── Fixtures GeoJSON inline (indépendantes des vrais fichiers src/data/) ──────

const MOCK_DESERT_HYPERARID = polygon(
  [[[-10, 15], [40, 15], [40, 30], [-10, 30], [-10, 15]]],
  { name: 'Mock Sahara', aridity: 'hyperarid', koppen: 'BWh' }
)

const MOCK_DESERT_ARID = polygon(
  [[[10, 10], [20, 10], [20, 20], [10, 20], [10, 10]]],
  { name: 'Mock Sahel', aridity: 'arid', koppen: 'BSh' }
)

const MOCK_ENDORHEIC = polygon(
  [[[49, 36], [54, 36], [54, 47], [49, 47], [49, 36]]],
  { name: 'Mer Caspienne', examples: "Mer d'Aral, Salton Sea" }
)

// ─── Canaux de test ───────────────────────────────────────────────────────────

// Canal traversant le désert (de [-15,22] à [50,22])
const CANAL_CROSSING: Canal = {
  id: 'c1', name: 'Canal traversant', createdAt: 0,
  points: [[-15, 22], [50, 22]] as Coord[],
}

// Canal entièrement dans le désert
const CANAL_INSIDE: Canal = {
  id: 'c2', name: 'Canal dans désert', createdAt: 0,
  points: [[0, 20], [20, 22]] as Coord[],
}

// Canal hors désert (latitudes nordiques)
const CANAL_OUTSIDE: Canal = {
  id: 'c3', name: 'Canal hors désert', createdAt: 0,
  points: [[50, 55], [60, 55]] as Coord[],
}

// Canal terminant dans bassin endorheïque (Caspienne)
const CANAL_ENDORHEIC: Canal = {
  id: 'c4', name: 'Canal endorheïque', createdAt: 0,
  points: [[10, 40], [51, 43]] as Coord[],
}

// Canal dans désert tropical (lat ≤35°) → risque climatique
const CANAL_CLIMATE_RISK: Canal = {
  id: 'c5', name: 'Canal risque climatique', createdAt: 0,
  points: [[-15, 22], [50, 22]] as Coord[],
}

// Canal dans désert polaire (lat >35°) → pas de risque climatique
const CANAL_NO_CLIMATE_RISK: Canal = {
  id: 'c6', name: 'Canal pas risque', createdAt: 0,
  points: [[80, 42], [100, 45]] as Coord[],
}

const MOCK_DESERT_FC = {
  type: 'FeatureCollection' as const,
  features: [MOCK_DESERT_HYPERARID, MOCK_DESERT_ARID],
}

const MOCK_ENDORHEIC_FC = {
  type: 'FeatureCollection' as const,
  features: [MOCK_ENDORHEIC],
}

// ─── Tests ECO-01 ─────────────────────────────────────────────────────────────

describe('analyzeDesertIntersection (ECO-01)', () => {
  it('retourne non-null quand le canal traverse un désert', () => {
    const result = analyzeDesertIntersection(CANAL_CROSSING, MOCK_DESERT_FC)
    expect(result).not.toBeNull()
    expect(result!.totalDesertKm).toBeGreaterThan(0)
  })

  it('retourne null si le canal ne traverse aucun désert', () => {
    const result = analyzeDesertIntersection(CANAL_OUTSIDE, MOCK_DESERT_FC)
    expect(result).toBeNull()
  })

  it('totalDesertKm > 0 pour canal entièrement dans un désert', () => {
    const result = analyzeDesertIntersection(CANAL_INSIDE, MOCK_DESERT_FC)
    expect(result).not.toBeNull()
    expect(result!.totalDesertKm).toBeGreaterThan(0)
  })

  it('areaKm2 = [totalDesertKm*2*0.9, totalDesertKm*2*1.1] (±10% D-02)', () => {
    const result = analyzeDesertIntersection(CANAL_CROSSING, MOCK_DESERT_FC)
    expect(result).not.toBeNull()
    const km = result!.totalDesertKm
    expect(result!.areaKm2[0]).toBeCloseTo(km * 2 * 0.9, 0)
    expect(result!.areaKm2[1]).toBeCloseTo(km * 2 * 1.1, 0)
  })
})

// ─── Tests ECO-02 ─────────────────────────────────────────────────────────────

describe('computeGreeningTimeline (ECO-02)', () => {
  it('hyperarid → [50, 100] ans', () => {
    expect(computeGreeningTimeline('hyperarid')).toEqual([50, 100])
  })

  it('arid → [20, 50] ans', () => {
    expect(computeGreeningTimeline('arid')).toEqual([20, 50])
  })

  it('null si aucun désert traversé', () => {
    expect(computeGreeningTimeline(null)).toBeNull()
  })
})

// ─── Tests ECO-03 ─────────────────────────────────────────────────────────────

describe('detectEndorheicBasin (ECO-03)', () => {
  it('détecte bassin endorheïque si endpoint dans polygone', () => {
    const result = detectEndorheicBasin(CANAL_ENDORHEIC, MOCK_ENDORHEIC_FC)
    expect(result.detected).toBe(true)
    expect(result.basinName).toBe('Mer Caspienne')
  })

  it("pas d'alerte si endpoint hors bassin", () => {
    const result = detectEndorheicBasin(CANAL_OUTSIDE, MOCK_ENDORHEIC_FC)
    expect(result.detected).toBe(false)
  })
})

// ─── Tests ECO-04 ─────────────────────────────────────────────────────────────

describe('detectClimateRisk (ECO-04)', () => {
  it('flag true si désert traversé ET latitude ≤35°', () => {
    expect(detectClimateRisk(CANAL_CLIMATE_RISK, true)).toBe(true)
  })

  it('flag false si désert traversé ET latitude >35° (tous les points)', () => {
    expect(detectClimateRisk(CANAL_NO_CLIMATE_RISK, true)).toBe(false)
  })
})

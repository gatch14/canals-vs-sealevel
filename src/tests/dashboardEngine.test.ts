// src/tests/dashboardEngine.test.ts
// Wave 0 — tous les tests doivent ÉCHOUER (RED state).
// T02 les fera passer (GREEN).
import { describe, it, expect } from 'vitest'
import {
  computeCumulativeDeltaSL,
  computeScenarios,
  computeCumulativeCost,
  computeDashboardResult,
} from '../lib/dashboardEngine'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'
import { IPCC_2100_RANGE_MM } from '../types/dashboard'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CALC_PARAMS: CalcParams = { width: 50, depth: 5 }

// Canal avec profil d'élévation simulé (points France → Espagne ~700km)
const CANAL_WITH_PROFILE: Canal = {
  id: 'c1',
  name: 'Canal test avec profil',
  createdAt: 0,
  points: [[-1.5, 47.2], [2.3, 48.8], [8.0, 45.0]],
  elevation: {
    points: [
      { distance: 0, altitude: 50 },
      { distance: 350, altitude: 120 },
      { distance: 700, altitude: 80 },
    ],
    uphillSegments: [],
    totalUphillGain: 0,
    isFullyGravity: true,
    fetchedAt: Date.now(),
  },
}

// Canal sans profil d'élévation
const CANAL_NO_PROFILE: Canal = {
  id: 'c2',
  name: 'Canal sans profil',
  createdAt: 0,
  points: [[0, 0], [10, 0]],
}

// Canal avec < 2 points
const CANAL_INVALID: Canal = {
  id: 'c3',
  name: 'Canal invalide',
  createdAt: 0,
  points: [[0, 0]],
}

const EMPTY_CANALS: Canal[] = []
const CANALS_WITH_ONE_PROFILE: Canal[] = [CANAL_WITH_PROFILE, CANAL_NO_PROFILE]

// ─── Tests IPCC_2100_RANGE_MM ─────────────────────────────────────────────────

describe('IPCC_2100_RANGE_MM (constante GLOB-03)', () => {
  it('vaut [300, 1000]', () => {
    expect(IPCC_2100_RANGE_MM).toEqual([300, 1000])
  })

  it('est un Interval (tuple de 2 nombres)', () => {
    expect(IPCC_2100_RANGE_MM).toHaveLength(2)
    expect(typeof IPCC_2100_RANGE_MM[0]).toBe('number')
    expect(typeof IPCC_2100_RANGE_MM[1]).toBe('number')
  })
})

// ─── Tests GLOB-01 computeCumulativeDeltaSL ───────────────────────────────────

describe('computeCumulativeDeltaSL (GLOB-01)', () => {
  it('retourne [0, 0] pour liste vide', () => {
    const result = computeCumulativeDeltaSL(EMPTY_CANALS, CALC_PARAMS)
    expect(result).toEqual([0, 0])
  })

  it('retourne Interval > [0,0] quand au moins un canal a un profil', () => {
    const result = computeCumulativeDeltaSL(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it("ignore les canaux sans profil d'élévation", () => {
    const withProfile = computeCumulativeDeltaSL([CANAL_WITH_PROFILE], CALC_PARAMS)
    const withProfileAndExtra = computeCumulativeDeltaSL(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    // Canal sans profil ne doit pas changer le résultat
    expect(withProfile).toEqual(withProfileAndExtra)
  })
})

// ─── Tests GLOB-02 computeScenarios ──────────────────────────────────────────

describe('computeScenarios (GLOB-02)', () => {
  it('optimiste = cumulativeDeltaSL × 1.0 (identique)', () => {
    const base: [number, number] = [0.5, 0.6]
    const { optimistic } = computeScenarios(base)
    expect(optimistic.deltaSLmm[0]).toBeCloseTo(0.5, 5)
    expect(optimistic.deltaSLmm[1]).toBeCloseTo(0.6, 5)
  })

  it('réaliste = cumulativeDeltaSL × 0.6', () => {
    const base: [number, number] = [0.5, 0.6]
    const { realistic } = computeScenarios(base)
    expect(realistic.deltaSLmm[0]).toBeCloseTo(0.3, 5)
    expect(realistic.deltaSLmm[1]).toBeCloseTo(0.36, 5)
  })

  it('pessimiste = cumulativeDeltaSL × 0.3', () => {
    const base: [number, number] = [0.5, 0.6]
    const { pessimistic } = computeScenarios(base)
    expect(pessimistic.deltaSLmm[0]).toBeCloseTo(0.15, 5)
    expect(pessimistic.deltaSLmm[1]).toBeCloseTo(0.18, 5)
  })
})

// ─── Tests GLOB-03 computeDashboardResult ────────────────────────────────────

describe('computeDashboardResult (GLOB-03)', () => {
  it('retourne null pour liste vide', () => {
    expect(computeDashboardResult(EMPTY_CANALS, CALC_PARAMS)).toBeNull()
  })

  it('retourne DashboardResult non-null pour un canal avec profil', () => {
    const result = computeDashboardResult([CANAL_WITH_PROFILE], CALC_PARAMS)
    expect(result).not.toBeNull()
  })

  it('DashboardResult.totalCanals = nombre de canaux passés', () => {
    const result = computeDashboardResult(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    expect(result?.totalCanals).toBe(2)
  })

  it('DashboardResult.canalsWithProfile = nombre de canaux avec elevation', () => {
    const result = computeDashboardResult(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    expect(result?.canalsWithProfile).toBe(1)
  })
})

// ─── Unused variable suppression ─────────────────────────────────────────────
void CANAL_INVALID

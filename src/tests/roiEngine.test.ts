// src/tests/roiEngine.test.ts
// Wave 0 — Tests RED. Les stubs retournent [0,0], null, [Infinity,Infinity] ou [].
// T02 (Wave 1) implémente les fonctions pour faire passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  calcTotalAnnualValue,
  calcTotalCost,
  calcBreakEven,
  calcCumulativeRoi,
  computeRoiAnalysis,
  calcAllCanalsRoi,
  WATER_PRICE_MIN,
  WATER_PRICE_MAX,
} from '../lib/roiEngine'
import type { RoiParams } from '../types/roi'
import type { Canal } from '../types/canal'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const ZERO_PARAMS: RoiParams = {
  costMEur: [0, 0],
  desalinationCostEur: [0, 0],
  waterProductionM3PerDay: [0, 0],
  saltValueEurPerYear: [0, 0],
  spirulineValueEurPerYear: [0, 0],
  aquacultureValueEurPerYear: [0, 0],
  mineralsValueEurPerYear: [0, 0],
}

const REALISTIC_PARAMS: RoiParams = {
  costMEur: [1500, 7500],
  desalinationCostEur: [150_000_000, 450_000_000],
  waterProductionM3PerDay: [24_000, 36_000],
  saltValueEurPerYear: [50_000, 150_000],
  spirulineValueEurPerYear: [200_000, 800_000],
  aquacultureValueEurPerYear: [100_000, 600_000],
  mineralsValueEurPerYear: [80_000, 240_000],
}

const canalWithElevation: Canal = {
  id: 'canal-roi-test-1',
  name: 'Canal ROI Test',
  createdAt: 1_700_000_000_000,
  points: [
    [-5.0, 30.0],
    [10.0, 25.0],
  ],
  elevation: {
    points: [
      { distance: 0, altitude: 10 },
      { distance: 750, altitude: 5 },
      { distance: 1500, altitude: 0 },
    ],
    uphillSegments: [],
    totalUphillGain: 0,
    isFullyGravity: true,
    fetchedAt: 1_700_000_000_000,
  },
}

const canalWithoutElevation: Canal = {
  id: 'canal-roi-test-2',
  name: 'Canal sans élévation',
  createdAt: 1_700_000_001_000,
  points: [
    [2.0, 48.0],
    [5.0, 44.0],
  ],
}

const calcParamsDefault = { width: 50, depth: 5 }
const desertFeaturesMock = { type: 'FeatureCollection' as const, features: [] }

// ─── 1. calcTotalAnnualValue ──────────────────────────────────────────────────

describe('calcTotalAnnualValue', () => {
  it('retourne [0,0] pour ZERO_PARAMS', () => {
    expect(calcTotalAnnualValue(ZERO_PARAMS)).toEqual([0, 0])
  })

  it('retourne min > 0 pour REALISTIC_PARAMS', () => {
    const result = calcTotalAnnualValue(REALISTIC_PARAMS)
    expect(result[0]).toBeGreaterThan(0)
  })

  it('retourne max > min pour REALISTIC_PARAMS (fourchette cohérente)', () => {
    const result = calcTotalAnnualValue(REALISTIC_PARAMS)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('inclut la valeur eau (waterProductionM3PerDay × WATER_PRICE × 365 / 1e6)', () => {
    // Eau seule : 24_000 m³/j × 0.5 €/m³ × 365 j / 1e6 = 4.38 M€/an minimum
    const waterOnlyParams: RoiParams = {
      ...ZERO_PARAMS,
      waterProductionM3PerDay: [24_000, 36_000],
    }
    const result = calcTotalAnnualValue(waterOnlyParams)
    const expectedMin = (24_000 * WATER_PRICE_MIN * 365) / 1e6
    expect(result[0]).toBeCloseTo(expectedMin, 1)
  })

  it('inclut la valeur sel dans le total', () => {
    const saltOnlyParams: RoiParams = {
      ...ZERO_PARAMS,
      saltValueEurPerYear: [50_000, 150_000],
    }
    const result = calcTotalAnnualValue(saltOnlyParams)
    // 50_000 € = 0.05 M€ minimum
    expect(result[0]).toBeGreaterThanOrEqual(0.05)
  })

  it('additionne correctement toutes les sources (spiruline + aquaculture + minéraux)', () => {
    const multiSourceParams: RoiParams = {
      ...ZERO_PARAMS,
      spirulineValueEurPerYear: [200_000, 800_000],
      aquacultureValueEurPerYear: [100_000, 600_000],
      mineralsValueEurPerYear: [80_000, 240_000],
    }
    const result = calcTotalAnnualValue(multiSourceParams)
    // min = (200_000 + 100_000 + 80_000) / 1e6 = 0.38 M€
    const expectedMin = (200_000 + 100_000 + 80_000) / 1e6
    expect(result[0]).toBeCloseTo(expectedMin, 4)
  })
})

// ─── 2. calcTotalCost ─────────────────────────────────────────────────────────

describe('calcTotalCost', () => {
  it('retourne [0,0] pour ZERO_PARAMS', () => {
    expect(calcTotalCost(ZERO_PARAMS)).toEqual([0, 0])
  })

  it('retourne min > 0 pour REALISTIC_PARAMS', () => {
    const result = calcTotalCost(REALISTIC_PARAMS)
    expect(result[0]).toBeGreaterThan(0)
  })

  it('additionne costMEur et desalinationCostEur (converti en M€)', () => {
    // costMEur[0] = 1500, desalinationCostEur[0] = 150_000_000 € = 150 M€
    // totalMin = 1500 + 150 = 1650 M€
    const result = calcTotalCost(REALISTIC_PARAMS)
    const expectedMin = 1500 + 150_000_000 / 1e6
    expect(result[0]).toBeCloseTo(expectedMin, 1)
  })
})

// ─── 3. calcBreakEven ────────────────────────────────────────────────────────

describe('calcBreakEven', () => {
  it('retourne [Infinity, Infinity] si annualValue est [0,0]', () => {
    const result = calcBreakEven([1000, 5000], [0, 0])
    expect(result[0]).toBe(Infinity)
    expect(result[1]).toBe(Infinity)
  })

  it('retourne min > 0 pour coût et valeur réalistes', () => {
    const result = calcBreakEven([1650, 7950], [4.38, 20.48])
    expect(result[0]).toBeGreaterThan(0)
  })

  it('retourne max > min (break-even max correspond au scénario pessimiste)', () => {
    // Pessimiste : coût max / valeur min → plus d'années
    const result = calcBreakEven([1650, 7950], [4.38, 20.48])
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('break-even min ≈ totalCost.min / annualValue.max', () => {
    const totalCost: [number, number] = [1650, 7950]
    const annualValue: [number, number] = [4.38, 20.48]
    const result = calcBreakEven(totalCost, annualValue)
    const expectedMin = totalCost[0] / annualValue[1]
    expect(result[0]).toBeCloseTo(expectedMin, 1)
  })

  it('break-even max ≈ totalCost.max / annualValue.min', () => {
    const totalCost: [number, number] = [1650, 7950]
    const annualValue: [number, number] = [4.38, 20.48]
    const result = calcBreakEven(totalCost, annualValue)
    const expectedMax = totalCost[1] / annualValue[0]
    expect(result[1]).toBeCloseTo(expectedMax, 1)
  })
})

// ─── 4. calcCumulativeRoi ────────────────────────────────────────────────────

describe('calcCumulativeRoi', () => {
  it('retourne roi négatif à 1 an (pas encore rentable)', () => {
    // 1 an de valeur << coût initial
    const result = calcCumulativeRoi([4.38, 20.48], [1650, 7950], 1)
    expect(result[0]).toBeLessThan(0)
    expect(result[1]).toBeLessThan(0)
  })

  it('retourne roi positif à 100 ans pour params réalistes', () => {
    // 100 × 4.38 M€ = 438 M€ >> 7950 M€ ? Non — scénario pessimiste négatif
    // Scénario optimiste : 100 × 20.48 = 2048 M€ > 1650 M€
    const result = calcCumulativeRoi([4.38, 20.48], [1650, 7950], 100)
    expect(result[1]).toBeGreaterThan(0)
  })

  it('roi = annualValue × years - totalCost (formule correcte)', () => {
    const annualValue: [number, number] = [10, 20]
    const totalCost: [number, number] = [100, 200]
    const years = 15
    const result = calcCumulativeRoi(annualValue, totalCost, years)
    // roi.min = annualValue.min × years - totalCost.max = 10×15 - 200 = -50
    expect(result[0]).toBeCloseTo(10 * 15 - 200, 5)
    // roi.max = annualValue.max × years - totalCost.min = 20×15 - 100 = 200
    expect(result[1]).toBeCloseTo(20 * 15 - 100, 5)
  })

  it('roi augmente avec le nombre d\'années (monotone croissant)', () => {
    const annualValue: [number, number] = [10, 20]
    const totalCost: [number, number] = [100, 200]
    const roi50 = calcCumulativeRoi(annualValue, totalCost, 50)
    const roi100 = calcCumulativeRoi(annualValue, totalCost, 100)
    expect(roi100[0]).toBeGreaterThan(roi50[0])
    expect(roi100[1]).toBeGreaterThan(roi50[1])
  })

  it('roi à 0 an = -(coût total)', () => {
    const annualValue: [number, number] = [10, 20]
    const totalCost: [number, number] = [100, 200]
    const result = calcCumulativeRoi(annualValue, totalCost, 0)
    expect(result[0]).toBeCloseTo(-totalCost[1], 5)
    expect(result[1]).toBeCloseTo(-totalCost[0], 5)
  })
})

// ─── 5. computeRoiAnalysis ────────────────────────────────────────────────────

describe('computeRoiAnalysis', () => {
  it('retourne null pour ZERO_PARAMS (canal sans données)', () => {
    expect(computeRoiAnalysis(ZERO_PARAMS)).toBeNull()
  })

  it('retourne un RoiResult non-null pour REALISTIC_PARAMS', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    expect(result).not.toBeNull()
  })

  it('totalAnnualValueMEur.min > 0 pour REALISTIC_PARAMS', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    expect(result!.totalAnnualValueMEur[0]).toBeGreaterThan(0)
  })

  it('totalCostMEur.min > 0 pour REALISTIC_PARAMS', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    expect(result!.totalCostMEur[0]).toBeGreaterThan(0)
  })

  it('roi100.max > roi25.max (ROI croît avec le temps)', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    expect(result!.roi100[1]).toBeGreaterThan(result!.roi25[1])
  })
})

// ─── 6. calcAllCanalsRoi ──────────────────────────────────────────────────────

describe('calcAllCanalsRoi', () => {
  it('retourne [] pour tableau canaux vide', () => {
    const result = calcAllCanalsRoi([], calcParamsDefault, desertFeaturesMock)
    expect(result).toEqual([])
  })

  it('retourne un résumé par canal (1 canal → 1 résumé)', () => {
    const result = calcAllCanalsRoi(
      [canalWithElevation],
      calcParamsDefault,
      desertFeaturesMock,
    )
    expect(result).toHaveLength(1)
  })

  it('le résumé contient canalId, canalName et breakEvenYears', () => {
    const result = calcAllCanalsRoi(
      [canalWithElevation],
      calcParamsDefault,
      desertFeaturesMock,
    )
    const summary = result[0]
    expect(summary.canalId).toBe(canalWithElevation.id)
    expect(summary.canalName).toBe(canalWithElevation.name)
    expect(Array.isArray(summary.breakEvenYears)).toBe(true)
    expect(summary.breakEvenYears).toHaveLength(2)
  })
})

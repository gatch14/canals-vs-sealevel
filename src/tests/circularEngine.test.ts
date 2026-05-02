// src/tests/circularEngine.test.ts
// Wave 0 — Tests RED. Les stubs retournent [0,0] et null.
// T02 (Wave 1) implémente les fonctions pour faire passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  calcSpirulineProduction,
  calcAquacultureProduction,
  calcMineralExtraction,
  calcArableLand,
  calcLifespan,
  calcHabitabilityTimeline,
  computeCircularAnalysis,
} from '../lib/circularEngine'

const ZERO_INTERVAL: [number, number] = [0, 0]
const HABITABLE_ZONES_ZERO: [number, number] = [0, 0]
const HABITABLE_ZONES_1000: [number, number] = [700, 1300]
const WATER_PROD_ZERO: [number, number] = [0, 0]
const WATER_PROD_BASE: [number, number] = [8000, 12000]
const MINERALS_VALUE_BASE: [number, number] = [100, 500]

// ─── CIRC-01 : Spiruline ──────────────────────────────────────────────────────

describe('calcSpirulineProduction', () => {
  it('retourne { tonnes: [0,0], value: [0,0] } si habitableZones est [0,0]', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_ZERO, 1.0)
    expect(result.tonnes).toEqual(ZERO_INTERVAL)
    expect(result.value).toEqual(ZERO_INTERVAL)
  })
  it('retourne tonnes.min > 0 si habitableZones > 0', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.tonnes[0]).toBeGreaterThan(0)
  })
  it('retourne tonnes.max > tonnes.min (fourchette cohérente)', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.tonnes[1]).toBeGreaterThan(result.tonnes[0])
  })
  it('retourne value.min > 0 si habitableZones > 0', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.value[0]).toBeGreaterThan(0)
  })
  it('retourne value.max > value.min (fourchette valeur cohérente)', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.value[1]).toBeGreaterThan(result.value[0])
  })
})

// ─── CIRC-02 : Aquaculture ────────────────────────────────────────────────────

describe('calcAquacultureProduction', () => {
  it('retourne { tonnes: [0,0], value: [0,0] } si habitableZones est [0,0]', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_ZERO)
    expect(result.tonnes).toEqual(ZERO_INTERVAL)
    expect(result.value).toEqual(ZERO_INTERVAL)
  })
  it('retourne tonnes.min > 0 si habitableZones > 0', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_1000)
    expect(result.tonnes[0]).toBeGreaterThan(0)
  })
  it('retourne tonnes.max > tonnes.min', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_1000)
    expect(result.tonnes[1]).toBeGreaterThan(result.tonnes[0])
  })
  it('retourne value.max > value.min', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_1000)
    expect(result.value[1]).toBeGreaterThan(result.value[0])
  })
})

// ─── CIRC-03 : Extraction minérale ───────────────────────────────────────────

describe('calcMineralExtraction', () => {
  it('retourne toutes [0,0] si waterProductionMinDaily est 0', () => {
    const result = calcMineralExtraction(0, 1.0)
    expect(result.mgTonnes).toEqual(ZERO_INTERVAL)
    expect(result.kTonnes).toEqual(ZERO_INTERVAL)
    expect(result.caTonnes).toEqual(ZERO_INTERVAL)
    expect(result.value).toEqual(ZERO_INTERVAL)
  })
  it('retourne mgTonnes.min > 0 si waterProductionMinDaily > 0', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.mgTonnes[0]).toBeGreaterThan(0)
  })
  it('mgTonnes > kTonnes (Mg = 0.13% > K = 0.04%)', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.mgTonnes[0]).toBeGreaterThan(result.kTonnes[0])
  })
  it('kTonnes ≈ caTonnes (fractions identiques 0.04%)', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.kTonnes[0]).toBeCloseTo(result.caTonnes[0], 10)
  })
  it('value.min > 0 si waterProductionMinDaily > 0', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.value[0]).toBeGreaterThan(0)
  })
  it('value.max > value.min', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.value[1]).toBeGreaterThan(result.value[0])
  })
})

// ─── CIRC-04 : Terres arables ─────────────────────────────────────────────────

describe('calcArableLand', () => {
  it('retourne [0,0] si waterProductionMinDaily est 0', () => {
    expect(calcArableLand(0)).toEqual(ZERO_INTERVAL)
  })
  it('retourne min > 0 si waterProductionMinDaily > 0', () => {
    expect(calcArableLand(8000)[0]).toBeGreaterThan(0)
  })
  it('respecte la fourchette ±30% (max ≈ min × 1.3/0.7)', () => {
    const result = calcArableLand(8000)
    const ratio = result[1] / result[0]
    expect(ratio).toBeCloseTo(1.3 / 0.7, 1)
  })
})

// ─── CIRC-05 : Durée de vie ───────────────────────────────────────────────────

describe('calcLifespan', () => {
  it('retourne min >= 20 pour zone désertique (aridityFactor = 1.0)', () => {
    const result = calcLifespan(1000, 1.0)
    expect(result[0]).toBeGreaterThanOrEqual(20)
  })
  it('retourne max <= 65 pour zone désertique (50 × 1.3)', () => {
    const result = calcLifespan(1000, 1.0)
    expect(result[1]).toBeLessThanOrEqual(65)
  })
  it('zone désertique produit lifespan.min > zone humide lifespan.min', () => {
    const desert = calcLifespan(1000, 1.0)
    const humid = calcLifespan(1000, 0.4)
    expect(desert[0]).toBeGreaterThan(humid[0])
  })
  it('min < max (fourchette valide)', () => {
    const result = calcLifespan(1000, 1.0)
    expect(result[1]).toBeGreaterThan(result[0])
  })
})

// ─── CIRC-06 : Timeline habitabilité ─────────────────────────────────────────

describe('calcHabitabilityTimeline', () => {
  it('retourne [5,20] si waterProduction > 0 ET mineralsValue > 0', () => {
    const result = calcHabitabilityTimeline(WATER_PROD_BASE, MINERALS_VALUE_BASE)
    expect(result[0]).toBe(5)
    expect(result[1]).toBe(20)
  })
  it('retourne [20,50] si waterProduction est [0,0]', () => {
    const result = calcHabitabilityTimeline(WATER_PROD_ZERO, MINERALS_VALUE_BASE)
    expect(result[0]).toBe(20)
    expect(result[1]).toBe(50)
  })
  it('retourne [20,50] si mineralsValue est [0,0]', () => {
    const result = calcHabitabilityTimeline(WATER_PROD_BASE, ZERO_INTERVAL)
    expect(result[0]).toBe(20)
    expect(result[1]).toBe(50)
  })
})

// ─── Orchestrateur computeCircularAnalysis ────────────────────────────────────

describe('computeCircularAnalysis', () => {
  const desertFeaturesMock = { type: 'FeatureCollection' as const, features: [] }
  const baseParams = {
    nodes: 2,
    habitableZones: [700, 1300] as [number, number],
    saltValue: [50000, 150000] as [number, number],
    waterProduction: [8000, 12000] as [number, number],
    points: [[-5, 30], [10, 25]] as [number, number][],
    lengthKm: 1200,
  }

  it('retourne null si nodes === 0', () => {
    expect(computeCircularAnalysis({ ...baseParams, nodes: 0 }, desertFeaturesMock)).toBeNull()
  })

  it('retourne un CircularResult non-null pour canal valide (2 nœuds, 1200 km)', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result).not.toBeNull()
  })

  it('spirulineTonnes.min > 0 pour canal valide', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result!.spirulineTonnes[0]).toBeGreaterThan(0)
  })

  it('arableLandKm2.min > 0 pour canal valide', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result!.arableLandKm2[0]).toBeGreaterThan(0)
  })

  it('lifespanYears.min >= 20', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result!.lifespanYears[0]).toBeGreaterThanOrEqual(20)
  })
})

// src/tests/meteorologyEngine.test.ts
// Wave 0 — Tests RED. Les stubs retournent [0,0] et 'low'.
// T02 (Wave 1) implémente les fonctions pour faire passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  calcAridityFactor,
  calcEvaporation,
  calcInfluenceRadius,
  calcInducedPrecipitation,
  calcCoolingDelta,
  classifyWeatherRisk,
  computeMeteorologyAnalysis,
} from '../lib/meteorologyEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

// ─── calcAridityFactor ────────────────────────────────────────────────────────

describe('calcAridityFactor — classification zone aride', () => {
  it('retourne 1.0 pour des points en zone désertique (Sahara central)', () => {
    const saharaPoints: Coord[] = [[5.0, 25.0], [9.0, 21.0]]
    expect(calcAridityFactor(saharaPoints, DESERT_FEATURES)).toBe(1.0)
  })
  it('retourne 0.4 pour des points hors désert (Europe tempérée)', () => {
    const europePoints: Coord[] = [[2.35, 48.85], [13.4, 52.5]]
    expect(calcAridityFactor(europePoints, DESERT_FEATURES)).toBe(0.4)
  })
  it('retourne 0.4 pour points.length < 2 (guard entrée invalide)', () => {
    expect(calcAridityFactor([[5.0, 25.0]], DESERT_FEATURES)).toBe(0.4)
  })
})

// ─── calcEvaporation — METEO-01 ───────────────────────────────────────────────

describe('calcEvaporation — volume évaporation km³/an (METEO-01)', () => {
  it('retourne [0, 0] pour surface nulle', () => {
    const result = calcEvaporation(0, 1.0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })
  it('retourne un intervalle positif avec max > min pour surface > 0 en zone désertique', () => {
    const result = calcEvaporation(100, 1.0)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })
  it("retourne moins d'évaporation pour facteur d'aridité réduit (0.4 vs 1.0)", () => {
    const humid = calcEvaporation(100, 0.4)
    const desert = calcEvaporation(100, 1.0)
    expect(humid[1]).toBeLessThan(desert[1])
  })
})

// ─── calcInfluenceRadius — METEO-02 ───────────────────────────────────────────

describe("calcInfluenceRadius — rayon d'influence km (METEO-02)", () => {
  it('retourne un intervalle [min, max] positif pour canal de 1000 km en zone désertique', () => {
    const result = calcInfluenceRadius(1000, 1.0)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })
  it('retourne un rayon inférieur pour zone humide vs désertique (même longueur)', () => {
    const humid = calcInfluenceRadius(1000, 0.4)
    const desert = calcInfluenceRadius(1000, 1.0)
    expect(humid[1]).toBeLessThan(desert[1])
  })
})

// ─── calcInducedPrecipitation — METEO-03 ──────────────────────────────────────

describe('calcInducedPrecipitation — précipitations induites mm/an (METEO-03)', () => {
  it('retourne [0, 0] pour évaporation nulle', () => {
    const result = calcInducedPrecipitation([0, 0], 1.0, 10000)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })
  it('retourne un intervalle positif avec max > min pour évaporation > 0', () => {
    const result = calcInducedPrecipitation([0.1, 0.5], 1.0, 10000)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })
  it("retourne [0, 0] pour influenceAreaKm2 <= 0", () => {
    const result = calcInducedPrecipitation([0.1, 0.5], 1.0, 0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })
  it('retourne des précipitations dans un ordre de grandeur réaliste (< 2000 mm/an)', () => {
    const influenceAreaKm2 = Math.PI * 120 * 120
    const result = calcInducedPrecipitation([0.025, 0.1], 1.0, influenceAreaKm2)
    expect(result[1]).toBeLessThan(2000)
  })
})

// ─── calcCoolingDelta — METEO-04 ──────────────────────────────────────────────

describe('calcCoolingDelta — refroidissement local °C (METEO-04)', () => {
  it('retourne [0, 0] pour surface nulle', () => {
    const result = calcCoolingDelta(0, 1.0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })
  it('retourne deux magnitudes positives pour surface > 0 (CR-02 : convention positive)', () => {
    const result = calcCoolingDelta(100, 1.0)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(0)
  })
  it('respecte la convention [min, max] : [0] < [1] (magnitude min < magnitude max)', () => {
    const result = calcCoolingDelta(100, 1.0)
    expect(result[0]).toBeLessThan(result[1])
  })
})

// ─── classifyWeatherRisk — METEO-05 ───────────────────────────────────────────

describe('classifyWeatherRisk — indice de risque météorologique (METEO-05)', () => {
  it('retourne low pour canal < 500 km en zone désertique', () => {
    expect(classifyWeatherRisk(400, 1.0)).toBe('low')
  })
  it('retourne high pour canal > 1500 km en zone désertique (aridityFactor >= 1.0)', () => {
    expect(classifyWeatherRisk(2000, 1.0)).toBe('high')
  })
  it('retourne moderate pour canal 500–1500 km en zone semi-aride (aridityFactor 0.7)', () => {
    expect(classifyWeatherRisk(1000, 0.7)).toBe('moderate')
  })
  it('retourne low pour zone humide (aridityFactor 0.4) indépendamment de la longueur', () => {
    expect(classifyWeatherRisk(2000, 0.4)).toBe('low')
  })
  it('retourne moderate pour canal exactement 500 km en zone semi-aride', () => {
    expect(classifyWeatherRisk(500, 0.7)).toBe('moderate')
  })
  it('retourne moderate pour canal exactement 1500 km en zone désertique (borne > 1500 exclusive)', () => {
    expect(classifyWeatherRisk(1500, 1.0)).toBe('moderate')
  })
})

// ─── computeMeteorologyAnalysis — orchestrateur ───────────────────────────────

describe('computeMeteorologyAnalysis — orchestrateur (METEO-01 à METEO-05)', () => {
  it('retourne null si points.length < 2', () => {
    const result = computeMeteorologyAnalysis(
      { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0]] },
      DESERT_FEATURES,
    )
    expect(result).toBeNull()
  })

  it('retourne un MeteorologyResult non-null pour des paramètres valides', () => {
    const result = computeMeteorologyAnalysis(
      { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
      DESERT_FEATURES,
    )
    expect(result).not.toBeNull()
  })

  it('retourne evaporationKm3[0] > 0 pour canal en zone désertique (METEO-01)', () => {
    const result = computeMeteorologyAnalysis(
      { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
      DESERT_FEATURES,
    )
    expect(result!.evaporationKm3[0]).toBeGreaterThan(0)
  })

  it('retourne influenceRadiusKm[0] > 0 pour canal en zone désertique (METEO-02)', () => {
    const result = computeMeteorologyAnalysis(
      { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
      DESERT_FEATURES,
    )
    expect(result!.influenceRadiusKm[0]).toBeGreaterThan(0)
  })

  it('retourne coolingDeltaC[0] > 0 (magnitude positive — CR-02 convention)', () => {
    const result = computeMeteorologyAnalysis(
      { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
      DESERT_FEATURES,
    )
    expect(result!.coolingDeltaC[0]).toBeGreaterThan(0)
  })

  it('retourne weatherRisk high pour canal désertique long > 1500 km (METEO-05)', () => {
    const result = computeMeteorologyAnalysis(
      { lengthKm: 2000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
      DESERT_FEATURES,
    )
    expect(result!.weatherRisk).toBe('high')
  })

  it('retourne weatherRisk low pour canal court < 500 km même en zone désertique (METEO-05)', () => {
    const result = computeMeteorologyAnalysis(
      { lengthKm: 400, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
      DESERT_FEATURES,
    )
    expect(result!.weatherRisk).toBe('low')
  })
})

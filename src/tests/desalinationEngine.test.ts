// src/tests/desalinationEngine.test.ts
// Wave 0 — Tests RED. Les stubs retournent [0,0] et 0.
// T02 (Wave 1) implémente les fonctions pour faire passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  classifyEcosystem,
  calcDesalinationNodes,
  calcSolarFactor,
  calcWaterProduction,
  calcSaltValue,
  calcHabitableZones,
  calcDesalinationCost,
  computeDesalinationAnalysis,
} from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

// ─── ECO-05 : Classification écosystème ──────────────────────────────────────

describe('classifyEcosystem — impact eau salée (ECO-05)', () => {
  it('retourne low pour des points en zone désertique (Sahara central)', () => {
    // Points dans le Sahara — desertZones.geojson les couvre
    const saharaPoints: Coord[] = [[5.0, 25.0], [7.0, 23.0], [9.0, 21.0]]
    const result = classifyEcosystem(saharaPoints, DESERT_FEATURES)
    expect(result).toBe('low')
  })

  it('retourne critical ou neutral pour des points hors désert (Europe tempérée)', () => {
    // Points en Europe — hors désert, potentiellement zones agricoles
    const europePoints: Coord[] = [[2.35, 48.85], [4.9, 52.37], [13.4, 52.5]]
    const result = classifyEcosystem(europePoints, DESERT_FEATURES)
    expect(['neutral', 'critical']).toContain(result)
  })

  it('retourne neutral pour des points en zone neutre (haute mer/littoral)', () => {
    // Points en mer — ni désert ni zone agricole
    const seaPoints: Coord[] = [[0.0, 0.0], [10.0, 0.0], [20.0, 0.0]]
    const result = classifyEcosystem(seaPoints, DESERT_FEATURES)
    expect(['neutral', 'low']).toContain(result)
  })
})

// ─── DESAL-01 : Nombre de nœuds ───────────────────────────────────────────────

describe('calcDesalinationNodes — 1 nœud / 500 km (DESAL-01)', () => {
  it('retourne 0 pour un canal de 499 km', () => {
    expect(calcDesalinationNodes(499)).toBe(0)
  })

  it('retourne 1 pour un canal exactement de 500 km', () => {
    expect(calcDesalinationNodes(500)).toBe(1)
  })

  it('retourne 2 pour un canal de 1000 km', () => {
    expect(calcDesalinationNodes(1000)).toBe(2)
  })

  it('retourne 6 pour un canal de 3200 km (Qattara-longueur)', () => {
    expect(calcDesalinationNodes(3200)).toBe(6)
  })

  it('retourne 0 pour un canal de longueur nulle', () => {
    expect(calcDesalinationNodes(0)).toBe(0)
  })
})

// ─── DESAL-01 : Facteur solaire ────────────────────────────────────────────────

describe('calcSolarFactor — heuristique latitude (DESAL-01)', () => {
  it('retourne 1.0 pour des points à latitude < 35°N (zone tropicale)', () => {
    // Sahara : latitude ~25°N
    const tropicalPoints: Coord[] = [[5.0, 25.0], [9.0, 21.0]]
    expect(calcSolarFactor(tropicalPoints)).toBe(1.0)
  })

  it('retourne 0.7 pour des points à latitude >= 35°N (zone tempérée)', () => {
    // Europe : latitude ~48°N
    const temperatePoints: Coord[] = [[2.35, 48.85], [13.4, 52.5]]
    expect(calcSolarFactor(temperatePoints)).toBe(0.7)
  })

  it('retourne 1.0 pour des points à latitude < 35°S (zone tropicale Sud)', () => {
    // Atacama : latitude ~-25°S
    const southTropicalPoints: Coord[] = [[-70.5, -20.0], [-68.5, -22.0]]
    expect(calcSolarFactor(southTropicalPoints)).toBe(1.0)
  })

  it('retourne 1.0 pour un point exactement à 34.9°N', () => {
    const borderPoints: Coord[] = [[35.0, 34.9]]
    expect(calcSolarFactor(borderPoints)).toBe(1.0)
  })

  it('retourne 0.7 pour un point exactement à 35.0°N', () => {
    const borderPoints: Coord[] = [[35.0, 35.0]]
    expect(calcSolarFactor(borderPoints)).toBe(0.7)
  })
})

// ─── DESAL-02 : Production eau douce ─────────────────────────────────────────

describe('calcWaterProduction — m³/jour (DESAL-02)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcWaterProduction(0, 1.0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne un intervalle positif [min > 0, max > min] pour 1 nœud solaire', () => {
    const result = calcWaterProduction(1, 1.0)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('retourne un intervalle proportionnel pour 2 nœuds vs 1 nœud', () => {
    const result1 = calcWaterProduction(1, 1.0)
    const result2 = calcWaterProduction(2, 1.0)
    expect(result2[0]).toBeCloseTo(result1[0] * 2, 0)
    expect(result2[1]).toBeCloseTo(result1[1] * 2, 0)
  })

  it('réduit la production avec solarFactor 0.7 vs 1.0', () => {
    const full = calcWaterProduction(2, 1.0)
    const reduced = calcWaterProduction(2, 0.7)
    expect(reduced[0]).toBeLessThan(full[0])
    expect(reduced[1]).toBeLessThan(full[1])
  })

  it('produit un ratio max/min cohérent (fourchette ~40%)', () => {
    const result = calcWaterProduction(3, 1.0)
    const ratio = result[1] / result[0]
    expect(ratio).toBeGreaterThan(1.2)
    expect(ratio).toBeLessThan(2.0)
  })
})

// ─── DESAL-03 : Valeur des sels ───────────────────────────────────────────────

describe('calcSaltValue — €/an (DESAL-03)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcSaltValue(0, 500)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne un intervalle positif [min > 0, max > min] pour 2 nœuds', () => {
    const result = calcSaltValue(2, 1000)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('augmente avec le nombre de nœuds', () => {
    const result2 = calcSaltValue(2, 1000)
    const result4 = calcSaltValue(4, 2000)
    expect(result4[0]).toBeGreaterThan(result2[0])
  })

  it('produit un ratio max/min cohérent (prix marché NaCl × 3 min)', () => {
    const result = calcSaltValue(2, 1000)
    const ratio = result[1] / result[0]
    expect(ratio).toBeGreaterThan(1.5)
    expect(ratio).toBeLessThan(5.0)
  })
})

// ─── DESAL-04 : Zones habitables ──────────────────────────────────────────────

describe('calcHabitableZones — km² (DESAL-04)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcHabitableZones(0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne un intervalle positif pour 1 nœud', () => {
    const result = calcHabitableZones(1)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('est proportionnel au nombre de nœuds', () => {
    const result1 = calcHabitableZones(1)
    const result3 = calcHabitableZones(3)
    expect(result3[0]).toBeCloseTo(result1[0] * 3, 0)
  })
})

// ─── DESAL-05 : Coût infrastructure ───────────────────────────────────────────

describe('calcDesalinationCost — € (DESAL-05)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcDesalinationCost(0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne [50_000_000, 150_000_000] pour 1 nœud (50M–150M €/nœud)', () => {
    const result = calcDesalinationCost(1)
    expect(result[0]).toBe(50_000_000)
    expect(result[1]).toBe(150_000_000)
  })

  it('retourne [100_000_000, 300_000_000] pour 2 nœuds', () => {
    const result = calcDesalinationCost(2)
    expect(result[0]).toBe(100_000_000)
    expect(result[1]).toBe(300_000_000)
  })
})

// ─── Orchestrateur computeDesalinationAnalysis ────────────────────────────────

describe('computeDesalinationAnalysis — orchestrateur (DESAL-01 à DESAL-05 + ECO-05)', () => {
  it('retourne null si points.length < 2', () => {
    const result = computeDesalinationAnalysis(
      { lengthKm: 500, points: [[5.0, 25.0]], solarFactor: 1.0 },
      DESERT_FEATURES,
    )
    expect(result).toBeNull()
  })

  it('retourne un DesalinationResult valide pour un canal de 1200 km en zone ensoleillée', () => {
    const result = computeDesalinationAnalysis(
      {
        lengthKm: 1200,
        points: [[5.0, 25.0], [9.0, 21.0], [13.0, 18.0]],
        solarFactor: 1.0,
      },
      DESERT_FEATURES,
    )
    expect(result).not.toBeNull()
    expect(result!.nodes).toBe(2)
    expect(result!.waterProduction[0]).toBeGreaterThan(0)
    expect(result!.waterProduction[1]).toBeGreaterThan(result!.waterProduction[0])
    expect(result!.saltValue[0]).toBeGreaterThan(0)
    expect(result!.habitableZones[0]).toBeGreaterThan(0)
    expect(result!.desalinationCost[0]).toBe(100_000_000)
    expect(result!.desalinationCost[1]).toBe(300_000_000)
    expect(['low', 'neutral', 'critical']).toContain(result!.ecosystemImpact)
  })

  it('retourne 0 nœuds et coût [0,0] pour un canal de 300 km', () => {
    const result = computeDesalinationAnalysis(
      {
        lengthKm: 300,
        points: [[5.0, 25.0], [7.0, 23.0]],
        solarFactor: 1.0,
      },
      DESERT_FEATURES,
    )
    expect(result).not.toBeNull()
    expect(result!.nodes).toBe(0)
    expect(result!.desalinationCost[0]).toBe(0)
    expect(result!.desalinationCost[1]).toBe(0)
  })
})

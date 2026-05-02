// src/tests/samplePoints.test.ts
import { describe, it, expect } from 'vitest'
import { samplePoints } from '../services/elevationApi'
import type { Coord } from '../types/canal'

describe('samplePoints', () => {
  const traceStraight: Coord[] = [
    [2.3, 48.8],   // Paris [lng, lat]
    [5.4, 43.3],   // Marseille [lng, lat]
  ]

  it('retourne exactement n points pour un tracé valide', () => {
    const result = samplePoints(traceStraight, 100)
    expect(result).toHaveLength(100)
  })

  it('retourne exactement n=50 points si demandé', () => {
    const result = samplePoints(traceStraight, 50)
    expect(result).toHaveLength(50)
  })

  it('retourne des coordonnées au format [lng, lat] (premier élément = longitude)', () => {
    const result = samplePoints(traceStraight, 100)
    // Convention projet : [lng, lat] — longitude = premier élément (entre -180 et 180)
    // Le tracé Paris-Marseille a des longitudes entre 2 et 5.4
    const firstPoint = result[0]
    expect(firstPoint[0]).toBeGreaterThan(-180)
    expect(firstPoint[0]).toBeLessThan(180)
    // La longitude du premier point doit être proche de Paris (2.3)
    expect(Math.abs(firstPoint[0] - 2.3)).toBeLessThan(0.1)
  })

  it('inclut un point proche du départ et de l\'arrivée', () => {
    const result = samplePoints(traceStraight, 100)
    const first = result[0]
    const last = result[result.length - 1]
    expect(Math.abs(first[0] - 2.3)).toBeLessThan(0.1)
    expect(Math.abs(last[0] - 5.4)).toBeLessThan(0.1)
  })
})

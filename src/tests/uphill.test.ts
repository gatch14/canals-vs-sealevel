// src/tests/uphill.test.ts
import { describe, it, expect } from 'vitest'
import { detectUphillSegments } from '../services/elevationApi'
import type { ElevationPoint } from '../types/elevation'

describe('detectUphillSegments', () => {
  it('retourne [] pour un tableau vide', () => {
    expect(detectUphillSegments([])).toEqual([])
  })

  it('retourne [] pour un profil monotone décroissant (100% gravitaire)', () => {
    const pts: ElevationPoint[] = [
      { distance: 0, altitude: 100 },
      { distance: 1, altitude: 80 },
      { distance: 2, altitude: 50 },
    ]
    expect(detectUphillSegments(pts)).toEqual([])
  })

  it('détecte un segment montant simple', () => {
    const pts: ElevationPoint[] = [
      { distance: 0, altitude: 50 },
      { distance: 1, altitude: 100 },
    ]
    const result = detectUphillSegments(pts)
    expect(result).toHaveLength(1)
    expect(result[0].distanceStart).toBe(0)
    expect(result[0].distanceEnd).toBe(1)
    expect(result[0].altitudeGain).toBe(50)
  })

  it('détecte un segment montant au milieu d\'un profil mixte', () => {
    const pts: ElevationPoint[] = [
      { distance: 0, altitude: 100 },
      { distance: 1, altitude: 80 },
      { distance: 2, altitude: 120 },
      { distance: 3, altitude: 90 },
    ]
    const result = detectUphillSegments(pts)
    expect(result).toHaveLength(1)
    expect(result[0].distanceStart).toBe(1)
    expect(result[0].distanceEnd).toBe(2)
    expect(result[0].altitudeGain).toBeCloseTo(40, 0)
  })

  it('ferme un segment ouvert à la fin du tableau', () => {
    const pts: ElevationPoint[] = [
      { distance: 0, altitude: 0 },
      { distance: 1, altitude: 50 },
      { distance: 2, altitude: 100 },
    ]
    const result = detectUphillSegments(pts)
    expect(result).toHaveLength(1)
    expect(result[0].distanceStart).toBe(0)
    expect(result[0].distanceEnd).toBe(2)
  })
})

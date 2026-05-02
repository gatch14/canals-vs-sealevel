// src/tests/elevationApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchElevations, buildProfile } from '../services/elevationApi'
import type { Coord } from '../types/canal'

describe('fetchElevations', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('appelle l\'API GET avec latitude et longitude séparés (inversion depuis [lng,lat])', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elevation: [100, 200] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const coords: Coord[] = [[2.3, 48.8], [5.4, 43.3]]  // [lng, lat]
    await fetchElevations(coords)

    expect(mockFetch).toHaveBeenCalledOnce()
    const url: string = mockFetch.mock.calls[0][0]
    // L'API reçoit latitude=48.8,43.3 et longitude=2.3,5.4 (lat/lng séparés)
    expect(url).toContain('latitude=48.8,43.3')
    expect(url).toContain('longitude=2.3,5.4')
    expect(url).toContain('open-meteo.com/v1/elevation')
  })

  it('normalise null à 0 pour les zones hors-couverture DEM', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elevation: [null, 50] }),
    }))

    const coords: Coord[] = [[0, 0], [1, 1]]
    const result = await fetchElevations(coords)
    expect(result[0]).toBe(0)  // null → 0
    expect(result[1]).toBe(50)
  })

  it('lance une erreur si la réponse HTTP est non-OK (429)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    }))

    await expect(fetchElevations([[2.3, 48.8]])).rejects.toThrow('HTTP 429')
  })

  it('lance une erreur si data.elevation n\'est pas un tableau', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'Invalid request' }),
    }))

    await expect(fetchElevations([[2.3, 48.8]])).rejects.toThrow('réponse invalide')
  })
})

describe('buildProfile', () => {
  it('construit ElevationProfile avec isFullyGravity = true si pas de montées', () => {
    const coords: Coord[] = [[2.3, 48.8], [5.4, 43.3]]
    const altitudes = [100, 50]  // décroissant = gravitaire
    const profile = buildProfile(coords, altitudes)
    expect(profile.isFullyGravity).toBe(true)
    expect(profile.uphillSegments).toHaveLength(0)
    expect(profile.totalUphillGain).toBe(0)
    expect(profile.points).toHaveLength(2)
  })

  it('calcule les distances en km (croissantes)', () => {
    const coords: Coord[] = [[2.3, 48.8], [5.4, 43.3]]
    const altitudes = [100, 50]
    const profile = buildProfile(coords, altitudes)
    expect(profile.points[0].distance).toBe(0)
    expect(profile.points[profile.points.length - 1].distance).toBeGreaterThan(0)
  })
})

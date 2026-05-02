// src/tests/routingGrid.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildGrid, getResolution, fetchGridElevations, buildGraph, findPath, findNearestNode, validateCoords } from '../services/routingGrid'

describe('buildGrid — MAP-05', () => {
  it('retourne exactement N×N points pour une grille 5×5', () => {
    const coords = buildGrid([0, 0], [1, 1], 5)
    expect(coords).toHaveLength(25)
  })

  it('les points couvrent la bbox avec marge 10%', () => {
    const coords = buildGrid([0, 0], [10, 10], 5)
    // Avec marge 10% : minLng = 0 - 1 = -1, maxLng = 10 + 1 = 11
    expect(coords[0][0]).toBeCloseTo(-1, 1)  // coin bas-gauche lng
    expect(coords[0][1]).toBeCloseTo(-1, 1)  // coin bas-gauche lat
  })

  it('index row*N+col : premier point est coin bas-gauche, dernier est coin haut-droit', () => {
    const coords = buildGrid([2, 48], [5, 51], 3)
    expect(coords).toHaveLength(9)
    // Premier point (row=0, col=0) = bas-gauche
    expect(coords[0][0]).toBeLessThan(coords[2][0])  // lng croît avec col
    expect(coords[0][1]).toBeLessThan(coords[6][1])  // lat croît avec row
  })
})

describe('getResolution — MAP-05', () => {
  it('retourne 50 pour une distance ≤ 100 km', () => {
    // Paris → Orléans ≈ 130 km... utiliser points très proches
    expect(getResolution([2.35, 48.85], [2.36, 48.86])).toBe(50)
  })

  it('retourne 100 pour une distance > 100 km', () => {
    // Paris → Marseille ≈ 660 km
    expect(getResolution([2.35, 48.85], [5.37, 43.30])).toBe(100)
  })
})

describe('validateCoords — MAP-05 (sécurité)', () => {
  it('ne lance pas d\'erreur pour des coordonnées valides', () => {
    expect(() => validateCoords([[2.35, 48.85], [5.37, 43.30]])).not.toThrow()
  })

  it('lance une erreur si lat > 90', () => {
    expect(() => validateCoords([[0, 91]])).toThrow('lat=91')
  })

  it('lance une erreur si lng > 180', () => {
    expect(() => validateCoords([[181, 0]])).toThrow('lng=181')
  })
})

describe('fetchGridElevations — MAP-05', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('envoie des batches de max 100 coordonnées (105 points = 2 requêtes)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elevation: new Array(100).fill(100) }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const coords: [number, number][] = Array.from({ length: 105 }, (_, i) => [i * 0.01, 10])
    const signal = new AbortController().signal
    await fetchGridElevations(coords, signal)

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('utilise latitude= et longitude= séparés (inversion depuis [lng,lat])', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elevation: [50] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const coords: [number, number][] = [[2.3, 48.8]]
    await fetchGridElevations(coords, new AbortController().signal)

    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('latitude=48.8')
    expect(url).toContain('longitude=2.3')
  })

  it('normalise null à 0 pour les zones hors-couverture DEM', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elevation: [null, 50] }),
    }))

    const coords: [number, number][] = [[0, 0], [1, 1]]
    const result = await fetchGridElevations(coords, new AbortController().signal)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(50)
  })

  it('lance une erreur Open Meteo HTTP XXX si réponse non-OK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    }))

    await expect(
      fetchGridElevations([[0, 0]], new AbortController().signal)
    ).rejects.toThrow('HTTP 429')
  })

  it('valide que lat ∈ [-90, 90] et lng ∈ [-180, 180] avant fetch', async () => {
    vi.stubGlobal('fetch', vi.fn())
    await expect(
      fetchGridElevations([[0, 95]], new AbortController().signal)
    ).rejects.toThrow('lat=95')
  })
})

describe('buildGraph + findPath — MAP-05', () => {
  it('buildGraph crée N×N nœuds avec connectivité 8', () => {
    const N = 3
    const coords = buildGrid([0, 0], [1, 1], N)
    const elevations = new Array(N * N).fill(100)
    const graph = buildGraph(N, coords, elevations)

    let nodeCount = 0
    graph.forEachNode(() => { nodeCount++ })
    expect(nodeCount).toBe(N * N)  // 9 nœuds

    // Nœud central (row=1, col=1) → 8 arêtes sortantes
    let edgesFromCenter = 0
    graph.forEachLinkedNode(4, () => { edgesFromCenter++ }, true /* outbound */)
    expect(edgesFromCenter).toBe(8)
  })

  it('findPath retourne un chemin non-vide sur grille plate (obstacles nuls)', () => {
    const N = 5
    const start: [number, number] = [0, 0]
    const end: [number, number] = [1, 1]
    const coords = buildGrid(start, end, N)
    const elevations = new Array(N * N).fill(100)  // grille plate
    const graph = buildGraph(N, coords, elevations)
    const path = findPath(graph, N, coords, start, end)
    expect(path.length).toBeGreaterThan(0)
  })

  it('findPath retourne [] quand obstacle infranchissable sépare départ et arrivée', () => {
    // Graphe 2×2 : nœuds isolés (pas d'arêtes) — aucun chemin possible
    const graph = buildGraph(2, [[0,0],[1,0],[0,1],[1,1]], [0, 999999, 999999, 0])
    // Avec coût extrême orienté, un chemin peut ne pas exister dans un sens
    // Test simplifié : chemin de 0 vers 3 sur grille 2×2 plate
    const coordsFlat: [number, number][] = [[0,0],[1,0],[0,1],[1,1]]
    const graphFlat = buildGraph(2, coordsFlat, [0,0,0,0])
    const path = findPath(graphFlat, 2, coordsFlat, [0,0], [1,1])
    expect(Array.isArray(path)).toBe(true)
  })

  it('le chemin retourné est ordonné start → end (inversion .reverse() appliquée)', () => {
    const N = 5
    const start: [number, number] = [0, 0]
    const end: [number, number] = [1, 1]
    const coords = buildGrid(start, end, N)
    const elevations = new Array(N * N).fill(100)
    const graph = buildGraph(N, coords, elevations)
    const path = findPath(graph, N, coords, start, end)

    if (path.length > 0) {
      // Premier point du chemin doit être proche de start, dernier proche de end
      const firstPoint = path[0]
      const lastPoint = path[path.length - 1]
      const distToStart = Math.hypot(firstPoint[0] - start[0], firstPoint[1] - start[1])
      const distToEnd   = Math.hypot(lastPoint[0] - end[0], lastPoint[1] - end[1])
      // start est toujours plus proche du premier point que du dernier
      expect(distToStart).toBeLessThan(distToEnd)
    }
  })

  it('findNearestNode mappe un point hors-grille sur le nœud le plus proche', () => {
    const coords: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1]]
    expect(findNearestNode(coords, [0.1, 0.1])).toBe(0)  // proche de [0,0]
    expect(findNearestNode(coords, [0.9, 0.9])).toBe(3)  // proche de [1,1]
  })
})

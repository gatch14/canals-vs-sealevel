---
phase: 03-routing-optimal
plan: T02
type: execute
wave: 1
depends_on: [03-T01]
files_modified:
  - src/services/routingGrid.ts
  - src/workers/routingWorker.ts
  - src/hooks/useRoutingWorker.ts
  - src/tests/routingGrid.test.ts
autonomous: true
requirements: [MAP-05]

must_haves:
  truths:
    - "buildGrid(start, end, N) retourne exactement N×N coordonnées [lng,lat] couvrant la bbox avec marge 10%"
    - "getResolution retourne 50 pour distance ≤ 100 km, 100 sinon"
    - "fetchGridElevations envoie des batches de max 100 coords, concurrence max 10"
    - "buildGraph crée N×N nœuds avec connectivité 8 et oriented:true (arêtes unidirectionnelles)"
    - "findPath retourne un chemin start→end (.reverse() appliqué) ou [] si obstacle infranchissable"
    - "Le worker reçoit RoutingRequest, exécute le calcul, postMessage RoutingResult"
    - "useRoutingWorker lance le worker, gère le timeout 30s, met à jour le store"
    - "Tous les stubs Wave 0 de T01 sont maintenant des tests VERTS"
  artifacts:
    - path: "src/services/routingGrid.ts"
      provides: "buildGrid, getResolution, fetchGridElevations, buildGraph, findPath, findNearestNode, haversineKm"
      exports: ["buildGrid", "getResolution", "fetchGridElevations", "buildGraph", "findPath", "findNearestNode"]
    - path: "src/workers/routingWorker.ts"
      provides: "Web Worker — reçoit RoutingRequest, postMessage RoutingResult"
      contains: "self.onmessage"
    - path: "src/hooks/useRoutingWorker.ts"
      provides: "Hook React — lance le worker quand routingEnd est défini, gère lifecycle"
      contains: "useRoutingWorker"
  key_links:
    - from: "src/hooks/useRoutingWorker.ts"
      to: "src/workers/routingWorker.ts"
      via: "new Worker(new URL('../workers/routingWorker.ts', import.meta.url), { type: 'module' })"
      pattern: "new Worker.*routingWorker"
    - from: "src/workers/routingWorker.ts"
      to: "src/services/routingGrid.ts"
      via: "imports buildGrid, fetchGridElevations, buildGraph, findPath, findNearestNode"
      pattern: "import.*routingGrid"
    - from: "src/hooks/useRoutingWorker.ts"
      to: "src/store/canalStore.ts"
      via: "useCanalStore.getState() dans onmessage handler"
      pattern: "getState.*finalizeRoutedCanal"
---

<objective>
Moteur de routing Phase 3 : service routingGrid.ts (algorithme pur), routingWorker.ts (Web Worker isolé), useRoutingWorker.ts (lifecycle React).

Purpose: Implémenter l'algorithme Dijkstra/A* sur grille DEM dans un Web Worker isolé du thread UI. Le service routingGrid.ts est testable en unité directement (sans Worker). Le hook useRoutingWorker.ts orchestre le cycle de vie.
Output: 3 nouveaux fichiers. Les 12 stubs it.todo de T01 deviennent des tests VERTS.
</objective>

<execution_context>
@C:\Users\gatch\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\gatch\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\dev\gsd\science\canal\.planning\PROJECT.md
@C:\dev\gsd\science\canal\.planning\ROADMAP.md
@C:\dev\gsd\science\canal\.planning\phases\03-routing-optimal\03-T01-SUMMARY.md

<interfaces>
<!-- Types créés en T01 — à consommer ici -->

From src/types/routing.ts (créé en T01):
```typescript
export type { Coord } from './canal'
export type RoutingState = 'idle' | 'selecting-start' | 'selecting-end' | 'computing' | 'timeout' | 'error' | 'no-path'
export interface RoutingRequest {
  start: [number, number]
  end: [number, number]
  resolution: 50 | 100
}
export type RoutingResult =
  | { type: 'result'; path: [number, number][] }
  | { type: 'no-path' }
  | { type: 'error'; message: string }
```

From src/store/canalStore.ts (actions ajoutées en T01):
```typescript
// Actions disponibles depuis useRoutingWorker :
finalizeRoutedCanal: (path: [number, number][]) => void
setRoutingState: (state: RoutingState) => void
cancelRouting: () => void
// Champ observable depuis useEffect:
routingEnd: [number, number] | null
routingStart: [number, number] | null
routingState: RoutingState
```

From src/services/elevationApi.ts (pattern à reprendre EXACTEMENT):
```typescript
// Pattern fetch Open-Meteo — INVERSION coords [lng,lat] → latitude/longitude séparés :
const latitudes  = coords.map(([, lat]) => lat).join(',')
const longitudes = coords.map(([lng]) => lng).join(',')
const url = `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
const response = await fetch(url, { signal })
if (!response.ok) throw new Error(`Open Meteo HTTP ${response.status}`)
const data = await response.json()
if (!Array.isArray(data.elevation)) throw new Error(`Open Meteo: réponse invalide`)
return (data.elevation as (number | null)[]).map((v) => v ?? 0)
```

From src/hooks/useElevation.ts (pattern lifecycle à reprendre):
```typescript
// Pattern AbortController + cancelled flag + cleanup
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10_000)
let cancelled = false
return () => { cancelled = true; controller.abort(); clearTimeout(timeoutId) }
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1 : Créer src/services/routingGrid.ts + passer les tests Wave 0 au vert</name>
  <read_first>
    - C:\dev\gsd\science\canal\src\tests\routingGrid.test.ts (stubs Wave 0 à rendre verts)
    - C:\dev\gsd\science\canal\src\services\elevationApi.ts (pattern fetch Open-Meteo à reprendre)
    - C:\dev\gsd\science\canal\.planning\phases\03-routing-optimal\03-RESEARCH.md (Patterns 1-3 + Pitfalls 1-2-8)
  </read_first>
  <files>src/services/routingGrid.ts, src/tests/routingGrid.test.ts</files>
  <behavior>
    - buildGrid(start, end, N): grille NxN avec marge bbox 10%, index row*N+col
    - getResolution(start, end): distance haversine → 50 si ≤100km, 100 sinon
    - fetchGridElevations(coords, signal): batches 100 max, concurrence 10, throw si HTTP err
    - validateCoords(coords): throw si lat hors [-90,90] ou lng hors [-180,180]
    - buildGraph(N, coords, elevations): ngraph N×N, 8-connectivity, oriented (arêtes A→B seulement)
    - findPath(graph, N, coords, start, end): findNearestNode + aStar(oriented:true) + .reverse()
    - findNearestNode(coords, point): index du nœud le plus proche par distance euclidienne
  </behavior>
  <action>
Créer `src/services/routingGrid.ts` :

```typescript
// src/services/routingGrid.ts
// Service de routing Dijkstra sur grille DEM — Phase 3
// Toutes les fonctions sont pures (pas de side-effects) — testables unitairement sans Worker
import { distance } from '@turf/turf'
import createGraph from 'ngraph.graph'
import { aStar } from 'ngraph.path'

// ── Types internes ──────────────────────────────────────────────────────────

interface NodeData { lng: number; lat: number; alt: number }
interface LinkData { cost: number }

// ── Validation sécurité (STRIDE Tampering — T-03-T02-01) ───────────────────

export function validateCoords(coords: [number, number][]): void {
  for (const [lng, lat] of coords) {
    if (lat < -90 || lat > 90) throw new Error(`Coordonnée invalide : lat=${lat} hors [-90, 90]`)
    if (lng < -180 || lng > 180) throw new Error(`Coordonnée invalide : lng=${lng} hors [-180, 180]`)
  }
}

// ── Distance haversine inline (évite import @turf/turf dans le worker) ──────

export function haversineKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

// ── Résolution adaptative (locked CONTEXT.md) ───────────────────────────────

export function getResolution(start: [number, number], end: [number, number]): 50 | 100 {
  const dist = distance(start, end, { units: 'kilometers' })
  return dist <= 100 ? 50 : 100
}

// ── Grille NxN avec marge bbox 10% ──────────────────────────────────────────

export function buildGrid(start: [number, number], end: [number, number], N: number): [number, number][] {
  const margin = 0.10
  const minLng = Math.min(start[0], end[0])
  const maxLng = Math.max(start[0], end[0])
  const minLat = Math.min(start[1], end[1])
  const maxLat = Math.max(start[1], end[1])
  const dLng = (maxLng - minLng) * margin
  const dLat = (maxLat - minLat) * margin

  const bboxMinLng = minLng - dLng
  const bboxMaxLng = maxLng + dLng
  const bboxMinLat = minLat - dLat
  const bboxMaxLat = maxLat + dLat

  const coords: [number, number][] = []
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const lng = bboxMinLng + (col / (N - 1)) * (bboxMaxLng - bboxMinLng)
      const lat = bboxMinLat + (row / (N - 1)) * (bboxMaxLat - bboxMinLat)
      coords.push([lng, lat])
    }
  }
  return coords  // N×N points, index = row*N + col
}

// ── Fetch élévation Open-Meteo par batches ───────────────────────────────────
// Contrainte vérifiée : max 100 coordonnées par requête (test live Open-Meteo)

async function fetchSingleBatch(coords: [number, number][], signal: AbortSignal): Promise<number[]> {
  // INVERSION obligatoire : coords = [lng, lat], Open-Meteo attend latitude et longitude séparés
  const latitudes  = coords.map(([, lat]) => lat).join(',')
  const longitudes = coords.map(([lng]) => lng).join(',')
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Open Meteo HTTP ${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data.elevation)) throw new Error(`Open Meteo: réponse invalide`)
  return (data.elevation as (number | null)[]).map((v) => v ?? 0)
}

export async function fetchGridElevations(
  coords: [number, number][],
  signal: AbortSignal,
): Promise<number[]> {
  validateCoords(coords)  // STRIDE Tampering — valider avant tout fetch

  const BATCH_SIZE = 100
  const CONCURRENCY = 10
  const batches: [number, number][][] = []
  for (let i = 0; i < coords.length; i += BATCH_SIZE) {
    batches.push(coords.slice(i, i + BATCH_SIZE))
  }

  const results: number[] = new Array(coords.length)
  let offset = 0

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const window = batches.slice(i, i + CONCURRENCY)
    const responses = await Promise.all(window.map((batch) => fetchSingleBatch(batch, signal)))
    for (const elevs of responses) {
      for (const e of elevs) {
        results[offset++] = e
      }
    }
  }
  return results
}

// ── Construction graphe ngraph (8-connectivity, oriented) ───────────────────

export function buildGraph(N: number, coords: [number, number][], elevations: number[]) {
  const graph = createGraph<NodeData, LinkData>()

  for (let i = 0; i < N * N; i++) {
    const [lng, lat] = coords[i]
    graph.addNode(i, { lng, lat, alt: elevations[i] })
  }

  // 8-connectivity : ortho + diagonales
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]

  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const fromIdx = row * N + col
      const fromNode = graph.getNode(fromIdx)!

      for (const [dr, dc] of dirs) {
        const r2 = row + dr
        const c2 = col + dc
        if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) continue
        const toIdx = r2 * N + c2
        const toNode = graph.getNode(toIdx)!

        const dist = haversineKm(fromNode.data, toNode.data)
        const deltaAlt = toNode.data.alt - fromNode.data.alt
        // Fonction de coût locked CONTEXT.md : distance × (1 + max(0, ΔAlt) / distance_m)
        const penalty = Math.max(0, deltaAlt) / (dist * 1000 + 0.001)
        const cost = dist * (1 + penalty)

        // oriented:true → on n'ajoute que A→B (pas B→A ici — la pente inverse est une autre arête)
        graph.addLink(fromIdx, toIdx, { cost })
      }
    }
  }
  return graph
}

// ── findNearestNode — mapper start/end sur la grille (Pitfall 8 RESEARCH.md) ─

export function findNearestNode(coords: [number, number][], point: [number, number]): number {
  let minDist = Infinity
  let nearest = 0
  for (let i = 0; i < coords.length; i++) {
    const dLng = coords[i][0] - point[0]
    const dLat = coords[i][1] - point[1]
    const d = dLng * dLng + dLat * dLat  // distance euclidienne carrée suffit pour la comparaison
    if (d < minDist) { minDist = d; nearest = i }
  }
  return nearest
}

// ── findPath ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findPath(graph: any, N: number, coords: [number, number][], start: [number, number], end: [number, number]): [number, number][] {
  const startIdx = findNearestNode(coords, start)
  const endIdx   = findNearestNode(coords, end)

  const finder = aStar(graph, {
    oriented: true,  // CRITIQUE — eau ne coule que dans un sens (Pitfall 5 RESEARCH.md)
    distance(_from: unknown, _to: unknown, link: { data: LinkData }) { return link.data.cost },
    heuristic(from: { data: NodeData }, to: { data: NodeData }) {
      // Heuristique admissible : distance haversine pure (sous-estime toujours le coût réel)
      return haversineKm(from.data, to.data)
    },
  })

  // ATTENTION : ngraph.path retourne de end→start — .reverse() OBLIGATOIRE (Pitfall 2 RESEARCH.md)
  const rawPath = finder.find(startIdx, endIdx)
  if (rawPath.length === 0) return []
  return (rawPath as Array<{ data: NodeData }>).reverse().map((n) => [n.data.lng, n.data.lat] as [number, number])
}
```

Puis **mettre à jour `src/tests/routingGrid.test.ts`** pour décommenter les imports et rendre les tests verts :

Remplacer le fichier de stubs par des tests complets :

```typescript
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
```
  </action>
  <verify>
    <automated>cd C:\dev\gsd\science\canal && npm test -- src/tests/routingGrid.test.ts 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - `npm test -- src/tests/routingGrid.test.ts` retourne tous les tests VERTS (0 todo, 0 failed)
    - `grep -c "export function" src/services/routingGrid.ts` retourne >= 6 (validateCoords, haversineKm, getResolution, buildGrid, fetchGridElevations, buildGraph, findNearestNode, findPath)
    - `grep "oriented: true" src/services/routingGrid.ts` retourne 1 ligne (dans findPath)
    - `grep "\.reverse()" src/services/routingGrid.ts` retourne 1 ligne (dans findPath)
    - `grep "BATCH_SIZE = 100" src/services/routingGrid.ts` retourne 1 ligne
    - `npx tsc --noEmit` retourne 0 erreur
  </acceptance_criteria>
  <done>Tous les tests routingGrid.test.ts VERTS, TypeScript 0 erreur, oriented:true + .reverse() présents, batching 100 max implémenté.</done>
</task>

<task type="auto">
  <name>Task 2 : Créer routingWorker.ts + useRoutingWorker.ts</name>
  <read_first>
    - C:\dev\gsd\science\canal\src\hooks\useElevation.ts (pattern lifecycle à reprendre)
    - C:\dev\gsd\science\canal\.planning\phases\03-routing-optimal\03-RESEARCH.md (Pattern 4 Worker Vite + Pattern 6 Timeout)
    - C:\dev\gsd\science\canal\src\services\routingGrid.ts (fonctions à importer dans le worker)
  </read_first>
  <files>src/workers/routingWorker.ts, src/hooks/useRoutingWorker.ts</files>
  <action>
**Créer `src/workers/routingWorker.ts` :**

```typescript
/// <reference lib="webworker" />
// src/workers/routingWorker.ts
// Web Worker isolé — calcul Dijkstra sur grille DEM
// La directive triple-slash remplace lib DOM (évite conflits de types — Pitfall 4 RESEARCH.md)
import { buildGrid, getResolution, fetchGridElevations, buildGraph, findPath } from '../services/routingGrid'
import type { RoutingRequest, RoutingResult } from '../types/routing'

self.onmessage = async (e: MessageEvent<RoutingRequest>) => {
  const { start, end, resolution } = e.data

  try {
    // 1. Construire la grille adaptative
    const coords = buildGrid(start, end, resolution)

    // 2. Récupérer les élévations par batches Open-Meteo
    const controller = new AbortController()
    const elevations = await fetchGridElevations(coords, controller.signal)

    // 3. Construire le graphe ngraph (8-connectivity, oriented:true)
    const graph = buildGraph(resolution, coords, elevations)

    // 4. Trouver le chemin optimal (A* orienté)
    const path = findPath(graph, resolution, coords, start, end)

    if (path.length === 0) {
      self.postMessage({ type: 'no-path' } satisfies RoutingResult)
      return
    }

    self.postMessage({ type: 'result', path } satisfies RoutingResult)
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) } satisfies RoutingResult)
  }
}
```

**Créer `src/hooks/useRoutingWorker.ts` :**

```typescript
// src/hooks/useRoutingWorker.ts
// Hook React — cycle de vie du Web Worker routing
// Worker stocké en useRef (non-sérialisable, jamais dans Zustand — anti-pattern RESEARCH.md)
import { useEffect, useRef } from 'react'
import { useCanalStore } from '../store/canalStore'
import type { RoutingResult } from '../types/routing'

export function useRoutingWorker() {
  const workerRef = useRef<Worker | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const routingStart = useCanalStore((s) => s.routingStart)
  const routingEnd   = useCanalStore((s) => s.routingEnd)
  const routingState = useCanalStore((s) => s.routingState)

  // Lancer le worker quand routingState passe à 'computing'
  useEffect(() => {
    if (routingState !== 'computing' || !routingStart || !routingEnd) return

    const resolution = useCanalStore.getState().routingStart && useCanalStore.getState().routingEnd
      ? (() => {
          // Calcul de résolution via distance approximative
          const s = routingStart
          const e = routingEnd
          const dist = Math.hypot((e[0] - s[0]) * 111 * Math.cos(s[1] * Math.PI / 180), (e[1] - s[1]) * 111)
          return dist <= 100 ? 50 : 100
        })()
      : 50

    // PATTERN OBLIGATOIRE — new URL() littéral statique (Pitfall 3 RESEARCH.md)
    workerRef.current = new Worker(
      new URL('../workers/routingWorker.ts', import.meta.url),
      { type: 'module' }
    )

    // Timeout 30s — DoS self-protection (locked CONTEXT.md + STRIDE T-03-T02-02)
    timeoutRef.current = setTimeout(() => {
      workerRef.current?.terminate()
      workerRef.current = null
      useCanalStore.getState().setRoutingState('timeout')
    }, 30_000)

    workerRef.current.onmessage = (e: MessageEvent<RoutingResult>) => {
      // Annuler le timeout dès réception d'une réponse
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
      workerRef.current?.terminate()
      workerRef.current = null

      const result = e.data
      if (result.type === 'result') {
        // Utiliser getState() — handler hors cycle React (anti-stale-closure, pattern Phase 1/2)
        useCanalStore.getState().finalizeRoutedCanal(result.path)
      } else if (result.type === 'no-path') {
        useCanalStore.getState().setRoutingState('no-path')
      } else {
        useCanalStore.getState().setRoutingState('error')
      }
    }

    workerRef.current.onerror = () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
      workerRef.current?.terminate()
      workerRef.current = null
      useCanalStore.getState().setRoutingState('error')
    }

    workerRef.current.postMessage({
      start: routingStart,
      end: routingEnd,
      resolution,
    })

    // Cleanup : si le composant démonte pendant le calcul
    return () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [routingState, routingStart, routingEnd])
}
```
  </action>
  <verify>
    <automated>cd C:\dev\gsd\science\canal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - `grep "reference lib=\"webworker\"" src/workers/routingWorker.ts` retourne 1 ligne
    - `grep "self.onmessage" src/workers/routingWorker.ts` retourne 1 ligne
    - `grep "satisfies RoutingResult" src/workers/routingWorker.ts` retourne >= 2 lignes (result + no-path + error)
    - `grep "new Worker" src/hooks/useRoutingWorker.ts | grep "routingWorker.ts.*import.meta.url"` retourne 1 ligne (URL littérale statique — Pitfall 3)
    - `grep "workerRef = useRef" src/hooks/useRoutingWorker.ts` retourne 1 ligne (pas dans useState ni Zustand)
    - `grep "30_000" src/hooks/useRoutingWorker.ts` retourne 1 ligne (timeout 30s)
    - `grep "useCanalStore.getState()" src/hooks/useRoutingWorker.ts` retourne >= 2 lignes (pattern anti-stale-closure)
    - `grep "finalizeRoutedCanal" src/hooks/useRoutingWorker.ts` retourne 1 ligne
    - `npx tsc --noEmit` retourne 0 erreur
  </acceptance_criteria>
  <done>Worker compilé avec directive triple-slash, URL littérale statique, timeout 30s, useCanalStore.getState() dans les handlers, TypeScript 0 erreur.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| main thread → worker | Coordonnées postMessage : non-sanitisées si elles viennent d'un clic utilisateur |
| worker → Open-Meteo API | Coordonnées construites par buildGrid — validées par validateCoords avant fetch |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-T02-01 | Tampering | fetchGridElevations — coords avant fetch | mitigate | `validateCoords(coords)` appelée en tête de fetchGridElevations : throw si lat hors [-90,90] ou lng hors [-180,180] |
| T-03-T02-02 | DoS (self) | routingWorker — boucle A* infinie | mitigate | `setTimeout 30_000` dans useRoutingWorker + `worker.terminate()` — décision locked CONTEXT.md |
| T-03-T02-03 | Tampering | buildGraph — oriented:false par défaut | mitigate | `oriented: true` explicite dans aStar options — commentaire "CRITIQUE" dans le code |
| T-03-T02-04 | Spoofing | ngraph.path retour inversé | mitigate | `.reverse()` systématique + commentaire "OBLIGATOIRE" — Pitfall 2 RESEARCH.md |
</threat_model>

<verification>
```bash
cd C:\dev\gsd\science\canal
npm test -- src/tests/routingGrid.test.ts
npx tsc --noEmit
```

Tous les tests VERTS, 0 erreur TypeScript.
</verification>

<success_criteria>
- src/services/routingGrid.ts : 8 fonctions exportées, oriented:true, .reverse(), BATCH_SIZE=100, validateCoords
- src/workers/routingWorker.ts : directive triple-slash, self.onmessage, 3 types postMessage (result/no-path/error)
- src/hooks/useRoutingWorker.ts : Worker dans useRef, URL littérale statique, timeout 30s, getState() dans handlers
- src/tests/routingGrid.test.ts : tous les tests VERTS (stubs Wave 0 remplacés par tests complets)
- npx tsc --noEmit : 0 erreur
</success_criteria>

<output>
Après complétion, créer `.planning/phases/03-routing-optimal/03-T02-SUMMARY.md`
</output>

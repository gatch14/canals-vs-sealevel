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

  // IN-04 : clamp pour éviter des coordonnées hors bornes géographiques valides
  const bboxMinLng = Math.max(-180, minLng - dLng)
  const bboxMaxLng = Math.min(180, maxLng + dLng)
  const bboxMinLat = Math.max(-90, minLat - dLat)
  const bboxMaxLat = Math.min(90, maxLat + dLat)

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
  // URLSearchParams encode les valeurs — protège contre l'injection de paramètres (CR-03)
  const params = new URLSearchParams({
    latitude:  coords.map(([, lat]) => lat).join(','),
    longitude: coords.map(([lng]) => lng).join(','),
  })
  const url = `https://api.open-meteo.com/v1/elevation?${params}`
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
  const CONCURRENCY = 3
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
        const r2 = row + (dr ?? 0)
        const c2 = col + (dc ?? 0)
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
export function findPath(graph: ReturnType<typeof createGraph>, N: number, coords: [number, number][], start: [number, number], end: [number, number]): [number, number][] {
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

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

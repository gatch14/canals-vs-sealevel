// src/types/routing.ts
// Types du routing Dijkstra — Phase 3
export type { Coord } from './canal'  // Re-export pour éviter double définition

export type RoutingState =
  | 'idle'
  | 'selecting-start'
  | 'selecting-end'
  | 'computing'
  | 'timeout'
  | 'error'
  | 'no-path'

export interface RoutingRequest {
  start: [number, number]  // [lng, lat] — résolution adaptative
  end: [number, number]    // [lng, lat]
  resolution: 10 | 15    // N×N grid — ≤100km → 10 (1 batch), >100km → 15 (3 batches)
}

export type RoutingResult =
  | { type: 'result'; path: [number, number][] }  // chemin [lng,lat][] start→end
  | { type: 'no-path' }
  | { type: 'error'; message: string }

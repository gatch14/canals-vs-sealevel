// src/types/canal.ts
// Coordonnées toujours [lng, lat] WGS84 — JAMAIS [lat, lng] (Pitfall 10)
import type { ElevationProfile } from './elevation'

export type Coord = [number, number]  // [lng, lat]

export type UIMode = 'selection' | 'drawing' | 'routing'

export interface Canal {
  id: string             // crypto.randomUUID()
  points: Coord[]        // minimum 2 points pour finaliser
  name: string           // "Canal 1", "Canal 2", ...
  createdAt: number      // Date.now()
  elevation?: ElevationProfile  // Phase 2 — optionnel, rétrocompat Phase 1
  elevationLoading?: boolean    // Phase 2 — true pendant le fetch
  elevationError?: string       // Phase 2 — message d'erreur si fetch échoué
  isRouted?: boolean            // Phase 3 — canal généré par routing automatique
}

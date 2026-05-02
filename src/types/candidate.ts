// src/types/candidate.ts
// Type CanalCandidate — Phase 8 bibliothèque pré-calculée (IA-01, IA-02, IA-03)
// Toutes les valeurs ΔSL comme intervalles [min, max] — UX-01 locked
import type { Coord } from './canal'

export interface CanalCandidate {
  id: string           // slug unique, ex: "qattara-depression"
  name: string         // nom affiché, ex: "Dépression de Qattara"
  region: string       // région géographique, ex: "Afrique du Nord"
  dsl_min: number      // ΔSL minimum estimé (mm) — ΔSL = V/361,8 avec hypothèses conservatrices
  dsl_max: number      // ΔSL maximum estimé (mm) — hypothèses optimistes
  points: Coord[]      // tracé pré-calculé [lng, lat] WGS84, min 2 points
  feasible: boolean    // true si gravitairement réalisable (pas de montée >50m/km)
  cost_min: number     // coût minimum estimé (G€)
  cost_max: number     // coût maximum estimé (G€)
}

// Import du JSON statique — zéro appel réseau (contrainte absolue)
import rawCandidates from '../data/candidates.json'
export const CANDIDATES: readonly CanalCandidate[] = rawCandidates as CanalCandidate[]

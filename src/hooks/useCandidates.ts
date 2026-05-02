// src/hooks/useCandidates.ts
// Hook Phase 8 — retourne la bibliothèque de candidats triée par ΔSL décroissant (IA-01)
// Données statiques bundlées — zéro appel réseau (contrainte absolue projet)
import { CANDIDATES } from '../types/candidate'
import type { CanalCandidate } from '../types/candidate'

/**
 * Liste des 25 canaux candidats mondiaux triés par ΔSL max décroissant.
 * Pré-calculée une seule fois au chargement du module (constante statique).
 */
export const SORTED_CANDIDATES: readonly CanalCandidate[] = [...CANDIDATES].sort(
  (a, b) => b.dsl_max - a.dsl_max,
)

/**
 * Hook React retournant les 25 canaux candidats mondiaux triés par ΔSL max décroissant.
 * Retourne la référence stable SORTED_CANDIDATES (calculée une seule fois).
 */
export function useCandidates(): readonly CanalCandidate[] {
  return SORTED_CANDIDATES
}

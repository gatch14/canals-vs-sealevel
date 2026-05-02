// src/types/dashboard.ts
// Types et constantes du dashboard global Phase 6 — UX-01 strict (Interval partout)
import type { Interval } from './calculation'

// ─── Scénario de rétention d'eau (GLOB-02) ────────────────────────────────────

/** Un scénario de rétention : optimiste (100%), réaliste (60%), pessimiste (30%) */
export interface DashboardScenario {
  label:      string    // "Optimiste" | "Réaliste" | "Pessimiste"
  multiplier: number    // 1.0 / 0.6 / 0.3 — fraction du ΔSL brut retenu en mer
  deltaSLmm:  Interval  // cumulativeDeltaSLmm × multiplier — UX-01
}

// ─── Résultat agrégé du dashboard (GLOB-01 à GLOB-03) ────────────────────────

export interface DashboardResult {
  cumulativeDeltaSLmm: Interval  // somme des deltaSLmm de tous les canaux — GLOB-01
  scenarios: {
    optimistic:  DashboardScenario  // 100% rétention — GLOB-02
    realistic:   DashboardScenario  // 60% rétention — GLOB-02
    pessimistic: DashboardScenario  // 30% rétention — GLOB-02
  }
  totalCostMEur:      Interval  // somme des costMEur de tous les canaux — GLOB-03
  canalsWithProfile:  number    // canaux ayant un profil d'élévation chargé
  totalCanals:        number    // nombre total de canaux
}

// ─── Constante IPCC (GLOB-03) ─────────────────────────────────────────────────

/** Hausse IPCC AR6 2021 — RCP2.6 (300mm) à RCP8.5 (1000mm) — horizon 2100 */
export const IPCC_2100_RANGE_MM: Interval = [300, 1000]

// src/lib/dashboardEngine.ts
// Moteur dashboard global Phase 6 — pur TypeScript, sans React, sans Zustand.
// Pattern calculationEngine.ts : module pur, testable sans DOM.
// Wave 1 (T02) : implémentation complète — tous les tests GREEN.
import type { Canal } from '../types/canal'
import type { CalcParams, Interval } from '../types/calculation'
import type { DashboardResult, DashboardScenario } from '../types/dashboard'
import { computeCalculation, addIntervals } from './calculationEngine'

// ─── GLOB-01 : ΔSL cumulé (somme de tous les canaux avec profil) ──────────────

export function computeCumulativeDeltaSL(
  canals: Canal[],
  calcParams: CalcParams,
): Interval {
  let acc: Interval = [0, 0]
  for (const canal of canals) {
    const result = computeCalculation(
      canal,
      canal.elevation ?? null,
      calcParams.width,
      calcParams.depth,
    )
    if (result !== null) {
      acc = addIntervals(acc, result.deltaSLmm)
    }
  }
  return acc
}

// ─── GLOB-02 : Trois scénarios de rétention ───────────────────────────────────

export function computeScenarios(cumulativeDeltaSL: Interval): {
  optimistic:  DashboardScenario
  realistic:   DashboardScenario
  pessimistic: DashboardScenario
} {
  function applyMultiplier(base: Interval, multiplier: number): Interval {
    return [base[0] * multiplier, base[1] * multiplier]
  }

  return {
    optimistic: {
      label:      'Optimiste',
      multiplier: 1.0,
      deltaSLmm:  applyMultiplier(cumulativeDeltaSL, 1.0),
    },
    realistic: {
      label:      'Réaliste',
      multiplier: 0.6,
      deltaSLmm:  applyMultiplier(cumulativeDeltaSL, 0.6),
    },
    pessimistic: {
      label:      'Pessimiste',
      multiplier: 0.3,
      deltaSLmm:  applyMultiplier(cumulativeDeltaSL, 0.3),
    },
  }
}

// ─── GLOB-03 : Coût total cumulé ──────────────────────────────────────────────

export function computeCumulativeCost(
  canals: Canal[],
  calcParams: CalcParams,
): Interval {
  let acc: Interval = [0, 0]
  for (const canal of canals) {
    const result = computeCalculation(
      canal,
      canal.elevation ?? null,
      calcParams.width,
      calcParams.depth,
    )
    if (result !== null) {
      acc = addIntervals(acc, result.costMEur)
    }
  }
  return acc
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

export function computeDashboardResult(
  canals: Canal[],
  calcParams: CalcParams,
): DashboardResult | null {
  // Guard : aucun canal
  if (canals.length === 0) return null

  // Compter les canaux qui ont un résultat calculable
  let canalsWithProfile = 0
  for (const canal of canals) {
    const result = computeCalculation(
      canal,
      canal.elevation ?? null,
      calcParams.width,
      calcParams.depth,
    )
    if (result !== null) canalsWithProfile++
  }

  // Guard : aucun canal avec profil chargé
  if (canalsWithProfile === 0) return null

  // Calculs agrégés
  const cumulativeDeltaSLmm = computeCumulativeDeltaSL(canals, calcParams)
  const scenarios            = computeScenarios(cumulativeDeltaSLmm)
  const totalCostMEur        = computeCumulativeCost(canals, calcParams)

  return {
    cumulativeDeltaSLmm,
    scenarios,
    totalCostMEur,
    canalsWithProfile,
    totalCanals: canals.length,
  }
}

---
phase: 06-dashboard-global
plan: T02
type: tdd
wave: 2
depends_on: [T01]
files_modified:
  - src/lib/dashboardEngine.ts
autonomous: true
requirements:
  - GLOB-01
  - GLOB-02
  - GLOB-03

must_haves:
  truths:
    - "computeCumulativeDeltaSL somme les deltaSLmm via addIntervals — ignore les canaux sans profil"
    - "computeScenarios multiplie les deux bornes de l'Interval par le multiplicateur (1.0, 0.6, 0.3)"
    - "computeCumulativeCost somme les costMEur via addIntervals — ignore les canaux sans profil"
    - "computeDashboardResult orchestre les 3 fonctions et retourne null si aucun canal n'a de profil"
    - "npm test -- dashboardEngine passe en GREEN (9+/9+ tests)"
  artifacts:
    - path: "src/lib/dashboardEngine.ts"
      provides: "Moteur dashboard complet — implémentation GREEN"
      exports: ["computeCumulativeDeltaSL", "computeScenarios", "computeCumulativeCost", "computeDashboardResult"]
  key_links:
    - from: "src/lib/dashboardEngine.ts"
      to: "src/lib/calculationEngine.ts"
      via: "import computeCalculation, addIntervals"
      pattern: "import.*computeCalculation.*addIntervals.*from.*calculationEngine"
    - from: "computeDashboardResult"
      to: "computeCalculation"
      via: "appel par canal avec canal.elevation ?? null"
      pattern: "computeCalculation\\(canal, canal\\.elevation"
    - from: "computeScenarios"
      to: "Interval arithmetic"
      via: "multiplication des bornes [min*mult, max*mult]"
      pattern: "cumulativeDeltaSL\\[0\\].*multiplier"
---

<objective>
Wave 1 TDD GREEN: Implémenter dashboardEngine.ts en totalité pour que tous les tests de T01 passent. Chaque fonction suit exactement les patterns de calculationEngine.ts — module pur, pas de React, pas de Zustand.

Purpose: Moteur d'agrégation global (aucun React, aucun Zustand, aucun fetch réseau) — testable, réutilisable.
Output: src/lib/dashboardEngine.ts complet — npm test -- dashboardEngine → toutes GREEN.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/06-dashboard-global/06-CONTEXT.md
@.planning/phases/06-dashboard-global/06-T01-SUMMARY.md

<interfaces>
<!-- Contrats établis dans T01 -->

From src/types/dashboard.ts:
```typescript
import type { Interval } from './calculation'

export interface DashboardScenario {
  label:      string
  multiplier: number    // 1.0 / 0.6 / 0.3
  deltaSLmm:  Interval
}

export interface DashboardResult {
  cumulativeDeltaSLmm: Interval
  scenarios: {
    optimistic:  DashboardScenario
    realistic:   DashboardScenario
    pessimistic: DashboardScenario
  }
  totalCostMEur:     Interval
  canalsWithProfile: number
  totalCanals:       number
}

export const IPCC_2100_RANGE_MM: Interval = [300, 1000]
```

From src/lib/calculationEngine.ts (fonctions à réutiliser):
```typescript
export function addIntervals(a: Interval, b: Interval): Interval  // [a[0]+b[0], a[1]+b[1]]

export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null
```

From src/types/calculation.ts:
```typescript
export interface CalcParams {
  width: number   // m
  depth: number   // m
}
```

From src/types/canal.ts:
```typescript
export interface Canal {
  id: string
  points: Coord[]
  elevation?: ElevationProfile  // undefined si pas encore chargé
}
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Implémenter dashboardEngine.ts complet — GREEN</name>
  <files>src/lib/dashboardEngine.ts</files>
  <read_first>
    - src/tests/dashboardEngine.test.ts — lire TOUS les cas de test pour comprendre le comportement exact attendu
    - src/lib/calculationEngine.ts — voir addIntervals, computeCalculation (signatures exactes)
    - src/types/dashboard.ts — DashboardResult, DashboardScenario (contrats de T01)
    - src/types/calculation.ts — Interval, CalcParams, CalculationResult
  </read_first>
  <behavior>
    computeCumulativeDeltaSL(canals, calcParams):
    - Initialise accumulator: [0, 0]
    - Pour chaque canal : appelle computeCalculation(canal, canal.elevation ?? null, calcParams.width, calcParams.depth)
    - Si result non-null : accumulator = addIntervals(accumulator, result.deltaSLmm)
    - Si result null (pas de profil / points < 2 / dimensions invalides) : ignore le canal
    - Retourne accumulator

    computeScenarios(cumulativeDeltaSL):
    - Optimiste  : multiplier=1.0, deltaSLmm = [cumulativeDeltaSL[0]*1.0, cumulativeDeltaSL[1]*1.0]
    - Réaliste   : multiplier=0.6, deltaSLmm = [cumulativeDeltaSL[0]*0.6, cumulativeDeltaSL[1]*0.6]
    - Pessimiste : multiplier=0.3, deltaSLmm = [cumulativeDeltaSL[0]*0.3, cumulativeDeltaSL[1]*0.3]
    - Labels exacts (correspondent aux tests) : "Optimiste", "Réaliste", "Pessimiste"

    computeCumulativeCost(canals, calcParams):
    - Même pattern que computeCumulativeDeltaSL mais accumule result.costMEur au lieu de result.deltaSLmm
    - Initialise à [0, 0], ignore canaux sans résultat

    computeDashboardResult(canals, calcParams):
    - Guard : si canals.length === 0 → retourne null
    - Compte canalsWithProfile = canaux pour lesquels computeCalculation retourne non-null
    - Si canalsWithProfile === 0 → retourne null (aucun canal n'a de profil chargé)
    - Sinon : calcule cumulativeDeltaSLmm, scenarios, totalCostMEur
    - Retourne DashboardResult complet avec totalCanals = canals.length
  </behavior>
  <action>
Remplacer le contenu entier de `src/lib/dashboardEngine.ts` par l'implémentation complète.

Structure du fichier :

```typescript
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
  const scenarios           = computeScenarios(cumulativeDeltaSLmm)
  const totalCostMEur       = computeCumulativeCost(canals, calcParams)

  return {
    cumulativeDeltaSLmm,
    scenarios,
    totalCostMEur,
    canalsWithProfile,
    totalCanals: canals.length,
  }
}
```

Pièges à éviter :
- Ne PAS importer de React, Zustand, ou MapLibre dans ce fichier — module pur uniquement
- Ne PAS dupliquer addIntervals depuis calculationEngine.ts — importer directement
- Ne PAS appeler computeCalculation avec canal.elevation directement si undefined — utiliser `canal.elevation ?? null`
- Les multiplicateurs de scénarios sont sur les DEUX bornes de l'Interval : [min*mult, max*mult]
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npm test -- dashboardEngine 2>&1 | tail -30</automated>
  </verify>
  <acceptance_criteria>
    - npm test -- dashboardEngine → tous les tests GREEN (aucun FAIL)
    - npx tsc --noEmit → 0 erreur TypeScript
    - grep "import.*React\|import.*zustand\|import.*maplibre" src/lib/dashboardEngine.ts retourne 0 lignes (module pur)
    - grep "addIntervals" src/lib/dashboardEngine.ts retourne au moins 2 lignes (réutilisation depuis calculationEngine)
    - computeDashboardResult avec canal sans profil retourne null (guard vérifié par test "retourne null pour liste vide")
  </acceptance_criteria>
  <done>npm test -- dashboardEngine → toutes GREEN. npx tsc --noEmit → 0 erreur. dashboardEngine.ts ne contient aucun import React/Zustand.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| canals[] → computeCalculation | Coordonnées issues du store local — pas de réseau |
| Interval arithmetic | Multiplication des bornes — hypothèse bornes positives (volumes > 0) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-03 | Denial of Service | canal.points = [] ou invalides | mitigate | computeCalculation gère déjà le guard points.length < 2 — dashboardEngine hérite du guard |
| T-06-04 | Tampering | Interval avec valeurs négatives | accept | Domaine physique (volumes, coûts) ne produit pas de valeurs négatives — hors scope |
| T-06-05 | Information Disclosure | — | accept | App locale, pas de données sensibles, pas de réseau |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# Tous les tests GREEN
npm test -- dashboardEngine
# TypeScript compile — projet complet
npx tsc --noEmit
```
</verification>

<success_criteria>
- npm test -- dashboardEngine → toutes GREEN
- npx tsc --noEmit → 0 erreur
- computeDashboardResult([canal_sans_profil], params) retourne null
- computeDashboardResult([canal_avec_profil], params) retourne DashboardResult non-null
- computeScenarios([0.5, 0.6]).realistic.deltaSLmm ≈ [0.3, 0.36]
- computeScenarios([0.5, 0.6]).pessimistic.deltaSLmm ≈ [0.15, 0.18]
</success_criteria>

<output>
After completion, create `.planning/phases/06-dashboard-global/06-T02-SUMMARY.md`
</output>

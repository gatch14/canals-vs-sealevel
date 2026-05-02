---
phase: 06-dashboard-global
plan: T01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/types/dashboard.ts
  - src/lib/dashboardEngine.ts
  - src/tests/dashboardEngine.test.ts
autonomous: true
requirements:
  - GLOB-01
  - GLOB-02
  - GLOB-03

must_haves:
  truths:
    - "src/types/dashboard.ts exporte DashboardScenario, DashboardResult, IPCC_2100_RANGE_MM"
    - "IPCC_2100_RANGE_MM est de type Interval et vaut [300, 1000]"
    - "src/lib/dashboardEngine.ts compile et exporte les 4 fonctions (stubs retournant null/0)"
    - "src/tests/dashboardEngine.test.ts définit au moins 9 cas — tous ROUGE (assertions échouent)"
    - "npm test -- dashboardEngine lance les tests sans erreur de compilation"
  artifacts:
    - path: "src/types/dashboard.ts"
      provides: "Contrats de type pour le moteur dashboard + constante IPCC"
      exports: ["DashboardScenario", "DashboardResult", "IPCC_2100_RANGE_MM"]
    - path: "src/lib/dashboardEngine.ts"
      provides: "Stubs compilables — RED state pour TDD"
      exports: ["computeCumulativeDeltaSL", "computeScenarios", "computeCumulativeCost", "computeDashboardResult"]
    - path: "src/tests/dashboardEngine.test.ts"
      provides: "9+ tests unitaires définissant le contrat du moteur dashboard"
  key_links:
    - from: "src/types/dashboard.ts"
      to: "src/types/calculation.ts"
      via: "import type { Interval, CalculationResult, CalcParams }"
      pattern: "import.*Interval.*from.*calculation"
    - from: "src/lib/dashboardEngine.ts"
      to: "src/lib/calculationEngine.ts"
      via: "import computeCalculation"
      pattern: "import.*computeCalculation.*from.*calculationEngine"
    - from: "src/tests/dashboardEngine.test.ts"
      to: "src/lib/dashboardEngine.ts"
      via: "import des fonctions à tester"
      pattern: "import.*dashboardEngine"
---

<objective>
Wave 0 TDD: Poser les contrats de type, la constante IPCC, et les stubs du moteur dashboard. Les tests doivent passer en ROUGE — ils définissent le comportement attendu pour T02.

Purpose: Établir le contrat avant l'implémentation. T02 reçoit des tests précis à rendre verts, pas une spécification à interpréter.
Output: dashboard.ts (types + IPCC_2100_RANGE_MM), dashboardEngine.ts (stubs compilables), dashboardEngine.test.ts (9+ cas RED).
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/06-dashboard-global/06-CONTEXT.md
@.planning/phases/06-dashboard-global/06-UI-SPEC.md

<interfaces>
<!-- Types existants dont dashboard.ts dépend -->

From src/types/calculation.ts:
```typescript
export type Interval = [number, number]  // [min, max] — UX-01 strict

export interface CalculationResult {
  lengthKm:         Interval
  volumeKm3:        Interval
  deltaSLmm:        Interval
  costMEur:         Interval
  ipccPercent:      Interval
  terrainBreakdown: TerrainBreakdown
}

export interface CalcParams {
  width: number   // m — défaut 50
  depth: number   // m — défaut 5
}
```

From src/types/canal.ts:
```typescript
export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  elevation?: ElevationProfile
  elevationLoading?: boolean
  elevationError?: string
  isRouted?: boolean
}
```

From src/lib/calculationEngine.ts:
```typescript
export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null

export function addIntervals(a: Interval, b: Interval): Interval
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Types dashboard.ts — DashboardScenario, DashboardResult, IPCC_2100_RANGE_MM</name>
  <files>src/types/dashboard.ts</files>
  <read_first>
    - src/types/calculation.ts — pour réutiliser Interval, CalculationResult, CalcParams (ne pas redéfinir)
    - src/types/ecology.ts — voir le pattern d'import Interval depuis calculation.ts
  </read_first>
  <behavior>
    - DashboardScenario { label: string; multiplier: number; deltaSLmm: Interval }
    - DashboardResult { cumulativeDeltaSLmm: Interval; scenarios: { optimistic: DashboardScenario; realistic: DashboardScenario; pessimistic: DashboardScenario }; totalCostMEur: Interval; canalsWithProfile: number; totalCanals: number }
    - IPCC_2100_RANGE_MM: Interval = [300, 1000] — avec commentaire IPCC AR6 2021 RCP2.6–RCP8.5
    - Interval importé depuis '../types/calculation' (pas redéfini)
  </behavior>
  <action>
Créer `src/types/dashboard.ts` avec exactement les interfaces et constantes suivantes :

```typescript
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
```

Ne pas ajouter d'autres types ou constantes. Ne pas importer de types depuis canal.ts ou elevation.ts — uniquement depuis calculation.ts.
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -i "dashboard" || echo "No dashboard type errors"</automated>
  </verify>
  <acceptance_criteria>
    - dashboard.ts compile sans erreur TypeScript
    - grep -c "IPCC_2100_RANGE_MM" src/types/dashboard.ts retourne 2 (définition + export)
    - grep "300, 1000" src/types/dashboard.ts retourne la ligne de la constante
    - grep "import type.*Interval.*from.*calculation" src/types/dashboard.ts retourne 1 match
    - DashboardResult.scenarios contient les clés optimistic, realistic, pessimistic
  </acceptance_criteria>
  <done>dashboard.ts compile sans erreur ; IPCC_2100_RANGE_MM: Interval = [300, 1000] présent ; Interval importé depuis calculation.ts</done>
</task>

<task type="tdd">
  <name>Task 2: dashboardEngine.ts stubs (RED) + tests dashboardEngine.test.ts</name>
  <files>src/lib/dashboardEngine.ts, src/tests/dashboardEngine.test.ts</files>
  <read_first>
    - src/types/dashboard.ts — contrats de type créés dans Task 1
    - src/lib/calculationEngine.ts — voir le pattern des stubs et les fonctions à réutiliser (addIntervals)
    - src/tests/ecologyEngine.test.ts — voir le pattern de structure de tests RED Wave 0 avec fixtures inline
    - src/lib/ecologyEngine.ts — voir le pattern des stubs (retournent null/false/0)
  </read_first>
  <behavior>
    - dashboardEngine.ts compile, exporte les 4 fonctions, toutes retournent null/0/valeurs vides (stubs RED)
    - computeCumulativeDeltaSL(_canals, _calcParams) retourne [0, 0]
    - computeScenarios(_cumulativeDeltaSL) retourne { optimistic: ..., realistic: ..., pessimistic: ... } avec deltaSLmm [0,0] pour chaque scénario
    - computeCumulativeCost(_canals, _calcParams) retourne [0, 0]
    - computeDashboardResult(_canals, _calcParams) retourne null
    - dashboardEngine.test.ts importe les fonctions et définit 9+ cas — tous échouent (RED state attendu)
    - La commande `npm test -- dashboardEngine` doit lancer les tests et tous échouer (assertions)
  </behavior>
  <action>
1. Créer `src/lib/dashboardEngine.ts` — stubs compilables (pas d'implémentation) :

```typescript
// src/lib/dashboardEngine.ts
// Moteur dashboard global Phase 6 — pur TypeScript, sans React, sans Zustand.
// Wave 0 — stubs RED pour TDD. Implémentation complète dans T02.
import type { Canal } from '../types/canal'
import type { CalcParams, Interval } from '../types/calculation'
import type { DashboardResult } from '../types/dashboard'

/** GLOB-01 : Somme des deltaSLmm de tous les canaux ayant un profil d'élévation */
export function computeCumulativeDeltaSL(
  _canals: Canal[],
  _calcParams: CalcParams,
): Interval {
  return [0, 0]  // RED: retourne toujours [0, 0]
}

/** GLOB-02 : Trois scénarios de rétention (optimiste 1.0, réaliste 0.6, pessimiste 0.3) */
export function computeScenarios(cumulativeDeltaSL: Interval): {
  optimistic:  { label: string; multiplier: number; deltaSLmm: Interval }
  realistic:   { label: string; multiplier: number; deltaSLmm: Interval }
  pessimistic: { label: string; multiplier: number; deltaSLmm: Interval }
} {
  // RED: retourne des intervals [0,0] au lieu de cumulativeDeltaSL × multiplier
  void cumulativeDeltaSL
  return {
    optimistic:  { label: 'Optimiste',  multiplier: 1.0, deltaSLmm: [0, 0] },
    realistic:   { label: 'Réaliste',   multiplier: 0.6, deltaSLmm: [0, 0] },
    pessimistic: { label: 'Pessimiste', multiplier: 0.3, deltaSLmm: [0, 0] },
  }
}

/** GLOB-03 : Somme des costMEur de tous les canaux ayant un profil d'élévation */
export function computeCumulativeCost(
  _canals: Canal[],
  _calcParams: CalcParams,
): Interval {
  return [0, 0]  // RED: retourne toujours [0, 0]
}

/** Orchestrateur principal — agrège GLOB-01, GLOB-02, GLOB-03 */
export function computeDashboardResult(
  _canals: Canal[],
  _calcParams: CalcParams,
): DashboardResult | null {
  return null  // RED
}
```

2. Créer `src/tests/dashboardEngine.test.ts` avec fixtures inline et 9+ cas :

```typescript
// src/tests/dashboardEngine.test.ts
// Wave 0 — tous les tests doivent ÉCHOUER (RED state).
// T02 les fera passer (GREEN).
import { describe, it, expect } from 'vitest'
import {
  computeCumulativeDeltaSL,
  computeScenarios,
  computeCumulativeCost,
  computeDashboardResult,
} from '../lib/dashboardEngine'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'
import { IPCC_2100_RANGE_MM } from '../types/dashboard'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CALC_PARAMS: CalcParams = { width: 50, depth: 5 }

// Canal avec profil d'élévation simulé (points France → Espagne ~700km)
const CANAL_WITH_PROFILE: Canal = {
  id: 'c1',
  name: 'Canal test avec profil',
  createdAt: 0,
  points: [[-1.5, 47.2], [2.3, 48.8], [8.0, 45.0]],
  elevation: {
    canalId: 'c1',
    points: [
      { distance: 0, altitude: 50 },
      { distance: 350, altitude: 120 },
      { distance: 700, altitude: 80 },
    ],
    isFullyGravity: true,
    uphillSegments: [],
    fetchedAt: Date.now(),
  },
}

// Canal sans profil d'élévation
const CANAL_NO_PROFILE: Canal = {
  id: 'c2',
  name: 'Canal sans profil',
  createdAt: 0,
  points: [[0, 0], [10, 0]],
}

// Canal avec < 2 points
const CANAL_INVALID: Canal = {
  id: 'c3',
  name: 'Canal invalide',
  createdAt: 0,
  points: [[0, 0]],
}

const EMPTY_CANALS: Canal[] = []
const CANALS_WITH_ONE_PROFILE: Canal[] = [CANAL_WITH_PROFILE, CANAL_NO_PROFILE]

// ─── Tests IPCC_2100_RANGE_MM ─────────────────────────────────────────────────

describe('IPCC_2100_RANGE_MM (constante GLOB-03)', () => {
  it('vaut [300, 1000]', () => {
    expect(IPCC_2100_RANGE_MM).toEqual([300, 1000])
  })

  it('est un Interval (tuple de 2 nombres)', () => {
    expect(IPCC_2100_RANGE_MM).toHaveLength(2)
    expect(typeof IPCC_2100_RANGE_MM[0]).toBe('number')
    expect(typeof IPCC_2100_RANGE_MM[1]).toBe('number')
  })
})

// ─── Tests GLOB-01 computeCumulativeDeltaSL ───────────────────────────────────

describe('computeCumulativeDeltaSL (GLOB-01)', () => {
  it('retourne [0, 0] pour liste vide', () => {
    const result = computeCumulativeDeltaSL(EMPTY_CANALS, CALC_PARAMS)
    expect(result).toEqual([0, 0])
  })

  it('retourne Interval > [0,0] quand au moins un canal a un profil', () => {
    const result = computeCumulativeDeltaSL(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('ignore les canaux sans profil d\'élévation', () => {
    const withProfile = computeCumulativeDeltaSL([CANAL_WITH_PROFILE], CALC_PARAMS)
    const withProfileAndExtra = computeCumulativeDeltaSL(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    // Canal sans profil ne doit pas changer le résultat
    expect(withProfile).toEqual(withProfileAndExtra)
  })
})

// ─── Tests GLOB-02 computeScenarios ──────────────────────────────────────────

describe('computeScenarios (GLOB-02)', () => {
  it('optimiste = cumulativeDeltaSL × 1.0 (identique)', () => {
    const base: [number, number] = [0.5, 0.6]
    const { optimistic } = computeScenarios(base)
    expect(optimistic.deltaSLmm[0]).toBeCloseTo(0.5, 5)
    expect(optimistic.deltaSLmm[1]).toBeCloseTo(0.6, 5)
  })

  it('réaliste = cumulativeDeltaSL × 0.6', () => {
    const base: [number, number] = [0.5, 0.6]
    const { realistic } = computeScenarios(base)
    expect(realistic.deltaSLmm[0]).toBeCloseTo(0.3, 5)
    expect(realistic.deltaSLmm[1]).toBeCloseTo(0.36, 5)
  })

  it('pessimiste = cumulativeDeltaSL × 0.3', () => {
    const base: [number, number] = [0.5, 0.6]
    const { pessimistic } = computeScenarios(base)
    expect(pessimistic.deltaSLmm[0]).toBeCloseTo(0.15, 5)
    expect(pessimistic.deltaSLmm[1]).toBeCloseTo(0.18, 5)
  })
})

// ─── Tests GLOB-03 computeDashboardResult ────────────────────────────────────

describe('computeDashboardResult (GLOB-03)', () => {
  it('retourne null pour liste vide', () => {
    expect(computeDashboardResult(EMPTY_CANALS, CALC_PARAMS)).toBeNull()
  })

  it('retourne DashboardResult non-null pour un canal avec profil', () => {
    const result = computeDashboardResult([CANAL_WITH_PROFILE], CALC_PARAMS)
    expect(result).not.toBeNull()
  })

  it('DashboardResult.totalCanals = nombre de canaux passés', () => {
    const result = computeDashboardResult(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    expect(result?.totalCanals).toBe(2)
  })

  it('DashboardResult.canalsWithProfile = nombre de canaux avec elevation', () => {
    const result = computeDashboardResult(CANALS_WITH_ONE_PROFILE, CALC_PARAMS)
    expect(result?.canalsWithProfile).toBe(1)
  })
})
```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npm test -- dashboardEngine 2>&1 | tail -30</automated>
  </verify>
  <acceptance_criteria>
    - npx tsc --noEmit ne produit aucune erreur sur les 3 nouveaux fichiers
    - npm test -- dashboardEngine lance les tests (pas d'erreur de compilation/import)
    - Les tests IPCC_2100_RANGE_MM passent en GREEN (ils testent la constante, pas les stubs)
    - Les tests computeCumulativeDeltaSL, computeScenarios, computeDashboardResult échouent (RED attendu — stubs retournent [0,0] et null)
    - grep -c "export function" src/lib/dashboardEngine.ts retourne 4
  </acceptance_criteria>
  <done>dashboardEngine.ts compile ; 9+ tests s'exécutent ; les tests de la constante IPCC passent ; les tests des fonctions métier échouent (RED) — aucune erreur de syntaxe/compilation</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| canals[] → dashboardEngine | Tableau de canaux issu du store Zustand — données locales non réseau |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-01 | Denial of Service | computeCumulativeDeltaSL avec canals vide | accept | Stub retourne [0,0] — guard à implémenter en T02 avec canal.points.length < 2 |
| T-06-02 | Tampering | canals provenant du store | accept | Données locales uniquement, pas de réseau, pas de vecteur d'attaque externe |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# TypeScript compile sans erreur
npx tsc --noEmit
# Tests lancent (IPCC passe, stubs échouent — RED attendu)
npm test -- dashboardEngine
# Fichiers existent
ls src/types/dashboard.ts src/lib/dashboardEngine.ts src/tests/dashboardEngine.test.ts
```
</verification>

<success_criteria>
- src/types/dashboard.ts exporte DashboardScenario, DashboardResult, IPCC_2100_RANGE_MM
- IPCC_2100_RANGE_MM: Interval = [300, 1000] avec commentaire IPCC AR6 2021
- src/lib/dashboardEngine.ts compile, exporte 4 fonctions, tous stubs
- src/tests/dashboardEngine.test.ts : tests de constante GREEN, tests métier RED
- npx tsc --noEmit → 0 erreur sur l'ensemble du projet
</success_criteria>

<output>
After completion, create `.planning/phases/06-dashboard-global/06-T01-SUMMARY.md`
</output>

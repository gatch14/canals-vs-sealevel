---
phase: 04
plan: 01
type: execute
wave: 0
depends_on: []
status: complete
completed_at: 2026-05-01
files_modified:
  - src/types/calculation.ts
  - src/lib/calculationEngine.ts
  - src/tests/calculationEngine.test.ts
autonomous: true
requirements: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, UX-01]
tags: [phase-04, calculation-engine, types, scaffolding, wave-0]

must_haves:
  truths:
    - "Le fichier src/types/calculation.ts existe et exporte Interval, CalculationResult, TerrainBreakdown, PartialImpactResult"
    - "Le fichier src/lib/calculationEngine.ts existe et exporte computeLengthInterval, computeVolume, computeDeltaSL, classifyTerrain, computeCost, computeIPCCPercent, computePartialImpact"
    - "Le fichier src/tests/calculationEngine.test.ts existe avec au moins un test RED par requirement CALC-*"
    - "npm test échoue de façon attendue (RED) car les fonctions sont des stubs"
    - "tsc --noEmit ne produit aucune erreur — toutes les signatures retournent Interval (jamais number nu)"
  artifacts:
    - path: "src/types/calculation.ts"
      provides: "Type definitions Interval/CalculationResult/TerrainBreakdown/PartialImpactResult"
      contains: "export type Interval"
      min_lines: 40
    - path: "src/lib/calculationEngine.ts"
      provides: "Stubs des fonctions du moteur de calcul (Wave 0)"
      exports: ["computeLengthInterval", "computeVolume", "computeDeltaSL", "classifyTerrain", "computeCost", "computeIPCCPercent", "computePartialImpact"]
      min_lines: 60
    - path: "src/tests/calculationEngine.test.ts"
      provides: "Tests RED couvrant CALC-01..CALC-05 + UX-01"
      contains: "describe"
      min_lines: 80
  key_links:
    - from: "src/lib/calculationEngine.ts"
      to: "src/types/calculation.ts"
      via: "import type { Interval, ... }"
      pattern: "from '\\.\\./types/calculation'"
    - from: "src/tests/calculationEngine.test.ts"
      to: "src/lib/calculationEngine.ts"
      via: "import des fonctions à tester"
      pattern: "from '\\.\\./lib/calculationEngine'"
---

<objective>
Créer les fondations Wave 0 du moteur de calcul Phase 4 : le fichier de types `calculation.ts`, les stubs du module pur `calculationEngine.ts`, et la suite de tests `calculationEngine.test.ts` couvrant CALC-01 à CALC-05 et UX-01. Cette plan ne livre AUCUNE logique métier — uniquement les contrats (types) et les attentes (tests RED) que T02 viendra satisfaire.

Purpose: Permettre à T02 d'implémenter contre des contrats fixés et à des tests existants (TDD). Garantit que UX-01 est vérifiable au type-system level (aucune fonction ne peut retourner un `number` nu — toujours `Interval`).

Output: 3 fichiers nouveaux. Tests RED qui passeront GREEN après T02. Aucun composant UI, aucune extension store.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-moteur-de-calcul/04-CONTEXT.md
@.planning/phases/04-moteur-de-calcul/04-RESEARCH.md
@.planning/phases/04-moteur-de-calcul/04-VALIDATION.md

@src/types/canal.ts
@src/types/elevation.ts
@src/store/canalStore.ts

<interfaces>
<!-- Types existants à RÉ-utiliser (ne pas redéfinir) — extraits du codebase -->

From src/types/canal.ts:
```typescript
export type Coord = [number, number]  // [lng, lat] WGS84

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

From src/types/elevation.ts:
```typescript
export interface ElevationPoint {
  distance: number  // km
  altitude: number  // m
}

export interface UphillSegment {
  distanceStart: number  // km
  distanceEnd:   number  // km
  altitudeGain:  number  // m
}

export interface ElevationProfile {
  points:          ElevationPoint[]
  uphillSegments:  UphillSegment[]
  totalUphillGain: number
  isFullyGravity:  boolean
  fetchedAt:       number
}
```

From src/store/canalStore.test.ts (pattern beforeEach reset):
```typescript
beforeEach(() => {
  useCanalStore.setState({
    canals: [], mode: 'selection', draftPoints: [], previewCoord: null,
    selectedCanalId: null, routingState: 'idle', routingStart: null, routingEnd: null,
  })
})
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Créer src/types/calculation.ts (types complets)</name>
  <read_first>
    - src/types/canal.ts (Coord)
    - src/types/elevation.ts (ElevationProfile, UphillSegment, ElevationPoint)
    - .planning/phases/04-moteur-de-calcul/04-RESEARCH.md (Pattern 1, 3, 4)
    - .planning/phases/04-moteur-de-calcul/04-CONTEXT.md (decisions section)
  </read_first>
  <behavior>
    - Type Interval défini comme tuple [number, number] représentant [min, max] strict
    - Type TerrainType = 'plain' | 'mixed' | 'mountain' (union literal)
    - Interface TerrainBreakdown avec champs plain, mixed, mountain (km), totalKm
    - Interface CalculationResult avec lengthKm, volumeKm3, deltaSLmm, costMEur, ipccPercent (tous Interval), terrainBreakdown
    - Interface PartialImpactResult avec reachableKm, stopCoord (Coord), volumeKm3, deltaSLmm, costMEur (Interval), percentOfFull (number)
    - Constantes exportées : OCEAN_AREA_DIVISOR = 361.8, IPCC_ANNUAL_RATE_MM = 4.5, COST_PER_KM (record TerrainType -> Interval), TERRAIN_THRESHOLDS (plain: 50, mixed: 200), DEFAULT_CALC_PARAMS = { width: 50, depth: 5 }
    - Interface CalcParams = { width: number; depth: number } pour le store
  </behavior>
  <action>
Créer le fichier `src/types/calculation.ts` avec EXACTEMENT le contenu suivant (adapter les commentaires si besoin, mais conserver les signatures et les valeurs des constantes — elles sont locked par CONTEXT.md / D-01..D-04) :

```typescript
// src/types/calculation.ts
// Types et constantes du moteur de calcul Phase 4 — UX-01 strict (Interval partout)
import type { Coord } from './canal'

// ─── Arithmétique d'intervalles ──────────────────────────────────────────────

/** Tuple [min, max] — toutes les valeurs numériques du moteur respectent UX-01 */
export type Interval = [number, number]

// ─── Classification terrain (CALC-03) ────────────────────────────────────────

export type TerrainType = 'plain' | 'mixed' | 'mountain'

export interface TerrainBreakdown {
  plain:    number  // km de plaine (pente < 50 m/km)
  mixed:    number  // km de mixte (pente 50–200 m/km)
  mountain: number  // km de montagne (pente > 200 m/km)
  totalKm:  number  // somme — devrait égaler la longueur totale du profil
}

// ─── Résultat principal du moteur (CALC-01 à CALC-04) ────────────────────────

export interface CalculationResult {
  lengthKm:          Interval         // ±1% turf.length() — UX-01
  volumeKm3:         Interval         // V = L × W × D / 1e9 — UX-01
  deltaSLmm:         Interval         // ΔSL = V / 361.8 — formule centrale — UX-01
  costMEur:          Interval         // somme par terrain — UX-01
  ipccPercent:       Interval         // ΔSL / 4.5 × 100 — UX-01
  terrainBreakdown:  TerrainBreakdown // décomposition affichée
}

// ─── Impact partiel (CALC-05) ────────────────────────────────────────────────

export interface PartialImpactResult {
  reachableKm:    number     // km jusqu'au premier obstacle (uphillSegments[0].distanceStart)
  stopCoord:      Coord      // [lng, lat] — via turf.along()
  lengthKm:       Interval   // longueur partielle ±2% — UX-01
  volumeKm3:      Interval   // UX-01
  deltaSLmm:      Interval   // UX-01
  costMEur:       Interval   // UX-01
  percentOfFull:  number     // (reachableKm / totalKm) × 100
}

// ─── Paramètres globaux du store (D-01) ──────────────────────────────────────

export interface CalcParams {
  width: number   // m — défaut 50 (D-01)
  depth: number   // m — défaut 5 (D-01)
}

// ─── Constantes locked (CONTEXT.md decisions) ────────────────────────────────

/** Surface des océans en millions de km² — formule ΔSL = V / 361.8 (non-négociable) */
export const OCEAN_AREA_DIVISOR = 361.8

/** Rythme IPCC montée des eaux (mm/an) = 100% pour CALC-04 */
export const IPCC_ANNUAL_RATE_MM = 4.5

/** Seuils de classification terrain en m/km (D-03) */
export const TERRAIN_THRESHOLDS = {
  plain: 50,   // pente < 50 m/km → plaine
  mixed: 200,  // pente 50–200 m/km → mixte ; > 200 → montagne
} as const

/** Coût en M€/km par type de terrain (D-03 — fourchettes locked) */
export const COST_PER_KM: Record<TerrainType, Interval> = {
  plain:    [1,   5],
  mixed:    [10,  50],
  mountain: [100, 500],
}

/** Paramètres de calcul par défaut (D-01) — affichés au mount du panel */
export const DEFAULT_CALC_PARAMS: CalcParams = {
  width: 50,
  depth: 5,
}

/** Tolérances d'ingénierie (RESEARCH.md Pattern 7 — A1 assumed) */
export const TOLERANCE = {
  length: 0.01,  // ±1% (turf geodesic)
  width:  0.05,  // ±5%
  depth:  0.10,  // ±10%
  partialLength: 0.02,  // ±2% (interpolation segment)
} as const
```

Importer `Coord` depuis `./canal` — ne PAS redéfinir le type. Les valeurs des constantes (361.8, 4.5, 50, 5, seuils 50/200, coûts par terrain) sont locked par CONTEXT.md — toute modification est interdite.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -E "^export (type|interface|const)" src/types/calculation.ts | grep -v "^#" | wc -l | awk '{ if ($1 < 10) { print "FAIL: pas assez d exports"; exit 1 } else print "OK exports="$1 }'</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "^export type Interval = \[number, number\]" src/types/calculation.ts` retourne 1
    - `grep -c "^export const OCEAN_AREA_DIVISOR = 361\.8" src/types/calculation.ts` retourne 1
    - `grep -c "^export const IPCC_ANNUAL_RATE_MM = 4\.5" src/types/calculation.ts` retourne 1
    - `grep -c "^export interface CalculationResult" src/types/calculation.ts` retourne 1
    - `grep -c "^export interface PartialImpactResult" src/types/calculation.ts` retourne 1
    - `grep -c "^export interface TerrainBreakdown" src/types/calculation.ts` retourne 1
    - `grep -c "^export interface CalcParams" src/types/calculation.ts` retourne 1
    - `grep -c "DEFAULT_CALC_PARAMS.*width: 50" src/types/calculation.ts` retourne 1
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>Le fichier types complet est créé, toutes les constantes locked sont présentes avec leurs valeurs exactes, tsc passe sans erreur.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Créer src/lib/calculationEngine.ts (stubs Wave 0)</name>
  <read_first>
    - src/types/calculation.ts (créé en Task 1)
    - src/types/canal.ts
    - src/types/elevation.ts
    - .planning/phases/04-moteur-de-calcul/04-RESEARCH.md (Patterns 1, 2, 3, 4)
  </read_first>
  <behavior>
    - Toutes les fonctions exportées avec leur signature finale (T02 implémente l'intérieur)
    - Chaque stub retourne une valeur "neutre" qui satisfait le type mais fait échouer les tests métier (sentinel)
    - Aucun import maplibre / react / zustand — module 100% pur (turf.js autorisé pour along/length/lineString)
  </behavior>
  <action>
Créer le fichier `src/lib/calculationEngine.ts` avec les stubs suivants. Importer les types depuis `../types/calculation`. Les implémentations réelles arrivent en T02 — Wave 0 livre uniquement les signatures + un corps minimaliste (sentinel `[0, 0]` ou `null`) qui fera échouer les tests RED de Task 3.

```typescript
// src/lib/calculationEngine.ts
// Moteur de calcul scientifique Phase 4 — pur TypeScript, sans React, sans Zustand.
// UX-01 strict : toutes les fonctions numériques retournent Interval (jamais number nu).
// Wave 0 : stubs uniquement. Wave 1 (T02) : implémentation complète + tests GREEN.
import { length, along, lineString } from '@turf/turf'
import type { Canal, Coord } from '../types/canal'
import type { ElevationProfile, ElevationPoint } from '../types/elevation'
import type {
  Interval,
  TerrainType,
  TerrainBreakdown,
  CalculationResult,
  PartialImpactResult,
} from '../types/calculation'
import {
  OCEAN_AREA_DIVISOR,
  IPCC_ANNUAL_RATE_MM,
  TERRAIN_THRESHOLDS,
  COST_PER_KM,
  TOLERANCE,
} from '../types/calculation'

// ─── Arithmétique d'intervalles (helpers internes — exportés pour testabilité) ─

export function mulIntervals(a: Interval, b: Interval): Interval {
  // STUB Wave 0 — implémenté en T02
  return [0, 0]
}

export function addIntervals(a: Interval, b: Interval): Interval {
  // STUB Wave 0
  return [0, 0]
}

export function divByConst(a: Interval, k: number): Interval {
  // STUB Wave 0
  return [0, 0]
}

// ─── CALC-01 : Longueur géodésique avec tolérance ────────────────────────────

export function computeLengthInterval(points: Coord[]): Interval {
  // STUB Wave 0 — Wave 1 : utiliser turf.length(lineString(points), {units:'kilometers'}) puis ±TOLERANCE.length
  return [0, 0]
}

// ─── CALC-01 : Volume (km³) propagé en intervalle ────────────────────────────

export function computeVolume(
  lengthKm: Interval,
  widthM: Interval,
  depthM: Interval,
): Interval {
  // STUB Wave 0 — Wave 1 : V = (L × 1000) × W × D / 1e9
  return [0, 0]
}

// ─── CALC-02 : ΔSL = V / 361.8 (formule centrale) ────────────────────────────

export function computeDeltaSL(volumeKm3: Interval): Interval {
  // STUB Wave 0 — Wave 1 : divByConst(volumeKm3, OCEAN_AREA_DIVISOR)
  return [0, 0]
}

// ─── CALC-03 : Classification terrain depuis profil élévation ────────────────

export function classifyTerrain(points: ElevationPoint[]): TerrainBreakdown {
  // STUB Wave 0 — Wave 1 : itérer sur les segments, calculer pente m/km, classer
  return { plain: 0, mixed: 0, mountain: 0, totalKm: 0 }
}

// ─── CALC-03 : Coût total en M€ depuis breakdown terrain ─────────────────────

export function computeCost(breakdown: TerrainBreakdown): Interval {
  // STUB Wave 0 — Wave 1 : somme pondérée par COST_PER_KM[type]
  return [0, 0]
}

// ─── CALC-04 : Pourcentage IPCC (ΔSL / 4.5 mm/an × 100) ──────────────────────

export function computeIPCCPercent(deltaSLmm: Interval): Interval {
  // STUB Wave 0 — Wave 1 : [deltaSLmm[0]/IPCC × 100, deltaSLmm[1]/IPCC × 100]
  return [0, 0]
}

// ─── Helpers d'incertitude sur les paramètres saisis ─────────────────────────

export function widthInterval(widthM: number): Interval {
  // STUB Wave 0 — Wave 1 : [w × (1-TOLERANCE.width), w × (1+TOLERANCE.width)]
  return [0, 0]
}

export function depthInterval(depthM: number): Interval {
  // STUB Wave 0 — Wave 1 : ±TOLERANCE.depth
  return [0, 0]
}

// ─── Orchestrateur principal — assemble CalculationResult ────────────────────

export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null {
  // STUB Wave 0 — Wave 1 : appelle toutes les fonctions ci-dessus, retourne CalculationResult complet
  // Garde : si profile null OU widthM<=0 OU depthM<=0 OU canal.points.length<2 → return null
  return null
}

// ─── CALC-05 : Impact partiel (canal stoppé au premier obstacle) ─────────────

export function computePartialImpact(
  canal: Canal,
  profile: ElevationProfile,
  widthM: number,
  depthM: number,
): PartialImpactResult | null {
  // STUB Wave 0 — Wave 1 :
  //   - Si profile.isFullyGravity OU uphillSegments.length === 0 → null
  //   - reachableKm = profile.uphillSegments[0].distanceStart
  //   - stopCoord = turf.along(lineString(canal.points), reachableKm, {units:'kilometers'}).geometry.coordinates as Coord
  //   - Clip terrainBreakdown aux X premiers km (Pitfall 4)
  //   - Calculer volume / deltaSL / cost partiels en propageant Interval
  return null
}
```

Notes :
- Importer `length, along, lineString` depuis `@turf/turf` même si non utilisés en Wave 0 — évite d'avoir à modifier les imports en T02.
- Conserver les commentaires `// STUB Wave 0` ET `// Wave 1 :` — ils servent de spec à T02.
- Aucune implémentation métier dans cette plan. T02 supprime les stubs et code la logique.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -E "^export function" src/lib/calculationEngine.ts | grep -v "^#" | wc -l | awk '{ if ($1 < 11) { print "FAIL: pas assez d exports — attendu 11+, eu "$1; exit 1 } else print "OK functions="$1 }'</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "^export function computeLengthInterval" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function computeVolume" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function computeDeltaSL" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function classifyTerrain" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function computeCost" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function computeIPCCPercent" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function computePartialImpact" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function computeCalculation" src/lib/calculationEngine.ts` retourne 1
    - `grep -cE "^import .* from '@turf/turf'" src/lib/calculationEngine.ts` retourne 1
    - `grep -cE "import .* from 'zustand'|from 'react'|from 'maplibre" src/lib/calculationEngine.ts` retourne 0 (module pur)
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>Stubs créés avec signatures complètes, retours sentinel, imports turf en place, aucun import React/Zustand/MapLibre, tsc passe.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Créer src/tests/calculationEngine.test.ts (tests RED Wave 0)</name>
  <read_first>
    - src/lib/calculationEngine.ts (créé en Task 2)
    - src/types/calculation.ts (créé en Task 1)
    - src/tests/elevationApi.test.ts (pattern fixture ElevationProfile)
    - src/tests/uphill.test.ts (pattern fixture uphillSegments)
    - .planning/phases/04-moteur-de-calcul/04-VALIDATION.md (table "Test Cases per REQ")
    - .planning/phases/04-moteur-de-calcul/04-RESEARCH.md (Phase Requirements -> Test Map)
  </read_first>
  <behavior>
    - describe block par requirement : CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, UX-01
    - Chaque test échoue (RED) car les stubs retournent [0,0] ou null
    - Fixtures locales : un mockProfile avec mix plaine/mixte/montagne, un mockProfileFullyGravity, un mockProfileWithUphills
    - Au moins 8 tests au total couvrant les cases du table VALIDATION.md
  </behavior>
  <action>
Créer `src/tests/calculationEngine.test.ts` avec la structure suivante. Les tests doivent ÉCHOUER (RED) en l'état actuel des stubs — c'est attendu et obligatoire pour Wave 0.

```typescript
// src/tests/calculationEngine.test.ts
// Tests Wave 0 — RED. Les stubs retournent [0,0] ou null, donc tous les tests échouent.
// T02 (Wave 1) implémente les fonctions et fait passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  computeLengthInterval,
  computeVolume,
  computeDeltaSL,
  classifyTerrain,
  computeCost,
  computeIPCCPercent,
  computePartialImpact,
  computeCalculation,
  widthInterval,
  depthInterval,
} from '../lib/calculationEngine'
import type { Coord } from '../types/canal'
import type { ElevationProfile, ElevationPoint } from '../types/elevation'
import type { Canal } from '../types/canal'
import { OCEAN_AREA_DIVISOR } from '../types/calculation'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockPoints: Coord[] = [
  [2.35, 48.85],   // Paris
  [3.0,  48.0],
  [4.5,  47.0],
  [5.0,  46.0],    // ~250 km canal très approximatif
]

function makeProfile(opts: {
  totalKm: number
  uphills?: Array<{ distanceStart: number; distanceEnd: number; altitudeGain: number }>
  pointsByKm?: Array<{ distance: number; altitude: number }>
}): ElevationProfile {
  return {
    points: opts.pointsByKm ?? [
      { distance: 0,            altitude: 0 },
      { distance: opts.totalKm, altitude: 0 },
    ],
    uphillSegments: opts.uphills ?? [],
    totalUphillGain: (opts.uphills ?? []).reduce((s, u) => s + u.altitudeGain, 0),
    isFullyGravity: (opts.uphills ?? []).length === 0,
    fetchedAt: Date.now(),
  }
}

function makeCanal(points: Coord[]): Canal {
  return {
    id: 'test-canal',
    points,
    name: 'Test Canal',
    createdAt: Date.now(),
  }
}

// ─── CALC-01 : Volume depuis dimensions ──────────────────────────────────────

describe('calculationEngine — CALC-01 (volume)', () => {
  it('computeLengthInterval retourne ±1% autour de turf.length()', () => {
    const interval = computeLengthInterval(mockPoints)
    // Sanity: min < max, max-min ~ 2% du milieu
    expect(interval[0]).toBeGreaterThan(0)
    expect(interval[1]).toBeGreaterThan(interval[0])
    const mid = (interval[0] + interval[1]) / 2
    const spread = interval[1] - interval[0]
    expect(spread / mid).toBeCloseTo(0.02, 2)  // ±1% chaque côté = 2% spread
  })

  it('computeVolume([100,101] km, [47.5,52.5] m, [4.5,5.5] m) propage l intervalle', () => {
    // V_min = 100km × 47.5m × 4.5m = 100000 × 47.5 × 4.5 = 21 375 000 m³ = 0.021375 km³
    // V_max = 101km × 52.5m × 5.5m = 101000 × 52.5 × 5.5 = 29 163 750 m³ = 0.0291637 km³
    const result = computeVolume([100, 101], [47.5, 52.5], [4.5, 5.5])
    expect(result[0]).toBeCloseTo(0.021375, 5)
    expect(result[1]).toBeCloseTo(0.0291637, 4)
  })

  it('widthInterval(50) retourne [47.5, 52.5] (±5%)', () => {
    const w = widthInterval(50)
    expect(w[0]).toBeCloseTo(47.5, 4)
    expect(w[1]).toBeCloseTo(52.5, 4)
  })

  it('depthInterval(5) retourne [4.5, 5.5] (±10%)', () => {
    const d = depthInterval(5)
    expect(d[0]).toBeCloseTo(4.5, 4)
    expect(d[1]).toBeCloseTo(5.5, 4)
  })
})

// ─── CALC-02 : ΔSL = Volume / 361.8 ──────────────────────────────────────────

describe('calculationEngine — CALC-02 (ΔSL formule centrale)', () => {
  it('computeDeltaSL([0.016, 0.036] km³) = volume/361.8 mm', () => {
    const result = computeDeltaSL([0.016, 0.036])
    expect(result[0]).toBeCloseTo(0.016 / OCEAN_AREA_DIVISOR, 8)
    expect(result[1]).toBeCloseTo(0.036 / OCEAN_AREA_DIVISOR, 8)
  })

  it('computeDeltaSL Qattara 1000 km³ → ~2.76 mm (ancre du projet)', () => {
    const result = computeDeltaSL([1000, 1000])
    expect(result[0]).toBeCloseTo(2.764, 2)
    expect(result[1]).toBeCloseTo(2.764, 2)
  })
})

// ─── CALC-03 : Classification terrain + coût ─────────────────────────────────

describe('calculationEngine — CALC-03 (terrain + coût)', () => {
  it('classifyTerrain — 100% plaine (pente 0)', () => {
    const profile = makeProfile({
      totalKm: 100,
      pointsByKm: Array.from({ length: 11 }, (_, i) => ({ distance: i * 10, altitude: 0 })),
    })
    const breakdown = classifyTerrain(profile.points)
    expect(breakdown.plain).toBeCloseTo(100, 0)
    expect(breakdown.mixed).toBeCloseTo(0, 0)
    expect(breakdown.mountain).toBeCloseTo(0, 0)
    expect(breakdown.totalKm).toBeCloseTo(100, 0)
  })

  it('classifyTerrain — segment montagne (>200 m/km)', () => {
    // 10 km plats puis 10 km à +3000m (300 m/km → montagne)
    const profile = makeProfile({
      totalKm: 20,
      pointsByKm: [
        { distance: 0,  altitude: 0 },
        { distance: 10, altitude: 0 },
        { distance: 20, altitude: 3000 },
      ],
    })
    const breakdown = classifyTerrain(profile.points)
    expect(breakdown.plain).toBeCloseTo(10, 0)
    expect(breakdown.mountain).toBeCloseTo(10, 0)
  })

  it('computeCost — breakdown 100km plaine retourne [100, 500] M€', () => {
    const breakdown = { plain: 100, mixed: 0, mountain: 0, totalKm: 100 }
    const cost = computeCost(breakdown)
    expect(cost[0]).toBeCloseTo(100, 0)   // 100 × 1 M€/km min
    expect(cost[1]).toBeCloseTo(500, 0)   // 100 × 5 M€/km max
  })

  it('computeCost — max >= min toujours (UX-01 monotone)', () => {
    const breakdown = { plain: 30, mixed: 50, mountain: 20, totalKm: 100 }
    const cost = computeCost(breakdown)
    expect(cost[1]).toBeGreaterThanOrEqual(cost[0])
  })
})

// ─── CALC-04 : Pourcentage IPCC ──────────────────────────────────────────────

describe('calculationEngine — CALC-04 (IPCC %)', () => {
  it('computeIPCCPercent([0.001, 0.002]) → [0.0222%, 0.0444%] approx', () => {
    const result = computeIPCCPercent([0.001, 0.002])
    expect(result[0]).toBeCloseTo((0.001 / 4.5) * 100, 4)
    expect(result[1]).toBeCloseTo((0.002 / 4.5) * 100, 4)
  })

  it('computeIPCCPercent([4.5, 4.5]) = [100, 100]%', () => {
    const result = computeIPCCPercent([4.5, 4.5])
    expect(result[0]).toBeCloseTo(100, 4)
    expect(result[1]).toBeCloseTo(100, 4)
  })
})

// ─── CALC-05 : Impact partiel ────────────────────────────────────────────────

describe('calculationEngine — CALC-05 (impact partiel)', () => {
  it('computePartialImpact retourne null si isFullyGravity', () => {
    const profile = makeProfile({ totalKm: 100 })
    expect(profile.isFullyGravity).toBe(true)
    const result = computePartialImpact(makeCanal(mockPoints), profile, 50, 5)
    expect(result).toBeNull()
  })

  it('computePartialImpact retourne null si uphillSegments vide', () => {
    const profile = makeProfile({ totalKm: 100, uphills: [] })
    const result = computePartialImpact(makeCanal(mockPoints), profile, 50, 5)
    expect(result).toBeNull()
  })

  it('computePartialImpact avec obstacle au km 47 retourne reachableKm=47 + stopCoord défini', () => {
    const profile = makeProfile({
      totalKm: 100,
      uphills: [{ distanceStart: 47, distanceEnd: 55, altitudeGain: 200 }],
    })
    const result = computePartialImpact(makeCanal(mockPoints), profile, 50, 5)
    expect(result).not.toBeNull()
    expect(result!.reachableKm).toBeCloseTo(47, 4)
    expect(result!.stopCoord).toHaveLength(2)
    expect(typeof result!.stopCoord[0]).toBe('number')
    expect(typeof result!.stopCoord[1]).toBe('number')
    expect(result!.percentOfFull).toBeGreaterThan(0)
    expect(result!.percentOfFull).toBeLessThan(100)
    // Volume partiel doit être positif et un Interval valide
    expect(result!.volumeKm3[0]).toBeGreaterThan(0)
    expect(result!.volumeKm3[1]).toBeGreaterThan(result!.volumeKm3[0])
  })
})

// ─── CALC-01 à CALC-04 orchestrés via computeCalculation ─────────────────────

describe('calculationEngine — orchestrateur computeCalculation', () => {
  it('retourne null si profile manquant', () => {
    const result = computeCalculation(makeCanal(mockPoints), null, 50, 5)
    expect(result).toBeNull()
  })

  it('retourne null si width <= 0', () => {
    const profile = makeProfile({ totalKm: 100 })
    const result = computeCalculation(makeCanal(mockPoints), profile, 0, 5)
    expect(result).toBeNull()
  })

  it('retourne null si depth <= 0', () => {
    const profile = makeProfile({ totalKm: 100 })
    const result = computeCalculation(makeCanal(mockPoints), profile, 50, 0)
    expect(result).toBeNull()
  })

  it('retourne CalculationResult complet pour canal valide', () => {
    const profile = makeProfile({ totalKm: 100 })
    const result = computeCalculation(makeCanal(mockPoints), profile, 50, 5)
    expect(result).not.toBeNull()
    expect(result!.lengthKm[0]).toBeGreaterThan(0)
    expect(result!.lengthKm[1]).toBeGreaterThan(result!.lengthKm[0])
    expect(result!.volumeKm3[1]).toBeGreaterThan(result!.volumeKm3[0])
    expect(result!.deltaSLmm[1]).toBeGreaterThan(result!.deltaSLmm[0])
    expect(result!.costMEur[1]).toBeGreaterThanOrEqual(result!.costMEur[0])
    expect(result!.ipccPercent[1]).toBeGreaterThan(result!.ipccPercent[0])
    expect(result!.terrainBreakdown.totalKm).toBeGreaterThan(0)
  })
})

// ─── UX-01 : tous les retours numériques sont des Interval ───────────────────

describe('calculationEngine — UX-01 (Interval partout)', () => {
  it('toutes les fonctions de calcul retournent des tuples [number, number]', () => {
    // Vérification structurelle : chaque retour est un Array de 2 numbers
    const checks: Array<unknown> = [
      computeLengthInterval(mockPoints),
      computeVolume([100, 101], [47.5, 52.5], [4.5, 5.5]),
      computeDeltaSL([1, 2]),
      computeCost({ plain: 10, mixed: 5, mountain: 1, totalKm: 16 }),
      computeIPCCPercent([0.001, 0.002]),
      widthInterval(50),
      depthInterval(5),
    ]
    for (const c of checks) {
      expect(Array.isArray(c)).toBe(true)
      expect((c as unknown[]).length).toBe(2)
      expect(typeof (c as number[])[0]).toBe('number')
      expect(typeof (c as number[])[1]).toBe('number')
    }
  })
})
```

Important :
- En l'état actuel des stubs (Task 2), TOUS ces tests vont échouer (sauf le dernier UX-01 structurel qui passe car `[0,0]` est bien un tuple de 2 numbers). C'est le comportement attendu pour Wave 0 RED.
- T02 (Wave 1) implémentera les fonctions jusqu'à ce que `npm test` passe au vert sur l'intégralité.
  </action>
  <verify>
    <automated>npx vitest run src/tests/calculationEngine.test.ts --reporter=verbose 2>&1 | tee /tmp/calc-test-output.txt; FAIL_COUNT=$(grep -cE "(FAIL|✗|×)" /tmp/calc-test-output.txt); PASS_STRUCT=$(grep -c "UX-01" /tmp/calc-test-output.txt); echo "FAIL_COUNT=$FAIL_COUNT PASS_STRUCT=$PASS_STRUCT"; if [ "$FAIL_COUNT" -lt 5 ]; then echo "ATTENDU: au moins 5 tests RED en Wave 0"; exit 1; fi</automated>
  </verify>
  <acceptance_criteria>
    - Le fichier `src/tests/calculationEngine.test.ts` existe
    - `grep -cE "^describe\(" src/tests/calculationEngine.test.ts` retourne au moins 6 (un describe par CALC-* + UX-01 + orchestrateur)
    - `grep -cE "CALC-0[1-5]|UX-01" src/tests/calculationEngine.test.ts` retourne au moins 6
    - `grep -c "computePartialImpact" src/tests/calculationEngine.test.ts` retourne au moins 3
    - `grep -c "isFullyGravity" src/tests/calculationEngine.test.ts` retourne au moins 1
    - `grep -c "OCEAN_AREA_DIVISOR" src/tests/calculationEngine.test.ts` retourne au moins 1
    - `npx vitest run src/tests/calculationEngine.test.ts` produit AU MOINS 5 échecs (RED attendu — Wave 0)
    - `npx tsc --noEmit` exit code 0
  </acceptance_criteria>
  <done>Suite de tests créée, couvre tous les CALC-* + UX-01, RED attendu (au moins 5 tests rouges), TypeScript compile.</done>
</task>

</tasks>

<verification>
**Vérification finale du plan T01 :**

1. Les 3 fichiers existent : `src/types/calculation.ts`, `src/lib/calculationEngine.ts`, `src/tests/calculationEngine.test.ts`
2. `npx tsc --noEmit` exit 0 — aucune erreur de type
3. `npm test` montre au moins 5 échecs sur `calculationEngine.test.ts` (RED attendu Wave 0)
4. `npm test` ne casse AUCUN test pré-existant (43 tests Phase 1-3 toujours verts)
5. Aucun import de `react`, `zustand`, `maplibre-gl` dans `calculationEngine.ts` (module pur)

```bash
# Verification suite
npx tsc --noEmit
npm test 2>&1 | grep -E "Test Files|Tests"
grep -cE "import .* from 'react'|from 'zustand'|from 'maplibre" src/lib/calculationEngine.ts  # doit être 0
```
</verification>

<success_criteria>
- [ ] `src/types/calculation.ts` exporte Interval, CalculationResult, TerrainBreakdown, PartialImpactResult, CalcParams, OCEAN_AREA_DIVISOR=361.8, IPCC_ANNUAL_RATE_MM=4.5, COST_PER_KM, TERRAIN_THRESHOLDS, DEFAULT_CALC_PARAMS={width:50,depth:5}
- [ ] `src/lib/calculationEngine.ts` exporte 11+ fonctions stubs avec signatures finales
- [ ] `src/tests/calculationEngine.test.ts` contient 6+ describe blocks couvrant CALC-01..CALC-05 + UX-01 + orchestrateur
- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] `npm test` montre 5+ failures sur calculationEngine.test.ts (RED Wave 0 attendu)
- [ ] Aucun test pré-existant (Phase 1-3) cassé
- [ ] `calculationEngine.ts` ne contient aucun import React/Zustand/MapLibre (module pur)
</success_criteria>

<output>
Après complétion, créer `.planning/phases/04-moteur-de-calcul/04-01-SUMMARY.md` documentant :
- Les 3 fichiers créés (types/lib/tests)
- Le compte de tests RED attendu vs obtenu
- Toute déviation par rapport aux signatures spec
- Confirmation que tsc passe et que les tests Phase 1-3 sont toujours verts
</output>

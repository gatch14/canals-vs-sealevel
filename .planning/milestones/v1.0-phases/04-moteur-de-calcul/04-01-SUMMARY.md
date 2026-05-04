---
phase: "04"
plan: "01"
subsystem: "calculation-engine"
tags: [phase-04, calculation-engine, types, scaffolding, wave-0, tdd]

dependency_graph:
  requires: []
  provides:
    - src/types/calculation.ts (Interval, CalculationResult, TerrainBreakdown, PartialImpactResult, CalcParams, constantes locked)
    - src/lib/calculationEngine.ts (stubs Wave 0 — 13 fonctions exportées)
    - src/tests/calculationEngine.test.ts (20 tests Wave 0 RED)
  affects:
    - T02 (Wave 1) implémente les stubs jusqu'au GREEN
    - T03 intègre le moteur dans CalculationPanel UI

tech_stack:
  added: []
  patterns:
    - "Interval arithmetic — type Interval = [number, number] strict (UX-01)"
    - "Pure module pattern — calculationEngine.ts sans React/Zustand/MapLibre"
    - "TDD Wave 0/1 — RED stubs en T01, GREEN implémentation en T02"
    - "Locked constants — OCEAN_AREA_DIVISOR=361.8, IPCC_ANNUAL_RATE_MM=4.5 non-négociables"

key_files:
  created:
    - src/types/calculation.ts
    - src/lib/calculationEngine.ts
    - src/tests/calculationEngine.test.ts
  modified: []

decisions:
  - "Stubs retournent [0,0] ou null — valeurs sentinelles qui font échouer les tests métier tout en satisfaisant le type system"
  - "13 imports turf (length, along, lineString) présents dans Wave 0 pour éviter de modifier les imports en T02"
  - "TerrainType et TerrainBreakdown séparés de CalculationResult pour testabilité unitaire de classifyTerrain"

metrics:
  duration_seconds: 274
  completed_date: "2026-05-01"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 0
---

# Phase 04 Plan 01: Types + Stubs + Tests RED (Wave 0) Summary

**One-liner:** Types Interval/CalculationResult/TerrainBreakdown avec constantes OCEAN_AREA_DIVISOR=361.8, stubs calculationEngine (13 fonctions), et 20 tests RED couvrant CALC-01..CALC-05 + UX-01.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Types calculation.ts | 0b11cd2 | src/types/calculation.ts (84 lines) |
| 2 | Stubs calculationEngine.ts | 8dfc83f | src/lib/calculationEngine.ts (126 lines) |
| 3 | Tests RED Wave 0 | adb6a3e | src/tests/calculationEngine.test.ts (257 lines) |

## Files Created

### src/types/calculation.ts

- `Interval = [number, number]` — contrat UX-01 strict
- Interfaces: `CalculationResult`, `TerrainBreakdown`, `PartialImpactResult`, `CalcParams`
- Constantes locked: `OCEAN_AREA_DIVISOR = 361.8`, `IPCC_ANNUAL_RATE_MM = 4.5`
- `COST_PER_KM: Record<TerrainType, Interval>` — fourchettes terrain (1-5, 10-50, 100-500 M€/km)
- `TERRAIN_THRESHOLDS` — seuils 50/200 m/km
- `DEFAULT_CALC_PARAMS = { width: 50, depth: 5 }`
- `TOLERANCE` — tolérances d'ingénierie ±1% longueur, ±5% largeur, ±10% profondeur

### src/lib/calculationEngine.ts

13 fonctions exportées (stubs Wave 0) :
- `computeLengthInterval`, `computeVolume` (CALC-01)
- `computeDeltaSL` (CALC-02 — formule centrale V/361.8)
- `classifyTerrain`, `computeCost` (CALC-03)
- `computeIPCCPercent` (CALC-04)
- `computePartialImpact`, `computeCalculation` (CALC-05 + orchestrateur)
- `mulIntervals`, `addIntervals`, `divByConst`, `widthInterval`, `depthInterval` (helpers arithmétiques)

### src/tests/calculationEngine.test.ts

20 tests, 7 describe blocks :
- `CALC-01 (volume)` — 4 tests
- `CALC-02 (ΔSL)` — 2 tests (dont ancre Qattara 2.76 mm)
- `CALC-03 (terrain + coût)` — 4 tests
- `CALC-04 (IPCC %)` — 2 tests
- `CALC-05 (impact partiel)` — 3 tests
- `orchestrateur computeCalculation` — 4 tests
- `UX-01 (Interval partout)` — 1 test structurel

## Test Results — Wave 0 RED State

| Metric | Value |
|--------|-------|
| Tests RED (attendus) | 13 |
| Tests GREEN (attendus) | 7 |
| Tests total nouveaux | 20 |
| Tests pré-existants | 43 (tous verts) |
| Tests total suite | 63 |

Les 7 tests verts en Wave 0 sont les null-guards (`computeCalculation` retourne null si profil/dims invalides) et la vérification structurelle UX-01 (les stubs `[0,0]` satisfont le contrat Array[2]).

## Verification Results

- `npx tsc --noEmit` : PASS (aucune erreur TypeScript)
- `npm test` : 13 RED attendus sur calculationEngine.test.ts — CORRECT Wave 0
- `grep react|zustand|maplibre calculationEngine.ts` : 0 (module pur)
- Tests Phase 1-3 : 43/43 verts — AUCUNE REGRESSION

## Deviations from Plan

None — plan executed exactly as written.

Les constantes locked (OCEAN_AREA_DIVISOR=361.8, IPCC_ANNUAL_RATE_MM=4.5, seuils 50/200, coûts [1,5]/[10,50]/[100,500]) sont présentes avec leurs valeurs exactes conformément à CONTEXT.md decisions.

## Known Stubs

All stubs are intentional Wave 0 scaffolding — T02 (Wave 1) will implement the business logic. No data flows to UI from these stubs yet.

| Stub | File | Line | Reason |
|------|------|------|--------|
| All functions return `[0,0]` | src/lib/calculationEngine.ts | 26-113 | Wave 0 — T02 implements logic |
| `computeCalculation` returns null | src/lib/calculationEngine.ts | 97 | Wave 0 — T02 implements orchestration |
| `computePartialImpact` returns null | src/lib/calculationEngine.ts | 113 | Wave 0 — T02 implements CALC-05 |

## Self-Check: PASSED

- [x] src/types/calculation.ts exists (84 lines)
- [x] src/lib/calculationEngine.ts exists (126 lines)
- [x] src/tests/calculationEngine.test.ts exists (257 lines)
- [x] Commit 0b11cd2 exists (Task 1)
- [x] Commit 8dfc83f exists (Task 2)
- [x] Commit adb6a3e exists (Task 3)
- [x] tsc --noEmit: PASS
- [x] 13 tests RED on calculationEngine.test.ts
- [x] 43 pre-existing tests still green

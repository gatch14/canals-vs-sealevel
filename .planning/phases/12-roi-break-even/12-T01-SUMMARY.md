---
plan: T01
phase: 12-roi-break-even
status: complete
wave: 0
subsystem: roi-engine
tags: [tdd, types, stubs, red-tests, roi, break-even]
dependency_graph:
  requires: [src/types/calculation.ts, src/types/canal.ts, src/types/elevation.ts]
  provides: [src/types/roi.ts, src/lib/roiEngine.ts, src/tests/roiEngine.test.ts]
  affects: []
tech_stack:
  added: []
  patterns: [interval-arithmetic, tdd-red-green-refactor, pure-functions]
key_files:
  created:
    - src/types/roi.ts
    - src/lib/roiEngine.ts
    - src/tests/roiEngine.test.ts
  modified: []
decisions:
  - WATER_PRICE_MIN=0.5 et WATER_PRICE_MAX=2.0 €/m³ (fourchette marché eau douce)
  - ROI cumulé = annualValue × years - totalCost (formule linéaire simple, pas de taux actualisation)
  - breakEven = totalCost.min / annualValue.max → min (scénario optimiste) et vice versa
  - computeRoiAnalysis retourne null si ZERO_PARAMS (pas de valeur économique calculable)
metrics:
  duration: 8min
  completed: 2026-05-02T17:00:00Z
  tasks_completed: 1
  files_created: 3
  files_modified: 0
---

# Phase 12 Plan T01: TDD Wave 0 — Types + Stubs + RED Tests (roiEngine) Summary

Wave 0 TDD ROI Engine — interfaces RoiParams/RoiResult/RoiSummary, 6 stubs retournant [0,0]/null/[Infinity,Infinity]/[], et 27 tests RED (21 failures confirmées, comportement attendu).

## What Was Built

Trois fichiers créés pour la phase TDD Wave 0 du moteur ROI & break-even :

1. **`src/types/roi.ts`** — Interfaces TypeScript `RoiParams`, `RoiResult`, `RoiSummary` avec `Interval` ([min,max]) sur tous les champs numériques (conforme UX-01).

2. **`src/lib/roiEngine.ts`** — 6 fonctions stub + 2 constantes prix eau :
   - `calcTotalAnnualValue` → `[0, 0]`
   - `calcTotalCost` → `[0, 0]`
   - `calcBreakEven` → `[Infinity, Infinity]`
   - `calcCumulativeRoi` → `[0, 0]`
   - `computeRoiAnalysis` → `null`
   - `calcAllCanalsRoi` → `[]`

3. **`src/tests/roiEngine.test.ts`** — 27 tests organisés en 6 describe blocks (6+3+5+5+5+3), couvrant les cas zéro, les formules mathématiques exactes, la cohérence des intervalles, et la monotonie du ROI cumulé.

## TDD Gate Compliance

- **RED gate :** Tests écrits avant implémentation — 21/27 échouent comme attendu.
- **GREEN gate :** En attente — Wave 1 (T02) implémentera les fonctions.

## Test Results (Wave 0 — RED)

```
Tests: 21 failed | 6 passed (27 total)
```

Les 6 tests qui passent sont les cas zéro/vide correctement gérés par les stubs (`[0,0]` pour input `[0,0]`, `[]` pour liste vide, `null` pour ZERO_PARAMS).

## Verification

- `npx tsc --noEmit` — exit 0 (aucune erreur TypeScript)
- `npm run test -- roiEngine` — 21 failures RED confirmées

## Commits

| Hash | Message |
|------|---------|
| f546881 | feat(12): TDD Wave 0 — types + stubs + RED tests (roiEngine) |

## Deviations from Plan

None — plan exécuté exactement comme spécifié. Le fixture `canalWithElevation` utilise le type `Canal` avec `ElevationProfile` correct (lu depuis `src/types/canal.ts` et `src/types/elevation.ts`).

## Known Stubs

Stubs intentionnels Wave 0 (seront implémentés en T02) :

| Fonction | Fichier | Retour stub | Raison |
|----------|---------|-------------|--------|
| `calcTotalAnnualValue` | src/lib/roiEngine.ts:35 | `[0, 0]` | Wave 0 TDD |
| `calcTotalCost` | src/lib/roiEngine.ts:46 | `[0, 0]` | Wave 0 TDD |
| `calcBreakEven` | src/lib/roiEngine.ts:57 | `[Infinity, Infinity]` | Wave 0 TDD |
| `calcCumulativeRoi` | src/lib/roiEngine.ts:68 | `[0, 0]` | Wave 0 TDD |
| `computeRoiAnalysis` | src/lib/roiEngine.ts:77 | `null` | Wave 0 TDD |
| `calcAllCanalsRoi` | src/lib/roiEngine.ts:86 | `[]` | Wave 0 TDD |

Ces stubs sont intentionnels et documentés. T02 (Wave 1) implémente les fonctions pour faire passer tous les tests en GREEN.

## Self-Check: PASSED

- [x] src/types/roi.ts existe
- [x] src/lib/roiEngine.ts existe
- [x] src/tests/roiEngine.test.ts existe
- [x] Commit f546881 confirmé
- [x] tsc --noEmit exit 0
- [x] 21 tests RED confirmés

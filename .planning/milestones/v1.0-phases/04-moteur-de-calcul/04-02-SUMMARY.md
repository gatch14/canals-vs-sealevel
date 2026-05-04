---
phase: "04"
plan: "02"
subsystem: "calculation-engine"
tags: [phase-04, calculation-engine, implementation, wave-1, tdd-green]

dependency_graph:
  requires: [04-01]
  provides:
    - src/lib/calculationEngine.ts (implémentation complète Wave 1 — 13 fonctions, 233 lignes)
  affects:
    - T03 intègre le moteur dans CalculationPanel UI

tech_stack:
  added: []
  patterns:
    - "Interval arithmetic positive — mulIntervals([a,b],[c,d])=[a*c,b*d] pour intervalles positifs"
    - "Pure module pattern — calculationEngine.ts sans React/Zustand/MapLibre"
    - "clipProfileToKm helper interne — clip terrain avant classifyTerrain pour éviter coût partiel > coût total (Pitfall 4)"
    - "turf.length() + turf.along() — longueur géodésique et point d'arrêt partiel"

key_files:
  created: []
  modified:
    - src/lib/calculationEngine.ts

decisions:
  - "Implémentation atomique en un seul Write — toutes les tâches implémentées en un passage pour garantir cohérence des dépendances internes"
  - "clipProfileToKm non-exporté — helper interne garantissant coût partiel <= coût total (Pitfall 4 RESEARCH.md)"
  - "Guard reachableKm <= 0 dans computePartialImpact — évite along() sur distance nulle"

metrics:
  duration_seconds: 480
  completed_date: "2026-05-01"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 1
---

# Phase 04 Plan 02: Implémentation moteur de calcul (Wave 1 — TDD GREEN) Summary

**One-liner:** Implémentation complète calculationEngine.ts — 13 fonctions (arithmétique intervalles, volume, ΔSL, coût, terrain, IPCC%, impact partiel), 20/20 tests Phase 4 GREEN, 63/63 tests totaux GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Helpers intervalles + dimensions + computeLengthInterval | 023790d | src/lib/calculationEngine.ts (233 lignes) |
| 2 | computeVolume, computeDeltaSL, computeIPCCPercent, classifyTerrain, computeCost | 023790d | (inclus dans commit Task 1) |
| 3 | computePartialImpact + computeCalculation orchestrateur | 023790d | (inclus dans commit Task 1) |

Note: Les 3 tâches ont été implémentées dans un seul Write atomique de `calculationEngine.ts` — un seul commit couvre les 3 tâches (cohérence des dépendances internes entre helpers et fonctions métier).

## Implementation Details

### src/lib/calculationEngine.ts (233 lignes)

13 fonctions exportées (+ 1 helper interne `clipProfileToKm`) :

**Helpers arithmétiques (Task 1) :**
- `mulIntervals(a, b)` — `[a[0]*b[0], a[1]*b[1]]` pour intervalles positifs
- `addIntervals(a, b)` — `[a[0]+b[0], a[1]+b[1]]`
- `divByConst(a, k)` — `[a[0]/k, a[1]/k]`
- `widthInterval(w)` — `[w*0.95, w*1.05]` (±5% TOLERANCE.width)
- `depthInterval(d)` — `[d*0.90, d*1.10]` (±10% TOLERANCE.depth)
- `computeLengthInterval(points)` — `turf.length(lineString(points)) ±1%`

**Fonctions métier (Task 2) :**
- `computeVolume(lengthKm, widthM, depthM)` — V = L×1000×W×D / 1e9 km³
- `computeDeltaSL(volumeKm3)` — `divByConst(v, 361.8)` (formule centrale)
- `computeIPCCPercent(deltaSLmm)` — `[v[0]/4.5*100, v[1]/4.5*100]`
- `classifyTerrain(points)` — pente m/km par segment → plain/mixed/mountain
- `computeCost(breakdown)` — sommation `COST_PER_KM[type] × km` par type

**Orchestrateur + impact partiel (Task 3) :**
- `computeCalculation(canal, profile, w, d)` — orchestre tout, guards null
- `computePartialImpact(canal, profile, w, d)` — CALC-05, turf.along() pour stopCoord
- `clipProfileToKm(points, maxKm)` — helper interne, clip profil avant classifyTerrain

## Test Results — Wave 1 GREEN State

| Metric | Value |
|--------|-------|
| Tests Phase 4 GREEN | 20/20 |
| Tests Phase 1-3 (régression) | 43/43 — aucune régression |
| Tests totaux | 63/63 |
| Failures | 0 |

Détail Phase 4 :
- CALC-01 (volume + helpers) : 4/4 GREEN
- CALC-02 (ΔSL) : 2/2 GREEN — dont ancre Qattara 1000 km³ → 2.764 mm
- CALC-03 (terrain + coût) : 4/4 GREEN
- CALC-04 (IPCC %) : 2/2 GREEN
- CALC-05 (impact partiel) : 3/3 GREEN
- Orchestrateur computeCalculation : 4/4 GREEN
- UX-01 (Interval structural) : 1/1 GREEN

## Validation Qattara (ancre du projet)

`computeDeltaSL([1000, 1000])` → `[2.7639..., 2.7639...]` mm

Conforme à la formule centrale `ΔSL = V / 361.8` :
- 1000 / 361.8 = 2.7639... mm ✓
- Ordre de grandeur correct — un bassin de 1000 km³ impacte seulement ~2.76 mm le niveau des mers

## Vérifications finales

- `grep -c "STUB Wave 0" src/lib/calculationEngine.ts` → **0** (tous stubs remplacés)
- `npx tsc --noEmit` → **exit 0** (aucune erreur TypeScript)
- `npm test` → **63/63 GREEN** (0 failure)
- Imports React/Zustand/MapLibre → **0** (module pur)
- Ligne count : **233 lignes** (>200 min requis)

## Deviations from Plan

None — plan executed exactly as written.

Les 3 tâches ont été implémentées simultanément dans un seul Write pour garantir la cohérence des dépendances internes (les fonctions de Task 2 appellent les helpers de Task 1, et les fonctions de Task 3 appellent celles de Task 1 et 2). Le résultat est identique : toutes les implémentations spécifiées dans le plan sont présentes et correctes.

## Known Stubs

None. Toutes les fonctions sont implémentées — plus aucun stub Wave 0.

## Self-Check: PASSED

- [x] src/lib/calculationEngine.ts exists (233 lignes)
- [x] `grep -c "STUB Wave 0" src/lib/calculationEngine.ts` = 0
- [x] Commit 023790d exists
- [x] `npx tsc --noEmit` exit 0
- [x] `npm test` 63/63 GREEN
- [x] Qattara anchor test GREEN (2.764 mm)
- [x] No React/Zustand/MapLibre imports
- [x] 04-T02-PLAN.md status: complete

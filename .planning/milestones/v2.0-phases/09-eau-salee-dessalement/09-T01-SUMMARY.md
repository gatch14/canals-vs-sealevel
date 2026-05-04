---
phase: 09-eau-salee-dessalement
plan: T01
subsystem: testing
tags: [vitest, typescript, tdd, desalination, ecology, pure-functions]

# Dependency graph
requires:
  - phase: 08-candidats-ia
    provides: "Pattern TDD T01/T02/T03 + types Interval depuis calculation.ts + Coord depuis canal.ts"
  - phase: 05-analyse-ecologique
    provides: "ecologyEngine.ts pattern (fonctions pures, desertZones.geojson, Interval)"
provides:
  - "Types EcosystemImpactLevel, DesalinationParams, DesalinationResult dans src/types/desalination.ts"
  - "Stubs 6 fonctions pures + calcSolarFactor + computeDesalinationAnalysis dans src/lib/desalinationEngine.ts"
  - "Suite tests RED 31 tests dans src/tests/desalinationEngine.test.ts"
affects: [09-T02, 09-T03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN pattern : stubs en T01, implémentation GREEN en T02"
    - "Fonctions pures sans React ni Zustand — testables directement avec Vitest"
    - "Interval [min, max] pour toutes les valeurs numériques (UX-01)"
    - "FeatureCollection passée en paramètre (pas importée globalement) — testable avec fixtures"

key-files:
  created:
    - src/types/desalination.ts
    - src/lib/desalinationEngine.ts
    - src/tests/desalinationEngine.test.ts
  modified: []

key-decisions:
  - "EcosystemImpactLevel = 'low' | 'neutral' | 'critical' — 3 niveaux ECO-05 (désert=faible, neutre, cours d'eau=critique)"
  - "calcSolarFactor heuristique latitude : < 35° abs = 1.0, >= 35° = 0.7 — zéro backend"
  - "calcDesalinationNodes = floor(lengthKm / 500) — 1 nœud par tranche de 500 km"
  - "calcDesalinationCost : [50M, 150M] € par nœud (fourchette verrouillée CONTEXT.md D-01)"
  - "FeatureCollection passée en paramètre à classifyEcosystem et computeDesalinationAnalysis — cohérent avec pattern ecologyEngine.ts"

patterns-established:
  - "Module pur desalinationEngine : imports uniquement geojson + types locaux, testable sans DOM"
  - "Stub retourne valeur placeholder neutre (0, [0,0], 'neutral') — évite crash avant T02"
  - "Tests RED importent desertZones.geojson réel — classifyEcosystem testée avec vraies données géo"

requirements-completed: [ECO-05, DESAL-01, DESAL-02, DESAL-03, DESAL-04, DESAL-05]

# Metrics
duration: 15min
completed: 2026-05-02
---

# Phase 9 Plan T01: Eau Salée & Dessalement — Types + Stubs + Tests RED

**Contrat de données dessalement verrouillé : types DesalinationResult/DesalinationParams, 8 fonctions pures stubées, et 31 tests RED couvrant ECO-05 + DESAL-01 à DESAL-05**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-02T12:04:44Z
- **Completed:** 2026-05-02T12:08:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Types DesalinationResult, DesalinationParams et EcosystemImpactLevel définis avec tous les champs requis (Interval UX-01 partout)
- 8 fonctions pures stubées dans desalinationEngine.ts (classifyEcosystem, calcDesalinationNodes, calcSolarFactor, calcWaterProduction, calcSaltValue, calcHabitableZones, calcDesalinationCost, computeDesalinationAnalysis)
- 31 tests RED écrits — 16 échouent correctement car les stubs retournent 0/[0,0]/'neutral', 107 tests existants toujours GREEN

## Task Commits

1. **Task 1: Créer src/types/desalination.ts** - `91293ee` (feat)
2. **Task 2: Créer src/lib/desalinationEngine.ts — stubs** - `7065cfa` (feat)
3. **Task 3: Créer src/tests/desalinationEngine.test.ts — tests RED** - `cef43c4` (test)

## Files Created/Modified

- `src/types/desalination.ts` — EcosystemImpactLevel, DesalinationParams, DesalinationResult avec imports Coord + Interval
- `src/lib/desalinationEngine.ts` — 8 fonctions pures stubées, orchestrateur computeDesalinationAnalysis
- `src/tests/desalinationEngine.test.ts` — 31 tests RED couvrant ECO-05 + DESAL-01 à DESAL-05

## Decisions Made

- EcosystemImpactLevel = `'low' | 'neutral' | 'critical'` selon le CONTEXT.md D-01 (3 zones)
- calcSolarFactor basé sur latitude absolue : `< 35` = 1.0, `>= 35` = 0.7 — zéro backend requis
- calcDesalinationNodes = `floor(lengthKm / 500)` — 1 nœud par tranche de 500 km
- calcDesalinationCost : `[50_000_000, 150_000_000]` € par nœud (fourchette locked)
- FeatureCollection passée en paramètre (pas importée globalement dans les fonctions) — cohérent avec le pattern ecologyEngine.ts, testable avec fixtures isolées

## Deviations from Plan

None — plan exécuté exactement comme spécifié.

## Issues Encountered

None.

## User Setup Required

None — aucune configuration externe requise.

## Next Phase Readiness

- Contrat de types verrouillé — T02 implémente les 6 fonctions pour faire passer les 16 tests RED en GREEN
- Stubs retournent des valeurs placeholder cohérentes — T03 peut consommer les types sans attendre T02
- 107 tests existants toujours GREEN — aucune régression introduite

---
*Phase: 09-eau-salee-dessalement*
*Completed: 2026-05-02*

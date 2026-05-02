---
phase: 06-dashboard-global
plan: T01
subsystem: testing
tags: [typescript, vitest, tdd, dashboard, ipcc]

# Dependency graph
requires:
  - phase: 04-moteur-calcul
    provides: Interval type, CalculationResult, CalcParams, calculationEngine.ts with addIntervals/computeCalculation
  - phase: 05-analyse-ecologique
    provides: Pattern TDD Wave 0 établi — stubs + tests RED

provides:
  - DashboardScenario, DashboardResult interfaces (src/types/dashboard.ts)
  - IPCC_2100_RANGE_MM constante Interval [300, 1000] (IPCC AR6 2021)
  - dashboardEngine.ts — 4 stubs compilables (RED state Wave 0)
  - dashboardEngine.test.ts — 12 tests définissant le contrat GLOB-01/02/03

affects:
  - 06-T02 (dashboardEngine GREEN implementation)
  - 06-T03 (DashboardPanel UI consommant DashboardResult)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Wave 0 : types + constantes + stubs + tests RED avant implémentation"
    - "IPCC_2100_RANGE_MM: Interval = [300, 1000] — constante locked non-négociable"
    - "dashboardEngine stubs retournent [0,0]/null — RED gate pour T02"

key-files:
  created:
    - src/types/dashboard.ts
    - src/lib/dashboardEngine.ts
    - src/tests/dashboardEngine.test.ts
  modified: []

key-decisions:
  - "IPCC_2100_RANGE_MM: Interval = [300, 1000] — RCP2.6 (300mm) à RCP8.5 (1000mm) horizon 2100"
  - "computeDashboardResult retourne null pour canaux vides — pas de result agrégé sans données"
  - "3 scénarios rétention : optimiste 1.0, réaliste 0.6, pessimiste 0.3 — fraction ΔSL brut retenu en mer"
  - "ElevationProfile.canalId absent du type — fixture test adaptée (totalUphillGain ajouté)"

patterns-established:
  - "Pattern TDD Wave 0 : stubs retournant [0,0]/null pour établir le contrat avant GREEN"
  - "Interval UX-01 strict : toutes valeurs numériques dans [min, max] — jamais number nu"

requirements-completed:
  - GLOB-01
  - GLOB-02
  - GLOB-03

# Metrics
duration: 2min
completed: 2026-05-01
---

# Phase 06 Plan T01: Dashboard Global Summary

**Types DashboardScenario/DashboardResult + constante IPCC_2100_RANGE_MM [300,1000] + 4 stubs dashboardEngine + 12 tests RED Wave 0**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-01T13:43:02Z
- **Completed:** 2026-05-01T13:45:16Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Contrats de type dashboard établis — DashboardScenario, DashboardResult avec scenarios optimistic/realistic/pessimistic
- Constante IPCC_2100_RANGE_MM: Interval = [300, 1000] lockée avec commentaire IPCC AR6 2021 RCP2.6-RCP8.5
- 4 stubs dashboardEngine compilables retournant [0,0]/null (RED state Wave 0)
- 12 tests définissant le contrat GLOB-01/02/03 — 5 GREEN (constantes), 7 RED (métier)

## Task Commits

Each task was committed atomically:

1. **Task 1: Types dashboard.ts** - `0cf34bb` (feat)
2. **Task 2: dashboardEngine stubs + tests RED** - `4228d9c` (test)

## Files Created/Modified
- `src/types/dashboard.ts` — DashboardScenario, DashboardResult, IPCC_2100_RANGE_MM
- `src/lib/dashboardEngine.ts` — 4 stubs compilables (RED Wave 0)
- `src/tests/dashboardEngine.test.ts` — 12 tests RED définissant le contrat

## Decisions Made
- IPCC_2100_RANGE_MM: Interval = [300, 1000] — constante locked, non-négociable
- computeDashboardResult retourne null pour liste vide (pas de result sans données)
- Fixture ElevationProfile adaptée : `canalId` absent du type réel, `totalUphillGain: 0` ajouté

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixture ElevationProfile adaptée au type réel**
- **Found during:** Task 2 (dashboardEngine.test.ts)
- **Issue:** Le plan incluait `canalId: 'c1'` dans la fixture ElevationProfile, mais `ElevationProfile` n'a pas de champ `canalId`. Aussi, `totalUphillGain` (champ requis) était absent.
- **Fix:** Suppression de `canalId`, ajout de `totalUphillGain: 0` dans la fixture de test.
- **Files modified:** src/tests/dashboardEngine.test.ts
- **Verification:** `npx tsc --noEmit` → 0 erreur
- **Committed in:** 4228d9c (Task 2)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type mismatch in fixture)
**Impact on plan:** Fix nécessaire pour la compilation TypeScript. Aucun impact sur le contrat TDD.

## Issues Encountered
None — compilation propre, tests RED confirmés.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 0 TDD gate établi — RED confirmé pour les 7 tests métier
- T02 reçoit des contrats précis : computeCumulativeDeltaSL doit retourner > [0,0] pour canaux avec profil, computeScenarios doit appliquer les multiplicateurs 1.0/0.6/0.3, computeDashboardResult doit agréger totalCanals et canalsWithProfile
- TypeScript 0 erreur sur l'ensemble du projet

---
*Phase: 06-dashboard-global*
*Completed: 2026-05-01*

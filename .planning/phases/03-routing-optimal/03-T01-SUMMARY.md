---
phase: 03-routing-optimal
plan: T01
subsystem: routing
tags: [typescript, zustand, vitest, routing, dijkstra, types]

# Dependency graph
requires:
  - phase: 02-elevation-profil
    provides: "Canal, Coord, UIMode, ElevationProfile, canalStore — base pour extension routing"
provides:
  - "src/types/routing.ts : RoutingState (7 états), RoutingRequest, RoutingResult, re-export Coord"
  - "UIMode étendu avec 'routing' dans canal.ts"
  - "Canal.isRouted?: boolean (rétrocompat Phase 1/2)"
  - "canalStore : 3 champs + 6 actions routing (startRouting, setRoutingStart, setRoutingEnd, setRoutingState, finalizeRoutedCanal, cancelRouting)"
  - "src/tests/routingGrid.test.ts : 15 stubs it.todo Wave 0 pour T02"
affects: [03-T02, 03-T03, routing-worker, canal-map]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RoutingState union type (7 littéraux) — contrat compile-time pour la FSM routing"
    - "finalizeRoutedCanal avec garde path.length < 2 — pattern symétrique à finalizeCanal"
    - "Stubs Wave 0 it.todo() — tests RED écrits avant implémentation (TDD préparatoire)"

key-files:
  created:
    - src/types/routing.ts
    - src/tests/routingGrid.test.ts
  modified:
    - src/types/canal.ts
    - src/store/canalStore.ts
    - src/store/canalStore.test.ts

key-decisions:
  - "RoutingState = union de 7 littéraux (idle, selecting-start, selecting-end, computing, timeout, error, no-path) — FSM explicite, jamais de string libre"
  - "re-export Coord depuis canal.ts via routing.ts — évite double définition, single source of truth"
  - "finalizeRoutedCanal crée 'Canal optimal N' avec isRouted:true et appelle selectCanal automatiquement"
  - "cancelRouting remet mode:'selection' + routingState:'idle' + efface routingStart/routingEnd"
  - "Stubs it.todo dans routingGrid.test.ts définissent le contrat de comportement de T02 avant son implémentation"

patterns-established:
  - "Routing state machine : startRouting → setRoutingStart → setRoutingEnd → finalizeRoutedCanal|cancelRouting"
  - "Canal optimal : isRouted:true + name 'Canal optimal N' — distingué des canaux manuels"
  - "Garde obligatoire path.length < 2 dans finalizeRoutedCanal — même pattern que finalizeCanal"

requirements-completed: [MAP-05]

# Metrics
duration: 8min
completed: 2026-04-30
---

# Phase 3 Plan T01: Fondation Routing — Summary

**Types RoutingState/RoutingRequest/RoutingResult + extension UIMode/Canal + 6 actions Zustand routing + 15 stubs Wave 0 pour Dijkstra T02**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-30T17:00:00Z
- **Completed:** 2026-04-30T17:05:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Types routing compilent sans erreur : RoutingState (7 états), RoutingRequest, RoutingResult, re-export Coord
- UIMode étendu avec 'routing', Canal avec isRouted? (rétrocompat totale Phase 1/2)
- canalStore étendu : 3 champs + 6 actions routing, finalizeRoutedCanal crée 'Canal optimal N' avec selectCanal automatique
- 10 tests store verts (5 Phase 1/2 + 5 Phase 3 MAP-05), TypeScript 0 erreur
- 15 stubs it.todo dans routingGrid.test.ts définissent le contrat complet de T02

## Task Commits

Chaque tâche commitée atomiquement :

1. **Task 1: Créer src/types/routing.ts + étendre canal.ts** - `7bb52c4` (feat)
2. **Task 2: Étendre canalStore.ts + créer tests Wave 0** - `f7ac6c3` (feat)

## Files Created/Modified
- `src/types/routing.ts` — RoutingState (7 états), RoutingRequest, RoutingResult, re-export Coord
- `src/types/canal.ts` — UIMode + 'routing', Canal + isRouted?: boolean
- `src/store/canalStore.ts` — import RoutingState, 3 champs + 6 actions routing
- `src/store/canalStore.test.ts` — beforeEach étendu + 5 nouveaux tests MAP-05
- `src/tests/routingGrid.test.ts` — 15 stubs it.todo Wave 0 pour buildGrid, getResolution, fetchGridElevations, buildGraph, findPath

## Decisions Made
- RoutingState modélise la FSM routing en union de 7 littéraux — pas de string libre, erreurs compile-time
- finalizeRoutedCanal avec garde path.length < 2 (symétrique à finalizeCanal Phase 1) — Threat T-03-T01-01 mitigé
- Coord re-exporté depuis routing.ts → single source of truth dans canal.ts, pas de duplication

## Deviations from Plan

None - plan exécuté exactement tel qu'écrit.

## Issues Encountered

None

## User Setup Required

None - aucune configuration externe requise.

## Next Phase Readiness
- T02 peut implémenter `src/services/routingGrid.ts` directement : les stubs it.todo dans routingGrid.test.ts définissent exactement les 15 comportements attendus
- T03 peut consommer les actions routing du store : startRouting, setRoutingStart, setRoutingEnd, finalizeRoutedCanal, cancelRouting
- TypeScript 0 erreur — aucun blocage pour les tasks suivantes

## Self-Check: PASSED

- [x] src/types/routing.ts : FOUND
- [x] src/types/canal.ts modifié : FOUND (UIMode + isRouted)
- [x] src/store/canalStore.ts modifié : FOUND (6 actions routing)
- [x] src/store/canalStore.test.ts modifié : FOUND (10 tests verts)
- [x] src/tests/routingGrid.test.ts : FOUND (15 it.todo)
- [x] Commit 7bb52c4 : FOUND
- [x] Commit f7ac6c3 : FOUND
- [x] TypeScript 0 erreur : VERIFIED
- [x] 10 tests store verts : VERIFIED

---
*Phase: 03-routing-optimal*
*Completed: 2026-04-30*

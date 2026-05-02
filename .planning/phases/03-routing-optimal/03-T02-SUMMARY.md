---
phase: 03-routing-optimal
plan: T02
subsystem: routing
tags: [typescript, ngraph, dijkstra, astar, web-worker, vitest, open-meteo, tdd]

# Dependency graph
requires:
  - phase: 03-routing-optimal/T01
    provides: "RoutingState, RoutingRequest, RoutingResult types + 6 actions Zustand routing + 15 stubs Wave 0"
provides:
  - "src/services/routingGrid.ts : 7 fonctions exportées (buildGrid, getResolution, validateCoords, haversineKm, fetchGridElevations, buildGraph, findNearestNode, findPath)"
  - "src/workers/routingWorker.ts : Web Worker isolé — reçoit RoutingRequest, postMessage RoutingResult"
  - "src/hooks/useRoutingWorker.ts : hook React gérant le cycle de vie du worker (spawn, timeout 30s, cleanup)"
  - "src/tests/routingGrid.test.ts : 18 tests VERTS remplaçant les 15 stubs it.todo Wave 0"
affects: [03-T03, canal-map, routing-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A* orienté sur grille NxN — oriented:true obligatoire pour contrainte hydraulique (eau ne coule pas en montée)"
    - ".reverse() systématique sur rawPath ngraph — chemin retourné end→start, inversé avant restitution"
    - "validateCoords avant tout fetch — STRIDE Tampering mitigation T-03-T02-01"
    - "Worker dans useRef (jamais Zustand) — objet non-sérialisable"
    - "URL littérale statique new Worker(new URL('...', import.meta.url)) — Pitfall 3 Vite"
    - "useCanalStore.getState() dans handlers Worker — anti-stale-closure pattern Phase 1/2"
    - "Timeout 30s + worker.terminate() — STRIDE DoS self-protection T-03-T02-02"

key-files:
  created:
    - src/services/routingGrid.ts
    - src/workers/routingWorker.ts
    - src/hooks/useRoutingWorker.ts
  modified:
    - src/tests/routingGrid.test.ts

key-decisions:
  - "haversineKm inline dans routingGrid.ts — évite import @turf dans le worker, formule standard suffisante"
  - "Résolution calculée approximativement dans useRoutingWorker (Math.hypot) — évite import @turf dans le hook, cohérent avec getResolution"
  - "fetchGridElevations : BATCH_SIZE=100 / CONCURRENCY=10 — confirmé par test live Open-Meteo (limite stricte 100 coords/req)"
  - "validateCoords appelée en tête de fetchGridElevations — validation côté worker avant fetch (T-03-T02-01)"
  - "oriented:true explicite avec commentaire CRITIQUE — T-03-T02-03 mitigé, impossible d'oublier"

patterns-established:
  - "TDD RED→GREEN : stubs it.todo Wave 0 devenus tests implémentés (RED commit) puis implémentation (GREEN commit)"
  - "Fonctions pures testables directement (sans Worker) — routingGrid.ts importé dans les tests vitest standard"

requirements-completed: [MAP-05]

# Metrics
duration: 12min
completed: 2026-04-30
---

# Phase 3 Plan T02: Moteur de Routing — Summary

**Dijkstra/A* orienté sur grille DEM NxN via ngraph.path dans Web Worker isolé, avec batching Open-Meteo 100-coords-max et timeout 30s**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-30T19:07:00Z
- **Completed:** 2026-04-30T19:12:00Z
- **Tasks:** 2 (Task 1 TDD en 3 commits RED+GREEN, Task 2 en 1 commit)
- **Files modified:** 4

## Accomplishments
- Service routingGrid.ts : 7 fonctions pures testables unitairement sans Worker (buildGrid, getResolution, validateCoords, haversineKm, fetchGridElevations, buildGraph, findNearestNode, findPath)
- 18 tests VERTS remplaçant les 15 stubs it.todo Wave 0 — TDD RED→GREEN complet, 0 todo, 0 failed
- routingWorker.ts : Web Worker isolé avec directive triple-slash, 3 types postMessage (result/no-path/error)
- useRoutingWorker.ts : cycle de vie complet — URL littérale statique Vite, timeout 30s, getState() anti-stale-closure
- TypeScript 0 erreur sur l'ensemble du projet, 43 tests verts (suite complète)

## Task Commits

1. **Test RED: stubs Wave 0 → tests complets** - `6b00529` (test)
2. **Task 1: routingGrid.ts + tests GREEN** - `f8654fd` (feat)
3. **Task 2: routingWorker.ts + useRoutingWorker.ts** - `cf58cb7` (feat)

_Note: Task 1 est TDD — 2 commits (test RED puis feat GREEN)_

## Files Created/Modified
- `src/services/routingGrid.ts` — 7 fonctions exportées : algo pur, batching Open-Meteo, graphe ngraph, A* orienté
- `src/workers/routingWorker.ts` — Web Worker : pipeline buildGrid→fetchElev→buildGraph→findPath→postMessage
- `src/hooks/useRoutingWorker.ts` — Hook React : spawn worker, timeout 30s, handlers getState(), cleanup
- `src/tests/routingGrid.test.ts` — 18 tests VERTS (15 stubs it.todo remplacés + 3 tests validateCoords ajoutés)

## Decisions Made
- `haversineKm` inline dans routingGrid.ts plutôt qu'import `@turf/distance` — réduit le bundle worker, formule standard suffisante
- Résolution calculée dans `useRoutingWorker` avec `Math.hypot` approximatif — cohérent avec `getResolution()`, évite une dépendance Turf dans le hook
- `validateCoords` appelée systématiquement au début de `fetchGridElevations` — T-03-T02-01 (STRIDE Tampering) mitigé côté service avant tout appel réseau

## Deviations from Plan

None - plan exécuté exactement tel qu'écrit. Les 3 fichiers et les tests correspondent exactement aux spécifications.

## Issues Encountered

None — toutes les dépendances (ngraph.path, ngraph.graph, @turf/turf) étaient déjà installées par la Phase de recherche. TypeScript 0 erreur au premier essai.

## User Setup Required

None - aucune configuration externe requise. App 100% client-side.

## Next Phase Readiness
- T03 peut consommer `useRoutingWorker()` dans le composant React : le hook s'active automatiquement quand `routingState === 'computing'`
- Les marqueurs MapLibre temporaires (Patterns 5) et le panneau de progression (SidePanel) restent à implémenter en T03
- Routing complet est opérationnel : les fonctions de `routingGrid.ts` peuvent être testées directement en important le service

## Self-Check: PASSED

- [x] src/services/routingGrid.ts : FOUND
- [x] src/workers/routingWorker.ts : FOUND
- [x] src/hooks/useRoutingWorker.ts : FOUND
- [x] src/tests/routingGrid.test.ts modifié : FOUND (18 tests VERTS)
- [x] Commit 6b00529 (RED) : FOUND
- [x] Commit f8654fd (GREEN routingGrid) : FOUND
- [x] Commit cf58cb7 (worker + hook) : FOUND
- [x] TypeScript 0 erreur : VERIFIED
- [x] 43 tests verts (suite complète) : VERIFIED
- [x] oriented:true présent : VERIFIED
- [x] .reverse() présent : VERIFIED
- [x] BATCH_SIZE=100 présent : VERIFIED
- [x] validateCoords présent : VERIFIED

---
*Phase: 03-routing-optimal*
*Completed: 2026-04-30*

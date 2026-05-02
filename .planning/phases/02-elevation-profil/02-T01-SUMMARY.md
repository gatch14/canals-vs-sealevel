---
phase: 02-elevation-profil
plan: T01
subsystem: types-store-tests
tags: [elevation, types, zustand, vitest, recharts, turf]
dependency_graph:
  requires: []
  provides:
    - ElevationPoint (src/types/elevation.ts)
    - UphillSegment (src/types/elevation.ts)
    - ElevationProfile (src/types/elevation.ts)
    - Canal.elevation? / elevationLoading? / elevationError? (src/types/canal.ts)
    - setElevation / setElevationLoading / setElevationError (src/store/canalStore.ts)
    - Wave 0 test stubs (src/tests/)
  affects:
    - T02 (consomme ElevationProfile, detectUphillSegments, actions store)
    - T03 (consomme ElevationProfile pour rendu Recharts + layer MapLibre)
tech_stack:
  added:
    - recharts@3.8.1 (graphique profil altimétrique — AreaChart + ReferenceArea)
    - "@turf/turf@7.3.5 (sampling 100 points + calcul longueur tracé)"
  patterns:
    - Zustand store extension (3 actions immuables via map + spread)
    - TypeScript types compile-time only (aucune surface runtime)
    - TDD Wave 0 stubs (tests RED intentionnels, résolus en T02)
key_files:
  created:
    - src/types/elevation.ts (ElevationPoint, UphillSegment, ElevationProfile)
    - src/tests/uphill.test.ts (5 tests RED — detectUphillSegments)
    - src/tests/samplePoints.test.ts (3 stubs todo)
    - src/tests/elevationApi.test.ts (6 stubs todo)
  modified:
    - src/types/canal.ts (import + 3 champs optionnels elevation/elevationLoading/elevationError)
    - src/store/canalStore.ts (import + 3 nouvelles actions dans interface + implémentation)
    - package.json / package-lock.json (recharts + @turf/turf ajoutés)
decisions:
  - recharts@3.8.1 installé (React-native SVG, ReferenceArea built-in, léger ~3KB gzip)
  - "@turf/turf@7.3.5 installé (full bundle — déjà décidé en contexte, along() + length())"
  - Tests uphill RED intentionnel — import elevationApi résolu en T02 (Wave 1)
  - Canal.elevation? optionnel — rétrocompatibilité Phase 1 garantie par le ?
metrics:
  duration: "3m 16s"
  completed_date: "2026-04-30"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 3
---

# Phase 02 Plan T01: Types + Store + Tests Wave 0 Summary

**One-liner:** Types ElevationProfile/UphillSegment/ElevationPoint avec extension rétrocompatible Canal + 3 actions Zustand setElevation/setElevationLoading/setElevationError + stubs de test Wave 0 (uphill RED, samplePoints/elevationApi todo).

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Installer dépendances + créer types | 2f503db | src/types/elevation.ts, src/types/canal.ts, package.json |
| 2 | Étendre canalStore + créer tests Wave 0 | a6f314b | src/store/canalStore.ts, src/tests/*.test.ts |

---

## What Was Built

### Task 1 — Dépendances + Types

- `recharts@3.8.1` et `@turf/turf@7.3.5` installés via npm
- `src/types/elevation.ts` créé avec 3 interfaces : `ElevationPoint`, `UphillSegment`, `ElevationProfile`
- `src/types/canal.ts` étendu : import `ElevationProfile` + 3 champs optionnels (`elevation?`, `elevationLoading?`, `elevationError?`) — rétrocompatibilité Phase 1 garantie par le `?`

### Task 2 — Store + Tests

- `src/store/canalStore.ts` étendu : import `ElevationProfile` + 3 nouvelles actions dans l'interface et l'implémentation (`setElevation`, `setElevationLoading`, `setElevationError`)
- `src/tests/uphill.test.ts` : 5 tests complets pour `detectUphillSegments` — RED (import `../services/elevationApi` non résolu, attendu jusqu'à T02)
- `src/tests/samplePoints.test.ts` : 3 stubs `.todo` pour `samplePoints`
- `src/tests/elevationApi.test.ts` : 6 stubs `.todo` pour `fetchElevations` + `buildProfile`

---

## Test State

| Suite | État | Raison |
|-------|------|--------|
| `canalStore.test.ts` | VERT (5 tests) | Phase 1 — inchangé |
| `uphill.test.ts` | RED (1 suite) | Import `elevationApi` non résolu — normal, T02 crée ce fichier |
| `samplePoints.test.ts` | TODO (3 stubs) | Implémentation en T02 |
| `elevationApi.test.ts` | TODO (6 stubs) | Implémentation en T02 |

**Résultat `npm test`:** 5 passed, 9 todo, 1 suite failed (RED attendu selon plan).

---

## Deviations from Plan

None - plan exécuté exactement comme écrit.

---

## Known Stubs

Tous les stubs sont intentionnels et documentés dans le plan T01 comme Wave 0 :

| Stub | File | Raison |
|------|------|--------|
| `import { detectUphillSegments } from '../services/elevationApi'` | src/tests/uphill.test.ts | `elevationApi.ts` créé en T02 — RED intentionnel |
| `// import { samplePoints } from '../services/elevationApi'` | src/tests/samplePoints.test.ts | Commenté jusqu'à T02 — `.todo` intentionnels |
| `// import { fetchElevations, buildProfile }` | src/tests/elevationApi.test.ts | Commenté jusqu'à T02 — `.todo` intentionnels |

---

## Threat Flags

Aucune surface de sécurité nouvelle introduite par ce plan :
- Les types sont compile-time only (aucun runtime exposure)
- Le store Zustand est in-memory, aucune donnée sensible

---

## Self-Check: PASSED

Fichiers créés :
- src/types/elevation.ts — FOUND
- src/types/canal.ts — FOUND (modifié)
- src/store/canalStore.ts — FOUND (modifié)
- src/tests/uphill.test.ts — FOUND
- src/tests/samplePoints.test.ts — FOUND
- src/tests/elevationApi.test.ts — FOUND

Commits :
- 2f503db — FOUND
- a6f314b — FOUND

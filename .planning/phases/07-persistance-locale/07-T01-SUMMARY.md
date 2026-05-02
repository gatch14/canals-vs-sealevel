---
phase: 07-persistance-locale
plan: T01
subsystem: database
tags: [dexie, indexeddb, fake-indexeddb, vitest, tdd, typescript]

requires:
  - phase: 06-dashboard-global
    provides: canalStore avec calcParams, types Canal/CalcParams finalisés

provides:
  - StoredCanal = Omit<Canal, 'elevation' | 'elevationLoading' | 'elevationError'> exporté depuis types/canal.ts
  - persistence.test.ts avec 5 tests RED couvrant PERS-01/02/03 (attend db.ts T02)
  - canalStore.test.ts étendu avec stubs RED clearAll/hydrateCanals (attend T02)
  - dexie 4.4.2 + fake-indexeddb 6.2.5 installés

affects: [07-T02, 07-T03]

tech-stack:
  added: [dexie@4.4.2, fake-indexeddb@6.2.5]
  patterns:
    - "TDD Wave 0 : stubs RED avant implémentation — import échoue volontairement"
    - "StoredCanal = Omit<Canal, champs éphémères> — sépare persisté vs. éphémère"

key-files:
  created:
    - src/tests/persistence.test.ts
  modified:
    - src/types/canal.ts
    - src/store/canalStore.test.ts
    - package.json

key-decisions:
  - "StoredCanal exclut elevation/elevationLoading/elevationError : champs éphémères re-fetchés à la demande, jamais stockés (économie quota, pas de stale data)"
  - "fake-indexeddb/auto importé en tête de persistence.test.ts pour polyfiller jsdom — pattern recommandé Dexie v4"
  - "Tests RED stubs canalStore : clearAll remet TOUS les champs à leur valeur initiale, calcParams inclus"

patterns-established:
  - "Pattern RED Wave 0 : créer les tests avant l'implémentation, imports qui échouent = RED confirmé"
  - "Pattern StoredCanal : Omit supprime les champs Phase 2 éphémères, garantit rétrocompatibilité Canal"

requirements-completed: [PERS-01, PERS-02, PERS-03]

duration: 15min
completed: 2026-05-02
---

# Phase 7 Plan T01: Installation dépendances + types StoredCanal + stubs tests RED — Summary

**Stubs TDD Wave 0 : StoredCanal = Omit<Canal, elevation*>, dexie 4.4.2 installé, 11 tests RED couvrant PERS-01/02/03 en attente de db.ts (T02)**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-02T09:25:00Z
- **Completed:** 2026-05-02T09:40:00Z
- **Tasks:** 4 (Task 1 déjà commitée avant démarrage)
- **Files modified:** 3

## Accomplishments

- dexie 4.4.2 (runtime) + fake-indexeddb 6.2.5 (devDep) installés — Task 1 (commit c1e1fec)
- StoredCanal exporté depuis src/types/canal.ts : exclut elevation/elevationLoading/elevationError, TypeScript vert
- persistence.test.ts créé avec 5 tests RED couvrant PERS-01 (CRUD canals), PERS-02 (settings round-trip), PERS-03 (transaction atomique)
- canalStore.test.ts étendu avec 6 stubs RED pour clearAll (PERS-03) et hydrateCanals (PERS-01), 13 tests existants restent GREEN

## Task Commits

1. **Task 1: Installer dexie + fake-indexeddb** - `c1e1fec` (feat) — DÉJÀ COMMITÉE
2. **Task 2: StoredCanal dans types/canal.ts** - `7ee4210` (feat)
3. **Task 3: persistence.test.ts stubs RED** - `3605d00` (test)
4. **Task 4: clearAll + hydrateCanals stubs RED dans canalStore.test.ts** - `3c45642` (test)

## Files Created/Modified

- `src/types/canal.ts` — StoredCanal = Omit<Canal, 'elevation' | 'elevationLoading' | 'elevationError'> ajouté en fin de fichier
- `src/tests/persistence.test.ts` — créé : 5 tests RED (PERS-01/02/03), import fake-indexeddb/auto, attend db.ts
- `src/store/canalStore.test.ts` — 6 stubs RED ajoutés pour clearAll (PERS-03) et hydrateCanals (PERS-01)

## Decisions Made

- StoredCanal exclut les champs elevation* : champs éphémères recalculés à la demande par useElevation, jamais persistés (économie quota IndexedDB, évite données obsolètes)
- Tests RED intentionnels : import `../services/db` échoue car db.ts n'existe pas encore — comportement attendu Wave 0

## Deviations from Plan

None — plan exécuté exactement comme spécifié.

## Issues Encountered

None.

## Known Stubs

- `src/tests/persistence.test.ts` : import `../services/db` échoue intentionnellement — sera résolu par T02 qui crée `src/services/db.ts`
- `src/store/canalStore.test.ts` : clearAll et hydrateCanals absents du store — seront ajoutés par T02

Ces stubs sont intentionnels (pattern TDD Wave 0). Ils ne bloquent pas l'objectif du plan (établir les contrats RED avant implémentation).

## Next Phase Readiness

- T02 (Wave 1) peut créer `src/services/db.ts` avec Dexie, les types StoredCanal sont prêts
- T02 peut ajouter clearAll + hydrateCanals au store pour passer les tests RED en GREEN
- TypeScript compile sans erreurs — base saine pour l'implémentation

---
*Phase: 07-persistance-locale*
*Completed: 2026-05-02*

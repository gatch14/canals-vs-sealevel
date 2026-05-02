---
phase: 07-persistance-locale
plan: T02
subsystem: database
tags: [dexie, indexeddb, zustand, vitest, tdd, typescript, persistence]

# Dependency graph
requires:
  - phase: 07-T01
    provides: StoredCanal type, dexie 4.4.2 installé, stubs RED persistence.test.ts + canalStore.test.ts (clearAll/hydrateCanals)

provides:
  - src/services/db.ts : singleton Dexie CanalDatabase avec tables canals (StoredCanal) + settings (SettingsRecord)
  - clearAll() + hydrateCanals() actions dans canalStore (Zustand)
  - src/hooks/usePersistence.ts : hydration au montage + subscribe Zustand→Dexie + cleanup StrictMode safe
  - 101/101 tests GREEN (89 existants + 12 nouveaux tests persistence)

affects: [07-T03]

# Tech tracking
tech-stack:
  added: []  # dexie déjà installé en T01
  patterns:
    - "Singleton Dexie CanalDatabase extends Dexie avec tables typées (Table<StoredCanal, string>)"
    - "Subscribe basique Zustand avec comparaison de références (sans subscribeWithSelector)"
    - "Exclusion elevation* via destructuring avant persistance IndexedDB"
    - "bulkPut + bulkDelete(orphelins) — pattern sync bidirectionnel complet (Pitfall 6)"
    - "cancelled flag + unsub() — cleanup StrictMode safe (useEffect[])"

key-files:
  created:
    - src/services/db.ts
    - src/hooks/usePersistence.ts
  modified:
    - src/store/canalStore.ts

key-decisions:
  - "Subscribe basique Zustand (sans subscribeWithSelector) : évite de modifier la signature TypeScript du store et de mettre à jour tous les tests existants"
  - "usePersistence monté dans SidePanel.tsx (T03) pour cohérence avec useElevation + useRoutingWorker"
  - "StoredCanal (Omit<Canal, elevation*>) utilisé pour la table canals — elevation re-fetchée par useElevation après hydration"

patterns-established:
  - "Pattern db.ts : classe Dexie étendue exportée comme singleton — unique connexion IndexedDB par app"
  - "Pattern subscribe Zustand sans selector : comparaison prévCanals !== state.canals pour détecter mutations"
  - "Pattern bulkPut + bulkDelete : sync complet (upsert + suppression orphelins) à chaque mutation canals"

requirements-completed: [PERS-01, PERS-02, PERS-03]

# Metrics
duration: 2min
completed: 2026-05-02
---

# Phase 7 Plan T02: db.ts + actions store + usePersistence.ts — Summary

**Service Dexie singleton (db.ts), actions clearAll/hydrateCanals dans le store Zustand, hook usePersistence.ts avec hydration au montage et subscribe sync — 101/101 tests GREEN**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-02T07:30:03Z
- **Completed:** 2026-05-02T07:32:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `src/services/db.ts` créé : CanalDatabase extends Dexie, tables canals (StoredCanal, PK=id UUID) + settings (SettingsRecord, PK=key), export const db singleton
- `canalStore.ts` étendu : clearAll() remet tous les champs à l'état initial (canals=[], calcParams=DEFAULT), hydrateCanals(canals) remplace le tableau — 19/19 tests store GREEN
- `src/hooks/usePersistence.ts` créé : hydration Promise.all, subscribe basique Zustand avec comparaison de références, bulkPut+bulkDelete orphelins, cleanup cancelled+unsub()
- Suite complète 101/101 tests GREEN — zéro régression sur les 89 tests existants, 12 nouveaux tests persistence verts

## Task Commits

1. **Task 1: Créer src/services/db.ts** - `f98d7a1` (feat)
2. **Task 2: Ajouter clearAll + hydrateCanals** - `623d5df` (feat)
3. **Task 3: Créer src/hooks/usePersistence.ts** - `766d214` (feat)

## Files Created/Modified

- `src/services/db.ts` — singleton Dexie CanalDatabase, schema v1 (canals + settings), zéro logique métier
- `src/store/canalStore.ts` — +clearAll() +hydrateCanals() dans interface et create()
- `src/hooks/usePersistence.ts` — hydration montage + subscribe Zustand→Dexie + StrictMode cleanup

## Decisions Made

- Subscribe basique Zustand sans subscribeWithSelector : évite modification de la signature TypeScript du store existant et mise à jour des tests ; la comparaison de références (`!==`) suffit pour détecter les mutations Zustand qui créent toujours de nouvelles références
- Exclusion de `elevation*` via destructuring dans usePersistence avant persistance : conforme à StoredCanal (Omit), protège le quota IndexedDB, évite données obsolètes au rechargement (useElevation re-fetche en ~500ms)
- usePersistence sera monté dans SidePanel.tsx (T03) par cohérence avec useElevation + useRoutingWorker

## Deviations from Plan

None — plan exécuté exactement comme spécifié.

## Issues Encountered

None.

## Known Stubs

Aucun stub — usePersistence.ts implémenté complètement. Le hook sera branché dans SidePanel.tsx en T03.

## Threat Flags

Aucun nouveau surface de sécurité non couvert par le threat model du plan.

## Next Phase Readiness

- T03 (Wave 2) peut brancher `usePersistence()` dans SidePanel.tsx et créer `ClearDataButton.tsx`
- db.ts, canalStore (clearAll/hydrateCanals) et usePersistence.ts sont tous opérationnels
- 0 régression sur les 89 tests existants — base saine pour T03

---
*Phase: 07-persistance-locale*
*Completed: 2026-05-02*

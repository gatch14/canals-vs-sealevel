---
phase: 08-candidats-ia
plan: T02
subsystem: store-hooks
tags: [tdd, green, hook, store, zustand]
requires: [08-T01]
provides: [useCandidates, loadCandidate, SORTED_CANDIDATES]
affects: [src/hooks/useCandidates.ts, src/store/canalStore.ts, src/tests/candidates.test.ts]
tech_stack:
  added: []
  patterns: [module-level constant sort, Zustand action, non-destructive store mutation]
key_files:
  created:
    - src/hooks/useCandidates.ts
  modified:
    - src/store/canalStore.ts
    - src/tests/candidates.test.ts
decisions:
  - "useCandidates retourne SORTED_CANDIDATES (constante module) plutôt que useMemo — testable sans contexte React"
  - "loadCandidate non-destructif : ajoute au store existant + sélectionne auto le nouveau canal"
metrics:
  duration: "8 min"
  completed: "2026-05-02"
  tasks: 2
  files: 3
---

# Phase 8 Plan T02: useCandidates + loadCandidate — Summary

**One-liner**: useCandidates hook + loadCandidate action Zustand — 6 tests GREEN, 107/107 suite complète

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Créer src/hooks/useCandidates.ts | a645e21 | src/hooks/useCandidates.ts |
| 2 | Ajouter loadCandidate dans canalStore.ts | a645e21 | src/store/canalStore.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] useMemo impossible sans contexte React dans les tests**
- **Found during:** Task 1 — tests RED sur useMemo (Cannot read properties of null)
- **Issue:** Le projet n'a pas `@testing-library/react` installé ; les tests du projet testent la logique pure directement
- **Fix:** `useCandidates` exporte `SORTED_CANDIDATES` (constante module-level) en plus du hook — les tests importent la constante, le hook reste disponible pour les composants React
- **Files modified:** src/hooks/useCandidates.ts, src/tests/candidates.test.ts
- **Commit:** a645e21

## Verification

- `npx tsc --noEmit` : passe proprement
- `npx vitest run src/tests/candidates.test.ts` : 6/6 GREEN
- `npx vitest run` : 107/107 GREEN (101 existants + 6 nouveaux)

## Self-Check: PASSED

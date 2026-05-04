---
phase: 08-candidats-ia
plan: T01
subsystem: data-types
tags: [tdd, candidates, types, json]
requires: []
provides: [CanalCandidate, CANDIDATES, candidates.json, candidates.test.ts]
affects: [src/types/candidate.ts, src/data/candidates.json, src/tests/candidates.test.ts]
tech_stack:
  added: []
  patterns: [TDD RED, static JSON bundle, TypeScript interface]
key_files:
  created:
    - src/types/candidate.ts
    - src/data/candidates.json
    - src/tests/candidates.test.ts
decisions:
  - "25 candidats couvrant tous continents habités, triés dsl_max décroissant"
  - "CANDIDATES importé depuis JSON statique — zéro appel réseau"
  - "Tests RED échouent sur import manquant useCandidates (attendu)"
metrics:
  duration: "5 min"
  completed: "2026-05-02"
  tasks: 3
  files: 3
---

# Phase 8 Plan T01: Type CanalCandidate + candidates.json + Tests RED — Summary

**One-liner**: Type CanalCandidate avec CANDIDATES statique + 25 candidats mondiaux (Qattara #1, 3.59 mm max) + tests RED sur useCandidates/loadCandidate inexistants

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Créer src/types/candidate.ts | aef2c50 | src/types/candidate.ts |
| 2 | Créer src/data/candidates.json | aef2c50 | src/data/candidates.json |
| 3 | Créer src/tests/candidates.test.ts | aef2c50 | src/tests/candidates.test.ts |

## Deviations from Plan

None — plan exécuté exactement comme écrit.

## Verification

- `npx tsc --noEmit` : passe proprement
- `node -e "..."` : 25 candidats, Qattara #1, tous les points valides
- `npx vitest run src/tests/candidates.test.ts` : échoue avec "module not found useCandidates" — état RED confirmé

## Self-Check: PASSED

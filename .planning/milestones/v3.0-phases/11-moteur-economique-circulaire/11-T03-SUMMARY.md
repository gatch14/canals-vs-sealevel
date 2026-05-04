---
plan: T03
phase: 11-moteur-economique-circulaire
status: complete
wave: 2
---

# Phase 11 Plan T03: useCircular Hook — Summary

## One-liner

Hook React `useCircular` connectant `circularEngine` au store Zustand via `useMemo`, avec recalcul interne de `DesalinationResult` (no hook-in-hook).

## File Created

`src/hooks/useCircular.ts` — 49 lignes

### Exports

- `useCircular(): CircularResult | null`

## Pattern Used

Pattern identique à `useDesalination.ts` :
- Import module-level `DESERT_FEATURES = desertZones as unknown as FeatureCollection` (Pitfall P5 — pas de recréation d'objet à chaque render)
- `useMemo` sur `[selectedCanalId, canals, desalinationEnabled]` (Pitfall P2 — pas de recalcul inutile)
- Guard `if (!desalinationEnabled) return null` en tête de memo
- Guard `if (!desalResult || desalResult.nodes === 0) return null` avant `computeCircularAnalysis`

## Architecture Constraint Respected

Le store ne contient pas `desalinationResult` — seulement `desalinationEnabled: boolean`.
`useCircular` recalcule `DesalinationResult` en interne via `computeDesalinationAnalysis()`.
Aucun import de `useDesalination` (Pitfall P1 — no hook-in-hook).

## Pitfalls Avoided

- **P1** — Pas de hook-in-hook : `computeDesalinationAnalysis` appelé directement, pas `useDesalination`
- **P2** — `useMemo` avec dépendances précises, pas de recalcul à chaque render
- **P5** — Import module-level de `desertZones`, pas d'objet inline dans le memo

## Acceptance Criteria

| Critère | Résultat |
|---------|---------|
| `export function useCircular` = 1 | 1 |
| `useMemo` = 1 | 1 (+ 2 dans commentaires) |
| `desalinationEnabled` >= 2 | 3 |
| `computeDesalinationAnalysis` = 1 | 1 |
| `computeCircularAnalysis` = 1 | 1 |
| `DESERT_FEATURES = desertZones` = 1 | 1 |
| `useDesalination` import/call = 0 | 0 (2 mentions en commentaires uniquement) |

## Verification

- `npx tsc --noEmit` : exit 0 — TypeScript propre
- `npm run test` : 196/196 tests GREEN — aucune régression

## Commit

`f8d53c2` — feat(11): Wave 2 — useCircular hook connecting circularEngine to Zustand store

## Deviations from Plan

Aucune — plan exécuté exactement tel qu'écrit. Les noms de champs `DesalinationResult`
(`habitableZones`, `saltValue`, `waterProduction`) sont conformes à la signature réelle.

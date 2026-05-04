---
plan: T03
phase: 12-roi-break-even
status: complete
wave: 2
key-files:
  created:
    - src/hooks/useROI.ts
decisions:
  - No hook-in-hook: desal + circular recalculés en interne (Pitfall P1)
  - Pas de guard desalinationEnabled: canal sans désal a quand même un ROI construction
  - Guard canal.elevation required avant computeCalculation
  - calcParams comme 4e sélecteur Zustand (vs 3 dans useCircular)
---

# Phase 12 Plan T03: useROI Hook Summary

Hook React `useROI` créant le pont entre `roiEngine` et le store Zustand via `useMemo`.

## Ce qui a été créé

**`src/hooks/useROI.ts`** — Hook orchestrateur Wave 2, patron identique à `useCircular.ts` avec 4 différences clés documentées ci-dessous.

## Différences clés vs useCircular.ts

1. **4e sélecteur store** : `calcParams = useCanalStore((s) => s.calcParams)` — requis pour passer `width`/`depth` à `computeCalculation`.

2. **Pas de guard sur `desalinationEnabled`** : `useCircular` retourne `null` si `!desalinationEnabled`. `useROI` continue car le coût de construction du canal génère un ROI indépendamment du dessalement.

3. **Guard `canal.elevation` obligatoire** : `if (!canal.elevation || canal.elevationLoading) return null` — `computeCalculation` requiert un profil d'élévation, sans lequel le coût ne peut être calculé.

4. **Appel `computeCalculation` en amont** : calcule `costMEur` avant toute analyse désal/circulaire. Guard `if (!calcResult) return null` ensuite.

5. **deps useMemo** : `[selectedCanalId, canals, desalinationEnabled, calcParams]` (4 deps vs 3 dans useCircular).

6. **Type de retour** : `RoiResult | null` (vs `CircularResult | null`).

## Pièges évités

- **P1 (no hook-in-hook)** : desal + circular recalculés directement sans importer `useDesalination` ou `useCircular`.
- **P2 (useMemo obligatoire)** : tous les calculs dans `useMemo` avec deps exhaustives.
- `calcParams.width`/`calcParams.depth` passés comme `widthM`/`depthM` à `computeCalculation` (noms de params différents dans la signature).

## Vérifications

- TypeScript : `npx tsc --noEmit` — exit 0, aucune erreur
- Suite tests : 223/223 GREEN, 14 fichiers, aucune régression

## Self-Check: PASSED

- `src/hooks/useROI.ts` : FOUND
- Commit `523c055` : FOUND

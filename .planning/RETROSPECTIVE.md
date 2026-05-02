# Retrospective — Canal

## Milestone: v3.0 — Économie Circulaire & ROI

**Shipped:** 2026-05-02
**Phases:** 3 (11–13) | **Plans:** 8 | **Duration:** ~3 heures (même journée)

### What Was Built

- `circularEngine.ts` — 7 fonctions pures calculant la chaîne co-produits (spiruline, aquaculture, minéraux, terres arables, durée de vie, habitabilité)
- `roiEngine.ts` — 6 fonctions ROI (valeur annuelle, ROI@25/50/100 ans, break-even, tableau multi-canaux)
- `useCircular.ts` / `useROI.ts` — hooks useMemo câblant moteurs purs → Zustand store
- `EconomicPanel.tsx` — accordéon 4 états + tableau comparatif trié par break-even

### What Worked

- Pattern TDD Wave 0 (stubs RED) → Wave 1 (engine GREEN) → Wave 2 (hook+UI) — exécution fluide et prévisible
- Moteurs purs zéro React/Zustand = testables sans DOM, composables facilement
- `calcAridityFactor` importé de `meteorologyEngine` (DRY) — réutilisation cross-phase propre
- Phase 13 s'est exécutée en 2 plans au lieu de 3 grâce à la simplification EconomicPanel+SidePanel

### What Was Inefficient

- Phase 12 VERIFICATION a flagué le guard `desalinationEnabled` comme gap, mais c'était le comportement intentionnel (état C Phase 13) — double-travail de vérification
- CIRC-01/02/03 : tonnes/an calculées mais non affichées — découvert seulement par l'integration checker à la clôture (auraient dû être dans le plan UI Phase 13)
- SUMMARYs phases 11/12 sans `requirements_completed` frontmatter — impact sur 3-source cross-reference de l'audit

### Patterns Established

- Hook sans hook-in-hook : recalculer les dépendances en interne (desal, circular) plutôt qu'importer d'autres hooks
- `DESERT_FEATURES` au niveau module (pas dans useMemo dep array) pour les données statiques GeoJSON
- `useMemo` avec dep array explicite `[selectedCanalId, canals, desalinationEnabled, calcParams]`

### Key Lessons

- Documenter le comportement `desalinationEnabled=false → état C amber banner` explicitement dans le plan AVANT l'exécution — évite que le verifier le flague comme gap
- Ajouter `requirements_completed` au frontmatter de TOUS les SUMMARYs, pas seulement le dernier
- L'integration checker est précieux pour trouver les display gaps (tonnes vs €/an) que le verifier manque

---

## Cross-Milestone Trends

| Metric | v1.0 | v2.0 | v3.0 |
|--------|------|------|------|
| Phases | 6 | 4 | 3 |
| Tests final | ~100 | 196 | 223 |
| Pattern | TDD | TDD | TDD |
| Durée | ~3 jours | ~1 jour | ~3 heures |
| Vélocité | baseline | 3x | 6x |

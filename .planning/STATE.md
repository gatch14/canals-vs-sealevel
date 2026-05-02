---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Économie Circulaire & ROI
status: in_progress
last_updated: "2026-05-02T17:00:00Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 33
---

# STATE — Canal

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value**: Déterminer si un réseau mondial de canaux peut neutraliser la montée des eaux — estimation chiffrée de l'impact potentiel
**Current focus**: Milestone v3.0 — Économie Circulaire & ROI

---

## Current Position

Phase: 12 — ROI & Break-even
Plan: T01 (Wave 0 TDD — types + stubs + RED tests)
Status: T01 complete — Wave 0 RED, prêt pour T02 (Wave 1 implémentation)
Last activity: 2026-05-02 — T01 exécuté : 3 fichiers créés, 27 tests RED (21 failures), tsc 0 erreur

---

## Phase Completion

| Phase | Status | Completed |
|-------|--------|-----------|
| 11. Moteur Économique Circulaire | ✅ Complete | 2026-05-02 |
| 12. ROI & Break-even | In progress (T01 complete) | - |
| 13. Dashboard ROI | Not started | - |

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total (v1+v2+v3) | 13 |
| Tests GREEN (v1+v2+v3.11) | 196/196 |
| v3 requirements | 10 |
| v3 phases | 3 |

---

## Accumulated Context

### Key Decisions (carried from v2)

- Stack : MapLibre GL JS + React + Vite + TypeScript + Turf.js + Tailwind CSS v4 + Zustand + recharts
- Architecture 100% client-side — zéro backend, zéro serveur, zéro clé API obligatoire
- Toutes les valeurs affichées comme intervalles [min, max] — jamais comme valeurs ponctuelles (UX-01)
- Formule centrale : ΔSL (mm) = Volume (km³) / 361,8
- Modules de calcul purs testables sans DOM (pattern établi v1+v2)
- TDD : stubs RED → implémentation GREEN → UI (pattern établi v1+v2)

### Key Decisions (v3)

- Phase 11 = circularEngine.ts (CIRC-01–04, VIE-01–02) — moteur pur, dépend de Phase 9 (dessalement fournit les données de base sur le bassin terminal et la saumure)
- Phase 12 = roiEngine.ts (ROI-01–04) — agrège les sorties de circularEngine + calculationEngine (coût construction de CALC-03)
- Phase 13 = UI Dashboard ROI — affiche toute la chaîne de valeur, dépend de Phase 12
- ROI-04 (tableau comparatif multi-canaux) inclus en Phase 12 au niveau moteur, rendu en Phase 13

### Phase 11 Decisions (locked)

- circularEngine.ts : 7 fonctions pures + orchestrateur, zéro React/Zustand
- LIFESPAN_HUMID_FACTOR ajusté à 1.0 (au lieu de 0.8) pour que le canal tempéré reste >= 20 ans
- useCircular.ts : recompute DesalinationResult en interne (desalinationResult non stocké dans le store)
- calcAridityFactor importé de meteorologyEngine (DRY)

### Blockers

(aucun)

---

## Session Continuity

**Last updated**: 2026-05-02
**Last action**: Phase 12 T01 Wave 0 TDD — types RoiParams/RoiResult/RoiSummary + 6 stubs + 27 tests RED (commit f546881)
**Next action**: Exécuter T02 (Wave 1 — implémentation roiEngine.ts pour passer les tests en GREEN)

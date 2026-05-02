---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Économie Circulaire & ROI
status: planning
last_updated: "2026-05-02T15:00:00.000Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# STATE — Canal

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value**: Déterminer si un réseau mondial de canaux peut neutraliser la montée des eaux — estimation chiffrée de l'impact potentiel
**Current focus**: Milestone v3.0 — Économie Circulaire & ROI

---

## Current Position

Phase: Not started (roadmap défini)
Plan: —
Status: Prêt à planifier la Phase 11
Last activity: 2026-05-02 — Roadmap v3.0 créée (phases 11–13)

---

## Phase Completion

| Phase | Status | Completed |
|-------|--------|-----------|
| 11. Moteur Économique Circulaire | Not started | - |
| 12. ROI & Break-even | Not started | - |
| 13. Dashboard ROI | Not started | - |

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total (v1+v2+v3) | 13 |
| Tests GREEN (v1+v2) | 166/166 |
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

### Blockers

(aucun)

---

## Session Continuity

**Last updated**: 2026-05-02
**Last action**: Roadmap v3.0 créée — 3 phases (11 Moteur Circulaire, 12 ROI, 13 Dashboard ROI), 10/10 requirements mappés
**Next action**: /gsd-plan-phase 11

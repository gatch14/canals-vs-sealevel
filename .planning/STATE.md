---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Économie Circulaire & ROI
status: planning
last_updated: "2026-05-02T15:00:00.000Z"
progress:
  total_phases: 0
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

Phase: Not started (defining roadmap)
Plan: —
Status: Defining roadmap
Last activity: 2026-05-02 — Milestone v3.0 started

---

## Phase Completion

(phases à définir par le roadmapper)

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total (v1+v2) | 10 |
| Tests GREEN (v1+v2) | 166/166 |
| v3 requirements | 10 |

---

## Accumulated Context

### Key Decisions (carried from v2)

- Stack : MapLibre GL JS + React + Vite + TypeScript + Turf.js + Tailwind CSS v4 + Zustand + recharts
- Architecture 100% client-side — zéro backend, zéro serveur, zéro clé API obligatoire
- Toutes les valeurs affichées comme intervalles [min, max] — jamais comme valeurs ponctuelles (UX-01)
- Formule centrale : ΔSL (mm) = Volume (km³) / 361,8
- Modules de calcul purs testables sans DOM (pattern établi v1+v2)
- TDD : stubs RED → implémentation GREEN → UI (pattern établi v1+v2)

### Blockers

(aucun)

---

## Session Continuity

**Last updated**: 2026-05-02
**Last action**: Milestone v3.0 initialisé — requirements définis (10 req : CIRC-01–04, VIE-01–02, ROI-01–04)
**Next action**: Roadmap v3.0 à créer

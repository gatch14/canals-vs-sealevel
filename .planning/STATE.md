---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Persistence, IA & Écologie Avancée
status: in_progress
last_updated: "2026-05-02T00:00:00Z"
progress:
  total_phases: 10
  completed_phases: 6
  total_plans: 18
  completed_plans: 18
  percent: 0
---

# STATE — Canal

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30)

**Core value**: Déterminer si un réseau mondial de canaux peut neutraliser la montée des eaux — estimation chiffrée de l'impact potentiel
**Current focus**: Milestone v2.0 — Phase 7: Persistance Locale

---

## Current Status

**Active phase**: Phase 7 — Persistance Locale
**Status**: MILESTONE v2.0 IN PROGRESS — v1.0 complete (6/6 phases), v2.0 starting (0/4 phases)

---

## Phase Completion

| Phase | Name | Status |
|-------|------|--------|
| 1 | Map Shell + Tracé | Complete (3/3 plans) |
| 2 | Élévation + Profil | Complete (3/3 plans) |
| 3 | Routing Optimal | Complete (3/3 plans) |
| 4 | Moteur de Calcul | Complete (3/3 plans) |
| 5 | Analyse Écologique | Complete (3/3 plans) |
| 6 | Dashboard Global | Complete (3/3 plans) |
| 7 | Persistance Locale | Not started |
| 8 | Candidats IA | Not started |
| 9 | Eau Salée & Dessalement | Not started |
| 10 | Impact Météorologique | Not started |

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total (v1+v2) | 10 |
| Requirements mapped (v1) | 18/18 |
| Requirements mapped (v2) | 0/13 |
| Plans completed (v1) | 18/18 |
| Plans completed (v2) | 0/TBD |
| Tests GREEN (v1) | 89/89 |

---

## Accumulated Context

### Key Decisions

- Stack : MapLibre GL JS + React + Vite + TypeScript + Turf.js + Tailwind CSS v4 + Zustand + recharts
- DEM : Copernicus GLO-30 via Open-Meteo Elevation API (CORS natif, gratuit, sans auth)
- Routing : Dijkstra sur grille élévation en Web Worker (ngraph.path)
- Persistance : IndexedDB / Dexie.js (Phase 7)
- Architecture 100% client-side — zéro backend, zéro serveur, zéro clé API obligatoire
- Formule centrale : ΔSL (mm) = Volume (km³) / 361,8
- Toutes les valeurs affichées comme intervalles [min, max] — jamais comme valeurs ponctuelles (UX-01)
- OCEAN_AREA_DIVISOR=361.8 et IPCC_ANNUAL_RATE_MM=4.5 — constantes locked
- IPCC_2100_RANGE_MM: Interval = [300, 1000] — RCP2.6 (300mm) à RCP8.5 (1000mm) horizon 2100
- 3 scénarios dashboard : optimiste 1.0, réaliste 0.6, pessimiste 0.3
- Tous les modules de calcul purs (calculationEngine, ecologyEngine, dashboardEngine) — testables sans DOM
- Candidats IA : données pre-computed bundlées en JSON statique — zéro appel réseau au chargement

### Blockers

(aucun)

---

## Session Continuity

**Last updated**: 2026-05-02
**Last action**: Roadmap v2.0 créée — phases 7-10 définies, 13 requirements v2 couverts
**Next action**: /gsd-plan-phase 7 — Persistance Locale (PERS-01, PERS-02, PERS-03)

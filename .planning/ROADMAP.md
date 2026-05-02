# ROADMAP — Canal

## Overview

13 phases | 41 requirements | App web scientifique 100% client-side pour étudier l'impact d'un réseau mondial de canaux sur la montée des eaux.

---

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-04-30)
- ✅ **v2.0 Persistence, IA & Écologie Avancée** — Phases 7–10 (shipped 2026-05-02)
- ✅ **v3.0 Économie Circulaire & ROI** — Phases 11–13 (shipped 2026-05-02)

---

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–6) — SHIPPED 2026-04-30</summary>

- [x] **Phase 1: Map Shell + Tracé** — Carte monde interactive avec outil de dessin de canal (MAP-01, MAP-02)
- [x] **Phase 2: Élévation + Profil** — Profil altimétrique du tracé avec flag des segments en montée (MAP-03, MAP-04)
- [x] **Phase 3: Routing Optimal** — Algorithme Dijkstra sur grille DEM pour tracé automatique (MAP-05)
- [x] **Phase 4: Moteur de Calcul** — Volume, impact ΔSL, coût, impact partiel, affichage intervalles (CALC-01–05, UX-01)
- [x] **Phase 5: Analyse Écologique** — Zones désertiques, verdissement, bassins endorheïques, risques climatiques (ECO-01–04)
- [x] **Phase 6: Dashboard Global** — ΔSL cumulé, scénarios et comparaison IPCC (GLOB-01–03)

Full phase details → `.planning/milestones/v3.0-ROADMAP.md`

</details>

<details>
<summary>✅ v2.0 Persistence, IA & Écologie Avancée (Phases 7–10) — SHIPPED 2026-05-02</summary>

- [x] **Phase 7: Persistance Locale** — Canaux et paramètres survivent au refresh via IndexedDB Dexie.js (PERS-01–03)
- [x] **Phase 8: Candidats IA** — Bibliothèque de canaux mondiaux pré-calculés chargeables en un clic (IA-01–03)
- [x] **Phase 9: Eau Salée & Dessalement** — Impact contextuel eau salée + nœuds dessalement solaire (ECO-05, DESAL-01–05)
- [x] **Phase 10: Impact Météorologique** — Évaporation, précipitations, refroidissement et indice de risque climatique (METEO-01–05)

Full phase details → `.planning/milestones/v3.0-ROADMAP.md`

</details>

<details>
<summary>✅ v3.0 Économie Circulaire & ROI (Phases 11–13) — SHIPPED 2026-05-02</summary>

- [x] **Phase 11: Moteur Économique Circulaire** — circularEngine.ts — production spiruline, aquaculture, engrais, surface agricole, durée de vie, habitabilité (CIRC-01–04, VIE-01–02)
- [x] **Phase 12: ROI & Break-even** — roiEngine.ts — valeur totale annuelle, ROI à 25/50/100 ans, break-even, comparaison multi-canaux (ROI-01–04)
- [x] **Phase 13: Dashboard ROI** — EconomicPanel.tsx — accordéon 4 états, 6 co-produits, ROI@25/50/100, tableau comparatif multi-canaux

Full phase details → `.planning/milestones/v3.0-ROADMAP.md`

</details>

---

## Progress Table

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Map Shell + Tracé | v1.0 | 3/3 | ✅ Complete | 2026-04-30 |
| 2. Élévation + Profil | v1.0 | 3/3 | ✅ Complete | 2026-04-30 |
| 3. Routing Optimal | v1.0 | 3/3 | ✅ Complete | 2026-04-30 |
| 4. Moteur de Calcul | v1.0 | 3/3 | ✅ Complete | 2026-05-01 |
| 5. Analyse Écologique | v1.0 | 3/3 | ✅ Complete | 2026-05-01 |
| 6. Dashboard Global | v1.0 | 3/3 | ✅ Complete | 2026-05-02 |
| 7. Persistance Locale | v2.0 | 3/3 | ✅ Complete | 2026-05-02 |
| 8. Candidats IA | v2.0 | 3/3 | ✅ Complete | 2026-05-02 |
| 9. Eau Salée & Dessalement | v2.0 | 3/3 | ✅ Complete | 2026-05-02 |
| 10. Impact Météorologique | v2.0 | 3/3 | ✅ Complete | 2026-05-02 |
| 11. Moteur Économique Circulaire | v3.0 | 3/3 | ✅ Complete | 2026-05-02 |
| 12. ROI & Break-even | v3.0 | 3/3 | ✅ Complete | 2026-05-02 |
| 13. Dashboard ROI | v3.0 | 2/2 | ✅ Complete | 2026-05-02 |

---

## Coverage Validation

| REQ-ID | Phase | Milestone |
|--------|-------|-----------|
| MAP-01 | Phase 1 | v1.0 |
| MAP-02 | Phase 1 | v1.0 |
| MAP-03 | Phase 2 | v1.0 |
| MAP-04 | Phase 2 | v1.0 |
| MAP-05 | Phase 3 | v1.0 |
| CALC-01 | Phase 4 | v1.0 |
| CALC-02 | Phase 4 | v1.0 |
| CALC-03 | Phase 4 | v1.0 |
| CALC-04 | Phase 4 | v1.0 |
| CALC-05 | Phase 4 | v1.0 |
| UX-01 | Phase 4 | v1.0 |
| ECO-01 | Phase 5 | v1.0 |
| ECO-02 | Phase 5 | v1.0 |
| ECO-03 | Phase 5 | v1.0 |
| ECO-04 | Phase 5 | v1.0 |
| GLOB-01 | Phase 6 | v1.0 |
| GLOB-02 | Phase 6 | v1.0 |
| GLOB-03 | Phase 6 | v1.0 |
| PERS-01 | Phase 7 | v2.0 |
| PERS-02 | Phase 7 | v2.0 |
| PERS-03 | Phase 7 | v2.0 |
| IA-01 | Phase 8 | v2.0 |
| IA-02 | Phase 8 | v2.0 |
| IA-03 | Phase 8 | v2.0 |
| ECO-05 | Phase 9 | v2.0 |
| DESAL-01 | Phase 9 | v2.0 |
| DESAL-02 | Phase 9 | v2.0 |
| DESAL-03 | Phase 9 | v2.0 |
| DESAL-04 | Phase 9 | v2.0 |
| DESAL-05 | Phase 9 | v2.0 |
| METEO-01 | Phase 10 | v2.0 |
| METEO-02 | Phase 10 | v2.0 |
| METEO-03 | Phase 10 | v2.0 |
| METEO-04 | Phase 10 | v2.0 |
| METEO-05 | Phase 10 | v2.0 |
| CIRC-01 | Phase 11 | v3.0 |
| CIRC-02 | Phase 11 | v3.0 |
| CIRC-03 | Phase 11 | v3.0 |
| CIRC-04 | Phase 11 | v3.0 |
| VIE-01 | Phase 11 | v3.0 |
| VIE-02 | Phase 11 | v3.0 |
| ROI-01 | Phase 12 | v3.0 |
| ROI-02 | Phase 12 | v3.0 |
| ROI-03 | Phase 12 | v3.0 |
| ROI-04 | Phase 12 | v3.0 |

**Coverage: 41/41 requirements mapped across 3 milestones.**

---

*See `.planning/MILESTONES.md` for milestone summaries.*
*See `.planning/milestones/` for archived roadmap + requirements per milestone.*

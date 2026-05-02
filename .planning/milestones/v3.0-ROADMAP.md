# ROADMAP — Canal

## Overview

13 phases | 41 requirements | App web scientifique 100% client-side pour étudier l'impact d'un réseau mondial de canaux sur la montée des eaux. Chaque phase délivre une capacité vérifiable qui débloque la suivante, en suivant l'ordre strict des dépendances architecturales (carte → élévation → routing → calculs → écologie → dashboard global → persistance → IA → dessalement → météo → économie circulaire → ROI → dashboard ROI).

---

## Phases

### Milestone v1.0 (Complete)

- [x] **Phase 1: Map Shell + Tracé** — Carte monde interactive avec outil de dessin de canal
- [x] **Phase 2: Élévation + Profil** — Profil altimétrique du tracé avec flag des segments en montée
- [x] **Phase 3: Routing Optimal** — Algorithme Dijkstra sur grille DEM pour tracé automatique
- [x] **Phase 4: Moteur de Calcul** — Volume, impact ΔSL, coût, impact partiel, affichage intervalles
- [x] **Phase 5: Analyse Écologique** — Zones désertiques, verdissement, bassins endorheïques, risques climatiques
- [x] **Phase 6: Dashboard Global** — ΔSL cumulé, scénarios et comparaison IPCC

### Milestone v2.0 — Persistence, IA & Écologie Avancée (Complete)

- [x] **Phase 7: Persistance Locale** — Canaux et paramètres survivent au refresh via IndexedDB Dexie.js
- [x] **Phase 8: Candidats IA** — Bibliothèque de canaux mondiaux pré-calculés chargeables en un clic
- [x] **Phase 9: Eau Salée & Dessalement** — Impact contextuel eau salée + nœuds dessalement solaire
- [x] **Phase 10: Impact Météorologique** — Évaporation, précipitations, refroidissement et indice de risque climatique

### Milestone v3.0 — Économie Circulaire & ROI

- [x] **Phase 11: Moteur Économique Circulaire** — circularEngine.ts — production spiruline, aquaculture, engrais, surface agricole, durée de vie, habitabilité
- [x] **Phase 12: ROI & Break-even** — roiEngine.ts — valeur totale annuelle, ROI à 25/50/100 ans, break-even, comparaison multi-canaux
- [x] **Phase 13: Dashboard ROI** — EconomicPanel.tsx — accordéon 4 états, 6 co-produits, ROI@25/50/100, tableau comparatif multi-canaux

---

## Phase Details

### Phase 1: Map Shell + Tracé
**Goal**: L'utilisateur peut afficher une carte monde et y tracer des canaux manuellement
**Depends on**: Nothing (fondation)
**Requirements**: MAP-01, MAP-02
**Success Criteria**:
1. L'utilisateur peut ouvrir l'app (git clone + npm run dev), voir une carte monde complète avec zoom et pan
2. L'utilisateur peut cliquer sur la carte pour poser un départ, des points intermédiaires et une arrivée — le canal apparaît comme une ligne visible
3. L'utilisateur peut voir la liste des canaux tracés et supprimer un canal
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 01-T01-PLAN.md — Scaffold Vite + types Canal + store Zustand + tests
- [x] 01-T02-PLAN.md — MapView (MapLibre init + sources GeoJSON) + useMapInteraction hook
- [x] 01-T03-PLAN.md — Composants UI panneau (SidePanel, ModeIndicator, DrawingToolbar, CanalList, CanalListItem, DeleteConfirmDialog) + App.tsx
**UI hint**: yes

### Phase 2: Élévation + Profil
**Goal**: L'utilisateur peut voir le profil altimétrique d'un canal tracé et identifier les segments gravitairement impossibles
**Depends on**: Phase 1
**Requirements**: MAP-03, MAP-04
**Success Criteria**:
1. En sélectionnant un canal tracé, l'utilisateur voit un graphique altitude (m) vs distance (km) pour l'ensemble du tracé
2. Les segments où l'eau devrait monter sont automatiquement surlignés en rouge sur la carte et identifiés sur le graphique
3. L'utilisateur comprend visuellement si son canal est réalisable par gravité ou non
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 02-T01-PLAN.md — Install recharts + @turf/turf, types elevation.ts, store étendu (setElevation), tests Wave 0
- [x] 02-T02-PLAN.md — elevationApi.ts (samplePoints, fetchElevations, detectUphillSegments, buildProfile) + useElevation hook
- [x] 02-T03-PLAN.md — ElevationChart + ElevationPanel (nouveaux), CanalListItem + MapView + SidePanel (étendus)
**UI hint**: yes

### Phase 3: Routing Optimal
**Goal**: L'utilisateur peut demander un tracé automatique qui évite les obstacles altitudinaux entre deux points
**Depends on**: Phase 2
**Requirements**: MAP-05
**Success Criteria**:
1. L'utilisateur peut sélectionner deux points et déclencher le calcul de tracé optimal — le résultat s'affiche sur la carte sans bloquer l'interface
2. Le tracé proposé minimise les montées (validé par le profil d'élévation : segments rouges absents ou minimaux)
3. Le calcul s'exécute en arrière-plan (Web Worker) — l'utilisateur peut continuer à interagir avec la carte pendant le routage
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 03-T01-PLAN.md — Types routing.ts + extension canal.ts/canalStore + stubs Wave 0
- [x] 03-T02-PLAN.md — routingGrid.ts (buildGrid, fetchGridElevations, buildGraph, findPath) + routingWorker.ts + useRoutingWorker.ts
- [x] 03-T03-PLAN.md — DrawingToolbar (bouton Tracé optimal) + MapView (marqueurs routing) + SidePanel (section progression)
**UI hint**: yes

### Phase 4: Moteur de Calcul
**Goal**: L'utilisateur peut calculer l'impact quantifié de chaque canal — volume, baisse du niveau de la mer, coût, et impact même en cas d'obstacle
**Depends on**: Phase 2
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, UX-01
**Success Criteria**:
1. En saisissant largeur et profondeur, l'utilisateur voit le volume (km³), le ΔSL (mm), et le coût (€) affichés comme intervalles [min, max] — jamais comme valeur ponctuelle
2. L'utilisateur peut comparer le ΔSL du canal au rythme annuel de montée des eaux (4,5 mm/an = 100%) via un indicateur de pourcentage
3. Si le canal est arrêté avant un obstacle, l'utilisateur voit l'impact partiel calculé pour la longueur effectivement réalisable
4. Aucune valeur numérique n'est affichée comme valeur exacte — toutes sont des fourchettes scientifiquement honnêtes
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 04-T01-PLAN.md — Types calculation.ts + stubs calculationEngine.ts + tests RED Wave 0 (CALC-01..05, UX-01)
- [x] 04-T02-PLAN.md — Implémentation complète calculationEngine.ts (intervalles, volume, ΔSL, terrain, coût, IPCC, partial)
- [x] 04-T03-PLAN.md — Store calcParams + useCalculation hook + CalculationPanel UI + SidePanel + MapView marker amber
**UI hint**: yes

### Phase 5: Analyse Écologique
**Goal**: L'utilisateur peut voir les effets secondaires écologiques et les risques d'un canal sur les zones traversées
**Depends on**: Phase 4
**Requirements**: ECO-01, ECO-02, ECO-03, ECO-04
**Success Criteria**:
1. Pour un canal traversant une zone désertique, l'utilisateur voit la superficie estimée (km²) de zone aride potentiellement transformée
2. L'utilisateur voit une fourchette de timeline de verdissement (ex. 10–50 ans) basée sur les données empiriques
3. Si le tracé aboutit dans un bassin endorheïque, une alerte visible est affichée (risque de salinisation irréversible)
4. Si le canal introduit de l'eau dans une zone aride et chaude, un avertissement de risque climatique (gradients de pression, phénomènes météo) est affiché
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 05-T01-PLAN.md — Types ecology.ts + GeoJSON desertZones + endorheicBasins + ecologyEngine.ts stubs + tests RED (Wave 0)
- [x] 05-T02-PLAN.md — Implémentation complète ecologyEngine.ts (ECO-01 3-cas, ECO-02 timelines, ECO-03 endorheïque, ECO-04 flag) — tests GREEN
- [x] 05-T03-PLAN.md — useEcology hook + EcologyPanel UI (6 états) + SidePanel intégration
**UI hint**: yes

### Phase 6: Dashboard Global
**Goal**: L'utilisateur peut évaluer l'impact collectif de tous ses canaux et le comparer aux projections climatiques IPCC
**Depends on**: Phase 5
**Requirements**: GLOB-01, GLOB-02, GLOB-03
**Success Criteria**:
1. L'utilisateur voit un ΔSL cumulé en temps réel reflétant la somme de tous les canaux tracés
2. Trois scénarios (optimiste / réaliste / pessimiste) sont affichés selon les hypothèses d'évaporation et d'absorption
3. Un dashboard récapitulatif affiche tous les canaux, le ΔSL total, le coût total et un graphique de comparaison avec les projections IPCC 2100
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 06-T01-PLAN.md — Types dashboard.ts (DashboardScenario, DashboardResult, IPCC_2100_RANGE_MM) + stubs dashboardEngine.ts + tests RED (Wave 0)
- [x] 06-T02-PLAN.md — Implémentation complète dashboardEngine.ts (GLOB-01 cumulatif, GLOB-02 scénarios, GLOB-03 coût) — tests GREEN
- [x] 06-T03-PLAN.md — useDashboard hook + IpccComparisonChart + DashboardPanel UI (2 états) + SidePanel Section 6
**UI hint**: yes

### Phase 7: Persistance Locale
**Goal**: L'utilisateur retrouve ses canaux et paramètres de calcul intacts après un refresh ou une fermeture de l'onglet
**Depends on**: Phase 6
**Requirements**: PERS-01, PERS-02, PERS-03
**Success Criteria**:
1. L'utilisateur trace un canal, ferme et rouvre l'onglet — tous ses canaux sont restaurés sur la carte avec leurs tracés et métadonnées
2. L'utilisateur saisit largeur et profondeur pour un canal, rafraîchit la page — les valeurs sont pré-remplies à la réouverture
3. L'utilisateur peut effacer toutes les données locales depuis l'interface et retrouver l'app dans son état initial vide
4. Aucune connexion réseau ou serveur n'est requise — la persistance fonctionne entièrement via IndexedDB local
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 07-T01-PLAN.md — Install dexie + fake-indexeddb, StoredCanal type, stubs tests RED
- [x] 07-T02-PLAN.md — db.ts singleton Dexie + actions store (clearAll, hydrateCanals) + usePersistence.ts → 101/101 tests GREEN
- [x] 07-T03-PLAN.md — ClearDataButton.tsx + SidePanel intégration (usePersistence + bouton effacement)
**UI hint**: yes

### Phase 8: Candidats IA
**Goal**: L'utilisateur peut explorer une bibliothèque de canaux mondiaux pré-calculés et en charger un sur la carte en un clic
**Depends on**: Phase 7
**Requirements**: IA-01, IA-02, IA-03
**Success Criteria**:
1. L'utilisateur voit une liste de 20 à 30 canaux mondiaux candidats triés par ΔSL estimé décroissant — sans attente réseau (données bundlées)
2. L'utilisateur peut cliquer sur un candidat pour voir ses métadonnées (nom, région, ΔSL estimé [min, max], faisabilité gravitaire, coût estimé)
3. L'utilisateur peut charger un candidat sur la carte en un clic — le tracé apparaît immédiatement et tous les calculs existants (ΔSL, coût, écologie) s'appliquent automatiquement
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 08-T01-PLAN.md — Type CanalCandidate + candidates.json (25 candidats) + stubs tests RED (Wave 0)
- [x] 08-T02-PLAN.md — useCandidates hook + action loadCandidate store + tests GREEN (Wave 1)
- [x] 08-T03-PLAN.md — CandidatesPanel.tsx + CandidateListItem.tsx + SidePanel Section 8 (Wave 2)
**UI hint**: yes

### Phase 9: Eau Salée & Dessalement
**Goal**: L'utilisateur peut évaluer l'impact différencié de l'eau salée selon l'écosystème traversé et simuler des nœuds de dessalement solaire sur le tracé
**Depends on**: Phase 7
**Requirements**: ECO-05, DESAL-01, DESAL-02, DESAL-03, DESAL-04, DESAL-05
**Success Criteria**:
1. L'utilisateur voit pour chaque segment du canal une indication de l'impact de l'eau salée différenciée par type d'écosystème traversé : faible impact en zone désertique aride, alerte critique si le canal traverse un cours d'eau ou une zone agricole
2. L'utilisateur peut activer des nœuds de dessalement solaire sur un canal et voir le volume d'eau douce produit (m³/jour) calculé selon la longueur et l'ensoleillement de la zone
3. L'utilisateur voit la valeur économique estimée des sels et minéraux récupérés (€/an) et la superficie de zones habitables potentiellement créées autour des nœuds (km²)
4. L'utilisateur voit le coût d'infrastructure de dessalement intégré à la fourchette de coût total du canal
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [x] 09-T01-PLAN.md — Types desalination.ts + stubs desalinationEngine.ts + tests RED (Wave 1)
- [x] 09-T02-PLAN.md — Implémentation complète desalinationEngine.ts (ECO-05, DESAL-01 à DESAL-05) — tests GREEN (Wave 2)
- [x] 09-T03-PLAN.md — desalinationEnabled store + useDesalination hook + EcologyPanel étendu + SidePanel (Wave 3)
**UI hint**: yes

### Phase 10: Impact Météorologique
**Goal**: L'utilisateur peut consulter les effets climatiques à long terme d'un canal — évaporation, précipitations induites, refroidissement local et indice de risque lié aux gradients d'humidité
**Depends on**: Phase 9
**Requirements**: METEO-01, METEO-02, METEO-03, METEO-04, METEO-05
**Success Criteria**:
1. L'utilisateur voit le volume d'évaporation annuel estimé généré par le système canal + bassin terminal (km³/an) affiché comme intervalle [min, max]
2. L'utilisateur voit le rayon d'influence climatique estimé autour du canal (km) et les précipitations supplémentaires attendues dans cette zone (mm/an)
3. L'utilisateur voit le refroidissement local estimé par évapotranspiration (°C) pour les zones traversées
4. L'utilisateur voit un indice de risque météorologique (faible / modéré / élevé) indiquant le danger de créer des gradients de pression atmosphérique en introduisant de l'humidité en zone aride
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [ ] 10-T01-PLAN.md — Types meteorology.ts + stubs meteorologyEngine.ts + tests RED (Wave 1)
- [ ] 10-T02-PLAN.md — Implémentation complète meteorologyEngine.ts — tests GREEN (Wave 1)
- [ ] 10-T03-PLAN.md — useMeteorology hook + MeteorologySection dans EcologyPanel.tsx (Wave 2)
**UI hint**: yes

### Phase 11: Moteur Économique Circulaire
**Goal**: Le moteur peut calculer toute la chaîne de co-produits du bassin terminal — production alimentaire, minéraux extractibles, surface agricole créée, durée de vie du canal et timeline habitabilité
**Depends on**: Phase 9
**Requirements**: CIRC-01, CIRC-02, CIRC-03, CIRC-04, VIE-01, VIE-02
**Success Criteria**:
1. Pour un canal donné avec dessalement actif, le moteur retourne la production annuelle de spiruline (tonnes/an + €/an) en intervalle [min, max] depuis le bassin terminal
2. Le moteur retourne la production d'aquaculture marine (tonnes protéines/an + €/an) calculée selon la superficie et la salinité du bassin terminal
3. Le moteur retourne les tonnes extractibles de magnésium, potassium et calcium (+ €/an) depuis la saumure concentrée, en intervalle [min, max]
4. Le moteur retourne la surface agricole potentielle (km² cultivables) créée par la combinaison eau douce dessalée + engrais locaux disponibles
5. Le moteur retourne la durée de vie estimée du canal (années avant entretien majeur) selon le type de terrain et la concentration minérale de l'eau
6. Le moteur retourne la timeline habitabilité (années avant que la zone devienne habitable et exploitable agricolement) en intervalle [min, max]
**Plans**: 3 plans (T01, T02, T03)

Plans:
- [ ] 11-T01-PLAN.md — Types CircularParams/CircularResult + stubs circularEngine.ts + tests RED (Wave 0)
- [ ] 11-T02-PLAN.md — Implémentation complète circularEngine.ts (CIRC-01 à CIRC-04, VIE-01, VIE-02) — tests GREEN (Wave 1)
- [ ] 11-T03-PLAN.md — useCircular.ts hook — connexion store Zustand (Wave 2)

### Phase 12: ROI & Break-even
**Goal**: Le moteur peut calculer la rentabilité complète d'un canal — valeur économique totale annuelle, ROI projeté sur plusieurs décennies, seuil de rentabilité et comparaison multi-canaux
**Depends on**: Phase 11
**Requirements**: ROI-01, ROI-02, ROI-03, ROI-04
**Success Criteria**:
1. Le moteur agrège tous les co-produits (eau dessalée, sel, spiruline, aquaculture, engrais) en une valeur économique totale annuelle (€/an) affichée comme intervalle [min, max]
2. Le moteur calcule le ROI cumulé projeté à 25, 50 et 100 ans en comparant l'investissement initial (coût construction + dessalement) aux revenus cumulés
3. Le moteur calcule le break-even en années — le nombre d'années avant que les revenus cumulés remboursent le coût de construction initial
4. L'utilisateur peut comparer côte à côte le ROI de plusieurs canaux tracés dans un tableau récapitulatif trié par break-even croissant
**Plans**: TBD

### Phase 13: Dashboard ROI
**Goal**: L'utilisateur peut visualiser la chaîne de valeur économique complète d'un canal et évaluer sa rentabilité directement depuis le panneau latéral
**Depends on**: Phase 12
**Requirements**: (UI for CIRC-01, CIRC-02, CIRC-03, CIRC-04, VIE-01, VIE-02, ROI-01, ROI-02, ROI-03, ROI-04)
**Success Criteria**:
1. L'utilisateur voit un panneau économique affichant la production spiruline, aquaculture et engrais avec leurs valeurs €/an en intervalles [min, max]
2. L'utilisateur voit la surface agricole créée (km²), la durée de vie du canal et la timeline habitabilité sur le même panneau
3. L'utilisateur voit la valeur économique totale annuelle et le break-even (années) mis en évidence comme indicateurs clés
4. L'utilisateur peut accéder à un tableau comparatif ROI affichant tous ses canaux triés par break-even
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 13-01-PLAN.md — EconomicPanel.tsx — accordéon Économie & ROI (4 états, co-produits, ROI, tableau comparatif) + intégration SidePanel
- [x] 13-02-PLAN.md — Vérification intégration SidePanel.tsx (import + JSX EconomicPanel à la position finale)

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Map Shell + Tracé | 3/3 | Complete | 2026-04-30 |
| 2. Élévation + Profil | 3/3 | Complete | 2026-04-30 |
| 3. Routing Optimal | 3/3 | Complete | 2026-04-30 |
| 4. Moteur de Calcul | 3/3 | Complete | 2026-05-01 |
| 5. Analyse Écologique | 3/3 | Complete | 2026-05-01 |
| 6. Dashboard Global | 3/3 | Complete | 2026-05-02 |
| 7. Persistance Locale | 3/3 | Complete | 2026-05-02 |
| 8. Candidats IA | 3/3 | Complete | 2026-05-02 |
| 9. Eau Salée & Dessalement | 3/3 | Complete | 2026-05-02 |
| 10. Impact Météorologique | 0/TBD | Not started | - |
| 11. Moteur Économique Circulaire | 0/3 | In progress | - |
| 12. ROI & Break-even | 0/TBD | Not started | - |
| 13. Dashboard ROI | 2/2 | Complete | 2026-05-02 |

---

## Coverage Validation

| REQ-ID | Phase |
|--------|-------|
| MAP-01 | Phase 1 |
| MAP-02 | Phase 1 |
| MAP-03 | Phase 2 |
| MAP-04 | Phase 2 |
| MAP-05 | Phase 3 |
| CALC-01 | Phase 4 |
| CALC-02 | Phase 4 |
| CALC-03 | Phase 4 |
| CALC-04 | Phase 4 |
| CALC-05 | Phase 4 |
| UX-01 | Phase 4 |
| ECO-01 | Phase 5 |
| ECO-02 | Phase 5 |
| ECO-03 | Phase 5 |
| ECO-04 | Phase 5 |
| GLOB-01 | Phase 6 |
| GLOB-02 | Phase 6 |
| GLOB-03 | Phase 6 |
| PERS-01 | Phase 7 |
| PERS-02 | Phase 7 |
| PERS-03 | Phase 7 |
| IA-01 | Phase 8 |
| IA-02 | Phase 8 |
| IA-03 | Phase 8 |
| ECO-05 | Phase 9 |
| DESAL-01 | Phase 9 |
| DESAL-02 | Phase 9 |
| DESAL-03 | Phase 9 |
| DESAL-04 | Phase 9 |
| DESAL-05 | Phase 9 |
| METEO-01 | Phase 10 |
| METEO-02 | Phase 10 |
| METEO-03 | Phase 10 |
| METEO-04 | Phase 10 |
| METEO-05 | Phase 10 |
| CIRC-01 | Phase 11 |
| CIRC-02 | Phase 11 |
| CIRC-03 | Phase 11 |
| CIRC-04 | Phase 11 |
| VIE-01 | Phase 11 |
| VIE-02 | Phase 11 |
| ROI-01 | Phase 12 |
| ROI-02 | Phase 12 |
| ROI-03 | Phase 12 |
| ROI-04 | Phase 12 |

**Coverage: 46/46 requirements mapped.**

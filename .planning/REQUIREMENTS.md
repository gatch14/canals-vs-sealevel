# Requirements — Canal

**Version:** v3
**Date:** 2026-05-02
**Status:** Roadmap v3.0 complete

---

## v1 Requirements (Complete)

### Carte & Tracé (MAP)

- [x] **MAP-01**: L'utilisateur peut afficher une carte monde interactive (zoom, pan, layers)
- [x] **MAP-02**: L'utilisateur peut tracer un canal en cliquant des points sur la carte (départ, points intermédiaires, arrivée)
- [x] **MAP-03**: L'utilisateur peut voir le profil d'élévation du tracé — graphique altitude (m) vs distance (km)
- [x] **MAP-04**: Les segments en montée sont automatiquement flaggés (eau ne peut pas couler par gravité — affichage en rouge)
- [x] **MAP-05**: L'utilisateur peut demander un tracé optimal automatique entre deux points (algorithme Dijkstra sur DEM en Web Worker, minimise l'élévation et les obstacles)

### Calculs par Canal (CALC)

- [x] **CALC-01**: L'utilisateur peut saisir largeur et profondeur du canal — le volume total (km³) est calculé automatiquement
- [x] **CALC-02**: Le delta de niveau de la mer (ΔSL en mm) est calculé — formule : ΔSL = Volume (km³) / 361,8
- [x] **CALC-03**: Une estimation de coût (€) est affichée en fourchette selon le type de terrain du tracé
- [x] **CALC-04**: L'impact du canal est comparé au rythme annuel de montée des eaux (4,5 mm/an = 100%)
- [x] **CALC-05**: Si un canal est arrêté avant un obstacle infranchissable, son impact partiel est calculé et affiché

### Écologie (ECO)

- [x] **ECO-01**: Le tracé identifie automatiquement les zones désertiques traversées — superficie estimée en km²
- [x] **ECO-02**: Une estimation de la timeline de verdissement est affichée (fourchette en années)
- [x] **ECO-03**: Une alerte est déclenchée si le canal aboutit dans un bassin endorheïque
- [x] **ECO-04**: Un flag est affiché si le tracé introduit de l'eau dans une zone aride et chaude (risque climatique)

### Vue Globale (GLOB)

- [x] **GLOB-01**: Un ΔSL cumulé est calculé pour l'ensemble des canaux tracés
- [x] **GLOB-02**: Trois scénarios sont affichés (optimiste / réaliste / pessimiste)
- [x] **GLOB-03**: Un dashboard récapitulatif avec graphique de comparaison IPCC 2100

### Qualité Scientifique (UX)

- [x] **UX-01**: Toutes les valeurs numériques sont affichées comme intervalles [min, max]

---

## v2 Requirements (Milestone v2.0 — Complete)

### Persistance Locale (PERS)

- [x] **PERS-01**: L'utilisateur retrouve ses canaux tracés après un refresh de la page (IndexedDB via Dexie.js)
- [x] **PERS-02**: L'utilisateur retrouve les paramètres de calcul (largeur, profondeur) après un refresh
- [x] **PERS-03**: L'utilisateur peut effacer toutes les données locales depuis l'interface

### Candidats IA (IA)

- [x] **IA-01**: L'utilisateur peut consulter une liste de canaux mondiaux pré-calculés classés par impact ΔSL estimé
- [x] **IA-02**: L'utilisateur peut charger un canal candidat sur la carte en un clic (tracé + métadonnées)
- [x] **IA-03**: L'utilisateur voit les métadonnées de chaque candidat (nom, région, ΔSL estimé, faisabilité gravitaire, coût estimé)

### Eau Salée Contextuelle (ECO)

- [x] **ECO-05**: L'utilisateur voit l'impact écologique du transit d'eau salée différencié par écosystème traversé (désert aride = faible impact ; cours d'eau ou zone agricole = alerte critique)

### Dessalement Solaire (DESAL)

- [x] **DESAL-01**: L'utilisateur peut activer l'option "nœuds de dessalement solaire" sur un canal
- [x] **DESAL-02**: L'utilisateur voit le volume d'eau douce produit par les nœuds (m³/jour) selon longueur du canal et ensoleillement
- [x] **DESAL-03**: L'utilisateur voit la valeur économique du sel et minéraux récupérés (€/an)
- [x] **DESAL-04**: L'utilisateur voit la superficie de zones potentiellement habitables créées autour des nœuds (km²)
- [x] **DESAL-05**: L'utilisateur voit le coût d'infrastructure de dessalement intégré au coût total du canal

### Impact Météorologique (METEO)

- [x] **METEO-01**: L'utilisateur voit le volume d'évaporation estimé généré par le système canal+bassin (km³/an)
- [x] **METEO-02**: L'utilisateur voit le rayon d'influence climatique estimé autour du canal (km)
- [x] **METEO-03**: L'utilisateur voit les précipitations supplémentaires estimées dans la zone d'influence (mm/an)
- [x] **METEO-04**: L'utilisateur voit le refroidissement local estimé par évapotranspiration (°C)
- [x] **METEO-05**: L'utilisateur voit un indice de risque météorologique lié à l'introduction d'humidité en zone aride

---

## v3 Requirements (Milestone v3.0 — Économie Circulaire & ROI)

### Écosystème Productif (CIRC)

- [ ] **CIRC-01**: L'utilisateur voit la production annuelle de spiruline estimée (tonnes/an + €/an) depuis le bassin terminal salin
- [ ] **CIRC-02**: L'utilisateur voit la production d'aquaculture marine estimée (tonnes protéines/an + €/an) dans le bassin terminal
- [ ] **CIRC-03**: L'utilisateur voit la production d'engrais agricoles (tonnes de magnésium, potassium, calcium/an + €/an) extraits de la saumure
- [ ] **CIRC-04**: L'utilisateur voit la surface agricole potentielle créée (km² cultivables) grâce à l'eau douce et aux engrais disponibles localement

### Durée de Vie & Habitabilité (VIE)

- [ ] **VIE-01**: L'utilisateur voit la durée de vie estimée du canal (années avant entretien majeur — envasement, dépôts minéraux, maintenance structure)
- [ ] **VIE-02**: L'utilisateur voit la timeline habitabilité — dans combien d'années la zone autour du canal devient habitable et exploitable agricolement

### ROI & Rentabilité (ROI)

- [ ] **ROI-01**: L'utilisateur voit la valeur économique totale annuelle générée (€/an) — somme de tous les co-produits (eau, sel, spiruline, engrais, aquaculture)
- [ ] **ROI-02**: L'utilisateur voit le ROI global — investissement total vs revenus cumulés projetés sur 25, 50 et 100 ans
- [ ] **ROI-03**: L'utilisateur voit le break-even — en combien d'années le canal rembourse son coût de construction initial
- [ ] **ROI-04**: L'utilisateur peut comparer le ROI de plusieurs canaux tracés dans un tableau récapitulatif

---

## Déférés vers v4

- Réseau ramifié multi-canaux (colonne vertébrale + ramifications eau douce)
- Export PDF / rapport de l'étude
- Partage de scénarios via URL
- Simulation hydrodynamique haute fidélité
- Valeur foncière zones habitables (dépend géographie/pays — trop variable)

---

## Out of Scope

- **Simulation hydrodynamique haute fidélité** — ordres de grandeur crédibles uniquement
- **Plans d'ingénierie réels** — étude de faisabilité uniquement
- **Backend / base de données serveur** — tout client-side, `git clone + npm run dev` suffit
- **Interface multi-utilisateurs** — usage personnel
- **Clés API obligatoires** — données locales ou APIs gratuites sans auth

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| MAP-01 | Phase 1 | Complete |
| MAP-02 | Phase 1 | Complete |
| MAP-03 | Phase 2 | Complete |
| MAP-04 | Phase 2 | Complete |
| MAP-05 | Phase 3 | Complete |
| CALC-01 | Phase 4 | Complete |
| CALC-02 | Phase 4 | Complete |
| CALC-03 | Phase 4 | Complete |
| CALC-04 | Phase 4 | Complete |
| CALC-05 | Phase 4 | Complete |
| UX-01 | Phase 4 | Complete |
| ECO-01 | Phase 5 | Complete |
| ECO-02 | Phase 5 | Complete |
| ECO-03 | Phase 5 | Complete |
| ECO-04 | Phase 5 | Complete |
| GLOB-01 | Phase 6 | Complete |
| GLOB-02 | Phase 6 | Complete |
| GLOB-03 | Phase 6 | Complete |
| PERS-01 | Phase 7 | Complete |
| PERS-02 | Phase 7 | Complete |
| PERS-03 | Phase 7 | Complete |
| IA-01 | Phase 8 | Complete |
| IA-02 | Phase 8 | Complete |
| IA-03 | Phase 8 | Complete |
| ECO-05 | Phase 9 | Complete |
| DESAL-01 | Phase 9 | Complete |
| DESAL-02 | Phase 9 | Complete |
| DESAL-03 | Phase 9 | Complete |
| DESAL-04 | Phase 9 | Complete |
| DESAL-05 | Phase 9 | Complete |
| METEO-01 | Phase 10 | Complete |
| METEO-02 | Phase 10 | Complete |
| METEO-03 | Phase 10 | Complete |
| METEO-04 | Phase 10 | Complete |
| METEO-05 | Phase 10 | Complete |
| CIRC-01 | Phase 11 | Pending |
| CIRC-02 | Phase 11 | Pending |
| CIRC-03 | Phase 11 | Pending |
| CIRC-04 | Phase 11 | Pending |
| VIE-01 | Phase 11 | Pending |
| VIE-02 | Phase 11 | Pending |
| ROI-01 | Phase 12 | Pending |
| ROI-02 | Phase 12 | Pending |
| ROI-03 | Phase 12 | Pending |
| ROI-04 | Phase 12 | Pending |

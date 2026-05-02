# Canal — Étude Scientifique du Réseau de Canaux Mondiaux

## What This Is

Étude scientifique interactive explorant si un réseau de canaux intercontinentaux pourrait contrer la montée des eaux due au changement climatique. L'outil est une application web avec carte du monde sur laquelle on trace des canaux potentiels, calcule leur coût, leur impact sur le niveau des mers, et leurs effets écologiques secondaires (verdissement des déserts, régulation thermique, risques climatiques). Le projet commence par l'Europe/France comme cas pilote, puis s'étend à tous les continents.

## Core Value

Déterminer si et dans quelle mesure un réseau mondial de canaux peut neutraliser la montée des eaux — avec une estimation chiffrée de l'impact potentiel, à défaut de l'annuler.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Carte interactive mondiale affichant les canaux tracés avec dimensions
- [ ] Tracé optimal des canaux (évitement des reliefs, optimisation du parcours)
- [ ] Estimation du coût de construction par canal
- [ ] Calcul de l'impact de chaque canal sur la montée des eaux (volume absorbé)
- [ ] Analyse écologique : potentiel de verdissement des zones désertiques
- [ ] Chronologie de transformation écologique (combien d'années pour reverdir?)
- [ ] Analyse des effets climatiques positifs (baisse de température, humidité)
- [ ] Analyse des risques négatifs (cyclones, tornades, perturbations climatiques)
- [ ] Analyse des canaux partiels (canal arrêté par obstacle — quel impact quand même?)
- [ ] Calcul d'impact global : peut-on annuler ou réduire significativement la montée des eaux?

### Out of Scope

- Simulation hydrodynamique haute fidélité — on vise des ordres de grandeur crédibles, pas la précision à 1%
- Plans d'ingénierie réels pour construction — c'est une étude de faisabilité, pas un projet de génie civil
- Interface d'administration multi-utilisateurs — usage personnel uniquement
- Backend / base de données serveur — tout se passe dans le navigateur, pas de serveur à héberger

## Context

**Problème source** : La montée des eaux représente une menace croissante. L'idée est contre-intuitive mais mérite exploration : et si on redistribuait l'eau de mer vers des zones intérieures (déserts, bassins) via des canaux, pour à la fois réduire le niveau des océans et transformer des zones arides ?

**Approche géographique** :
- Phase 1 : Europe / France — canal Atlantique → Méditerranée comme cas pilote
- Phase 2 : Afrique — canaux entre océans, vers la Méditerranée, verdissement du Sahara
- Phase 3 : Autres continents (Amérique, Asie, etc.)

**Méthodologie** : Ordre de grandeur d'abord (estimations suffisamment crédibles pour évaluer la viabilité), puis couche de précision ajoutée itérativement avec données topographiques réelles.

**Effets en cascade à étudier** :
- L'eau en zone désertique crée de l'évaporation → humidité → pluie → végétation
- La végétation réduit la température locale → boucle de rétroaction positive
- Mais : l'introduction d'eau dans des zones sèches peut créer des gradients de pression atmosphérique → risques météorologiques (tornades, cyclones)
- Canaux partiels : même sans traversée complète, impact sur les zones atteintes

## Constraints

- **Précision** : Ordres de grandeur crédibles, pas modélisation haute fidélité — les calculs doivent être défendables mais pas publiables dans Nature
- **Usage** : Exploration personnelle — pas besoin d'UI enterprise, juste fonctionnelle et claire
- **Tech** : Libre choix — ce qui sert le mieux la carte interactive et les calculs scientifiques
- **Géographie** : Démarrage Europe pour valider l'approche avant de généraliser
- **Déploiement local** : `git clone + npm install + npm run dev` suffit — zéro base de données, zéro serveur, zéro clé API obligatoire. N'importe qui peut faire tourner l'app en local sans configuration supplémentaire. Tout le code s'exécute dans le navigateur (client-side only)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| App web interactive (pas rapport statique) | Permet d'explorer les canaux dynamiquement, de zoomer, modifier des paramètres | — Pending |
| Commencer par l'Europe/France | Cas le plus documenté, relief connu, valide l'approche avant de generaliser | — Pending |
| Ordres de grandeur d'abord | Permet d'aller vite et de valider si l'idée est viable avant d'investir dans la précision | — Pending |
| Architecture 100% client-side | Clonage immédiat sans dépendances externes — démocratise l'accès au projet | — Pending |

## Current Milestone: v3.0 Économie Circulaire & ROI

**Goal:** Transformer le canal d'un coût en un système potentiellement rentable — calculer la chaîne de valeur complète (spiruline, engrais, agriculture, durée de vie) et le break-even économique.

**Target features:**
- ROI global : coût construction vs revenus cumulés sur N années (€)
- Break-even : en combien d'années le canal est rentable
- Production spiruline/aquaculture : tonnes/an + valeur €/an depuis le bassin terminal
- Engrais agricoles : minéraux extraits (Mg, K, Ca) → fertilisants + surface agricole potentielle (km²)
- Terres cultivables : eau douce + engrais disponibles → km² arables autour des nœuds
- Durée de vie du canal : années avant entretien majeur (envasement, dépôts, maintenance)
- Valeur économique totale : somme de tous les co-produits en €/an
- Timeline habitabilité : dans combien d'années une zone devient-elle habitable et exploitable

## Evolution

Ce document évolue à chaque transition de phase et à chaque jalon.

**Après chaque phase** :
1. Requirements invalidés ? → Déplacer dans Out of Scope avec raison
2. Requirements validés ? → Déplacer dans Validated avec référence de phase
3. Nouveaux requirements émergents ? → Ajouter dans Active
4. Décisions à consigner ? → Ajouter dans Key Decisions
5. "What This Is" encore exact ? → Mettre à jour si drifté

**Après chaque milestone** :
1. Revue complète de toutes les sections
2. Core Value check — encore la bonne priorité ?
3. Audit Out of Scope — les raisons sont-elles encore valides ?
4. Mettre à jour Context avec l'état actuel

---
*Last updated: 2026-04-30 after initialization — ajout contrainte déploiement local*

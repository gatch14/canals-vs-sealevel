# Canal — Étude Scientifique du Réseau de Canaux Mondiaux

## What This Is

Application web scientifique interactive 100% client-side explorant si un réseau mondial de canaux peut contrer la montée des eaux. Carte interactive mondiale, tracé de canaux, calculs d'impact (ΔSL = V / 361,8), analyse écologique, dessalement solaire, impact météorologique, et chaîne de valeur économique complète (spiruline, aquaculture, engrais, ROI, break-even).

## Core Value

Déterminer si et dans quelle mesure un réseau mondial de canaux peut neutraliser la montée des eaux — avec une estimation chiffrée de l'impact potentiel ET de la rentabilité économique du projet.

## Requirements

### Validated

- ✓ Carte interactive mondiale affichant les canaux tracés avec dimensions — v1.0
- ✓ Tracé optimal des canaux (algorithme Dijkstra sur DEM, Web Worker) — v1.0
- ✓ Estimation du coût de construction par canal en intervalles — v1.0
- ✓ Calcul ΔSL (mm) = Volume (km³) / 361,8 en intervalles [min, max] — v1.0
- ✓ Analyse écologique : verdissement, bassins endorheïques, risques climatiques — v1.0
- ✓ Dashboard global ΔSL cumulé + comparaison IPCC 2100 — v1.0
- ✓ Persistance locale (IndexedDB Dexie.js) — canaux + paramètres — v2.0
- ✓ Bibliothèque de 25 canaux candidats mondiaux chargeable en un clic — v2.0
- ✓ Impact eau salée contextuel + nœuds de dessalement solaire — v2.0
- ✓ Impact météorologique (évaporation, précipitations, refroidissement, indice risque) — v2.0
- ✓ Moteur économique circulaire (spiruline, aquaculture, minéraux, terres arables, durée de vie, habitabilité) — v3.0
- ✓ ROI & break-even (valeur annuelle totale, ROI@25/50/100 ans, comparaison multi-canaux) — v3.0
- ✓ Dashboard ROI — EconomicPanel accordéon 4 états — v3.0

### Active (v4.0+)

- [ ] Afficher tonnes/an (en plus de €/an) pour spiruline, aquaculture, minéraux (CIRC-01/02/03 display gap)
- [ ] Réseau ramifié multi-canaux (colonne vertébrale + ramifications eau douce)
- [ ] Export PDF / rapport de l'étude
- [ ] Partage de scénarios via URL

### Out of Scope

- Simulation hydrodynamique haute fidélité — ordres de grandeur crédibles uniquement
- Plans d'ingénierie réels — étude de faisabilité uniquement
- Backend / base de données serveur — tout client-side, `git clone + npm run dev` suffit
- Interface multi-utilisateurs — usage personnel
- Clés API obligatoires — données locales ou APIs gratuites sans auth
- Valeur foncière zones habitables (trop variable par géographie/pays)

## Context

**Codebase actuel :** 68 fichiers TypeScript/TSX, 223 tests GREEN (vitest), TypeScript strict 0 erreur.
**Stack :** MapLibre GL JS + React + Vite + TypeScript + Turf.js + Tailwind CSS v4 + Zustand + recharts + Dexie.js
**Pattern établi :** TDD stubs RED → engine pur GREEN → hook useMemo → UI React
**Formule centrale :** `ΔSL (mm) = Volume (km³) / 361,8`
**Contrainte absolue :** 100% client-side — zéro backend, zéro clé API

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| App web interactive (pas rapport statique) | Exploration dynamique des canaux | ✓ Good |
| Architecture 100% client-side | Clonage immédiat sans dépendances | ✓ Good |
| Ordres de grandeur d'abord | Valider viabilité avant précision | ✓ Good |
| TDD Wave 0 RED → Wave 1 GREEN → Wave 2 UI | Moteurs purs testables sans DOM | ✓ Good |
| Intervalles [min, max] pour toutes les valeurs (UX-01) | Honnêteté scientifique | ✓ Good |
| Dexie.js pour IndexedDB | API Promise propre, fake-indexeddb en test | ✓ Good |
| Hooks useMemo sans hook-in-hook (récompute desal en interne) | Évite dépendances cycliques | ✓ Good |
| desalinationEnabled gate dans useROI.ts (comportement état C) | ROI sans desal = Infinity → bannière amber | ⚠ Revisit (nettoyage v4) |
| CIRC-01/02/03 — tonnes/an calculées mais non affichées | Choix UI minimal v3, afficher dans v4 | ⚠ Revisit |

## Constraints

- **Précision** : Ordres de grandeur crédibles, pas modélisation haute fidélité
- **Usage** : Exploration personnelle — pas d'UI enterprise
- **Déploiement local** : `git clone + npm install + npm run dev` suffit
- **Géographie** : Démarrage Europe/France, extension mondiale

---
*Last updated: 2026-05-02 after v3.0 milestone — Économie Circulaire & ROI*

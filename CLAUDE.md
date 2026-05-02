# Canal — Project Guide

## What This Is

App web scientifique 100% client-side explorant si un réseau mondial de canaux peut contrer la montée des eaux. Carte interactive mondiale, tracé de canaux, calculs d'impact (ΔSL = V / 361,8), analyse écologique (verdissement des déserts), dashboard global. Démarrage Europe/France, expansion mondiale.

**Formule centrale** : `ΔSL (mm) = Volume_canal (km³) / 361,8`

## Tech Stack

- **Carte** : MapLibre GL JS + React + Vite + TypeScript
- **Données DEM** : Copernicus GLO-30 via Open Topo Data REST API (gratuit, sans auth)
- **Calculs** : JavaScript pur + Turf.js (tout dans le navigateur)
- **Routing** : Dijkstra sur grille DEM dans Web Worker (`ngraph.path`)
- **Persistance** : IndexedDB / Dexie.js (local uniquement)
- **Contrainte absolue** : 100% client-side — `git clone + npm install + npm run dev` suffit, zéro backend, zéro base de données

## Roadmap (6 phases)

| Phase | Nom | Requirements | Status |
|-------|-----|-------------|--------|
| 1 | Map Shell + Tracé | MAP-01, MAP-02 | ⬜ Not started |
| 2 | Élévation + Profil | MAP-03, MAP-04 | ⬜ Not started |
| 3 | Routing Optimal | MAP-05 | ⬜ Not started |
| 4 | Moteur de Calcul | CALC-01–05, UX-01 | ⬜ Not started |
| 5 | Analyse Écologique | ECO-01–04 | ⬜ Not started |
| 6 | Dashboard Global | GLOB-01–03 | ⬜ Not started |

## GSD Workflow

Ce projet utilise le workflow GSD (Get Shit Done). Commandes principales :

```bash
/gsd-discuss-phase 1   # Discuter et clarifier la phase 1
/gsd-plan-phase 1      # Créer le plan détaillé de la phase 1
/gsd-execute-phase 1   # Exécuter le plan
/gsd-verify-work       # Vérifier que les livrables sont atteints
/gsd-progress          # État d'avancement global
```

## Règles du Projet

- **Tout calculé en intervalles** — jamais de valeur ponctuelle (principe d'honnêteté scientifique)
- **Contrainte gravitaire obligatoire** — les segments en montée doivent être flaggés, jamais ignorés
- **Pas de backend** — si une feature nécessite un serveur, revoir la conception
- **Ordres de grandeur d'abord** — la précision s'ajoute par couches, ne pas sur-ingénierer v1

## Références Clés

- `.planning/PROJECT.md` — contexte et contraintes du projet
- `.planning/REQUIREMENTS.md` — 18 requirements avec IDs (MAP/CALC/ECO/GLOB/UX)
- `.planning/ROADMAP.md` — roadmap détaillée avec critères de succès
- `.planning/research/SUMMARY.md` — synthèse de la recherche (stack, pièges, données)
- `.planning/research/PITFALLS.md` — 13 pièges documentés à éviter

## Pièges Critiques à Ne Pas Oublier

1. L'eau ne coule pas en montée — routing contraint par DEM depuis phase 1
2. Qattara Depression = meilleur candidat mondial = 2,76 mm seulement — afficher l'ordre de grandeur immédiatement
3. Bassin endorheïque = salinisation irréversible (Salton Sea, Aral Sea) — alerte obligatoire ECO-03
4. DEM SRTM a des erreurs de 5–13 m — utiliser uniquement Copernicus GLO-30

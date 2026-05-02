# Project Research Summary

**Project:** Canal — Réseau mondial de canaux vs montée des eaux
**Domain:** Scientific geospatial simulation / exploratory hydrology
**Researched:** 2026-04-30
**Confidence:** HIGH (stack, physique, architecture) / MEDIUM (projections écologiques, fourchettes de coûts)

---

## Executive Summary

Une app web 100% client-side (aucun backend, aucune base de données) affichant une carte mondiale interactive où l'on trace des canaux potentiels et calcule leur impact sur la montée des eaux. La formule centrale est simple et robuste : **1 mm de baisse du niveau de la mer = 361,8 km³ d'eau redirigée vers l'intérieur**. L'app est conçue pour être clonée et lancée en local par n'importe qui (`git clone && npm install && npm run dev`).

---

## Recommended Stack

| Composant | Choix | Raison |
|-----------|-------|--------|
| Carte interactive | **MapLibre GL JS** + React | Fork open-source BSD de Mapbox GL JS — WebGL, 3D terrain, performant sur grands datasets |
| Données topographiques | **Copernicus GLO-30** (30m, mondial, CC BY) | Meilleur DEM libre disponible, validé par études peer-reviewed 2024 |
| API élévation | **Open Topo Data** (REST, gratuit, sans clé) | Requêtes d'élévation ponctuelles pour profils de canal |
| Calculs | **JS pur + Turf.js** | Ordres de grandeur ne nécessitent pas Python/Pyodide — évite 6-10 MB de payload inutile |
| Algorithme de routage | **Dijkstra** sur grille d'élévation (Web Worker) | Toujours correct, implémenté dans `ngraph.path` (npm) |
| Persistance locale | **IndexedDB / Dexie.js** | Sauvegarde des canaux sans serveur |
| Build | **Vite + React + TypeScript** | Standard de facto 2025 |

---

## Key Scientific Facts

```
ΔSL (mm) = V_retiré (km³) / 361,8

Rythme actuel de montée : ~4,5 mm/an (2024) = ~1 630 km³/an à rediriger en continu
Meilleur candidat mondial (Qattara, Égypte) : ~1 000 km³ → 2,76 mm de baisse (one-time)
IPCC 2100 : 0,3–1 m de montée → 108 000 à 362 000 km³ à rediriger

Coût construction canal : 0,5–80 M€/km (×50 en terrain montagneux ou tunnel)
  - Plaine irriguée : ~1 M€/km
  - Canal navigable moderne (ex. Seine-Nord) : ~47 M€/km
  - Tunnel : jusqu'à 500 M€/km

Verdissement désert : 2–100 ans selon apport hydrique
  - Thar Desert (Inde) : +38% végétation en 20 ans après irrigation agricole
  - Mécanisme : eau → évaporation → humidité → pluie → végétation (boucle de rétroaction)
```

---

## Table Stakes Features (v1)

1. **Carte monde interactive** — afficher/masquer des canaux tracés, zoomer, cliquer
2. **Outil de tracé de canal** — dessiner une ligne sur la carte (départ/arrivée + points intermédiaires)
3. **Profil d'élévation du tracé** — graphique altitude vs distance, contrainte gravitaire visible
4. **Calculateur de volume** — longueur × largeur × profondeur → km³
5. **Impact montée des eaux** — ΔSL = V / 361,8, affiché avec barre de référence (rythme actuel)
6. **Estimation de coût** — fourchette selon type de terrain (plaine / montagne / tunnel)
7. **Affichage d'incertitude** — toutes les valeurs affichées comme intervalles, pas valeurs ponctuelles

---

## Critical Pitfalls to Avoid

| # | Piège | Prévention |
|---|-------|------------|
| 1 | **L'eau ne coule pas en montée** — routage impossible sans pompage | Contraindre le routing par le DEM dès la phase 1 — signaler les segments "en montée" |
| 2 | **Ordre de grandeur décevant** — Qattara = 2,76 mm, les projections IPCC parlent de mètres | Afficher immédiatement la comparaison volume canal / volume nécessaire |
| 3 | **Eau de mer + bassin fermé = salinisation irréversible** (ex. Salton Sea, Aral Sea) | Flaguer automatiquement les bassins endorheïques et afficher avertissement écologique |
| 4 | **Erreurs DEM de 5–13 m** — SRTM et ASTER sont trop imprécis pour le routage côtier | Utiliser uniquement Copernicus GLO-30 + sink-filling obligatoire |
| 5 | **Scope explosion** — simulation climatique complète, GCM, coûts détaillés → trous sans fond | v1 = ordres de grandeur uniquement, simulation climatique explicitement hors scope |

---

## Architecture in One Paragraph

L'app est 100% client-side : MapLibre GL JS affiche la carte et les canaux, les requêtes d'élévation transitent par l'API Open Topo Data (REST, aucune auth), les calculs de routage Dijkstra tournent dans un Web Worker (sans bloquer l'UI), et un **Calculation Engine en architecture plugin** (`Calculator { id, label, compute(canal) }`) permet d'ajouter de nouveaux modèles scientifiques sans toucher au cœur. Les canaux sont persistés en IndexedDB (Dexie.js). Aucun serveur, aucune base de données externe, aucune clé API obligatoire.

---

## Recommended Build Order

| Phase | Livrable | Dépendances |
|-------|----------|-------------|
| 1 | **Map Shell + Tracé** — carte monde, outil dessin canal, affichage liste canaux | — |
| 2 | **Élévation + Profil** — appel Open Topo Data, graphique altitude vs distance, flag segments en montée | Phase 1 |
| 3 | **Routing Engine** — Dijkstra sur DEM dans Web Worker, suggestion de tracé optimal | Phase 2 |
| 4 | **Calculation Engine** — volume, ΔSL, coût estimé, plugin écologie (verdissement) | Phase 2 |
| 5 | **Persistence** — sauvegarde/chargement des canaux en IndexedDB | Phase 4 |
| 6 | **Expansion continentale** — Afrique, Amérique, Asie (zéro changement de code, données uniquement) | Phase 4 |

---

## Open Questions

- Performance du routing Dijkstra sur grilles > 1000×1000 — à calibrer en phase 3
- Rate limits de l'API Open Topo Data pour les longs canaux — fallback geotiff.js si nécessaire
- Modèle de salinisation à long terme — comment quantifier l'effet Salton Sea ?
- Seuil de perturbation atmosphérique — à partir de quelle surface d'eau introduite y a-t-il risque cyclonique ?

---

## Historical Case Studies to Reference

| Cas | Leçon principale |
|-----|-----------------|
| **Mer d'Aral** | L'eau redirigée en dehors du bassin naturel = catastrophe écologique irréversible |
| **Mer Caspienne** | A baissé quand les Soviétiques ont réduit les apports — preuve que la redirection fonctionne dans les deux sens |
| **Dépression de Qattara** | Étudié depuis 100 ans (incluant des propositions avec 213 bombes nucléaires), jamais construit — calibre la faisabilité |
| **Salton Sea** | Créée par accident, eau douce → hypersaline → pollution — montre le destin des bassins fermés |
| **Thar Desert** | Verdissement de 38% en 20 ans avec eau agricole — valide le potentiel de transformation |

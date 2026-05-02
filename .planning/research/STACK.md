# STACK.md — Technical Stack & Scientific Data Sources

**Project:** Canal — Réseau mondial de canaux vs montée des eaux
**Researched:** 2026-04-30
**Overall confidence:** HIGH for stack choices, MEDIUM for cost formulas, HIGH for scientific data sources

---

## Recommended Stack

### Web Mapping Library: MapLibre GL JS

**Recommendation:** MapLibre GL JS (not Leaflet, not Mapbox GL JS proprietary)

**Rationale:**
- MapLibre GL JS est le fork open source (BSD) de Mapbox GL JS, créé en décembre 2020 après que Mapbox ait adopté une licence propriétaire
- Rendu WebGL GPU-accelerated — traite des centaines de milliers de points/lignes sans dégradation
- Supporte les vector tiles (MVT) nativement — indispensable pour charger des données topographiques tuiles-par-tuile
- Styling dynamique des tracés de canaux (couleur par impact, épaisseur par débit, etc.)
- Croissance forte depuis mi-2024, adoption communautaire massive (OSRM, OpenMapTiles, etc.)
- Compatible React via `react-map-gl` (wrapper officiel qui supporte MapLibre)
- 3D terrain intégré via mapbox-gl-terrain-rgb ou Mapzen Terrarium tiles

**Ce que Leaflet ne peut pas faire ici:** Leaflet est DOM-based (SVG/Canvas), les performances dégradent fortement à partir de ~10 000 features. Pour des tracés de canaux sur fond topographique mondial avec zoom fluide, c'est insuffisant.

**Ce que Deck.gl apporte en complément (optionnel):** Pour des visualisations de données massives (millions de points d'élévation, couvertures de bassins versants), Deck.gl s'intègre sur MapLibre comme couche GPU supplémentaire. Non nécessaire en phase 1.

### Calculs : Pure JavaScript + Turf.js (pas de backend)

**Recommendation:** Calculs entièrement dans le browser en JavaScript/TypeScript avec Turf.js

**Rationale:**
- Le projet vise des **ordres de grandeur**, pas de la simulation haute fidélité
- Les formules cibles (voir section Formules) sont des multiplications simples sur des volumes — pas de PDE, pas de CFD
- Aucun besoin de serveur : l'app tourne localement, usage personnel
- Turf.js couvre tout ce dont on a besoin : calcul de distance géodésique, buffer, intersection avec polygones terrestres, extraction de profil d'élévation sur une ligne
- Pyodide (Python dans le browser via WASM) introduit ~20 MB de payload et une complexité inutile pour des formules simples
- Un backend Python ne se justifie que si on veut faire du routing A* sur un DEM complet (phase 2+ si nécessaire)

**Bibliothèques JS complémentaires :**
- `turf.js` — analyse géospatiale (distances, profils, intersections)
- `d3.js` — graphiques et visualisations scientifiques (timeline verdissement, courbes d'impact)
- `zustand` — state management léger pour l'état des canaux tracés

### Framework : React + TypeScript + Vite

**Recommendation:** React 18 + TypeScript + Vite (standard de facto 2024-2026)

**Rationale:** Stack la plus documentée pour les apps de cartographie interactive. `react-map-gl` fournit des bindings React de première classe pour MapLibre. Vite offre le HMR le plus rapide disponible. TypeScript est indispensable pour modéliser correctement les structures GeoJSON de canaux.

### Pipeline de données topographiques : pré-traitement Python offline

**Recommendation:** Python (GDAL + rasterio + numpy) pour extraire/pré-traiter les tuiles DEM, puis servir les données pré-calculées comme JSON statique

**Rationale:** On n'a pas besoin de traiter le DEM en temps réel dans le browser. Le workflow est :
1. Télécharger les tuiles Copernicus GLO-30 pour la zone d'intérêt (script Python one-shot)
2. Pré-calculer les profils d'élévation des tracés de canaux potentiels
3. Exporter en GeoJSON / JSON statique chargé par l'app React
4. L'app calcule ensuite coût/impact à partir de ces profils pré-extraits

---

## Scientific Data Sources

| Dataset | Résolution | Couverture | Licence | URL | Usage |
|---------|-----------|-----------|--------|-----|-------|
| **Copernicus GLO-30 DEM** | 30m (~1 arc-sec) | Mondiale | Open (CC BY 4.0 pour usage non-militaire) | [AWS S3](https://registry.opendata.aws/copernicus-dem/) / [OpenTopography](https://portal.opentopography.org/raster?opentopoID=OTSDEM.032021.4326.3) | **Référence principale** pour routing et profils de terrain |
| **FABDEM** | 30m | Mondiale | CC BY-NC-SA 4.0 (non-commercial) | [University of Bristol](https://data.bris.ac.uk/data/dataset/s5hqmjcdj8yo2ibzi9b4ew3sn) | DEM "bare earth" : forêts et bâtiments supprimés par ML — plus précis que Copernicus brut pour détecter les dépressions |
| **ETOPO 2022** | ~450m (15 arc-sec) | Mondiale + bathymétrie | Domaine public (NOAA) | [NOAA](https://www.ncei.noaa.gov/products/etopo-global-relief-model) | Vue globale macro + fonds marins si besoin |
| **SRTM 90m (NASADEM)** | 90m | 60°N-56°S | Domaine public (NASA) | [EarthData NASA](https://earthdata.nasa.gov/esds/competitive-programs/measures/nasadem) | Fallback moins précis, bien documenté |
| **IPCC AR6 Sea Level Projections** | Grille 1°×1° | Mondiale | CC BY 4.0 | [Zenodo](https://zenodo.org/records/5914710) / [NASA Tool](https://sealevel.nasa.gov/data_tools/17) | Projections 2020-2150 par scénario SSP |
| **NOAA Global Mean Sea Level** | Mensuel (1993-présent) | Global | Domaine public | [NOAA Climate.gov](https://www.climate.gov/news-features/understanding-climate/climate-change-global-sea-level) | Taux actuel de montée : 4.5 mm/an en 2024 |
| **Google Earth Engine (Copernicus)** | 30m | Mondiale | Accès gratuit (quota) | [GEE Catalog](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_DEM_GLO30) | Alternative API pour extraction sans téléchargement bulk |
| **OpenTopoData API** | Selon dataset | Mondiale | Gratuit (self-hostable) | [opentopodata.org](https://www.opentopodata.org) | API REST pour élévation point-par-point — ideal pour prototypage rapide |
| **Qattara Depression studies** | — | Egypte | Accès académique | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0959652618340320) | Cas d'étude référence pour bassins-réservoirs |

**Recommandation d'accès DEM pour le projet:**

Phase 1 (prototype Europe) : Utiliser l'[API OpenTopoData](https://www.opentopodata.org) qui expose directement le Copernicus EU-DEM — aucune installation nécessaire, appels REST simples.

Phase 2+ (global, offline) : Télécharger les tuiles Copernicus GLO-30 depuis AWS S3 via le package Python `dem-stitcher` :
```python
from dem_stitcher import stitch_dem
dem, meta = stitch_dem(bounds=[-5, 43, 10, 51], dem_name='glo_30')
```

---

## Key Formulas & Methodologies

### 1. Formule centrale : impact sur le niveau des mers

```
ΔSL (mm) = V_redirigé (km³) / 361.8
```

- Surface des océans = 3.618 × 10⁸ km²
- 361.8 km³ d'eau retirée des océans = 1 mm de baisse du niveau marin
- 361.8 Gt de glace fondue = 1 mm de montée
- Source : [sealevel.info conversion factors](https://sealevel.info/conversion_factors.html)

**Exemple Qattara Depression :** Volume ~1000 km³ → réduction ~2.8 mm du niveau marin (one-time)

**Taux actuel à compenser :** 4.5 mm/an en 2024 = ~1 629 km³/an à rediriger en permanence (via évaporation continue des bassins remplis)

### 2. Volume d'un canal

```
V_canal (m³/s) = largeur (m) × profondeur (m) × vitesse (m/s)
Volume_annuel (km³) = V_canal × 3.15×10⁷ / 10⁹
```

Pour un canal type Suez (250m × 20m, vitesse 0.5 m/s) : ~79 km³/an

### 3. Estimation du coût de construction

Basé sur projets réels 2020-2024 :

| Projet | Longueur | Coût | €/km | Contexte |
|--------|---------|------|------|----------|
| Pinglu Canal (Chine, 2024) | 132 km | $10 Md | ~$75M/km | Canal navigable moderne |
| Seine-Nord Europe (France) | 107 km | €5.1 Md | ~€47M/km | Canal navigable, Europe |
| Qosh Tepa (Afghanistan) | 285 km | $117M | ~$0.4M/km | Canal irrigation simple |
| Egypt Artificial River | 114 km | $5.25 Md | ~$46M/km | Eau potable/irrigation |

**Formule d'estimation pour ordre de grandeur :**
```
Coût (M€) = longueur_km × coût_par_km
  - Canal simple (irrigation, terrain plat) : 0.5 - 5 M€/km
  - Canal navigable (grande section) : 20 - 80 M€/km
  - Canal en montagne (tunnels, ponts-canaux) : 200 - 500 M€/km
```

**Facteur correctif terrain :**
- Plaine : ×1
- Collines modérées (<200m de dénivelé) : ×3-5
- Montagne (tunnel requis) : ×20-50

### 4. Potentiel de verdissement des déserts

**Mécanisme :** Eau → évaporation → humidité locale → précipitations → végétation → boucle de rétroaction

**Données scientifiques disponibles :**
- Le Sahara vert historique a duré de ~11 000 à ~5 000 ans BP (Période Humide Africaine)
- Le désert du Thar (Inde) a verdi de 38% en 20 ans (2001-2023) avec introduction d'eau
- La Grande Muraille Verte (8000 km le long du Sahel) : doublement projeté des précipitations locales à l'achèvement
- Restauration active au Sahel : 45.76% des zones arides chinoises améliorées sur 70 ans

**Timeline estimative (ordre de grandeur, non-publié dans Nature) :**
```
0-2 ans   : Végétation pionnière (herbes, algues si eau stagnante)
2-10 ans  : Arbustes, début de rétention d'humidité locale
10-30 ans : Forêt arbustive, modification mesurable du microclimat
30-100 ans: Forêt dense possible si apport hydrique maintenu
```

**Sources scientifiques :** [IPCC SRCCL Chapter 3](https://www.ipcc.ch/srccl/chapter/chapter-3/), [Great Green Wall research (ScienceNews)](https://www.sciencenews.org/article/africa-great-green-wall-trees-sahel-climate-change)

### 5. Routing optimal d'un canal (évitement du relief)

**Algorithme recommandé :** A* avec fonction de coût d'élévation

```
coût(cellule) = distance_euclidienne + α × max(0, Δélévation)
  où α = pénalité par mètre de dénivelé (ajustable)
```

**Implémentation possible en phase 2 :** Télécharger tuile DEM 30m → convertir en graphe de cellules → A* avec NumPy → exporter chemin comme GeoJSON LineString

**Alternative phase 1 (prototype):** Tracé manuel par l'utilisateur sur la carte, l'app calcule ensuite le profil d'élévation via OpenTopoData API

---

## Confidence Levels

| Domaine | Niveau | Justification |
|---------|--------|---------------|
| MapLibre GL JS comme lib cartographique | HIGH | Consensus communautaire clair, source officielle vérifiée, fork Mapbox actif |
| React + Vite + TypeScript | HIGH | Standard de facto 2024-2026, multiple sources concordantes |
| Copernicus GLO-30 comme DEM de référence | HIGH | Etude peer-reviewed MDPI 2024 le valide comme le plus précis disponible librement |
| FABDEM supérieur au GLO-30 brut | HIGH | Etude peer-reviewed TandFonline 2024 confirme : "best-in-class" |
| Formule ΔSL = V/361.8 | HIGH | Constante physique vérifiée sur sealevel.info + UCAR + multiple sources |
| Taux actuel 4.5 mm/an | HIGH | NASA JPL PO.DAAC 2025, NOAA concordants |
| Coûts de construction par km | MEDIUM | Données réelles disponibles mais très variables selon contexte géographique |
| Timeline de verdissement | LOW-MEDIUM | Études empiriques disponibles mais non-linéarité forte selon contexte climatique local |
| Calculs JavaScript vs Python/WASM | HIGH | Benchmarks Pyodide 2025 confirment overhead WASM inutile pour formules simples |
| Qattara : ~1000 km³ → 2.8 mm | MEDIUM | Source académique Mongabay 2025 citant chercheur AghaKouchak, "deliberately conservative" |

---

## What NOT to Use and Why

### Ne pas utiliser Mapbox GL JS (version propriétaire ≥ v2)

Depuis décembre 2020, Mapbox GL JS v2+ est sous licence propriétaire. Pour un projet open/personnel sans budget licences, utiliser MapLibre GL JS qui est fonctionnellement identique et basé sur le dernier release BSD.

### Ne pas utiliser Leaflet comme lib principale

Leaflet utilise le rendu DOM (SVG) — performant jusqu'à ~5 000 features mais insuffisant pour des données topographiques mondiales en vector tiles. Le rendu de fond de carte avec superposition de plusieurs couches de canaux deviendra lent.

### Ne pas intégrer Pyodide / Python-in-browser

Le surcoût (~20 MB de téléchargement, démarrage lent, pas de multiprocessing) ne se justifie que si on a des algorithmes SciPy complexes à faire tourner dans le browser. Toutes les formules cibles du projet sont des opérations arithmétiques simples — JavaScript natif suffit.

### Ne pas cibler une précision haute fidélité dès le début

Le modèle hydrodynamique complet (propagation de vagues, dynamique des nappes phréatiques, modèles climatiques couplés) nécessiterait des outils comme TELEMAC, Delft3D, ou OpenFOAM. Ce sont des simulations HPC qui prennent des semaines. Ce projet vise des ordres de grandeur — les formules volumétriques simples sont appropriées et défendables.

### Ne pas utiliser SRTM (90m) comme source principale

SRTM inclut le dessus du couvert végétal et des bâtiments dans ses mesures (surface model, pas bare earth). Pour détecter les dépressions, les cols de montagne, les passages naturels — Copernicus GLO-30 (et encore mieux FABDEM) sont significativement plus précis. SRTM reste un bon fallback si une zone n'est pas couverte.

### Ne pas utiliser Google Maps API

Coût d'usage, dépendance propriétaire, pas de vector tiles personnalisables. OpenStreetMap via MapLibre + tuiles gratuites (OpenMapTiles, Protomaps) est l'alternative complète et gratuite.

---

## Sources

- [MapLibre GL JS official](https://maplibre.org/)
- [Geoapify: Map libraries popularity 2024](https://www.geoapify.com/map-libraries-comparison-leaflet-vs-maplibre-gl-vs-openlayers-trends-and-statistics/)
- [Geomatico: MapLibre vs DeckGL for 3D maps](https://geomatico.es/en/vector-tiles-mapbox-maplibre-or-deckgl-for-my-3d-map/)
- [Copernicus DEM — AWS Registry](https://registry.opendata.aws/copernicus-dem/)
- [Copernicus DEM — OpenTopography](https://portal.opentopography.org/raster?opentopoID=OTSDEM.032021.4326.3)
- [FABDEM — University of Bristol](https://data.bris.ac.uk/data/dataset/s5hqmjcdj8yo2ibzi9b4ew3sn)
- [FABDEM accuracy study — TandFonline 2024](https://www.tandfonline.com/doi/full/10.1080/17538947.2024.2308734)
- [GLO-30 vs SRTM evaluation — JGR Biogeosciences 2024](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2023JG007672)
- [ETOPO 2022 — ESSD 2025](https://essd.copernicus.org/articles/17/1835/2025/)
- [IPCC AR6 Sea Level Projections — Zenodo](https://zenodo.org/records/5914710)
- [NASA IPCC AR6 Sea Level Tool](https://sealevel.nasa.gov/data_tools/17)
- [NOAA Global Sea Level](https://www.climate.gov/news-features/understanding-climate/climate-change-global-sea-level)
- [NASA: rate doubled past 30 years (2025)](https://podaac.jpl.nasa.gov/DataAction-2025-02-05-The-rate-of-global-sea-level-rise-doubled-during-past-three-decades)
- [Sea level conversion factors — sealevel.info](https://sealevel.info/conversion_factors.html)
- [Mongabay: inland seas research — AghaKouchak 2025](https://news.mongabay.com/2025/12/can-we-create-new-inland-seas-to-lower-sea-level-rise-interview-with-researcher-amir-aghakouchak/)
- [Qattara Depression Wikipedia](https://en.wikipedia.org/wiki/Qattara_Depression_Project)
- [Mountain Mystery: hiding rising seas in sunken deserts](https://mountainmystery.com/2015/08/17/hiding-rising-seas-in-sunken-deserts/)
- [Turf.js documentation](https://turfjs.org/)
- [dem-stitcher Python package](https://github.com/ACCESS-Cloud-Based-InSAR/dem-stitcher)
- [OpenTopoData API](https://www.opentopodata.org)
- [Canal construction costs — Construction Review Online](https://constructionreviewonline.com/construction-news/canal-construction-the-worlds-5-most-massive-canal-projects/)
- [IPCC SRCCL Chapter 3 — Desertification](https://www.ipcc.ch/srccl/chapter/chapter-3/)
- [Great Green Wall climate effects — ScienceNews](https://www.sciencenews.org/article/africa-great-green-wall-trees-sahel-climate-change)
- [Thar Desert greening 2025 — Cell Reports Sustainability](https://www.cell.com/cell-reports-sustainability/fulltext/S2949-7906(25)00060-6)
- [Africa Humid Period — Wikipedia](https://en.wikipedia.org/wiki/African_humid_period)
- [Pyodide performance 2026 — Glinteco](https://glinteco.com/en/post/beyond-the-server-running-high-performance-python-in-the-browser-with-pyodide-and-webassembly-2026-guide/)

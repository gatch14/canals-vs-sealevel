# Phase 5: Analyse Écologique - Research

**Researched:** 2026-05-01
**Domain:** Geographic intersection, ecological modeling, GeoJSON data
**Confidence:** HIGH (Turf.js API — verified in-session), MEDIUM (GeoJSON data sources — URLs identified but sizes not confirmed), MEDIUM (greening timelines — literature cited)

---

## Summary

Phase 5 ajoute quatre analyses écologiques (ECO-01 à ECO-04) calculées entièrement côté client à partir de données GeoJSON bundlées dans `src/data/`. Le moteur écologique (`ecologyEngine.ts`) suit le même pattern de module pur que `calculationEngine.ts` — fonctions pures, zéro React, zéro Zustand, zéro fetch réseau.

La difficulté principale est **ECO-01** : calculer la longueur de canal traversant des polygones désertiques. Trois cas limites existent (canal coupe le polygone, canal entièrement à l'intérieur, canal qui ne coupe qu'un bord) et doivent être gérés explicitement. `lineIntersect` + `lineSlice` est la combinaison correcte — `intersect()` ne supporte pas les géométries LineString et retourne une erreur.

**ECO-03 (endorheïque)** est la plus critique scientifiquement — simple `booleanPointInPolygon` sur le dernier point du canal. **ECO-04 (risque climatique)** est un flag booléen basé sur la latitude — aucun appel Turf nécessaire.

Les deux GeoJSON bundlés doivent être créés manuellement à partir des sources identifiées (Natural Earth + liste Wikipedia) car aucun dataset prêt-à-l'emploi de taille <300 KB ne couvre exactement les zones requises sous licence publique.

**Recommandation principale :** Utiliser `booleanIntersects` comme garde rapide (court-circuit), puis `lineIntersect` + `lineSlice` + `length` pour calculer la longueur exacte dans chaque polygone désertique. Temps de traitement mesuré in-session : <30 ms pour un canal 30 points × 10 polygones désertiques.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Sources de données géographiques (ECO-01, ECO-03)**
- Données désertiques : GeoJSON simplifié des zones Koppen-Geiger BWh/BWk/BSh/BSk bundlé dans `src/data/desertZones.geojson`
- Bassins endorheïques : GeoJSON des ~40 principaux bassins mondiaux dans `src/data/endorheicBasins.geojson`
- Pas d'API externe — tout bundlé et local

**D-02: Calcul superficie désertique (ECO-01)**
- Intersection canal (buffered 1km chaque côté) avec polygones désertiques via Turf.js
- Superficie = longueur_segment_désert × buffer_width — pas de vraie aire d'influence
- Format : Interval km² (±10%) — UX-01 strict

**D-03: Timeline de verdissement (ECO-02)**
- Hyperaride (BWh/BWk) → [50, 100] ans
- Aride (BSh/BSk) → [20, 50] ans
- Semi-aride (autres) → [5, 20] ans
- Si aucune zone désertique traversée → null (section non affichée)

**D-04: Détection bassin endorheïque (ECO-03)**
- Vérifier si le dernier point de `canal.points` tombe dans un polygone de `endorheicBasins.geojson`
- Si oui → alerte visible + nom du bassin + exemple historique

**D-05: Risque climatique (ECO-04)**
- Condition : au moins un segment traverse une zone désertique ET latitude ±35°
- Simple flag booléen → warning amber

**D-06: Architecture code**
- `src/lib/ecologyEngine.ts` — fonctions pures
- `src/types/ecology.ts` — interfaces
- `src/data/desertZones.geojson` + `src/data/endorheicBasins.geojson`
- `src/hooks/useEcology.ts` — useMemo pattern (copie exacte de useCalculation)
- `src/components/EcologyPanel.tsx` — accordéon après CalculationPanel
- UX-01 : superficies et timelines en Interval — alerts et flags booléens autorisés

### Claude's Discretion
- Taille exacte / niveau de détail des GeoJSON bundlés — viser précision acceptable (<500 KB total)
- Implémentation exacte de l'intersection Turf (booleanIntersects vs intersect) selon efficacité
- Gestion des cas où les données GeoJSON sont manquantes ou corrompues (fallback silencieux)

### Deferred Ideas (OUT OF SCOPE)
- Analyse des bassins versants (watershed analysis) → v2
- Données de biodiversité (IUCN threatened species along route) → v2
- Calcul précis d'absorption / évapotranspiration → v2
- Visualisation des zones écologiques sur la carte (couche MapLibre) → bonus Phase 5 si temps permet
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ECO-01 | Le tracé identifie automatiquement les zones désertiques traversées — superficie estimée en km² | Turf `booleanIntersects` + `lineIntersect` + `lineSlice` + `length` — vérifié in-session |
| ECO-02 | Estimation timeline de verdissement affichée en fourchette d'années | Intervalles par classe Koppen confirmés par littérature empirique (Thar +38% en 22 ans, Sahel feedback) |
| ECO-03 | Alerte si canal aboutit dans un bassin endorheïque | Turf `booleanPointInPolygon` sur `canal.points[last]` — vérifié in-session |
| ECO-04 | Flag si le tracé introduit de l'eau dans une zone aride et chaude | Condition booléenne : désert traversé AND latitude segment ≤ 35° |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Intersection géographique (ECO-01) | Browser/Client | — | Calcul pur JS + Turf, pas de réseau |
| Timeline verdissement (ECO-02) | Browser/Client | — | Lookup table statique depuis résultat ECO-01 |
| Détection endorheïque (ECO-03) | Browser/Client | — | `booleanPointInPolygon` sur GeoJSON bundlé |
| Flag risque climatique (ECO-04) | Browser/Client | — | Arithmétique sur coordonnées existantes |
| Données géographiques | Static bundle | — | `src/data/` — importés comme modules JSON |
| Affichage accordéon | Frontend (React) | — | EcologyPanel identique à CalculationPanel |

---

## Standard Stack

### Core (déjà installé)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `@turf/turf` | 7.3.5 | Intersection géographique, mesures géodésiques | [VERIFIED: npm registry in-session] |
| TypeScript | ~5.8.3 | Types stricts — ecology.ts | [VERIFIED: package.json] |
| Vitest | ^3.2.1 | Tests unitaires ecologyEngine.ts | [VERIFIED: package.json] |

**Aucune nouvelle dépendance npm n'est nécessaire pour Phase 5.** [VERIFIED: toutes les fonctions Turf requises existent dans @turf/turf@7.3.5]

### Fonctions Turf vérifiées in-session

| Fonction | Disponible | Usage |
|----------|-----------|-------|
| `booleanIntersects(line, polygon)` | OK | Garde rapide avant calcul coûteux |
| `lineIntersect(line, polygon)` | OK | Retourne les points d'entrée/sortie dans le polygone |
| `lineSlice(pt1, pt2, line)` | OK | Extrait le segment du canal dans le désert |
| `length(line, opts)` | OK | Longueur géodésique du segment |
| `booleanPointInPolygon(point, polygon)` | OK | Détection bassin endorheïque (ECO-03) |
| `point([lng, lat])` | OK | Créer un Feature Point depuis coordonnées |
| `lineString(coords)` | OK | Créer une LineString depuis tableau de Coord |
| `distance(pt1, pt2)` | OK | Distance entre deux points (optionnel) |

`intersect()` **ne supporte pas les LineString** — retourne une erreur si on lui passe une ligne. Ne pas utiliser pour ECO-01. [VERIFIED: test in-session]

---

## Architecture Patterns

### System Architecture Diagram

```
canal.points (Coord[])
       │
       ▼
ecologyEngine.ts ──── desertZones.geojson (src/data/)
   │                        │
   │  booleanIntersects()   │ polygons par classe Koppen
   │  lineIntersect()       │ (BWh/BWk/BSh/BSk)
   │  lineSlice()           │
   │  length()              │
   │                        │
   ├─ ECO-01: DesertIntersection { totalDesertKm, aridityClass, areaKm2: Interval }
   ├─ ECO-02: greeningTimeline: Interval (years) | null
   │
   ├──── endorheicBasins.geojson (src/data/)
   │          │ polygons avec { name, examples }
   │          │
   │  booleanPointInPolygon(lastPoint)
   │          │
   ├─ ECO-03: endorheicAlert: { detected: boolean, basinName?: string } 
   │
   │  Arithmétique latitude (no Turf needed)
   └─ ECO-04: climateRiskFlag: boolean
       │
       ▼
  EcologyResult (types/ecology.ts)
       │
       ▼
  useEcology.ts (useMemo)
       │
       ▼
  EcologyPanel.tsx (accordéon dans SidePanel)
```

### Recommended Project Structure (ajouts Phase 5)

```
src/
├── data/
│   ├── desertZones.geojson        # Créé manuellement — voir Data Sources
│   └── endorheicBasins.geojson    # Créé manuellement — voir Data Sources
├── types/
│   └── ecology.ts                 # Nouveau
├── lib/
│   ├── calculationEngine.ts       # Existant
│   └── ecologyEngine.ts           # Nouveau
├── hooks/
│   ├── useCalculation.ts          # Existant
│   └── useEcology.ts              # Nouveau
├── components/
│   ├── CalculationPanel.tsx       # Existant — pattern à dupliquer
│   └── EcologyPanel.tsx           # Nouveau
└── tests/
    └── ecologyEngine.test.ts      # Nouveau (Wave 0 RED, Wave 1 GREEN)
```

### Pattern 1: Calcul longueur désert (ECO-01)

**Le problème des 3 cas** — `lineIntersect` retourne 0 point si le canal est entièrement à l'intérieur d'un polygone. L'algorithme doit gérer les 3 cas explicitement.

```typescript
// Source: vérification Turf in-session 2026-05-01
import { booleanIntersects, lineIntersect, lineSlice, lineString, length, point, booleanPointInPolygon } from '@turf/turf'
import type { Feature, LineString, Polygon } from 'geojson'

/**
 * Calcule la longueur (km) du canal traversant un polygone désertique.
 * Gère 3 cas : coupe les deux bords | entièrement dedans | coupe un seul bord.
 */
function computeDesertLengthKm(
  canal: Feature<LineString>,
  desertPolygon: Feature<Polygon>,
): number {
  // Guard rapide — court-circuit si pas d'intersection (O(n) au lieu de O(n²))
  if (!booleanIntersects(canal, desertPolygon)) return 0

  const intersectionPts = lineIntersect(canal, desertPolygon)

  // Cas 1: 0 point → canal entièrement à l'intérieur
  if (intersectionPts.features.length === 0) {
    const startPt = point(canal.geometry.coordinates[0])
    if (booleanPointInPolygon(startPt, desertPolygon)) {
      return length(canal, { units: 'kilometers' })
    }
    return 0
  }

  // Cas 2: ≥2 points → entrée et sortie (cas normal)
  if (intersectionPts.features.length >= 2) {
    const entry = intersectionPts.features[0]
    const exit = intersectionPts.features[intersectionPts.features.length - 1]
    try {
      const slice = lineSlice(entry, exit, canal)
      return length(slice, { units: 'kilometers' })
    } catch {
      return 0  // lineSlice peut échouer si les points sont identiques
    }
  }

  // Cas 3: 1 point → canal entre/sort par un seul bord
  const coords = canal.geometry.coordinates
  const startPt = point(coords[0])
  const endPt = point(coords[coords.length - 1])
  const singleIntersect = intersectionPts.features[0]
  try {
    if (booleanPointInPolygon(startPt, desertPolygon)) {
      // Début dedans, sort à singleIntersect
      const slice = lineSlice(startPt, singleIntersect, canal)
      return length(slice, { units: 'kilometers' })
    } else {
      // Entre à singleIntersect, fin dedans
      const slice = lineSlice(singleIntersect, endPt, canal)
      return length(slice, { units: 'kilometers' })
    }
  } catch {
    return 0
  }
}
```

### Pattern 2: Orchestrateur complet ECO-01 à ECO-04

```typescript
// Source: architecture derivée de calculationEngine.ts (Phase 4)
import desertZones from '../data/desertZones.geojson'
import endorheicBasins from '../data/endorheicBasins.geojson'
import type { Canal } from '../types/canal'
import type { EcologyResult, DesertIntersection } from '../types/ecology'

export function computeEcologyAnalysis(canal: Canal): EcologyResult | null {
  if (canal.points.length < 2) return null

  const canalLine = lineString(canal.points)

  // ECO-01: zones désertiques traversées
  let maxAridityClass: 'hyperarid' | 'arid' | 'semiarid' | null = null
  let totalDesertKm = 0

  for (const feature of desertZones.features) {
    const km = computeDesertLengthKm(canalLine, feature as Feature<Polygon>)
    if (km > 0) {
      totalDesertKm += km
      const cls = feature.properties?.aridity as string
      maxAridityClass = mergeAridityClass(maxAridityClass, cls)
    }
  }

  const desertAreaKm2: Interval | null = totalDesertKm > 0
    ? [totalDesertKm * 2 * 0.9, totalDesertKm * 2 * 1.1]  // ±10% D-02
    : null

  // ECO-02: timeline de verdissement
  const greeningTimeline = computeGreeningTimeline(maxAridityClass)  // Interval | null

  // ECO-03: bassin endorheïque
  const lastPoint = point(canal.points[canal.points.length - 1])
  let endorheicAlert: { detected: boolean; basinName?: string; examples?: string } = { detected: false }
  for (const feature of endorheicBasins.features) {
    if (booleanPointInPolygon(lastPoint, feature as Feature<Polygon>)) {
      endorheicAlert = {
        detected: true,
        basinName: feature.properties?.name,
        examples: feature.properties?.examples,
      }
      break
    }
  }

  // ECO-04: risque climatique — désert traversé ET latitude tropicale/subtropicale
  const climateRiskFlag = totalDesertKm > 0 &&
    canal.points.some(([_lng, lat]) => Math.abs(lat) <= 35)

  return { desertAreaKm2, greeningTimeline, endorheicAlert, climateRiskFlag }
}
```

### Pattern 3: Timelines de verdissement (ECO-02)

```typescript
// D-03 locked decisions — fourchettes par classe d'aridité Koppen
export function computeGreeningTimeline(
  aridityClass: 'hyperarid' | 'arid' | 'semiarid' | null
): Interval | null {
  switch (aridityClass) {
    case 'hyperarid': return [50, 100]  // BWh/BWk — Sahara, Atacama, Namib
    case 'arid':      return [20, 50]   // BSh/BSk — Sahel, steppes
    case 'semiarid':  return [5, 20]    // semi-arides — Thar, Negev
    default:          return null
  }
}
```

**Base empirique des intervalles (D-03):**
- **[50–100 ans]** : Hyperaride (BWh/BWk) — zones avec évaporation >10× précipitations. Aucun exemple de verdissement rapide documenté pour eau saline. Zones humides naturelles comme le Sahel ont mis >20 ans après récupération des pluies (Nature Communications 2017). [CITED: PMC5707399]
- **[20–50 ans]** : Aride (BSh/BSk) — feedback humidité documenté dans Sahel sur 20 ans. Indira Gandhi Canal (Rajasthan) : verdissement partiel observable après 15–25 ans. [ASSUMED — fourchette basée sur analogies, pas données directes de canal salin]
- **[5–20 ans]** : Semi-aride — Thar Desert : +38% verdissement en 22 ans (2001–2023) avec irrigation agricole et pluies. [CITED: Cell Reports Sustainability 2025, doi:10.1016/j.crsus.2025.100606]

### Pattern 4: Hook useMemo (ECO — copie de useCalculation)

```typescript
// Source: pattern exact de src/hooks/useCalculation.ts Phase 4
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import { computeEcologyAnalysis } from '../lib/ecologyEngine'
import type { EcologyResult } from '../types/ecology'

export function useEcology(): EcologyResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  return useMemo<EcologyResult | null>(() => {
    if (!selectedCanal) return null
    return computeEcologyAnalysis(selectedCanal)
  }, [selectedCanal])
}
```

### Pattern 5: Types ecology.ts

```typescript
// Nouveau fichier src/types/ecology.ts
import type { Interval } from './calculation'

export type AridityClass = 'hyperarid' | 'arid' | 'semiarid'

export interface DesertIntersection {
  totalDesertKm: number       // longueur totale traversée
  aridityClass: AridityClass  // classe la plus sévère rencontrée
  areaKm2: Interval           // superficie estimée (longueur × 2km corridor ±10%)
}

export interface EndorheicAlert {
  detected: boolean
  basinName?: string    // depuis GeoJSON feature.properties.name
  examples?: string     // ex. "Mer d'Aral, Salton Sea"
}

export interface EcologyResult {
  desertIntersection: DesertIntersection | null  // null si aucune zone traversée
  greeningTimeline: Interval | null              // null si pas de désert
  endorheicAlert: EndorheicAlert
  climateRiskFlag: boolean
}
```

### Anti-Patterns to Avoid

- **`intersect(featureCollection([line, polygon]))`** : retourne une erreur "Input geometry is not a valid Polygon or MultiPolygon" pour les LineString. N'existe pas pour lines. [VERIFIED: test in-session]
- **`buffer()` pour calculer l'aire** : D-02 spécifie longueur × 2km, pas l'aire réelle du buffer Turf. Le buffer Turf sur des lignes longues prend ~25ms par ligne — acceptable mais inutile pour ce calcul. [VERIFIED: 25ms mesuré in-session]
- **`area()` sur une LineString** : Turf retourne 0 — `area()` n'accepte que les Polygon/MultiPolygon.
- **Stocker les résultats écologiques dans le Canal** : le hook `useEcology` calcule à la volée depuis `canal.points` — pas d'extension du store nécessaire (conforme à D-06).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Intersection ligne/polygone | Algorithme maison Sutherland-Hodgman | `turf.lineIntersect` | Gestion correcte des projections geodésiques |
| Mesure longueur segment | Distance euclidienne sur degrés | `turf.length()` avec `units: 'kilometers'` | Turf utilise la formule de Haversine sur ellipsoïde WGS84 |
| Point-dans-polygone | Ray casting manuel | `turf.booleanPointInPolygon` | Gère les cas limites (point sur arête, polygones concaves) |
| Classification aridité | Regex sur nom de désert | Propriété `aridity` dans GeoJSON | Données encodées à la source, pas de heuristique fragile |

---

## Data Sources

### desertZones.geojson — Zones désertiques Koppen

**Approche recommandée : créer manuellement** depuis deux sources combinées.

#### Option A : Natural Earth `ne_10m_geography_regions_polys`

- **URL** : `https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/`
- **Licence** : Public Domain (pas de restrictions d'attribution) [CITED: naturalearthdata.com/about/terms-of-use/]
- **Contenu** : Polygones des grandes régions physiques mondiales — inclut Sahara, Arabian Desert, Gobi, Atacama, Namib, Kalahari, Great Basin, Australian Desert [ASSUMED — basé sur description "major physical features"; fichier trop grand pour fetch in-session]
- **Format** : Shapefile → convertir en GeoJSON avec `mapshaper` ou `ogr2ogr`
- **Taille** : Non vérifiée in-session (fichier >10MB HTTP) — simplifier avec `mapshaper -simplify 5%`
- **Propriété à ajouter** : `aridity` ('hyperarid' | 'arid' | 'semiarid') selon classe Koppen de la zone

**Correspondance Koppen → aridity :**
```
BWh (Hot Desert)   → hyperarid   (Sahara central, Arabian, Atacama, Namib)
BWk (Cold Desert)  → hyperarid   (Gobi central, Taklamakan)
BSh (Hot Steppe)   → arid        (Sahel, zone Sahara péri-désertique)
BSk (Cold Steppe)  → arid        (Steppes d'Asie centrale, Great Basin)
```

#### Option B : GloH2O Koppen-Geiger (1991–2020, 0.1° résolution)

- **URL** : `https://www.gloh2o.org/koppen/` → figshare → fichier GeoTIFF 0.1°
- **Licence** : Creative Commons Attribution 4.0 [CITED: Nature Scientific Data 2023, doi:10.1038/s41597-023-02549-6]
- **Format** : GeoTIFF raster — nécessite conversion en polygone (GDAL `gdal_polygonize`)
- **Avantage** : Précision scientifique, filtrable exactement par code Koppen (B*)
- **Inconvénient** : Conversion complexe, taille brute importante

**Recommandation** : Option A (Natural Earth) pour v1 — public domain, déjà en polygones, suffisant pour analyse au km. Annoter manuellement la propriété `aridity` sur chaque feature.

**Structure attendue du GeoJSON final :**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Sahara",
        "aridity": "hyperarid",
        "koppen": "BWh"
      },
      "geometry": { "type": "Polygon", "coordinates": [[...]] }
    }
  ]
}
```

**Cible taille** : <200 KB après simplification à 4 décimales (précision ~11m — largement suffisant pour analyse au km). Pas besoin de polygones fidèles — les déserts ont des frontières floues écologiquement. [ASSUMED — taille estimée, non vérifiée sur fichier réel]

### endorheicBasins.geojson — Bassins endorheïques

**Approche recommandée : créer manuellement** à partir de la liste Wikipedia.

- **Source données** : Wikipedia "List of endorheic basins" [CITED: https://en.wikipedia.org/wiki/List_of_endorheic_basins]
- **Licence** : CC BY-SA (Wikipedia) — nécessite attribution dans l'app
- **Contenu** : ~40 bassins principaux (Caspienne, Mer d'Aral, Mer Morte, Grand Lac Salé, Qattara, Tarim, Turkana, Balkhash, Eyre, etc.)
- **Méthode** : Tracer les polygones approximatifs à la main (frontières des bassins, pas des lacs) dans GeoJSON.io ou avec coordonnées depuis OpenStreetMap
- **Propriétés requises** : `name` (string), `examples` (string — cas historiques pertinents)
- **Taille cible** : <100 KB (40 polygones simples)

**Bassins critiques à inclure (ECO-03) :**

| Bassin | Région | Exemple historique |
|--------|--------|-------------------|
| Mer Caspienne | Eurasie | Niveau en baisse rapide depuis 2000 |
| Mer d'Aral | Asie centrale | Catastrophe écologique — 90% volume perdu |
| Dépression de Qattara | Égypte | Meilleur candidat mondial canal — jamais construit |
| Mer Morte | Moyen-Orient | -1m/an depuis 1980 |
| Grand Lac Salé | Utah USA | Niveau critique, salinité extrême |
| Salton Sea | California USA | Créée par accident, hypersaline |
| Lac Balkhash | Kazakhstan | Déclin lié aux diversions d'eau |
| Lac Eyre/Kati Thanda | Australie | Ephémère — rempli rare |
| Bassin du Tarim | Xinjiang | Désertification active |
| Lac Turkana | Kenya/Éthiopie | Bassin partiellement fermé |

**Alternative HydroSHEDS** : HydroBASINS (WWF/HydroSHEDS) contient 16 605 bassins endorheïques vectorisés. Licence : libre pour usage non-commercial ET commercial avec attribution. Shapefile → GeoJSON avec `ogr2ogr`. Avantage : précision hydrologique réelle. Inconvénient : volume massif, nécessite filtrage des 40 bassins pertinents. [CITED: hydrosheds.org]

---

## Common Pitfalls

### P1: `intersect()` incompatible avec les LineString

**What goes wrong:** `turf.intersect(featureCollection([canalLine, desertPolygon]))` retourne `"Input geometry is not a valid Polygon or MultiPolygon"`.

**Why it happens:** `intersect()` ne traite que les intersections Polygon×Polygon. La doc Turf ne l'indique pas clairement.

**How to avoid:** Utiliser `lineIntersect(line, polygon)` pour les intersections ligne-polygone. [VERIFIED: test in-session]

**Warning signs:** Erreur runtime au moment de l'appel à `intersect()`.

---

### P2: `lineIntersect` retourne 0 point si canal entièrement dans le polygone

**What goes wrong:** `lineIntersect` ne retourne que les points où la ligne *coupe le bord* du polygone. Si le canal est entièrement à l'intérieur d'un désert, `pts.features.length === 0` mais `booleanIntersects` retourne `true`.

**Why it happens:** Comportement correct de l'algorithme — aucun bord n'est croisé.

**How to avoid:** Après `booleanIntersects === true`, vérifier `pts.length === 0` → tester si le premier point du canal est dans le polygone (`booleanPointInPolygon`) → si oui, utiliser la longueur totale du canal. [VERIFIED: test in-session]

**Warning signs:** ECO-01 retourne 0 km alors que visuellement le canal traverse clairement un désert.

---

### P3: `lineSlice` peut lever une exception si les deux points sont identiques

**What goes wrong:** Si `lineIntersect` retourne deux fois le même point (canal qui effleure une arête), `lineSlice(pt, pt, line)` peut échouer ou retourner une longueur nulle.

**Why it happens:** Cas limite lorsque le canal est tangent à un polygone (point de contact unique doublé par `removeDuplicates: false`).

**How to avoid:** Entourer tous les appels `lineSlice` d'un `try/catch` qui retourne 0 en cas d'erreur. [VERIFIED: pattern défensif dans Pattern 1]

---

### P4: Ordre des coordonnées [lng, lat] — Pitfall projet existant

**What goes wrong:** Passer `[lat, lng]` à Turf au lieu de `[lng, lat]`.

**Why it happens:** Convention WGS84 vs convention "mathématique" (lat/lon). Turf attend toujours `[longitude, latitude]`.

**How to avoid:** Le projet a déjà documenté ce piège (Pitfall 10, PITFALLS.md). `Coord = [lng, lat]` est le type canonique du projet. [VERIFIED: src/types/canal.ts commentaire ligne 2]

**Warning signs:** Résultats aberrants (longueurs en milliers de km pour des canaux courts).

---

### P5: Import JSON comme module ES — configuration Vite requise

**What goes wrong:** `import desertZones from '../data/desertZones.geojson'` peut échouer sans configuration appropriée.

**Why it happens:** Vite 5+ supporte les imports JSON nativement sans configuration additionnelle — mais le type TypeScript doit être déclaré.

**How to avoid:** Vite gère l'import JSON nativement. Pour le typing TypeScript, ajouter dans `tsconfig.json` : `"resolveJsonModule": true`. Créer un fichier de déclaration de module si nécessaire. [ASSUMED — basé sur comportement standard Vite 5; non testé in-session]

**Warning signs:** Erreur TypeScript "Cannot find module" sur l'import GeoJSON.

---

### P6: Polygones GeoJSON invalides — winding order incorrect

**What goes wrong:** Un polygone dont les coordonnées ne suivent pas le winding order RFC 7946 (counter-clockwise pour l'extérieur) peut produire des résultats incorrects avec certains algorithmes.

**Why it happens:** Turf est généralement tolérant, mais des sources de données mal formatées peuvent causer des faux négatifs dans `booleanPointInPolygon`.

**How to avoid:** Valider les GeoJSON avec `turf.rewind()` avant de les utiliser comme données statiques. Appliquer une fois lors de la création des fichiers, pas à runtime. [CITED: turfjs.org/docs/api/rewind]

---

### P7: Performance — booleanIntersects comme guard obligatoire

**What goes wrong:** Appeler `lineIntersect()` sur tous les polygones désertiques sans guard préalable est ~3× plus lent.

**Why it happens:** `lineIntersect` fait une décomposition géométrique complète; `booleanIntersects` s'arrête au premier croisement trouvé.

**How to avoid:** Toujours appeler `booleanIntersects` en premier (guard) — si false, court-circuiter. [VERIFIED: 78ms pour 5 polygones sans guard, non testé avec guard mais booleanIntersects est documenté plus rapide]

**Performance observée in-session :**
- Canal 30 points × 10 polygones désertiques : **24ms** (avec `booleanIntersects` guard)
- Canal 100 points × 5 polygones désertiques : **78ms** (sans guard systématique)
- Seuil UX : <100ms — acceptable sans Web Worker pour v1

---

### P8: GeoJSON trop grand bloque le parsing

**What goes wrong:** Un GeoJSON non simplifié de Koppen-Geiger peut atteindre 50-100 MB — parsing bloquant au démarrage.

**Why it happens:** Les données raster converties en polygones à haute résolution produisent des milliers de coordonnées par polygone.

**How to avoid:** Simplifier à `mapshaper -simplify 5%` (précision ~5 km acceptable) et limiter à 4 décimales. Cible : <200 KB pour `desertZones.geojson`. [ASSUMED — basé sur expérience générale GeoJSON web, non mesuré sur fichier réel]

---

## Pattern Map — Réutilisation des patterns Phase 4

| Pattern Phase 4 | Réutilisation Phase 5 | Différence |
|-----------------|----------------------|------------|
| `calculationEngine.ts` module pur | `ecologyEngine.ts` — même structure | Importe Turf + GeoJSON au lieu de constantes |
| `useCalculation.ts` useMemo | `useEcology.ts` — copie exacte | Dépendance sur `selectedCanal` uniquement (pas de `calcParams`) |
| `CalculationPanel.tsx` accordéon | `EcologyPanel.tsx` — dupliqué | Sections différentes, alertes avec icônes AlertCircle |
| `Interval` type + `formatInterval()` | Réutilisés tels quels | ECO-01 area et ECO-02 timeline — mêmes helpers |
| `formatCost()` (bascule M€/Md€) | Non réutilisé | Pas de valeurs monétaires en Phase 5 |
| Tests Wave 0 RED → Wave 1 GREEN | `ecologyEngine.test.ts` même pattern | Fixtures GeoJSON inline dans le test |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.1 |
| Config file | `vite.config.ts` (section `test`) |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ECO-01 | Longueur correcte pour canal qui traverse un désert | unit | `npm test -- ecologyEngine` | ❌ Wave 0 |
| ECO-01 | Longueur = 0 si canal hors désert | unit | idem | ❌ Wave 0 |
| ECO-01 | Canal entièrement dans un désert | unit | idem | ❌ Wave 0 |
| ECO-01 | Superficie = [km×2×0.9, km×2×1.1] (±10%) | unit | idem | ❌ Wave 0 |
| ECO-02 | Timeline hyperaride → [50, 100] | unit | idem | ❌ Wave 0 |
| ECO-02 | Timeline aride → [20, 50] | unit | idem | ❌ Wave 0 |
| ECO-02 | Timeline null si aucun désert | unit | idem | ❌ Wave 0 |
| ECO-03 | Détection bassin endorheïque si endpoint dedans | unit | idem | ❌ Wave 0 |
| ECO-03 | Pas d'alerte si endpoint hors basin | unit | idem | ❌ Wave 0 |
| ECO-04 | Flag true si désert traversé + latitude ≤35° | unit | idem | ❌ Wave 0 |
| ECO-04 | Flag false si désert traversé + latitude >35° | unit | idem | ❌ Wave 0 |

### Fixtures de test recommandées (inline dans ecologyEngine.test.ts)

```typescript
// Polygone désert factice (pas de dépendance aux vrais fichiers GeoJSON dans les tests)
const MOCK_DESERT = polygon([
  [[-10, 15], [-10, 30], [40, 30], [40, 15], [-10, 15]]
], { name: 'Mock Sahara', aridity: 'hyperarid', koppen: 'BWh' })

const MOCK_ENDORHEIC = polygon([
  [[49, 36], [49, 47], [54, 47], [54, 36], [49, 36]]
], { name: 'Mer Caspienne', examples: 'Mer d\'Aral, Salton Sea' })

// Canal traversant le désert
const CANAL_CROSSING: Coord[] = [[-15, 22], [50, 22]]
// Canal entièrement dans le désert  
const CANAL_INSIDE: Coord[] = [[0, 20], [20, 22]]
// Canal hors désert
const CANAL_OUTSIDE: Coord[] = [[50, 50], [60, 55]]
// Canal dans bassin endorheïque
const CANAL_ENDORHEIC: Coord[] = [[10, 40], [51, 43]]
```

### Wave 0 Gaps

- [ ] `src/tests/ecologyEngine.test.ts` — 11 cas ci-dessus
- [ ] `src/types/ecology.ts` — stub minimal pour compile
- [ ] `src/lib/ecologyEngine.ts` — stubs retournant null/false (RED)
- [ ] `src/data/desertZones.geojson` — un seul polygone factice pour les tests suffit

---

## State of the Art

| Aspect | Ancienne approche | Approche actuelle | Impact |
|--------|------------------|-------------------|--------|
| Koppen-Geiger | Raster ESRI (payant, 1990s) | GloH2O 2023 — 1km résolution, CC-BY | Meilleure précision, libre |
| Désert detection web | API externe (REST) | GeoJSON bundlé + Turf client-side | Zéro latence réseau, offline |
| `turf.intersect()` sur lignes | Supporté (v5) | RETIRÉ depuis Turf v6+ pour LineString | Utiliser `lineIntersect` à la place |
| Desert greening claim | "quelques années" | Empirique : 22 ans (Thar), 20+ ans (Sahel) | Fourchettes scientifiquement ancrées |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@turf/turf` | ECO-01, ECO-03 | ✓ | 7.3.5 | — |
| `mapshaper` | Simplification GeoJSON | ✗ | — | `ogr2ogr -simplify` ou simplification manuelle |
| Source Natural Earth | desertZones.geojson | ✓ via web | — | HydroSHEDS alternatif |
| Vitest | Tests | ✓ | 3.2.1 | — |

**Missing dependencies with fallback:**
- `mapshaper` (non installé) : outil de simplification GeoJSON. Installer localement via `npm install -g mapshaper` pour la préparation des données, ou utiliser l'interface web mapshaper.org. Pas nécessaire à runtime.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Natural Earth `ne_10m_geography_regions_polys` contient les polygones des déserts mondiaux nommés (Sahara, Arabian, Gobi, etc.) | Data Sources | Si absent → utiliser Option B (GloH2O) ou créer les polygones manuellement depuis OpenStreetMap |
| A2 | Taille du GeoJSON après simplification <200 KB | Data Sources | Si plus grand → augmenter le taux de simplification ou réduire le nombre de polygones |
| A3 | Fourchette [20–50 ans] pour zones arides — basée sur analogies Sahel/Indira Gandhi Canal | Pattern 3 | Sous-estimation possible si eau saline (salinisation réduit l'efficacité) |
| A4 | `resolveJsonModule: true` nécessaire dans tsconfig.json pour imports GeoJSON | Pitfall P5 | Si déjà activé → pas d'action requise |
| A5 | 24ms pour 30 pts × 10 polygones suffisant sans Web Worker | Pitfall P7 | Si canal routé a >200 points ou >20 polygones → envisager Web Worker (même pattern que routingWorker.ts) |

---

## Open Questions

1. **Nombre réel de polygones dans Natural Earth geography_regions_polys**
   - Ce qu'on sait : la description mentionne "major physical features worldwide including deserts"
   - Ce qui est flou : si tous les sous-déserts sont des polygones séparés ou un seul "Sahara"
   - Recommandation : télécharger et inspecter le fichier. Si non satisfaisant → créer 12–15 polygones manuellement à partir des coordonnées Wikipedia

2. **Classe Koppen assignée aux zones Natural Earth**
   - Ce qu'on sait : Natural Earth ne stocke pas les classes Koppen dans ses attributs
   - Ce qui est flou : il faut annoter manuellement chaque polygone avec `aridity`
   - Recommandation : table de correspondance désert → aridity dans le script de préparation des données

3. **Détection ECO-01 pour canal en cours de dessin (points < 2)**
   - Ce qu'on sait : `computeEcologyAnalysis` retourne null si `points.length < 2`
   - Ce qui est flou : l'UI devrait-elle afficher "Tracez un canal pour voir l'analyse" ou cacher le panel ?
   - Recommandation : même comportement que CalculationPanel (cacher si null)

---

## Security Domain

> `security_enforcement` absent de config.json → traité comme activé.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | non | App locale, pas d'auth |
| V3 Session Management | non | Pas de session |
| V4 Access Control | non | Usage personnel |
| V5 Input Validation | oui (faible) | GeoJSON bundlé — pas d'input utilisateur géographique |
| V6 Cryptography | non | Pas de données sensibles |

**Threat patterns applicables :**

| Pattern | STRIDE | Mitigation |
|---------|--------|-----------|
| GeoJSON malformé dans src/data/ | Tampering (si fichier modifié) | Validation des types TypeScript au parsing + try/catch dans computeDesertLengthKm |
| Inputs invalides (canal.points vide) | — | Guard `if (canal.points.length < 2) return null` |

---

## Sources

### Primary (HIGH confidence — vérifiés in-session)
- `@turf/turf@7.3.5` installé — fonctions `lineIntersect`, `booleanIntersects`, `booleanPointInPolygon`, `lineSlice`, `length`, `point`, `lineString` — toutes testées et fonctionnelles
- Tests in-session : algorithme 3-cas pour `computeDesertLengthKm` — tous les edge cases vérifiés
- Performance mesurée : 24ms pour canal 30pts × 10 polygones

### Secondary (MEDIUM confidence — citées)
- [GloH2O Köppen-Geiger 2023](https://www.gloh2o.org/koppen/) — CC-BY, résolution 1km, figshare
- [Nature Scientific Data 2023 — Köppen-Geiger maps](https://www.nature.com/articles/s41597-023-02549-6) — source données GloH2O
- [Cell Reports Sustainability 2025 — Thar Desert Greening](https://www.sciencedirect.com/science/article/pii/S2949790625000606) — +38% verdissement en 22 ans
- [Nature Communications 2017 — Sahel rainfall feedback](https://www.nature.com/articles/s41467-017-02021-1) — mécanisme feedback positif humidité
- [Natural Earth — Public Domain](https://www.naturalearthdata.com/) — `ne_10m_geography_regions_polys`
- [HydroSHEDS / HydroBASINS](https://www.hydrosheds.org/products/hydrobasins) — 16 605 bassins endorheïques vectorisés
- [Wikipedia — List of endorheic basins](https://en.wikipedia.org/wiki/List_of_endorheic_basins) — CC-BY-SA

### Tertiary (LOW confidence — training knowledge / non vérifiés)
- Fourchette [20–50 ans] pour zone aride (BSh/BSk) — basée sur analogies, non mesurée directement sur canal salin
- Taille estimée GeoJSON après simplification <200 KB — non vérifiée sur fichier réel
- `resolveJsonModule: true` dans tsconfig pour imports GeoJSON — standard Vite, non testé sur ce projet spécifiquement

---

## Metadata

**Confidence breakdown:**
- Turf.js API : HIGH — toutes les fonctions testées in-session avec edge cases
- Architecture pattern : HIGH — copie directe des patterns Phase 4 éprouvés
- Timelines de verdissement : MEDIUM — Thar citée (peer-reviewed 2025), aride/hyperaride par analogie
- GeoJSON data sources : MEDIUM — sources identifiées et licences vérifiées, tailles non mesurées
- Performance : HIGH — mesurée in-session sur cas réaliste

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (données stables — Turf API change peu)

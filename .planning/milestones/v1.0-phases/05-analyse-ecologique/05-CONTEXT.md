# Phase 5: Analyse Écologique - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Cette phase ajoute l'analyse écologique des canaux tracés. Pour chaque canal sélectionné avec un profil d'élévation chargé, l'app calcule automatiquement : les zones désertiques traversées (superficie km²), la timeline de verdissement (fourchette d'années), détecte si le canal aboutit dans un bassin endorheïque (alerte salinisation), et signale le risque climatique si de l'eau est introduite dans une zone aride/chaude. Tout est 100% client-side — données géographiques bundlées en JSON dans src/data/.

</domain>

<decisions>
## Implementation Decisions

### D-01: Sources de données géographiques (ECO-01, ECO-03)
- Données désertiques : GeoJSON simplifié des zones Koppen-Geiger BWh/BWk/BSh/BSk bundlé dans `src/data/desertZones.geojson` — polygones des grands déserts (Sahara, Arabique, Gobi, Atacama, Australien, Namib, Kalahari, etc.) à <300KB total
- Bassins endorheïques : GeoJSON des ~40 principaux bassins mondiaux (Caspienne, Qattara, Aral, Mer Morte, Grand Lac Salé, bassin du Tarim, etc.) dans `src/data/endorheicBasins.geojson`
- Approche : Turf.js intersect/booleanIntersects/area pour calcul d'intersection, booleanPointInPolygon pour détection endorheïque
- Pas d'API externe — tout bundlé et local

### D-02: Calcul superficie désertique (ECO-01)
- Intersection canal (buffered 1km chaque côté) avec polygones désertiques via Turf.js
- Superficie = longueur_segment_désert × buffer_width (simplifié : pas de vraie aire d'influence, juste la zone le long du canal)
- Format : Interval km² (±10% incertitude sur le buffer réel) — UX-01 strict

### D-03: Timeline de verdissement (ECO-02)
- Basée sur la classe d'aridité du segment le plus aride traversé :
  - Hyperaride (BWh/BWk Koppen) → [50, 100] ans
  - Aride (BSh/BSk Koppen) → [20, 50] ans
  - Semi-aride (autres zones de désertification) → [5, 20] ans
- Si aucune zone désertique traversée → null (section non affichée)
- Format : Interval years — ex. "[20 – 50] ans"

### D-04: Détection bassin endorheïque (ECO-03)
- Vérifier si le point final du canal (dernier point de `canal.points`) tombe dans un polygone de `endorheicBasins.geojson`
- Si oui → alerte visible (icône rouge + texte explicite avec exemple historique pertinent)
- NOM du bassin inclus dans l'alerte si disponible dans les données

### D-05: Risque climatique (ECO-04)
- Condition : au moins un segment traverse une zone désertique ET la longitude du canal est dans une bande latitudinale ±35°
- Simple flag booléen → warning amber (pas de calcul numérique, information qualitative)
- Message : "Introduction d'eau dans une zone aride et chaude — risque de gradients de pression et phénomènes météorologiques"

### D-06: Architecture code
- Nouveau fichier pur : `src/lib/ecologyEngine.ts` — fonctions : `analyzeDesertIntersection`, `computeGreeningTimeline`, `detectEndorheicBasin`, `detectClimateRisk`, `computeEcologyAnalysis`
- Nouveau types : `src/types/ecology.ts` — interfaces : `DesertIntersection`, `EcologyResult`
- Nouvelles données : `src/data/desertZones.geojson`, `src/data/endorheicBasins.geojson`
- Nouveau hook : `src/hooks/useEcology.ts` — useMemo pattern (même que useCalculation)
- Nouveau composant : `src/components/EcologyPanel.tsx` — accordéon dans SidePanel après CalculationPanel
- UX-01 : superficies et timelines en Interval — alerts et flags booléens autorisés (pas de valeur numérique)

### Claude's Discretion
- Taille exacte / niveau de détail des GeoJSON bundlés — viser précision acceptable (<500KB total) sans sacrifier la perf
- Implémentation exacte de l'intersection Turf (booleanIntersects vs intersect) selon ce qui est le plus efficace
- Gestion des cas où les données GeoJSON sont manquantes ou corrompues (fallback silencieux)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CalculationPanel.tsx` — pattern accordéon exact à dupliquer pour `EcologyPanel.tsx`
- `useCalculation.ts` — pattern useMemo à copier pour `useEcology.ts`
- `calculationEngine.ts` — pattern module pur (pas React/Zustand/MapLibre)
- `useCanalStore` — étendre avec `ecologyResult?: EcologyResult` ou calculer à la volée depuis hook
- `@turf/turf` déjà installé — `booleanIntersects`, `intersect`, `booleanPointInPolygon`, `area`, `buffer`, `lineString`, `along`

### Established Patterns
- Module pur testable unitairement (calculationEngine.ts)
- Accordéon avec isOpen local + auto-open quand canal sélectionné
- SidePanel: ajouter <EcologyPanel /> après <CalculationPanel />
- UX-01 absolu : superficies = Interval, timelines = Interval, flags = booléen (exception autorisée)
- Dark theme Tailwind — mêmes classes que CalculationPanel

### Integration Points
- `canal.ts` Canal interface — `canal.points: Coord[]` (dernier point = endpoint pour ECO-03)
- `elevation.ts` ElevationProfile — si chargé → canal sélectionnable pour écologie
- `canalStore.ts` — pas d'extension nécessaire, tout calculé à la volée via hook
- `SidePanel.tsx` — ajouter <EcologyPanel /> en Section 6

</code_context>

<specifics>
## Specific Ideas

- Priorité : ECO-03 (endorheïque) est la plus critique scientifiquement — Aral Sea et Dead Sea comme exemples vivants
- Les GeoJSON peuvent être minifiés et les coordonnées arrondies à 4 décimales — précision suffisante pour l'analyse au km
- Si `@turf/turf` intersect n'existe pas (deprecated), utiliser `booleanIntersects` pour détecter et `lineIntersect` pour les points d'intersection
- La superficie "zone potentiellement verdissable" = longueur_désert_traversé × largeur_d'influence (ex. 50km de chaque côté) — pas de turf.area nécessaire, simple calcul L×W

</specifics>

<deferred>
## Deferred Ideas

- Analyse des bassins versants (watershed analysis) → v2
- Données de biodiversité (IUCN threatened species along route) → v2
- Calcul précis d'absorption / évapotranspiration → v2
- Visualisation des zones écologiques sur la carte (couche MapLibre) → bonus Phase 5 si temps permet

</deferred>

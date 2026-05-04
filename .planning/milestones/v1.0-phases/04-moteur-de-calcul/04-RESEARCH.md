# Phase 4: Moteur de Calcul - Research

**Researched:** 2026-05-01
**Domain:** Arithmétique d'intervalles, calculs scientifiques client-side, UI accordéon Zustand + React
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Paramètres de saisie**
- Formulaire largeur/profondeur dans SidePanel, accordéon "Calcul d'impact" sous ElevationPanel — cohérence avec le pattern existant
- Inputs numériques textuels avec unité affichée (m) — pas de sliders
- Valeurs par défaut : 50m × 5m (canal fluvial standard) — ordre de grandeur concret dès l'ouverture
- Paramètres globaux partagés entre tous les canaux — simplifie l'UI, compare des canaux à dimensions égales

**Affichage des résultats**
- Panel accordéon "Calcul d'impact" dans SidePanel — même pattern qu'ElevationPanel
- Format des intervalles : texte structuré `[X – Y] km³` avec label clair
- Indicateur % IPCC : barre de progression fine + texte "N–M% du rythme annuel (4,5 mm/an)"
- Ordre d'affichage : Volume → ΔSL → % IPCC → Coût — du plus physique au plus appliqué

**Classification terrain & coût**
- Automatique depuis les données d'élévation : variance altimétrique par segment → plaine/mixte/montagne
- Seuils : Δalt < 50m/km → plaine (1–5 M€/km) · 50–200m/km → mixte (10–50 M€/km) · >200m/km → montagne (100–500 M€/km)
- Afficher la décomposition "%km plaine / %km mixte / %km montagne" — éducatif et transparent
- Propagation min/max par segment typé → fourchette totale stricte — respecte UX-01

**Impact partiel (CALC-05)**
- Déclenchement automatique si canal a des segments rouges — section conditionnelle dans le panel
- Longueur réalisable = jusqu'au premier segment rouge continu (> seuil 10%) — simple et conservateur
- Affichage : sous-section "Si arrêté au km X : ΔSL partiel = [Y–Z] mm"
- Marker visuel sur la carte au point d'arrêt estimé (MapLibre marker ou ligne pointillée)

### Claude's Discretion
- Format exact des nombres grands (ex: 1 234 567 M€ vs 1,2 B€) — choisir le plus lisible
- Gestion cas limite : canal sans élévation chargée (pas encore de profil), canal trop court (<1km), largeur/profondeur à 0
- Micro-animations (si panel calc ouvert) ou transition statique

### Deferred Ideas (OUT OF SCOPE)
- Paramètres par canal individuel (override des dims globales) → v2
- Export PDF du rapport de calcul → v2 requirements
- Comparaison côte-à-côte de deux canaux → v2
- Calculs hydrologiques de précision (évaporation, absorption nappes) → v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CALC-01 | Saisie largeur/profondeur → volume total (km³) calculé automatiquement | `length()` de Turf.js (vérifié v7.3.5), formule V = L×W×D, arithmétique d'intervalles documentée |
| CALC-02 | ΔSL (mm) = Volume (km³) / 361,8 | Formule non-négociable vérifiée dans codebase + PITFALLS.md. 361,8 = surface océan (million km²) |
| CALC-03 | Coût estimé (€) en fourchette selon type de terrain | Classification terrain par pente m/km depuis `ElevationProfile.points` — seuils confirmés dans CONTEXT.md |
| CALC-04 | Comparaison ΔSL vs rythme annuel IPCC (4,5 mm/an = 100%) | Division d'intervalle simple. Barre de progression `<div>` Tailwind, pas de lib externe nécessaire |
| CALC-05 | Impact partiel si obstacle — longueur réelle + ΔSL partiel | `uphillSegments[0].distanceStart` = longueur réalisable. MapLibre Marker confirmé (v5.24.0) |
| UX-01 | Toutes valeurs numériques en intervalles [min, max] — jamais ponctuelles | Arithmétique d'intervalles propagée dans `calculationEngine.ts` pur TS — pattern documenté |
</phase_requirements>

---

## Summary

La phase 4 est essentiellement une phase de **logique pure + UI**. Aucune API externe n'est nécessaire : toutes les données sont déjà dans le store Zustand (profil d'élévation, points du canal). L'élément central est `calculationEngine.ts`, un module TypeScript pur sans dépendances React, qui transforme `(ElevationProfile, width, depth)` en `CalculationResult` avec intervalles [min, max] pour chaque métrique.

Le codebase est bien préparé : Turf.js est installé et utilisé pour `length()` et `along()`, le pattern accordéon est établi dans `ElevationPanel.tsx`, Zustand suit un pattern d'actions atomiques, et MapLibre Marker est déjà utilisé dans `MapView.tsx` pour le routing. La Phase 4 est une **extension du pattern existant**, pas une refonte.

La contrainte UX-01 (intervalles obligatoires) est techniquement simple à implémenter via une arithmétique d'intervalles explicite : chaque dimension a un facteur d'incertitude, et les calculs propagent [min, max] de bout en bout. La référence Qattara (1 000 km³ → 2,76 mm) doit rester visible comme ancre d'ordre de grandeur.

**Primary recommendation:** Implémenter `calculationEngine.ts` (logique pure) → `useCalculation.ts` (hook orchestrateur) → `CalculationPanel.tsx` (UI accordéon) → extension `MapView.tsx` (marker point d'arrêt), dans cet ordre.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Calcul volume + ΔSL + coût | Module TS pur (`calculationEngine.ts`) | — | Logique pure sans React, testable unitairement |
| État `calcParams` (width, depth) | Store Zustand (`canalStore.ts`) | — | Partagé entre tous les canaux, pattern établi |
| Orchestration calcul réactif | Hook React (`useCalculation.ts`) | — | Lit store + profile, déclenche calcul, memoize |
| Affichage résultats | Composant React (`CalculationPanel.tsx`) | — | Accordéon, même pattern qu'ElevationPanel |
| Marker point d'arrêt | Browser (`MapView.tsx` Marker ref) | — | Objet non-sérialisable — JAMAIS dans Zustand |
| Classification terrain | Module TS pur (`calculationEngine.ts`) | — | Dérivé de `ElevationProfile.points` (déjà disponible) |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @turf/turf | 7.3.5 (installé) | `length()` pour longueur géodésique du canal | Déjà utilisé en Phase 2 pour sampling et profil |
| zustand | 5.0.12 (installé) | Extension store avec `calcParams` | Pattern établi Phases 1–3 |
| maplibre-gl | 5.24.0 (installé) | `Marker` pour point d'arrêt partiel | Déjà utilisé en Phase 3 pour routing markers |
| recharts | 3.8.1 (installé) | Barre de progression % IPCC (si nécessaire) | Déjà installé — mais `<div>` Tailwind suffisant |
| vitest | 3.2.1 (installé) | Tests unitaires `calculationEngine.ts` | Framework existant, 43 tests passent |

[VERIFIED: package.json du projet + `npm test` 43/43 green]

**Aucune nouvelle dépendance à installer pour cette phase.**

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.14.0 (installé) | Icônes panel (ChevronDown, AlertCircle) | Pattern établi dans ElevationPanel |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `turf.length()` | Haversine maison | Turf déjà installé, géodésique correct, convention [lng,lat] déjà documentée |
| `<div>` Tailwind pour barre % | Recharts ProgressBar | Simpler, même dark theme, pas de dépendance supplémentaire |
| Marker MapLibre | GeoJSON source circle | Marker plus simple pour un point ponctuel, pattern déjà utilisé Phase 3 |

**Installation:** Aucune — toutes les dépendances sont déjà présentes.

---

## Architecture Patterns

### System Architecture Diagram

```
ElevationProfile (Zustand store)          calcParams: {width, depth} (Zustand store)
         |                                              |
         v                                              v
    calculationEngine.ts (pure TS)  <------------------+
    ┌──────────────────────────────────────────────────────────────┐
    │  1. computeLength(canal.points) → [lenMin, lenMax] km        │
    │     via turf.length() ± 1% tolérance DEM                    │
    │                                                              │
    │  2. classifyTerrain(profile.points) → TerrainBreakdown       │
    │     pente m/km par segment → {plain%, mixed%, mountain%}     │
    │                                                              │
    │  3. computeVolume(lenInterval, width, depth) → [min, max]    │
    │     V = L×W×D, propagation stricte d'intervalles             │
    │                                                              │
    │  4. computeDeltaSL(volumeInterval) → [min, max] mm           │
    │     ΔSL = V / 361.8                                          │
    │                                                              │
    │  5. computeCost(lenKm, terrainBreakdown) → [min, max] M€     │
    │     par segment typé, sommation intervalles                  │
    │                                                              │
    │  6. computePartialImpact(uphillSegments, ...) → PartialResult│
    │     reachableKm = uphillSegments[0].distanceStart            │
    └──────────────────────────────────────────────────────────────┘
         |                   |
         v                   v
   CalculationResult    PartialResult
         |                   |
         v                   v
   useCalculation.ts (hook React)
   [lit store, mémoïse, retourne result]
         |
         v
   CalculationPanel.tsx         MapView.tsx
   [accordéon SidePanel]  →→  [stopMarkerRef: Marker]
   Volume / ΔSL / %IPCC / Coût   [marker au km X partiel]
```

### Recommended Project Structure
```
src/
├── lib/
│   └── calculationEngine.ts    # Logique pure — nouveau Phase 4
├── hooks/
│   └── useCalculation.ts       # Hook orchestrateur — nouveau Phase 4
├── components/
│   └── CalculationPanel.tsx    # UI accordéon — nouveau Phase 4
├── types/
│   └── calculation.ts          # Types CalculationResult, etc. — nouveau Phase 4
├── store/
│   └── canalStore.ts           # Extension: calcParams + setCalcParams
└── tests/
    └── calculationEngine.test.ts  # Tests Wave 0
```

### Pattern 1: Arithmétique d'Intervalles

**What:** Toutes les valeurs numériques sont des paires [min, max]. Les opérations propagent les bornes de façon conservative (toujours élargir l'intervalle, jamais réduire).

**When to use:** Pour chaque calcul de Phase 4 sans exception (UX-01 absolu).

**Example:**
```typescript
// Source: CONTEXT.md + vérification locale
type Interval = [number, number]  // [min, max]

// Multiplication d'intervalles (tous positifs ici)
function mulIntervals(a: Interval, b: Interval): Interval {
  const [aMin, aMax] = a
  const [bMin, bMax] = b
  return [aMin * bMin, aMax * bMax]
}

// Division par constante
function divByConst(a: Interval, k: number): Interval {
  return [a[0] / k, a[1] / k]
}

// Addition d'intervalles
function addIntervals(a: Interval, b: Interval): Interval {
  return [a[0] + b[0], a[1] + b[1]]
}

// Volume = Longueur × Largeur × Profondeur (en m³, puis /1e9 pour km³)
function computeVolume(
  lengthKm: Interval,
  widthM: Interval,  // [min, max] en m
  depthM: Interval,  // [min, max] en m
): Interval {
  const lengthM: Interval = [lengthKm[0] * 1000, lengthKm[1] * 1000]
  const volM3 = mulIntervals(mulIntervals(lengthM, widthM), depthM)
  return [volM3[0] / 1e9, volM3[1] / 1e9]  // km³
}

// ΔSL — non-négociable
function computeDeltaSL(volumeKm3: Interval): Interval {
  return divByConst(volumeKm3, 361.8)
}
```

### Pattern 2: Longueur géodésique avec Turf.js

**What:** Calcul de la longueur du canal en km via `turf.length()` — utilise la géodésie sphérique (haversine) donc correct à toute latitude.

**When to use:** Pour obtenir la longueur totale ET la longueur partielle (au point d'arrêt).

**Example:**
```typescript
// Source: elevationApi.ts existant (samplePoints) + vérification locale
import { length, lineString } from '@turf/turf'
import type { Coord } from '../types/canal'

// Longueur totale avec incertitude ±1% (DEM sampling n'est pas parfait)
function computeLengthInterval(points: Coord[]): Interval {
  if (points.length < 2) return [0, 0]
  const line = lineString(points)
  const km = length(line, { units: 'kilometers' })
  return [km * 0.99, km * 1.01]  // ±1% incertitude de tracé
}

// Longueur partielle jusqu'au premier obstacle
function computePartialLength(points: Coord[], reachableKm: number): Interval {
  const exact = reachableKm
  return [exact * 0.98, exact * 1.02]  // ±2% (interpolation de segment)
}
```

### Pattern 3: Classification terrain depuis ElevationProfile.points

**What:** Calcul de la pente m/km pour chaque intervalle entre points consécutifs du profil. Classification selon seuils CONTEXT.md.

**When to use:** Pour CALC-03 — décomposition terrain + calcul coût par type.

**Example:**
```typescript
// Source: CONTEXT.md décisions locked
const TERRAIN_THRESHOLDS = {
  plain:    50,  // m/km — en-dessous = plaine
  mixed:   200,  // m/km — en-dessous = mixte, au-dessus = montagne
} as const

const COST_PER_KM: Record<TerrainType, Interval> = {
  plain:    [1,   5],    // M€/km
  mixed:    [10,  50],   // M€/km
  mountain: [100, 500],  // M€/km
}

type TerrainType = 'plain' | 'mixed' | 'mountain'

interface TerrainBreakdown {
  plain: number     // km
  mixed: number     // km
  mountain: number  // km
  totalKm: number
}

function classifyTerrain(points: ElevationPoint[]): TerrainBreakdown {
  const breakdown: TerrainBreakdown = { plain: 0, mixed: 0, mountain: 0, totalKm: 0 }

  for (let i = 1; i < points.length; i++) {
    const dDist = points[i].distance - points[i - 1].distance
    const dAlt  = Math.abs(points[i].altitude - points[i - 1].altitude)
    const slopeMperKm = dDist > 0 ? dAlt / dDist : 0

    const type: TerrainType =
      slopeMperKm < TERRAIN_THRESHOLDS.plain ? 'plain' :
      slopeMperKm < TERRAIN_THRESHOLDS.mixed ? 'mixed' :
      'mountain'

    breakdown[type]  += dDist
    breakdown.totalKm += dDist
  }
  return breakdown
}

// Coût total = somme des coûts par type de terrain
function computeCost(breakdown: TerrainBreakdown): Interval {
  const costInterval: Interval = [0, 0]
  for (const type of ['plain', 'mixed', 'mountain'] as TerrainType[]) {
    const segKm = breakdown[type]
    costInterval[0] += segKm * COST_PER_KM[type][0]
    costInterval[1] += segKm * COST_PER_KM[type][1]
  }
  return costInterval  // M€
}
```

### Pattern 4: Impact partiel (CALC-05)

**What:** Si `uphillSegments.length > 0`, le canal est physiquement stoppé au premier segment. La longueur réalisable = `uphillSegments[0].distanceStart` km.

**When to use:** Conditionnel dans `calculationEngine.ts` — uniquement si `!profile.isFullyGravity`.

**Example:**
```typescript
// Source: elevation.ts types + vérification logique locale
interface PartialImpactResult {
  reachableKm: number           // km jusqu'au premier obstacle
  stopCoord: Coord              // [lng, lat] du point d'arrêt — via along() Turf
  volume: Interval              // km³ du canal partiel
  deltaSL: Interval             // mm
  percentOfFull: number         // % du canal complet réalisé
}

function computePartialImpact(
  canal: Canal,
  profile: ElevationProfile,
  width: number,
  depth: number,
): PartialImpactResult | null {
  if (profile.isFullyGravity || profile.uphillSegments.length === 0) return null

  const reachableKm = profile.uphillSegments[0].distanceStart
  const line = lineString(canal.points)
  const stopPoint = along(line, reachableKm, { units: 'kilometers' })
  const stopCoord = stopPoint.geometry.coordinates as Coord

  const lenInterval: Interval = [reachableKm * 0.98, reachableKm * 1.02]
  const widthInterval: Interval = [width * 0.95, width * 1.05]
  const depthInterval: Interval = [depth * 0.90, depth * 1.10]
  const volume = computeVolume(lenInterval, widthInterval, depthInterval)
  const deltaSL = computeDeltaSL(volume)
  const totalKm = length(line, { units: 'kilometers' })

  return {
    reachableKm,
    stopCoord,
    volume,
    deltaSL,
    percentOfFull: totalKm > 0 ? (reachableKm / totalKm) * 100 : 0,
  }
}
```

### Pattern 5: Marker MapLibre pour point d'arrêt

**What:** Marker non-sérialisable stocké dans un `useRef` dans `MapView.tsx`. Jamais dans Zustand.

**When to use:** Affichage du point d'arrêt partiel sur la carte (CALC-05).

**Example:**
```typescript
// Source: MapView.tsx Phase 3 — pattern routing markers (lignes 199–293)
// Dans MapView.tsx — ajouter après les refs routing existants :
const stopMarkerRef = useRef<maplibregl.Marker | null>(null)

// Dans le useEffect de synchronisation (réagit à selectedCanalId) :
useEffect(() => {
  stopMarkerRef.current?.remove()
  stopMarkerRef.current = null

  if (!selectedCanal?.elevation || selectedCanal.elevation.isFullyGravity) return
  if (partialResult === null) return

  const [lng, lat] = partialResult.stopCoord
  stopMarkerRef.current = new maplibregl.Marker({
    color: '#F59E0B',  // amber — distingué de start(vert) et end(rouge)
    scale: 0.8,
  })
    .setLngLat([lng, lat])
    .addTo(map)

  return () => {
    stopMarkerRef.current?.remove()
    stopMarkerRef.current = null
  }
}, [selectedCanalId, partialResult])
```

### Pattern 6: Extension Zustand avec calcParams

**What:** Ajout de `calcParams` au store existant — même pattern que les actions atomiques existantes.

**When to use:** État global partagé entre tous les canaux (décision locked).

**Example:**
```typescript
// Source: canalStore.ts pattern existant
interface CalcParams {
  width: number   // m — défaut 50
  depth: number   // m — défaut 5
}

// Dans CanalStore interface — ajouter :
calcParams: CalcParams
setCalcParams: (params: Partial<CalcParams>) => void

// Dans create() — ajouter :
calcParams: { width: 50, depth: 5 },
setCalcParams: (params) => set((state) => ({
  calcParams: { ...state.calcParams, ...params }
})),
```

### Pattern 7: Incertitude dimensions (largeur/profondeur)

**What:** Pour respecter UX-01, les dimensions saisies ont une incertitude implicite (tolérance d'ingénierie).

**Rationale:** Une saisie "50m" en réalité = canal construit à ±5% sur la largeur et ±10% sur la profondeur (tolérances géotechniques standard).

**Intervalles recommandés:**
```typescript
// [ASSUMED] — tolérances d'ingénierie canal standard
const widthInterval: Interval = [width * 0.95, width * 1.05]   // ±5%
const depthInterval: Interval  = [depth * 0.90, depth * 1.10]  // ±10%
const lengthInterval: Interval = [km * 0.99, km * 1.01]        // ±1% (turf geodesic)
```

### Anti-Patterns to Avoid

- **Valeur ponctuelle jamais :** `const volume = length * width * depth` — INTERDIT. Toujours retourner `[min, max]`.
- **Zustand pour Marker MapLibre :** Les objets Marker ne sont pas sérialisables JSON — stocker uniquement dans `useRef` de MapView.
- **Re-calculer à chaque rendu :** Le calcul doit être mémoïsé dans `useCalculation.ts` via `useMemo` pour éviter de recalculer à chaque input keydown.
- **Afficher "0" quand pas d'élévation :** Si `canal.elevation` est absent (profil pas encore chargé), le panel doit afficher un état vide/invitation, pas des zéros qui seraient faux.
- **Utiliser `turf.distance()` au lieu de `turf.length()` :** `distance()` calcule la distance entre deux points, pas la longueur d'une polyline multi-segments.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Longueur géodésique polyline | Haversine maison en boucle | `turf.length(lineString(points), {units: 'kilometers'})` | Turf déjà installé, géodésique correct globalement |
| Point au km X sur la ligne | Interpolation manuelle | `turf.along(line, km, {units: 'kilometers'})` | Déjà utilisé dans MapView.tsx Phase 2/3 |
| Formatter les grands nombres | Formatage custom | `Intl.NumberFormat('fr-FR')` | Natif, gère séparateurs de milliers, pas de lib |

**Key insight:** L'arithmétique d'intervalles est simple (4 opérations de base) — elle n'a pas besoin de bibliothèque. Une lib externe comme `interval-arithmetic` est over-engineering pour ce use case.

---

## Common Pitfalls

### Pitfall 1: Oublier UX-01 sur la longueur elle-même

**What goes wrong:** La longueur du canal est calculée comme valeur unique et utilisée dans tous les calculs, produisant un volume exact au lieu d'un intervalle.

**Why it happens:** `turf.length()` retourne un `number`, pas un intervalle. On oublie d'envelopper.

**How to avoid:** `computeLengthInterval()` retourne immédiatement `[km * 0.99, km * 1.01]`. Aucune fonction du moteur n'accepte un `number` nu — toujours `Interval`.

**Warning signs:** Type TypeScript `number` dans la signature de `computeVolume`.

---

### Pitfall 2: Zustand re-render boucle sur calcul lourd

**What goes wrong:** `useCalculation()` appelle `useCanalStore(s => s.calcParams)` + `useCanalStore(s => s.canals)` — chaque keydown dans l'input déclenche un recalcul + re-render.

**Why it happens:** Inputs contrôlés + calcul synchrone sans mémoïsation.

**How to avoid:** Utiliser `useMemo` dans `useCalculation.ts` avec dépendances stables `[calcParams, selectedCanal?.elevation]`.

**Warning signs:** Lag visible lors de la saisie dans les inputs largeur/profondeur.

---

### Pitfall 3: Marker MapLibre non nettoyé

**What goes wrong:** Le marker point d'arrêt reste sur la carte après sélection d'un autre canal ou suppression du canal.

**Why it happens:** Oubli du cleanup dans le `return` du useEffect.

**How to avoid:** Le pattern Phase 3 (`startMarkerRef.current?.remove()`) est à répliquer exactement — voir MapView.tsx lignes 277–293. Cleanup dans le return du useEffect ET lors du unmount.

**Warning signs:** Marker amber restant sur la carte après changement de sélection.

---

### Pitfall 4: Classification terrain sur le canal partiel vs total

**What goes wrong:** Pour CALC-05, le coût affiché utilise la classification terrain du canal total (100km), alors que seuls les premiers X km sont réalisables.

**Why it happens:** `computeCost(terrainBreakdown)` est appelé sans prendre en compte la limite partielle.

**How to avoid:** Pour le calcul partiel, clipper les `ElevationProfile.points` à `reachableKm` avant de passer à `classifyTerrain()`.

**Warning signs:** Coût partiel supérieur au coût total.

---

### Pitfall 5: Division par zero si largeur ou profondeur = 0

**What goes wrong:** Si l'utilisateur efface le champ (valeur = 0 ou NaN), le volume = 0 mais les intervalles sont [0, 0] — affichage trompeur.

**Why it happens:** Pas de validation des inputs.

**How to avoid:** Guard dans `useCalculation.ts` : si `width <= 0 || depth <= 0`, retourner `null` et afficher message "Saisissez des dimensions valides".

---

### Pitfall 6: Afficher le coût en M€ quand il vaut des milliards

**What goes wrong:** "10 000 – 50 000 M€" pour un canal de montagne de 100km. Illisible.

**Why it happens:** Pas de seuil de changement d'unité.

**How to avoid:** Seuil à 1 000 M€ → basculer en "Md€" (milliards). Utiliser `Intl.NumberFormat('fr-FR')` pour les séparateurs.

```typescript
// [VERIFIED: vérification locale]
function formatCost(minMEur: number, maxMEur: number): string {
  if (maxMEur >= 1000) {
    return `${(minMEur / 1000).toFixed(1)} – ${(maxMEur / 1000).toFixed(1)} Md€`
  }
  return `${minMEur.toFixed(0)} – ${maxMEur.toFixed(0)} M€`
}
```

---

## Code Examples

Verified patterns from official sources:

### Calcul longueur réel depuis le codebase existant
```typescript
// Source: src/services/elevationApi.ts ligne 12-23 (Phase 2, pattern identique)
import { length, lineString } from '@turf/turf'
import type { Coord } from '../types/canal'

// Convention WGS84 [lng, lat] — JAMAIS [lat, lng]
const line = lineString(points)  // points: Coord[] = [lng, lat][]
const totalKm = length(line, { units: 'kilometers' })
```

### Récupération du point d'arrêt partiel
```typescript
// Source: src/components/MapView.tsx lignes 176-189 (along() déjà utilisé)
import { along, lineString } from '@turf/turf'

const line = lineString(canal.points)
const stopPoint = along(line, reachableKm, { units: 'kilometers' })
const [lng, lat] = stopPoint.geometry.coordinates  // Coord [lng, lat]
```

### Marker MapLibre (pattern Phase 3)
```typescript
// Source: src/components/MapView.tsx lignes 258-264
const stopMarker = new maplibregl.Marker({ color: '#F59E0B', scale: 0.8 })
  .setLngLat([lng, lat])
  .addTo(map)
// Cleanup obligatoire :
stopMarker.remove()
```

### Reset Zustand store dans tests Vitest
```typescript
// Source: src/store/canalStore.test.ts lignes 6-17 (pattern établi)
beforeEach(() => {
  useCanalStore.setState({
    // ... état initial
    calcParams: { width: 50, depth: 5 },  // ajouter dans beforeEach
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `turf.lineDistance()` | `turf.length()` | Turf.js v6+ | `lineDistance` est déprécié — utiliser `length()` |
| `turf.along()` avec `options.units` optionnel | `turf.along(line, km, { units: 'kilometers' })` explicite | — | Toujours préciser les unités pour éviter défaut en miles |

[VERIFIED: vérification locale sur @turf/turf v7.3.5]

**Deprecated/outdated:**
- `turf.lineDistance()` : remplacé par `turf.length()` depuis Turf v6 — ne pas utiliser.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tolérances d'ingénierie : ±5% largeur, ±10% profondeur, ±1% longueur | Pattern 7 | Si trop larges → fourchettes peu informatives ; si trop étroites → UX-01 compromise. Ajustable sans refonte. |
| A2 | Seuil basculement unité coût : 1 000 M€ → Md€ | Pitfall 6 | Cosmétique seulement |
| A3 | Couleur amber (#F59E0B) pour marker point d'arrêt | Pattern 5 | Cosmétique — distingué de vert/rouge existants |

**Note:** La formule ΔSL = V/361,8, les seuils terrain et les fourchettes de coût sont des décisions locked (CONTEXT.md) — non assumés.

---

## Open Questions

1. **Aucune question bloquante identifiée**
   - What we know: Toutes les données nécessaires sont disponibles dans le store (profil d'élévation, points canal). Toutes les dépendances sont installées. Le pattern accordéon est clair.
   - What's unclear: Rien de bloquant.
   - Recommendation: Procéder au planning directement.

---

## Environment Availability

Step 2.6: SKIPPED — phase 4 est 100% client-side, calculs purs JavaScript. Aucune dépendance externe nouvelle. Toutes les dépendances sont dans `node_modules` et vérifiées via `npm test` (43/43 green).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vite.config.ts` (section `test: { environment: 'jsdom', globals: true }`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CALC-01 | `computeVolume([100,101], [47.5,52.5], [4.5,5.5])` → interval km³ correct | unit | `npm test -- --reporter=verbose` | ❌ Wave 0 |
| CALC-02 | `computeDeltaSL([0.016, 0.036])` → `[0.0000442, 0.0000995]` mm | unit | `npm test` | ❌ Wave 0 |
| CALC-03 | `classifyTerrain(mockProfile)` → breakdown %plaine/%mixte/%montagne correct | unit | `npm test` | ❌ Wave 0 |
| CALC-03 | `computeCost(breakdown)` → interval M€ non-négatif, max >= min | unit | `npm test` | ❌ Wave 0 |
| CALC-04 | `computeIPCCPercent([0.001, 0.002], 4.5)` → interval [0.02, 0.04]% | unit | `npm test` | ❌ Wave 0 |
| CALC-05 | `computePartialImpact(canal, profile, 50, 5)` → `null` si isFullyGravity | unit | `npm test` | ❌ Wave 0 |
| CALC-05 | `computePartialImpact(canal, profile, 50, 5)` → stopCoord = along(line, uphillSegments[0].distanceStart) | unit | `npm test` | ❌ Wave 0 |
| UX-01 | Aucune fonction du moteur ne retourne `number` nu — toujours `Interval` | type check | `tsc --noEmit` | ❌ Wave 0 |

### Sampling Rate
- **Par commit de tâche :** `npm test`
- **Par merge de wave :** `npm test` (suite complète)
- **Phase gate :** Suite verte avant `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/tests/calculationEngine.test.ts` — couvre CALC-01, CALC-02, CALC-03, CALC-04, CALC-05
- [ ] `src/types/calculation.ts` — types `Interval`, `CalculationResult`, `TerrainBreakdown`, `PartialImpactResult`
- [ ] `src/lib/calculationEngine.ts` — module pur (stub Wave 0, implémenté Wave 1)

---

## Security Domain

Phase 100% client-side, calculs purs JavaScript, pas de network calls. Aucune surface d'attaque nouvelle. ASVS non applicable.

---

## Sources

### Primary (HIGH confidence)
- Codebase `src/` — pattern accordéon, Zustand actions, MapLibre Marker, Turf.js usage — vérifiés par lecture directe
- `package.json` — versions exactes de toutes les dépendances
- `src/services/elevationApi.ts` — fonctions `length()`, `along()`, `lineString()` de Turf déjà utilisées
- `src/components/MapView.tsx` — pattern Marker avec `useRef` et cleanup
- `.planning/phases/04-moteur-de-calcul/04-CONTEXT.md` — décisions locked sur seuils, coûts, défauts

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — références ordres de grandeur (Qattara 2,76mm, IPCC 4,5mm/an, formule 361,8)
- Vérification `npm view @turf/turf version` → 7.3.5 confirmé
- Vérification locale arithmétique d'intervalles (node -e) → résultats cohérents avec formule

### Tertiary (LOW confidence)
- Tolérances d'ingénierie ±5%/±10% — [ASSUMED] basé sur pratique courante, non vérifiées contre norme EN spécifique

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — toutes dépendances vérifiées dans package.json + npm test 43/43
- Architecture: HIGH — patterns directement extraits du codebase existant (Phase 2/3)
- Calculs: HIGH — formules vérifiées localement (node -e), cohérents avec PITFALLS.md
- Pitfalls: HIGH — issus de l'analyse du code existant et des patterns à risque identifiés

**Research date:** 2026-05-01
**Valid until:** 2026-07-01 (stack stable, aucune API externe nouvelle)

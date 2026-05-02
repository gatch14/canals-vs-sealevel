# Phase 10: Impact Météorologique - Research

**Researched:** 2026-05-02
**Domain:** Moteur de calcul météorologique pur (TypeScript) + extension EcologyPanel
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Architecture du moteur météo**
- Module `meteorologyEngine.ts` dans `src/lib/` — cohérent avec `ecologyEngine`, `desalinationEngine`
- Types dans `src/types/meteorology.ts` — même pattern que `ecology.ts`, `desalination.ts`
- Hook React `useMeteorology.ts` dans `src/hooks/` — copie du pattern `useDesalination.ts`
- Calcul météo automatique dès qu'un canal est sélectionné — pas de toggle utilisateur

**Modélisation des effets climatiques**
- Évaporation annuelle : Surface eau (largeur × longueur km²) × taux d'évaporation par zone climatique [0.5–2.0 m/an] → intervalle km³/an
- Rayon d'influence : heuristique 50–150 km autour du canal selon longueur et zone aride/humide — intervalle [min, max] km
- Précipitations induites : 20–40% de l'évaporation retombe en précipitations selon aridité — intervalle mm/an
- Refroidissement local : ΔT = −0.5 à −2.0°C selon surface eau et aridité locale — intervalle °C

**Indice de risque météorologique**
- Faible = zone humide OU canal < 500 km ; Modéré = zone semi-aride OU 500–1500 km ; Élevé = zone désertique ET > 1500 km
- Badge coloré (vert/orange/rouge) cohérent avec alertes ECO-03 endorheïque et ECO-05 eau salée
- Critère "élevé" combine aridité (réutiliser desertZones.geojson) + longueur + bassin endorheïque
- Section accordéon "Météo" dans EcologyPanel, après la section dessalement

**Structure des plans**
- T01 : types `MeteorologyResult` + stubs `meteorologyEngine.ts` + tests RED (Wave 0)
- T02 : implémentation complète `meteorologyEngine.ts` — tests GREEN (Wave 1)
- T03 : `useMeteorology.ts` hook + `<MeteorologySection />` dans `EcologyPanel.tsx` (Wave 2)
- `MeteorologyResult` contient 4 intervalles (`evaporationKm3`, `influenceRadiusKm`, `precipitationMmY`, `coolingDeltaC`) + `weatherRisk: 'low' | 'moderate' | 'high'`

### Claude's Discretion
- Facteurs exacts des taux d'évaporation par zone climatique
- Seuils précis latitude/aridité pour la classification du risque
- Composant UI exact `<MeteorologySection />` dans EcologyPanel

### Deferred Ideas (OUT OF SCOPE)
- Simulation de scénarios météo multi-canaux (impact cumulé sur le climat régional)
- Carte de chaleur des zones d'influence climatique sur MapView
- Données météo réelles par API pour affiner les calculs (contrainte 100% client-side)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| METEO-01 | L'utilisateur voit le volume d'évaporation estimé généré par le système canal+bassin (km³/an) affiché comme intervalle [min, max] | Formule : Surface × taux évaporation climatique [0.5–2.0 m/an], fourchette UX-01 |
| METEO-02 | L'utilisateur voit le rayon d'influence climatique estimé autour du canal (km) | Heuristique [50, 150] km selon longueur + aridité zone — intervalles UX-01 |
| METEO-03 | L'utilisateur voit les précipitations supplémentaires estimées dans la zone d'influence (mm/an) | 20–40% de l'évaporation reconvertie en précipitations selon aridité |
| METEO-04 | L'utilisateur voit le refroidissement local estimé par évapotranspiration (°C) | ΔT = −0.5 à −2.0°C selon surface eau + aridité — intervalle °C négatif |
| METEO-05 | L'utilisateur voit un indice de risque météorologique (faible/modéré/élevé) | Critères locked: humide/< 500 km = low ; semi-aride / 500–1500 km = moderate ; désertique ET > 1500 km = high |

</phase_requirements>

---

## Summary

La Phase 10 étend le moteur d'analyse écologique existant avec un module météorologique pur. L'architecture est entièrement décidée dans CONTEXT.md : `meteorologyEngine.ts` suit le pattern exact de `desalinationEngine.ts` — fonctions pures exportées individuellement + orchestrateur `computeMeteorologyAnalysis()`. Tous les inputs nécessaires (longueur, points, aridité) sont disponibles via le canal sélectionné et `desertZones.geojson` déjà chargé.

Les calculs sont des heuristiques scalaires simples (pas de géométrie Turf complexe) : multiplication de surface × taux, scaling par facteur d'aridité, et classification ternaire du risque. Le seul appel Turf requis est `booleanIntersects` pour détecter l'aridité — déjà utilisé dans `desalinationEngine.ts` et `ecologyEngine.ts`. L'intégration UI s'insère après la section dessalement dans `EcologyPanel.tsx` avec le pattern accordéon déjà établi.

Le calcul météo est automatique à la sélection d'un canal (pas de toggle) — différence clé par rapport au dessalement. Cela simplifie le hook `useMeteorology.ts` : pas d'état `enabled` dans le store, appel direct à `computeMeteorologyAnalysis()` dans le `useMemo`.

**Recommandation principale :** Copier `desalinationEngine.ts` comme template de base, adapter les 4 fonctions pures + orchestrateur, monter `useMeteorology` dans `SidePanel.tsx` (cohérent avec `useDesalination` et `useEcology`).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Calcul évaporation km³/an | Client (module pur) | — | Formule scalaire, inputs dans le store Zustand |
| Calcul rayon d'influence | Client (module pur) | — | Heuristique length-based, pas de géométrie externe |
| Calcul précipitations induites | Client (module pur) | — | Dérivé direct de l'évaporation × facteur |
| Calcul refroidissement ΔT | Client (module pur) | — | Heuristique surface + aridité |
| Classification risque météo | Client (module pur) | — | Critères ternaires sur longueur + aridité |
| Détection aridité zone | Client (lib geojson) | — | Réutilise desertZones.geojson + booleanIntersects |
| Hook React useMeteorology | Frontend (hook) | — | useMemo sur selectedCanalId + canals |
| Affichage MeteorologySection | Frontend (composant) | — | Extension EcologyPanel accordéon existant |

---

## Standard Stack

### Core (déjà installé — aucune nouvelle dépendance)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8.3 | Types MeteorologyResult, MeteorologyParams | Stack projet locked |
| `@turf/turf` | ^7.3.5 | `booleanIntersects` pour détection aridité | Déjà utilisé phases 5, 9 |
| React | ^19.2.5 | `useMemo` dans `useMeteorology.ts` | Stack projet locked |
| Zustand | ^5.0.12 | `useCanalStore` pour lecture canal sélectionné | Stack projet locked |
| Vitest | ^3.2.1 | Tests RED (T01) + GREEN (T02) | Framework test locked |
| Lucide React | ^1.14.0 | Icônes badge risque (déjà dans EcologyPanel) | Déjà utilisé |

**Aucune installation requise pour cette phase.** Toutes les dépendances sont présentes.

[VERIFIED: package.json lu en session]

### Données GeoJSON réutilisées

| Fichier | Path | Usage Phase 10 |
|---------|------|----------------|
| `desertZones.geojson` | `src/data/desertZones.geojson` | Détection aridité pour `weatherRisk` et taux évaporation |

[VERIFIED: ls src/data/ confirmé en session — seuls 3 fichiers présents : candidates.json, desertZones.geojson, endorheicBasins.geojson]

---

## Architecture Patterns

### System Architecture Diagram

```
Canal sélectionné (Zustand store)
    ↓ selectedCanalId + canals
useMeteorology (hook React, useMemo)
    ↓ canal.points, calc lengthKm via Turf
    ↓ compute aridityFactor via booleanIntersects(desertZones)
meteorologyEngine.ts (module pur)
    ├── calcEvaporation(surfaceKm2, aridityFactor) → Interval km³/an    [METEO-01]
    ├── calcInfluenceRadius(lengthKm, aridityFactor) → Interval km       [METEO-02]
    ├── calcInducedPrecipitation(evapKm3, aridityFactor) → Interval mm/an [METEO-03]
    ├── calcCoolingDelta(surfaceKm2, aridityFactor) → Interval °C         [METEO-04]
    ├── classifyWeatherRisk(lengthKm, aridityFactor) → WeatherRisk        [METEO-05]
    └── computeMeteorologyAnalysis(params) → MeteorologyResult | null
    ↓ MeteorologyResult
EcologyPanel.tsx
    └── <MeteorologySection result={meteorologyResult} />
        ├── [evaporationKm3] km³/an
        ├── [influenceRadiusKm] km
        ├── [precipitationMmY] mm/an
        ├── [coolingDeltaC] °C
        └── badge weatherRisk (vert/orange/rouge)
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── meteorologyEngine.ts     # nouveau — Phase 10
│   ├── desalinationEngine.ts    # existant — Phase 9
│   └── ecologyEngine.ts         # existant — Phase 5
├── types/
│   ├── meteorology.ts           # nouveau — Phase 10
│   ├── desalination.ts          # existant — Phase 9
│   └── ecology.ts               # existant — Phase 5
├── hooks/
│   ├── useMeteorology.ts        # nouveau — Phase 10
│   ├── useDesalination.ts       # existant — Phase 9
│   └── useEcology.ts            # existant — Phase 5
├── tests/
│   └── meteorologyEngine.test.ts # nouveau — T01 (RED) + T02 (GREEN)
└── components/
    └── EcologyPanel.tsx         # existant — étendre avec MeteorologySection
```

### Pattern 1 : Module pur `meteorologyEngine.ts`

Exactement le même pattern que `desalinationEngine.ts` — copier la structure, adapter le domaine.

```typescript
// src/lib/meteorologyEngine.ts
// Pattern: fonctions pures + orchestrateur computeMeteorologyAnalysis()
// Source: VERIFIED dans desalinationEngine.ts + ecologyEngine.ts (session)

import { booleanIntersects, lineString, length } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import desertZones from '../data/desertZones.geojson'
import type { Coord } from '../types/canal'
import type { Interval } from '../types/calculation'
import type { MeteorologyParams, MeteorologyResult, WeatherRisk } from '../types/meteorology'

// Facteur d'aridité : 1.0 si désert intersecté, 0.4 si zone humide
export function calcAridityFactor(points: Coord[], desertFeatures: FeatureCollection): number {
  if (points.length < 2) return 0.4
  const line = lineString(points)
  for (const feature of desertFeatures.features) {
    if (booleanIntersects(line, feature)) return 1.0
  }
  return 0.4
}

// METEO-01 : Évaporation annuelle km³/an
// surfaceKm2 = largeur (m) × longueur (km) / 1000
// taux : [0.5, 2.0] m/an × aridityFactor → [min, max] km³/an
export function calcEvaporation(surfaceKm2: number, aridityFactor: number): Interval {
  const rateMin = 0.5 * aridityFactor  // m/an
  const rateMax = 2.0 * aridityFactor  // m/an
  return [surfaceKm2 * rateMin / 1000, surfaceKm2 * rateMax / 1000]  // km³/an
}

// METEO-02 : Rayon d'influence climatique
// heuristique : [50, 150] km × facteur longueur
export function calcInfluenceRadius(lengthKm: number, aridityFactor: number): Interval {
  const scale = Math.min(1.0 + (lengthKm / 5000), 3.0)
  return [50 * aridityFactor * scale, 150 * aridityFactor * scale]
}

// METEO-03 : Précipitations induites (20–40% de l'évaporation)
// evapKm3 → mm/an dans la zone d'influence
export function calcInducedPrecipitation(evapKm3: Interval, aridityFactor: number): Interval {
  const pMin = 0.20 * (1 + aridityFactor)
  const pMax = 0.40 * (1 + aridityFactor)
  // conversion km³ → mm/an : approximatif sur zone d'influence (voir note ASSUMED)
  return [evapKm3[0] * pMin * 1e6, evapKm3[1] * pMax * 1e6]
}

// METEO-04 : Refroidissement local ΔT (négatif)
// ΔT = −0.5 à −2.0°C × aridityFactor
export function calcCoolingDelta(surfaceKm2: number, aridityFactor: number): Interval {
  const base = Math.min(surfaceKm2 / 1000, 1.0)
  return [-2.0 * aridityFactor * base, -0.5 * aridityFactor * base]
}

// METEO-05 : Indice de risque météorologique (critères locked CONTEXT.md)
export function classifyWeatherRisk(lengthKm: number, aridityFactor: number): WeatherRisk {
  const isDesert = aridityFactor >= 1.0
  const isHumid = aridityFactor < 0.5
  if (isHumid || lengthKm < 500) return 'low'
  if (isDesert && lengthKm > 1500) return 'high'
  return 'moderate'
}

export function computeMeteorologyAnalysis(
  params: MeteorologyParams,
  desertFeatures: FeatureCollection,
): MeteorologyResult | null {
  if (params.points.length < 2) return null
  const aridityFactor = calcAridityFactor(params.points, desertFeatures)
  const surfaceKm2 = (params.widthM / 1000) * params.lengthKm
  const evaporationKm3 = calcEvaporation(surfaceKm2, aridityFactor)
  return {
    evaporationKm3,
    influenceRadiusKm: calcInfluenceRadius(params.lengthKm, aridityFactor),
    precipitationMmY: calcInducedPrecipitation(evaporationKm3, aridityFactor),
    coolingDeltaC: calcCoolingDelta(surfaceKm2, aridityFactor),
    weatherRisk: classifyWeatherRisk(params.lengthKm, aridityFactor),
  }
}
```

[VERIFIED: pattern basé sur desalinationEngine.ts + ecologyEngine.ts lus en session]

**Note sur les formules :** Les facteurs exacts (taux d'évaporation 0.5–2.0 m/an, scale influence, pourcentages précipitations) sont des approximations à la discrétion de Claude (CONTEXT.md §Claude's Discretion). Les valeurs ici sont scientifiquement plausibles mais non vérifiées contre une source météorologique officielle. [ASSUMED]

### Pattern 2 : Type `MeteorologyResult`

```typescript
// src/types/meteorology.ts
import type { Coord } from './canal'
import type { Interval } from './calculation'

export type WeatherRisk = 'low' | 'moderate' | 'high'

export interface MeteorologyParams {
  lengthKm: number
  widthM: number      // largeur canal en mètres (depuis calcParams.width)
  points: Coord[]
}

export interface MeteorologyResult {
  evaporationKm3:    Interval    // km³/an — METEO-01
  influenceRadiusKm: Interval    // km     — METEO-02
  precipitationMmY:  Interval    // mm/an  — METEO-03
  coolingDeltaC:     Interval    // °C (valeurs négatives) — METEO-04
  weatherRisk:       WeatherRisk // low | moderate | high — METEO-05
}
```

[VERIFIED: pattern inspiré de desalination.ts + ecology.ts lus en session]

### Pattern 3 : Hook `useMeteorology.ts`

```typescript
// src/hooks/useMeteorology.ts
// Pattern identique à useDesalination.ts — useMemo sur selectedCanalId + canals
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeMeteorologyAnalysis } from '../lib/meteorologyEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { MeteorologyResult } from '../types/meteorology'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useMeteorology(): MeteorologyResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const calcParams = useCanalStore((s) => s.calcParams)  // widthM depuis calcParams.width

  return useMemo<MeteorologyResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })

    return computeMeteorologyAnalysis(
      { lengthKm, widthM: calcParams.width, points: selectedCanal.points },
      DESERT_FEATURES,
    )
  }, [selectedCanalId, canals, calcParams.width])
}, [selectedCanalId, canals, calcParams.width])
}
```

**Différence clé vs useDesalination :** Pas d'état `enabled` dans le store — `useMeteorology` est appelé directement, résultat toujours calculé.

**Montage dans SidePanel.tsx :** `useMeteorology()` appelé dans `SidePanel.tsx` (pas dans EcologyPanel) — cohérent avec `useDesalination`, `useEcology`, `useElevation`. [VERIFIED: SidePanel.tsx pattern confirmé en session]

### Pattern 4 : Extension `EcologyPanel.tsx`

```tsx
// Ajout après la section dessalement dans EcologyPanel.tsx
// Import à ajouter : import { useMeteorology } from '../hooks/useMeteorology'

const meteorologyResult = useMeteorology()

// Section <MeteorologySection /> en fin du corps isOpen
{!noCanal && meteorologyResult && (
  <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Impact météorologique</p>
    <dl className="flex flex-col gap-1">
      <div className="flex flex-col gap-[2px]">
        <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Évaporation</dt>
        <dd className="text-[13px] font-semibold text-white">
          {formatInterval(meteorologyResult.evaporationKm3, 'km³/an', 3)}
        </dd>
      </div>
      {/* ... rayon influence, précipitations, refroidissement ... */}
      {/* Badge risque : vert = low, orange = moderate, rouge = high */}
    </dl>
  </div>
)}
```

[VERIFIED: EcologyPanel.tsx entier lu en session — structure accordéon + formatInterval déjà présents]

### Anti-Patterns à Éviter

- **Toggle inutile :** Le CONTEXT.md dit "calcul automatique dès sélection" — ne pas ajouter `meteorologyEnabled` dans le store comme le dessalement.
- **Nouveau panneau SidePanel :** Pas de nouvelle entrée top-level — tout s'intègre dans EcologyPanel.tsx (section accordéon).
- **Appel API réseau :** Contrainte absolue 100% client-side — aucune donnée météo externe.
- **Turf.js géométrie complexe :** Les calculs météo sont scalaires, pas géospatiaux (sauf la classification aridité qui réutilise booleanIntersects déjà éprouvé).
- **Valeurs ponctuelles :** Toutes les sorties numériques DOIVENT être des `Interval [min, max]` (UX-01 locked).
- **`find()` hors `useMemo` :** Pattern établi Phase 9 (T02-SUMMARY) — le `.find()` du canal doit être à l'intérieur du `useMemo`, pas en dehors.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Détection zone aride | Code de classification custom | `booleanIntersects` + `desertZones.geojson` | Déjà vérifié et testé phases 5 + 9 |
| Calcul longueur canal | Haversine manuel | `length(lineString(points), {units:'kilometers'})` Turf | Déjà utilisé dans useDesalination.ts |
| Formatage intervalle | Fonction inline | `formatInterval(iv, unit, decimals)` déjà dans EcologyPanel.tsx | Évite la duplication |
| Tests Vitest | Nouveau framework | Vitest 3.2.1 + jsdom déjà configuré | vitest.config.ts avec geojsonPlugin existant |

**Insight clé :** La phase entière n'ajoute aucune dépendance npm — tout repose sur l'outillage déjà en place.

---

## Common Pitfalls

### Pitfall 1 : Coord = [lng, lat] — index 1 = latitude

**What goes wrong :** Utiliser `point[0]` pour la latitude au lieu de `point[1]` dans les heuristiques latitudinales.
**Why it happens :** GeoJSON est [lng, lat] mais intuitivement on pense [lat, lng].
**How to avoid :** Pattern établi — `([_lng, lat]) => Math.abs(lat)` (identique à `detectClimateRisk` et `calcSolarFactor`).
**Warning signs :** Tests latitudinaux qui passent à l'envers (tropical quand tempéré).

[VERIFIED: ecologyEngine.ts + desalinationEngine.ts confirmés en session]

### Pitfall 2 : `find()` dans useMemo — ne pas le sortir

**What goes wrong :** Écrire `const selectedCanal = canals.find(...)` avant le `useMemo` → recalcul inutile à chaque render.
**Why it happens :** Lecture linéaire du code, oubli que find() crée une nouvelle référence.
**How to avoid :** Mettre le `find()` à l'intérieur du callback `useMemo` — pattern exact de `useDesalination.ts`.
**Warning signs :** Note explicite dans 09-T02-SUMMARY : "fix defeated memoization" (commit aa3826e).

[VERIFIED: useDesalination.ts + git log confirmés en session]

### Pitfall 3 : `coolingDeltaC` — valeurs négatives dans l'intervalle

**What goes wrong :** Retourner `[min, max]` avec min positif pour un refroidissement (ΔT < 0).
**Why it happens :** Convention intervalle [min, max] vs signe physique du refroidissement.
**How to avoid :** Retourner `[-2.0 * ..., -0.5 * ...]` — `[0]` est le refroidissement maximum (plus négatif), `[1]` le minimum. Ou documenter explicitement la convention choisie et tester les signes.
**Warning signs :** Test `expect(result.coolingDeltaC[0]).toBeLessThan(0)` qui échoue.

[ASSUMED — convention à choisir en T01 et documenter]

### Pitfall 4 : Surface eau — ne pas oublier `widthM / 1000`

**What goes wrong :** Calculer `surfaceKm2 = widthM * lengthKm` sans conversion → surface 1000× trop grande.
**Why it happens :** `calcParams.width` est en mètres, `lengthKm` en km.
**How to avoid :** `surfaceKm2 = (widthM / 1000) * lengthKm`.
**Warning signs :** Évaporation de l'ordre des millions de km³/an pour un petit canal.

[VERIFIED: calculation.ts — `width: number  // m` et DEFAULT_CALC_PARAMS.width = 50]

### Pitfall 5 : `geojsonPlugin` dans vite.config.ts — déjà configuré

**What goes wrong :** Penser que l'import `desertZones.geojson` nécessite une configuration spéciale.
**Why it happens :** Les imports GeoJSON ne fonctionnent pas nativement dans Vitest SSR mode.
**How to avoid :** Rien à faire — `geojsonPlugin()` est déjà dans `vite.config.ts` et gère les `.geojson` pour Vitest.

[VERIFIED: vite.config.ts lu en session]

---

## Code Examples

### Structure test RED (T01) — pattern desalinationEngine.test.ts

```typescript
// src/tests/meteorologyEngine.test.ts — T01 Wave 0 (stubs RED)
import { describe, it, expect } from 'vitest'
import {
  calcAridityFactor,
  calcEvaporation,
  calcInfluenceRadius,
  calcInducedPrecipitation,
  calcCoolingDelta,
  classifyWeatherRisk,
  computeMeteorologyAnalysis,
} from '../lib/meteorologyEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

describe('calcAridityFactor — classification zone', () => {
  it('retourne 1.0 pour des points en zone désertique (Sahara)', () => {
    const points: Coord[] = [[5.0, 25.0], [9.0, 21.0]]
    expect(calcAridityFactor(points, DESERT_FEATURES)).toBe(1.0)
  })
  it('retourne 0.4 pour des points hors désert (Europe)', () => {
    const points: Coord[] = [[2.35, 48.85], [13.4, 52.5]]
    expect(calcAridityFactor(points, DESERT_FEATURES)).toBe(0.4)
  })
})

describe('calcEvaporation — km³/an (METEO-01)', () => {
  it('retourne [0, 0] pour surface nulle', () => {
    expect(calcEvaporation(0, 1.0)).toEqual([0, 0])
  })
  it('retourne un intervalle positif pour surface > 0', () => {
    const result = calcEvaporation(100, 1.0)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })
})

describe('classifyWeatherRisk — indice risque (METEO-05)', () => {
  it('retourne low pour canal < 500 km', () => {
    expect(classifyWeatherRisk(400, 1.0)).toBe('low')
  })
  it('retourne high pour canal > 1500 km en zone désertique', () => {
    expect(classifyWeatherRisk(2000, 1.0)).toBe('high')
  })
  it('retourne moderate pour canal 500–1500 km en zone semi-aride', () => {
    expect(classifyWeatherRisk(1000, 0.7)).toBe('moderate')
  })
  it('retourne low pour zone humide indépendamment de la longueur', () => {
    expect(classifyWeatherRisk(2000, 0.4)).toBe('low')
  })
})
```

[VERIFIED: pattern basé sur desalinationEngine.test.ts lu en session]

### Badge risque — pattern EcologyPanel.tsx cohérent avec alertes existantes

```tsx
// Dans <MeteorologySection /> — badge vert/orange/rouge
const RISK_COLORS: Record<WeatherRisk, string> = {
  low: 'text-green-400',
  moderate: 'text-amber-400',
  high: 'text-red-400',
}
const RISK_LABELS: Record<WeatherRisk, string> = {
  low: 'Faible',
  moderate: 'Modéré',
  high: 'Élevé',
}

<span className={`text-[13px] font-semibold ${RISK_COLORS[meteorologyResult.weatherRisk]}`}>
  {RISK_LABELS[meteorologyResult.weatherRisk]}
</span>
```

[VERIFIED: EcologyPanel.tsx — pattern couleurs amber-400/red-400 confirmé en session]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Toggle pour activer modules | Calcul automatique à sélection | Phase 10 (nouveau) | Pas de `meteorologyEnabled` dans le store |
| Alertes ECO-04 seules pour risque climatique | Risque météo structuré (low/moderate/high) | Phase 10 | METEO-05 remplace le flag booléen ECO-04 pour la météo |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Taux d'évaporation [0.5–2.0] m/an par zone climatique | Standard Stack, Pattern 1 | Valeurs scientifiquement plausibles mais non vérifiées contre IPCC ou OMM — les intervalles UX-01 absorbent l'incertitude |
| A2 | Facteur précipitations 20–40% de l'évaporation | Pattern 1 — calcInducedPrecipitation | Approximation régionale — peut varier 10–60% selon la littérature. Couvert par intervalle [min, max] |
| A3 | Convention `coolingDeltaC[0]` = refroidissement maximum (plus négatif) | Pitfall 3 | Si convention inversée, affichage UI perturbant — à documenter explicitement en T01 |
| A4 | `aridityFactor` : 1.0 (désert) / 0.4 (humide) — valeurs intermédiaires non spécifiées | Pattern 1 — calcAridityFactor | Seuil binaire (désert/non-désert) — plausible mais simplifié. Risque : canal semi-aride classé "humid" |

**Si ce tableau est vide :** Non applicable — A1 à A4 identifiés ci-dessus.

---

## Open Questions

1. **Convention signe `coolingDeltaC`**
   - What we know : CONTEXT.md dit `coolingDeltaC: Interval` sans préciser si `[0]` est le plus négatif ou le moins négatif
   - What's unclear : `Interval = [min, max]` avec min < max — pour ΔT négatif, `[0]` = valeur la plus négative (refroidissement max)
   - Recommendation : Documenter la convention dans `meteorology.ts` et écrire un test qui vérifie `result.coolingDeltaC[0] < result.coolingDeltaC[1] < 0`

2. **`widthM` dans `MeteorologyParams` : `calcParams.width` suffit-il ?**
   - What we know : `calcParams.width` (défaut 50 m) est l'unique paramètre largeur dans le store
   - What's unclear : La Phase 10 doit-elle ignorer le cas "canal sans largeur définie" ?
   - Recommendation : Utiliser `calcParams.width` directement — si 0 ou nul, `surfaceKm2 = 0` et toutes les sorties retournent `[0, 0]`, ce qui est cohérent avec les moteurs précédents

---

## Environment Availability

> Phase code/config-only — aucune nouvelle dépendance externe identifiée.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Vitest, Vite | ✓ | Confirmé (138 tests GREEN) | — |
| Vitest | Tests T01/T02 | ✓ | ^3.2.1 | — |
| @turf/turf | booleanIntersects, lineString | ✓ | ^7.3.5 | — |
| desertZones.geojson | Détection aridité | ✓ | src/data/desertZones.geojson | — |

[VERIFIED: npm test 138/138 GREEN confirmé en session — tous outils disponibles]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.1 |
| Config file | `vite.config.ts` (section `test:`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| METEO-01 | `calcEvaporation(surfaceKm2, aridityFactor)` retourne Interval km³/an | unit | `npm test` | ❌ Wave 0 |
| METEO-02 | `calcInfluenceRadius(lengthKm, aridityFactor)` retourne Interval km | unit | `npm test` | ❌ Wave 0 |
| METEO-03 | `calcInducedPrecipitation(evapKm3, aridityFactor)` retourne Interval mm/an | unit | `npm test` | ❌ Wave 0 |
| METEO-04 | `calcCoolingDelta(surfaceKm2, aridityFactor)` retourne Interval °C négatif | unit | `npm test` | ❌ Wave 0 |
| METEO-05 | `classifyWeatherRisk(lengthKm, aridityFactor)` retourne WeatherRisk correct | unit | `npm test` | ❌ Wave 0 |
| UX-01 | Toutes les sorties numériques sont des Interval `[min, max]` | unit | `npm test` | ❌ Wave 0 |
| Intégration | `computeMeteorologyAnalysis(params)` retourne MeteorologyResult complet | unit | `npm test` | ❌ Wave 0 |

### Sampling Rate

- **Par commit de tâche :** `npm test`
- **Par merge de wave :** `npm test`
- **Phase gate :** Suite complète GREEN avant `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/tests/meteorologyEngine.test.ts` — couvre METEO-01 à METEO-05 + UX-01
- [ ] `src/lib/meteorologyEngine.ts` — stubs (retournent `[0, 0]` et `'low'`) pour que tests RED compilent
- [ ] `src/types/meteorology.ts` — types `MeteorologyParams`, `MeteorologyResult`, `WeatherRisk`

*(Pas de conftest ni fixtures partagées nécessaires — desertZones.geojson importé directement comme dans desalinationEngine.test.ts)*

---

## Security Domain

> Phase 10 = module de calcul pur côté client. Aucune surface d'attaque nouvelle : pas de réseau, pas d'authentification, pas de données sensibles, pas de persistance IndexedDB pour cette phase.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | non | — |
| V3 Session Management | non | — |
| V4 Access Control | non | — |
| V5 Input Validation | oui (minimal) | Guard `points.length < 2` → retourne null (pattern établi) |
| V6 Cryptography | non | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Input invalide (points vides) | Tampering | Guard `if (params.points.length < 2) return null` — pattern identique aux moteurs précédents |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/desalinationEngine.ts` — template direct pour meteorologyEngine.ts [VERIFIED in-session]
- `src/lib/ecologyEngine.ts` — pattern booleanIntersects + calcSolarFactor [VERIFIED in-session]
- `src/hooks/useDesalination.ts` — template hook à dupliquer [VERIFIED in-session]
- `src/types/desalination.ts` + `src/types/ecology.ts` — template types [VERIFIED in-session]
- `src/components/EcologyPanel.tsx` — accordéon à étendre, formatInterval disponible [VERIFIED in-session]
- `src/types/calculation.ts` — type Interval = [number, number] [VERIFIED in-session]
- `src/store/canalStore.ts` — pas de nouveau state nécessaire (calcParams.width existant) [VERIFIED in-session]
- `vite.config.ts` — geojsonPlugin + vitest environment jsdom [VERIFIED in-session]
- `package.json` — 138 tests GREEN, aucune nouvelle dépendance requise [VERIFIED in-session]
- `.planning/phases/10-impact-meteorologique/10-CONTEXT.md` — décisions locked [VERIFIED in-session]

### Secondary (MEDIUM confidence)
- `.planning/phases/09-eau-salee-dessalement/09-T02-SUMMARY.md` — patterns établis Phase 9 [VERIFIED in-session]

### Tertiary (LOW confidence — assumptions)
- Taux évaporation 0.5–2.0 m/an : ordre de grandeur météorologique plausible [ASSUMED — formation]
- Facteur précipitations 20–40% : estimation plausible cycles hydrologiques [ASSUMED — formation]

---

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — vérifié package.json + node_modules en session, 0 nouvelle dépendance
- Architecture : HIGH — patterns lus directement dans le code source existant
- Formules de calcul : MEDIUM — taux d'évaporation et facteurs sont des approximations [ASSUMED]
- Pitfalls : HIGH — basés sur les commits et summaries des phases précédentes
- Tests : HIGH — framework confirmé 138/138 GREEN, structure de fichier vérifiée

**Research date :** 2026-05-02
**Valid until :** 2026-06-01 (stack stable, dépendances figées)

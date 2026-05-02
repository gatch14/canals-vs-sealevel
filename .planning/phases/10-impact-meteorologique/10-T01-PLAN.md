---
phase: 10-impact-meteorologique
plan: T01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/types/meteorology.ts
  - src/lib/meteorologyEngine.ts
  - src/tests/meteorologyEngine.test.ts
autonomous: true
requirements: [METEO-01, METEO-02, METEO-03, METEO-04, METEO-05]

must_haves:
  truths:
    - "src/types/meteorology.ts exporte WeatherRisk, MeteorologyParams, MeteorologyResult"
    - "src/lib/meteorologyEngine.ts exporte 6 fonctions + computeMeteorologyAnalysis (stubs)"
    - "src/tests/meteorologyEngine.test.ts contient des tests couvrant METEO-01 à METEO-05"
    - "npm test se termine avec au moins 15 nouveaux tests en échec (RED) et zéro régression sur les 138 tests existants"
  artifacts:
    - path: "src/types/meteorology.ts"
      provides: "Types WeatherRisk + MeteorologyParams + MeteorologyResult"
      exports: ["WeatherRisk", "MeteorologyParams", "MeteorologyResult"]
    - path: "src/lib/meteorologyEngine.ts"
      provides: "Stubs des 7 fonctions exportées"
      exports: ["calcAridityFactor", "calcEvaporation", "calcInfluenceRadius", "calcInducedPrecipitation", "calcCoolingDelta", "classifyWeatherRisk", "computeMeteorologyAnalysis"]
    - path: "src/tests/meteorologyEngine.test.ts"
      provides: "Suite de tests RED couvrant METEO-01 à METEO-05"
      contains: "computeMeteorologyAnalysis"
  key_links:
    - from: "src/tests/meteorologyEngine.test.ts"
      to: "src/lib/meteorologyEngine.ts"
      via: "import nommé des 7 fonctions"
      pattern: "from '../lib/meteorologyEngine'"
    - from: "src/lib/meteorologyEngine.ts"
      to: "src/types/meteorology.ts"
      via: "import type"
      pattern: "from '../types/meteorology'"
---

<objective>
Établir les contrats de types + stubs compilables + tests RED pour le moteur météorologique.

Purpose: La structure TDD oblige à définir les interfaces avant l'implémentation. Les tests RED documentent précisément le comportement attendu des 5 fonctions pures (METEO-01 à METEO-05). T02 n'a qu'à faire passer ces tests sans en écrire de nouveaux.

Output: meteorology.ts (types), meteorologyEngine.ts (stubs), meteorologyEngine.test.ts (tests RED, >= 15 tests en échec).
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/10-impact-meteorologique/10-CONTEXT.md
@.planning/phases/10-impact-meteorologique/10-RESEARCH.md
@.planning/phases/10-impact-meteorologique/10-PATTERNS.md

<interfaces>
<!-- Contrats existants que l'exécuteur doit respecter. Extraits du code source. -->

Depuis src/types/calculation.ts :
```typescript
export type Interval = [number, number]
```

Depuis src/types/canal.ts :
```typescript
export type Coord = [number, number]  // [longitude, latitude] WGS84
```

Depuis src/types/desalination.ts (modèle exact pour meteorology.ts) :
```typescript
export type EcosystemImpactLevel = 'low' | 'neutral'

export interface DesalinationParams {
  lengthKm: number
  points: Coord[]
  solarFactor: number
}

export interface DesalinationResult {
  nodes: number
  waterProduction: Interval    // UX-01
  saltValue: Interval          // UX-01
  habitableZones: Interval     // UX-01
  desalinationCost: Interval   // UX-01
  ecosystemImpact: EcosystemImpactLevel
}
```

Depuis src/lib/desalinationEngine.ts (signatures des fonctions pures — modèle pour meteorologyEngine.ts) :
```typescript
export function classifyEcosystem(points: Coord[], desertFeatures: FeatureCollection): EcosystemImpactLevel
export function calcDesalinationNodes(lengthKm: number): number
export function calcSolarFactor(points: Coord[]): number
export function calcWaterProduction(nodes: number, solarFactor: number): Interval
export function calcSaltValue(nodes: number, solarFactor: number): Interval
export function calcHabitableZones(nodes: number): Interval
export function calcDesalinationCost(nodes: number): Interval
export function computeDesalinationAnalysis(params: DesalinationParams, desertFeatures: FeatureCollection): DesalinationResult | null
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Types meteorology.ts + stubs meteorologyEngine.ts</name>
  <files>src/types/meteorology.ts, src/lib/meteorologyEngine.ts</files>

  <read_first>
    - src/types/desalination.ts — modèle exact pour la structure de meteorology.ts
    - src/lib/desalinationEngine.ts — modèle exact pour la structure des stubs
    - src/types/calculation.ts — vérifier la définition de Interval
    - src/types/canal.ts — vérifier la définition de Coord
  </read_first>

  <behavior>
    RED phase (fichiers à créer avant les tests) :

    src/types/meteorology.ts doit contenir :
    - `export type WeatherRisk = 'low' | 'moderate' | 'high'`
    - `export interface MeteorologyParams { lengthKm: number; widthM: number; points: Coord[] }`
    - `export interface MeteorologyResult { evaporationKm3: Interval; influenceRadiusKm: Interval; precipitationMmY: Interval; coolingDeltaC: Interval; weatherRisk: WeatherRisk }`

    src/lib/meteorologyEngine.ts doit exporter 7 stubs compilables :
    - `calcAridityFactor(points: Coord[], desertFeatures: FeatureCollection): number` → stub retourne `0`
    - `calcEvaporation(surfaceKm2: number, aridityFactor: number): Interval` → stub retourne `[0, 0]`
    - `calcInfluenceRadius(lengthKm: number, aridityFactor: number): Interval` → stub retourne `[0, 0]`
    - `calcInducedPrecipitation(evapKm3: Interval, aridityFactor: number): Interval` → stub retourne `[0, 0]`
    - `calcCoolingDelta(surfaceKm2: number, aridityFactor: number): Interval` → stub retourne `[0, 0]`
    - `classifyWeatherRisk(lengthKm: number, aridityFactor: number): WeatherRisk` → stub retourne `'low'`
    - `computeMeteorologyAnalysis(params: MeteorologyParams, desertFeatures: FeatureCollection): MeteorologyResult | null` → stub retourne `null`
  </behavior>

  <action>
    Créer src/types/meteorology.ts avec le contenu exact suivant (pattern desalination.ts) :

    ```typescript
    // src/types/meteorology.ts
    // Types du moteur météorologique Phase 10 — METEO-01 à METEO-05
    // Toutes les valeurs numériques respectent UX-01 (Interval [min, max])
    import type { Coord } from './canal'
    import type { Interval } from './calculation'

    // ─── METEO-05 : Indice de risque météorologique ───────────────────────────────

    /**
     * Indice de risque lié aux gradients d'humidité (METEO-05).
     * - 'low'      : zone humide OU canal < 500 km
     * - 'moderate' : zone semi-aride OU 500–1500 km
     * - 'high'     : zone désertique ET > 1500 km
     */
    export type WeatherRisk = 'low' | 'moderate' | 'high'

    // ─── Paramètres d'entrée ──────────────────────────────────────────────────────

    /** Paramètres pour le calcul des effets météorologiques (METEO-01 à METEO-05) */
    export interface MeteorologyParams {
      /** Longueur totale du canal (km) */
      lengthKm: number
      /** Largeur du canal (m) — depuis calcParams.width, défaut 50 m */
      widthM: number
      /** Points du tracé [lng, lat] WGS84 */
      points: Coord[]
    }

    // ─── Résultat du moteur météorologique ───────────────────────────────────────

    /** Résultat complet de l'analyse météorologique pour un canal (METEO-01 à METEO-05) */
    export interface MeteorologyResult {
      /** Volume d'évaporation annuel [min, max] km³/an (METEO-01, UX-01)
       *  Convention : valeurs positives, min < max */
      evaporationKm3: Interval
      /** Rayon d'influence climatique [min, max] km (METEO-02, UX-01) */
      influenceRadiusKm: Interval
      /** Précipitations supplémentaires induites [min, max] mm/an (METEO-03, UX-01) */
      precipitationMmY: Interval
      /** Refroidissement local par évapotranspiration [min, max] °C (METEO-04, UX-01)
       *  Convention : valeurs NÉGATIVES — [0] est le refroidissement maximum (ex: -2.0),
       *               [1] est le refroidissement minimum (ex: -0.5), donc [0] < [1] < 0 */
      coolingDeltaC: Interval
      /** Indice de risque météorologique (METEO-05) */
      weatherRisk: WeatherRisk
    }
    ```

    Créer src/lib/meteorologyEngine.ts avec les stubs suivants (compilables, retournent des valeurs par défaut) :

    ```typescript
    // src/lib/meteorologyEngine.ts
    // Moteur météorologique Phase 10 — pur TypeScript, sans React, sans Zustand.
    // T01 : stubs compilables — tous les tests sont RED.
    // T02 : implémentation complète — tous les tests passent GREEN.
    import { booleanIntersects, lineString } from '@turf/turf'
    import type { FeatureCollection } from 'geojson'
    import type { Coord } from '../types/canal'
    import type { Interval } from '../types/calculation'
    import type { MeteorologyParams, MeteorologyResult, WeatherRisk } from '../types/meteorology'

    // ─── Facteur d'aridité ────────────────────────────────────────────────────────

    /** Retourne 1.0 si le tracé intersecte une zone désertique, 0.4 sinon. */
    export function calcAridityFactor(
      _points: Coord[],
      _desertFeatures: FeatureCollection,
    ): number {
      return 0  // stub — T02 implémente
    }

    // ─── METEO-01 : Évaporation annuelle ─────────────────────────────────────────

    /** Calcule le volume d'évaporation [min, max] km³/an. */
    export function calcEvaporation(
      _surfaceKm2: number,
      _aridityFactor: number,
    ): Interval {
      return [0, 0]  // stub — T02 implémente
    }

    // ─── METEO-02 : Rayon d'influence climatique ──────────────────────────────────

    /** Calcule le rayon d'influence climatique [min, max] km. */
    export function calcInfluenceRadius(
      _lengthKm: number,
      _aridityFactor: number,
    ): Interval {
      return [0, 0]  // stub — T02 implémente
    }

    // ─── METEO-03 : Précipitations induites ───────────────────────────────────────

    /** Calcule les précipitations supplémentaires induites [min, max] mm/an. */
    export function calcInducedPrecipitation(
      _evapKm3: Interval,
      _aridityFactor: number,
    ): Interval {
      return [0, 0]  // stub — T02 implémente
    }

    // ─── METEO-04 : Refroidissement local ─────────────────────────────────────────

    /** Calcule le refroidissement local [min, max] °C (valeurs négatives). */
    export function calcCoolingDelta(
      _surfaceKm2: number,
      _aridityFactor: number,
    ): Interval {
      return [0, 0]  // stub — T02 implémente
    }

    // ─── METEO-05 : Indice de risque météorologique ───────────────────────────────

    /** Classifie le risque météorologique selon longueur et aridité. */
    export function classifyWeatherRisk(
      _lengthKm: number,
      _aridityFactor: number,
    ): WeatherRisk {
      return 'low'  // stub — T02 implémente
    }

    // ─── Orchestrateur principal ──────────────────────────────────────────────────

    /** Calcule le résultat complet de l'analyse météorologique. Retourne null si < 2 points. */
    export function computeMeteorologyAnalysis(
      _params: MeteorologyParams,
      _desertFeatures: FeatureCollection,
    ): MeteorologyResult | null {
      return null  // stub — T02 implémente
    }
    ```

    Note : les imports `booleanIntersects` et `lineString` sont déclarés maintenant pour que T02 n'ait pas à modifier les imports — ils seront utilisés dans l'implémentation.
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -E "meteorology|error" | head -20</automated>
  </verify>

  <acceptance_criteria>
    - `src/types/meteorology.ts` contient `export type WeatherRisk = 'low' | 'moderate' | 'high'`
    - `src/types/meteorology.ts` contient `export interface MeteorologyParams`
    - `src/types/meteorology.ts` contient `export interface MeteorologyResult`
    - `src/types/meteorology.ts` contient `coolingDeltaC: Interval`
    - `src/lib/meteorologyEngine.ts` contient `export function computeMeteorologyAnalysis(`
    - `src/lib/meteorologyEngine.ts` contient `export function calcAridityFactor(`
    - `src/lib/meteorologyEngine.ts` contient `export function classifyWeatherRisk(`
    - `npx tsc --noEmit` se termine sans erreur TypeScript sur ces deux fichiers
  </acceptance_criteria>

  <done>Types compilables et stubs compilables créés — aucun test écrit encore, TypeScript clean.</done>
</task>

<task type="tdd">
  <name>Task 2: Tests RED — meteorologyEngine.test.ts</name>
  <files>src/tests/meteorologyEngine.test.ts</files>

  <read_first>
    - src/tests/desalinationEngine.test.ts — modèle exact de structure (describe/it, imports, DESERT_FEATURES cast, fixtures Coord)
    - src/types/meteorology.ts — types créés en Task 1 (vérifier les signatures)
    - src/lib/meteorologyEngine.ts — stubs créés en Task 1 (vérifier les exports)
    - .planning/phases/10-impact-meteorologique/10-RESEARCH.md — Section "Code Examples" (tests RED documentés)
  </read_first>

  <behavior>
    Les tests doivent ÉCHOUER après création (stubs retournent [0,0] et 'low').
    La suite couvre METEO-01 à METEO-05 + UX-01 + cas null guard.

    Comportements à tester (valeurs attendues après T02) :

    calcAridityFactor :
    - points Sahara [[5.0, 25.0], [9.0, 21.0]] → 1.0 (intersecte desertZones)
    - points Europe [[2.35, 48.85], [13.4, 52.5]] → 0.4 (hors désert)
    - points.length < 2 → 0.4

    calcEvaporation (METEO-01) :
    - (0, 1.0) → [0, 0] (surface nulle)
    - (100, 1.0) → result[0] > 0 ET result[1] > result[0] (intervalle positif croissant)
    - (100, 0.4) → result[1] < calcEvaporation(100, 1.0)[1] (facteur réduit → moins d'évaporation)

    calcInfluenceRadius (METEO-02) :
    - (1000, 1.0) → result[0] >= 50 ET result[1] <= 450 ET result[1] > result[0]
    - (1000, 0.4) → result[1] < calcInfluenceRadius(1000, 1.0)[1]

    calcInducedPrecipitation (METEO-03) :
    - ([0, 0], 1.0) → [0, 0]
    - ([0.1, 0.5], 1.0) → result[0] > 0 ET result[1] > result[0]

    calcCoolingDelta (METEO-04) :
    - (0, 1.0) → [0, 0]
    - (100, 1.0) → result[0] < 0 ET result[1] < 0 ET result[0] < result[1] (les deux négatifs, [0] plus négatif)

    classifyWeatherRisk (METEO-05) :
    - (400, 1.0) → 'low' (< 500 km)
    - (2000, 1.0) → 'high' (désertique ET > 1500 km)
    - (1000, 0.7) → 'moderate' (500–1500 km, semi-aride)
    - (2000, 0.4) → 'low' (zone humide indépendamment longueur)

    computeMeteorologyAnalysis (orchestrateur) :
    - points.length < 2 → null
    - params valides (2 points, lengthKm=1000, widthM=50) → MeteorologyResult non-null avec tous les champs
    - résultat complet : evaporationKm3[0] > 0, influenceRadiusKm[0] > 0, coolingDeltaC[0] < 0, weatherRisk dans ['low','moderate','high']
  </behavior>

  <action>
    Créer src/tests/meteorologyEngine.test.ts avec le contenu suivant (pattern exact de desalinationEngine.test.ts) :

    ```typescript
    // src/tests/meteorologyEngine.test.ts
    // Wave 0 — Tests RED. Les stubs retournent [0,0] et 'low'.
    // T02 (Wave 1) implémente les fonctions pour faire passer ces tests en GREEN.
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

    // ─── calcAridityFactor ────────────────────────────────────────────────────────

    describe('calcAridityFactor — classification zone aride', () => {
      it('retourne 1.0 pour des points en zone désertique (Sahara central)', () => {
        const saharaPoints: Coord[] = [[5.0, 25.0], [9.0, 21.0]]
        expect(calcAridityFactor(saharaPoints, DESERT_FEATURES)).toBe(1.0)
      })
      it('retourne 0.4 pour des points hors désert (Europe tempérée)', () => {
        const europePoints: Coord[] = [[2.35, 48.85], [13.4, 52.5]]
        expect(calcAridityFactor(europePoints, DESERT_FEATURES)).toBe(0.4)
      })
      it('retourne 0.4 pour points.length < 2 (guard entrée invalide)', () => {
        expect(calcAridityFactor([[5.0, 25.0]], DESERT_FEATURES)).toBe(0.4)
      })
    })

    // ─── calcEvaporation — METEO-01 ───────────────────────────────────────────────

    describe('calcEvaporation — volume évaporation km³/an (METEO-01)', () => {
      it('retourne [0, 0] pour surface nulle', () => {
        const result = calcEvaporation(0, 1.0)
        expect(result[0]).toBe(0)
        expect(result[1]).toBe(0)
      })
      it('retourne un intervalle positif avec max > min pour surface > 0 en zone désertique', () => {
        const result = calcEvaporation(100, 1.0)
        expect(result[0]).toBeGreaterThan(0)
        expect(result[1]).toBeGreaterThan(result[0])
      })
      it('retourne moins d'évaporation pour facteur d'aridité réduit (0.4 vs 1.0)', () => {
        const humid = calcEvaporation(100, 0.4)
        const desert = calcEvaporation(100, 1.0)
        expect(humid[1]).toBeLessThan(desert[1])
      })
    })

    // ─── calcInfluenceRadius — METEO-02 ───────────────────────────────────────────

    describe('calcInfluenceRadius — rayon d'influence km (METEO-02)', () => {
      it('retourne un intervalle avec min >= 50 km pour canal de 1000 km en zone désertique', () => {
        const result = calcInfluenceRadius(1000, 1.0)
        expect(result[0]).toBeGreaterThanOrEqual(50)
        expect(result[1]).toBeGreaterThan(result[0])
      })
      it('retourne un rayon inférieur pour zone humide vs désertique (même longueur)', () => {
        const humid = calcInfluenceRadius(1000, 0.4)
        const desert = calcInfluenceRadius(1000, 1.0)
        expect(humid[1]).toBeLessThan(desert[1])
      })
    })

    // ─── calcInducedPrecipitation — METEO-03 ──────────────────────────────────────

    describe('calcInducedPrecipitation — précipitations induites mm/an (METEO-03)', () => {
      it('retourne [0, 0] pour évaporation nulle', () => {
        const result = calcInducedPrecipitation([0, 0], 1.0)
        expect(result[0]).toBe(0)
        expect(result[1]).toBe(0)
      })
      it('retourne un intervalle positif avec max > min pour évaporation > 0', () => {
        const result = calcInducedPrecipitation([0.1, 0.5], 1.0)
        expect(result[0]).toBeGreaterThan(0)
        expect(result[1]).toBeGreaterThan(result[0])
      })
    })

    // ─── calcCoolingDelta — METEO-04 ──────────────────────────────────────────────

    describe('calcCoolingDelta — refroidissement local °C (METEO-04)', () => {
      it('retourne [0, 0] pour surface nulle', () => {
        const result = calcCoolingDelta(0, 1.0)
        expect(result[0]).toBe(0)
        expect(result[1]).toBe(0)
      })
      it('retourne deux valeurs négatives pour surface > 0 (refroidissement)', () => {
        const result = calcCoolingDelta(100, 1.0)
        expect(result[0]).toBeLessThan(0)
        expect(result[1]).toBeLessThan(0)
      })
      it('respecte la convention : [0] est plus négatif que [1] (refroidissement max < refroidissement min)', () => {
        const result = calcCoolingDelta(100, 1.0)
        expect(result[0]).toBeLessThan(result[1])
      })
    })

    // ─── classifyWeatherRisk — METEO-05 ───────────────────────────────────────────

    describe('classifyWeatherRisk — indice de risque météorologique (METEO-05)', () => {
      it('retourne low pour canal < 500 km en zone désertique', () => {
        expect(classifyWeatherRisk(400, 1.0)).toBe('low')
      })
      it('retourne high pour canal > 1500 km en zone désertique (aridityFactor >= 1.0)', () => {
        expect(classifyWeatherRisk(2000, 1.0)).toBe('high')
      })
      it('retourne moderate pour canal 500–1500 km en zone semi-aride (aridityFactor 0.7)', () => {
        expect(classifyWeatherRisk(1000, 0.7)).toBe('moderate')
      })
      it('retourne low pour zone humide (aridityFactor 0.4) indépendamment de la longueur', () => {
        expect(classifyWeatherRisk(2000, 0.4)).toBe('low')
      })
      it('retourne moderate pour canal exactement 500 km en zone semi-aride', () => {
        expect(classifyWeatherRisk(500, 0.7)).toBe('moderate')
      })
    })

    // ─── computeMeteorologyAnalysis — orchestrateur ───────────────────────────────

    describe('computeMeteorologyAnalysis — orchestrateur (METEO-01 à METEO-05)', () => {
      it('retourne null si points.length < 2', () => {
        const result = computeMeteorologyAnalysis(
          { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0]] },
          DESERT_FEATURES,
        )
        expect(result).toBeNull()
      })

      it('retourne un MeteorologyResult non-null pour des paramètres valides', () => {
        const result = computeMeteorologyAnalysis(
          { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
          DESERT_FEATURES,
        )
        expect(result).not.toBeNull()
      })

      it('retourne evaporationKm3[0] > 0 pour canal en zone désertique (METEO-01)', () => {
        const result = computeMeteorologyAnalysis(
          { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
          DESERT_FEATURES,
        )
        expect(result!.evaporationKm3[0]).toBeGreaterThan(0)
      })

      it('retourne influenceRadiusKm[0] > 0 pour canal en zone désertique (METEO-02)', () => {
        const result = computeMeteorologyAnalysis(
          { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
          DESERT_FEATURES,
        )
        expect(result!.influenceRadiusKm[0]).toBeGreaterThan(0)
      })

      it('retourne coolingDeltaC[0] < 0 (valeur négative — METEO-04)', () => {
        const result = computeMeteorologyAnalysis(
          { lengthKm: 1000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
          DESERT_FEATURES,
        )
        expect(result!.coolingDeltaC[0]).toBeLessThan(0)
      })

      it('retourne weatherRisk high pour canal désertique long > 1500 km (METEO-05)', () => {
        const result = computeMeteorologyAnalysis(
          { lengthKm: 2000, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
          DESERT_FEATURES,
        )
        expect(result!.weatherRisk).toBe('high')
      })

      it('retourne weatherRisk low pour canal court < 500 km même en zone désertique (METEO-05)', () => {
        const result = computeMeteorologyAnalysis(
          { lengthKm: 400, widthM: 50, points: [[5.0, 25.0], [9.0, 21.0]] },
          DESERT_FEATURES,
        )
        expect(result!.weatherRisk).toBe('low')
      })
    })
    ```

    Après création du fichier, vérifier que les tests sont bien RED :
    `npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|meteorology" | head -30`

    Nombre attendu de tests RED : environ 20 tests, tous en FAIL (les stubs retournent 0 et 'low').
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npm test -- --reporter=verbose 2>&1 | grep -E "meteorologyEngine|FAIL|138" | head -20</automated>
  </verify>

  <acceptance_criteria>
    - `src/tests/meteorologyEngine.test.ts` contient `import { computeMeteorologyAnalysis` depuis `'../lib/meteorologyEngine'`
    - `src/tests/meteorologyEngine.test.ts` contient `describe('classifyWeatherRisk`
    - `src/tests/meteorologyEngine.test.ts` contient `describe('calcCoolingDelta`
    - `npm test` se termine sans erreur de compilation TypeScript
    - `npm test` affiche des tests FAIL sur meteorologyEngine.test.ts (les stubs retournent des valeurs par défaut incorrectes)
    - Les 138 tests préexistants restent GREEN (zéro régression)
  </acceptance_criteria>

  <done>Suite de tests RED créée — les stubs échouent sur les assertions métier, les 138 tests existants restent GREEN.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| module pur → types | Seuls les inputs typés MeteorologyParams sont acceptés |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-10-01 | Tampering | computeMeteorologyAnalysis | mitigate | Guard `params.points.length < 2 → return null` — pattern identique aux moteurs précédents |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npx tsc --noEmit 2>&1 | grep -c "error"   # doit retourner 0
npm test 2>&1 | grep -E "meteorologyEngine|138" | head -10
```
</verification>

<success_criteria>
- src/types/meteorology.ts exporte WeatherRisk, MeteorologyParams, MeteorologyResult
- src/lib/meteorologyEngine.ts exporte 7 fonctions compilables (stubs)
- src/tests/meteorologyEngine.test.ts contient ~20 tests tous RED
- npx tsc --noEmit clean (0 erreur TypeScript)
- Les 138 tests préexistants restent GREEN
</success_criteria>

<output>
Après complétion, créer `.planning/phases/10-impact-meteorologique/10-T01-SUMMARY.md`
</output>

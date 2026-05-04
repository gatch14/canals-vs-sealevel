---
phase: 10-impact-meteorologique
plan: T02
type: tdd
wave: 1
depends_on: [T01]
files_modified:
  - src/lib/meteorologyEngine.ts
autonomous: true
requirements: [METEO-01, METEO-02, METEO-03, METEO-04, METEO-05]

must_haves:
  truths:
    - "Les 7 stubs de meteorologyEngine.ts sont remplacés par des implémentations complètes"
    - "Tous les tests meteorologyEngine.test.ts passent GREEN"
    - "Les 138 tests préexistants restent GREEN (zéro régression)"
    - "npx tsc --noEmit se termine sans erreur TypeScript"
    - "calcEvaporation retourne surfaceKm2 * [0.5, 2.0] * aridityFactor / 1000 — jamais des valeurs ponctuelles"
    - "calcCoolingDelta retourne des valeurs négatives avec [0] < [1] < 0"
    - "classifyWeatherRisk suit exactement les critères locked CONTEXT.md"
  artifacts:
    - path: "src/lib/meteorologyEngine.ts"
      provides: "7 fonctions pures complètes + computeMeteorologyAnalysis orchestrateur"
      contains: "booleanIntersects"
      exports: ["calcAridityFactor", "calcEvaporation", "calcInfluenceRadius", "calcInducedPrecipitation", "calcCoolingDelta", "classifyWeatherRisk", "computeMeteorologyAnalysis"]
  key_links:
    - from: "src/lib/meteorologyEngine.ts"
      to: "src/data/desertZones.geojson"
      via: "import + booleanIntersects dans calcAridityFactor"
      pattern: "booleanIntersects"
    - from: "src/lib/meteorologyEngine.ts"
      to: "src/types/meteorology.ts"
      via: "import type MeteorologyParams, MeteorologyResult, WeatherRisk"
      pattern: "from '../types/meteorology'"
---

<objective>
Remplacer les stubs T01 par l'implémentation complète des 7 fonctions pures de meteorologyEngine.ts pour passer tous les tests RED en GREEN.

Purpose: C'est la phase GREEN du cycle TDD. Aucun nouveau test n'est écrit — on implémente exactement ce que les tests T01 attendent. Les formules suivent les décisions locked de CONTEXT.md.

Output: meteorologyEngine.ts entièrement fonctionnel — ~20 tests GREEN + 138 tests préexistants GREEN.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/10-impact-meteorologique/10-CONTEXT.md
@.planning/phases/10-impact-meteorologique/10-RESEARCH.md
@.planning/phases/10-impact-meteorologique/10-PATTERNS.md
@.planning/phases/10-impact-meteorologique/10-T01-SUMMARY.md

<interfaces>
<!-- Contrats établis en T01. À respecter impérativement. -->

Depuis src/types/meteorology.ts (créé en T01) :
```typescript
export type WeatherRisk = 'low' | 'moderate' | 'high'

export interface MeteorologyParams {
  lengthKm: number
  widthM: number   // largeur en mètres — ATTENTION : diviser par 1000 pour km
  points: Coord[]
}

export interface MeteorologyResult {
  evaporationKm3: Interval     // [min, max] km³/an — positif
  influenceRadiusKm: Interval  // [min, max] km — positif
  precipitationMmY: Interval   // [min, max] mm/an — positif
  coolingDeltaC: Interval      // [min, max] °C — NÉGATIF, [0] < [1] < 0
  weatherRisk: WeatherRisk
}
```

Formules locked (CONTEXT.md + RESEARCH.md) :
- surfaceKm2 = (widthM / 1000) × lengthKm
- evaporationKm3 = [surfaceKm2 × 0.5 × aridityFactor / 1000, surfaceKm2 × 2.0 × aridityFactor / 1000]
- calcAridityFactor : 1.0 si booleanIntersects avec desertZones, 0.4 sinon
- influenceRadiusKm : [50 × aridityFactor × scale, 150 × aridityFactor × scale] où scale = min(1 + lengthKm/5000, 3.0)
- precipitationMmY : [evapKm3[0] × 0.20 × (1+aridityFactor), evapKm3[1] × 0.40 × (1+aridityFactor)]
- coolingDeltaC : [-2.0 × aridityFactor × base, -0.5 × aridityFactor × base] où base = min(surfaceKm2/1000, 1.0)
- classifyWeatherRisk : isHumid (< 0.5) OU < 500 km → 'low' ; isDesert (≥ 1.0) ET > 1500 km → 'high' ; sinon 'moderate'
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Implémenter meteorologyEngine.ts — tous les tests GREEN</name>
  <files>src/lib/meteorologyEngine.ts</files>

  <read_first>
    - src/lib/meteorologyEngine.ts — stubs actuels à remplacer (lire entièrement avant d'écrire)
    - src/tests/meteorologyEngine.test.ts — tests RED créés en T01 (comprendre exactement ce qui est attendu)
    - src/lib/desalinationEngine.ts — modèle de structure (booleanIntersects pattern, guards, Interval)
    - .planning/phases/10-impact-meteorologique/10-RESEARCH.md — Pattern 1 (formules complètes)
  </read_first>

  <behavior>
    Comportements attendus après implémentation (GREEN) :

    calcAridityFactor([[5.0, 25.0], [9.0, 21.0]], DESERT_FEATURES) → 1.0
    calcAridityFactor([[2.35, 48.85], [13.4, 52.5]], DESERT_FEATURES) → 0.4
    calcAridityFactor([[5.0, 25.0]], DESERT_FEATURES) → 0.4 (guard < 2 points)

    calcEvaporation(0, 1.0) → [0, 0]
    calcEvaporation(100, 1.0) → [min > 0, max > min]
    calcEvaporation(100, 0.4)[1] < calcEvaporation(100, 1.0)[1]

    calcInfluenceRadius(1000, 1.0)[0] >= 50
    calcInfluenceRadius(1000, 0.4)[1] < calcInfluenceRadius(1000, 1.0)[1]

    calcInducedPrecipitation([0, 0], 1.0) → [0, 0]
    calcInducedPrecipitation([0.1, 0.5], 1.0) → [min > 0, max > min]

    calcCoolingDelta(0, 1.0) → [0, 0]
    calcCoolingDelta(100, 1.0)[0] < 0 (négatif)
    calcCoolingDelta(100, 1.0)[1] < 0 (négatif)
    calcCoolingDelta(100, 1.0)[0] < calcCoolingDelta(100, 1.0)[1] ([0] plus négatif)

    classifyWeatherRisk(400, 1.0) → 'low'
    classifyWeatherRisk(2000, 1.0) → 'high'
    classifyWeatherRisk(1000, 0.7) → 'moderate'
    classifyWeatherRisk(2000, 0.4) → 'low'
    classifyWeatherRisk(500, 0.7) → 'moderate'

    computeMeteorologyAnalysis({points:[p]}, ...) → null (guard)
    computeMeteorologyAnalysis({lengthKm:1000, widthM:50, points:[[5,25],[9,21]]}, DESERT_FEATURES)
      → { evaporationKm3[0]>0, influenceRadiusKm[0]>0, coolingDeltaC[0]<0, weatherRisk:'high' }
  </behavior>

  <action>
    Remplacer le contenu intégral de src/lib/meteorologyEngine.ts par l'implémentation complète suivante.
    Ne pas modifier src/tests/meteorologyEngine.test.ts — les tests restent tels quels.

    ```typescript
    // src/lib/meteorologyEngine.ts
    // Moteur météorologique Phase 10 — pur TypeScript, sans React, sans Zustand.
    // Même pattern que desalinationEngine.ts : fonctions pures, intervalles [min, max], Turf.js.
    import { booleanIntersects, lineString } from '@turf/turf'
    import type { FeatureCollection } from 'geojson'
    import type { Coord } from '../types/canal'
    import type { Interval } from '../types/calculation'
    import type { MeteorologyParams, MeteorologyResult, WeatherRisk } from '../types/meteorology'

    // ─── Facteur d'aridité ────────────────────────────────────────────────────────

    /**
     * Retourne 1.0 si le tracé intersecte une zone désertique (desertZones.geojson),
     * 0.4 sinon (zone humide / tempérée).
     * Même pattern que classifyEcosystem dans desalinationEngine.ts.
     */
    export function calcAridityFactor(
      points: Coord[],
      desertFeatures: FeatureCollection,
    ): number {
      if (points.length < 2) return 0.4

      const line = lineString(points)

      for (const feature of desertFeatures.features) {
        if (booleanIntersects(line, feature)) return 1.0
      }

      return 0.4
    }

    // ─── METEO-01 : Évaporation annuelle ─────────────────────────────────────────

    /**
     * Calcule le volume d'évaporation annuel [min, max] km³/an.
     * Formule : surfaceKm2 × [0.5, 2.0] m/an × aridityFactor → km³/an (÷ 1000)
     * UX-01 : intervalle [min, max] — jamais valeur ponctuelle.
     */
    export function calcEvaporation(
      surfaceKm2: number,
      aridityFactor: number,
    ): Interval {
      if (surfaceKm2 === 0) return [0, 0]
      const rateMin = 0.5 * aridityFactor  // m/an
      const rateMax = 2.0 * aridityFactor  // m/an
      return [
        (surfaceKm2 * rateMin) / 1000,  // km³/an
        (surfaceKm2 * rateMax) / 1000,  // km³/an
      ]
    }

    // ─── METEO-02 : Rayon d'influence climatique ──────────────────────────────────

    /**
     * Calcule le rayon d'influence climatique [min, max] km.
     * Heuristique : [50, 150] km × aridityFactor × scale
     * scale = min(1 + lengthKm/5000, 3.0) — croît avec la longueur, plafonné à 3.
     * UX-01 : intervalle [min, max].
     */
    export function calcInfluenceRadius(
      lengthKm: number,
      aridityFactor: number,
    ): Interval {
      const scale = Math.min(1.0 + lengthKm / 5000, 3.0)
      return [
        50 * aridityFactor * scale,
        150 * aridityFactor * scale,
      ]
    }

    // ─── METEO-03 : Précipitations induites ───────────────────────────────────────

    /**
     * Calcule les précipitations supplémentaires induites [min, max] mm/an.
     * 20–40% de l'évaporation retombe selon aridité — facteur (1 + aridityFactor) amplifie en zone aride.
     * UX-01 : intervalle [min, max].
     */
    export function calcInducedPrecipitation(
      evapKm3: Interval,
      aridityFactor: number,
    ): Interval {
      if (evapKm3[0] === 0 && evapKm3[1] === 0) return [0, 0]
      const pMin = 0.20 * (1 + aridityFactor)
      const pMax = 0.40 * (1 + aridityFactor)
      return [
        evapKm3[0] * pMin * 1e6,  // km³ → mm/an (approximatif sur zone influence)
        evapKm3[1] * pMax * 1e6,
      ]
    }

    // ─── METEO-04 : Refroidissement local ─────────────────────────────────────────

    /**
     * Calcule le refroidissement local par évapotranspiration [min, max] °C.
     * Convention : valeurs NÉGATIVES — [0] est le refroidissement maximum (plus négatif),
     *              [1] est le refroidissement minimum (moins négatif).
     * Formule : [-2.0 × aridityFactor × base, -0.5 × aridityFactor × base]
     * base = min(surfaceKm2 / 1000, 1.0) — plafonné pour éviter des ΔT extrêmes.
     * UX-01 : intervalle [min, max].
     */
    export function calcCoolingDelta(
      surfaceKm2: number,
      aridityFactor: number,
    ): Interval {
      if (surfaceKm2 === 0) return [0, 0]
      const base = Math.min(surfaceKm2 / 1000, 1.0)
      return [
        -2.0 * aridityFactor * base,  // refroidissement max (plus négatif)
        -0.5 * aridityFactor * base,  // refroidissement min (moins négatif)
      ]
    }

    // ─── METEO-05 : Indice de risque météorologique ───────────────────────────────

    /**
     * Classifie le risque météorologique selon les critères locked CONTEXT.md :
     * - 'low'      : zone humide (aridityFactor < 0.5) OU canal < 500 km
     * - 'high'     : zone désertique (aridityFactor >= 1.0) ET longueur > 1500 km
     * - 'moderate' : tous les autres cas
     */
    export function classifyWeatherRisk(
      lengthKm: number,
      aridityFactor: number,
    ): WeatherRisk {
      const isHumid = aridityFactor < 0.5
      const isDesert = aridityFactor >= 1.0

      if (isHumid || lengthKm < 500) return 'low'
      if (isDesert && lengthKm > 1500) return 'high'
      return 'moderate'
    }

    // ─── Orchestrateur principal ──────────────────────────────────────────────────

    /**
     * Calcule le résultat complet de l'analyse météorologique pour un canal.
     * Retourne null si moins de 2 points (guard entrée invalide).
     * widthM (mètres) → surfaceKm2 : diviser par 1000 avant multiplication (Pitfall 4 RESEARCH.md).
     */
    export function computeMeteorologyAnalysis(
      params: MeteorologyParams,
      desertFeatures: FeatureCollection,
    ): MeteorologyResult | null {
      if (params.points.length < 2) return null

      const aridityFactor = calcAridityFactor(params.points, desertFeatures)
      const surfaceKm2 = (params.widthM / 1000) * params.lengthKm  // ATTENTION: widthM en m → km

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

    Après écriture, vérifier que tous les tests passent :
    `npm test -- --reporter=verbose 2>&1 | grep -E "meteorologyEngine|passed|failed" | head -30`

    Tous les tests meteorologyEngine.test.ts doivent être GREEN.
    Les 138 tests préexistants doivent rester GREEN.
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npm test 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - `src/lib/meteorologyEngine.ts` contient `export function computeMeteorologyAnalysis(`
    - `src/lib/meteorologyEngine.ts` contient `booleanIntersects(line, feature)` (implémentation réelle, pas stub)
    - `src/lib/meteorologyEngine.ts` contient `surfaceKm2 = (params.widthM / 1000) * params.lengthKm` (conversion m→km)
    - `src/lib/meteorologyEngine.ts` contient `-2.0 * aridityFactor` (coolingDelta négatif)
    - `src/lib/meteorologyEngine.ts` contient `if (isHumid || lengthKm < 500) return 'low'`
    - `src/lib/meteorologyEngine.ts` contient `if (isDesert && lengthKm > 1500) return 'high'`
    - `npm test` affiche 0 failing (tous les tests GREEN)
    - La sortie de `npm test` contient un total de tests >= 158 (138 existants + ~20 nouveaux)
    - `npx tsc --noEmit` se termine sans erreur TypeScript
  </acceptance_criteria>

  <done>meteorologyEngine.ts entièrement implémenté — tous les tests (existants + nouveaux) GREEN, TypeScript clean.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| MeteorologyParams → engine | widthM en mètres — division par 1000 obligatoire avant calcul surface |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-10-02 | Tampering | computeMeteorologyAnalysis | mitigate | Guard `params.points.length < 2 → return null` — empêche lineString sur tableau vide |
| T-10-03 | Tampering | calcCoolingDelta | accept | Valeur surfaceKm2 = 0 retourne [0, 0] — comportement cohérent avec les autres fonctions |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npm test 2>&1 | tail -5
npx tsc --noEmit 2>&1 | grep -c "error"   # doit retourner 0
```
</verification>

<success_criteria>
- meteorologyEngine.ts remplace les stubs T01 par des implémentations complètes
- Tous les tests meteorologyEngine.test.ts passent GREEN (METEO-01 à METEO-05)
- Les 138 tests préexistants restent GREEN (zéro régression)
- npx tsc --noEmit clean
</success_criteria>

<output>
Après complétion, créer `.planning/phases/10-impact-meteorologique/10-T02-SUMMARY.md`
</output>

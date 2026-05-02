---
phase: 12-roi-break-even
plan: T02
type: tdd
wave: 1
depends_on: [T01]
files_modified:
  - src/lib/roiEngine.ts
autonomous: true
requirements:
  - ROI-01
  - ROI-02
  - ROI-03
  - ROI-04

must_haves:
  truths:
    - "Toutes les 20+ assertions de roiEngine.test.ts passent (GREEN)"
    - "calcTotalAnnualValue somme les 5 co-produits en M€/an avec normalisation € → M€"
    - "calcTotalCost additionne costMEur + desalinationCostEur/1_000_000 (unités correctes)"
    - "calcBreakEven retourne [Infinity, Infinity] si annualValue[0] <= 0"
    - "calcBreakEven : breakEven[0] = costMin/annualMax, breakEven[1] = costMax/annualMin"
    - "calcCumulativeRoi retourne valeurs négatives avant break-even"
    - "computeRoiAnalysis retourne null si costMEur = [0, 0]"
    - "calcAllCanalsRoi omet les canaux sans canal.elevation et trie par breakEvenYears[0]"
    - "roiEngine.ts ne contient aucun import React/Zustand (moteur pur)"
    - "npx tsc --noEmit sort 0"
  artifacts:
    - path: "src/lib/roiEngine.ts"
      provides: "4 fonctions pures implémentées + orchestrateur computeRoiAnalysis + calcAllCanalsRoi"
      exports: ["WATER_PRICE_MIN", "WATER_PRICE_MAX", "calcTotalAnnualValue", "calcTotalCost", "calcBreakEven", "calcCumulativeRoi", "computeRoiAnalysis", "calcAllCanalsRoi"]
      min_lines: 100
  key_links:
    - from: "src/lib/roiEngine.ts"
      to: "src/lib/calculationEngine.ts"
      via: "import computeCalculation (calcAllCanalsRoi)"
      pattern: "import.*computeCalculation.*calculationEngine"
    - from: "src/lib/roiEngine.ts"
      to: "src/lib/desalinationEngine.ts"
      via: "import computeDesalinationAnalysis + calcSolarFactor (calcAllCanalsRoi)"
      pattern: "import.*computeDesalinationAnalysis.*desalinationEngine"
    - from: "src/lib/roiEngine.ts"
      to: "src/lib/circularEngine.ts"
      via: "import computeCircularAnalysis (calcAllCanalsRoi)"
      pattern: "import.*computeCircularAnalysis.*circularEngine"
---

<objective>
Wave 1 TDD — Implémenter toutes les fonctions de roiEngine.ts pour faire passer les 20+ tests de RED à GREEN.

Purpose: Transformer les stubs en calculs financiers réels. Chaque fonction implémente une exigence métier avec normalisation d'unités stricte (M€ canonique), arithmétique d'intervalles correcte (inversion min/max pour les divisions), et guards division par zéro.

Output: src/lib/roiEngine.ts entièrement implémenté, npm run test -- roiEngine 100% GREEN.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/12-roi-break-even/12-CONTEXT.md
@.planning/phases/12-roi-break-even/12-RESEARCH.md
@.planning/phases/12-roi-break-even/12-T01-SUMMARY.md

<interfaces>
<!-- Formules locked (CONTEXT.md) — à utiliser exactement telles quelles -->

### ROI-01 : Valeur annuelle totale (unité canonique : M€/an)
```
// Conversion systématique : tout en M€/an avant addition
totalAnnualValue[0] = (
  waterProduction[0] * 365 * WATER_PRICE_MIN / 1_000_000   // m³/j × j/an × €/m³ / 1e6
  + saltValue[0] / 1_000_000                                // €/an → M€/an
  + spirulineValue[0] / 1_000_000                           // €/an → M€/an
  + aquacultureValue[0] / 1_000_000                         // €/an → M€/an
  + mineralsValue[0] / 1_000_000                            // €/an → M€/an
)
totalAnnualValue[1] = (
  waterProduction[1] * 365 * WATER_PRICE_MAX / 1_000_000
  + saltValue[1] / 1_000_000
  + spirulineValue[1] / 1_000_000
  + aquacultureValue[1] / 1_000_000
  + mineralsValue[1] / 1_000_000
)
```

### ROI-04 : Coût total consolidé (M€)
```
totalCost[0] = costMEur[0] + desalinationCostEur[0] / 1_000_000
totalCost[1] = costMEur[1] + desalinationCostEur[1] / 1_000_000
```

### ROI-03 : Break-even (inversion min/max — règle division intervalles positifs)
```
// Guard obligatoire
if (annualValue[0] <= 0) return [Infinity, Infinity]
// Optimiste = costMin / annualMax (break-even le plus court)
breakEven[0] = totalCost[0] / annualValue[1]
// Pessimiste = costMax / annualMin (break-even le plus long)
breakEven[1] = totalCost[1] / annualValue[0]
```

### ROI-02 : ROI cumulé % à N années (inversion min/max)
```
// Guard
if (totalCost[0] <= 0) return [0, 0]
// Pessimiste : revenus min sur coût max
roiN[0] = (annualValue[0] * N - totalCost[1]) / totalCost[1] * 100
// Optimiste : revenus max sur coût min
roiN[1] = (annualValue[1] * N - totalCost[0]) / totalCost[0] * 100
```

### calcAllCanalsRoi — chaîne d'appels par canal
```typescript
// Pour chaque canal avec canal.elevation défini :
1. computeCalculation(canal, canal.elevation, calcParams.width, calcParams.depth)
   → CalculationResult | null (costMEur en M€)
   Si null → skip ce canal

2. calcSolarFactor(canal.points) + turf.length(lineString(canal.points), 'kilometers')
3. computeDesalinationAnalysis({ lengthKm, points, solarFactor }, desertFeatures)
   → DesalinationResult | null (desalinationCost en €, waterProduction en m³/j)
   Si null → desalResult = { nodes: 0, desalinationCost: [0,0], waterProduction: [0,0], saltValue: [0,0], habitableZones: [0,0] }

4. Si desalResult.nodes > 0 :
   computeCircularAnalysis({ nodes, habitableZones, saltValue, waterProduction, points, lengthKm }, desertFeatures)
   → CircularResult | null
   Si null → circResult = { spirulineValue:[0,0], aquacultureValue:[0,0], mineralsValue:[0,0] }

5. Construire RoiParams + appeler computeRoiAnalysis(roiParams)
   Si null → skip

6. Construire RoiSummary et ajouter au tableau

7. Trier par breakEvenYears[0] croissant
```

From src/lib/calculationEngine.ts:
```typescript
export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null
```

From src/lib/desalinationEngine.ts:
```typescript
export function computeDesalinationAnalysis(
  params: DesalinationParams,  // { lengthKm, points, solarFactor }
  desertFeatures: FeatureCollection,
): DesalinationResult | null

export function calcSolarFactor(points: Coord[]): number
```

From src/lib/circularEngine.ts:
```typescript
export function computeCircularAnalysis(
  params: CircularParams,
  desertFeatures: FeatureCollection,
): CircularResult | null
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Implémenter les 6 fonctions de roiEngine.ts — tests GREEN</name>
  <files>src/lib/roiEngine.ts</files>

  <read_first>
    - src/lib/roiEngine.ts (stubs actuels créés en T01)
    - src/tests/roiEngine.test.ts (tests RED — définissent le comportement attendu)
    - src/lib/circularEngine.ts (pattern implémentation à reproduire)
    - src/lib/calculationEngine.ts (computeCalculation + addIntervals à importer)
    - src/lib/desalinationEngine.ts (computeDesalinationAnalysis + calcSolarFactor)
    - src/types/canal.ts (type Canal avec elevation?: ElevationProfile)
    - .planning/phases/12-roi-break-even/12-RESEARCH.md (Pitfall P1 unités, Pitfall P2 inversion min/max)
  </read_first>

  <action>
Remplacer entièrement `src/lib/roiEngine.ts` avec l'implémentation complète. Cycle RED→GREEN : lancer les tests après chaque fonction.

```typescript
// src/lib/roiEngine.ts
// Moteur ROI & Break-even Phase 12 — pur TypeScript, sans React, sans Zustand.
// Même pattern que circularEngine.ts : fonctions pures exportées individuellement.
// Unité canonique interne : M€ pour tous les calculs (CONTEXT.md D-00).
import { length, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { RoiParams, RoiResult, RoiSummary } from '../types/roi'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'
import { computeCalculation } from './calculationEngine'
import { computeDesalinationAnalysis, calcSolarFactor } from './desalinationEngine'
import { computeCircularAnalysis } from './circularEngine'

// ─── Constantes prix eau dessalée (zone aride) [ASSUMED] ─────────────────────

/** Prix eau dessalée minimum (usage agricole, zones arides) — €/m³ [ASSUMED] */
export const WATER_PRICE_MIN = 0.5

/** Prix eau dessalée maximum (usage potable/industriel, zones arides) — €/m³ [ASSUMED] */
export const WATER_PRICE_MAX = 2.0

// ─── ROI-01 : Valeur annuelle totale ─────────────────────────────────────────

/**
 * Calcule la valeur économique totale annuelle en M€/an — somme des 5 co-produits.
 * Normalisation critique (Pitfall P1 RESEARCH.md) :
 *   - waterProduction × 365 × WATER_PRICE / 1_000_000  (m³/j → M€/an)
 *   - saltValue / 1_000_000                              (€/an → M€/an)
 *   - spirulineValue / 1_000_000                         (€/an → M€/an)
 *   - aquacultureValue / 1_000_000                       (€/an → M€/an)
 *   - mineralsValue / 1_000_000                          (€/an → M€/an)
 * Pas de double comptage : saltValue = NaCl, mineralsValue = Mg/K/Ca (produits distincts).
 */
export function calcTotalAnnualValue(params: RoiParams): Interval {
  const waterMin =
    (params.waterProductionM3PerDay[0] * 365 * WATER_PRICE_MIN) / 1_000_000
  const waterMax =
    (params.waterProductionM3PerDay[1] * 365 * WATER_PRICE_MAX) / 1_000_000

  const totalMin =
    waterMin +
    params.saltValueEurPerYear[0] / 1_000_000 +
    params.spirulineValueEurPerYear[0] / 1_000_000 +
    params.aquacultureValueEurPerYear[0] / 1_000_000 +
    params.mineralsValueEurPerYear[0] / 1_000_000

  const totalMax =
    waterMax +
    params.saltValueEurPerYear[1] / 1_000_000 +
    params.spirulineValueEurPerYear[1] / 1_000_000 +
    params.aquacultureValueEurPerYear[1] / 1_000_000 +
    params.mineralsValueEurPerYear[1] / 1_000_000

  return [totalMin, totalMax]
}

// ─── ROI-04 : Coût total consolidé ────────────────────────────────────────────

/**
 * Calcule le coût total consolidé en M€ — construction + dessalement.
 * Normalisation critique (Pitfall P1) :
 *   costMEur est en M€ (COST_PER_KM = [1, 5] M€/km dans calculationEngine).
 *   desalinationCostEur est en € (nodes × [50_000_000, 150_000_000] €).
 *   → diviser desalinationCostEur par 1_000_000 avant addition.
 */
export function calcTotalCost(params: RoiParams): Interval {
  const desalMin = params.desalinationCostEur[0] / 1_000_000
  const desalMax = params.desalinationCostEur[1] / 1_000_000

  return [
    params.costMEur[0] + desalMin,
    params.costMEur[1] + desalMax,
  ]
}

// ─── ROI-03 : Break-even ──────────────────────────────────────────────────────

/**
 * Calcule le break-even en années.
 * Règle arithmétique intervalles positifs (Pitfall P2 RESEARCH.md) :
 *   Pour a/b avec a,b > 0 : min(a/b) = min(a)/max(b), max(a/b) = max(a)/min(b).
 *   breakEven[0] = costMin / annualMax  (optimiste — break-even le plus court)
 *   breakEven[1] = costMax / annualMin  (pessimiste — break-even le plus long)
 * Guard division par zéro : [Infinity, Infinity] si annualValue[0] <= 0.
 */
export function calcBreakEven(
  totalCostMEur: Interval,
  annualValueMEur: Interval,
): Interval {
  if (annualValueMEur[0] <= 0) return [Infinity, Infinity]
  return [
    totalCostMEur[0] / annualValueMEur[1], // optimiste
    totalCostMEur[1] / annualValueMEur[0], // pessimiste
  ]
}

// ─── ROI-02 : ROI cumulé % ───────────────────────────────────────────────────

/**
 * Calcule le ROI cumulé % à N années.
 * Formule standard analyse coût-bénéfice infrastructure (CBA publique) :
 *   ROI% = (revenus_nets - coût_total) / coût_total × 100
 * Valeurs négatives avant break-even = comportement intentionnel (indicateur visuel).
 * Inversion min/max (même logique que calcBreakEven) :
 *   roiN[0] = pessimiste (revenus min, coût max)
 *   roiN[1] = optimiste  (revenus max, coût min)
 * Guard : [0, 0] si totalCost[0] <= 0.
 */
export function calcCumulativeRoi(
  annualValueMEur: Interval,
  totalCostMEur: Interval,
  years: number,
): Interval {
  if (totalCostMEur[0] <= 0) return [0, 0]
  const roiMin =
    ((annualValueMEur[0] * years - totalCostMEur[1]) / totalCostMEur[1]) * 100
  const roiMax =
    ((annualValueMEur[1] * years - totalCostMEur[0]) / totalCostMEur[0]) * 100
  return [roiMin, roiMax]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/**
 * Calcule le résultat ROI complet pour un ensemble de RoiParams.
 * Retourne null si costMEur = [0, 0] (coût de construction inconnu → ROI non calculable).
 * Horizons 25/50/100 ans locked (ROI-02 requirements — ne pas plafonner à lifespanYears).
 */
export function computeRoiAnalysis(params: RoiParams): RoiResult | null {
  // Guard : pas de ROI sans coût de construction connu
  if (params.costMEur[0] === 0 && params.costMEur[1] === 0) return null

  const totalAnnualValueMEur = calcTotalAnnualValue(params)
  const totalCostMEur = calcTotalCost(params)
  const breakEvenYears = calcBreakEven(totalCostMEur, totalAnnualValueMEur)
  const roi25 = calcCumulativeRoi(totalAnnualValueMEur, totalCostMEur, 25)
  const roi50 = calcCumulativeRoi(totalAnnualValueMEur, totalCostMEur, 50)
  const roi100 = calcCumulativeRoi(totalAnnualValueMEur, totalCostMEur, 100)

  return {
    totalAnnualValueMEur,
    totalCostMEur,
    breakEvenYears,
    roi25,
    roi50,
    roi100,
  }
}

// ─── ROI-04 : Tableau comparatif multi-canaux ────────────────────────────────

/**
 * Calcule le ROI de tous les canaux ayant un profil d'élévation.
 * Retourne un tableau trié par breakEvenYears[0] croissant.
 *
 * Règles :
 * - Canaux sans canal.elevation : omis (computeCalculation retourne null sans profil)
 * - Dessalement inactif ou canal < 500 km : desalResult dégradé (waterProduction/saltValue = [0,0])
 * - Circular inactif (nodes = 0) : circularValues à [0,0]
 * - [Infinity, Infinity] triés en dernier naturellement (Infinity - X > 0)
 */
export function calcAllCanalsRoi(
  canals: Canal[],
  calcParams: CalcParams,
  desertFeatures: FeatureCollection,
): RoiSummary[] {
  const summaries: RoiSummary[] = []

  for (const canal of canals) {
    // Guard Pitfall P4 : canal sans profil d'élévation → omettre
    if (!canal.elevation) continue

    // Étape 1 : coût construction via calculationEngine
    const calcResult = computeCalculation(
      canal,
      canal.elevation,
      calcParams.width,
      calcParams.depth,
    )
    if (!calcResult) continue

    // Étape 2 : dessalement
    const line = lineString(canal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(canal.points)
    const desalResult = computeDesalinationAnalysis(
      { lengthKm, points: canal.points, solarFactor },
      desertFeatures,
    )

    const desal = desalResult ?? {
      nodes: 0,
      desalinationCost: [0, 0] as Interval,
      waterProduction: [0, 0] as Interval,
      saltValue: [0, 0] as Interval,
      habitableZones: [0, 0] as Interval,
    }

    // Étape 3 : économie circulaire (seulement si nodes > 0)
    let spirulineValue: Interval = [0, 0]
    let aquacultureValue: Interval = [0, 0]
    let mineralsValue: Interval = [0, 0]

    if (desal.nodes > 0) {
      const circResult = computeCircularAnalysis(
        {
          nodes: desal.nodes,
          habitableZones: desal.habitableZones,
          saltValue: desal.saltValue,
          waterProduction: desal.waterProduction,
          points: canal.points,
          lengthKm,
        },
        desertFeatures,
      )
      if (circResult) {
        spirulineValue = circResult.spirulineValue
        aquacultureValue = circResult.aquacultureValue
        mineralsValue = circResult.mineralsValue
      }
    }

    // Étape 4 : ROI
    const roiParams: RoiParams = {
      costMEur: calcResult.costMEur,
      desalinationCostEur: desal.desalinationCost,
      waterProductionM3PerDay: desal.waterProduction,
      saltValueEurPerYear: desal.saltValue,
      spirulineValueEurPerYear: spirulineValue,
      aquacultureValueEurPerYear: aquacultureValue,
      mineralsValueEurPerYear: mineralsValue,
    }

    const roiResult = computeRoiAnalysis(roiParams)
    if (!roiResult) continue

    summaries.push({
      canalId: canal.id,
      canalName: canal.name,
      totalCostMEur: roiResult.totalCostMEur,
      totalAnnualValueMEur: roiResult.totalAnnualValueMEur,
      breakEvenYears: roiResult.breakEvenYears,
      roi25: roiResult.roi25,
      roi50: roiResult.roi50,
      roi100: roiResult.roi100,
    })
  }

  // Tri par breakEvenYears[0] croissant — Infinity naturellement en dernier
  return summaries.sort((a, b) => a.breakEvenYears[0] - b.breakEvenYears[0])
}
```

Cycle RED→GREEN : lancer `npm run test -- roiEngine` après chaque fonction pour confirmer le passage progressif.
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npm run test -- roiEngine 2>&1 | tail -30</automated>
  </verify>

  <done>
    roiEngine.ts entièrement implémenté avec les 6 fonctions.
    20+ tests GREEN. Aucune dépendance React/Zustand.
    Unités normalisées : desalinationCost / 1_000_000 avant addition.
    Break-even avec inversion min/max correcte.
    calcAllCanalsRoi omet les canaux sans élévation, trie par breakEvenYears[0].
    npx tsc --noEmit sort 0.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Paramètres entrants → fonctions pures | RoiParams construits depuis résultats engines amont déjà validés |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-T02-01 | Tampering | calcBreakEven input | accept | Guard `annualValue[0] <= 0` protège contre division par zéro et valeurs négatives |
| T-12-T02-02 | Information Disclosure | Valeurs M€ très grandes en mémoire JS | accept | App 100% client-side, pas de transmission réseau — formatage Phase 13 UI |
| T-12-T02-03 | Denial of Service | calcAllCanalsRoi — itération N canaux | accept | Usage solo développeur, N < 100 canaux max — calcul synchrone acceptable |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npm run test -- roiEngine
npx tsc --noEmit
```

Attendu : 20+ tests PASS, 0 failures, exit code 0.
</verification>

<success_criteria>
- roiEngine.ts implémente les 6 fonctions avec formules locked CONTEXT.md
- 20+ tests GREEN (aucun test RED restant)
- Normalisation unités : desalinationCostEur / 1_000_000, valeurs circulaires / 1_000_000
- Break-even : inversion min/max pour division d'intervalles positifs
- calcAllCanalsRoi : omet canaux sans élévation, trie par breakEvenYears[0]
- Zéro import React/Zustand dans roiEngine.ts
- npx tsc --noEmit sort 0
</success_criteria>

<output>
Après complétion, créer `.planning/phases/12-roi-break-even/12-T02-SUMMARY.md`
</output>

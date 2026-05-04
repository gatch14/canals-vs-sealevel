---
phase: 12-roi-break-even
plan: T01
type: tdd
wave: 0
depends_on: []
files_modified:
  - src/types/roi.ts
  - src/lib/roiEngine.ts
  - src/tests/roiEngine.test.ts
autonomous: true
requirements:
  - ROI-01
  - ROI-02
  - ROI-03
  - ROI-04

must_haves:
  truths:
    - "src/types/roi.ts existe et exporte RoiParams, RoiResult, RoiSummary"
    - "src/lib/roiEngine.ts exporte 4 fonctions stub + computeRoiAnalysis retournant null + calcAllCanalsRoi retournant []"
    - "src/tests/roiEngine.test.ts existe avec 20+ tests qui échouent (RED confirmé)"
    - "npm run test -- roiEngine échoue avec des erreurs sur les stubs (assertions, pas compilation)"
    - "npx tsc --noEmit sort sans erreur — les types sont valides"
  artifacts:
    - path: "src/types/roi.ts"
      provides: "Types RoiParams, RoiResult, RoiSummary"
      exports: ["RoiParams", "RoiResult", "RoiSummary"]
    - path: "src/lib/roiEngine.ts"
      provides: "Stubs retournant [0,0], null, [Infinity,Infinity] et []"
      exports: ["WATER_PRICE_MIN", "WATER_PRICE_MAX", "calcTotalAnnualValue", "calcTotalCost", "calcBreakEven", "calcCumulativeRoi", "computeRoiAnalysis", "calcAllCanalsRoi"]
    - path: "src/tests/roiEngine.test.ts"
      provides: "20+ tests RED couvrant ROI-01 à ROI-04"
  key_links:
    - from: "src/tests/roiEngine.test.ts"
      to: "src/lib/roiEngine.ts"
      via: "import des fonctions stubs"
      pattern: "import.*roiEngine"
    - from: "src/lib/roiEngine.ts"
      to: "src/types/roi.ts"
      via: "import types RoiParams, RoiResult, RoiSummary"
      pattern: "import.*roi"
---

<objective>
Wave 0 TDD — Définir les contrats de types, créer les stubs qui retournent des valeurs nulles/vides, et écrire tous les tests en état RED.

Purpose: Établir les interfaces contractuelles du moteur ROI avant toute implémentation. Les tests RED définissent exactement le comportement attendu — normalisation d'unités (M€/€), inversion min/max pour break-even, guards division par zéro, tri multi-canaux.

Output: 3 fichiers créés — roi.ts (types), roiEngine.ts (stubs), roiEngine.test.ts (tests RED).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/12-roi-break-even/12-CONTEXT.md
@.planning/phases/12-roi-break-even/12-RESEARCH.md

<interfaces>
<!-- Types et patterns extraits du codebase — à réutiliser tels quels -->

From src/types/calculation.ts:
```typescript
export type Interval = [number, number]

export interface CalcParams {
  width: number   // m — défaut 50
  depth: number   // m — défaut 5
}

export interface CalculationResult {
  lengthKm:         Interval   // km ±1%
  volumeKm3:        Interval   // km³
  deltaSLmm:        Interval   // mm
  costMEur:         Interval   // M€ ← COÛT CONSTRUCTION — unité : MILLIONS d'euros
  ipccPercent:      Interval
  terrainBreakdown: TerrainBreakdown
}
```

From src/types/desalination.ts:
```typescript
export interface DesalinationResult {
  nodes: number
  waterProduction: Interval   // m³/jour
  saltValue: Interval         // €/an
  habitableZones: Interval    // km²
  desalinationCost: Interval  // € (PAS M€ — conversion obligatoire)
  ecosystemImpact: EcosystemImpactLevel
}
```

From src/types/circular.ts:
```typescript
export interface CircularResult {
  spirulineTonnes: Interval
  spirulineValue: Interval      // €/an
  aquacultureTonnes: Interval
  aquacultureValue: Interval    // €/an
  mgTonnes: Interval
  kTonnes: Interval
  caTonnes: Interval
  mineralsValue: Interval       // €/an
  arableLandKm2: Interval
  lifespanYears: Interval
  habitabilityYears: Interval
}
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

From src/store/canalStore.ts:
```typescript
// CalcParams importé depuis src/types/calculation.ts
calcParams: CalcParams  // { width: number, depth: number }
desalinationEnabled: boolean
canals: Canal[]
selectedCanalId: string | null
```

From src/types/canal.ts (champ optionnel critique):
```typescript
// Canal.elevation?: ElevationProfile — guard obligatoire dans useROI et calcAllCanalsRoi
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Types RoiParams + RoiResult + RoiSummary dans src/types/roi.ts</name>
  <files>src/types/roi.ts</files>

  <read_first>
    - src/types/calculation.ts (type Interval à importer)
    - src/types/desalination.ts (pattern template — structure interface)
    - .planning/phases/12-roi-break-even/12-RESEARCH.md (section "Types recommandés" — code source exact)
  </read_first>

  <action>
Créer `src/types/roi.ts` avec exactement ces trois interfaces (per CONTEXT.md locked decisions) :

```typescript
// src/types/roi.ts
// Types du moteur ROI & Break-even Phase 12 — ROI-01 à ROI-04
// Toutes les valeurs numériques respectent UX-01 (Interval [min, max])
// Unité canonique interne : M€ (millions d'euros) pour tous les calculs ROI
import type { Interval } from './calculation'

/** Paramètres d'entrée pour le moteur ROI — agrège les résultats des 3 engines amont */
export interface RoiParams {
  /** Coût construction canal [min, max] M€ — from CalculationResult.costMEur */
  costMEur: Interval
  /** Coût infrastructure dessalement [min, max] € — from DesalinationResult.desalinationCost */
  desalinationCostEur: Interval
  /** Production eau douce [min, max] m³/jour — from DesalinationResult.waterProduction */
  waterProductionM3PerDay: Interval
  /** Valeur sels récupérés [min, max] €/an — from DesalinationResult.saltValue */
  saltValueEurPerYear: Interval
  /** Valeur spiruline [min, max] €/an — from CircularResult.spirulineValue */
  spirulineValueEurPerYear: Interval
  /** Valeur aquaculture [min, max] €/an — from CircularResult.aquacultureValue */
  aquacultureValueEurPerYear: Interval
  /** Valeur minéraux [min, max] €/an — from CircularResult.mineralsValue */
  mineralsValueEurPerYear: Interval
}

/** Résultat complet du moteur ROI pour un canal */
export interface RoiResult {
  /** Valeur économique totale annuelle [min, max] M€/an (ROI-01) */
  totalAnnualValueMEur: Interval
  /** Coût total consolidé [min, max] M€ (construction + dessalement) */
  totalCostMEur: Interval
  /** Break-even [min, max] années (ROI-03) — [Infinity, Infinity] si pas de revenus */
  breakEvenYears: Interval
  /** ROI cumulé % à 25 ans [min, max] (ROI-02) */
  roi25: Interval
  /** ROI cumulé % à 50 ans [min, max] (ROI-02) */
  roi50: Interval
  /** ROI cumulé % à 100 ans [min, max] (ROI-02) */
  roi100: Interval
}

/** Résumé ROI d'un canal pour le tableau de comparaison (ROI-04) */
export interface RoiSummary {
  /** Identifiant du canal */
  canalId: string
  /** Nom affiché du canal */
  canalName: string
  /** Coût total consolidé [min, max] M€ */
  totalCostMEur: Interval
  /** Valeur annuelle totale [min, max] M€/an */
  totalAnnualValueMEur: Interval
  /** Break-even [min, max] ans */
  breakEvenYears: Interval
  /** ROI % à 25 ans [min, max] */
  roi25: Interval
  /** ROI % à 50 ans [min, max] */
  roi50: Interval
  /** ROI % à 100 ans [min, max] */
  roi100: Interval
}
```
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>

  <done>
    src/types/roi.ts créé, exportant RoiParams, RoiResult et RoiSummary avec tous les champs requis.
    npx tsc --noEmit sort 0.
  </done>
</task>

<task type="tdd">
  <name>Task 2: Stubs roiEngine.ts + tests RED roiEngine.test.ts</name>
  <files>src/lib/roiEngine.ts, src/tests/roiEngine.test.ts</files>

  <read_first>
    - src/types/roi.ts (types créés à la tâche précédente)
    - src/lib/circularEngine.ts (pattern stub exact — fonctions retournant [0,0] et null)
    - src/tests/circularEngine.test.ts (structure tests — imports, describe blocks, fixtures)
    - src/types/canal.ts (type Canal — pour calcAllCanalsRoi signature)
    - .planning/phases/12-roi-break-even/12-RESEARCH.md (section "Wave T01 — Tests à écrire" + formules)
  </read_first>

  <action>
**Étape 1 — Créer `src/lib/roiEngine.ts` avec stubs :**

```typescript
// src/lib/roiEngine.ts
// Moteur ROI & Break-even Phase 12 — pur TypeScript, sans React, sans Zustand.
// Même pattern que circularEngine.ts : fonctions pures exportées individuellement.
// STUBS Wave 0 — toutes les fonctions retournent [0, 0], null ou [].
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { RoiParams, RoiResult, RoiSummary } from '../types/roi'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'

// ─── Constantes prix eau dessalée (zone aride) [ASSUMED] ─────────────────────
export const WATER_PRICE_MIN = 0.5   // €/m³ (usage agricole conservateur)
export const WATER_PRICE_MAX = 2.0   // €/m³ (usage potable/industriel)

// ─── ROI-01 : Valeur annuelle totale ─────────────────────────────────────────

/** Calcule la valeur économique totale annuelle en M€/an (somme 5 co-produits sans double comptage) */
export function calcTotalAnnualValue(params: RoiParams): Interval {
  return [0, 0]
}

// ─── ROI-04 : Coût total consolidé ────────────────────────────────────────────

/** Calcule le coût total consolidé en M€ (construction + dessalement normalisé) */
export function calcTotalCost(params: RoiParams): Interval {
  return [0, 0]
}

// ─── ROI-03 : Break-even ──────────────────────────────────────────────────────

/** Calcule le break-even en années — inversion min/max obligatoire pour intervalles positifs */
export function calcBreakEven(
  totalCostMEur: Interval,
  annualValueMEur: Interval,
): Interval {
  return [Infinity, Infinity]
}

// ─── ROI-02 : ROI cumulé % ───────────────────────────────────────────────────

/** Calcule le ROI cumulé % à N années — valeurs négatives avant break-even intentionnelles */
export function calcCumulativeRoi(
  annualValueMEur: Interval,
  totalCostMEur: Interval,
  years: number,
): Interval {
  return [0, 0]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/** Calcule le résultat ROI complet — retourne null si costMEur = [0, 0] */
export function computeRoiAnalysis(params: RoiParams): RoiResult | null {
  return null
}

// ─── ROI-04 : Tableau comparatif multi-canaux ────────────────────────────────

/**
 * Calcule le ROI de tous les canaux ayant un profil d'élévation.
 * Canaux sans canal.elevation omis.
 * Trié par breakEvenYears[0] croissant ([Infinity,Infinity] naturellement en dernier).
 */
export function calcAllCanalsRoi(
  canals: Canal[],
  calcParams: CalcParams,
  desertFeatures: FeatureCollection,
): RoiSummary[] {
  return []
}
```

**Étape 2 — Créer `src/tests/roiEngine.test.ts` avec 20+ tests RED :**

```typescript
import { describe, it, expect } from 'vitest'
import {
  WATER_PRICE_MIN,
  WATER_PRICE_MAX,
  calcTotalAnnualValue,
  calcTotalCost,
  calcBreakEven,
  calcCumulativeRoi,
  computeRoiAnalysis,
  calcAllCanalsRoi,
} from '../lib/roiEngine'
import type { RoiParams } from '../types/roi'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ZERO_PARAMS: RoiParams = {
  costMEur: [0, 0],
  desalinationCostEur: [0, 0],
  waterProductionM3PerDay: [0, 0],
  saltValueEurPerYear: [0, 0],
  spirulineValueEurPerYear: [0, 0],
  aquacultureValueEurPerYear: [0, 0],
  mineralsValueEurPerYear: [0, 0],
}

// Canal réaliste 1500 km, 3 nœuds de dessalement
const REALISTIC_PARAMS: RoiParams = {
  costMEur: [1500, 7500],                    // 1500 km × [1, 5] M€/km
  desalinationCostEur: [150_000_000, 450_000_000], // 3 nœuds × [50M, 150M] €
  waterProductionM3PerDay: [24_000, 36_000], // 3 nœuds × 10 000 ±20% m³/j
  saltValueEurPerYear: [50_000, 150_000],    // €/an
  spirulineValueEurPerYear: [200_000, 800_000],
  aquacultureValueEurPerYear: [100_000, 600_000],
  mineralsValueEurPerYear: [80_000, 240_000],
}

const CALC_PARAMS: CalcParams = { width: 50, depth: 5 }

const DESERT_FEATURES = { type: 'FeatureCollection' as const, features: [] }

// ─── calcTotalAnnualValue ─────────────────────────────────────────────────────

describe('calcTotalAnnualValue', () => {
  it('retourne [0, 0] si tous les params sont à zéro', () => {
    expect(calcTotalAnnualValue(ZERO_PARAMS)).toEqual([0, 0])
  })

  it('inclut la valeur eau : waterProduction × 365 × WATER_PRICE en M€/an', () => {
    const params: RoiParams = {
      ...ZERO_PARAMS,
      waterProductionM3PerDay: [1_000_000, 2_000_000], // 1M et 2M m³/j
    }
    const result = calcTotalAnnualValue(params)
    // min = 1_000_000 * 365 * 0.5 / 1_000_000 = 182.5 M€
    // max = 2_000_000 * 365 * 2.0 / 1_000_000 = 1460 M€
    expect(result[0]).toBeCloseTo(182.5, 1)
    expect(result[1]).toBeCloseTo(1460, 0)
  })

  it('convertit saltValue de €/an en M€/an (divise par 1_000_000)', () => {
    const params: RoiParams = {
      ...ZERO_PARAMS,
      saltValueEurPerYear: [500_000, 1_500_000], // 0.5 M€/an à 1.5 M€/an
    }
    const result = calcTotalAnnualValue(params)
    expect(result[0]).toBeCloseTo(0.5, 6)
    expect(result[1]).toBeCloseTo(1.5, 6)
  })

  it('convertit spirulineValue de €/an en M€/an', () => {
    const params: RoiParams = {
      ...ZERO_PARAMS,
      spirulineValueEurPerYear: [2_000_000, 8_000_000],
    }
    const result = calcTotalAnnualValue(params)
    expect(result[0]).toBeCloseTo(2.0, 6)
    expect(result[1]).toBeCloseTo(8.0, 6)
  })

  it('totalAnnualValue[1] > totalAnnualValue[0] pour params réalistes', () => {
    const result = calcTotalAnnualValue(REALISTIC_PARAMS)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('additionne les 5 co-produits sans double comptage', () => {
    const params: RoiParams = {
      ...ZERO_PARAMS,
      saltValueEurPerYear: [1_000_000, 1_000_000],      // 1 M€/an
      spirulineValueEurPerYear: [1_000_000, 1_000_000], // 1 M€/an
      aquacultureValueEurPerYear: [1_000_000, 1_000_000],
      mineralsValueEurPerYear: [1_000_000, 1_000_000],
    }
    const result = calcTotalAnnualValue(params)
    // 4 × 1 M€ = 4 M€ (eau = 0 car waterProduction = 0)
    expect(result[0]).toBeCloseTo(4.0, 6)
  })
})

// ─── calcTotalCost ────────────────────────────────────────────────────────────

describe('calcTotalCost', () => {
  it('retourne costMEur seul si desalinationCostEur = [0, 0]', () => {
    const params: RoiParams = {
      ...ZERO_PARAMS,
      costMEur: [100, 500],
    }
    const result = calcTotalCost(params)
    expect(result[0]).toBeCloseTo(100, 6)
    expect(result[1]).toBeCloseTo(500, 6)
  })

  it('convertit desalinationCostEur de € en M€ avant addition (divise par 1_000_000)', () => {
    const params: RoiParams = {
      ...ZERO_PARAMS,
      costMEur: [100, 500],
      desalinationCostEur: [50_000_000, 150_000_000], // = 50 et 150 M€
    }
    const result = calcTotalCost(params)
    expect(result[0]).toBeCloseTo(150, 6)  // 100 + 50
    expect(result[1]).toBeCloseTo(650, 6)  // 500 + 150
  })

  it('totalCost[1] >= totalCost[0] (intervalle cohérent)', () => {
    const result = calcTotalCost(REALISTIC_PARAMS)
    expect(result[1]).toBeGreaterThanOrEqual(result[0])
  })
})

// ─── calcBreakEven ────────────────────────────────────────────────────────────

describe('calcBreakEven', () => {
  it('retourne [Infinity, Infinity] si annualValue[0] = 0', () => {
    const result = calcBreakEven([100, 500], [0, 0])
    expect(result[0]).toBe(Infinity)
    expect(result[1]).toBe(Infinity)
  })

  it('retourne [Infinity, Infinity] si annualValue[0] <= 0 (négatif)', () => {
    const result = calcBreakEven([100, 500], [-10, 50])
    expect(result[0]).toBe(Infinity)
    expect(result[1]).toBe(Infinity)
  })

  it('min = costMin / annualMax (optimiste)', () => {
    const cost: [number, number] = [100, 200]
    const annual: [number, number] = [10, 20]
    const result = calcBreakEven(cost, annual)
    expect(result[0]).toBeCloseTo(100 / 20, 6) // 5 ans
  })

  it('max = costMax / annualMin (pessimiste)', () => {
    const cost: [number, number] = [100, 200]
    const annual: [number, number] = [10, 20]
    const result = calcBreakEven(cost, annual)
    expect(result[1]).toBeCloseTo(200 / 10, 6) // 20 ans
  })

  it('breakEven[0] <= breakEven[1] (intervalle cohérent)', () => {
    const result = calcBreakEven([1500, 7650], [10, 30])
    expect(result[0]).toBeLessThanOrEqual(result[1])
  })
})

// ─── calcCumulativeRoi ────────────────────────────────────────────────────────

describe('calcCumulativeRoi', () => {
  it('roi100 > roi50 > roi25 quand annualValue > 0', () => {
    const annual: [number, number] = [10, 30]
    const cost: [number, number] = [100, 200]
    const roi25 = calcCumulativeRoi(annual, cost, 25)
    const roi50 = calcCumulativeRoi(annual, cost, 50)
    const roi100 = calcCumulativeRoi(annual, cost, 100)
    // Comparer les valeurs max (optimistes)
    expect(roi100[1]).toBeGreaterThan(roi50[1])
    expect(roi50[1]).toBeGreaterThan(roi25[1])
  })

  it('ROI% < 0 avant break-even (valeurs négatives intentionnelles)', () => {
    // cost = [100, 200], annual = [1, 2] → break-even = [50, 200] ans
    // À 25 ans : (1×25 - 200) / 200 = -87.5% (min)
    const annual: [number, number] = [1, 2]
    const cost: [number, number] = [100, 200]
    const roi25 = calcCumulativeRoi(annual, cost, 25)
    expect(roi25[0]).toBeLessThan(0)
  })

  it('ROI% approche 0 au break-even exact', () => {
    // cost = [100, 100], annual = [10, 10] → break-even = 10 ans
    const annual: [number, number] = [10, 10]
    const cost: [number, number] = [100, 100]
    const roi10 = calcCumulativeRoi(annual, cost, 10)
    expect(roi10[0]).toBeCloseTo(0, 6)
    expect(roi10[1]).toBeCloseTo(0, 6)
  })

  it('retourne [0, 0] si totalCost[0] <= 0 (guard division par zéro)', () => {
    const result = calcCumulativeRoi([10, 20], [0, 0], 25)
    expect(result).toEqual([0, 0])
  })

  it('fourchette [min, max] cohérente : roi[0] <= roi[1]', () => {
    const result = calcCumulativeRoi([10, 30], [100, 200], 50)
    expect(result[0]).toBeLessThanOrEqual(result[1])
  })
})

// ─── computeRoiAnalysis ───────────────────────────────────────────────────────

describe('computeRoiAnalysis', () => {
  it('retourne null si costMEur = [0, 0]', () => {
    expect(computeRoiAnalysis(ZERO_PARAMS)).toBeNull()
  })

  it('retourne RoiResult non-null pour canal réaliste (1500 km, 3 nœuds)', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    expect(result).not.toBeNull()
  })

  it('breakEvenYears[0] <= breakEvenYears[1] pour canal réaliste', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    expect(result!.breakEvenYears[0]).toBeLessThanOrEqual(result!.breakEvenYears[1])
  })

  it('roi100 > roi50 > roi25 (values max) pour canal réaliste', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    expect(result!.roi100[1]).toBeGreaterThan(result!.roi50[1])
    expect(result!.roi50[1]).toBeGreaterThan(result!.roi25[1])
  })

  it('totalCostMEur inclut costMEur + desalinationCostEur convertis en M€', () => {
    const result = computeRoiAnalysis(REALISTIC_PARAMS)
    // 1500 + 150 = 1650 M€ min ; 7500 + 450 = 7950 M€ max
    expect(result!.totalCostMEur[0]).toBeCloseTo(1650, 0)
    expect(result!.totalCostMEur[1]).toBeCloseTo(7950, 0)
  })
})

// ─── calcAllCanalsRoi ─────────────────────────────────────────────────────────

describe('calcAllCanalsRoi', () => {
  const canalWithElevation: Canal = {
    id: 'c1',
    name: 'Canal 1',
    points: [[-5, 30], [10, 25]] as [number, number][],
    elevation: {
      points: [
        { distance: 0, elevation: 100 },
        { distance: 1500, elevation: 100 },
      ],
      source: 'opentopodata',
      fetchedAt: Date.now(),
    },
    elevationLoading: false,
  }

  const canalWithoutElevation: Canal = {
    id: 'c2',
    name: 'Canal 2',
    points: [[0, 35], [15, 30]] as [number, number][],
    elevationLoading: false,
  }

  it('omet les canaux sans profil élévation (canal.elevation = undefined)', () => {
    const result = calcAllCanalsRoi(
      [canalWithElevation, canalWithoutElevation],
      CALC_PARAMS,
      DESERT_FEATURES,
    )
    const ids = result.map((s) => s.canalId)
    expect(ids).not.toContain('c2')
  })

  it('retourne [] si tous les canaux sont sans élévation', () => {
    const result = calcAllCanalsRoi([canalWithoutElevation], CALC_PARAMS, DESERT_FEATURES)
    expect(result).toEqual([])
  })

  it('trie par breakEvenYears[0] croissant', () => {
    // Canal A : break-even très court → en premier
    // Canal B : [Infinity, Infinity] → en dernier
    const result = calcAllCanalsRoi(
      [canalWithElevation],
      CALC_PARAMS,
      DESERT_FEATURES,
    )
    if (result.length >= 2) {
      expect(result[0].breakEvenYears[0]).toBeLessThanOrEqual(result[1].breakEvenYears[0])
    }
    // Test de base : au moins les Infinity vont en dernier
    const allFinite = result.filter((s) => isFinite(s.breakEvenYears[0]))
    const allInfinity = result.filter((s) => !isFinite(s.breakEvenYears[0]))
    allFinite.forEach((s) => {
      const idx = result.indexOf(s)
      allInfinity.forEach((inf) => {
        expect(idx).toBeLessThan(result.indexOf(inf))
      })
    })
  })
})
```

Total : 23+ tests. Vérifier que `npm run test -- roiEngine` échoue (RED confirmé).
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npm run test -- roiEngine 2>&1 | tail -30</automated>
  </verify>

  <done>
    roiEngine.ts créé avec 6 exports stub (calcTotalAnnualValue, calcTotalCost, calcBreakEven, calcCumulativeRoi, computeRoiAnalysis, calcAllCanalsRoi) retournant [0,0]/null/[Infinity,Infinity]/[].
    roiEngine.test.ts créé avec 23+ tests tous en état RED.
    Aucune erreur TypeScript. Phase TDD Wave 0 complète.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Tests → Stubs | Les tests importent des stubs — aucune donnée externe, module de calcul pur |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-T01-01 | Tampering | roiEngine.ts stubs | accept | Wave 0 uniquement — stubs remplacés par implémentation réelle en T02 |
| T-12-T01-02 | Information Disclosure | Valeurs numériques (M€) en mémoire | accept | App 100% client-side, pas de transmission réseau, aucune donnée personnelle |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npx tsc --noEmit
npm run test -- roiEngine
```

RED confirmé : les tests doivent échouer sur les assertions (valeurs [0,0] vs valeurs attendues > 0), pas sur des erreurs de compilation.
</verification>

<success_criteria>
- src/types/roi.ts existe et exporte RoiParams + RoiResult + RoiSummary
- src/lib/roiEngine.ts exporte 6 fonctions stub (zéro import React/Zustand)
- WATER_PRICE_MIN = 0.5 et WATER_PRICE_MAX = 2.0 déclarés et exportés
- src/tests/roiEngine.test.ts contient 20+ tests tous en RED
- npx tsc --noEmit sort 0
</success_criteria>

<output>
Après complétion, créer `.planning/phases/12-roi-break-even/12-T01-SUMMARY.md`
</output>

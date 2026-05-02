---
phase: 11-moteur-economique-circulaire
plan: T01
type: tdd
wave: 0
depends_on: []
files_modified:
  - src/types/circular.ts
  - src/lib/circularEngine.ts
  - src/tests/circularEngine.test.ts
autonomous: true
requirements:
  - CIRC-01
  - CIRC-02
  - CIRC-03
  - CIRC-04
  - VIE-01
  - VIE-02

must_haves:
  truths:
    - "src/types/circular.ts existe et exporte CircularParams et CircularResult"
    - "src/lib/circularEngine.ts exporte 7 fonctions stub + computeCircularAnalysis retournant null"
    - "src/tests/circularEngine.test.ts existe avec 28+ tests qui échouent (RED confirmé)"
    - "npm run test -- circularEngine échoue avec des erreurs sur les stubs (pas des erreurs de compilation)"
    - "npx tsc --noEmit sort sans erreur — les types sont valides"
  artifacts:
    - path: "src/types/circular.ts"
      provides: "Types CircularParams et CircularResult"
      exports: ["CircularParams", "CircularResult"]
    - path: "src/lib/circularEngine.ts"
      provides: "Stubs retournant [0,0] et null"
      exports: ["calcSpirulineProduction", "calcAquacultureProduction", "calcMineralExtraction", "calcArableLand", "calcLifespan", "calcHabitabilityTimeline", "computeCircularAnalysis"]
    - path: "src/tests/circularEngine.test.ts"
      provides: "28+ tests RED couvrant CIRC-01 à CIRC-04 + VIE-01 + VIE-02"
  key_links:
    - from: "src/tests/circularEngine.test.ts"
      to: "src/lib/circularEngine.ts"
      via: "import des fonctions stubs"
      pattern: "import.*circularEngine"
    - from: "src/lib/circularEngine.ts"
      to: "src/types/circular.ts"
      via: "import types CircularParams, CircularResult"
      pattern: "import.*circular"
---

<objective>
Wave 0 TDD — Définir les contrats de types, créer les stubs qui retournent des valeurs nulles/vides, et écrire tous les tests en état RED.

Purpose: Établir les interfaces contractuelles entre le moteur circulaire et ses consommateurs (hook useCircular, Phase 12 roiEngine). Les tests RED définissent le comportement attendu avant toute implémentation.

Output: 3 fichiers créés — circular.ts (types), circularEngine.ts (stubs), circularEngine.test.ts (tests RED).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/11-moteur-economique-circulaire/11-CONTEXT.md
@.planning/phases/11-moteur-economique-circulaire/11-RESEARCH.md

<interfaces>
<!-- Types et patterns extraits du codebase — à réutiliser tels quels -->

From src/types/calculation.ts:
```typescript
export type Interval = [number, number]
```

From src/types/desalination.ts:
```typescript
import type { Coord } from './canal'
import type { Interval } from './calculation'

export interface DesalinationResult {
  nodes: number
  waterProduction: Interval   // m³/jour
  saltValue: Interval         // €/an
  habitableZones: Interval    // km²
  desalinationCost: Interval  // €
  ecosystemImpact: EcosystemImpactLevel
}
```

From src/lib/meteorologyEngine.ts — Pattern orchestrateur:
```typescript
export function computeMeteorologyAnalysis(
  params: MeteorologyParams,
  desertFeatures: FeatureCollection,
): MeteorologyResult | null {
  if (params.points.length < 2) return null
  // ...
}
```

From src/lib/desalinationEngine.ts — Pattern stub guard:
```typescript
export function calcWaterProduction(nodes: number, solarFactor: number): Interval {
  if (nodes === 0) return [0, 0]
  // ...
}
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Types CircularParams + CircularResult dans src/types/circular.ts</name>
  <files>src/types/circular.ts</files>

  <read_first>
    - src/types/desalination.ts (pattern template exact à dupliquer)
    - src/types/calculation.ts (type Interval à importer)
    - src/types/canal.ts (type Coord à importer)
    - .planning/phases/11-moteur-economique-circulaire/11-CONTEXT.md (champs CircularResult locked)
  </read_first>

  <action>
Créer `src/types/circular.ts` avec exactement ces deux interfaces (per CONTEXT.md locked decisions) :

```typescript
// src/types/circular.ts
// Types du moteur économique circulaire Phase 11 — CIRC-01 à CIRC-04, VIE-01, VIE-02
// Toutes les valeurs numériques respectent UX-01 (Interval [min, max])
import type { Coord } from './canal'
import type { Interval } from './calculation'

export interface CircularParams {
  /** Nombre de nœuds de dessalement — depuis DesalinationResult.nodes */
  nodes: number
  /** Zones habitables [min, max] km² — depuis DesalinationResult.habitableZones */
  habitableZones: Interval
  /** Valeur économique sels [min, max] €/an — depuis DesalinationResult.saltValue */
  saltValue: Interval
  /** Production eau douce [min, max] m³/jour — depuis DesalinationResult.waterProduction */
  waterProduction: Interval
  /** Points du tracé [lng, lat] — pour calcAridityFactor (VIE-01) */
  points: Coord[]
  /** Longueur totale du canal (km) — pour calcLifespan (VIE-01) */
  lengthKm: number
}

export interface CircularResult {
  // CIRC-01 : Spiruline
  spirulineTonnes: Interval     // tonnes/an
  spirulineValue: Interval      // €/an  [NB : sans double-l, cohérent avec le reste du code]
  // CIRC-02 : Aquaculture
  aquacultureTonnes: Interval   // tonnes protéines/an
  aquacultureValue: Interval    // €/an
  // CIRC-03 : Minéraux/Engrais
  mgTonnes: Interval            // tonnes Mg/an
  kTonnes: Interval             // tonnes K/an
  caTonnes: Interval            // tonnes Ca/an
  mineralsValue: Interval       // €/an total minéraux
  // CIRC-04 : Surface agricole
  arableLandKm2: Interval       // km²
  // VIE-01 : Durée de vie
  lifespanYears: Interval       // ans
  // VIE-02 : Habitabilité
  habitabilityYears: Interval   // ans
}
```

Remarque : `spirulineValue` (sans double-l) — corriger la faute de frappe qui apparaît dans 11-CONTEXT.md (`spirullineValue` avec double-l) pour cohérence avec les conventions TypeScript du projet.
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>

  <acceptance_criteria>
    - `grep -c "export interface CircularParams" src/types/circular.ts` retourne 1
    - `grep -c "export interface CircularResult" src/types/circular.ts` retourne 1
    - CircularResult contient exactement ces 11 champs : spirulineTonnes, spirulineValue, aquacultureTonnes, aquacultureValue, mgTonnes, kTonnes, caTonnes, mineralsValue, arableLandKm2, lifespanYears, habitabilityYears
    - CircularParams contient : nodes, habitableZones, saltValue, waterProduction, points, lengthKm
    - `npx tsc --noEmit` sort avec code 0 (pas d'erreur de compilation)
  </acceptance_criteria>

  <done>src/types/circular.ts créé, exportant CircularParams et CircularResult avec tous les champs requis. npx tsc --noEmit sort 0.</done>
</task>

<task type="tdd">
  <name>Task 2: Stubs circularEngine.ts + tests RED circularEngine.test.ts</name>
  <files>src/lib/circularEngine.ts, src/tests/circularEngine.test.ts</files>

  <read_first>
    - src/types/circular.ts (types créés à la tâche précédente)
    - src/lib/desalinationEngine.ts (pattern stub exact — fonctions retournant [0,0] et null)
    - src/lib/meteorologyEngine.ts (pattern orchestrateur avec guard null)
    - src/tests/desalinationEngine.test.ts (structure tests — how to import, describe blocks)
    - .planning/phases/11-moteur-economique-circulaire/11-RESEARCH.md (section "Phase Requirements → Test Map" pour la liste des 28+ tests)
  </read_first>

  <action>
**Étape 1 — Créer `src/lib/circularEngine.ts` avec stubs :**

```typescript
// src/lib/circularEngine.ts
// Moteur économique circulaire Phase 11 — pur TypeScript, sans React, sans Zustand.
// Même pattern que desalinationEngine.ts + meteorologyEngine.ts.
// STUBS Wave 0 — toutes les fonctions retournent [0, 0] ou null.
import { booleanIntersects, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { CircularParams, CircularResult } from '../types/circular'

// ─── CIRC-01 : Production spiruline ──────────────────────────────────────────
export function calcSpirulineProduction(
  habitableZones: Interval,
  _solarFactor: number,
): { tonnes: Interval; value: Interval } {
  return { tonnes: [0, 0], value: [0, 0] }
}

// ─── CIRC-02 : Production aquaculture ────────────────────────────────────────
export function calcAquacultureProduction(
  habitableZones: Interval,
): { tonnes: Interval; value: Interval } {
  return { tonnes: [0, 0], value: [0, 0] }
}

// ─── CIRC-03 : Extraction minéraux ────────────────────────────────────────────
export function calcMineralExtraction(
  waterProductionMinDaily: number,
  _solarFactor: number,
): { mgTonnes: Interval; kTonnes: Interval; caTonnes: Interval; value: Interval } {
  return { mgTonnes: [0, 0], kTonnes: [0, 0], caTonnes: [0, 0], value: [0, 0] }
}

// ─── CIRC-04 : Surface agricole ───────────────────────────────────────────────
export function calcArableLand(waterProductionMinDaily: number): Interval {
  return [0, 0]
}

// ─── VIE-01 : Durée de vie ────────────────────────────────────────────────────
export function calcLifespan(
  lengthKm: number,
  aridityFactor: number,
): Interval {
  return [0, 0]
}

// ─── VIE-02 : Timeline habitabilité ──────────────────────────────────────────
export function calcHabitabilityTimeline(
  waterProductionMin: Interval,
  mineralsValue: Interval,
): Interval {
  return [0, 0]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────
export function computeCircularAnalysis(
  params: CircularParams,
  _desertFeatures: FeatureCollection,
): CircularResult | null {
  return null
}
```

**Étape 2 — Créer `src/tests/circularEngine.test.ts` avec 28+ tests RED :**

Structure des describe-blocks (les tests doivent ÉCHOUER avec les stubs) :

```typescript
import { describe, it, expect } from 'vitest'
import {
  calcSpirulineProduction,
  calcAquacultureProduction,
  calcMineralExtraction,
  calcArableLand,
  calcLifespan,
  calcHabitabilityTimeline,
  computeCircularAnalysis,
} from '../lib/circularEngine'

// Fixtures
const ZERO_INTERVAL: [number, number] = [0, 0]
const HABITABLE_ZONES_ZERO: [number, number] = [0, 0]
const HABITABLE_ZONES_1000: [number, number] = [700, 1300]  // 1000 km² ±30%
const WATER_PROD_ZERO: [number, number] = [0, 0]
const WATER_PROD_BASE: [number, number] = [8000, 12000]  // m³/jour ±20% autour de 10 000
const MINERALS_VALUE_BASE: [number, number] = [100, 500]  // €/an nominal pour tests

describe('calcSpirulineProduction', () => {
  it('retourne { tonnes: [0,0], value: [0,0] } si habitableZones est [0,0]', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_ZERO, 1.0)
    expect(result.tonnes).toEqual(ZERO_INTERVAL)
    expect(result.value).toEqual(ZERO_INTERVAL)
  })
  it('retourne tonnes.min > 0 si habitableZones > 0', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.tonnes[0]).toBeGreaterThan(0)
  })
  it('retourne tonnes.max > tonnes.min (fourchette cohérente)', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.tonnes[1]).toBeGreaterThan(result.tonnes[0])
  })
  it('retourne value.min > 0 si habitableZones > 0', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.value[0]).toBeGreaterThan(0)
  })
  it('retourne value.max > value.min (fourchette valeur cohérente)', () => {
    const result = calcSpirulineProduction(HABITABLE_ZONES_1000, 1.0)
    expect(result.value[1]).toBeGreaterThan(result.value[0])
  })
})

describe('calcAquacultureProduction', () => {
  it('retourne { tonnes: [0,0], value: [0,0] } si habitableZones est [0,0]', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_ZERO)
    expect(result.tonnes).toEqual(ZERO_INTERVAL)
    expect(result.value).toEqual(ZERO_INTERVAL)
  })
  it('retourne tonnes.min > 0 si habitableZones > 0', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_1000)
    expect(result.tonnes[0]).toBeGreaterThan(0)
  })
  it('retourne tonnes.max > tonnes.min', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_1000)
    expect(result.tonnes[1]).toBeGreaterThan(result.tonnes[0])
  })
  it('retourne value.max > value.min', () => {
    const result = calcAquacultureProduction(HABITABLE_ZONES_1000)
    expect(result.value[1]).toBeGreaterThan(result.value[0])
  })
})

describe('calcMineralExtraction', () => {
  it('retourne toutes [0,0] si waterProductionMinDaily est 0', () => {
    const result = calcMineralExtraction(0, 1.0)
    expect(result.mgTonnes).toEqual(ZERO_INTERVAL)
    expect(result.kTonnes).toEqual(ZERO_INTERVAL)
    expect(result.caTonnes).toEqual(ZERO_INTERVAL)
    expect(result.value).toEqual(ZERO_INTERVAL)
  })
  it('retourne mgTonnes.min > 0 si waterProductionMinDaily > 0', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.mgTonnes[0]).toBeGreaterThan(0)
  })
  it('mgTonnes > kTonnes (Mg = 0.13% > K = 0.04%)', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.mgTonnes[0]).toBeGreaterThan(result.kTonnes[0])
  })
  it('kTonnes ≈ caTonnes (fractions identiques 0.04%)', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.kTonnes[0]).toBeCloseTo(result.caTonnes[0], 10)
  })
  it('value.min > 0 si waterProductionMinDaily > 0', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.value[0]).toBeGreaterThan(0)
  })
  it('value.max > value.min', () => {
    const result = calcMineralExtraction(8000, 1.0)
    expect(result.value[1]).toBeGreaterThan(result.value[0])
  })
})

describe('calcArableLand', () => {
  it('retourne [0,0] si waterProductionMinDaily est 0', () => {
    expect(calcArableLand(0)).toEqual(ZERO_INTERVAL)
  })
  it('retourne min > 0 si waterProductionMinDaily > 0', () => {
    expect(calcArableLand(8000)[0]).toBeGreaterThan(0)
  })
  it('respecte la fourchette ±30% (max ≈ min × 1.3/0.7)', () => {
    const result = calcArableLand(8000)
    // max/min ≈ 1.3/0.7 ≈ 1.857
    const ratio = result[1] / result[0]
    expect(ratio).toBeCloseTo(1.3 / 0.7, 1)
  })
})

describe('calcLifespan', () => {
  it('retourne min >= 20 pour zone désertique (aridityFactor = 1.0)', () => {
    const result = calcLifespan(1000, 1.0)
    expect(result[0]).toBeGreaterThanOrEqual(20)
  })
  it('retourne max <= 65 pour zone désertique (50 × 1.3)', () => {
    const result = calcLifespan(1000, 1.0)
    expect(result[1]).toBeLessThanOrEqual(65)
  })
  it('zone désertique produit lifespan.min > zone humide lifespan.min', () => {
    const desert = calcLifespan(1000, 1.0)
    const humid = calcLifespan(1000, 0.4)
    expect(desert[0]).toBeGreaterThan(humid[0])
  })
  it('min < max (fourchette valide)', () => {
    const result = calcLifespan(1000, 1.0)
    expect(result[1]).toBeGreaterThan(result[0])
  })
})

describe('calcHabitabilityTimeline', () => {
  it('retourne [5,20] si waterProduction > 0 ET mineralsValue > 0', () => {
    const result = calcHabitabilityTimeline(WATER_PROD_BASE, MINERALS_VALUE_BASE)
    expect(result[0]).toBe(5)
    expect(result[1]).toBe(20)
  })
  it('retourne [20,50] si waterProduction est [0,0]', () => {
    const result = calcHabitabilityTimeline(WATER_PROD_ZERO, MINERALS_VALUE_BASE)
    expect(result[0]).toBe(20)
    expect(result[1]).toBe(50)
  })
  it('retourne [20,50] si mineralsValue est [0,0]', () => {
    const result = calcHabitabilityTimeline(WATER_PROD_BASE, ZERO_INTERVAL)
    expect(result[0]).toBe(20)
    expect(result[1]).toBe(50)
  })
})

describe('computeCircularAnalysis', () => {
  const desertFeaturesMock = { type: 'FeatureCollection' as const, features: [] }
  const baseParams = {
    nodes: 2,
    habitableZones: [700, 1300] as [number, number],
    saltValue: [50000, 150000] as [number, number],
    waterProduction: [8000, 12000] as [number, number],
    points: [[-5, 30], [10, 25]] as [number, number][],
    lengthKm: 1200,
  }

  it('retourne null si nodes === 0', () => {
    expect(computeCircularAnalysis({ ...baseParams, nodes: 0 }, desertFeaturesMock)).toBeNull()
  })

  it('retourne un CircularResult non-null pour canal valide (2 nœuds, 1200 km)', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result).not.toBeNull()
  })

  it('spirulineTonnes.min > 0 pour canal valide', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result!.spirulineTonnes[0]).toBeGreaterThan(0)
  })

  it('arableLandKm2.min > 0 pour canal valide', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result!.arableLandKm2[0]).toBeGreaterThan(0)
  })

  it('lifespanYears.min >= 20', () => {
    const result = computeCircularAnalysis(baseParams, desertFeaturesMock)
    expect(result!.lifespanYears[0]).toBeGreaterThanOrEqual(20)
  })
})
```

Total attendu : 28+ tests. Vérifier que `npm run test -- circularEngine` échoue (RED confirmé).
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npm run test -- circularEngine 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - `grep -c "^export function" src/lib/circularEngine.ts` retourne 7 (calcSpirulineProduction, calcAquacultureProduction, calcMineralExtraction, calcArableLand, calcLifespan, calcHabitabilityTimeline, computeCircularAnalysis)
    - `grep -c "React\|Zustand\|useCanalStore\|useState\|useEffect" src/lib/circularEngine.ts` retourne 0 (moteur pur — zéro dépendance React)
    - Le fichier circularEngine.test.ts contient au moins 28 appels `it(`
    - `npm run test -- circularEngine` se termine avec des échecs (RED) — pas des erreurs TypeScript mais des assertions qui échouent
    - `npx tsc --noEmit` sort avec code 0
  </acceptance_criteria>

  <done>
    circularEngine.ts créé avec 7 stubs retournant [0,0]/null.
    circularEngine.test.ts créé avec 28+ tests tous en état RED.
    Aucune erreur TypeScript. La Phase TDD Wave 0 est complète.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Tests → Stubs | Les tests importent des stubs — aucune donnée externe |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-11-T01-01 | Tampering | circularEngine.ts stubs | accept | Wave 0 uniquement — stubs remplacés par implémentation réelle en T02 |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npx tsc --noEmit
npm run test -- circularEngine
```

RED confirmé : les tests doivent échouer sur les assertions (valeurs [0,0] vs valeurs attendues > 0), pas sur des erreurs de compilation.
</verification>

<success_criteria>
- src/types/circular.ts existe et exporte CircularParams + CircularResult avec 11 champs résultat
- src/lib/circularEngine.ts exporte 7 fonctions stub (zéro import React/Zustand)
- src/tests/circularEngine.test.ts contient 28+ tests tous en RED
- npx tsc --noEmit sort 0
</success_criteria>

<output>
Après complétion, créer `.planning/phases/11-moteur-economique-circulaire/11-T01-SUMMARY.md`
</output>

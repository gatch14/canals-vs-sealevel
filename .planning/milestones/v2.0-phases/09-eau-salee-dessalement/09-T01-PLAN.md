---
phase: 09-eau-salee-dessalement
plan: T01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/types/desalination.ts
  - src/lib/desalinationEngine.ts
  - src/tests/desalinationEngine.test.ts
autonomous: true
requirements: [ECO-05, DESAL-01, DESAL-02, DESAL-03, DESAL-04, DESAL-05]

must_haves:
  truths:
    - "Le type DesalinationResult est exporté depuis src/types/desalination.ts avec tous les champs requis (nodes, waterProduction, saltValue, habitableZones, desalinationCost, ecosystemImpact)"
    - "Le type DesalinationParams est exporté avec lengthKm, points et solarFactor"
    - "desalinationEngine.ts exporte les 6 stubs (classifyEcosystem, calcDesalinationNodes, calcWaterProduction, calcSaltValue, calcHabitableZones, calcDesalinationCost)"
    - "Les tests RED échouent car les stubs ne retournent pas encore les bonnes valeurs"
  artifacts:
    - path: "src/types/desalination.ts"
      provides: "Types DesalinationResult, DesalinationParams, EcosystemImpactLevel"
      exports: [DesalinationResult, DesalinationParams, EcosystemImpactLevel]
    - path: "src/lib/desalinationEngine.ts"
      provides: "Stubs exports des 6 fonctions pures"
      exports: [classifyEcosystem, calcDesalinationNodes, calcWaterProduction, calcSaltValue, calcHabitableZones, calcDesalinationCost]
    - path: "src/tests/desalinationEngine.test.ts"
      provides: "Tests RED couvrant ECO-05 et DESAL-01 à DESAL-05"
      contains: "desalinationEngine"
  key_links:
    - from: "src/types/desalination.ts"
      to: "src/types/calculation.ts"
      via: "import type Interval"
      pattern: "Interval"
    - from: "src/lib/desalinationEngine.ts"
      to: "src/types/desalination.ts"
      via: "import types"
      pattern: "DesalinationResult"
---

<objective>
Définir les types de dessalement, créer les stubs du moteur, et écrire les tests RED qui resteront en échec jusqu'à T02.

Purpose: Contrat de données verrouillé avant l'implémentation — les types DesalinationResult et DesalinationParams définissent les interfaces que T02 implémentera et que T03 consommera. Pattern identique à Phase 8 T01.

Output: src/types/desalination.ts, src/lib/desalinationEngine.ts (stubs), src/tests/desalinationEngine.test.ts (tests RED)
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Types existants à connaître avant d'écrire DesalinationResult -->

From src/types/calculation.ts:
```typescript
export type Interval = [number, number]
export const OCEAN_AREA_DIVISOR = 361.8
```

From src/types/canal.ts:
```typescript
export type Coord = [number, number]  // [lng, lat] WGS84 — JAMAIS [lat, lng]

export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  isRouted?: boolean
}
```

From src/types/ecology.ts:
```typescript
export interface EcologyResult {
  desertIntersection: DesertIntersection | null
  greeningTimeline: Interval | null
  endorheicAlert: EndorheicAlert
  climateRiskFlag: boolean
}
```

From src/lib/ecologyEngine.ts (pattern à dupliquer):
```typescript
// Fonctions pures sans React ni Zustand
export function computeDesertLengthKm(canal, desertPolygon): number
export function analyzeDesertIntersection(canal, desertFeatures): DesertIntersection | null
export function computeEcologyAnalysis(canal: Canal): EcologyResult | null
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Créer src/types/desalination.ts</name>
  <files>src/types/desalination.ts</files>
  <behavior>
    - EcosystemImpactLevel = 'low' | 'neutral' | 'critical' (3 niveaux per D-01 CONTEXT.md)
    - DesalinationParams contient lengthKm: number, points: Coord[], solarFactor: number (0.7 ou 1.0)
    - DesalinationResult.nodes: number — floor(lengthKm/500) per DESAL-01
    - DesalinationResult.waterProduction: Interval — m³/jour (UX-01)
    - DesalinationResult.saltValue: Interval — €/an (UX-01)
    - DesalinationResult.habitableZones: Interval — km² (UX-01)
    - DesalinationResult.desalinationCost: Interval — € (UX-01, DESAL-05 coût s'ajoute au total)
    - DesalinationResult.ecosystemImpact: EcosystemImpactLevel (ECO-05)
  </behavior>
  <action>
Créer src/types/desalination.ts :

```typescript
// src/types/desalination.ts
// Types du moteur dessalement Phase 9 — ECO-05, DESAL-01 à DESAL-05
// Toutes les valeurs numériques respectent UX-01 (Interval [min, max])
import type { Coord } from './canal'
import type { Interval } from './calculation'

// ─── ECO-05 : Classification impact eau salée ─────────────────────────────────

/**
 * Niveau d'impact de l'eau salée selon l'écosystème traversé (ECO-05).
 * - 'low'      : zone désertique aride — impact faible, sol déjà salin
 * - 'neutral'  : zone non-classifiée — impact modéré inconnu
 * - 'critical' : cours d'eau ou zone agricole — alerte rouge obligatoire
 */
export type EcosystemImpactLevel = 'low' | 'neutral' | 'critical'

// ─── Paramètres d'entrée ──────────────────────────────────────────────────────

/** Paramètres pour le calcul des nœuds de dessalement (DESAL-01 à DESAL-05) */
export interface DesalinationParams {
  /** Longueur totale du canal (km) — utilisée pour calcDesalinationNodes */
  lengthKm: number
  /** Points du tracé [lng, lat] WGS84 — utilisés pour latitude heuristique */
  points: Coord[]
  /** Facteur solaire : 1.0 si latitude < 35°N/S, 0.7 sinon */
  solarFactor: number
}

// ─── Résultat du moteur dessalement ──────────────────────────────────────────

/** Résultat complet de l'analyse dessalement pour un canal (DESAL-01 à DESAL-05 + ECO-05) */
export interface DesalinationResult {
  /** Nombre de nœuds de dessalement — floor(lengthKm / 500) (DESAL-01) */
  nodes: number
  /** Volume d'eau douce produit [min, max] m³/jour (DESAL-02, UX-01) */
  waterProduction: Interval
  /** Valeur économique des sels récupérés [min, max] €/an (DESAL-03, UX-01) */
  saltValue: Interval
  /** Superficie zones habitables potentielles [min, max] km² (DESAL-04, UX-01) */
  habitableZones: Interval
  /** Coût infrastructure dessalement [min, max] € (DESAL-05, UX-01) */
  desalinationCost: Interval
  /** Niveau d'impact eau salée selon écosystème traversé (ECO-05) */
  ecosystemImpact: EcosystemImpactLevel
}
```
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -v "^$" | head -20</automated>
  </verify>
  <done>src/types/desalination.ts exportant EcosystemImpactLevel, DesalinationParams et DesalinationResult sans erreur TypeScript</done>
</task>

<task type="tdd">
  <name>Task 2: Créer src/lib/desalinationEngine.ts — stubs exports</name>
  <files>src/lib/desalinationEngine.ts</files>
  <behavior>
    - 6 fonctions exportées : classifyEcosystem, calcDesalinationNodes, calcWaterProduction, calcSaltValue, calcHabitableZones, calcDesalinationCost
    - Chaque stub a la signature correcte (types corrects en entrée et sortie) mais retourne une valeur placeholder
    - classifyEcosystem retourne 'neutral' (stub)
    - calcDesalinationNodes retourne 0 (stub)
    - calcWaterProduction retourne [0, 0] (stub)
    - calcSaltValue retourne [0, 0] (stub)
    - calcHabitableZones retourne [0, 0] (stub)
    - calcDesalinationCost retourne [0, 0] (stub)
    - Pas de dépendances React — module pur testable sans DOM
  </behavior>
  <action>
Créer src/lib/desalinationEngine.ts avec les stubs uniquement :

```typescript
// src/lib/desalinationEngine.ts
// Moteur de dessalement Phase 9 — pur TypeScript, sans React, sans Zustand.
// Wave 0 : stubs RED — T02 implémente les fonctions pour faire passer les tests GREEN.
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'
import type { Interval } from '../types/calculation'
import type { DesalinationParams, DesalinationResult, EcosystemImpactLevel } from '../types/desalination'

// ─── ECO-05 : Classification écosystème ──────────────────────────────────────

/**
 * Classifie le niveau d'impact de l'eau salée selon l'écosystème traversé.
 * - Réutilise desertZones.geojson pour détecter les zones désertiques (low)
 * - Heuristique Turf.js pour cours d'eau/zones agricoles (critical)
 * STUB — retourne 'neutral' en attendant T02
 */
export function classifyEcosystem(
  _points: Coord[],
  _desertFeatures: FeatureCollection,
): EcosystemImpactLevel {
  return 'neutral'
}

// ─── DESAL-01 : Nombre de nœuds ───────────────────────────────────────────────

/**
 * Calcule le nombre de nœuds de dessalement solaires = floor(lengthKm / 500).
 * 1 nœud par tranche de 500 km (D-01 CONTEXT.md).
 * STUB — retourne 0 en attendant T02
 */
export function calcDesalinationNodes(_lengthKm: number): number {
  return 0
}

// ─── DESAL-01+02 : Facteur solaire ────────────────────────────────────────────

/**
 * Heuristique latitude → facteur solaire.
 * < 35°N/S (zones tropicales/désertiques) = 1.0 (fort ensoleillement)
 * >= 35°N/S (zones tempérées) = 0.7
 * STUB — retourne 1.0 en attendant T02
 */
export function calcSolarFactor(_points: Coord[]): number {
  return 1.0
}

// ─── DESAL-02 : Production eau douce ─────────────────────────────────────────

/**
 * Calcule la production d'eau douce [min, max] m³/jour.
 * Base : 10 000 m³/jour par nœud × solarFactor, fourchette ±20%.
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcWaterProduction(
  _nodes: number,
  _solarFactor: number,
): Interval {
  return [0, 0]
}

// ─── DESAL-03 : Valeur économique des sels ────────────────────────────────────

/**
 * Calcule la valeur économique des sels et minéraux [min, max] €/an.
 * Base : salinité 35 g/L × débit annuel × prix NaCl marché (0.05–0.15 €/kg).
 * Fourchette pilotée par prix marché min/max.
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcSaltValue(
  _nodes: number,
  _lengthKm: number,
): Interval {
  return [0, 0]
}

// ─── DESAL-04 : Zones habitables ─────────────────────────────────────────────

/**
 * Calcule la superficie de zones habitables potentielles [min, max] km².
 * Base : 500 km² par nœud (rayon ~12.6 km), fourchette ±30%.
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcHabitableZones(_nodes: number): Interval {
  return [0, 0]
}

// ─── DESAL-05 : Coût infrastructure ──────────────────────────────────────────

/**
 * Calcule le coût d'infrastructure dessalement [min, max] €.
 * Base : 50 M€ à 150 M€ par nœud (D-01 CONTEXT.md).
 * STUB — retourne [0, 0] en attendant T02
 */
export function calcDesalinationCost(_nodes: number): Interval {
  return [0, 0]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/**
 * Calcule le résultat complet de l'analyse dessalement pour un canal.
 * STUB — retourne null si < 2 points, sinon résultat avec valeurs placeholder.
 */
export function computeDesalinationAnalysis(
  params: DesalinationParams,
  desertFeatures: FeatureCollection,
): DesalinationResult | null {
  if (params.points.length < 2) return null

  const nodes = calcDesalinationNodes(params.lengthKm)
  return {
    nodes,
    waterProduction: calcWaterProduction(nodes, params.solarFactor),
    saltValue: calcSaltValue(nodes, params.lengthKm),
    habitableZones: calcHabitableZones(nodes),
    desalinationCost: calcDesalinationCost(nodes),
    ecosystemImpact: classifyEcosystem(params.points, desertFeatures),
  }
}
```
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -v "^$" | head -20</automated>
  </verify>
  <done>src/lib/desalinationEngine.ts exporte les 6 fonctions pures + calcSolarFactor + computeDesalinationAnalysis, TypeScript sans erreur</done>
</task>

<task type="tdd">
  <name>Task 3: Créer src/tests/desalinationEngine.test.ts — tests RED</name>
  <files>src/tests/desalinationEngine.test.ts</files>
  <behavior>
    - Tests RED : ils échouent car les stubs retournent des valeurs placeholder incorrectes
    - Test ECO-05 : classifyEcosystem retourne 'low' pour des points en zone désertique connue
    - Test ECO-05 : classifyEcosystem retourne 'critical' pour des points hors désert (heuristique)
    - Test DESAL-01 : calcDesalinationNodes(1000) === 2, calcDesalinationNodes(499) === 0, calcDesalinationNodes(500) === 1
    - Test DESAL-01 : calcSolarFactor avec points à latitude < 35° retourne 1.0, >= 35° retourne 0.7
    - Test DESAL-02 : calcWaterProduction(2, 1.0) retourne Interval [min > 0, max > min] avec max/min ratio ~1.4
    - Test DESAL-03 : calcSaltValue(2, 1000) retourne Interval [min > 0, max > min]
    - Test DESAL-04 : calcHabitableZones(2) retourne Interval [min > 0, max > min]
    - Test DESAL-05 : calcDesalinationCost(2) retourne Interval [100_000_000, 300_000_000] (50M–150M par nœud × 2)
    - Test DESAL-05 : calcDesalinationCost(0) retourne [0, 0]
    - computeDesalinationAnalysis retourne null si points.length < 2
    - computeDesalinationAnalysis retourne DesalinationResult valide pour un canal de 1200 km
  </behavior>
  <action>
Créer src/tests/desalinationEngine.test.ts :

```typescript
// src/tests/desalinationEngine.test.ts
// Wave 0 — Tests RED. Les stubs retournent [0,0] et 0.
// T02 (Wave 1) implémente les fonctions pour faire passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  classifyEcosystem,
  calcDesalinationNodes,
  calcSolarFactor,
  calcWaterProduction,
  calcSaltValue,
  calcHabitableZones,
  calcDesalinationCost,
  computeDesalinationAnalysis,
} from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

// ─── ECO-05 : Classification écosystème ──────────────────────────────────────

describe('classifyEcosystem — impact eau salée (ECO-05)', () => {
  it('retourne low pour des points en zone désertique (Sahara central)', () => {
    // Points dans le Sahara — desertZones.geojson les couvre
    const saharaPoints: Coord[] = [[5.0, 25.0], [7.0, 23.0], [9.0, 21.0]]
    const result = classifyEcosystem(saharaPoints, DESERT_FEATURES)
    expect(result).toBe('low')
  })

  it('retourne critical ou neutral pour des points hors désert (Europe tempérée)', () => {
    // Points en Europe — hors désert, potentiellement zones agricoles
    const europePoints: Coord[] = [[2.35, 48.85], [4.9, 52.37], [13.4, 52.5]]
    const result = classifyEcosystem(europePoints, DESERT_FEATURES)
    expect(['neutral', 'critical']).toContain(result)
  })

  it('retourne neutral pour des points en zone neutre (haute mer/littoral)', () => {
    // Points en mer — ni désert ni zone agricole
    const seaPoints: Coord[] = [[0.0, 0.0], [10.0, 0.0], [20.0, 0.0]]
    const result = classifyEcosystem(seaPoints, DESERT_FEATURES)
    expect(['neutral', 'low']).toContain(result)
  })
})

// ─── DESAL-01 : Nombre de nœuds ───────────────────────────────────────────────

describe('calcDesalinationNodes — 1 nœud / 500 km (DESAL-01)', () => {
  it('retourne 0 pour un canal de 499 km', () => {
    expect(calcDesalinationNodes(499)).toBe(0)
  })

  it('retourne 1 pour un canal exactement de 500 km', () => {
    expect(calcDesalinationNodes(500)).toBe(1)
  })

  it('retourne 2 pour un canal de 1000 km', () => {
    expect(calcDesalinationNodes(1000)).toBe(2)
  })

  it('retourne 6 pour un canal de 3200 km (Qattara-longueur)', () => {
    expect(calcDesalinationNodes(3200)).toBe(6)
  })

  it('retourne 0 pour un canal de longueur nulle', () => {
    expect(calcDesalinationNodes(0)).toBe(0)
  })
})

// ─── DESAL-01 : Facteur solaire ────────────────────────────────────────────────

describe('calcSolarFactor — heuristique latitude (DESAL-01)', () => {
  it('retourne 1.0 pour des points à latitude < 35°N (zone tropicale)', () => {
    // Sahara : latitude ~25°N
    const tropicalPoints: Coord[] = [[5.0, 25.0], [9.0, 21.0]]
    expect(calcSolarFactor(tropicalPoints)).toBe(1.0)
  })

  it('retourne 0.7 pour des points à latitude >= 35°N (zone tempérée)', () => {
    // Europe : latitude ~48°N
    const temperatePoints: Coord[] = [[2.35, 48.85], [13.4, 52.5]]
    expect(calcSolarFactor(temperatePoints)).toBe(0.7)
  })

  it('retourne 1.0 pour des points à latitude < 35°S (zone tropicale Sud)', () => {
    // Atacama : latitude ~-25°S
    const southTropicalPoints: Coord[] = [[-70.5, -20.0], [-68.5, -22.0]]
    expect(calcSolarFactor(southTropicalPoints)).toBe(1.0)
  })

  it('retourne 1.0 pour un point exactement à 34.9°N', () => {
    const borderPoints: Coord[] = [[35.0, 34.9]]
    expect(calcSolarFactor(borderPoints)).toBe(1.0)
  })

  it('retourne 0.7 pour un point exactement à 35.0°N', () => {
    const borderPoints: Coord[] = [[35.0, 35.0]]
    expect(calcSolarFactor(borderPoints)).toBe(0.7)
  })
})

// ─── DESAL-02 : Production eau douce ─────────────────────────────────────────

describe('calcWaterProduction — m³/jour (DESAL-02)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcWaterProduction(0, 1.0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne un intervalle positif [min > 0, max > min] pour 1 nœud solaire', () => {
    const result = calcWaterProduction(1, 1.0)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('retourne un intervalle proportionnel pour 2 nœuds vs 1 nœud', () => {
    const result1 = calcWaterProduction(1, 1.0)
    const result2 = calcWaterProduction(2, 1.0)
    expect(result2[0]).toBeCloseTo(result1[0] * 2, 0)
    expect(result2[1]).toBeCloseTo(result1[1] * 2, 0)
  })

  it('réduit la production avec solarFactor 0.7 vs 1.0', () => {
    const full = calcWaterProduction(2, 1.0)
    const reduced = calcWaterProduction(2, 0.7)
    expect(reduced[0]).toBeLessThan(full[0])
    expect(reduced[1]).toBeLessThan(full[1])
  })

  it('produit un ratio max/min cohérent (fourchette ~40%)', () => {
    const result = calcWaterProduction(3, 1.0)
    const ratio = result[1] / result[0]
    expect(ratio).toBeGreaterThan(1.2)
    expect(ratio).toBeLessThan(2.0)
  })
})

// ─── DESAL-03 : Valeur des sels ───────────────────────────────────────────────

describe('calcSaltValue — €/an (DESAL-03)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcSaltValue(0, 500)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne un intervalle positif [min > 0, max > min] pour 2 nœuds', () => {
    const result = calcSaltValue(2, 1000)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('augmente avec le nombre de nœuds', () => {
    const result2 = calcSaltValue(2, 1000)
    const result4 = calcSaltValue(4, 2000)
    expect(result4[0]).toBeGreaterThan(result2[0])
  })

  it('produit un ratio max/min cohérent (prix marché NaCl × 3 min)', () => {
    const result = calcSaltValue(2, 1000)
    const ratio = result[1] / result[0]
    expect(ratio).toBeGreaterThan(1.5)
    expect(ratio).toBeLessThan(5.0)
  })
})

// ─── DESAL-04 : Zones habitables ──────────────────────────────────────────────

describe('calcHabitableZones — km² (DESAL-04)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcHabitableZones(0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne un intervalle positif pour 1 nœud', () => {
    const result = calcHabitableZones(1)
    expect(result[0]).toBeGreaterThan(0)
    expect(result[1]).toBeGreaterThan(result[0])
  })

  it('est proportionnel au nombre de nœuds', () => {
    const result1 = calcHabitableZones(1)
    const result3 = calcHabitableZones(3)
    expect(result3[0]).toBeCloseTo(result1[0] * 3, 0)
  })
})

// ─── DESAL-05 : Coût infrastructure ───────────────────────────────────────────

describe('calcDesalinationCost — € (DESAL-05)', () => {
  it('retourne [0, 0] pour 0 nœuds', () => {
    const result = calcDesalinationCost(0)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
  })

  it('retourne [50_000_000, 150_000_000] pour 1 nœud (50M–150M €/nœud)', () => {
    const result = calcDesalinationCost(1)
    expect(result[0]).toBe(50_000_000)
    expect(result[1]).toBe(150_000_000)
  })

  it('retourne [100_000_000, 300_000_000] pour 2 nœuds', () => {
    const result = calcDesalinationCost(2)
    expect(result[0]).toBe(100_000_000)
    expect(result[1]).toBe(300_000_000)
  })
})

// ─── Orchestrateur computeDesalinationAnalysis ────────────────────────────────

describe('computeDesalinationAnalysis — orchestrateur (DESAL-01 à DESAL-05 + ECO-05)', () => {
  it('retourne null si points.length < 2', () => {
    const result = computeDesalinationAnalysis(
      { lengthKm: 500, points: [[5.0, 25.0]], solarFactor: 1.0 },
      DESERT_FEATURES,
    )
    expect(result).toBeNull()
  })

  it('retourne un DesalinationResult valide pour un canal de 1200 km en zone ensoleillée', () => {
    const result = computeDesalinationAnalysis(
      {
        lengthKm: 1200,
        points: [[5.0, 25.0], [9.0, 21.0], [13.0, 18.0]],
        solarFactor: 1.0,
      },
      DESERT_FEATURES,
    )
    expect(result).not.toBeNull()
    expect(result!.nodes).toBe(2)
    expect(result!.waterProduction[0]).toBeGreaterThan(0)
    expect(result!.waterProduction[1]).toBeGreaterThan(result!.waterProduction[0])
    expect(result!.saltValue[0]).toBeGreaterThan(0)
    expect(result!.habitableZones[0]).toBeGreaterThan(0)
    expect(result!.desalinationCost[0]).toBe(100_000_000)
    expect(result!.desalinationCost[1]).toBe(300_000_000)
    expect(['low', 'neutral', 'critical']).toContain(result!.ecosystemImpact)
  })

  it('retourne 0 nœuds et coût [0,0] pour un canal de 300 km', () => {
    const result = computeDesalinationAnalysis(
      {
        lengthKm: 300,
        points: [[5.0, 25.0], [7.0, 23.0]],
        solarFactor: 1.0,
      },
      DESERT_FEATURES,
    )
    expect(result).not.toBeNull()
    expect(result!.nodes).toBe(0)
    expect(result!.desalinationCost[0]).toBe(0)
    expect(result!.desalinationCost[1]).toBe(0)
  })
})
```
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx vitest run src/tests/desalinationEngine.test.ts 2>&1 | tail -25</automated>
  </verify>
  <done>Tests s'exécutent et la majorité échoue (RED attendu) — les stubs retournent 0/[0,0]/'neutral' au lieu des valeurs calculées. TypeScript compile sans erreur.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| desertZones.geojson → classifyEcosystem | Données bundlées locales — pas d'entrée utilisateur |
| DesalinationParams → moteur pur | Paramètres calculés en interne depuis le store — pas d'entrée directe utilisateur |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-09-01 | Tampering | desertZones.geojson | accept | Données bundlées dans le build — modifiable uniquement en dev local, pas de surface d'attaque à runtime |
| T-09-02 | Information Disclosure | DesalinationResult | accept | Estimations scientifiques publiques — aucune donnée sensible exposée |
</threat_model>

<verification>
- `npx tsc --noEmit` passe sans erreur sur src/types/desalination.ts et src/lib/desalinationEngine.ts
- `npx vitest run src/tests/desalinationEngine.test.ts` échoue avec des valeurs incorrectes (RED attendu — stubs retournent 0)
- Les tests existants (107+) ne sont pas affectés : `npx vitest run --reporter=verbose 2>&1 | grep -E "pass|fail"` montre 107+ tests still GREEN
</verification>

<success_criteria>
- EcosystemImpactLevel, DesalinationParams et DesalinationResult définis avec tous les champs requis (UX-01 Interval partout)
- 6 fonctions pures stubées + calcSolarFactor + computeDesalinationAnalysis exportées depuis desalinationEngine.ts
- Tests RED en place — échouent car les stubs retournent des valeurs placeholder incorrectes
- TypeScript compile sans erreur sur les nouveaux fichiers
- 107+ tests existants toujours GREEN
</success_criteria>

<output>
Après completion, créer `.planning/phases/09-eau-salee-dessalement/09-T01-SUMMARY.md`
</output>

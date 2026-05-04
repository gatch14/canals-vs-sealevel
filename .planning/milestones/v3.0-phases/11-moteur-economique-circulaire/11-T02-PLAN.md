---
phase: 11-moteur-economique-circulaire
plan: T02
type: tdd
wave: 1
depends_on: [T01]
files_modified:
  - src/lib/circularEngine.ts
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
    - "Toutes les 28+ assertions de circularEngine.test.ts passent (GREEN)"
    - "calcSpirulineProduction retourne des tonnes > 0 pour habitableZones [700, 1300] km²"
    - "calcAquacultureProduction retourne des tonnes > 0 pour habitableZones > 0"
    - "calcMineralExtraction retourne mgTonnes > kTonnes (proportion 0.13% vs 0.04%)"
    - "calcArableLand respecte la fourchette ±30%"
    - "calcLifespan zone désertique (aridityFactor=1.0) > zone humide (aridityFactor=0.4)"
    - "calcHabitabilityTimeline retourne [5,20] si eau+engrais et [20,50] sinon"
    - "computeCircularAnalysis retourne null si nodes=0 et CircularResult valide sinon"
    - "circularEngine.ts ne contient aucun import React/Zustand (moteur pur)"
    - "npx tsc --noEmit sort 0"
  artifacts:
    - path: "src/lib/circularEngine.ts"
      provides: "7 fonctions pures implémentées + orchestrateur computeCircularAnalysis"
      exports: ["calcSpirulineProduction", "calcAquacultureProduction", "calcMineralExtraction", "calcArableLand", "calcLifespan", "calcHabitabilityTimeline", "computeCircularAnalysis"]
      min_lines: 120
  key_links:
    - from: "src/lib/circularEngine.ts"
      to: "src/lib/meteorologyEngine.ts"
      via: "import calcAridityFactor (réutilisé pour VIE-01)"
      pattern: "import.*calcAridityFactor.*meteorologyEngine"
---

<objective>
Wave 1 TDD — Implémenter toutes les fonctions de circularEngine.ts pour faire passer les 28+ tests de RED à GREEN.

Purpose: Transformer les stubs en calculs scientifiques réels avec les constantes locked dans CONTEXT.md. Chaque fonction implémente exactement une exigence métier (CIRC-01 à CIRC-04, VIE-01, VIE-02).

Output: src/lib/circularEngine.ts entièrement implémenté, npm run test -- circularEngine 100% GREEN.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/11-moteur-economique-circulaire/11-CONTEXT.md
@.planning/phases/11-moteur-economique-circulaire/11-RESEARCH.md
@.planning/phases/11-moteur-economique-circulaire/11-T01-SUMMARY.md

<interfaces>
<!-- Constantes scientifiques locked (CONTEXT.md) — à utiliser telles quelles -->

CIRC-01 Spiruline:
- SPIRULINE_YIELD_MIN = 10   // t/ha/an
- SPIRULINE_YIELD_MAX = 20   // t/ha/an
- SPIRULINE_BASIN_FRACTION = 0.10  // 10% de habitableZones utilisé
- SPIRULINE_PRICE_MIN = 5_000    // €/t
- SPIRULINE_PRICE_MAX = 20_000   // €/t
- Conversion km² → ha : ×100 (1 km² = 100 ha)

CIRC-02 Aquaculture:
- AQUACULTURE_YIELD_MIN = 2   // t protéines/km²/an
- AQUACULTURE_YIELD_MAX = 8   // t protéines/km²/an
- AQUACULTURE_BASIN_FRACTION = 0.30  // 30% de habitableZones
- AQUACULTURE_PRICE_MIN = 2_000  // €/t
- AQUACULTURE_PRICE_MAX = 8_000  // €/t

CIRC-03 Minéraux — depuis waterProductionMinDaily (m³/j):
- BRINE_SALT_CONCENTRATION = 35  // kg NaCl/m³ (salinité océanique)
- MG_FRACTION = 0.0013   // 0.13% de la masse sel
- K_FRACTION  = 0.0004   // 0.04%
- CA_FRACTION = 0.0004   // 0.04%
- MG_PRICE = 200  // €/t
- K_PRICE  = 300  // €/t
- CA_PRICE = 100  // €/t
- NOTE: waterProduction[0] (min daily m³/j) × 365 × 35 kg/m³ → masse sel min (kg)
         waterProduction[1] (max daily m³/j) × 365 × 35 kg/m³ → masse sel max (kg)

CIRC-04 Surface agricole:
- ARABLE_WATER_REQ = 2_000  // m³/km²/an — heuristique d'impact (non agronomique)
- Fourchette ±30% sur le résultat central
- base = waterProductionMinDaily × 365 / 2_000
- min = base × 0.7, max = base × 1.3

VIE-01 Durée de vie:
- LIFESPAN_MIN_BASE = 20  // ans
- LIFESPAN_MAX_BASE = 50  // ans
- LIFESPAN_DESERT_FACTOR = 1.3  // zone désertique (aridityFactor = 1.0)
- LIFESPAN_HUMID_FACTOR  = 0.8  // zone humide (aridityFactor = 0.4)
- Règle : aridityFactor >= 1.0 → multiplier par LIFESPAN_DESERT_FACTOR
           aridityFactor < 0.5  → multiplier par LIFESPAN_HUMID_FACTOR
           sinon → multiplier par 1.0

VIE-02 Habitabilité:
- HABITABILITY_WITH_RESOURCES  = [5, 20]   // ans si eau ET engrais
- HABITABILITY_WITHOUT = [20, 50]  // ans sinon

From src/lib/meteorologyEngine.ts — fonction réutilisable:
```typescript
export function calcAridityFactor(points: Coord[], desertFeatures: FeatureCollection): number
// Retourne 1.0 si le tracé intersecte desertZones.geojson, 0.4 sinon
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Implémenter les 7 fonctions de circularEngine.ts — tests GREEN</name>
  <files>src/lib/circularEngine.ts</files>

  <read_first>
    - src/lib/circularEngine.ts (stubs actuels créés en T01)
    - src/tests/circularEngine.test.ts (tests RED — définissent le comportement attendu)
    - src/lib/meteorologyEngine.ts (calcAridityFactor à importer directement)
    - src/lib/desalinationEngine.ts (patterns guard [0,0] à reproduire)
    - .planning/phases/11-moteur-economique-circulaire/11-RESEARCH.md (section "Calcul minéraux recommandé" — code exemple)
  </read_first>

  <action>
Remplacer entièrement `src/lib/circularEngine.ts` avec l'implémentation complète. Suivre l'ordre RED→GREEN : lancer les tests après chaque fonction pour confirmer le passage.

**Implémentation complète :**

```typescript
// src/lib/circularEngine.ts
// Moteur économique circulaire Phase 11 — pur TypeScript, sans React, sans Zustand.
// Même pattern que desalinationEngine.ts + meteorologyEngine.ts.
import { booleanIntersects, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { Coord } from '../types/canal'
import type { CircularParams, CircularResult } from '../types/circular'
import { calcAridityFactor } from './meteorologyEngine'

// ─── Constantes scientifiques locked (CONTEXT.md) ────────────────────────────

// CIRC-01 : Spiruline
const SPIRULINE_YIELD_MIN = 10        // t/ha/an (outdoor raceway, conservateur)
const SPIRULINE_YIELD_MAX = 20        // t/ha/an
const SPIRULINE_BASIN_FRACTION = 0.10 // 10% du bassin habitable utilisé
const SPIRULINE_PRICE_MIN = 5_000     // €/t (grade alimentaire bulk)
const SPIRULINE_PRICE_MAX = 20_000    // €/t (nutraceutique premium)

// CIRC-02 : Aquaculture
const AQUACULTURE_YIELD_MIN = 2       // t protéines/km²/an (système extensif bassin salin)
const AQUACULTURE_YIELD_MAX = 8       // t protéines/km²/an
const AQUACULTURE_BASIN_FRACTION = 0.30 // 30% du bassin habitable
const AQUACULTURE_PRICE_MIN = 2_000   // €/t
const AQUACULTURE_PRICE_MAX = 8_000   // €/t

// CIRC-03 : Minéraux (brine concentrée 2× salinité océanique = 70 g/L)
const BRINE_SALT_CONCENTRATION = 35   // kg NaCl/m³ (salinité océanique — source eau dessalée)
const MG_FRACTION = 0.0013            // Mg = 0.13% de la masse sel (Springer 2022)
const K_FRACTION  = 0.0004            // K  = 0.04% (ResearchGate)
const CA_FRACTION = 0.0004            // Ca = 0.04% (ResearchGate)
const MG_PRICE = 200                  // €/t MgO/MgCl2 brut (conservateur)
const K_PRICE  = 300                  // €/t KCl (MOP) — FAO 2024
const CA_PRICE = 100                  // €/t CaCl2 brut — conservateur

// CIRC-04 : Surface agricole
// NOTE : 2 000 m³/km²/an = heuristique d'impact (non agronomique).
// Correspond à irrigation très minimale starter crops — ne pas utiliser pour calculs agronomiques.
const ARABLE_WATER_REQ = 2_000        // m³/km²/an (heuristique)

// VIE-01 : Durée de vie
const LIFESPAN_MIN_BASE = 20          // ans (canaux non revêtus — USBR)
const LIFESPAN_MAX_BASE = 50          // ans (béton armé — USBR)
const LIFESPAN_DESERT_FACTOR = 1.3    // dépôts minéraux lents → durée accrue
const LIFESPAN_HUMID_FACTOR  = 0.8    // érosion + sédiments → durée réduite

// VIE-02 : Habitabilité
const HABITABILITY_WITH_RESOURCES: Interval = [5, 20]   // ans avec eau + engrais (Négev historique)
const HABITABILITY_WITHOUT: Interval = [20, 50]          // ans sans eau courante

// ─── CIRC-01 : Production spiruline ──────────────────────────────────────────

/**
 * Calcule la production de spiruline [min, max] tonnes/an et €/an depuis le bassin terminal.
 * Surface utilisée = habitableZones km² × 100 ha/km² × 10% (SPIRULINE_BASIN_FRACTION).
 * Rendement [10, 20] t/ha/an — fourchette conservatrice outdoor raceway subtropical.
 * Prix [5 000, 20 000] €/t — large fourchette marché spiruline bulk vs premium.
 * UX-01 : intervalles [min, max] — jamais valeur ponctuelle.
 */
export function calcSpirulineProduction(
  habitableZones: Interval,
  _solarFactor: number,
): { tonnes: Interval; value: Interval } {
  if (habitableZones[0] === 0 && habitableZones[1] === 0) {
    return { tonnes: [0, 0], value: [0, 0] }
  }

  const surfaceHaMin = habitableZones[0] * 100 * SPIRULINE_BASIN_FRACTION
  const surfaceHaMax = habitableZones[1] * 100 * SPIRULINE_BASIN_FRACTION

  const tonnesMin = surfaceHaMin * SPIRULINE_YIELD_MIN
  const tonnesMax = surfaceHaMax * SPIRULINE_YIELD_MAX

  return {
    tonnes: [tonnesMin, tonnesMax],
    value: [tonnesMin * SPIRULINE_PRICE_MIN, tonnesMax * SPIRULINE_PRICE_MAX],
  }
}

// ─── CIRC-02 : Production aquaculture ────────────────────────────────────────

/**
 * Calcule la production d'aquaculture marine [min, max] tonnes protéines/an et €/an.
 * Surface = habitableZones × AQUACULTURE_BASIN_FRACTION (30%).
 * Rendement [2, 8] t protéines/km²/an — système très extensif bassin salin.
 * UX-01 : intervalles [min, max].
 */
export function calcAquacultureProduction(
  habitableZones: Interval,
): { tonnes: Interval; value: Interval } {
  if (habitableZones[0] === 0 && habitableZones[1] === 0) {
    return { tonnes: [0, 0], value: [0, 0] }
  }

  const surfaceMin = habitableZones[0] * AQUACULTURE_BASIN_FRACTION
  const surfaceMax = habitableZones[1] * AQUACULTURE_BASIN_FRACTION

  const tonnesMin = surfaceMin * AQUACULTURE_YIELD_MIN
  const tonnesMax = surfaceMax * AQUACULTURE_YIELD_MAX

  return {
    tonnes: [tonnesMin, tonnesMax],
    value: [tonnesMin * AQUACULTURE_PRICE_MIN, tonnesMax * AQUACULTURE_PRICE_MAX],
  }
}

// ─── CIRC-03 : Extraction minéraux/engrais ────────────────────────────────────

/**
 * Calcule les tonnes Mg/K/Ca extractibles depuis la saumure [min, max] et €/an.
 * Méthode : reconstituer la masse sel depuis waterProductionMinDaily (m³/j) :
 *   masseSel_kg = waterProduction × 365 j/an × 35 kg/m³
 * Fractions : Mg=0.13%, K=0.04%, Ca=0.04% de la masse sel (saumure concentrée 2×).
 * Prix : Mg=200 €/t, K=300 €/t, Ca=100 €/t (produits bruts, conservateur).
 * NOTE : waterProductionMinDaily = waterProduction[0] (débit plancher m³/j).
 *        waterProductionMaxDaily = waterProduction[1] (débit plafond m³/j).
 */
export function calcMineralExtraction(
  waterProductionMinDaily: number,
  _solarFactor: number,
): { mgTonnes: Interval; kTonnes: Interval; caTonnes: Interval; value: Interval } {
  if (waterProductionMinDaily === 0) {
    return { mgTonnes: [0, 0], kTonnes: [0, 0], caTonnes: [0, 0], value: [0, 0] }
  }

  // Masse sel annuelle (kg) depuis débit plancher
  const saltMassKgMin = waterProductionMinDaily * 365 * BRINE_SALT_CONCENTRATION
  // Fourchette +20% sur le max (cohérent avec ±20% waterProduction)
  const saltMassKgMax = saltMassKgMin * 1.2

  const mgMin = (saltMassKgMin * MG_FRACTION) / 1000  // tonnes/an
  const mgMax = (saltMassKgMax * MG_FRACTION) / 1000
  const kMin  = (saltMassKgMin * K_FRACTION) / 1000
  const kMax  = (saltMassKgMax * K_FRACTION) / 1000
  const caMin = (saltMassKgMin * CA_FRACTION) / 1000
  const caMax = (saltMassKgMax * CA_FRACTION) / 1000

  const valueMin = mgMin * MG_PRICE + kMin * K_PRICE + caMin * CA_PRICE
  const valueMax = mgMax * MG_PRICE + kMax * K_PRICE + caMax * CA_PRICE

  return {
    mgTonnes: [mgMin, mgMax],
    kTonnes:  [kMin, kMax],
    caTonnes: [caMin, caMax],
    value: [valueMin, valueMax],
  }
}

// ─── CIRC-04 : Surface agricole potentielle ───────────────────────────────────

/**
 * Calcule la surface agricole potentielle [min, max] km² créée par l'eau douce dessalée.
 * Formule : waterProductionMinDaily × 365 j/an / ARABLE_WATER_REQ m³/km²/an
 * Fourchette ±30% (CONTEXT.md Claude's Discretion) autour de la valeur centrale.
 * NOTE : ARABLE_WATER_REQ = 2 000 m³/km²/an est une heuristique d'impact, non agronomique.
 */
export function calcArableLand(waterProductionMinDaily: number): Interval {
  if (waterProductionMinDaily === 0) return [0, 0]

  const base = (waterProductionMinDaily * 365) / ARABLE_WATER_REQ
  return [base * 0.7, base * 1.3]
}

// ─── VIE-01 : Durée de vie estimée ────────────────────────────────────────────

/**
 * Calcule la durée de vie estimée du canal [min, max] ans avant entretien majeur.
 * Base : [20, 50] ans (USBR : canaux non revêtus à béton armé).
 * Modulation par aridityFactor :
 *   - aridityFactor >= 1.0 (désert) : × 1.3 (dépôts minéraux lents)
 *   - aridityFactor < 0.5 (humide)  : × 0.8 (érosion, sédiments fluviaux)
 *   - sinon : × 1.0
 */
export function calcLifespan(
  _lengthKm: number,
  aridityFactor: number,
): Interval {
  const factor =
    aridityFactor >= 1.0 ? LIFESPAN_DESERT_FACTOR :
    aridityFactor < 0.5  ? LIFESPAN_HUMID_FACTOR  :
    1.0

  return [
    LIFESPAN_MIN_BASE * factor,
    LIFESPAN_MAX_BASE * factor,
  ]
}

// ─── VIE-02 : Timeline habitabilité ──────────────────────────────────────────

/**
 * Retourne la timeline habitabilité [min, max] ans.
 * [5, 20] ans si eau douce disponible (waterProductionMin > 0) ET engrais (mineralsValue > 0).
 * [20, 50] ans sinon (sol nu, sans eau courante ni intrants).
 * Données empiriques : Négev ~12 ans (1943→1955), zones Arava 5–15 ans.
 */
export function calcHabitabilityTimeline(
  waterProductionMin: Interval,
  mineralsValue: Interval,
): Interval {
  const hasWater    = waterProductionMin[0] > 0
  const hasMinerals = mineralsValue[0] > 0

  return hasWater && hasMinerals
    ? [...HABITABILITY_WITH_RESOURCES]
    : [...HABITABILITY_WITHOUT]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

/**
 * Calcule le résultat complet de l'économie circulaire pour un canal avec dessalement.
 * Retourne null si nodes === 0 (guard : dessalement inactif ou canal trop court).
 * Réutilise calcAridityFactor de meteorologyEngine.ts pour VIE-01.
 */
export function computeCircularAnalysis(
  params: CircularParams,
  desertFeatures: FeatureCollection,
): CircularResult | null {
  if (params.nodes === 0) return null

  const aridityFactor = calcAridityFactor(params.points, desertFeatures)
  const solarFactor = params.points.every(([_lng, lat]) => Math.abs(lat) < 35) ? 1.0 : 0.7

  const spiruline    = calcSpirulineProduction(params.habitableZones, solarFactor)
  const aquaculture  = calcAquacultureProduction(params.habitableZones)
  const minerals     = calcMineralExtraction(params.waterProduction[0], solarFactor)
  const arableLand   = calcArableLand(params.waterProduction[0])
  const lifespan     = calcLifespan(params.lengthKm, aridityFactor)
  const habitability = calcHabitabilityTimeline(params.waterProduction, minerals.value)

  return {
    spirulineTonnes:    spiruline.tonnes,
    spirulineValue:     spiruline.value,
    aquacultureTonnes:  aquaculture.tonnes,
    aquacultureValue:   aquaculture.value,
    mgTonnes:           minerals.mgTonnes,
    kTonnes:            minerals.kTonnes,
    caTonnes:           minerals.caTonnes,
    mineralsValue:      minerals.value,
    arableLandKm2:      arableLand,
    lifespanYears:      lifespan,
    habitabilityYears:  habitability,
  }
}
```

Cycle RED→GREEN : après chaque fonction, lancer `npm run test -- circularEngine` pour confirmer que les tests correspondants passent.
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npm run test -- circularEngine 2>&1 | tail -30</automated>
  </verify>

  <acceptance_criteria>
    - `npm run test -- circularEngine` termine avec 0 failures (100% GREEN)
    - `grep -c "React\|Zustand\|useCanalStore\|useState\|useEffect" src/lib/circularEngine.ts` retourne 0
    - `grep -c "import.*calcAridityFactor.*meteorologyEngine" src/lib/circularEngine.ts` retourne 1 (réutilisation de meteorologyEngine)
    - `grep -c "SPIRULINE_YIELD_MIN\|SPIRULINE_YIELD_MAX\|AQUACULTURE_YIELD" src/lib/circularEngine.ts` retourne au moins 3 (constantes présentes)
    - `grep -c "ARABLE_WATER_REQ = 2_000" src/lib/circularEngine.ts` retourne 1 (heuristique documentée)
    - `npx tsc --noEmit` sort avec code 0
    - Nombre de tests GREEN >= 28
  </acceptance_criteria>

  <done>
    circularEngine.ts entièrement implémenté avec les 7 fonctions.
    28+ tests GREEN. Aucune dépendance React/Zustand.
    calcAridityFactor importé depuis meteorologyEngine (DRY).
    npx tsc --noEmit sort 0.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Paramètres entrants → fonctions pures | params.nodes, params.waterProduction, params.habitableZones proviennent du store déjà validé |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-11-T02-01 | Tampering | calcMineralExtraction input | accept | Entrée waterProductionMinDaily depuis DesalinationResult validé par guard nodes===0 dans l'orchestrateur |
| T-11-T02-02 | Information Disclosure | Valeurs numériques très grandes (milliards €/an) | accept | Côté client uniquement, pas de fuite données — formatage géré Phase 13 |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npm run test -- circularEngine
npx tsc --noEmit
```

Attendu : 28+ tests PASS, 0 failures, exit code 0.
</verification>

<success_criteria>
- circularEngine.ts implémente les 7 fonctions avec les constantes locked
- 28+ tests GREEN (aucun test RED restant)
- Import de calcAridityFactor depuis meteorologyEngine (réutilisation DRY)
- Zéro import React/Zustand dans circularEngine.ts
- npx tsc --noEmit sort 0
</success_criteria>

<output>
Après complétion, créer `.planning/phases/11-moteur-economique-circulaire/11-T02-SUMMARY.md`
</output>

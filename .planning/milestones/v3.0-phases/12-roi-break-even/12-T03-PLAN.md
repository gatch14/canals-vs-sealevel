---
phase: 12-roi-break-even
plan: T03
type: execute
wave: 2
depends_on: [T01, T02]
files_modified:
  - src/hooks/useROI.ts
autonomous: true
requirements:
  - ROI-01
  - ROI-02
  - ROI-03
  - ROI-04

must_haves:
  truths:
    - "src/hooks/useROI.ts existe et exporte useROI()"
    - "useROI retourne RoiResult | null"
    - "useROI retourne null si canal.elevation est undefined"
    - "useROI retourne null si computeCalculation retourne null"
    - "useROI retourne null si le canal sélectionné a < 2 points"
    - "useROI recompute DesalinationResult + CircularResult en interne (sans importer useDesalination ni useCircular)"
    - "useROI utilise useMemo avec dépendances [selectedCanalId, canals, desalinationEnabled, calcParams]"
    - "DESERT_FEATURES déclaré au niveau module (hors useMemo)"
    - "useROI ne garde PAS sur desalinationEnabled (canal sans dessalement a un ROI sur construction seule)"
    - "npx tsc --noEmit sort 0"
  artifacts:
    - path: "src/hooks/useROI.ts"
      provides: "Hook React connectant roiEngine au store Zustand"
      exports: ["useROI"]
      min_lines: 55
  key_links:
    - from: "src/hooks/useROI.ts"
      to: "src/store/canalStore.ts"
      via: "useCanalStore — 4 sélecteurs : selectedCanalId, canals, desalinationEnabled, calcParams"
      pattern: "useCanalStore"
    - from: "src/hooks/useROI.ts"
      to: "src/lib/roiEngine.ts"
      via: "computeRoiAnalysis(roiParams)"
      pattern: "computeRoiAnalysis"
    - from: "src/hooks/useROI.ts"
      to: "src/lib/calculationEngine.ts"
      via: "computeCalculation(canal, canal.elevation, width, depth)"
      pattern: "computeCalculation"
    - from: "src/hooks/useROI.ts"
      to: "src/lib/desalinationEngine.ts"
      via: "computeDesalinationAnalysis + calcSolarFactor (recompute interne — no hook-in-hook)"
      pattern: "computeDesalinationAnalysis"
---

<objective>
Wave 2 — Créer le hook useROI.ts qui connecte le moteur roiEngine au store Zustand.

Purpose: Fournir aux composants React (Phase 13) une interface mémoïsée pour accéder à RoiResult | null. Le hook recalcule DesalinationResult et CircularResult en interne (puisqu'ils ne sont pas dans le store) — exactement comme useCircular.ts le fait, per Pitfall P1 RESEARCH.md.

Différence clé vs useCircular : useROI ne garde PAS sur desalinationEnabled. Un canal sans dessalement a toujours un ROI calculable depuis son seul coût de construction (annualValue = [0,0] → breakEvenYears = [Infinity, Infinity]).

Output: src/hooks/useROI.ts — hook prêt pour consommation par ROIPanel (Phase 13).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/12-roi-break-even/12-CONTEXT.md
@.planning/phases/12-roi-break-even/12-RESEARCH.md
@.planning/phases/12-roi-break-even/12-T02-SUMMARY.md

<interfaces>
<!-- Patterns extraits du codebase — à dupliquer exactement -->

From src/hooks/useCircular.ts (TEMPLATE EXACT à suivre):
```typescript
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import { computeCircularAnalysis } from '../lib/circularEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { CircularResult } from '../types/circular'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection  // NIVEAU MODULE

export function useCircular(): CircularResult | null {
  const selectedCanalId     = useCanalStore((s) => s.selectedCanalId)
  const canals              = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)

  return useMemo<CircularResult | null>(() => {
    if (!desalinationEnabled) return null  // ← useROI N'A PAS ce guard

    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line        = lineString(selectedCanal.points)
    const lengthKm    = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)
    const desalResult = computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )

    if (!desalResult || desalResult.nodes === 0) return null

    const params = { ... }
    return computeCircularAnalysis(params, DESERT_FEATURES)
  }, [selectedCanalId, canals, desalinationEnabled])
}
```

DIFFÉRENCES useROI vs useCircular :
1. Ajoute calcParams dans les sélecteurs (pour computeCalculation)
2. N'a PAS le guard `if (!desalinationEnabled) return null`
3. Guard supplémentaire : `if (!canal.elevation) return null`
4. Appelle computeCalculation(canal, canal.elevation, width, depth) avant desal
5. Guard : `if (!calcResult) return null`
6. Appelle computeRoiAnalysis(roiParams) à la fin (pas computeCircularAnalysis)
7. dépendances useMemo : [selectedCanalId, canals, desalinationEnabled, calcParams]

From src/store/canalStore.ts — state disponible:
```typescript
canals: Canal[]
selectedCanalId: string | null
desalinationEnabled: boolean
calcParams: CalcParams  // { width: number, depth: number }
```

From src/lib/calculationEngine.ts:
```typescript
export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null
// costMEur dans le résultat est en M€
```

From src/lib/roiEngine.ts (créé en T02):
```typescript
export function computeRoiAnalysis(params: RoiParams): RoiResult | null

// RoiParams attendu :
// { costMEur, desalinationCostEur, waterProductionM3PerDay, saltValueEurPerYear,
//   spirulineValueEurPerYear, aquacultureValueEurPerYear, mineralsValueEurPerYear }
```

PITFALL P1 (RESEARCH.md) : desalinationResult et circularResult ne sont PAS dans le store.
  useROI doit importer les fonctions pures et recalculer en interne.
  NE PAS importer useDesalination ou useCircular (interdiction hook-in-hook).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Créer src/hooks/useROI.ts</name>
  <files>src/hooks/useROI.ts</files>

  <read_first>
    - src/hooks/useCircular.ts (TEMPLATE — structure exacte à dupliquer avec les différences listées)
    - src/lib/roiEngine.ts (computeRoiAnalysis + RoiParams signature)
    - src/lib/calculationEngine.ts (computeCalculation signature — widthM/depthM)
    - src/lib/desalinationEngine.ts (computeDesalinationAnalysis + calcSolarFactor)
    - src/lib/circularEngine.ts (computeCircularAnalysis — pour recalcul circulaire interne)
    - src/types/roi.ts (RoiResult à retourner)
    - src/store/canalStore.ts (calcParams: CalcParams confirmé — champs width/depth)
    - src/types/canal.ts (Canal.elevation?: ElevationProfile — champ optionnel)
  </read_first>

  <behavior>
    - useROI() retourne null si canal sélectionné est null ou < 2 points
    - useROI() retourne null si canal.elevation est undefined (pas de profil chargé)
    - useROI() retourne null si computeCalculation retourne null
    - useROI() NE retourne PAS null si desalinationEnabled === false (canal sans dessalement a un ROI)
    - useROI() recompute DesalinationResult en interne (Pitfall P1 — non stocké dans le store)
    - useROI() recompute CircularResult en interne si desalResult.nodes > 0
    - useROI() retourne RoiResult non-null pour canal valide avec profil élévation
    - DESERT_FEATURES déclaré UNE FOIS au niveau module (hors useMemo)
    - useMemo dépend de [selectedCanalId, canals, desalinationEnabled, calcParams]
  </behavior>

  <action>
Créer `src/hooks/useROI.ts` en suivant exactement la structure de useCircular.ts, avec les différences documentées ci-dessus.

```typescript
// src/hooks/useROI.ts
// Hook orchestrateur Phase 12 — lit le canal sélectionné, mémoïse l'analyse ROI.
// Pattern identique à useCircular.ts — useMemo obligatoire (Pitfall P1 RESEARCH.md).
// Architecture :
//   - desalinationResult + circularResult recalculés en interne (Pitfall P1 — pas dans le store)
//   - NE PAS importer useDesalination ou useCircular (interdiction hook-in-hook)
//   - DESERT_FEATURES au niveau module (hors useMemo — Pitfall P5 de useCircular.ts)
//   - Guard canal.elevation obligatoire (Pitfall P3 RESEARCH.md)
//   - PAS de guard !desalinationEnabled : un canal sans dessalement a un ROI sur coût construction
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeCalculation } from '../lib/calculationEngine'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import { computeCircularAnalysis } from '../lib/circularEngine'
import { computeRoiAnalysis } from '../lib/roiEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { RoiResult } from '../types/roi'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useROI(): RoiResult | null {
  const selectedCanalId     = useCanalStore((s) => s.selectedCanalId)
  const canals              = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
  const calcParams          = useCanalStore((s) => s.calcParams)

  return useMemo<RoiResult | null>(() => {
    // Guard 1 : canal sélectionné valide
    const canal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!canal || canal.points.length < 2) return null

    // Guard 2 : profil d'élévation requis pour computeCalculation (Pitfall P3)
    if (!canal.elevation || canal.elevationLoading) return null

    // Étape 1 : coût construction (M€)
    const calcResult = computeCalculation(
      canal,
      canal.elevation,
      calcParams.width,
      calcParams.depth,
    )
    if (!calcResult) return null

    // Étape 2 : dessalement (recalcul interne — Pitfall P1)
    const line        = lineString(canal.points)
    const lengthKm    = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(canal.points)
    const desalResult = computeDesalinationAnalysis(
      { lengthKm, points: canal.points, solarFactor },
      DESERT_FEATURES,
    )

    // Dessalement inactif ou canal trop court → valeurs à zéro (pas de retour null)
    const desal = desalinationEnabled && desalResult
      ? desalResult
      : {
          nodes: 0,
          desalinationCost: [0, 0] as Interval,
          waterProduction: [0, 0] as Interval,
          saltValue: [0, 0] as Interval,
          habitableZones: [0, 0] as Interval,
        }

    // Étape 3 : économie circulaire (recalcul interne — Pitfall P1)
    let spirulineValue: Interval = [0, 0]
    let aquacultureValue: Interval = [0, 0]
    let mineralsValue: Interval = [0, 0]

    if (desalinationEnabled && desal.nodes > 0) {
      const circResult = computeCircularAnalysis(
        {
          nodes: desal.nodes,
          habitableZones: desal.habitableZones,
          saltValue: desal.saltValue,
          waterProduction: desal.waterProduction,
          points: canal.points,
          lengthKm,
        },
        DESERT_FEATURES,
      )
      if (circResult) {
        spirulineValue = circResult.spirulineValue
        aquacultureValue = circResult.aquacultureValue
        mineralsValue = circResult.mineralsValue
      }
    }

    // Étape 4 : ROI (orchestrateur roiEngine)
    return computeRoiAnalysis({
      costMEur: calcResult.costMEur,
      desalinationCostEur: desal.desalinationCost,
      waterProductionM3PerDay: desal.waterProduction,
      saltValueEurPerYear: desal.saltValue,
      spirulineValueEurPerYear: spirulineValue,
      aquacultureValueEurPerYear: aquacultureValue,
      mineralsValueEurPerYear: mineralsValue,
    })
  }, [selectedCanalId, canals, desalinationEnabled, calcParams])
}
```
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 && npm run test 2>&1 | tail -20</automated>
  </verify>

  <done>
    useROI.ts créé, exporte useROI() → RoiResult | null.
    useMemo avec dépendances [selectedCanalId, canals, desalinationEnabled, calcParams].
    DESERT_FEATURES au niveau module.
    Guards : canal valide + canal.elevation + calcResult non-null.
    Pas de guard desalinationEnabled (ROI calculable sans dessalement).
    DesalinationResult + CircularResult recomputed en interne (no hook-in-hook).
    npx tsc --noEmit sort 0. Suite complète GREEN.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Store Zustand → Hook | selectedCanalId, canals, desalinationEnabled, calcParams lus depuis le store — données locales sans surface d'attaque réseau |
| canal.elevation → computeCalculation | Profil d'élévation chargé de manière asynchrone — guard obligatoire avant accès |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-T03-01 | Denial of Service | useMemo recompute en cascade (calcul + desal + circular + roi) | accept | useMemo mémoïse — recalcul uniquement si dépendances changent. Calcul synchrone acceptable pour usage solo client-side. |
| T-12-T03-02 | Information Disclosure | RoiResult exposé en mémoire JS | accept | App 100% client-side, pas de transmission réseau. Aucune donnée personnelle dans RoiResult. |
| T-12-T03-03 | Spoofing | canal.elevation modifié par injection | accept | Données locales uniquement (IndexedDB/Zustand), pas d'entrée réseau dans ce path. |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npx tsc --noEmit
npm run test
```

Attendu : 0 erreurs TypeScript, suite complète GREEN (tests existants maintenus).
</verification>

<success_criteria>
- useROI.ts créé avec useMemo + 3 guards (canal valide, canal.elevation, calcResult non-null)
- PAS de guard sur desalinationEnabled (ROI calculable sans dessalement)
- DesalinationResult + CircularResult recomputed en interne — pas de dépendance inter-hooks
- DESERT_FEATURES au niveau module
- 4 sélecteurs Zustand : selectedCanalId, canals, desalinationEnabled, calcParams
- npx tsc --noEmit sort 0
- npm run test GREEN sans régressions
</success_criteria>

<output>
Après complétion, créer `.planning/phases/12-roi-break-even/12-T03-SUMMARY.md`
</output>

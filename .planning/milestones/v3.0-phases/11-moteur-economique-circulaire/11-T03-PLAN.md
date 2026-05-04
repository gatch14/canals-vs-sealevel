---
phase: 11-moteur-economique-circulaire
plan: T03
type: execute
wave: 2
depends_on: [T01, T02]
files_modified:
  - src/hooks/useCircular.ts
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
    - "src/hooks/useCircular.ts existe et exporte useCircular()"
    - "useCircular retourne CircularResult | null"
    - "useCircular retourne null si !desalinationEnabled"
    - "useCircular retourne null si le canal sélectionné a < 2 points"
    - "useCircular recompute DesalinationResult en interne (sans importer useDesalination)"
    - "useCircular utilise useMemo avec les bonnes dépendances (Pitfall P2)"
    - "DESERT_FEATURES déclaré au niveau module (hors useMemo — Pitfall P5)"
    - "circularEngine.ts n'est PAS modifié dans cette wave"
    - "npx tsc --noEmit sort 0"
  artifacts:
    - path: "src/hooks/useCircular.ts"
      provides: "Hook React connectant circularEngine au store Zustand"
      exports: ["useCircular"]
      min_lines: 35
  key_links:
    - from: "src/hooks/useCircular.ts"
      to: "src/store/canalStore.ts"
      via: "useCanalStore((s) => s.desalinationEnabled)"
      pattern: "desalinationEnabled"
    - from: "src/hooks/useCircular.ts"
      to: "src/lib/circularEngine.ts"
      via: "computeCircularAnalysis(params, DESERT_FEATURES)"
      pattern: "computeCircularAnalysis"
    - from: "src/hooks/useCircular.ts"
      to: "src/lib/desalinationEngine.ts"
      via: "computeDesalinationAnalysis + calcSolarFactor (recompute interne)"
      pattern: "computeDesalinationAnalysis"
---

<objective>
Wave 2 — Créer le hook useCircular.ts qui connecte le moteur circularEngine au store Zustand.

Purpose: Fournir aux composants React (Phase 13) une interface mémoïsée pour accéder à CircularResult | null. Le hook recompute DesalinationResult en interne (puisqu'il n'est pas dans le store) exactement comme useDesalination.ts le fait — per Pitfall P1 RESEARCH.md.

Output: src/hooks/useCircular.ts — hook prêt pour consommation par CircularPanel (Phase 13).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/11-moteur-economique-circulaire/11-CONTEXT.md
@.planning/phases/11-moteur-economique-circulaire/11-RESEARCH.md
@.planning/phases/11-moteur-economique-circulaire/11-T02-SUMMARY.md

<interfaces>
<!-- Patterns extraits du codebase — à dupliquer exactement -->

From src/hooks/useDesalination.ts (TEMPLATE EXACT à suivre):
```typescript
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { DesalinationResult } from '../types/desalination'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection  // NIVEAU MODULE — Pitfall P5

export function useDesalination(): DesalinationResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  return useMemo<DesalinationResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)

    return computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )
  }, [selectedCanalId, canals])
}
```

From src/store/canalStore.ts — state disponible:
```typescript
// Dessalement — Phase 9
desalinationEnabled: boolean
toggleDesalination: () => void
// Canaux
canals: Canal[]
selectedCanalId: string | null
// Calcul
calcParams: CalcParams  // { widthM: number, depthM: number }
```

From src/lib/circularEngine.ts (créé en T02):
```typescript
export function computeCircularAnalysis(
  params: CircularParams,
  desertFeatures: FeatureCollection,
): CircularResult | null

// CircularParams attendu :
// { nodes, habitableZones, saltValue, waterProduction, points, lengthKm }
```

From src/lib/desalinationEngine.ts:
```typescript
export function computeDesalinationAnalysis(
  params: DesalinationParams,  // { lengthKm, points, solarFactor }
  desertFeatures: FeatureCollection,
): DesalinationResult | null

export function calcSolarFactor(points: Coord[]): number
```

PITFALL P1 (RESEARCH.md) : desalinationResult n'est PAS dans le store.
  useCircular doit importer computeDesalinationAnalysis et recalculer en interne.
  NE PAS importer useDesalination (interdiction d'appeler un hook depuis un autre hook).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Créer src/hooks/useCircular.ts</name>
  <files>src/hooks/useCircular.ts</files>

  <read_first>
    - src/hooks/useDesalination.ts (TEMPLATE — dupliquer exactement la structure)
    - src/hooks/useMeteorology.ts (pattern alternatif de référence — confirmer cohérence)
    - src/lib/circularEngine.ts (signature computeCircularAnalysis + CircularParams)
    - src/lib/desalinationEngine.ts (computeDesalinationAnalysis + calcSolarFactor à importer)
    - src/types/circular.ts (CircularResult type à retourner)
    - src/store/canalStore.ts (state disponible : desalinationEnabled, canals, selectedCanalId)
    - .planning/phases/11-moteur-economique-circulaire/11-RESEARCH.md (Pitfall P1, P2, P5)
  </read_first>

  <behavior>
    - useCircular() retourne null si desalinationEnabled === false
    - useCircular() retourne null si selectedCanal est null
    - useCircular() retourne null si selectedCanal.points.length < 2
    - useCircular() retourne null si computeDesalinationAnalysis retourne null (nodes === 0)
    - useCircular() retourne CircularResult non-null pour canal valide avec dessalement actif
    - DESERT_FEATURES est déclaré UNE FOIS au niveau module (hors useMemo)
    - useMemo dépend de [selectedCanalId, canals, desalinationEnabled]
  </behavior>

  <action>
Créer `src/hooks/useCircular.ts` en suivant exactement la structure de useDesalination.ts, avec ces différences :

1. Lire `desalinationEnabled` depuis le store (guard supplémentaire vs useDesalination)
2. Recalculer DesalinationResult en interne via `computeDesalinationAnalysis` (Pitfall P1)
3. Appeler `computeCircularAnalysis` avec les valeurs extraites de DesalinationResult

```typescript
// src/hooks/useCircular.ts
// Hook orchestrateur Phase 11 — connecte circularEngine au store Zustand.
// Pattern identique à useDesalination.ts (useMemo obligatoire — Pitfall P2).
// NOTE P1 : desalinationResult n'est PAS dans le store — recalcul interne requis.
// NOTE P5 : DESERT_FEATURES déclaré au niveau module pour éviter re-parsing.
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import { computeCircularAnalysis } from '../lib/circularEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { CircularResult } from '../types/circular'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useCircular(): CircularResult | null {
  const selectedCanalId    = useCanalStore((s) => s.selectedCanalId)
  const canals             = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)

  return useMemo<CircularResult | null>(() => {
    // Guard 1 : dessalement désactivé → pas d'économie circulaire possible
    if (!desalinationEnabled) return null

    // Guard 2 : canal sélectionné valide
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    // Recalcul interne du DesalinationResult (Pitfall P1 — non stocké dans le store)
    const line      = lineString(selectedCanal.points)
    const lengthKm  = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)
    const desalResult = computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )

    // Guard 3 : dessalement non actif (nodes === 0, canal < 500 km)
    if (!desalResult || desalResult.nodes === 0) return null

    // Construire CircularParams depuis DesalinationResult
    const params = {
      nodes:           desalResult.nodes,
      habitableZones:  desalResult.habitableZones,
      saltValue:       desalResult.saltValue,
      waterProduction: desalResult.waterProduction,
      points:          selectedCanal.points,
      lengthKm,
    }

    return computeCircularAnalysis(params, DESERT_FEATURES)
  }, [selectedCanalId, canals, desalinationEnabled])
}
```
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 && npm run test 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - `grep -c "export function useCircular" src/hooks/useCircular.ts` retourne 1
    - `grep -c "useMemo" src/hooks/useCircular.ts` retourne 1 (un seul useMemo)
    - `grep -c "desalinationEnabled" src/hooks/useCircular.ts` retourne au minimum 2 (lecture store + guard)
    - `grep -c "computeDesalinationAnalysis" src/hooks/useCircular.ts` retourne 1 (recompute interne — Pitfall P1)
    - `grep -c "computeCircularAnalysis" src/hooks/useCircular.ts` retourne 1
    - `grep -c "DESERT_FEATURES = desertZones" src/hooks/useCircular.ts` retourne 1 (niveau module — Pitfall P5)
    - `grep -c "useDesalination\|import.*useDesalination" src/hooks/useCircular.ts` retourne 0 (interdiction hook→hook)
    - `npx tsc --noEmit` sort avec code 0
    - `npm run test` sort sans régressions (166+ tests GREEN existants maintenus)
  </acceptance_criteria>

  <done>
    useCircular.ts créé, exporte useCircular() → CircularResult | null.
    useMemo avec dépendances [selectedCanalId, canals, desalinationEnabled].
    DESERT_FEATURES au niveau module.
    DesalinationResult recomputed en interne (no store dependency — Pitfall P1 évité).
    npx tsc --noEmit sort 0. Suite complète GREEN.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Store Zustand → Hook | selectedCanalId, canals, desalinationEnabled lus depuis le store — données locales non authentifiées mais sans surface d'attaque réseau |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-11-T03-01 | Denial of Service | useMemo recompute en cascade | accept | useMemo mémoïse — recalcul uniquement si dépendances changent. Performance acceptable pour calculs purs client-side. |
| T-11-T03-02 | Information Disclosure | CircularResult exposé en mémoire JS | accept | App 100% client-side, pas de transmission réseau. Aucune donnée personnelle dans CircularResult. |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npx tsc --noEmit
npm run test
```

Attendu : 0 erreurs TypeScript, suite complète GREEN (166+ tests existants + 28+ nouveaux).
</verification>

<success_criteria>
- useCircular.ts créé avec useMemo + 3 guards (desalinationEnabled, canal valide, nodes > 0)
- DesalinationResult recomputed en interne — pas de dépendance inter-hooks
- DESERT_FEATURES au niveau module (Pitfall P5 évité)
- npx tsc --noEmit sort 0
- npm run test GREEN sans régressions
</success_criteria>

<output>
Après complétion, créer `.planning/phases/11-moteur-economique-circulaire/11-T03-SUMMARY.md`
</output>

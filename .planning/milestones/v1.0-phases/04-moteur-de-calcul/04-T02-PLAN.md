---
phase: 04
plan: 02
type: execute
wave: 1
depends_on: [04-01]
files_modified:
  - src/lib/calculationEngine.ts
autonomous: true
requirements: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, UX-01]
tags: [phase-04, calculation-engine, implementation, wave-1, tdd-green]
status: complete
completed_at: 2026-05-01

must_haves:
  truths:
    - "computeLengthInterval(points) retourne ±1% autour de turf.length()"
    - "computeVolume([100,101], [47.5,52.5], [4.5,5.5]) retourne approximativement [0.021375, 0.029164] km³"
    - "computeDeltaSL([V,V]) = [V/361.8, V/361.8] mm — formule centrale Qattara 1000 km³ → ~2.764 mm"
    - "classifyTerrain segmente le profil en plain/mixed/mountain selon seuils 50/200 m/km"
    - "computeCost respecte COST_PER_KM (plain [1,5], mixed [10,50], mountain [100,500])"
    - "computeIPCCPercent retourne ΔSL / 4.5 × 100"
    - "computePartialImpact retourne null si isFullyGravity, sinon stopCoord via turf.along()"
    - "computeCalculation retourne null si profile manquant ou width/depth <= 0"
    - "Aucune fonction ne retourne un number nu — toujours Interval (UX-01 type-safe)"
    - "npm test passe avec 0 erreur sur calculationEngine.test.ts (GREEN total)"
  artifacts:
    - path: "src/lib/calculationEngine.ts"
      provides: "Implémentation complète de toutes les fonctions du moteur"
      contains: "turf.length"
      min_lines: 200
  key_links:
    - from: "src/lib/calculationEngine.ts"
      to: "@turf/turf"
      via: "length, along, lineString"
      pattern: "from '@turf/turf'"
    - from: "src/lib/calculationEngine.ts"
      to: "src/types/calculation.ts"
      via: "import des types et constantes"
      pattern: "from '\\.\\./types/calculation'"
---

<objective>
Implémenter la logique métier complète du moteur de calcul Phase 4. Wave 1 transforme les stubs Wave 0 en code fonctionnel : arithmétique d'intervalles, longueur géodésique via Turf, volume + ΔSL + coût + % IPCC, classification terrain, impact partiel avec turf.along(). À la fin de cette plan, `npm test` passe au vert sur l'intégralité de la suite Phase 4.

Purpose: Livrer une logique pure, testable, sans dépendance React/Zustand/MapLibre. Garantir UX-01 par propagation stricte d'intervalles. Faire passer en GREEN tous les tests RED de T01.

Output: Un seul fichier modifié (`src/lib/calculationEngine.ts`). Aucun nouveau composant, aucune extension store, aucune UI.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-moteur-de-calcul/04-CONTEXT.md
@.planning/phases/04-moteur-de-calcul/04-RESEARCH.md
@.planning/phases/04-moteur-de-calcul/04-VALIDATION.md
@.planning/phases/04-moteur-de-calcul/04-01-SUMMARY.md

@src/types/calculation.ts
@src/types/canal.ts
@src/types/elevation.ts
@src/lib/calculationEngine.ts
@src/tests/calculationEngine.test.ts
@src/services/elevationApi.ts

<interfaces>
<!-- Contrats déjà établis par T01 — implémenter contre ces signatures, ne PAS les modifier -->

From src/types/calculation.ts (T01):
```typescript
export type Interval = [number, number]
export const OCEAN_AREA_DIVISOR = 361.8
export const IPCC_ANNUAL_RATE_MM = 4.5
export const TERRAIN_THRESHOLDS = { plain: 50, mixed: 200 } as const
export const COST_PER_KM: Record<TerrainType, Interval> = {
  plain:    [1,   5],
  mixed:    [10,  50],
  mountain: [100, 500],
}
export const TOLERANCE = { length: 0.01, width: 0.05, depth: 0.10, partialLength: 0.02 } as const
```

Pattern Turf.js déjà utilisé (src/services/elevationApi.ts ligne ~12-23 et src/components/MapView.tsx ligne 176-189) :
```typescript
import { length, along, lineString } from '@turf/turf'
const line = lineString(points)  // points: Coord[] = [lng, lat][]
const km = length(line, { units: 'kilometers' })
const stopPoint = along(line, reachableKm, { units: 'kilometers' })
const [lng, lat] = stopPoint.geometry.coordinates  // Coord [lng, lat]
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implémenter les helpers d'arithmétique d'intervalles + dimensions</name>
  <read_first>
    - src/lib/calculationEngine.ts (stubs Wave 0)
    - src/types/calculation.ts (TOLERANCE)
    - src/tests/calculationEngine.test.ts (cas de test à satisfaire)
    - .planning/phases/04-moteur-de-calcul/04-RESEARCH.md (Pattern 1, Pattern 7)
  </read_first>
  <behavior>
    - mulIntervals([a,b], [c,d]) = [a*c, b*d] pour intervalles positifs
    - addIntervals([a,b], [c,d]) = [a+c, b+d]
    - divByConst([a,b], k) = [a/k, b/k]
    - widthInterval(50) = [47.5, 52.5] (±5%)
    - depthInterval(5) = [4.5, 5.5] (±10%)
    - computeLengthInterval(points) utilise turf.length() puis applique ±1%
  </behavior>
  <action>
Remplacer les stubs des helpers dans `src/lib/calculationEngine.ts`. Conserver toutes les signatures et tous les imports tels que définis en T01.

Implémentations exactes :

```typescript
// ─── Arithmétique d'intervalles ──────────────────────────────────────────────

export function mulIntervals(a: Interval, b: Interval): Interval {
  // Hypothèse : tous nos intervalles sont positifs (longueurs, dimensions, volumes)
  // Pour intervalles positifs strictement : [aMin*bMin, aMax*bMax]
  return [a[0] * b[0], a[1] * b[1]]
}

export function addIntervals(a: Interval, b: Interval): Interval {
  return [a[0] + b[0], a[1] + b[1]]
}

export function divByConst(a: Interval, k: number): Interval {
  // k > 0 attendu (361.8, 4.5...) — pas de protection contre k négatif (hors scope)
  return [a[0] / k, a[1] / k]
}

// ─── Dimensions avec tolérances d'ingénierie (Pattern 7) ─────────────────────

export function widthInterval(widthM: number): Interval {
  return [widthM * (1 - TOLERANCE.width), widthM * (1 + TOLERANCE.width)]
}

export function depthInterval(depthM: number): Interval {
  return [depthM * (1 - TOLERANCE.depth), depthM * (1 + TOLERANCE.depth)]
}

// ─── CALC-01 : Longueur géodésique avec ±1% ──────────────────────────────────

export function computeLengthInterval(points: Coord[]): Interval {
  if (points.length < 2) return [0, 0]
  const line = lineString(points)
  const km = length(line, { units: 'kilometers' })
  return [km * (1 - TOLERANCE.length), km * (1 + TOLERANCE.length)]
}
```

Vérifier après changement :
- `npx vitest run src/tests/calculationEngine.test.ts -t "CALC-01"` doit passer GREEN sur les 4 tests CALC-01
- `npx vitest run src/tests/calculationEngine.test.ts -t "UX-01"` doit toujours passer
  </action>
  <verify>
    <automated>npx vitest run src/tests/calculationEngine.test.ts -t "CALC-01" --reporter=verbose 2>&1 | tee /tmp/t02-task1.txt; PASS=$(grep -cE "✓|PASS" /tmp/t02-task1.txt); FAIL=$(grep -cE "FAIL|✗|×" /tmp/t02-task1.txt); echo "PASS=$PASS FAIL=$FAIL"; if [ "$FAIL" -gt 0 ]; then exit 1; fi</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "return \[a\[0\] \* b\[0\], a\[1\] \* b\[1\]\]" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "TOLERANCE.width" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "TOLERANCE.depth" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "lineString(points)" src/lib/calculationEngine.ts` retourne au moins 1
    - `grep -c "length(line, { units: 'kilometers' })" src/lib/calculationEngine.ts` retourne au moins 1
    - `grep -c "STUB Wave 0" src/lib/calculationEngine.ts | grep -v '^#'` retourne au plus 7 (les 7 fonctions restantes pour Task 2/3)
    - Tous les tests CALC-01 passent (4 tests GREEN)
  </acceptance_criteria>
  <done>Helpers d'intervalles + dimensions + computeLengthInterval implémentés, tests CALC-01 GREEN.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implémenter computeVolume, computeDeltaSL, computeIPCCPercent, classifyTerrain, computeCost</name>
  <read_first>
    - src/lib/calculationEngine.ts (état après Task 1)
    - src/types/calculation.ts (constantes COST_PER_KM, TERRAIN_THRESHOLDS, OCEAN_AREA_DIVISOR, IPCC_ANNUAL_RATE_MM)
    - src/tests/calculationEngine.test.ts (cas CALC-02, CALC-03, CALC-04)
    - .planning/phases/04-moteur-de-calcul/04-RESEARCH.md (Pattern 1, Pattern 3)
  </read_first>
  <behavior>
    - computeVolume convertit km en m, multiplie L×W×D, divise par 1e9 pour km³
    - computeDeltaSL = volumeKm3 / 361.8
    - computeIPCCPercent = (ΔSL / 4.5) × 100
    - classifyTerrain itère sur les segments (i-1, i) du profil, calcule pente m/km, classe selon seuils
    - computeCost somme par type : COST_PER_KM[type][0] × km pour min, [1] pour max
  </behavior>
  <action>
Remplacer les 5 stubs suivants dans `src/lib/calculationEngine.ts` :

```typescript
// ─── CALC-01 : Volume km³ propagé en intervalle ──────────────────────────────

export function computeVolume(
  lengthKm: Interval,
  widthM: Interval,
  depthM: Interval,
): Interval {
  // Convertir longueur km → m, puis V = L × W × D, enfin / 1e9 pour km³
  const lengthM: Interval = [lengthKm[0] * 1000, lengthKm[1] * 1000]
  const volM3 = mulIntervals(mulIntervals(lengthM, widthM), depthM)
  return [volM3[0] / 1e9, volM3[1] / 1e9]
}

// ─── CALC-02 : ΔSL (formule centrale non-négociable) ─────────────────────────

export function computeDeltaSL(volumeKm3: Interval): Interval {
  return divByConst(volumeKm3, OCEAN_AREA_DIVISOR)
}

// ─── CALC-04 : Pourcentage IPCC ──────────────────────────────────────────────

export function computeIPCCPercent(deltaSLmm: Interval): Interval {
  return [
    (deltaSLmm[0] / IPCC_ANNUAL_RATE_MM) * 100,
    (deltaSLmm[1] / IPCC_ANNUAL_RATE_MM) * 100,
  ]
}

// ─── CALC-03 : Classification terrain ────────────────────────────────────────

export function classifyTerrain(points: ElevationPoint[]): TerrainBreakdown {
  const breakdown: TerrainBreakdown = { plain: 0, mixed: 0, mountain: 0, totalKm: 0 }
  if (points.length < 2) return breakdown

  for (let i = 1; i < points.length; i++) {
    const dDist = points[i].distance - points[i - 1].distance
    if (dDist <= 0) continue  // segment dégénéré, on saute

    const dAlt  = Math.abs(points[i].altitude - points[i - 1].altitude)
    const slopeMperKm = dAlt / dDist

    const type: TerrainType =
      slopeMperKm < TERRAIN_THRESHOLDS.plain ? 'plain' :
      slopeMperKm < TERRAIN_THRESHOLDS.mixed ? 'mixed' :
      'mountain'

    breakdown[type]   += dDist
    breakdown.totalKm += dDist
  }
  return breakdown
}

// ─── CALC-03 : Coût total en M€ ──────────────────────────────────────────────

export function computeCost(breakdown: TerrainBreakdown): Interval {
  let costMin = 0
  let costMax = 0
  for (const type of ['plain', 'mixed', 'mountain'] as TerrainType[]) {
    const segKm = breakdown[type]
    costMin += segKm * COST_PER_KM[type][0]
    costMax += segKm * COST_PER_KM[type][1]
  }
  return [costMin, costMax]
}
```

Vérifier après changement : tests CALC-02, CALC-03, CALC-04 doivent passer en GREEN.
  </action>
  <verify>
    <automated>npx vitest run src/tests/calculationEngine.test.ts -t "CALC-02|CALC-03|CALC-04" --reporter=verbose 2>&1 | tee /tmp/t02-task2.txt; FAIL=$(grep -cE "FAIL|✗|×" /tmp/t02-task2.txt); echo "FAIL=$FAIL"; if [ "$FAIL" -gt 0 ]; then exit 1; fi</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "divByConst(volumeKm3, OCEAN_AREA_DIVISOR)" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "IPCC_ANNUAL_RATE_MM" src/lib/calculationEngine.ts` retourne au moins 1
    - `grep -c "TERRAIN_THRESHOLDS.plain" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "TERRAIN_THRESHOLDS.mixed" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "COST_PER_KM\[type\]" src/lib/calculationEngine.ts` retourne au least 2
    - `grep -c "Math.abs(points\[i\].altitude" src/lib/calculationEngine.ts` retourne 1
    - Tous les tests CALC-02, CALC-03, CALC-04 passent en GREEN (5+ tests)
    - `npx tsc --noEmit` exit 0
  </acceptance_criteria>
  <done>5 fonctions cœur métier implémentées, tests CALC-02/03/04 GREEN, types stricts respectés.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implémenter computePartialImpact + computeCalculation orchestrateur</name>
  <read_first>
    - src/lib/calculationEngine.ts (état après Task 2)
    - src/types/canal.ts (Canal interface)
    - src/types/elevation.ts (ElevationProfile, UphillSegment)
    - src/components/MapView.tsx (lignes 176-189 — pattern along/lineString)
    - .planning/phases/04-moteur-de-calcul/04-RESEARCH.md (Pattern 4, Pitfall 4 — clip terrain au partiel)
    - src/tests/calculationEngine.test.ts (CALC-05 + describe orchestrateur)
  </read_first>
  <behavior>
    - computePartialImpact retourne null si profile.isFullyGravity OU profile.uphillSegments.length === 0
    - reachableKm = profile.uphillSegments[0].distanceStart
    - stopCoord obtenu via turf.along(lineString(canal.points), reachableKm, {units:'kilometers'})
    - Le profil terrain est CLIPPÉ aux X premiers km avant computeCost (Pitfall 4 : éviter coût partiel > coût total)
    - longueur partielle a tolérance ±2% (TOLERANCE.partialLength)
    - percentOfFull = (reachableKm / totalLengthKm) × 100
    - computeCalculation orchestre tout : guard null, calcule lengthKm, terrainBreakdown (sur profile complet), volume, deltaSL, cost, ipccPercent
  </behavior>
  <action>
Remplacer les 2 derniers stubs dans `src/lib/calculationEngine.ts` :

```typescript
// ─── CALC-01 à CALC-04 : Orchestrateur ───────────────────────────────────────

export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null {
  // Garde-fous (Pitfall 5 : éviter division par zéro / NaN)
  if (!profile) return null
  if (widthM <= 0 || depthM <= 0) return null
  if (!Number.isFinite(widthM) || !Number.isFinite(depthM)) return null
  if (canal.points.length < 2) return null

  const lengthKm = computeLengthInterval(canal.points)
  const widthIv  = widthInterval(widthM)
  const depthIv  = depthInterval(depthM)
  const volumeKm3 = computeVolume(lengthKm, widthIv, depthIv)
  const deltaSLmm = computeDeltaSL(volumeKm3)
  const ipccPercent = computeIPCCPercent(deltaSLmm)
  const terrainBreakdown = classifyTerrain(profile.points)
  const costMEur = computeCost(terrainBreakdown)

  return {
    lengthKm,
    volumeKm3,
    deltaSLmm,
    costMEur,
    ipccPercent,
    terrainBreakdown,
  }
}

// ─── CALC-05 : Impact partiel — canal stoppé au premier obstacle ─────────────

/** Helper interne : clippe les points du profil à reachableKm pour Pitfall 4 */
function clipProfileToKm(points: ElevationPoint[], maxKm: number): ElevationPoint[] {
  const clipped: ElevationPoint[] = []
  for (const p of points) {
    if (p.distance <= maxKm) {
      clipped.push(p)
    } else {
      // Interpolation simple sur le dernier segment chevauché
      if (clipped.length > 0) {
        const last = clipped[clipped.length - 1]
        if (last.distance < maxKm) {
          const t = (maxKm - last.distance) / (p.distance - last.distance)
          clipped.push({
            distance: maxKm,
            altitude: last.altitude + t * (p.altitude - last.altitude),
          })
        }
      }
      break
    }
  }
  return clipped
}

export function computePartialImpact(
  canal: Canal,
  profile: ElevationProfile,
  widthM: number,
  depthM: number,
): PartialImpactResult | null {
  // Conditions de non-déclenchement
  if (profile.isFullyGravity) return null
  if (profile.uphillSegments.length === 0) return null
  if (widthM <= 0 || depthM <= 0) return null
  if (canal.points.length < 2) return null

  const reachableKm = profile.uphillSegments[0].distanceStart
  if (reachableKm <= 0) return null

  // stopCoord via Turf along (Pattern 5 RESEARCH.md)
  const line = lineString(canal.points)
  const stopPoint = along(line, reachableKm, { units: 'kilometers' })
  const stopCoord = stopPoint.geometry.coordinates as Coord

  // Longueur partielle avec tolérance ±2%
  const lengthKm: Interval = [
    reachableKm * (1 - TOLERANCE.partialLength),
    reachableKm * (1 + TOLERANCE.partialLength),
  ]

  // Volume + ΔSL partiels (propagation Interval)
  const widthIv = widthInterval(widthM)
  const depthIv = depthInterval(depthM)
  const volumeKm3 = computeVolume(lengthKm, widthIv, depthIv)
  const deltaSLmm = computeDeltaSL(volumeKm3)

  // Coût partiel : clipper le profil aux X premiers km AVANT classifyTerrain (Pitfall 4)
  const partialPoints = clipProfileToKm(profile.points, reachableKm)
  const partialBreakdown = classifyTerrain(partialPoints)
  const costMEur = computeCost(partialBreakdown)

  // % du tracé total réalisable
  const totalKm = length(line, { units: 'kilometers' })
  const percentOfFull = totalKm > 0 ? (reachableKm / totalKm) * 100 : 0

  return {
    reachableKm,
    stopCoord,
    lengthKm,
    volumeKm3,
    deltaSLmm,
    costMEur,
    percentOfFull,
  }
}
```

Notes :
- `clipProfileToKm` est un helper interne (pas exporté) — il garantit que le coût partiel ne dépasse JAMAIS le coût total (Pitfall 4 RESEARCH.md).
- Tous les retours numériques restent `Interval` ou `null` — UX-01 préservé.
- Aucune dépendance React/Zustand/MapLibre ajoutée — module reste pur.
  </action>
  <verify>
    <automated>npx vitest run src/tests/calculationEngine.test.ts --reporter=verbose 2>&1 | tee /tmp/t02-task3.txt; FAIL=$(grep -cE "FAIL|✗|×" /tmp/t02-task3.txt); PASS=$(grep -cE "Tests.*passed" /tmp/t02-task3.txt); echo "FAIL=$FAIL"; if [ "$FAIL" -gt 0 ]; then echo "TESTS RED RESTANTS"; exit 1; fi</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "^export function computePartialImpact" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "^export function computeCalculation" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "function clipProfileToKm" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "isFullyGravity" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "uphillSegments\[0\].distanceStart" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "along(line, reachableKm" src/lib/calculationEngine.ts` retourne 1
    - `grep -c "STUB Wave 0" src/lib/calculationEngine.ts | grep -v '^#'` retourne 0 (tous les stubs ont disparu)
    - `grep -cE "import .* from 'react'|from 'zustand'|from 'maplibre" src/lib/calculationEngine.ts` retourne 0
    - `npx tsc --noEmit` exit 0
    - `npx vitest run src/tests/calculationEngine.test.ts` : 0 échec, tous les tests Phase 4 GREEN
    - `npm test` : tous les tests des phases 1-4 passent
  </acceptance_criteria>
  <done>Moteur de calcul 100% implémenté, tous les tests Phase 4 GREEN, aucun test pré-existant cassé, module reste pur.</done>
</task>

</tasks>

<verification>
**Vérification finale du plan T02 :**

1. `grep -c "STUB Wave 0" src/lib/calculationEngine.ts` retourne 0 (plus aucun stub)
2. `npx tsc --noEmit` exit 0
3. `npm test` montre 0 failure, ALL GREEN sur calculationEngine.test.ts
4. Aucun test des phases 1-3 cassé (43+ existants toujours verts)
5. `grep -cE "import .* from 'react'|from 'zustand'|from 'maplibre" src/lib/calculationEngine.ts` retourne 0 — module pur

```bash
npx tsc --noEmit
npm test 2>&1 | grep -E "Test Files|Tests"
grep -c "STUB Wave 0" src/lib/calculationEngine.ts
```

**Sanity check métier rapide (REPL Node) :**
```bash
node -e "
import('./src/lib/calculationEngine.js').then(m => {
  // Qattara : 1000 km³ → ~2.764 mm
  console.log('ΔSL Qattara:', m.computeDeltaSL([1000, 1000]));
})"
```
Attendu : `[2.7639..., 2.7639...]`
</verification>

<success_criteria>
- [ ] Toutes les fonctions de `calculationEngine.ts` sont implémentées (plus aucun "STUB Wave 0")
- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] `npm test` : 0 échec sur calculationEngine.test.ts, tous tests verts
- [ ] Aucun test pré-existant (Phase 1-3) cassé
- [ ] Aucun import React/Zustand/MapLibre dans `calculationEngine.ts`
- [ ] `computeDeltaSL([1000, 1000])` ≈ `[2.764, 2.764]` mm (ancre Qattara validée)
- [ ] Coût partiel ≤ coût total (Pitfall 4 vérifié via clipProfileToKm)
- [ ] Tous les retours numériques sont des `Interval` ou `null` (UX-01)
</success_criteria>

<output>
Après complétion, créer `.planning/phases/04-moteur-de-calcul/04-02-SUMMARY.md` documentant :
- Le compte de lignes implémentées dans calculationEngine.ts
- Le compte tests GREEN (Phase 4) vs total
- Validation manuelle Qattara 1000 km³ → 2.764 mm
- Toute différence par rapport au plan (helpers ajoutés, edge cases découverts)
- Confirmation que tous les tests Phase 1-3 sont toujours verts
</output>

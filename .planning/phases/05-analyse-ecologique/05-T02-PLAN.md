---
phase: 05-analyse-ecologique
plan: T02
type: tdd
wave: 2
depends_on: [T01]
status: complete
completed_at: 2026-05-01
files_modified:
  - src/lib/ecologyEngine.ts
autonomous: true
requirements:
  - ECO-01
  - ECO-02
  - ECO-03
  - ECO-04

must_haves:
  truths:
    - "computeDesertLengthKm gère les 3 cas : canal coupe deux bords, entièrement dans polygone, coupe un seul bord"
    - "analyzeDesertIntersection retourne DesertIntersection avec areaKm2 en Interval (±10%)"
    - "computeGreeningTimeline retourne [50,100] pour hyperarid, [20,50] pour arid, [5,20] pour semiarid, null sinon"
    - "detectEndorheicBasin retourne detected:true avec basinName si dernier point dans polygone"
    - "detectClimateRisk retourne true si désert traversé ET au moins un point lat ≤35°"
    - "computeEcologyAnalysis orchestre les 4 fonctions et retourne EcologyResult complet"
    - "npm test -- ecologyEngine passe en GREEN (11/11)"
  artifacts:
    - path: "src/lib/ecologyEngine.ts"
      provides: "Moteur écologique complet — implémentation GREEN"
      exports: ["computeDesertLengthKm", "analyzeDesertIntersection", "computeGreeningTimeline", "detectEndorheicBasin", "detectClimateRisk", "computeEcologyAnalysis"]
  key_links:
    - from: "src/lib/ecologyEngine.ts"
      to: "src/data/desertZones.geojson"
      via: "import statique ES module (resolveJsonModule)"
      pattern: "import desertZones from.*data/desertZones"
    - from: "src/lib/ecologyEngine.ts"
      to: "src/data/endorheicBasins.geojson"
      via: "import statique ES module"
      pattern: "import endorheicBasins from.*data/endorheicBasins"
    - from: "computeEcologyAnalysis"
      to: "canal.points[last]"
      via: "dernier point pour booleanPointInPolygon (ECO-03)"
      pattern: "canal.points\\[canal.points.length - 1\\]"
---

<objective>
Wave 1 TDD GREEN: Implémenter ecologyEngine.ts en totalité pour que les 11 tests de T01 passent. Chaque fonction suit exactement les patterns documentés dans RESEARCH.md.

Purpose: Moteur de calcul écologique pur (aucun React, aucun Zustand, aucun fetch réseau) — testable, réutilisable, extensible.
Output: src/lib/ecologyEngine.ts complet — npm test -- ecologyEngine → 11/11 GREEN.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/05-analyse-ecologique/05-CONTEXT.md
@.planning/phases/05-analyse-ecologique/05-RESEARCH.md
@.planning/phases/05-analyse-ecologique/05-T01-SUMMARY.md

<interfaces>
<!-- Contrats de type créés dans T01 -->

From src/types/ecology.ts:
```typescript
import type { Interval } from './calculation'

export type AridityClass = 'hyperarid' | 'arid' | 'semiarid'

export interface DesertIntersection {
  totalDesertKm: number
  aridityClass: AridityClass
  areaKm2: Interval        // longueur × 2km corridor ±10%
}

export interface EndorheicAlert {
  detected: boolean
  basinName?: string
  examples?: string
}

export interface EcologyResult {
  desertIntersection: DesertIntersection | null
  greeningTimeline: Interval | null
  endorheicAlert: EndorheicAlert
  climateRiskFlag: boolean
}
```

From src/types/canal.ts:
```typescript
export type Coord = [number, number]  // [lng, lat]

export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  elevation?: ElevationProfile
  isRouted?: boolean
}
```

GeoJSON data structure (desertZones.geojson features):
```json
{
  "type": "Feature",
  "properties": { "name": "Sahara", "aridity": "hyperarid", "koppen": "BWh" },
  "geometry": { "type": "Polygon", "coordinates": [[[lng,lat], ...]] }
}
```

GeoJSON data structure (endorheicBasins.geojson features):
```json
{
  "type": "Feature",
  "properties": { "name": "Mer Caspienne", "examples": "Mer d'Aral..." },
  "geometry": { "type": "Polygon", "coordinates": [[[lng,lat], ...]] }
}
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Implémenter ecologyEngine.ts complet — GREEN</name>
  <files>src/lib/ecologyEngine.ts</files>
  <behavior>
    ECO-01 (analyzeDesertIntersection):
    - Crée une LineString Turf depuis canal.points ([lng,lat] — Pitfall P4)
    - Pour chaque feature de desertFeatures: appelle computeDesertLengthKm (guard booleanIntersects)
    - Accumule totalDesertKm et conserve la classe d'aridité la plus sévère (hyperarid > arid > semiarid)
    - Si totalDesertKm === 0: retourne null
    - areaKm2 = [totalDesertKm * 2 * 0.9, totalDesertKm * 2 * 1.1] (D-02)

    computeDesertLengthKm — 3 cas (RESEARCH.md Pattern 1):
    - Guard: booleanIntersects(canal, desert) → false = return 0
    - pts = lineIntersect(canal, desert).features
    - Cas 0 pts (entièrement dedans): tester booleanPointInPolygon(startPt, desert) → length(canal)
    - Cas ≥2 pts: lineSlice(entry, exit, canal) → length(slice) — try/catch retourne 0
    - Cas 1 pt: si start dedans → slice(start, pt) sinon slice(pt, end) — try/catch retourne 0

    ECO-02 (computeGreeningTimeline):
    - 'hyperarid' → [50, 100]
    - 'arid' → [20, 50]
    - 'semiarid' → [5, 20]
    - null → null

    ECO-03 (detectEndorheicBasin):
    - lastPoint = canal.points[canal.points.length - 1]
    - Crée un Feature Point Turf depuis lastPoint ([lng, lat])
    - booleanPointInPolygon(pt, feature) pour chaque feature de basinFeatures
    - Premier match: { detected: true, basinName: feature.properties.name, examples: feature.properties.examples }
    - Aucun match: { detected: false }

    ECO-04 (detectClimateRisk):
    - condition: hasDesertIntersection === true
    - ET canal.points.some(([_lng, lat]) => Math.abs(lat) <= 35)
    - (lat = index 1 du tuple Coord [lng, lat] — Pitfall P4)

    computeEcologyAnalysis (orchestrateur):
    - Guard: canal.points.length < 2 → return null
    - Import statique desertZones et endorheicBasins
    - Appelle analyzeDesertIntersection avec (canal, desertZones)
    - Appelle computeGreeningTimeline avec aridityClass de desertIntersection (ou null)
    - Appelle detectEndorheicBasin avec (canal, endorheicBasins)
    - Appelle detectClimateRisk avec (canal, desertIntersection !== null)
    - Retourne EcologyResult complet
  </behavior>
  <action>
Remplacer le contenu entier de `src/lib/ecologyEngine.ts` par l'implémentation complète.

Structure du fichier :

```typescript
// src/lib/ecologyEngine.ts
// Moteur d'analyse écologique Phase 5 — pur TypeScript, sans React, sans Zustand.
// Patterns vérifiés in-session dans RESEARCH.md — voir Pattern 1 et 2 pour l'algorithme complet.
import {
  booleanIntersects,
  lineIntersect,
  lineSlice,
  length,
  booleanPointInPolygon,
  point,
  lineString,
} from '@turf/turf'
import type { Feature, LineString, Polygon, FeatureCollection } from 'geojson'
import desertZones from '../data/desertZones.geojson'
import endorheicBasins from '../data/endorheicBasins.geojson'
import type { Canal } from '../types/canal'
import type { AridityClass, DesertIntersection, EndorheicAlert, EcologyResult } from '../types/ecology'
import type { Interval } from '../types/calculation'

// ─── Helpers internes ──────────────────────────────────────────────────────────

/** Sévérité : hyperarid > arid > semiarid */
function mergeAridityClass(
  current: AridityClass | null,
  incoming: string | undefined,
): AridityClass | null {
  if (!incoming) return current
  const ORDER: Record<string, number> = { hyperarid: 3, arid: 2, semiarid: 1 }
  const incomingClass = incoming as AridityClass
  if (!current) return incomingClass
  return (ORDER[incomingClass] ?? 0) > (ORDER[current] ?? 0) ? incomingClass : current
}

// ─── ECO-01 : Longueur canal dans un polygone désert (3 cas) ─────────────────

export function computeDesertLengthKm(
  canal: Feature<LineString>,
  desertPolygon: Feature<Polygon>,
): number {
  // Guard rapide — court-circuit si pas d'intersection (Pitfall P7)
  if (!booleanIntersects(canal, desertPolygon)) return 0

  const intersectionPts = lineIntersect(canal, desertPolygon)

  // Cas 1 : 0 point → canal entièrement à l'intérieur (Pitfall P2)
  if (intersectionPts.features.length === 0) {
    const startPt = point(canal.geometry.coordinates[0])
    if (booleanPointInPolygon(startPt, desertPolygon)) {
      return length(canal, { units: 'kilometers' })
    }
    return 0
  }

  // Cas 2 : ≥2 points → entrée et sortie (cas normal)
  if (intersectionPts.features.length >= 2) {
    const entry = intersectionPts.features[0]
    const exit = intersectionPts.features[intersectionPts.features.length - 1]
    try {
      const slice = lineSlice(entry, exit, canal)
      return length(slice, { units: 'kilometers' })
    } catch {
      return 0  // Pitfall P3 : lineSlice peut échouer si points identiques
    }
  }

  // Cas 3 : 1 point → canal entre/sort par un seul bord
  const coords = canal.geometry.coordinates
  const startPt = point(coords[0])
  const endPt = point(coords[coords.length - 1])
  const singleIntersect = intersectionPts.features[0]
  try {
    if (booleanPointInPolygon(startPt, desertPolygon)) {
      const slice = lineSlice(startPt, singleIntersect, canal)
      return length(slice, { units: 'kilometers' })
    } else {
      const slice = lineSlice(singleIntersect, endPt, canal)
      return length(slice, { units: 'kilometers' })
    }
  } catch {
    return 0
  }
}

// ─── ECO-01 : Analyse complète des intersections désertiques ─────────────────

export function analyzeDesertIntersection(
  canal: Canal,
  desertFeatures: FeatureCollection,
): DesertIntersection | null {
  if (canal.points.length < 2) return null

  const canalLine = lineString(canal.points)  // Coord = [lng, lat] — conforme Turf

  let totalDesertKm = 0
  let maxAridityClass: AridityClass | null = null

  for (const feature of desertFeatures.features) {
    const km = computeDesertLengthKm(canalLine, feature as Feature<Polygon>)
    if (km > 0) {
      totalDesertKm += km
      maxAridityClass = mergeAridityClass(
        maxAridityClass,
        (feature.properties as { aridity?: string }).aridity,
      )
    }
  }

  if (totalDesertKm === 0 || !maxAridityClass) return null

  // D-02 : superficie = longueur × largeur d'influence (2km) ±10%
  const areaKm2: Interval = [totalDesertKm * 2 * 0.9, totalDesertKm * 2 * 1.1]

  return { totalDesertKm, aridityClass: maxAridityClass, areaKm2 }
}

// ─── ECO-02 : Timeline de verdissement (D-03 locked) ─────────────────────────

export function computeGreeningTimeline(
  aridityClass: AridityClass | null,
): Interval | null {
  switch (aridityClass) {
    case 'hyperarid': return [50, 100]  // BWh/BWk — Sahara, Atacama, Namib
    case 'arid':      return [20, 50]   // BSh/BSk — Sahel, steppes
    case 'semiarid':  return [5, 20]    // semi-arides — Thar, Negev
    default:          return null
  }
}

// ─── ECO-03 : Détection bassin endorheïque (D-04) ─────────────────────────────

export function detectEndorheicBasin(
  canal: Canal,
  basinFeatures: FeatureCollection,
): EndorheicAlert {
  if (canal.points.length < 1) return { detected: false }

  // Dernier point du canal — coordonnées [lng, lat] (Pitfall P4)
  const lastCoord = canal.points[canal.points.length - 1]
  const lastPt = point(lastCoord)

  for (const feature of basinFeatures.features) {
    if (booleanPointInPolygon(lastPt, feature as Feature<Polygon>)) {
      const props = feature.properties as { name?: string; examples?: string }
      return {
        detected: true,
        basinName: props.name,
        examples: props.examples,
      }
    }
  }

  return { detected: false }
}

// ─── ECO-04 : Flag risque climatique (D-05) ───────────────────────────────────

export function detectClimateRisk(
  canal: Canal,
  hasDesertIntersection: boolean,
): boolean {
  if (!hasDesertIntersection) return false
  // Coord = [lng, lat] → index 1 = latitude
  return canal.points.some(([_lng, lat]) => Math.abs(lat) <= 35)
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────

export function computeEcologyAnalysis(canal: Canal): EcologyResult | null {
  if (canal.points.length < 2) return null

  const desertIntersection = analyzeDesertIntersection(canal, desertZones as unknown as FeatureCollection)
  const greeningTimeline = computeGreeningTimeline(desertIntersection?.aridityClass ?? null)
  const endorheicAlert = detectEndorheicBasin(canal, endorheicBasins as unknown as FeatureCollection)
  const climateRiskFlag = detectClimateRisk(canal, desertIntersection !== null)

  return { desertIntersection, greeningTimeline, endorheicAlert, climateRiskFlag }
}
```

Pièges à éviter :
- Ne PAS utiliser `turf.intersect()` sur des LineString — retourne une erreur (Pitfall P1)
- Ne PAS utiliser `turf.area()` sur des LineString — retourne 0 (RESEARCH.md anti-patterns)
- Toujours entourer `lineSlice` d'un try/catch (Pitfall P3)
- Coordonnées toujours [lng, lat] pour Turf (Pitfall P4)
- `canal.points.some(([_lng, lat]) => ...)` — index 1 = lat (pas index 0)
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npm test -- ecologyEngine 2>&1 | tail -20</automated>
  </verify>
  <done>npm test -- ecologyEngine → 11/11 tests GREEN. npx tsc --noEmit → aucune erreur.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| canal.points → Turf functions | Coordonnées non validées — peuvent contenir NaN ou valeurs hors plage |
| desertZones.geojson → computeDesertLengthKm | GeoJSON bundlé — potentiellement malformé |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-03 | Tampering | GeoJSON polygones malformés | mitigate | try/catch sur lineSlice + guard booleanIntersects avant tout calcul coûteux |
| T-05-04 | Denial of Service | canal.points = [] ou [pt unique] | mitigate | Guard `canal.points.length < 2` en entrée de chaque fonction publique |
| T-05-05 | Information Disclosure | — | accept | App locale, pas de données sensibles, pas de réseau |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# Tous les tests GREEN
npm test -- ecologyEngine
# TypeScript compile
npx tsc --noEmit
```
</verification>

<success_criteria>
- npm test -- ecologyEngine → 11/11 PASS (GREEN)
- npx tsc --noEmit → 0 erreur
- computeEcologyAnalysis(canal) retourne EcologyResult non-null pour un canal traversant le Sahara
- computeEcologyAnalysis(canal) retourne null pour canal.points.length < 2
- detectEndorheicBasin détecte la Mer Caspienne pour un canal terminant en [51, 43]
</success_criteria>

<output>
After completion, create `.planning/phases/05-analyse-ecologique/05-T02-SUMMARY.md`
</output>

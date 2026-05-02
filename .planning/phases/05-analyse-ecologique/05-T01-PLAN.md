---
phase: 05-analyse-ecologique
plan: T01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/types/ecology.ts
  - src/data/desertZones.geojson
  - src/data/endorheicBasins.geojson
  - src/lib/ecologyEngine.ts
  - src/tests/ecologyEngine.test.ts
  - tsconfig.app.json
autonomous: true
status: complete
completed_at: "2026-05-01"
requirements:
  - ECO-01
  - ECO-02
  - ECO-03
  - ECO-04

must_haves:
  truths:
    - "src/types/ecology.ts exporte AridityClass, DesertIntersection, EndorheicAlert, EcologyResult"
    - "src/data/desertZones.geojson contient au moins 7 déserts avec propriété aridity"
    - "src/data/endorheicBasins.geojson contient au moins 10 bassins avec name + examples"
    - "src/lib/ecologyEngine.ts compile et exporte les 5 fonctions (stubs retournant null/false)"
    - "src/tests/ecologyEngine.test.ts définit 11 cas — tous ROUGE (expect fails)"
    - "tsconfig.app.json a resolveJsonModule: true"
  artifacts:
    - path: "src/types/ecology.ts"
      provides: "Contrats de type pour tout le moteur écologique"
      exports: ["AridityClass", "DesertIntersection", "EndorheicAlert", "EcologyResult"]
    - path: "src/data/desertZones.geojson"
      provides: "Polygones déserts réels avec classification Koppen"
      contains: "BWh BWk BSh BSk + hyperarid arid semiarid"
    - path: "src/data/endorheicBasins.geojson"
      provides: "Polygones bassins endorheïques avec exemples historiques"
      contains: "Caspienne Aral Qattara Dead Sea"
    - path: "src/lib/ecologyEngine.ts"
      provides: "Stubs compilables — RED state pour TDD"
      exports: ["analyzeDesertIntersection", "computeGreeningTimeline", "detectEndorheicBasin", "detectClimateRisk", "computeEcologyAnalysis"]
    - path: "src/tests/ecologyEngine.test.ts"
      provides: "11 tests unitaires définissant le contrat du moteur"
  key_links:
    - from: "src/types/ecology.ts"
      to: "src/types/calculation.ts"
      via: "import type { Interval }"
      pattern: "import.*Interval.*from.*calculation"
    - from: "src/lib/ecologyEngine.ts"
      to: "src/data/desertZones.geojson"
      via: "import statique ES module"
      pattern: "import.*desertZones.*from.*data"
    - from: "src/tests/ecologyEngine.test.ts"
      to: "src/lib/ecologyEngine.ts"
      via: "import des fonctions à tester"
      pattern: "import.*ecologyEngine"
---

<objective>
Wave 0 TDD: Poser les contrats de type, les données géographiques réelles et les stubs du moteur écologique. Les tests doivent passer en ROUGE — ils définissent le comportement attendu pour T02.

Purpose: Établir le contrat avant l'implémentation. T02 reçoit des tests précis à rendre verts, pas une spécification à interpréter.
Output: ecology.ts (types), deux GeoJSON réels (<300 KB total), ecologyEngine.ts (stubs compilables), ecologyEngine.test.ts (11 cas RED).
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/05-analyse-ecologique/05-CONTEXT.md
@.planning/phases/05-analyse-ecologique/05-RESEARCH.md

<interfaces>
<!-- Types existants dont ecology.ts dépend -->

From src/types/canal.ts:
```typescript
export type Coord = [number, number]  // [lng, lat] — JAMAIS [lat, lng]

export interface Canal {
  id: string
  points: Coord[]        // minimum 2 points pour finaliser
  name: string
  createdAt: number
  elevation?: ElevationProfile
  elevationLoading?: boolean
  elevationError?: string
  isRouted?: boolean
}
```

From src/types/calculation.ts:
```typescript
export type Interval = [number, number]  // [min, max] — UX-01 strict
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Types ecology.ts + tsconfig.app.json resolveJsonModule</name>
  <files>src/types/ecology.ts, tsconfig.app.json</files>
  <behavior>
    - AridityClass = union 'hyperarid' | 'arid' | 'semiarid'
    - DesertIntersection { totalDesertKm: number; aridityClass: AridityClass; areaKm2: Interval }
    - EndorheicAlert { detected: boolean; basinName?: string; examples?: string }
    - EcologyResult { desertIntersection: DesertIntersection | null; greeningTimeline: Interval | null; endorheicAlert: EndorheicAlert; climateRiskFlag: boolean }
    - Interval importé depuis '../types/calculation' (pas redéfini)
  </behavior>
  <action>
1. Créer `src/types/ecology.ts` avec exactement les interfaces du RESEARCH.md Pattern 5.
   — AridityClass, DesertIntersection, EndorheicAlert, EcologyResult
   — `import type { Interval } from './calculation'` (réutiliser, ne pas dupliquer)

2. Ajouter `"resolveJsonModule": true` dans `tsconfig.app.json` sous `compilerOptions` (Pitfall P5 — requis pour `import desertZones from '../data/desertZones.geojson'`).
   Vérifier que la clé n'existe pas déjà avant de l'ajouter.
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -i "ecology" || echo "No ecology type errors"</automated>
  </verify>
  <done>ecology.ts compile sans erreur ; tsconfig.app.json contient resolveJsonModule: true</done>
</task>

<task type="tdd">
  <name>Task 2: GeoJSON données réelles — desertZones.geojson + endorheicBasins.geojson</name>
  <files>src/data/desertZones.geojson, src/data/endorheicBasins.geojson</files>
  <behavior>
    - desertZones.geojson: FeatureCollection, au moins 7 features Polygon, chaque feature a `name`, `aridity` ('hyperarid'|'arid'|'semiarid'), `koppen` (string)
    - endorheicBasins.geojson: FeatureCollection, au moins 10 features Polygon, chaque feature a `name` (string), `examples` (string)
    - Coordonnées arrondies à 4 décimales, winding order CCW (RFC 7946)
    - Total <300 KB combinés
    - Le polygone MOCK_DESERT des tests (bbox [[-10,15],[40,30]]) doit être couvert par le Sahara
    - Le polygone MOCK_ENDORHEIC des tests (bbox [[49,36],[54,47]]) doit être couvert par la Caspienne
  </behavior>
  <action>
Créer `src/data/` et y placer deux fichiers GeoJSON avec des polygones approximatifs mais réalistes.

**desertZones.geojson** — 7 déserts minimum, chacun avec propriété `aridity` :

Déserts à inclure avec leur classe Koppen :
- Sahara (Afrique du Nord) → aridity: "hyperarid", koppen: "BWh" — polygone couvrant approximativement [-17,15] à [35,32]
- Arabian Desert (Péninsule arabique) → aridity: "hyperarid", koppen: "BWh" — [35,15] à [60,33]
- Gobi (Asie centrale) → aridity: "hyperarid", koppen: "BWk" — [80,38] à [125,50]
- Atacama (Amérique du Sud, côte Pacifique Chili/Pérou) → aridity: "hyperarid", koppen: "BWh" — [-75,-30] à [-66,-18]
- Australian Outback (centre Australie) → aridity: "hyperarid", koppen: "BWh" — [120,-35] à [140,-20]
- Namib (côte ouest Afrique australe) → aridity: "hyperarid", koppen: "BWh" — [11,-30] à [18,-17]
- Kalahari (Afrique australe) → aridity: "arid", koppen: "BSh" — [19,-29] à [27,-20]
- Sahel (zone de transition Afrique) → aridity: "arid", koppen: "BSh" — [-17,12] à [35,17]
- Great Basin (USA) → aridity: "arid", koppen: "BSk" — [-120,36] à [-114,42]
- Central Asian Steppe (Kazakhstan) → aridity: "arid", koppen: "BSk" — [55,40] à [80,50]
- Negev/Sinai (Moyen-Orient) → aridity: "semiarid", koppen: "BSh" — [33,29] à [36,31]
- Thar Desert (Inde/Pakistan) → aridity: "semiarid", koppen: "BSh" — [68,24] à [74,30]

Format de chaque feature :
```json
{
  "type": "Feature",
  "properties": { "name": "...", "aridity": "hyperarid", "koppen": "BWh" },
  "geometry": { "type": "Polygon", "coordinates": [[[lng,lat], [lng,lat], ...]] }
}
```
Les polygones doivent être des rectangles approximatifs ou formes simples (4-8 sommets) — précision suffisante pour analyse au km.
Winding order : extérieur CCW (RFC 7946).

**endorheicBasins.geojson** — 10 bassins minimum, chacun avec `name` + `examples` :

Bassins à inclure :
- Mer Caspienne → examples: "Niveau en baisse de 1.5m depuis 2000" — couvre [49,36] à [54,47] (contient le point [51,43] du test)
- Mer d'Aral → examples: "Catastrophe écologique — 90% du volume perdu depuis 1960"
- Dépression de Qattara → examples: "Meilleur candidat mondial pour canal, jamais construit"
- Mer Morte → examples: "Niveau en baisse de 1m/an depuis 1980"
- Grand Lac Salé (Utah, USA) → examples: "Niveau critique, salinité extrême, écosystème effondré"
- Salton Sea (Californie, USA) → examples: "Créée par accident en 1905, hypersaline"
- Lac Balkhash (Kazakhstan) → examples: "Déclin lié aux détournements d'eau de l'Ili"
- Lac Eyre / Kati Thanda (Australie) → examples: "Ephémère — se remplit rarement"
- Bassin du Tarim (Xinjiang, Chine) → examples: "Désertification active, Taklamakan au centre"
- Lac Turkana (Kenya/Éthiopie) → examples: "Bassin partiellement fermé, niveau en baisse"

Note critique : La Mer Caspienne DOIT couvrir les coordonnées [51, 43] (test CANAL_ENDORHEIC endpoint).
Polygone Caspienne minimum : [[[49,36],[49,47],[54,47],[54,36],[49,36]]] — ce rectangle couvre [51,43].

Valider le winding order avec `turf.rewind()` si possible avant de sauvegarder — sinon s'assurer manuellement que les extérieurs sont CCW.
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && node -e "const d=require('./src/data/desertZones.geojson'); const e=require('./src/data/endorheicBasins.geojson'); console.log('deserts:', d.features.length, 'basins:', e.features.length); const hasAridity=d.features.every(f=>f.properties.aridity); const hasName=e.features.every(f=>f.properties.name); console.log('aridity OK:', hasAridity, 'name OK:', hasName)" 2>&1</automated>
  </verify>
  <done>desertZones.geojson ≥7 features avec aridity ; endorheicBasins.geojson ≥10 features avec name+examples ; total <300KB ; Caspienne couvre [51,43]</done>
</task>

<task type="tdd">
  <name>Task 3: ecologyEngine.ts stubs (RED) + tests ecologyEngine.test.ts</name>
  <files>src/lib/ecologyEngine.ts, src/tests/ecologyEngine.test.ts</files>
  <behavior>
    - ecologyEngine.ts compile, exporte les 5 fonctions, toutes retournent null/false/0 (stubs RED)
    - ecologyEngine.test.ts importe les fonctions et définit 11 cas — tous échouent (RED state attendu)
    - Tests utilisent des fixtures GeoJSON inline (pas de dépendance aux vrais fichiers de src/data/)
    - La commande `npm test -- ecologyEngine` doit lancer les 11 tests et tous échouer
  </behavior>
  <action>
1. Créer `src/lib/ecologyEngine.ts` — stubs compilables (pas d'implémentation) :

```typescript
// src/lib/ecologyEngine.ts
// Wave 0 — stubs RED pour TDD. Implémentation complète dans T02.
import type { Canal } from '../types/canal'
import type { AridityClass, DesertIntersection, EndorheicAlert, EcologyResult } from '../types/ecology'
import type { Interval } from '../types/calculation'
import type { Feature, Polygon, FeatureCollection } from 'geojson'

export function computeDesertLengthKm(
  _canal: Feature<import('geojson').LineString>,
  _desert: Feature<Polygon>,
): number {
  return 0  // RED: retourne toujours 0
}

export function analyzeDesertIntersection(
  _canal: Canal,
  _desertFeatures: FeatureCollection,
): DesertIntersection | null {
  return null  // RED
}

export function computeGreeningTimeline(
  _aridityClass: AridityClass | null,
): Interval | null {
  return null  // RED
}

export function detectEndorheicBasin(
  _canal: Canal,
  _basinFeatures: FeatureCollection,
): EndorheicAlert {
  return { detected: false }  // RED: ne détecte jamais
}

export function detectClimateRisk(
  _canal: Canal,
  _hasDesertIntersection: boolean,
): boolean {
  return false  // RED
}

export function computeEcologyAnalysis(_canal: Canal): EcologyResult | null {
  return null  // RED
}
```

2. Créer `src/tests/ecologyEngine.test.ts` avec fixtures inline et 11 cas selon RESEARCH.md §Validation Architecture :

```typescript
// src/tests/ecologyEngine.test.ts
// Wave 0 — tous les tests doivent ÉCHOUER (RED state).
// T02 les fera passer (GREEN).
import { describe, it, expect } from 'vitest'
import { polygon, lineString as turfLineString } from '@turf/turf'
import {
  computeGreeningTimeline,
  detectEndorheicBasin,
  detectClimateRisk,
  analyzeDesertIntersection,
  computeEcologyAnalysis,
} from '../lib/ecologyEngine'
import type { Canal } from '../types/canal'
import type { Coord } from '../types/canal'

// ─── Fixtures GeoJSON inline (indépendantes des vrais fichiers src/data/) ──────

const MOCK_DESERT_HYPERARID = polygon(
  [[[-10, 15], [40, 15], [40, 30], [-10, 30], [-10, 15]]],
  { name: 'Mock Sahara', aridity: 'hyperarid', koppen: 'BWh' }
)

const MOCK_DESERT_ARID = polygon(
  [[[10, 10], [20, 10], [20, 20], [10, 20], [10, 10]]],
  { name: 'Mock Sahel', aridity: 'arid', koppen: 'BSh' }
)

const MOCK_ENDORHEIC = polygon(
  [[[49, 36], [54, 36], [54, 47], [49, 47], [49, 36]]],
  { name: 'Mer Caspienne', examples: "Mer d'Aral, Salton Sea" }
)

// ─── Canaux de test ───────────────────────────────────────────────────────────

// Canal traversant le désert (de [-15,22] à [50,22])
const CANAL_CROSSING: Canal = {
  id: 'c1', name: 'Canal traversant', createdAt: 0,
  points: [[-15, 22], [50, 22]] as Coord[],
}

// Canal entièrement dans le désert
const CANAL_INSIDE: Canal = {
  id: 'c2', name: 'Canal dans désert', createdAt: 0,
  points: [[0, 20], [20, 22]] as Coord[],
}

// Canal hors désert (latitudes nordiques)
const CANAL_OUTSIDE: Canal = {
  id: 'c3', name: 'Canal hors désert', createdAt: 0,
  points: [[50, 55], [60, 55]] as Coord[],
}

// Canal terminant dans bassin endorheïque (Caspienne)
const CANAL_ENDORHEIC: Canal = {
  id: 'c4', name: 'Canal endorheïque', createdAt: 0,
  points: [[10, 40], [51, 43]] as Coord[],
}

// Canal dans désert tropical (lat ≤35°) → risque climatique
const CANAL_CLIMATE_RISK: Canal = {
  id: 'c5', name: 'Canal risque climatique', createdAt: 0,
  points: [[-15, 22], [50, 22]] as Coord[],
}

// Canal dans désert polaire (lat >35°) → pas de risque climatique
const CANAL_NO_CLIMATE_RISK: Canal = {
  id: 'c6', name: 'Canal pas risque', createdAt: 0,
  points: [[80, 42], [100, 45]] as Coord[],
}

const MOCK_DESERT_FC = {
  type: 'FeatureCollection' as const,
  features: [MOCK_DESERT_HYPERARID, MOCK_DESERT_ARID],
}

const MOCK_ENDORHEIC_FC = {
  type: 'FeatureCollection' as const,
  features: [MOCK_ENDORHEIC],
}

// ─── Tests ECO-01 ─────────────────────────────────────────────────────────────

describe('analyzeDesertIntersection (ECO-01)', () => {
  it('retourne non-null quand le canal traverse un désert', () => {
    const result = analyzeDesertIntersection(CANAL_CROSSING, MOCK_DESERT_FC)
    expect(result).not.toBeNull()
    expect(result!.totalDesertKm).toBeGreaterThan(0)
  })

  it('retourne null si le canal ne traverse aucun désert', () => {
    const result = analyzeDesertIntersection(CANAL_OUTSIDE, MOCK_DESERT_FC)
    expect(result).toBeNull()
  })

  it('totalDesertKm > 0 pour canal entièrement dans un désert', () => {
    const result = analyzeDesertIntersection(CANAL_INSIDE, MOCK_DESERT_FC)
    expect(result).not.toBeNull()
    expect(result!.totalDesertKm).toBeGreaterThan(0)
  })

  it('areaKm2 = [totalDesertKm*2*0.9, totalDesertKm*2*1.1] (±10% D-02)', () => {
    const result = analyzeDesertIntersection(CANAL_CROSSING, MOCK_DESERT_FC)
    expect(result).not.toBeNull()
    const km = result!.totalDesertKm
    expect(result!.areaKm2[0]).toBeCloseTo(km * 2 * 0.9, 0)
    expect(result!.areaKm2[1]).toBeCloseTo(km * 2 * 1.1, 0)
  })
})

// ─── Tests ECO-02 ─────────────────────────────────────────────────────────────

describe('computeGreeningTimeline (ECO-02)', () => {
  it('hyperarid → [50, 100] ans', () => {
    expect(computeGreeningTimeline('hyperarid')).toEqual([50, 100])
  })

  it('arid → [20, 50] ans', () => {
    expect(computeGreeningTimeline('arid')).toEqual([20, 50])
  })

  it('null si aucun désert traversé', () => {
    expect(computeGreeningTimeline(null)).toBeNull()
  })
})

// ─── Tests ECO-03 ─────────────────────────────────────────────────────────────

describe('detectEndorheicBasin (ECO-03)', () => {
  it('détecte bassin endorheïque si endpoint dans polygone', () => {
    const result = detectEndorheicBasin(CANAL_ENDORHEIC, MOCK_ENDORHEIC_FC)
    expect(result.detected).toBe(true)
    expect(result.basinName).toBe('Mer Caspienne')
  })

  it('pas d\'alerte si endpoint hors bassin', () => {
    const result = detectEndorheicBasin(CANAL_OUTSIDE, MOCK_ENDORHEIC_FC)
    expect(result.detected).toBe(false)
  })
})

// ─── Tests ECO-04 ─────────────────────────────────────────────────────────────

describe('detectClimateRisk (ECO-04)', () => {
  it('flag true si désert traversé ET latitude ≤35°', () => {
    expect(detectClimateRisk(CANAL_CLIMATE_RISK, true)).toBe(true)
  })

  it('flag false si désert traversé ET latitude >35° (tous les points)', () => {
    expect(detectClimateRisk(CANAL_NO_CLIMATE_RISK, true)).toBe(false)
  })
})
```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npm test -- ecologyEngine 2>&1 | tail -20</automated>
  </verify>
  <done>ecologyEngine.ts compile ; 11 tests s'exécutent et échouent (RED) — aucune erreur de syntaxe/compilation</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| src/data/ → ecologyEngine.ts | Fichiers GeoJSON bundlés — modifiables par l'utilisateur local, pas de validation réseau |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-01 | Tampering | src/data/*.geojson | accept | Données locales, usage personnel uniquement — pas de vecteur d'attaque réseau |
| T-05-02 | Denial of Service | ecologyEngine.ts parsing GeoJSON | mitigate | Guard `canal.points.length < 2` + try/catch sur tous appels Turf dans stubs |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# TypeScript compile sans erreur
npx tsc --noEmit
# 11 tests échouent (RED attendu)
npm test -- ecologyEngine
# Fichiers existent
ls src/types/ecology.ts src/lib/ecologyEngine.ts src/tests/ecologyEngine.test.ts src/data/desertZones.geojson src/data/endorheicBasins.geojson
```
</verification>

<success_criteria>
- src/types/ecology.ts exporte AridityClass, DesertIntersection, EndorheicAlert, EcologyResult
- tsconfig.app.json contient "resolveJsonModule": true
- src/data/desertZones.geojson : ≥7 features avec aridity, total <200 KB
- src/data/endorheicBasins.geojson : ≥10 features avec name+examples, Caspienne couvre [51,43], <100 KB
- src/lib/ecologyEngine.ts compile, exporte 5 fonctions, tous stubs (retournent null/false/0)
- src/tests/ecologyEngine.test.ts : 11 tests RED — npm test passe en termes de compilation mais les assertions échouent
</success_criteria>

<output>
After completion, create `.planning/phases/05-analyse-ecologique/05-T01-SUMMARY.md`
</output>

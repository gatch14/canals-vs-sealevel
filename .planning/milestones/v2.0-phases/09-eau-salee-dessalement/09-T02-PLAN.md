---
phase: 09-eau-salee-dessalement
plan: T02
type: tdd
wave: 2
depends_on: [09-T01]
files_modified:
  - src/lib/desalinationEngine.ts
autonomous: true
requirements: [ECO-05, DESAL-01, DESAL-02, DESAL-03, DESAL-04, DESAL-05]

must_haves:
  truths:
    - "classifyEcosystem retourne 'low' pour des points en zone désertique et 'neutral' ailleurs"
    - "calcDesalinationNodes retourne floor(lengthKm / 500)"
    - "calcSolarFactor retourne 1.0 si latitude < 35°N/S, 0.7 sinon"
    - "calcWaterProduction retourne un Interval [min, max] m³/jour proportionnel aux nœuds × solarFactor"
    - "calcSaltValue retourne un Interval [min, max] €/an basé sur salinité 35g/L × débit × prix NaCl"
    - "calcHabitableZones retourne un Interval [min, max] km² proportionnel aux nœuds"
    - "calcDesalinationCost retourne exactement [nodes×50_000_000, nodes×150_000_000]"
    - "Tous les tests desalinationEngine.test.ts passent en GREEN"
    - "Les 107+ tests existants restent GREEN"
  artifacts:
    - path: "src/lib/desalinationEngine.ts"
      provides: "Implémentation complète des 6 fonctions pures + calcSolarFactor + orchestrateur"
      exports: [classifyEcosystem, calcDesalinationNodes, calcSolarFactor, calcWaterProduction, calcSaltValue, calcHabitableZones, calcDesalinationCost, computeDesalinationAnalysis]
  key_links:
    - from: "src/lib/desalinationEngine.ts"
      to: "src/data/desertZones.geojson"
      via: "import + booleanIntersects Turf.js"
      pattern: "booleanIntersects"
    - from: "calcDesalinationNodes"
      to: "calcWaterProduction"
      via: "nodes passé en paramètre"
      pattern: "calcWaterProduction\\(nodes"
---

<objective>
Implémenter toutes les fonctions pures de desalinationEngine.ts pour faire passer les tests RED de T01 en GREEN.

Purpose: Le moteur de dessalement est la pièce centrale de la phase 9 — toutes les fonctions sont pures et testables sans DOM, suivant exactement le pattern d'ecologyEngine.ts. L'implémentation est complète avant que l'UI (T03) soit construite.

Output: src/lib/desalinationEngine.ts entièrement implémenté, tous les tests GREEN
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-eau-salee-dessalement/09-T01-SUMMARY.md

<interfaces>
<!-- Signatures définies en T01 — implémenter exactement ces contrats -->

From src/types/desalination.ts (créé en T01):
```typescript
export type EcosystemImpactLevel = 'low' | 'neutral' | 'critical'

export interface DesalinationParams {
  lengthKm: number
  points: Coord[]
  solarFactor: number
}

export interface DesalinationResult {
  nodes: number
  waterProduction: Interval  // m³/jour
  saltValue: Interval        // €/an
  habitableZones: Interval   // km²
  desalinationCost: Interval // €
  ecosystemImpact: EcosystemImpactLevel
}
```

From src/lib/ecologyEngine.ts (pattern exact à suivre):
```typescript
import { booleanIntersects, booleanPointInPolygon, point, lineString } from '@turf/turf'
import desertZones from '../data/desertZones.geojson'
// Toutes les fonctions sont pures — pas d'état global, pas de React
export function analyzeDesertIntersection(canal: Canal, desertFeatures: FeatureCollection): DesertIntersection | null
```

From src/types/calculation.ts:
```typescript
export type Interval = [number, number]
```

Tests attendus GREEN (extraits de T01):
- calcDesalinationNodes(499) === 0, calcDesalinationNodes(500) === 1, calcDesalinationNodes(1000) === 2
- calcSolarFactor([..., lat < 35]) === 1.0 ; calcSolarFactor([..., lat >= 35]) === 0.7
- calcDesalinationCost(1) === [50_000_000, 150_000_000]
- calcDesalinationCost(2) === [100_000_000, 300_000_000]
- calcWaterProduction(0, 1.0) === [0, 0]
- calcWaterProduction(2, 1.0) : ratio max/min entre 1.2 et 2.0
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Implémenter desalinationEngine.ts — toutes fonctions GREEN</name>
  <files>src/lib/desalinationEngine.ts</files>
  <behavior>
    Chaque fonction doit satisfaire les tests de T01 :

    classifyEcosystem(points, desertFeatures):
    - Crée une LineString Turf depuis points
    - Itère les features de desertZones
    - Si booleanIntersects(line, feature) → retourne 'low'
    - Sinon → retourne 'neutral'
    - Note : 'critical' est réservé pour une heuristique cours d'eau (déférée per CONTEXT.md) — retourner 'neutral' pour tout ce qui n'est pas désert

    calcDesalinationNodes(lengthKm):
    - Retourne Math.floor(lengthKm / 500)
    - Retourne 0 si lengthKm < 500

    calcSolarFactor(points):
    - Pour chaque point [lng, lat], vérifier Math.abs(lat) < 35
    - Si TOUS les points ont abs(lat) < 35 → retourne 1.0
    - Sinon → retourne 0.7
    - Logique : utiliser le facteur 0.7 dès qu'un point est hors tropiques (conservateur)

    calcWaterProduction(nodes, solarFactor):
    - Si nodes === 0 → retourne [0, 0]
    - Base : 10_000 m³/jour/nœud × solarFactor
    - Fourchette : [base × 0.8, base × 1.2] — UX-01 ±20%
    - Retourne [nodes × 10_000 × solarFactor × 0.8, nodes × 10_000 × solarFactor × 1.2]

    calcSaltValue(nodes, lengthKm):
    - Si nodes === 0 → retourne [0, 0]
    - Débit eau traité = waterProduction min en m³/jour = nodes × 10_000 × 0.8
    - Volume annuel m³/an = débit × 365
    - Masse sel = volume × 35 kg/m³ (salinité océanique)
    - Prix NaCl marché : min = 0.05 €/kg, max = 0.15 €/kg
    - Retourne [masse × 0.05, masse × 0.15] en €/an

    calcHabitableZones(nodes):
    - Si nodes === 0 → retourne [0, 0]
    - Base : 500 km² par nœud (rayon ~12.6 km autour du nœud)
    - Fourchette : [nodes × 500 × 0.7, nodes × 500 × 1.3] — UX-01 ±30%

    calcDesalinationCost(nodes):
    - Retourne [nodes × 50_000_000, nodes × 150_000_000]
    - Si nodes === 0 → [0, 0]
  </behavior>
  <action>
Réécrire src/lib/desalinationEngine.ts avec l'implémentation complète.

Remplacer les stubs par les implémentations réelles selon les specs de la section `behavior` ci-dessus.

Points d'attention critiques :
1. Importer `booleanIntersects` et `lineString` depuis `@turf/turf` — même pattern qu'ecologyEngine.ts
2. Importer `desertZones` depuis `../data/desertZones.geojson` — même chemin qu'ecologyEngine.ts
3. calcSolarFactor : utiliser `points.every(([_lng, lat]) => Math.abs(lat) < 35)` — Coord = [lng, lat], index 1 = latitude
4. calcSaltValue : utiliser le débit plancher (nodes × 10_000 × 0.8) pour base de calcul sel
5. Ne pas modifier les signatures des fonctions exportées (T03 les consomme directement)
6. computeDesalinationAnalysis appelle calcSolarFactor en interne si solarFactor non fourni — mais accepte aussi un solarFactor pre-calculé via DesalinationParams

Vérifier après implémentation que le ratio calcWaterProduction(1, 1.0)[1] / calcWaterProduction(1, 1.0)[0] = 1.5 (12000/8000).
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx vitest run src/tests/desalinationEngine.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>Tous les tests desalinationEngine.test.ts passent GREEN. `npx vitest run` montre 107+ tests toujours GREEN (aucune régression).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| desertZones.geojson → booleanIntersects | Données géospatiales bundlées — Turf.js opère sur structures locales uniquement |
| Coord[] (points canal) → calcSolarFactor | Points issus du tracé utilisateur — valeurs [lng, lat] WGS84 validées par le store |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-09-03 | Tampering | calcSaltValue formula | accept | Formule deterministe sur constantes locked — aucune entrée externe |
| T-09-04 | Denial of Service | booleanIntersects sur grande FeatureCollection | accept | desertZones.geojson est fixe et limité (~50 polygones) — pas de boucle infinie possible |
</threat_model>

<verification>
- `npx vitest run src/tests/desalinationEngine.test.ts` : tous les tests GREEN
- `npx vitest run` : 107+ tests toujours GREEN (aucune régression sur phases précédentes)
- `npx tsc --noEmit` : zéro erreur TypeScript
</verification>

<success_criteria>
- classifyEcosystem : 'low' pour zone désertique, 'neutral' hors désert
- calcDesalinationNodes(500) === 1, calcDesalinationNodes(499) === 0
- calcSolarFactor : 1.0 si tous points < 35° abs latitude, 0.7 sinon
- calcWaterProduction(2, 1.0) === [16000, 24000] m³/jour
- calcDesalinationCost(2) === [100_000_000, 300_000_000] €
- Tous les tests desalinationEngine.test.ts GREEN
- Aucune régression sur les 107+ tests existants
</success_criteria>

<output>
Après completion, créer `.planning/phases/09-eau-salee-dessalement/09-T02-SUMMARY.md`
</output>

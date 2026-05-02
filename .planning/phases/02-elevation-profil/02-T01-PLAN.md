---
phase: 02-elevation-profil
plan: T01
type: execute
wave: 0
depends_on: []
files_modified:
  - src/types/elevation.ts
  - src/types/canal.ts
  - src/store/canalStore.ts
  - src/tests/samplePoints.test.ts
  - src/tests/elevationApi.test.ts
  - src/tests/uphill.test.ts
autonomous: true
requirements:
  - MAP-03
  - MAP-04

must_haves:
  truths:
    - "Le type ElevationProfile est défini et exporté depuis src/types/elevation.ts"
    - "Canal accepte les champs elevation, elevationLoading, elevationError sans casser les canaux Phase 1"
    - "Le store Zustand expose setElevation, setElevationLoading, setElevationError"
    - "Les stubs de test compilent et npm test passe (les tests vides ou en attente n'échouent pas)"
    - "recharts et @turf/turf sont installés dans node_modules"
  artifacts:
    - path: "src/types/elevation.ts"
      provides: "ElevationPoint, UphillSegment, ElevationProfile"
      exports: ["ElevationPoint", "UphillSegment", "ElevationProfile"]
    - path: "src/types/canal.ts"
      provides: "Canal étendu avec champs elevation optionnels"
      contains: "elevation?: ElevationProfile"
    - path: "src/store/canalStore.ts"
      provides: "Actions setElevation, setElevationLoading, setElevationError"
      contains: "setElevation"
    - path: "src/tests/samplePoints.test.ts"
      provides: "Scaffold de tests sampling"
    - path: "src/tests/elevationApi.test.ts"
      provides: "Scaffold de tests fetch + parsing"
    - path: "src/tests/uphill.test.ts"
      provides: "Tests complets détection uphill"
  key_links:
    - from: "src/types/canal.ts"
      to: "src/types/elevation.ts"
      via: "import type { ElevationProfile }"
      pattern: "from.*./elevation"
    - from: "src/store/canalStore.ts"
      to: "src/types/elevation.ts"
      via: "import type { ElevationProfile }"
      pattern: "setElevation.*ElevationProfile"
---

<objective>
Installer les dépendances, créer les types d'élévation, étendre le store Zustand, et poser les stubs de test Wave 0. Ce plan est la fondation que T02 et T03 consomment.

Purpose: Garantir que les contrats de types et les actions du store sont établis avant toute implémentation — les plans T02 et T03 s'appuient directement sur ces exports.
Output: src/types/elevation.ts, src/types/canal.ts étendu, src/store/canalStore.ts étendu, 3 fichiers de test, recharts + @turf/turf installés.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/dev/gsd/science/canal/.planning/PROJECT.md
@C:/dev/gsd/science/canal/.planning/ROADMAP.md
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-CONTEXT.md
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-VALIDATION.md

<interfaces>
<!-- Types et contrats actuels — extraits des fichiers source Phase 1 -->

From src/types/canal.ts (CURRENT — à étendre):
```typescript
export type Coord = [number, number]  // [lng, lat] — JAMAIS [lat, lng]
export type UIMode = 'selection' | 'drawing'
export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
}
```

From src/store/canalStore.ts (CURRENT — actions existantes à préserver):
```typescript
interface CanalStore {
  canals: Canal[]
  mode: UIMode
  draftPoints: Coord[]
  previewCoord: Coord | null
  selectedCanalId: string | null
  startDrawing: () => void
  addWaypoint: (coord: Coord) => void
  updatePreview: (coord: Coord) => void
  finalizeCanal: () => void
  cancelDrawing: () => void
  deleteCanal: (id: string) => void
  selectCanal: (id: string | null) => void
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Installer les dépendances et créer src/types/elevation.ts</name>
  <read_first>
    - C:/dev/gsd/science/canal/package.json — vérifier recharts et @turf/turf absents avant install
    - C:/dev/gsd/science/canal/src/types/canal.ts — lire l'état ACTUEL avant modification
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md — sections "Type Definitions" et "Standard Stack" pour versions exactes
  </read_first>
  <files>src/types/elevation.ts, src/types/canal.ts</files>
  <action>
1. Installer les dépendances manquantes :
   ```bash
   cd C:/dev/gsd/science/canal && npm install recharts @turf/turf
   ```
   Versions cibles : recharts ^3.8.1, @turf/turf ^7.3.5

2. Créer src/types/elevation.ts avec exactement ce contenu :
   ```typescript
   // src/types/elevation.ts
   // Types du profil altimétrique — Phase 2
   // null d'élévation API normalisé à 0 lors du fetch (hors-couverture DEM = mer ou zone isolée)

   export interface ElevationPoint {
     distance: number  // km depuis le début du tracé
     altitude: number  // mètres Copernicus GLO-30 (null normalisé à 0 lors du fetch)
   }

   export interface UphillSegment {
     distanceStart: number  // km — début du segment montant
     distanceEnd:   number  // km — fin du segment montant
     altitudeGain:  number  // m — dénivelé positif du segment (toujours > 0)
   }

   export interface ElevationProfile {
     points:          ElevationPoint[]  // 100 points ordonnés par distance croissante
     uphillSegments:  UphillSegment[]   // segments où l'altitude monte (eau ne peut pas couler)
     totalUphillGain: number            // m — somme de tous les altitudeGain
     isFullyGravity:  boolean           // true si uphillSegments.length === 0
     fetchedAt:       number            // Date.now() — cache mémoire Zustand, re-fetch si reload
   }
   ```

3. Étendre src/types/canal.ts — ajouter l'import et 3 champs optionnels à l'interface Canal :
   ```typescript
   // src/types/canal.ts
   // Coordonnées toujours [lng, lat] WGS84 — JAMAIS [lat, lng] (Pitfall 10)
   import type { ElevationProfile } from './elevation'

   export type Coord = [number, number]  // [lng, lat]

   export type UIMode = 'selection' | 'drawing'

   export interface Canal {
     id: string             // crypto.randomUUID()
     points: Coord[]        // minimum 2 points pour finaliser
     name: string           // "Canal 1", "Canal 2", ...
     createdAt: number      // Date.now()
     elevation?: ElevationProfile  // Phase 2 — optionnel, rétrocompat Phase 1
     elevationLoading?: boolean    // Phase 2 — true pendant le fetch
     elevationError?: string       // Phase 2 — message d'erreur si fetch échoué
   }
   ```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && node -e "require('./node_modules/recharts')" && echo "recharts OK" && node -e "require('./node_modules/@turf/turf')" && echo "turf OK"</automated>
  </verify>
  <acceptance_criteria>
    - node_modules/recharts/ existe
    - node_modules/@turf/ existe
    - src/types/elevation.ts contient "export interface ElevationProfile"
    - src/types/elevation.ts contient "export interface UphillSegment"
    - src/types/elevation.ts contient "export interface ElevationPoint"
    - src/types/canal.ts contient "elevation?: ElevationProfile"
    - src/types/canal.ts contient "elevationLoading?: boolean"
    - src/types/canal.ts contient "elevationError?: string"
    - src/types/canal.ts contient "import type { ElevationProfile } from './elevation'"
  </acceptance_criteria>
  <done>recharts et @turf/turf installés, src/types/elevation.ts créé avec les 3 interfaces, src/types/canal.ts étendu avec les 3 champs optionnels.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Étendre canalStore + créer les tests Wave 0</name>
  <read_first>
    - C:/dev/gsd/science/canal/src/store/canalStore.ts — lire l'état ACTUEL complet avant modification
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md — Pattern 7 (extension store Zustand) et Pattern 3 (algorithme uphill)
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-VALIDATION.md — Wave 0 Requirements (liste exacte des tests à créer)
  </read_first>
  <files>src/store/canalStore.ts, src/tests/samplePoints.test.ts, src/tests/elevationApi.test.ts, src/tests/uphill.test.ts</files>
  <behavior>
    Tests uphill (src/tests/uphill.test.ts) — comportements à vérifier :
    - detectUphillSegments([]) → [] (tableau vide)
    - detectUphillSegments([{distance:0, altitude:100}, {distance:1, altitude:80}]) → [] (isFullyGravity = true)
    - detectUphillSegments([{distance:0, altitude:50}, {distance:1, altitude:100}]) → un segment [{distanceStart:0, distanceEnd:1, altitudeGain:50}]
    - detectUphillSegments([{distance:0,alt:100},{distance:1,alt:80},{distance:2,alt:120},{distance:3,alt:90}]) → un segment [{distanceStart:1, distanceEnd:2, altitudeGain:40}]
    - Si segment ouvert à la fin du tableau → inclus dans les résultats avec distanceEnd = dernier point

    Tests sampling (src/tests/samplePoints.test.ts) — stubs à créer :
    - samplePoints retourne exactement n points (stub à compléter en T02)
    - samplePoints retourne des tableaux [lng, lat] (pas [lat, lng])

    Tests API (src/tests/elevationApi.test.ts) — stubs à créer :
    - fetchElevations appelle l'API avec "lat,lng" (inversion depuis [lng,lat])
    - r.elevation === null normalisé à 0
  </behavior>
  <action>
1. Étendre src/store/canalStore.ts — ajouter l'import ElevationProfile, 3 nouvelles actions dans l'interface CanalStore, et leur implémentation dans le create(). Conserver TOUTES les actions existantes (startDrawing, addWaypoint, etc.) :

   Ajouter en haut du fichier après l'import existant :
   ```typescript
   import type { ElevationProfile } from '../types/elevation'
   ```

   Ajouter dans l'interface CanalStore (après selectCanal) :
   ```typescript
   setElevation: (id: string, profile: ElevationProfile) => void
   setElevationLoading: (id: string, loading: boolean) => void
   setElevationError: (id: string, error: string) => void
   ```

   Ajouter dans le create() après l'implémentation de selectCanal :
   ```typescript
   setElevation: (id, profile) => set((state) => ({
     canals: state.canals.map((c) =>
       c.id === id ? { ...c, elevation: profile, elevationLoading: false, elevationError: undefined } : c
     ),
   })),
   setElevationLoading: (id, loading) => set((state) => ({
     canals: state.canals.map((c) =>
       c.id === id ? { ...c, elevationLoading: loading } : c
     ),
   })),
   setElevationError: (id, error) => set((state) => ({
     canals: state.canals.map((c) =>
       c.id === id ? { ...c, elevationError: error, elevationLoading: false } : c
     ),
   })),
   ```

2. Créer src/tests/uphill.test.ts avec les tests COMPLETS de detectUphillSegments (les tests doivent passer en T02 quand la fonction sera implémentée — créer le fichier avec les tests RED maintenant) :
   ```typescript
   // src/tests/uphill.test.ts
   import { describe, it, expect } from 'vitest'
   import { detectUphillSegments } from '../services/elevationApi'
   import type { ElevationPoint } from '../types/elevation'

   describe('detectUphillSegments', () => {
     it('retourne [] pour un tableau vide', () => {
       expect(detectUphillSegments([])).toEqual([])
     })

     it('retourne [] pour un profil monotone décroissant (100% gravitaire)', () => {
       const pts: ElevationPoint[] = [
         { distance: 0, altitude: 100 },
         { distance: 1, altitude: 80 },
         { distance: 2, altitude: 50 },
       ]
       expect(detectUphillSegments(pts)).toEqual([])
     })

     it('détecte un segment montant simple', () => {
       const pts: ElevationPoint[] = [
         { distance: 0, altitude: 50 },
         { distance: 1, altitude: 100 },
       ]
       const result = detectUphillSegments(pts)
       expect(result).toHaveLength(1)
       expect(result[0].distanceStart).toBe(0)
       expect(result[0].distanceEnd).toBe(1)
       expect(result[0].altitudeGain).toBe(50)
     })

     it('détecte un segment montant au milieu d\'un profil mixte', () => {
       const pts: ElevationPoint[] = [
         { distance: 0, altitude: 100 },
         { distance: 1, altitude: 80 },
         { distance: 2, altitude: 120 },
         { distance: 3, altitude: 90 },
       ]
       const result = detectUphillSegments(pts)
       expect(result).toHaveLength(1)
       expect(result[0].distanceStart).toBe(1)
       expect(result[0].distanceEnd).toBe(2)
       expect(result[0].altitudeGain).toBeCloseTo(40, 0)
     })

     it('ferme un segment ouvert à la fin du tableau', () => {
       const pts: ElevationPoint[] = [
         { distance: 0, altitude: 0 },
         { distance: 1, altitude: 50 },
         { distance: 2, altitude: 100 },
       ]
       const result = detectUphillSegments(pts)
       expect(result).toHaveLength(1)
       expect(result[0].distanceStart).toBe(0)
       expect(result[0].distanceEnd).toBe(2)
     })
   })
   ```

3. Créer src/tests/samplePoints.test.ts (stubs — les expects seront complétés quand samplePoints sera implémenté en T02) :
   ```typescript
   // src/tests/samplePoints.test.ts
   // Tests pour samplePoints() — implémentation en T02
   import { describe, it, expect } from 'vitest'

   // Import commenté jusqu'à ce que la fonction existe (T02)
   // import { samplePoints } from '../services/elevationApi'

   describe('samplePoints', () => {
     it.todo('retourne exactement n points pour un tracé valide')
     it.todo('retourne des coordonnées au format [lng, lat] (pas [lat, lng])')
     it.todo('inclut le point de départ et le point d\'arrivée')
   })
   ```

4. Créer src/tests/elevationApi.test.ts (stubs — les expects seront complétés en T02) :
   ```typescript
   // src/tests/elevationApi.test.ts
   // Tests pour fetchElevations() + buildProfile() — implémentation en T02
   import { describe, it, expect, vi, beforeEach } from 'vitest'

   // Import commenté jusqu'à ce que les fonctions existent (T02)
   // import { fetchElevations, buildProfile } from '../services/elevationApi'

   describe('fetchElevations', () => {
     beforeEach(() => {
       vi.restoreAllMocks()
     })

     it.todo('appelle l\'API avec les coordonnées au format "lat,lng|lat,lng" (inversion [lng,lat] → lat,lng)')
     it.todo('normalise null à 0 pour les zones hors-couverture DEM')
     it.todo('lance une erreur si la réponse HTTP est non-OK')
     it.todo('lance une erreur si data.status !== "OK"')
   })

   describe('buildProfile', () => {
     it.todo('calcule les distances en km depuis le début du tracé')
     it.todo('construit ElevationProfile avec isFullyGravity = true si pas de montées')
   })
   ```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npm test -- --reporter=verbose 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - src/store/canalStore.ts contient "setElevation: (id: string, profile: ElevationProfile) => void"
    - src/store/canalStore.ts contient "setElevationLoading: (id: string, loading: boolean) => void"
    - src/store/canalStore.ts contient "setElevationError: (id: string, error: string) => void"
    - src/store/canalStore.ts contient "import type { ElevationProfile } from '../types/elevation'"
    - src/tests/uphill.test.ts existe et contient "detectUphillSegments"
    - src/tests/samplePoints.test.ts existe et contient "samplePoints"
    - src/tests/elevationApi.test.ts existe et contient "fetchElevations"
    - npm test ne signale PAS d'erreur TypeScript dans canalStore.ts
    - Les tests uphill.test.ts sont RED (import non résolu — attendu, T02 crée elevationApi.ts)
    - Les tests samplePoints et elevationApi sont en mode .todo (ne fail pas)
  </acceptance_criteria>
  <done>Store étendu avec 3 nouvelles actions, 3 fichiers de test Wave 0 créés, npm test montre les tests uphill (RED attendu jusqu'à T02) et les stubs todo.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry → node_modules | Packages tiers installés via npm |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Tampering | src/types/elevation.ts | accept | Types compile-time seulement — aucune surface d'attaque runtime |
| T-02-02 | Tampering | src/store/canalStore.ts | accept | State in-memory, aucune donnée sensible, canaux fictifs |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# 1. Dépendances installées
node -e "require('./node_modules/recharts')" && echo "recharts OK"
node -e "require('./node_modules/@turf/turf')" && echo "turf OK"
# 2. Types créés
grep -c "ElevationProfile" src/types/elevation.ts
grep -c "elevation?" src/types/canal.ts
# 3. Store étendu
grep -c "setElevation" src/store/canalStore.ts
# 4. Tests créés
ls src/tests/
# 5. Suite de tests
npm test
```
</verification>

<success_criteria>
- recharts et @turf/turf présents dans node_modules
- src/types/elevation.ts exporte ElevationPoint, UphillSegment, ElevationProfile
- src/types/canal.ts : interface Canal contient elevation?, elevationLoading?, elevationError?
- src/store/canalStore.ts : CanalStore interface et implémentation contiennent setElevation, setElevationLoading, setElevationError
- src/tests/ contient samplePoints.test.ts, elevationApi.test.ts, uphill.test.ts
- npm test se termine sans erreur TypeScript de compilation
</success_criteria>

<output>
After completion, create `.planning/phases/02-elevation-profil/02-T01-SUMMARY.md`
</output>

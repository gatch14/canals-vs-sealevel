---
phase: 03-routing-optimal
plan: T01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/types/routing.ts
  - src/types/canal.ts
  - src/store/canalStore.ts
  - src/store/canalStore.test.ts
autonomous: true
requirements: [MAP-05]

must_haves:
  truths:
    - "Le type RoutingState couvre les 7 états : idle, selecting-start, selecting-end, computing, timeout, error, no-path"
    - "L'interface Canal comporte le champ isRouted?: boolean (rétrocompat Phase 1/2)"
    - "Le store expose les 6 nouvelles actions routing (startRouting, setRoutingStart, setRoutingEnd, setRoutingState, finalizeRoutedCanal, cancelRouting)"
    - "finalizeRoutedCanal crée un canal nommé 'Canal optimal N', marque isRouted: true et sélectionne le canal"
    - "cancelRouting remet le mode à 'selection' et efface routingStart/routingEnd/routingState"
    - "Les tests du store (existants + nouveaux) sont tous VERTS"
  artifacts:
    - path: "src/types/routing.ts"
      provides: "Coord (re-export canal.ts), RoutingState, RoutingRequest, RoutingResult"
      exports: ["Coord", "RoutingState", "RoutingRequest", "RoutingResult"]
    - path: "src/store/canalStore.ts"
      provides: "State routing + 6 actions routing"
      contains: "routingState"
    - path: "src/tests/routingGrid.test.ts"
      provides: "Stubs Wave 0 pour MAP-05 (buildGrid, getResolution, fetchGridElevations, buildGraph, findPath)"
      min_lines: 60
  key_links:
    - from: "src/types/routing.ts"
      to: "src/types/canal.ts"
      via: "re-export Coord"
      pattern: "export.*Coord.*from.*canal"
    - from: "src/store/canalStore.ts"
      to: "src/types/routing.ts"
      via: "import RoutingState"
      pattern: "import.*RoutingState.*from.*routing"
    - from: "src/store/canalStore.ts"
      to: "finalizeRoutedCanal"
      via: "selectCanal(newCanal.id) dans l'action"
      pattern: "selectCanal"
---

<objective>
Fondation de la Phase 3 : types routing + extension du store Zustand + stubs de tests Wave 0.

Purpose: Définir les contrats de types que T02 implémentera et T03 consommera. Créer les tests RED qui valideront l'implémentation. Pas d'algorithme ici — uniquement types, état, et tests.
Output: src/types/routing.ts, canal.ts étendu, canalStore.ts étendu, canalStore.test.ts étendu, src/tests/routingGrid.test.ts (stubs Wave 0).
</objective>

<execution_context>
@C:\Users\gatch\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\gatch\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\dev\gsd\science\canal\.planning\PROJECT.md
@C:\dev\gsd\science\canal\.planning\ROADMAP.md
@C:\dev\gsd\science\canal\.planning\STATE.md

<interfaces>
<!-- Fichiers existants à lire avant toute modification -->

From src/types/canal.ts (état actuel — LIRE AVANT MODIFICATION):
```typescript
export type Coord = [number, number]  // [lng, lat]
export type UIMode = 'selection' | 'drawing'

export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  elevation?: ElevationProfile
  elevationLoading?: boolean
  elevationError?: string
  // Phase 3 : ajouter ici isRouted?: boolean
}
```

From src/store/canalStore.ts (état actuel — LIRE AVANT MODIFICATION):
```typescript
interface CanalStore {
  canals: Canal[]
  mode: UIMode
  draftPoints: Coord[]
  previewCoord: Coord | null
  selectedCanalId: string | null
  // Actions Phase 1+2 : startDrawing, addWaypoint, updatePreview, finalizeCanal,
  // cancelDrawing, deleteCanal, selectCanal, setElevation, setElevationLoading, setElevationError
}
// Créé via : export const useCanalStore = create<CanalStore>()((set, get) => ({ ... }))
```

From src/store/canalStore.test.ts (structure existante — LIRE AVANT EXTENSION):
```typescript
// Pattern reset à étendre dans beforeEach :
beforeEach(() => {
  useCanalStore.setState({
    canals: [], mode: 'selection', draftPoints: [],
    previewCoord: null, selectedCanalId: null,
    // Phase 3 : ajouter routingState: 'idle', routingStart: null, routingEnd: null
  })
})
```

From src/tests/elevationApi.test.ts (pattern mock fetch — REPRENDRE EXACTEMENT):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
// Pattern vi.stubGlobal + vi.restoreAllMocks
// Pattern test.todo() pour stubs Wave 0
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ elevation: [100, 200] }),
})
vi.stubGlobal('fetch', mockFetch)
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1 : Créer src/types/routing.ts + étendre canal.ts</name>
  <read_first>
    - C:\dev\gsd\science\canal\src\types\canal.ts (lire AVANT modification — état exact ligne par ligne)
    - C:\dev\gsd\science\canal\src\types\elevation.ts (pattern de structure de fichier types)
  </read_first>
  <files>src/types/routing.ts, src/types/canal.ts</files>
  <behavior>
    - routing.ts exporte : Coord (re-export depuis canal.ts), RoutingState (union de 7 littéraux), RoutingRequest (interface), RoutingResult (union discriminée)
    - canal.ts : UIMode étendu avec 'routing', Canal étendu avec isRouted?: boolean
  </behavior>
  <action>
Créer `src/types/routing.ts` avec ce contenu exact :

```typescript
// src/types/routing.ts
// Types du routing Dijkstra — Phase 3
export type { Coord } from './canal'  // Re-export pour éviter double définition

export type RoutingState =
  | 'idle'
  | 'selecting-start'
  | 'selecting-end'
  | 'computing'
  | 'timeout'
  | 'error'
  | 'no-path'

export interface RoutingRequest {
  start: [number, number]  // [lng, lat] — résolution adaptative
  end: [number, number]    // [lng, lat]
  resolution: 50 | 100    // distance ≤100km → 50, >100km → 100 (locked CONTEXT.md)
}

export type RoutingResult =
  | { type: 'result'; path: [number, number][] }  // chemin [lng,lat][] start→end
  | { type: 'no-path' }
  | { type: 'error'; message: string }
```

Modifier `src/types/canal.ts` — deux changements :
1. Changer `UIMode` : `export type UIMode = 'selection' | 'drawing' | 'routing'`
2. Ajouter dans Canal après `elevationError?` : `isRouted?: boolean  // Phase 3 — canal généré par routing automatique`
  </action>
  <verify>
    <automated>cd C:\dev\gsd\science\canal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - `grep -n "routing" src/types/canal.ts` retourne 2 lignes : UIMode avec 'routing' ET isRouted?
    - `grep -n "RoutingState\|RoutingRequest\|RoutingResult" src/types/routing.ts` retourne 3 lignes
    - `grep "export.*Coord.*from.*canal" src/types/routing.ts` retourne 1 ligne
    - `npx tsc --noEmit` retourne 0 erreur
  </acceptance_criteria>
  <done>Types compilent sans erreur, UIMode inclut 'routing', Canal a isRouted?, routing.ts exporte les 4 types.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2 : Étendre canalStore.ts + créer tests Wave 0</name>
  <read_first>
    - C:\dev\gsd\science\canal\src\store\canalStore.ts (lire AVANT modification — état exact)
    - C:\dev\gsd\science\canal\src\store\canalStore.test.ts (lire AVANT extension)
    - C:\dev\gsd\science\canal\src\tests\elevationApi.test.ts (pattern mock fetch à reproduire)
  </read_first>
  <files>src/store/canalStore.ts, src/store/canalStore.test.ts, src/tests/routingGrid.test.ts</files>
  <behavior>
    - canalStore : 3 nouveaux champs (routingState, routingStart, routingEnd) + 6 nouvelles actions
    - finalizeRoutedCanal : crée Canal avec name='Canal optimal N', isRouted:true, puis appelle selectCanal(newId)
    - canalStore.test.ts : beforeEach reset étendu + 5 nouveaux tests routing actions
    - routingGrid.test.ts : stubs Wave 0 (it.todo) pour les 7 comportements MAP-05
  </behavior>
  <action>
**1. Étendre `src/store/canalStore.ts` :**

Ajouter l'import en tête : `import type { RoutingState } from '../types/routing'`

Étendre l'interface `CanalStore` avec :
```typescript
  // State routing — Phase 3
  routingState: RoutingState
  routingStart: [number, number] | null
  routingEnd: [number, number] | null

  // Actions routing — Phase 3
  startRouting: () => void
  setRoutingStart: (coord: [number, number]) => void
  setRoutingEnd: (coord: [number, number]) => void
  setRoutingState: (state: RoutingState) => void
  finalizeRoutedCanal: (path: [number, number][]) => void
  cancelRouting: () => void
```

Ajouter dans les valeurs initiales (create) :
```typescript
  routingState: 'idle' as RoutingState,
  routingStart: null,
  routingEnd: null,
```

Ajouter les implémentations des actions :
```typescript
  startRouting: () => set({ mode: 'routing', routingState: 'selecting-start', routingStart: null, routingEnd: null }),

  setRoutingStart: (coord) => set({ routingStart: coord, routingState: 'selecting-end' }),

  setRoutingEnd: (coord) => set({ routingEnd: coord, routingState: 'computing' }),

  setRoutingState: (state) => set({ routingState: state }),

  finalizeRoutedCanal: (path) => {
    const { canals } = get()
    if (path.length < 2) return  // garde obligatoire
    const newCanal: Canal = {
      id: crypto.randomUUID(),
      points: path,
      name: `Canal optimal ${canals.length + 1}`,
      createdAt: Date.now(),
      isRouted: true,
    }
    set((state) => ({
      canals: [...state.canals, newCanal],
      mode: 'selection',
      routingState: 'idle',
      routingStart: null,
      routingEnd: null,
      selectedCanalId: newCanal.id,
    }))
  },

  cancelRouting: () => set({ mode: 'selection', routingState: 'idle', routingStart: null, routingEnd: null }),
```

**2. Étendre `src/store/canalStore.test.ts` :**

Ajouter dans le `beforeEach` `setState` (après `selectedCanalId: null`) :
```typescript
    routingState: 'idle',
    routingStart: null,
    routingEnd: null,
```

Ajouter après le describe existant un nouveau bloc :
```typescript
describe('useCanalStore — MAP-05 routing actions', () => {
  it('startRouting passe en mode routing et routingState selecting-start', () => {
    useCanalStore.getState().startRouting()
    expect(useCanalStore.getState().mode).toBe('routing')
    expect(useCanalStore.getState().routingState).toBe('selecting-start')
    expect(useCanalStore.getState().routingStart).toBeNull()
  })

  it('setRoutingStart enregistre les coordonnées et passe à selecting-end', () => {
    useCanalStore.getState().startRouting()
    useCanalStore.getState().setRoutingStart([2.35, 48.85])
    expect(useCanalStore.getState().routingStart).toEqual([2.35, 48.85])
    expect(useCanalStore.getState().routingState).toBe('selecting-end')
  })

  it('setRoutingEnd enregistre les coordonnées et passe à computing', () => {
    useCanalStore.getState().startRouting()
    useCanalStore.getState().setRoutingStart([2.35, 48.85])
    useCanalStore.getState().setRoutingEnd([5.0, 45.0])
    expect(useCanalStore.getState().routingEnd).toEqual([5.0, 45.0])
    expect(useCanalStore.getState().routingState).toBe('computing')
  })

  it('finalizeRoutedCanal crée canal isRouted avec sélection auto', () => {
    const path: [number, number][] = [[2.35, 48.85], [3.0, 47.0], [5.0, 45.0]]
    useCanalStore.getState().finalizeRoutedCanal(path)
    const canals = useCanalStore.getState().canals
    expect(canals).toHaveLength(1)
    expect(canals[0].isRouted).toBe(true)
    expect(canals[0].name).toMatch(/^Canal optimal/)
    expect(canals[0].points).toEqual(path)
    expect(useCanalStore.getState().selectedCanalId).toBe(canals[0].id)
    expect(useCanalStore.getState().mode).toBe('selection')
    expect(useCanalStore.getState().routingState).toBe('idle')
  })

  it('cancelRouting remet selection + idle et efface les points', () => {
    useCanalStore.getState().startRouting()
    useCanalStore.getState().setRoutingStart([2.35, 48.85])
    useCanalStore.getState().cancelRouting()
    expect(useCanalStore.getState().mode).toBe('selection')
    expect(useCanalStore.getState().routingState).toBe('idle')
    expect(useCanalStore.getState().routingStart).toBeNull()
  })
})
```

**3. Créer `src/tests/routingGrid.test.ts` (stubs Wave 0) :**

```typescript
// src/tests/routingGrid.test.ts
// Stubs Wave 0 — MAP-05 — implémentation dans T02 (routingGrid.ts)
import { describe, it } from 'vitest'
// Les imports seront décommentés en T02 quand routingGrid.ts existera
// import { buildGrid, getResolution, fetchGridElevations, buildGraph, findPath } from '../services/routingGrid'

describe('buildGrid — MAP-05', () => {
  it.todo('retourne exactement N×N points pour une grille 5×5')
  it.todo('les points couvrent la bbox avec marge 10%')
  it.todo('le premier point est coin bas-gauche, dernier point est coin haut-droit')
})

describe('getResolution — MAP-05', () => {
  it.todo('retourne 50 pour une distance ≤ 100 km')
  it.todo('retourne 100 pour une distance > 100 km')
})

describe('fetchGridElevations — MAP-05', () => {
  it.todo('envoie des batches de max 100 coordonnées (2500 points = 25 requêtes)')
  it.todo('utilise latitude= et longitude= séparés (inversion depuis [lng,lat])')
  it.todo('normalise null à 0 pour les zones hors-couverture DEM')
  it.todo('lance une erreur Open Meteo HTTP XXX si réponse non-OK')
  it.todo('valide que lat ∈ [-90, 90] et lng ∈ [-180, 180] avant fetch')
})

describe('buildGraph + findPath — MAP-05', () => {
  it.todo('buildGraph crée N×N nœuds avec connectivité 8')
  it.todo('findPath retourne un chemin non-vide sur grille plate (obstacles nuls)')
  it.todo('findPath retourne [] quand obstacle infranchissable sépare départ et arrivée')
  it.todo('le chemin retourné est ordonné start → end (inversion .reverse() appliquée)')
  it.todo('findNearestNode mappe un point hors-grille sur le nœud le plus proche')
})
```
  </action>
  <verify>
    <automated>cd C:\dev\gsd\science\canal && npm test -- src/store/canalStore.test.ts 2>&1 | tail -15</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "routingState\|routingStart\|routingEnd" src/store/canalStore.ts` retourne >= 6 (déclarations interface + implémentations)
    - `grep "startRouting\|setRoutingStart\|setRoutingEnd\|setRoutingState\|finalizeRoutedCanal\|cancelRouting" src/store/canalStore.ts | wc -l` retourne >= 6
    - `npm test -- src/store/canalStore.test.ts` retourne "10 passed" (5 Phase 1/2 + 5 Phase 3)
    - `grep -c "it.todo" src/tests/routingGrid.test.ts` retourne 12 (ou plus)
    - `npx tsc --noEmit` retourne 0 erreur
    - `grep "Canal optimal" src/store/canalStore.ts` retourne 1 ligne (dans finalizeRoutedCanal)
    - `grep "isRouted: true" src/store/canalStore.ts` retourne 1 ligne
  </acceptance_criteria>
  <done>10 tests store verts, 12 stubs todo dans routingGrid.test.ts, TypeScript 0 erreur, finalizeRoutedCanal crée canal avec name "Canal optimal N", isRouted: true, et selectCanal(newId) appelé.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| store → types | Les types routing sont compile-time uniquement — aucune surface runtime nouvelle |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-T01-01 | Tampering | canalStore.finalizeRoutedCanal | mitigate | Garde `if (path.length < 2) return` — même pattern que finalizeCanal Phase 1 |
| T-03-T01-02 | Tampering | UIMode 'routing' | accept | Mode géré uniquement par des actions Zustand typées — pas d'injection externe possible |
</threat_model>

<verification>
```bash
cd C:\dev\gsd\science\canal
npm test -- src/store/canalStore.test.ts
npx tsc --noEmit
```

Les deux commandes doivent retourner 0 erreur.
</verification>

<success_criteria>
- src/types/routing.ts existe avec RoutingState (7 valeurs), RoutingRequest, RoutingResult, re-export Coord
- src/types/canal.ts : UIMode inclut 'routing', Canal a isRouted?: boolean
- src/store/canalStore.ts : 3 champs + 6 actions routing ajoutés, finalizeRoutedCanal appelle selectCanal
- src/store/canalStore.test.ts : 10 tests VERTS (5 Phase 1/2 + 5 Phase 3)
- src/tests/routingGrid.test.ts : 12 stubs it.todo pour T02
- npx tsc --noEmit : 0 erreur
</success_criteria>

<output>
Après complétion, créer `.planning/phases/03-routing-optimal/03-T01-SUMMARY.md`
</output>

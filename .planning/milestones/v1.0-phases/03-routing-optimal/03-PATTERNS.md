# Phase 3: Routing Optimal - Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 10 (5 new, 5 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/routing.ts` | type definition | — | `src/types/elevation.ts` | exact (same role: pure types file) |
| `src/services/routingGrid.ts` | service | batch + transform | `src/services/elevationApi.ts` | exact (same role + Open-Meteo batching) |
| `src/workers/routingWorker.ts` | worker | event-driven | `src/services/elevationApi.ts` + `src/hooks/useElevation.ts` | role-match (no existing worker) |
| `src/hooks/useRoutingWorker.ts` | hook | event-driven | `src/hooks/useElevation.ts` | exact (async lifecycle hook + abort + store update) |
| `src/tests/routingGrid.test.ts` | test | — | `src/tests/elevationApi.test.ts` | exact (same: service unit tests + fetch mock) |
| `src/store/canalStore.ts` (modify) | store | CRUD | self | — (extend existing) |
| `src/types/canal.ts` (modify) | type definition | — | self | — (extend existing) |
| `src/components/DrawingToolbar.tsx` (modify) | component | request-response | self | — (extend existing button pattern) |
| `src/components/MapView.tsx` (modify) | component | event-driven | self | — (extend mode-based click handlers) |
| `src/components/SidePanel.tsx` (modify) | component | request-response | `src/components/ElevationPanel.tsx` | exact (spinner + état conditionnel + message) |

---

## Pattern Assignments

### `src/types/routing.ts` (type definition)

**Analog:** `src/types/elevation.ts`

**Imports pattern** (lines 1–3):
```typescript
// src/types/elevation.ts — en-tête de fichier types pur, commentaire inline obligatoire
// src/types/routing.ts
// Types du routing Dijkstra — Phase 3
// null d'élévation normalisé à 0 dans fetchGridElevations (hors-couverture DEM)
```

**Core pattern** — structure d'un fichier de types pur (lines 5–22):
```typescript
export interface ElevationPoint {
  distance: number  // km depuis le début du tracé
  altitude: number  // mètres Copernicus GLO-30 (null normalisé à 0 lors du fetch)
}

export interface ElevationProfile {
  points:          ElevationPoint[]
  uphillSegments:  UphillSegment[]
  totalUphillGain: number
  isFullyGravity:  boolean
  fetchedAt:       number  // Date.now()
}
```

**Pattern à copier pour routing.ts :** même style (commentaires inline sur chaque champ, types union pour les états discriminés). Le RESEARCH.md fournit les types exacts :

```typescript
// src/types/routing.ts
export type Coord = [number, number]  // [lng, lat] — JAMAIS [lat, lng]

export type RoutingState =
  | 'idle'
  | 'selecting-start'
  | 'selecting-end'
  | 'computing'
  | 'timeout'
  | 'error'
  | 'no-path'

export interface RoutingRequest {
  start: Coord
  end: Coord
  resolution: 50 | 100  // résolution adaptative — locked CONTEXT.md
}

export type RoutingResult =
  | { type: 'result'; path: Coord[] }
  | { type: 'no-path' }
  | { type: 'error'; message: string }
```

**Attention :** `Coord` est déjà défini dans `src/types/canal.ts` (ligne 5). Ne pas redéfinir — importer depuis `canal.ts` ou réexporter. Le planner doit trancher (importer depuis canal.ts est préférable pour cohérence).

---

### `src/services/routingGrid.ts` (service, batch + transform)

**Analog:** `src/services/elevationApi.ts`

**Imports pattern** (lines 1–8, elevationApi.ts):
```typescript
// src/services/elevationApi.ts
import { along, length, lineString } from '@turf/turf'
import type { Coord } from '../types/canal'
import type { ElevationPoint, ElevationProfile, UphillSegment } from '../types/elevation'
```

Pour routingGrid.ts, adapter :
```typescript
// src/services/routingGrid.ts
import { distance } from '@turf/turf'
import createGraph from 'ngraph.graph'
import { aStar } from 'ngraph.path'
import type { Coord } from '../types/canal'
import type { RoutingRequest, RoutingResult } from '../types/routing'
```

**Core Open-Meteo fetch pattern** (elevationApi.ts lines 30–53) — à adapter pour batching :
```typescript
// elevationApi.ts — fetch single batch (pattern de base à étendre)
export async function fetchElevations(
  coords: Coord[],
  signal?: AbortSignal,
): Promise<number[]> {
  const latitudes  = coords.map(([, lat]) => lat).join(',')
  const longitudes = coords.map(([lng]) => lng).join(',')
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Open Meteo HTTP ${response.status}`)
  }
  const data = await response.json()
  if (!Array.isArray(data.elevation)) {
    throw new Error(`Open Meteo: réponse invalide`)
  }
  return (data.elevation as (number | null)[]).map((v) => v ?? 0)
}
```

**Pattern d'erreur à copier** : `throw new Error(\`Open Meteo HTTP ${response.status}\`)` + `!Array.isArray(data.elevation)` → même messages pour cohérence.

**Structure du service routingGrid.ts** — 4 fonctions publiques (même découpage que elevationApi.ts qui exporte 4 fonctions) :
1. `buildGrid(start, end, N)` → `Coord[]` — grille NxN (RESEARCH.md Pattern 2)
2. `getResolution(start, end)` → `50 | 100` — résolution adaptative
3. `fetchGridElevations(coords, signal)` → `Promise<number[]>` — batching 100 coords max, concurrence 10 (RESEARCH.md Pattern 3)
4. `buildGraph(N, coords, elevations)` + `findPath(graph, startIdx, endIdx)` — ngraph (RESEARCH.md Pattern 1)

**Convention inversion coordonnées** (elevationApi.ts lignes 35–36) :
```typescript
// INVERSION : coords = [lng, lat], Open-Meteo attend latitude et longitude séparés
const latitudes  = coords.map(([, lat]) => lat).join(',')
const longitudes = coords.map(([lng]) => lng).join(',')
```
**Reprendre exactement ce pattern** dans `fetchGridElevations`.

---

### `src/workers/routingWorker.ts` (worker, event-driven)

**Pas d'analog direct** — premier Worker du projet. S'appuie sur deux analogs partiels :
- `src/services/elevationApi.ts` : logique fetch Open-Meteo
- `src/hooks/useElevation.ts` : pattern AbortController + signal + try/catch/finally

**Directive triple-slash obligatoire** (RESEARCH.md Pattern 4) :
```typescript
/// <reference lib="webworker" />
// Remplace lib DOM — évite conflits de types (Pitfall 4 RESEARCH.md)
```

**Pattern self.onmessage** (RESEARCH.md Pattern 4) :
```typescript
self.onmessage = async (e: MessageEvent<RoutingRequest>) => {
  const { start, end, resolution } = e.data
  try {
    // ... calculs ...
    self.postMessage({ type: 'result', path } satisfies RoutingResult)
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) } satisfies RoutingResult)
  }
}
```

**Pattern AbortController** (depuis useElevation.ts lignes 23–24) :
```typescript
// useElevation.ts — AbortController avec timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10_000)
```
Dans le worker, passer le signal à `fetchGridElevations` — même convention.

**Import ESM ngraph** (RESEARCH.md Code Examples) :
```typescript
import createGraph from 'ngraph.graph'
import { aStar } from 'ngraph.path'
```

**Convention coordonnées [lng, lat]** — depuis canal.ts ligne 5 :
```typescript
// Coordonnées toujours [lng, lat] WGS84 — JAMAIS [lat, lng] (Pitfall 10)
```
Cette convention s'applique aussi dans le worker : `[n.data.lng, n.data.lat]` lors de l'extraction du chemin.

---

### `src/hooks/useRoutingWorker.ts` (hook, event-driven)

**Analog:** `src/hooks/useElevation.ts` (exact match — même patron : lifecycle async, abort, store update)

**Imports pattern** (useElevation.ts lines 1–8) :
```typescript
// src/hooks/useElevation.ts
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { samplePoints, fetchElevations, buildProfile } from '../services/elevationApi'
```

Pour useRoutingWorker.ts :
```typescript
import { useEffect, useRef } from 'react'
import { useCanalStore } from '../store/canalStore'
import type { RoutingResult } from '../types/routing'
```

**Pattern useRef pour ressource non-React** — `mapRef` dans MapView.tsx (ligne 196) :
```typescript
// MapView.tsx — ref pour ressource non-sérialisable (Map ne va pas dans le state)
const mapRef = useRef<maplibregl.Map | null>(null)
```
Même pattern pour le Worker : `const workerRef = useRef<Worker | null>(null)` — jamais dans le store Zustand (anti-pattern documenté RESEARCH.md).

**Pattern timeout + cleanup** (useElevation.ts lines 23–52) :
```typescript
// useElevation.ts — AbortController + cancelled flag + cleanup
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10_000)
let cancelled = false

// ...

return () => {
  cancelled = true
  controller.abort()
  clearTimeout(timeoutId)
}
```
Pour useRoutingWorker.ts : remplacer `controller.abort()` par `workerRef.current?.terminate()`, timeout 30s au lieu de 10s.

**Pattern getState() dans handler** (useMapInteraction.ts ligne 40) :
```typescript
// useMapInteraction.ts — getState() dans handler DOM natif pour éviter stale closure
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') useCanalStore.getState().cancelDrawing()
}
```
Même pattern dans `worker.onmessage` si le handler est créé hors d'un useEffect React.

**Pattern sélecteurs granulaires** (useMapInteraction.ts lines 9–14) :
```typescript
// useMapInteraction.ts — sélecteurs granulaires, re-render uniquement si valeur change
const mode = useCanalStore((s) => s.mode)
const addWaypoint = useCanalStore((s) => s.addWaypoint)
```

---

### `src/tests/routingGrid.test.ts` (test, unit)

**Analog:** `src/tests/elevationApi.test.ts` (exact match — même structure : describe/it, vi.fn() fetch mock, tests fonctions pures du service)

**Imports pattern** (elevationApi.test.ts lines 1–4) :
```typescript
// src/tests/elevationApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchElevations, buildProfile } from '../services/elevationApi'
import type { Coord } from '../types/canal'
```

Pour routingGrid.test.ts :
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildGrid, getResolution, fetchGridElevations, buildGraph, findPath } from '../services/routingGrid'
import type { Coord } from '../types/canal'
```

**Pattern mock fetch** (elevationApi.test.ts lines 12–19) :
```typescript
// elevationApi.test.ts — mock fetch avec vi.stubGlobal
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ elevation: [100, 200] }),
})
vi.stubGlobal('fetch', mockFetch)
```
Reprendre exactement pour mocker `fetchGridElevations`.

**Pattern beforeEach restore** (elevationApi.test.ts lines 8–9) :
```typescript
beforeEach(() => {
  vi.restoreAllMocks()
})
```

**Pattern test erreur HTTP** (elevationApi.test.ts lines 41–49) :
```typescript
it('lance une erreur si la réponse HTTP est non-OK (429)', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 429,
    json: async () => ({}),
  }))
  await expect(fetchElevations([[2.3, 48.8]])).rejects.toThrow('HTTP 429')
})
```

**Pattern test store** (canalStore.test.ts lines 6–13) — pour les tests actions routing :
```typescript
// canalStore.test.ts — reset complet du store avant chaque test
beforeEach(() => {
  useCanalStore.setState({
    canals: [],
    mode: 'selection',
    draftPoints: [],
    previewCoord: null,
    selectedCanalId: null,
  })
})
```
Étendre avec les nouveaux champs routing dans le `setState` reset.

---

### `src/store/canalStore.ts` (modify — store extension)

**Pattern d'ajout de mode** — UIMode étendu (canal.ts ligne 7) :
```typescript
// src/types/canal.ts — pattern à copier pour étendre UIMode
export type UIMode = 'selection' | 'drawing'
// → devient : export type UIMode = 'selection' | 'drawing' | 'routing'
```

**Pattern action atomique** (canalStore.ts lines 34–57) :
```typescript
// canalStore.ts — actions atomiques qui resetent plusieurs champs ensemble
startDrawing: () => set({ mode: 'drawing', draftPoints: [], previewCoord: null }),

finalizeCanal: () => {
  const { draftPoints, canals } = get()
  if (draftPoints.length < 2) return  // garde obligatoire
  const newCanal: Canal = {
    id: crypto.randomUUID(),
    points: draftPoints,
    name: `Canal ${canals.length + 1}`,
    createdAt: Date.now(),
  }
  set((state) => ({
    canals: [...state.canals, newCanal],
    mode: 'selection',
    draftPoints: [],
    previewCoord: null,
  }))
},
```

**Pattern action map-update** (canalStore.ts lines 68–84) :
```typescript
// canalStore.ts — pattern immuable map() pour modifier un canal par id
setElevation: (id, profile) => set((state) => ({
  canals: state.canals.map((c) =>
    c.id === id ? { ...c, elevation: profile, elevationLoading: false, elevationError: undefined } : c
  ),
})),
```

**Nouveaux champs à ajouter dans le store** (issus de CONTEXT.md + RESEARCH.md) :
```typescript
// Champs d'état routing à ajouter dans CanalStore interface
routingState: RoutingState           // 'idle' par défaut
routingStart: Coord | null           // point départ sélectionné
routingEnd: Coord | null             // point arrivée sélectionné

// Actions à ajouter
startRouting: () => void             // mode → 'routing', routingState → 'selecting-start'
setRoutingStart: (coord: Coord) => void
setRoutingEnd: (coord: Coord) => void
setRoutingState: (state: RoutingState) => void
finalizeRoutedCanal: (path: Coord[]) => void  // crée Canal + selectCanal + reset routing
cancelRouting: () => void            // retour 'selection', reset tous les champs routing
```

---

### `src/types/canal.ts` (modify — minimal)

**Une seule ligne à ajouter** dans l'interface Canal (après `elevationError`) :
```typescript
// src/types/canal.ts — ligne 16, après elevationError
isRouted?: boolean  // Phase 3 — true si canal généré par routing automatique
```

---

### `src/components/DrawingToolbar.tsx` (modify — nouveau bouton)

**Pattern bouton mode** (DrawingToolbar.tsx lines 17–27) :
```typescript
// DrawingToolbar.tsx — bouton mode selection : bg-blue-500
<button
  onClick={startDrawing}
  className={`flex items-center gap-2 w-full px-4 py-2 rounded
              bg-blue-500 hover:bg-blue-600 active:scale-[0.98]
              text-white text-sm font-semibold transition-colors
              outline-none ${focusRing}`}
>
  <Pencil size={16} />
  Dessiner canal
</button>
```

**Pattern focusRing** (DrawingToolbar.tsx lines 5–7) :
```typescript
const focusRing =
  'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
```
Réutiliser cette constante — ne pas dupliquer.

**Pattern import store granulaire** (DrawingToolbar.tsx lines 8–11) :
```typescript
const mode = useCanalStore((s) => s.mode)
const startDrawing = useCanalStore((s) => s.startDrawing)
const cancelDrawing = useCanalStore((s) => s.cancelDrawing)
const draftPoints = useCanalStore((s) => s.draftPoints)
```

**Bouton routing à ajouter** — icône `Route` de lucide-react, couleur violette pour distinction visuelle (violet = `bg-purple-600 hover:bg-purple-700`), visible uniquement en mode `'selection'` (à côté du bouton "Dessiner canal").

**Bouton Annuler routing** — même pattern que le bouton Annuler dessin (DrawingToolbar.tsx lines 33–42) : `bg-gray-700 hover:bg-gray-600`, icône `X`.

---

### `src/components/MapView.tsx` (modify — routing click handlers + markers)

**Pattern useRef pour ressource externe** (MapView.tsx lines 195–196) :
```typescript
const mapContainerRef = useRef<HTMLDivElement>(null)
const mapRef = useRef<maplibregl.Map | null>(null)
```
Ajouter : `const startMarkerRef = useRef<maplibregl.Marker | null>(null)` et `endMarkerRef`.

**Pattern hook dans composant** (MapView.tsx ligne 236) :
```typescript
// MapView.tsx — hook interaction branché sur la ref mapRef
useMapInteraction(mapRef.current)
```
Ajouter : `useRoutingWorker()` (ou passer mapRef selon découpage retenu).

**Pattern mode-based cursor** (useMapInteraction.ts lines 19–21) :
```typescript
if (mode === 'drawing') {
  map.doubleClickZoom.disable()
  map.getCanvas().style.cursor = 'crosshair'
```
En mode `'routing'` : `cursor = 'crosshair'` pendant la sélection, `cursor = 'wait'` pendant le calcul.

**Pattern cleanup markers** — les marqueurs MapLibre (objets JS non-GeoJSON) se gèrent par refs, pas par sources GeoJSON. Pattern depuis RESEARCH.md Pattern 5 :
```typescript
// Cleanup obligatoire quand le mode change — sinon les markers restent sur la carte
startMarkerRef.current?.remove()
endMarkerRef.current?.remove()
startMarkerRef.current = null
endMarkerRef.current = null
```
Placer dans le return du useEffect de mode (comme `map.doubleClickZoom.enable()` ligne 53).

**Pattern getState() dans handler** (useMapInteraction.ts ligne 40) :
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') useCanalStore.getState().cancelDrawing()
}
```
Même pattern pour le handler routing : `useCanalStore.getState().setRoutingStart(...)`.

**Pattern syncLayers** (MapView.tsx lignes 85–159) — les marqueurs routing sont des objets `maplibregl.Marker`, pas des features GeoJSON. Ne pas les ajouter dans `syncLayers`. Les gérer uniquement via refs dans les handlers de mode routing.

---

### `src/components/SidePanel.tsx` (modify — section routing progress)

**Analog:** `src/components/ElevationPanel.tsx` — même patron d'états conditionnels (vide / chargement / erreur / données)

**Pattern spinner** (ElevationPanel.tsx lines 57–67) :
```typescript
// ElevationPanel.tsx — spinner + message texte côte à côte
{selectedCanalId && isLoading && !profile && !error && (
  <div className="h-40 flex items-center justify-center">
    <div
      className="w-5 h-5 rounded-full border-2 border-gray-600 border-t-gray-300 animate-spin"
      role="status"
      aria-label="Chargement du profil..."
    />
    <span className="ml-2 text-[11px] text-gray-500">Chargement du profil...</span>
  </div>
)}
```
Reprendre exactement pour l'état `routingState === 'computing'`. Message : `"Calcul du tracé optimal en cours..."`.

**Pattern état erreur** (ElevationPanel.tsx lines 69–79) :
```typescript
// ElevationPanel.tsx — état erreur avec AlertCircle
{selectedCanalId && error && (
  <div className="px-4 py-3">
    <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
      <AlertCircle size={12} className="inline" />
      Données d&apos;élévation indisponibles
    </p>
  </div>
)}
```
Reprendre pour les états `'error'`, `'timeout'`, `'no-path'` avec messages spécifiques.

**Pattern SidePanel structure** (SidePanel.tsx lines 8–38) :
```typescript
// SidePanel.tsx — hook au top du composant, sections délimitées par border-b
export function SidePanel() {
  useElevation()  // hook déclenché dans le composant racine
  return (
    <aside className="fixed right-0 top-0 h-full w-80 flex flex-col z-10 border-l border-white/[0.08]"
           style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(4px)' }}>
      <ModeIndicator />
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <DrawingToolbar />
      </div>
      {/* ... sections ... */}
    </aside>
  )
}
```
Ajouter `useRoutingWorker()` au même niveau que `useElevation()`. La section routing progress s'insère entre DrawingToolbar et CanalList, visible uniquement si `routingState !== 'idle'`.

**Bouton Annuler routing dans SidePanel** — le bouton `Annuler` est visible pendant `'computing'` pour permettre `worker.terminate()` :
```typescript
// Pattern bouton Annuler depuis DrawingToolbar.tsx lignes 33–42
<button onClick={cancelRouting}
  className={`flex items-center gap-2 w-full px-4 py-2 rounded
              bg-gray-700 hover:bg-gray-600
              text-white text-sm transition-colors
              outline-none ${focusRing}`}>
  <X size={16} />
  Annuler
</button>
```

---

## Shared Patterns

### Convention coordonnées [lng, lat]
**Source:** `src/types/canal.ts` ligne 5
**Apply to:** tous les fichiers Phase 3
```typescript
// Coordonnées toujours [lng, lat] WGS84 — JAMAIS [lat, lng] (Pitfall 10)
export type Coord = [number, number]  // [lng, lat]
```
Dans Open-Meteo : `coords.map(([, lat]) => lat)` pour latitudes, `coords.map(([lng]) => lng)` pour longitudes.

### Pattern AbortController + timeout + cancelled flag
**Source:** `src/hooks/useElevation.ts` lignes 23–52
**Apply to:** `useRoutingWorker.ts`, et `fetchGridElevations` dans `routingGrid.ts`
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10_000)
let cancelled = false
// ...
return () => {
  cancelled = true
  controller.abort()
  clearTimeout(timeoutId)
}
```
Pour le worker : `worker.terminate()` remplace `controller.abort()`, timeout 30s.

### Pattern getState() dans handlers natifs
**Source:** `src/hooks/useMapInteraction.ts` ligne 40
**Apply to:** `useRoutingWorker.ts`, `useMapInteraction.ts` (extension routing)
```typescript
// Évite stale closure dans les handlers DOM natifs hors cycle React
useCanalStore.getState().cancelDrawing()
```

### Pattern sélecteurs Zustand granulaires
**Source:** `src/hooks/useMapInteraction.ts` lignes 9–14
**Apply to:** tous les composants et hooks Phase 3
```typescript
const mode = useCanalStore((s) => s.mode)
const addWaypoint = useCanalStore((s) => s.addWaypoint)
// Un sélecteur par valeur utilisée — jamais useCanalStore() sans sélecteur
```

### Pattern error messages Open-Meteo
**Source:** `src/services/elevationApi.ts` lignes 42–53
**Apply to:** `routingGrid.ts` — `fetchGridElevations` et `fetchSingleBatch`
```typescript
if (!response.ok) {
  throw new Error(`Open Meteo HTTP ${response.status}`)
}
if (!Array.isArray(data.elevation)) {
  throw new Error(`Open Meteo: réponse invalide`)
}
return (data.elevation as (number | null)[]).map((v) => v ?? 0)
```

### Pattern actions Zustand atomiques
**Source:** `src/store/canalStore.ts` lignes 34–59
**Apply to:** nouvelles actions routing dans `canalStore.ts`
```typescript
// Toutes les actions resetent les champs liés ensemble
startDrawing: () => set({ mode: 'drawing', draftPoints: [], previewCoord: null }),
```

### Dark theme Tailwind — palette établie
**Source:** tous les composants existants
**Apply to:** DrawingToolbar.tsx (bouton routing), SidePanel.tsx (section routing)
- Fond panel : `bg-gray-900` / `rgba(26, 26, 46, 0.95)`
- Bleu actions : `bg-blue-500 hover:bg-blue-600`
- Annuler : `bg-gray-700 hover:bg-gray-600`
- Erreur : `text-red-400`
- Succès : `text-green-400`
- Avertissement : `text-amber-400`
- Spinner : `border-gray-600 border-t-gray-300 animate-spin`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/workers/routingWorker.ts` | worker | event-driven | Premier Web Worker du projet — pas d'analog existant. Utiliser RESEARCH.md Pattern 4 (Worker Vite) + Pattern 1 (ngraph) |

---

## Metadata

**Analog search scope:** `src/types/`, `src/services/`, `src/hooks/`, `src/store/`, `src/components/`, `src/tests/`
**Files scanned:** 22 fichiers source (totalité du projet existant)
**Pattern extraction date:** 2026-04-30

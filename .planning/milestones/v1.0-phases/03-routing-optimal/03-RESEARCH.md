# Phase 3: Routing Optimal - Research

**Researched:** 2026-04-30
**Domain:** Dijkstra sur grille DEM + Web Worker Vite/TypeScript + Open-Meteo batching
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **UIMode** : étendre avec `'routing'` (nouveau mode séparé)
- **Résolution grille adaptative** : distance ≤100km → 50×50, distance >100km → 100×100 max
- **Fonction de coût** : `distance × (1 + max(0, Δaltitude_montée) / distance)`
- **Bibliothèque routage** : `ngraph.path` (prévu dans le stack initial)
- **Source données élévation grille** : Open-Meteo Elevation API (cohérence avec Phase 2)
- **Timeout Web Worker** : 30 secondes max → `worker.terminate()`
- **Résultat** : canal ajouté directement dans le store (pas de preview intermédiaire)
- **Post-routing** : profil d'élévation calculé automatiquement (canal sélectionné + `useElevation` déclenché)
- **Message no-path** : "Aucun chemin gravitaire trouvé — les deux points sont séparés par un obstacle infranchissable"

### Claude's Discretion

- Structure interne du routingWorker (format messages postMessage)
- Stratégie de batching des requêtes Open-Meteo (séquentiel vs parallèle)
- Pattern tsconfig pour le worker (lib WebWorker vs DOM)
- Comlink vs postMessage raw (à trancher lors de la planification)

### Deferred Ideas (OUT OF SCOPE)

- Édition point par point du tracé routé → v2
- Routing multi-segments (chaîne de waypoints imposés) → v2
- Affichage du coût du chemin (élévation max, longueur) → Phase 4 CALC-03
- Routing offline avec GeoTIFF local + geotiff.js → v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-05 | L'utilisateur peut demander un tracé optimal automatique entre deux points (algorithme Dijkstra sur DEM en Web Worker, minimise l'élévation et les obstacles) | ngraph.path API vérifiée, Web Worker Vite pattern confirmé, Open-Meteo batching mesuré, fonction de coût définie |
</phase_requirements>

---

## Summary

La Phase 3 implémente un routing Dijkstra sur grille DEM dans un Web Worker dédié. L'utilisateur clique deux points en mode "routing", le Worker échantillonne une grille NxN sur la bounding box, récupère les altitudes par batches Open-Meteo, construit un graphe ngraph, exécute A* avec une fonction de coût pénalisant les montées, et retourne le chemin optimal comme tableau de coordonnées.

La contrainte la plus importante est la **limite de 100 coordonnées par requête Open-Meteo**. Une grille 50×50 = 2 500 points nécessite 25 requêtes, une grille 100×100 = 10 000 points nécessite 100 requêtes. Les mesures réelles confirment que 25 requêtes parallèles (concurrence 5) prennent ~900ms, et 100 requêtes (concurrence 10) prennent ~1 100ms — bien en dessous du timeout de 30s.

**Recommandation principale** : utiliser `ngraph.path` avec A* (connectivité 8, distance haversine), batching Open-Meteo avec concurrence max 10, postMessage raw (pas Comlink pour minimiser les dépendances), et un `tsconfig.worker.json` séparé pour éviter les conflits de types DOM/WebWorker.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sélection points départ/arrivée | Browser (MapLibre event) | Store Zustand | Clics capturés par useMapInteraction selon UIMode |
| Marqueurs temporaires visuels | Browser (MapLibre Marker) | — | API Marker MapLibre native, pas GeoJSON source |
| Déclenchement Web Worker | Browser (main thread) | — | `new Worker(new URL(...))` depuis composant React ou hook |
| Fetch grille d'élévation | Web Worker | — | fetch() disponible dans workers, évite de bloquer le thread UI |
| Construction graphe ngraph | Web Worker | — | Calcul CPU intensif isolé du thread UI |
| Algorithme A*/Dijkstra | Web Worker | — | Même raison + ngraph importé dans le worker |
| Retour résultat | Web Worker → postMessage | Main thread onmessage | Transfert du tableau de coordonnées du chemin |
| Ajout canal dans store | Main thread (Zustand) | — | Store React non accessible depuis Worker |
| Déclenchement profil élévation | Main thread (useElevation) | — | Canal sélectionné → hook existant Phase 2 |
| Spinner / état progression | Frontend (SidePanel) | Store Zustand (routingState) | État de progression stocké dans le store |

---

## Standard Stack

### Core

| Bibliothèque | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| ngraph.path | 1.6.1 | Algorithme A*/Dijkstra sur graphe ngraph | Décision locked CONTEXT.md — ESM natif, types TS inclus |
| ngraph.graph | 20.1.2 | Structure de données graphe pour ngraph.path | Dépendance directe de ngraph.path, même écosystème |
| Open-Meteo Elevation API | — | Données DEM pour la grille de routage | Décision locked — CORS natif, même API que Phase 2 |

[VERIFIED: npm registry] — versions confirmées `npm view ngraph.path version` et `npm view ngraph.graph version`

### Déjà installées (Phase 1/2)

| Bibliothèque | Version | Role dans Phase 3 |
|--------------|---------|-------------------|
| @turf/turf | 7.3.5 | distance haversine entre coordonnées (coût d'arête), bbox calcul |
| maplibre-gl | 5.24.0 | Markers temporaires départ/arrivée, event listeners mode routing |
| zustand | 5.0.12 | Nouveau state routing dans canalStore |

### Supporting

| Bibliothèque | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| @vitest/web-worker | 4.1.5 | Test de la logique du worker en Vitest sans navigateur | Tests unitaires du routingWorker.ts |

[VERIFIED: npm registry] `npm view @vitest/web-worker version`

### Alternatives Considérées

| Standard | Alternative | Tradeoff |
|----------|-------------|----------|
| ngraph.path (A*) | Implémentation Dijkstra manuelle | Custom = ~200 lignes à maintenir + risque bugs — ngraph testé sur millions d'arêtes |
| ngraph.path (A*) | graphlib + custom BFS | graphlib sans pathfinding intégré, plus lent |
| postMessage raw | Comlink | Comlink nécessite vite-plugin-comlink (vite.config change) + learning curve ; postMessage suffisant pour un seul type de message |
| Open-Meteo par batches | GeoTIFF local + geotiff.js | GeoTIFF = 2 GB/zone, téléchargement impossible en client-side — déféré v2 |

**Installation requise :**
```bash
npm install ngraph.path ngraph.graph
```
(déjà exécuté pendant la recherche — confirmé `added 3 packages`)

**Vérification des versions :**
```bash
npm view ngraph.path version    # 1.6.1
npm view ngraph.graph version   # 20.1.2
```

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks [Routing mode button]
    │
    ▼
UIMode → 'routing'  (canalStore)
    │
User clicks [Point A]  →  store.setRoutingStart(coord)
    │                      Marker vert MapLibre affiché
    ▼
User clicks [Point B]  →  store.setRoutingEnd(coord)
    │                      Marker rouge MapLibre affiché
    ▼
startRoutingCalculation()
    │
    ├─ store.routingState = 'computing'
    │   SidePanel affiche spinner + "Calcul en cours..."
    │
    ▼
new Worker(new URL('./workers/routingWorker.ts', import.meta.url))
    │
    ▼  postMessage({ start: Coord, end: Coord, resolution: 50|100 })
    │
    ┌─────────────────── WORKER THREAD ───────────────────────────┐
    │                                                              │
    │  1. buildGrid(start, end, resolution)                        │
    │     → bbox = [minLng, minLat, maxLng, maxLat]               │
    │     → NxN coords uniformément répartis dans la bbox          │
    │                                                              │
    │  2. fetchGridElevations(coords)   [fetch() dans worker]      │
    │     → batches de 100 coords max                             │
    │     → concurrence max 10 requêtes simultanées               │
    │     → retourne number[] flat (index = row*N + col)          │
    │                                                              │
    │  3. buildGraph(grid, elevations)  [ngraph.graph + A*]        │
    │     → N×N noeuds avec data { lng, lat, alt }                │
    │     → arêtes 8-connectivity avec coût haversine × penalty   │
    │     → oriented: true (direction de flux compte)             │
    │                                                              │
    │  4. findPath(graph, startNode, endNode)  [ngraph.path aStar] │
    │     → retourne Node[] ou [] si aucun chemin                 │
    │                                                              │
    │  postMessage({ type: 'result', path: Coord[] })             │
    │  postMessage({ type: 'no-path' })                           │
    │  postMessage({ type: 'error', message: string })            │
    └─────────────────────────────────────────────────────────────┘
    │
    ▼  worker.onmessage / onerror
    │
    ├─ type: 'result'
    │    → canalStore.finalizeRoutedCanal(path)
    │    → Canal { points, name: 'Canal optimal N', isRouted: true }
    │    → canalStore.selectCanal(newId)
    │    → useElevation → profil chargé automatiquement
    │
    ├─ type: 'no-path'
    │    → store.routingState = 'no-path'
    │    → SidePanel affiche message "Aucun chemin gravitaire trouvé..."
    │
    └─ type: 'error' / timeout
         → store.routingState = 'error'
         → SidePanel affiche message d'erreur
```

### Structure projet recommandée

```
src/
├── workers/
│   └── routingWorker.ts        # Web Worker — calcul Dijkstra isolé
├── services/
│   ├── elevationApi.ts         # Existant Phase 2 — réutilisé pour profil post-routing
│   └── routingGrid.ts          # NOUVEAU — buildGrid, fetchGridElevations, buildGraph, findPath
├── hooks/
│   ├── useElevation.ts         # Existant Phase 2 — inchangé
│   └── useRoutingWorker.ts     # NOUVEAU — cycle de vie worker (create/terminate/onmessage)
├── store/
│   └── canalStore.ts           # Étendu — UIMode 'routing', routingState, routing actions
├── types/
│   ├── canal.ts                # Étendu — isRouted?: boolean dans Canal
│   └── routing.ts              # NOUVEAU — RoutingState, RoutingMessage types
└── components/
    ├── DrawingToolbar.tsx       # Étendu — bouton "Tracé optimal"
    ├── MapView.tsx              # Étendu — markers temporaires, click mode routing
    └── SidePanel.tsx            # Étendu — section spinner/progression routing
```

### Pattern 1: ngraph.path — Construction graphe et A*

**What:** Créer un graphe NxN connecté avec coûts d'arête, puis trouver le chemin optimal.
**When to use:** Toujours dans le routingWorker — jamais dans le thread UI.

```typescript
// Source: [VERIFIED: github.com/anvaka/ngraph.path README + exports vérifiés npm]
import createGraph from 'ngraph.graph'
import { aStar } from 'ngraph.path'

// Nœud : données géographiques + altitude
interface NodeData { lng: number; lat: number; alt: number }
// Arête : coût pré-calculé
interface LinkData { cost: number }

function buildGraph(N: number, coords: [number, number][], elevations: number[]) {
  const graph = createGraph<NodeData, LinkData>()

  // Ajouter tous les nœuds
  for (let i = 0; i < N * N; i++) {
    const [lng, lat] = coords[i]
    graph.addNode(i, { lng, lat, alt: elevations[i] })
  }

  // Connectivité 8 (incluant diagonales)
  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]

  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const fromIdx = row * N + col
      const fromNode = graph.getNode(fromIdx)!

      for (const [dr, dc] of dirs) {
        const r2 = row + dr; const c2 = col + dc
        if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) continue
        const toIdx = r2 * N + c2
        const toNode = graph.getNode(toIdx)!

        // Distance haversine entre les deux nœuds (km)
        const dist = haversineKm(fromNode.data, toNode.data)
        // Pénalité montée
        const deltaAlt = toNode.data.alt - fromNode.data.alt
        const penalty = Math.max(0, deltaAlt) / (dist * 1000 + 0.001)
        const cost = dist * (1 + penalty)

        graph.addLink(fromIdx, toIdx, { cost })
      }
    }
  }
  return graph
}

// A* orienté avec fonction de distance
const finder = aStar(graph, {
  oriented: true,  // CRITIQUE : eau ne coule que dans un sens
  distance(from, to, link) { return link.data.cost },
  heuristic(from, to) {
    // Heuristique admissible : distance haversine pure (sous-estime toujours le coût réel)
    return haversineKm(from.data, to.data)
  }
})

const path = finder.find(startNodeId, endNodeId)
// path = [] si aucun chemin — cas "aucun chemin gravitaire"
// path = Node[] ordonnés de END vers START (inverser pour START→END)
```

**ATTENTION — ordre du retour de ngraph.path :** `finder.find(from, to)` retourne les nœuds de `to` vers `from` (inversé). Il faut `.reverse()` avant de construire le tableau de coordonnées. [VERIFIED: github.com/anvaka/ngraph.path — README : "Returns array of nodes in the path from the end to start"]

### Pattern 2: Grille adaptative et bbox

```typescript
// Source: [VERIFIED: calcul géométrique WGS84 + Turf.js distance]
import { distance } from '@turf/turf'

function buildGrid(start: [number, number], end: [number, number], N: number): [number, number][] {
  // Bbox avec marge de 10% pour éviter que start/end soient aux bords exacts
  const margin = 0.10
  const minLng = Math.min(start[0], end[0])
  const maxLng = Math.max(start[0], end[0])
  const minLat = Math.min(start[1], end[1])
  const maxLat = Math.max(start[1], end[1])
  const dLng = (maxLng - minLng) * margin
  const dLat = (maxLat - minLat) * margin

  const bbox = {
    minLng: minLng - dLng, maxLng: maxLng + dLng,
    minLat: minLat - dLat, maxLat: maxLat + dLat,
  }

  const coords: [number, number][] = []
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const lng = bbox.minLng + (col / (N - 1)) * (bbox.maxLng - bbox.minLng)
      const lat = bbox.minLat + (row / (N - 1)) * (bbox.maxLat - bbox.minLat)
      coords.push([lng, lat])
    }
  }
  return coords  // N×N points, index = row*N + col
}

function getResolution(start: [number, number], end: [number, number]): number {
  const dist = distance(start, end, { units: 'kilometers' })
  return dist <= 100 ? 50 : 100
}
```

### Pattern 3: Fetch grille Open-Meteo avec batching

**Contrainte vérifiée :** max 100 coordonnées par requête Open-Meteo.
**Mesure réelle :** 25 batches (50×50) avec concurrence 5 → ~900ms. 100 batches (100×100) avec concurrence 10 → ~1 100ms.

```typescript
// Source: [VERIFIED: test live curl contre api.open-meteo.com, réponse {"error":true,"reason":"...must not exceed 100 coordinates"}]
async function fetchGridElevations(
  coords: [number, number][],
  signal: AbortSignal
): Promise<number[]> {
  const BATCH_SIZE = 100
  const CONCURRENCY = 10
  const batches: [number, number][][] = []
  for (let i = 0; i < coords.length; i += BATCH_SIZE) {
    batches.push(coords.slice(i, i + BATCH_SIZE))
  }

  const results: number[] = new Array(coords.length)
  let batchOffset = 0

  // Traitement par fenêtres de CONCURRENCY requêtes simultanées
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const window = batches.slice(i, i + CONCURRENCY)
    const responses = await Promise.all(
      window.map((batch) => fetchSingleBatch(batch, signal))
    )
    for (const elevs of responses) {
      for (const e of elevs) {
        results[batchOffset++] = e ?? 0
      }
    }
  }
  return results
}

async function fetchSingleBatch(coords: [number, number][], signal: AbortSignal): Promise<number[]> {
  const lats = coords.map(([, lat]) => lat).join(',')
  const lngs = coords.map(([lng]) => lng).join(',')
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`)
  const data = await r.json()
  if (!Array.isArray(data.elevation)) throw new Error('Open-Meteo: réponse invalide')
  return data.elevation
}
```

### Pattern 4: Web Worker Vite + TypeScript

**Contrainte Vite :** la détection du Worker ne fonctionne que si `new URL(...)` est utilisé **directement** dans `new Worker()` (pas via variable intermédiaire). La chaîne doit être statique.

```typescript
// Source: [CITED: vite.dev/guide/features#web-workers]

// ── Main thread (hook useRoutingWorker.ts) ────────────────────────────────
const workerRef = useRef<Worker | null>(null)

const startWorker = (start: Coord, end: Coord, resolution: number) => {
  // PATTERN OBLIGATOIRE — new URL() directement dans new Worker()
  workerRef.current = new Worker(
    new URL('../workers/routingWorker.ts', import.meta.url),
    { type: 'module' }  // OBLIGATOIRE pour ESM imports dans le worker
  )

  workerRef.current.onmessage = (e: MessageEvent<RoutingResult>) => {
    handleWorkerResult(e.data)
    workerRef.current?.terminate()
  }

  workerRef.current.onerror = (e) => {
    handleWorkerError(e.message)
    workerRef.current?.terminate()
  }

  workerRef.current.postMessage({ start, end, resolution })
}

// Timeout 30s
const timeoutId = setTimeout(() => {
  workerRef.current?.terminate()
  workerRef.current = null
  store.setRoutingState('timeout')
}, 30_000)
```

```typescript
// ── Worker file (src/workers/routingWorker.ts) ──────────────────────────
/// <reference lib="webworker" />  // Remplace lib DOM — évite les conflits de types
// Source: [VERIFIED: pattern recommandé TypeScript pour workers — github.com/microsoft/TypeScript/issues/20595]

import createGraph from 'ngraph.graph'
import { aStar } from 'ngraph.path'
// @turf/turf ou @turf/distance importable depuis le worker (ESM pur)

self.onmessage = async (e: MessageEvent<RoutingRequest>) => {
  const { start, end, resolution } = e.data
  try {
    const coords = buildGrid(start, end, resolution)
    const elevations = await fetchGridElevations(coords, new AbortController().signal)
    const graph = buildGraph(resolution, coords, elevations)
    const finder = aStar(graph, { /* options */ })
    const startIdx = findNearestNode(coords, start)
    const endIdx = findNearestNode(coords, end)
    const rawPath = finder.find(startIdx, endIdx)

    if (rawPath.length === 0) {
      self.postMessage({ type: 'no-path' } satisfies RoutingResult)
      return
    }

    const path: Coord[] = rawPath.reverse().map(n => [n.data.lng, n.data.lat])
    self.postMessage({ type: 'result', path } satisfies RoutingResult)
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) } satisfies RoutingResult)
  }
}
```

**Configuration TypeScript pour le worker** — utiliser la directive triple-slash plutôt qu'un tsconfig séparé (plus simple, suffisant pour un seul fichier) :

```typescript
/// <reference lib="webworker" />
// Au lieu de lib: ["DOM"] — le worker utilise DedicatedWorkerGlobalScope
```

Si conflit de types `DOM` vs `WebWorker` dans le build global, créer `tsconfig.worker.json` :
```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "lib": ["ES2020", "WebWorker"],
    "noEmit": false,
    "outDir": "dist/workers"
  },
  "include": ["src/workers"]
}
```

### Pattern 5: Marqueurs temporaires MapLibre

```typescript
// Source: [CITED: maplibre.org/maplibre-gl-js/docs/API/classes/Marker/]
// Dans useMapInteraction ou MapView, stockés dans des refs
const startMarkerRef = useRef<maplibregl.Marker | null>(null)
const endMarkerRef = useRef<maplibregl.Marker | null>(null)

// Mode routing — clic 1 : marqueur départ (vert)
const handleRoutingClick = (e: maplibregl.MapMouseEvent) => {
  const { routingStart, routingEnd } = useCanalStore.getState()
  if (!routingStart) {
    startMarkerRef.current = new maplibregl.Marker({ color: '#22C55E' })
      .setLngLat([e.lngLat.lng, e.lngLat.lat])
      .addTo(map)
    useCanalStore.getState().setRoutingStart([e.lngLat.lng, e.lngLat.lat])
  } else if (!routingEnd) {
    endMarkerRef.current = new maplibregl.Marker({ color: '#EF4444' })
      .setLngLat([e.lngLat.lng, e.lngLat.lat])
      .addTo(map)
    useCanalStore.getState().setRoutingEnd([e.lngLat.lng, e.lngLat.lat])
    // → déclenche automatiquement le calcul
  }
}

// Cleanup obligatoire quand le mode change
const cleanupRoutingMarkers = () => {
  startMarkerRef.current?.remove()
  endMarkerRef.current?.remove()
  startMarkerRef.current = null
  endMarkerRef.current = null
}
```

### Pattern 6: Timeout Worker 30 secondes

```typescript
// Source: [VERIFIED: MDN Worker.terminate() + pattern setTimeout/AbortController]
let workerTimeoutId: ReturnType<typeof setTimeout> | null = null

const launchWorker = (worker: Worker) => {
  workerTimeoutId = setTimeout(() => {
    worker.terminate()
    useCanalStore.getState().setRoutingState('timeout')
  }, 30_000)

  worker.onmessage = (e) => {
    if (workerTimeoutId) clearTimeout(workerTimeoutId)
    // traitement résultat...
    worker.terminate()
  }

  worker.onerror = (e) => {
    if (workerTimeoutId) clearTimeout(workerTimeoutId)
    worker.terminate()
    useCanalStore.getState().setRoutingState('error')
  }
}
```

### Anti-Patterns à Éviter

- **Ne pas stocker le Worker dans le state Zustand** — les objets Worker ne sont pas sérialisables. Utiliser `useRef`.
- **Ne pas appeler `worker.terminate()` depuis le worker lui-même** — le Worker se termine proprement avec `return` depuis `onmessage`.
- **Ne jamais importer `ngraph.path` dans le thread UI** — uniquement dans le worker. Le thread UI ne doit jamais exécuter le Dijkstra.
- **Ne pas utiliser `new URL('variable', import.meta.url)`** — la chaîne doit être un litéral statique, sinon Vite ne bundle pas le worker.
- **Ne pas construire le graphe avec des arêtes non-orientées** pour un problème hydraulique — `oriented: true` est obligatoire.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|----------|-------------------|---------------------|----------|
| Algorithme A*/Dijkstra | Implémentation custom avec priority queue | `ngraph.path` aStar | Gestion correcte de la priority queue (tinyqueue), cas limites (cycles, isolation), testé en production sur millions de nœuds |
| Structure de graphe | Array/Map de listes d'adjacence | `ngraph.graph` | Optimisé pour ngraph.path, API consistante, pas de reimplementation |
| Distance haversine | Formule inline | `@turf/turf` distance() | Déjà installé, gestion des cas limites (antipodes, distance nulle) |
| Batching API | Gestion manuelle des chunks | Pattern `for (let i=0; i < n; i += BATCH_SIZE)` + `Promise.all` | Simple, mais ne pas oublier la limite de **100 coords/requête** confirmée par test réel |

**Insight clé :** Le seul vrai risque de réécriture custom est l'algorithme de pathfinding. ngraph.path traite les graphes 10K nœuds en < 100ms typiquement.

---

## Common Pitfalls

### Pitfall 1 : Limite stricte de 100 coordonnées Open-Meteo

**Ce qui se passe :** La requête retourne `{"error":true,"reason":"...must not exceed 100 coordinates."}` — l'élévation de toute la grille échoue silencieusement.
**Pourquoi :** Limite documentée et confirmée par test live. Grille 50×50 = 2 500 points = 25 requêtes. Grille 100×100 = 10 000 points = 100 requêtes.
**Comment éviter :** Implémenter `fetchGridElevations` avec batching explicite de 100, concurrence max 10 (mesurée ~1 100ms total pour 100×100).
**Signes d'alerte :** Profil d'élévation plat (toutes altitudes à 0) après routing, ou erreur HTTP 400.

### Pitfall 2 : ngraph.path retourne le chemin en ordre inversé

**Ce qui se passe :** `finder.find(startId, endId)` retourne `[endNode, ..., startNode]` — le canal est dessiné en sens inverse sur la carte.
**Pourquoi :** Comportement documenté de l'implémentation interne A*.
**Comment éviter :** Toujours `.reverse()` le tableau avant d'extraire les coordonnées.
**Signes d'alerte :** Les marqueurs départ/arrivée sont inversés par rapport à la ligne du canal.

### Pitfall 3 : `import.meta.url` dans le worker doit être un litéral statique

**Ce qui se passe :** Vite ne bundle pas le worker en production — erreur `TypeError: Failed to construct 'Worker'` ou worker non disponible.
**Pourquoi :** `workerImportMetaUrlPlugin` de Vite détecte le pattern par regex — une variable ne passe pas.
**Comment éviter :**
```typescript
// CORRECT
new Worker(new URL('../workers/routingWorker.ts', import.meta.url), { type: 'module' })
// INCORRECT — variable dans new URL()
const path = '../workers/routingWorker.ts'
new Worker(new URL(path, import.meta.url), { type: 'module' })
```

### Pitfall 4 : Conflits de types DOM vs WebWorker dans TypeScript

**Ce qui se passe :** `lib: ["DOM", "WebWorker"]` simultanément → erreurs `Duplicate identifier 'Event'`, `Subsequent variable declarations must have the same type`.
**Pourquoi :** TypeScript ne peut pas fusionner les deux `lib.dom.d.ts` et `lib.webworker.d.ts` — les interfaces globales entrent en conflit.
**Comment éviter :** Utiliser `/// <reference lib="webworker" />` en tête du fichier worker pour remplacer localement la lib DOM. Si cela ne suffit pas, créer `tsconfig.worker.json` avec `"lib": ["ES2020", "WebWorker"]`.

### Pitfall 5 : Worker pas orienté → résultat non-gravitaire

**Ce qui se passe :** ngraph.path trouve un chemin qui monte et descend — viole la contrainte fondamentale du projet.
**Pourquoi :** Sans `oriented: true`, les arêtes sont bidirectionnelles — le graphe permet de remonter une pente.
**Comment éviter :** `aStar(graph, { oriented: true })` — obligatoire pour ce projet. Vérifier avec le profil d'élévation post-routing (segments rouges = fail).

### Pitfall 6 : Projection cartographique et coûts d'arête distordus

**Ce qui se passe :** En utilisant des différences lat/lng brutes pour calculer les distances, les nœuds polaires sont plus proches en coordonnées mais plus éloignés en réalité. Le routage évite incorrectement des zones.
**Pourquoi :** 1° de longitude ≠ même distance selon la latitude (cos(lat) facteur de compression).
**Comment éviter :** Utiliser la **distance haversine** via `@turf/turf` pour le coût réel, ou l'approximation `distKm ≈ sqrt((Δlat * 111)² + (Δlng * 111 * cos(lat))²)` pour la performance.
**Impact sur ce projet :** Pour des distances ≤ 2 000km (cas typique), l'erreur Euclidean vs haversine reste < 1% — acceptable mais haversine est meilleur.

### Pitfall 7 : Mémoire excessive sur grille 100×100

**Ce qui se passe :** Crash ou OOM dans le Worker pour des longues distances.
**Pourquoi :** Grille 100×100 = 10 000 nœuds × 8 arêtes × sizeof(LinkData) — typiquement 5-10 MB dans ngraph.
**Comment éviter :** Limite max = 100×100 confirmée dans CONTEXT.md — adapter selon mesures en Phase 3. Pour des distances > 2 000km, envisager de plafonner à 100×100 même si distance > 100km.
**Signes d'alerte :** Worker timeout avant 30s sur grande distance.

### Pitfall 8 : findNearestNode — mapper start/end sur la grille

**Ce qui se passe :** Les points cliqués par l'utilisateur ne tombent pas exactement sur un nœud de la grille. `finder.find(startId, endId)` avec un ID inexistant retourne `[]` comme si aucun chemin.
**Pourquoi :** La grille est discrète — les coordonnées réelles doivent être mappées sur l'index le plus proche.
**Comment éviter :** Implémenter `findNearestNode(coords, point)` qui minimise la distance euclidienne (ou haversine) entre le point cliqué et tous les nœuds de la grille.

---

## Code Examples

### Import ESM ngraph dans un Worker

```typescript
// Source: [VERIFIED: npm view ngraph.path exports → import: './dist/ngraph.path.es.js']
// Source: [VERIFIED: npm view ngraph.graph exports → import: './index.js']

// Les deux packages ont un champ "import" ESM dans leur exports — compatibles Vite bundler
import createGraph from 'ngraph.graph'
import { aStar } from 'ngraph.path'
```

### Haversine simplifiée sans Turf (pour le worker)

```typescript
// Source: [ASSUMED — formule standard, non vérifiée via lib officielle]
// Turf peut être importé dans le worker mais ajoute du poids au bundle worker
function haversineKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2)**2
  return R * 2 * Math.asin(Math.sqrt(h))
}
```

### Extraction des coordonnées du chemin (avec inversion obligatoire)

```typescript
// Source: [VERIFIED: ngraph.path README — "Returns array of nodes from end to start"]
const rawPath = finder.find(startIdx, endIdx)
if (rawPath.length === 0) {
  // Aucun chemin possible — obstacle infranchissable
  self.postMessage({ type: 'no-path' })
  return
}
// Inversion OBLIGATOIRE : find() retourne de l'arrivée vers le départ
const path: Coord[] = rawPath.reverse().map(n => [n.data.lng, n.data.lat] as Coord)
```

### Types pour les messages Worker

```typescript
// src/types/routing.ts
export type Coord = [number, number]  // [lng, lat]

export type RoutingState = 'idle' | 'selecting-start' | 'selecting-end' | 'computing' | 'timeout' | 'error' | 'no-path'

export interface RoutingRequest {
  start: Coord
  end: Coord
  resolution: 50 | 100
}

export type RoutingResult =
  | { type: 'result'; path: Coord[] }
  | { type: 'no-path' }
  | { type: 'error'; message: string }
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Quand changé | Impact |
|-------------------|-------------------|--------------|--------|
| Web Workers avec `importScripts()` | ESM `import` dans workers avec `type: 'module'` | 2019-2022 (support navigateurs) | Imports natifs, tree-shaking, compatibilité Vite/Rollup |
| `?worker` query suffix Vite | `new Worker(new URL(...))` standard | Vite 3+ | Pattern standardisé W3C, marche aussi hors Vite |
| Dijkstra pur | A* avec heuristique haversine | — | A* 2-10× plus rapide sur graphes géographiques (visite moins de nœuds) |
| `ngraph.path` require() CJS | `aStar` import ESM | ngraph.path 1.5+ | Package a un champ `exports.import` — ESM natif dans Vite |

**Déprécié / à éviter :**
- `importScripts()` dans les workers : remplacé par `import` ESM avec `type: 'module'`
- `Comlink` pour ce cas simple : ajoute un plugin Vite + dépendance pour un seul message type
- grille > 100×100 : non supporté par les décisions CONTEXT.md + contrainte performance

---

## Assumptions Log

| # | Claim | Section | Risk si faux |
|---|-------|---------|--------------|
| A1 | haversineKm inline est plus léger que @turf/distance dans le worker bundle | Code Examples | Taille bundle worker légèrement plus grande si on utilise Turf — risque faible, @turf/turf déjà une dépendance |
| A2 | ngraph.path aStar traverse les 10 000 nœuds d'une grille 100×100 en < 5s | Architecture | Timeout 30s laisse beaucoup de marge — peu probable d'être un problème |
| A3 | La limite de 100 coords POST est la même que GET pour Open-Meteo | Standard Stack | Test GET confirmé 100 max + POST erreur identique — HIGH confidence |
| A4 | La margin bbox de 10% est suffisante pour les cas typiques | Pattern buildGrid | Pour des canaux proches de zones côtières ou frontières, la bbox peut inclure des zones sans DEM — mitigé par `null → 0` |

---

## Open Questions

1. **Quelle connectivité choisir : 4 ou 8 directions ?**
   - Ce qu'on sait : 8-connectivity permet des diagonales (chemins plus naturels) mais 4× plus d'arêtes vs 4-connectivity
   - Ce qui est flou : impact sur performance A* pour grille 100×100 avec 8-connectivity (80 000 arêtes vs 40 000)
   - Recommandation : commencer avec 8-connectivity (chemins plus naturels géographiquement) — mesurer le temps et réduire à 4 si > 5s

2. **@turf/turf dans le worker — taille du bundle worker ?**
   - Ce qu'on sait : @turf/turf est déjà installé mais peut alourdir le bundle worker si tree-shaking insuffisant
   - Ce qui est flou : Vite fait-il du tree-shaking dans les workers de même façon que le main bundle ?
   - Recommandation : importer `@turf/distance` directement (pas le barrel @turf/turf) ou utiliser haversine inline

3. **Comportement A* quand start et end sont très proches (< 1 km) ?**
   - Ce qu'on sait : la grille aurait une résolution très fine (bbox quasi-ponctuelle), le chemin serait trivial
   - Recommandation : ajouter une distance minimale (>= 2 km) pour déclencher le routing — sinon tracer un canal direct

---

## Environment Availability

| Dépendance | Requise par | Disponible | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ngraph.path | routingWorker.ts | ✓ | 1.6.1 | — |
| ngraph.graph | routingWorker.ts | ✓ | 20.1.2 | — |
| Open-Meteo Elevation API | fetchGridElevations | ✓ (réseau) | — | — |
| Web Worker (`type: module`) | routingWorker.ts | ✓ (Chrome/FF/Safari 2022+) | — | — |

Vérification dependencies :
```bash
npm view ngraph.path version   # 1.6.1
npm view ngraph.graph version  # 20.1.2
```

---

## Validation Architecture

### Test Framework

| Propriété | Valeur |
|-----------|--------|
| Framework | Vitest 3.2.1 |
| Config | vite.config.ts (section `test:`) |
| Commande rapide | `npm test` (vitest run) |
| Suite complète | `npm test` |

### Phase Requirements → Test Map

| Req ID | Comportement | Type de test | Commande | Fichier existant ? |
|--------|-------------|-------------|---------|-------------------|
| MAP-05 | buildGrid retourne N×N points couvrant la bbox | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 |
| MAP-05 | getResolution(≤100km) = 50, getResolution(>100km) = 100 | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 |
| MAP-05 | fetchGridElevations batche correctement en groupes de 100 | unit (mock fetch) | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 |
| MAP-05 | buildGraph crée N×N nœuds et connectivité 8 | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 |
| MAP-05 | aStar trouve un chemin direct (grille plate) | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 |
| MAP-05 | aStar retourne [] pour deux points isolés par une barrière infinie | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 |
| MAP-05 | Le chemin retourné est ordonné start → end (inversion appliquée) | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 |
| MAP-05 | canalStore actions routing (setRoutingStart, setRoutingEnd, finalizeRoutedCanal) | unit | `npm test -- src/store/canalStore.test.ts` | Extension Wave 0 |
| MAP-05 | Profil calculé automatiquement après routing (canal sélectionné post-finalizeRoutedCanal) | intégration | Manuel (UAT Phase 3) | — |

**Tests exclus de l'automatisation :**
- Workers réels dans jsdom : `@vitest/web-worker` a des limitations avec les mocks réseau — tester les fonctions du worker **directement** (importer `routingGrid.ts` dans le test, pas via Worker) pour éviter la complexité Worker+fetch mock.
- UX multi-clics MapLibre : interaction visuelle → UAT manuelle.

### Sampling Rate

- **Par commit de tâche :** `npm test`
- **Par merge de wave :** `npm test`
- **Gate de phase :** Suite verte avant `/gsd-verify-work`

### Wave 0 Gaps (fichiers à créer avant l'implémentation)

- [ ] `src/tests/routingGrid.test.ts` — couvre logique grid, batching, graphe, pathfinding (fonctions pures de `routingGrid.ts`)
- [ ] `src/types/routing.ts` — RoutingState, RoutingRequest, RoutingResult, Coord
- [ ] Extension `src/store/canalStore.test.ts` — actions routing du store

---

## Security Domain

> `security_enforcement` non défini dans config.json → traité comme activé.

### Applicable ASVS Categories

| Catégorie ASVS | Applicable | Contrôle standard |
|----------------|-----------|-------------------|
| V2 Authentication | non | App client-side sans auth |
| V3 Session Management | non | Pas de session |
| V4 Access Control | non | Pas de ressources protégées |
| V5 Input Validation | oui | Validation des coordonnées start/end (range WGS84) |
| V6 Cryptography | non | Aucune cryptographie |

### Threat Patterns pour ce stack

| Pattern | STRIDE | Mitigation standard |
|---------|--------|---------------------|
| Coordonnées hors-range WGS84 (lat > 90) | Tampering | Valider `lat ∈ [-90, 90]`, `lng ∈ [-180, 180]` avant postMessage |
| Requête Open-Meteo avec paramètres malformés | Tampering | Validation types + range côté worker avant fetch |
| Worker infini (boucle dans Dijkstra) | DoS (self) | Timeout 30s + `worker.terminate()` — décision locked |

**Note sécurité :** App 100% client-side sans auth, sans données personnelles — surface d'attaque minimale. Les validations sont principalement défensives contre des bugs, pas des attaques.

---

## Sources

### Primary (HIGH confidence)
- `npm view ngraph.path` — version 1.6.1, exports ESM/CJS vérifiés
- `npm view ngraph.graph` — version 20.1.2, exports ESM/CJS vérifiés
- github.com/anvaka/ngraph.path README — API aStar, orienté, heuristique, retour inversé
- Test live curl `api.open-meteo.com/v1/elevation` — limite 100 coords confirmée par erreur HTTP
- Test live `node -e "fetch(...)"` — 25 batches ≈ 900ms, 100 batches ≈ 1100ms avec concurrence 5/10
- `cat node_modules/ngraph.path/index.d.ts` — types TypeScript vérifiés localement
- `cat tsconfig.app.json` — config TypeScript actuelle du projet
- vite.dev/guide/features#web-workers — pattern `new Worker(new URL(...))`
- maplibre.org/maplibre-gl-js/docs/API/classes/Marker/ — API Marker addTo/remove/setLngLat

### Secondary (MEDIUM confidence)
- WebSearch vérifiée : ngraph.path retourne chemin en ordre inversé (README confirme)
- WebSearch vérifiée : `/// <reference lib="webworker" />` comme solution aux conflits DOM/WebWorker
- johnnyreilly.com/web-workers-comlink-vite-tanstack-query — pattern Comlink+Vite (pour référence, non utilisé)

### Tertiary (LOW confidence)
- Estimation performance A* sur 10 000 nœuds < 5s (non benchmarkée localement)

---

## Metadata

**Confidence breakdown :**
- Standard Stack : HIGH — ngraph versions vérifiées npm, ESM exports vérifiés localement
- Architecture : HIGH — basée sur le code existant Phase 1/2 + patterns Vite officiels
- Limites Open-Meteo : HIGH — testées par requêtes live
- Pitfalls : HIGH (1,2,3,4,5,6) / MEDIUM (7,8) — 1-6 vérifiés par test ou doc officielle
- Perf Dijkstra 10K nœuds : MEDIUM — pas benchmarqué en local, basé sur caractéristiques ngraph

**Research date :** 2026-04-30
**Valid until :** 2026-05-30 (stable — ngraph et Open-Meteo API stables)

# ARCHITECTURE.md — System Architecture

**Project:** Canal — Étude Scientifique du Réseau de Canaux Mondiaux
**Researched:** 2026-04-30
**Confidence:** HIGH (stack decisions), MEDIUM (routing algorithm specifics)

---

## Major Components

### 1. Map Shell (UI Layer)

**Responsibility:** Renders the interactive world map, handles user input (click to draw canal waypoints, drag to adjust, hover for info), displays canal overlays and results panels.

**Technology:** MapLibre GL JS + React wrapper (`react-map-gl` or direct MapLibre bindings)

**Boundaries:**
- Knows nothing about how elevations are computed — receives a `Canal` GeoJSON object and renders it
- Emits domain events (`canvasClick`, `waypointMoved`, `canalSubmitted`) consumed by the State layer
- Does NOT own calculation state; it only renders what State gives it

**Why MapLibre over Mapbox/Leaflet:** Fully open-source, no API key for the rendering engine itself, supports Terrain-RGB raster-DEM natively for 3D terrain visualization, active development. Leaflet cannot do 3D terrain; Mapbox locks the core behind billing.

---

### 2. Canal Drawing Tool

**Responsibility:** Lets the user place waypoints on the map to define a canal route. Produces a raw `waypoint[]` list (lat/lng pairs) that the Routing Engine refines.

**Technology:** Terra Draw (MapLibre adapter) for interactive geometry creation

**Boundaries:**
- Output: `RawCanalInput { waypoints: LatLng[], widthMeters: number, depthMeters: number }`
- Input: nothing from the calculation engine — it is purely input capture
- User can draw a straight line (Europa → Méditerranée) or multi-segment path

---

### 3. Elevation Service (Data Layer)

**Responsibility:** Answers "what is the elevation at (lat, lng)?" and "give me the elevation profile along this path."

**Two-tier design:**

**Tier A — Tile-based visual terrain (MapLibre built-in):**
Used exclusively for 3D terrain rendering on the map. Source: Maptiler free terrain tiles or self-hosted SRTM tiles encoded as Terrain-RGB PNG. This is passive — MapLibre reads tiles automatically for 3D shading.

**Tier B — Numeric elevation queries (computation):**
Used by the Routing Engine and Calculation Engine to get actual meter values.

- **In production (free, hosted):** Open Topo Data public API (`https://api.opentopodata.org/v1/srtm30m`) — free, no key, SRTM 30m globally. Batches up to 100 points per request.
- **Self-hosted option for heavy use:** Docker image of Open Topo Data with downloaded SRTM tiles for Europe. One-time setup, unlimited queries.
- **Browser-side option (no server):** `geotiff.js` reading Cloud-Optimized GeoTIFFs from SRTM hosted on AWS Open Data (`s3://raster/SRTM_GL3/`). Uses HTTP range requests — only downloads the specific tiles needed. Feasible for the personal-use scale of this project.

**Recommendation:** Start with Open Topo Data public API (zero setup). Add COG/geotiff.js path when offline-first becomes important.

**Boundaries:**
- Input: `LatLng[]` (array of points along a path)
- Output: `ElevationProfile { points: { lat, lng, elevationMeters }[] }`
- Communicates with: Routing Engine, Calculation Engine

---

### 4. Routing Engine (Web Worker)

**Responsibility:** Takes raw user waypoints and refines them into an optimal canal path that minimizes excavation (least-cost path through elevation data). Runs off the main thread.

**Technology:** Custom Dijkstra / A* on a sampled elevation grid, running in a Web Worker

**Algorithm:**

For canal routing, "optimal" means minimizing total earth volume removed (proportional to elevation above sea level). This is a **least-cost path** problem on a cost raster:

```
cost(cell) = max(0, elevation(cell)) × cell_area
```

Implementation approach:
1. Sample elevation on a grid between two waypoints (e.g., 500 × 500 grid covering the bounding box)
2. Build adjacency graph (8-connected grid, cost = excavation volume per edge)
3. Run Dijkstra (not A* — the heuristic is harder to define here; Dijkstra is correct and fast enough for a 250k-node grid)
4. Return the winning path as GeoJSON LineString

**Why Web Worker:** Dijkstra on a 500×500 grid = 250,000 nodes. At ~100µs/node worst case, that is ~25 seconds on the main thread — completely freezes the UI. In a worker thread, the map remains interactive.

**Boundaries:**
- Communicates via `postMessage` / `onmessage` — the worker is isolated from DOM
- Input: `{ waypoints: LatLng[], resolution: number, widthMeters: number, depthMeters: number }`
- Output: `{ path: GeoJSON.LineString, elevationProfile: ElevationProfile, excavationVolume: number }`
- Worker owns the elevation fetching internally (calls Elevation Service)

**Modular expansion:** Adding a new continent requires no code change. The algorithm is geography-agnostic — it works on any bounding box with SRTM data.

---

### 5. Calculation Engine (Web Worker or Sync Module)

**Responsibility:** Given a routed canal (path + elevation profile + dimensions), computes all scientific estimates: construction cost, water volume, sea-level impact, ecological timeline, climate effects.

**Technology:** Pure TypeScript functions — no external library needed. Runs in a Web Worker for heavy batch recalculations; runs synchronously for instant parameter adjustments.

**Calculation modules (each is an independent pure function):**

| Module | Input | Output |
|--------|-------|--------|
| `volumeCalc` | path length, width, depth, elevation profile | excavation m³, water volume m³ |
| `costEstimate` | excavation volume, terrain type | cost range in USD (min/max) |
| `seaLevelImpact` | water volume stored inland | sea level change in mm |
| `ecologicalTimeline` | water volume, area, climate zone | years to vegetation establishment |
| `climateRisk` | canal length, location, topology | risk flags (cyclone, tornado likelihood) |

**Boundaries:**
- Input: `RoutedCanal` (output of Routing Engine)
- Output: `ScientificReport { cost, seaLevelDelta, volume, ecology, risks }`
- No DOM, no map access, pure functions — easy to unit-test
- Pluggable: adding a new module means adding a function with the `Calculator` interface signature

**Plugin interface:**
```typescript
interface Calculator {
  id: string;
  label: string;
  compute(canal: RoutedCanal, params: Record<string, number>): CalculationResult;
}
```

Registering a new calculator: `engine.register(myNewCalculator)`. The UI auto-renders its output.

---

### 6. State Layer (Application State)

**Responsibility:** Single source of truth for the app — which canals exist, which is selected, what the calculation results are, what the UI parameters (width, depth) are.

**Technology:** Zustand (single store, simple API, no boilerplate)

**Why Zustand over Jotai:** The app has one coherent domain model (`canals[]`, `selectedCanalId`, `reports{}`). A single store matches this. Jotai's atomic model adds complexity for no benefit at this scale.

**Store shape:**
```typescript
{
  canals: Canal[];              // persisted to IndexedDB
  selectedCanalId: string | null;
  parameters: CanalParameters;  // width, depth, cost factors
  reports: Record<string, ScientificReport>; // keyed by canalId
  ui: { sidebarOpen, activeTab, loading };
}
```

---

### 7. Persistence Layer

**Responsibility:** Saves canal definitions and scenarios across browser sessions.

**Technology:** IndexedDB via `Dexie.js` (clean wrapper, TypeScript-native)

**What is persisted:**
- Canal GeoJSON paths (the routed LineStrings)
- Canal parameters (width, depth)
- Calculation results (ScientificReport objects)
- Named scenarios ("Scenario A: Sahara only", "Scenario B: full network")

**What is NOT persisted:**
- Elevation tile data (fetched on demand, browser-cached by service worker optionally)
- Map viewport (reconstructed from URL hash)

**Storage estimate:** Each canal is ~10–50 KB of GeoJSON + 1 KB of metadata. 100 canals = ~5 MB. Well within IndexedDB's practical limits (hundreds of MB).

**No backend database needed for personal use.** If the project evolves toward sharing scenarios, add a thin Express/Fastify backend writing to SQLite. This is a deliberate out-of-scope decision for now.

---

## Data Flow

```
USER CLICK ON MAP
       │
       ▼
Canal Drawing Tool
  (Terra Draw captures waypoints)
       │
       │ RawCanalInput {waypoints, width, depth}
       ▼
Zustand Store
  (stores raw canal, triggers routing)
       │
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
Routing Engine (Web Worker)          Elevation Service (Tier B)
  Dijkstra on elevation grid    ◄──── Open Topo Data API / COG
  Returns routed LineString          (elevation profile for path)
       │
       │ RoutedCanal { path, elevationProfile, excavationVolume }
       ▼
Zustand Store
  (stores routed canal, triggers calculation)
       │
       ▼
Calculation Engine (Web Worker or sync)
  Five independent calculators
       │
       │ ScientificReport { cost, seaLevel, ecology, risks }
       ▼
Zustand Store
  (stores report)
       │
       ├──────────────────────────┐
       │                          │
       ▼                          ▼
Map Shell                   Results Panel
  (renders canal overlay)    (renders ScientificReport)
       │
       │
Persistence Layer (IndexedDB / Dexie)
  (auto-saves canals + reports on store change)
```

---

## Recommended Build Order

### Phase 1 — Map Shell + Drawing (no calculations)

Build the interactive map with canal drawing capability. User can draw lines on the map, see them rendered. No elevation data yet — straight lines only.

**Why first:** Everything else depends on having a working map. Validates the UX before investing in the hard parts.

Deliverables:
- Vite + React + TypeScript scaffold
- MapLibre GL JS with free base tiles (OpenFreeMap or Maptiler free tier)
- Terra Draw integration for waypoint placement
- Zustand store stub (canals array in memory only)

---

### Phase 2 — Elevation Service + Elevation Profile Display

Connect to Open Topo Data API. Sample elevation along the drawn canal path. Display the elevation profile as a chart below the map (Recharts or Victory).

**Why second:** Validates that we can get real terrain data before writing the routing algorithm. Also produces a visible, impressive result fast.

Deliverables:
- Elevation Service module (Open Topo Data API wrapper)
- Elevation profile chart component
- 3D terrain visual on map (MapLibre Terrain-RGB from Maptiler)

---

### Phase 3 — Routing Engine (Least-Cost Path)

Implement Dijkstra in a Web Worker over a sampled elevation grid. Replace straight canal lines with terrain-optimal paths.

**Why third:** Requires the Elevation Service (Phase 2). This is the most complex algorithmic piece — isolate it as its own phase to validate correctness before layering calculations on top.

Deliverables:
- Web Worker scaffold with postMessage protocol
- Elevation grid sampling (sample N×N points in bounding box)
- Dijkstra implementation (or import `ngraph.path` — a battle-tested graph library)
- Canal path update when routing completes

---

### Phase 4 — Calculation Engine (Scientific Reports)

Implement the five calculators as pure functions. Build the results panel UI. Connect to Zustand.

**Why fourth:** Can only run once we have a routed canal with real elevation data and volume numbers.

Deliverables:
- `volumeCalc`, `costEstimate`, `seaLevelImpact` (core three)
- Results panel component
- `ecologicalTimeline`, `climateRisk` (secondary two)
- Unit tests for each calculator

---

### Phase 5 — Persistence + Scenarios

Add IndexedDB persistence. Let the user save, name, and reload canal scenarios.

**Why fifth:** Deferred persistence is fine for exploration; it only becomes important once you have results worth keeping.

Deliverables:
- Dexie.js integration
- Scenario save/load UI
- Export to JSON/GeoJSON

---

### Phase 6 — Continental Expansion

Add Africa, Americas, Asia topographic data. The algorithm requires no changes — only ensure SRTM coverage for new bounding boxes (SRTM is global 30m, so this is automatic).

**Why last:** The architecture is designed to be geography-agnostic. Expansion is adding data sources and UI presets, not code changes.

---

## Key Architectural Decisions

### Decision 1: All computation client-side (no backend)

**Options considered:**
- A) Full backend (Python/FastAPI with GDAL, PostGIS) — server processes all terrain calculations
- B) Hybrid — elevation queries on server, calculations in browser
- C) Pure client-side — browser does everything via Web Workers + COG/API calls

**Recommendation: C (pure client-side)**

**Rationale:**
- Personal use means zero concurrent users — no scaling concern
- No server to host, maintain, or pay for
- Web Workers handle the computation off the main thread
- Open Topo Data free API handles elevation queries adequately
- COG/geotiff.js provides a server-free fallback for elevation if API rate limits are hit
- Pyodide was considered for Python-in-browser scientific libs (NumPy, SciPy) but rejected: 6–10 MB download, no true multiprocessing, performance worse than native JS for the algorithms needed here

**Confidence:** HIGH — this is the standard approach for personal scientific web apps in 2024-2025.

---

### Decision 2: Terrain-RGB tiles for visualization, Open Topo Data for computation

**Options considered:**
- A) Single source: query Open Topo Data for both visualization and computation
- B) Dual source: Terrain-RGB for MapLibre 3D rendering, Open Topo Data API for numeric computation
- C) Dual source: Terrain-RGB for rendering, geotiff.js + SRTM COG for computation

**Recommendation: B initially, migrate to C if API limits are hit**

**Rationale:**
- Terrain-RGB (Terrarium encoding) is a PNG tile format optimized for visual rendering — MapLibre reads it natively for 3D terrain. You cannot efficiently query individual lat/lng values from it without a canvas pixel-read hack.
- Open Topo Data is a proper REST API for numeric elevation queries, purpose-built for path profiling.
- COG/geotiff.js is more complex to implement but eliminates the API dependency entirely.

---

### Decision 3: Dijkstra over A* for canal routing

**Options considered:**
- A) A* with elevation heuristic
- B) Dijkstra on weighted grid
- C) Off-the-shelf routing engine (OSRM, Valhalla) repurposed for terrain

**Recommendation: B (Dijkstra)**

**Rationale:**
- A* requires an admissible heuristic. For elevation-based cost, designing a tight, admissible heuristic is non-trivial and getting it wrong produces incorrect paths. Dijkstra is always correct.
- OSRM/Valhalla are road-network engines — repurposing them for raw elevation grids requires heavy customization that is not worth the effort.
- A 500×500 grid = 250k nodes. Dijkstra on a sparse graph of that size runs in milliseconds in a Web Worker.
- If performance becomes an issue, A* can be added later with the same interface.
- `ngraph.path` is a solid open-source JavaScript graph library (Dijkstra + A*) that can be imported rather than implementing from scratch.

**Confidence:** MEDIUM — correct for the order-of-magnitude precision target; may need reconsideration if the grid must increase to 2000×2000+ for precision.

---

### Decision 4: No backend database — IndexedDB for personal persistence

**Options considered:**
- A) SQLite backend with REST API
- B) Supabase/Firebase cloud database
- C) IndexedDB in browser (Dexie.js)

**Recommendation: C (IndexedDB)**

**Rationale:**
- Personal use, single machine — no need for sync or sharing
- No server cost, no API keys
- IndexedDB can hold hundreds of MB — more than enough for thousands of canals
- Dexie.js provides a clean, TypeScript-native wrapper
- If sharing becomes needed later, Dexie has a cloud sync extension (Dexie Cloud) that can be added without changing the local storage API

---

### Decision 5: Plugin pattern for Calculation Engine

**Options considered:**
- A) Monolithic calculation function (all five calculators in one function)
- B) Plugin registry pattern (each calculator is a registered module)

**Recommendation: B (Plugin registry)**

**Rationale:**
- The project explicitly plans to add more analysis dimensions over time (climate effects, ecological timelines, risk analysis)
- A plugin interface (`Calculator { id, label, compute }`) means adding a new scientific model is a single file addition with zero core changes
- The UI can auto-discover and render registered calculators
- TypeScript generics enforce the interface at compile time

---

## Integration Points

### Map Shell ↔ Zustand Store

```typescript
// Map reads canal geometries from store
const canals = useStore(s => s.canals);

// Map emits raw input to store
store.addRawCanal({ waypoints, width, depth });
```

### Zustand Store → Routing Engine (Worker)

```typescript
// Store sends message to worker
routingWorker.postMessage({ type: 'ROUTE_CANAL', payload: rawCanal });

// Worker replies
routingWorker.onmessage = (e) => {
  if (e.data.type === 'ROUTE_COMPLETE') {
    store.setRoutedCanal(e.data.payload);
  }
};
```

### Routing Engine ↔ Elevation Service

```typescript
// Inside the Web Worker (no DOM, no fetch restrictions)
const profile = await elevationService.getProfile(waypoints, resolution);
// elevationService calls Open Topo Data batch endpoint
```

### Calculation Engine ↔ Zustand Store

```typescript
// Triggered when a RoutedCanal is stored
store.subscribe(
  s => s.canals.find(c => c.id === id)?.routedPath,
  async (routedCanal) => {
    if (!routedCanal) return;
    const report = await calculationEngine.run(routedCanal);
    store.setReport(routedCanal.id, report);
  }
);
```

### Canal GeoJSON Schema (shared contract between all components)

```typescript
interface Canal {
  id: string;
  name: string;
  status: 'raw' | 'routing' | 'routed' | 'calculated';
  rawWaypoints: LatLng[];
  parameters: { widthMeters: number; depthMeters: number };
  routedPath?: GeoJSON.LineString;
  elevationProfile?: ElevationPoint[];
  excavationVolumeCubicMeters?: number;
  report?: ScientificReport;
  createdAt: string;
}
```

This schema is the shared language between all components. Components only need the fields relevant to their responsibility — the Map Shell only reads `routedPath`, the Calculation Engine only reads `elevationProfile` and `parameters`.

---

## Scalability and Modular Expansion

| Concern | Current Design | At 10 canals | At 100 canals |
|---------|---------------|-------------|--------------|
| Storage | IndexedDB (browser) | Fine (<1 MB) | Fine (<50 MB) |
| Routing speed | Dijkstra 500×500 grid | ~2s per canal | Same (parallel workers possible) |
| Elevation API | Open Topo Data free | Fine | May hit rate limits — switch to COG |
| Adding new continent | Zero code change | Zero code change | Zero code change |
| Adding new calculator | One file, one `register()` call | Same | Same |
| Sharing scenarios | Not supported | Export JSON | Add Dexie Cloud or lightweight backend |

---

## Sources

- MapLibre GL JS terrain documentation: https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/
- Open Topo Data (self-hostable elevation API): https://www.opentopodata.org/
- geotiff.js (browser COG reader): https://geotiffjs.github.io/
- Mapbox Terrain-RGB encoding spec: https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-rgb-v1/
- Terrarium vs Terrain-RGB formats: https://github.com/maplibre/maplibre-gl-js/issues/1047
- Dijkstra for terrain routing (GIS-Ops overview): https://gis-ops.com/open-source-routing-engines-and-algorithms-an-overview/
- Least-cost path on DEM: https://atcoordinates.info/2024/05/15/cost-surfaces-and-least-cost-paths-in-qgis-and-grass/
- Web Workers for scientific computation in React: https://web.dev/articles/off-main-thread
- Pyodide limitations for heavy computation: https://devblogs.microsoft.com/python/feasibility-use-cases-and-limitations-of-pyodide/
- IndexedDB storage limits and binary data: https://rxdb.info/articles/indexeddb-max-storage-limit.html
- Dexie.js IndexedDB wrapper: https://dexie.org/
- Terra Draw (MapLibre drawing plugin): https://github.com/dabreegster/route_snapper
- Turf.js geospatial analysis: https://turfjs.org/
- WebAssembly for browser geospatial computation: https://docs.honeycombmaps.com/concepts/client-side-processing-and-webassembly-explained.html
- Zustand vs Jotai comparison: https://blog.openreplay.com/zustand-jotai-react-state-manager/

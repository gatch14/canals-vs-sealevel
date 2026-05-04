---
phase: 03-routing-optimal
reviewed: 2026-04-30T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/components/DrawingToolbar.tsx
  - src/components/MapView.tsx
  - src/components/SidePanel.tsx
  - src/hooks/useRoutingWorker.ts
  - src/services/routingGrid.ts
  - src/store/canalStore.test.ts
  - src/store/canalStore.ts
  - src/tests/routingGrid.test.ts
  - src/types/canal.ts
  - src/types/routing.ts
  - src/workers/routingWorker.ts
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-30
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 3 implements routing (A* on a DEM grid in a Web Worker) for the Canal scientific app. The overall architecture is well-structured: the Worker lifecycle pattern is correct, the `oriented: true` constraint is in place, the `.reverse()` on `ngraph.path` output is applied, and the store state machine is coherent.

Three blockers were found. Two are in `buildGrid` (division-by-zero when `N=1`, and coordinates pushed outside WGS84 bounds by the 10% margin). One is in `routingWorker.ts` (the `AbortController` is created locally and cannot be reached by `worker.terminate()`, leaving in-flight HTTP requests to complete after the worker is killed). Additionally, `validateCoords` does not reject `NaN`, so a `NaN` coordinate silently passes validation and becomes the string `"NaN"` in a real HTTP request.

---

## Critical Issues

### CR-01: `buildGrid` — division by zero when `N = 1`

**File:** `src/services/routingGrid.ts:60-61`

**Issue:** The interpolation formula `col / (N - 1)` and `row / (N - 1)` produce `0/0 = NaN` when `N = 1`. The downstream call `buildGraph(1, coords, elevations)` would build a graph with one node and zero edges, `findPath` would return `[]`, and the worker emits `no-path` — silently masking the real cause. No guard against `N < 2` exists anywhere in `buildGrid`, `buildGraph`, or the caller in `routingWorker.ts`.

The current resolution values (50, 100) mean this cannot happen in the current call paths, but `buildGrid` is exported and called by tests directly with arbitrary `N`. Any future change that passes a smaller value will crash without a clear error.

**Fix:**
```typescript
export function buildGrid(start: [number, number], end: [number, number], N: number): [number, number][] {
  if (N < 2) throw new Error(`buildGrid: N must be >= 2, got ${N}`)
  // ... rest of function unchanged
}
```

---

### CR-02: `buildGrid` — 10% margin pushes coordinates outside WGS84 bounds

**File:** `src/services/routingGrid.ts:52-55`

**Issue:** The 10% margin is applied without clamping, so near-boundary inputs produce invalid coordinates. For example, `buildGrid([170, 80], [179, 89], 50)` would compute `bboxMaxLng = 179 + 0.9 = 179.9` (valid) but `bboxMaxLat = 89 + 0.9 = 89.9` (valid). A slightly wider example: `buildGrid([175, 85], [179, 89], 50)` gives `bboxMaxLat = 89 + 0.4 = 89.4` (valid). However `buildGrid([-179, 0], [179, 0], 50)` gives `bboxMinLng = -179 - 35.8 = -214.8` and `bboxMaxLng = 179 + 35.8 = 214.8`. These coordinates then reach `validateCoords` inside `fetchGridElevations` and throw an error, which the worker catches as a generic `'error'` state — the user sees "Erreur lors du calcul" with no explanation, and the routing fails for any near-antimeridian route.

Beyond the antimeridian, any bounding box that spans 180+ degrees of longitude would also produce coordinates that are structurally valid WGS84 numbers but semantically wrong (Open-Meteo would accept them but the spatial meaning is undefined).

**Fix:**
```typescript
const bboxMinLng = Math.max(-180, minLng - dLng)
const bboxMaxLng = Math.min( 180, maxLng + dLng)
const bboxMinLat = Math.max(-90,  minLat - dLat)
const bboxMaxLat = Math.min( 90,  maxLat + dLat)
```

---

### CR-03: `routingWorker.ts` — `AbortController` is unreachable from `worker.terminate()`

**File:** `src/workers/routingWorker.ts:16-17`

**Issue:** The `AbortController` is created as a local variable inside `onmessage`. When the main thread calls `worker.terminate()` (on timeout or user cancel), the worker's execution context is destroyed immediately — but any in-flight `fetch()` calls that were initiated before termination continue until the browser decides to cancel them. The `controller.signal` is never connected to anything that can be triggered externally; the `controller` has no reference outside the `onmessage` function and cannot be aborted on demand.

The practical effect: for a 100×100 grid (100 concurrent batch requests), terminating the worker after 30s leaves up to 100 HTTP requests in flight consuming bandwidth and server capacity until they naturally resolve or timeout. For the single-user client-side app this is a resource concern, not a security issue, but it violates the intent of the AbortSignal pattern.

The fix requires the AbortController to be stored at the worker scope level so it can be aborted when a dedicated cancel message arrives, or by listening for the `close` event on the worker global scope.

**Fix:**
```typescript
/// <reference lib="webworker" />
import { buildGrid, fetchGridElevations, buildGraph, findPath } from '../services/routingGrid'
import type { RoutingRequest, RoutingResult } from '../types/routing'

// Store controller at module scope so it can be aborted if needed
let activeController: AbortController | null = null

self.onmessage = async (e: MessageEvent<RoutingRequest>) => {
  const { start, end, resolution } = e.data

  // Abort any previous in-flight requests
  activeController?.abort()
  activeController = new AbortController()
  const signal = activeController.signal

  try {
    const coords = buildGrid(start, end, resolution)
    const elevations = await fetchGridElevations(coords, signal)
    // ... rest unchanged, use `signal` throughout
  } catch (err) {
    if (signal.aborted) return  // Worker was terminated mid-fetch — silent exit
    self.postMessage({ type: 'error', message: String(err) } satisfies RoutingResult)
  } finally {
    activeController = null
  }
}
```

Note: `worker.terminate()` does not trigger `close` event reliably across all browsers, so the module-scope controller approach is the practical solution.

---

## Warnings

### WR-01: `validateCoords` — NaN passes validation silently

**File:** `src/services/routingGrid.ts:16-19`

**Issue:** In JavaScript, `NaN < -90` and `NaN > 90` both evaluate to `false`. This means a coordinate containing `NaN` passes the range check. The downstream URL becomes `latitude=NaN&longitude=2.35`, which Open-Meteo may handle unpredictably (return 400, or return garbage data). Map click events from MapLibre always produce valid numbers, so this is unlikely to be triggered in production, but it is a correctness gap in the validation function.

**Fix:**
```typescript
export function validateCoords(coords: [number, number][]): void {
  for (const [lng, lat] of coords) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      throw new Error(`Coordonnée invalide : lat=${lat} hors [-90, 90]`)
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      throw new Error(`Coordonnée invalide : lng=${lng} hors [-180, 180]`)
  }
}
```

---

### WR-02: `buildGraph` — `?? 0` null-coalescing on typed tuple values is dead but misleading code

**File:** `src/services/routingGrid.ts:130-131`

**Issue:** `dirs` is declared as `[[-1,0],[1,0],...]`, a nested array literal of `number` values. The destructure `const [dr, dc] = dirs[i]` gives `dr: number` and `dc: number` — neither can be `null` or `undefined`. The `?? 0` expressions `(dr ?? 0)` and `(dc ?? 0)` are unreachable dead code.

More importantly, if a future refactor changes the type of `dirs` to use `null` as a sentinel value (e.g., `type Direction = [number | null, number | null]` for cardinal-only connectivity), the `?? 0` would silently substitute `0` instead of skipping the direction — producing incorrect self-loops (a node would link to itself at zero cost, making the graph wrong without any error).

**Fix:** Remove the null-coalescing operators. Rely on TypeScript's type system.

```typescript
const r2 = row + dr
const c2 = col + dc
```

If the direction values were genuinely uncertain, add an explicit runtime guard:
```typescript
if (dr === undefined || dc === undefined) continue
```

---

### WR-03: `useRoutingWorker.ts` — Worker spawned multiple times if dependencies update while computing

**File:** `src/hooks/useRoutingWorker.ts:78`

**Issue:** The `useEffect` dependency array is `[routingState, routingStart, routingEnd]`. The effect only runs when `routingState === 'computing'`, but `routingStart` and `routingEnd` are included as dependencies. If either coordinate were to update while `routingState` is already `'computing'` (e.g., a race condition in the store or a future feature), the effect would re-run: the cleanup function would terminate the first worker (correct), but a second worker would immediately be spawned with the new coordinates — potentially producing a second result that calls `finalizeRoutedCanal` twice.

The store prevents this today (once `setRoutingEnd` sets state to `'computing'`, no further set calls change `routingStart`/`routingEnd`), but the hook's correctness depends on an external invariant that is not enforced at the hook level.

**Fix:** Capture the coordinates at effect entry and snapshot them, removing the implicit dependency on future state changes. Or narrow the dependency array to `[routingState]` and read `routingStart`/`routingEnd` via `useCanalStore.getState()` inside the effect (consistent with the anti-stale-closure pattern already used elsewhere):

```typescript
useEffect(() => {
  if (routingState !== 'computing') return
  const { routingStart: start, routingEnd: end } = useCanalStore.getState()
  if (!start || !end) return
  // ... rest of effect using `start` and `end`
}, [routingState])  // routingStart/routingEnd removed from deps
```

---

### WR-04: Test `routingGrid.test.ts` — "no path" test does not assert no path is found

**File:** `src/tests/routingGrid.test.ts:147-156`

**Issue:** The test titled "findPath retourne [] quand obstacle infranchissable sépare départ et arrivée" builds a graph with extreme elevation values, then immediately abandons it and instead tests a flat graph with `[0,0,0,0]` elevations. The final assertion is `expect(Array.isArray(path)).toBe(true)` — which is always `true` regardless of what `findPath` returns. This test provides zero coverage of the "no path found" scenario and gives false confidence.

**Fix:** Construct a graph where no path can exist between two nodes. The most reliable approach for an oriented graph is to create two nodes with a one-way link that doesn't connect them in the desired direction:

```typescript
it('findPath retourne [] quand aucun chemin gravitaire', () => {
  // 2 nodes only, no edges — completely isolated
  const graph = createGraph()
  graph.addNode(0, { lng: 0, lat: 0, alt: 0 })
  graph.addNode(1, { lng: 1, lat: 1, alt: 100 })
  // No edges added — no path possible
  const coords: [number, number][] = [[0, 0], [1, 1]]
  const path = findPath(graph, 2, coords, [0, 0], [1, 1])
  expect(path).toEqual([])
})
```

---

## Info

### IN-01: `routingGrid.ts` — `@turf/turf` barrel import in Worker-shared module

**File:** `src/services/routingGrid.ts:4`

**Issue:** `routingGrid.ts` is imported from `routingWorker.ts`. It imports from `@turf/turf` (the full barrel) for the `distance` function used only in `getResolution`. The research documentation (03-RESEARCH.md) explicitly flags this as a risk: Vite's tree-shaking of barrel imports inside workers may not eliminate all of `@turf/turf`, increasing the worker bundle size.

`getResolution` is also called in `useRoutingWorker.ts` (main thread) using the same Euclidean approximation inline, making the `@turf/turf` call in `routingGrid.ts` redundant — the resolution is computed independently in the hook before posting to the worker.

**Fix:** Replace `import { distance } from '@turf/turf'` in `routingGrid.ts` with the haversine inline function already defined in the same file:

```typescript
export function getResolution(start: [number, number], end: [number, number]): 50 | 100 {
  const dist = haversineKm({ lng: start[0], lat: start[1] }, { lng: end[0], lat: end[1] })
  return dist <= 100 ? 50 : 100
}
```

This eliminates the `@turf/turf` barrel import from the file and reduces worker bundle weight.

---

### IN-02: `buildGrid` — degenerate bbox when start equals end

**File:** `src/services/routingGrid.ts:43-66`

**Issue:** When `start` and `end` are the same point (or within the same coordinate), `dLng = 0` and `dLat = 0`, so all grid points collapse to a single coordinate. Every node in the graph would have the same `(lng, lat)` — the A* trivially returns a zero-length path between coincident nodes. The worker then emits `no-path` (since `path.length === 0` — wait, actually it would emit a single node path which is length 1, which also evaluates to `no-path` since `path.length === 0` is false for 1 node... the result is undefined behavior).

The research document (03-RESEARCH.md Open Questions #3) explicitly deferred a minimum-distance guard but did not implement it.

**Fix:** Add a minimum distance check in the worker or in `useRoutingWorker.ts` before spawning:

```typescript
// In useRoutingWorker.ts, before spawning the worker:
if (distKm < 1) {
  useCanalStore.getState().setRoutingState('error')
  return
}
```

Or throw in `buildGrid` if the bbox has zero span:
```typescript
if (dLng === 0 && dLat === 0) throw new Error('buildGrid: start et end sont identiques')
```

---

_Reviewed: 2026-04-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

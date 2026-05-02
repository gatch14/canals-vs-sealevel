---
phase: 05-analyse-ecologique
plan: T02
subsystem: ecology-engine
tags: [tdd, green, ecologyEngine, turf, geojson, vite-plugin]
dependency_graph:
  requires: [T01-stubs, T01-types, T01-geojson-data]
  provides: [ecology-engine-implementation, ecologyEngine-green]
  affects: [T03-hooks-ui]
tech_stack:
  added: [geojsonPlugin-vite-custom]
  patterns: [TDD-GREEN, 3-case-lineIntersect, booleanIntersects-guard, lineSlice-try-catch]
key_files:
  created: []
  modified:
    - src/lib/ecologyEngine.ts
    - vite.config.ts
decisions:
  - geojsonPlugin added to vite.config.ts to transform .geojson imports in Vitest SSR mode
  - Vitest 3.2.4 embeds Vite 7.3.2 for SSR transform — Rollup cannot parse JSON as JS module without transform
  - Plugin uses readFileSync to emit export default <json> — zero new npm dependencies
metrics:
  duration: 340s
  completed_at: 2026-05-01
  tasks_completed: 1
  files_created: 0
  files_modified: 2
---

# Phase 05 Plan T02: Ecology Engine Wave 1 Summary

**One-liner:** ecologyEngine.ts fully implemented with 3-case lineIntersect algorithm + ECO-01/02/03/04 functions — 11/11 GREEN, vite.config.ts patched with geojsonPlugin to unblock Vitest SSR JSON imports.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Implémenter ecologyEngine.ts complet — GREEN | e78d3a6 | src/lib/ecologyEngine.ts, vite.config.ts |

## Verification Results

- `npm test -- ecologyEngine` — 11/11 GREEN
- `npm test` — 77/77 tests GREEN (66 pre-existing + 11 new)
- `npx tsc --noEmit` — 0 erreur TypeScript
- computeEcologyAnalysis retourne EcologyResult non-null pour CANAL_CROSSING (Sahara traversal)
- computeEcologyAnalysis retourne null pour canal.points.length < 2
- detectEndorheicBasin détecte la Mer Caspienne pour canal terminant en [51, 43]

## Success Criteria Check

- [x] npm test -- ecologyEngine → 11/11 PASS (GREEN)
- [x] npx tsc --noEmit → 0 erreur
- [x] computeEcologyAnalysis(canal) retourne EcologyResult non-null pour canal traversant le Sahara
- [x] computeEcologyAnalysis(canal) retourne null pour canal.points.length < 2
- [x] detectEndorheicBasin détecte la Mer Caspienne pour un canal terminant en [51, 43]

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest SSR mode cannot parse .geojson imports as ES modules**

- **Found during:** Task 1 — first test run
- **Issue:** ecologyEngine.ts imports `desertZones.geojson` and `endorheicBasins.geojson` at top-level. Vitest 3.2.4 embeds Vite 7.3.2 internally for SSR transforms; Rollup within this embedded Vite cannot parse JSON files as JavaScript modules (`RollupError: Parse failure: Expected ';', '}' or <eof>`)
- **Root cause:** Vite 8.0.10 (project-level) includes a native JSON plugin, but Vitest uses its own embedded Vite 7.3.2 which does not automatically apply JSON transform in SSR mode
- **Fix:** Added a lightweight `geojsonPlugin()` to `vite.config.ts` that intercepts `.geojson` file imports and transforms them to `export default <json-content>` ES modules. Uses Node.js `readFileSync` — zero new npm dependencies
- **Files modified:** vite.config.ts
- **Commit:** e78d3a6

## Implementation Notes

### 3-case algorithm for computeDesertLengthKm

The core of ECO-01 handles three geometric cases:

1. **0 intersection points** (canal fully inside polygon): `booleanIntersects` returns true but `lineIntersect` finds no border crossings. Test `booleanPointInPolygon(startPoint, polygon)` — if true, return `length(canal)`.
2. **≥2 intersection points** (canal crosses both borders): `lineSlice(entry, exit, canal)` extracts the segment inside the polygon.
3. **1 intersection point** (canal starts or ends inside polygon): Determine which end is inside via `booleanPointInPolygon`, then `lineSlice` from that end to the intersection point.

All `lineSlice` calls wrapped in `try/catch` returning 0 (Pitfall P3 — identical points can throw).

### Aridity class severity merge

`mergeAridityClass` uses a priority map `{ hyperarid: 3, arid: 2, semiarid: 1 }` to keep the most severe class when multiple desert zones are traversed.

## Known Stubs

None — all 6 functions fully implemented.

## Threat Flags

No new network endpoints, auth paths, or schema changes introduced.

## TDD Gate Compliance

- RED gate (test commit): e43179f `test(05-T01): stubs RED...` — PRESENT (from T01)
- GREEN gate (feat commit): e78d3a6 `feat(05-T02): ecologyEngine.ts complete implementation — 11/11 GREEN` — PRESENT
- REFACTOR gate: not needed — code clean on first pass

## Self-Check: PASSED

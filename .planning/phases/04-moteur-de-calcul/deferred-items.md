# Deferred Items — Phase 04

## Pre-existing Build Errors (npm run build fails with tsc -b)

Discovered during T03 execution (2026-05-01). These errors existed before T03 changes — confirmed by stash test.

**Files affected (not modified by T03):**
- `src/components/ElevationChart.tsx:54,55` — Recharts Formatter type incompatibility (TS2322)
- `src/services/routingGrid.ts:167,173,174` — ngraph.path generic type incompatibility (TS6133, TS2322)
- `src/tests/routingGrid.test.ts:143,149,154,165` — ngraph.path Graph<NodeData> type incompatibility (TS2345, TS6133)
- `src/workers/routingWorker.ts:5,23` — ngraph.path type incompatibility (TS6133, TS2345)
- `src/tests/calculationEngine.test.ts:18` — unused import ElevationPoint (TS6196)
- `src/components/MapView.tsx:6` — CSS import type declaration missing (TS2307) — pre-existing
- `src/main.tsx:2` — CSS import type declaration missing (TS2307) — pre-existing
- `vite.config.ts:7` — `test` key not in UserConfigExport (TS2769) — pre-existing

**Note:** `npx tsc --noEmit` passes because it uses `tsconfig.json` which excludes test files and workers.
`npm run build` uses `tsc -b` which includes all files.

**Recommended fix:** Add `skipLibCheck: true` to tsconfig.json or fix the ngraph.path generic types.
These are out of scope for Phase 4 — defer to a dedicated TypeScript cleanup task.

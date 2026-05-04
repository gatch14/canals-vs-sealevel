---
phase: 09-eau-salee-dessalement
fixed_at: 2026-05-02T13:24:00Z
review_path: .planning/phases/09-eau-salee-dessalement/09-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Fixed at:** 2026-05-02T13:24:00Z
**Source review:** .planning/phases/09-eau-salee-dessalement/09-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (CR-01, WR-01, WR-02, WR-03, WR-04)
- Fixed: 5
- Skipped: 0

**Verification:** 138/138 tests GREEN — `npx vitest run`. Zero TypeScript errors — `npx tsc --noEmit`.

## Fixed Issues

### CR-01: ECO-05 alert is dead code — `'critical'` impact level structurally unreachable

**Files modified:** `src/types/desalination.ts`, `src/components/EcologyPanel.tsx`, `src/tests/desalinationEngine.test.ts`
**Commit:** ef3d40f
**Applied fix:** Chose Option B — removed `'critical'` from `EcosystemImpactLevel` type (now `'low' | 'neutral'`). Removed the dead ECO-05 red alert block from `EcologyPanel`. WR-03 fix (remove `!noProfile` gate) co-applied in same commit since both touched the same JSX block. Tightened test at line 31 from `toContain(['neutral','critical'])` to `toBe('neutral')`, and updated orchestrator test to use `['low', 'neutral']`.

### WR-01: `calcSaltValue` ignores `solarFactor` — inconsistent with `calcWaterProduction`

**Files modified:** `src/lib/desalinationEngine.ts`, `src/tests/desalinationEngine.test.ts`
**Commit:** 6b70dc5
**Applied fix:** Renamed `_lengthKm` parameter to `solarFactor` in `calcSaltValue`. Added `* solarFactor` to the `dailyFlowMin` calculation (consistent with `calcWaterProduction`). Updated call site in `computeDesalinationAnalysis` from `calcSaltValue(nodes, params.lengthKm)` to `calcSaltValue(nodes, params.solarFactor)`. Updated all 4 test call sites to pass `1.0` (solarFactor) instead of km values.

### WR-02: `useDesalination` memoization defeated by `.find()` outside `useMemo`

**Files modified:** `src/hooks/useDesalination.ts`
**Commit:** cc729d7
**Applied fix:** Moved `canals.find(...)` inside the `useMemo` callback. Changed deps array from `[selectedCanal]` (new object reference every render) to `[selectedCanalId, canals]` (stable primitives/array reference). Memoization now fires only when the selected canal ID or canal list actually changes.

### WR-03: Desalination UI incorrectly gated behind elevation profile check

**Files modified:** `src/components/EcologyPanel.tsx`
**Commit:** ef3d40f (co-applied with CR-01)
**Applied fix:** Removed `!noProfile` from the desalination toggle/results section condition. Now uses `!noCanal` only, decoupling the feature from elevation data availability. The desalination engine requires only points and length — no elevation.

### WR-04: `useDesalination` called twice — dead invocation in `SidePanel`

**Files modified:** `src/components/SidePanel.tsx`
**Commit:** aa3826e
**Applied fix:** Removed the `useDesalination()` call at line 26 of `SidePanel` and its corresponding import. Each hook invocation is independent — the SidePanel call did not share state with `EcologyPanel`. The redundant Turf.js computation (lineString + length) per render is eliminated.

---

_Fixed: 2026-05-02T13:24:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

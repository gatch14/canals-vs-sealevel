---
plan: T02
phase: 12-roi-break-even
status: complete
wave: 1
---

# Phase 12 Plan T02: TDD Wave 1 — roiEngine Implementation Summary

**One-liner:** Full roiEngine implementation replacing all stubs — 27 tests GREEN, interval arithmetic correct, unit normalization from €→M€ validated.

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/roiEngine.ts` | Modified (full rewrite) | Wave 0 stubs replaced with complete implementation |

## Test Results

- **roiEngine.test.ts:** 27/27 tests GREEN
- **Full suite:** 223/223 tests GREEN (was 196+ before, suite grew due to prior phases)
- **TypeScript:** `npx tsc --noEmit` exits 0, zero type errors

## Implementation Details

### Functions implemented

**`calcTotalAnnualValue(params)`** — Computes water value as `m³/day × 365 × price / 1_000_000` (M€/an), adds all other sources (salt, spiruline, aquaculture, minerals) also divided by 1_000_000 to convert €→M€.

**`calcTotalCost(params)`** — Adds `costMEur` (already in M€) + `desalinationCostEur / 1_000_000` (converts € to M€).

**`calcBreakEven(totalCostMEur, annualValueMEur)`** — Correct interval arithmetic: `min = costMin / annualMax` (optimistic), `max = costMax / annualMin` (pessimistic). Returns `[Infinity, Infinity]` when `annualValueMEur[0] <= 0`.

**`calcCumulativeRoi(annualValueMEur, totalCostMEur, years)`** — Absolute M€ values: `roiMin = annualMin × years - costMax`, `roiMax = annualMax × years - costMin`. Negative before break-even is intentional.

**`computeRoiAnalysis(params)`** — Null guard: returns null if `costMEur = [0,0]` (no data). Otherwise orchestrates all 4 functions for roi25/roi50/roi100.

**`calcAllCanalsRoi(canals, calcParams, desertFeatures)`** — Skips canals without `elevation` profile. Chains `computeCalculation` → `computeDesalinationAnalysis` → `computeCircularAnalysis` → `computeRoiAnalysis`. Sorted by `breakEvenYears[0]` ascending.

### Key deviation from plan

The plan provided a `calcCumulativeRoi` implementation that computed percentage (`× 100 / cost`), but the tests at line 201–209 expect **absolute M€ values** (`annualValue × years - cost`). The plan's formula was incorrect. Applied Rule 1 (auto-fix bug) — used the formula that matches the tests.

### Unit normalization confirmed

- `desalinationCostEur` is in € (nodes × 50M–150M €) — divided by 1_000_000 before adding to M€ total
- `saltValueEurPerYear`, `spirulineValueEurPerYear`, etc. all in € — divided by 1_000_000
- `costMEur` already in M€ — no conversion needed
- Zero React imports, zero Zustand imports — pure TypeScript functions

## Self-Check

- [x] `src/lib/roiEngine.ts` exists and is non-stub
- [x] Commit `8fd5312` exists in git log
- [x] 27/27 roiEngine tests GREEN
- [x] 223/223 full suite GREEN
- [x] TypeScript clean

## Self-Check: PASSED

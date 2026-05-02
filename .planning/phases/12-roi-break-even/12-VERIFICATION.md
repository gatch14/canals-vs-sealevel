---
phase: 12-roi-break-even
verified: 2026-05-02T15:06:56Z
status: gaps_found
score: 9/10 must-haves verified
overrides_applied: 0
gaps:
  - truth: "useROI.ts does NOT guard on desalinationEnabled (ROI works without desalination)"
    status: failed
    reason: "Lines 50 and 64 of useROI.ts gate desalination data AND circular economy data behind desalinationEnabled. When desalinationEnabled=false, desal is forced to zeros and circResult is never computed. The ROI result is returned but is hollow — it only reflects construction cost with zero annual value sources, making breakEvenYears=[Infinity,Infinity]. The comment at line 6 claims 'pas de guard sur desalinationEnabled' but the implementation contradicts this."
    artifacts:
      - path: "src/hooks/useROI.ts"
        issue: "Line 50: `const desal = desalinationEnabled && desalResult ? desalResult : { nodes:0, ... zeros }` — forces desal to zeros when disabled. Line 64: `if (desalinationEnabled && desal.nodes > 0)` — skips circular economy entirely when disabled."
    missing:
      - "Remove desalinationEnabled guard from desal assignment (line 50): use `desalResult ?? { ...zeros }` so desalination data feeds ROI even when the UI toggle is off, OR clarify the intended behavior with a decision record if gating is intentional."
      - "Remove desalinationEnabled guard from circular block (line 64): use `if (desal.nodes > 0)` so spiruline/aquaculture/minerals values are computed whenever desal nodes exist."
---

# Phase 12: ROI & Break-even Verification Report

**Phase Goal:** ROI engine — pure TypeScript module `roiEngine.ts`, types `roi.ts`, React hook `useROI.ts`. Covers ROI-01 (total annual value), ROI-02 (cumulative ROI at 25/50/100 years), ROI-03 (break-even years), ROI-04 (multi-canal comparison table).
**Verified:** 2026-05-02T15:06:56Z
**Status:** GAPS_FOUND
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `src/types/roi.ts` exists and exports RoiParams, RoiResult, RoiSummary | VERIFIED | File at line 7/26/43; all three interfaces present with Interval fields throughout |
| 2 | `src/lib/roiEngine.ts` exports all 6 required functions + 2 price constants | VERIFIED | Lines 17-18 (WATER_PRICE_MIN/MAX), 28/56/71/90/107/127 (all 6 functions) |
| 3 | `src/tests/roiEngine.test.ts` has 20+ tests | VERIFIED | 27 tests across 6 describe blocks confirmed by test runner |
| 4 | `src/hooks/useROI.ts` exports useROI() | VERIFIED | Function declared at line 22 |
| 5 | roiEngine.ts has ZERO React/Zustand imports | VERIFIED | grep returns no matches — only turf, geojson, local types, and local engines imported |
| 6 | useROI.ts uses useMemo with [selectedCanalId, canals, desalinationEnabled, calcParams] | VERIFIED | Line 92 dep array matches exactly |
| 7 | DESERT_FEATURES declared at module level in useROI.ts | VERIFIED | Line 20: `const DESERT_FEATURES = desertZones as unknown as FeatureCollection` |
| 8 | useROI.ts does NOT import useDesalination or useCircular | VERIFIED | No such imports found — hook-in-hook pitfall avoided |
| 9 | desalinationCostEur normalized from € to M€ in calcTotalCost (divided by 1_000_000) | VERIFIED | Lines 58-59: `params.desalinationCostEur[0] / 1_000_000` and `[1] / 1_000_000` |
| 10 | useROI.ts does NOT guard on desalinationEnabled (ROI works without desalination) | **FAILED** | Lines 50 and 64 gate desal + circular data behind `desalinationEnabled`. When false, all annual value sources are zeroed, producing breakEvenYears=[Infinity,Infinity] |

**Score:** 9/10 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/roi.ts` | Exports RoiParams, RoiResult, RoiSummary | VERIFIED | 61 lines, all three interfaces, Interval on every numeric field |
| `src/lib/roiEngine.ts` | Pure engine, 6 exports | VERIFIED | 206 lines, no React/Zustand, all functions implemented (not stubs) |
| `src/tests/roiEngine.test.ts` | 20+ tests, all GREEN | VERIFIED | 27 tests, 27/27 GREEN |
| `src/hooks/useROI.ts` | useROI() hook | VERIFIED (with gap) | Exists and wired; desalinationEnabled guard is a behavioral defect |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useROI.ts` | `roiEngine.ts` | `computeRoiAnalysis` import | WIRED | Line 14 import, line 83 call site |
| `useROI.ts` | `canalStore` | `useCanalStore` | WIRED | 4 selectors on lines 23-26 |
| `useROI.ts` | `calculationEngine` | `computeCalculation` | WIRED | Lines 12 + 34 |
| `useROI.ts` | `desalinationEngine` | `computeDesalinationAnalysis` | WIRED | Lines 13 + 45 |
| `useROI.ts` | `circularEngine` | `computeCircularAnalysis` | WIRED (conditional) | Lines 13 + 65 — guarded by desalinationEnabled |
| `roiEngine.ts` | `calcAllCanalsRoi` | chains all three engines | WIRED | Lines 137-189 |

---

### Behavioral Spot-Checks

| Behavior | Result | Status |
|----------|--------|--------|
| roiEngine tests (27 tests) | 27/27 GREEN | PASS |
| Full test suite (223 tests) | 223/223 GREEN, 14 files | PASS |
| TypeScript strict check | `npx tsc --noEmit` exits 0, no output | PASS |
| calcBreakEven returns [Infinity,Infinity] when annualValue[0] <= 0 | Test at line 150-154 passes | PASS |
| desalinationCostEur divided by 1_000_000 | Test at line 138-144 passes (expectedMin = 1500 + 150) | PASS |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/hooks/useROI.ts` | 50, 64 | `desalinationEnabled &&` guards on annual value computation | WARNING | When desalinationEnabled=false, all revenue sources are zeroed; ROI result is returned but economically meaningless (breakEven=Infinity). Contradicts stated invariant. |

---

### Gaps Summary

**1 gap blocking stated invariant:** The must-have states "useROI.ts does NOT guard on desalinationEnabled (ROI works without desalination)." The implementation at lines 50 and 64 does the opposite — it uses `desalinationEnabled` as a gate. When the toggle is off, `desal` is set to all zeros and the circular economy block is skipped entirely. The result of `computeRoiAnalysis` will have `totalAnnualValueMEur=[0,0]`, causing `calcBreakEven` to return `[Infinity,Infinity]`.

The comment at line 6 says "pas de guard sur desalinationEnabled" — this was the intent documented in T03. The implementation deviated from that intent.

**Remediation options (choose one):**

Option A — Fix the guard (matches stated invariant): Replace line 50 with `const desal = desalResult ?? { ...zeros }` and line 64 with `if (desal.nodes > 0)`. ROI then reflects construction cost plus any available revenue regardless of the UI toggle.

Option B — Accept the deviation (if gating is intentional): Add an override entry to VERIFICATION.md frontmatter documenting that desalinationEnabled intentionally gates all revenue sources in the ROI hook (e.g., because the UI only shows ROI when desalination is active). This would require updating the T03 decision record and the must-have wording.

---

_Verified: 2026-05-02T15:06:56Z_
_Verifier: Claude (gsd-verifier)_

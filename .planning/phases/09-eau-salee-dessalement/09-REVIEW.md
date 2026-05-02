---
phase: 09-eau-salee-dessalement
reviewed: 2026-05-02T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/types/desalination.ts
  - src/lib/desalinationEngine.ts
  - src/tests/desalinationEngine.test.ts
  - src/hooks/useDesalination.ts
  - src/store/canalStore.ts
  - src/components/EcologyPanel.tsx
  - src/components/SidePanel.tsx
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-05-02
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 9 implements the desalination engine (`desalinationEngine.ts`) as a set of pure functions, a React hook (`useDesalination`), store state (`desalinationEnabled`/`toggleDesalination`), and a UI extension of `EcologyPanel`. The engine structure, interval arithmetic, and TDD approach are sound. However one critical defect renders the primary safety feature (ECO-05 saltwater alert) permanently invisible. Four additional warnings cover a salt value calculation inconsistency, a memoization defect, a spurious dependency on the elevation profile in UI logic, and a dead parameter in the public API.

---

## Critical Issues

### CR-01: ECO-05 alert is dead code — `'critical'` impact level is structurally unreachable

**File:** `src/lib/desalinationEngine.ts:19-34` and `src/components/EcologyPanel.tsx:183`

**Issue:** `classifyEcosystem` can only return `'low'` (desert intersection) or `'neutral'` (no intersection). The `'critical'` branch is described in comments as "réservé pour cours d'eau/zones agricoles (déféré)" — meaning it was deferred. However the UI in `EcologyPanel.tsx` at line 183 gates the ECO-05 red alert entirely on `desalinationResult?.ecosystemImpact === 'critical'`. Since no code path ever produces `'critical'`, this alert **never fires**. The ECO-05 requirement (alert for river/agricultural zones) is silently non-functional, yet nothing in the test suite catches this because the test at line 31 of the test file accepts both `'neutral'` and `'critical'` as valid outputs for the Europe test case.

The type `EcosystemImpactLevel` exports `'critical'` as a valid member, creating a false contract. Downstream consumers (including the tests) reasonably assume this value can be produced.

**Fix:** Either implement the `'critical'` classification before shipping (e.g., a bounding-box heuristic or hardcoded lat/lng ranges for major river deltas), or remove `'critical'` from the type and the UI conditional until the deferred GeoJSON data is available. Leaving the alert permanently hidden with no fallback violates requirement ECO-05.

```typescript
// Option A: minimal heuristic (in desalinationEngine.ts)
// After the desert check, add a river/farmland heuristic:
// For now treat any non-desert intersection with lat 0–60 as 'neutral',
// but flag 'critical' only when a dedicated GeoJSON is loaded.

// Option B: remove the dead branch from the type until it can be implemented
export type EcosystemImpactLevel = 'low' | 'neutral'
// and remove the ECO-05 alert block from EcologyPanel until the feature is ready
```

---

## Warnings

### WR-01: `calcSaltValue` ignores `solarFactor` — inconsistent with `calcWaterProduction`

**File:** `src/lib/desalinationEngine.ts:84-93`

**Issue:** `calcWaterProduction` correctly scales by `solarFactor` (line 71). `calcSaltValue` hardcodes `nodes * 10_000 * 0.8` as the daily flow floor regardless of solar factor. A canal running through temperate zones (solarFactor = 0.7) would produce 30% less water per day than a tropical canal, but the salt revenue calculation treats both identically. The economic estimate is therefore overstated for temperate canals.

Additionally, the `_lengthKm` parameter is accepted but never used. Its presence in the function signature is misleading and introduces a mismatch between the declared interface and actual logic.

**Fix:**

```typescript
export function calcSaltValue(
  nodes: number,
  solarFactor: number,  // replace _lengthKm with the factor that actually matters
): Interval {
  if (nodes === 0) return [0, 0]
  const dailyFlowMin = nodes * 10_000 * solarFactor * 0.8  // consistent with calcWaterProduction
  const annualVolume = dailyFlowMin * 365
  const saltMassKg = annualVolume * 35
  return [saltMassKg * 0.05, saltMassKg * 0.15]
}
```

Update the call site in `computeDesalinationAnalysis` and `DesalinationParams` accordingly:
```typescript
saltValue: calcSaltValue(nodes, params.solarFactor),
```

---

### WR-02: `useDesalination` memoization is defeated by `.find()` outside `useMemo`

**File:** `src/hooks/useDesalination.ts:18-31`

**Issue:** `selectedCanal` is computed with `canals.find(...)` at line 18, outside the `useMemo`. Each time any part of the Zustand store changes and triggers a re-render, `canals.find()` runs and returns either a new object reference (if found) or `null`. When a canal is selected, `selectedCanal` receives a new object reference on every render — even if the canal's data has not changed. Since `useMemo`'s dependency is `[selectedCanal]`, and `selectedCanal` is a new reference on every render, the memo recomputes on every render, making the memoization completely ineffective. This is the exact anti-pattern documented in Pitfall P2 of RESEARCH.md.

Compare with `useEcology.ts` which has the identical pattern (also affected, pre-existing issue, not in this phase's scope) but the desalination computation involves Turf.js `lineString` and `length` calls which are not free.

**Fix:** Move the `.find()` inside the `useMemo`, or subscribe to the canal by ID and use a stable selector:

```typescript
export function useDesalination(): DesalinationResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  return useMemo<DesalinationResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)

    return computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )
  }, [selectedCanalId, canals])
}
```

---

### WR-03: Desalination UI incorrectly gated behind elevation profile check

**File:** `src/components/EcologyPanel.tsx:183` and `199`

**Issue:** Both the ECO-05 alert and the desalination toggle/results section are gated on `!noProfile` (i.e., a canal must have an elevation profile loaded). `noProfile` is defined at line 55 as `selectedCanal !== null && !selectedCanal.elevation`. However, the desalination engine (`desalinationEngine.ts`) requires only `points` (for geometry/solar factor) and `lengthKm` (for node count). It has zero dependency on elevation data. Requiring the user to first load an elevation profile before seeing desalination results is an accidental coupling that hides a useful feature unnecessarily.

Concretely: a user draws a 1500 km canal, selects it, and wants to see the desalination estimate before triggering an elevation fetch. The toggle is invisible until the elevation loads.

**Fix:** Decouple the desalination section condition from `noProfile`:

```tsx
{/* ECO-05 alert — does not require elevation */}
{!noCanal && desalinationResult?.ecosystemImpact === 'critical' && (
  // ...alert JSX...
)}

{/* Toggle dessalement — does not require elevation */}
{!noCanal && (
  // ...toggle + results JSX...
)}
```

---

### WR-04: `useDesalination` called twice — dead invocation in `SidePanel`

**File:** `src/components/SidePanel.tsx:26`

**Issue:** `useDesalination()` is called at line 26 of `SidePanel` with the comment "Maintient le moteur dessalement actif pour EcologyPanel". This is a misunderstanding of React hook semantics. Each `useDesalination()` call is a completely independent hook invocation with its own `useMemo` state. The call in `SidePanel` does not share state with or "activate" the call in `EcologyPanel`. The return value of the `SidePanel` call is discarded (not assigned). This call is pure dead code that performs redundant Turf.js computation (lineString + length) on every render without benefit.

**Fix:** Remove the dead invocation from `SidePanel.tsx`:

```tsx
// Remove this line:
// useDesalination()

// EcologyPanel already calls useDesalination() internally.
```

---

## Info

### IN-01: `_lengthKm` — dead parameter in `calcSaltValue` public API

**File:** `src/lib/desalinationEngine.ts:86-87`

**Issue:** The `_lengthKm` parameter is prefixed with `_` to suppress the unused variable lint warning. It is accepted in the function signature and passed at call sites (line 135 of the orchestrator) but has no effect. This is a public API with a parameter that does nothing, which misleads callers into believing canal length affects salt revenue.

**Fix:** Remove the parameter from both the function definition and the `calcSaltValue` call in `computeDesalinationAnalysis`. Update the test at line 143 (`calcSaltValue(0, 500)`) and line 149 (`calcSaltValue(2, 1000)`) accordingly. Note this overlaps with WR-01 — fixing WR-01 resolves this as well.

---

### IN-02: Test assertion masks the `'critical'` dead branch

**File:** `src/tests/desalinationEngine.test.ts:31-36`

**Issue:** The test "retourne critical ou neutral pour des points hors désert (Europe tempérée)" uses `expect(['neutral', 'critical']).toContain(result)`. This assertion passes regardless of whether `'critical'` is ever returned, masking the fact that the `'critical'` path is unimplemented (see CR-01). A test that accepts two values where one is structurally impossible provides false confidence.

**Fix:** Once the intent is clarified (either implement `'critical'` or remove it), tighten this assertion. If `'critical'` is removed from the type, change to `expect(result).toBe('neutral')`. If it is implemented, test for the specific condition that triggers it.

---

### IN-03: Section numbering in `SidePanel.tsx` comments is out of order

**File:** `src/components/SidePanel.tsx:122-125`

**Issue:** The comment at line 122 reads `Section 8 — Candidats mondiaux pré-calculés (Phase 8)` while line 125 reads `Section 7 — Effacement données (Phase 7)`. Section 8 appears before Section 7 in the rendered DOM, which will cause confusion when reading or maintaining the component layout.

**Fix:** Renumber comments to reflect actual DOM order (Section 7 → CandidatesPanel, Section 8 → ClearDataButton, or renumber sequentially).

---

_Reviewed: 2026-05-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

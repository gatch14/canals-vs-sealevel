---
phase: 10-impact-meteorologique
reviewed: 2026-05-02T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/components/EcologyPanel.tsx
  - src/hooks/useMeteorology.ts
  - src/lib/meteorologyEngine.ts
  - src/tests/meteorologyEngine.test.ts
  - src/types/meteorology.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 10 : Code Review Report

**Reviewed:** 2026-05-02
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Five files implement the Phase 10 meteorological impact engine (METEO-01 to METEO-05). The architecture is sound: pure functions, `[min, max]` intervals throughout, a clean hook wrapping a memoised computation. However, one formula in `calcInducedPrecipitation` contains a critical dimensional error that produces physically absurd precipitation values (tens of thousands of mm/an). Three warnings cover a display anomaly for the cooling interval, an untested boundary in `classifyWeatherRisk`, and an inconsistency in the `noImpact` derivation. Two info items cover test coverage gaps and a minor redundancy.

---

## Critical Issues

### CR-01: `calcInducedPrecipitation` — missing area divisor produces dimensionally wrong output

**File:** `src/lib/meteorologyEngine.ts:84-87`

**Issue:** The function converts a volume of evaporation (km³) directly to precipitation (mm/an) by multiplying by `1e6`, but precipitation in mm/an is a depth — it requires dividing by a catchment area. Without the area denominator, the output is not in mm/an and the numbers are astronomically large.

Example: a 1 000 km canal, 50 m wide → surfaceKm2 = 50 km² → evapMin ≈ 0.025 km³ (aridityFactor=1.0) → precipitationMmY[0] = 0.025 × 0.40 × 1e6 = **10 000 mm/an** (10 m of rain per year, displayed to the user as the lower bound).

The intended formula is evidently: fraction of evaporation that falls back as rain, spread over the canal influence zone. The influence area in km² is approximately `π × influenceRadiusKm² / 2` (or a similar heuristic). The correct computation should divide the evaporated volume by that area before converting units.

**Fix:**
```typescript
export function calcInducedPrecipitation(
  evapKm3: Interval,
  aridityFactor: number,
  influenceAreaKm2: number,   // add this parameter
): Interval {
  if (evapKm3[0] === 0 && evapKm3[1] === 0) return [0, 0]
  if (influenceAreaKm2 <= 0) return [0, 0]
  const pMin = 0.20 * (1 + aridityFactor)
  const pMax = 0.40 * (1 + aridityFactor)
  // km³ → km  (×1e9 m³ / (area km² × 1e6 m²/km²)) = ×1000  → mm: ×1000 again = ×1e6 / area_km2
  return [
    (evapKm3[0] * pMin * 1e6) / influenceAreaKm2,
    (evapKm3[1] * pMax * 1e6) / influenceAreaKm2,
  ]
}
```

And in `computeMeteorologyAnalysis`, compute the influence area from the radius interval (use the midpoint as a reasonable approximation) and pass it:

```typescript
const influenceRadius = calcInfluenceRadius(params.lengthKm, aridityFactor)
const influenceAreaKm2 = Math.PI * Math.pow((influenceRadius[0] + influenceRadius[1]) / 2, 2)
const precipitationMmY = calcInducedPrecipitation(evaporationKm3, aridityFactor, influenceAreaKm2)
```

The test in `meteorologyEngine.test.ts:80` must also be updated to pass the new parameter.

---

## Warnings

### WR-01: Cooling interval display shows double-negative (`[-2.00 – -0.50] °C`)

**File:** `src/components/EcologyPanel.tsx:303` / `src/lib/meteorologyEngine.ts:106-109`

**Issue:** `coolingDeltaC` always stores two negative values, e.g. `[-2.0, -0.5]`. The `formatInterval` helper at line 25 produces `[-2.000 – -0.500] °C` — a double-negative expression that is confusing to non-scientific users and violates the "display friendly" intent of UX-01. Furthermore, the comment in `MeteorologyResult` (types/meteorology.ts:41) describes `[0]` as "refroidissement maximum" and `[1]` as "refroidissement minimum", which is semantically inverted from the standard `[min, max]` contract of `Interval` (though numerically it does satisfy min < max since -2 < -0.5).

**Fix:** Display the absolute values with a leading minus sign:
```tsx
// EcologyPanel.tsx line 303-305
<dd className="text-[13px] font-semibold text-white">
  {formatInterval(
    [Math.abs(meteorologyResult.coolingDeltaC[1]), Math.abs(meteorologyResult.coolingDeltaC[0])],
    '°C', 2
  ).replace('[', '[−').replace(' – ', ' – −')}
</dd>
```
Or, simpler: render cooling as a positive magnitude with a "−" prefix outside the interval:
```tsx
<dd className="text-[13px] font-semibold text-white">
  −{formatInterval(
    [Math.abs(meteorologyResult.coolingDeltaC[1]), Math.abs(meteorologyResult.coolingDeltaC[0])],
    '°C', 2
  )}
</dd>
```

### WR-02: `classifyWeatherRisk` boundary at exactly `lengthKm === 1500` is untested and inconsistent with the type doc

**File:** `src/lib/meteorologyEngine.ts:127-129` / `src/types/meteorology.ts:12`

**Issue:** The JSDoc on `WeatherRisk` states `'high'` applies when `> 1500 km`, so `lengthKm === 1500` is `'moderate'`. The condition in code (`lengthKm > 1500`) is consistent with the doc. However, the boundary at 500 km uses strict `< 500`, meaning exactly 500 km returns `'moderate'` — but the doc says `'low'` applies for `canal < 500 km`. The doc uses `< 500` whereas the code returns `'low'` only for `< 500` (consistent). What is untested and inconsistent is the exact value 1500:

```typescript
// lengthKm === 1500, aridityFactor === 1.0
// isHumid = false, isDesert = true
// condition: isDesert && lengthKm > 1500  → false (1500 is not > 1500)
// → returns 'moderate'
```

No test covers `classifyWeatherRisk(1500, 1.0)`. If the product intent is that 1500 km in a desert IS high risk, the condition should be `>=` not `>`. This boundary decision should be explicit.

**Fix:** Add a test and decide the boundary:
```typescript
// If 1500 km should be 'high':
if (isDesert && lengthKm >= 1500) return 'high'

// Add test:
it('retourne high pour canal exactement 1500 km en zone désertique (borne inclusive)', () => {
  expect(classifyWeatherRisk(1500, 1.0)).toBe('high')
})
```

### WR-03: `noImpact` logic in `EcologyPanel` is inconsistent — meteorology section visible when `noImpact` is true

**File:** `src/components/EcologyPanel.tsx:74-78` / lines 131, 275`

**Issue:** The `noImpact` flag (line 74) guards the ecology État 4+5+6 block (line 131). However, the meteorology section (line 275) uses only `!noCanal && meteorologyResult` — it is completely independent of `noImpact`. This means:

- If `ecologyResult` has no desert intersection, no endorheic alert, and no climate risk flag (`noImpact === true`), the UI displays État 3 ("Aucune zone écologique significative") **and simultaneously** the meteorological section below.
- The user sees a "no significant ecological impact" message immediately above a section that may report `weatherRisk: 'high'` — a direct contradiction.

Beyond the UX contradiction, the meteorology section can appear when the ecology section is in État 1 (`noCanal` is a store state for no selection — but wait: `meteorologyResult` returns null when no canal is selected via the `!selectedCanal` guard in the hook, so this case is naturally handled). The contradiction is specifically when `noImpact` is true but meteorology has results.

**Fix:** Either:
a) Add `noImpact` to cover meteorological results (redefine: no impact means ecology AND meteorology are both negligible), or
b) Remove État 3 and let the ecology section simply be empty when there is no intersection, relying on the meteorological section to always appear if there is a canal.

The simplest safe fix is (b) — remove Estado 3 or rename it to "Aucun impact écologique désertique" so it does not imply absence of all environmental impact.

---

## Info

### IN-01: `calcInducedPrecipitation` test does not assert order of magnitude — it would pass with any positive value

**File:** `src/tests/meteorologyEngine.test.ts:79-83`

**Issue:** The test at line 79 only checks `result[0] > 0` and `result[1] > result[0]`. It would pass even with values of 10 000 mm/an, meaning the dimensional bug in CR-01 goes undetected by the test suite. A sanity-bound assertion would catch such regressions.

**Fix:**
```typescript
it('retourne des précipitations dans un ordre de grandeur réaliste (< 2000 mm/an)', () => {
  const result = calcInducedPrecipitation([0.1, 0.5], 1.0, influenceAreaKm2)
  expect(result[1]).toBeLessThan(2000)   // sanity bound — > 2 m/an is physically implausible
})
```

### IN-02: `computeMeteorologyAnalysis` declares `| null` return type but the only null-return path is unreachable from `useMeteorology`

**File:** `src/lib/meteorologyEngine.ts:142-143`

**Issue:** `computeMeteorologyAnalysis` guards `params.points.length < 2` and returns null. But `useMeteorology` (line 21) already guards the same condition before calling `computeMeteorologyAnalysis`. The function will therefore never return null when called from the hook — yet the hook's return type must remain `MeteorologyResult | null` to accommodate it. This creates a minor cognitive overhead for callers. The guard is harmless but the duplication could lead a future caller to pass a single-point params object believing the function handles it gracefully (it does, but the caller would need to handle null).

**Fix:** Either document the null return as "defence-in-depth against direct callers bypassing the hook", or remove the guard from the function and trust callers (less safe). The current approach is acceptable; add a comment:
```typescript
// Guard: defence-in-depth — useMeteorology already enforces points.length >= 2.
// Direct callers should not reach here with < 2 points.
if (params.points.length < 2) return null
```

---

_Reviewed: 2026-05-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

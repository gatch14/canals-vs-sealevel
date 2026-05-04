---
phase: 09-eau-salee-dessalement
reviewed: 2026-05-02T14:00:00Z
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
  critical: 0
  warning: 0
  info: 3
  total: 3
status: issues_found
---

# Phase 9: Code Review Report (Re-review — Iteration 2)

**Reviewed:** 2026-05-02T14:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Re-review after application of 5 fixes (CR-01, WR-01, WR-02, WR-03, WR-04). All critical and warning findings from the first review are confirmed resolved. The engine is structurally correct: `calcSaltValue` now scales by `solarFactor`, `useDesalination` memoization is correct with stable deps, the desalination toggle is no longer gated behind elevation loading, and the dead `useDesalination()` invocation in `SidePanel` is gone. Three info-level issues remain: a broken indentation line introduced by the WR-04 fix, one residual loose test assertion not tightened by the IN-02 fix, and the pre-existing section comment numbering in `SidePanel` that was out of scope for the fix pass.

---

## Info

### IN-01: Broken indentation in `SidePanel.tsx` — left by WR-04 fix

**File:** `src/components/SidePanel.tsx:24`

**Issue:** When the `useDesalination()` call was removed to fix WR-04, the `const routingState` declaration at line 24 was left at column 0 (no indentation), while every other statement in the function body is indented 2 spaces. Line 25 (`const cancelRouting`) is correctly indented. This is a direct artifact of the fix application.

```typescript
// Current (broken):
  usePersistence()
const routingState = useCanalStore((s) => s.routingState)   // ← 0 indent
  const cancelRouting = useCanalStore((s) => s.cancelRouting)
```

**Fix:** Restore the 2-space indent:

```typescript
  usePersistence()
  const routingState = useCanalStore((s) => s.routingState)
  const cancelRouting = useCanalStore((s) => s.cancelRouting)
```

---

### IN-02: Loose test assertion for sea-points case — not tightened by IN-02 fix pass

**File:** `src/tests/desalinationEngine.test.ts:42`

**Issue:** The Europe test (line 35) was correctly tightened to `toBe('neutral')` as part of the IN-02 fix. However the adjacent sea-points test at line 42 still uses `expect(['neutral', 'low']).toContain(result)`. This assertion accepts any value, including hypothetical future values not in the type, and provides no contract guarantee. Since `EcosystemImpactLevel` is now `'low' | 'neutral'` only, both values in the array are valid — but the assertion still passes if the function returned an unexpected string. The sea-points case (equatorial Atlantic coastline) is unlikely to intersect `desertZones.geojson`, so the expected result is deterministically `'neutral'`.

**Fix:** If the sea-points case is known to not intersect any desert zone, tighten to `toBe('neutral')`. If there is genuine uncertainty about what the GeoJSON covers at lat=0/equatorial Africa, keep `toContain` but add a comment explaining why:

```typescript
// Option A — tighten if sea route is deterministically non-desert:
expect(result).toBe('neutral')

// Option B — keep loose with explicit rationale:
// Equatorial Atlantic may brush West African coast deserts — accept both
expect(['neutral', 'low']).toContain(result)
```

---

### IN-03: Section numbering in `SidePanel.tsx` comments is out of order (carried over)

**File:** `src/components/SidePanel.tsx:118-125`

**Issue:** The comment at line 118 reads `Section 8 — Candidats mondiaux pré-calculés (Phase 8)` while the comment at line 122 reads `Section 7 — Effacement données (Phase 7)`. Section 8 appears before Section 7 in the rendered DOM. This was noted in the first review as IN-03 and was not in scope for the fix pass (confirmed: not listed in fix report).

**Fix:** Renumber comments to match DOM order. Simplest resolution: renumber CandidatesPanel as Section 7 and ClearDataButton as Section 8, or renumber all sections sequentially from 1 to remove the phase-derived numbering entirely.

---

_Reviewed: 2026-05-02T14:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Iteration: 2 (re-review after fix pass)_

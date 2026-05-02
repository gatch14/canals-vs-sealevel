# Phase 6: Dashboard Global — Research

**Researched:** 2026-05-01
**Domain:** Arithmetic aggregation + recharts BarChart + accordion UI pattern
**Confidence:** HIGH

---

## Summary

Phase 6 is a pure aggregation layer: it sums the ΔSL of every canal already computed by `calculationEngine.computeCalculation`, applies three retention-rate multipliers to produce three scenarios, and renders the result in an accordion panel with a recharts BarChart comparison against the IPCC AR6 2100 range. No new libraries, no external API calls, no store changes.

All architectural patterns already exist in the codebase. `dashboardEngine.ts` mirrors `ecologyEngine.ts` (pure TypeScript module), `useDashboard.ts` mirrors `useEcology.ts` (useMemo on the full `canals` array), `DashboardPanel.tsx` mirrors `EcologyPanel.tsx` (accordion + states), and `IpccComparisonChart.tsx` mirrors `ElevationChart.tsx` (recharts with dark theme tokens).

The entire phase is three tasks: T01 types + stubs + RED tests, T02 dashboardEngine implementation GREEN, T03 hook + UI + SidePanel integration.

**Primary recommendation:** Copy-paste-adapt the Phase 4/5 pattern. The only genuinely new problem is multi-canal aggregation with per-canal null guards.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Dashboard placement: Section 6 of SidePanel, accordion pattern identical to existing panels
- Auto-open: `canals.length > 0` (not per-canal selection — aggregate)
- IPCC_2100_RANGE_MM: `[300, 1000]` — hardcoded + IPCC AR6 2021 comment
- Three scenarios: optimiste 1.0×, réaliste 0.6×, pessimiste 0.3× du ΔSL_brut
- UX-01 strict: every scenario produces an `Interval [min, max]` (multiply both bounds)
- Graphique: recharts BarChart — réaliste scenario midpoint vs IPCC midpoint (650 mm)
- No store extension — all calculations at-will from `canals` + `calcParams`
- Re-compute ΔSL per-canal at-will from store data (not from a cached field)
- `dashboardEngine.ts` must import nothing from React, Zustand, or MapLibre
- Architecture: `src/types/dashboard.ts` + `src/lib/dashboardEngine.ts` + `src/hooks/useDashboard.ts` + `src/components/DashboardPanel.tsx` + `src/components/IpccComparisonChart.tsx`

### Claude's Discretion

- Style exact du BarChart (couleurs, légende, tooltip) — cohérence avec dark theme
- Gestion du cas où aucun canal n'a de profil d'élévation chargé (ΔSL = 0 par défaut)
- Format exact des labels de scénario (icônes, couleurs : vert/amber/rouge)
- Arrondi des valeurs ΔSL cumulées pour lisibilité (ex. 0.001 mm → "< 0.01 mm")

### Deferred Ideas (OUT OF SCOPE)

- Timeline 2025–2100 avec courbe d'évolution → v2
- Export PDF / partage de scénarios → v2
- Calcul d'impact géographique → v2
- Pondération par densité de population côtière → v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GLOB-01 | Un ΔSL cumulé est calculé pour l'ensemble des canaux tracés (somme des impacts individuels) | `computeCumulativeDeltaSL` sums per-canal ΔSL computed via `computeCalculation` — `addIntervals` helper reused from calculationEngine |
| GLOB-02 | Trois scénarios (optimiste / réaliste / pessimiste) selon les hypothèses d'évaporation et absorption | `computeScenarios` multiplies `cumulativeDeltaSL` by [1.0, 0.6, 0.3] using interval arithmetic: `[min*k, max*k]` |
| GLOB-03 | Dashboard récapitulatif avec graphique de comparaison IPCC 2100 | `IpccComparisonChart` recharts BarChart — réaliste midpoint vs IPCC_2100_RANGE_MM midpoint (650 mm) |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| ΔSL cumulation | Browser (pure TS) | — | Pure arithmetic over in-memory store state |
| Scenario computation | Browser (pure TS) | — | Scalar multiplication — no I/O, no services |
| IPCC bar chart render | Browser (React/recharts) | — | Client-side chart, data is hardcoded constant |
| State read | Browser (Zustand) | — | `useCanalStore` selectors, no new state needed |
| Formatting / display | Browser (React component) | — | Tailwind dark-theme panels |

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | BarChart for IPCC comparison | Already installed, used in ElevationChart.tsx |
| zustand | 5.0.12 | Read `canals` + `calcParams` | Store already defined — no extension |
| vitest | 3.2.1 | Unit tests for dashboardEngine | Existing test infrastructure |

[VERIFIED: package.json]

### New Files (no new installs needed)

| File | Purpose |
|------|---------|
| `src/types/dashboard.ts` | `DashboardScenario`, `DashboardResult`, `IPCC_2100_RANGE_MM` |
| `src/lib/dashboardEngine.ts` | Pure TS module — three exported functions |
| `src/hooks/useDashboard.ts` | useMemo hook — reads all canals from store |
| `src/components/DashboardPanel.tsx` | Accordion panel — 2 states |
| `src/components/IpccComparisonChart.tsx` | recharts BarChart — isolated |
| `src/tests/dashboardEngine.test.ts` | Unit tests GLOB-01, GLOB-02, GLOB-03 |

**Installation:** No new packages required. [VERIFIED: package.json]

---

## Architecture Patterns

### System Architecture Diagram

```
useCanalStore
  ├── canals[]  ─────────────────────────────────┐
  └── calcParams (width, depth) ─────────────────┤
                                                  ▼
                                     dashboardEngine.computeDashboardResult()
                                       ├─ forEach canal:
                                       │    computeCalculation(canal, canal.elevation,
                                       │      calcParams.width, calcParams.depth)
                                       │    → CalculationResult.deltaSLmm | null
                                       ├─ addIntervals() × N  → cumulativeDeltaSLmm [Interval]
                                       └─ computeScenarios(cumulativeDeltaSLmm)
                                            ├─ optimiste: [min×1.0, max×1.0]
                                            ├─ réaliste:  [min×0.6, max×0.6]
                                            └─ pessimiste:[min×0.3, max×0.3]
                                                  ▼
                                          DashboardResult
                                                  ▼
                          useDashboard() (useMemo, depends on canals + calcParams)
                                                  ▼
                                     DashboardPanel (accordion)
                                       ├─ State 1: canals.length === 0 → empty message
                                       └─ State 2: data → ΔSL + 3 scenarios + IpccComparisonChart
                                                             ▼
                                                   IpccComparisonChart
                                                     BarChart data:
                                                       [{ name:'Canaux', value: réaliste midpoint }]
                                                       [{ name:'IPCC 2100', value: 650 }]
```

### Recommended Project Structure (additive — no existing files moved)

```
src/
├── types/
│   ├── calculation.ts    # Existing — Interval, addIntervals, OCEAN_AREA_DIVISOR
│   └── dashboard.ts      # NEW — DashboardScenario, DashboardResult, IPCC_2100_RANGE_MM
├── lib/
│   ├── calculationEngine.ts  # Existing — computeCalculation() reused
│   └── dashboardEngine.ts    # NEW — computeCumulativeDeltaSL, computeScenarios, computeDashboardResult
├── hooks/
│   ├── useCalculation.ts     # Existing — pattern reference
│   └── useDashboard.ts       # NEW — useMemo on canals[] + calcParams
├── components/
│   ├── EcologyPanel.tsx      # Existing — accordion pattern reference
│   ├── ElevationChart.tsx    # Existing — recharts pattern reference
│   ├── DashboardPanel.tsx    # NEW — accordion + 2 states
│   ├── IpccComparisonChart.tsx  # NEW — recharts BarChart
│   └── SidePanel.tsx         # EXTEND — replace footer placeholder with <DashboardPanel />
└── tests/
    ├── calculationEngine.test.ts  # Existing
    └── dashboardEngine.test.ts    # NEW — vitest
```

### Pattern 1: Pure Engine Module (dashboardEngine.ts)

**What:** Three functions — `computeCumulativeDeltaSL`, `computeScenarios`, `computeDashboardResult`. Zero React, zero Zustand, zero MapLibre imports. [VERIFIED: ecologyEngine.ts, calculationEngine.ts — same pattern]

```typescript
// Source: calculationEngine.ts — addIntervals helper (already exported)
import { computeCalculation, addIntervals } from './calculationEngine'
import type { Canal } from '../types/canal'
import type { CalcParams, Interval, CalculationResult } from '../types/calculation'
import type { DashboardResult, DashboardScenario } from '../types/dashboard'

// GLOB-01 — sum ΔSL across all canals that have a loaded elevation profile
export function computeCumulativeDeltaSL(
  canals: Canal[],
  calcParams: CalcParams,
): { deltaSLmm: Interval; canalsWithProfile: number } {
  let cumulative: Interval = [0, 0]
  let canalsWithProfile = 0

  for (const canal of canals) {
    const result = computeCalculation(
      canal,
      canal.elevation ?? null,
      calcParams.width,
      calcParams.depth,
    )
    if (result !== null) {
      cumulative = addIntervals(cumulative, result.deltaSLmm)
      canalsWithProfile++
    }
  }

  return { deltaSLmm: cumulative, canalsWithProfile }
}

// GLOB-02 — three scenarios via multiplier on both interval bounds
export function computeScenarios(
  cumulativeDeltaSLmm: Interval,
): { optimistic: DashboardScenario; realistic: DashboardScenario; pessimistic: DashboardScenario } {
  const scale = (iv: Interval, k: number): Interval => [iv[0] * k, iv[1] * k]
  return {
    optimistic:  { deltaSLmm: scale(cumulativeDeltaSLmm, 1.0), retentionRate: 1.0 },
    realistic:   { deltaSLmm: scale(cumulativeDeltaSLmm, 0.6), retentionRate: 0.6 },
    pessimistic: { deltaSLmm: scale(cumulativeDeltaSLmm, 0.3), retentionRate: 0.3 },
  }
}

// Orchestrator (single entry point for useDashboard)
export function computeDashboardResult(
  canals: Canal[],
  calcParams: CalcParams,
): DashboardResult {
  const { deltaSLmm, canalsWithProfile } = computeCumulativeDeltaSL(canals, calcParams)
  const scenarios = computeScenarios(deltaSLmm)
  return {
    cumulativeDeltaSLmm: deltaSLmm,
    canalsWithProfile,
    totalCanals: canals.length,
    scenarios,
  }
}
```

### Pattern 2: Types (dashboard.ts)

```typescript
// Source: calculation.ts — same Interval type, same locked-constant pattern
import type { Interval } from './calculation'

export interface DashboardScenario {
  deltaSLmm: Interval    // UX-01 strict
  retentionRate: number  // 1.0 / 0.6 / 0.3
}

export interface DashboardResult {
  cumulativeDeltaSLmm: Interval   // GLOB-01
  canalsWithProfile: number       // for annotation "N avec profil chargé"
  totalCanals: number
  scenarios: {
    optimistic:  DashboardScenario   // GLOB-02
    realistic:   DashboardScenario
    pessimistic: DashboardScenario
  }
}

/** IPCC AR6 2021 — RCP2.6 (300 mm) à RCP8.5 (1000 mm) — source: IPCC WGI AR6 ch.9 (2021) */
export const IPCC_2100_RANGE_MM: Interval = [300, 1000]
```

### Pattern 3: useDashboard Hook

**What:** Reads the full `canals` array (not `selectedCanalId`) + `calcParams`. Depends on all canals and their elevation state. [VERIFIED: useEcology.ts, useCalculation.ts — direct analogy]

```typescript
// Source: useEcology.ts + useCalculation.ts — useMemo pattern
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import { computeDashboardResult } from '../lib/dashboardEngine'
import type { DashboardResult } from '../types/dashboard'

export function useDashboard(): DashboardResult {
  const canals     = useCanalStore((s) => s.canals)
  const calcParams = useCanalStore((s) => s.calcParams)

  return useMemo<DashboardResult>(() => {
    return computeDashboardResult(canals, calcParams)
  }, [canals, calcParams])
  // Note: canals is a stable array ref in Zustand; mutating actions replace the array.
  // calcParams is a plain object replaced on each setCalcParams() call.
  // Both dependencies correctly trigger recompute.
}
```

**Critical:** `useDashboard` always returns a `DashboardResult` (never null) — even when `canals` is empty, it returns zero intervals. This simplifies DashboardPanel state logic: only one check needed (`canals.length === 0`).

### Pattern 4: IpccComparisonChart (recharts BarChart)

**What:** Two-bar chart — canaux réaliste midpoint vs IPCC 2100 midpoint (650 mm). Dark theme tokens match ElevationChart. [VERIFIED: ElevationChart.tsx, package.json recharts 3.8.1]

```typescript
// Source: ElevationChart.tsx — ResponsiveContainer + dark theme tokens
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Interval } from '../types/calculation'
import { IPCC_2100_RANGE_MM } from '../types/dashboard'

interface Props {
  cumulativeDeltaSL: Interval  // réaliste scenario
}

function midpoint(iv: Interval): number {
  return (iv[0] + iv[1]) / 2
}

export function IpccComparisonChart({ cumulativeDeltaSL }: Props) {
  const ipccMid = midpoint(IPCC_2100_RANGE_MM)  // 650
  const chartData = [
    { name: 'Canaux', value: midpoint(cumulativeDeltaSL), fill: '#3B82F6' },
    { name: 'IPCC 2100', value: ipccMid, fill: '#374151' },
  ]

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart
        data={chartData}
        aria-label="Comparaison impact canaux vs IPCC 2100"
        margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
      >
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={{ stroke: '#374151' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit=" mm" axisLine={{ stroke: '#374151' }} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px',
            fontSize: 12,
            color: '#F3F4F6',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'IPCC 2100') {
              return [`${value.toFixed(0)} mm (300–1000 mm, RCP2.6–8.5)`, name]
            }
            return [`${value.toFixed(3)} mm`, name]
          }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**recharts Cell component:** Required for per-bar colors in a single `Bar` element. `Cell` is exported from recharts 3.x. [VERIFIED: recharts 3.8.1 in package.json; Cell is a standard recharts primitive available since v1]

### Pattern 5: DashboardPanel Accordion — 2 States

**What:** Mirrors EcologyPanel.tsx exactly. Auto-open when `canals.length > 0`. [VERIFIED: EcologyPanel.tsx, CalculationPanel.tsx — identical accordion structure]

**State 1 (empty):** `canals.length === 0` → italic gray message.

**State 2 (data):** ΔSL cumulé row + 3 scenario columns + IpccComparisonChart.

**Auto-open logic** (from CONTEXT.md decision — different from other panels which use `selectedCanalId`):
```typescript
useEffect(() => {
  if (canals.length > 0) setIsOpen(true)
}, [canals.length])
```

**SidePanel.tsx integration:** Replace lines 107–110 (footer placeholder) with `<DashboardPanel />`. Import `DashboardPanel` alongside existing panel imports.

### Anti-Patterns to Avoid

- **Reading `selectedCanalId` in useDashboard:** This hook is aggregate — it reads ALL canals. `selectedCanalId` is irrelevant here.
- **Caching ΔSL in the store:** CONTEXT.md locks "recalculate at-will from store data" — do not add a `deltaSL` field to the Canal type.
- **Passing `null` when no profiles loaded:** `computeDashboardResult` always returns a result. Canals without profiles are silently skipped (their contribution is 0). The UI shows the count annotation instead of blocking.
- **Logarithmic scale on IPCC chart:** The UI-SPEC explicitly forbids it — honest linear comparison is the scientific message.
- **Using `recharts` animated bars:** Set `isAnimationActive={false}` to avoid test flicker and match ElevationChart pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interval addition | Custom reducer | `addIntervals()` from calculationEngine | Already exported, tested, UX-01 compliant |
| ΔSL per canal | Re-implement formula | `computeCalculation()` from calculationEngine | Handles null-guards, tolerances, all edge cases |
| Bar chart | Canvas/SVG drawing | recharts BarChart + Cell | Already installed, consistent dark theme |
| Midpoint calculation | In component | Inline `(iv[0]+iv[1])/2` | Trivial — no helper needed |

**Key insight:** Every building block for this phase already exists in the codebase. The entire engine is 3 functions that compose existing primitives.

---

## Common Pitfalls

### Pitfall 1: Canal With No Elevation Profile Loaded
**What goes wrong:** `computeCalculation` returns `null` when `canal.elevation` is undefined. If the loop crashes on null or accumulates it, cumulative ΔSL becomes NaN.
**Why it happens:** Elevation fetch is async and optional — users may add canals without loading their profile.
**How to avoid:** Guard with `if (result !== null)` before calling `addIntervals`. Track `canalsWithProfile` counter separately.
**Warning signs:** ΔSL shows `NaN` or `[NaN, NaN]` in the panel.

### Pitfall 2: useMemo Dependency on canals Array Reference
**What goes wrong:** If `canals` reference is stable while inner canal objects mutate (e.g., elevation added), useMemo does not recompute.
**Why it happens:** Zustand replaces the `canals` array on every `setElevation` call (`state.canals.map(...)` creates a new array). This is correct Zustand immutability pattern. [VERIFIED: canalStore.ts line 121–124]
**How to avoid:** Depend on `[canals, calcParams]` — both are replaced references on any store mutation. No deep comparison needed.
**Warning signs:** Dashboard shows stale ΔSL after new canal added.

### Pitfall 3: Scenario Interval Monotonicity After Scaling
**What goes wrong:** If a canal somehow produces a negative interval bound (edge case), multiplying by 0.3 could invert the [min, max] order.
**Why it happens:** `computeCalculation` always returns positive intervals for positive dimensions (volume = L×W×D > 0). But defensive coding is worthwhile.
**How to avoid:** Assume inputs are positive (same as `mulIntervals` in calculationEngine). Document the positive-interval precondition in dashboardEngine.ts.
**Warning signs:** `scenario.deltaSLmm[0] > scenario.deltaSLmm[1]` in tests.

### Pitfall 4: recharts Cell Requires Matching Array Length
**What goes wrong:** `chartData.map((_, i) => <Cell key={i} fill={...} />)` iterates over `chartData`, which is always length 2 — no runtime mismatch possible.
**Why it happens:** Not a real pitfall for this phase. Documented for awareness.
**How to avoid:** Keep `chartData` construction and `Cell` rendering in the same component (co-located).

### Pitfall 5: IPCC Constant Location
**What goes wrong:** `IPCC_2100_RANGE_MM` placed in `calculation.ts` alongside `IPCC_ANNUAL_RATE_MM` creates confusion — the two constants have different semantics (annual rate vs 2100 total projection).
**Why it happens:** Temptation to colocate all constants.
**How to avoid:** CONTEXT.md locks this: `IPCC_2100_RANGE_MM` lives in `src/types/dashboard.ts` exclusively. `IPCC_ANNUAL_RATE_MM` stays in `src/types/calculation.ts`.

### Pitfall 6: Zero-Canal Edge Case Formatting
**What goes wrong:** With 0 canals, `cumulativeDeltaSLmm = [0, 0]`. The panel shows `[0.000 – 0.000] mm` which looks confusing.
**Why it happens:** `formatInterval([0, 0], 'mm')` is technically correct but visually misleading.
**How to avoid:** DashboardPanel State 1 (empty state) hides the ΔSL row entirely when `canals.length === 0`. The `computeDashboardResult` returns `[0, 0]` but the component never renders it in this state.

---

## Code Examples

### GLOB-01: Cumulative ΔSL Computation

```typescript
// dashboardEngine.ts — computeCumulativeDeltaSL
// Canals without elevation → computeCalculation returns null → skipped (contribution = 0)
// addIntervals is imported from calculationEngine (already exported + tested)
import { computeCalculation, addIntervals } from './calculationEngine'

let cumulative: Interval = [0, 0]
let canalsWithProfile = 0

for (const canal of canals) {
  const result = computeCalculation(
    canal,
    canal.elevation ?? null,
    calcParams.width,
    calcParams.depth,
  )
  if (result !== null) {
    cumulative = addIntervals(cumulative, result.deltaSLmm)
    canalsWithProfile++
  }
}
```

### GLOB-02: Scenario Interval Scaling

```typescript
// UX-01 strict — multiply both bounds by the same scalar
// For positive intervals: [min*k, max*k] preserves monotonicity
const scale = (iv: Interval, k: number): Interval => [iv[0] * k, iv[1] * k]
const optimistic  = scale(cumulative, 1.0)  // [min, max]
const realistic   = scale(cumulative, 0.6)  // [min*0.6, max*0.6]
const pessimistic = scale(cumulative, 0.3)  // [min*0.3, max*0.3]
```

### GLOB-03: IPCC Chart Data Construction

```typescript
// IpccComparisonChart.tsx
// midpoint of realistic scenario for the "Canaux" bar
// midpoint of [300,1000] = 650 for the "IPCC 2100" bar
const ipccMid = (IPCC_2100_RANGE_MM[0] + IPCC_2100_RANGE_MM[1]) / 2  // 650
const canalsMid = (cumulativeDeltaSL[0] + cumulativeDeltaSL[1]) / 2

const chartData = [
  { name: 'Canaux',    value: canalsMid, fill: '#3B82F6' },
  { name: 'IPCC 2100', value: ipccMid,   fill: '#374151' },
]
```

### Test File Structure (dashboardEngine.test.ts)

Pattern copied from calculationEngine.test.ts: [VERIFIED: src/tests/calculationEngine.test.ts]

```typescript
// src/tests/dashboardEngine.test.ts
// Wave 0 — RED state. T02 implements and makes GREEN.
import { describe, it, expect } from 'vitest'
import {
  computeCumulativeDeltaSL,
  computeScenarios,
  computeDashboardResult,
} from '../lib/dashboardEngine'
import { IPCC_2100_RANGE_MM } from '../types/dashboard'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'
import type { ElevationProfile } from '../types/elevation'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DEFAULT_PARAMS: CalcParams = { width: 50, depth: 5 }

function makeCanal(id: string, points: [number,number][], withProfile = true): Canal {
  const elevation: ElevationProfile | undefined = withProfile ? {
    points: [{ distance: 0, altitude: 0 }, { distance: 100, altitude: 0 }],
    uphillSegments: [],
    totalUphillGain: 0,
    isFullyGravity: true,
    fetchedAt: Date.now(),
  } : undefined
  return { id, name: `Canal ${id}`, createdAt: 0,
    points: [[2.35, 48.85], [5.0, 46.0]], elevation }
}

// ─── GLOB-01 ──────────────────────────────────────────────────────────────────
describe('computeCumulativeDeltaSL (GLOB-01)', () => {
  it('retourne [0,0] pour un tableau vide de canaux', () => {
    const { deltaSLmm } = computeCumulativeDeltaSL([], DEFAULT_PARAMS)
    expect(deltaSLmm).toEqual([0, 0])
  })

  it('canaux sans profil élévation → canalsWithProfile = 0, deltaSLmm = [0,0]', () => {
    const canal = makeCanal('c1', [[0,0],[1,1]], false)
    const { deltaSLmm, canalsWithProfile } = computeCumulativeDeltaSL([canal], DEFAULT_PARAMS)
    expect(canalsWithProfile).toBe(0)
    expect(deltaSLmm[0]).toBe(0)
    expect(deltaSLmm[1]).toBe(0)
  })

  it('1 canal avec profil → deltaSLmm > [0,0] + canalsWithProfile = 1', () => {
    const canal = makeCanal('c1', [[0,0],[1,1]], true)
    const { deltaSLmm, canalsWithProfile } = computeCumulativeDeltaSL([canal], DEFAULT_PARAMS)
    expect(canalsWithProfile).toBe(1)
    expect(deltaSLmm[0]).toBeGreaterThan(0)
    expect(deltaSLmm[1]).toBeGreaterThan(deltaSLmm[0])
  })

  it('2 canaux → deltaSLmm > 1 canal (additivité)', () => {
    const c1 = makeCanal('c1', [[0,0],[1,1]], true)
    const c2 = makeCanal('c2', [[0,0],[1,1]], true)
    const single = computeCumulativeDeltaSL([c1], DEFAULT_PARAMS).deltaSLmm
    const double = computeCumulativeDeltaSL([c1, c2], DEFAULT_PARAMS).deltaSLmm
    expect(double[0]).toBeGreaterThan(single[0])
    expect(double[1]).toBeGreaterThan(single[1])
  })
})

// ─── GLOB-02 ──────────────────────────────────────────────────────────────────
describe('computeScenarios (GLOB-02)', () => {
  it('optimiste = 1.0× cumul', () => {
    const base: [number, number] = [0.1, 0.2]
    const { optimistic } = computeScenarios(base)
    expect(optimistic.deltaSLmm[0]).toBeCloseTo(0.1, 6)
    expect(optimistic.deltaSLmm[1]).toBeCloseTo(0.2, 6)
  })

  it('réaliste = 0.6× cumul', () => {
    const base: [number, number] = [0.1, 0.2]
    const { realistic } = computeScenarios(base)
    expect(realistic.deltaSLmm[0]).toBeCloseTo(0.06, 6)
    expect(realistic.deltaSLmm[1]).toBeCloseTo(0.12, 6)
  })

  it('pessimiste = 0.3× cumul', () => {
    const base: [number, number] = [0.1, 0.2]
    const { pessimistic } = computeScenarios(base)
    expect(pessimistic.deltaSLmm[0]).toBeCloseTo(0.03, 6)
    expect(pessimistic.deltaSLmm[1]).toBeCloseTo(0.06, 6)
  })

  it('optimiste >= réaliste >= pessimiste (UX-01 monotone)', () => {
    const base: [number, number] = [0.1, 0.2]
    const { optimistic, realistic, pessimistic } = computeScenarios(base)
    expect(optimistic.deltaSLmm[0]).toBeGreaterThanOrEqual(realistic.deltaSLmm[0])
    expect(realistic.deltaSLmm[0]).toBeGreaterThanOrEqual(pessimistic.deltaSLmm[0])
  })
})

// ─── GLOB-03 ──────────────────────────────────────────────────────────────────
describe('IPCC_2100_RANGE_MM constant (GLOB-03)', () => {
  it('IPCC_2100_RANGE_MM = [300, 1000]', () => {
    expect(IPCC_2100_RANGE_MM).toEqual([300, 1000])
  })

  it('midpoint = 650', () => {
    const mid = (IPCC_2100_RANGE_MM[0] + IPCC_2100_RANGE_MM[1]) / 2
    expect(mid).toBe(650)
  })
})
```

---

## Don't Hand-Roll (summary)

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ΔSL per canal | Custom formula V/361.8 | `computeCalculation()` | Handles null-guards, tolerances, 5 CALC reqs |
| Interval addition | Manual loop | `addIntervals(a, b)` from calculationEngine | Exported, tested, one line |
| Interval scaling | New `scaleInterval()` helper | Inline `[iv[0]*k, iv[1]*k]` | Too simple to abstract |
| Bar chart | Canvas element | recharts BarChart | Already installed, dark theme, zero config |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.1 |
| Config file | `vite.config.ts` (test.environment = 'jsdom', globals = true) |
| Quick run command | `npm test -- dashboardEngine` |
| Full suite command | `npm test` |

[VERIFIED: vite.config.ts, package.json]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GLOB-01 | Cumulative ΔSL = sum of per-canal ΔSL | unit | `npm test -- dashboardEngine` | Wave 0 |
| GLOB-01 | Empty canals → [0,0] | unit | `npm test -- dashboardEngine` | Wave 0 |
| GLOB-01 | Canals without profile → [0,0] contribution | unit | `npm test -- dashboardEngine` | Wave 0 |
| GLOB-02 | Scenarios multiply both bounds correctly | unit | `npm test -- dashboardEngine` | Wave 0 |
| GLOB-02 | Monotonicity: optimiste >= réaliste >= pessimiste | unit | `npm test -- dashboardEngine` | Wave 0 |
| GLOB-03 | IPCC_2100_RANGE_MM = [300, 1000] | unit | `npm test -- dashboardEngine` | Wave 0 |
| GLOB-03 | Midpoint = 650 | unit | `npm test -- dashboardEngine` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- dashboardEngine`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/tests/dashboardEngine.test.ts` — covers GLOB-01, GLOB-02, GLOB-03

*(All other test infrastructure exists — vitest config, jsdom, geojson plugin — no new framework install needed)*

---

## Security Domain

> `security_enforcement` not set to false — section required.

Phase 6 performs no I/O, no authentication, no user input persistence, no network calls. All computation is purely in-memory arithmetic over values already validated in previous phases (Phase 4 `calcParams` are validated in CalculationPanel; canal points are stored as plain numbers).

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | partial | calcParams already validated upstream in CalculationPanel before reaching dashboardEngine |
| V6 Cryptography | no | — |

No new threat surface is introduced.

---

## Environment Availability

> Step 2.6: All dependencies are already installed. No external services required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| recharts | IpccComparisonChart | Yes | 3.8.1 | — |
| vitest | dashboardEngine.test.ts | Yes | 3.2.1 | — |
| jsdom | vitest test environment | Yes | 26.1.0 | — |

[VERIFIED: package.json]

**No missing dependencies.**

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | recharts `Cell` component is exported from recharts 3.8.1 for per-bar coloring | Code Examples / IpccComparisonChart | Would need to use CSS fill or single-color bars — minor visual degradation only |
| A2 | `addIntervals` is exported from calculationEngine (not just internal) | Pattern 1 | Would need to either re-export or inline `[a[0]+b[0], a[1]+b[1]]` — trivial fix |

[A1 note: `Cell` has been a standard recharts export since v1.x and is used in countless examples. The installed version 3.8.1 is confirmed. Checking the actual export list was not done in-session — rated LOW risk.]

[A2 note: `addIntervals` is exported at line 31 of calculationEngine.ts — **VERIFIED in-session**. A2 is resolved: it is exported. No risk.]

Revised Assumptions Log:

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | recharts `Cell` exported from recharts 3.8.1 | IpccComparisonChart | Minor — use `fill` prop directly on `Bar` with a color array workaround |

---

## Open Questions

1. **Cost total cumulé (GLOB-03 requirement)**
   - What we know: GLOB-03 says "le coût total estimé" should be in the dashboard
   - What's unclear: CONTEXT.md architecture section and UI-SPEC do not explicitly show a cost row in DashboardPanel State 2
   - Recommendation: Add `cumulativeCostMEur: Interval` to `DashboardResult` and `computeDashboardResult` during T01. The UI-SPEC focuses on ΔSL + scenarios + IPCC chart, but the requirement text explicitly mentions cost. Include it as a data row below ΔSL cumulé. Planner should add a row for it in DashboardPanel.

2. **`formatInterval` / `formatCost` duplication**
   - What we know: Both helpers are currently copy-pasted in CalculationPanel.tsx and EcologyPanel.tsx
   - What's unclear: Should Phase 6 introduce a shared `src/lib/formatters.ts`?
   - Recommendation: Maintain the existing pattern (copy into DashboardPanel.tsx). Refactoring shared formatters is out-of-scope for Phase 6.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/calculationEngine.ts` — `computeCalculation`, `addIntervals`, `mulIntervals`, `divByConst` verified in-session
- `src/hooks/useCalculation.ts` — useMemo pattern verified in-session
- `src/hooks/useEcology.ts` — useMemo on full array (no selectedCanalId) verified in-session
- `src/components/EcologyPanel.tsx` — accordion states pattern verified in-session
- `src/components/ElevationChart.tsx` — recharts dark theme tokens verified in-session
- `src/store/canalStore.ts` — `canals`, `calcParams` structure verified in-session
- `src/types/calculation.ts` — `Interval`, `OCEAN_AREA_DIVISOR`, `IPCC_ANNUAL_RATE_MM` verified in-session
- `package.json` — recharts 3.8.1, vitest 3.2.1, jsdom 26.1.0 verified in-session
- `vite.config.ts` — vitest config (jsdom, globals) verified in-session
- `src/tests/calculationEngine.test.ts` — test structure pattern verified in-session
- `.planning/phases/06-dashboard-global/06-CONTEXT.md` — all locked decisions
- `.planning/phases/06-dashboard-global/06-UI-SPEC.md` — component specs, colors, copywriting

### Secondary (MEDIUM confidence)
- IPCC AR6 2021, WGI Chapter 9 — [300, 1000] mm range for RCP2.6–8.5 by 2100 [CITED: IPCC AR6 WGI Ch9, mentioned in CONTEXT.md decision]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified from package.json and existing codebase
- Architecture: HIGH — direct extension of Phases 4 and 5 patterns verified in-session
- Pitfalls: HIGH — derived from actual code reading (canalStore null guards, Zustand immutability)
- Test patterns: HIGH — copied from working calculationEngine.test.ts structure

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (stable stack — recharts, zustand, vitest versions locked)

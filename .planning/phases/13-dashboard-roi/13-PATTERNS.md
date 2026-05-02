# Phase 13: Dashboard ROI - Pattern Map

**Mapped:** 2026-05-02
**Files analyzed:** 2 (1 new, 1 modified)
**Analogs found:** 2 / 2

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/EconomicPanel.tsx` | component (accordion panel) | request-response (hooks → render) | `src/components/EcologyPanel.tsx` | exact — same role, same multi-state accordion pattern with selectedCanalId guard |
| `src/components/SidePanel.tsx` | component (layout shell) | request-response | `src/components/SidePanel.tsx` (self) | self-modification — add one import + one JSX element |

**Integration points (not new files, documented as consumers):**

| Hook / Util | Source | Return type | Role in EconomicPanel |
|-------------|--------|-------------|----------------------|
| `useROI()` | `src/hooks/useROI.ts` | `RoiResult \| null` | Primary data source |
| `useCircular()` | `src/hooks/useCircular.ts` | `CircularResult \| null` | Co-products data source |
| `calcAllCanalsRoi()` | `src/lib/roiEngine.ts` | `RoiSummary[]` | Comparative table data |

---

## Pattern Assignments

### `src/components/EconomicPanel.tsx` (new — accordion panel)

**Primary analog:** `src/components/EcologyPanel.tsx`
**Secondary analog:** `src/components/DashboardPanel.tsx` (formatInterval helpers, useEffect auto-open)

---

#### Imports pattern

Source: `src/components/EcologyPanel.tsx` lines 1–13 + `src/components/DashboardPanel.tsx` lines 1–8.

```typescript
// Pattern to copy — adapt icon list for EconomicPanel
import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle, Leaf, Fish, Beaker, Wheat, Clock, Home, TrendingUp } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { useROI } from '../hooks/useROI'
import { useCircular } from '../hooks/useCircular'
import { calcAllCanalsRoi } from '../lib/roiEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
```

Key difference vs EcologyPanel: import `useROI` + `useCircular` + `calcAllCanalsRoi`. Do NOT import `useDesalination` or `useMeteorology` (no hook-in-hook, already encapsulated inside `useROI`).

---

#### Format helpers pattern

Source: `src/components/DashboardPanel.tsx` lines 12–21. Both DashboardPanel and EcologyPanel duplicate these helpers locally. For Phase 13, the UI-SPEC says to copy them OR extract to `src/utils/format.ts` (refactor is out of scope — copy is acceptable).

```typescript
// ─── Helpers de formatage UX-01 ──────────────────────────────────────────────

function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}

/** [X – Y] unité — em dash U+2013 obligatoire */
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}
```

**EconomicPanel-specific formatting rules** (from UI-SPEC §Number Formatting):
- Break-even: `formatInterval(iv, 'ans', 0)` — but if `iv[0] === Infinity` display `"—"`
- Coût / ROI en M€: `formatInterval(iv, 'M€', 1)` (1 decimal, not 3)
- Co-produits €/an: `formatInterval(iv, '€/an', 0)` — large numbers, use `toLocaleString('fr-FR')` for ≥1M
- Surface agricole km²: `formatInterval(iv, 'km²', 1)`
- Durée de vie / habitabilité (ans): `formatInterval(iv, 'ans', 0)`

---

#### Accordion structure pattern

Source: `src/components/EcologyPanel.tsx` lines 53–98. This is the exact structure to replicate.

```typescript
export function EconomicPanel() {
  const selectedCanalId     = useCanalStore((s) => s.selectedCanalId)
  const canals              = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
  const calcParams          = useCanalStore((s) => s.calcParams)

  const roiResult      = useROI()
  const circularResult = useCircular()

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  // Auto-open when a canal with elevation is selected (same pattern as EcologyPanel line 66–69)
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (selectedCanalId && selectedCanal?.elevation) setIsOpen(true)
  }, [selectedCanalId])

  // Sub-accordion for comparative table (closed by default — UI-SPEC §Sous-accordéon)
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  return (
    <div className="border-t border-white/[0.08]">
      {/* Header accordéon */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full h-8 px-4 flex items-center gap-2 text-left
                   hover:bg-white/[0.04] transition-colors
                   focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                   outline-none"
        aria-expanded={isOpen}
      >
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
        <span className="text-[12px] font-normal text-gray-400 uppercase tracking-wider">
          Économie &amp; ROI
        </span>
      </button>

      {isOpen && (
        <div>
          {/* État A — aucun canal sélectionné */}
          {/* État B — canal sans profil altimétrique */}
          {/* État C — dessalement désactivé (ROI partiel) */}
          {/* État D — affichage complet */}
        </div>
      )}
    </div>
  )
}
```

Critical: root `<div>` uses `border-t border-white/[0.08]` — this is the accordion separator that all panels share.

---

#### State guard pattern (4 exclusive states)

Source: `src/components/EcologyPanel.tsx` lines 72–79 (states A, B) + `src/components/DashboardPanel.tsx` lines 36–39 (derived booleans).

```typescript
// Derived booleans — same pattern as EcologyPanel
const noCanal   = !selectedCanalId
const noProfile = selectedCanal !== null && !selectedCanal.elevation
const noDesal   = selectedCanal !== null && selectedCanal.elevation && !desalinationEnabled
// État D = selectedCanal && selectedCanal.elevation && roiResult !== null
```

State A placeholder (EcologyPanel line 103–109):
```tsx
{noCanal && (
  <div className="h-10 px-4 flex items-center">
    <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
      Sélectionnez un canal pour voir l&apos;analyse économique
    </p>
  </div>
)}
```

State B warning — AlertCircle amber (EcologyPanel lines 111–118):
```tsx
{!noCanal && noProfile && (
  <div className="h-10 px-4 flex items-center gap-1">
    <AlertCircle size={12} className="text-amber-400 shrink-0" />
    <p className="text-xs text-amber-400">
      Chargez le profil altimétrique pour l&apos;analyse économique
    </p>
  </div>
)}
```

State C banner — no desalination (EcologyPanel desalination toggle area, line 200–225, adapted):
```tsx
{/* amber banner when desalinationEnabled === false */}
{noDesal && (
  <p className="text-[11px] text-amber-400 flex items-center gap-1">
    <AlertCircle size={12} className="shrink-0" />
    Activez les nœuds de dessalement pour les co-produits
  </p>
)}
```

---

#### dt/dd list pattern (KPI section + co-products)

Source: `src/components/EcologyPanel.tsx` lines 134–155. Exact structure for all labeled value rows.

```tsx
<dl className="px-4 py-2 flex flex-col gap-1">
  {/* gap-1 (4px) for new dt/dd pairs — UI-SPEC note: do NOT copy gap-[2px] from analog */}
  <div className="flex flex-col gap-1">
    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">
      Seuil de rentabilité
    </dt>
    <dd className="text-[13px] font-semibold text-white">
      {/* breakEvenYears[0] === Infinity ? "—" : formatInterval(roiResult.breakEvenYears, 'ans', 0) */}
    </dd>
  </div>

  <div className="flex flex-col gap-1">
    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">
      Investissement total
    </dt>
    <dd className="text-[13px] font-semibold text-white">
      {/* formatInterval(roiResult.totalCostMEur, 'M€', 1) */}
    </dd>
  </div>
</dl>
```

Co-product rows use icon + label dt pattern (not in existing panels — new for EconomicPanel):
```tsx
<div className="flex flex-col gap-1">
  <dt className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
    <Leaf size={12} className="shrink-0" />
    Spiruline
  </dt>
  <dd className="text-[13px] font-semibold text-white">
    {/* formatInterval(circularResult.spirulineValue, '€/an', 0) */}
  </dd>
</div>
```

Icon mapping per UI-SPEC §Component Inventory:
- `Leaf` → spiruline
- `Fish` → aquaculture
- `Beaker` → minéraux
- `Wheat` → surface agricole
- `Clock` → durée de vie
- `Home` → timeline habitabilité
- `TrendingUp` → section projections ROI

---

#### Internal section separator pattern

Source: `src/components/EcologyPanel.tsx` lines 160–162.

```tsx
{/* Between major sections inside the panel body */}
<div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
  {/* section content */}
</div>
```

Internal separators use `border-white/[0.06]` (slightly more transparent than the outer `border-white/[0.08]` accordion separator).

---

#### Sub-accordion (comparative table ROI-04) pattern

No exact analog exists in codebase — the toggle button pattern is adapted from EcologyPanel's desalination toggle button (line 205–224). Sub-accordion differs: it uses a chevron, not a pill toggle.

```tsx
{/* Sub-accordion trigger */}
<button
  onClick={() => setIsCompareOpen((o) => !o)}
  className="flex items-center gap-1 text-left
             focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
             outline-none"
  aria-expanded={isCompareOpen}
>
  <ChevronDown
    size={12}
    className={`text-gray-400 transition-transform duration-200 ${isCompareOpen ? 'rotate-180' : ''}`}
  />
  <span className="text-[11px] text-gray-400 uppercase tracking-wider">
    Comparer ({canals.length} canaux)
  </span>
</button>

{/* Table — visible when isCompareOpen */}
{isCompareOpen && (
  <table className="w-full mt-1">
    <thead>
      <tr>
        <th scope="col" className="text-left text-[10px] text-gray-500 uppercase tracking-wider pb-1">Nom</th>
        <th scope="col" className="text-right text-[10px] text-gray-500 uppercase tracking-wider pb-1">Seuil</th>
        <th scope="col" className="text-right text-[10px] text-gray-500 uppercase tracking-wider pb-1">Coût</th>
        <th scope="col" className="text-right text-[10px] text-gray-500 uppercase tracking-wider pb-1">Valeur/an</th>
      </tr>
    </thead>
    <tbody>
      {/* rows — bg-white/[0.04] on selected canal row, aria-current="true" */}
    </tbody>
  </table>
)}
```

Break-even Infinity display: `summary.breakEvenYears[0] === Infinity ? '—' : formatInterval(summary.breakEvenYears, 'ans', 0)`.

---

#### calcAllCanalsRoi integration

Source: `src/lib/roiEngine.ts` lines 127–205. Called inside EconomicPanel (not in a hook — it's a pure function, safe to call directly in render with useMemo).

```typescript
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import { calcAllCanalsRoi } from '../lib/roiEngine'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

// Inside EconomicPanel, memoized:
const roiSummaries = useMemo(
  () => calcAllCanalsRoi(canals, calcParams, DESERT_FEATURES),
  [canals, calcParams],
)
```

Note: `calcAllCanalsRoi` already sorts by `breakEvenYears[0]` ascending with `Infinity` last (roiEngine.ts line 204).

---

### `src/components/SidePanel.tsx` (modify — add EconomicPanel)

**Analog:** self (current SidePanel.tsx lines 1–128)

Two changes only:

1. Add import (after line 9, after DashboardPanel import):
```typescript
import { EconomicPanel } from './EconomicPanel'
```

2. Add JSX element (after line 116 `<DashboardPanel />`):
```tsx
{/* Section 7 — Économie & ROI (accordéon) — Phase 13 */}
<EconomicPanel />
```

The `CandidatesPanel` currently sits after `DashboardPanel` (line 119). According to UI-SPEC §Implementation Notes "Ordre sections", `EconomicPanel` goes at position 7 (final), after `DashboardPanel`. The existing comment numbering in SidePanel is already inconsistent (Section 8 before Section 7) — insert EconomicPanel after DashboardPanel and before CandidatesPanel, or after CandidatesPanel per UI-SPEC which lists it last. UI-SPEC says "position finale" = last — place it after `<CandidatesPanel />` and before the `ClearDataButton` footer.

---

## Shared Patterns

### Accordion root element
**Source:** `src/components/DashboardPanel.tsx` line 51, `src/components/EcologyPanel.tsx` line 81
**Apply to:** `EconomicPanel.tsx`
```tsx
<div className="border-t border-white/[0.08]">
```

### Accordion header button
**Source:** `src/components/EcologyPanel.tsx` lines 83–98
**Apply to:** `EconomicPanel.tsx`
```tsx
<button
  onClick={() => setIsOpen((o) => !o)}
  className="w-full h-8 px-4 flex items-center gap-2 text-left
             hover:bg-white/[0.04] transition-colors
             focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
             outline-none"
  aria-expanded={isOpen}
>
  <ChevronDown
    size={14}
    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
  />
  <span className="text-[12px] font-normal text-gray-400 uppercase tracking-wider">
    {/* panel title */}
  </span>
</button>
```

### useEffect auto-open
**Source:** `src/components/DashboardPanel.tsx` lines 31–33 (canals.length trigger), `src/components/EcologyPanel.tsx` lines 67–69 (selectedCanalId trigger)
**Apply to:** `EconomicPanel.tsx` — trigger on `selectedCanalId` AND `selectedCanal?.elevation` (stricter than EcologyPanel)
```typescript
useEffect(() => {
  if (selectedCanalId && selectedCanal?.elevation) setIsOpen(true)
}, [selectedCanalId])
```

### dt/dd typography scale
**Source:** `src/components/EcologyPanel.tsx` lines 137–139 / 144–146
**Apply to:** All labeled value rows in `EconomicPanel.tsx`
```
dt: text-[11px] text-gray-500 uppercase tracking-wider
dd: text-[13px] font-semibold text-white
```
Exception: amber for cost/infrastructure values (EcologyPanel line 254: `text-amber-300`)

### Internal section separator
**Source:** `src/components/EcologyPanel.tsx` lines 160–162
**Apply to:** Between KPI / co-products / projections / compare sections in `EconomicPanel.tsx`
```tsx
<div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Sub-accordion with `<table>` | component sub-pattern | n/a | No native HTML table inside a collapsible sub-section exists in current codebase. Use ChevronDown toggle adapted from existing accordion header pattern. |

---

## Key Integration Notes

### RoiResult fields available in EconomicPanel
Source: `src/types/roi.ts` lines 26–39
```typescript
interface RoiResult {
  totalAnnualValueMEur: Interval   // total value/year in M€
  totalCostMEur: Interval          // construction + desalination cost in M€  ← "Investissement total"
  breakEvenYears: Interval         // years to break even  ← [Infinity,Infinity] when no desalination
  roi25: Interval                  // net cumulative ROI at 25y in M€
  roi50: Interval                  // net cumulative ROI at 50y in M€
  roi100: Interval                 // net cumulative ROI at 100y in M€
}
```

### CircularResult fields available in EconomicPanel
Source: `src/types/circular.ts` lines 28–51
```typescript
interface CircularResult {
  spirulineValue: Interval     // €/an
  aquacultureValue: Interval   // €/an
  mineralsValue: Interval      // €/an
  arableLandKm2: Interval      // km²
  lifespanYears: Interval      // ans
  habitabilityYears: Interval  // ans
}
// Note: circularResult === null when desalinationEnabled === false (useCircular guard line 23)
```

### useROI guard behavior
Source: `src/hooks/useROI.ts` lines 28–33
- Returns `null` if no canal selected, `< 2` points, or no elevation profile loaded
- Does NOT gate on `desalinationEnabled` — always computes ROI (with zeros for desal co-products if no nodes)
- `roiResult.breakEvenYears === [Infinity, Infinity]` when `totalAnnualValueMEur[0] <= 0` (i.e., no desalination, no revenue sources)

---

## Metadata

**Analog search scope:** `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`
**Files scanned:** 8 source files read in full
**Pattern extraction date:** 2026-05-02

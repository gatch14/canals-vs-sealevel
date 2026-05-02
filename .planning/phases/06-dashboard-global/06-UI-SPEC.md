---
phase: 6
slug: dashboard-global
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-01
---

# Phase 6 — UI Design Contract

> Visual and interaction contract for the Dashboard Global phase. Generated from Phase 5 UI-SPEC (same design system) + Phase 6 CONTEXT.md decisions.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — hand-crafted dark-theme components |
| Preset | not applicable |
| Component library | none (Tailwind CSS v4 via `@import 'tailwindcss'` — no config file) |
| Icon library | lucide-react (exact version 1.14.0) |
| Chart library | recharts (already installed — used in ElevationChart.tsx) |
| Font | system-ui (browser default) |

**Source:** Phase 5 UI-SPEC §Design System, `src/components/ElevationChart.tsx`, `package.json`

---

## Spacing Scale

Identical to Phase 5 (no changes):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps (`gap-1`) |
| sm | 8px | Compact spacing (`gap-2`, `py-2`) |
| md | 16px | Horizontal panel padding (`px-4`) |
| lg | 24px | Section padding (`py-3 py-4`) |

Accordion header height: `h-8` (32px fixed) — matches all existing panels exactly.

---

## Typography

Identical to Phase 5:

| Role | Size | Weight |
|------|------|--------|
| Section label (accordion header) | `text-[12px]` | 400 |
| Data label (dt / uppercase) | `text-[11px]` | 400 |
| Data value | `text-[13px]` | 600 (`font-semibold`) |
| Body / description | `text-xs` (12px) | 400 |

---

## Color

| Role | Value | Usage in Phase 6 |
|------|-------|-----------------|
| Panel surface | `rgba(26,26,46,0.95)` | SidePanel background |
| Border | `rgba(255,255,255,0.08)` | All panel dividers |
| Muted text | `#6B7280` (`text-gray-500`) | Labels, empty states |
| Secondary text | `#9CA3AF` (`text-gray-400`) | Accordion header, section labels |
| Primary text | `#FFFFFF` (`text-white`) | Data values (semibold) |
| Accent | `#3B82F6` (`text-blue-400`, `bg-blue-500`) | Focus rings, IPCC bar fill |
| Semantic: success | `#22C55E` (`text-green-400`) | Optimistic scenario label |
| Semantic: warning | `#F59E0B` (`text-amber-400`) | Realistic scenario label |
| Semantic: danger | `#EF4444` (`text-red-400`) | Pessimistic scenario label |

**Scenario color semantics:** optimiste=green, réaliste=amber, pessimiste=red — communicates impact magnitude, consistent with existing risk color language.

---

## Component Specification: DashboardPanel

### Structure

DashboardPanel is an accordion panel inserted in SidePanel.tsx **in Section 6**, replacing the footer placeholder comment:

```
SidePanel
  └── Section 4: ElevationPanel (existing)
  └── Section 5: CalculationPanel (existing)
  └── Section 5b: EcologyPanel (existing)
  └── Section 6: DashboardPanel (NEW — Phase 6) ← replace footer placeholder
```

### Accordion Header

Exact class string (copy from CalculationPanel.tsx line 116–121):

```
w-full h-8 px-4 flex items-center gap-2 text-left
hover:bg-white/[0.04] transition-colors
focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
outline-none
```

Header label text: `"Dashboard Global"` — uppercase, `text-[12px] font-normal text-gray-400 tracking-wider`

Header icon: `<ChevronDown size={14} className="text-gray-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />`

Wrapper: `<div className="border-t border-white/[0.08]">`

### Auto-Open Behavior

```typescript
const [isOpen, setIsOpen] = useState(true)
useEffect(() => {
  if (canals.length > 0) setIsOpen(true)
}, [canals.length])
```

Opens when at least one canal exists (N≥1) — not per-canal selection, but aggregate.

### States

#### State 1 — No canals

```
h-10 px-4 flex items-center
  <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
    Ajoutez des canaux pour voir l'impact cumulé
  </p>
```

Condition: `canals.length === 0`

#### State 2 — Canals exist (N≥1), dashboard data available

Contains:

1. **ΔSL cumulé** (GLOB-01) — Interval [min, max] mm
2. **Scénarios** (GLOB-02) — 3 colonnes côte à côte
3. **Graphique IPCC** (GLOB-03) — `IpccComparisonChart` composant

**ΔSL cumulé:**

```
px-4 py-2 flex flex-col gap-[2px]
  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Impact cumulé</dt>
  <dd className="text-[13px] font-semibold text-white">
    {formatInterval(dashboardResult.cumulativeDeltaSLmm, 'mm')}  {/* [X – Y] mm */}
  </dd>
  <p className="text-[11px] text-gray-500 mt-1">
    {canals.length} canal{canals.length > 1 ? 'aux' : ''} · {N} avec profil chargé
  </p>
```

If some canals have no elevation profile loaded, show count annotation. If none have profiles:
```
  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
    <AlertCircle size={12} className="shrink-0" />
    Chargez les profils altimétriques pour calculer
  </p>
```

**Scénarios (3 colonnes):**

```
grid grid-cols-3 gap-1 px-4 py-2
```

Each scenario column:

```
flex flex-col items-center gap-[2px]
  <span className="text-[10px] {colorClass} uppercase tracking-wider">{label}</span>
  <span className="text-[12px] font-semibold text-white">{formatInterval(scenario.deltaSLmm, '', 2)}</span>
  <span className="text-[10px] text-gray-500">mm</span>
```

Scenario labels and colors:
- Optimiste: `text-green-400`, label `"Optimiste"` (100% rétention)
- Réaliste: `text-amber-400`, label `"Réaliste"` (60% rétention)
- Pessimiste: `text-red-400`, label `"Pessimiste"` (30% rétention)

Number format: `formatInterval(iv, '', 2)` (2 decimal places, no unit in the dd — unit shown separately).

Example: optimiste `[0.15 – 0.18]`, réaliste `[0.09 – 0.11]`, pessimiste `[0.05 – 0.06]`

**IPCC Comparison Chart:**

```
px-2 pb-3
  <IpccComparisonChart cumulativeDeltaSL={dashboardResult.scenarios.realistic.deltaSLmm} />
```

---

## Component Specification: IpccComparisonChart

### Purpose

BarChart showing cumulative canal ΔSL (réaliste scenario) vs IPCC 2100 projected sea-level rise range.

### Layout

```
ResponsiveContainer width="100%" height={140}
  BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
    XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }}
    YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit=" mm"
    Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}
    Bar dataKey="value" radius={[2,2,0,0]}
```

### Data

```typescript
const chartData = [
  { name: 'Canaux', value: midpoint(realisticDeltaSL) },  // midpoint pour la barre
  { name: 'IPCC 2100', value: midpoint(IPCC_2100_RANGE_MM) },  // midpoint [300,1000] = 650
]
```

Bar colors:
- "Canaux": `fill="#3B82F6"` (blue-500 — accent)
- "IPCC 2100": `fill="#374151"` (gray-700 — muted, not alarming)

IPCC bar label: `"IPCC 2100"` with an error range annotation showing min/max as a small text: `"300–1000 mm (RCP2.6–8.5)"` in tooltip.

### IPCC Constant

```typescript
/** Hausse IPCC AR6 2021 — RCP2.6 (300mm) à RCP8.5 (1000mm) */
export const IPCC_2100_RANGE_MM: Interval = [300, 1000]
```

This constant lives in `src/types/dashboard.ts`.

### Scientific Honesty Note

The chart deliberately shows the massive scale difference (canaux ≈ mm range vs IPCC = 300-1000mm). No logarithmic scale — linear Y axis shows the honest comparison. This is the core scientific message of the app.

---

## Number Formatting Contract

Reuse `formatInterval` from CalculationPanel.tsx (do not duplicate — same pattern as EcologyPanel):

```typescript
/** [X – Y] unité — em dash U+2013 obligatoire */
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}
```

For ΔSL cumulé: `decimals = 3` (same as CalculationPanel individual canal).
For scénarios: `decimals = 2` (slightly less precision, 3 colonnes côte à côte).

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Accordion header | `Dashboard Global` |
| Empty state | `Ajoutez des canaux pour voir l'impact cumulé` |
| ΔSL data label | `Impact cumulé` |
| Canal count annotation | `{N} canal(aux) · {M} avec profil chargé` |
| No profiles warning | `Chargez les profils altimétriques pour calculer` |
| Scenario: optimistic | `Optimiste` |
| Scenario: realistic | `Réaliste` |
| Scenario: pessimistic | `Pessimiste` |
| Chart X-axis labels | `Canaux` / `IPCC 2100` |
| Chart Y-axis unit | ` mm` (space before) |

---

## Accessibility Contract

- Accordion `<button>` must have `aria-expanded={isOpen}` — identical to all other panels
- Focus-visible ring: `focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900` on accordion button
- BarChart: add `aria-label="Comparaison impact canaux vs IPCC 2100"` on `BarChart` component
- AlertCircle icons in warning state are decorative — follow existing CalculationPanel pattern

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| recharts | BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer | Already installed — safe |
| shadcn official | none | not applicable |

No new library installs required.

---

## Implementation Checklist (for Executor)

- [ ] `src/types/dashboard.ts` — `DashboardScenario`, `DashboardResult`, `IPCC_2100_RANGE_MM`
- [ ] `src/lib/dashboardEngine.ts` — pure module, no React/Zustand imports
- [ ] `src/hooks/useDashboard.ts` — `useMemo` pattern, returns `DashboardResult | null`
- [ ] `src/components/IpccComparisonChart.tsx` — recharts BarChart, isolated component
- [ ] `src/components/DashboardPanel.tsx` — accordion, states 1 and 2 as specified
- [ ] `src/components/SidePanel.tsx` — replace footer placeholder with `<DashboardPanel />`
- [ ] `src/tests/dashboardEngine.test.ts` — unit tests for GLOB-01, GLOB-02, GLOB-03 constants

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

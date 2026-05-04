---
phase: 06-dashboard-global
plan: T03
subsystem: dashboard-ui
tags: [dashboard, recharts, hook, accordion, zustand]
dependency_graph:
  requires: [06-T02]
  provides: [useDashboard, IpccComparisonChart, DashboardPanel, SidePanel-Section6]
  affects: [SidePanel]
tech_stack:
  added: []
  patterns: [useMemo-aggregate-hook, recharts-barchart-cell-colors, accordion-2-states]
key_files:
  created:
    - src/hooks/useDashboard.ts
    - src/components/IpccComparisonChart.tsx
    - src/components/DashboardPanel.tsx
  modified:
    - src/components/SidePanel.tsx
decisions:
  - "NaN guard dans midpoint() — menace T-06-08 : si Interval contient NaN/Infinity, retourne 0 (barre invisible) plutôt que crash recharts"
  - "Tooltip formatter utilise entry.payload.name pour identifier la barre IPCC 2100 (recharts passe dataKey 'value' comme name, pas le label de la donnée)"
  - "Non-null assertion (!) supprimée sur dashboardResult dans DashboardPanel — TypeScript narrow via hasResult flag évite l'assertion"
metrics:
  duration: 7min
  completed: 2026-05-01
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 6 Plan T03: Dashboard UI — useDashboard + IpccComparisonChart + DashboardPanel Summary

**One-liner:** useDashboard hook (useMemo sur tous les canaux) + BarChart IPCC 2100 + DashboardPanel accordéon 2 états + intégration SidePanel Section 6.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hook useDashboard.ts + IpccComparisonChart.tsx | 340830f | src/hooks/useDashboard.ts, src/components/IpccComparisonChart.tsx |
| 2 | DashboardPanel.tsx + SidePanel intégration | 340830f | src/components/DashboardPanel.tsx, src/components/SidePanel.tsx |

## Verification

- `npx tsc --noEmit` : 0 erreur TypeScript (projet complet)
- `npm test` : 89 tests GREEN (8 suites — dashboardEngine + pas de régression)
- `grep "DashboardPanel" src/components/SidePanel.tsx` : 2 lignes (import + usage)
- `grep "Global stats placeholder Phase 6" src/components/SidePanel.tsx` : 0 lignes
- `grep "selectedCanalId" src/hooks/useDashboard.ts` : 0 lignes (hook lit TOUS les canaux)
- `grep "computeDashboardResult" src/hooks/useDashboard.ts` : 1 ligne
- `grep "aria-label" src/components/IpccComparisonChart.tsx` : 1 ligne
- `grep "aria-expanded" src/components/DashboardPanel.tsx` : 1 ligne

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security/Correctness] NaN guard dans midpoint()**
- **Found during:** Task 1 (analyse threat model T-06-08)
- **Issue:** Le plan mentionnait explicitement le guard `if (!isFinite → return 0)` dans la threat_model
- **Fix:** `midpoint()` vérifie `Number.isFinite(v)` avant de retourner — barre invisible plutôt que crash recharts si Interval = [NaN, NaN]
- **Files modified:** src/components/IpccComparisonChart.tsx

**2. [Rule 1 - Bug] Tooltip formatter — name vs payload.name**
- **Found during:** Task 1 (analyse recharts API)
- **Issue:** recharts passe `name = dataKey` ("value") dans le formatter, pas le label de l'entrée — comparaison `if (name === 'IPCC 2100')` aurait toujours été fausse
- **Fix:** Accès via `entry.payload.name` pour identifier la barre IPCC 2100 correctement
- **Files modified:** src/components/IpccComparisonChart.tsx

## Known Stubs

Aucun stub. Tous les états sont câblés sur des données réelles du store Zustand via useDashboard.

## Threat Flags

Aucune nouvelle surface réseau ou auth introduite. Toutes les données restent 100% client-side.

## Self-Check: PASSED

- src/hooks/useDashboard.ts : FOUND
- src/components/IpccComparisonChart.tsx : FOUND
- src/components/DashboardPanel.tsx : FOUND
- src/components/SidePanel.tsx (modifié) : FOUND
- Commit 340830f : FOUND

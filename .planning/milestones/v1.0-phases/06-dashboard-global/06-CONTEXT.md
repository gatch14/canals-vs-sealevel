# Phase 6: Dashboard Global - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Cette phase ajoute le dashboard global qui agrège l'impact de tous les canaux tracés et le compare aux projections climatiques IPCC 2100. Pour chaque session, l'app calcule en temps réel : le ΔSL cumulé (somme de tous les canaux), trois scénarios (optimiste/réaliste/pessimiste) selon le taux de rétention de l'eau, et un graphique de comparaison avec la hausse IPCC projetée à 2100. Tout 100% client-side — zéro API externe, constantes IPCC hardcodées avec référence AR6.

</domain>

<decisions>
## Implementation Decisions

### Layout du Dashboard Global
- Placement : accordéon dans Section 6 du SidePanel (après EcologyPanel), pattern identique aux panneaux précédents
- Visibilité : accordéon qui s'ouvre/ferme, auto-ouvert dès qu'un canal existe (N≥1)
- Graphique IPCC compact dans le panneau SidePanel (w-80 = 320px) via recharts BarChart
- Titre section : "Dashboard Global" / sous-titre affiché quand vide : "Ajoutez des canaux pour voir l'impact cumulé"

### Scénarios GLOB-02
- Trois scénarios basés sur le taux de rétention de l'eau (% qui atteint et reste en mer/bassin vs évaporation+absorption)
  - Optimiste : 100% rétention × ΔSL_brut (multiplicateur 1.0)
  - Réaliste : 60% rétention × ΔSL_brut (multiplicateur 0.6)
  - Pessimiste : 30% rétention × ΔSL_brut (multiplicateur 0.3)
- "Optimiste" = impact maximal sur la baisse du niveau de la mer (tout le volume compté)
- UX-01 strict : chaque scénario affiche un Interval [min, max] (multiplication des bornes)
- Affichage : 3 colonnes côte à côte dans le panneau

### Graphique IPCC GLOB-03
- Type : BarChart recharts (déjà installé) — barres simples
- Comparaison : ΔSL cumulé scénario réaliste (Interval midpoint pour la barre) vs plage IPCC 2100
- Projection IPCC 2100 : Interval [300, 1000] mm — RCP2.6 à RCP8.5 — UX-01 strict
- Axe Y en mm absolus — montre l'ordre de grandeur réel (ex. canaux ≈ quelques mm vs IPCC = 300-1000mm)
- Constante IPCC_2100_RANGE_MM: [300, 1000] hardcodée + commentaire référence IPCC AR6 2021

### Architecture Code
- Nouveau module pur : `src/lib/dashboardEngine.ts` — pattern calculationEngine.ts, pas de React/Zustand/MapLibre
  - Fonctions : `computeCumulativeDeltaSL`, `computeScenarios`, `computeDashboardResult`
  - Types : `DashboardScenario`, `DashboardResult` dans `src/types/dashboard.ts`
- Nouveau hook : `src/hooks/useDashboard.ts` — useMemo pattern (même que useCalculation/useEcology)
  - Lit tous les canaux depuis useCanalStore, leurs calcParams et résultats calculés à la volée
- Nouveaux composants :
  - `src/components/DashboardPanel.tsx` — accordéon principal, tableau 3 scénarios
  - `src/components/IpccComparisonChart.tsx` — BarChart recharts isolé
- Pas d'extension du store Zustand — calculs à la volée uniquement
- SidePanel.tsx : ajouter `<DashboardPanel />` en Section 6 (remplace le footer placeholder)
- Tests unitaires : `src/tests/dashboardEngine.test.ts` — GLOB-01, GLOB-02, GLOB-03

### Claude's Discretion
- Style exact du BarChart (couleurs, légende, tooltip) — cohérence avec le dark theme du projet
- Gestion du cas où aucun canal n'a de profil d'élévation chargé (ΔSL = 0 par défaut)
- Format exact des labels de scénario (icônes, couleurs : vert/amber/rouge ?)
- Arrondi des valeurs ΔSL cumulées pour lisibilité (ex. 0.001 mm → "< 0.01 mm")

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CalculationPanel.tsx` / `EcologyPanel.tsx` — pattern accordéon exact à copier pour `DashboardPanel.tsx`
- `useCalculation.ts` / `useEcology.ts` — pattern useMemo à copier pour `useDashboard.ts`
- `calculationEngine.ts` / `ecologyEngine.ts` — pattern module pur pour `dashboardEngine.ts`
- `ElevationChart.tsx` — pattern recharts existant (ResponsiveContainer + composants recharts)
- `recharts` déjà installé — BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer disponibles
- `@turf/turf` déjà installé (non nécessaire pour Phase 6 — calculs purement arithmétiques)
- `Interval` type dans `src/types/calculation.ts` — réutiliser tel quel

### Established Patterns
- Module pur testable sans DOM (calculationEngine.ts, ecologyEngine.ts)
- Hook useMemo avec dépendances du store (useCalculation.ts, useEcology.ts)
- Accordéon avec `isOpen` state local + `setIsOpen` + auto-ouverture conditionnelle
- UX-01 absolu : Interval [min, max] pour toutes les valeurs numériques
- Dark theme Tailwind : bg-gray-800/50, text-gray-300, border-white/[0.08], text-blue-400
- `formatInterval` ou équivalent pour affichage "[X – Y] unité" (em dash U+2013)
- Section footer du SidePanel a déjà un placeholder commenté "Global stats placeholder Phase 6"

### Integration Points
- `canalStore.ts` : `canals` array + `calcParams` — les 2 inputs pour dashboardEngine
- `calculationEngine.ts` : réutiliser `calculateCanal()` ou `computeResult()` depuis dashboardEngine pour calculer le ΔSL de chaque canal
- `SidePanel.tsx` ligne 108 : `{/* Section 6 — Footer (réservé Phase 6) */}` → remplacer le placeholder par `<DashboardPanel />`
- `src/types/calculation.ts` : importer `Interval`, `IPCC_ANNUAL_RATE_MM`, `CalculationResult`

</code_context>

<specifics>
## Specific Ideas

- La comparaison IPCC doit montrer clairement l'ordre de grandeur : même avec des dizaines de canaux, on reste probablement à quelques mm vs 300-1000mm — l'honnêteté scientifique prime (pas de mise à l'échelle trompeuse)
- Le scénario "réaliste" (60%) est celui affiché en premier / mis en avant — c'est l'estimation centrale
- Les scénarios ont besoin du ΔSL brut de chaque canal (calculé via calculationEngine depuis les points + calcParams) — ne pas réutiliser un ΔSL déjà stocké, recalculer à la volée depuis les données du store

</specifics>

<deferred>
## Deferred Ideas

- Timeline 2025-2100 avec courbe d'évolution (trop complexe pour v1, graphique simple suffit) → v2
- Export PDF / partage de scénarios → v2 requirements
- Calcul d'impact géographique (quelles régions côtières protégées) → v2
- Pondération par densité de population côtière → v2

</deferred>

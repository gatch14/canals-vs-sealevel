# Phase 13: Dashboard ROI - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Exposer en UI toute la chaîne de valeur économique calculée par les hooks `useCircular` (Phase 11) et `useROI` (Phase 12). Un composant `EconomicPanel.tsx` ajouté après `DashboardPanel` dans le SidePanel — accordéon "Économie & ROI" avec : indicateurs clés (break-even + coût total) en tête, co-produits détaillés, projections ROI, et tableau comparatif multi-canaux. Couvre les requirements CIRC-01, CIRC-02, CIRC-03, CIRC-04, VIE-01, VIE-02, ROI-01, ROI-02, ROI-03, ROI-04 côté UI.

</domain>

<decisions>
## Implementation Decisions

### Structure du panneau Économie & ROI
- Un seul accordéon "Économie & ROI" — cohérent avec le pattern DashboardPanel (un panel = un sujet)
- Ordre d'affichage : break-even + coût total **en tête** (indicateurs synthétiques), puis chaîne de valeur détaillée en bas — pattern "résumé → détails"
- Projections ROI 25/50/100 ans : 3 lignes texte `[X – Y] M€` — un chart recharts est une surcharge pour seulement 3 points de données
- Activation : données réelles si `canal.elevation` est chargé (même guard que `useROI`) ; placeholder si elevation null

### Tableau comparatif ROI-04
- Emplacement : dans le panneau ROI, sous-section collapsible en bas
- Colonnes : Nom + Break-even + Coût total + Valeur/an (4 colonnes — lisible en w-80 = 320px)
- Break-even Infinity (canaux sans dessalement) : afficher `"—"` (tiret neutre — UX honnête sans alarmer)
- Visibilité : accordéon replié par défaut "Comparer (N canaux)" — évite l'encombrement quand 1 seul canal

### Position et nommage dans SidePanel
- Position : après DashboardPanel (section la plus basse) — ordre logique : tracé → élévation → calculs → écologie → dashboard → économie
- Titre accordéon : `"Économie & ROI"` — couvre la chaîne de valeur complète + la rentabilité
- Composant : `EconomicPanel.tsx` dans `src/components/` — générique, couvre circular + ROI

### Claude's Discretion
- Format exact des valeurs M€ : utiliser `toFixed(1)` pour M€ (ex. `[125.3 – 450.7] M€`)
- Icônes Lucide pour les catégories de co-produits (Leaf pour spiruline, Fish pour aquaculture, etc.)
- Gestion de l'état "dessalement désactivé" : afficher le ROI partiel (basé sur coût construction uniquement, sans co-produits)
- useROI + useCircular appelés dans EconomicPanel — pas de re-création de hooks dans SidePanel

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useROI.ts` — hook Phase 12, retourne `RoiResult | null` (totalAnnualValueMEur, totalCostMEur, breakEvenYears, roi25, roi50, roi100)
- `useCircular.ts` — hook Phase 11, retourne `CircularResult | null` (spirulineTonnes, spirulineValue, aquacultureTonnes, aquacultureValue, mgTonnes, kTonnes, caTonnes, mineralsValue, arableLandKm2, lifespanYears, habitabilityYears)
- `roiEngine.ts` — exporte `calcAllCanalsRoi(canals, calcParams, desertFeatures): RoiSummary[]` pour le tableau comparatif
- `DashboardPanel.tsx` — template exact (accordéon, useState isOpen, useEffect auto-open, formatInterval helper)
- `formatInterval(iv, unit, decimals)` — helper dans DashboardPanel.tsx à copier/extraire
- `IpccComparisonChart.tsx` — exemple recharts dans le sidebar

### Established Patterns
- Accordéon : `ChevronDown` Lucide, `rotate-180` sur isOpen, border-t border-white/[0.08]
- Dark theme : fond rgba(26,26,46,0.95), texte gray-400/gray-300, valeurs text-white
- Tailles de texte : labels `text-[11px]` uppercase tracking-wider, valeurs `text-xs`
- UX-01 strict : **toutes** les valeurs numériques en intervalles [min, max] — jamais de valeur ponctuelle

### Integration Points
- `SidePanel.tsx` : importer `EconomicPanel` et l'ajouter après `<DashboardPanel />`
- `useElevation`, `useRoutingWorker`, `usePersistence` déjà dans SidePanel — ne pas les dupliquer
- `calcAllCanalsRoi` : importer depuis `roiEngine.ts`, passer `useCanalStore canals`, `calcParams`, `desertFeatures`
- Store : lire `canals`, `selectedCanalId`, `calcParams`, `desalinationEnabled` depuis `useCanalStore`

</code_context>

<specifics>
## Specific Ideas

- `RoiResult.totalCostMEur` affiché comme "Investissement total" — champ exposé explicitement par la Phase 12 pour ce cas d'usage
- Le tableau comparatif ROI-04 doit être trié par `breakEvenYears[0]` croissant (Infinity en dernier) — `calcAllCanalsRoi` déjà trié
- Toutes les valeurs M€ formatées avec 1 décimale, €/an formatées avec 0 décimale, km² avec 0-1 décimale
- Le panneau s'ouvre automatiquement (useEffect) quand un canal avec élévation est sélectionné

</specifics>

<deferred>
## Deferred Ideas

- Graphique recharts de la courbe ROI cumulée dans le temps (coût vs revenus) — complexe pour peu de valeur ajoutée en v3
- Export PDF du rapport économique — déféré v4
- Tooltip au survol des colonnes du tableau comparatif avec détail ROI@25/50/100 — déféré v4

</deferred>

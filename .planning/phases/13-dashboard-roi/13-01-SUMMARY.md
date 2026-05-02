---
phase: 13-dashboard-roi
plan: "01"
subsystem: ui
tags: [react, tailwind, lucide-react, accordion, roi, circular-economy]

requires:
  - phase: 12-roi-break-even
    provides: useROI hook (RoiResult | null), roiEngine.calcAllCanalsRoi, RoiSummary type
  - phase: 11-moteur-economique-circulaire
    provides: useCircular hook (CircularResult | null), CircularResult type

provides:
  - EconomicPanel.tsx — accordéon "Économie & ROI" avec 4 états et tableau comparatif multi-canaux
  - EconomicPanel intégré dans SidePanel.tsx à la position finale (section 7)

affects: [SidePanel, dashboard, roi, circular-economy]

tech-stack:
  added: []
  patterns:
    - "Pattern 4-states accordion : noCanal / noProfile / noDesal / hasData — identique à EcologyPanel"
    - "useMemo pour calcAllCanalsRoi avec dépendances [canals, calcParams] — évite recalcul à chaque rendu (T-13-02)"
    - "formatBreakEven : Infinity → tiret cadratin — convention UX honnête du projet"

key-files:
  created:
    - src/components/EconomicPanel.tsx
  modified:
    - src/components/SidePanel.tsx

key-decisions:
  - "Utiliser summary.canalName (pas summary.name) — champ réel du type RoiSummary tel que défini en Phase 12"
  - "État D conditionné sur hasData && desalinationEnabled — cohérent avec circularResult qui retourne null sans dessalement"
  - "Sous-accordéon comparatif placé dans l'état D uniquement — logique : comparer N canaux n'a de sens que si le canal courant a des données"
  - "gap-1 (4px) pour tous les dt/dd — conforme UI-SPEC, pas le gap-[2px] hérité des panels existants"

patterns-established:
  - "Accordéon Phase 13 : même structure header h-8 + ChevronDown size=14 + border-white/[0.08] que tous les panels"
  - "Séparateurs internes border-white/[0.06] entre sections KPI / co-produits / projections / comparaison"

requirements-completed:
  - CIRC-01
  - CIRC-02
  - CIRC-03
  - CIRC-04
  - VIE-01
  - VIE-02
  - ROI-01
  - ROI-02
  - ROI-03
  - ROI-04

duration: 18min
completed: 2026-05-02
---

# Phase 13 Plan 01: Dashboard ROI Summary

**EconomicPanel.tsx — accordéon "Économie & ROI" 4 états exposant la chaîne de valeur complète (KPI break-even, 6 co-produits circulaires, ROI@25/50/100 ans, tableau comparatif multi-canaux)**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-02T19:00:00Z
- **Completed:** 2026-05-02T19:18:00Z
- **Tasks:** 1/1
- **Files modified:** 2

## Accomplishments

- EconomicPanel.tsx créé (300 lignes) avec export nommé, 4 états exclusifs, consommation de 3 sources de données
- 6 co-produits affichés avec icônes Lucide (spiruline, aquaculture, minéraux, surface agricole, durée de vie, habitabilité)
- Tableau comparatif ROI-04 sous-accordéon replié par défaut, trié par breakEvenYears[0], aria-current sur ligne sélectionnée
- npx tsc --noEmit exit 0, 223 tests GREEN (aucune régression)

## Task Commits

1. **Task 1: Créer EconomicPanel.tsx** - `c95efa3` (feat)

**Plan metadata:** (à venir — commit docs ci-dessous)

## Files Created/Modified

- `src/components/EconomicPanel.tsx` - Accordéon Économie & ROI — 4 états, KPI, 6 co-produits, ROI@25/50/100, tableau comparatif
- `src/components/SidePanel.tsx` - Import + intégration EconomicPanel après CandidatesPanel (position finale)

## Decisions Made

- `summary.canalName` utilisé (pas `summary.name`) — le type `RoiSummary` de Phase 12 expose `canalName`, le plan était incorrect sur ce point
- État D conditionné sur `hasData && desalinationEnabled` — l'état "données complètes" nécessite que le dessalement soit activé pour que les co-produits aient du sens
- `gap-1` (4px) pour tous les dt/dd — UI-SPEC note explicitement de ne pas copier le `gap-[2px]` des panels existants

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Champ canalName au lieu de name dans RoiSummary**
- **Found during:** Task 1 (lecture de src/types/roi.ts)
- **Issue:** Le plan indiquait `summary.name` dans le tableau comparatif, mais le type `RoiSummary` défini en Phase 12 expose `canalName` (pas `name`)
- **Fix:** Utilisation de `summary.canalName` dans le template JSX de la table
- **Files modified:** src/components/EconomicPanel.tsx
- **Verification:** npx tsc --noEmit retourne 0 erreur — TypeScript valide le champ
- **Committed in:** c95efa3

---

**Total deviations:** 1 auto-fixé (Rule 1 - bug champ inexistant)
**Impact on plan:** Fix nécessaire pour la compilation TypeScript. Aucun impact sur le comportement métier.

## Issues Encountered

Aucun problème bloquant. La seule déviation était le nom de champ incorrect dans le plan (canalName vs name).

## User Setup Required

Aucun — composant 100% client-side, aucune configuration externe requise.

## Threat Surface Scan

Aucune nouvelle surface réseau, endpoint, ou chemin d'authentification introduit. EconomicPanel est un composant lecture seule qui consomme des données 100% locales depuis le store Zustand. Conforme au registre T-13-01 (accept) et T-13-02 (mitigate via useMemo).

## Known Stubs

Aucun — toutes les valeurs affichées proviennent directement de useROI() et useCircular(), elles sont calculées depuis les données réelles du canal sélectionné. Aucune valeur codée en dur ou placeholder.

## Next Phase Readiness

Phase 13 Plan 01 est le seul plan de la Phase 13. La Phase 13 est complète. Milestone v3.0 (Économie Circulaire & ROI) est achevé — toutes les phases 11, 12, 13 sont complètes.

---
*Phase: 13-dashboard-roi*
*Completed: 2026-05-02*

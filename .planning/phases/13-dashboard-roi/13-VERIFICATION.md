---
phase: 13-dashboard-roi
verified: 2026-05-02T19:30:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Ouvrir l'app et sélectionner un canal avec profil altimétrique + dessalement activé — vérifier l'affichage des 6 co-produits et des projections ROI@25/50/100 dans le panneau Économie & ROI"
    expected: "6 co-produits (spiruline, aquaculture, minéraux, surface agricole, durée de vie, habitabilité) visibles en intervalles [min – max] avec icônes Lucide. Projections ROI à 25, 50 et 100 ans en M€ intervalles. KPI break-even et investissement total en tête du panneau."
    why_human: "Rendu visuel React et flux de données réels depuis le store Zustand — non vérifiable par grep ou TypeScript seul."
  - test: "Sélectionner un canal avec profil altimétrique + dessalement DÉSACTIVÉ — vérifier l'état C du panneau"
    expected: "Seuls les KPI break-even et investissement total sont affichés. Une bannière amber 'Activez les nœuds de dessalement pour les co-produits' est visible. Pas de section co-produits."
    why_human: "Comportement conditionnel sur desalinationEnabled — nécessite interaction utilisateur dans l'interface réelle."
  - test: "Ouvrir le sous-accordéon 'Comparer (N canaux)' avec plusieurs canaux chargés — vérifier le tableau comparatif"
    expected: "Tableau avec colonnes Nom / Seuil / Coût / Valeur/an. Lignes triées par break-even croissant. Canaux sans dessalement affichent '—' dans la colonne Seuil. Canal sélectionné en surbrillance (bg-white/[0.04])."
    why_human: "Comportement tri et mise en évidence de la ligne sélectionnée — non testable sans données réelles dans le store."
---

# Phase 13: Dashboard ROI — Rapport de Vérification

**Phase Goal:** L'utilisateur peut visualiser la chaîne de valeur économique complète d'un canal et évaluer sa rentabilité directement depuis le panneau latéral.
**Verified:** 2026-05-02T19:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | L'utilisateur voit le break-even et le coût total (KPI) en tête du panneau pour le canal sélectionné | VERIFIED | `EconomicPanel.tsx` lignes 139-147 (état D) et 117-124 (état C) — `formatBreakEven(roiResult.breakEvenYears)` + `formatInterval(roiResult.totalCostMEur, 'M€', 1)` rendus dans `<dl>` en tête |
| 2 | L'utilisateur voit les 6 co-produits (spiruline, aquaculture, minéraux, surface agricole, durée de vie, timeline habitabilité) avec leurs valeurs en intervalles | VERIFIED | Lignes 154-213 — 6 blocs `<dt>/<dd>` complets avec icônes Lucide (Leaf/Fish/Beaker/Wheat/Clock/Home) et `formatInterval()` sur `circularResult.spirulineValue`, `.aquacultureValue`, `.mineralsValue`, `.arableLandKm2`, `.lifespanYears`, `.habitabilityYears` |
| 3 | L'utilisateur voit les projections ROI à 25, 50 et 100 ans en M€ intervalles | VERIFIED | Lignes 218-236 — `formatInterval(roiResult.roi25, 'M€', 1)` / `roi50` / `roi100` dans section dédiée avec header TrendingUp |
| 4 | L'utilisateur voit un tableau comparatif de tous ses canaux (sous-accordéon replié par défaut) trié par break-even croissant | VERIFIED | Lignes 240-293 — `useState(false)` pour `isCompareOpen`, `roiSummaries` calculé via `calcAllCanalsRoi` (déjà trié), `summary.canalName` correct (déviation du plan corrigée automatiquement) |
| 5 | Quand aucun canal n'est sélectionné, un message placeholder est affiché | VERIFIED | Lignes 95-101 — état A `noCanal` : `<p>Sélectionnez un canal pour voir l'analyse économique</p>` |
| 6 | Quand le profil altimétrique n'est pas chargé, une alerte amber est affichée | VERIFIED | Lignes 104-111 — état B `!noCanal && noProfile` : `<AlertCircle>` amber + message |
| 7 | Quand le dessalement est désactivé, une bannière amber indique que les co-produits ne sont pas disponibles | VERIFIED | Lignes 114-132 — état C `noDesal && roiResult` : KPI partiels + bannière amber "Activez les nœuds de dessalement pour les co-produits" |
| 8 | Le panneau s'ouvre automatiquement quand un canal avec élévation est sélectionné | VERIFIED | Lignes 52-55 — `useEffect(() => { if (selectedCanalId && selectedCanal?.elevation) setIsOpen(true) }, [selectedCanalId])` |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/EconomicPanel.tsx` | Accordéon Économie & ROI — 4 états, co-produits, ROI, tableau comparatif | VERIFIED | 300 lignes, export nommé `EconomicPanel`, 4 états exclusifs A/B/C/D |
| `src/components/SidePanel.tsx` | Import + JSX EconomicPanel à la position finale | VERIFIED | Ligne 10 : import nommé. Ligne 123 : `<EconomicPanel />` après `<CandidatesPanel />`, avant div `ClearDataButton` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `EconomicPanel.tsx` | `src/hooks/useROI.ts` | `useROI()` hook call | WIRED | Ligne 8 import + ligne 46 appel. `roiResult` rendu dans KPI lignes 119, 123, 142, 146, 226, 230, 234 |
| `EconomicPanel.tsx` | `src/hooks/useCircular.ts` | `useCircular()` hook call | WIRED | Ligne 9 import + ligne 47 appel. `circularResult` utilisé lignes 152-213 |
| `EconomicPanel.tsx` | `src/lib/roiEngine.ts` | `calcAllCanalsRoi` useMemo | WIRED | Ligne 10 import + lignes 61-64 useMemo. `roiSummaries` rendu dans tableau lignes 269-289 |
| `SidePanel.tsx` | `EconomicPanel.tsx` | import nommé + JSX element | WIRED | Ligne 10 : `import { EconomicPanel } from './EconomicPanel'`. Ligne 123 : `<EconomicPanel />` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `EconomicPanel.tsx` | `roiResult` | `useROI()` → `computeRoiAnalysis()` | Oui — calcule depuis `canal.elevation`, `calcParams`, via `computeCalculation`, `computeDesalinationAnalysis`, `computeCircularAnalysis` | FLOWING |
| `EconomicPanel.tsx` | `circularResult` | `useCircular()` → `computeCircularAnalysis()` | Oui — calcule depuis `canal.points`, `desalinationEnabled`, via `computeDesalinationAnalysis` | FLOWING |
| `EconomicPanel.tsx` | `roiSummaries` | `calcAllCanalsRoi(canals, calcParams, DESERT_FEATURES)` | Oui — itère tous les canaux avec élévation chargée, retourne tableau RoiSummary trié | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compile sans erreur | `npx tsc --noEmit` | exit code 0, aucune sortie d'erreur | PASS |
| 223 tests existants GREEN | `npm test -- --run` | 14 suites, 223 tests passed, 0 failed | PASS |
| EconomicPanel exporte la fonction nommée | `grep -c "export function EconomicPanel"` | 1 | PASS |
| 2 boutons aria-expanded (accordéon principal + sous-accordéon) | `grep -c "aria-expanded"` | 2 | PASS |
| 4 colonnes `scope="col"` dans le tableau | `grep -c 'scope="col"'` | 4 | PASS |
| Pas de `gap-[2px]` dans le code actif | `grep -c "gap-\[2px\]"` | 0 | PASS |
| Infinity guard en place | `grep -n "Infinity"` | 3 occurrences dont la guard ligne 34 et rendu tableau ligne 279 | PASS |
| `summary.canalName` (pas `summary.name`) | `grep -c "canalName"` | 1 — conforme au type RoiSummary réel Phase 12 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CIRC-01 | 13-01, 13-02 | Production spiruline (tonnes/an + €/an) depuis bassin salin | SATISFIED | `circularResult.spirulineValue` rendu ligne 160 avec icône Leaf |
| CIRC-02 | 13-01, 13-02 | Production aquaculture marine (tonnes protéines/an + €/an) | SATISFIED | `circularResult.aquacultureValue` rendu ligne 170 avec icône Fish |
| CIRC-03 | 13-01, 13-02 | Engrais agricoles (Mg/K/Ca tonnes/an + €/an) extraits de la saumure | SATISFIED | `circularResult.mineralsValue` rendu ligne 180 — valeur économique totale minéraux |
| CIRC-04 | 13-01, 13-02 | Surface agricole potentielle (km²) grâce à l'eau douce | SATISFIED | `circularResult.arableLandKm2` rendu ligne 190 avec icône Wheat |
| VIE-01 | 13-01, 13-02 | Durée de vie estimée du canal (années) | SATISFIED | `circularResult.lifespanYears` rendu ligne 200 avec icône Clock |
| VIE-02 | 13-01, 13-02 | Timeline habitabilité (années) | SATISFIED | `circularResult.habitabilityYears` rendu ligne 210 avec icône Home |
| ROI-01 | 13-01, 13-02 | Valeur économique totale annuelle (€/an) — somme co-produits | SATISFIED | `roiResult.totalAnnualValueMEur` visible dans `roiSummaries` tableau comparatif colonne "Valeur/an" |
| ROI-02 | 13-01, 13-02 | ROI global — investissement total vs revenus cumulés projetés 25/50/100 ans | SATISFIED | `roiResult.roi25/roi50/roi100` rendus lignes 226-234 en M€ intervalles |
| ROI-03 | 13-01, 13-02 | Break-even — années pour rembourser le coût de construction | SATISFIED | `roiResult.breakEvenYears` rendu via `formatBreakEven()` — Infinity → "—" |
| ROI-04 | 13-01, 13-02 | Tableau comparatif ROI de plusieurs canaux | SATISFIED | Sous-accordéon "Comparer (N canaux)" avec `roiSummaries` tri break-even croissant, aria-current sur canal sélectionné |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| Aucun | — | — | — | — |

Aucun `TODO`, `FIXME`, `placeholder`, `return null` non-gardé, ni valeur codée en dur détecté dans `EconomicPanel.tsx`. Tous les `useState([])` sont des initialiseurs d'état légitimes remplacés par des valeurs calculées via hooks.

### Human Verification Required

**3 vérifications visuelles/comportementales nécessitent un test humain dans le navigateur.**

#### 1. Affichage état D complet (dessalement activé)

**Test:** Tracer un canal, charger le profil altimétrique, activer "nœuds de dessalement solaire" dans le panneau Calcul, puis ouvrir l'accordéon "Économie & ROI".
**Expected:** 6 co-produits avec icônes et valeurs en intervalles `[min – max]`, 3 projections ROI en M€, KPI break-even et investissement total en tête du panneau.
**Why human:** Rendu visuel React et flux de données réels depuis le store Zustand — non vérifiable par grep ou TypeScript seul.

#### 2. Comportement état C (dessalement désactivé)

**Test:** Canal avec profil chargé, dessalement DÉSACTIVÉ. Ouvrir le panneau Économie & ROI.
**Expected:** Seuls les KPI break-even et investissement total visibles. Bannière amber "Activez les nœuds de dessalement pour les co-produits". Pas de section co-produits ni de projections ROI détaillées.
**Why human:** Comportement conditionnel sur `desalinationEnabled` — nécessite interaction utilisateur dans l'interface réelle.

#### 3. Tableau comparatif multi-canaux (ROI-04)

**Test:** Charger plusieurs canaux candidats depuis le panneau "Candidats mondiaux". Ouvrir le sous-accordéon "Comparer (N canaux)".
**Expected:** Tableau avec 4 colonnes (Nom / Seuil / Coût / Valeur/an). Lignes triées par break-even croissant. Canaux sans dessalement affichent "—" dans Seuil. Canal actuellement sélectionné en surbrillance légère.
**Why human:** Comportement tri et mise en évidence — non testable sans données réelles multi-canaux dans le store.

---

### Gaps Summary

Aucun gap bloquant. Tous les must-haves sont VERIFIED par analyse statique du code. Les 3 items en `human_needed` sont des vérifications comportementales visuelles normales pour un composant UI React — ils ne représentent pas des lacunes d'implémentation détectables.

**Note sur la déviation de plan :** Le plan 13-01 documentait `summary.name` mais le type `RoiSummary` de Phase 12 expose `canalName`. L'exécuteur a corrigé automatiquement en utilisant `summary.canalName` (ligne 276). TypeScript valide le champ — correction conforme.

---

_Verified: 2026-05-02T19:30:00Z_
_Verifier: Claude (gsd-verifier)_

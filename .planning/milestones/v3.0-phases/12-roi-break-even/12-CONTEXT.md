# Phase 12: ROI & Break-even - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Calculer la rentabilité complète d'un canal : valeur économique totale annuelle (somme des 5 co-produits), ROI cumulé à 25/50/100 ans, break-even en années, tableau comparatif multi-canaux. Module pur `roiEngine.ts` dans `src/lib/`, types dans `src/types/roi.ts`, hook `useROI.ts`. Couvre ROI-01, ROI-02, ROI-03, ROI-04.

</domain>

<decisions>
## Implementation Decisions

### Architecture du moteur ROI
- Module `roiEngine.ts` dans `src/lib/` — même pattern que `circularEngine.ts`, `desalinationEngine.ts`
- Types dans `src/types/roi.ts` — `RoiParams`, `RoiResult`, `RoiSummary`
- Hook React `useROI.ts` dans `src/hooks/` — copie exacte du pattern `useCircular.ts`
- Unité canonique interne : **M€** (millions d'euros) pour tous les calculs ROI
- `DesalinationResult` et `CircularResult` recalculés en interne dans `useROI.ts` (Pitfall P1 — pas de hook-in-hook)
- `canal.elevation` lu depuis le store (champ optionnel de `Canal`) — guard obligatoire si undefined

### ROI-01 : Valeur annuelle totale (5 co-produits sans double comptage)
1. **Eau douce** : `waterProduction [m³/j] × 365 × [0.5, 2.0] €/m³` → M€/an
2. **Sel (NaCl)** : `DesalinationResult.saltValue [€/an]` / 1_000_000 → M€/an
3. **Spiruline** : `CircularResult.spirulineValue [€/an]` / 1_000_000 → M€/an
4. **Aquaculture** : `CircularResult.aquacultureValue [€/an]` / 1_000_000 → M€/an
5. **Minéraux (Mg/K/Ca)** : `CircularResult.mineralsValue [€/an]` / 1_000_000 → M€/an

Constantes prix eau : `WATER_PRICE_MIN = 0.5` et `WATER_PRICE_MAX = 2.0` €/m³ (fourchette zone aride — [ASSUMED])

### ROI-02 : ROI cumulé % à N années
Formule standard analyse coût-bénéfice infrastructure :
```
roi_min = (annualValue.min × N - totalCost.max) / totalCost.max × 100
roi_max = (annualValue.max × N - totalCost.min) / totalCost.min × 100
```
Valeurs négatives avant break-even = comportement intentionnel (indicateur visuel).
3 horizons locked : 25, 50, 100 ans (requirements fixés — ne pas plafonner à lifespanYears).

### ROI-03 : Break-even en années
Inversion min/max obligatoire pour division d'intervalles positifs :
```
breakEven.min = totalCost.min / annualValue.max  (optimiste)
breakEven.max = totalCost.max / annualValue.min  (pessimiste)
```
Guard division par zéro : retourner `[Infinity, Infinity]` si `annualValue.min <= 0`.

### ROI-04 : Tableau comparatif multi-canaux
- Tous les canaux inclus (avec ou sans dessalement)
- Canaux sans profil d'élévation (`canal.elevation = undefined`) : **omis** du tableau
- Canaux sans dessalement → `annualValue = [0, 0]` → `breakEvenYears = [Infinity, Infinity]`
- Tri par `breakEvenYears[0]` croissant (Infinity naturellement en dernier)
- Fonction `calcAllCanalsRoi(canals, calcParams, desertFeatures)` exportée depuis roiEngine

### Normalisation unités (critique — Pitfall P1)
- `CalculationResult.costMEur` : déjà en **M€**
- `DesalinationResult.desalinationCost` : en **€** → diviser par 1_000_000 avant addition
- Valeurs circulaires (`spirulineValue`, `aquacultureValue`, `mineralsValue`) : en **€/an** → diviser par 1_000_000
- Toutes les valeurs ROI retournées en M€ (M€/an pour annualValue, M€ pour cost, % pour ROI, ans pour break-even)

### Structure des plans
- T01 : types `RoiParams`, `RoiResult`, `RoiSummary` + stubs `roiEngine.ts` + tests RED (Wave 0)
- T02 : implémentation complète `roiEngine.ts` — tests GREEN (Wave 1)
- T03 : `useROI.ts` hook — connexion store (Wave 2)

### Claude's Discretion
- Prix eau dessalée : [0.5, 2.0] €/m³ (fourchette raisonnée zone aride)
- Arrondi calcBreakEven : pas d'arrondi dans le moteur (l'UI Phase 13 formate)
- `calcAllCanalsRoi` reçoit `desertFeatures: FeatureCollection` pour pouvoir appeler les engines amont

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `circularEngine.ts` — modèle direct (fonctions pures + orchestrateur)
- `useCircular.ts` — template EXACT pour `useROI.ts`
- `src/types/calculation.ts` — `Interval` type + `addIntervals` exporté
- `calculationEngine.ts` — `computeCalculation(canal, profile, width, depth): CalculationResult | null`
- `desalinationEngine.ts` — `computeDesalinationAnalysis + calcSolarFactor`
- `circularEngine.ts` — `computeCircularAnalysis(params, desertFeatures)`

### Critical Verification (from research)
- `CalculationResult.costMEur` : **M€** (COST_PER_KM = [1, 5] M€/km confirmé)
- `DesalinationResult.desalinationCost` : **€** (nodes × [50_000_000, 150_000_000] confirmé)
- `Canal.elevation?: ElevationProfile` : champ optionnel, accessible depuis le store
- Store Zustand : aucun résultat pré-calculé (seulement `desalinationEnabled: boolean`)

### Integration Points
- `useROI.ts` : lit `desalinationEnabled`, `canals`, `selectedCanalId`, `calcParams` depuis `canalStore`
- `useROI.ts` : recalcule `DesalinationResult` + `CircularResult` en interne (comme `useCircular`)
- Pas d'UI en Phase 12 — hook prêt pour Phase 13 (Dashboard ROI)
- ROI-04 (`calcAllCanalsRoi`) : function moteur pur, appelée aussi par Phase 13

</code_context>

<specifics>
## Specific Ideas

- Toutes les valeurs ROI en M€ — l'ordre de grandeur rend les chiffres lisibles (ex. 500 M€ de construction)
- `RoiResult.totalCostMEur` exposé pour que la Phase 13 puisse afficher "Investissement total"
- `RoiResult.totalAnnualValueMEur` exposé pour afficher la valeur annuelle séparément du ROI%
- Le moteur ne plafonne pas les valeurs à `lifespanYears` — l'UI Phase 13 gère ce contexte

</specifics>

<deferred>
## Deferred Ideas

- Calcul de VAN (Valeur Actuelle Nette) avec taux d'actualisation — déféré v4
- Analyse de sensibilité (prix eau, prix sel) — déféré v4
- ROI par phase de construction (financement progressif) — déféré v4

</deferred>

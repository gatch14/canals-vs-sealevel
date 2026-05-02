# Phase 12: ROI & Break-even - Research

**Researched:** 2026-05-02
**Domain:** Agrégation économique — valeur annuelle, ROI cumulé, break-even, comparaison multi-canaux
**Confidence:** HIGH (toutes les données proviennent du codebase vérifié en session ; aucune API externe)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROI-01 | Valeur économique totale annuelle (€/an) — somme de tous les co-produits | Champs disponibles : `saltValue`, `waterProduction` (→ valeur eau), `spirulineValue`, `aquacultureValue`, `mineralsValue`. Tous sont des `Interval [min, max]`. |
| ROI-02 | ROI global — investissement total vs revenus cumulés à 25, 50 et 100 ans | Coût total = `costMEur` (M€) + `desalinationCost` (€). Revenus annuels = `totalAnnualValue`. Formule : `(revenues - cost) / cost × 100`. |
| ROI-03 | Break-even en années — combien d'années pour rembourser le coût de construction | `breakEvenYears = totalCost / totalAnnualValue` (min/max inversés). |
| ROI-04 | Tableau de comparaison multi-canaux trié par break-even croissant | Type `RoiSummary[]` trié. Canaux sans dessalement activé → `null`. |
</phase_requirements>

---

## Summary

Phase 12 est un **moteur d'agrégation pur** : il prend les résultats calculés par les moteurs amont (calcul, dessalement, circulaire) et les combine pour produire des métriques financières (ROI, break-even). Aucune formule scientifique nouvelle — uniquement de l'arithmétique d'intervalles sur des valeurs déjà calculées.

**L'insight architectural clé :** `CalculationResult.costMEur` est en **M€**, `DesalinationResult.desalinationCost` est en **€** (pas en M€). Le moteur ROI doit normaliser les unités avant toute addition. C'est le piège le plus probable et il est entièrement vérifiable depuis le code existant.

**Le store ne contient aucun résultat pré-calculé.** Exactement comme `useCircular` recalcule `DesalinationResult` en interne, `useROI` devra recalculer `DesalinationResult` et `CircularResult` en interne via les fonctions pures des engines. Jamais de hook-dans-hook.

**Recommandation principale :** Dupliquer le pattern de `useCircular.ts` pour `useROI.ts`. Le moteur `roiEngine.ts` prend des `RoiParams` construits à partir des résultats des engines amont — il n'importe aucun hook React.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Agrégation valeur annuelle (ROI-01) | Moteur pur (src/lib) | — | Arithmétique pure, testable sans DOM |
| Calcul ROI % à 25/50/100 ans (ROI-02) | Moteur pur (src/lib) | — | Formule déterministe sur intervalles |
| Calcul break-even (ROI-03) | Moteur pur (src/lib) | — | Division simple avec protection /0 |
| Tableau comparaison multi-canaux (ROI-04) | Moteur pur (src/lib) | — | Sort sur RoiSummary[], pas de React |
| Orchestration React | Hook (src/hooks/useROI.ts) | Store (src/store) | Lit canals + desalinationEnabled + calcParams |
| Persistance | Aucune | — | Module pur, pas de nouvel état store en Phase 12 |
| UI d'affichage | Hors scope Phase 12 | Phase 13 | useROI prêt mais rendu déféré |

---

## Standard Stack

### Core (inchangé — zéro nouvelle dépendance)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Types stricts, Interval | Déjà en place |
| Vitest | ^3.2.1 | Tests unitaires TDD | Déjà configuré (vite.config.ts) |
| @turf/turf | installé | `length()`, `lineString()` — pour recalculer lengthKm dans useROI | Déjà importé dans useCircular.ts |
| Zustand | installé | `useCanalStore` — lecture `canals`, `calcParams`, `desalinationEnabled` | Déjà en place |

**Installation : aucun `npm install` requis.** Toutes les dépendances sont déjà présentes.

---

## Data Availability — Réponses aux Questions de Recherche

### Q1 : Champs disponibles dans CalculationResult pour le coût de construction

**Réponse vérifiée [VERIFIED: src/types/calculation.ts, src/lib/calculationEngine.ts] :**

```typescript
// CalculationResult (src/types/calculation.ts)
export interface CalculationResult {
  lengthKm:         Interval   // km ±1%
  volumeKm3:        Interval   // km³
  deltaSLmm:        Interval   // mm
  costMEur:         Interval   // M€ ← COÛT CONSTRUCTION — unité : MILLIONS d'euros
  ipccPercent:      Interval
  terrainBreakdown: TerrainBreakdown
}
```

**Champ à utiliser : `costMEur` (type `Interval`, unité M€).**

`computeCalculation()` retourne `null` si pas de profil d'élévation disponible. `useROI` doit gérer ce `null` avec un fallback.

### Q2 : Valeur de l'eau dessalée — unités et bornes

**Données vérifiées [VERIFIED: src/lib/desalinationEngine.ts] :**

`DesalinationResult.waterProduction` est en **m³/jour** (Interval). Base : `nodes × 10_000 × solarFactor × [0.8, 1.2]`.

**Formule recommandée pour la valeur eau :**
```
waterValueEurPerYear = waterProduction [m³/jour] × 365 [j/an] × price [€/m³]
```

**Borne de prix [0.5, 2.0] €/m³ — justification [ASSUMED] :**
- Eau dessalée en Moyen-Orient/Afrique du Nord : 0.5–1.5 $/m³ (Arabian Journal of Chemistry 2021, MDPI)
- Eau potable en zone aride avec pénurie : jusqu'à 2.0–3.0 $/m³
- Fourchette conservatrice [0.5, 2.0] €/m³ couvre le spectre eau agricole (0.5) → eau potable/industrielle (2.0)
- Cohérent avec le principe d'intervalles honnêtes du projet

**Ordre de grandeur pour validation :** Pour un canal de 1500 km (3 nœuds, solarFactor 1.0) :
- `waterProduction` = [24 000, 36 000] m³/jour
- `waterValueEurPerYear` = [24 000 × 365 × 0.5, 36 000 × 365 × 2.0] = [4.38 M€/an, 26.28 M€/an]

### Q3 : Architecture hook useROI — recalcul interne vs store

**Réponse vérifiée [VERIFIED: src/store/canalStore.ts, src/hooks/useCircular.ts] :**

Le store Zustand contient :
- `canals: Canal[]` — points + name + id
- `desalinationEnabled: boolean`
- `calcParams: CalcParams` (width, depth)
- `selectedCanalId: string | null`

**Aucun résultat pré-calculé dans le store** (pas de `desalinationResult`, pas de `calculationResult`, pas de `circularResult`).

**Architecture confirmée :** `useROI` doit recalculer les trois résultats amont en interne — exactement comme `useCircular` recalcule `DesalinationResult`. C'est la seule approche compatible avec la contrainte "no hook-in-hook".

```
useROI.ts
  ├── useCanalStore → canals, selectedCanalId, desalinationEnabled, calcParams
  └── useMemo:
       ├── computeCalculation(canal, profile, width, depth)  ← mais profile manque
       ├── computeDesalinationAnalysis(params, desertFeatures)
       ├── computeCircularAnalysis(params, desertFeatures)
       └── computeRoiAnalysis(roiParams)
```

**Problème : `ElevationProfile` non disponible dans `useROI`.** La phase 12 est un moteur de calcul pur. Le profil d'élévation est chargé de manière asynchrone par `useElevation` et stocké dans `canal.elevation`. Donc `useROI` peut lire `canal.elevation` directement depuis `canals` (c'est un champ optionnel du type `Canal`).

**Solution :** `useROI` lit `canal.elevation` depuis le store (stocké dans l'objet Canal lui-même) et appelle `computeCalculation`. Si `canal.elevation` est `undefined`, le coût de construction est `null` → `useROI` retourne `null`.

### Q4 : Formule ROI % — approche recommandée

**Décision de conception [ASSUMED — choix scientifiquement honnête] :**

Pour un projet d'infrastructure publique sur horizon très long (25–100 ans), la formule la plus transparente et la plus couramment utilisée dans l'analyse coût-bénéfice (CBA) publique est :

```
ROI% = (revenusNets - coûtTotal) / coûtTotal × 100
```

où `revenusNets = totalAnnualValue × années`.

**Rationale :**
- Le "multiplicateur total" (revenues/cost) est moins intuitif pour un non-spécialiste
- La formule `(net - cost) / cost × 100` donne des valeurs négatives avant break-even (excellent indicateur visuel pour ROI-03)
- À break-even, ROI% = 0 exactement — lien direct avec ROI-03
- Compatible avec intervalles [min, max] : calculer séparément pour [min, min] et [max, max]

**Pour les 3 horizons (ROI-02) :**
```typescript
roi25Years = (annualValue * 25 - totalCost) / totalCost * 100
roi50Years = (annualValue * 50 - totalCost) / totalCost * 100
roi100Years = (annualValue * 100 - totalCost) / totalCost * 100
```

Chaque valeur est un `Interval [min, max]` — min calculé avec hypothèses pessimistes (coût max, revenus min), max avec optimistes.

### Q5 : Type RoiSummary pour ROI-04 et canaux sans dessalement

**Design recommandé [VERIFIED: src/types/canal.ts, src/store/canalStore.ts] :**

```typescript
export interface RoiSummary {
  canalId:         string        // Canal.id (pour liaison UI)
  canalName:       string        // Canal.name — "Canal 1", "Dépression de Qattara", etc.
  totalCostMEur:   Interval      // M€ — coût construction + dessalement
  annualValueMEur: Interval      // M€/an — somme co-produits
  breakEvenYears:  Interval      // ans — peut être [Infinity, Infinity] si annualValue = 0
  roi25:           Interval      // % à 25 ans
  roi50:           Interval      // % à 50 ans
  roi100:          Interval      // % à 100 ans
}
```

**Canaux sans dessalement :** `desalinationEnabled = false` → nodes = 0 → spiruline/aquaculture/minéraux = 0. Mais le coût de construction (`costMEur`) et potentiellement une valeur eau partielle existent encore.

**Décision architecturale :** ROI-04 s'applique à TOUS les canaux, pas seulement ceux avec dessalement. Un canal sans dessalement a `annualValue = [0, 0]` (zéro revenus co-produits) → `breakEvenYears = [Infinity, Infinity]`. L'affichage UI gèrera ce cas spécial en Phase 13.

**Tri ROI-04 :** `sort((a, b) => a.breakEvenYears[0] - b.breakEvenYears[0])` — trier sur la borne min (optimiste). Les `Infinity` vont en dernier naturellement.

---

## Architecture Patterns

### System Architecture Diagram

```
canalStore
  canals[].{points, name, elevation, elevationLoading}
  selectedCanalId
  desalinationEnabled
  calcParams {width, depth}
         │
         ▼
useROI.ts (hook — pattern identique useCircular.ts)
  useMemo([selectedCanalId, canals, desalinationEnabled, calcParams])
         │
         ├── Pour le canal sélectionné :
         │    ├── computeCalculation(canal, canal.elevation, width, depth)
         │    │    → CalculationResult | null   (costMEur en M€)
         │    ├── computeDesalinationAnalysis(params, desertFeatures)
         │    │    → DesalinationResult | null  (desalinationCost en €, waterProduction en m³/j)
         │    └── computeCircularAnalysis(params, desertFeatures)
         │         → CircularResult | null      (spirulineValue, aquacultureValue, mineralsValue en €/an)
         │
         ▼
computeRoiAnalysis(roiParams: RoiParams): RoiResult | null
  │
  ├── calcTotalAnnualValue(params)      → totalAnnualValue [min, max] M€/an
  ├── calcTotalCost(params)             → totalCost [min, max] M€
  ├── calcBreakEven(annualValue, cost)  → breakEvenYears [min, max] ans
  └── calcCumulativeRoi(annual, cost, years) → roi25/roi50/roi100 [min, max] %
         │
         ▼
  RoiResult | null

useROI → RoiResult | null

Pour ROI-04 (multi-canaux) :
  calcAllCanalsRoi(canals, calcParams, desalinationEnabled)
       → RoiSummary[] sorted by breakEvenYears[0] ascending
```

### Recommended Project Structure (ajouts Phase 12)

```
src/
├── lib/
│   └── roiEngine.ts           # Moteur pur (nouveau)
├── types/
│   └── roi.ts                 # Types RoiParams, RoiResult, RoiSummary (nouveau)
├── hooks/
│   └── useROI.ts              # Hook React pour canal sélectionné (nouveau)
└── tests/
    └── roiEngine.test.ts      # Tests TDD (nouveau)
```

### Pattern 1 : Normalisation des unités (critique)

`costMEur` est en **M€**, `desalinationCost` est en **€**, les valeurs circulaires sont en **€/an**.

Choisir **M€ comme unité canonique** pour tous les calculs ROI (lisibilité, ordres de grandeur cohérents) :

```typescript
// Source : analysis of src/types/calculation.ts + src/types/desalination.ts
const constructionMEur: Interval = calcResult.costMEur          // déjà en M€
const desalMEur: Interval = [
  desalResult.desalinationCost[0] / 1_000_000,
  desalResult.desalinationCost[1] / 1_000_000,
]  // converti de € en M€
const annualCircularMEur: Interval = [
  (circResult.spirulineValue[0] + circResult.aquacultureValue[0] + circResult.mineralsValue[0]) / 1_000_000,
  (circResult.spirulineValue[1] + circResult.aquacultureValue[1] + circResult.mineralsValue[1]) / 1_000_000,
]  // converti de €/an en M€/an
```

### Pattern 2 : Intervalle de break-even (inversion min/max)

Le break-even est une division `coût / revenus`. Quand on divise deux intervalles positifs, le min du résultat utilise le **numérateur min** et le **dénominateur max** — et vice versa :

```typescript
// Source : analyse arithmétique des intervalles positifs (cohérent avec mulIntervals dans calculationEngine.ts)
export function calcBreakEven(
  totalCostMEur: Interval,
  annualValueMEur: Interval,
): Interval {
  if (annualValueMEur[0] <= 0) return [Infinity, Infinity]
  // min(coût) / max(revenus) = optimiste (break-even le plus court)
  // max(coût) / min(revenus) = pessimiste (break-even le plus long)
  return [
    totalCostMEur[0] / annualValueMEur[1],  // optimiste
    totalCostMEur[1] / annualValueMEur[0],  // pessimiste
  ]
}
```

### Pattern 3 : ROI % avec intervalles (même logique min/max croisés)

```typescript
// Source : raisonnement arithmétique sur [min, max] positifs
export function calcCumulativeRoi(
  annualValueMEur: Interval,
  totalCostMEur: Interval,
  years: number,
): Interval {
  if (totalCostMEur[0] <= 0) return [0, 0]
  // Pessimiste : revenus min sur coût max
  const roiMin = (annualValueMEur[0] * years - totalCostMEur[1]) / totalCostMEur[1] * 100
  // Optimiste : revenus max sur coût min
  const roiMax = (annualValueMEur[1] * years - totalCostMEur[0]) / totalCostMEur[0] * 100
  return [roiMin, roiMax]
}
```

**Valeurs négatives avant break-even sont intentionnelles et utiles** — elles indiquent visuellement "pas encore rentable".

### Pattern 4 : Guard pour canal sans profil d'élévation

```typescript
// Source : analyse src/hooks/useCircular.ts + src/types/canal.ts
export function useROI(): RoiResult | null {
  const canals = useCanalStore((s) => s.canals)
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
  const calcParams = useCanalStore((s) => s.calcParams)

  return useMemo<RoiResult | null>(() => {
    const canal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!canal || canal.points.length < 2) return null
    if (!canal.elevation) return null  // ← pas de coût sans profil élévation

    const calcResult = computeCalculation(canal, canal.elevation, calcParams.width, calcParams.depth)
    if (!calcResult) return null

    // ... recalculer desal + circular + roi
  }, [selectedCanalId, canals, desalinationEnabled, calcParams])
}
```

### Anti-Patterns à éviter

- **Mélanger €, M€, G€ dans la même fonction** — normaliser en M€ avant toute addition.
- **`costMEur.min / annualValue.min` pour le break-even optimiste** — FAUX. Voir Pattern 2 (inversion min/max).
- **Importer `useDesalination` ou `useCircular` depuis `useROI`** — interdit (hook-in-hook). Re-appeler les fonctions pures `computeDesalinationAnalysis` et `computeCircularAnalysis` directement.
- **Stocker RoiResult dans le store Zustand** — inutile en Phase 12. Le hook calcule à la demande via `useMemo`.
- **Omettre le cas `annualValue = [0, 0]`** — division par zéro. `calcBreakEven` doit retourner `[Infinity, Infinity]` quand `annualValueMEur[0] <= 0`.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|----------|------------------|--------------------|----|
| Calcul coût construction | Refaire les formules terrain | `computeCalculation()` depuis `calculationEngine.ts` | Déjà testé, correction Interval correcte |
| Calcul nœuds dessalement | Recalculer nodes depuis length | `computeDesalinationAnalysis()` depuis `desalinationEngine.ts` | Déjà testé avec tous les edge cases |
| Calcul spiruline/aquaculture/minéraux | Dupliquer les constantes | `computeCircularAnalysis()` depuis `circularEngine.ts` | Déjà implémenté en Phase 11 |
| Addition d'intervalles | `[a[0]+b[0], a[1]+b[1]]` maison | Réutiliser `addIntervals()` de `calculationEngine.ts` | Export déjà existant, testé |
| longueur du canal | `turf.length()` directement | Utiliser `computeLengthInterval()` ou `turf.length()` local | Le moteur ROI peut calculer lui-même |

---

## Common Pitfalls

### Pitfall 1 : Confusion d'unités M€ vs €

**Ce qui se passe :** `CalculationResult.costMEur` est en millions d'euros (M€), mais `DesalinationResult.desalinationCost` est en euros (€) — pas en M€. Si on additionne directement les deux intervalles, le coût total est sous-estimé d'un facteur 1 000 000.

**Preuve [VERIFIED: src/lib/desalinationEngine.ts:116] :**
```typescript
export function calcDesalinationCost(nodes: number): Interval {
  return [nodes * 50_000_000, nodes * 150_000_000]  // ← unité : euros, pas M€
}
```

**Preuve [VERIFIED: src/lib/calculationEngine.ts:104-113] :**
```typescript
export function computeCost(breakdown: TerrainBreakdown): Interval {
  // costMin += segKm * COST_PER_KM[type][0]  ← COST_PER_KM[plain] = [1, 5] = M€/km
  return [costMin, costMax]  // ← unité : M€
}
```

**Comment éviter :** Toujours diviser `desalinationCost` par `1_000_000` avant addition avec `costMEur`.

**Warning signs :** Break-even de moins d'1 an pour un grand canal → suspect, vérifier les unités.

### Pitfall 2 : Inversion min/max pour break-even et ROI %

**Ce qui se passe :** `breakEven = cost / revenue`. Pour l'intervalle OPTIMISTE (break-even le plus court), il faut `costMin / revenueMax`. Utiliser `costMin / revenueMin` donne un intervalle incorrect (plus conservateur que le pessimiste si revenus varient beaucoup).

**Règle générale pour division de deux intervalles positifs [a,b] / [c,d] :**
- Min du résultat = a / d (le plus petit numérateur sur le plus grand dénominateur)
- Max du résultat = b / c (le plus grand numérateur sur le plus petit dénominateur)

**Warning signs :** `breakEven[0] > breakEven[1]` → inversion incorrecte.

### Pitfall 3 : `canal.elevation` peut être `undefined` au moment du calcul ROI

**Ce qui se passe :** `Canal.elevation?: ElevationProfile` est optionnel. Si l'utilisateur trace un canal mais n'a pas encore chargé le profil (ou si le fetch a échoué), `canal.elevation` est `undefined`. `computeCalculation` retourne `null` dans ce cas. Sans guard, `roiEngine` recevrait `null` pour `costMEur` et planterait.

**Pattern correct :**
```typescript
// Dans useROI
if (!canal.elevation || canal.elevationLoading) return null
const calcResult = computeCalculation(canal, canal.elevation, width, depth)
if (!calcResult) return null
```

**Warning signs :** `RoiResult` affiché avec `costMEur = undefined` → guard manquant.

### Pitfall 4 : ROI-04 multi-canaux — appeler computeCalculation sur des canaux sans élévation

**Ce qui se passe :** Pour la table de comparaison (ROI-04), le moteur itère sur TOUS les canaux. Certains canaux peuvent ne pas avoir de profil d'élévation chargé → `computeCalculation` retourne `null`. Ces canaux doivent être **omis** du tableau (pas `RoiSummary` avec valeurs nulles).

**Comment éviter :** Dans `calcAllCanalsRoi()`, filter les canaux où `canal.elevation` est défini.

### Pitfall 5 : Double comptage saltValue et waterValue

**Ce qui se passe :** `DesalinationResult.saltValue` représente la valeur des **sels** extraits de la saumure. La valeur de l'**eau douce produite** (`waterValue`) est distincte. Les deux sont des revenus légitimes et non redondants. Cependant, les minéraux CIRC-03 (Mg/K/Ca) sont extraits de la même saumure que `saltValue` — mais ce sont des sous-produits différents (le sel = NaCl, les minéraux = Mg²⁺/K⁺/Ca²⁺).

**Composants de `totalAnnualValue` sans double comptage :**
1. `waterValue` = `waterProduction × 365 × prix_eau` (valeur eau douce)
2. `saltValue` = `DesalinationResult.saltValue` (valeur NaCl récupéré)
3. `spirulineValue` = `CircularResult.spirulineValue` (€/an spiruline)
4. `aquacultureValue` = `CircularResult.aquacultureValue` (€/an aquaculture)
5. `mineralsValue` = `CircularResult.mineralsValue` (€/an Mg/K/Ca — distinct de saltValue)

**Vérification [VERIFIED: src/lib/circularEngine.ts:92-112] :** `calcMineralExtraction` utilise `waterProductionMinDaily` pour calculer la masse de sel, PUIS applique les fractions Mg/K/Ca. C'est la masse de **sel total** (NaCl + minéraux), pas uniquement le NaCl. Il y a une légère surestimation de `saltValue + mineralsValue` combinés, mais elle est documentée en Phase 11 comme approximation acceptable.

---

## Formules Complètes Recommandées

### ROI-01 : Valeur Annuelle Totale (en M€/an pour cohérence)

```typescript
// Toutes les valeurs en M€/an
totalAnnualValue[0] = (
  waterProduction[0] * 365 * WATER_PRICE_MIN / 1_000_000  // eau
  + saltValue[0] / 1_000_000                               // sel (NaCl)
  + spirulineValue[0] / 1_000_000                          // spiruline
  + aquacultureValue[0] / 1_000_000                        // aquaculture
  + mineralsValue[0] / 1_000_000                           // Mg/K/Ca
)

totalAnnualValue[1] = (
  waterProduction[1] * 365 * WATER_PRICE_MAX / 1_000_000
  + saltValue[1] / 1_000_000
  + spirulineValue[1] / 1_000_000
  + aquacultureValue[1] / 1_000_000
  + mineralsValue[1] / 1_000_000
)
```

**Constantes eau : `WATER_PRICE_MIN = 0.5`, `WATER_PRICE_MAX = 2.0` (€/m³) [ASSUMED — bornes raisonnables zone aride]**

### ROI-02 : ROI cumulé % à N années

```typescript
// Pessimiste : revenus min, coût max
roiN[0] = (annualValue[0] * N - totalCost[1]) / totalCost[1] * 100

// Optimiste : revenus max, coût min
roiN[1] = (annualValue[1] * N - totalCost[0]) / totalCost[0] * 100
```

### ROI-03 : Break-even

```typescript
// Guard obligatoire
if (annualValue[0] <= 0) return [Infinity, Infinity]

breakEven[0] = totalCost[0] / annualValue[1]  // optimiste
breakEven[1] = totalCost[1] / annualValue[0]  // pessimiste
```

### ROI-04 : Coût total consolidé

```typescript
// Coût construction + coût dessalement, en M€
totalCost[0] = costMEur[0] + desalinationCost[0] / 1_000_000
totalCost[1] = costMEur[1] + desalinationCost[1] / 1_000_000
```

Si `desalinationEnabled = false` : `desalinationCost = [0, 0]`.

---

## Code Examples

### Types recommandés (src/types/roi.ts)

```typescript
// Source : analysis of circular.ts + calculation.ts + desalination.ts patterns
import type { Interval } from './calculation'

/** Paramètres d'entrée pour le moteur ROI — agrège les résultats des 3 engines amont */
export interface RoiParams {
  /** Coût construction canal [min, max] M€ — from CalculationResult.costMEur */
  costMEur: Interval
  /** Coût infrastructure dessalement [min, max] € — from DesalinationResult.desalinationCost */
  desalinationCostEur: Interval
  /** Production eau douce [min, max] m³/jour — from DesalinationResult.waterProduction */
  waterProductionM3PerDay: Interval
  /** Valeur sels récupérés [min, max] €/an — from DesalinationResult.saltValue */
  saltValueEurPerYear: Interval
  /** Valeur spiruline [min, max] €/an — from CircularResult.spirulineValue */
  spirulineValueEurPerYear: Interval
  /** Valeur aquaculture [min, max] €/an — from CircularResult.aquacultureValue */
  aquacultureValueEurPerYear: Interval
  /** Valeur minéraux [min, max] €/an — from CircularResult.mineralsValue */
  mineralsValueEurPerYear: Interval
}

/** Résultat complet du moteur ROI pour un canal */
export interface RoiResult {
  /** Valeur économique totale annuelle [min, max] M€/an (ROI-01) */
  totalAnnualValueMEur: Interval
  /** Coût total consolidé [min, max] M€ (construction + dessalement) */
  totalCostMEur: Interval
  /** Break-even [min, max] années (ROI-03) — [Infinity, Infinity] si pas de revenus */
  breakEvenYears: Interval
  /** ROI cumulé % à 25 ans [min, max] (ROI-02) */
  roi25: Interval
  /** ROI cumulé % à 50 ans [min, max] (ROI-02) */
  roi50: Interval
  /** ROI cumulé % à 100 ans [min, max] (ROI-02) */
  roi100: Interval
}

/** Résumé ROI d'un canal pour le tableau de comparaison (ROI-04) */
export interface RoiSummary {
  /** Identifiant du canal */
  canalId: string
  /** Nom affiché du canal */
  canalName: string
  /** Coût total consolidé [min, max] M€ */
  totalCostMEur: Interval
  /** Valeur annuelle totale [min, max] M€/an */
  totalAnnualValueMEur: Interval
  /** Break-even [min, max] ans */
  breakEvenYears: Interval
  /** ROI % à 25 ans [min, max] */
  roi25: Interval
  /** ROI % à 50 ans [min, max] */
  roi50: Interval
  /** ROI % à 100 ans [min, max] */
  roi100: Interval
}
```

### Squelette roiEngine.ts

```typescript
// src/lib/roiEngine.ts
// Source : pattern circularEngine.ts — fonctions pures exportées individuellement
import type { Interval } from '../types/calculation'
import type { RoiParams, RoiResult } from '../types/roi'

export const WATER_PRICE_MIN = 0.5   // €/m³ (zone aride, usage agricole)
export const WATER_PRICE_MAX = 2.0   // €/m³ (usage potable/industriel)

/** ROI-01 : Valeur annuelle totale en M€/an */
export function calcTotalAnnualValue(params: RoiParams): Interval { /* ... */ }

/** ROI-03 : Coût total consolidé en M€ */
export function calcTotalCost(params: RoiParams): Interval { /* ... */ }

/** ROI-03 : Break-even en années */
export function calcBreakEven(totalCostMEur: Interval, annualValueMEur: Interval): Interval { /* ... */ }

/** ROI-02 : ROI cumulé % à N années */
export function calcCumulativeRoi(annualValueMEur: Interval, totalCostMEur: Interval, years: number): Interval { /* ... */ }

/** Orchestrateur principal */
export function computeRoiAnalysis(params: RoiParams): RoiResult | null { /* ... */ }
```

---

## Wave Structure

### Wave T01 — Types + Stubs + Tests RED

**Fichiers créés :**
- `src/types/roi.ts` — interfaces `RoiParams`, `RoiResult`, `RoiSummary`
- `src/lib/roiEngine.ts` — stubs exportant `[0, 0]` / `null` / `[Infinity, Infinity]`
- `src/tests/roiEngine.test.ts` — tous les tests en état RED

**Tests à écrire (≥ 20) :**
- `calcTotalAnnualValue` : retourne [0,0] pour tous params à zéro
- `calcTotalAnnualValue` : somme correcte de 5 co-produits convertis en M€
- `calcTotalAnnualValue` : eau = waterProduction × 365 × WATER_PRICE
- `calcTotalCost` : convertit desalinationCost de € en M€ avant addition
- `calcTotalCost` : costMEur sans dessalement = costMEur seul
- `calcBreakEven` : retourne [Infinity, Infinity] si annualValue[0] = 0
- `calcBreakEven` : min = costMin / annualMax (optimiste)
- `calcBreakEven` : max = costMax / annualMin (pessimiste)
- `calcBreakEven` : breakEven[0] ≤ breakEven[1] (cohérence intervalle)
- `calcCumulativeRoi` : ROI% < 0 avant break-even
- `calcCumulativeRoi` : ROI% ≈ 0 à t = break-even
- `calcCumulativeRoi` : roi100 > roi50 > roi25 (si revenus > 0)
- `computeRoiAnalysis` : retourne null si costMEur = [0, 0]
- `computeRoiAnalysis` : résultat cohérent pour canal réaliste (1500 km, 3 nœuds)
- `calcBreakEven` pour canal sans dessalement : breakEven[0] < breakEven[1]
- Ordre de grandeur Qattara (3000 km) : break-even dans [20, 200] ans
- ROI-04 : `sortByBreakEven` trie correctement (ascending)
- ROI-04 : canal sans élévation omis du tableau
- ROI-04 : canaux avec [Infinity, Infinity] en dernier du tableau

### Wave T02 — Implémentation GREEN

**Fichier modifié :** `src/lib/roiEngine.ts` — implémenter les 4 fonctions + orchestrateur.

**Cible :** tous les tests T01 passent au GREEN.

### Wave T03 — Hook React

**Fichier créé :** `src/hooks/useROI.ts`

**Pattern :** identique à `useCircular.ts` — 4 sélecteurs Zustand + `useMemo` + recalcul interne des 3 engines amont.

---

## Assumptions Log

| # | Claim | Section | Risque si Faux |
|---|-------|---------|----------------|
| A1 | Prix eau dessalée [0.5, 2.0] €/m³ — bornes raisonnables mais non vérifiées via source officielle en session | Q2 + Formules | Fourchette peut être trop large ou trop étroite ; impacte totalAnnualValue linéairement |
| A2 | `desalinationEnabled = false` → inclure le canal dans ROI-04 avec revenus = 0 | Q5 | Alternative : exclure les canaux sans dessalement. Décision UI à confirmer avec Phase 13. |
| A3 | Unité canonique M€ pour tous les calculs ROI internes | Architecture | Choix cohérent mais les tests devront valider explicitement les conversions |
| A4 | `canal.elevation` disponible via le store (stocké dans `Canal.elevation?`) — pas besoin de re-fetch dans useROI | Q3 | Confirmé [VERIFIED: src/types/canal.ts] — `elevation?: ElevationProfile` est un champ de Canal |

---

## Open Questions

1. **Eau + sel : double comptage partiel**
   - Ce qu'on sait : `saltValue` compte le NaCl. `waterValue` compte l'eau douce produite. Les deux sont distincts.
   - Ce qui est flou : la valeur de l'eau douce (waterValue) dépasse souvent la valeur du sel. Faut-il afficher les deux séparément dans ROI-01 ou juste le total ?
   - Recommandation : Le moteur calcule les deux séparément dans `RoiParams` et les additionne dans `totalAnnualValue`. L'UI Phase 13 peut afficher un breakdown.

2. **Canal sans profil d'élévation dans ROI-04**
   - Ce qu'on sait : Si `canal.elevation = undefined`, `computeCalculation` retourne `null` → coût inconnu.
   - Ce qui est flou : inclure ce canal dans le tableau avec coût `[0, 0]` (trompeur) ou l'omettre ?
   - Recommandation : Omettre les canaux sans élévation du tableau ROI-04. Documenter dans `calcAllCanalsRoi` avec un commentaire.

3. **Horizons fixes 25/50/100 ans vs horizon `lifespanYears`**
   - Ce qu'on sait : `CircularResult.lifespanYears` = [20, 50] ou [26, 65] ans selon terrain.
   - Ce qui est flou : un horizon 100 ans peut dépasser la durée de vie du canal — devrait-on plafonner à `lifespanYears.max` ?
   - Recommandation : Ignorer `lifespanYears` pour les calculs ROI Phase 12 (les horizons 25/50/100 sont locked dans REQUIREMENTS.md). Note pour Phase 13 UI : afficher `lifespanYears` en contexte du ROI.

---

## Environment Availability

Phase 12 = code/config uniquement (zéro dépendance externe). SKIPPED.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.2.1 |
| Config file | vite.config.ts (section `test:`) |
| Quick run command | `npm run test -- roiEngine` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROI-01 | `calcTotalAnnualValue` : somme 5 co-produits en M€/an | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-01 | `calcTotalAnnualValue` : [0,0] si tous params nuls | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-01 | `calcTotalAnnualValue` : eau = waterProduction × 365 × WATER_PRICE | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-01 | `calcTotalCost` : desalinationCost converti € → M€ | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-02 | `calcCumulativeRoi` : roi100 > roi50 > roi25 si revenus > 0 | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-02 | `calcCumulativeRoi` : ROI% < 0 avant break-even | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-02 | `calcCumulativeRoi` : fourchette [min, max] cohérente | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-03 | `calcBreakEven` : [Infinity, Infinity] si annualValue = 0 | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-03 | `calcBreakEven` : breakEven[0] ≤ breakEven[1] | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-03 | `calcBreakEven` : min = costMin / annualMax | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-04 | `calcAllCanalsRoi` : canaux triés par breakEven[0] croissant | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| ROI-04 | `calcAllCanalsRoi` : canaux sans élévation omis | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| — | `computeRoiAnalysis` : retourne null si costMEur = [0,0] | unit | `npm run test -- roiEngine` | ❌ Wave 0 |
| — | `computeRoiAnalysis` : résultat valide pour canal 1500 km | unit | `npm run test -- roiEngine` | ❌ Wave 0 |

### Sampling Rate

- **Par commit tâche :** `npm run test -- roiEngine`
- **Par wave merge :** `npm run test`
- **Phase gate :** Suite complète verte avant `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/types/roi.ts` — interfaces `RoiParams`, `RoiResult`, `RoiSummary`
- [ ] `src/lib/roiEngine.ts` — stubs + `computeRoiAnalysis` retournant null + `calcAllCanalsRoi`
- [ ] `src/tests/roiEngine.test.ts` — ≥ 20 tests RED couvrant ROI-01 à ROI-04

*(Pas de gap sur l'infrastructure de test — vite.config.ts déjà configuré, jsdom en place)*

---

## Security Domain

Phase 12 = module de calcul pur sans I/O réseau, sans authentification, sans entrée utilisateur directe. Même profil que Phase 11.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | minimal | Guards `if annualValue[0] <= 0 return [Infinity, Infinity]` — protection division par zéro |
| V6 Cryptography | no | — |

Aucun vecteur STRIDE pertinent pour un moteur de calcul pur client-side.

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: src/types/calculation.ts] — `costMEur: Interval` confirmé, unité M€
- [VERIFIED: src/lib/calculationEngine.ts:104-113] — `COST_PER_KM[plain] = [1, 5]` (M€/km), unité M€ confirmée
- [VERIFIED: src/lib/desalinationEngine.ts:114-116] — `desalinationCost = [nodes * 50_000_000, nodes * 150_000_000]`, unité € (pas M€)
- [VERIFIED: src/types/desalination.ts:43] — `desalinationCost: Interval // € (DESAL-05)`
- [VERIFIED: src/types/desalination.ts:36] — `waterProduction: Interval // m³/jour`
- [VERIFIED: src/types/circular.ts:36-44] — `spirulineValue`, `aquacultureValue`, `mineralsValue` tous en `Interval // €/an`
- [VERIFIED: src/store/canalStore.ts] — store sans résultats pré-calculés (seulement `desalinationEnabled: boolean`)
- [VERIFIED: src/hooks/useCircular.ts] — pattern de référence pour useROI (recalcul interne, pas hook-in-hook)
- [VERIFIED: src/types/canal.ts] — `elevation?: ElevationProfile` champ optionnel disponible dans useROI
- [VERIFIED: src/lib/calculationEngine.ts:31] — `addIntervals` exporté et réutilisable

### Secondary (MEDIUM confidence)

- [ASSUMED] Prix eau dessalée [0.5, 2.0] €/m³ — fourchette raisonnée depuis littérature connue sur dessalement en zones arides

---

## Metadata

**Confidence breakdown :**
- Disponibilité des données (champs, types, unités) : HIGH — lecture directe du code
- Architecture hook useROI : HIGH — basée sur pattern useCircular.ts vérifié
- Formules ROI (valeur annuelle, break-even, ROI%) : HIGH — arithmétique pure sur intervalles
- Prix eau dessalée [0.5, 2.0] €/m³ : LOW-MEDIUM — [ASSUMED], fourchette raisonnée
- Décision ROI-04 (inclure canaux sans dessalement) : MEDIUM — choix raisonnable, confirmable avec utilisateur

**Research date :** 2026-05-02
**Valid until :** 2026-06-02 (stable — moteur pur, zéro dépendance externe)

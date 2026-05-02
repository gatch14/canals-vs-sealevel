# Phase 11: Moteur Économique Circulaire - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Calculer toute la chaîne de co-produits du bassin terminal : production spiruline, aquaculture marine, minéraux/engrais, surface agricole créée, durée de vie du canal et timeline habitabilité. Module pur `circularEngine.ts` dans `src/lib/`, types dans `src/types/circular.ts`, hook `useCircular.ts`. Couvre CIRC-01, CIRC-02, CIRC-03, CIRC-04, VIE-01, VIE-02.

</domain>

<decisions>
## Implementation Decisions

### Architecture du moteur circulaire
- Module `circularEngine.ts` dans `src/lib/` — cohérent avec `ecologyEngine`, `desalinationEngine`, `meteorologyEngine`
- Types dans `src/types/circular.ts` — même pattern que `desalination.ts`, `meteorology.ts`
- Hook React `useCircular.ts` dans `src/hooks/` — copie du pattern `useDesalination.ts`
- Source des données : `DesalinationResult` (Phase 9) — nodes, habitableZones, saltValue, waterProduction déjà calculés
- Activation : uniquement si `desalinationEnabled = true` (nodes > 0) — cohérent avec le toggle Phase 9

### Formules de production CIRC-01 à CIRC-04
- **Spiruline (CIRC-01)** : Rendement [10, 20] t/ha/an × surface bassin (habitableZones km² × 100 ha/km² × 10%), prix [5 000, 20 000] €/t → intervalle tonnes/an + €/an
- **Aquaculture (CIRC-02)** : Rendement [2, 8] t protéines/km²/an × habitableZones × 30%, prix [2 000, 8 000] €/t → intervalle tonnes/an + €/an
- **Minéraux/Engrais (CIRC-03)** : Saumure concentrée 2× salinité normale = 70 g/L → Mg=0.13%, K=0.04%, Ca=0.04% × masse saumure (proxy depuis saltValue) → tonnes Mg/K/Ca/an + €/an en intervalles
- **Surface agricole (CIRC-04)** : waterProduction.min (m³/jour) × 365 / 2 000 m³/km²/an = km² arables, fourchette ±30%

### Durée de vie et habitabilité VIE-01/VIE-02
- **Durée de vie (VIE-01)** : Base [20, 50] ans, modulée par terrain via aridityFactor (réutiliser desertZones.geojson) : zone désertique × 1.3 (dépôts lents), zone humide × 0.8
- **Habitabilité (VIE-02)** : [5, 20] ans si eau douce disponible (waterProduction > 0) ET engrais (CIRC-03 > 0) ; [20, 50] ans sinon

### Structure des plans
- T01 : types `CircularResult` + stubs `circularEngine.ts` + tests RED (Wave 0)
- T02 : implémentation complète `circularEngine.ts` — tests GREEN (Wave 1)
- T03 : `useCircular.ts` hook — connexion store (desalinationEnabled, canals, calcParams) (Wave 2)

### Claude's Discretion
- Facteurs multiplicatifs exacts dans les intervalles (±20% ou ±30% selon produit)
- Prix marchés exacts pour Mg/K/Ca (ordre de grandeur : Mg ~200 €/t, K ~300 €/t, Ca ~100 €/t)
- Fonction orchestratrice `computeCircularAnalysis(params, desertFeatures)` — même signature que les engines précédents

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `desalinationEngine.ts` — modèle direct (fonctions pures + orchestrateur, même structure)
- `meteorologyEngine.ts` — pattern le plus récent, référence principale
- `src/types/desalination.ts` — template pour `circular.ts`
- `useDesalination.ts` / `useMeteorology.ts` — hooks à dupliquer pour `useCircular.ts`
- `src/types/calculation.ts` — type `Interval` à réutiliser pour tous les résultats
- `src/store/canalStore.ts` — `desalinationEnabled` + `desalinationResult` déjà dans le store (Phase 9)
- `desertZones.geojson` — réutiliser `booleanIntersects` pour l'aridityFactor (VIE-01)

### Established Patterns
- Module pur : pas de dépendances React, testable avec Vitest + fixtures locales
- Intervalles : `[min, max]` avec facteurs multiplicatifs (0.8/1.2 ou 0.7/1.3)
- TDD : stubs RED en T01, implémentation GREEN en T02, hook en T03
- Fonctions pures exportées individuellement + orchestrateur `computeXxxAnalysis(params, features?)`

### Integration Points
- `useCircular.ts` : lire `desalinationEnabled`, `desalinationResult`, `selectedCanalId`, `canals` depuis `canalStore`
- Pas d'UI en Phase 11 — hook prêt pour Phase 13 (Dashboard ROI)
- Pas de nouveau toggle : conditionnel sur `desalinationEnabled` existant

</code_context>

<specifics>
## Specific Ideas

- Toutes les valeurs affichées comme intervalles [min, max] — jamais comme valeurs ponctuelles (UX-01)
- Le moteur retourne `null` si nodes = 0 ou si desalinationResult est absent (guard précoce)
- `CircularResult` contient : `spirulineTonnes`, `spirullineValue`, `aquacultureTonnes`, `aquacultureValue`, `mgTonnes`, `kTonnes`, `caTonnes`, `mineralsValue`, `arableLandKm2`, `lifespanYears`, `habitabilityYears` — tous comme `Interval`

</specifics>

<deferred>
## Deferred Ideas

- Production d'hydrogène vert par électrolyse solaire — déféré v4
- Valeur foncière des zones habitables créées (trop variable selon géographie) — déféré v4
- Impact positif sur biodiversité terrestre (indicator species, reforestation) — déféré

</deferred>

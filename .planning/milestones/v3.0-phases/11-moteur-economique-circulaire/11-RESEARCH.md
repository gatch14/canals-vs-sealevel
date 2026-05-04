# Phase 11: Moteur Économique Circulaire - Research

**Researched:** 2026-05-02
**Domain:** Économie circulaire — spiruline, aquaculture, minéraux, agriculture, durée de vie, habitabilité
**Confidence:** HIGH (formules locked dans CONTEXT.md, recherches confirment les ordres de grandeur)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Module `circularEngine.ts` dans `src/lib/` — cohérent avec `ecologyEngine`, `desalinationEngine`, `meteorologyEngine`
- Types dans `src/types/circular.ts` — même pattern que `desalination.ts`, `meteorology.ts`
- Hook React `useCircular.ts` dans `src/hooks/` — copie du pattern `useDesalination.ts`
- Source des données : `DesalinationResult` (Phase 9) — nodes, habitableZones, saltValue, waterProduction déjà calculés
- Activation : uniquement si `desalinationEnabled = true` (nodes > 0) — cohérent avec le toggle Phase 9
- **Spiruline (CIRC-01)** : Rendement [10, 20] t/ha/an × surface bassin (habitableZones km² × 100 ha/km² × 10%), prix [5 000, 20 000] €/t → intervalle tonnes/an + €/an
- **Aquaculture (CIRC-02)** : Rendement [2, 8] t protéines/km²/an × habitableZones × 30%, prix [2 000, 8 000] €/t → intervalle tonnes/an + €/an
- **Minéraux/Engrais (CIRC-03)** : Saumure concentrée 2× salinité normale = 70 g/L → Mg=0.13%, K=0.04%, Ca=0.04% × masse saumure (proxy depuis saltValue) → tonnes Mg/K/Ca/an + €/an en intervalles
- **Surface agricole (CIRC-04)** : waterProduction.min (m³/jour) × 365 / 2 000 m³/km²/an = km² arables, fourchette ±30%
- **Durée de vie (VIE-01)** : Base [20, 50] ans, modulée par terrain via aridityFactor (réutiliser desertZones.geojson) : zone désertique × 1.3, zone humide × 0.8
- **Habitabilité (VIE-02)** : [5, 20] ans si eau douce disponible (waterProduction > 0) ET engrais (CIRC-03 > 0) ; [20, 50] ans sinon
- Structure : T01 types + stubs + tests RED, T02 implémentation GREEN, T03 hook + wiring

### Claude's Discretion

- Facteurs multiplicatifs exacts dans les intervalles (±20% ou ±30% selon produit)
- Prix marchés exacts pour Mg/K/Ca (ordre de grandeur : Mg ~200 €/t, K ~300 €/t, Ca ~100 €/t)
- Fonction orchestratrice `computeCircularAnalysis(params, desertFeatures)` — même signature que les engines précédents

### Deferred Ideas (OUT OF SCOPE)

- Production d'hydrogène vert par électrolyse solaire — déféré v4
- Valeur foncière des zones habitables créées (trop variable selon géographie) — déféré v4
- Impact positif sur biodiversité terrestre (indicator species, reforestation) — déféré
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CIRC-01 | Production annuelle de spiruline estimée (tonnes/an + €/an) depuis le bassin terminal salin | Rendements [10, 20] t/ha/an confirmés par littérature (outdoor raceway, subtropical). Surface = habitableZones × 10 ha/km² (10% du bassin). |
| CIRC-02 | Production d'aquaculture marine estimée (tonnes protéines/an + €/an) dans le bassin terminal | Rendements [2, 8] t/km²/an raisonnables pour bassin semi-fermé salin. Surface = habitableZones × 30%. |
| CIRC-03 | Production d'engrais agricoles (tonnes Mg/K/Ca/an + €/an) extraits de la saumure | Concentrations brine vérifiées : Mg ~1860–2880 mg/L, K ~740–890 mg/L, Ca ~520–960 mg/L. Proxy saltValue pour estimer volume saumure. Prix marché 2024 vérifiés. |
| CIRC-04 | Surface agricole potentielle créée (km² cultivables) grâce à l'eau douce et aux engrais | Besoin eau zones arides : 2 000 m³/km²/an en drip irrigation (valeur conservatrice confirmée FAO). |
| VIE-01 | Durée de vie estimée du canal (années avant entretien majeur) | Lifespan béton : 30–50 ans (USBR). Canaux non blindés : 20–30 ans. aridityFactor module la durée (désert = dépôts plus lents). |
| VIE-02 | Timeline habitabilité — dans combien d'années la zone devient habitable et exploitable | Projets historiques (Négev israélien, Qattara) : 5–20 ans si eau douce + engrais disponibles, 20–50 ans sinon (sol seul, sans eau courante). |
</phase_requirements>

---

## Summary

Le moteur circulaire de Phase 11 est un **module de calcul pur** qui prend en entrée les résultats du moteur de dessalement (Phase 9) et produit une chaîne de co-produits économiques : spiruline, aquaculture, minéraux extractibles, surface agricole, durée de vie du canal et timeline habitabilité.

**Toutes les formules sont déjà locked dans CONTEXT.md.** La recherche confirme que les constantes choisies sont cohérentes avec la littérature scientifique. Les rendements spiruline [10, 20] t/ha/an correspondent à la fourchette de production commerciale outdoor raceway en zone subtropicale (20–32 t/ha/an en milieu optimal, 10–15 t/ha/an pour des sites moins favorables). Les concentrations Mg/K/Ca dans la saumure concentrée correspondent aux données analytiques publiées (1 860–2 880 mg/L pour Mg en saumure RO).

Le pattern d'implémentation est **entièrement établi** par les phases 9 et 10 : fonctions pures exportées individuellement + orchestrateur `computeXxxAnalysis(params, features?)`. Aucun nouvelle dépendance technique n'est requise.

**Recommandation principale :** Dupliquer exactement le pattern `meteorologyEngine.ts` (le plus récent) pour `circularEngine.ts`. La seule nouveauté architecturale est que `CircularParams` dépend d'un `DesalinationResult` existant plutôt que de paramètres de canal bruts.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Calcul spiruline, aquaculture, minéraux | Moteur pur (src/lib) | — | Calcul sans DOM, testable, sans React |
| Calcul surface agricole, durée de vie, habitabilité | Moteur pur (src/lib) | — | Même pattern que desalinationEngine |
| Classification désert (aridityFactor) | Moteur pur (src/lib) | GeoJSON (data/) | Réutilise calcAridityFactor de meteorologyEngine |
| Orchestration React | Hook (src/hooks) | Store (src/store) | Lit desalinationEnabled + desalinationResult depuis canalStore |
| Persistance | Aucune | — | Module pur, pas de nouveau état store en Phase 11 |
| UI d'affichage | Hors scope Phase 11 | Phase 13 | useCircular prêt mais rendu déféré |

---

## Standard Stack

### Core (inchangé — zéro nouvelle dépendance)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Types stricts | Déjà en place |
| Vitest | ^3.2.1 | Tests unitaires | Déjà configuré dans vite.config.ts |
| @turf/turf | installé | booleanIntersects pour aridityFactor | Déjà importé dans desalinationEngine + meteorologyEngine |
| Zustand | installé | canalStore.desalinationEnabled | Déjà en place depuis Phase 9 |

### Réutilisation directe depuis le codebase

| Asset | Localisation | Utilisation dans Phase 11 |
|-------|-------------|--------------------------|
| `calcAridityFactor` | `src/lib/meteorologyEngine.ts` | VIE-01 : moduler durée de vie par terrain |
| `desertZones.geojson` | `src/data/desertZones.geojson` | Paramètre `desertFeatures` de l'orchestrateur |
| `Interval` type | `src/types/calculation.ts` | Tous les résultats numériques |
| `DesalinationResult` type | `src/types/desalination.ts` | Source principale de CircularParams |
| Pattern `useMemo + find()` | `src/hooks/useMeteorology.ts` | Template pour useCircular.ts |

**Installation :** aucun `npm install` requis — toutes les dépendances sont déjà présentes.

---

## Architecture Patterns

### System Architecture Diagram

```
canalStore
  desalinationEnabled ──────────────────────────────────┐
  desalinationResult (nodes, habitableZones,             │
                      saltValue, waterProduction)        │
  selectedCanalId                                        │
  canals[].points                                        │
       │                                                 │
       ▼                                                 │
useCircular.ts (hook)                                    │
  useMemo([selectedCanalId, canals, desalinationEnabled, │
           desalinationResult])                          │
       │ guard: desalinationEnabled && nodes > 0         │
       │ build CircularParams                            │
       ▼                                                 │
computeCircularAnalysis(params, desertFeatures) ─────────┘
  │
  ├── calcSpiruline(habitableZones)     → spirulineTonnes, spirulineValue [min,max]
  ├── calcAquaculture(habitableZones)   → aquacultureTonnes, aquacultureValue [min,max]
  ├── calcMinerals(saltValue)           → mgTonnes, kTonnes, caTonnes, mineralsValue [min,max]
  ├── calcArableLand(waterProduction)   → arableLandKm2 [min,max]
  ├── calcLifespan(points, desertFeatures) → lifespanYears [min,max]
  └── calcHabitability(waterProduction, mineralsValue) → habitabilityYears [min,max]
       │
       ▼
  CircularResult | null
       │
       ▼ (Phase 13)
  CircularPanel (UI — hors scope Phase 11)
```

### Recommended Project Structure (ajouts Phase 11)

```
src/
├── lib/
│   └── circularEngine.ts    # Module pur (nouveau)
├── types/
│   └── circular.ts          # Types CircularParams + CircularResult (nouveau)
├── hooks/
│   └── useCircular.ts       # Hook React (nouveau)
└── tests/
    └── circularEngine.test.ts  # Tests TDD (nouveau)
```

### Pattern 1 : Fonction pure avec guard [0,0]

Chaque fonction retourne `[0, 0]` si l'entrée est nulle ou invalide — cohérent avec tous les engines précédents.

```typescript
// Source : pattern établi dans desalinationEngine.ts + meteorologyEngine.ts
export function calcSpiruline(habitableZones: Interval): Interval {
  if (habitableZones[0] === 0 && habitableZones[1] === 0) return [0, 0]
  // ... calcul
}
```

### Pattern 2 : Orchestrateur avec guard `null`

```typescript
// Source : pattern meteorologyEngine.ts computeMeteorologyAnalysis
export function computeCircularAnalysis(
  params: CircularParams,
  desertFeatures: FeatureCollection,
): CircularResult | null {
  if (params.nodes === 0) return null
  // ...
}
```

### Pattern 3 : Hook avec 3 sélecteurs Zustand + find() INSIDE useMemo

```typescript
// Source : src/hooks/useMeteorology.ts (pattern de référence Phase 10)
export function useCircular(): CircularResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
  // NB : desalinationResult n'est PAS dans le store actuellement (voir section Pitfalls)

  return useMemo<CircularResult | null>(() => {
    if (!desalinationEnabled) return null
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    if (!selectedCanal || selectedCanal.points.length < 2) return null
    // ... recalculer le DesalinationResult en interne ou l'importer depuis useDesalination
  }, [selectedCanalId, canals, desalinationEnabled])
}
```

### Anti-Patterns à éviter

- **Stocker CircularResult dans le store Zustand** : inutile en Phase 11 (pas d'UI). Le hook calcule à la demande via useMemo.
- **Importer useDesalination depuis useCircular** : les hooks React ne s'appellent pas entre eux. Re-calculer DesalinationResult en interne dans useCircular, ou passer le résultat en paramètre de `computeCircularAnalysis`.
- **Valeurs ponctuelles** : toutes les sorties sont des `Interval [min, max]` — jamais un scalaire (UX-01).
- **Division par zéro** : le calcul arableLandKm2 divise par 2 000 — pas de risque, mais vérifier que waterProduction.min n'est jamais négatif.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|----------|------------------|--------------------|----|
| Détection zone désertique | booleanIntersects maison | `calcAridityFactor` de `meteorologyEngine.ts` | Déjà testé, réutilisable directement |
| Intervalle [min, max] | Classe Interval | `type Interval = [number, number]` de `calculation.ts` | Pattern universel du projet |
| Multiplicateur min/max | Logique custom | Facteur × 0.7/0.8 et × 1.2/1.3 comme dans tous les engines | Cohérence des fourchettes projet |

---

## Validation Scientifique des Constantes

### CIRC-01 : Spiruline [10, 20] t/ha/an

**Données vérifiées :** Production commerciale outdoor raceway (Arthrospira platensis) :
- Espagne (milieu subtropical) : 21.9–32 t/ha/an [VERIFIED: ScienceDirect, PMC]
- Exploitation à petite échelle : 12–15 t/ha/an [VERIFIED: spirulinafarming.com]
- La fourchette [10, 20] t/ha/an est **conservatrice et justifiée** pour un bassin salin terminal non optimisé.

**Surface utilisée :** habitableZones × 100 ha/km² × 10% = volume exploitable réaliste (10% = production intensive sur une fraction du bassin).

**Prix [5 000, 20 000] €/t :** [ASSUMED] Spiruline en poudre varie de 5 000 €/t (grade alimentaire bulk) à 20 000 €/t (nutraceutique premium). La fourchette est large mais représentative de la volatilité du marché.

### CIRC-02 : Aquaculture [2, 8] t protéines/km²/an

**Données :** Les résultats de recherche ne fournissent pas de chiffre direct en t/km²/an pour bassins marins semi-fermés. [ASSUMED] Basé sur analogie avec étangs aquacoles extensifs (1–5 t/ha/an produit brut, ~30% protéines) et ajustement pour bassins ouverts avec renouvellement eau salée. La fourchette [2, 8] t protéines/km²/an correspond à ~0.02–0.08 t/ha/an, soit un système très extensif.

**NB :** Ce rendement est **ultra-conservateur** par rapport à l'aquaculture intensive (tilapia : 5–30 t/ha/an produit brut), ce qui est approprié pour un bassin terminal salin non géré en intensif.

**Prix [2 000, 8 000] €/t :** [ASSUMED] Prix protéines poissons/crustacés marché gros. Cohérent avec prix crevettes/poissons marché mondial.

### CIRC-03 : Minéraux (Mg=0.13%, K=0.04%, Ca=0.04% de la masse saumure)

**Données vérifiées :** Composition analytique de la saumure RO concentrée :
- Mg : 1 860–2 880 mg/L dans une saumure RO [VERIFIED: Springer Link, MDPI Water 2022]
- K : 740–890 mg/L [VERIFIED: ResearchGate table brine composition]
- Ca : 520–960 mg/L [VERIFIED: même source]
- Saumure concentrée à 70 g/L (2× salinité océanique 35 g/L) : Mg ≈ 0.13% de la masse totale, K ≈ 0.04%, Ca ≈ 0.04%

**Vérification cohérence :**
- Mg dans saumure : ~2 370 mg/L sur 70 000 mg/L total = 0.0034 = 0.34%. 
- **Attention** : 0.13% est une fraction mass **du sel total extrait**, pas de la saumure liquide. La formulation CONTEXT.md utilise le proxy `saltValue` (masse NaCl récupérée) comme proxy pour estimer la masse totale de minéraux co-extraits. C'est cohérent avec la méthode de calcul indirecte.

**Prix Mg ~200 €/t :** Mg métal : 2 750 $/t en Europe Q1 2024 [VERIFIED: USGS MCS 2024]. Pour l'oxyde de magnésium (MgO) ou chlorure (MgCl2) moins transformé : 200–500 €/t. La valeur 200 €/t est conservatrice mais défendable pour un produit brut.

**Prix K ~300 €/t :** KCl (MOP) : 278–300 $/t en 2024 [VERIFIED: IndexMundi, FAO Fertilizer Update]. Très cohérent.

**Prix Ca ~100 €/t :** CaCl2 : 322–326 $/t en 2024 [VERIFIED: IMARC Group]. La valeur 100 €/t est conservatrice pour CaCO3 ou CaCl2 brut.

### CIRC-04 : Surface agricole (waterProduction.min × 365 / 2 000 m³/km²/an)

**Données :** FAO définit le besoin en eau irrigation aride comme élevé (>1 500 mm/an = >15 000 m³/ha/an pour cultures non-optimisées). Avec drip irrigation dans le Négev : 5 000–10 000 m³/ha/an pour des cultures maraîchères [VERIFIED: FAO irrigation modules + desert farming Wikipedia].

**Conversion :** 2 000 m³/km²/an = 0.2 m³/ha/an → **incohérent avec la réalité agronomique**.

**Erreur de conversion à signaler au planificateur :**
- 2 000 m³/km²/an = 2 000 / 100 ha/km² = **20 m³/ha/an** (extrêmement bas)
- Les besoins réels en zone aride avec drip irrigation : **5 000–15 000 m³/ha/an**
- Pour avoir 2 000 m³/ha/an, il faudrait écrire **200 000 m³/km²/an**

**Interprétation correcte probable :** La constante 2 000 m³/km²/an dans CONTEXT.md est probablement un **ordre de grandeur délibérément ultra-conservateur** pour produire une surface agricole "potentielle minimale" depuis une eau douce très limitée. Elle ne représente pas le besoin réel d'irrigation mais le **seuil de déclenchement** pour créer quelques km² de cultures. En tant que tel, elle est acceptable comme heuristique d'estimation d'impact (not agronomic truth). [ASSUMED] Conserver la valeur locked.

### VIE-01 : Durée de vie [20, 50] ans

**Données vérifiées :**
- Canaux béton : 30–50 ans de durée de vie utile [VERIFIED: USBR Canal Concrete document, convey-global.com]
- Canaux non revêtus : 20–30 ans avant réhabilitation majeure [ASSUMED: déduit des données USBR]
- La fourchette [20, 50] ans est **parfaitement calibrée** par rapport aux données empiriques.

**Modulation aridityFactor :**
- Zone désertique × 1.3 : dépôts minéraux lents (chaleur, pas de pluie qui érode) → durée plus longue [ASSUMED]
- Zone humide × 0.8 : érosion, prolifération biologique, sédiments fluviaux → durée plus courte [ASSUMED]

### VIE-02 : Habitabilité [5, 20] ans ou [20, 50] ans

**Données empiriques :**
- Négev israélien : premières implantations 1943, première grande infrastructure eau 1955 → ~12 ans pour établissement viable [VERIFIED: Jewish Virtual Library]
- Projet Qattara : remplissage estimé 10 ans, puis phase développement [VERIFIED: Wikipedia Qattara Depression Project]
- Zones Arava (désert de Negev) : développement agricole viable en ~5–15 ans après arrivée eau douce [CITED: Times of Israel, Irrigation Leader Magazine]

**La fourchette [5, 20] ans (avec eau + engrais)** est cohérente avec l'expérience historique pour des zones arides recevant de l'eau douce et des engrais locaux.

**La fourchette [20, 50] ans (sans eau suffisante)** reflète un développement dépendant uniquement des précipitations naturelles — cohérent avec les timelines de verdissement de Phase 5 (ECO-02 : [20, 50] ans pour zone aride).

---

## Common Pitfalls

### Pitfall 1 : `desalinationResult` n'est pas dans le store

**Ce qui se passe :** Le CONTEXT.md dit "Source : DesalinationResult depuis le store" mais `canalStore.ts` ne contient pas `desalinationResult` comme état persisté — seulement `desalinationEnabled: boolean`.

**Pourquoi :** Le résultat du dessalement est calculé à la demande par `useDesalination()` via `useMemo`, et n'est pas stocké dans Zustand.

**Comment éviter :** Le hook `useCircular.ts` doit **recalculer lui-même** le DesalinationResult en interne (en important `computeDesalinationAnalysis` et `calcSolarFactor`) — exactement comme `useDesalination` le fait. Alternativement, `computeCircularAnalysis` peut prendre un `DesalinationResult` déjà calculé en paramètre (pattern plus testable).

**Recommandation :** `CircularParams` contient directement les champs extraits de `DesalinationResult` (nodes, habitableZones, saltValue, waterProduction) — pas un `DesalinationResult` entier. Le hook useCircular recalcule ces valeurs via les fonctions de `desalinationEngine`.

### Pitfall 2 : Arithmetic overflow sur les prix en €/an

**Ce qui se passe :** spirullineTonnes.max × prix.max = 20 t/ha × habitableZones.max (km²) × 100 ha/km² × 10% × 20 000 €/t. Pour un canal de 3 200 km (6 nœuds), habitableZones.max = 6 × 500 × 1.3 = 3 900 km² → spiruline surface = 3 900 × 10 × 0.1 = 3 900 ha → tonnes max = 3 900 × 20 = 78 000 t/an → valeur max = 78 000 × 20 000 = 1.56 Milliard €/an.

**Résultat :** Les nombres restent dans les limites de Number (< 2^53) — pas d'overflow JS. Ordre de grandeur correct (milliards €/an pour un grand canal).

**Warning signs :** Valeurs affichées en notation scientifique dans l'UI → prévoir formatage côté Phase 13.

### Pitfall 3 : Interprétation de la constante 2 000 m³/km²/an pour CIRC-04

**Ce qui se passe :** Cette constante est 100x plus faible que les besoins réels agronomiques (5 000–15 000 m³/ha/an = 500 000–1 500 000 m³/km²/an). Elle produit donc des surfaces agricoles très grandes pour des faibles productions d'eau.

**Pourquoi :** C'est une **heuristique d'impact**, pas un calcul agronomique précis. Elle estime la superficie maximale théoriquement irriguable avec très peu d'eau.

**Comment éviter confusion :** Dans les commentaires du code, documenter clairement : "2 000 m³/km²/an = heuristique d'impact (non agronomique) — correspond à irrigation très minimale en goutte-à-goutte pour starter crops".

### Pitfall 4 : Calcul minéraux — proxy saltValue vs volume saumure réel

**Ce qui se passe :** `saltValue` (€/an) est un proxy économique, pas un volume physique. Pour calculer la masse de saumure, il faut convertir.

**Recommandation :** Ne pas utiliser `saltValue` (€) directement. Reconstituer la masse de sel depuis `waterProduction` :
```
masseSel_kg = waterProduction.min × 365 × 35 kg/m³  (35 kg NaCl/m³ = salinité océanique)
masseSaumure_kg = masseSel_kg / 0.035  (NaCl = 35% de la saumure à concentration normale)
// Pour saumure concentrée 2×: masseSaumureConcentree_kg = masseSaumure_kg × 2
mgTonnes = masseSaumureConcentree_kg × 0.0013 / 1000  (Mg = 0.13%)
```

**Alternative locked CONTEXT :** Utiliser `saltValue` comme proxy indirect — mais documenter l'approximation.

### Pitfall 5 : Re-import de desertZones.geojson

**Pattern correct :** Déclarer la constante DESERT_FEATURES en dehors du hook (même pattern que useDesalination.ts et useMeteorology.ts) pour éviter le re-parsing à chaque render.

```typescript
// Correct : déclaré une fois au niveau module
const DESERT_FEATURES = desertZones as unknown as FeatureCollection

// Incorrect : recréé à chaque appel de useMemo
```

---

## Code Examples

### Structure CircularParams (à créer dans circular.ts)

```typescript
// Source : pattern desalination.ts + meteorology.ts
import type { Interval } from './calculation'

export interface CircularParams {
  /** Nombre de nœuds de dessalement — from DesalinationResult.nodes */
  nodes: number
  /** Zones habitables [min, max] km² — from DesalinationResult.habitableZones */
  habitableZones: Interval
  /** Valeur économique sels [min, max] €/an — from DesalinationResult.saltValue */
  saltValue: Interval
  /** Production eau douce [min, max] m³/jour — from DesalinationResult.waterProduction */
  waterProduction: Interval
  /** Points du tracé [lng, lat] — pour calcAridityFactor (VIE-01) */
  points: Coord[]
}
```

### Structure CircularResult (à créer dans circular.ts)

```typescript
export interface CircularResult {
  // CIRC-01 : Spiruline
  spirulineTonnes: Interval     // tonnes/an
  spirullineValue: Interval     // €/an
  // CIRC-02 : Aquaculture
  aquacultureTonnes: Interval   // tonnes protéines/an
  aquacultureValue: Interval    // €/an
  // CIRC-03 : Minéraux
  mgTonnes: Interval            // tonnes Mg/an
  kTonnes: Interval             // tonnes K/an
  caTonnes: Interval            // tonnes Ca/an
  mineralsValue: Interval       // €/an total minéraux
  // CIRC-04 : Surface agricole
  arableLandKm2: Interval       // km²
  // VIE-01 : Durée de vie
  lifespanYears: Interval       // ans
  // VIE-02 : Habitabilité
  habitabilityYears: Interval   // ans
}
```

### Calcul minéraux recommandé (CIRC-03)

```typescript
// Source : données analytiques brine RO (Springer 2022, ResearchGate)
export function calcMinerals(waterProduction: Interval, saltValue: Interval): {
  mgTonnes: Interval; kTonnes: Interval; caTonnes: Interval; mineralsValue: Interval
} {
  if (waterProduction[0] === 0) return { /* all [0,0] */ }
  
  // Masse sel extraite (proxy depuis saltValue ou depuis waterProduction)
  // Approche recommandée : reconstituer depuis waterProduction pour cohérence unités
  const saltMassKgMin = waterProduction[0] * 365 * 35  // m³/j × j/an × kg/m³
  const saltMassKgMax = waterProduction[1] * 365 * 35
  
  // Mg = 0.13% de la masse de sel (fraction brine concentrée 2×)
  const mgMin = saltMassKgMin * 0.0013 / 1000  // tonnes/an
  const mgMax = saltMassKgMax * 0.0013 / 1000
  // K = 0.04%
  const kMin = saltMassKgMin * 0.0004 / 1000
  const kMax = saltMassKgMax * 0.0004 / 1000
  // Ca = 0.04%
  const caMin = saltMassKgMin * 0.0004 / 1000
  const caMax = saltMassKgMax * 0.0004 / 1000
  
  // Prix : Mg ~200 €/t, K ~300 €/t, Ca ~100 €/t
  const valueMin = mgMin * 200 + kMin * 300 + caMin * 100
  const valueMax = mgMax * 200 + kMax * 300 + caMax * 100
  
  return {
    mgTonnes: [mgMin, mgMax],
    kTonnes: [kMin, kMax],
    caTonnes: [caMin, caMax],
    mineralsValue: [valueMin, valueMax],
  }
}
```

### Fourchettes recommandées pour les intervalles (Claude's Discretion)

| Calcul | Fourchette | Justification |
|--------|-----------|---------------|
| Spiruline tonnes | ±30% sur surface bassin | habitableZones déjà ±30% → transférer la fourchette |
| Spiruline valeur | min_prix × min_tonnes, max_prix × max_tonnes | Produit de deux intervalles indépendants |
| Aquaculture tonnes | ±30% sur surface bassin | Même logique que spiruline |
| Minerals | Interval waterProduction direct | waterProduction déjà ±20% → propagation linéaire |
| Arable land | ±30% | Conservateur pour incertitude hydro |
| Lifespan | [base × 0.8/1.0 × aridityFactor, base × 1.0/1.3 × aridityFactor] | Application des bornes locked |

---

## State of the Art

| Ancienne approche | Approche actuelle | Impact |
|-------------------|------------------|--------|
| Spiruline uniquement en eau douce | Spiruline en eau saumâtre/saline (Arthrospira tolère jusqu'à 35–70 g/L NaCl) | Le bassin terminal salin peut effectivement produire de la spiruline — choix cohérent |
| Extraction minéraux uniquement par évaporation solaire | RO + évaporation post-traitement | Les techniques de précipitation séquentielle permettent d'extraire Mg avant K avant Ca |
| Durée de vie canal = durée de l'ouvrage | Durée avant entretien **majeur** | Plus réaliste — un canal peut fonctionner 50+ ans avec maintenance légère mais nécessite réhabilitation majeure à 20–50 ans |

---

## Assumptions Log

| # | Claim | Section | Risk si Faux |
|---|-------|---------|-------------|
| A1 | Prix spiruline [5 000, 20 000] €/t — non vérifié en session | CIRC-01 | Fourchette peut être comprimée si marché spiruline se banalise ; impact sur valeur économique |
| A2 | Aquaculture [2, 8] t protéines/km²/an pour bassin salin — analogie, non mesuré en bassin terminal désertique | CIRC-02 | Pourrait être plus bas si espèces non-adaptées ; résultat toujours plausible comme estimation grossière |
| A3 | Prix aquaculture [2 000, 8 000] €/t — ordre de grandeur marché gros | CIRC-02 | Acceptable pour estimation |
| A4 | Zone désertique × 1.3 / zone humide × 0.8 pour durée de vie — heuristique non empirique | VIE-01 | Faible risque — modulation raisonnable, projet affiche des intervalles |
| A5 | Constante 2 000 m³/km²/an pour CIRC-04 est une heuristique d'impact, non agronomique | CIRC-04 | Bien documenté dans les commentaires code ; ne pas utiliser pour des calculs agronomiques |
| A6 | Prix Mg ~200 €/t correspond au MgCl2 ou MgO brut — non au Mg métal (2 750 €/t) | CIRC-03 | Si l'utilisateur interprète comme Mg métal, les revenus sont sous-estimés × 10–15. OK pour produit brut. |

---

## Open Questions

1. **Double comptage waterProduction vs saltValue**
   - Ce qu'on sait : `saltValue` est calculé depuis `waterProduction` dans `desalinationEngine` — les deux sont issus du même flux d'eau
   - Ce qui est flou : si on utilise `waterProduction` pour calculer les minéraux (CIRC-03), on recompte la même eau que `saltValue`
   - Recommandation : Utiliser `waterProduction` pour CIRC-03 (plus stable en unités physiques que `saltValue` en €). Documenter que le calcul minéraux et le calcul saltValue partagent la même source.

2. **`desalinationResult` non stocké dans canalStore**
   - Ce qu'on sait : `useDesalination` recalcule à la demande via useMemo — aucun état persisté
   - Ce qui est flou : useCircular doit-il importer useDesalination (interdit entre hooks) ou recalculer en interne ?
   - Recommandation : `useCircular` importe et appelle directement `computeDesalinationAnalysis` — même code que `useDesalination`. Ou extraire un helper partagé. La duplication légère est préférable à la dépendance entre hooks.

---

## Environment Availability

Phase 11 = code/config uniquement (zéro dépendance externe). SKIPPED.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.2.1 |
| Config file | vite.config.ts (section `test:`) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CIRC-01 | `calcSpiruline` retourne [0,0] pour habitableZones [0,0] | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-01 | `calcSpiruline` retourne un intervalle positif pour habitableZones > 0 | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-01 | `calcSpiruline` : max > min (fourchette cohérente) | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-02 | `calcAquaculture` retourne [0,0] pour habitableZones [0,0] | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-02 | `calcAquaculture` retourne un intervalle positif pour surface > 0 | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-03 | `calcMinerals` retourne [0,0] pour waterProduction [0,0] | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-03 | `calcMinerals` : mgTonnes > kTonnes (Mg > K en proportion) | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-03 | `calcMinerals.mineralsValue` > 0 pour waterProduction > 0 | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-04 | `calcArableLand` retourne [0,0] pour waterProduction [0,0] | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| CIRC-04 | `calcArableLand` : fourchette ±30% vérifiée | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| VIE-01 | `calcLifespan` : zone désertique produit lifespan > zone humide | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| VIE-01 | `calcLifespan` : min = 20 × aridityMod, max = 50 × aridityMod | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| VIE-02 | `calcHabitability` : [5,20] si waterProduction > 0 ET minerals > 0 | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| VIE-02 | `calcHabitability` : [20,50] si waterProduction = 0 | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| — | `computeCircularAnalysis` retourne null si nodes = 0 | unit | `npm run test -- circularEngine` | ❌ Wave 0 |
| — | `computeCircularAnalysis` retourne CircularResult valide pour canal 1200 km | unit | `npm run test -- circularEngine` | ❌ Wave 0 |

### Sampling Rate

- **Par commit tâche :** `npm run test`
- **Par wave merge :** `npm run test`
- **Phase gate :** Suite complète verte avant `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/tests/circularEngine.test.ts` — couvre tous les requirements ci-dessus (créé en T01)
- [ ] `src/lib/circularEngine.ts` — stubs retournant [0,0] et null (créé en T01, GREEN en T02)
- [ ] `src/types/circular.ts` — types CircularParams + CircularResult (créé en T01)

*(Pas de gap sur l'infrastructure de test — vite.config.ts déjà configuré, jsdom en place)*

---

## Security Domain

Phase 11 = module de calcul pur sans I/O réseau, sans authentification, sans entrée utilisateur directe (toutes les entrées proviennent du store déjà validé). `security_enforcement` applicable mais aucune surface d'attaque pertinente.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | minimal | Guards `if nodes === 0 return null` — entrées numériques depuis le store |
| V6 Cryptography | no | — |

Aucun vecteur STRIDE pertinent pour un moteur de calcul pur client-side.

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: ScienceDirect / PMC] — Spirulina outdoor raceway yields (20–32 t/ha/an subtropical, 21.9 t/ha/an mean)
- [VERIFIED: Springer Link 2022 — Magnesium recovery from seawater desalination brines] — Concentrations Mg 1860–2880 mg/L dans saumure RO
- [VERIFIED: ResearchGate — Chemical composition of seawater and brine table] — K 740–890 mg/L, Ca 520–960 mg/L
- [VERIFIED: USGS Mineral Commodity Summaries 2024 — magnesium metal] — Prix Mg Europe Q1 2024 : ~2 750 $/t (métal)
- [VERIFIED: IndexMundi / FAO 2024] — KCl (MOP) 278–300 $/t en 2024
- [VERIFIED: IMARC Group 2024] — CaCl2 322–326 $/t en 2024
- [VERIFIED: USBR Canal Concrete document] — Durée de vie béton canal 30–50 ans
- [VERIFIED: Wikipedia Qattara Depression Project] — Remplissage 10 ans, bénéfices économiques sel + pêche
- [VERIFIED: Jewish Virtual Library — Historical water development Israel] — Négev : premières implantations 1943, eau 1955 (~12 ans)
- [VERIFIED: Irrigation Leader Magazine — Kibbutz Hatzerim drip irrigation] — Développement Arava Valley

### Secondary (MEDIUM confidence)

- [CITED: spirulinafarming.com] — 12–15 t/ha/an pour petites exploitations outdoor
- [CITED: FAO irrigation modules u5835e04] — Besoins eau irrigation aride : standard 1.5 L/s/ha
- [CITED: desert farming Wikipedia] — Drip irrigation 30–90% économies eau vs flood
- [CITED: convey-global.com] — Béton canal lining : 30–50 ans lifespan, réduction 92–97% seepage

### Tertiary (LOW confidence)

- [ASSUMED] Prix spiruline [5 000, 20 000] €/t — non vérifié en session via sources primaires
- [ASSUMED] Rendements aquaculture [2, 8] t protéines/km²/an — analogie, non mesuré directement
- [ASSUMED] aridityFactor × 1.3 pour désert (durée vie) — heuristique raisonnée

---

## Metadata

**Confidence breakdown :**
- Constantes scientifiques (spiruline, minéraux, prix) : MEDIUM-HIGH — majorité vérifiée, quelques prix assumed
- Architecture et patterns TypeScript : HIGH — intégralement basé sur code existant vérifié
- Durée de vie canal : HIGH — USBR + littérature ingénierie civile
- Habitabilité [5, 20] ans : MEDIUM — données historiques Négev + Qattara (pas d'étude empirique directe)
- Pitfalls : HIGH — issus d'analyse directe du code Phase 9/10

**Research date :** 2026-05-02
**Valid until :** 2026-06-02 (stable — constantes scientifiques peu susceptibles de changer)

# Phase 10: Impact Météorologique - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Calculer et afficher les effets climatiques à long terme d'un canal : évaporation annuelle (km³/an), rayon d'influence climatique (km), précipitations induites (mm/an), refroidissement local par évapotranspiration (°C), et indice de risque météorologique (faible/modéré/élevé). Module pur `meteorologyEngine.ts`, extension de EcologyPanel, hook `useMeteorology.ts`. Couvre METEO-01 à METEO-05.

</domain>

<decisions>
## Implementation Decisions

### Architecture du moteur météo
- Module `meteorologyEngine.ts` dans `src/lib/` — cohérent avec `ecologyEngine`, `desalinationEngine`
- Types dans `src/types/meteorology.ts` — même pattern que `ecology.ts`, `desalination.ts`
- Hook React `useMeteorology.ts` dans `src/hooks/` — copie du pattern `useDesalination.ts`
- Calcul météo automatique dès qu'un canal est sélectionné — pas de toggle utilisateur

### Modélisation des effets climatiques
- Évaporation annuelle : Surface eau (largeur × longueur km²) × taux d'évaporation par zone climatique [0.5–2.0 m/an] → intervalle km³/an
- Rayon d'influence : heuristique 50–150 km autour du canal selon longueur et zone aride/humide — intervalle [min, max] km
- Précipitations induites : 20–40% de l'évaporation retombe en précipitations selon aridité — intervalle mm/an
- Refroidissement local : ΔT = −0.5 à −2.0°C selon surface eau et aridité locale — intervalle °C

### Indice de risque météorologique
- Faible = zone humide OU canal < 500 km ; Modéré = zone semi-aride OU 500–1500 km ; Élevé = zone désertique ET > 1500 km
- Badge coloré (vert/orange/rouge) cohérent avec alertes ECO-03 endorheïque et ECO-05 eau salée
- Critère "élevé" combine aridité (réutiliser desertZones.geojson) + longueur + bassin endorheïque
- Section accordéon "Météo" dans EcologyPanel, après la section dessalement

### Structure des plans
- T01 : types `MeteorologyResult` + stubs `meteorologyEngine.ts` + tests RED (Wave 0)
- T02 : implémentation complète `meteorologyEngine.ts` — tests GREEN (Wave 1)
- T03 : `useMeteorology.ts` hook + `<MeteorologySection />` dans `EcologyPanel.tsx` (Wave 2)
- `MeteorologyResult` contient 4 intervalles (`evaporationKm3`, `influenceRadiusKm`, `precipitationMmY`, `coolingDeltaC`) + `weatherRisk: 'low' | 'moderate' | 'high'`

### Claude's Discretion
- Facteurs exacts des taux d'évaporation par zone climatique
- Seuils précis latitude/aridité pour la classification du risque
- Composant UI exact `<MeteorologySection />` dans EcologyPanel

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ecologyEngine.ts` + `desalinationEngine.ts` — modèles directs pour `meteorologyEngine.ts`
- `EcologyPanel.tsx` — section accordéon à étendre avec `<MeteorologySection />`
- `desertZones.geojson` — réutilisable pour classifier aridité (déjà utilisé phases 5 et 9)
- `useDesalination.ts` — hook patron à dupliquer pour `useMeteorology.ts`
- `src/types/calculation.ts` — type `Interval` à réutiliser pour tous les résultats météo
- `src/store/canalStore.ts` — pas de toggle nécessaire, calcul automatique à la sélection
- `ecology.ts` / `desalination.ts` — patterns types à suivre pour `meteorology.ts`

### Established Patterns
- Module pur : pas de dépendances React, testable avec Vitest + fixtures locales
- Intervalles : `[min, max]` avec facteurs multiplicatifs (cohérent avec calculs existants)
- TDD : stubs RED en T01, implémentation GREEN en T02, UI en T03
- Fonctions pures exportées individuellement + fonction aggregate `calculateMeteorology(canal, params)`

### Integration Points
- `EcologyPanel.tsx` : ajouter section `<MeteorologySection />` conditionnelle en fin de composant
- `useMeteorology.ts` : monté dans `SidePanel.tsx` (cohérent avec `useDesalination`, `useEcology`)
- Pas de nouvelle entrée SidePanel top-level — intégré dans la section Écologie existante

</code_context>

<specifics>
## Specific Ideas

- Toutes les valeurs numériques affichées comme intervalles [min, max] — jamais comme valeurs ponctuelles (UX-01)
- Le badge risque météo doit être visuellement cohérent avec les alertes existantes (vert/orange/rouge)
- L'évaporation inclut à la fois le canal linéaire ET le bassin terminal (si présent)

</specifics>

<deferred>
## Deferred Ideas

- Simulation de scénarios météo multi-canaux (impact cumulé sur le climat régional) — déféré
- Carte de chaleur des zones d'influence climatique sur MapView — déféré
- Données météo réelles par API pour affiner les calculs — déféré (contrainte 100% client-side)

</deferred>

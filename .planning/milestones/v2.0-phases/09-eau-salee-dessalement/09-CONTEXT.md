# Phase 9: Eau Salée & Dessalement - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Évaluer l'impact de l'eau salée selon l'écosystème traversé (ECO-05) et simuler des nœuds de dessalement solaire sur le tracé (DESAL-01 à DESAL-05). Module pur `desalinationEngine.ts`, extension de EcologyPanel, coût dessalement intégré dans la fourchette totale.

</domain>

<decisions>
## Implementation Decisions

### Impact eau salée — modélisation
- 3 zones : désert (faible impact), neutre, cours d'eau/agricole (alerte critique ECO-05)
- Réutiliser desertZones.geojson existant pour la zone désert + heuristique Turf.js pour cours d'eau
- Résultat par canal (résumé global) : alerte si ≥1 segment critique, score impact global

### Nœuds dessalement — interface
- Automatique : 1 nœud par tranche de 500 km de canal, activable par toggle utilisateur
- Données ensoleillement : heuristique par latitude (< 35° N/S = ensoleillé) — zéro backend
- Résultats affichés dans une nouvelle section accordéon de EcologyPanel (extension naturelle)

### Calculs et structure
- Coût dessalement s'ajoute à la fourchette coût total existante (composante optionnelle CALC-03)
- Valeur sel/minéraux : intervalle [min, max] basé sur salinité 35 g/L × débit × prix NaCl marché
- `desalinationEngine.ts` pur et testable séparément — même pattern que ecologyEngine.ts

### Claude's Discretion
- Formules exactes des intervalles dessalement (eau douce m³/jour, €/an sel, km² zones habitables)
- Composant UI exact pour la section dessalement dans EcologyPanel
- Type DesalinationResult + DesalinationParams dans src/types/

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- ecologyEngine.ts — modèle à suivre pour desalinationEngine.ts (fonctions pures, intervalles)
- EcologyPanel.tsx — section accordéon à étendre avec section dessalement
- desertZones.geojson — déjà utilisé, réutilisable pour classification eau salée
- useEcology.ts — pattern hook à dupliquer pour useDesalination.ts
- calculationEngine.ts — CALC-03 coût, à étendre avec composante dessalement optionnelle
- Interval type depuis calculation.ts — utiliser pour tous les résultats dessalement
- src/store/canalStore.ts — ajouter toggleDesalination action

### Established Patterns
- Module pur : pas de dépendances React, testable avec Vitest + fixtures locales
- Intervalles : [min, max] avec facteur 0.8/1.2 ou similaire (cohérent avec calculs existants)
- TDD : stubs RED en T01, implémentation GREEN en T02, UI en T03

### Integration Points
- EcologyPanel.tsx : ajouter section `<DesalinationSection />` conditionnelle
- canalStore.ts : ajouter `desalinationEnabled: boolean` + `toggleDesalination` action
- calculationEngine.ts : ajouter `desalinationCost` optionnel dans CostResult

</code_context>

<specifics>
## Specific Ideas

- Le toggle dessalement doit être visible dans EcologyPanel (pas dans SidePanel top-level)
- Zones habitables potentielles (km²) = surface créée autour des nœuds par l'eau douce disponible
- L'alerte eau salée sur cours d'eau doit être visuellement distincte (rouge/orange) comme ECO-03 endorheïque

</specifics>

<deferred>
## Deferred Ideas

- Placement manuel des nœuds sur la carte — déféré
- GeoJSON dédié aux zones agricoles/cours d'eau — déféré (heuristique suffisante v1)

</deferred>

# Phase 3: Routing Optimal - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 ajoute le routing automatique : l'utilisateur peut sélectionner deux points et déclencher un algorithme Dijkstra sur grille DEM dans un Web Worker — le résultat est un canal créé automatiquement qui minimise les montées. Le tracé s'affiche sur la carte sans bloquer l'interface, et le profil d'élévation est calculé automatiquement pour valider l'absence de segments rouges.

**Requirements couverts :** MAP-05
**Ne fait PAS partie de cette phase :** calculs volume/ΔSL (Phase 4), analyse écologique (Phase 5), dashboard (Phase 6), édition point par point du tracé routé.

</domain>

<decisions>
## Implementation Decisions

### Déclenchement & UX du Routing
- Mode UIMode "routing" séparé — nouveau bouton toolbar → l'utilisateur clique départ puis arrivée → calcul automatique
- Canal routé créé comme canal standard dans le store (même type Canal), nommé "Canal optimal N"
- Spinner + message "Calcul du tracé optimal en cours..." dans SidePanel avec bouton Annuler (worker.terminate())
- Si aucun chemin gravitaire trouvé : message explicite "Aucun chemin gravitaire trouvé — les deux points sont séparés par un obstacle infranchissable"

### Algorithme & Données d'Élévation
- Résolution adaptative : distance ≤100km → grille 50×50, distance >100km → grille 100×100 max (plafonné pour performance)
- Bibliothèque : ngraph.path (prévu dans le stack) — simple, bien testé, pas de dépendances lourdes
- Fonction de coût d'arête : `distance × (1 + max(0, Δaltitude_montée) / distance)` — favorise le plat et les descentes, pénalise les montées proportionnellement
- Source données élévation grille : Open-Meteo Elevation API (même que Phase 2) — CORS natif, gratuit, cohérence avec le reste de l'app

### Résultat & Intégration
- Canal ajouté directement dans la liste (pas de preview intermédiaire) — l'utilisateur supprime s'il n'est pas satisfait
- Profil d'élévation calculé automatiquement après routing — canal sélectionné + profil chargé immédiatement pour valider l'absence de segments rouges
- Timeout Web Worker : 30 secondes max — message "Calcul interrompu — réduisez la distance ou relancez"
- Canal routé non-éditable point par point en Phase 3 (même type Canal que les canaux manuels, mais pas d'UI d'édition)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCanalStore` (Zustand) — ajouter UIMode 'routing', actions `startRouting`, `setRoutingStart`, `setRoutingEnd`, `finalizeRoutedCanal`
- `Canal` type dans `canal.ts` — étendre avec `isRouted?: boolean` pour affichage badge optionnel
- `DrawingToolbar.tsx` — ajouter bouton "Tracé optimal" pour déclencher le mode routing
- `SidePanel.tsx` — ajouter section de progression routing (spinner + message + annuler)
- `MapView.tsx` — ajouter listeners pour les clics en mode routing (départ/arrivée), marqueurs temporaires
- `ElevationPanel.tsx` + `useElevation.ts` — réutilisés après routing pour afficher le profil automatiquement

### Established Patterns
- Zustand store avec actions atomiques — pattern confirmé Phases 1 & 2
- UIMode enum 'selection' | 'drawing' → à étendre avec 'routing'
- MapLibre sources GeoJSON + `setData()` pour mise à jour dynamique
- Dark theme Tailwind — palette établie (bg-gray-900, #3B82F6 bleu, #EF4444 rouge)
- Coordonnées [lng, lat] WGS84 — convention stricte (JAMAIS [lat, lng])
- `useCanalStore.getState()` dans handlers DOM natifs (évite stale closure)
- Open-Meteo Elevation API pour les données d'élévation — POST par batch

### Integration Points
- Web Worker : `src/workers/routingWorker.ts` — calcul Dijkstra isolé du thread UI
- ngraph.path : install npm, usage dans le Web Worker uniquement
- Marqueurs temporaires "départ" (vert) et "arrivée" (rouge) sur MapLibre pendant la sélection des points
- Après `finalizeRoutedCanal()`, déclencher `selectCanal(newId)` → `useElevation` charge le profil auto

</code_context>

<specifics>
## Specific Ideas

- Le routing doit respecter la contrainte gravitaire fondamentale du projet — la fonction de coût doit fortement pénaliser les montées
- Feedback visuel clair pendant les 3 états : sélection départ → sélection arrivée → calcul en cours
- Le résultat doit être immédiatement validable via le profil d'élévation (segments rouges absents = succès)
- Performance Dijkstra sur grille 100×100 (10 000 nœuds) à calibrer — devrait tenir sous 5 secondes pour la majorité des cas

</specifics>

<deferred>
## Deferred Ideas

- Édition point par point du tracé routé → v2
- Routing multi-segments (chaîne de waypoints imposés) → v2
- Affichage du coût du chemin (élévation max traversée, longueur, etc.) → Phase 4 CALC-03
- Routing offline avec GeoTIFF local + geotiff.js → v2 si rate limits Open-Meteo posent problème

</deferred>

# Phase 1: Map Shell + Tracé - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Mode:** Auto-generated (yolo — grey areas auto-accepted)

<domain>
## Phase Boundary

Phase 1 livre la fondation interactive : une carte monde avec laquelle l'utilisateur peut tracer des canaux manuellement. Il s'agit de la seule phase sans dépendance — elle établit le shell technique (Vite + React + TypeScript + MapLibre) et les patterns qui seront étendus dans toutes les phases suivantes. L'objectif est `git clone + npm install + npm run dev` → carte monde visible + tracé de canal fonctionnel.

**Requirements couverts :** MAP-01, MAP-02
**Ne fait PAS partie de cette phase :** élévation (Phase 2), routing automatique (Phase 3), calculs (Phase 4), persistance IndexedDB (Phase 4+), analyse écologique (Phase 5), dashboard (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### UI Layout & Structure
- Layout single-page : carte couvre 100% de la surface, panneau latéral droit flottant (320px, position fixed)
- Le panneau liste les canaux tracés + bouton "Nouveau canal" / mode indicateur (Tracé / Sélection)
- Header minimal intégré au panneau : titre "Canal Explorer" + indicateur de mode actif
- Thème sombre (dark) — meilleur contraste pour les lignes de canal sur fond de carte, conventions outils scientifiques/GIS
- Responsive desktop uniquement (v1) — outil de bureautique, pas mobile

### Interaction de Tracé
- Activation du mode tracé via bouton "Dessiner canal" dans le panneau
- Clic simple sur la carte = poser un point (waypoint)
- Double-clic = finaliser le canal (minimum 2 points requis)
- Échap ou clic sur "Annuler" = annuler le canal en cours sans sauvegarder
- Pendant le tracé : ligne en pointillés du dernier point posé jusqu'au curseur (preview)
- Sortie automatique du mode tracé après finalisation

### Style Visuel des Canaux
- Couleur : bleu (#3B82F6) pour les canaux finalisés, cyan (#06B6D4) pour la ligne en cours
- Épaisseur : 3px normal, 5px au hover/sélection
- Marqueurs de début (vert #22C55E) et de fin (rouge #EF4444) — indique la directionnalité
- Canal sélectionné : highlight avec outline 2px blanc
- Labels : index du canal sur hover ("Canal 1", "Canal 2"…)

### Architecture Technique
- Stack : Vite + React 18 + TypeScript + MapLibre GL JS + Tailwind CSS
- State management : Zustand (léger, React-compatible, suffisant pour Phase 1)
- Pas d'IndexedDB en Phase 1 — state en mémoire uniquement (Dexie.js intégré en Phase 4 avec le modèle de données complet)
- Tiles carte : OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) — gratuit, sans clé API, style vectoriel haute qualité
- Structure de données canal (Phase 1) : `{ id: string, points: Array<[lng, lat]>, name: string, createdAt: number }`
- IDs canaux via `crypto.randomUUID()`
- Coordonnées stockées en WGS84 (EPSG:4326) — obligatoire pour Turf.js (Pitfall 10)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Aucun code existant — projet greenfield. Phase 1 crée la fondation.

### Established Patterns
- À établir dans cette phase : structure de dossiers src/, composants React, store Zustand, intégration MapLibre
- Convention : coordonnées toujours [lng, lat] (GeoJSON standard, MapLibre convention)

### Integration Points
- MapLibre GL JS : sources GeoJSON + layers pour affichage des canaux
- Zustand store : `useCanalStore` (state global des canaux + mode UI)
- Event handlers MapLibre : `map.on('click')`, `map.on('dblclick')` pour le tracé

</code_context>

<specifics>
## Specific Ideas

- Afficher dès la Phase 1 une info-bulle "Qattara Depression = 2,76 mm" pour ancrer l'ordre de grandeur (Pitfall 1 — dès le départ)
- Le panneau latéral doit prévoir l'espace pour les calculs futurs (Phase 4) — donc structure extensible avec sections
- Contrainte absolue : `npm run dev` sans aucune clé API ni configuration — OpenFreeMap tiles natifs MapLibre

</specifics>

<deferred>
## Deferred Ideas

- Persistance IndexedDB/Dexie.js → Phase 4 (quand le modèle de données est stabilisé)
- Profil d'élévation → Phase 2
- Routing automatique Dijkstra → Phase 3
- Calculs volume/ΔSL → Phase 4
- Export / partage de canaux → v2
- Mode mobile/responsive → v2

</deferred>

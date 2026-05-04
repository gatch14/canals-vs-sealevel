# Phase 2: Élévation + Profil - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 ajoute la conscience altimétrique à l'app : quand l'utilisateur sélectionne un canal, il voit un graphique altitude (m) vs distance (km) et les segments en montée sont surlignés en rouge sur la carte et dans le graphique. L'objectif est de rendre visible la contrainte gravitaire — l'eau ne coule pas en montée.

**Requirements couverts :** MAP-03, MAP-04
**Ne fait PAS partie de cette phase :** routing automatique Dijkstra (Phase 3), calculs volume/ΔSL (Phase 4), analyse écologique (Phase 5), dashboard (Phase 6). Persistance Dexie.js reportée à Phase 4 avec le modèle de données complet.

</domain>

<decisions>
## Implementation Decisions

### Fetch des Données d'Élévation
- Source : Open Topo Data GLO-30 (Copernicus) — gratuit, sans auth, conforme contrainte absolue client-side
- Sampling : 100 points interpolés linéairement sur le tracé via Turf.js `lineChunk` / `along`
- Batch API : regrouper les 100 coords en 1-2 requêtes POST batch (max 100 coords/req Open Topo Data)
- Fallback API down : afficher erreur explicite "Données d'élévation indisponibles — Open Topo Data inaccessible"

### Graphique Profil Altimétrique
- Bibliothèque : Recharts — React-native, TypeScript first, léger (~3KB gzip)
- Position : panneau latéral bas — section accordéon qui s'ouvre quand un canal est sélectionné (en dessous de CanalList)
- Axes : x = Distance (km), y = Altitude (m) — conventions cartographiques standard
- Zones uphill : zones remplies rouge translucide (`#EF4444` à 30% opacité) sur le graphique pour les segments où l'altitude monte

### Visualisation sur la Carte
- Segments uphill carte : couche MapLibre séparée `canal-uphill` en rouge `#EF4444`, 5px, affichée par-dessus le layer canal bleu
- Badge liste : pill sur CanalListItem — "✅ Gravitaire" (vert) / "⚠ Montées détectées" (orange) / "⏳ Chargement..." (gris)
- Extension type Canal : ajouter `elevation?: ElevationProfile` dans `canal.ts` — optionnel pour rétrocompatibilité Phase 1
- Déclenchement fetch : automatique au `selectCanal()` — pas de bouton "Charger profil"

### États UX & Erreurs
- État initial (aucun canal sélectionné) : placeholder "Sélectionnez un canal pour voir son profil altimétrique"
- État chargement : spinner centré dans la zone graphique (hauteur fixe = hauteur finale du graphique) — pas de layout shift
- Canal 100% gravitaire : message positif vert "✅ Ce canal est entièrement réalisable par gravité" sous le graphique
- Persistance : données d'élévation en mémoire dans le store Zustand (re-fetch si page reload) — Phase 4 migrera vers Dexie

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCanalStore` (Zustand) — ajouter `selectedCanalId`, `elevation` dans Canal type, actions `setElevation`, `setElevationLoading`
- `CanalListItem.tsx` — étendre pour afficher le badge gravitaire
- `MapView.tsx` — ajouter layer `canal-uphill` en rouge pour les segments uphill
- `SidePanel.tsx` — ajouter section accordéon ElevationPanel en bas
- Types `Coord = [number, number]` — convention [lng, lat] déjà établie

### Established Patterns
- Zustand store avec actions atomiques — pattern confirmé Phase 1
- MapLibre sources GeoJSON + `setData()` pour mise à jour dynamique — pattern confirmé Phase 1
- Dark theme Tailwind — palette établie (bg-gray-900, text-gray-100, #3B82F6 bleu canal, #EF4444 rouge)
- Coordonnées [lng, lat] WGS84 — convention stricte dans tout le projet

### Integration Points
- `selectCanal()` dans canalStore → déclenche le fetch d'élévation via hook `useElevation`
- Turf.js `along()` + `lineDistance()` pour interpoler les 100 points de sampling
- Open Topo Data API : POST `https://api.opentopodata.org/v1/copernicus30m` avec body JSON `{locations: [{latitude, longitude}...]}`
- MapLibre : nouvelle source `canal-uphill-source` + layer `canal-uphill` ajoutés dans `MapView.tsx`

</code_context>

<specifics>
## Specific Ideas

- L'axe des segments en montée doit être clairement identifié aussi bien sur la carte (rouge 5px) que sur le graphique (fill rouge translucide) — cohérence visuelle
- Message d'ordre de grandeur Qattara déjà ancré en Phase 1 — ce profil d'élévation sera la première vraie preuve que la contrainte gravitaire est prise au sérieux
- Contrainte absolue respectée : Open Topo Data, sans clé API, `npm run dev` suffit

</specifics>

<deferred>
## Deferred Ideas

- Cache persistant des profils d'élévation → Phase 4 avec Dexie.js
- Routing automatique évitant les montées → Phase 3
- Calcul de l'impact partiel (canal arrêté à un obstacle) → Phase 4 CALC-05
- Comparaison multi-canaux sur même graphique → v2

</deferred>

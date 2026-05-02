---
phase: 01-map-shell-trac
plan: T02
type: execute
wave: 2
depends_on: [T01]
files_modified:
  - src/components/MapView.tsx
  - src/hooks/useMapInteraction.ts
autonomous: true
requirements:
  - MAP-01
  - MAP-02

must_haves:
  truths:
    - "npm run dev affiche une carte monde MapLibre (OpenFreeMap liberty) en plein écran"
    - "En mode drawing, clic = waypoint posé, double-clic = canal finalisé sans zoom parasite"
    - "La ligne draft cyan (#06B6D4) apparaît entre les points posés"
    - "La ligne preview cyan suit le curseur depuis le dernier point"
    - "Escape en mode drawing annule le canal sans sauvegarder"
    - "Pas de fuite mémoire WebGL (map.remove() dans cleanup useEffect)"
  artifacts:
    - path: "src/components/MapView.tsx"
      provides: "Conteneur MapLibre GL, 4 sources GeoJSON, layers, sync store"
      exports: ["MapView"]
    - path: "src/hooks/useMapInteraction.ts"
      provides: "Binding events MapLibre selon mode (drawing/selection)"
      exports: ["useMapInteraction"]
  key_links:
    - from: "src/components/MapView.tsx"
      to: "src/hooks/useMapInteraction.ts"
      via: "useMapInteraction(mapRef.current)"
      pattern: "useMapInteraction"
    - from: "src/hooks/useMapInteraction.ts"
      to: "src/store/canalStore.ts"
      via: "useCanalStore selectors + getState()"
      pattern: "useCanalStore"
    - from: "src/components/MapView.tsx"
      to: "https://tiles.openfreemap.org/styles/liberty"
      via: "new maplibregl.Map({ style: 'https://tiles.openfreemap.org/styles/liberty' })"
      pattern: "openfreemap"
---

<objective>
Intégration MapLibre GL JS dans React : composant MapView.tsx (init carte, 4 sources GeoJSON + layers, synchronisation avec le store) et hook useMapInteraction.ts (binding events click/dblclick/mousemove/keydown selon le mode actif).

Purpose: Rendre la carte monde fonctionnelle et connecter les interactions utilisateur au store Zustand. Débloque T03 (composants UI qui lisent le même store).

Output: Carte monde visible dans le navigateur, tracé de canaux opérationnel, prévisualisation en temps réel.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-map-shell-trac/01-RESEARCH.md
@.planning/phases/01-map-shell-trac/01-PATTERNS.md
@.planning/phases/01-map-shell-trac/01-T01-SUMMARY.md

<interfaces>
<!-- Contrats produits par T01 — le plan T02 consomme ces exports -->

src/types/canal.ts :
```typescript
export type Coord = [number, number]  // [lng, lat] WGS84
export type UIMode = 'selection' | 'drawing'
export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
}
```

src/store/canalStore.ts — useCanalStore state :
```typescript
canals: Canal[]
mode: UIMode                        // 'selection' | 'drawing'
draftPoints: Coord[]
previewCoord: Coord | null
selectedCanalId: string | null
// Actions : startDrawing, addWaypoint, updatePreview, finalizeCanal,
//           cancelDrawing, deleteCanal, selectCanal
```

MapLibre sources (initialisées dans MapView, consommées par useMapInteraction) :
- 'canals'  → layer 'canals-line'   (lignes finalisées, bleu #3B82F6)
- 'draft'   → layer 'draft-line'    (ligne en cours, cyan #06B6D4, dasharray [4,4])
- 'preview' → layer 'preview-line'  (curseur → dernier point, cyan, opacity 0.6, dasharray [2,4])
- 'markers' → layer 'markers-circle' (cercles début vert / fin rouge, color via ['get','color'])
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: MapView.tsx — init MapLibre + 4 sources GeoJSON + syncLayers</name>
  <read_first>
    .planning/phases/01-map-shell-trac/01-PATTERNS.md (Pattern src/components/MapView.tsx — intégralité)
    .planning/phases/01-map-shell-trac/01-RESEARCH.md (Pattern 1: Initialisation MapLibre, Pattern 2: Sources GeoJSON dynamiques)
  </read_first>
  <files>src/components/MapView.tsx</files>
  <action>
Créer src/components/MapView.tsx avec exactement ces 3 responsabilités :

**Responsabilité 1 — Init MapLibre (useEffect dépendances vides) :**
- Guard OBLIGATOIRE : `if (!mapContainerRef.current || mapRef.current) return` — évite double-mount React 19 StrictMode (Pitfall 4)
- `new maplibregl.Map({ container: mapContainerRef.current, style: 'https://tiles.openfreemap.org/styles/liberty', center: [20, 20], zoom: 2 })`
- Dans le callback `map.on('load', ...)` : appeler `initSources(map)`
- Cleanup : `map.remove()` puis `mapRef.current = null` — OBLIGATOIRE (Pitfall 2 fuite mémoire WebGL)

**Responsabilité 2 — initSources(map) fonction locale :**
4 sources + 4 layers créés avec FeatureCollection vide. Specs exactes :
```
Source 'canals'  → layer 'canals-line' :
  type: 'line', layout: { 'line-join': 'round', 'line-cap': 'round' }
  paint: { 'line-color': '#3B82F6', 'line-width': 3 }

Source 'draft'   → layer 'draft-line' :
  type: 'line'
  paint: { 'line-color': '#06B6D4', 'line-width': 3, 'line-dasharray': [4, 4] }

Source 'preview' → layer 'preview-line' :
  type: 'line'
  paint: { 'line-color': '#06B6D4', 'line-width': 2, 'line-opacity': 0.6, 'line-dasharray': [2, 4] }

Source 'markers' → layer 'markers-circle' :
  type: 'circle'
  paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' }
```
JAMAIS appeler `addLayer`/`removeLayer` à l'extérieur de `initSources`.

**Responsabilité 3 — syncLayers(map, canals, draftPoints, previewCoord) fonction locale :**
Mettre à jour les 4 sources via `(map.getSource('nom') as GeoJSONSource)?.setData(fc)`.
- 'canals' : LineString par canal, `id: canal.id`, `properties: { name: canal.name }`
- 'markers' : flatMap des canaux → point départ `color: '#22C55E'` + point arrivée `color: '#EF4444'`
- 'draft' : LineString draftPoints si length >= 2, sinon FeatureCollection vide
- 'preview' : LineString [lastPoint, previewCoord] si les deux existent, sinon vide

useEffect déclencheur de syncLayers : `[canals, draftPoints, previewCoord]`
Guard : `if (!map || !map.isStyleLoaded()) return`

**Div conteneur :**
`<div ref={mapContainerRef} className="absolute inset-0" />`

**Hook appelé dans le composant :**
`useMapInteraction(mapRef.current)` — appelé après les useEffect, reçoit la référence Map ou null.

**Imports nécessaires :**
```typescript
import { useEffect, useRef } from 'react'
import maplibregl, { GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useCanalStore } from '../store/canalStore'
import { useMapInteraction } from '../hooks/useMapInteraction'
import type { Canal, Coord } from '../types/canal'
```
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && grep -c "map.remove()" src/components/MapView.tsx</automated>
  </verify>
  <acceptance_criteria>
    - grep "openfreemap.org/styles/liberty" src/components/MapView.tsx — URL tiles présente
    - grep "mapRef.current" src/components/MapView.tsx | grep -c "return" >= 1 — guard anti-double-mount présent
    - grep -c "map.remove()" src/components/MapView.tsx >= 1 — cleanup WebGL présent
    - grep "'canals-line'" src/components/MapView.tsx — layer canaux finalisés présent
    - grep "'draft-line'" src/components/MapView.tsx — layer draft présent
    - grep "'preview-line'" src/components/MapView.tsx — layer preview présent
    - grep "'markers-circle'" src/components/MapView.tsx — layer markers présent
    - grep "setData" src/components/MapView.tsx — mise à jour via setData (jamais addLayer en boucle)
    - grep "useMapInteraction" src/components/MapView.tsx — hook appelé
    - Le fichier compile sans erreur TypeScript : npx tsc --noEmit (0 erreurs)
  </acceptance_criteria>
  <done>
    MapView.tsx existe, exporte MapView, contient les 4 sources GeoJSON, le cleanup map.remove(), la synchro via setData(), et appelle useMapInteraction.
  </done>
</task>

<task type="auto">
  <name>Task 2: useMapInteraction.ts — events drawing/selection + doubleClickZoom disable</name>
  <read_first>
    .planning/phases/01-map-shell-trac/01-PATTERNS.md (Pattern src/hooks/useMapInteraction.ts — intégralité)
    .planning/phases/01-map-shell-trac/01-RESEARCH.md (Pattern 4: Gestion events MapLibre, Pitfall 1: double-clic zoom, Pitfall 3: stale closure)
  </read_first>
  <files>src/hooks/useMapInteraction.ts</files>
  <action>
Créer src/hooks/useMapInteraction.ts qui branche/débranche les events MapLibre selon le mode du store.

**Structure du hook :**
```typescript
export function useMapInteraction(map: maplibregl.Map | null) {
  // Lire le mode via sélecteur Zustand (re-render uniquement quand mode change)
  const mode = useCanalStore((s) => s.mode)
  const addWaypoint = useCanalStore((s) => s.addWaypoint)
  const updatePreview = useCanalStore((s) => s.updatePreview)
  const finalizeCanal = useCanalStore((s) => s.finalizeCanal)
  const selectCanal = useCanalStore((s) => s.selectCanal)

  useEffect(() => {
    if (!map) return
    // branche selon mode...
  }, [map, mode, addWaypoint, updatePreview, finalizeCanal, selectCanal])
}
```

**Branche mode 'drawing' :**
1. `map.doubleClickZoom.disable()` — OBLIGATOIRE (Pitfall 1 — sans ça, double-clic = zoom + 2 waypoints + finalisation)
2. `map.getCanvas().style.cursor = 'crosshair'`
3. Handlers locaux (stockés en variables pour pouvoir les passer à `map.off` dans le cleanup) :
   - `handleClick` : `addWaypoint([e.lngLat.lng, e.lngLat.lat])`
   - `handleDblClick` : `e.preventDefault()` puis `finalizeCanal()`
   - `handleMouseMove` : `updatePreview([e.lngLat.lng, e.lngLat.lat])`
   - `handleKeyDown` (sur `window`) : si `e.key === 'Escape'` → `useCanalStore.getState().cancelDrawing()` (getState hors React pour éviter stale closure — Pitfall 3)
4. Enregistrer : `map.on('click', handleClick)`, `map.on('dblclick', handleDblClick)`, `map.on('mousemove', handleMouseMove)`, `window.addEventListener('keydown', handleKeyDown)`
5. Cleanup return : `map.off('click', handleClick)`, `map.off('dblclick', handleDblClick)`, `map.off('mousemove', handleMouseMove)`, `window.removeEventListener('keydown', handleKeyDown)`, `map.doubleClickZoom.enable()`, `map.getCanvas().style.cursor = ''`

**Branche mode 'selection' :**
1. Hover sur 'canals-line' : `mouseenter` → `cursor = 'pointer'` + `setPaintProperty('canals-line', 'line-width', 5)` ; `mouseleave` → `cursor = ''` + `setPaintProperty('canals-line', 'line-width', 3)`
2. Sélection : `map.on('click', 'canals-line', ...)` → `selectCanal(e.features?.[0]?.id as string)`
3. Cleanup return : `map.off` pour les 3 handlers selection

**Imports :**
```typescript
import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { useCanalStore } from '../store/canalStore'
```
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && grep -c "doubleClickZoom.disable" src/hooks/useMapInteraction.ts</automated>
  </verify>
  <acceptance_criteria>
    - grep -c "doubleClickZoom.disable" src/hooks/useMapInteraction.ts == 1 — pitfall 1 mitigé
    - grep -c "doubleClickZoom.enable" src/hooks/useMapInteraction.ts == 1 — re-enabled dans cleanup
    - grep "e.preventDefault" src/hooks/useMapInteraction.ts — preventDefault sur dblclick
    - grep "Escape" src/hooks/useMapInteraction.ts — handler Escape présent
    - grep "useCanalStore.getState" src/hooks/useMapInteraction.ts — getState() utilisé pour éviter stale closure
    - grep "map.off" src/hooks/useMapInteraction.ts — cleanup des events présent
    - grep "window.removeEventListener" src/hooks/useMapInteraction.ts — cleanup keydown présent
    - npx tsc --noEmit dans le projet — 0 erreurs TypeScript
  </acceptance_criteria>
  <done>
    useMapInteraction.ts existe, exporte useMapInteraction, contient doubleClickZoom.disable/enable, handlers drawing + selection avec cleanup complet, handler Escape via getState().
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| navigateur → MapLibre events | e.lngLat, e.features viennent de MapLibre (trusté — source interne WebGL) |
| CDN OpenFreeMap → navigateur | Tiles vectorielles chargées depuis tiles.openfreemap.org (réseau) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Denial of Service | tiles.openfreemap.org | accept | Tiles externes — dépendance réseau documentée (Pitfall 5 RESEARCH.md), comportement attendu offline |
| T-02-02 | Tampering | MapLibre e.lngLat coords | accept | Coordonnées générées par MapLibre sur clics utilisateur — toujours des nombres valides, pas d'injection possible |
| T-02-03 | Denial of Service | WebGL context (map instance) | mitigate | map.remove() dans cleanup useEffect garantit la libération du contexte WebGL — évite saturation (Pitfall 2) |
</threat_model>

<verification>
1. `cd /c/dev/gsd/science/canal && npx tsc --noEmit` — 0 erreurs TypeScript
2. `grep -c "doubleClickZoom.disable" src/hooks/useMapInteraction.ts` — retourne 1
3. `grep -c "map.remove()" src/components/MapView.tsx` — retourne >= 1
4. `grep "openfreemap.org/styles/liberty" src/components/MapView.tsx` — URL présente
5. `grep "setData" src/components/MapView.tsx` — mise à jour layers via setData
6. Smoke test manuel : `npm run dev` → ouvrir http://localhost:5173 → carte monde visible (nécessite connexion internet)
</verification>

<success_criteria>
- MapView.tsx compile sans erreur TypeScript
- useMapInteraction.ts contient doubleClickZoom.disable/enable et handler Escape
- Les 4 sources GeoJSON sont initialisées dans initSources()
- syncLayers() met à jour via setData() (jamais addLayer/removeLayer en boucle)
- map.remove() présent dans le cleanup useEffect de MapView
</success_criteria>

<output>
Après completion, créer `.planning/phases/01-map-shell-trac/01-T02-SUMMARY.md`
</output>

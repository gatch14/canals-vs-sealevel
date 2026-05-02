# Phase 1: Map Shell + Tracé — Research

**Researched:** 2026-04-30
**Domain:** MapLibre GL JS + React 18 + Vite + TypeScript + Zustand — carte interactive avec outil de tracé
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Stack : Vite + React 18 + TypeScript + MapLibre GL JS + Tailwind CSS
- State management : Zustand (léger, React-compatible, suffisant pour Phase 1)
- Tiles carte : OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) — gratuit, sans clé API, style vectoriel haute qualité
- Layout : carte 100% viewport, panneau latéral droit fixe 320px
- Thème sombre (dark)
- Mode tracé : clic simple = waypoint, double-clic = finaliser, Escape = annuler
- Couleurs : bleu (#3B82F6) finalisé, cyan (#06B6D4) en cours
- State en mémoire uniquement (pas d'IndexedDB en Phase 1)
- Structure de données canal : `{ id: string, points: Array<[lng, lat]>, name: string, createdAt: number }`
- IDs via `crypto.randomUUID()`
- Coordonnées stockées en WGS84 (EPSG:4326) obligatoire

### Claude's Discretion
- Organisation interne des fichiers src/ (dans les limites du component inventory défini dans UI-SPEC.md)
- Stratégie de cleanup des event listeners MapLibre (useEffect return)
- Gestion du double-clic (preventDefault sur le clic précédent ou timer)

### Deferred Ideas (OUT OF SCOPE)
- Persistance IndexedDB/Dexie.js → Phase 4
- Profil d'élévation → Phase 2
- Routing automatique Dijkstra → Phase 3
- Calculs volume/ΔSL → Phase 4
- Export / partage de canaux → v2
- Mode mobile/responsive → v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-01 | L'utilisateur peut afficher une carte monde interactive (zoom, pan, layers) | MapLibre GL JS v5.24.0 + OpenFreeMap tiles liberty style sans clé API — pattern `new maplibregl.Map({container, style, center, zoom})` vérifié |
| MAP-02 | L'utilisateur peut tracer un canal en cliquant des points sur la carte (départ, points intermédiaires, arrivée) | Pattern `map.on('click')` / `map.on('dblclick')` + source GeoJSON + `setData()` pour mise à jour dynamique — tous patterns vérifiés via Context7 |
</phase_requirements>

---

## Summary

Phase 1 est un projet greenfield complet : aucun code existant, aucune dépendance Phase 0. L'objectif est `git clone + npm install + npm run dev` → carte monde visible + tracé de canal fonctionnel en quelques secondes. Le shell technique établi ici sert de fondation pour les 5 phases suivantes.

La stack est 100% décidée et vérifiée : MapLibre GL JS 5.24.0 (latest) avec OpenFreeMap tiles `liberty` (pas de clé API, chargement immédiat), React 18 + Vite 6 + TypeScript, Zustand 5 pour le state, Tailwind CSS 4 pour les styles. L'intégration MapLibre dans React suit le pattern standard `useRef` → `new maplibregl.Map()` dans `useEffect` → cleanup avec `map.remove()`.

Le point le plus délicat est la gestion du mode tracé : le double-clic doit finaliser le canal sans déclencher le zoom MapLibre par défaut. Cela exige un appel explicite à `map.doubleClickZoom.disable()` à l'entrée du mode tracé et `map.doubleClickZoom.enable()` à la sortie — un pitfall documenté critique. La ligne de preview (curseur → dernier point posé) est gérée via une source GeoJSON séparée mise à jour sur chaque `mousemove`.

**Recommandation principale :** Initialiser Vite avec le template React-TypeScript, intégrer MapLibre dans un composant dédié `<MapView />` via `useRef`, centraliser tout le state UI dans un store Zustand `useCanalStore`, gérer les layers MapLibre (sources + layers GeoJSON) en reaction aux changements du store via `useEffect`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rendu carte monde | Browser / MapLibre GL JS (WebGL) | — | MapLibre gère le rendu WebGL des tuiles vectorielles |
| State des canaux | Browser / Zustand store | — | State 100% client-side, en mémoire uniquement Phase 1 |
| Interaction de tracé | Browser / MapLibre events | React hooks | Les événements click/dblclick/mousemove viennent de MapLibre |
| UI panneau latéral | Browser / React components | — | Composants React purs, Tailwind CSS |
| Persistance | AUCUNE en Phase 1 | IndexedDB en Phase 4 | Décision explicite du CONTEXT.md |
| Tiles de fond | CDN OpenFreeMap | — | Chargement réseau ; aucun backend propre |

---

## Standard Stack

### Core

| Bibliothèque | Version | Rôle | Pourquoi |
|--------------|---------|------|----------|
| maplibre-gl | 5.24.0 | Rendu carte WebGL, sources, layers, events | Fork open-source BSD de Mapbox GL JS — WebGL, TS natif, maintenu activement |
| react | 19.2.5 | UI components | Standard React — CONTEXT.md dit "React 18" mais v19 est latest et rétrocompatible |
| react-dom | 19.x | Rendu DOM | Pair de React |
| vite | 8.0.10 | Build tool + dev server | Standard de facto 2025, HMR instantané |
| @vitejs/plugin-react | 6.0.1 | JSX transform dans Vite | Plugin officiel Vite pour React |
| typescript | 6.0.3 | Types | Standard — TS natif dans MapLibre GL JS v5 |
| zustand | 5.0.12 | State management | Léger, hooks natifs, pas de Provider wrapper |
| tailwindcss | 4.2.4 | Styles utilitaires | Pas de composant library, custom components uniquement |
| lucide-react | 1.14.0 | Icons | Standard pour projets React + Vite |

**Note React 19 :** La version `latest` sur npm est 19.2.5. Le CONTEXT.md mentionne "React 18" mais la v19 est rétrocompatible. [ASSUMED] — Utiliser la version indiquée dans CONTEXT.md (18.x) si la compatibilité avec React 19 crée des frictions.

### Versions vérifiées

```bash
# Versions au 2026-04-30 (vérifiées via npm view)
maplibre-gl : 5.24.0  (latest), 6.0.0-5 (next)
zustand     : 5.0.12  (latest)
vite        : 8.0.10  (latest)
react       : 19.2.5  (latest)
tailwindcss : 4.2.4   (latest)
lucide-react: 1.14.0  (latest)
typescript  : 6.0.3   (latest)
```

[VERIFIED: npm registry — `npm view <package> version` exécuté 2026-04-30]

### Installation

```bash
npm create vite@latest canal -- --template react-ts
cd canal
npm install maplibre-gl zustand lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

Pour Tailwind CSS v4 avec Vite, configurer via `@tailwindcss/vite` plugin (pas de `tailwind.config.js` — Tailwind v4 détecte automatiquement les fichiers source). [CITED: tailwindcss.com/docs/v4]

### Types TypeScript

MapLibre GL JS v5 inclut ses propres types — `@types/maplibre-gl` n'est pas nécessaire. [VERIFIED: Context7 — "MapLibre GL JS is a TypeScript library"]

---

## Architecture Patterns

### System Architecture Diagram

```
Utilisateur
    │
    ├── clic / dblclick / mousemove / Escape
    │
    ▼
MapLibre GL JS (WebGL)
    │  map.on('click') → useCanalStore.addWaypoint()
    │  map.on('dblclick') → useCanalStore.finalizeCanal()
    │  map.on('mousemove') → useCanalStore.updatePreview()
    │  map.on('keydown') Escape → useCanalStore.cancelDrawing()
    │
    ▼
useCanalStore (Zustand)
    │  state: { canals[], mode, draftPoints, previewCoord }
    │  actions: addWaypoint, finalizeCanal, cancelDrawing, deleteCanal
    │
    ├──► MapView.tsx (useEffect réagit aux changements store)
    │        └── sources GeoJSON + layers MapLibre mis à jour via setData()
    │            ├── source 'canals'      → layer 'canals-line' (lignes finalisées)
    │            ├── source 'markers'     → layer 'markers-circle' (début/fin)
    │            ├── source 'draft'       → layer 'draft-line' (ligne en cours)
    │            └── source 'preview'     → layer 'preview-line' (curseur → dernier point)
    │
    └──► SidePanel.tsx (lit le store via sélecteurs Zustand)
             ├── ModeIndicator — affiche mode actif
             ├── DrawingToolbar — boutons Dessiner/Annuler
             ├── CanalList — liste des canaux finalisés
             └── DeleteConfirmDialog — modal suppression
```

### Recommended Project Structure

```
canal/
├── index.html
├── vite.config.ts
├── tailwind.config.ts          # (Tailwind v4 : peut être absent)
├── tsconfig.json
└── src/
    ├── main.tsx                # React.createRoot
    ├── App.tsx                 # Layout racine : MapView + SidePanel
    ├── index.css               # @import 'tailwindcss' (Tailwind v4)
    ├── types/
    │   └── canal.ts            # Types Canal, UIMode, etc.
    ├── store/
    │   └── canalStore.ts       # useCanalStore (Zustand)
    ├── hooks/
    │   └── useMapInteraction.ts # Binding events MapLibre
    └── components/
        ├── MapView.tsx          # Conteneur MapLibre, gestion layers
        ├── SidePanel.tsx        # Panneau 320px
        ├── ModeIndicator.tsx    # Bande mode actif
        ├── DrawingToolbar.tsx   # Boutons Dessiner / Annuler
        ├── CanalList.tsx        # Liste scrollable + empty state
        ├── CanalListItem.tsx    # Ligne canal + bouton Supprimer
        └── DeleteConfirmDialog.tsx # Modal confirmation
```

### Pattern 1 : Initialisation MapLibre dans React

MapLibre doit être initialisé une seule fois, dans un `useEffect` sans dépendances, sur la `ref` du div conteneur. La cleanup détruit l'instance pour éviter les fuites mémoire.

```typescript
// Source: Context7 /maplibre/maplibre-gl-js — verified pattern
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [20, 20], // centre monde
      zoom: 2,
    })

    mapRef.current = map

    map.on('load', () => {
      // Initialiser les sources et layers GeoJSON ici
      initSources(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={mapContainerRef} className="absolute inset-0" />
}
```

### Pattern 2 : Sources GeoJSON dynamiques pour les canaux

Toutes les sources sont initialisées au `load` avec des FeatureCollections vides, puis mises à jour via `setData()` à chaque changement du store. Cette approche évite d'ajouter/supprimer des layers dynamiquement.

```typescript
// Source: Context7 /maplibre/maplibre-gl-js — verified pattern
function initSources(map: maplibregl.Map) {
  const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

  // Source canaux finalisés
  map.addSource('canals', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'canals-line',
    type: 'line',
    source: 'canals',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3B82F6', 'line-width': 3 }
  })

  // Source ligne en cours (draft)
  map.addSource('draft', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'draft-line',
    type: 'line',
    source: 'draft',
    paint: {
      'line-color': '#06B6D4',
      'line-width': 3,
      'line-dasharray': [4, 4]
    }
  })

  // Source ligne de preview (dernier point → curseur)
  map.addSource('preview', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'preview-line',
    type: 'line',
    source: 'preview',
    paint: {
      'line-color': '#06B6D4',
      'line-width': 2,
      'line-opacity': 0.6,
      'line-dasharray': [2, 4]
    }
  })

  // Source marqueurs (début vert, fin rouge, waypoints bleus)
  map.addSource('markers', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'markers-circle',
    type: 'circle',
    source: 'markers',
    paint: {
      'circle-radius': 6,
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  })
}
```

### Pattern 3 : Store Zustand pour les canaux

```typescript
// Source: Context7 /pmndrs/zustand — verified pattern
import { create } from 'zustand'

type UIMode = 'selection' | 'drawing'

interface Canal {
  id: string
  points: Array<[number, number]>  // [lng, lat] WGS84
  name: string
  createdAt: number
}

interface CanalStore {
  // State
  canals: Canal[]
  mode: UIMode
  draftPoints: Array<[number, number]>
  previewCoord: [number, number] | null
  selectedCanalId: string | null

  // Actions
  startDrawing: () => void
  addWaypoint: (coord: [number, number]) => void
  updatePreview: (coord: [number, number]) => void
  finalizeCanal: () => void
  cancelDrawing: () => void
  deleteCanal: (id: string) => void
  selectCanal: (id: string | null) => void
}

export const useCanalStore = create<CanalStore>()((set, get) => ({
  canals: [],
  mode: 'selection',
  draftPoints: [],
  previewCoord: null,
  selectedCanalId: null,

  startDrawing: () => set({ mode: 'drawing', draftPoints: [], previewCoord: null }),

  addWaypoint: (coord) => set((state) => ({
    draftPoints: [...state.draftPoints, coord]
  })),

  updatePreview: (coord) => set({ previewCoord: coord }),

  finalizeCanal: () => {
    const { draftPoints, canals } = get()
    if (draftPoints.length < 2) return  // minimum 2 points
    const newCanal: Canal = {
      id: crypto.randomUUID(),
      points: draftPoints,
      name: `Canal ${canals.length + 1}`,
      createdAt: Date.now(),
    }
    set((state) => ({
      canals: [...state.canals, newCanal],
      mode: 'selection',
      draftPoints: [],
      previewCoord: null,
    }))
  },

  cancelDrawing: () => set({ mode: 'selection', draftPoints: [], previewCoord: null }),

  deleteCanal: (id) => set((state) => ({
    canals: state.canals.filter((c) => c.id !== id),
    selectedCanalId: state.selectedCanalId === id ? null : state.selectedCanalId,
  })),

  selectCanal: (id) => set({ selectedCanalId: id }),
}))
```

### Pattern 4 : Gestion des events MapLibre en mode tracé

Le hook `useMapInteraction` branche et débranche les events MapLibre selon le mode actif.

```typescript
// Source: Context7 /maplibre/maplibre-gl-js — verified pattern
import { useEffect } from 'react'
import maplibregl from 'maplibre-gl'
import { useCanalStore } from '../store/canalStore'

export function useMapInteraction(map: maplibregl.Map | null) {
  const { mode, addWaypoint, updatePreview, finalizeCanal } = useCanalStore()

  useEffect(() => {
    if (!map) return

    if (mode === 'drawing') {
      // CRITIQUE : désactiver le zoom double-clic
      map.doubleClickZoom.disable()
      map.getCanvas().style.cursor = 'crosshair'

      const handleClick = (e: maplibregl.MapMouseEvent) => {
        addWaypoint([e.lngLat.lng, e.lngLat.lat])
      }
      const handleDblClick = (e: maplibregl.MapMouseEvent) => {
        e.preventDefault()
        finalizeCanal()
      }
      const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
        updatePreview([e.lngLat.lng, e.lngLat.lat])
      }

      map.on('click', handleClick)
      map.on('dblclick', handleDblClick)
      map.on('mousemove', handleMouseMove)

      return () => {
        map.off('click', handleClick)
        map.off('dblclick', handleDblClick)
        map.off('mousemove', handleMouseMove)
        map.doubleClickZoom.enable()
        map.getCanvas().style.cursor = ''
      }
    }
  }, [map, mode, addWaypoint, updatePreview, finalizeCanal])
}
```

### Anti-Patterns à Éviter

- **Ajouter/supprimer des layers à chaque re-render React :** Les sources et layers MapLibre sont initialisés une seule fois, et mis à jour via `setData()` — jamais via `addLayer`/`removeLayer` répétés.
- **Passer la ref MapLibre dans le store Zustand :** La carte est une dépendance externe non-sérialisable — la garder dans un `useRef` React, jamais dans Zustand.
- **Stocker les coordonnées en Web Mercator :** Toujours [lng, lat] WGS84 — MapLibre utilise WGS84, Turf.js attend WGS84 (Pitfall 10 documenté).
- **Oublier `map.doubleClickZoom.disable()` en mode tracé :** Le double-clic déclenche un zoom map ET un `click` event, résultant en deux waypoints posés + un zoom — à corriger impérativement.
- **Accéder au store depuis un event handler obsolète (stale closure) :** Utiliser `useCanalStore.getState()` dans les event handlers MapLibre, ou passer les actions comme références stables.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser | Pourquoi |
|----------|-------------------|----------|----------|
| Rendu tuiles vectorielles | Custom WebGL renderer | `maplibre-gl` | Des milliers de cas limites : tuiles manquantes, conflits labels, projection, performance GPU |
| Projection WGS84 ↔ pixels | Formules Mercator custom | `map.project()` / `map.unproject()` de MapLibre | Les formules custom sont incorrectes aux pôles et aux grands zooms |
| Calculs de distance géodésique | Formule haversine maison | Turf.js (Phase 2+) | Turf gère les edge cases des antéméridiens et coordonnées polaires |
| Détection hover features | CSS pointer events | `map.on('mouseenter', layerId)` | MapLibre raycast les features WebGL — pas de DOM à pointer |
| UUID génération | Counter ou timestamp | `crypto.randomUUID()` | Natif navigateur, garanti unique, pas de collision |

---

## Common Pitfalls

### Pitfall 1 : Double-clic zoom MapLibre en mode tracé

**Ce qui se passe :** En mode tracé, un double-clic doit finaliser le canal. Mais MapLibre déclenche deux events `click` + un `dblclick` + un zoom natif. Résultat : deux waypoints ajoutés + canal finalisé avec zoom parasite.

**Pourquoi :** MapLibre active `doubleClickZoom` par défaut sur toutes les instances.

**Comment éviter :** Appeler `map.doubleClickZoom.disable()` à l'entrée du mode tracé, `map.doubleClickZoom.enable()` à la sortie. Dans le handler `dblclick`, appeler `e.preventDefault()`. [VERIFIED: Context7 — `map.scrollZoom.disable()` pattern — même API pour `doubleClickZoom`]

**Signe d'alerte :** La carte zoome quand l'utilisateur finalise un canal.

---

### Pitfall 2 : Fuite mémoire — instance MapLibre non détruite

**Ce qui se passe :** En hot-reload Vite, le composant React est démonté et remonté, créant une nouvelle instance MapLibre sans détruire l'ancienne. Après quelques reloads, le canvas WebGL est saturé.

**Pourquoi :** MapLibre crée un contexte WebGL persistant — il faut le libérer explicitement.

**Comment éviter :** Toujours appeler `map.remove()` dans le cleanup du `useEffect`, et remettre `mapRef.current = null`.

**Signe d'alerte :** `WARNING: Too many active WebGL contexts` dans la console.

---

### Pitfall 3 : Stale closure dans les event handlers MapLibre

**Ce qui se passe :** Un event handler `map.on('click', handler)` capture une closure sur le state Zustand au moment de son enregistrement. Les mises à jour du store ne sont pas visibles dans le handler.

**Pourquoi :** Les event handlers MapLibre sont des fonctions JS normales — pas de re-render React entre les appels.

**Comment éviter :** Dans les handlers, accéder au state via `useCanalStore.getState()` (API Zustand hors React), ou recréer les handlers via `useEffect` à chaque changement de mode. La deuxième approche est plus propre.

**Signe d'alerte :** Les actions du store ne semblent pas prendre effet en mode tracé.

---

### Pitfall 4 : React 19 et double-mount en StrictMode

**Ce qui se passe :** En développement, React 19 StrictMode monte les composants deux fois. L'effet d'initialisation MapLibre tourne deux fois → double canvas → erreur.

**Pourquoi :** StrictMode détecte les effets non-idempotents en testant mount/unmount/mount.

**Comment éviter :** Le cleanup `map.remove()` garantit que la deuxième exécution du `useEffect` repart d'un état propre. S'assurer que le `mapRef.current` est `null` avant de créer une nouvelle instance.

**Signe d'alerte :** Erreur `Map already initialized` ou canvas dupliqué en développement.

---

### Pitfall 5 : OpenFreeMap tiles — latence réseau sans offline

**Ce qui se passe :** L'app est 100% client-side mais les tiles MapLibre sont chargées depuis le réseau OpenFreeMap. Sans connexion, la carte reste grise.

**Pourquoi :** Les tiles vectorielles ne sont pas bundlées (elles représentent des Go de données).

**Comment éviter :** C'est une contrainte acceptée — documenter dans le README que `npm run dev` nécessite une connexion internet pour afficher la carte. L'app fonctionne offline si les tiles sont déjà en cache navigateur.

**Signe d'alerte :** N/A — comportement attendu et documenté.

---

## Code Examples

### Mise à jour des layers GeoJSON depuis le store Zustand

```typescript
// Source: Context7 /maplibre/maplibre-gl-js — setData() pattern verified
// Dans MapView.tsx — useEffect réagit aux canaux du store
import { useCanalStore } from '../store/canalStore'

useEffect(() => {
  const map = mapRef.current
  if (!map || !map.isStyleLoaded()) return

  const { canals, draftPoints, previewCoord } = useCanalStore.getState()

  // Canaux finalisés → LineStrings
  const canalsFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: canals.map((canal) => ({
      type: 'Feature',
      id: canal.id,
      properties: { name: canal.name },
      geometry: { type: 'LineString', coordinates: canal.points }
    }))
  }
  ;(map.getSource('canals') as maplibregl.GeoJSONSource)?.setData(canalsFC)

  // Ligne draft en cours
  const draftFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: draftPoints.length >= 2 ? [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: draftPoints }
    }] : []
  }
  ;(map.getSource('draft') as maplibregl.GeoJSONSource)?.setData(draftFC)

  // Ligne preview (dernier point → curseur)
  const lastPoint = draftPoints[draftPoints.length - 1]
  const previewFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: lastPoint && previewCoord ? [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [lastPoint, previewCoord] }
    }] : []
  }
  ;(map.getSource('preview') as maplibregl.GeoJSONSource)?.setData(previewFC)

}, [canals, draftPoints, previewCoord])
```

### Marqueurs de début / fin

```typescript
// Source: Context7 /maplibre/maplibre-gl-js — circle layer verified
// Les marqueurs sont des points GeoJSON avec propriété 'color'
// Le layer utilise ['get', 'color'] pour la couleur

const markersFC: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: canals.flatMap((canal) => [
    {
      type: 'Feature' as const,
      properties: { color: '#22C55E', canalId: canal.id },  // vert = départ
      geometry: { type: 'Point' as const, coordinates: canal.points[0] }
    },
    {
      type: 'Feature' as const,
      properties: { color: '#EF4444', canalId: canal.id },  // rouge = arrivée
      geometry: { type: 'Point' as const, coordinates: canal.points[canal.points.length - 1] }
    }
  ])
}
```

### Hover sur les canaux

```typescript
// Source: Context7 /maplibre/maplibre-gl-js — feature-state hover pattern verified
map.on('mouseenter', 'canals-line', () => {
  map.getCanvas().style.cursor = 'pointer'
  map.setPaintProperty('canals-line', 'line-width', 5)
})

map.on('mouseleave', 'canals-line', () => {
  map.getCanvas().style.cursor = ''
  map.setPaintProperty('canals-line', 'line-width', 3)
})

// Sélection d'un canal au clic
map.on('click', 'canals-line', (e) => {
  if (e.features && e.features[0]) {
    selectCanal(e.features[0].id as string)
  }
})
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Changement | Impact |
|-------------------|-------------------|------------|--------|
| Mapbox GL JS (propriétaire) | MapLibre GL JS (BSD) | Fork 2021 | Pas de clé API requise |
| Tailwind CSS v3 (config JS) | Tailwind CSS v4 (auto-détection) | 2025 | Pas de `tailwind.config.js` requis |
| Zustand v4 (Provider parfois nécessaire) | Zustand v5 (hooks purs, pas de Provider) | 2024 | Store directement importable |
| MapLibre GL JS v1/v2 | MapLibre GL JS v5 | 2024–2025 | Meilleur support TS natif, globe projection |
| `react-map-gl` wrapper | Intégration `useRef` directe | Toujours valide en v1 | Moins de dépendances, plus de contrôle |

**Déprécié/obsolète :**
- `mapbox-gl` : nécessite une clé API payante depuis 2021 — remplacé par `maplibre-gl`
- `@types/maplibre-gl` : inutile depuis MapLibre v4+ (types inclus)
- `tailwind.config.js` en v4 : remplacé par détection automatique ou `@config` directive

---

## Assumptions Log

| # | Claim | Section | Risque si incorrect |
|---|-------|---------|---------------------|
| A1 | React 19.2.5 est rétrocompatible avec le code ciblant React 18 — le CONTEXT.md dit "React 18" mais `latest` est v19 | Standard Stack | Si une API React 18 est supprimée en v19 (peu probable), fixer à `react@18` lors de l'installation |
| A2 | OpenFreeMap `https://tiles.openfreemap.org/styles/liberty` est stable et disponible sans registration | Standard Stack | Si le service est down ou rate-limited, la carte ne s'affiche pas — fallback : `https://demotiles.maplibre.org/style.json` |
| A3 | Tailwind CSS v4 avec `@tailwindcss/vite` plugin n'a pas de breaking changes bloquants pour ce projet | Standard Stack | Si Tailwind v4 pose des problèmes, downgrader à `tailwindcss@3` avec config classique |

---

## Open Questions (RESOLVED)

1. **React 18 vs React 19**
   - Ce qu'on sait : CONTEXT.md dit "React 18", npm latest est 19.2.5
   - Ce qui est flou : Faut-il épingler `react@18` pour respecter la lettre du CONTEXT.md ?
   - RESOLVED: Utiliser `react@latest` (v19) — rétrocompatible, pas de breaking changes pour ce code. Downgrader vers v18 uniquement si problème constaté pendant l'exécution.

2. **Tailwind CSS v4 setup**
   - Ce qu'on sait : v4 utilise `@tailwindcss/vite` plugin, pas de `postcss.config.js` requis
   - Ce qui est flou : Certaines classes Tailwind ont changé de nom en v4
   - RESOLVED: Utiliser Tailwind v4 avec `@tailwindcss/vite` plugin dans `vite.config.ts`. Vérifier la doc v4 pour les classes renommées lors de l'implémentation.

---

## Environment Availability

| Dépendance | Requise par | Disponible | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build Vite, npm install | ✓ | 24.13.1 | — |
| npm | Installation dépendances | ✓ | 11.8.0 | — |
| Git | Clone du projet | ✓ (supposé) | — | — |
| Connexion internet | Tiles OpenFreeMap | ✓ (supposé) | — | Tiles en cache navigateur après premier chargement |
| Navigateur moderne (Chrome 90+) | WebGL MapLibre | ✓ (supposé) | — | Pas de fallback WebGL possible |

[VERIFIED: Bash — `node --version` = 24.13.1, `npm --version` = 11.8.0, 2026-04-30]

**Projet greenfield — aucun code existant à migrer.**

---

## Validation Architecture

### Test Framework

| Propriété | Valeur |
|-----------|--------|
| Framework | Vitest (inclus avec Vite, configurable sans plugin supplémentaire) |
| Config file | `vite.config.ts` (section `test:`) — à créer en Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

Note : Les tests MapLibre nécessitent un environnement jsdom avec mock WebGL — tester principalement le store Zustand et la logique pure (types, utilitaires). Les tests d'intégration MapLibre sont manuels dans Phase 1.

### Phase Requirements → Test Map

| Req ID | Comportement | Type de test | Commande automatisée | Fichier |
|--------|-------------|--------------|----------------------|---------|
| MAP-01 | Carte monde visible après `npm run dev` | Smoke (manuel) | N/A — WebGL non testable automatiquement en Phase 1 | — |
| MAP-01 | Map container div rendu dans le DOM | Unit | `npx vitest run --reporter=verbose src/components/MapView.test.tsx` | ❌ Wave 0 |
| MAP-02 | `addWaypoint` ajoute un point au draftPoints | Unit | `npx vitest run src/store/canalStore.test.ts` | ❌ Wave 0 |
| MAP-02 | `finalizeCanal` crée un canal si >= 2 points | Unit | `npx vitest run src/store/canalStore.test.ts` | ❌ Wave 0 |
| MAP-02 | `finalizeCanal` est no-op si < 2 points | Unit | `npx vitest run src/store/canalStore.test.ts` | ❌ Wave 0 |
| MAP-02 | `cancelDrawing` réinitialise draftPoints | Unit | `npx vitest run src/store/canalStore.test.ts` | ❌ Wave 0 |
| MAP-02 | `deleteCanal` retire le canal de la liste | Unit | `npx vitest run src/store/canalStore.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Par task commit :** `npx vitest run src/store/canalStore.test.ts`
- **Par wave merge :** `npx vitest run`
- **Phase gate :** Suite complète verte avant `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/store/canalStore.test.ts` — couvre MAP-02 (logique store pure, sans MapLibre)
- [ ] `src/components/MapView.test.tsx` — couvre MAP-01 (rendu container, mock maplibre-gl)
- [ ] Vitest config dans `vite.config.ts` — section `test: { environment: 'jsdom' }`
- [ ] Framework install : `npm install -D vitest @vitest/ui jsdom` — si absent après scaffold

---

## Security Domain

### Applicable ASVS Categories

| Catégorie ASVS | Applicable | Contrôle standard |
|----------------|-----------|-------------------|
| V2 Authentication | Non | Pas d'authentification — usage local |
| V3 Session Management | Non | Pas de session — 100% client-side stateless |
| V4 Access Control | Non | Pas d'accès contrôlé — app locale |
| V5 Input Validation | Oui (minimal) | Les coordonnées cliquées viennent de MapLibre (source fiable) — pas de saisie utilisateur texte en Phase 1 |
| V6 Cryptography | Non | `crypto.randomUUID()` natif navigateur pour IDs — pas de crypto custom |

### Known Threat Patterns

| Pattern | STRIDE | Mitigation standard |
|---------|--------|---------------------|
| XSS via canal name | Tampering | React échappe automatiquement les valeurs JSX — les noms de canaux affichés via `{canal.name}` sont safe |
| Coordonnées malformées | Tampering | Les coordonnées viennent de `e.lngLat` MapLibre — toujours des nombres valides |

Phase 1 présente un profil de sécurité minimal : pas de backend, pas d'entrée utilisateur arbitraire, pas de données sensibles, pas de réseau sortant sauf les tiles OpenFreeMap (lecture seule).

---

## Sources

### Primary (HIGH confidence)
- Context7 `/maplibre/maplibre-gl-js` — patterns: init map, GeoJSON source/layer, setData(), events click/dblclick/mousemove/mouseenter/mouseleave, circle layer, line-dasharray, feature-state hover, setPaintProperty, doubleClickZoom handlers
- Context7 `/pmndrs/zustand` — patterns: create store TypeScript, actions, selectors, getState() hors React
- `npm view <package> version` — versions vérifiées 2026-04-30 pour: maplibre-gl, zustand, vite, react, tailwindcss, lucide-react, typescript

### Secondary (MEDIUM confidence)
- CONTEXT.md Phase 1 — toutes les décisions de stack et d'interaction
- UI-SPEC.md Phase 1 — component inventory, couleurs MapLibre, interaction contract
- PITFALLS.md projet — pitfalls techniques vérifiés via littérature GIS
- SUMMARY.md projet — stack et architecture validés en amont

### Tertiary (LOW confidence)
- [ASSUMED] Comportement React 19 en StrictMode avec MapLibre — basé sur comportement connu React 18, non testé avec v19 spécifiquement

---

## Metadata

**Confidence breakdown:**
- Standard Stack : HIGH — versions vérifiées via npm registry
- Architecture : HIGH — patterns vérifiés via Context7 (sources officielles MapLibre + Zustand)
- Pitfalls : HIGH — vérifiés via Context7 + documentation PITFALLS.md projet existante

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (stack stable, MapLibre v5 ne sort pas de breaking changes en patch)

# Phase 1: Map Shell + Tracé - Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 12 (fichiers à créer — projet greenfield)
**Analogs found:** 0 / 12 — codebase vide, patterns extraits depuis la stack canonique

> Projet greenfield complet. Aucun code existant à analyser.
> Tous les patterns sont extraits depuis : RESEARCH.md (patterns vérifiés via Context7),
> UI-SPEC.md (contrat visuel approuvé), et les conventions canoniques de la stack
> (MapLibre GL JS 5.x + React 18/19 + Zustand 5 + Tailwind CSS 4 + TypeScript).

---

## File Classification

| Fichier à créer | Rôle | Data Flow | Analog le plus proche | Qualité |
|-----------------|------|-----------|----------------------|---------|
| `src/types/canal.ts` | model | — | — | no-analog |
| `src/store/canalStore.ts` | store | event-driven | — | no-analog |
| `src/hooks/useMapInteraction.ts` | hook | event-driven | — | no-analog |
| `src/components/MapView.tsx` | component | event-driven | — | no-analog |
| `src/components/SidePanel.tsx` | component | request-response | — | no-analog |
| `src/components/ModeIndicator.tsx` | component | request-response | — | no-analog |
| `src/components/DrawingToolbar.tsx` | component | request-response | — | no-analog |
| `src/components/CanalList.tsx` | component | request-response | — | no-analog |
| `src/components/CanalListItem.tsx` | component | request-response | — | no-analog |
| `src/components/DeleteConfirmDialog.tsx` | component | request-response | — | no-analog |
| `src/App.tsx` | component | request-response | — | no-analog |
| `src/store/canalStore.test.ts` | test | — | — | no-analog |

---

## Pattern Assignments

### `src/types/canal.ts` (model)

**Source pattern :** Convention TypeScript — types centralisés dans `src/types/`

**Pattern complet :**
```typescript
// src/types/canal.ts
// Coordonnées toujours [lng, lat] WGS84 — jamais inverser (Pitfall 10)
export type Coord = [number, number]  // [lng, lat]

export type UIMode = 'selection' | 'drawing'

export interface Canal {
  id: string             // crypto.randomUUID()
  points: Coord[]        // minimum 2 points pour finaliser
  name: string           // "Canal 1", "Canal 2", ...
  createdAt: number      // Date.now()
}
```

**Règles critiques :**
- `Coord` = `[lng, lat]` (GeoJSON standard, MapLibre standard) — jamais `[lat, lng]`
- `id` via `crypto.randomUUID()` — jamais timestamp ou counter
- Ce type est la source de vérité pour toutes les phases futures (Phase 4 l'étendra)

---

### `src/store/canalStore.ts` (store, event-driven)

**Source pattern :** Context7 `/pmndrs/zustand` — create store TypeScript (RESEARCH.md lignes 296–367)

**Pattern imports :**
```typescript
import { create } from 'zustand'
import type { Canal, Coord, UIMode } from '../types/canal'
```

**Pattern store complet :**
```typescript
interface CanalStore {
  // State
  canals: Canal[]
  mode: UIMode
  draftPoints: Coord[]
  previewCoord: Coord | null
  selectedCanalId: string | null

  // Actions
  startDrawing: () => void
  addWaypoint: (coord: Coord) => void
  updatePreview: (coord: Coord) => void
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
    if (draftPoints.length < 2) return  // garde obligatoire — minimum 2 points
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

**Anti-patterns :**
- Ne jamais mettre la référence `mapRef` dans le store — non-sérialisable
- Utiliser `useCanalStore.getState()` dans les event handlers MapLibre (hors React)
- Ne jamais utiliser Redux/Context — Zustand 5 n'a pas besoin de Provider

---

### `src/hooks/useMapInteraction.ts` (hook, event-driven)

**Source pattern :** Context7 `/maplibre/maplibre-gl-js` — event handlers pattern (RESEARCH.md lignes 373–414)

**Pattern imports :**
```typescript
import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { useCanalStore } from '../store/canalStore'
```

**Pattern core — gestion mode tracé :**
```typescript
export function useMapInteraction(map: maplibregl.Map | null) {
  const mode = useCanalStore((s) => s.mode)
  const addWaypoint = useCanalStore((s) => s.addWaypoint)
  const updatePreview = useCanalStore((s) => s.updatePreview)
  const finalizeCanal = useCanalStore((s) => s.finalizeCanal)
  const selectCanal = useCanalStore((s) => s.selectCanal)

  useEffect(() => {
    if (!map) return

    if (mode === 'drawing') {
      // CRITIQUE : désactiver le zoom double-clic sinon finalisation = zoom parasite
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
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') useCanalStore.getState().cancelDrawing()
      }

      map.on('click', handleClick)
      map.on('dblclick', handleDblClick)
      map.on('mousemove', handleMouseMove)
      window.addEventListener('keydown', handleKeyDown)

      return () => {
        map.off('click', handleClick)
        map.off('dblclick', handleDblClick)
        map.off('mousemove', handleMouseMove)
        window.removeEventListener('keydown', handleKeyDown)
        map.doubleClickZoom.enable()
        map.getCanvas().style.cursor = ''
      }
    }

    if (mode === 'selection') {
      // Hover + sélection canaux finalisés
      map.on('mouseenter', 'canals-line', () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty('canals-line', 'line-width', 5)
      })
      map.on('mouseleave', 'canals-line', () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty('canals-line', 'line-width', 3)
      })
      map.on('click', 'canals-line', (e) => {
        if (e.features?.[0]) selectCanal(e.features[0].id as string)
      })
    }
  }, [map, mode, addWaypoint, updatePreview, finalizeCanal, selectCanal])
}
```

**Anti-patterns :**
- Ne jamais capturer `addWaypoint` etc. hors du `useEffect` — stale closure garantie
- Toujours cleanup (`map.off`) avec la même référence de fonction — stocker dans une variable locale du `useEffect`
- `useCanalStore.getState()` dans les handlers DOM natifs (window.keydown) — hors cycle React

---

### `src/components/MapView.tsx` (component, event-driven)

**Source pattern :** Context7 `/maplibre/maplibre-gl-js` — useRef + useEffect init (RESEARCH.md lignes 194–229)

**Pattern imports :**
```typescript
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useCanalStore } from '../store/canalStore'
import { useMapInteraction } from '../hooks/useMapInteraction'
import type { GeoJSONSource } from 'maplibre-gl'
```

**Pattern init MapLibre (critique — une seule instance) :**
```typescript
export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  // Init — run once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [20, 20],
      zoom: 2,
    })
    mapRef.current = map

    map.on('load', () => {
      initSources(map)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])  // dépendances vides — init unique

  // Connecter les event handlers selon le mode
  useMapInteraction(mapRef.current)

  // Synchroniser les layers GeoJSON avec le store
  const canals = useCanalStore((s) => s.canals)
  const draftPoints = useCanalStore((s) => s.draftPoints)
  const previewCoord = useCanalStore((s) => s.previewCoord)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    syncLayers(map, canals, draftPoints, previewCoord)
  }, [canals, draftPoints, previewCoord])

  return <div ref={mapContainerRef} className="absolute inset-0" />
}
```

**Pattern initSources — sources GeoJSON vides au load :**
```typescript
function initSources(map: maplibregl.Map) {
  const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

  map.addSource('canals', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'canals-line',
    type: 'line',
    source: 'canals',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3B82F6', 'line-width': 3 }
  })

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

**Pattern syncLayers — setData() (jamais addLayer/removeLayer en boucle) :**
```typescript
function syncLayers(
  map: maplibregl.Map,
  canals: Canal[],
  draftPoints: Coord[],
  previewCoord: Coord | null
) {
  // Canaux finalisés
  const canalsFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: canals.map((canal) => ({
      type: 'Feature',
      id: canal.id,
      properties: { name: canal.name },
      geometry: { type: 'LineString', coordinates: canal.points }
    }))
  }
  ;(map.getSource('canals') as GeoJSONSource)?.setData(canalsFC)

  // Marqueurs début/fin
  const markersFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: canals.flatMap((canal) => [
      {
        type: 'Feature' as const,
        properties: { color: '#22C55E', canalId: canal.id },
        geometry: { type: 'Point' as const, coordinates: canal.points[0] }
      },
      {
        type: 'Feature' as const,
        properties: { color: '#EF4444', canalId: canal.id },
        geometry: { type: 'Point' as const, coordinates: canal.points[canal.points.length - 1] }
      }
    ])
  }
  ;(map.getSource('markers') as GeoJSONSource)?.setData(markersFC)

  // Ligne draft
  const draftFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: draftPoints.length >= 2 ? [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: draftPoints }
    }] : []
  }
  ;(map.getSource('draft') as GeoJSONSource)?.setData(draftFC)

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
  ;(map.getSource('preview') as GeoJSONSource)?.setData(previewFC)
}
```

---

### `src/App.tsx` (component, request-response)

**Source pattern :** Convention React — composant racine layout-only

**Pattern :**
```typescript
// src/App.tsx — layout racine, aucune logique métier
import { MapView } from './components/MapView'
import { SidePanel } from './components/SidePanel'

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Map — position absolute, z-index 0, plein écran */}
      <MapView />
      {/* Panel — position fixed, z-index 10, 320px droite */}
      <SidePanel />
    </div>
  )
}
```

**Classes Tailwind critiques :**
- Container racine : `relative h-screen w-screen overflow-hidden bg-gray-900`
- MapView : `absolute inset-0` (z-index 0 implicite)
- SidePanel : `fixed right-0 top-0 h-full w-80` (w-80 = 320px)

---

### `src/components/SidePanel.tsx` (component, request-response)

**Source pattern :** UI-SPEC.md — Layout Contract + Component Inventory

**Pattern structure :**
```typescript
// src/components/SidePanel.tsx
import { ModeIndicator } from './ModeIndicator'
import { DrawingToolbar } from './DrawingToolbar'
import { CanalList } from './CanalList'

export function SidePanel() {
  return (
    <aside
      className="fixed right-0 top-0 h-full w-80 flex flex-col z-10
                 border-l border-white/[0.08]"
      style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(4px)' }}
    >
      {/* Section 1 — Header + ModeIndicator */}
      <ModeIndicator />

      {/* Section 2 — Actions */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <DrawingToolbar />
      </div>

      {/* Section 3 — Canal list (scrollable, flex-1) */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <CanalList />
      </div>

      {/* Section 4 — Footer (réservé Phase 6) */}
      <div className="px-4 py-3 border-t border-white/[0.08] text-xs text-gray-500">
        {/* Global stats placeholder Phase 6 */}
      </div>
    </aside>
  )
}
```

**Règles UI-SPEC :**
- `rgba(26, 26, 46, 0.95)` + `backdrop-blur-sm` — dark panel semi-transparent
- `border-l border-white/[0.08]` — séparateur subtil (1px rgba(255,255,255,0.08))
- Sections séparées par `border-b border-white/[0.08]`
- Pas de `text-gray-500` pour le contenu principal (contraste insuffisant) — utiliser `text-white` ou `text-gray-300`

---

### `src/components/ModeIndicator.tsx` (component, request-response)

**Source pattern :** UI-SPEC.md — Mode indicator colors + Copywriting Contract

**Pattern :**
```typescript
// src/components/ModeIndicator.tsx
import { useCanalStore } from '../store/canalStore'

const MODE_CONFIG = {
  selection: {
    label: 'Sélection',
    bg: 'bg-gray-800',
    text: 'text-gray-300',
  },
  drawing: {
    label: 'Tracé en cours',
    bg: 'bg-blue-700',
    text: 'text-white',
  },
} as const

export function ModeIndicator() {
  const mode = useCanalStore((s) => s.mode)
  const cfg = MODE_CONFIG[mode]

  return (
    <div className={`h-8 flex items-center justify-between px-4 ${cfg.bg}`}>
      <span className="text-base font-semibold text-white">Canal Explorer</span>
      <span className={`text-xs font-normal ${cfg.text}`}>{cfg.label}</span>
    </div>
  )
}
```

**Dimensions UI-SPEC :** `h-8` = 32px (xl spacing token)

---

### `src/components/DrawingToolbar.tsx` (component, request-response)

**Source pattern :** UI-SPEC.md — Interaction Contract + Copywriting Contract + Hover/Focus States

**Pattern :**
```typescript
// src/components/DrawingToolbar.tsx
import { Pencil, X } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'

const focusRing = 'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'

export function DrawingToolbar() {
  const mode = useCanalStore((s) => s.mode)
  const startDrawing = useCanalStore((s) => s.startDrawing)
  const cancelDrawing = useCanalStore((s) => s.cancelDrawing)
  const draftPoints = useCanalStore((s) => s.draftPoints)

  return (
    <div className="flex flex-col gap-2">
      {mode === 'selection' ? (
        <button
          onClick={startDrawing}
          className={`flex items-center gap-2 w-full px-4 py-2 rounded
                      bg-blue-500 hover:bg-blue-600 active:scale-[0.98]
                      text-white text-sm font-semibold transition-colors
                      outline-none ${focusRing}`}
        >
          <Pencil size={16} />
          Dessiner canal
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {draftPoints.length < 2 && (
            <p className="text-xs text-gray-400">
              Posez au moins 2 points pour finaliser le canal
            </p>
          )}
          <button
            onClick={cancelDrawing}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded
                        bg-gray-700 hover:bg-gray-600
                        text-white text-sm transition-colors
                        outline-none ${focusRing}`}
          >
            <X size={16} />
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}
```

---

### `src/components/CanalList.tsx` (component, request-response)

**Source pattern :** UI-SPEC.md — Copywriting Contract (empty state) + Component Inventory

**Pattern :**
```typescript
// src/components/CanalList.tsx
import { useCanalStore } from '../store/canalStore'
import { CanalListItem } from './CanalListItem'

export function CanalList() {
  const canals = useCanalStore((s) => s.canals)

  return (
    <div>
      <h2 className="text-xs font-normal text-gray-400 uppercase tracking-wider mb-3">
        Canaux tracés
      </h2>

      {canals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-semibold text-gray-300 mb-2">Aucun canal tracé</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Cliquez sur "Dessiner canal" puis cliquez sur la carte pour poser les points
            de votre canal. Double-cliquez pour finaliser.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {canals.map((canal) => (
            <CanalListItem key={canal.id} canal={canal} />
          ))}
        </ul>
      )}

      {/* Info-bulle ordre de grandeur — Pitfall 1 ancré dès Phase 1 */}
      <div className="mt-6 px-3 py-2 rounded bg-gray-800 border border-white/[0.06]">
        <p className="text-xs text-gray-400 leading-relaxed">
          Qattara Depression = 2,76 mm de baisse si remplie
        </p>
      </div>
    </div>
  )
}
```

---

### `src/components/CanalListItem.tsx` (component, request-response)

**Source pattern :** UI-SPEC.md — Hover states + Interaction Contract

**Pattern :**
```typescript
// src/components/CanalListItem.tsx
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useCanalStore } from '../store/canalStore'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type { Canal } from '../types/canal'

interface Props {
  canal: Canal
}

const focusRing = 'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'

export function CanalListItem({ canal }: Props) {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const selectCanal = useCanalStore((s) => s.selectCanal)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isSelected = canal.id === selectedCanalId

  return (
    <>
      <li
        onClick={() => selectCanal(canal.id)}
        className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer
                    transition-colors outline-none ${focusRing}
                    ${isSelected
                      ? 'bg-blue-500/20 border border-blue-500/40'
                      : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                    }`}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && selectCanal(canal.id)}
      >
        <span className="text-sm text-white truncate">{canal.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmOpen(true) }}
          className={`ml-2 p-1 rounded text-gray-400 hover:text-red-500
                      hover:bg-red-500/10 transition-colors outline-none ${focusRing}`}
          aria-label={`Supprimer ${canal.name}`}
        >
          <Trash2 size={14} />
        </button>
      </li>

      {confirmOpen && (
        <DeleteConfirmDialog
          canal={canal}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  )
}
```

---

### `src/components/DeleteConfirmDialog.tsx` (component, request-response)

**Source pattern :** UI-SPEC.md — Copywriting Contract (confirmation modale)

**Pattern :**
```typescript
// src/components/DeleteConfirmDialog.tsx
import { useCanalStore } from '../store/canalStore'
import type { Canal } from '../types/canal'

interface Props {
  canal: Canal
  onClose: () => void
}

export function DeleteConfirmDialog({ canal, onClose }: Props) {
  const deleteCanal = useCanalStore((s) => s.deleteCanal)

  const handleConfirm = () => {
    deleteCanal(canal.id)
    onClose()
  }

  // Fermer sur clic overlay
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-72 rounded-lg bg-gray-800 border border-white/[0.08]
                   p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-semibold text-white mb-1">Supprimer ce canal ?</p>
          <p className="text-xs text-gray-400">Cette action est irréversible.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-gray-300
                       bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded text-sm text-white
                       bg-red-500 hover:bg-red-600 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### `src/store/canalStore.test.ts` (test)

**Source pattern :** RESEARCH.md — Validation Architecture + Vitest pattern

**Pattern complet :**
```typescript
// src/store/canalStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCanalStore } from './canalStore'

// Réinitialiser le store entre chaque test
beforeEach(() => {
  useCanalStore.setState({
    canals: [],
    mode: 'selection',
    draftPoints: [],
    previewCoord: null,
    selectedCanalId: null,
  })
})

describe('useCanalStore — MAP-02', () => {
  it('addWaypoint ajoute un point au draftPoints', () => {
    useCanalStore.getState().startDrawing()
    useCanalStore.getState().addWaypoint([2.35, 48.85])
    expect(useCanalStore.getState().draftPoints).toHaveLength(1)
    expect(useCanalStore.getState().draftPoints[0]).toEqual([2.35, 48.85])
  })

  it('finalizeCanal crée un canal si >= 2 points', () => {
    useCanalStore.getState().startDrawing()
    useCanalStore.getState().addWaypoint([2.35, 48.85])
    useCanalStore.getState().addWaypoint([3.0, 50.0])
    useCanalStore.getState().finalizeCanal()
    expect(useCanalStore.getState().canals).toHaveLength(1)
    expect(useCanalStore.getState().mode).toBe('selection')
    expect(useCanalStore.getState().draftPoints).toHaveLength(0)
  })

  it('finalizeCanal est no-op si < 2 points', () => {
    useCanalStore.getState().startDrawing()
    useCanalStore.getState().addWaypoint([2.35, 48.85])
    useCanalStore.getState().finalizeCanal()
    expect(useCanalStore.getState().canals).toHaveLength(0)
    expect(useCanalStore.getState().mode).toBe('drawing')
  })

  it('cancelDrawing réinitialise draftPoints et revient en selection', () => {
    useCanalStore.getState().startDrawing()
    useCanalStore.getState().addWaypoint([2.35, 48.85])
    useCanalStore.getState().cancelDrawing()
    expect(useCanalStore.getState().draftPoints).toHaveLength(0)
    expect(useCanalStore.getState().mode).toBe('selection')
  })

  it('deleteCanal retire le canal de la liste', () => {
    useCanalStore.getState().startDrawing()
    useCanalStore.getState().addWaypoint([2.35, 48.85])
    useCanalStore.getState().addWaypoint([3.0, 50.0])
    useCanalStore.getState().finalizeCanal()
    const id = useCanalStore.getState().canals[0].id
    useCanalStore.getState().deleteCanal(id)
    expect(useCanalStore.getState().canals).toHaveLength(0)
  })
})
```

---

## Shared Patterns

### Pattern Tailwind CSS v4 — Configuration Vite

**S'applique à :** `vite.config.ts`, `src/index.css`

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

```css
/* src/index.css — Tailwind v4 : import unique, pas de directives @tailwind */
@import 'tailwindcss';
@import 'maplibre-gl/dist/maplibre-gl.css';
```

**Source :** RESEARCH.md — Standard Stack + Tailwind CSS v4 setup

---

### Pattern sélecteurs Zustand — Éviter les re-renders inutiles

**S'applique à :** Tous les composants qui lisent le store

```typescript
// BONNE pratique — sélecteur granulaire, re-render uniquement si 'mode' change
const mode = useCanalStore((s) => s.mode)

// MAUVAISE pratique — re-render à chaque changement du store entier
const store = useCanalStore()
```

**Source :** Context7 `/pmndrs/zustand` — selector pattern

---

### Pattern focus-visible — Accessibilité clavier

**S'applique à :** DrawingToolbar, CanalListItem, DeleteConfirmDialog (tous les `<button>`)

```typescript
// Classe réutilisable — extraire si répété dans plusieurs composants
const focusRing = 'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
```

**Source :** UI-SPEC.md — Hover/Focus States

---

### Pattern `border-white/[0.08]` — Séparateurs sombres

**S'applique à :** SidePanel (sections), DeleteConfirmDialog (card border)

```typescript
// Séparateur entre sections du panel
'border-b border-white/[0.08]'
// Bord carte du dialog
'border border-white/[0.08]'
```

**Source :** UI-SPEC.md — Panel background `rgba(255,255,255,0.08)`

---

### Pattern MapLibre — Cleanup obligatoire

**S'applique à :** MapView (useEffect init), useMapInteraction (useEffect events)

```typescript
// Pattern cleanup standard — toujours retourner une fonction de cleanup
useEffect(() => {
  // setup...
  return () => {
    // cleanup — obligatoire pour éviter fuites mémoire (Pitfall 2)
    map.remove()       // dans MapView
    map.off(...)       // dans useMapInteraction
    map.doubleClickZoom.enable()
  }
}, [dépendances])
```

**Source :** RESEARCH.md — Pitfall 2 (fuite mémoire) + Pattern 1

---

## No Analog Found

Tous les fichiers de Phase 1 sont sans analog (projet greenfield). Les patterns ci-dessus sont issus de la documentation canonique de la stack vérifiée dans RESEARCH.md.

| Fichier | Rôle | Raison |
|---------|------|--------|
| `src/types/canal.ts` | model | Premier modèle de données du projet |
| `src/store/canalStore.ts` | store | Premier store Zustand du projet |
| `src/hooks/useMapInteraction.ts` | hook | Premier hook MapLibre du projet |
| `src/components/MapView.tsx` | component | Première intégration MapLibre |
| `src/components/SidePanel.tsx` | component | Premier composant panneau |
| `src/components/ModeIndicator.tsx` | component | Premier indicateur de mode |
| `src/components/DrawingToolbar.tsx` | component | Première toolbar de dessin |
| `src/components/CanalList.tsx` | component | Première liste métier |
| `src/components/CanalListItem.tsx` | component | Premier item de liste |
| `src/components/DeleteConfirmDialog.tsx` | component | Premier dialog de confirmation |
| `src/App.tsx` | component | Composant racine du projet |
| `src/store/canalStore.test.ts` | test | Première suite de tests |

---

## Pitfalls Critiques — Rappel pour le Planner

Ces pitfalls doivent être mentionnés dans les actions de plan correspondantes :

| Pitfall | Fichier concerné | Action requise |
|---------|-----------------|----------------|
| Double-clic zoom MapLibre | `useMapInteraction.ts` | `map.doubleClickZoom.disable()` à l'entrée du mode tracé |
| Fuite mémoire WebGL | `MapView.tsx` | `map.remove()` + `mapRef.current = null` dans le cleanup |
| Stale closure events | `useMapInteraction.ts` | `useCanalStore.getState()` dans les handlers, ou handlers recréés via `useEffect` |
| React 19 StrictMode double-mount | `MapView.tsx` | Guard `if (mapRef.current) return` avant `new maplibregl.Map()` |
| Coordonnées inversées | `types/canal.ts`, `store/canalStore.ts` | Toujours `[lng, lat]` — jamais `[lat, lng]` |
| addLayer/removeLayer en boucle | `MapView.tsx` | Sources init une fois au `load`, update via `setData()` uniquement |

---

## Metadata

**Scope de recherche analog :** N/A — codebase vide (projet greenfield)
**Fichiers scannés :** 0 (aucun code source existant)
**Sources des patterns :** RESEARCH.md (Context7 MapLibre + Zustand), UI-SPEC.md, CLAUDE.md
**Date d'extraction :** 2026-04-30

// src/store/canalStore.ts
import { create } from 'zustand'
import type { Canal, Coord, UIMode } from '../types/canal'
import type { ElevationProfile } from '../types/elevation'
import type { RoutingState } from '../types/routing'
import type { CalcParams } from '../types/calculation'
import { DEFAULT_CALC_PARAMS } from '../types/calculation'

interface CanalStore {
  // State
  canals: Canal[]
  mode: UIMode
  draftPoints: Coord[]
  previewCoord: Coord | null
  selectedCanalId: string | null

  // State routing — Phase 3
  routingState: RoutingState
  routingStart: [number, number] | null
  routingEnd: [number, number] | null

  // Actions routing — Phase 3
  startRouting: () => void
  setRoutingStart: (coord: [number, number]) => void
  setRoutingEnd: (coord: [number, number]) => void
  setRoutingState: (state: RoutingState) => void
  finalizeRoutedCanal: (path: [number, number][]) => void
  cancelRouting: () => void

  // Actions
  startDrawing: () => void
  addWaypoint: (coord: Coord) => void
  updatePreview: (coord: Coord) => void
  finalizeCanal: () => void
  cancelDrawing: () => void
  deleteCanal: (id: string) => void
  selectCanal: (id: string | null) => void
  setElevation: (id: string, profile: ElevationProfile) => void
  setElevationLoading: (id: string, loading: boolean) => void
  setElevationError: (id: string, error: string) => void

  // Calcul d'impact — Phase 4
  calcParams: CalcParams
  setCalcParams: (params: Partial<CalcParams>) => void
}

export const useCanalStore = create<CanalStore>()((set, get) => ({
  canals: [],
  mode: 'selection',
  draftPoints: [],
  previewCoord: null,
  selectedCanalId: null,
  routingState: 'idle' as RoutingState,
  routingStart: null,
  routingEnd: null,

  startRouting: () => set({ mode: 'routing', routingState: 'selecting-start', routingStart: null, routingEnd: null }),

  setRoutingStart: (coord) => set({ routingStart: coord, routingState: 'selecting-end' }),

  setRoutingEnd: (coord) => set({ routingEnd: coord, routingState: 'computing' }),

  setRoutingState: (state) => set({ routingState: state }),

  finalizeRoutedCanal: (path) => {
    const { canals } = get()
    if (path.length < 2) return  // garde obligatoire
    const newCanal: Canal = {
      id: crypto.randomUUID(),
      points: path,
      name: `Canal optimal ${canals.length + 1}`,
      createdAt: Date.now(),
      isRouted: true,
    }
    set((state) => ({
      canals: [...state.canals, newCanal],
      mode: 'selection',
      routingState: 'idle',
      routingStart: null,
      routingEnd: null,
      selectedCanalId: newCanal.id,
    }))
  },

  cancelRouting: () => set({ mode: 'selection', routingState: 'idle', routingStart: null, routingEnd: null }),

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

  setElevation: (id, profile) => set((state) => ({
    canals: state.canals.map((c) =>
      c.id === id ? { ...c, elevation: profile, elevationLoading: false, elevationError: undefined } : c
    ),
  })),

  setElevationLoading: (id, loading) => set((state) => ({
    canals: state.canals.map((c) =>
      c.id === id ? { ...c, elevationLoading: loading } : c
    ),
  })),

  setElevationError: (id, error) => set((state) => ({
    canals: state.canals.map((c) =>
      c.id === id ? { ...c, elevationError: error, elevationLoading: false } : c
    ),
  })),

  calcParams: DEFAULT_CALC_PARAMS,

  setCalcParams: (params) => set((state) => ({
    calcParams: { ...state.calcParams, ...params }
  })),
}))

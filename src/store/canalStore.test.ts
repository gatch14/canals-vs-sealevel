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
    routingState: 'idle',
    routingStart: null,
    routingEnd: null,
    calcParams: { width: 50, depth: 5 },
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

describe('useCanalStore — MAP-05 routing actions', () => {
  it('startRouting passe en mode routing et routingState selecting-start', () => {
    useCanalStore.getState().startRouting()
    expect(useCanalStore.getState().mode).toBe('routing')
    expect(useCanalStore.getState().routingState).toBe('selecting-start')
    expect(useCanalStore.getState().routingStart).toBeNull()
  })

  it('setRoutingStart enregistre les coordonnées et passe à selecting-end', () => {
    useCanalStore.getState().startRouting()
    useCanalStore.getState().setRoutingStart([2.35, 48.85])
    expect(useCanalStore.getState().routingStart).toEqual([2.35, 48.85])
    expect(useCanalStore.getState().routingState).toBe('selecting-end')
  })

  it('setRoutingEnd enregistre les coordonnées et passe à computing', () => {
    useCanalStore.getState().startRouting()
    useCanalStore.getState().setRoutingStart([2.35, 48.85])
    useCanalStore.getState().setRoutingEnd([5.0, 45.0])
    expect(useCanalStore.getState().routingEnd).toEqual([5.0, 45.0])
    expect(useCanalStore.getState().routingState).toBe('computing')
  })

  it('finalizeRoutedCanal crée canal isRouted avec sélection auto', () => {
    const path: [number, number][] = [[2.35, 48.85], [3.0, 47.0], [5.0, 45.0]]
    useCanalStore.getState().finalizeRoutedCanal(path)
    const canals = useCanalStore.getState().canals
    expect(canals).toHaveLength(1)
    expect(canals[0].isRouted).toBe(true)
    expect(canals[0].name).toMatch(/^Canal optimal/)
    expect(canals[0].points).toEqual(path)
    expect(useCanalStore.getState().selectedCanalId).toBe(canals[0].id)
    expect(useCanalStore.getState().mode).toBe('selection')
    expect(useCanalStore.getState().routingState).toBe('idle')
  })

  it('cancelRouting remet selection + idle et efface les points', () => {
    useCanalStore.getState().startRouting()
    useCanalStore.getState().setRoutingStart([2.35, 48.85])
    useCanalStore.getState().cancelRouting()
    expect(useCanalStore.getState().mode).toBe('selection')
    expect(useCanalStore.getState().routingState).toBe('idle')
    expect(useCanalStore.getState().routingStart).toBeNull()
  })
})

describe('useCanalStore — Phase 4 calcParams', () => {
  it('calcParams est initialisé à { width: 50, depth: 5 } (D-01)', () => {
    expect(useCanalStore.getState().calcParams).toEqual({ width: 50, depth: 5 })
  })

  it('setCalcParams({ width: 80 }) merge sans toucher depth', () => {
    useCanalStore.getState().setCalcParams({ width: 80 })
    expect(useCanalStore.getState().calcParams).toEqual({ width: 80, depth: 5 })
  })

  it('setCalcParams({ depth: 10 }) merge sans toucher width', () => {
    useCanalStore.getState().setCalcParams({ depth: 10 })
    expect(useCanalStore.getState().calcParams).toEqual({ width: 50, depth: 10 })
  })
})

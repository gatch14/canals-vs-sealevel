// src/tests/candidates.test.ts
// Wave 0 — Tests RED. useCandidates n'existe pas encore.
// T02 (Wave 1) implémente le hook et l'action store pour faire passer ces tests en GREEN.
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCandidates } from '../hooks/useCandidates'
import { useCanalStore } from '../store/canalStore'
import type { CanalCandidate } from '../types/candidate'

// Fixture candidat minimal
const MOCK_CANDIDATE: CanalCandidate = {
  id: 'test-canal',
  name: 'Canal Test',
  region: 'Test Region',
  dsl_min: 1.0,
  dsl_max: 2.0,
  points: [[2.35, 48.85], [5.0, 46.0]],
  feasible: true,
  cost_min: 10,
  cost_max: 40,
}

describe('useCandidates — liste triée (IA-01)', () => {
  it('retourne exactement 25 candidats', () => {
    const { result } = renderHook(() => useCandidates())
    expect(result.current).toHaveLength(25)
  })

  it('retourne les candidats triés par dsl_max décroissant', () => {
    const { result } = renderHook(() => useCandidates())
    const candidates = result.current
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].dsl_max).toBeGreaterThanOrEqual(candidates[i].dsl_max)
    }
  })

  it('place Qattara Depression en premier candidat', () => {
    const { result } = renderHook(() => useCandidates())
    expect(result.current[0].id).toBe('qattara-depression')
  })
})

describe('loadCandidate — chargement non-destructif (IA-03)', () => {
  beforeEach(() => {
    // Réinitialiser le store entre les tests
    useCanalStore.getState().clearAll()
  })

  it('ajoute un canal dans le store sans supprimer les existants', async () => {
    const store = useCanalStore.getState()

    // Charger un premier canal
    await act(async () => {
      store.loadCandidate(MOCK_CANDIDATE)
    })
    expect(useCanalStore.getState().canals).toHaveLength(1)

    // Charger un deuxième — le premier doit rester
    const MOCK_2: CanalCandidate = { ...MOCK_CANDIDATE, id: 'test-canal-2', name: 'Canal Test 2' }
    await act(async () => {
      store.loadCandidate(MOCK_2)
    })
    expect(useCanalStore.getState().canals).toHaveLength(2)
  })

  it('sélectionne automatiquement le canal chargé (IA-03)', async () => {
    await act(async () => {
      useCanalStore.getState().loadCandidate(MOCK_CANDIDATE)
    })
    const state = useCanalStore.getState()
    const loaded = state.canals.find((c) => c.name === 'Canal Test')
    expect(loaded).toBeDefined()
    expect(state.selectedCanalId).toBe(loaded!.id)
  })

  it('crée un Canal avec les points du candidat', async () => {
    await act(async () => {
      useCanalStore.getState().loadCandidate(MOCK_CANDIDATE)
    })
    const canal = useCanalStore.getState().canals[0]
    expect(canal.points).toEqual(MOCK_CANDIDATE.points)
    expect(canal.name).toBe(MOCK_CANDIDATE.name)
  })
})

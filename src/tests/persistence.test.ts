// src/tests/persistence.test.ts
// Wave 0 — Stubs RED. db.ts n'existe pas encore.
// T02 implémente db.ts et fait passer ces tests en GREEN.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'

// Ces imports échouent tant que db.ts n'est pas créé (Wave 1 / T02)
import { db } from '../services/db'
import type { StoredCanal } from '../types/canal'
import type { CalcParams } from '../types/calculation'

// Fixtures
const mockCanal: StoredCanal = {
  id: 'canal-test-1',
  points: [[2.35, 48.85], [5.0, 46.0]],
  name: 'Canal Test Paris-Lyon',
  createdAt: 1000000,
  isRouted: false,
}

const mockCalcParams: CalcParams = { width: 100, depth: 10 }

describe('db — canals CRUD (PERS-01)', () => {
  beforeEach(async () => {
    await db.canals.clear()
    await db.settings.clear()
  })

  it('bulkPut + toArray retourne les canaux persistés', async () => {
    await db.canals.bulkPut([mockCanal])
    const result = await db.canals.toArray()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('canal-test-1')
    expect(result[0].name).toBe('Canal Test Paris-Lyon')
  })

  it('bulkDelete supprime les canaux absents du store', async () => {
    const canal2: StoredCanal = { ...mockCanal, id: 'canal-test-2', name: 'Canal 2' }
    await db.canals.bulkPut([mockCanal, canal2])
    // Simuler suppression de canal-test-2 : store contient uniquement canal-test-1
    const currentIds = new Set(['canal-test-1'])
    const all = await db.canals.toArray()
    const toDelete = all.filter((c) => !currentIds.has(c.id)).map((c) => c.id)
    await db.canals.bulkDelete(toDelete)
    const remaining = await db.canals.toArray()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('canal-test-1')
  })

  it('clear() vide la table canals', async () => {
    await db.canals.bulkPut([mockCanal])
    await db.canals.clear()
    const result = await db.canals.toArray()
    expect(result).toHaveLength(0)
  })
})

describe('db — settings CRUD (PERS-02)', () => {
  beforeEach(async () => {
    await db.settings.clear()
  })

  it('put + get calcParams round-trip retourne les mêmes valeurs', async () => {
    await db.settings.put({ key: 'calcParams', value: mockCalcParams })
    const record = await db.settings.get('calcParams')
    expect(record).toBeDefined()
    expect(record!.value).toEqual(mockCalcParams)
  })

  it('put écrase la valeur précédente (upsert)', async () => {
    await db.settings.put({ key: 'calcParams', value: { width: 50, depth: 5 } })
    await db.settings.put({ key: 'calcParams', value: mockCalcParams })
    const record = await db.settings.get('calcParams')
    expect((record!.value as CalcParams).width).toBe(100)
  })
})

describe('db — transaction clear (PERS-03)', () => {
  it('transaction rw clear vide les deux tables de façon atomique', async () => {
    await db.canals.bulkPut([mockCanal])
    await db.settings.put({ key: 'calcParams', value: mockCalcParams })

    await db.transaction('rw', [db.canals, db.settings], async () => {
      await db.canals.clear()
      await db.settings.clear()
    })

    const canals = await db.canals.toArray()
    const settings = await db.settings.toArray()
    expect(canals).toHaveLength(0)
    expect(settings).toHaveLength(0)
  })
})

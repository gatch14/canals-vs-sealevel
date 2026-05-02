// src/services/db.ts
// Singleton Dexie — couche IndexedDB, source de persistance sous-jacente au store Zustand.
// Zéro logique métier ici — uniquement lecture/écriture brute.
// Schema v1 : tables canals (PK=id) + settings (PK=key).
// Voir RESEARCH.md Pattern 1 et Pitfall 2 (elevation exclue via StoredCanal).
import Dexie, { type Table } from 'dexie'
import type { StoredCanal } from '../types/canal'

interface SettingsRecord {
  key: string
  value: unknown
}

class CanalDatabase extends Dexie {
  canals!: Table<StoredCanal, string>
  settings!: Table<SettingsRecord, string>

  constructor() {
    super('CanalDB')
    this.version(1).stores({
      canals: 'id, createdAt',  // id = PK manuelle (UUID) ; createdAt indexé pour tris futurs
      settings: 'key',          // key = PK manuelle ; valeur attendue : 'calcParams'
    })
  }
}

export const db = new CanalDatabase()

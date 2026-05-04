---
plan_id: 07-T01
phase: 7
wave: 0
title: "Installation dépendances + types StoredCanal + stubs tests RED"
depends_on: []
files_modified:
  - package.json
  - src/types/canal.ts
  - src/tests/persistence.test.ts
  - src/store/canalStore.test.ts
requirements_addressed:
  - PERS-01
  - PERS-02
  - PERS-03
autonomous: true
must_haves:
  truths:
    - "dexie est dans dependencies de package.json"
    - "fake-indexeddb est dans devDependencies de package.json"
    - "StoredCanal est exporté depuis src/types/canal.ts"
    - "src/tests/persistence.test.ts existe avec des tests qui échouent (RED)"
    - "Les tests clearAll et hydrateCanals dans canalStore.test.ts échouent (RED)"
  anti_truths:
    - "Les tests persistence.test.ts passent avant l'implémentation de db.ts"
    - "elevation, elevationLoading, elevationError sont présents dans StoredCanal"
    - "dexie est importé dans les fichiers source avant T02"
---

<objective>
Préparer l'infrastructure de test et les contrats de types pour la persistance Dexie.

Purpose: Wave 0 selon le pattern TDD du projet — établir les stubs RED avant toute implémentation, garantir que les tests échouent pour les bonnes raisons.
Output: types/canal.ts étendu avec StoredCanal, fichier de tests persistence.test.ts (stubs RED), tests canalStore (stubs RED pour clearAll/hydrateCanals), dépendances installées.
</objective>

<execution_context>
@C:\Users\gatch\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\gatch\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\dev\gsd\science\canal\.planning\PROJECT.md
@C:\dev\gsd\science\canal\.planning\ROADMAP.md
@C:\dev\gsd\science\canal\.planning\STATE.md

<interfaces>
<!-- Types existants — extraits de src/types/canal.ts -->
```typescript
// src/types/canal.ts
export type Coord = [number, number]  // [lng, lat]
export type UIMode = 'selection' | 'drawing' | 'routing'

export interface Canal {
  id: string             // crypto.randomUUID()
  points: Coord[]        // minimum 2 points
  name: string
  createdAt: number      // Date.now()
  elevation?: ElevationProfile   // Phase 2 — optionnel
  elevationLoading?: boolean     // Phase 2
  elevationError?: string        // Phase 2
  isRouted?: boolean             // Phase 3
}
```

<!-- Types existants — extraits de src/types/calculation.ts -->
```typescript
export interface CalcParams {
  width: number   // m — défaut 50
  depth: number   // m — défaut 5
}

export const DEFAULT_CALC_PARAMS: CalcParams = { width: 50, depth: 5 }
```

<!-- Store Zustand existant — interface CanalStore dans src/store/canalStore.ts -->
// Les actions clearAll et hydrateCanals N'EXISTENT PAS ENCORE — T02 les implémentera.
// T01 écrit uniquement les stubs de test qui vérifient leur futur comportement.

<!-- Pattern de test existant (src/tests/calculationEngine.test.ts) -->
// Import Vitest : import { describe, it, expect, beforeEach, vi } from 'vitest'
// Fixtures locales — pas de factories externes
// describe + it structure avec beforeEach pour reset
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Installer dexie + fake-indexeddb</name>
  <files>package.json</files>
  <read_first>
    - C:\dev\gsd\science\canal\package.json — vérifier les dépendances existantes avant installation
  </read_first>
  <action>
Exécuter dans le répertoire du projet :

```bash
npm install dexie
npm install --save-dev fake-indexeddb
```

Versions cibles (vérifiées RESEARCH.md) :
- dexie : 4.4.2 (runtime dependency)
- fake-indexeddb : 6.2.5 (devDependency)

Vérifier après installation que package.json contient :
- `"dexie"` dans `"dependencies"`
- `"fake-indexeddb"` dans `"devDependencies"`

Ne pas modifier manuellement package.json — laisser npm gérer les versions réelles installées.
  </action>
  <verify>
    <automated>node -e "const p = require('./package.json'); console.log('dexie:', p.dependencies.dexie || 'MISSING'); console.log('fakeIDB:', p.devDependencies['fake-indexeddb'] || 'MISSING')"</automated>
  </verify>
  <acceptance_criteria>
    - package.json contient `"dexie"` dans `dependencies` avec une version
    - package.json contient `"fake-indexeddb"` dans `devDependencies` avec une version
    - `node_modules/dexie` existe
    - `node_modules/fake-indexeddb` existe
  </acceptance_criteria>
  <done>Les deux packages sont installés et présents dans package.json.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Ajouter StoredCanal dans src/types/canal.ts</name>
  <files>src/types/canal.ts</files>
  <read_first>
    - C:\dev\gsd\science\canal\src\types\canal.ts — lire intégralement avant modification
  </read_first>
  <behavior>
    - StoredCanal = Canal sans les champs elevation, elevationLoading, elevationError
    - StoredCanal est exporté depuis canal.ts
    - L'interface Canal existante est inchangée (rétrocompatibilité)
  </behavior>
  <action>
Ajouter à la fin de src/types/canal.ts (après l'interface Canal existante) :

```typescript
/**
 * Canal tel que stocké dans IndexedDB (Phase 7).
 * elevation* exclus : champs éphémères re-fetchés par useElevation au besoin.
 * Voir RESEARCH.md Pitfall 2 et 5 — évite quota et stale data.
 */
export type StoredCanal = Omit<Canal, 'elevation' | 'elevationLoading' | 'elevationError'>
```

NE PAS modifier l'interface Canal existante ni aucune autre ligne du fichier.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - grep dans src/types/canal.ts trouve `export type StoredCanal = Omit<Canal, 'elevation' | 'elevationLoading' | 'elevationError'>`
    - `npx tsc --noEmit` retourne 0 erreurs TypeScript
    - L'interface Canal originale est inchangée (grep confirme que `elevation?: ElevationProfile` est toujours présent)
  </acceptance_criteria>
  <done>StoredCanal exporté depuis canal.ts, compilation TypeScript verte.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Créer src/tests/persistence.test.ts avec stubs RED</name>
  <files>src/tests/persistence.test.ts</files>
  <read_first>
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-RESEARCH.md (sections Code Examples et Pattern 2)
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-PATTERNS.md (section persistence.test.ts)
  </read_first>
  <behavior>
    - Tests RED : db.ts n'existe pas encore, les imports échouent → tests failed
    - Couvre PERS-01 : bulkPut + toArray round-trip
    - Couvre PERS-01 : bulkDelete supprime les canaux absents du store
    - Couvre PERS-02 : put + get calcParams round-trip
    - Couvre PERS-03 : transaction clear vide les deux tables
    - Import fake-indexeddb/auto en tête de fichier pour polyfiller IndexedDB dans jsdom
  </behavior>
  <action>
Créer src/tests/persistence.test.ts avec le contenu suivant :

```typescript
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
```

Le fichier doit être créé tel quel. Les imports de `../services/db` échoueront jusqu'à ce que T02 crée ce fichier — c'est le comportement RED attendu.
  </action>
  <verify>
    <automated>npm run test -- --run src/tests/persistence.test.ts 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - Le fichier src/tests/persistence.test.ts existe
    - `npm run test -- --run src/tests/persistence.test.ts` retourne une erreur d'import (Cannot find module '../services/db') — RED attendu
    - Le fichier contient `import 'fake-indexeddb/auto'` à la première ligne d'import
    - Le fichier contient les 4 describe blocks : 'db — canals CRUD', 'db — settings CRUD', 'db — transaction clear'
    - grep dans le fichier trouve `StoredCanal` (import du type)
  </acceptance_criteria>
  <done>persistence.test.ts créé, tests RED confirmés (erreur d'import db.ts attendue).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Ajouter stubs RED clearAll + hydrateCanals dans canalStore.test.ts</name>
  <files>src/store/canalStore.test.ts</files>
  <read_first>
    - C:\dev\gsd\science\canal\src\store\canalStore.test.ts — lire intégralement pour trouver la fin du fichier et comprendre la structure de tests existante
    - C:\dev\gsd\science\canal\src\store\canalStore.ts — pour connaître DEFAULT_CALC_PARAMS et l'état initial attendu
  </read_first>
  <behavior>
    - clearAll() doit remettre canals=[], selectedCanalId=null, draftPoints=[], previewCoord=null, mode='selection', routingState='idle', routingStart=null, routingEnd=null, calcParams=DEFAULT_CALC_PARAMS
    - hydrateCanals(canals) doit remplacer state.canals par le tableau fourni
    - Tests RED : clearAll et hydrateCanals n'existent pas encore dans le store → expect(store.clearAll).toBeDefined() échoue
  </behavior>
  <action>
Lire src/store/canalStore.test.ts en entier pour identifier la fin du fichier. Ajouter les blocs de tests suivants à la fin du fichier existant (avant la dernière accolade fermante si le fichier se termine par un describe englobant, ou directement à la fin sinon) :

```typescript
// ─── Phase 7 — Persistance : nouveaux tests RED (T01 Wave 0) ─────────────────
// clearAll et hydrateCanals n'existent pas dans le store — ces tests sont RED.
// T02 ajoute les actions et les fait passer en GREEN.

describe('clearAll (PERS-03)', () => {
  it('clearAll est une action du store', () => {
    const store = useCanalStore.getState()
    expect(typeof store.clearAll).toBe('function')
  })

  it('clearAll remet canals à []', () => {
    // Préparation : ajouter un canal via finalizeCanal
    useCanalStore.setState({
      canals: [{ id: 'c1', points: [[0,0],[1,1]], name: 'C1', createdAt: 1 }],
      selectedCanalId: 'c1',
      mode: 'drawing',
    })
    useCanalStore.getState().clearAll()
    const state = useCanalStore.getState()
    expect(state.canals).toEqual([])
    expect(state.selectedCanalId).toBeNull()
    expect(state.mode).toBe('selection')
  })

  it('clearAll remet calcParams à DEFAULT_CALC_PARAMS', () => {
    useCanalStore.setState({ calcParams: { width: 999, depth: 999 } })
    useCanalStore.getState().clearAll()
    const { calcParams } = useCanalStore.getState()
    expect(calcParams.width).toBe(50)
    expect(calcParams.depth).toBe(5)
  })
})

describe('hydrateCanals (PERS-01)', () => {
  it('hydrateCanals est une action du store', () => {
    const store = useCanalStore.getState()
    expect(typeof store.hydrateCanals).toBe('function')
  })

  it('hydrateCanals remplace canals par le tableau fourni', () => {
    const toLoad = [
      { id: 'hydrated-1', points: [[2.35, 48.85], [5.0, 46.0]] as import('../types/canal').Coord[], name: 'Hydraté', createdAt: 2000 },
    ]
    useCanalStore.getState().hydrateCanals(toLoad)
    const { canals } = useCanalStore.getState()
    expect(canals).toHaveLength(1)
    expect(canals[0].id).toBe('hydrated-1')
  })

  it('hydrateCanals avec tableau vide ne change pas les canaux existants si pas appelé', () => {
    // Vérification que hydrateCanals([]) remet bien canals à [] si appelé
    useCanalStore.setState({
      canals: [{ id: 'pre', points: [[0,0],[1,1]], name: 'Pre', createdAt: 1 }],
    })
    useCanalStore.getState().hydrateCanals([])
    expect(useCanalStore.getState().canals).toEqual([])
  })
})
```

S'assurer que les imports nécessaires sont présents en haut du fichier. Si `import { useCanalStore } from '../store/canalStore'` n'est pas déjà importé, l'ajouter (mais il est probablement déjà là dans le fichier existant).
  </action>
  <verify>
    <automated>npm run test -- --run src/store/canalStore.test.ts 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `npm run test -- --run src/store/canalStore.test.ts` affiche des tests échouant sur les blocs 'clearAll' et 'hydrateCanals' (erreur "is not a function" ou TypeError)
    - Les tests existants dans canalStore.test.ts continuent de passer (seuls les nouveaux blocs sont RED)
    - grep dans canalStore.test.ts trouve `clearAll` et `hydrateCanals`
    - grep dans canalStore.test.ts trouve `PERS-03` et `PERS-01`
  </acceptance_criteria>
  <done>Stubs RED pour clearAll et hydrateCanals ajoutés dans canalStore.test.ts. Tests existants toujours GREEN, nouveaux tests RED.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| IndexedDB ↔ Store | Données lues depuis IndexedDB — viennent du même navigateur, même origine |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07-01 | Tampering | IndexedDB (DevTools) | accept | App usage personnel, données locales non sensibles (coordonnées géographiques, calculs) — pas de surface serveur |
| T-07-02 | Information Disclosure | IndexedDB | accept | Données scientifiques (coordonnées, calculs) — pas de PII, accessible uniquement à l'origine localhost |
</threat_model>

<verification>
Wave 0 complète quand :
1. `node -e "const p=require('./package.json'); console.log(p.dependencies.dexie, p.devDependencies['fake-indexeddb'])"` affiche deux versions
2. `npx tsc --noEmit` passe sans erreurs
3. `npm run test -- --run src/tests/persistence.test.ts` échoue avec "Cannot find module '../services/db'" (RED confirmé)
4. `npm run test -- --run src/store/canalStore.test.ts` montre tests clearAll/hydrateCanals failed, tests existants passed
</verification>

<success_criteria>
- dexie dans package.json dependencies
- fake-indexeddb dans package.json devDependencies
- StoredCanal = Omit<Canal, 'elevation' | 'elevationLoading' | 'elevationError'> exporté depuis canal.ts
- src/tests/persistence.test.ts présent avec 5 tests RED
- canalStore.test.ts contient tests clearAll (2 cas) et hydrateCanals (2 cas) RED
- TypeScript compile sans erreurs
</success_criteria>

<output>
After completion, create `.planning/phases/07-persistance-locale/07-T01-SUMMARY.md`
</output>

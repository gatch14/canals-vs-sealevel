---
plan_id: 07-T02
phase: 7
wave: 1
title: "db.ts + actions store + usePersistence.ts → tests GREEN"
depends_on:
  - 07-T01
files_modified:
  - src/services/db.ts
  - src/store/canalStore.ts
  - src/hooks/usePersistence.ts
requirements_addressed:
  - PERS-01
  - PERS-02
  - PERS-03
autonomous: true
must_haves:
  truths:
    - "src/services/db.ts exporte const db avec tables canals et settings"
    - "canalStore contient les actions clearAll et hydrateCanals"
    - "src/hooks/usePersistence.ts exporte la fonction usePersistence"
    - "npm run test passe la suite complète incluant persistence.test.ts"
    - "Les 89 tests existants restent GREEN après modification du store"
  anti_truths:
    - "Le champ elevation est inclus dans les canaux écrits dans IndexedDB"
    - "subscribeWithSelector middleware est ajouté au store (modifie la signature TypeScript)"
    - "db.ts contient de la logique métier (calculs, transformations autres que stripElevation)"
---

<objective>
Implémenter la couche de persistance complète : service Dexie singleton, actions store, hook d'hydration/synchronisation.

Purpose: Transformer les stubs RED de T01 en tests GREEN — la persistance est fonctionnelle après cette tâche.
Output: db.ts (singleton Dexie), canalStore.ts (+ clearAll + hydrateCanals), usePersistence.ts (hydration + subscribe), tous les tests persistence.test.ts et canalStore.test.ts GREEN.
</objective>

<execution_context>
@C:\Users\gatch\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\gatch\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\dev\gsd\science\canal\.planning\PROJECT.md
@C:\dev\gsd\science\canal\.planning\ROADMAP.md
@C:\dev\gsd\science\canal\.planning\STATE.md
@C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-T01-SUMMARY.md

<interfaces>
<!-- src/types/canal.ts — après T01 -->
```typescript
export type Coord = [number, number]
export type UIMode = 'selection' | 'drawing' | 'routing'

export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  elevation?: ElevationProfile
  elevationLoading?: boolean
  elevationError?: string
  isRouted?: boolean
}

// Ajouté en T01
export type StoredCanal = Omit<Canal, 'elevation' | 'elevationLoading' | 'elevationError'>
```

<!-- src/types/calculation.ts -->
```typescript
export interface CalcParams { width: number; depth: number }
export const DEFAULT_CALC_PARAMS: CalcParams = { width: 50, depth: 5 }
```

<!-- src/store/canalStore.ts — interface CanalStore actuelle (avant T02) -->
// Actions EXISTANTES : startRouting, setRoutingStart, setRoutingEnd, setRoutingState,
// finalizeRoutedCanal, cancelRouting, startDrawing, addWaypoint, updatePreview,
// finalizeCanal, cancelDrawing, deleteCanal, selectCanal, setElevation,
// setElevationLoading, setElevationError, setCalcParams
// Actions À AJOUTER en T02 : clearAll, hydrateCanals

<!-- Pattern existant useElevation.ts — cleanup avec cancelled flag -->
```typescript
useEffect(() => {
  let cancelled = false
  const run = async () => { ... if (cancelled) return ... }
  run()
  return () => { cancelled = true; controller.abort() }
}, [deps])
```

<!-- Pattern subscribe Zustand sans subscribeWithSelector (RESEARCH.md recommandation) -->
// Utiliser useCanalStore.subscribe((state) => { ... }) avec comparaison manuelle
// NE PAS utiliser subscribeWithSelector — modifie la signature TypeScript du store
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Créer src/services/db.ts — singleton Dexie</name>
  <files>src/services/db.ts</files>
  <read_first>
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-RESEARCH.md (Pattern 1 : Singleton Dexie)
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-PATTERNS.md (section db.ts)
    - C:\dev\gsd\science\canal\src\services\elevationApi.ts — lire pour reproduire le style de commentaire en-tête et la structure service
  </read_first>
  <behavior>
    - db.canals : Table<StoredCanal, string> — PK = id (string UUID, pas d'auto-increment)
    - db.settings : Table<{ key: string; value: unknown }, string> — PK = key
    - schema version(1) : canals: 'id, createdAt', settings: 'key'
    - export const db = new CanalDatabase() — singleton
    - Aucune logique métier dans ce fichier — CRUD Dexie uniquement
  </behavior>
  <action>
Créer src/services/db.ts avec le contenu suivant :

```typescript
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
```

Vérifications à faire :
- L'import utilise `StoredCanal` (pas `Canal`) — elevation* sont exclus
- Pas de `++` avant `id` — les IDs sont générés par crypto.randomUUID(), pas auto-increment Dexie
- La clé `key` dans SettingsRecord correspond au champ PK déclaré dans `.stores({ settings: 'key' })`
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <acceptance_criteria>
    - src/services/db.ts existe
    - `npx tsc --noEmit` passe sans erreurs
    - grep dans db.ts trouve `StoredCanal` (pas `Canal` pour la table canals)
    - grep dans db.ts trouve `'id, createdAt'` pour le schema canals
    - grep dans db.ts trouve `export const db = new CanalDatabase()`
    - `npm run test -- --run src/tests/persistence.test.ts` : les imports ne lèvent plus d'erreur "Cannot find module"
  </acceptance_criteria>
  <done>db.ts singleton Dexie créé, TypeScript propre, imports tests débloqués.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Ajouter clearAll + hydrateCanals dans canalStore.ts</name>
  <files>src/store/canalStore.ts</files>
  <read_first>
    - C:\dev\gsd\science\canal\src\store\canalStore.ts — lire intégralement pour connaître l'interface CanalStore et la structure create()
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-PATTERNS.md (section canalStore.ts)
  </read_first>
  <behavior>
    - clearAll() remet le store à l'état initial : canals=[], selectedCanalId=null, draftPoints=[], previewCoord=null, mode='selection', routingState='idle', routingStart=null, routingEnd=null, calcParams=DEFAULT_CALC_PARAMS
    - hydrateCanals(canals: Canal[]) fait set({ canals }) — remplace le tableau en entier
    - Les deux actions sont déclarées dans l'interface CanalStore et implémentées dans create()
    - Aucune autre ligne du fichier n'est modifiée
  </behavior>
  <action>
Modifier src/store/canalStore.ts — deux points de modification :

**1. Dans l'interface CanalStore**, ajouter après `setCalcParams` (ligne ~44) :

```typescript
  // Persistance — Phase 7
  clearAll: () => void
  hydrateCanals: (canals: Canal[]) => void
```

**2. Dans le corps du create()**, ajouter après l'implémentation de `setCalcParams` (ligne ~143) :

```typescript
  clearAll: () => set({
    canals: [],
    selectedCanalId: null,
    draftPoints: [],
    previewCoord: null,
    mode: 'selection' as UIMode,
    routingState: 'idle' as RoutingState,
    routingStart: null,
    routingEnd: null,
    calcParams: DEFAULT_CALC_PARAMS,
  }),

  hydrateCanals: (canals) => set({ canals }),
```

Ne modifier aucune autre ligne. Respecter le style de virgule trailing existant du fichier.
  </action>
  <verify>
    <automated>npm run test -- --run src/store/canalStore.test.ts 2>&1 | tail -15</automated>
  </verify>
  <acceptance_criteria>
    - `npm run test -- --run src/store/canalStore.test.ts` : tous les tests passent, y compris les blocs clearAll et hydrateCanals ajoutés en T01
    - `npx tsc --noEmit` retourne 0 erreurs
    - grep dans canalStore.ts trouve `clearAll: () => void` dans l'interface
    - grep dans canalStore.ts trouve `hydrateCanals: (canals: Canal[]) => void` dans l'interface
    - grep dans canalStore.ts trouve `hydrateCanals: (canals) => set({ canals })`
  </acceptance_criteria>
  <done>clearAll et hydrateCanals implémentés, tous les tests canalStore GREEN.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Créer src/hooks/usePersistence.ts + valider tous les tests GREEN</name>
  <files>src/hooks/usePersistence.ts</files>
  <read_first>
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-RESEARCH.md (Pattern 2 complet)
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-PATTERNS.md (section usePersistence.ts)
    - C:\dev\gsd\science\canal\src\hooks\useElevation.ts — pattern cleanup avec cancelled flag
    - C:\dev\gsd\science\canal\src\tests\persistence.test.ts — vérifier que tous les cas sont couverts
  </read_first>
  <behavior>
    - useEffect avec [] — s'exécute une seule fois au montage (cohérent avec useElevation)
    - Hydration : Promise.all([db.canals.toArray(), db.settings.get('calcParams')]) puis hydrateCanals + setCalcParams si données présentes
    - Subscribe : useCanalStore.subscribe avec comparaison de références (prevCanals !== state.canals OU prevCalcParams !== state.calcParams)
    - Sync canals : bulkPut(state.canals) puis bulkDelete des IDs orphelins (Pitfall 6)
    - Sync calcParams : db.settings.put({ key: 'calcParams', value: state.calcParams })
    - Cleanup : cancelled = true + unsub() — StrictMode safe
    - Erreurs : console.warn('[persistence] ...') + fallback silencieux — jamais throw vers l'UI
    - NE PAS utiliser subscribeWithSelector — subscribe basique avec comparaison manuelle
  </behavior>
  <action>
Créer src/hooks/usePersistence.ts :

```typescript
// src/hooks/usePersistence.ts
// Hydration au montage + subscribe Zustand → écriture Dexie à chaque mutation.
// Appelé dans SidePanel.tsx (même pattern que useElevation + useRoutingWorker).
// RESEARCH.md Pattern 2 — subscribe basique (sans subscribeWithSelector) pour
// éviter de modifier la signature TypeScript du store existant.
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { db } from '../services/db'
import type { CalcParams } from '../types/calculation'
import type { StoredCanal } from '../types/canal'

/**
 * Orchestre la persistance locale :
 * 1. Hydrate le store Zustand depuis IndexedDB au montage de SidePanel
 * 2. Synchronise Zustand → IndexedDB à chaque mutation de canals ou calcParams
 *
 * Exclusion elevation* : Canal.elevation non persistée (RESEARCH.md Pitfall 2 + 5).
 */
export function usePersistence() {
  useEffect(() => {
    let cancelled = false

    // ── 1. Hydration au montage ──────────────────────────────────────────────
    const hydrate = async () => {
      try {
        const [storedCanals, settings] = await Promise.all([
          db.canals.toArray(),
          db.settings.get('calcParams'),
        ])
        if (cancelled) return
        const store = useCanalStore.getState()
        if (storedCanals.length > 0) {
          // StoredCanal est compatible avec Canal (elevation* sont optionnels dans Canal)
          store.hydrateCanals(storedCanals)
        }
        if (settings?.value) {
          store.setCalcParams(settings.value as Partial<CalcParams>)
        }
      } catch (err) {
        // Graceful fallback : navigation privée Firefox, quota dépassé, etc.
        // RESEARCH.md Pitfall 3
        console.warn('[persistence] Hydration failed, starting fresh:', err)
      }
    }

    hydrate()

    // ── 2. Subscribe Zustand → sync Dexie à chaque mutation ─────────────────
    // Pattern subscribe basique avec comparaison de références (RESEARCH.md Pattern 2)
    // Évite subscribeWithSelector qui modifie la signature TypeScript du store.
    let prevCanals = useCanalStore.getState().canals
    let prevCalcParams = useCanalStore.getState().calcParams

    const unsub = useCanalStore.subscribe(async (state) => {
      if (cancelled) return

      const canalsChanged = state.canals !== prevCanals
      const paramsChanged = state.calcParams !== prevCalcParams

      if (!canalsChanged && !paramsChanged) return

      prevCanals = state.canals
      prevCalcParams = state.calcParams

      try {
        if (canalsChanged) {
          // Exclure elevation* avant persistance (Pitfall 2 + 5)
          const toStore: StoredCanal[] = state.canals.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ elevation: _e, elevationLoading: _el, elevationError: _ee, ...rest }) => rest,
          )
          await db.canals.bulkPut(toStore)

          // Supprimer les canaux supprimés du store (Pitfall 6 — bulkPut ne supprime pas)
          const currentIds = new Set(state.canals.map((c) => c.id))
          const all = await db.canals.toArray()
          const toDelete = all
            .filter((c) => !currentIds.has(c.id))
            .map((c) => c.id)
          if (toDelete.length > 0) await db.canals.bulkDelete(toDelete)
        }

        if (paramsChanged) {
          await db.settings.put({ key: 'calcParams', value: state.calcParams })
        }
      } catch (err) {
        console.warn('[persistence] Sync failed:', err)
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [])  // [] — montage unique (SidePanel ne se démonte pas)
}
```
  </action>
  <verify>
    <automated>npm run test -- --run 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - src/hooks/usePersistence.ts existe
    - `npx tsc --noEmit` retourne 0 erreurs
    - `npm run test -- --run src/tests/persistence.test.ts` : tous les tests GREEN (0 failed)
    - `npm run test -- --run src/store/canalStore.test.ts` : tous les tests GREEN
    - `npm run test -- --run` (suite complète) : 0 tests failed — les 89 tests existants + nouveaux tests persistence sont tous GREEN
    - grep dans usePersistence.ts trouve `elevation: _e` (exclusion des champs elevation avant persistance)
    - grep dans usePersistence.ts trouve `bulkDelete` (nettoyage des orphelins Pitfall 6)
    - grep dans usePersistence.ts trouve `console.warn('[persistence]` (deux occurrences : hydration et sync)
    - grep dans usePersistence.ts ne trouve PAS `subscribeWithSelector`
  </acceptance_criteria>
  <done>usePersistence.ts implémenté, suite complète GREEN — persistance fonctionnelle.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| IndexedDB → Store Zustand | Données lues depuis IndexedDB au démarrage, hydratées dans le store mémoire |
| Store Zustand → IndexedDB | Mutations du store écrites dans IndexedDB via subscribe |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07-01 | Tampering | IndexedDB (DevTools manipulation) | accept | App usage personnel, données locales non sensibles — pas de surface serveur |
| T-07-02 | Information Disclosure | IndexedDB local | accept | Coordonnées géographiques + paramètres de calcul — pas de PII, même origine uniquement |
| T-07-03 | Denial of Service | QuotaExceededError | mitigate | elevation* exclu de la persistance (StoredCanal) — réduction drastique du volume stocké ; try/catch silencieux empêche le crash |
</threat_model>

<verification>
Wave 1 complète quand :
1. `npx tsc --noEmit` → 0 erreurs
2. `npm run test -- --run src/tests/persistence.test.ts` → tous GREEN
3. `npm run test -- --run src/store/canalStore.test.ts` → tous GREEN (y compris clearAll + hydrateCanals)
4. `npm run test -- --run` → suite complète GREEN (anciens 89 tests + nouveaux tests persistence)
</verification>

<success_criteria>
- db.ts singleton Dexie opérationnel avec tables canals (StoredCanal) et settings
- clearAll et hydrateCanals présents et testés dans le store
- usePersistence.ts : hydration au montage + subscribe sync + cleanup StrictMode safe
- 0 régression sur les 89 tests existants
- elevation exclue de la persistance (protection quota + freshness)
</success_criteria>

<output>
After completion, create `.planning/phases/07-persistance-locale/07-T02-SUMMARY.md`
</output>

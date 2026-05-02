# Phase 7: Persistance Locale - Pattern Map

**Mapped:** 2026-05-02
**Files analyzed:** 7 (5 new, 2 modified)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/services/db.ts` | service | CRUD | `src/services/elevationApi.ts` | role-match |
| `src/hooks/usePersistence.ts` | hook | event-driven | `src/hooks/useElevation.ts` | exact |
| `src/store/canalStore.ts` | store | CRUD | `src/store/canalStore.ts` (self) | exact |
| `src/components/ClearDataButton.tsx` | component | request-response | `src/components/DeleteConfirmDialog.tsx` | exact |
| `src/components/SidePanel.tsx` | component | request-response | `src/components/SidePanel.tsx` (self) | exact |
| `src/App.tsx` | component (root) | request-response | `src/hooks/useElevation.ts` (mount pattern) | partial |
| `src/tests/persistence.test.ts` | test | batch | `src/tests/calculationEngine.test.ts` | role-match |

---

## Pattern Assignments

### `src/services/db.ts` (service, CRUD)

**Analog:** `src/services/elevationApi.ts`

**Note:** Dexie n'est pas encore dans package.json — ajouter `dexie` comme dépendance avant d'implémenter.

**Imports pattern** (`src/services/elevationApi.ts` lines 1–7):
```typescript
// Convention fichier service : commentaire d'en-tête expliquant la responsabilité
// src/services/db.ts
// Singleton Dexie — couche IndexedDB, source de persistance sous-jacente au store Zustand
// Zéro logique métier ici — uniquement lecture/écriture brute
import Dexie, { type Table } from 'dexie'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'
```

**Singleton pattern** — le service exporte une instance unique (cohérent avec le pattern `elevationApi.ts` qui exporte des fonctions pures depuis un module unique) :
```typescript
// Pattern : classe Dexie étendue avec tables typées, exportée comme singleton
class CanalDatabase extends Dexie {
  canals!: Table<Canal>
  settings!: Table<{ key: string; value: unknown }>

  constructor() {
    super('CanalDB')
    this.version(1).stores({
      canals: 'id, createdAt',   // index sur id (PK) et createdAt
      settings: 'key',           // clé primaire = 'calcParams'
    })
  }
}

export const db = new CanalDatabase()
```

**Error handling pattern** (`src/services/elevationApi.ts` lines 42–53):
```typescript
// Pattern service : throw Error avec message explicite, le consommateur gère le fallback
if (!response.ok) {
  throw new Error(`Open Meteo HTTP ${response.status}`)
}
// null → normalisé à valeur par défaut (graceful fallback)
return (data.elevation as (number | null)[]).map((v) => v ?? 0)
```
Appliquer le même principe dans `db.ts` : wrap chaque opération Dexie dans try/catch, log l'erreur en console, retourner `null` ou `[]` selon le contexte — jamais propager une erreur bloquante.

---

### `src/hooks/usePersistence.ts` (hook, event-driven)

**Analog:** `src/hooks/useElevation.ts` (exact match — même pattern store → side-effect)

**Imports pattern** (`src/hooks/useElevation.ts` lines 1–8):
```typescript
// src/hooks/usePersistence.ts
// Hydration au montage + subscribe Zustand → écriture Dexie à chaque mutation
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { db } from '../services/db'
```

**Core hook pattern — hydration au montage** (`src/hooks/useElevation.ts` lines 15–53):
```typescript
// Pattern useEffect avec async inner function + cleanup
export function usePersistence() {
  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      try {
        const canals = await db.canals.toArray()
        const settings = await db.settings.get('calcParams')
        if (cancelled) return
        // getState() pour éviter la fermeture stale — pattern Phase 2/3
        const store = useCanalStore.getState()
        if (canals.length > 0) store.hydrateCanals(canals)
        if (settings?.value) store.setCalcParams(settings.value as Partial<import('../types/calculation').CalcParams>)
      } catch (err) {
        // Graceful fallback — IndexedDB vide ou private browsing
        console.warn('[persistence] Hydration failed, starting fresh:', err)
      }
    }

    hydrate()

    // Subscribe Zustand → sync Dexie à chaque mutation canals/calcParams
    const unsub = useCanalStore.subscribe(
      (state) => ({ canals: state.canals, calcParams: state.calcParams }),
      async ({ canals, calcParams }) => {
        if (cancelled) return
        try {
          await db.canals.bulkPut(canals)
          // Supprimer les canaux supprimés du store
          const ids = new Set(canals.map((c) => c.id))
          const all = await db.canals.toArray()
          const toDelete = all.filter((c) => !ids.has(c.id)).map((c) => c.id)
          if (toDelete.length > 0) await db.canals.bulkDelete(toDelete)
          await db.settings.put({ key: 'calcParams', value: calcParams })
        } catch (err) {
          console.warn('[persistence] Sync failed:', err)
        }
      },
    )

    return () => {
      cancelled = true
      unsub()
    }
  }, [])  // [] — s'exécute une seule fois au montage (App.tsx)
}
```

**Note importante :** Zustand v5 `subscribe` avec sélecteur nécessite l'import de `subscribeWithSelector` middleware, ou utilisation de `useCanalStore.subscribe` avec comparaison manuelle. Vérifier la version Zustand (`^5.0.12`) et adapter si nécessaire.

---

### `src/store/canalStore.ts` (store, CRUD — modification)

**Analog:** `src/store/canalStore.ts` itself (self-modification)

**Pattern interface existant** (lines 9–45) — ajouter deux entrées :
```typescript
interface CanalStore {
  // ... (existant)

  // Persistance — Phase 7
  clearAll: () => void
  hydrateCanals: (canals: Canal[]) => void
}
```

**Pattern action existante** (`src/store/canalStore.ts` lines 114–118) — copier ce style d'action simple :
```typescript
deleteCanal: (id) => set((state) => ({
  canals: state.canals.filter((c) => c.id !== id),
  selectedCanalId: state.selectedCanalId === id ? null : state.selectedCanalId,
})),
```

Nouvelles actions à ajouter avec le même style :
```typescript
clearAll: () => set({
  canals: [],
  selectedCanalId: null,
  draftPoints: [],
  previewCoord: null,
  mode: 'selection',
  routingState: 'idle',
  routingStart: null,
  routingEnd: null,
  calcParams: DEFAULT_CALC_PARAMS,
}),

hydrateCanals: (canals) => set({ canals }),
```

---

### `src/components/ClearDataButton.tsx` (component, request-response)

**Analog:** `src/components/DeleteConfirmDialog.tsx` (exact match — même pattern action destructive + dialog confirmation)

**Imports pattern** (`src/components/DeleteConfirmDialog.tsx` lines 1–3):
```typescript
// src/components/ClearDataButton.tsx
import { useState } from 'react'
import { useCanalStore } from '../store/canalStore'
import { db } from '../services/db'
```

**Dialog pattern complet** (`src/components/DeleteConfirmDialog.tsx` lines 10–52):
```typescript
// Pattern : état local showConfirm, overlay fixed inset-0, stopPropagation sur le contenu
export function ClearDataButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const clearAll = useCanalStore((s) => s.clearAll)

  const handleConfirm = async () => {
    await db.canals.clear()
    await db.settings.clear()
    clearAll()
    setShowConfirm(false)
  }

  return (
    <>
      <button onClick={() => setShowConfirm(true)} ...>
        Effacer toutes les données
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-72 rounded-lg bg-gray-800 border border-white/[0.08] p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-white mb-1">Effacer toutes les données ?</p>
            <p className="text-xs text-gray-400">Tous les canaux et paramètres seront supprimés. Cette action est irréversible.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Effacer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Couleurs et classes Tailwind à reproduire exactement** (cohérence visuelle) :
- Overlay : `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm`
- Dialog box : `w-72 rounded-lg bg-gray-800 border border-white/[0.08] p-6 flex flex-col gap-4`
- Bouton annuler : `px-4 py-2 rounded text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors`
- Bouton destructif : `px-4 py-2 rounded text-sm text-white bg-red-500 hover:bg-red-600 transition-colors`

---

### `src/components/SidePanel.tsx` (component — modification)

**Analog:** `src/components/SidePanel.tsx` itself

**Pattern d'import de hook** (lines 10–12) — ajouter `usePersistence` sur le même modèle :
```typescript
import { useElevation } from '../hooks/useElevation'
import { useRoutingWorker } from '../hooks/useRoutingWorker'
// Ajouter :
import { usePersistence } from '../hooks/usePersistence'
import { ClearDataButton } from './ClearDataButton'
```

**Pattern d'appel hook au top du composant** (lines 16–17) :
```typescript
export function SidePanel() {
  useElevation()
  useRoutingWorker()
  usePersistence()   // ← ajouter ici — même pattern que les hooks existants
  // ...
```

**Pattern d'insertion section dans le corps scrollable** (lines 95–113) — ajouter `ClearDataButton` dans `flex-1 overflow-y-auto` après `DashboardPanel` :
```typescript
{/* Section 7 — Effacement données (footer, Phase 7) */}
<div className="px-4 py-4 border-t border-white/[0.08] mt-auto">
  <ClearDataButton />
</div>
```

---

### `src/App.tsx` (component root — modification)

**Analog:** Pattern `useElevation` dans `SidePanel.tsx` — les hooks de cycle de vie sont montés dans les composants racine de leur scope.

**Note :** Le CONTEXT.md précise que `usePersistence` doit être appelé dans `App.tsx`. Cependant, d'après le code existant, les hooks d'orchestration sont appelés dans `SidePanel.tsx` (lignes 16–17). Deux options valides :
1. Monter `usePersistence()` dans `SidePanel.tsx` (cohérent avec les hooks existants)
2. Monter `usePersistence()` dans `App.tsx` (option CONTEXT.md)

**Pattern actuel App.tsx** (lines 1–14) :
```typescript
// src/App.tsx — layout racine, aucune logique métier
import { MapView } from './components/MapView'
import { SidePanel } from './components/SidePanel'

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      <MapView />
      <SidePanel />
    </div>
  )
}
```

Si `usePersistence` est monté dans `App.tsx`, ajouter un composant wrapper ou appel direct :
```typescript
import { usePersistence } from './hooks/usePersistence'

export default function App() {
  usePersistence()   // hydration au montage, avant tout rendu
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      <MapView />
      <SidePanel />
    </div>
  )
}
```

**Recommandation :** Monter dans `SidePanel.tsx` pour rester cohérent avec `useElevation` et `useRoutingWorker`. Si montage dans `App.tsx` choisi, supprimer l'appel de `SidePanel.tsx` pour éviter le double montage.

---

### `src/tests/persistence.test.ts` (test, batch)

**Analog:** `src/tests/calculationEngine.test.ts` (même structure Wave 0 → RED → GREEN)

**Imports pattern** (`src/tests/calculationEngine.test.ts` lines 1–5):
```typescript
// src/tests/persistence.test.ts
// Tests Wave 0 — RED. Stubs db.ts retournent [] ou null.
// T02 (Wave 1) implémente db.ts + usePersistence et fait passer ces tests en GREEN.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '../services/db'
import { useCanalStore } from '../store/canalStore'
```

**Pattern de test avec fixtures** (`src/tests/calculationEngine.test.ts` lines 24–55):
```typescript
// Pattern fixtures locales — pas d'import de factories externes
const mockCanal = {
  id: 'test-1',
  points: [[2.35, 48.85], [5.0, 46.0]] as import('../types/canal').Coord[],
  name: 'Test Canal',
  createdAt: Date.now(),
}

const mockCalcParams = { width: 100, depth: 10 }
```

**Pattern describe/it structure** pour les tests de persistance :
```typescript
describe('db — canals CRUD', () => {
  beforeEach(async () => {
    await db.canals.clear()
    await db.settings.clear()
  })

  it('bulkPut + toArray retourne les canaux persistés', async () => { ... })
  it('bulkDelete supprime les canaux effacés du store', async () => { ... })
  it('clear() vide la table', async () => { ... })
})

describe('db — settings CRUD', () => {
  it('put + get calcParams round-trip', async () => { ... })
})

describe('clearAll store action', () => {
  it('remet canals=[], calcParams=DEFAULT, mode=selection', () => { ... })
})

describe('hydrateCanals store action', () => {
  it('remplace canals par le tableau fourni', () => { ... })
})
```

**Note Vitest + IndexedDB :** Dexie en environnement Node/jsdom nécessite `fake-indexeddb` (dev dependency). Ajouter `fake-indexeddb` et configurer dans `vitest.config.ts` ou importer en `beforeAll` :
```typescript
import 'fake-indexeddb/auto'
```

---

## Shared Patterns

### Store access pattern (getState vs subscribe)
**Source:** `src/hooks/useElevation.ts` line 18, `src/hooks/useRoutingWorker.ts` lines 39, 51, 52, 65
**Apply to:** `src/hooks/usePersistence.ts`
```typescript
// Dans handlers async hors cycle React — évite stale closures
useCanalStore.getState().someAction()

// Dans useEffect pour lire sans s'abonner
const canal = useCanalStore.getState().canals.find(...)
```

### Cleanup pattern (cancelled flag + unsub)
**Source:** `src/hooks/useElevation.ts` lines 26, 47–53
**Apply to:** `src/hooks/usePersistence.ts`
```typescript
let cancelled = false
// ...
return () => {
  cancelled = true
  controller.abort()  // remplacer par unsub() pour usePersistence
}
```

### Error handling silencieux (console.warn + fallback)
**Source:** `src/services/elevationApi.ts` lines 47–53, `src/hooks/useElevation.ts` lines 35–37
**Apply to:** `src/services/db.ts`, `src/hooks/usePersistence.ts`
```typescript
// Pattern : catch + console.warn + valeur par défaut — jamais throw vers l'UI
} catch (err) {
  if (cancelled) return
  const message = err instanceof Error ? err.message : 'Erreur inconnue'
  // Pour db.ts : console.warn + return [] ou null
  // Pour usePersistence.ts : console.warn + démarrage état vide
}
```

### Dialog confirmation action destructive
**Source:** `src/components/DeleteConfirmDialog.tsx` lines 10–52
**Apply to:** `src/components/ClearDataButton.tsx`

Classes Tailwind partagées (ne pas modifier pour cohérence visuelle) :
- `fixed inset-0 z-50 ... bg-black/60 backdrop-blur-sm`
- `w-72 rounded-lg bg-gray-800 border border-white/[0.08] p-6`
- Bouton rouge : `bg-red-500 hover:bg-red-600 transition-colors`

### Hook orchestrateur dans SidePanel
**Source:** `src/components/SidePanel.tsx` lines 16–18
**Apply to:** Appel de `usePersistence()` — même emplacement, même style

---

## No Analog Found

Aucun fichier sans analog — tous ont un analog identifiable dans la codebase.

| File | Note |
|------|------|
| `src/services/db.ts` | Premier service de persistance locale — Dexie non encore installé. Pattern structural copié de `elevationApi.ts` (module singleton, exports fonctions CRUD). |
| `src/tests/persistence.test.ts` | IndexedDB en test nécessite `fake-indexeddb` (absent du projet). Ajouter `fake-indexeddb` en devDependency avant d'écrire les tests. |

---

## Dependency Gap

**Dexie.js absent de package.json.** Le planner doit inclure l'installation comme première tâche :
```bash
npm install dexie
npm install --save-dev fake-indexeddb  # pour les tests Vitest
```

---

## Metadata

**Analog search scope:** `src/services/`, `src/hooks/`, `src/store/`, `src/components/`, `src/tests/`
**Files scanned:** 12
**Pattern extraction date:** 2026-05-02

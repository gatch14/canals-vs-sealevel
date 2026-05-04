# Phase 7: Persistance Locale — Research

**Researched:** 2026-05-02
**Domain:** IndexedDB / Dexie.js + intégration Zustand v5
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Dexie.js comme couche IndexedDB (déjà prévu dans STATE.md et ROADMAP)
- Intégration via service `db.ts` (singleton Dexie) + hook `usePersistence.ts` appelé au démarrage
- Le store Zustand reste source de vérité en mémoire — Dexie est la couche de persistance sous-jacente
- Sync déclenché à chaque mutation du store (subscribe Zustand → écriture Dexie)
- Hydration au démarrage : `useEffect` dans App.tsx ou SidePanel.tsx qui lit Dexie et hydrate le store
- `canals[]` et `calcParams` sont les deux seules données persistées
- Deux tables Dexie séparées : `canals` et `settings`
- Si IndexedDB vide ou erreur → démarrage avec état initial vide (graceful fallback)
- React StrictMode safe : useEffect avec cleanup, pas de double-write problématique
- Bouton "Effacer toutes les données" dans le panneau latéral avec dialog de confirmation

### Claude's Discretion

- Emplacement exact du bouton d'effacement dans le SidePanel
- Schema Dexie (version 1, évolution future si nécessaire)
- Gestion des erreurs IndexedDB (quota dépassé, private browsing)

### Deferred Ideas (OUT OF SCOPE)

- Export/import JSON des canaux (vers v3)
- Sync entre onglets (BroadcastChannel)
- Quota management avancé (UI de gestion de l'espace)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERS-01 | L'utilisateur retrouve ses canaux tracés après un refresh de la page (IndexedDB via Dexie.js) | Dexie bulkPut + toArray + subscribe Zustand pattern documenté |
| PERS-02 | L'utilisateur retrouve les paramètres de calcul (largeur, profondeur) après un refresh | Table settings avec clé 'calcParams', put/get pattern documenté |
| PERS-03 | L'utilisateur peut effacer toutes les données locales depuis l'interface | db.transaction clear + store clearAll action + ClearDataButton avec dialog |
</phase_requirements>

---

## Summary

La phase 7 ajoute une couche de persistance IndexedDB via Dexie.js à l'application Canal. L'architecture est simple : un service singleton `db.ts` expose deux tables Dexie (`canals` et `settings`), un hook `usePersistence.ts` orchestre l'hydration initiale et la synchronisation continue via `subscribe` Zustand, et un composant `ClearDataButton.tsx` permet l'effacement complet via dialog de confirmation.

Dexie.js v4.4.2 (stable, publiée avril 2026) est la librairie cible. Elle utilise l'algorithme de clonage structuré du navigateur — tous les types de l'app (Canal, CalcParams, ElevationProfile) sont sérialisables sans transformation car ce sont des objets simples sans méthodes. Le piège principal est que le store Zustand v5 utilise par défaut `subscribe` sans sélecteur — pour filtrer les mutations (canals/calcParams uniquement), il faut envelopper le store avec le middleware `subscribeWithSelector`, ou utiliser le subscribe basique avec comparaison manuelle.

Pour les tests Vitest (jsdom), IndexedDB n'est pas disponible nativement — `fake-indexeddb` (v6.2.5) doit être ajouté en devDependency et importé dans les tests de persistance.

**Recommandation principale :** Pattern subscribe sans selector (comparaison manuelle dans le callback) pour éviter la modification du store existant — ajouter `subscribeWithSelector` alourdirait la signature de `create<CanalStore>()` et nécessiterait de mettre à jour tous les tests du store.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Persistance canaux | Browser (IndexedDB) | — | 100% client-side, pas de serveur |
| Hydration au démarrage | React Component (App/SidePanel) | — | useEffect au montage, avant rendu |
| Synchronisation Zustand→Dexie | Browser (Service Worker simulé via subscribe) | — | subscribe Zustand, écriture Dexie async |
| Effacement des données | React Component (SidePanel) | Browser (IndexedDB) | UI déclenche clear Dexie + reset store |
| Stockage calcParams | Browser (IndexedDB) | — | Table settings, clé 'calcParams' |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | 4.4.2 | Wrapper IndexedDB — CRUD, schema, transactions | Prévu STATE.md, pattern officiel pour apps client-side React |
| zustand | 5.0.12 | Store mémoire (déjà installé) | Déjà présent, source de vérité en mémoire |

[VERIFIED: npm registry — `npm view dexie version` → 4.4.2, publiée 2026-04-16]
[VERIFIED: npm registry — `npm view zustand version` → 5.0.12]

### Supporting (tests uniquement)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fake-indexeddb | 6.2.5 | Implémentation JS en mémoire de l'API IndexedDB | Tests Vitest/jsdom — IndexedDB n'existe pas dans Node |

[VERIFIED: npm registry — `npm view fake-indexeddb version` → 6.2.5]

### Alternatives considérées

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie.js subscribe pattern | Zustand `persist` middleware avec IDB | persist est conçu pour localStorage — async storage requiert workaround complexe, risque de race condition hydration |
| fake-indexeddb (tests) | Mocker db.ts entier | Mocker permet de tester l'isolation du hook, fake-indexeddb permet de tester le CRUD réel |

**Installation :**
```bash
npm install dexie
npm install --save-dev fake-indexeddb
```

**Vérification de version :** confirmée ci-dessus contre le registre npm.

---

## Architecture Patterns

### System Architecture Diagram

```
App démarrage
    │
    ▼
usePersistence (useEffect montage)
    │
    ├─── db.canals.toArray() ──► IndexedDB (canals table)
    │         │
    │         ▼
    │    store.hydrateCanals(canals)
    │
    ├─── db.settings.get('calcParams') ──► IndexedDB (settings table)
    │         │
    │         ▼
    │    store.setCalcParams(value)
    │
    └─── useCanalStore.subscribe(callback)
              │
    ┌─────────┘
    │
    ▼ (à chaque mutation store)
callback : { canals, calcParams }
    │
    ├─── db.canals.bulkPut(canals)
    ├─── db.canals.bulkDelete(suppressions)
    └─── db.settings.put({ key: 'calcParams', value: calcParams })


Bouton "Effacer" (ClearDataButton)
    │
    ▼ (confirmation dialog)
db.transaction('rw', [db.canals, db.settings], async () => {
    await db.canals.clear()
    await db.settings.clear()
})
    │
    ▼
store.clearAll()
```

### Structure de fichiers recommandée

```
src/
├── services/
│   └── db.ts              # NOUVEAU — singleton Dexie, schema v1
├── hooks/
│   └── usePersistence.ts  # NOUVEAU — hydration + subscribe Zustand→Dexie
├── store/
│   └── canalStore.ts      # MODIFIÉ — +clearAll(), +hydrateCanals()
├── components/
│   ├── ClearDataButton.tsx # NOUVEAU — bouton + dialog confirmation
│   └── SidePanel.tsx       # MODIFIÉ — +usePersistence() + ClearDataButton
└── tests/
    └── persistence.test.ts # NOUVEAU — tests Wave 0
```

### Pattern 1 : Singleton Dexie (db.ts)

**Ce que c'est :** Module service qui expose une seule instance Dexie avec schema typé.
**Quand l'utiliser :** Toujours — une seule connexion IndexedDB par app.

```typescript
// Source: https://dexie.org/docs/Tutorial/React#3-create-a-dexie-db-module (VERIFIED)
// src/services/db.ts
import Dexie, { type Table } from 'dexie'
import type { Canal } from '../types/canal'
import type { CalcParams } from '../types/calculation'

interface SettingsRecord {
  key: string
  value: unknown
}

class CanalDatabase extends Dexie {
  canals!: Table<Canal, string>               // PK = id (string, non auto-increment)
  settings!: Table<SettingsRecord, string>    // PK = key (string)

  constructor() {
    super('CanalDB')
    this.version(1).stores({
      canals:   'id, createdAt',  // id = PK, createdAt indexé pour tris futurs
      settings: 'key',            // clé primaire = 'calcParams'
    })
  }
}

export const db = new CanalDatabase()
```

**Pourquoi `id` sans `++` :** Les IDs Canal sont générés via `crypto.randomUUID()` — pas d'auto-increment Dexie. [VERIFIED: Dexie docs — `++id` = auto-increment, `id` sans préfixe = clé primaire manuelle]

### Pattern 2 : Hydration + Subscribe (usePersistence.ts)

**Ce que c'est :** Hook appelé une fois au montage — charge IndexedDB dans le store, puis souscrit aux mutations.
**Quand l'utiliser :** Appelé dans SidePanel.tsx (cohérent avec useElevation/useRoutingWorker) ou App.tsx.

```typescript
// Source: pattern Zustand subscribe (https://github.com/pmndrs/zustand/discussions/2475)
// + pattern useElevation.ts existant (src/hooks/useElevation.ts)
// src/hooks/usePersistence.ts
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { db } from '../services/db'
import type { CalcParams } from '../types/calculation'

export function usePersistence() {
  useEffect(() => {
    let cancelled = false

    // 1. Hydration au montage
    const hydrate = async () => {
      try {
        const [canals, settings] = await Promise.all([
          db.canals.toArray(),
          db.settings.get('calcParams'),
        ])
        if (cancelled) return
        const store = useCanalStore.getState()
        if (canals.length > 0) store.hydrateCanals(canals)
        if (settings?.value) store.setCalcParams(settings.value as Partial<CalcParams>)
      } catch (err) {
        // Graceful fallback : private browsing, quota, etc.
        console.warn('[persistence] Hydration failed, starting fresh:', err)
      }
    }

    hydrate()

    // 2. Subscribe basique (sans subscribeWithSelector pour ne pas modifier le store)
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
          await db.canals.bulkPut(state.canals)
          // Supprimer canaux effacés du store
          const currentIds = new Set(state.canals.map((c) => c.id))
          const all = await db.canals.toArray()
          const toDelete = all.filter((c) => !currentIds.has(c.id)).map((c) => c.id)
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
  }, [])
}
```

### Pattern 3 : Actions store (clearAll + hydrateCanals)

**Ce que c'est :** Deux nouvelles actions Zustand minimales.

```typescript
// À ajouter dans src/store/canalStore.ts
// Interface :
clearAll: () => void
hydrateCanals: (canals: Canal[]) => void

// Implémentation :
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

### Pattern 4 : ClearDataButton avec transaction atomique

```typescript
// Source: https://dexie.org/docs/Dexie/Dexie.transaction() (VERIFIED)
const handleConfirm = async () => {
  await db.transaction('rw', [db.canals, db.settings], async () => {
    await db.canals.clear()
    await db.settings.clear()
  })
  clearAll()  // reset store mémoire
  setShowConfirm(false)
}
```

### Anti-Patterns à éviter

- **Sérialiser les fonctions Zustand dans IndexedDB :** IndexedDB utilise l'algorithme de clonage structuré qui rejette les fonctions — ne jamais persister l'objet store complet (actions comprises), uniquement les données : `canals[]` et `calcParams`. [VERIFIED: structured clone algorithm — DataCloneError pour les fonctions]
- **Utiliser `persist` middleware Zustand avec IndexedDB :** Ce middleware est conçu pour localStorage (synchrone). L'utilisation avec IndexedDB (asynchrone) crée des race conditions où le middleware peut écraser les données chargées. [CITED: github.com/pmndrs/zustand/discussions/1721 — "persist is designed to best fit with localStorage"]
- **Double hydration en StrictMode :** React StrictMode monte les composants deux fois en dev. Avec le flag `cancelled`, la deuxième hydration est ignorée si la première n'est pas terminée. L'écriture Dexie est idempotente (bulkPut = upsert), donc même sans flag le résultat est correct.
- **Re-persister à chaque re-render :** La comparaison par référence (`state.canals !== prevCanals`) évite les écritures Dexie inutiles — Zustand crée de nouvelles références uniquement lors de mutations réelles.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gestion IndexedDB (versioning, migrations, transactions) | API IndexedDB native | Dexie.js | L'API native nécessite des callback hell, gestion d'erreurs complexe, pas de Promise native |
| Clonage profond avant persistance | `JSON.parse(JSON.stringify(...))` | Aucun — Dexie clone automatiquement via structured clone | Dexie gère la sérialisation ; les types Canal/CalcParams sont des objets simples |
| Suppression synchronisée (canal supprimé du store → supprimé d'IndexedDB) | Diff complet à chaque sync | bulkPut + bulkDelete avec `Set` d'IDs | Pattern éprouvé, atomique, performant |
| Implémentation IndexedDB pour tests | Mock complet | `fake-indexeddb/auto` | Implémentation JS fidèle à la spec, utilisée officiellement par Dexie.js pour ses propres tests |

**Insight clé :** IndexedDB est une API bas niveau avec une ergonomie difficile (transactions explicites, événements asynchrones, pas de Promise native). Dexie abstrait tout cela avec une API Promise/async-await intuitive.

---

## Runtime State Inventory

> Phase de persistance initiale (greenfield pour la couche persistance) — aucun état runtime à migrer.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Aucune base IndexedDB existante — première installation | Aucune migration |
| Live service config | Aucun service externe | — |
| OS-registered state | Aucun | — |
| Secrets/env vars | Aucun | — |
| Build artifacts | Dexie absent de package.json | `npm install dexie` en Wave 0 |

**Nothing found in category :** Vérifié — application 100% client-side sans persistance existante, première mise en place d'IndexedDB.

---

## Common Pitfalls

### Pitfall 1 : subscribeWithSelector modifie la signature du store

**Ce qui se passe :** Si on enveloppe `create<CanalStore>()` avec `subscribeWithSelector`, la signature TypeScript change — tous les fichiers qui importent `useCanalStore` doivent être vérifiés, et `canalStore.test.ts` peut nécessiter une mise à jour.
**Pourquoi ça arrive :** `subscribeWithSelector` est un middleware qui modifie le type du store créé.
**Comment éviter :** Utiliser `subscribe` basique avec comparaison de références (`!==`) dans le callback — même efficacité pour ce cas d'usage simple, zéro modification du store existant.
**Signes d'alerte :** Erreurs TypeScript dans `canalStore.test.ts` après modification du store.

### Pitfall 2 : ElevationProfile non persisté — comportement attendu

**Ce qui se passe :** `Canal.elevation` (ElevationProfile) est dans le type Canal — elle sera persistée si elle existe au moment du subscribe.
**Pourquoi c'est un problème :** `fetchedAt: number` dans ElevationProfile marque la fraîcheur du cache. Après un refresh, le profil chargé depuis IndexedDB aura un `fetchedAt` ancien, mais `useElevation.ts` vérifie `if (canal.elevation) return` — le profil ne sera jamais re-fetché même s'il date de la session précédente.
**Comment éviter :** Deux options : (A) persister le profil et accepter qu'il soit potentiellement ancien (acceptable — l'élévation ne change pas), ou (B) exclure `elevation` de la persistance et laisser `useElevation` re-fetcher. **Option B recommandée** : ne persister que les champs fondamentaux de Canal sans elevation.
**Signes d'alerte :** Profil d'élévation affiché immédiatement sans fetch réseau après refresh.

### Pitfall 3 : Private browsing / Firefox "never remember history"

**Ce qui se passe :** Firefox avec "never remember history" désactive IndexedDB. Dexie lance une erreur à l'ouverture.
**Pourquoi ça arrive :** Cette policy Firefox bloque explicitement l'accès à IndexedDB.
**Comment éviter :** Le try/catch dans `hydrate()` capture l'erreur — l'app démarre avec état vide. Aucune UI d'erreur n'est nécessaire en v2 (déféré).
**Signes d'alerte :** Console.warn `[persistence] Hydration failed` en private browsing Firefox.
[CITED: github.com/dfahlander/Dexie.js/issues/883]

### Pitfall 4 : Race condition React StrictMode

**Ce qui se passe :** StrictMode exécute les `useEffect` deux fois en développement (montage → démontage → remontage).
**Pourquoi ça arrive :** React vérifie que les effets sont correctement nettoyés.
**Comment éviter :** Le flag `cancelled = true` dans le cleanup et `useCanalStore.subscribe` retournent une fonction d'unsubscription. La deuxième exécution annule la première et réabonne correctement.
**Signes d'alerte :** Double écriture dans IndexedDB en dev (inoffensif avec bulkPut/put qui sont idempotents).

### Pitfall 5 : Quota exceeded en production

**Ce qui se passe :** `QuotaExceededError` si l'utilisateur accumule beaucoup de canaux avec profils d'élévation.
**Pourquoi ça arrive :** Chaque profil = 100 points × 2 nombres = ~1.6 KB ; avec exclusion de l'elevation (voir Pitfall 2), risque quasi-nul.
**Comment éviter :** Ne pas persister `elevation` — exclure le champ ou filtrer avant écriture.
**Signes d'alerte :** `console.warn('[persistence] Sync failed:')` avec DOMException QuotaExceeded.
[CITED: developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria]

### Pitfall 6 : bulkPut ne supprime pas — orphelins IndexedDB

**Ce qui se passe :** `bulkPut` met à jour et insère, mais ne supprime pas les enregistrements absents du tableau.
**Pourquoi ça arrive :** Quand un canal est supprimé du store Zustand, il n'est plus dans `state.canals` — `bulkPut` ne le touche pas.
**Comment éviter :** Après `bulkPut`, récupérer tous les IDs en base, calculer le diff, appeler `bulkDelete` sur les IDs orphelins.
**Signes d'alerte :** Les canaux supprimés réapparaissent après refresh.

---

## Code Examples

### Initialisation Dexie sans auto-increment (clé UUID)

```typescript
// Source: https://dexie.org/docs/Dexie/Dexie.version() (VERIFIED)
// Clé primaire = 'id' (string UUID) — pas de '++' car l'app génère ses propres IDs
db.version(1).stores({
  canals: 'id, createdAt',   // id = PK manuelle
  settings: 'key',           // key = PK manuelle ('calcParams')
})
```

### Upsert (put = insert ou update selon existence de la clé)

```typescript
// Source: https://dexie.org/docs/Table/Table.put() (VERIFIED)
await db.settings.put({ key: 'calcParams', value: { width: 50, depth: 5 } })
// → Si 'calcParams' existe → remplace. Sinon → crée.
```

### Transaction atomique multi-tables

```typescript
// Source: https://dexie.org/docs/Dexie/Dexie.transaction() (VERIFIED)
await db.transaction('rw', [db.canals, db.settings], async () => {
  await db.canals.clear()
  await db.settings.clear()
})
```

### Import fake-indexeddb pour tests Vitest

```typescript
// Source: https://github.com/dexie/Dexie.js/issues/647 (CITED)
// En haut du fichier de test — auto-polyfill IndexedDB dans jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../services/db'

beforeEach(async () => {
  await db.canals.clear()
  await db.settings.clear()
})
```

### Canal persisté sans elevation (recommandé)

```typescript
// Filtrer elevation avant persistence pour éviter Pitfall 2 et 5
const { elevation: _e, elevationLoading: _el, elevationError: _ee, ...canalToStore } = canal
// → persister uniquement canalToStore
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LocalStorage (synchrone, ~5MB) | IndexedDB via Dexie.js | 2015+ | Stockage asynchrone, illimité, objets complexes |
| `persist` Zustand + idb-keyval | Subscribe pattern + Dexie direct | 2022+ | Évite race conditions, plus prévisible |
| `dexie-react-hooks` package séparé | `useLiveQuery` intégré dans dexie v4 | Dexie v4 (2024) | Un seul package à installer |

**Deprecated/outdated :**
- `dexie-react-hooks` comme package séparé : en Dexie v3, `useLiveQuery` était dans un package séparé. En Dexie v4, tout est intégré dans le package `dexie`. [CITED: dexie.org/docs/libs/dexie-react-hooks]
- Note : `useLiveQuery` n'est PAS utilisé dans cette phase — on utilise le pattern subscribe Zustand→Dexie (plus simple pour notre architecture avec store existant).

---

## Assumptions Log

| # | Claim | Section | Risk si Faux |
|---|-------|---------|--------------|
| A1 | Exclure `elevation` de la persistance est correct (ne pas re-fetcher après refresh = acceptable car les données DEM ne changent pas) | Pitfall 2, Code Examples | Si UX veut le profil immédiatement après refresh sans délai réseau → inclure elevation dans persistence |
| A2 | Le subscribe basique Zustand (sans subscribeWithSelector) avec comparaison de références est suffisant pour détecter les mutations canals/calcParams | Pattern 2 | Si des mutations ne créent pas de nouvelles références (mutations directes via immer) → subscribe ne se déclenche pas ; mais Zustand crée toujours de nouvelles références |

---

## Open Questions

1. **Persister ou non `elevation` dans Canal ?**
   - Ce qu'on sait : ElevationProfile est ~3KB par canal (100 points), les données DEM ne changent pas
   - Ce qui est flou : UX prefer immediate display (no network on refresh) vs freshness guarantee
   - Recommandation : Exclure par défaut (ne pas persister elevation) — useElevation re-fétche en ~500ms, cohérent avec le `fetchedAt` déjà prévu comme "cache mémoire Zustand, re-fetch si reload"

2. **Point de montage de `usePersistence` : SidePanel vs App.tsx ?**
   - Ce qu'on sait : Les hooks d'orchestration existants (useElevation, useRoutingWorker) sont dans SidePanel.tsx
   - Ce qui est flou : CONTEXT.md mentionne App.tsx mais PATTERNS.md documente les deux
   - Recommandation : SidePanel.tsx pour cohérence — l'hydration sera effective avant le premier rendu de la carte car SidePanel est monté simultanément avec MapView

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| dexie | db.ts, usePersistence | ✗ (absent package.json) | — | Aucun — doit être installé en Wave 0 |
| fake-indexeddb | persistence.test.ts | ✗ (absent package.json) | — | Mocker db.ts entièrement (moins fiable) |
| IndexedDB (browser API) | db.ts | ✓ (navigateurs modernes) | Natif | Graceful fallback (état vide) si unavailable |

**Dépendances manquantes sans fallback :**
- `dexie` : installation obligatoire avant toute implémentation

**Dépendances manquantes avec fallback :**
- `fake-indexeddb` : si absent, les tests persistence doivent mocker db.ts — moins fiable

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.1 |
| Config file | vite.config.ts (section `test: { environment: 'jsdom', globals: true }`) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERS-01 | bulkPut canaux → toArray après clear retrouve les canaux | unit | `npm test -- src/tests/persistence.test.ts` | ❌ Wave 0 |
| PERS-01 | hydrateCanals charge canaux dans le store | unit | `npm test -- src/tests/persistence.test.ts` | ❌ Wave 0 |
| PERS-02 | put calcParams → get retourne les mêmes valeurs | unit | `npm test -- src/tests/persistence.test.ts` | ❌ Wave 0 |
| PERS-03 | clearAll remet canals=[], calcParams=DEFAULT | unit | `npm test -- src/store/canalStore.test.ts` | ❌ Wave 0 (actions nouvelles) |
| PERS-03 | transaction clear vide les deux tables | unit | `npm test -- src/tests/persistence.test.ts` | ❌ Wave 0 |
| Régression | Tests existants toujours GREEN après modifications store | unit | `npm test` | ✓ (89 tests existants) |

### Sampling Rate

- **Par commit tâche :** `npm test -- src/tests/persistence.test.ts src/store/canalStore.test.ts`
- **Par merge wave :** `npm test` (suite complète — 89 tests existants + nouveaux)
- **Phase gate :** Suite complète verte avant `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/tests/persistence.test.ts` — couvre PERS-01, PERS-02, PERS-03
- [ ] Tests `clearAll` et `hydrateCanals` dans `src/store/canalStore.test.ts` (actions nouvelles)
- [ ] `fake-indexeddb` installé : `npm install --save-dev fake-indexeddb`
- [ ] `dexie` installé : `npm install dexie`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (faible) | Données viennent du store validé en amont — pas d'entrée utilisateur directe dans Dexie |
| V6 Cryptography | no | — |

### Known Threat Patterns for IndexedDB

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Injection de données malveillantes via DevTools | Tampering | App usage personnel, données locales uniquement — pas de surface d'attaque serveur |
| Accès aux données par extension malveillante | Information Disclosure | IndexedDB accessible uniquement à l'origine — même origine que l'app (localhost en dev) |
| Exfiltration localStorage/IndexedDB | Information Disclosure | Données scientifiques non sensibles (coordonnées géographiques, calculs) — pas de PII |

**Note sécurité :** Application 100% client-side, usage personnel, données non sensibles. Les considérations ASVS sont minimales pour cette phase.

---

## Project Constraints (from CLAUDE.md)

Directives CLAUDE.md applicables à cette phase :

| Directive | Impact sur Phase 7 |
|-----------|-------------------|
| **100% client-side — zéro backend** | Confirmé : Dexie.js = IndexedDB local uniquement |
| **`git clone + npm install + npm run dev` suffit** | `npm install dexie` en Wave 0 est suffisant — pas de config additionnelle |
| **Pas de backend** | Dexie écrit uniquement dans le navigateur, aucun appel réseau |
| **Ordres de grandeur d'abord** | N/A pour une phase persistance |

---

## Sources

### Primary (HIGH confidence)

- [dexie.org/docs/Tutorial/React](https://dexie.org/docs/Tutorial/React) — Pattern db.ts singleton, useLiveQuery, TypeScript
- [dexie.org/docs/Table/Table.put()](https://dexie.org/docs/Table/Table.put()) — Comportement upsert, signature TypeScript
- [dexie.org/docs/Dexie/Dexie.version()](https://dexie.org/docs/Dexie/Dexie.version()) — Schema definition, auto-increment vs clé manuelle
- [dexie.org/docs/Dexie/Dexie.transaction()](https://dexie.org/docs/Dexie/Dexie.transaction()) — Transaction multi-tables, mode rw
- [dexie.org/docs/Table/Table.clear()](https://dexie.org/docs/Table/Table.clear()) — Signature clear()
- npm registry — versions vérifiées : dexie 4.4.2, zustand 5.0.12, fake-indexeddb 6.2.5
- [zustand.docs.pmnd.rs/reference/middlewares/subscribe-with-selector](https://zustand.docs.pmnd.rs/reference/middlewares/subscribe-with-selector) — subscribeWithSelector optionnel, Zustand v5

### Secondary (MEDIUM confidence)

- [github.com/pmndrs/zustand/discussions/2475](https://github.com/pmndrs/zustand/discussions/2475) — Pattern subscribe-based hydration (non-middleware)
- [developer.mozilla.org — Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — Limites IndexedDB par navigateur
- [dexie.org/docs/libs/dexie-react-hooks](https://dexie.org/docs/libs/dexie-react-hooks) — Confirmation intégration dans dexie v4

### Tertiary (LOW confidence)

- [github.com/dfahlander/Dexie.js/issues/883](https://github.com/dfahlander/Dexie.js/issues/883) — Firefox private mode + IndexedDB (issue ouverte, pas de résolution confirmée)

---

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — versions vérifiées npm, documentation officielle consultée
- Architecture : HIGH — patterns extraits du code existant (PATTERNS.md) + docs officielles
- Pitfalls : MEDIUM/HIGH — Pitfall 1-4 HIGH (docs officielles), Pitfall 5-6 MEDIUM (comportement IndexedDB bien documenté MDN)

**Research date :** 2026-05-02
**Valid until :** 2026-06-02 (stack stable — Dexie v4 et Zustand v5 ne sont pas en fast-moving)

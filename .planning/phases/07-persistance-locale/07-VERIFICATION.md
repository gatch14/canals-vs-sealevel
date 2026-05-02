---
phase: 07-persistance-locale
verified: 2026-05-02T09:50:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Tracer un canal puis rafraîchir la page (F5 ou fermer/rouvrir l'onglet)"
    expected: "Le canal tracé est toujours présent sur la carte après le refresh (PERS-01)"
    why_human: "Requiert un vrai navigateur avec IndexedDB réel — fake-indexeddb couvre la couche CRUD mais pas l'intégration complète browser + Vite + React StrictMode en conditions réelles"
  - test: "Modifier largeur et profondeur dans CalculationPanel, puis rafraîchir"
    expected: "Les valeurs saisies (ex. largeur=100m, profondeur=10m) sont pré-remplies après rechargement (PERS-02)"
    why_human: "Même raison — comportement réel du subscribe Zustand→Dexie en conditions navigateur"
  - test: "Cliquer 'Effacer toutes les données', puis confirmer, puis rafraîchir"
    expected: "La carte est vide après confirmation ; après rafraîchissement, toujours vide (PERS-03)"
    why_human: "Vérification visuelle de l'overlay, du dialog, de l'effacement effectif et de la persistance de l'état vide"
---

# Phase 7: Persistance Locale — Rapport de Vérification

**Phase Goal:** L'utilisateur retrouve ses canaux et paramètres de calcul intacts après un refresh ou une fermeture de l'onglet
**Verified:** 2026-05-02T09:50:00Z
**Status:** human_needed
**Re-verification:** Non — vérification initiale

---

## Résumé de l'évaluation

Toutes les vérifications programmatiques passent : 9/9 must-haves vérifiés, artefacts substantiels et câblés, suite de tests 101/101 GREEN, TypeScript sans erreur. Trois items nécessitent validation humaine en navigateur réel pour confirmer le comportement de bout en bout.

---

## Vérités Observables

| # | Vérité | Statut | Preuve |
|---|--------|--------|--------|
| 1 | `dexie` est dans `dependencies` de package.json | VERIFIED | `"dexie": "^4.4.2"` présent à la ligne 16 de package.json |
| 2 | `fake-indexeddb` est dans `devDependencies` de package.json | VERIFIED | `"fake-indexeddb": "^6.2.5"` présent à la ligne 30 de package.json |
| 3 | `StoredCanal` est exporté depuis `src/types/canal.ts` | VERIFIED | `export type StoredCanal = Omit<Canal, 'elevation' \| 'elevationLoading' \| 'elevationError'>` ligne 25 |
| 4 | `src/services/db.ts` exporte `const db` avec tables `canals` et `settings` | VERIFIED | Singleton `CanalDatabase extends Dexie` avec `canals!: Table<StoredCanal, string>` et `settings!: Table<SettingsRecord, string>` |
| 5 | `canalStore` contient les actions `clearAll` et `hydrateCanals` | VERIFIED | Interface CanalStore lignes 47–48, implémentations lignes 149–161 |
| 6 | `src/hooks/usePersistence.ts` exporte la fonction `usePersistence` | VERIFIED | Hydration au montage + subscribe basique + cleanup `cancelled+unsub()` |
| 7 | `usePersistence()` est appelé dans `SidePanel` (et non dans App.tsx) | VERIFIED | Ligne 22 de SidePanel.tsx ; App.tsx ne contient aucune référence à `usePersistence` |
| 8 | `ClearDataButton` est rendu dans la Section 7 de `SidePanel` | VERIFIED | `<ClearDataButton />` dans `div` Section 7 après `<DashboardPanel />`, ligne 119 |
| 9 | Suite de tests complète GREEN — 0 régression | VERIFIED | `101/101 tests passed` incluant 6 tests persistence.test.ts + 6 tests clearAll/hydrateCanals |

**Score:** 9/9 vérités confirmées

---

## Artefacts Requis

| Artefact | Attendu | Statut | Détail |
|----------|---------|--------|--------|
| `package.json` | dexie ^4.4.2 + fake-indexeddb ^6.2.5 | VERIFIED | Présents dans dependencies et devDependencies |
| `src/types/canal.ts` | StoredCanal exporté | VERIFIED | Omit des 3 champs elevation*, interface Canal intacte |
| `src/services/db.ts` | Singleton Dexie, tables canals + settings | VERIFIED | Fichier substantiel (27 lignes), schema v1, export const db |
| `src/store/canalStore.ts` | clearAll + hydrateCanals | VERIFIED | Dans l'interface et dans le create(), comportements corrects |
| `src/hooks/usePersistence.ts` | Hydration + subscribe sync | VERIFIED | Fichier substantiel (96 lignes), toute la logique présente |
| `src/components/ClearDataButton.tsx` | Dialog de confirmation + transaction atomique | VERIFIED | 67 lignes, `db.transaction('rw')`, `clearAll()`, overlay, stopPropagation |
| `src/components/SidePanel.tsx` | usePersistence() + ClearDataButton | VERIFIED | Les deux intégrés, usePersistence ligne 22, ClearDataButton Section 7 |
| `src/tests/persistence.test.ts` | 6 tests GREEN (PERS-01/02/03) | VERIFIED | 6 tests, `fake-indexeddb/auto` en tête, tous passent |
| `src/store/canalStore.test.ts` | Tests clearAll + hydrateCanals GREEN | VERIFIED | 6 tests Phase 7 ajoutés, tous passent (19 tests store au total) |

---

## Vérification des Liaisons Clés (Key Links)

| Depuis | Vers | Via | Statut | Détail |
|--------|------|-----|--------|--------|
| `usePersistence.ts` | `db.ts` | import + `db.canals.toArray()`, `db.settings.get()`, `bulkPut`, `bulkDelete` | WIRED | Hydration et sync complètes |
| `usePersistence.ts` | `canalStore.ts` | `useCanalStore.subscribe()`, `hydrateCanals()`, `setCalcParams()` | WIRED | Subscribe basique avec comparaison de références |
| `ClearDataButton.tsx` | `db.ts` | `db.transaction('rw', [db.canals, db.settings])` | WIRED | Transaction atomique IndexedDB |
| `ClearDataButton.tsx` | `canalStore.ts` | `useCanalStore((s) => s.clearAll)` | WIRED | Reset store après IndexedDB |
| `SidePanel.tsx` | `usePersistence.ts` | `usePersistence()` au top du composant (ligne 22) | WIRED | Montage unique, cohérent avec useElevation + useRoutingWorker |
| `SidePanel.tsx` | `ClearDataButton.tsx` | `<ClearDataButton />` dans Section 7 | WIRED | Rendu dans le conteneur scrollable |
| `persistence.test.ts` | `db.ts` | `import { db }` | WIRED | Tests GREEN, fake-indexeddb polyfille jsdom |

---

## Trace de Flux de Données (Level 4)

| Artefact | Variable de données | Source | Produit des données réelles | Statut |
|----------|---------------------|--------|----------------------------|--------|
| `usePersistence.ts` (hydration) | `storedCanals`, `settings` | `db.canals.toArray()`, `db.settings.get('calcParams')` — Dexie/IndexedDB | Oui — lecture depuis vraie DB, fallback silencieux si vide | FLOWING |
| `usePersistence.ts` (sync) | `state.canals`, `state.calcParams` | Subscribe Zustand — comparaison de références `!==` | Oui — déclenché sur chaque mutation, bulkPut + bulkDelete orphelins | FLOWING |
| `ClearDataButton.tsx` | `showConfirm` | useState local | Oui — état local UI contrôlant le dialog | FLOWING |
| `canalStore.ts` `clearAll` | état complet du store | set({}) vers état initial | Oui — réinitialise toutes les propriétés | FLOWING |

**Point d'attention observé :** `usePersistence` est monté dans `SidePanel`. Si `SidePanel` n'est pas encore rendu au moment d'un test E2E ou au premier paint, il y aurait un délai d'hydration. Ce comportement est correct par conception (async, non-bloquant) mais mérite confirmation visuelle : l'utilisateur ne doit pas voir de flash "canaux vides" avant l'hydration.

---

## Vérifications Comportementales (Spot-Checks)

| Comportement | Commande | Résultat | Statut |
|--------------|----------|----------|--------|
| Suite de tests complète | `npm run test -- --run` | 101/101 passed, 9 fichiers | PASS |
| TypeScript sans erreur | `npx tsc --noEmit` | 0 erreurs (sortie vide) | PASS |
| db.ts exporte le singleton | `grep "export const db"` db.ts | `export const db = new CanalDatabase()` | PASS |
| usePersistence exclut elevation* | `grep "elevation: _e"` usePersistence.ts | Ligne 70 présente | PASS |
| bulkDelete orphelins implémenté | `grep "bulkDelete"` usePersistence.ts | Ligne 80 présente | PASS |
| App.tsx sans usePersistence | `grep "usePersistence"` App.tsx | 0 résultats | PASS |
| SidePanel Section 7 avec commentaire | `grep "Section 7"` SidePanel.tsx | Présent ligne 117 | PASS |

---

## Couverture des Requirements

| Requirement | Plan source | Description | Statut | Preuve |
|-------------|-------------|-------------|--------|--------|
| PERS-01 | T01, T02, T03 | Canaux restaurés après refresh | VERIFIED (programmatique) + HUMAN NEEDED (E2E) | db.ts + usePersistence hydration + tests persistence GREEN |
| PERS-02 | T01, T02, T03 | calcParams restaurés après refresh | VERIFIED (programmatique) + HUMAN NEEDED (E2E) | db.settings + setCalcParams dans hydration + test put/get round-trip GREEN |
| PERS-03 | T01, T02, T03 | Effacement depuis l'interface | VERIFIED (programmatique) + HUMAN NEEDED (visuel) | ClearDataButton avec transaction atomique + clearAll + dialog confirmé par code |

Aucun requirement orphelin : PERS-01, PERS-02, PERS-03 sont tous déclarés dans les trois plans et intégralement implémentés.

---

## Anti-Patterns Détectés

| Fichier | Ligne | Pattern | Sévérité | Impact |
|---------|-------|---------|----------|--------|
| — | — | Aucun placeholder, stub, ou return null détecté | — | — |

**Absence de flags problématiques vérifiée :**
- Aucun `subscribeWithSelector` dans usePersistence.ts (anti_truth T02 respectée)
- Les champs `elevation*` sont exclus via destructuring avant persistance (anti_truth T02 respectée)
- usePersistence n'est pas appelé dans App.tsx (anti_truth T03 respectée)
- `StoredCanal` utilise `Omit` et non une redéfinition manuelle (risque de désynchronisation évité)

---

## Vérification Humaine Requise

### 1. Restauration des canaux après refresh (PERS-01)

**Test:** Lancer `npm run dev`, ouvrir l'app, tracer un ou plusieurs canaux, fermer l'onglet ou appuyer sur F5.
**Attendu:** Les canaux tracés sont intégralement restaurés (tracés sur la carte, présents dans CanalList) sans action de l'utilisateur.
**Pourquoi humain:** Requiert IndexedDB réel du navigateur. Les tests Vitest utilisent fake-indexeddb (jsdom) qui ne valide pas l'intégration complète avec le cycle de vie React + Vite HMR + StrictMode double-mount.

### 2. Restauration des paramètres de calcul (PERS-02)

**Test:** Modifier largeur (ex. 200m) et profondeur (ex. 15m) dans le panneau CalculationPanel, puis rafraîchir la page.
**Attendu:** Les valeurs 200m et 15m sont pré-remplies dans les champs après rechargement.
**Pourquoi humain:** Valide que `setCalcParams(settings.value as Partial<CalcParams>)` dans usePersistence s'exécute correctement après le montage du composant, avec les bonnes valeurs.

### 3. Effacement complet des données (PERS-03)

**Test:** Avec des canaux et paramètres présents, cliquer "Effacer toutes les données" dans le bas du panneau latéral, puis confirmer. Ensuite rafraîchir.
**Attendu:** (1) L'overlay s'ouvre avec le texte de confirmation. (2) Cliquer "Effacer tout" vide immédiatement la carte et les panneaux. (3) Après rafraîchissement, l'état est toujours vide — les données ne reviennent pas.
**Pourquoi humain:** Valide l'ordre d'opération (IndexedDB d'abord, store ensuite), l'atomicité de la transaction Dexie, et l'absence de ré-hydration après effacement.

---

## Résumé des Gaps

Aucun gap bloquant identifié. Toutes les vérifications programmatiques sont vertes. Le statut `human_needed` est dû uniquement aux 3 items de vérification manuelle en navigateur réel ci-dessus — comportement attendu pour une phase de persistance IndexedDB.

---

_Vérifié : 2026-05-02T09:50:00Z_
_Verifier : Claude (gsd-verifier)_

# Phase 7: Persistance Locale - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped — mode=yolo)

<domain>
## Phase Boundary

L'utilisateur retrouve ses canaux et paramètres de calcul intacts après un refresh ou une fermeture de l'onglet. La persistance est assurée via IndexedDB (Dexie.js), entièrement côté client. Cette phase ajoute la couche de persistance au store Zustand existant (canalStore.ts) sans modifier les calculs ni l'UI principale — uniquement la durabilité des données entre sessions.

Requirements couverts : PERS-01 (canaux restaurés), PERS-02 (calcParams restaurés), PERS-03 (effacement depuis l'UI).

</domain>

<decisions>
## Implementation Decisions

### Architecture de persistance
- Dexie.js comme couche IndexedDB (déjà prévu dans STATE.md et ROADMAP)
- Intégration via service `db.ts` (singleton Dexie) + hook `usePersistence.ts` appelé dans App.tsx au démarrage
- Le store Zustand reste source de vérité en mémoire — Dexie est la couche de persistance sous-jacente
- Sync déclenché à chaque mutation du store (subscribe Zustand → écriture Dexie)
- Hydration au démarrage : `useEffect` dans App.tsx qui lit Dexie et hydrate le store avant le premier rendu

### Données persistées
- `canals[]` : tracés complets (points, name, id, createdAt, isRouted, elevation si présente)
- `calcParams` : largeur, profondeur et tous les paramètres de calcul
- Séparés en deux tables Dexie : `canals` et `settings`

### Stratégie d'hydration
- Chargement synchrone des données avant affichage de la carte (état loading initial)
- Si IndexedDB vide ou erreur → démarrage avec état initial vide (graceful fallback)
- React StrictMode safe : useEffect avec cleanup, pas de double-write problématique

### UI — Effacement des données
- Bouton "Effacer toutes les données" dans le panneau latéral (section Settings ou footer)
- Dialog de confirmation avant effacement (cohérent avec DeleteConfirmDialog existant)
- Après effacement : reset du store + effacement IndexedDB + feedback visuel bref

### Claude's Discretion
- Emplacement exact du bouton d'effacement dans le SidePanel
- Schema Dexie (version 1, évolution future si nécessaire)
- Gestion des erreurs IndexedDB (quota dépassé, private browsing)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `canalStore.ts` (Zustand) — store principal avec `canals[]` et `calcParams` à persister
- `DeleteConfirmDialog` — pattern de confirmation d'action destructive, réutilisable pour effacement
- `types/canal.ts`, `types/calculation.ts` — types Canal et CalcParams déjà définis

### Established Patterns
- Zustand avec `create<Store>()((set, get) => ...)` — pattern store existant
- Hooks dans `src/hooks/` — ex. `useElevation.ts`, `useCalculation.ts` — même pattern pour `usePersistence.ts`
- Services dans `src/services/` — ex. `elevationApi.ts` — même pattern pour `db.ts`
- Tests dans `src/tests/` — pattern Wave 0 (stubs RED puis implémentation GREEN)

### Integration Points
- `App.tsx` — point d'entrée pour l'hydration initiale au montage
- `canalStore.ts` — subscribe Zustand pour déclencher les écritures Dexie
- `SidePanel.tsx` — composant UI pour le bouton d'effacement

</code_context>

<specifics>
## Specific Ideas

- La persistance doit être transparente — l'utilisateur ne doit pas avoir à "sauvegarder" manuellement
- Aucune connexion réseau requise — entièrement IndexedDB local
- Compatible avec le mode "git clone + npm run dev" sans configuration

</specifics>

<deferred>
## Deferred Ideas

- Export/import JSON des canaux (vers v3)
- Sync entre onglets (BroadcastChannel) — complexité non justifiée en v2
- Quota management avancé (UI de gestion de l'espace) — fallback silencieux suffit en v2

</deferred>

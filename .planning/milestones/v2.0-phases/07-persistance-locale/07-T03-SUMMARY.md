---
phase: 07-persistance-locale
plan: T03
subsystem: ui
tags: [react, tailwind, indexeddb, dexie, zustand, typescript, persistence]

# Dependency graph
requires:
  - phase: 07-T02
    provides: db.ts singleton Dexie, clearAll/hydrateCanals dans le store, usePersistence.ts hook

provides:
  - src/components/ClearDataButton.tsx : bouton effacement avec dialog de confirmation (PERS-03)
  - src/components/SidePanel.tsx : usePersistence() monté + ClearDataButton Section 7

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dialog de confirmation pattern : overlay fixed inset-0 z-50 + stopPropagation sur la box (cohérence DeleteConfirmDialog)"
    - "db.transaction('rw') pour effacement atomique IndexedDB (canals + settings en une transaction)"
    - "Hook side-effect dans SidePanel : usePersistence() au même niveau que useElevation + useRoutingWorker"

key-files:
  created:
    - src/components/ClearDataButton.tsx
  modified:
    - src/components/SidePanel.tsx

key-decisions:
  - "usePersistence monté dans SidePanel.tsx (pas App.tsx) : cohérence avec useElevation + useRoutingWorker, évite le double montage"
  - "ClearDataButton utilise db.transaction('rw') pour l'atomicité, puis clearAll() store — IndexedDB d'abord, mémoire ensuite"

# Metrics
duration: 5min
completed: 2026-05-02
---

# Phase 7 Plan T03: ClearDataButton.tsx + intégration SidePanel — Summary

**ClearDataButton.tsx avec dialog de confirmation (pattern DeleteConfirmDialog), usePersistence() monté dans SidePanel — Phase 7 entièrement fonctionnelle (PERS-01 + PERS-02 + PERS-03)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-02T09:30:00Z
- **Completed:** 2026-05-02T09:35:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 créé, 1 modifié)

## Accomplishments

- `src/components/ClearDataButton.tsx` créé : dialog de confirmation suivant exactement le pattern DeleteConfirmDialog (overlay fixed inset-0 z-50, stopPropagation, boutons annuler/destructif). handleConfirm effectue d'abord la transaction IndexedDB atomique (db.transaction 'rw'), puis clearAll() store mémoire — cohérence garantie.
- `src/components/SidePanel.tsx` modifié : imports usePersistence + ClearDataButton ajoutés, usePersistence() appelé après useRoutingWorker() (ligne 22), Section 7 ajoutée dans le corps scrollable avec ClearDataButton après DashboardPanel.
- 101/101 tests GREEN — zéro régression sur la suite complète.
- App.tsx ne contient pas d'import usePersistence — pas de double montage confirmé.

## Task Commits

1. **Task 1: Créer src/components/ClearDataButton.tsx** - `19816a0` (feat)
2. **Task 2: Modifier SidePanel.tsx** - `18068db` (feat)

## Files Created/Modified

- `src/components/ClearDataButton.tsx` — bouton effacement avec état local showConfirm, dialog de confirmation, transaction Dexie atomique + reset store Zustand
- `src/components/SidePanel.tsx` — +import usePersistence +import ClearDataButton, usePersistence() au top du composant, Section 7 avec ClearDataButton après DashboardPanel

## Decisions Made

- usePersistence monté dans SidePanel.tsx (pas App.tsx) : cohérence avec useElevation + useRoutingWorker qui suivent le même pattern. Évite de modifier App.tsx (layout racine sans logique métier) et le double montage.
- db.transaction('rw', [db.canals, db.settings]) : effacement atomique des deux tables IndexedDB en une seule transaction, puis clearAll() — l'ordre garantit qu'en cas d'erreur IndexedDB, le store mémoire n'est pas remis à zéro avec des données encore présentes dans la DB.

## Deviations from Plan

None — plan exécuté exactement comme spécifié.

## Issues Encountered

None.

## Known Stubs

Aucun stub — ClearDataButton.tsx et SidePanel.tsx implémentés complètement. Phase 7 entièrement fonctionnelle.

## Threat Flags

Aucun nouveau surface de sécurité non couvert par le threat model du plan.
- T-07-04 (Tampering) : double confirmation dialog implémentée (bouton principal discret + dialog de confirmation explicite)
- T-07-05 (DoS double montage) : vérifié — App.tsx n'importe pas usePersistence

## Phase 7 Complete

- PERS-01 : hydration automatique au démarrage (usePersistence.ts, monté dans SidePanel)
- PERS-02 : calcParams persistés et restaurés au rafraîchissement (usePersistence subscribe)
- PERS-03 : bouton d'effacement avec dialog de confirmation (ClearDataButton dans Section 7)

## Self-Check: PASSED

- FOUND: src/components/ClearDataButton.tsx
- FOUND: src/components/SidePanel.tsx (modifié)
- FOUND: .planning/phases/07-persistance-locale/07-T03-SUMMARY.md
- FOUND: commit 19816a0 (Task 1)
- FOUND: commit 18068db (Task 2)
- Tous les acceptance criteria validés (11/11)

---
*Phase: 07-persistance-locale*
*Completed: 2026-05-02*

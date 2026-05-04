---
phase: 01-map-shell-trac
plan: T01
subsystem: ui
tags: [vite, react, typescript, maplibre-gl, zustand, tailwindcss, vitest]

# Dependency graph
requires: []
provides:
  - Projet Vite React-TypeScript bootstrappé et installable (npm install + npm run dev)
  - Types Canal, Coord, UIMode exportés depuis src/types/canal.ts
  - Store Zustand useCanalStore avec logique métier MAP-02 complète
  - Suite Vitest 5 tests verts pour MAP-02
  - Configuration Tailwind CSS v4 + Vitest jsdom dans vite.config.ts
affects: [T02, T03, phase-2, phase-3, phase-4]

# Tech tracking
tech-stack:
  added:
    - maplibre-gl@5.24.0 (rendu carte WebGL)
    - zustand@5.0.12 (state management)
    - lucide-react@1.14.0 (icons)
    - tailwindcss@4.2.4 + @tailwindcss/vite (styles utilitaires)
    - vitest@3.2.4 + jsdom (tests unitaires)
    - vite@8.0.10 + @vitejs/plugin-react@6.0.1 (build tool)
    - typescript@5.8.3 (typage statique)
  patterns:
    - Store Zustand create<Interface>() avec get() pour finalizeCanal guard
    - Types centralisés dans src/types/canal.ts, importés via import type
    - Coord = [lng, lat] WGS84 — convention stricte dans tout le projet
    - TDD RED/GREEN — tests écrits avant implémentation

key-files:
  created:
    - src/types/canal.ts
    - src/store/canalStore.ts
    - src/store/canalStore.test.ts
    - vite.config.ts
    - package.json
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.node.json
    - index.html
    - src/main.tsx
    - src/App.tsx
    - src/index.css
    - .gitignore
  modified: []

key-decisions:
  - "Scaffold manuel des fichiers Vite au lieu de npm create vite (répertoire non-vide)"
  - "Versions npm ajustées : @types/react@19.2.14, @types/react-dom@19.2.3 (19.2.5 inexistant)"
  - "Coord = [lng, lat] WGS84 — jamais [lat, lng] (Pitfall 10 documenté)"
  - "finalizeCanal guard draftPoints.length < 2 — no-op obligatoire pour intégrité du canal"
  - "Store Zustand sans référence mapRef — carte dans useRef React uniquement"

patterns-established:
  - "Pattern Coord: [lng, lat] WGS84 — toujours dans cet ordre dans tout le projet"
  - "Pattern TDD: tests RED avant implémentation, commit test séparé du commit feat"
  - "Pattern store Zustand: get() dans finalizeCanal pour accéder au state courant"
  - "Pattern import type: import type { Canal, Coord, UIMode } depuis types/canal"

requirements-completed: [MAP-01, MAP-02]

# Metrics
duration: 5min
completed: 2026-04-30
---

# Phase 1 Plan T01: Scaffold Vite + Types + Store Summary

**Projet Vite React-TypeScript bootstrappé avec store Zustand useCanalStore (5 tests MAP-02 verts) et configuration Tailwind CSS v4 + Vitest jsdom**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-30T14:34:43Z
- **Completed:** 2026-04-30T14:40:03Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Scaffold Vite React-TypeScript complet (package.json, tsconfig, vite.config) — npm install et npm run dev opérationnels
- Types Canal, Coord (lng/lat WGS84), UIMode définis dans src/types/canal.ts et exportés pour toutes les phases
- Store Zustand useCanalStore avec 7 actions + garde finalizeCanal < 2 points + désélection automatique sur deleteCanal
- 5 tests Vitest verts couvrant tous les comportements MAP-02 (TDD RED/GREEN respecté)

## Task Commits

Chaque tâche committée atomiquement :

1. **Task 1: Scaffold Vite + config** - `2443058` (chore)
2. **Task 2: Tests RED** - `e2b5a8c` (test)
3. **Task 2: Types + Store GREEN** - `8033dcc` (feat)

## Files Created/Modified

- `package.json` — dépendances complètes (maplibre-gl, zustand, tailwindcss, vitest)
- `vite.config.ts` — plugin Tailwind CSS v4 + Vitest jsdom
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` — TypeScript strict
- `index.html` — titre "Canal Explorer"
- `src/main.tsx` — React 19 createRoot avec StrictMode
- `src/App.tsx` — placeholder div bg-gray-900 (remplacé en T03)
- `src/index.css` — @import tailwindcss + maplibre-gl/dist/maplibre-gl.css
- `.gitignore` — standard Vite
- `src/types/canal.ts` — Coord, UIMode, Canal interface
- `src/store/canalStore.ts` — useCanalStore Zustand avec toutes les actions
- `src/store/canalStore.test.ts` — 5 tests MAP-02

## Decisions Made

- Scaffold manuel des fichiers Vite (npm create vite échoue sur répertoire non-vide avec .planning/)
- Versions npm ajustées : @types/react@19.2.14, @types/react-dom@19.2.3, @vitejs/plugin-react@6.0.1 (versions réelles npm)
- Coord = [lng, lat] WGS84 — convention stricte établie dès le premier type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm create vite échoue sur répertoire non-vide**
- **Found during:** Task 1 (scaffold)
- **Issue:** La commande `npm create vite@latest . -- --template react-ts` annule silencieusement si le répertoire contient des fichiers (.planning/, CLAUDE.md)
- **Fix:** Création manuelle de tous les fichiers du template Vite React-TypeScript
- **Files modified:** Tous les fichiers listés ci-dessus
- **Verification:** npm install exit code 0, npx vitest run fonctionne
- **Committed in:** 2443058 (Task 1 commit)

**2. [Rule 3 - Blocking] Versions @types/react-dom inexactes**
- **Found during:** Task 1 (npm install)
- **Issue:** @types/react-dom@^19.2.5 n'existe pas sur npm (version max = 19.2.3)
- **Fix:** Ajustement vers les versions réelles : @types/react@19.2.14, @types/react-dom@19.2.3
- **Files modified:** package.json
- **Verification:** npm install exit code 0
- **Committed in:** 2443058 (Task 1 commit — ajustement inline)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Corrections nécessaires pour débloquer l'installation. Aucun impact sur l'architecture ou les fonctionnalités.

## Issues Encountered

- npm create vite refuse les répertoires non-vides — résolu par scaffold manuel (équivalent exact du template react-ts)

## User Setup Required

None — 100% client-side, aucune clé API, aucune variable d'environnement. Seule contrainte : connexion internet pour les tiles OpenFreeMap.

## Next Phase Readiness

- T02 (MapView) peut importer `useCanalStore` et `Canal`/`Coord` depuis les chemins définis
- T03 (UI components) peut utiliser Tailwind CSS v4 et lucide-react
- Les types sont stables et extensibles pour Phase 2 (ajout de champs elevation)
- Aucun bloqueur

---
*Phase: 01-map-shell-trac*
*Completed: 2026-04-30*

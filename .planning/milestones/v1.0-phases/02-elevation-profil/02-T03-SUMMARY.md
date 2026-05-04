---
phase: 02-elevation-profil
plan: T03
subsystem: ui-components
tags: [elevation, recharts, maplibre, zustand, uphill, ui]
dependency_graph:
  requires:
    - ElevationProfile (src/types/elevation.ts) — T01
    - UphillSegment / ElevationPoint (src/types/elevation.ts) — T01
    - useElevation (src/hooks/useElevation.ts) — T02
    - Canal.elevation? / elevationLoading? / elevationError? (src/types/canal.ts) — T01
    - setElevation / setElevationLoading / setElevationError (src/store/canalStore.ts) — T01
  provides:
    - ElevationChart (src/components/ElevationChart.tsx)
    - ElevationPanel (src/components/ElevationPanel.tsx)
    - Badge pill gravitaire (src/components/CanalListItem.tsx)
    - Layer canal-uphill MapLibre (src/components/MapView.tsx)
    - useElevation monté dans SidePanel (src/components/SidePanel.tsx)
  affects:
    - Phase 3 (MapView étendu — layers supplémentaires possibles)
    - Phase 6 (SidePanel étendu — footer conservé)
tech_stack:
  added: []
  patterns:
    - Recharts AreaChart + ReferenceArea (ordre obligatoire ReferenceArea avant Area)
    - isAnimationActive=false sur Recharts (outil scientifique — pas d'animation)
    - MapLibre GeoJSONSource.setData() pour layer uphill dynamique
    - turf.along() pour interpolation des points de début/fin de segment uphill
    - Vérification défensive map.getSource() avant addSource() (évite erreur double-mount)
    - useElevation() monté dans SidePanel (orchestration fetch side-effects uniquement)
key_files:
  created:
    - src/components/ElevationChart.tsx (Recharts AreaChart avec ReferenceArea uphill avant Area)
    - src/components/ElevationPanel.tsx (accordéon 4 états : vide/chargement h-40/erreur/données)
  modified:
    - src/components/CanalListItem.tsx (badge pill 3 variantes : ⏳ gris / ✅ vert / ⚠ ambre)
    - src/components/MapView.tsx (canal-uphill-source + layer #EF4444 5px + syncUphillLayer)
    - src/components/SidePanel.tsx (useElevation() monté + ElevationPanel Section 4)
decisions:
  - "ReferenceArea déclaré avant Area dans ElevationChart — obligatoire pour que la courbe bleue soit visible au-dessus des zones rouges"
  - "isAnimationActive=false sur tous les éléments Recharts — outil scientifique, animations non désirées"
  - "syncUphillLayer séparée de syncLayers — respecte la consigne de ne pas modifier syncLayers existant"
  - "Vérification défensive if (!map.getSource('canal-uphill-source')) — évite l'erreur double-mount React StrictMode"
  - "turf.along() pour matérialiser les segments uphill sur la carte — coordonnées exactes en km depuis le début du tracé"
metrics:
  duration: "2m 38s"
  completed_date: "2026-04-30"
  tasks_completed: 2
  tasks_total: 3
  files_created: 2
  files_modified: 3
---

# Phase 02 Plan T03: UI Components Élévation Summary

**One-liner:** ElevationChart (Recharts AreaChart zones uphill rouges) + ElevationPanel (accordéon 4 états) + badge pill gravitaire CanalListItem + layer canal-uphill MapLibre #EF4444 + useElevation monté dans SidePanel — UI Phase 2 complète visuellement.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Créer ElevationChart.tsx + ElevationPanel.tsx | d4250ba | src/components/ElevationChart.tsx, src/components/ElevationPanel.tsx |
| 2 | Étendre CanalListItem + MapView + SidePanel | ba5a474 | src/components/CanalListItem.tsx, src/components/MapView.tsx, src/components/SidePanel.tsx |

---

## What Was Built

### Task 1 — ElevationChart + ElevationPanel

**ElevationChart.tsx :**
- Recharts `ResponsiveContainer` (100% × 160px)
- `AreaChart` avec `CartesianGrid` horizontal seulement (`#374151`)
- `XAxis` distance km + `YAxis` altitude m — ticks `#9CA3AF`, `fontSize: 10`
- `Tooltip` thème sombre (`#1F2937`, bordure `rgba(255,255,255,0.12)`)
- `ReferenceArea` uphill (fill `#EF4444`, opacité 30%) **déclarée AVANT** `Area` principale
- `Area` courbe altitude (stroke `#3B82F6`, fill 15%, `isAnimationActive={false}`)

**ElevationPanel.tsx :**
- Accordéon avec `ChevronDown` (rotation 180° quand ouvert)
- Header `h-8` (32px), `uppercase tracking-wider`, `hover:bg-white/[0.04]`
- 4 états complets :
  - **Vide** : `h-10` placeholder italique `text-gray-500`
  - **Chargement** : `h-40` spinner + texte "Chargement du profil..."
  - **Erreur** : `AlertCircle` + "Open Topo Data inaccessible..."
  - **Données** : `ElevationChart` + message gravitaire (✅ vert / ⚠ ambre)
- Accordéon s'ouvre automatiquement à la sélection d'un canal (`useEffect`)

### Task 2 — CanalListItem + MapView + SidePanel

**CanalListItem.tsx :**
- Ajout `flex flex-col gap-[2px] min-w-0` autour du nom + badge
- Badge pill conditionnel 3 variantes :
  - `⏳ Chargement...` (gris `bg-gray-700 text-gray-400`)
  - `✅ Gravitaire` (vert `bg-green-500/15 text-green-400`)
  - `⚠ Montées détectées` (ambre `bg-amber-500/15 text-amber-400`)
- `items-start` sur la `<li>` pour aligner le bouton supprimer en haut

**MapView.tsx :**
- Import `along, lineString` de `@turf/turf` + type `ElevationProfile`
- `initSources()` étendu : source `canal-uphill-source` + layer `canal-uphill` (#EF4444, 5px)
- Vérification défensive `if (!map.getSource('canal-uphill-source'))` — anti-double-mount
- `syncUphillLayer()` : construite les `LineString` GeoJSON depuis les segments uphill via `turf.along()`
- `useEffect` dédié : `syncUphillLayer` appelé sur changement de `canals` ou `selectedCanalId`

**SidePanel.tsx :**
- `useElevation()` monté au niveau SidePanel — déclenche automatiquement les fetches
- `ElevationPanel` ajouté en Section 4 (entre `CanalList` et footer)
- Footer conservé en Section 5

---

## Test State

| Suite | État | Tests |
|-------|------|-------|
| `canalStore.test.ts` | VERT | 5 tests (Phase 1 — inchangé) |
| `uphill.test.ts` | VERT | 5 tests GREEN |
| `samplePoints.test.ts` | VERT | 4 tests GREEN |
| `elevationApi.test.ts` | VERT | 6 tests GREEN |

**Résultat `npm test`:** 20 tests passed, 4 suites passed — 0 failed, 0 todo.

**TypeScript :** `npx tsc --noEmit` — 0 erreur.

---

## Deviations from Plan

None - plan exécuté exactement comme écrit.

---

## Known Stubs

Aucun stub. Tous les composants sont câblés avec les données réelles du store :
- `ElevationChart` reçoit `profile.points` et `profile.uphillSegments` depuis le store Zustand
- `ElevationPanel` lit `canal.elevation`, `canal.elevationLoading`, `canal.elevationError` depuis le store
- `CanalListItem` badges basés sur `canal.elevation?.isFullyGravity` et `canal.elevationLoading`
- `syncUphillLayer` lit `selectedCanal?.elevation` depuis le store Zustand

---

## Threat Flags

Menaces T-02-06, T-02-07, T-02-08 du threat model mitigées :

| Threat | Mitigation implémentée |
|--------|----------------------|
| T-02-06 Tampering (ElevationChart) | `ElevationPoint[]` typé TypeScript — Recharts reçoit uniquement des `number`, pas de chaînes utilisateur |
| T-02-07 Tampering (syncUphillLayer → MapLibre) | Coordonnées construites depuis `turf.along()` sur données numériques typées — aucune interpolation de chaîne |
| T-02-08 DoS (layout shift) | Hauteur fixe `h-40` (160px) sur spinner ET graphique — implémentée dans ElevationPanel |

---

## Self-Check: PASSED

Fichiers créés :
- src/components/ElevationChart.tsx — FOUND
- src/components/ElevationPanel.tsx — FOUND

Fichiers modifiés :
- src/components/CanalListItem.tsx — FOUND
- src/components/MapView.tsx — FOUND
- src/components/SidePanel.tsx — FOUND

Commits :
- d4250ba — FOUND (feat(02-T03): créer ElevationChart + ElevationPanel)
- ba5a474 — FOUND (feat(02-T03): étendre CanalListItem + MapView + SidePanel)

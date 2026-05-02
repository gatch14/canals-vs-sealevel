---
phase: 02-elevation-profil
plan: T02
subsystem: service-hook-tests
tags: [elevation, turf, opentopodata, zustand, vitest, race-condition, cache]
dependency_graph:
  requires:
    - ElevationPoint (src/types/elevation.ts) — T01
    - UphillSegment (src/types/elevation.ts) — T01
    - ElevationProfile (src/types/elevation.ts) — T01
    - Coord (src/types/canal.ts) — T01
    - setElevation / setElevationLoading / setElevationError (src/store/canalStore.ts) — T01
    - Wave 0 test stubs (src/tests/) — T01
  provides:
    - samplePoints (src/services/elevationApi.ts)
    - fetchElevations (src/services/elevationApi.ts)
    - detectUphillSegments (src/services/elevationApi.ts)
    - buildProfile (src/services/elevationApi.ts)
    - useElevation (src/hooks/useElevation.ts)
  affects:
    - T03 (consomme useElevation + elevationApi pour ElevationChart + MapLibre layer)
tech_stack:
  added: []
  patterns:
    - Turf.js sampling (along + length — 100 points interpolés sur LineString)
    - fetch POST avec inversion lat/lng obligatoire (GeoJSON vs Open Topo Data)
    - AbortController timeout 10s + flag cancelled (race condition prevention)
    - Cache mémoire Zustand (canal.elevation? présent = skip fetch)
    - Null normalization (r.elevation ?? 0 pour hors-couverture DEM)
key_files:
  created:
    - src/services/elevationApi.ts (samplePoints, fetchElevations, detectUphillSegments, buildProfile)
    - src/hooks/useElevation.ts (useElevation — orchestration fetch + store)
  modified:
    - src/tests/samplePoints.test.ts (stubs todo → 4 tests complets GREEN)
    - src/tests/elevationApi.test.ts (stubs todo → 6 tests complets GREEN)
decisions:
  - "Inversion lat/lng dans fetchElevations : coords.map(([lng, lat]) => lat,lng) — convention GeoJSON vs Open Topo Data"
  - "AbortController timeout 10s dans useElevation — Open Topo Data peut être lent sous charge"
  - "Flag cancelled (booléen) en plus de AbortController — prévient les setState sur composant démonté"
  - "Cache via canal.elevation? (Zustand in-memory) — pas de re-fetch, respecte rate limit 1 req/s"
metrics:
  duration: "2m 12s"
  completed_date: "2026-04-30"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 02 Plan T02: Service + Hook Élévation Summary

**One-liner:** Service elevationApi.ts (4 fonctions : sampling Turf, fetch POST OpenTopoData, algorithme uphill, buildProfile) + hook useElevation (cache mémoire + AbortController 10s + flag cancelled) — 20 tests Wave 0 GREEN.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Créer elevationApi.ts + compléter tests | 894da8d | src/services/elevationApi.ts, src/tests/samplePoints.test.ts, src/tests/elevationApi.test.ts |
| 2 | Créer useElevation.ts | 7564e47 | src/hooks/useElevation.ts |

---

## What Was Built

### Task 1 — src/services/elevationApi.ts

**4 fonctions exportées :**

- `samplePoints(points, n=100)` — interpole n points sur le tracé via `turf.along()` + `turf.length()`. Retourne des `[lng, lat]` (convention GeoJSON stricte).
- `fetchElevations(coords, signal?)` — POST vers `https://api.opentopodata.org/v1/copernicus30m`. Inversion obligatoire `[lng,lat] → "lat,lng"`. Normalise `null → 0` (zones hors-couverture DEM). Lance `Error` si `response.ok === false` ou `data.status !== 'OK'`.
- `detectUphillSegments(points)` — algorithme comparaison de paires consécutives. Groupe les segments uphill consécutifs. Ferme les segments ouverts en fin de tableau.
- `buildProfile(sampledCoords, altitudes)` — construit `ElevationProfile` complet avec distances km croissantes, uphillSegments, totalUphillGain, isFullyGravity, fetchedAt.

**Tests complétés :**
- `uphill.test.ts` : 5 tests (anciens RED) → GREEN
- `samplePoints.test.ts` : 4 tests (anciens .todo) → GREEN  
- `elevationApi.test.ts` : 6 tests (anciens .todo) → GREEN

### Task 2 — src/hooks/useElevation.ts

- Abonné à `selectedCanalId` et `canals` via Zustand selectors
- Déclenche le fetch automatiquement au `selectCanal()` sans intervention utilisateur
- **Cache mémoire** : `if (canal.elevation) return` — évite les re-fetches et respecte le rate limit 1 req/s
- **Race condition** : flag `cancelled = true` dans le cleanup + `AbortController` — garantit que les résultats d'un canal désélectionné sont ignorés
- **Timeout 10s** : `setTimeout(() => controller.abort(), 10_000)` — évite les connexions suspendues si Open Topo Data lent
- Nettoyage complet dans le cleanup `useEffect` : `cancelled = true`, `controller.abort()`, `clearTimeout(timeoutId)`

---

## Test State

| Suite | État | Tests |
|-------|------|-------|
| `canalStore.test.ts` | VERT | 5 tests (Phase 1 — inchangé) |
| `uphill.test.ts` | VERT | 5 tests GREEN (anciens RED T01) |
| `samplePoints.test.ts` | VERT | 4 tests GREEN (anciens .todo T01) |
| `elevationApi.test.ts` | VERT | 6 tests GREEN (anciens .todo T01) |

**Résultat `npm test`:** 20 tests passed, 4 suites passed — 0 failed, 0 todo, 0 skipped.

---

## Deviations from Plan

None - plan exécuté exactement comme écrit.

---

## Known Stubs

Aucun stub dans ce plan. Toutes les fonctions sont implémentées et reliées :
- `elevationApi.ts` → fonctions réelles (pas de mock hardcodé)
- `useElevation.ts` → consomme les fonctions réelles + le store Zustand réel
- T03 consommera `useElevation` et `buildProfile` pour le rendu UI (ElevationChart + MapLibre layer)

---

## Threat Flags

Aucune nouvelle surface de sécurité non prévue dans le plan. Les 3 menaces du threat model sont mitigées :

| Threat | Mitigation implémentée |
|--------|----------------------|
| T-02-03 Tampering (réponse API) | `r.elevation ?? 0` normalise null ; `data.status !== 'OK'` lance Error |
| T-02-04 DoS rate limit | Cache `canal.elevation?` + AbortController 10s |
| T-02-05 Info Disclosure | Accepté (coords géographiques non-sensibles) |

---

## Self-Check: PASSED

Fichiers créés :
- src/services/elevationApi.ts — FOUND
- src/hooks/useElevation.ts — FOUND
- src/tests/samplePoints.test.ts — FOUND (modifié)
- src/tests/elevationApi.test.ts — FOUND (modifié)

Commits :
- 894da8d — FOUND
- 7564e47 — FOUND

Tests Wave 0 : 20/20 GREEN
TypeScript : npx tsc --noEmit sans erreur

---
phase: 03-routing-optimal
plan: T03
subsystem: routing-ui
tags: [typescript, react, maplibre, zustand, routing, ui]

# Dependency graph
requires:
  - phase: 03-routing-optimal/T01
    provides: "RoutingState FSM, 6 actions Zustand routing (startRouting, setRoutingStart/End, cancelRouting, finalizeRoutedCanal)"
  - phase: 03-routing-optimal/T02
    provides: "useRoutingWorker hook, routingWorker.ts, routingGrid.ts"
provides:
  - "src/components/DrawingToolbar.tsx : bouton 'Tracé optimal' violet (bg-purple-600) + Annuler routing"
  - "src/components/SidePanel.tsx : useRoutingWorker() monté + section routing progress 6 états"
  - "src/components/MapView.tsx : handlers clics routing, marqueurs vert/rouge temporaires, cleanup sur mode change"
affects: [canal-map, routing-ux, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mode routing distinct de drawing/selection — useEffect sur [mode] gère marqueurs + cursor + handlers séparément de useMapInteraction"
    - "maplibregl.Marker dans useRef (non-sérialisable) — jamais dans Zustand, cleanup systématique via marker.remove()"
    - "cursor crosshair → wait → '' selon progression du routing (selecting → computing → done)"
    - "getState() dans handlers DOM — anti-stale-closure cohérent avec pattern Phase 1/2"
    - "Section routing progress conditionnelle (routingState !== 'idle') — zéro layout shift en mode normal"

key-files:
  created: []
  modified:
    - src/components/DrawingToolbar.tsx
    - src/components/SidePanel.tsx
    - src/components/MapView.tsx

key-decisions:
  - "useRoutingWorker() monté dans SidePanel (même pattern que useElevation) — cycle de vie lié au panneau, pas à la carte"
  - "Mode routing géré dans MapView via useEffect([mode]) séparé de useMapInteraction — évite de modifier le hook existant, pas de conflit"
  - "Marqueurs routing = objets maplibregl.Marker dans useRef — pas dans la source GeoJSON 'markers' (réservée aux canaux finalisés)"
  - "cursor 'wait' après clic 2 — feedback immédiat pendant computing avant spinner SidePanel"

patterns-established:
  - "DrawingToolbar : 3 branches mode (selection/drawing/routing) — extensible pour futurs modes"
  - "SidePanel routing progress : section conditionnelle entre toolbar et liste — pattern réutilisable Phase 4+"

requirements-completed: [MAP-05]

# Metrics
duration: 15min
completed: 2026-04-30
---

# Phase 3 Plan T03: Intégration UI Routing — Summary

**Bouton 'Tracé optimal' violet, marqueurs temporaires vert/rouge carte, section SidePanel 6 états routing avec spinner et messages CONTEXT.md exacts**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-30T17:00:00Z
- **Completed:** 2026-04-30T17:15:43Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- DrawingToolbar : bouton `Tracé optimal` violet (bg-purple-600) visible en mode selection, bouton Annuler en mode routing
- SidePanel : `useRoutingWorker()` monté, section progress avec 6 états (selecting-start, selecting-end, computing, no-path, timeout, error)
- Messages exacts CONTEXT.md : "Aucun chemin gravitaire trouvé — les deux points sont séparés par un obstacle infranchissable" + "Calcul interrompu — réduisez la distance ou relancez"
- MapView : marqueurs `maplibregl.Marker` vert (#22C55E) départ + rouge (#EF4444) arrivée, cleanup sur tout changement de mode
- `getState()` dans handlers DOM — anti-stale-closure cohérent avec pattern Phase 1/2
- `useMapInteraction` non modifié — aucun conflit possible (drawing/selection seulement, routing non géré)
- TypeScript 0 erreur, 43 tests verts (suite complète Phase 1+2+3)

## Task Commits

1. **Task 1: DrawingToolbar + SidePanel routing** - `2e1caac` (feat)
2. **Task 2: MapView handlers + marqueurs temporaires** - `b517c11` (feat)

## Files Created/Modified
- `src/components/DrawingToolbar.tsx` — Import Route lucide, bouton violet startRouting, bouton Annuler cancelRouting, 3 branches mode
- `src/components/SidePanel.tsx` — Import AlertCircle + useRoutingWorker + useCanalStore, section progress 6 états
- `src/components/MapView.tsx` — Refs startMarkerRef/endMarkerRef, useEffect([mode]) routing avec handlers clics + cleanup

## Decisions Made
- `useRoutingWorker()` monté dans SidePanel plutôt que MapView : cohérent avec le pattern `useElevation()` existant
- Marqueurs routing dans `useRef<maplibregl.Marker>` : objets non-sérialisables, cleanup garanti dans le return du useEffect
- `useMapInteraction` non modifié : gère drawing/selection de façon conditionnelle — pas de handler click inconditionnel, aucun conflit

## Deviations from Plan

None - plan exécuté exactement tel qu'écrit. Les 3 fichiers correspondent exactement aux spécifications.

## Known Stubs

None - aucun stub. Tous les états routing sont wirés au store Zustand réel (T01) et au worker (T02).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| mitigated: T-03-T03-01 | MapView.tsx | Coordonnées clics → validateCoords() dans fetchGridElevations (T02) — couverture en profondeur |
| mitigated: T-03-T03-03 | MapView.tsx | marker.remove() dans return useEffect + hors mode routing — fuite mémoire impossible |

## Issues Encountered

None — useMapInteraction utilise des conditions `if (mode === 'drawing')` / `if (mode === 'selection')` explicites, pas de handler click inconditionnel. Aucune interférence avec le mode routing.

## User Setup Required

None - app 100% client-side.

## Next Phase Readiness
- Phase 4 (Moteur de Calcul) peut consommer les canaux `isRouted:true` créés par `finalizeRoutedCanal`
- Le profil d'élévation Phase 2 se charge automatiquement après routing réussi (`finalizeRoutedCanal` → `selectCanal` → `useElevation`)
- Phase 3 complète : T01 (types+store) + T02 (moteur+worker+hook) + T03 (UI intégration) tous mergés

## Self-Check: PASSED

- [x] src/components/DrawingToolbar.tsx modifié : FOUND
- [x] src/components/SidePanel.tsx modifié : FOUND
- [x] src/components/MapView.tsx modifié : FOUND
- [x] Commit 2e1caac (Task 1) : FOUND
- [x] Commit b517c11 (Task 2) : FOUND
- [x] TypeScript 0 erreur : VERIFIED
- [x] 43 tests verts : VERIFIED
- [x] bg-purple-600 dans DrawingToolbar : VERIFIED
- [x] useRoutingWorker dans SidePanel : VERIFIED (import + appel)
- [x] 6 états routingState couverts dans SidePanel : VERIFIED
- [x] startMarkerRef + endMarkerRef dans MapView : VERIFIED (14 occurrences)
- [x] getState().setRoutingStart + getState().setRoutingEnd : VERIFIED (2 lignes)
- [x] cleanup marker.remove() : VERIFIED (3 occurrences)

---
*Phase: 03-routing-optimal*
*Completed: 2026-04-30*

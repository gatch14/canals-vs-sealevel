---
phase: 01-map-shell-trac
plan: T02
subsystem: ui
tags: [maplibre-gl, react, hooks, geojson, zustand, webgl]

# Dependency graph
requires:
  - T01 (src/types/canal.ts, src/store/canalStore.ts)
provides:
  - Composant MapView.tsx avec carte monde MapLibre GL JS opérationnelle
  - 4 sources GeoJSON + layers (canals-line, draft-line, preview-line, markers-circle)
  - Hook useMapInteraction.ts avec gestion events drawing/selection complète
  - Synchronisation store Zustand → sources MapLibre via setData()
affects: [T03, phase-2]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guard anti-double-mount React StrictMode : if (!mapContainerRef.current || mapRef.current) return"
    - "Cleanup WebGL obligatoire : map.remove() + mapRef.current = null dans useEffect([], [])"
    - "Sync sources via setData() uniquement — initSources() une fois au 'load'"
    - "doubleClickZoom.disable() à l'entrée du mode drawing (Pitfall 1)"
    - "useCanalStore.getState() dans handler DOM natif (évite stale closure — Pitfall 3)"
    - "Handlers stockés en variables locales du useEffect pour map.off() avec même référence"

key-files:
  created:
    - src/components/MapView.tsx
    - src/hooks/useMapInteraction.ts
  modified: []

key-decisions:
  - "syncLayers() appelle setData() sur 4 sources — jamais addLayer/removeLayer en boucle"
  - "useMapInteraction reçoit map: Map | null — null pendant le premier render (init asynchrone)"
  - "Mode selection : cleanup map.off() avec référence locale (pas de handler anonyme en ligne)"
  - "GeoJSONSource importé depuis 'maplibre-gl' directement (types built-in MapLibre GL JS v5)"

# Metrics
duration: 8min
completed: 2026-04-30
---

# Phase 1 Plan T02: MapView + useMapInteraction Summary

**Intégration MapLibre GL JS dans React : composant MapView (carte monde + 4 layers GeoJSON synchronisés) et hook useMapInteraction (events drawing/selection avec tous les pièges critiques mitigés)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-30T17:00:00Z
- **Completed:** 2026-04-30T17:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- MapView.tsx : carte monde MapLibre GL JS avec style OpenFreeMap liberty, guard anti-double-mount StrictMode, cleanup WebGL obligatoire
- 4 sources GeoJSON init au 'load' : canals-line (bleu), draft-line (cyan dasharray 4/4), preview-line (cyan opacity 0.6 dasharray 2/4), markers-circle (vert debut / rouge fin via ['get','color'])
- syncLayers() via setData() uniquement : mise à jour temps réel depuis le store Zustand sans jamais appeler addLayer/removeLayer en boucle
- useMapInteraction.ts : mode drawing avec doubleClickZoom.disable(), handler Escape via getState(), cleanup complet map.off()
- Mode selection : hover canals-line (line-width 5 + cursor pointer) + click selectCanal

## Task Commits

Chaque tâche committée atomiquement :

1. **Task 1: MapView.tsx** - `6aedd07` (feat)
2. **Task 2: useMapInteraction.ts** - `b28dbf5` (feat)

## Files Created/Modified

- `src/components/MapView.tsx` — Conteneur MapLibre GL, 4 sources GeoJSON, layers, sync store
- `src/hooks/useMapInteraction.ts` — Binding events MapLibre selon mode (drawing/selection)

## Decisions Made

- syncLayers() utilise setData() sur les 4 sources existantes — initSources() est appelée une seule fois dans map.on('load') ; jamais d'appel addLayer/removeLayer dans le cycle de rendu
- useMapInteraction reçoit map comme paramètre nullable : null pendant le premier render React (l'init MapLibre est asynchrone), le useEffect retourne immédiatement si map === null
- Handlers mode selection stockés en variables locales du useEffect pour permettre map.off() avec la même référence de fonction
- GeoJSONSource importé directement depuis 'maplibre-gl' (types built-in en v5, pas de @types/maplibre-gl)

## Deviations from Plan

Aucune — plan exécuté exactement tel qu'écrit.

## Threat Surface Scan

Mitigation T-02-03 (DoS WebGL) appliquée : map.remove() dans le cleanup useEffect confirme la libération du contexte WebGL (ligne cleanup dans MapView.tsx).

Aucune nouvelle surface de sécurité introduite par rapport au threat model du plan.

## Known Stubs

Aucun stub. Toutes les sources GeoJSON sont connectées au store Zustand via syncLayers(). Le composant MapView est prêt pour T03 (UI components qui lisent le même store).

---
*Phase: 01-map-shell-trac*
*Completed: 2026-04-30*

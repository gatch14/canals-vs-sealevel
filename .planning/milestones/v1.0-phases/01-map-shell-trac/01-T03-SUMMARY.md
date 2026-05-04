---
phase: 01-map-shell-trac
plan: T03
subsystem: ui
tags: [react, tailwind, zustand, lucide-react, typescript]

requires:
  - phase: 01-T01
    provides: types Canal/Coord/UIMode + store Zustand canalStore (startDrawing, cancelDrawing, deleteCanal, selectCanal, canals, mode, draftPoints, selectedCanalId)
  - phase: 01-T02
    provides: MapView (carte monde + 4 layers GeoJSON) + useMapInteraction (events drawing/selection)

provides:
  - SidePanel 320px fixed droite (rgba 26,26,46,0.95) — 4 sections composées
  - ModeIndicator badge "Sélection" / "Tracé en cours" avec changement couleur bg-gray-800/bg-blue-700
  - DrawingToolbar "Dessiner canal" / "Annuler" selon mode store
  - CanalList scrollable + empty state "Aucun canal tracé" + info-bulle Qattara 2,76 mm
  - CanalListItem ligne cliquable + sélection visuelle + bouton Trash2 + dialog conditionnel
  - DeleteConfirmDialog modal overlay avec stopPropagation + confirmation suppression
  - App.tsx layout racine : MapView plein écran + SidePanel fixed droite
  - Phase 1 complète — tous les success criteria ROADMAP satisfaits

affects: [02-elevation-profil, 04-moteur-calcul, 06-dashboard-global]

tech-stack:
  added: [lucide-react (Pencil, X, Trash2 icons)]
  patterns:
    - Sélecteurs Zustand granulaires dans chaque composant (jamais useCanalStore() entier)
    - focusRing const réutilisable (focus-visible:ring-2 ring-blue-400)
    - Dialog modal avec stopPropagation sur card + fermeture sur clic overlay
    - confirmOpen state local dans CanalListItem (pas dans le store global)

key-files:
  created:
    - src/components/ModeIndicator.tsx
    - src/components/DrawingToolbar.tsx
    - src/components/DeleteConfirmDialog.tsx
    - src/components/CanalListItem.tsx
    - src/components/CanalList.tsx
    - src/components/SidePanel.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "confirmOpen state local dans CanalListItem — état UI éphémère ne mérite pas le store global"
  - "stopPropagation sur card DeleteConfirmDialog — clic overlay ferme, clic card ne ferme pas (UX standard)"
  - "Info-bulle Qattara ancrée dès Phase 1 — ordre de grandeur visible immédiatement (2,76 mm)"

patterns-established:
  - "Composant UI feuille → composite — ordre de création évite les dépendances circulaires"
  - "Sélecteur granulaire Zustand : const mode = useCanalStore((s) => s.mode) — jamais const store = useCanalStore()"
  - "focusRing const dans chaque composant bouton — accessibilité clavier systématique"

requirements-completed: [MAP-01, MAP-02]

duration: 15min
completed: 2026-04-30
---

# Phase 1 Plan T03: Composants UI Panneau Latéral — Summary

**Panneau latéral 320px avec 6 composants React (Tailwind pur, Zustand granulaire) — App.tsx câblé — Phase 1 Map Shell + Tracé complète**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-30T16:35:00Z
- **Completed:** 2026-04-30T16:50:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- 6 composants UI créés dans l'ordre de dépendance (feuilles → composites) : ModeIndicator, DrawingToolbar, DeleteConfirmDialog, CanalListItem, CanalList, SidePanel
- App.tsx câblé : MapView plein écran (absolute inset-0) + SidePanel fixed droite (w-80) dans un container `relative h-screen w-screen overflow-hidden`
- Tous les textes du copywriting contract respectés exactement : "Canal Explorer", "Dessiner canal", "Tracé en cours", "Sélection", "Qattara Depression = 2,76 mm de baisse si remplie" (virgule française)
- npx tsc --noEmit : 0 erreurs TypeScript
- npx vitest run : 5 tests verts (MAP-02)

## Task Commits

1. **Task 1: Composants UI panneau** - `9da75f8` (feat)
2. **Task 2: App.tsx wiring final** - `7d1fb40` (feat)

## Files Created/Modified

- `src/components/ModeIndicator.tsx` — badge mode selection/drawing (h-8, bg-gray-800/bg-blue-700), titre "Canal Explorer"
- `src/components/DrawingToolbar.tsx` — bouton "Dessiner canal" (Pencil) / "Annuler" (X) + avertissement < 2 points
- `src/components/DeleteConfirmDialog.tsx` — modal overlay z-50, stopPropagation card, boutons Annuler/Supprimer
- `src/components/CanalListItem.tsx` — item cliquable, sélection bg-blue-500/20, Trash2, confirmOpen state local
- `src/components/CanalList.tsx` — liste scrollable, empty state, info-bulle Qattara 2,76 mm
- `src/components/SidePanel.tsx` — aside fixed w-80, rgba(26,26,46,0.95), 4 sections séparées par border-white/[0.08]
- `src/App.tsx` — layout racine : relative h-screen w-screen overflow-hidden bg-gray-900

## Decisions Made

- `confirmOpen` géré en state local dans `CanalListItem` — état UI éphémère (ouverture d'une modale) n'appartient pas au store global Zustand
- `stopPropagation` sur la card du dialog — UX standard : clic sur l'overlay ferme, clic à l'intérieur du dialog ne ferme pas
- Info-bulle Qattara Depression ancrée dès Phase 1 — l'ordre de grandeur (2,76 mm seulement) est visible immédiatement, ancrant la réalité scientifique dans l'interface

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit. Les patterns PATTERNS.md ont été suivis à la lettre.

## Issues Encountered

None.

## Threat Model Compliance

- **T-03-01** (Tampering canal.name) : accept — noms auto-générés par store ("Canal N"), React échappe automatiquement en JSX
- **T-03-02** (DeleteConfirmDialog) : mitigate appliqué — confirmation modale avec 2 actions explicites + stopPropagation sur card
- **T-03-03** (SidePanel liste) : accept — app locale sans auth, sans données sensibles

## Known Stubs

Aucun stub fonctionnel bloquant. La section footer de SidePanel (Section 4) contient un commentaire `{/* Global stats placeholder Phase 6 */}` — intentionnel, réservé pour la Phase 6 Dashboard Global, n'empêche pas les objectifs Phase 1.

## Next Phase Readiness

Phase 1 complète — tous les success criteria ROADMAP satisfaits :
1. `git clone + npm install + npm run dev` → carte monde + panneau latéral visibles
2. Mode drawing fonctionnel — waypoints, double-clic finalise, ligne cyan preview
3. Liste canaux avec suppression via dialog de confirmation

Phase 2 (Élévation + Profil) peut démarrer : elle utilise le store `canals` (canal.points) pour interroger Open Topo Data et afficher le profil altimétrique.

---
*Phase: 01-map-shell-trac*
*Completed: 2026-04-30*

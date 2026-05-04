---
phase: 09-eau-salee-dessalement
plan: T03
subsystem: ui
tags: [react, zustand, hooks, desalination, ecology, usememo, typescript]

# Dependency graph
requires:
  - phase: 09-eau-salee-dessalement
    provides: "desalinationEngine.ts (8 fonctions pures GREEN) + types DesalinationResult/DesalinationParams (T01+T02)"
  - phase: 05-analyse-ecologique
    provides: "EcologyPanel.tsx accordéon existant + useEcology hook pattern"
provides:
  - "desalinationEnabled: boolean + toggleDesalination() dans canalStore"
  - "useDesalination hook (useMemo, pattern useEcology) dans src/hooks/useDesalination.ts"
  - "Toggle 'Noeuds dessalement solaire' + section résultats dans EcologyPanel"
  - "Alerte rouge ECO-05 si ecosystemImpact === 'critical' dans EcologyPanel"
  - "useDesalination() appelé dans SidePanel pour maintenir le moteur actif"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useDesalination : useMemo identique à useEcology — lengthKm calculé via Turf length(lineString(points))"
    - "Toggle UI avec switch animé aria-pressed — pattern Tailwind CSS transition-colors + translate-x"
    - "Alerte ECO-05 : même structure visuelle que alerte bassin endorheïque (border-t rouge)"
    - "Coût en M€ : division / 1_000_000 inline dans le JSX (pas dans le moteur)"

key-files:
  created:
    - src/hooks/useDesalination.ts
  modified:
    - src/store/canalStore.ts
    - src/components/EcologyPanel.tsx
    - src/components/SidePanel.tsx

key-decisions:
  - "useDesalination appelé dans SidePanel (maintien moteur) ET dans EcologyPanel (consommation résultat) — cohérent avec pattern useElevation/useRoutingWorker"
  - "Alerte ECO-05 conditionnée sur ecosystemImpact === 'critical' — V1 retourne uniquement low/neutral (critical déféré), donc alerte jamais visible en V1 mais l'infra est câblée"
  - "Affichage coût M€ = desalinationCost / 1_000_000 dans le JSX — valeur brute en € préservée dans DesalinationResult"
  - "Toggle visible même si 0 noeuds — message 'Canal trop court' affiché à la place des métriques"

patterns-established:
  - "Hooks side-effect dans SidePanel, hooks résultat utilisés directement dans le composant (EcologyPanel appelle useDesalination() pour consommer le résultat)"

requirements-completed: [ECO-05, DESAL-01, DESAL-02, DESAL-03, DESAL-04, DESAL-05]

# Metrics
duration: 12min
completed: 2026-05-02
---

# Phase 9 Plan T03: Eau Salée & Dessalement — Câblage UI Store + Hook + EcologyPanel

**Toggle dessalement câblé dans EcologyPanel avec alerte ECO-05, hook useDesalination (useMemo), store Zustand étendu, et SidePanel wiring — 138/138 tests GREEN**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-02T12:13:00Z
- **Completed:** 2026-05-02T12:25:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- canalStore.ts étendu : desalinationEnabled + toggleDesalination + reset dans clearAll()
- useDesalination.ts créé : useMemo pattern identique à useEcology, calcule lengthKm via Turf, solarFactor via calcSolarFactor
- EcologyPanel.tsx étendu : alerte rouge ECO-05 + toggle animé 'Noeuds dessalement solaire' + section résultats [min-max] (eau/sel/zones/coût)
- SidePanel.tsx mis à jour : useDesalination() appelé après usePersistence()
- 138/138 tests GREEN, zéro erreur TypeScript

## Task Commits

1. **Task 1: canalStore desalinationEnabled + useDesalination hook** - `acb7b9c` (feat)
2. **Task 2: EcologyPanel alerte ECO-05 + section dessalement + SidePanel wiring** - `0d8fec9` (feat)

## Files Created/Modified

- `src/store/canalStore.ts` — desalinationEnabled: boolean, toggleDesalination(), clearAll() reset
- `src/hooks/useDesalination.ts` — hook useMemo orchestrant computeDesalinationAnalysis + calcSolarFactor
- `src/components/EcologyPanel.tsx` — imports useDesalination + toggle dessalement + alerte ECO-05 + dl résultats
- `src/components/SidePanel.tsx` — import + appel useDesalination() pour maintien moteur

## Decisions Made

- `useDesalination` appelé dans SidePanel ET consommé dans EcologyPanel — cohérent avec l'architecture des hooks existants (useElevation dans SidePanel, données utilisées dans ElevationPanel)
- Alerte ECO-05 conditionnée sur `ecosystemImpact === 'critical'` — infrastructure câblée, V1 ne retourne jamais 'critical' (déféré CONTEXT.md), alerte visible dès que la classification sera enrichie
- Coût affiché en M€ = division par 1_000_000 inline dans le JSX — valeur brute en € préservée dans DesalinationResult sans modification du moteur

## Deviations from Plan

None — plan exécuté exactement comme spécifié.

## Issues Encountered

None.

## User Setup Required

None — aucune configuration externe requise.

## Known Stubs

Aucun — tous les champs DesalinationResult sont correctement câblés depuis le moteur. L'alerte ECO-05 ne s'affiche pas en V1 car `classifyEcosystem` retourne uniquement `'low'` ou `'neutral'` (décision T02/CONTEXT.md), mais le rendu conditionnel est correct et fonctionnel dès que la classification sera enrichie.

## Threat Flags

Aucune nouvelle surface de sécurité introduite — toggle UI (booléen store), calculs client-side pur, aucune donnée réseau ni endpoint.

## Self-Check: PASSED

- `src/hooks/useDesalination.ts` : FOUND
- `src/store/canalStore.ts` : FOUND (desalinationEnabled)
- `src/components/EcologyPanel.tsx` : FOUND (DesalinationSection)
- `src/components/SidePanel.tsx` : FOUND (useDesalination)
- Commit `acb7b9c` : FOUND
- Commit `0d8fec9` : FOUND
- 138/138 tests GREEN : CONFIRMED
- TypeScript zéro erreur : CONFIRMED

---
*Phase: 09-eau-salee-dessalement*
*Completed: 2026-05-02*

---
phase: "04"
plan: "03"
subsystem: "calculation-ui"
tags: [phase-04, ui, calculation-panel, store-extension, maplibre-marker, wave-2]

dependency_graph:
  requires: [04-01, 04-02]
  provides:
    - src/hooks/useCalculation.ts (Hook orchestrateur memoïsé — CalculationResult + PartialImpactResult)
    - src/components/CalculationPanel.tsx (Composant accordéon complet — inputs + résultats + IPCC bar)
  affects:
    - src/store/canalStore.ts (calcParams + setCalcParams ajoutés)
    - src/components/SidePanel.tsx (CalculationPanel intégré Section 5)
    - src/components/MapView.tsx (stop marker amber CALC-05)

tech_stack:
  added: []
  patterns:
    - "useMemo hook pattern — dépendances finement ciblées [selectedCanal?.elevation, calcParams.width, calcParams.depth]"
    - "Local string input state — string temporaire pour saisie numérique avant parseFloat + validation onBlur"
    - "Marker lifecycle pattern — stopMarkerRef.current?.remove() dans cleanup useEffect (Pitfall 3)"
    - "UX-01 interval formatting — [X – Y] unité avec em dash U+2013 partout"

key_files:
  created:
    - src/hooks/useCalculation.ts
    - src/components/CalculationPanel.tsx
  modified:
    - src/store/canalStore.ts
    - src/store/canalStore.test.ts
    - src/components/SidePanel.tsx
    - src/components/MapView.tsx

decisions:
  - "Local string state for numeric inputs — allows partial input '5.' before full parse, prevents store pollution with NaN"
  - "useMemo dependencies include selectedCanal?.elevation separately — avoids stale closure on profile load"
  - "ipccBarWidth uses percentMid (average of min+max) for IPCC bar — matches UI-SPEC §IPCC indicator"
  - "stopMarkerRef partial?.stopCoord[0/1] as useEffect deps — avoids marker recreation when object reference changes but coords identical"

metrics:
  duration_seconds: 393
  completed_date: "2026-05-01"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 4
---

# Phase 04 Plan 03: UI Integration Wave 2 — CalculationPanel + Store + MapView Summary

**One-liner:** Store étendu (calcParams/setCalcParams), hook useCalculation memoïsé, CalculationPanel accordéon complet (inputs 50m×5m, intervalles UX-01, barre IPCC, impact partiel conditionnel), marker amber MapLibre sur stopCoord.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Store calcParams + tests + useCalculation | 40dd9e0 | src/store/canalStore.ts, src/store/canalStore.test.ts, src/hooks/useCalculation.ts |
| 2 | CalculationPanel accordéon complet | bbf46ed | src/components/CalculationPanel.tsx (283 lignes) |
| 3 | SidePanel + MapView wiring | 226469e | src/components/SidePanel.tsx, src/components/MapView.tsx |

## Test Results

| Metric | Value |
|--------|-------|
| Tests avant T03 | 63/63 (T01+T02 baseline) |
| Nouveaux tests Phase 4 calcParams | 3 |
| Tests totaux | 66/66 GREEN |
| Failures | 0 |
| npx tsc --noEmit | PASS |

Nouveaux tests (canalStore.test.ts — Phase 4 calcParams) :
- `calcParams est initialisé à { width: 50, depth: 5 } (D-01)` — GREEN
- `setCalcParams({ width: 80 }) merge sans toucher depth` — GREEN
- `setCalcParams({ depth: 10 }) merge sans toucher width` — GREEN

## npm run build Status

`npm run build` échoue avec des erreurs TypeScript **pré-existantes** (confirmé par stash test — les mêmes erreurs existaient avant T03).

Fichiers affectés par erreurs pré-existantes (non modifiés dans T03) :
- `src/components/ElevationChart.tsx` — Recharts Formatter type incompatibility
- `src/services/routingGrid.ts` — ngraph.path generic type incompatibility
- `src/tests/routingGrid.test.ts` — ngraph.path Graph generic type
- `src/workers/routingWorker.ts` — ngraph.path type
- `vite.config.ts` — `test` key type error (vitest config)

Ces erreurs sont loggées dans `.planning/phases/04-moteur-de-calcul/deferred-items.md`.

## Implementation Details

### src/store/canalStore.ts

Ajouts :
- `import type { CalcParams } from '../types/calculation'`
- `import { DEFAULT_CALC_PARAMS } from '../types/calculation'`
- Interface : `calcParams: CalcParams` + `setCalcParams: (params: Partial<CalcParams>) => void`
- State : `calcParams: DEFAULT_CALC_PARAMS` (width: 50, depth: 5)
- Action : `setCalcParams` avec merge partiel `{ ...state.calcParams, ...params }`

### src/hooks/useCalculation.ts (nouveau — 57 lignes)

- Lit `selectedCanalId`, `canals`, `calcParams` depuis store
- `result = useMemo()` → `computeCalculation(canal, profile, w, d)` (CALC-01..04)
- `partial = useMemo()` → `computePartialImpact(canal, profile, w, d)` (CALC-05)
- Dépendances ciblées : `[selectedCanal, selectedCanal?.elevation, calcParams.width, calcParams.depth]`

### src/components/CalculationPanel.tsx (nouveau — 283 lignes)

Accordéon identique au pattern ElevationPanel :
- Header h-8 px-4 ChevronDown rotate-180 quand open
- `isOpen` local useState(true) + auto-open useEffect
- 3 états : vide (no canal) / amber warning (no profile) / inputs+résultats

Helpers de formatage UX-01 :
- `formatNumber(n, decimals)` — exponentielle si < 0.001
- `formatInterval(iv, unit, decimals)` — `[X – Y] unité` em dash U+2013
- `formatCost(iv)` — M€ / Md€ (Pitfall 6)
- `formatTerrainBreakdown(b)` — null si 100% plaine

Résultats (ordre exact UI-SPEC) : Volume → Impact mer (ΔSL) → vs IPCC 2100 → Coût estimé

IPCC bar : progressbar role, clampé à Math.min(percentMid, 100)%, transition-all duration-300

Section IMPACT PARTIEL : conditionnelle `{partial && ...}` — texte amber, ΔSL, percentOfFull

Accessibilité : aria-expanded, role=progressbar + aria-valuenow/min/max, aria-label inputs, role=alert erreur

### src/components/SidePanel.tsx

- Import `CalculationPanel` ajouté
- `<CalculationPanel />` inséré entre ElevationPanel (Section 4) et Footer (Section 6)
- Commentaire Footer mis à jour Section 5 → Section 6

### src/components/MapView.tsx

- Import `useCalculation` ajouté
- `stopMarkerRef = useRef<maplibregl.Marker | null>(null)` déclaré après endMarkerRef
- `const { partial } = useCalculation()` dans le composant
- `useEffect` stop marker :
  - Cleanup systématique `stopMarkerRef.current?.remove()` avant toute création
  - `new maplibregl.Marker({ color: '#F59E0B', scale: 0.8 }).setLngLat([lng, lat]).addTo(map)`
  - Cleanup return pour unmount (Pitfall 3 RESEARCH.md)
  - Dépendances : `[partial?.stopCoord[0], partial?.stopCoord[1]]`

## Vérification manuelle attendue (recettage humain final)

À vérifier lors du recettage :
1. Ouvrir l'app → le panel "CALCUL D'IMPACT" apparaît dans le SidePanel avec message gris italique
2. Tracer un canal → le sélectionner → le panel affiche le message amber "Chargez le profil..."
3. Attendre le chargement du profil → les inputs 50m/5m apparaissent + résultats en intervalles `[X – Y]`
4. Modifier la largeur → la barre IPCC se met à jour
5. Tracer un canal avec montée → la section "IMPACT PARTIEL" apparaît + marker amber sur la carte au km d'arrêt
6. Désélectionner → marker amber disparaît

## Deviations from Plan

None — plan executed exactly as written.

Le `npm run build` échoue pour des raisons pré-existantes (non liées à T03) — documenté dans deferred-items.md.

## Known Stubs

None. Tous les résultats sont calculés réellement via calculationEngine.ts (T02 Wave 1 implémentation complète).

## Threat Flags

None — aucune nouvelle surface réseau, endpoint, ou path d'authentification introduit.

## Self-Check: PASSED

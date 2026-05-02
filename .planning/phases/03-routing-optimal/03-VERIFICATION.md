---
phase: 03-routing-optimal
verified: 2026-04-30T17:23:18Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Tracé optimal de A vers B sur un relief réel"
    expected: "Cliquer Tracé optimal, poser deux points, attendre le calcul — le canal routé apparaît en bleu sur la carte et son profil d'élévation se charge automatiquement dans le SidePanel (peu ou pas de segments rouges)"
    why_human: "Comportement de bout en bout nécessitant un vrai appel Open-Meteo depuis le navigateur — impossible à vérifier sans lancer l'app"
  - test: "Feedback visuel pendant le calcul"
    expected: "Marqueur vert après clic 1, marqueur rouge après clic 2, spinner + message 'Calcul du tracé optimal en cours...' dans le SidePanel, curseur 'wait'"
    why_human: "Comportement UI / DOM / WebGL — non testable unitairement"
  - test: "Annulation du calcul pendant computing"
    expected: "Cliquer 'Annuler le calcul' pendant le spinner — le worker est terminé, le mode revient à 'selection', les marqueurs temporaires disparaissent"
    why_human: "Cycle de vie Worker + effets DOM — requiert exécution navigateur"
---

# Phase 3: Routing Optimal — Verification Report

**Phase Goal:** L'utilisateur peut demander un tracé automatique qui évite les obstacles altitudinaux entre deux points (Dijkstra/A* sur grille DEM Copernicus GLO-30 dans un Web Worker)
**Verified:** 2026-04-30T17:23:18Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | RoutingState couvre les 7 états (idle/selecting-start/selecting-end/computing/timeout/error/no-path) | VERIFIED | `src/types/routing.ts` lignes 5-12 — union de 7 littéraux exact |
| 2  | Canal.isRouted?: boolean ajouté (rétrocompat Phase 1/2) | VERIFIED | `src/types/canal.ts` ligne 17 — champ optionnel présent |
| 3  | Store expose 6 actions routing (startRouting, setRoutingStart, setRoutingEnd, setRoutingState, finalizeRoutedCanal, cancelRouting) | VERIFIED | `src/store/canalStore.ts` lignes 21-26 + 51-79 — 6 actions implémentées |
| 4  | finalizeRoutedCanal crée 'Canal optimal N', isRouted:true, sélectionne le canal | VERIFIED | `src/store/canalStore.ts` lignes 59-77 — garde path.length<2, name template, selectedCanalId:newCanal.id |
| 5  | buildGrid/getResolution/fetchGridElevations/buildGraph/findPath — algorithme Dijkstra sur grille DEM | VERIFIED | `src/services/routingGrid.ts` 185 lignes — 8 fonctions exportées, oriented:true, .reverse(), BATCH_SIZE=100 |
| 6  | Web Worker reçoit RoutingRequest, exécute pipeline, postMessage RoutingResult (3 types) | VERIFIED | `src/workers/routingWorker.ts` — directive triple-slash, self.onmessage, 3 `satisfies RoutingResult` |
| 7  | useRoutingWorker lance le worker, gère timeout 30s, met à jour le store | VERIFIED | `src/hooks/useRoutingWorker.ts` — URL littérale statique, setTimeout 30_000, getState() anti-stale-closure |
| 8  | DrawingToolbar affiche bouton 'Tracé optimal' (bg-purple-600) en mode selection | VERIFIED | `src/components/DrawingToolbar.tsx` ligne 33 — bg-purple-600, onClick startRouting |
| 9  | SidePanel monte useRoutingWorker() + section routing progress 6 états + messages exacts | VERIFIED | `src/components/SidePanel.tsx` lignes 15, 33-89 — 6 états couverts, messages CONTEXT.md exacts |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/routing.ts` | RoutingState (7 états), RoutingRequest, RoutingResult, re-export Coord | VERIFIED | Fichier présent, 24 lignes, 4 exports dont re-export Coord depuis canal.ts |
| `src/types/canal.ts` | UIMode + 'routing', Canal + isRouted?: boolean | VERIFIED | UIMode ligne 7 inclut 'routing', isRouted? ligne 17 |
| `src/store/canalStore.ts` | 3 champs routing + 6 actions routing | VERIFIED | routingState/routingStart/routingEnd lignes 16-18 + 6 actions lignes 21-26 + 51-79 |
| `src/store/canalStore.test.ts` | 10 tests verts (5 MAP-02 + 5 MAP-05) | VERIFIED | 10 tests passent (confirmé par `npm test`) |
| `src/services/routingGrid.ts` | 8 fonctions exportées, oriented:true, .reverse(), BATCH_SIZE=100 | VERIFIED | 185 lignes, oriented:true ligne 172, .reverse() ligne 183, BATCH_SIZE=100 ligne 89 |
| `src/workers/routingWorker.ts` | directive triple-slash, self.onmessage, 3 types postMessage | VERIFIED | Ligne 1 directive webworker, ligne 8 self.onmessage, 3 satisfies RoutingResult |
| `src/hooks/useRoutingWorker.ts` | Worker dans useRef, URL littérale statique, timeout 30s, getState() | VERIFIED | workerRef useRef ligne 9, new URL littérale lignes 30-33, 30_000 ligne 40, getState() lignes 39/51/53/55/63 |
| `src/components/DrawingToolbar.tsx` | Bouton Tracé optimal + bouton Annuler routing | VERIFIED | bg-purple-600 ligne 33, cancelRouting ligne 66 |
| `src/components/SidePanel.tsx` | useRoutingWorker() monté, section progress 6 états | VERIFIED | import+appel lignes 8+15, 6 états lignes 36-88 |
| `src/components/MapView.tsx` | startMarkerRef/endMarkerRef, handlers routing, cleanup | VERIFIED | 14 occurrences marqueurs, getState().setRoutingStart/End lignes 262+269, cleanup lignes 280-292 |
| `src/tests/routingGrid.test.ts` | 18 tests complets (remplace stubs Wave 0) | VERIFIED | 18 tests tous verts (confirmé par `npm test`) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/types/routing.ts` | `src/types/canal.ts` | re-export Coord | WIRED | Ligne 3 : `export type { Coord } from './canal'` |
| `src/store/canalStore.ts` | `src/types/routing.ts` | import RoutingState | WIRED | Ligne 5 : `import type { RoutingState } from '../types/routing'` |
| `src/store/canalStore.ts` | finalizeRoutedCanal | selectCanal dans l'action | WIRED | Ligne 75 : `selectedCanalId: newCanal.id` dans set() — même effet que selectCanal |
| `src/hooks/useRoutingWorker.ts` | `src/workers/routingWorker.ts` | new Worker URL littérale statique | WIRED | Lignes 30-33 : `new Worker(new URL('../workers/routingWorker.ts', import.meta.url), { type: 'module' })` |
| `src/workers/routingWorker.ts` | `src/services/routingGrid.ts` | imports buildGrid/fetchGridElevations/buildGraph/findPath | WIRED | Ligne 5 : import des 5 fonctions routingGrid |
| `src/hooks/useRoutingWorker.ts` | `src/store/canalStore.ts` | getState().finalizeRoutedCanal | WIRED | Ligne 51 : `useCanalStore.getState().finalizeRoutedCanal(result.path)` |
| `src/components/DrawingToolbar.tsx` | `src/store/canalStore.ts` | startRouting + cancelRouting | WIRED | Lignes 13-14 sélecteurs, lignes 31+66 onClick |
| `src/components/MapView.tsx` | `src/store/canalStore.ts` | getState().setRoutingStart/setRoutingEnd | WIRED | Lignes 262+269 dans handler clic |
| `src/components/SidePanel.tsx` | `src/hooks/useRoutingWorker.ts` | useRoutingWorker() | WIRED | Import ligne 8, appel ligne 15 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `useRoutingWorker.ts` | result.path (via worker) | `fetchGridElevations` → Open-Meteo API → `buildGraph` → `findPath` | Oui — pipeline réel DEM → graphe → A* | FLOWING |
| `SidePanel.tsx` | routingState | `useCanalStore` (Zustand réactif) | Oui — FSM réelle via actions store | FLOWING |
| `MapView.tsx` | startMarkerRef/endMarkerRef | Objets `maplibregl.Marker` créés dans handler clic | Oui — marqueurs MapLibre réels | FLOWING |
| `DrawingToolbar.tsx` | mode | `useCanalStore` (Zustand réactif) | Oui — mode réel depuis le store | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 43 tests passent (suite complète) | `npm test` | 43 passed, 0 failed, 0 todo | PASS |
| TypeScript 0 erreur | `npx tsc --noEmit` | Aucune sortie (0 erreur) | PASS |
| Commits Phase 3 présents (7 commits) | `git log --oneline` | 7bb52c4, f7ac6c3, 6b00529, f8654fd, cf58cb7, 2e1caac, b517c11 tous présents | PASS |
| oriented:true dans findPath | `grep "oriented: true" routingGrid.ts` | Ligne 172 confirmée | PASS |
| .reverse() systématique | `grep "\.reverse()" routingGrid.ts` | Ligne 183 confirmée | PASS |

Step 7b: Calculs de routing nécessitent Open-Meteo — tests comportementaux de bout en bout reportés en vérification humaine.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MAP-05 | T01, T02, T03 | L'utilisateur peut demander un tracé optimal automatique entre deux points (Dijkstra sur DEM, Web Worker) | SATISFIED | Service routingGrid.ts (A*+DEM), routingWorker.ts (Worker), useRoutingWorker.ts (lifecycle), DrawingToolbar+SidePanel+MapView (UI) — tous wirés |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/tests/routingGrid.test.ts` | 147-156 | Test "obstacle infranchissable" vérifie `Array.isArray(path)` uniquement — n'asserte pas que path est vide | Info | Faiblesse de couverture de test — l'implémentation dans `findPath` est correcte (retourne `[]` si `rawPath.length === 0`), le test ne le valide pas directement |
| `src/components/SidePanel.tsx` | 101 | `{/* Global stats placeholder Phase 6 */}` | Info | Commentaire placeholder pour Phase 6 future — intentionnel, pas de rendu utilisateur |

Aucun blocker ni warning — les deux observations sont informatives.

### Human Verification Required

#### 1. Tracé optimal de A vers B sur un relief réel

**Test:** Lancer `npm run dev`. Cliquer "Tracé optimal" (bouton violet). Cliquer un point A, puis un point B distants de 50-300 km sur un relief accidenté (ex. Alpes). Attendre le calcul.
**Expected:** Le canal routé apparaît en bleu sur la carte, le profil d'élévation se charge dans le SidePanel, les segments rouges sont absents ou minimaux comparé à un tracé direct.
**Why human:** Appel réel Open-Meteo + rendu MapLibre + comportement ngraph A* sur données réelles — non simulable en tests unitaires.

#### 2. Feedback visuel séquentiel

**Test:** Après clic "Tracé optimal" : (a) clic 1 sur la carte, (b) clic 2 sur la carte, (c) observer le SidePanel.
**Expected:** (a) Marqueur vert visible sur la carte, SidePanel affiche "Cliquez le point d'arrivée". (b) Marqueur rouge visible, curseur passe à "wait". (c) Spinner + "Calcul du tracé optimal en cours..." + bouton "Annuler le calcul".
**Why human:** Comportement UI DOM/WebGL/CSS animé — non testable sans navigateur.

#### 3. Annulation pendant computing

**Test:** Lancer un calcul long (points très éloignés), cliquer "Annuler le calcul" pendant le spinner.
**Expected:** Spinner disparaît, mode revient à 'selection', marqueurs temporaires retirés, worker terminé (vérifiable via DevTools > Workers).
**Why human:** Lifecycle Worker + DOM cleanup — requiert exécution en navigateur.

### Gaps Summary

Aucun gap. Les 9 must-haves sont tous vérifiés avec des preuves dans le codebase. Les 3 critères de succès de la ROADMAP Phase 3 sont couverts :
- SC1 (sélection deux points + calcul) : DrawingToolbar + MapView handlers + useRoutingWorker — WIRED
- SC2 (minimise les montées) : `oriented:true` + fonction de coût `dist*(1+penalty)` avec `penalty=max(0,deltaAlt)/(dist*1000)` — implémenté et testé
- SC3 (Web Worker non-bloquant) : `new Worker(new URL(...), { type: 'module' })` dans useRef — implémenté avec timeout 30s

La vérification humaine porte sur le comportement de bout en bout (API externe réelle + rendu cartographique) qui est irréductible aux tests unitaires.

---

_Verified: 2026-04-30T17:23:18Z_
_Verifier: Claude (gsd-verifier)_

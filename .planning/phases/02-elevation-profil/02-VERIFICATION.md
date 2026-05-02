---
phase: 02-elevation-profil
verified: 2026-04-30T18:30:00Z
status: human_needed
score: 7/7 must-haves verified (automated)
overrides_applied: 0
human_verification:
  - test: "Tracer un canal montagne → mer et sélectionner le canal tracé"
    expected: "Spinner pendant ~300–2000ms puis graphique altitude/distance avec courbe bleue visible dans le panneau latéral"
    why_human: "Rendu Recharts dans le navigateur — impossible à vérifier sans DOM réel"
  - test: "Tracer un canal avec une montée visible (vallée → col → descente) et attendre le chargement"
    expected: "Segments rouges épais (#EF4444, 5px) visibles sur la carte au-dessus du tracé bleu ; zones rouges translucides sur le graphique aux mêmes distances"
    why_human: "Layer MapLibre WebGL + zones ReferenceArea Recharts — vérification visuelle obligatoire"
  - test: "Vérifier le badge dans la liste de canaux : pendant le chargement, puis après"
    expected: "Badge gris '⏳ Chargement...' pendant le fetch, puis badge vert '✅ Gravitaire' ou ambre '⚠ Montées détectées' selon le profil"
    why_human: "Comportement dynamique d'état React — dépend du timing du fetch réel"
  - test: "Désélectionner un canal puis le re-sélectionner"
    expected: "Le profil apparaît immédiatement sans spinner (cache mémoire Zustand — pas de re-fetch)"
    why_human: "Comportement de cache en conditions réelles — nécessite un cycle complet fetch + désélection + re-sélection"
---

# Phase 2: Élévation + Profil — Rapport de Vérification

**Phase Goal:** L'utilisateur peut voir le profil altimétrique d'un canal tracé et identifier les segments gravitairement impossibles
**Verified:** 2026-04-30T18:30:00Z
**Status:** human_needed
**Re-verification:** Non — vérification initiale

---

## Goal Achievement

### Observable Truths (Critères ROADMAP)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | En sélectionnant un canal, l'utilisateur voit un graphique altitude (m) vs distance (km) | ✓ VERIFIED | ElevationPanel.tsx + ElevationChart.tsx câblés au store, sélecteur `canals.find(c.id === selectedCanalId)`, profil passé à `<ElevationChart points={profile.points} uphillSegments={profile.uphillSegments} />` |
| 2 | Les segments en montée sont surlignés en rouge sur la carte et identifiés sur le graphique | ✓ VERIFIED | MapView.tsx layer `canal-uphill` (#EF4444, 5px), `syncUphillLayer` appelé dans `useEffect([canals, selectedCanalId])` ; ElevationChart.tsx `ReferenceArea fill="#EF4444" fillOpacity={0.30}` déclaré avant `Area` |
| 3 | L'utilisateur comprend visuellement si son canal est réalisable par gravité ou non | ✓ VERIFIED | CanalListItem.tsx 3 badges pill (⏳/✅/⚠) + ElevationPanel.tsx message "✅ Ce canal est entièrement réalisable par gravité" / "⚠ N segment(s) en montée" |

**Score automatisé:** 3/3 critères ROADMAP vérifiés dans le code

### Must-haves Plans (T01/T02/T03)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Types ElevationPoint, UphillSegment, ElevationProfile exportés | ✓ VERIFIED | `src/types/elevation.ts` — 3 interfaces présentes et exportées |
| 2 | Canal étendu avec elevation?, elevationLoading?, elevationError? | ✓ VERIFIED | `src/types/canal.ts` lignes 14-16 — import + 3 champs optionnels |
| 3 | Store expose setElevation, setElevationLoading, setElevationError | ✓ VERIFIED | `src/store/canalStore.ts` lignes 22-24 (interface) + 68-84 (impl) |
| 4 | samplePoints retourne 100 coords [lng,lat], fetchElevations avec inversion, buildProfile correct | ✓ VERIFIED | `src/services/elevationApi.ts` — 4 fonctions implémentées, 20 tests GREEN |
| 5 | useElevation déclenche le fetch + cache mémoire + race condition flag | ✓ VERIFIED | `src/hooks/useElevation.ts` — `canal.elevation` check ligne 20, `cancelled` flag ligne 25, `AbortController` ligne 23 |
| 6 | ElevationChart avec zones uphill rouges + ElevationPanel 4 états | ✓ VERIFIED | Deux fichiers créés, câblage store complet |
| 7 | SidePanel monte useElevation() + ElevationPanel | ✓ VERIFIED | `src/components/SidePanel.tsx` ligne 10 `useElevation()` + ligne 31 `<ElevationPanel />` |

**Score global:** 7/7 must-haves vérifiés (automatisé)

---

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/types/elevation.ts` | ✓ VERIFIED | 22 lignes, 3 interfaces complètes |
| `src/types/canal.ts` | ✓ VERIFIED | Import ElevationProfile + 3 champs optionnels |
| `src/store/canalStore.ts` | ✓ VERIFIED | 3 actions setElevation*/interface + impl immuable via map+spread |
| `src/services/elevationApi.ts` | ✓ VERIFIED | 122 lignes, 4 fonctions exportées substantielles |
| `src/hooks/useElevation.ts` | ✓ VERIFIED | 54 lignes, logique complète cache+race condition |
| `src/components/ElevationChart.tsx` | ✓ VERIFIED | Recharts AreaChart, ReferenceArea avant Area (ligne 59 < ligne 71) |
| `src/components/ElevationPanel.tsx` | ✓ VERIFIED | 4 états (vide/loading h-40/erreur/données), accordéon, câblage store |
| `src/components/CanalListItem.tsx` | ✓ VERIFIED | 3 badges pill conditionnels (lignes 38-52) |
| `src/components/MapView.tsx` | ✓ VERIFIED | `canal-uphill-source` + layer #EF4444 5px + `syncUphillLayer` + useEffect dédié |
| `src/components/SidePanel.tsx` | ✓ VERIFIED | `useElevation()` + `<ElevationPanel />` montés |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SidePanel.tsx` | `useElevation.ts` | `useElevation()` appelé | ✓ WIRED | Ligne 10 : `useElevation()` |
| `SidePanel.tsx` | `ElevationPanel.tsx` | `<ElevationPanel />` rendu | ✓ WIRED | Ligne 31 : `<ElevationPanel />` |
| `ElevationPanel.tsx` | `ElevationChart.tsx` | `<ElevationChart points=... uphillSegments=...>` | ✓ WIRED | Lignes 85-88 : props réels du profile |
| `useElevation.ts` | `canalStore.ts` | `useCanalStore(s => s.setElevation)` | ✓ WIRED | Lignes 11-13 : 3 sélecteurs d'actions |
| `useElevation.ts` | `elevationApi.ts` | `samplePoints + fetchElevations + buildProfile` | ✓ WIRED | Ligne 7 import + lignes 30-33 usage |
| `MapView.tsx` | `canal-uphill-source` | `map.getSource('canal-uphill-source').setData()` | ✓ WIRED | Ligne 168 getSource + ligne 189 setData |
| `elevationApi.ts` | `api.open-meteo.com/v1/elevation` | fetch GET | ✓ WIRED | Ligne 38 : URL Open-Meteo |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ElevationChart.tsx` | `points`, `uphillSegments` | Props depuis `ElevationPanel` ← store `canal.elevation` ← `setElevation()` ← `fetchElevations()` → `api.open-meteo.com` | Oui — fetch API externe réel | ✓ FLOWING |
| `ElevationPanel.tsx` | `profile`, `isLoading`, `error` | `useCanalStore(s => s.canals).find(c.id === selectedCanalId)` | Oui — données store Zustand live | ✓ FLOWING |
| `CanalListItem.tsx` | `canal.elevation?.isFullyGravity`, `canal.elevationLoading` | Props `Canal` depuis parent `CanalList` ← store | Oui — données store live | ✓ FLOWING |
| `MapView.tsx` (uphill layer) | `selectedCanal?.elevation` | `useCanalStore(s => s.canals)` + `selectedCanalId` | Oui — `syncUphillLayer` appelé sur changements canals/sélection | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 20 tests Wave 0 passent | `npm test` | 20 passed, 4 suites, 0 failed | ✓ PASS |
| TypeScript compile | `npx tsc --noEmit` | 0 erreur | ✓ PASS |
| recharts installé | `node -e "require('./node_modules/recharts')"` | recharts OK | ✓ PASS |
| @turf/turf installé | `node -e "require('./node_modules/@turf/turf')"` | turf OK | ✓ PASS |
| ReferenceArea avant Area dans ElevationChart | grep line numbers | ReferenceArea ligne 59, Area ligne 71 | ✓ PASS |
| Inversion lat/lng dans fetchElevations | elevationApi.test.ts | Test "latitude=48.8,43.3" → ✓ GREEN | ✓ PASS |
| null normalisé à 0 | elevationApi.test.ts | Test null→0 → ✓ GREEN | ✓ PASS |
| detectUphillSegments — 5 cas | uphill.test.ts | 5 tests GREEN | ✓ PASS |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| MAP-03 | L'utilisateur peut voir le profil d'élévation — graphique altitude vs distance | ✓ SATISFIED | ElevationChart.tsx (Recharts AreaChart) + ElevationPanel.tsx (accordéon 4 états) + câblage store complet via useElevation |
| MAP-04 | Les segments en montée sont automatiquement flaggés en rouge | ✓ SATISFIED | detectUphillSegments() (5 tests GREEN) + ReferenceArea rouge sur graphique + layer MapLibre #EF4444 5px sur carte + badges CanalListItem |

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `ElevationPanel.tsx` ligne 77 | Message d'erreur "Open Topo Data inaccessible" alors que l'API réelle est Open-Meteo | ⚠ Warning | Texte trompeur pour l'utilisateur si erreur réseau — cosmétique, ne bloque pas la fonctionnalité |
| `elevationApi.ts` ligne 2 | Commentaire d'en-tête "fetch Open Topo Data" obsolète | ℹ Info | Documentation interne incorrecte |

**Note sur la déviation API :** Le plan T02 spécifiait `opentopodata.org` mais le code utilise `api.open-meteo.com/v1/elevation`. Ce changement a été effectué dans le commit `0eb9543` avec la raison documentée : Open Topo Data ne supporte pas CORS depuis le navigateur. Open-Meteo fournit les mêmes données Copernicus DEM avec CORS activé. La déviation est techniquement justifiée et les tests ont été mis à jour en conséquence. Les critères de succès ROADMAP (MAP-03, MAP-04) ne spécifient pas l'API source — le comportement observable reste conforme.

---

## Human Verification Required

### 1. Graphique altimétrique visible dans le panneau

**Test:** `npm run dev` → ouvrir http://localhost:5173 → tracer un canal (ex. Alpes → Méditerranée) → cliquer sur le canal dans la liste
**Expected:** Spinner h-40 pendant le chargement (~300–2000ms), puis graphique Recharts altitude/distance avec courbe bleue dans le panneau latéral droit, section "Profil altimétrique"
**Why human:** Rendu Recharts dans le DOM du navigateur — impossible à vérifier sans exécution réelle

### 2. Segments uphill rouges sur la carte

**Test:** Tracer un canal avec une montée (ex. vallée → col → descente) → attendre le chargement → observer la carte
**Expected:** Segments épais rouges (#EF4444, 5px) visibles sur la carte aux endroits où le tracé monte, superposés au tracé bleu ; zones rouges translucides sur le graphique aux mêmes plages de distance
**Why human:** Layer MapLibre WebGL + ReferenceArea Recharts — vérification visuelle obligatoire

### 3. Badges gravitaires dans la liste et cache mémoire

**Test:** Observer le badge pendant et après le chargement ; désélectionner puis re-sélectionner le canal
**Expected:** Badge gris "⏳ Chargement..." pendant le fetch → badge vert "✅ Gravitaire" ou ambre "⚠ Montées détectées" ; re-sélection instantanée sans spinner (cache Zustand)
**Why human:** Comportement dynamique d'état React + timing fetch réseau réel

---

## Gaps Summary

Aucun gap bloquant détecté. Tous les artefacts existent, sont substantiels, câblés et les données circulent.

Un seul point mineur non bloquant : le message d'erreur dans `ElevationPanel.tsx` et le commentaire dans `elevationApi.ts` mentionnent encore "Open Topo Data" alors que l'API utilisée est Open-Meteo. Cela ne bloque pas la fonctionnalité.

La vérification humaine est requise pour confirmer le rendu visuel (graphique, segments rouges sur carte, badges, cache) dans le navigateur.

---

_Verified: 2026-04-30T18:30:00Z_
_Verifier: Claude (gsd-verifier)_

---
phase: 01-map-shell-trac
verified: 2026-04-30T16:55:00Z
status: human_needed
score: 14/14 must-haves verified
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Ouvrir http://localhost:5173 après npm run dev"
    expected: "La carte monde MapLibre s'affiche en plein écran avec le style OpenFreeMap liberty, le panneau 320px apparait à droite"
    why_human: "Rendu WebGL et chargement des tuiles vectorielles depuis tiles.openfreemap.org ne peuvent pas être vérifiés sans un navigateur"
  - test: "Cliquer sur la carte en mode 'Dessiner canal' pour poser >= 2 waypoints, double-cliquer pour finaliser"
    expected: "La ligne cyan apparait entre les points pendant le tracé, le canal finalisé s'affiche en bleu, le canal 'Canal 1' apparait dans la liste"
    why_human: "L'interaction MapLibre (events click/dblclick, rendu layers GeoJSON) requiert un navigateur et une connexion internet"
  - test: "Cliquer sur l'icone poubelle d'un canal dans la liste, confirmer la suppression"
    expected: "Le dialog de confirmation s'ouvre, après confirmation le canal disparait de la liste et de la carte"
    why_human: "Cycle modal (confirmOpen state local + DeleteConfirmDialog) ne peut être exercé que via interactions utilisateur dans le navigateur"
---

# Phase 1: Map Shell + Tracé — Rapport de Verification

**Objectif de la phase :** L'utilisateur peut afficher une carte monde et y tracer des canaux manuellement
**Verifie le :** 2026-04-30T16:55:00Z
**Statut :** human_needed
**Re-verification :** Non — verification initiale

---

## Criteres de succes ROADMAP (source de verite)

| # | Critere | Statut |
|---|---------|--------|
| SC-1 | L'utilisateur peut ouvrir l'app (git clone + npm run dev), voir une carte monde complete avec zoom et pan | HUMAN_NEEDED — tuiles WebGL non verifiables automatiquement |
| SC-2 | L'utilisateur peut cliquer sur la carte pour poser un depart, des points intermediaires et une arrivee — le canal apparait comme une ligne visible | HUMAN_NEEDED — interactions MapLibre non verifiables automatiquement |
| SC-3 | L'utilisateur peut voir la liste des canaux traces et supprimer un canal | HUMAN_NEEDED — cycle modal confirmOpen non verifiable automatiquement |

*Note : Les 3 success criteria dependent du rendu navigateur. La totalite du code qui les sous-tend est VERIFIED ci-dessous.*

---

## Verites observables

| # | Verite | Statut | Evidence |
|---|--------|--------|---------|
| 1 | `npm install` puis `npm run dev` demarre l'app sans erreur ni cle API | VERIFIED | package.json confirme 0 backend ; toutes les dependances presentes ; `npx tsc --noEmit` = 0 erreurs |
| 2 | `npx vitest run` passe la suite canalStore.test.ts (5 tests verts) | VERIFIED | Execution directe : 5 passed, 0 failed, 0 skipped |
| 3 | Le store Zustand accepte addWaypoint, finalizeCanal, cancelDrawing, deleteCanal | VERIFIED | src/store/canalStore.ts lignes 32-62 : 7 actions implementees |
| 4 | finalizeCanal est no-op si draftPoints < 2 | VERIFIED | canalStore.ts ligne 40 : `if (draftPoints.length < 2) return` |
| 5 | Les types Canal et Coord sont exportes depuis src/types/canal.ts | VERIFIED | src/types/canal.ts : export type Coord, export type UIMode, export interface Canal |
| 6 | La carte monde MapLibre (OpenFreeMap liberty) est configuree en plein ecran | VERIFIED | MapView.tsx ligne 158 : `style: 'https://tiles.openfreemap.org/styles/liberty'` ; div `absolute inset-0` |
| 7 | En mode drawing, clic = waypoint pose, double-clic = canal finalise sans zoom parasite | VERIFIED | useMapInteraction.ts lignes 22-55 : doubleClickZoom.disable(), handleClick, handleDblClick, cleanup |
| 8 | La ligne draft cyan apparait entre les points poses | VERIFIED | MapView.tsx initSources : source 'draft', layer 'draft-line' color #06B6D4 ; syncLayers met a jour via setData() |
| 9 | La ligne preview cyan suit le curseur depuis le dernier point | VERIFIED | MapView.tsx : source 'preview', layer 'preview-line' ; syncLayers : [lastPoint, previewCoord] si les deux existent |
| 10 | Escape en mode drawing annule le canal | VERIFIED | useMapInteraction.ts ligne 40 : `if (e.key === 'Escape') useCanalStore.getState().cancelDrawing()` |
| 11 | Pas de fuite memoire WebGL (map.remove() dans cleanup) | VERIFIED | MapView.tsx ligne 170 : `map.remove()` + `mapRef.current = null` dans le return du useEffect |
| 12 | Le panneau lateral 320px s'affiche avec fond semi-transparent sombre | VERIFIED | SidePanel.tsx : `w-80` (320px), `style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}` |
| 13 | Le badge de mode commute Sélection/Tracé en cours selon le store | VERIFIED | ModeIndicator.tsx : MODE_CONFIG avec labels 'Sélection'/'Tracé en cours', bg-gray-800/bg-blue-700 |
| 14 | La liste affiche les canaux et le dialog de suppression fonctionne | VERIFIED | CanalList.tsx consomme `useCanalStore((s) => s.canals)` ; CanalListItem.tsx : confirmOpen state local + `<DeleteConfirmDialog>` conditionnel ; deleteCanal appele dans handleConfirm |

**Score : 14/14 verites verifiees**

---

## Artefacts requis

| Artefact | Fourniture attendue | Statut | Details |
|----------|---------------------|--------|---------|
| `package.json` | Dependances (maplibre-gl, zustand, lucide-react, tailwindcss, vitest) | VERIFIED | maplibre-gl@^5.24.0, zustand@^5.0.12, lucide-react@^1.14.0, tailwindcss@^4.2.4, vitest@^3.2.1 |
| `vite.config.ts` | Plugin Tailwind CSS v4 + Vitest jsdom | VERIFIED | plugins: [react(), tailwindcss()], test: { environment: 'jsdom', globals: true } |
| `src/types/canal.ts` | Types Canal, Coord, UIMode | VERIFIED | Coord = [number, number], UIMode union, Canal interface — tout exporte |
| `src/store/canalStore.ts` | Store Zustand useCanalStore | VERIFIED | 5 state fields, 7 actions, garde finalizeCanal < 2 points, desélection deleteCanal |
| `src/store/canalStore.test.ts` | Suite Vitest 5 tests MAP-02 | VERIFIED | 5 tests verts confirmes par execution directe |
| `src/components/MapView.tsx` | Conteneur MapLibre GL, 4 sources GeoJSON, layers, sync store | VERIFIED | initSources : 4 sources/layers ; syncLayers via setData() ; guard anti-double-mount ; map.remove() cleanup |
| `src/hooks/useMapInteraction.ts` | Binding events MapLibre selon mode | VERIFIED | drawing : click/dblclick/mousemove/keydown + doubleClickZoom.disable ; selection : mouseenter/mouseleave/click sur canals-line ; cleanup map.off() complet |
| `src/App.tsx` | Layout racine : MapView plein ecran + SidePanel | VERIFIED | `relative h-screen w-screen overflow-hidden bg-gray-900` ; import et usage MapView + SidePanel |
| `src/components/SidePanel.tsx` | Panneau 320px fixed droite, 4 sections | VERIFIED | aside fixed w-80, rgba(26,26,46,0.95), 4 sections border-white/[0.08] |
| `src/components/ModeIndicator.tsx` | Bande 32px titre + badge mode | VERIFIED | h-8, "Canal Explorer", badge Sélection/Tracé en cours |
| `src/components/DrawingToolbar.tsx` | Boutons Dessiner canal / Annuler selon mode | VERIFIED | mode selection : bouton Pencil "Dessiner canal" ; mode drawing : avertissement < 2pts + bouton X "Annuler" |
| `src/components/CanalList.tsx` | Liste scrollable + empty state + info-bulle Qattara | VERIFIED | useCanalStore canals, empty state "Aucun canal tracé", "Qattara Depression = 2,76 mm de baisse si remplie" |
| `src/components/CanalListItem.tsx` | Ligne canal + bouton supprimer + selection | VERIFIED | confirmOpen state local, isSelected bg-blue-500/20, Trash2 stopPropagation, DeleteConfirmDialog conditionnel |
| `src/components/DeleteConfirmDialog.tsx` | Modal confirmation suppression | VERIFIED | overlay z-50, stopPropagation card, deleteCanal(canal.id) + onClose() dans handleConfirm |

---

## Liens de cablage (Key Links)

| De | Vers | Via | Statut | Details |
|----|------|-----|--------|---------|
| src/store/canalStore.ts | src/types/canal.ts | `import type { Canal, Coord, UIMode }` | WIRED | Ligne 3 confirme l'import |
| src/components/MapView.tsx | src/hooks/useMapInteraction.ts | `useMapInteraction(mapRef.current)` | WIRED | Import ligne 8, appel ligne 176 |
| src/hooks/useMapInteraction.ts | src/store/canalStore.ts | `useCanalStore` + `getState()` | WIRED | 5 selecteurs granulaires + getState pour Escape |
| src/components/MapView.tsx | tiles.openfreemap.org/styles/liberty | `new maplibregl.Map({ style: ... })` | WIRED | Ligne 158 : URL exacte presente |
| src/App.tsx | src/components/MapView.tsx | `import { MapView }` | WIRED | Import + usage dans JSX |
| src/App.tsx | src/components/SidePanel.tsx | `import { SidePanel }` | WIRED | Import + usage dans JSX |
| src/components/CanalList.tsx | src/store/canalStore.ts | `useCanalStore((s) => s.canals)` | WIRED | Ligne 6 : selecteur reel, rendu de la liste dynamique |
| src/components/CanalListItem.tsx | src/components/DeleteConfirmDialog.tsx | `confirmOpen state + <DeleteConfirmDialog>` | WIRED | Lignes 18 et 50-52 : etat local et rendu conditionnel |

---

## Trace de flux de donnees (Niveau 4)

| Artefact | Variable de donnees | Source | Produit des donnees reelles | Statut |
|----------|---------------------|--------|----------------------------|--------|
| MapView.tsx | canals, draftPoints, previewCoord | useCanalStore (Zustand) | Oui — store popule par addWaypoint/finalizeCanal en reaction aux events MapLibre | FLOWING |
| CanalList.tsx | canals | useCanalStore((s) => s.canals) | Oui — liste dynamique depuis le store, re-render sur chaque changement | FLOWING |
| ModeIndicator.tsx | mode | useCanalStore((s) => s.mode) | Oui — changement de badge reflete l'etat reel du store | FLOWING |
| DrawingToolbar.tsx | mode, draftPoints | useCanalStore | Oui — conditionnels mode===selection/drawing et draftPoints.length < 2 sur donnees store reelles | FLOWING |

---

## Spot-checks comportementaux

| Comportement | Commande | Resultat | Statut |
|---|---|---|---|
| 5 tests Vitest (MAP-02) | `npx vitest run src/store/canalStore.test.ts --reporter=verbose` | 5 passed, 0 failed | PASS |
| 0 erreurs TypeScript | `npx tsc --noEmit` | Aucune sortie (exit 0) | PASS |
| Guard finalizeCanal < 2 points | `grep "draftPoints.length < 2" src/store/canalStore.ts` | Ligne 40 trouvee | PASS |
| doubleClickZoom mitige | `grep "doubleClickZoom.disable" src/hooks/useMapInteraction.ts` | Ligne 22 trouvee | PASS |
| Cleanup WebGL present | `grep "map.remove()" src/components/MapView.tsx` | Ligne 170 trouvee | PASS |
| Qattara 2,76 mm present | `grep "2,76 mm" src/components/CanalList.tsx` | Ligne 33 trouvee | PASS |

---

## Couverture des exigences

| REQ-ID | Plan source | Description | Statut | Evidence |
|--------|-------------|-------------|--------|----------|
| MAP-01 | T01, T02, T03 | L'utilisateur peut afficher une carte monde interactive (zoom, pan, layers) | VERIFIED (code) / HUMAN_NEEDED (visuel) | MapView.tsx init MapLibre + style OpenFreeMap ; zoom/pan natif MapLibre |
| MAP-02 | T01, T02, T03 | L'utilisateur peut tracer un canal en cliquant des points sur la carte | VERIFIED (code) / HUMAN_NEEDED (visuel) | 5 tests verts ; useMapInteraction events drawing ; syncLayers draft/preview/canals |

*Aucune exigence orpheline : MAP-01 et MAP-02 sont les seules assignees a la Phase 1.*

---

## Anti-patterns detectes

| Fichier | Ligne | Pattern | Severite | Impact |
|---------|-------|---------|----------|--------|
| src/components/SidePanel.tsx | 27 | `{/* Global stats placeholder Phase 6 */}` | INFO | Aucun — section footer vide reservee a la Phase 6, documentee comme intentionnelle dans T03-SUMMARY. N'affecte pas les objectifs Phase 1 |

---

## Verification humaine requise

### 1. Carte monde visible dans le navigateur

**Test :** Lancer `npm run dev`, ouvrir http://localhost:5173
**Attendu :** La carte monde MapLibre s'affiche avec le style OpenFreeMap liberty (fond blanc/gris, labels de pays), le panneau 320px apparait a droite avec le titre "Canal Explorer" et le badge "Sélection"
**Pourquoi humain :** Le rendu WebGL et le chargement des tuiles vectorielles depuis tiles.openfreemap.org ne peuvent pas etre verifies automatiquement (necessite un navigateur + connexion internet)

### 2. Tracé de canal operationnel

**Test :** Cliquer "Dessiner canal", cliquer 3 fois sur la carte pour poser des waypoints, double-cliquer pour finaliser
**Attendu :** La ligne draft cyan (#06B6D4) s'affiche entre les points pendant le tracé ; la ligne preview suit le curseur depuis le dernier point ; apres double-clic, le canal "Canal 1" apparait en bleu (#3B82F6) et dans la liste
**Pourquoi humain :** Les events MapLibre (click, dblclick, mousemove) et le rendu des layers GeoJSON (draft-line, preview-line, canals-line) ne peuvent etre exerces que dans un vrai navigateur

### 3. Suppression de canal avec confirmation

**Test :** Avec au moins un canal trace, cliquer sur l'icone poubelle dans la liste, puis confirmer
**Attendu :** Le dialog "Supprimer ce canal ?" s'affiche ; cliquer "Annuler" ferme sans supprimer ; cliquer "Supprimer" retire le canal de la liste et de la carte
**Pourquoi humain :** Le cycle d'etat local confirmOpen et l'affichage conditionnel de DeleteConfirmDialog necessitent une interaction utilisateur reelle

---

## Résumé

La Phase 1 est **entierement implementee au niveau du code**. Les 14 verites observables sont verifiees, les 14 artefacts sont substantiels et cables, les 5 tests Vitest passent, 0 erreur TypeScript.

Le statut `human_needed` reflète uniquement l'impossibilite de verifier le rendu navigateur automatiquement (MapLibre WebGL + tuiles reseau). Il ne signale aucun gap de code.

---

_Verifie : 2026-04-30T16:55:00Z_
_Verifier : Claude (gsd-verifier)_

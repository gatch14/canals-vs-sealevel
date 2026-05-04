---
phase: 1
slug: map-shell-trac
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-30
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (inclus avec Vite, configurable dans `vite.config.ts`) |
| **Config file** | `vite.config.ts` (section `test: { environment: 'jsdom' }`) — créé en Wave 0 (T01) |
| **Quick run command** | `npx vitest run src/store/canalStore.test.ts --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/store/canalStore.test.ts --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-T01-01 | T01 | 1 | MAP-01, MAP-02 | — | N/A | unit | `npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 01-T01-02 | T01 | 1 | MAP-02 | — | addWaypoint/finalizeCanal/cancelDrawing/deleteCanal comportement correct | unit | `npx vitest run src/store/canalStore.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 01-T02-01 | T02 | 2 | MAP-01 | — | map.remove() appelé en cleanup (évite fuite WebGL) | structural | `grep -c "map.remove()" src/components/MapView.tsx` | ❌ W0 | ⬜ pending |
| 01-T02-02 | T02 | 2 | MAP-02 | — | doubleClickZoom.disable() appelé en mode tracé (évite zoom parasite) | structural | `grep -c "doubleClickZoom.disable" src/hooks/useMapInteraction.ts` | ❌ W0 | ⬜ pending |
| 01-T03-01 | T03 | 3 | MAP-01, MAP-02 | — | Compilation TypeScript sans erreurs | type | `npx tsc --noEmit 2>&1 \| head -30` | ❌ W0 | ⬜ pending |
| 01-T03-02 | T03 | 3 | MAP-01, MAP-02 | — | Compilation TypeScript propre | type | `npx tsc --noEmit 2>&1 \| tail -5` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/store/canalStore.test.ts` — 5 tests unitaires : addWaypoint, finalizeCanal (>= 2 pts), finalizeCanal (< 2 pts no-op), cancelDrawing, deleteCanal — couvre MAP-02
- [ ] Vitest config dans `vite.config.ts` — section `test: { environment: 'jsdom' }`
- [ ] `npm install -D vitest @vitest/ui jsdom` — si absent après scaffold Vite

Note : MAP-01 (carte monde visible) est testé manuellement (smoke test `npm run dev`) car WebGL n'est pas testable automatiquement dans jsdom en Phase 1. La vérification structurelle de `map.remove()` dans MapView.tsx est la couverture automatisée proxy pour MAP-01.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Carte monde visible après `npm run dev` | MAP-01 | WebGL non testable automatiquement en jsdom — MapLibre crée un contexte WebGL navigateur | 1. `npm run dev` 2. Ouvrir http://localhost:5173 3. Vérifier que la carte monde s'affiche avec tiles OpenFreeMap |
| Mode tracé : clic = waypoint, double-clic = finaliser | MAP-02 | Interaction MapLibre events non testables en Vitest sans canvas WebGL réel | 1. Cliquer "Dessiner canal" 2. Cliquer 2+ points sur la carte 3. Double-cliquer pour finaliser 4. Canal apparaît dans la liste |
| Escape annule le tracé en cours | MAP-02 | Event clavier maplibre non simulable en jsdom | 1. Entrer en mode tracé 2. Poser un point 3. Appuyer Escape 4. La ligne draft disparaît, mode revient à Sélection |
| Bouton Supprimer retire le canal | MAP-02 | Interaction DOM + store intégrée non testée unitairement | 1. Tracer un canal 2. Cliquer Supprimer dans le panneau 3. Confirmer dans le dialog 4. Canal retiré de la liste et de la carte |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

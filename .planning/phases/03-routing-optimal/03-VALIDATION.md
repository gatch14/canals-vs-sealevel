---
phase: 3
slug: routing-optimal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.1 |
| **Config file** | vite.config.ts (section `test:`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-T01-types | T01 | 1 | MAP-05 | — | Coordonnées [lng,lat] WGS84 validées | unit | `npm test -- src/store/canalStore.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-T01-store | T01 | 1 | MAP-05 | — | setRoutingStart/End/finalizeRoutedCanal | unit | `npm test -- src/store/canalStore.test.ts` | Extension | ⬜ pending |
| 03-T02-buildGrid | T02 | 1 | MAP-05 | — | N/A | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-T02-getResolution | T02 | 1 | MAP-05 | — | N/A | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-T02-fetchBatching | T02 | 1 | MAP-05 | Tampering (coords hors-range) | lat ∈ [-90,90], lng ∈ [-180,180] validées avant fetch | unit (mock fetch) | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-T02-buildGraph | T02 | 1 | MAP-05 | — | oriented: true — arêtes unidirectionnelles | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-T02-findPath | T02 | 1 | MAP-05 | DoS (self) | Timeout 30s déclenche worker.terminate() | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-T02-noPath | T02 | 1 | MAP-05 | — | Retourne [] si obstacle infranchissable | unit | `npm test -- src/tests/routingGrid.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-T03-ux | T03 | 2 | MAP-05 | — | N/A | manual | UAT Phase 3 | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/routingGrid.test.ts` — stubs pour MAP-05 (buildGrid, getResolution, fetchGridElevations, buildGraph, findPath, chemin inversé, no-path)
- [ ] `src/types/routing.ts` — RoutingState, RoutingRequest, RoutingResult types
- [ ] Extension `src/store/canalStore.test.ts` — actions routing (setRoutingStart, setRoutingEnd, finalizeRoutedCanal, setRoutingState)

*Fonctions testées directement depuis routingGrid.ts (pas via Worker) — évite les limitations @vitest/web-worker + mock réseau dans workers.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mode routing — sélection deux points + calcul affiché sur carte | MAP-05 | Interaction MapLibre + rendu carte — pas testable sans DOM réel | 1. Cliquer "Tracé optimal" dans toolbar 2. Cliquer point A 3. Cliquer point B 4. Vérifier spinner puis canal sur carte |
| Profil d'élévation auto après routing | MAP-05 | Recharts rendu + fetch réseau réel | Après canal routé, vérifier graphique altitude dans SidePanel |
| Message "Aucun chemin gravitaire" affiché | MAP-05 | Condition difficile à reproduire sans carte réelle | Tester avec deux points séparés par une montagne |
| Bouton Annuler termine le Worker | MAP-05 | Worker.terminate() — vérifiable via DevTools (réseau stoppé) | Pendant calcul, cliquer Annuler — vérifier que les requêtes API s'arrêtent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

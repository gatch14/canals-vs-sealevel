---
phase: 4
slug: moteur-de-calcul
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vite.config.ts` (section `test: { environment: 'jsdom', globals: true }`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` (suite complète)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | T01 | 0 | CALC-01, CALC-02, UX-01 | unit | `npm test -- --reporter=verbose` | ❌ Wave 0 | ⬜ pending |
| 04-01-02 | T01 | 0 | CALC-03, CALC-04 | unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 04-01-03 | T01 | 0 | CALC-05 | unit | `npm test` | ❌ Wave 0 | ⬜ pending |
| 04-02-01 | T02 | 1 | CALC-01, CALC-02, CALC-03, CALC-04, CALC-05 | unit | `npm test` | ❌ Wave 1 | ⬜ pending |
| 04-03-01 | T03 | 2 | CALC-01–05, UX-01 | integration | `npm test` | ❌ Wave 2 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/types/calculation.ts` — types `Interval`, `CalculationResult`, `TerrainBreakdown`, `PartialImpactResult`
- [ ] `src/lib/calculationEngine.ts` — module pur (stubs Wave 0, implémenté Wave 1)
- [ ] `src/tests/calculationEngine.test.ts` — tests unitaires CALC-01 à CALC-05

### Test Cases per REQ
| Req ID | Test case | Expected result |
|--------|-----------|-----------------|
| CALC-01 | `computeVolume([100,101], [47.5,52.5], [4.5,5.5])` | interval km³ correct |
| CALC-02 | `computeDeltaSL([0.016, 0.036])` | `[0.0000442, 0.0000995]` mm |
| CALC-03 | `classifyTerrain(mockProfile)` | breakdown %plaine/%mixte/%montagne |
| CALC-03 | `computeCost(breakdown)` | interval M€, max >= min |
| CALC-04 | `computeIPCCPercent([0.001, 0.002], 4.5)` | `[0.02, 0.04]%` |
| CALC-05 | `computePartialImpact(canal, profile, 50, 5)` | `null` si isFullyGravity |
| CALC-05 | `computePartialImpact(canal, profile, 50, 5)` avec obstacles | stopCoord = turf.along() |
| UX-01 | Vérification TypeScript | `tsc --noEmit` sans erreur (toutes valeurs en `Interval`) |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CalculationPanel s'ouvre et affiche les résultats en temps réel | CALC-01, UX-01 | Interaction UI dans le navigateur | Ouvrir l'app, tracer un canal, saisir largeur=50 profondeur=5, vérifier l'affichage |
| Barre % IPCC se met à jour dynamiquement | CALC-04 | Comportement DOM/CSS | Modifier largeur et vérifier que la barre progresse |
| Marker amber apparaît sur la carte pour impact partiel | CALC-05 | Comportement MapLibre/DOM | Tracer canal avec segments rouges, vérifier marker sur carte |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

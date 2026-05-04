---
phase: 7
slug: persistance-locale
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existant dans le projet) |
| **Config file** | vite.config.ts (vitest config inline) |
| **Quick run command** | `npm run test -- --run src/tests/persistence.test.ts` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run src/tests/persistence.test.ts`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-T01-01 | 01 | 0 | PERS-01, PERS-02, PERS-03 | — | N/A | unit (stub RED) | `npm run test -- --run src/tests/persistence.test.ts` | ❌ W0 | ⬜ pending |
| 07-T01-02 | 01 | 0 | PERS-01 | — | N/A | unit (stub RED) | `npm run test -- --run src/tests/persistence.test.ts` | ❌ W0 | ⬜ pending |
| 07-T02-01 | 02 | 1 | PERS-01 | — | N/A | unit (GREEN) | `npm run test -- --run src/tests/persistence.test.ts` | ✅ | ⬜ pending |
| 07-T02-02 | 02 | 1 | PERS-02 | — | N/A | unit (GREEN) | `npm run test -- --run src/tests/persistence.test.ts` | ✅ | ⬜ pending |
| 07-T02-03 | 02 | 1 | PERS-03 | — | N/A | unit (GREEN) | `npm run test -- --run src/tests/persistence.test.ts` | ✅ | ⬜ pending |
| 07-T03-01 | 03 | 2 | PERS-01, PERS-02 | — | N/A | integration | `npm run test -- --run` | ✅ | ⬜ pending |
| 07-T03-02 | 03 | 2 | PERS-03 | — | N/A | unit | `npm run test -- --run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/persistence.test.ts` — stubs pour PERS-01, PERS-02, PERS-03
- [ ] `fake-indexeddb` devDependency installée (`npm install --save-dev fake-indexeddb`)
- [ ] `dexie` dependency installée (`npm install dexie`)
- [ ] Import `fake-indexeddb/auto` dans persistence.test.ts pour jsdom

*Wave 0 couvre TOUTES les exigences — pas d'infrastructure existante pour la persistance.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Restauration après fermeture onglet | PERS-01 | Cycle browser tab réel impossible en Vitest | 1. `npm run dev`, 2. Tracer un canal, 3. Fermer et rouvrir l'onglet, 4. Vérifier que le canal est présent |
| Hydration avant premier rendu visible | PERS-01 | Timing browser réel | Observer que la carte affiche les canaux sans flash de contenu vide |
| Comportement private browsing | PERS-01 | IndexedDB désactivé en navigation privée | Ouvrir en mode privé → app démarre vide sans erreur JavaScript |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

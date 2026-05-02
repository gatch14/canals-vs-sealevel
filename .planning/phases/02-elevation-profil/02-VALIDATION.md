---
phase: 2
slug: elevation-profil
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.1 |
| **Config file** | `vite.config.ts` (test.environment: 'jsdom', test.globals: true) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | T01 | 0 | MAP-03/MAP-04 | — | N/A | unit | `npm test -- src/tests/samplePoints.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-01-02 | T01 | 0 | MAP-03 | — | Validate elevation type (number\|null) | unit | `npm test -- src/tests/elevationApi.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-01-03 | T01 | 0 | MAP-04 | — | N/A | unit | `npm test -- src/tests/uphill.test.ts` | ❌ Wave 0 | ⬜ pending |
| 2-02-01 | T02 | 1 | MAP-03 | — | N/A | manual | Open app, select canal, see chart | ❌ manual | ⬜ pending |
| 2-02-02 | T02 | 1 | MAP-04 | — | N/A | manual | Draw uphill canal, verify red segments | ❌ manual | ⬜ pending |
| 2-03-01 | T03 | 2 | MAP-03 | — | N/A | manual | Verify panel accordion open/close | ❌ manual | ⬜ pending |
| 2-03-02 | T03 | 2 | MAP-04 | — | N/A | manual | Verify badge pill states on CanalListItem | ❌ manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/samplePoints.test.ts` — unit tests: sampling 100 points, distances km, [lng,lat] output
- [ ] `src/tests/elevationApi.test.ts` — unit tests: fetch mock, parsing response, lat/lng inversion, null→0 normalization
- [ ] `src/tests/uphill.test.ts` — unit tests: detectUphillSegments (monotone decreasing, mixed, all uphill, empty), isFullyGravity
- [ ] `npm install recharts @turf/turf` — packages not yet installed

*Wave 0 must be completed before Wave 1 implementation begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ElevationChart renders in SidePanel | MAP-03 | MapLibre + Recharts WebGL/SVG not testable in jsdom | Select canal → verify accordion opens with chart |
| Red segments visible on map | MAP-04 | MapLibre WebGL not testable in jsdom | Draw canal with altitude gain → verify red overlay |
| Spinner appears during fetch | MAP-03 | Browser animation | Select canal → observe loading state before data arrives |
| Error state displayed | MAP-03 | Network failure simulation | Disable network → select canal → verify error message |
| Badge states on CanalListItem | MAP-04 | React + Tailwind rendering | Observe pill: ⏳ during load, ✅/⚠ after |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

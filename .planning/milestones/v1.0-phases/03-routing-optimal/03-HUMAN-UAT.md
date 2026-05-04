---
status: partial
phase: 03-routing-optimal
source: [03-VERIFICATION.md]
started: 2026-04-30T17:25:00Z
updated: 2026-04-30T17:25:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Tracé optimal de A vers B sur un relief réel
expected: Cliquer Tracé optimal, poser deux points, attendre le calcul — le canal routé apparaît en bleu sur la carte et son profil d'élévation se charge automatiquement dans le SidePanel (peu ou pas de segments rouges)
result: [pending]

### 2. Feedback visuel pendant le calcul
expected: Marqueur vert après clic 1, marqueur rouge après clic 2, spinner + message 'Calcul du tracé optimal en cours...' dans le SidePanel, curseur 'wait'
result: [pending]

### 3. Annulation du calcul pendant computing
expected: Cliquer 'Annuler le calcul' pendant le spinner — le worker est terminé, le mode revient à 'selection', les marqueurs temporaires disparaissent
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

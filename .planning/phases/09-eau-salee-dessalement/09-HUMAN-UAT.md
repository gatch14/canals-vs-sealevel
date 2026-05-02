---
status: partial
phase: 09-eau-salee-dessalement
source: [09-VERIFICATION.md]
started: 2026-05-02T13:30:00Z
updated: 2026-05-02T13:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Toggle dessalement visible et animé
expected: Le toggle "Nœuds dessalement solaire" est visible dans EcologyPanel avec un switch animé (bleu quand activé)
result: [pending]

### 2. Affichage des métriques dessalement
expected: Avec canal >= 500 km et toggle activé — section affiche eau douce [min–max] m³/jour, valeur sels [min–max] €/an, zones habitables [min–max] km², coût [min–max] M€ (valeurs non-nulles)
result: [pending]

### 3. Message "Canal trop court"
expected: Avec canal < 500 km et toggle activé — message "Canal trop court pour un nœud (minimum 500 km)" affiché
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

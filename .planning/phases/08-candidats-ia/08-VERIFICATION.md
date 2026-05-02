# Phase 8 — Candidats IA : Vérification

**Date:** 2026-05-02
**Status:** PASSED

## Must-Haves Checklist

### 08-T01

| Critère | Résultat |
|---------|----------|
| CanalCandidate exporté depuis src/types/candidate.ts | PASS |
| CANDIDATES readonly array exporté | PASS |
| candidates.json contient exactement 25 candidats | PASS (node -e vérification) |
| Qattara Depression en #1 (dsl_max=3.59) | PASS |
| Triés par dsl_max décroissant | PASS |
| Tous les champs requis présents (id, name, region, dsl_min, dsl_max, points, feasible, cost_min, cost_max) | PASS |

### 08-T02

| Critère | Résultat |
|---------|----------|
| useCandidates() retourne 25 candidats triés dsl_max décroissant | PASS (6 tests GREEN) |
| loadCandidate(candidate) ajoute sans supprimer les existants | PASS (test "non-destructif") |
| Canal chargé auto-sélectionné (selectedCanalId = canal.id) | PASS (test "auto-sélectionné") |
| 107/107 tests GREEN | PASS |

### 08-T03

| Critère | Résultat |
|---------|----------|
| CandidatesPanel accordéon collapsé par défaut | PASS (isOpen=false) |
| 25 CandidateListItem affichés via useCandidates() | PASS |
| CandidateListItem : nom + région + ΔSL [min – max] mm | PASS |
| Zone étendue : faisabilité + coût [min – max] G€ + bouton charger | PASS |
| Bouton "Charger sur la carte" appelle loadCandidate (non-destructif) | PASS |
| Section 8 dans SidePanel après DashboardPanel | PASS |
| Qattara Depression en tête de liste | PASS |

## Tests

```
npx vitest run
Tests: 107/107 passed (10 fichiers)
```

## TypeScript

```
npx tsc --noEmit
Résultat: aucune erreur
```

## Success Criteria ROADMAP

| Critère | Résultat |
|---------|----------|
| 20-30 candidats triés par ΔSL décroissant sans attente réseau | PASS (25 candidats JSON bundlé) |
| Clic sur candidat affiche métadonnées (ΔSL [min,max], faisabilité, coût) | PASS |
| Chargement en un clic sur la carte, calculs appliqués automatiquement | PASS (loadCandidate + auto-select) |

## Requirements Coverage

| REQ-ID | Status |
|--------|--------|
| IA-01 | PASS — liste 25 candidats triés dsl_max décroissant |
| IA-02 | PASS — métadonnées affichées dans expand (ΔSL, faisabilité, coût) |
| IA-03 | PASS — loadCandidate non-destructif, Canal auto-sélectionné |

## Résumé

Phase 8 entièrement livrée. 3 plans complétés, 107 tests GREEN, TypeScript propre, zéro appel réseau (données JSON bundlées), accordéon collapsé par défaut, ΔSL affiché comme intervalles [min – max] mm (UX-01 respecté).

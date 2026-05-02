---
phase: 08-candidats-ia
plan: T02
type: tdd
wave: 2
depends_on: [08-T01]
files_modified:
  - src/hooks/useCandidates.ts
  - src/store/canalStore.ts
autonomous: true
requirements: [IA-01, IA-02, IA-03]

must_haves:
  truths:
    - "useCandidates() retourne les 25 candidats triés par dsl_max décroissant"
    - "loadCandidate(candidate) ajoute un Canal dans store.canals sans supprimer les existants"
    - "Le canal chargé est automatiquement sélectionné (selectedCanalId = canal.id)"
    - "Tous les tests de candidates.test.ts passent en GREEN (101+ tests GREEN)"
  artifacts:
    - path: "src/hooks/useCandidates.ts"
      provides: "Hook React retournant CANDIDATES triés"
      exports: [useCandidates]
    - path: "src/store/canalStore.ts"
      provides: "Action loadCandidate ajoutée à CanalStore"
      contains: "loadCandidate"
  key_links:
    - from: "src/hooks/useCandidates.ts"
      to: "src/data/candidates.json"
      via: "import CANDIDATES from src/types/candidate.ts"
      pattern: "CANDIDATES"
    - from: "src/store/canalStore.ts"
      to: "src/types/candidate.ts"
      via: "import CanalCandidate"
      pattern: "loadCandidate"
---

<objective>
Implémenter useCandidates hook et l'action loadCandidate dans le store Zustand pour faire passer les tests RED de T01 en GREEN.

Purpose: Logique métier pure — le hook retourne la liste triée, l'action crée un Canal à partir d'un CanalCandidate et le sélectionne. Aucune UI dans ce plan.

Output: src/hooks/useCandidates.ts, src/store/canalStore.ts (étendu avec loadCandidate)
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/08-candidats-ia/08-T01-SUMMARY.md

<interfaces>
<!-- Interfaces existantes nécessaires pour T02 -->

From src/types/candidate.ts (créé en T01):
```typescript
export interface CanalCandidate {
  id: string
  name: string
  region: string
  dsl_min: number
  dsl_max: number
  points: Coord[]
  feasible: boolean
  cost_min: number
  cost_max: number
}
export const CANDIDATES: readonly CanalCandidate[]
```

From src/types/canal.ts:
```typescript
export type Coord = [number, number]  // [lng, lat] WGS84
export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  isRouted?: boolean
}
```

From src/store/canalStore.ts — interface CanalStore existante:
```typescript
interface CanalStore {
  canals: Canal[]
  selectedCanalId: string | null
  // Actions existantes:
  clearAll: () => void
  hydrateCanals: (canals: Canal[]) => void
  // ... (finalizeCanal, deleteCanal, selectCanal, etc.)
}
```

Pattern hooks existants (useEcology.ts):
```typescript
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'

export function useEcology(): EcologyResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  return useMemo(() => { ... }, [selectedCanal])
}
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Créer src/hooks/useCandidates.ts</name>
  <files>src/hooks/useCandidates.ts</files>
  <behavior>
    - useCandidates() retourne un tableau CanalCandidate[] trié par dsl_max décroissant
    - Le tri est stable (useMemo sans dépendance — la liste est statique, immuable)
    - Pas de state local — CANDIDATES est une constante importée, pas de fetch
    - Retourne exactement les 25 candidats de candidates.json
  </behavior>
  <action>
Créer src/hooks/useCandidates.ts :

```typescript
// src/hooks/useCandidates.ts
// Hook Phase 8 — retourne la bibliothèque de candidats triée par ΔSL décroissant (IA-01)
// Données statiques bundlées — zéro appel réseau (contrainte absolue projet)
import { useMemo } from 'react'
import { CANDIDATES } from '../types/candidate'
import type { CanalCandidate } from '../types/candidate'

/**
 * Retourne les 25 canaux candidats mondiaux triés par ΔSL max décroissant.
 * Liste immuable — mémoïsée une seule fois (pas de dépendances).
 */
export function useCandidates(): readonly CanalCandidate[] {
  return useMemo(
    () => [...CANDIDATES].sort((a, b) => b.dsl_max - a.dsl_max),
    [] // Dépendances vides : CANDIDATES est une constante statique
  )
}
```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep "useCandidates" | head -5</automated>
  </verify>
  <done>src/hooks/useCandidates.ts créé sans erreur TypeScript, exporte useCandidates</done>
</task>

<task type="tdd">
  <name>Task 2: Ajouter loadCandidate dans canalStore.ts</name>
  <files>src/store/canalStore.ts</files>
  <behavior>
    - loadCandidate(candidate: CanalCandidate) crée un Canal à partir du candidat
    - Le Canal créé : id=crypto.randomUUID(), points=candidate.points, name=candidate.name, createdAt=Date.now(), isRouted=false
    - S'ajoute à state.canals (non-destructif — les canaux existants sont conservés)
    - Le canal chargé est automatiquement sélectionné (selectedCanalId = newCanal.id)
    - L'action est déclarée dans l'interface CanalStore
    - Import CanalCandidate depuis ../types/candidate (nouveau)
  </behavior>
  <action>
Modifier src/store/canalStore.ts :

1. Ajouter l'import en tête de fichier (après les imports existants) :
```typescript
import type { CanalCandidate } from '../types/candidate'
```

2. Ajouter dans l'interface CanalStore (après la ligne `hydrateCanals: (canals: Canal[]) => void`) :
```typescript
  // Candidats IA — Phase 8
  loadCandidate: (candidate: CanalCandidate) => void
```

3. Ajouter l'implémentation dans create() (après hydrateCanals) :
```typescript
  loadCandidate: (candidate) => {
    const newCanal: Canal = {
      id: crypto.randomUUID(),
      points: candidate.points,
      name: candidate.name,
      createdAt: Date.now(),
      isRouted: false,
    }
    set((state) => ({
      canals: [...state.canals, newCanal],
      selectedCanalId: newCanal.id,
    }))
  },
```

Ne pas modifier d'autres parties du store — ajout minimal.
  </action>
  <verify>
    <automated>npx vitest run src/tests/candidates.test.ts 2>&1 | tail -15</automated>
  </verify>
  <done>Tous les tests de candidates.test.ts passent GREEN — suite complète sans régression (npx vitest run passe)</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CanalCandidate.points → Canal.points | Les points JSON bundlés sont copiés tels quels dans le store |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-08-03 | Tampering | loadCandidate | accept | Les points proviennent du JSON bundlé (build-time) — pas d'entrée utilisateur à ce stade |
| T-08-04 | Denial of Service | useMemo vides deps | accept | CANDIDATES est statique (25 éléments) — le sort() est O(n log n) sur 25 items, coût négligeable |
</threat_model>

<verification>
- `npx tsc --noEmit` passe sur l'ensemble du projet
- `npx vitest run src/tests/candidates.test.ts` — tous les tests GREEN
- `npx vitest run` — suite complète sans régression (101+ tests)
</verification>

<success_criteria>
- useCandidates() retourne 25 candidats triés par dsl_max décroissant
- loadCandidate(candidate) ajoute un Canal non-destructif et le sélectionne automatiquement
- 100% des tests candidates.test.ts passent GREEN
- Aucune régression sur la suite existante
</success_criteria>

<output>
Après completion, créer `.planning/phases/08-candidats-ia/08-T02-SUMMARY.md`
</output>

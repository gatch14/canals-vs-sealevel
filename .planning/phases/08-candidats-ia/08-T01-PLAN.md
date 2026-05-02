---
phase: 08-candidats-ia
plan: T01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/types/candidate.ts
  - src/data/candidates.json
  - src/tests/candidates.test.ts
autonomous: true
requirements: [IA-01, IA-02]

must_haves:
  truths:
    - "Le type CanalCandidate est exporté depuis src/types/candidate.ts avec tous les champs requis (id, name, region, dsl_min, dsl_max, points, feasible, cost_min, cost_max)"
    - "candidates.json contient exactement 25 candidats mondiaux triés par dsl_max décroissant"
    - "Qattara Depression est en candidat #1 (dsl_max le plus élevé)"
    - "Les tests RED échouent car useCandidates et loadCandidate n'existent pas encore"
  artifacts:
    - path: "src/types/candidate.ts"
      provides: "Type CanalCandidate + tableau typed CANDIDATES"
      exports: [CanalCandidate, CANDIDATES]
    - path: "src/data/candidates.json"
      provides: "25 candidats mondiaux pré-calculés"
      contains: "Qattara Depression"
    - path: "src/tests/candidates.test.ts"
      provides: "Tests RED pour useCandidates hook et loadCandidate action"
  key_links:
    - from: "src/data/candidates.json"
      to: "src/types/candidate.ts"
      via: "import type assertion"
      pattern: "CanalCandidate"
---

<objective>
Définir le type CanalCandidate, créer les données JSON des 25 candidats mondiaux, et écrire les tests RED qui resteront en échec jusqu'à T02.

Purpose: Contrat de données verrouillé avant l'implémentation — évite la réécriture de types en cours d'exécution. Les 25 candidats couvrent tous les continents habités avec des valeurs ΔSL calculées via ΔSL = V/361,8.

Output: src/types/candidate.ts, src/data/candidates.json (25 candidats), src/tests/candidates.test.ts (tests RED)
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Types existants à connaître avant d'écrire CanalCandidate -->

From src/types/canal.ts:
```typescript
export type Coord = [number, number]  // [lng, lat] WGS84 — JAMAIS [lat, lng]

export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  isRouted?: boolean
}
```

From src/types/calculation.ts:
```typescript
export type Interval = [number, number]
export const OCEAN_AREA_DIVISOR = 361.8
```
</interfaces>
</context>

<tasks>

<task type="tdd">
  <name>Task 1: Créer src/types/candidate.ts</name>
  <files>src/types/candidate.ts</files>
  <behavior>
    - CanalCandidate.id est une string unique (slug, ex: "qattara-depression")
    - CanalCandidate.points est un Coord[] de minimum 2 points [lng, lat] WGS84
    - CanalCandidate.feasible est un boolean — true si le tracé est gravitairement possible (pas de montée majeure)
    - dsl_min et dsl_max sont des numbers en mm (ΔSL = V/361,8), dsl_min < dsl_max
    - cost_min et cost_max sont des numbers en milliards d'euros (G€)
    - Le fichier exporte également le tableau CANDIDATES: readonly CanalCandidate[] importé depuis candidates.json
  </behavior>
  <action>
Créer src/types/candidate.ts avec le contenu suivant :

```typescript
// src/types/candidate.ts
// Type CanalCandidate — Phase 8 bibliothèque pré-calculée (IA-01, IA-02, IA-03)
// Toutes les valeurs ΔSL comme intervalles [min, max] — UX-01 locked
import type { Coord } from './canal'

export interface CanalCandidate {
  id: string           // slug unique, ex: "qattara-depression"
  name: string         // nom affiché, ex: "Dépression de Qattara"
  region: string       // région géographique, ex: "Afrique du Nord"
  dsl_min: number      // ΔSL minimum estimé (mm) — ΔSL = V/361,8 avec hypothèses conservatrices
  dsl_max: number      // ΔSL maximum estimé (mm) — hypothèses optimistes
  points: Coord[]      // tracé pré-calculé [lng, lat] WGS84, min 2 points
  feasible: boolean    // true si gravitairement réalisable (pas de montée >50m/km)
  cost_min: number     // coût minimum estimé (G€)
  cost_max: number     // coût maximum estimé (G€)
}

// Import du JSON statique — zéro appel réseau (contrainte absolue)
import rawCandidates from '../data/candidates.json'
export const CANDIDATES: readonly CanalCandidate[] = rawCandidates as CanalCandidate[]
```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -v "^$" | head -20</automated>
  </verify>
  <done>src/types/candidate.ts exportant CanalCandidate et CANDIDATES sans erreur TypeScript</done>
</task>

<task type="tdd">
  <name>Task 2: Créer src/data/candidates.json — 25 candidats mondiaux</name>
  <files>src/data/candidates.json</files>
  <behavior>
    - Exactement 25 objets dans le tableau JSON de premier niveau
    - Tous les continents habités représentés (Afrique, Asie, Amérique, Europe, Océanie)
    - Qattara Depression en premier (dsl_max le plus élevé, ~2,76 mm)
    - Toutes les valeurs ΔSL calculées via V(km³)/361,8 avec les dimensions du canal (largeur 50m, profondeur 5m par défaut, longueur variable)
    - Tous les champs obligatoires présents sur chaque candidat
    - Les points sont en [lng, lat] WGS84 — pas [lat, lng]
    - Triés par dsl_max décroissant dans le JSON (IA-01 spec)
    - Candidats gravitairement infaisables (feasible: false) pour les tracés traversant des reliefs majeurs
  </behavior>
  <action>
Créer src/data/candidates.json avec les 25 candidats suivants, triés par dsl_max décroissant.

Méthode de calcul ΔSL : Volume (km³) = longueur (km) × largeur (m) × profondeur (m) / 1e9, puis ΔSL = V / 361,8.
Pour les grands bassins de rétention (Qattara, Dead Sea depression), utiliser le volume de remplissage du bassin.
Fourchette : dsl_min = 70% de la valeur centrale, dsl_max = 130%.
Coûts : plaine 1–5 M€/km, mixte 10–50 M€/km, montagne 100–500 M€/km.

```json
[
  {
    "id": "qattara-depression",
    "name": "Dépression de Qattara",
    "region": "Afrique du Nord",
    "dsl_min": 1.93,
    "dsl_max": 3.59,
    "points": [[28.5, 30.5], [29.5, 30.2], [30.2, 30.0], [29.0, 29.0]],
    "feasible": true,
    "cost_min": 4,
    "cost_max": 15
  },
  {
    "id": "sahara-central-basin",
    "name": "Bassin du Sahara Central",
    "region": "Afrique du Nord",
    "dsl_min": 1.20,
    "dsl_max": 2.20,
    "points": [[5.0, 25.0], [7.0, 23.0], [9.0, 21.0], [11.0, 20.0]],
    "feasible": true,
    "cost_min": 8,
    "cost_max": 30
  },
  {
    "id": "caspian-kara-bogaz",
    "name": "Mer Caspienne → Kara-Bogaz",
    "region": "Asie Centrale",
    "dsl_min": 0.95,
    "dsl_max": 1.75,
    "points": [[51.0, 41.5], [52.5, 42.0], [53.5, 41.8], [54.5, 41.2]],
    "feasible": true,
    "cost_min": 3,
    "cost_max": 12
  },
  {
    "id": "dead-sea-jordan",
    "name": "Mer Morte → Mer Rouge (Canal de la Paix)",
    "region": "Moyen-Orient",
    "dsl_min": 0.70,
    "dsl_max": 1.30,
    "points": [[35.0, 29.5], [35.3, 30.5], [35.5, 31.5], [35.6, 31.8]],
    "feasible": true,
    "cost_min": 10,
    "cost_max": 45
  },
  {
    "id": "turpan-depression",
    "name": "Dépression de Turpan",
    "region": "Asie Centrale",
    "dsl_min": 0.55,
    "dsl_max": 1.05,
    "points": [[88.5, 42.5], [89.5, 42.8], [90.5, 43.0], [91.0, 43.5]],
    "feasible": true,
    "cost_min": 25,
    "cost_max": 90
  },
  {
    "id": "sahara-niger-canal",
    "name": "Canal Méditerranée → Niger",
    "region": "Afrique de l'Ouest",
    "dsl_min": 0.48,
    "dsl_max": 0.90,
    "points": [[9.0, 37.0], [9.0, 33.0], [9.0, 28.0], [9.0, 22.0], [8.0, 17.0]],
    "feasible": false,
    "cost_min": 120,
    "cost_max": 450
  },
  {
    "id": "aral-sea-restoration",
    "name": "Restauration Mer d'Aral",
    "region": "Asie Centrale",
    "dsl_min": 0.42,
    "dsl_max": 0.78,
    "points": [[60.0, 46.0], [59.0, 45.0], [58.5, 44.5], [58.0, 43.8]],
    "feasible": true,
    "cost_min": 15,
    "cost_max": 55
  },
  {
    "id": "atacama-pacific",
    "name": "Canal Atacama — Pacifique",
    "region": "Amérique du Sud",
    "dsl_min": 0.35,
    "dsl_max": 0.65,
    "points": [[-70.5, -20.0], [-69.5, -21.0], [-68.5, -22.0], [-67.5, -23.0]],
    "feasible": false,
    "cost_min": 200,
    "cost_max": 600
  },
  {
    "id": "rub-al-khali-basin",
    "name": "Grand Erg du Rub al-Khali",
    "region": "Péninsule Arabique",
    "dsl_min": 0.28,
    "dsl_max": 0.52,
    "points": [[55.0, 22.0], [53.0, 21.0], [51.0, 20.0], [49.0, 19.5]],
    "feasible": true,
    "cost_min": 20,
    "cost_max": 75
  },
  {
    "id": "lake-chad-expansion",
    "name": "Expansion Lac Tchad",
    "region": "Afrique Centrale",
    "dsl_min": 0.24,
    "dsl_max": 0.44,
    "points": [[13.5, 13.5], [14.0, 14.0], [14.5, 14.5], [15.0, 15.0]],
    "feasible": true,
    "cost_min": 12,
    "cost_max": 40
  },
  {
    "id": "tarim-basin-xinjiang",
    "name": "Bassin du Tarim (Xinjiang)",
    "region": "Asie Orientale",
    "dsl_min": 0.21,
    "dsl_max": 0.39,
    "points": [[80.0, 40.0], [82.0, 39.5], [84.0, 39.0], [86.0, 38.5]],
    "feasible": false,
    "cost_min": 180,
    "cost_max": 500
  },
  {
    "id": "mediterranean-sahara-east",
    "name": "Canal Méditerranée → Sahara Est",
    "region": "Afrique du Nord",
    "dsl_min": 0.18,
    "dsl_max": 0.34,
    "points": [[25.0, 31.5], [25.0, 28.0], [25.0, 24.0], [25.0, 20.0]],
    "feasible": false,
    "cost_min": 90,
    "cost_max": 320
  },
  {
    "id": "dasht-e-kavir-iran",
    "name": "Désert de Kavir (Iran)",
    "region": "Moyen-Orient",
    "dsl_min": 0.16,
    "dsl_max": 0.30,
    "points": [[52.0, 34.5], [53.0, 34.0], [54.0, 33.5], [55.0, 33.0]],
    "feasible": true,
    "cost_min": 30,
    "cost_max": 100
  },
  {
    "id": "great-artesian-australia",
    "name": "Grand Bassin Artésien — Australie",
    "region": "Océanie",
    "dsl_min": 0.14,
    "dsl_max": 0.26,
    "points": [[135.0, -25.0], [136.0, -26.0], [137.0, -27.0], [138.0, -28.0]],
    "feasible": true,
    "cost_min": 40,
    "cost_max": 130
  },
  {
    "id": "patagonia-argentina",
    "name": "Canal Patagonie Atlantique",
    "region": "Amérique du Sud",
    "dsl_min": 0.12,
    "dsl_max": 0.22,
    "points": [[-65.0, -42.0], [-65.5, -43.0], [-66.0, -44.0], [-66.5, -45.0]],
    "feasible": true,
    "cost_min": 8,
    "cost_max": 30
  },
  {
    "id": "salton-sea-california",
    "name": "Salton Sea — Californie",
    "region": "Amérique du Nord",
    "dsl_min": 0.10,
    "dsl_max": 0.18,
    "points": [[-115.5, 32.5], [-115.3, 32.8], [-115.1, 33.0], [-115.0, 33.2]],
    "feasible": false,
    "cost_min": 15,
    "cost_max": 50
  },
  {
    "id": "bonneville-salt-flats",
    "name": "Bonneville Salt Flats — Utah",
    "region": "Amérique du Nord",
    "dsl_min": 0.09,
    "dsl_max": 0.17,
    "points": [[-113.5, 40.8], [-113.0, 40.7], [-112.5, 40.8], [-112.0, 40.9]],
    "feasible": false,
    "cost_min": 20,
    "cost_max": 65
  },
  {
    "id": "lake-eyre-australia",
    "name": "Lac Eyre (Kati Thanda) — Australie",
    "region": "Océanie",
    "dsl_min": 0.08,
    "dsl_max": 0.15,
    "points": [[137.5, -28.5], [136.5, -29.0], [135.5, -29.5], [135.0, -29.8]],
    "feasible": true,
    "cost_min": 35,
    "cost_max": 110
  },
  {
    "id": "thar-desert-india",
    "name": "Désert du Thar — Inde",
    "region": "Asie du Sud",
    "dsl_min": 0.07,
    "dsl_max": 0.13,
    "points": [[70.5, 27.0], [71.0, 26.5], [71.5, 26.0], [72.0, 25.5]],
    "feasible": true,
    "cost_min": 10,
    "cost_max": 35
  },
  {
    "id": "danakil-depression",
    "name": "Dépression de Danakil — Éthiopie",
    "region": "Afrique de l'Est",
    "dsl_min": 0.06,
    "dsl_max": 0.11,
    "points": [[41.5, 14.0], [41.0, 13.5], [40.5, 13.0], [40.0, 12.5]],
    "feasible": true,
    "cost_min": 18,
    "cost_max": 60
  },
  {
    "id": "gobi-desert-mongolia",
    "name": "Désert de Gobi — Mongolie",
    "region": "Asie Orientale",
    "dsl_min": 0.05,
    "dsl_max": 0.09,
    "points": [[103.0, 43.5], [104.0, 43.0], [105.0, 42.5], [106.0, 42.0]],
    "feasible": false,
    "cost_min": 150,
    "cost_max": 450
  },
  {
    "id": "namib-desert-namibia",
    "name": "Désert du Namib — Namibie",
    "region": "Afrique Australe",
    "dsl_min": 0.04,
    "dsl_max": 0.08,
    "points": [[14.5, -22.0], [15.0, -23.0], [15.5, -24.0], [16.0, -25.0]],
    "feasible": false,
    "cost_min": 25,
    "cost_max": 80
  },
  {
    "id": "salar-de-uyuni-bolivia",
    "name": "Salar d'Uyuni — Bolivie",
    "region": "Amérique du Sud",
    "dsl_min": 0.03,
    "dsl_max": 0.06,
    "points": [[-68.5, -20.5], [-67.5, -20.8], [-67.0, -21.2], [-66.5, -21.5]],
    "feasible": false,
    "cost_min": 80,
    "cost_max": 250
  },
  {
    "id": "draa-valley-morocco",
    "name": "Vallée du Draa — Maroc",
    "region": "Afrique du Nord",
    "dsl_min": 0.02,
    "dsl_max": 0.04,
    "points": [[-5.5, 30.5], [-6.0, 29.5], [-6.5, 28.5], [-7.0, 27.5]],
    "feasible": true,
    "cost_min": 5,
    "cost_max": 20
  },
  {
    "id": "se-europe-danube-delta",
    "name": "Delta du Danube — Europe de l'Est",
    "region": "Europe",
    "dsl_min": 0.01,
    "dsl_max": 0.03,
    "points": [[29.5, 45.5], [29.8, 45.3], [30.0, 45.1], [30.2, 45.0]],
    "feasible": true,
    "cost_min": 2,
    "cost_max": 8
  }
]
```
  </action>
  <verify>
    <automated>node -e "const d=require('./src/data/candidates.json'); console.assert(d.length===25,'count'); console.assert(d[0].id==='qattara-depression','#1'); console.assert(d.every(c=>Array.isArray(c.points)&&c.points.length>=2),'points'); console.log('OK: 25 candidats, Qattara #1')"</automated>
  </verify>
  <done>candidates.json contient exactement 25 candidats valides, Qattara Depression en #1, triés par dsl_max décroissant, tous les champs présents</done>
</task>

<task type="tdd">
  <name>Task 3: Créer src/tests/candidates.test.ts — tests RED</name>
  <files>src/tests/candidates.test.ts</files>
  <behavior>
    - Tests RED : ils échouent tant que useCandidates et loadCandidate n'existent pas (T02 les fera passer)
    - Test 1 : useCandidates() retourne 25 candidats triés par dsl_max décroissant
    - Test 2 : useCandidates() retourne Qattara Depression en premier
    - Test 3 : loadCandidate(candidate) ajoute un Canal dans le store et le sélectionne automatiquement
    - Test 4 : loadCandidate est non-destructif — les canaux existants ne sont pas supprimés
    - Test 5 : le Canal créé par loadCandidate a les points du candidat et un name = candidate.name
    - Les tests importent depuis des chemins qui n'existent pas encore (src/hooks/useCandidates, store action loadCandidate)
  </behavior>
  <action>
Créer src/tests/candidates.test.ts :

```typescript
// src/tests/candidates.test.ts
// Wave 0 — Tests RED. useCandidates n'existe pas encore.
// T02 (Wave 1) implémente le hook et l'action store pour faire passer ces tests en GREEN.
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCandidates } from '../hooks/useCandidates'
import { useCanalStore } from '../store/canalStore'
import type { CanalCandidate } from '../types/candidate'

// Fixture candidat minimal
const MOCK_CANDIDATE: CanalCandidate = {
  id: 'test-canal',
  name: 'Canal Test',
  region: 'Test Region',
  dsl_min: 1.0,
  dsl_max: 2.0,
  points: [[2.35, 48.85], [5.0, 46.0]],
  feasible: true,
  cost_min: 10,
  cost_max: 40,
}

describe('useCandidates — liste triée (IA-01)', () => {
  it('retourne exactement 25 candidats', () => {
    const { result } = renderHook(() => useCandidates())
    expect(result.current).toHaveLength(25)
  })

  it('retourne les candidats triés par dsl_max décroissant', () => {
    const { result } = renderHook(() => useCandidates())
    const candidates = result.current
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].dsl_max).toBeGreaterThanOrEqual(candidates[i].dsl_max)
    }
  })

  it('place Qattara Depression en premier candidat', () => {
    const { result } = renderHook(() => useCandidates())
    expect(result.current[0].id).toBe('qattara-depression')
  })
})

describe('loadCandidate — chargement non-destructif (IA-03)', () => {
  beforeEach(() => {
    // Réinitialiser le store entre les tests
    useCanalStore.getState().clearAll()
  })

  it('ajoute un canal dans le store sans supprimer les existants', async () => {
    const store = useCanalStore.getState()

    // Charger un premier canal
    await act(async () => {
      store.loadCandidate(MOCK_CANDIDATE)
    })
    expect(useCanalStore.getState().canals).toHaveLength(1)

    // Charger un deuxième — le premier doit rester
    const MOCK_2: CanalCandidate = { ...MOCK_CANDIDATE, id: 'test-canal-2', name: 'Canal Test 2' }
    await act(async () => {
      store.loadCandidate(MOCK_2)
    })
    expect(useCanalStore.getState().canals).toHaveLength(2)
  })

  it('sélectionne automatiquement le canal chargé (IA-03)', async () => {
    await act(async () => {
      useCanalStore.getState().loadCandidate(MOCK_CANDIDATE)
    })
    const state = useCanalStore.getState()
    const loaded = state.canals.find((c) => c.name === 'Canal Test')
    expect(loaded).toBeDefined()
    expect(state.selectedCanalId).toBe(loaded!.id)
  })

  it('crée un Canal avec les points du candidat', async () => {
    await act(async () => {
      useCanalStore.getState().loadCandidate(MOCK_CANDIDATE)
    })
    const canal = useCanalStore.getState().canals[0]
    expect(canal.points).toEqual(MOCK_CANDIDATE.points)
    expect(canal.name).toBe(MOCK_CANDIDATE.name)
  })
})
```
  </action>
  <verify>
    <automated>npx vitest run src/tests/candidates.test.ts 2>&1 | tail -20</automated>
  </verify>
  <done>Tests s'exécutent et échouent avec des erreurs d'import (module not found) — confirmant l'état RED attendu</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| JSON statique → TypeScript | Données bundlées lues à l'import — pas d'entrée utilisateur |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-08-01 | Tampering | candidates.json | accept | Données bundlées dans le build — modifiable uniquement en développement local, pas de surface d'attaque à runtime |
| T-08-02 | Information Disclosure | dsl_min/dsl_max | accept | Données publiques/estimatives — aucune info sensible exposée |
</threat_model>

<verification>
- `npx tsc --noEmit` passe sans erreur sur src/types/candidate.ts
- `node -e "..."` confirme 25 candidats, Qattara #1
- `npx vitest run src/tests/candidates.test.ts` échoue avec "module not found" (RED attendu)
</verification>

<success_criteria>
- CanalCandidate type défini avec tous les champs requis (id, name, region, dsl_min, dsl_max, points, feasible, cost_min, cost_max)
- candidates.json contient exactement 25 candidats triés par dsl_max décroissant, Qattara #1, couvrant tous les continents habités
- Tests RED en place — échouent sur import manquant useCandidates et loadCandidate
</success_criteria>

<output>
Après completion, créer `.planning/phases/08-candidats-ia/08-T01-SUMMARY.md`
</output>

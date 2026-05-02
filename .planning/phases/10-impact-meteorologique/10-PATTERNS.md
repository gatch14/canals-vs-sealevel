# Phase 10: Impact Météorologique - Pattern Map

**Mapped:** 2026-05-02
**Files analyzed:** 5 (3 nouveaux, 1 étendu, 1 test nouveau)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/meteorology.ts` | model | transform | `src/types/desalination.ts` | exact |
| `src/lib/meteorologyEngine.ts` | service | transform | `src/lib/desalinationEngine.ts` | exact |
| `src/hooks/useMeteorology.ts` | hook | request-response | `src/hooks/useDesalination.ts` | exact |
| `src/components/EcologyPanel.tsx` | component | request-response | même fichier — section dessalement | exact |
| `src/tests/meteorologyEngine.test.ts` | test | — | `src/tests/desalinationEngine.test.ts` | exact |

---

## Pattern Assignments

### `src/types/meteorology.ts` (model, transform)

**Analog:** `src/types/desalination.ts` (lignes 1–45)

**Imports pattern** (lignes 1–5) :
```typescript
// src/types/desalination.ts — lignes 1-5
import type { Coord } from './canal'
import type { Interval } from './calculation'
```

**Union type pattern** (ligne 15) :
```typescript
// src/types/desalination.ts — ligne 15
export type EcosystemImpactLevel = 'low' | 'neutral'
// → Pour météo : export type WeatherRisk = 'low' | 'moderate' | 'high'
```

**Params interface pattern** (lignes 20–27) :
```typescript
// src/types/desalination.ts — lignes 20-27
export interface DesalinationParams {
  /** Longueur totale du canal (km) */
  lengthKm: number
  /** Points du tracé [lng, lat] WGS84 */
  points: Coord[]
  /** Facteur solaire : 1.0 si latitude < 35°N/S, 0.7 sinon */
  solarFactor: number
}
```

**Result interface pattern** (lignes 32–45) :
```typescript
// src/types/desalination.ts — lignes 32-45
export interface DesalinationResult {
  /** ... (DESAL-02, UX-01) */
  waterProduction: Interval
  /** ... (DESAL-03, UX-01) */
  saltValue: Interval
  /** ... (DESAL-04, UX-01) */
  habitableZones: Interval
  /** ... (DESAL-05, UX-01) */
  desalinationCost: Interval
  /** Niveau d'impact — enum (ECO-05) */
  ecosystemImpact: EcosystemImpactLevel
}
// → Adapter : MeteorologyResult avec evaporationKm3, influenceRadiusKm,
//   precipitationMmY, coolingDeltaC (4× Interval) + weatherRisk: WeatherRisk
```

**Convention JSDoc :** Chaque champ porte son ID requirement (ex. `// METEO-01`) et `UX-01` si c'est un `Interval`.

---

### `src/lib/meteorologyEngine.ts` (service, transform)

**Analog:** `src/lib/desalinationEngine.ts` (lignes 1–140)

**Imports pattern** (lignes 1–9) :
```typescript
// src/lib/desalinationEngine.ts — lignes 1-9
import { booleanIntersects, lineString } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import desertZones from '../data/desertZones.geojson'
import type { Coord } from '../types/canal'
import type { Interval } from '../types/calculation'
import type { DesalinationParams, DesalinationResult, EcosystemImpactLevel } from '../types/desalination'
// → Remplacer le dernier import par : MeteorologyParams, MeteorologyResult, WeatherRisk
// → Ajouter : import { length } from '@turf/turf' (nécessaire si calcul longueur dans engine)
```

**Guard + booleanIntersects pattern** (lignes 19–34) :
```typescript
// src/lib/desalinationEngine.ts — lignes 19-34
export function classifyEcosystem(
  points: Coord[],
  desertFeatures: FeatureCollection,
): EcosystemImpactLevel {
  if (points.length < 2) return 'neutral'      // ← guard obligatoire

  const line = lineString(points)

  for (const feature of desertFeatures.features) {
    if (booleanIntersects(line, feature)) {
      return 'low'
    }
  }
  return 'neutral'
}
// → Adapter pour calcAridityFactor : retourner 1.0 si intersection désert, 0.4 sinon
```

**Coord = [lng, lat] — accès latitude** (ligne 55) :
```typescript
// src/lib/desalinationEngine.ts — ligne 55
const allTropical = points.every(([_lng, lat]) => Math.abs(lat) < 35)
// ↑ Destructuring [_lng, lat] — index 1 = latitude (Pitfall Coord inversé)
```

**Fonction pure Interval pattern** (lignes 66–73) :
```typescript
// src/lib/desalinationEngine.ts — lignes 66-73
export function calcWaterProduction(
  nodes: number,
  solarFactor: number,
): Interval {
  if (nodes === 0) return [0, 0]           // ← guard entrée nulle
  const base = nodes * 10_000 * solarFactor
  return [base * 0.8, base * 1.2]          // ← [min, max] avec fourchette ±20%
}
// → Pattern à copier pour calcEvaporation, calcInfluenceRadius, etc.
//   Remplacer le guard "nodes === 0" par "surfaceKm2 === 0" ou "lengthKm === 0"
```

**Orchestrateur pattern** (lignes 125–140) :
```typescript
// src/lib/desalinationEngine.ts — lignes 125-140
export function computeDesalinationAnalysis(
  params: DesalinationParams,
  desertFeatures: FeatureCollection,
): DesalinationResult | null {
  if (params.points.length < 2) return null    // ← guard obligatoire

  const nodes = calcDesalinationNodes(params.lengthKm)
  return {
    nodes,
    waterProduction: calcWaterProduction(nodes, params.solarFactor),
    saltValue: calcSaltValue(nodes, params.solarFactor),
    habitableZones: calcHabitableZones(nodes),
    desalinationCost: calcDesalinationCost(nodes),
    ecosystemImpact: classifyEcosystem(params.points, desertFeatures),
  }
}
// → Adapter : computeMeteorologyAnalysis(params: MeteorologyParams, desertFeatures)
//   Calculer aridityFactor + surfaceKm2 en tête, puis appeler les 5 fonctions pures
```

**Calcul surfaceKm2 — conversion widthM/1000 obligatoire** (Pitfall 4 RESEARCH.md) :
```typescript
// Pattern correct (à écrire dans meteorologyEngine.ts) :
const surfaceKm2 = (params.widthM / 1000) * params.lengthKm
// ↑ widthM en mètres → diviser par 1000 avant de multiplier par lengthKm (km)
//   Sinon : surface 1000× trop grande → évaporation aberrante (millions km³/an)
```

---

### `src/hooks/useMeteorology.ts` (hook, request-response)

**Analog:** `src/hooks/useDesalination.ts` (lignes 1–31)

**Imports pattern** (lignes 1–12) :
```typescript
// src/hooks/useDesalination.ts — lignes 1-12
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { DesalinationResult } from '../types/desalination'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection
// ↑ Cast obligatoire — geojsonPlugin de vite.config.ts retourne `unknown`
```

**useMemo + find() à l'intérieur — pattern critique** (lignes 14–31) :
```typescript
// src/hooks/useDesalination.ts — lignes 14-31
export function useDesalination(): DesalinationResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  return useMemo<DesalinationResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null  // ← find() DANS useMemo
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)

    return computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )
  }, [selectedCanalId, canals])
}
```

**Différence clé Phase 10 :** `useMeteorology` ajoute `calcParams.width` dans les dépendances useMemo et dans le store selector, car `widthM` est un input du moteur. Pas d'état `enabled` (calcul automatique — cf. anti-pattern RESEARCH.md).

```typescript
// Adaptation pour useMeteorology.ts :
const calcParams = useCanalStore((s) => s.calcParams)  // ← ajout vs useDesalination

return useMemo<MeteorologyResult | null>(() => {
  // ... find() ici, calcul lengthKm via Turf ...
  return computeMeteorologyAnalysis(
    { lengthKm, widthM: calcParams.width, points: selectedCanal.points },
    DESERT_FEATURES,
  )
}, [selectedCanalId, canals, calcParams.width])  // ← calcParams.width dans deps
```

**Montage dans SidePanel.tsx :** `useDesalination()` n'est PAS appelé dans `SidePanel.tsx` — il est appelé dans `EcologyPanel.tsx` (ligne 43). Le pattern de `useMeteorology()` doit suivre la même logique : appel dans `EcologyPanel.tsx`.

---

### `src/components/EcologyPanel.tsx` (component, extension)

**Analog:** même fichier — section dessalement (lignes 182–254)

**Import hook pattern** (lignes 8–9) :
```typescript
// src/components/EcologyPanel.tsx — lignes 8-9
import { useEcology } from '../hooks/useEcology'
import { useDesalination } from '../hooks/useDesalination'
// → Ajouter ligne : import { useMeteorology } from '../hooks/useMeteorology'
```

**Appel hook dans composant** (lignes 39–44) :
```typescript
// src/components/EcologyPanel.tsx — lignes 39-44
const ecologyResult = useEcology()
const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
const toggleDesalination = useCanalStore((s) => s.toggleDesalination)
const desalinationResult = useDesalination()
// → Ajouter : const meteorologyResult = useMeteorology()
// → Pas de toggle store — calcul automatique (différence vs dessalement)
```

**Structure section accordéon** (lignes 184–254) :
```tsx
// src/components/EcologyPanel.tsx — lignes 184-254
{!noCanal && (
  <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
    {/* ... contenu section ... */}
  </div>
)}
// → Copier ce wrapper div pour la section Météo (sans le bouton toggle)
// → Condition : {!noCanal && meteorologyResult && ( ... )}
```

**Pattern dl/dt/dd par métrique** (lignes 210–230) :
```tsx
// src/components/EcologyPanel.tsx — lignes 210-230
<dl className="flex flex-col gap-1 mt-1">
  <div className="flex flex-col gap-[2px]">
    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">
      N&oelig;uds ({desalinationResult.nodes})
    </dt>
    <dd className="text-[13px] font-semibold text-white">
      {formatInterval(desalinationResult.waterProduction, 'm³/jour', 0)}
    </dd>
  </div>
  {/* ... autres métriques ... */}
</dl>
// → Copier pour chaque métrique météo : evaporationKm3, influenceRadiusKm,
//   precipitationMmY, coolingDeltaC — même structure dt/dd + formatInterval
```

**Pattern badge coloré — alertes existantes** (lignes 145–178) :
```tsx
// src/components/EcologyPanel.tsx — lignes 145-168
// Alerte rouge ECO-03 :
<p className="text-[11px] text-red-400 font-semibold uppercase tracking-wider ...">
// Alerte amber ECO-04 :
<p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider ...">
// → Badge risque météo : text-green-400 (low) / text-amber-400 (moderate) / text-red-400 (high)
```

**Fonction `formatInterval` disponible localement** (lignes 22–24) :
```typescript
// src/components/EcologyPanel.tsx — lignes 22-24
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}
// ↑ Déjà dans le fichier — NE PAS dupliquer. Utiliser directement.
```

---

### `src/tests/meteorologyEngine.test.ts` (test)

**Analog:** `src/tests/desalinationEngine.test.ts` (lignes 1–257)

**En-tête fichier pattern** (lignes 1–19) :
```typescript
// src/tests/desalinationEngine.test.ts — lignes 1-19
// Wave 0 — Tests RED. Les stubs retournent [0,0] et 0.
// T02 (Wave 1) implémente les fonctions pour faire passer ces tests en GREEN.
import { describe, it, expect } from 'vitest'
import {
  classifyEcosystem,
  calcDesalinationNodes,
  // ... toutes les fonctions exportées ...
  computeDesalinationAnalysis,
} from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Coord } from '../types/canal'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection
// ↑ Import geojson direct — geojsonPlugin vite.config.ts gère ça (Pitfall 5 RESEARCH.md)
```

**Structure describe/it par fonction** (lignes 22–100) :
```typescript
// src/tests/desalinationEngine.test.ts — lignes 22-44
describe('classifyEcosystem — impact eau salée (ECO-05)', () => {
  it('retourne low pour des points en zone désertique (Sahara central)', () => {
    const saharaPoints: Coord[] = [[5.0, 25.0], [7.0, 23.0], [9.0, 21.0]]
    const result = classifyEcosystem(saharaPoints, DESERT_FEATURES)
    expect(result).toBe('low')
  })
  it('retourne neutral pour des points hors désert (Europe tempérée)', () => {
    const europePoints: Coord[] = [[2.35, 48.85], [4.9, 52.37], [13.4, 52.5]]
    expect(classifyEcosystem(europePoints, DESERT_FEATURES)).toBe('neutral')
  })
})
// → Pattern : 1 describe par fonction exportée, avec ID requirement dans le label
//   Toujours tester : désert (Sahara ~[5, 25]) ET non-désert (Europe ~[2.35, 48.85])
```

**Pattern test Interval** (lignes 104–136) :
```typescript
// src/tests/desalinationEngine.test.ts — lignes 105-115
it('retourne [0, 0] pour 0 nœuds', () => {
  const result = calcWaterProduction(0, 1.0)
  expect(result[0]).toBe(0)
  expect(result[1]).toBe(0)
})
it('retourne un intervalle positif [min > 0, max > min] pour 1 nœud solaire', () => {
  const result = calcWaterProduction(1, 1.0)
  expect(result[0]).toBeGreaterThan(0)
  expect(result[1]).toBeGreaterThan(result[0])   // ← toujours vérifier max > min
})
// → Copier pour chaque Interval météo.
//   Pour coolingDeltaC : expect(result[0]).toBeLessThan(0) (valeurs négatives)
```

**Pattern test orchestrateur** (lignes 214–257) :
```typescript
// src/tests/desalinationEngine.test.ts — lignes 214-221
describe('computeDesalinationAnalysis — orchestrateur', () => {
  it('retourne null si points.length < 2', () => {
    const result = computeDesalinationAnalysis(
      { lengthKm: 500, points: [[5.0, 25.0]], solarFactor: 1.0 },
      DESERT_FEATURES,
    )
    expect(result).toBeNull()
  })
  // ...
})
// → Copier pour computeMeteorologyAnalysis, adapter les paramètres
//   Toujours tester : null guard + résultat valide complet + cas dégénéré
```

---

## Shared Patterns

### Type `Interval` — import et usage
**Source:** `src/types/calculation.ts` (ligne 8)
**Apply to:** `meteorology.ts`, `meteorologyEngine.ts`, `EcologyPanel.tsx`
```typescript
// src/types/calculation.ts — ligne 8
export type Interval = [number, number]
// Importé dans les engines : import type { Interval } from '../types/calculation'
// Importé dans les types : import type { Interval } from './calculation'
// Importé dans les composants : import type { Interval } from '../types/calculation'
```

### Guard `points.length < 2` — entrées invalides
**Source:** `src/lib/desalinationEngine.ts` (lignes 21, 129)
**Apply to:** `meteorologyEngine.ts` — fonctions avec `points: Coord[]` + orchestrateur
```typescript
// Pattern exact (lignes 21 et 129) :
if (points.length < 2) return 'neutral'      // dans les classificateurs
if (params.points.length < 2) return null    // dans l'orchestrateur
```

### Cast GeoJSON — import desertZones
**Source:** `src/hooks/useDesalination.ts` (ligne 12) et `src/tests/desalinationEngine.test.ts` (ligne 19)
**Apply to:** `useMeteorology.ts`, `meteorologyEngine.test.ts`
```typescript
const DESERT_FEATURES = desertZones as unknown as FeatureCollection
// Obligatoire partout où desertZones.geojson est importé
```

### Destructuring Coord `[_lng, lat]` — latitude en index 1
**Source:** `src/lib/desalinationEngine.ts` (ligne 55)
**Apply to:** `meteorologyEngine.ts` — toute heuristique basée sur la latitude
```typescript
// src/lib/desalinationEngine.ts — ligne 55
const allTropical = points.every(([_lng, lat]) => Math.abs(lat) < 35)
// GeoJSON = [longitude, latitude] — index 1 = lat, JAMAIS index 0
```

### Classes Tailwind — cohérence visuelle
**Source:** `src/components/EcologyPanel.tsx` (lignes 63–258)
**Apply to:** `EcologyPanel.tsx` — nouvelle section MeteorologySection
```typescript
// Wrapper section : "border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2"
// Label section :   "text-[11px] text-gray-400 uppercase tracking-wider"
// Label dt :        "text-[11px] text-gray-500 uppercase tracking-wider"
// Valeur dd :       "text-[13px] font-semibold text-white"
// Badge low :       "text-green-400"
// Badge moderate :  "text-amber-400"
// Badge high :      "text-red-400"
```

---

## No Analog Found

Aucun fichier sans analogue — tous les fichiers de la Phase 10 ont un correspondant exact dans le code source existant.

---

## Metadata

**Analog search scope:** `src/lib/`, `src/hooks/`, `src/types/`, `src/components/`, `src/tests/`
**Files scanned:** 5 analogs lus intégralement
**Pattern extraction date:** 2026-05-02

---
phase: 09-eau-salee-dessalement
plan: T03
type: execute
wave: 3
depends_on: [09-T02]
files_modified:
  - src/store/canalStore.ts
  - src/hooks/useDesalination.ts
  - src/components/EcologyPanel.tsx
  - src/components/SidePanel.tsx
autonomous: true
requirements: [ECO-05, DESAL-01, DESAL-02, DESAL-03, DESAL-04, DESAL-05]

must_haves:
  truths:
    - "L'utilisateur voit un toggle 'Nœuds dessalement' dans EcologyPanel"
    - "Quand le toggle est activé, une section accordéon affiche eau douce [min–max] m³/jour, valeur sel [min–max] €/an, zones habitables [min–max] km²"
    - "Si ecosystemImpact === 'critical', une boîte rouge d'alerte est affichée (visible même sans toggle)"
    - "Le coût dessalement est calculé et disponible dans le résultat (intégrable dans CalculationPanel)"
    - "SidePanel appelle useDesalination() après useEcology()"
    - "Aucun nouveau panneau top-level — extension de EcologyPanel uniquement"
  artifacts:
    - path: "src/store/canalStore.ts"
      provides: "desalinationEnabled: boolean + toggleDesalination action"
      contains: "desalinationEnabled"
    - path: "src/hooks/useDesalination.ts"
      provides: "Hook orchestrant computeDesalinationAnalysis via useMemo — même pattern que useEcology"
      exports: [useDesalination]
    - path: "src/components/EcologyPanel.tsx"
      provides: "Toggle dessalement + DesalinationSection conditionnelle + alerte critique ECO-05"
      contains: "DesalinationSection"
    - path: "src/components/SidePanel.tsx"
      provides: "Appel useDesalination() après useEcology()"
      contains: "useDesalination"
  key_links:
    - from: "src/hooks/useDesalination.ts"
      to: "src/lib/desalinationEngine.ts"
      via: "computeDesalinationAnalysis + calcSolarFactor"
      pattern: "computeDesalinationAnalysis"
    - from: "src/components/EcologyPanel.tsx"
      to: "src/hooks/useDesalination.ts"
      via: "useDesalination()"
      pattern: "useDesalination"
    - from: "src/components/EcologyPanel.tsx"
      to: "src/store/canalStore.ts"
      via: "useCanalStore(s => s.desalinationEnabled)"
      pattern: "desalinationEnabled"
---

<objective>
Câbler le moteur de dessalement dans l'UI : store toggle, hook useMemo, et extension de EcologyPanel avec la section dessalement + alerte eau salée critique.

Purpose: Rendre les résultats du moteur visibles à l'utilisateur sans créer de nouveau panneau top-level — extension naturelle d'EcologyPanel, cohérente avec l'architecture existante.

Output: canalStore.ts étendu, useDesalination.ts, EcologyPanel.tsx étendu, SidePanel.tsx mis à jour
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-eau-salee-dessalement/09-T02-SUMMARY.md

<interfaces>
<!-- Interfaces existantes que T03 consomme directement -->

From src/hooks/useEcology.ts (pattern exact à dupliquer pour useDesalination):
```typescript
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import { computeEcologyAnalysis } from '../lib/ecologyEngine'
import type { EcologyResult } from '../types/ecology'

export function useEcology(): EcologyResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
  return useMemo<EcologyResult | null>(() => {
    if (!selectedCanal) return null
    return computeEcologyAnalysis(selectedCanal)
  }, [selectedCanal])
}
```

From src/lib/desalinationEngine.ts (créé en T02):
```typescript
export function calcSolarFactor(points: Coord[]): number
export function calcDesalinationNodes(lengthKm: number): number
export function computeDesalinationAnalysis(
  params: DesalinationParams,
  desertFeatures: FeatureCollection,
): DesalinationResult | null
```

From src/types/desalination.ts (créé en T01):
```typescript
export type EcosystemImpactLevel = 'low' | 'neutral' | 'critical'
export interface DesalinationResult {
  nodes: number
  waterProduction: Interval  // m³/jour
  saltValue: Interval        // €/an
  habitableZones: Interval   // km²
  desalinationCost: Interval // €
  ecosystemImpact: EcosystemImpactLevel
}
```

From src/store/canalStore.ts (état actuel — à étendre):
```typescript
interface CanalStore {
  // ... tous les champs existants ...
  // Candidats IA — Phase 8
  loadCandidate: (candidate: CanalCandidate) => void
  // À AJOUTER :
  // desalinationEnabled: boolean
  // toggleDesalination: () => void
}
```

From src/components/EcologyPanel.tsx (structure accordéon à étendre):
```typescript
// Pattern alerte rouge existant (ECO-03 endorheïque) — copier pour alerte eau salée
<div role="alert" className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-1">
  <p className="text-[11px] text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1">
    <AlertCircle size={12} className="shrink-0" />
    Alerte — Bassin endorheïque
  </p>
  <p className="text-[12px] text-red-300 leading-relaxed">...</p>
</div>
```

From src/components/SidePanel.tsx — pattern d'appel hook actuel:
```typescript
// useElevation, useCalculation, useEcology, usePersistence, useCandidates
// sont tous appelés dans SidePanel — ajouter useDesalination() après useEcology()
```

Format d'affichage UX-01 (copier depuis EcologyPanel):
```typescript
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Étendre canalStore.ts + créer useDesalination.ts</name>
  <files>src/store/canalStore.ts, src/hooks/useDesalination.ts</files>
  <action>
**1. src/store/canalStore.ts — ajouter desalinationEnabled + toggleDesalination**

Dans l'interface CanalStore, après `loadCandidate`, ajouter :
```typescript
// Dessalement — Phase 9
desalinationEnabled: boolean
toggleDesalination: () => void
```

Dans l'implémentation `create<CanalStore>()`, initialiser :
```typescript
desalinationEnabled: false,
toggleDesalination: () => set((state) => ({ desalinationEnabled: !state.desalinationEnabled })),
```

Dans `clearAll`, réinitialiser à `false` :
```typescript
desalinationEnabled: false,
```

**2. src/hooks/useDesalination.ts — créer le hook (pattern exact useEcology)**

```typescript
// src/hooks/useDesalination.ts
// Hook orchestrateur Phase 9 — lit le canal sélectionné, mémoïse l'analyse dessalement.
// Pattern identique à useEcology.ts — useMemo obligatoire (Pitfall P2 RESEARCH.md).
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import {
  computeDesalinationAnalysis,
  calcSolarFactor,
} from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { DesalinationResult } from '../types/desalination'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useDesalination(): DesalinationResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  return useMemo<DesalinationResult | null>(() => {
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    // Calculer lengthKm via Turf — import length depuis @turf/turf
    // Si pas d'élévation chargée, utiliser Turf length directement
    const { length: turfLength, lineString } = await import('@turf/turf').catch(() => ({ length: null, lineString: null }))
    // Note : useMemo est synchrone — utiliser l'import statique
    return computeDesalinationAnalysis(
      {
        lengthKm: 0, // remplacé ci-dessous
        points: selectedCanal.points,
        solarFactor: calcSolarFactor(selectedCanal.points),
      },
      DESERT_FEATURES,
    )
  }, [selectedCanal])
}
```

ATTENTION : useMemo est synchrone — pas d'await possible. Corriger l'implémentation ci-dessus :
- Importer `length` et `lineString` depuis `@turf/turf` en haut du fichier (import statique)
- Calculer `lengthKm = length(lineString(selectedCanal.points), { units: 'kilometers' })`
- Passer la valeur calculée à `computeDesalinationAnalysis`

Implémentation correcte à écrire :

```typescript
// src/hooks/useDesalination.ts
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { computeDesalinationAnalysis, calcSolarFactor } from '../lib/desalinationEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { DesalinationResult } from '../types/desalination'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useDesalination(): DesalinationResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  return useMemo<DesalinationResult | null>(() => {
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)

    return computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )
  }, [selectedCanal])
}
```
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -v "^$" | head -20</automated>
  </verify>
  <done>canalStore.ts avec desalinationEnabled + toggleDesalination. useDesalination.ts exportant le hook. TypeScript sans erreur.</done>
</task>

<task type="auto">
  <name>Task 2: Étendre EcologyPanel.tsx + mettre à jour SidePanel.tsx</name>
  <files>src/components/EcologyPanel.tsx, src/components/SidePanel.tsx</files>
  <action>
**1. src/components/EcologyPanel.tsx — ajouter alerte ECO-05 + section dessalement**

Modifications à apporter au fichier existant :

a) Ajouter les imports manquants en haut du fichier :
```typescript
import { useDesalination } from '../hooks/useDesalination'
// AlertCircle et ChevronDown sont déjà importés
```

b) Dans le corps du composant EcologyPanel, après `const ecologyResult = useEcology()`, ajouter :
```typescript
const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
const toggleDesalination = useCanalStore((s) => s.toggleDesalination)
const desalinationResult = useDesalination()
```

c) Dans la section JSX, après la fermeture de la section des états 4+5+6 (après `</>`), ajouter DEUX nouveaux blocs :

**Bloc A — Alerte eau salée critique (ECO-05) — visible même sans toggle, si canal sélectionné avec profil :**
```tsx
{/* Alerte eau salée critique (ECO-05) — s'affiche indépendamment du toggle */}
{!noCanal && !noProfile && desalinationResult?.ecosystemImpact === 'critical' && (
  <div
    role="alert"
    className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-1"
  >
    <p className="text-[11px] text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1">
      <AlertCircle size={12} className="shrink-0" />
      Alerte &mdash; Eau sal&eacute;e (ECO-05)
    </p>
    <p className="text-[12px] text-red-300 leading-relaxed">
      Le canal traverse une zone agricole ou un cours d&apos;eau &mdash; risque de contamination saline irr&eacute;versible
    </p>
  </div>
)}
```

**Bloc B — Toggle dessalement + section accordéon :**
```tsx
{/* Toggle dessalement + section résultats (DESAL-01 à DESAL-05) */}
{!noCanal && !noProfile && (
  <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
    {/* Toggle */}
    <button
      onClick={toggleDesalination}
      className="flex items-center gap-2 text-left focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 outline-none rounded"
      aria-pressed={desalinationEnabled}
    >
      <span
        className={`w-8 h-4 rounded-full transition-colors duration-200 relative shrink-0 ${
          desalinationEnabled ? 'bg-blue-500' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
            desalinationEnabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="text-[11px] text-gray-400 uppercase tracking-wider">
        N&oelig;uds dessalement solaire
      </span>
    </button>

    {/* Section résultats — visible uniquement si toggle activé ET résultat disponible */}
    {desalinationEnabled && desalinationResult && desalinationResult.nodes > 0 && (
      <dl className="flex flex-col gap-1 mt-1">
        <div className="flex flex-col gap-[2px]">
          <dt className="text-[11px] text-gray-500 uppercase tracking-wider">
            N&oelig;uds ({desalinationResult.nodes})
          </dt>
          <dd className="text-[13px] font-semibold text-white">
            {formatInterval(desalinationResult.waterProduction, 'm³/jour', 0)}
          </dd>
        </div>

        <div className="flex flex-col gap-[2px]">
          <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Valeur sels r&eacute;cup&eacute;r&eacute;s</dt>
          <dd className="text-[13px] font-semibold text-white">
            {formatInterval(desalinationResult.saltValue, '€/an', 0)}
          </dd>
        </div>

        <div className="flex flex-col gap-[2px]">
          <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Zones habitables cr&eacute;&eacute;es</dt>
          <dd className="text-[13px] font-semibold text-white">
            {formatInterval(desalinationResult.habitableZones, 'km²', 0)}
          </dd>
        </div>

        <div className="flex flex-col gap-[2px]">
          <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Co&ucirc;t infrastructure</dt>
          <dd className="text-[13px] font-semibold text-amber-300">
            {formatInterval(
              [desalinationResult.desalinationCost[0] / 1_000_000, desalinationResult.desalinationCost[1] / 1_000_000],
              'M€',
              0,
            )}
          </dd>
        </div>
      </dl>
    )}

    {/* Message si toggle activé mais canal trop court pour un nœud */}
    {desalinationEnabled && desalinationResult && desalinationResult.nodes === 0 && (
      <p className="text-[11px] text-gray-500 italic">
        Canal trop court pour un n&oelig;ud (minimum 500 km)
      </p>
    )}
  </div>
)}
```

**2. src/components/SidePanel.tsx — ajouter l'appel useDesalination()**

Trouver la ligne où `useEcology()` est appelé dans SidePanel (si présent) et ajouter juste après :
```typescript
useDesalination()  // Phase 9 — maintient le moteur actif pour EcologyPanel
```

Si useEcology n'est pas dans SidePanel (le hook est appelé directement dans EcologyPanel), ajouter l'import et l'appel à la suite des autres hooks dans SidePanel :
```typescript
import { useDesalination } from '../hooks/useDesalination'
// ...dans le corps du composant :
useDesalination()
```

Note : lire SidePanel.tsx avant d'éditer pour identifier le point d'insertion correct.
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -v "^$" | head -20</automated>
  </verify>
  <done>EcologyPanel.tsx avec alerte ECO-05 + section dessalement avec toggle. SidePanel.tsx avec useDesalination(). TypeScript sans erreur. `npx vitest run` montre 107+ tests GREEN.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| useCanalStore → useDesalination | Lecture de state Zustand — pas d'entrée utilisateur directe dans le moteur |
| toggleDesalination → desalinationEnabled | Action utilisateur (clic bouton) → mutation state booléen — aucun risque |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-09-05 | Information Disclosure | DesalinationResult affiché | accept | Estimations scientifiques publiques affichées — aucune donnée sensible |
| T-09-06 | Tampering | desalinationCost en €/M€ | accept | Conversion × 1/1_000_000 pour affichage — valeur originale en € préservée dans le store |
</threat_model>

<verification>
- `npx tsc --noEmit` : zéro erreur TypeScript sur les 4 fichiers modifiés
- `npx vitest run` : 107+ tests GREEN (aucune régression)
- Vérification manuelle : ouvrir l'app, sélectionner un canal avec profil, vérifier que le toggle "Nœuds dessalement" apparaît dans EcologyPanel
- Activer le toggle sur un canal >= 500 km : vérifier l'affichage des intervalles eau/sel/zones
- Activer le toggle sur un canal < 500 km : vérifier le message "Canal trop court"
</verification>

<success_criteria>
- desalinationEnabled: boolean + toggleDesalination() ajoutés au store Zustand et réinitialisés par clearAll()
- useDesalination() hook retourne DesalinationResult | null via useMemo — même pattern que useEcology
- EcologyPanel : alerte rouge ECO-05 si ecosystemImpact === 'critical' (visible sans toggle)
- EcologyPanel : toggle dessalement + affichage [min–max] eau m³/jour, sel €/an, zones km², coût M€ quand activé
- EcologyPanel : message "Canal trop court" si toggle activé mais 0 nœuds
- SidePanel : useDesalination() appelé pour maintenir le moteur actif
- 107+ tests existants GREEN, TypeScript sans erreur
</success_criteria>

<output>
Après completion, créer `.planning/phases/09-eau-salee-dessalement/09-T03-SUMMARY.md`
</output>

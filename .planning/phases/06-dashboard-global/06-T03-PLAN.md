---
phase: 06-dashboard-global
plan: T03
type: execute
wave: 3
depends_on: [T02]
files_modified:
  - src/hooks/useDashboard.ts
  - src/components/IpccComparisonChart.tsx
  - src/components/DashboardPanel.tsx
  - src/components/SidePanel.tsx
autonomous: true
requirements:
  - GLOB-01
  - GLOB-02
  - GLOB-03

must_haves:
  truths:
    - "useDashboard() lit TOUS les canaux du store (pas selectedCanalId) et retourne DashboardResult | null via useMemo"
    - "DashboardPanel s'ouvre automatiquement dès que canals.length >= 1"
    - "DashboardPanel État 1 (aucun canal) : texte italic 'Ajoutez des canaux pour voir l'impact cumulé'"
    - "DashboardPanel État 2 : affiche cumulativeDeltaSLmm en [X – Y] mm, 3 colonnes scénarios, IpccComparisonChart"
    - "IpccComparisonChart affiche 2 barres : 'Canaux' (blue-500) et 'IPCC 2100' (gray-700)"
    - "SidePanel remplace le footer placeholder par <DashboardPanel /> en Section 6"
    - "npx tsc --noEmit → 0 erreur sur l'ensemble du projet"
  artifacts:
    - path: "src/hooks/useDashboard.ts"
      provides: "Hook useMemo lisant TOUS les canaux + calcParams, appelant computeDashboardResult"
      exports: ["useDashboard"]
    - path: "src/components/IpccComparisonChart.tsx"
      provides: "BarChart recharts isolé — 2 barres : Canaux vs IPCC 2100"
      exports: ["IpccComparisonChart"]
    - path: "src/components/DashboardPanel.tsx"
      provides: "Accordéon 2 états conforme UI-SPEC §Component Specification: DashboardPanel"
      exports: ["DashboardPanel"]
    - path: "src/components/SidePanel.tsx"
      provides: "SidePanel étendu — Section 6 contient DashboardPanel"
  key_links:
    - from: "src/components/DashboardPanel.tsx"
      to: "src/hooks/useDashboard.ts"
      via: "import useDashboard"
      pattern: "import.*useDashboard.*from.*hooks"
    - from: "src/hooks/useDashboard.ts"
      to: "src/lib/dashboardEngine.ts"
      via: "computeDashboardResult dans useMemo"
      pattern: "computeDashboardResult"
    - from: "src/components/DashboardPanel.tsx"
      to: "src/components/IpccComparisonChart.tsx"
      via: "<IpccComparisonChart cumulativeDeltaSL={...} />"
      pattern: "IpccComparisonChart"
    - from: "src/components/SidePanel.tsx"
      to: "src/components/DashboardPanel.tsx"
      via: "<DashboardPanel /> en Section 6 — remplace le footer placeholder"
      pattern: "DashboardPanel"
---

<objective>
Wave 2 UI: Créer le hook useDashboard, les composants IpccComparisonChart et DashboardPanel, et intégrer DashboardPanel dans SidePanel en Section 6. Le dashboard s'affiche dès qu'au moins un canal existe.

Purpose: Rendre visibles les résultats du moteur dashboard (T02) à l'utilisateur — conformément à UI-SPEC.md §Component Specification: DashboardPanel et §Component Specification: IpccComparisonChart.
Output: useDashboard.ts + IpccComparisonChart.tsx + DashboardPanel.tsx (2 états) + SidePanel.tsx mis à jour.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/06-dashboard-global/06-CONTEXT.md
@.planning/phases/06-dashboard-global/06-UI-SPEC.md
@.planning/phases/06-dashboard-global/06-T02-SUMMARY.md

<interfaces>
<!-- Contrats établis dans T01 et T02 -->

From src/types/dashboard.ts:
```typescript
export interface DashboardScenario {
  label:      string    // "Optimiste" | "Réaliste" | "Pessimiste"
  multiplier: number    // 1.0 / 0.6 / 0.3
  deltaSLmm:  Interval
}

export interface DashboardResult {
  cumulativeDeltaSLmm: Interval
  scenarios: {
    optimistic:  DashboardScenario
    realistic:   DashboardScenario
    pessimistic: DashboardScenario
  }
  totalCostMEur:     Interval
  canalsWithProfile: number
  totalCanals:       number
}

export const IPCC_2100_RANGE_MM: Interval = [300, 1000]
```

From src/lib/dashboardEngine.ts (exportée depuis T02):
```typescript
export function computeDashboardResult(
  canals: Canal[],
  calcParams: CalcParams,
): DashboardResult | null
```

From src/store/canalStore.ts (store Zustand):
```typescript
interface CanalStore {
  canals:     Canal[]           // TOUS les canaux — lire sans filtre selectedCanalId
  calcParams: CalcParams        // { width: number, depth: number }
  // ... autres champs
}
```

From src/hooks/useCalculation.ts (pattern exact à copier pour useDashboard):
```typescript
export function useCalculation(): CalculationHookResult {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals          = useCanalStore((s) => s.canals)
  const calcParams      = useCanalStore((s) => s.calcParams)
  const selectedCanal   = canals.find((c) => c.id === selectedCanalId) ?? null
  return useMemo(() => { ... }, [selectedCanal, selectedCanal?.elevation, calcParams.width, calcParams.depth])
}
// NOTE pour useDashboard : ne pas filtrer par selectedCanalId — passer TOUS les canals
```

From src/components/CalculationPanel.tsx (helpers formatage à dupliquer):
```typescript
function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}
/** [X – Y] unité — em dash U+2013 obligatoire */
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}
```

From src/components/ElevationChart.tsx (pattern recharts existant):
```typescript
import { ResponsiveContainer, ... } from 'recharts'
// Utilise ResponsiveContainer width="100%" height={N}
// Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}
```

From src/components/SidePanel.tsx (point d'insertion — Section 6):
```tsx
{/* Section 5b — Analyse écologique (accordéon) — Phase 5 */}
<EcologyPanel />

{/* Section 6 — Footer (réservé Phase 6) */}
<div className="px-4 py-3 border-t border-white/[0.08] text-xs text-gray-500">
  {/* Global stats placeholder Phase 6 */}
</div>
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Hook useDashboard.ts + IpccComparisonChart.tsx</name>
  <files>src/hooks/useDashboard.ts, src/components/IpccComparisonChart.tsx</files>
  <read_first>
    - src/hooks/useCalculation.ts — pattern useMemo exact à adapter (remplacer selectedCanal par canals entier)
    - src/hooks/useEcology.ts — voir le pattern simplifié sans calcParams
    - src/components/ElevationChart.tsx — pattern recharts (ResponsiveContainer, Tooltip style dark)
    - src/types/dashboard.ts — DashboardResult, IPCC_2100_RANGE_MM
  </read_first>
  <behavior>
    useDashboard.ts:
    - Lit canals (TOUS) et calcParams depuis useCanalStore — NE PAS lire selectedCanalId
    - useMemo dépend de [canals, calcParams.width, calcParams.depth]
    - Retourne computeDashboardResult(canals, calcParams) ou null
    - Type de retour : DashboardResult | null

    IpccComparisonChart.tsx:
    - Props : { cumulativeDeltaSL: Interval }
    - Importe BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell depuis recharts
    - chartData = [
        { name: 'Canaux', value: midpoint(cumulativeDeltaSL), fill: '#3B82F6' },
        { name: 'IPCC 2100', value: midpoint(IPCC_2100_RANGE_MM), fill: '#374151' },
      ]
    - midpoint(iv) = (iv[0] + iv[1]) / 2
    - ResponsiveContainer width="100%" height={140}
    - BarChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
    - XAxis tick={{ fontSize: 10, fill: '#6B7280' }}
    - YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit=" mm"
    - Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}
    - Bar dataKey="value" radius={[2,2,0,0]} — utiliser Cell pour couleurs individuelles par barre
    - aria-label="Comparaison impact canaux vs IPCC 2100" sur le BarChart
    - Tooltip formatter pour IPCC 2100 : afficher "300–1000 mm (RCP2.6–8.5)" dans label
  </behavior>
  <action>
1. Créer `src/hooks/useDashboard.ts` :

```typescript
// src/hooks/useDashboard.ts
// Hook orchestrateur Phase 6 — lit TOUS les canaux du store, mémoïse le dashboard.
// Différence clé vs useCalculation/useEcology : lit canals[] entier, pas selectedCanalId.
// Pitfall 2 RESEARCH.md : useMemo obligatoire sinon recalcul à chaque keydown.
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import { computeDashboardResult } from '../lib/dashboardEngine'
import type { DashboardResult } from '../types/dashboard'

export function useDashboard(): DashboardResult | null {
  const canals     = useCanalStore((s) => s.canals)
  const calcParams = useCanalStore((s) => s.calcParams)

  return useMemo<DashboardResult | null>(() => {
    return computeDashboardResult(canals, calcParams)
  }, [canals, calcParams.width, calcParams.depth])
}
```

2. Créer `src/components/IpccComparisonChart.tsx` :

```typescript
// src/components/IpccComparisonChart.tsx
// Graphique BarChart recharts — Canaux (réaliste) vs IPCC AR6 2100
// UI-SPEC §Component Specification: IpccComparisonChart
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Interval } from '../types/calculation'
import { IPCC_2100_RANGE_MM } from '../types/dashboard'

interface IpccComparisonChartProps {
  cumulativeDeltaSL: Interval  // scénario réaliste deltaSLmm
}

function midpoint(iv: Interval): number {
  return (iv[0] + iv[1]) / 2
}

export function IpccComparisonChart({ cumulativeDeltaSL }: IpccComparisonChartProps) {
  const chartData = [
    { name: 'Canaux',    value: midpoint(cumulativeDeltaSL), fill: '#3B82F6' },
    { name: 'IPCC 2100', value: midpoint(IPCC_2100_RANGE_MM), fill: '#374151' },
  ]

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
        aria-label="Comparaison impact canaux vs IPCC 2100"
      >
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit=" mm" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => {
            if (name === 'IPCC 2100') {
              return [`${value.toFixed(0)} mm`, '300–1000 mm (RCP2.6–8.5)']
            }
            return [`${value.toFixed(3)} mm`, name]
          }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

Notes d'implémentation :
- Cell est nécessaire pour couleurs individuelles par barre dans recharts (fill sur Bar ne s'applique pas par entrée)
- Le Tooltip formatter reçoit (value, name) où name = dataKey (ici "value") — utiliser le label de l'entrée via le deuxième argument du formatter ou passer `nameKey`
- Vérifier que recharts est déjà installé : grep "recharts" package.json — NE PAS lancer npm install
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -E "(useDashboard|IpccComparison)" || echo "useDashboard + IpccComparisonChart OK"</automated>
  </verify>
  <acceptance_criteria>
    - useDashboard.ts compile sans erreur TypeScript
    - grep "selectedCanalId" src/hooks/useDashboard.ts retourne 0 lignes (hook lit TOUS les canaux)
    - grep "computeDashboardResult" src/hooks/useDashboard.ts retourne 1 ligne
    - IpccComparisonChart.tsx compile sans erreur TypeScript
    - grep "IPCC_2100_RANGE_MM" src/components/IpccComparisonChart.tsx retourne 1 ligne (import + utilisation)
    - grep "aria-label" src/components/IpccComparisonChart.tsx retourne 1 ligne
  </acceptance_criteria>
  <done>useDashboard.ts compile, lit TOUS les canaux (pas selectedCanalId). IpccComparisonChart.tsx compile avec BarChart recharts et 2 barres colorées.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: DashboardPanel.tsx (2 états) + SidePanel intégration</name>
  <files>src/components/DashboardPanel.tsx, src/components/SidePanel.tsx</files>
  <read_first>
    - src/components/CalculationPanel.tsx — pattern accordéon EXACT à copier (classes Tailwind identiques lignes 112–129)
    - src/components/EcologyPanel.tsx — voir auto-open pattern (useEffect sur canals.length)
    - src/components/SidePanel.tsx — identifier la Section 6 footer placeholder à remplacer (ligne ~107–111)
    - .planning/phases/06-dashboard-global/06-UI-SPEC.md — §Component Specification: DashboardPanel (2 états, copywriting exact)
  </read_first>
  <behavior>
    DashboardPanel.tsx:
    - Accordéon header identique aux autres panels : wrapper border-t border-white/[0.08], button h-8 px-4 flex items-center gap-2, ChevronDown size=14, label "Dashboard Global" uppercase text-[12px] text-gray-400 tracking-wider
    - aria-expanded={isOpen} sur le bouton
    - Auto-open : useState(true) + useEffect(() => { if (canals.length > 0) setIsOpen(true) }, [canals.length])

    État 1 (canals.length === 0) :
    - h-10 px-4 flex items-center
    - <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">Ajoutez des canaux pour voir l'impact cumulé</p>

    État 2 (canals.length >= 1, dashboardResult non-null) :
    - Bloc "Impact cumulé" : dt "IMPACT CUMULÉ" uppercase, dd formatInterval(dashboardResult.cumulativeDeltaSLmm, 'mm', 3)
    - Annotation : si canalsWithProfile < totalCanals → "N canaux · M avec profil chargé" ; si canalsWithProfile === 0 → AlertCircle amber + "Chargez les profils altimétriques pour calculer"
    - Grille scénarios 3 colonnes : grid-cols-3 gap-1 px-4 py-2
      * Optimiste : text-green-400, label "Optimiste", formatInterval(scenarios.optimistic.deltaSLmm, '', 2)
      * Réaliste   : text-amber-400, label "Réaliste", formatInterval(scenarios.realistic.deltaSLmm, '', 2)
      * Pessimiste : text-red-400, label "Pessimiste", formatInterval(scenarios.pessimistic.deltaSLmm, '', 2)
    - IpccComparisonChart avec cumulativeDeltaSL={dashboardResult.scenarios.realistic.deltaSLmm}

    Cas dashboardResult null mais canals.length >= 1 (canaux sans profil) :
    - Afficher le bloc "Impact cumulé" avec [0 – 0] mm et l'alerte amber "Chargez les profils altimétriques pour calculer"

    SidePanel.tsx :
    - Importer DashboardPanel depuis './DashboardPanel'
    - Remplacer la Section 6 entière (div className="px-4 py-3 border-t...") par <DashboardPanel />
  </behavior>
  <action>
1. Créer `src/components/DashboardPanel.tsx` :

```typescript
// src/components/DashboardPanel.tsx
// Accordéon Phase 6 — Dashboard global, 2 états, conforme UI-SPEC §DashboardPanel
import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { useDashboard } from '../hooks/useDashboard'
import { IpccComparisonChart } from './IpccComparisonChart'
import type { Interval } from '../types/calculation'

// ─── Helpers de formatage UX-01 (copiés depuis CalculationPanel.tsx) ──────────

function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}

/** [X – Y] unité — em dash U+2013 obligatoire */
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function DashboardPanel() {
  const canals          = useCanalStore((s) => s.canals)
  const dashboardResult = useDashboard()

  // Accordéon ouvert par défaut, s'ouvre automatiquement dès qu'un canal existe
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (canals.length > 0) setIsOpen(true)
  }, [canals.length])

  const noCanals         = canals.length === 0
  const noProfiles       = dashboardResult === null && canals.length > 0
  const hasResult        = dashboardResult !== null
  const canalsWithProfil = dashboardResult?.canalsWithProfile ?? 0
  const totalCanals      = canals.length

  // Interval neutre pour le chart quand pas de résultat
  const realisticDeltaSL: Interval = hasResult
    ? dashboardResult!.scenarios.realistic.deltaSLmm
    : [0, 0]

  const cumulativeDisplay: Interval = hasResult
    ? dashboardResult!.cumulativeDeltaSLmm
    : [0, 0]

  return (
    <div className="border-t border-white/[0.08]">
      {/* Header accordéon */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full h-8 px-4 flex items-center gap-2 text-left
                   hover:bg-white/[0.04] transition-colors
                   focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                   outline-none"
        aria-expanded={isOpen}
      >
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
        <span className="text-[12px] font-normal text-gray-400 uppercase tracking-wider">
          Dashboard Global
        </span>
      </button>

      {isOpen && (
        <div>
          {/* État 1 — aucun canal */}
          {noCanals && (
            <div className="h-10 px-4 flex items-center">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
                Ajoutez des canaux pour voir l&apos;impact cumulé
              </p>
            </div>
          )}

          {/* État 2 — au moins un canal */}
          {!noCanals && (
            <>
              {/* ΔSL cumulé */}
              <dl className="px-4 py-2 flex flex-col gap-[2px]">
                <dt className="text-[11px] text-gray-500 uppercase tracking-wider">
                  Impact cumulé
                </dt>
                <dd className="text-[13px] font-semibold text-white">
                  {formatInterval(cumulativeDisplay, 'mm', 3)}
                </dd>
                {/* Annotation canaux avec profil */}
                {hasResult && canalsWithProfil < totalCanals && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    {totalCanals} canal{totalCanals > 1 ? 'aux' : ''} · {canalsWithProfil} avec profil chargé
                  </p>
                )}
                {(noProfiles || (hasResult && canalsWithProfil === 0)) && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    Chargez les profils altimétriques pour calculer
                  </p>
                )}
              </dl>

              {/* Scénarios 3 colonnes */}
              {hasResult && (
                <div className="grid grid-cols-3 gap-1 px-4 py-2">
                  {/* Optimiste */}
                  <div className="flex flex-col items-center gap-[2px]">
                    <span className="text-[10px] text-green-400 uppercase tracking-wider">
                      Optimiste
                    </span>
                    <span className="text-[12px] font-semibold text-white">
                      {formatInterval(dashboardResult!.scenarios.optimistic.deltaSLmm, '', 2)}
                    </span>
                    <span className="text-[10px] text-gray-500">mm</span>
                  </div>
                  {/* Réaliste */}
                  <div className="flex flex-col items-center gap-[2px]">
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider">
                      Réaliste
                    </span>
                    <span className="text-[12px] font-semibold text-white">
                      {formatInterval(dashboardResult!.scenarios.realistic.deltaSLmm, '', 2)}
                    </span>
                    <span className="text-[10px] text-gray-500">mm</span>
                  </div>
                  {/* Pessimiste */}
                  <div className="flex flex-col items-center gap-[2px]">
                    <span className="text-[10px] text-red-400 uppercase tracking-wider">
                      Pessimiste
                    </span>
                    <span className="text-[12px] font-semibold text-white">
                      {formatInterval(dashboardResult!.scenarios.pessimistic.deltaSLmm, '', 2)}
                    </span>
                    <span className="text-[10px] text-gray-500">mm</span>
                  </div>
                </div>
              )}

              {/* Graphique IPCC */}
              <div className="px-2 pb-3">
                <IpccComparisonChart cumulativeDeltaSL={realisticDeltaSL} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

2. Modifier `src/components/SidePanel.tsx` — remplacer Section 6 par DashboardPanel :

Ajouter l'import en haut (après EcologyPanel) :
```typescript
import { DashboardPanel } from './DashboardPanel'
```

Remplacer la section entière :
```tsx
{/* Section 6 — Footer (réservé Phase 6) */}
<div className="px-4 py-3 border-t border-white/[0.08] text-xs text-gray-500">
  {/* Global stats placeholder Phase 6 */}
</div>
```
par :
```tsx
{/* Section 6 — Dashboard Global (accordéon) — Phase 6 */}
<DashboardPanel />
```

Notes :
- L'em dash dans formatInterval est U+2013 (–) — vérifier dans CalculationPanel.tsx que le caractère est correct avant de copier
- NE PAS ajouter de `dangerouslySetInnerHTML` — tout le contenu est calculé localement
- L'opérateur `!` (non-null assertion) sur dashboardResult est sûr car les blocs sont gardés par `hasResult`
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -E "(DashboardPanel|IpccComparison|useDashboard)" || echo "DashboardPanel OK"</automated>
  </verify>
  <acceptance_criteria>
    - DashboardPanel.tsx compile sans erreur TypeScript
    - grep "DashboardPanel" src/components/SidePanel.tsx retourne au moins 2 lignes (import + usage)
    - grep "Global stats placeholder Phase 6" src/components/SidePanel.tsx retourne 0 lignes (placeholder supprimé)
    - grep "aria-expanded" src/components/DashboardPanel.tsx retourne 1 ligne
    - grep "IpccComparisonChart" src/components/DashboardPanel.tsx retourne au moins 2 lignes (import + usage)
    - grep -v "^//" src/components/DashboardPanel.tsx | grep "dangerouslySetInnerHTML" retourne 0 lignes
    - npx tsc --noEmit → 0 erreur sur l'ensemble du projet
    - npm test retourne aucune régression (tests dashboardEngine GREEN inclus)
  </acceptance_criteria>
  <done>
DashboardPanel.tsx compile sans erreur TypeScript.
SidePanel.tsx remplace le footer placeholder par DashboardPanel.
npx tsc --noEmit → 0 erreur sur l'ensemble du projet.
npm test → tous les tests GREEN (dashboardEngine + pas de régression ecologyEngine).
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Dashboard Global complet — hook useDashboard + IpccComparisonChart + DashboardPanel (2 états) + intégration SidePanel Section 6.
Le dashboard agrège en temps réel l'impact de TOUS les canaux.
  </what-built>
  <how-to-verify>
1. Lancer l'app : `cd C:/dev/gsd/science/canal && npm run dev`
2. Ouvrir http://localhost:5173

**Test État 1 (aucun canal) :**
3. Ouvrir la page sans canal tracé → DashboardPanel affiche "Ajoutez des canaux pour voir l'impact cumulé" en italique gris

**Test État 2 (canal avec profil) :**
4. Tracer un canal (ex: Atlantique → Méditerranée)
5. Charger le profil altimétrique dans ElevationPanel
6. DashboardPanel doit afficher :
   - "IMPACT CUMULÉ" en label uppercase avec [X – Y] mm
   - 3 colonnes : "Optimiste" en vert / "Réaliste" en amber / "Pessimiste" en rouge
   - Graphique BarChart avec 2 barres : barre bleue "Canaux" (quelques mm) + barre grise "IPCC 2100" (~650mm)
   - L'ordre de grandeur doit être honnête : barre Canaux quasi invisible vs barre IPCC 2100

**Test agrégation multi-canaux (GLOB-01) :**
7. Tracer un deuxième canal et charger son profil
8. Vérifier que le ΔSL cumulé augmente (somme des deux canaux)

**Test canal sans profil :**
9. Tracer un troisième canal SANS charger son profil
10. Vérifier que le compteur "N canaux · M avec profil chargé" reflète le bon compte
11. Vérifier que le ΔSL cumulé ne change pas (canal sans profil ignoré)
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| DashboardResult → DashboardPanel | Données calculées côté client — pas d'input utilisateur direct dans le dashboard |
| Interval → IpccComparisonChart | Valeurs calculées localement — pas de réseau |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-06 | Information Disclosure | DashboardPanel affichage | accept | Affiche uniquement des données calculées localement — pas de données sensibles |
| T-06-07 | Tampering | canals[] depuis store Zustand | accept | Store local uniquement — pas de vecteur d'attaque externe |
| T-06-08 | Denial of Service | IpccComparisonChart avec Interval [NaN, NaN] | mitigate | Guard dans midpoint() : si !isFinite → return 0 (barre invisible plutôt que crash recharts) |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# TypeScript compile — projet complet
npx tsc --noEmit
# Tous les tests GREEN (dashboardEngine + pas de régression)
npm test
# DashboardPanel bien intégré dans SidePanel
grep "DashboardPanel" src/components/SidePanel.tsx
# Placeholder Phase 6 supprimé
grep "Global stats placeholder" src/components/SidePanel.tsx
# Dev server démarre sans erreur
npm run dev
```
</verification>

<success_criteria>
- useDashboard.ts compile et exporte useDashboard(): DashboardResult | null
- useDashboard lit TOUS les canaux (pas selectedCanalId)
- IpccComparisonChart.tsx compile avec BarChart recharts, 2 barres colorées, aria-label
- DashboardPanel.tsx implémente les 2 états conformes à UI-SPEC.md
- SidePanel.tsx rend DashboardPanel à la place du footer placeholder Phase 6
- npx tsc --noEmit → 0 erreur
- npm test → tous les tests GREEN (dashboardEngine + pas de régression ecologyEngine)
- DashboardPanel s'ouvre automatiquement dès canals.length >= 1
- Checkpoint humain approuvé : 11 vérifications visuelles OK
</success_criteria>

<output>
After completion, create `.planning/phases/06-dashboard-global/06-T03-SUMMARY.md`
</output>

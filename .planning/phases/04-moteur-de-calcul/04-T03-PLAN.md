---
phase: 04
plan: 03
type: execute
wave: 2
depends_on: [04-01, 04-02]
files_modified:
  - src/store/canalStore.ts
  - src/store/canalStore.test.ts
  - src/hooks/useCalculation.ts
  - src/components/CalculationPanel.tsx
  - src/components/SidePanel.tsx
  - src/components/MapView.tsx
autonomous: true
requirements: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, UX-01]
tags: [phase-04, ui, calculation-panel, store-extension, maplibre-marker, wave-2]

must_haves:
  truths:
    - "Le store useCanalStore expose calcParams: { width: 50, depth: 5 } par défaut et setCalcParams(params)"
    - "Le hook useCalculation retourne { result, partial, error } memoïsés depuis store + canal sélectionné"
    - "Le composant CalculationPanel s'affiche dans SidePanel après ElevationPanel"
    - "Le panel affiche 'Sélectionnez un canal' si aucun canal sélectionné"
    - "Le panel affiche 'Chargez le profil altimétrique' si canal sans elevation chargée"
    - "Le panel affiche les inputs Largeur/Profondeur avec valeurs par défaut 50/5"
    - "Le panel affiche Volume / Impact mer (ΔSL) / vs IPCC 2100 / Coût estimé en intervalles [X – Y] unité"
    - "La barre IPCC se remplit proportionnellement à percentMid clampé à 100%"
    - "Le panel affiche la décomposition terrain 'Plaine X% · Mixte Y% · Montagne Z%'"
    - "La section IMPACT PARTIEL apparaît automatiquement si profile.uphillSegments.length > 0"
    - "Un marker amber (#F59E0B) apparaît sur la carte au stopCoord du PartialImpactResult"
    - "Le marker est nettoyé au changement de selectedCanalId ou quand partial devient null"
    - "npm test passe à 100% (engine + store + tous les tests existants)"
  artifacts:
    - path: "src/hooks/useCalculation.ts"
      provides: "Hook orchestrateur retournant CalculationResult + PartialImpactResult memoïsés"
      exports: ["useCalculation"]
      min_lines: 30
    - path: "src/components/CalculationPanel.tsx"
      provides: "Composant accordéon avec inputs + résultats + barre IPCC + impact partiel"
      contains: "CALCUL D'IMPACT"
      min_lines: 150
  key_links:
    - from: "src/components/SidePanel.tsx"
      to: "src/components/CalculationPanel.tsx"
      via: "<CalculationPanel /> après <ElevationPanel />"
      pattern: "<CalculationPanel"
    - from: "src/components/CalculationPanel.tsx"
      to: "src/hooks/useCalculation.ts"
      via: "useCalculation()"
      pattern: "useCalculation\\(\\)"
    - from: "src/hooks/useCalculation.ts"
      to: "src/lib/calculationEngine.ts"
      via: "computeCalculation, computePartialImpact"
      pattern: "from '\\.\\./lib/calculationEngine'"
    - from: "src/components/MapView.tsx"
      to: "PartialImpactResult.stopCoord"
      via: "stopMarkerRef = new maplibregl.Marker({ color: '#F59E0B' })"
      pattern: "#F59E0B"
---

<objective>
Brancher le moteur de calcul (T02) à l'UI : extension du store Zustand avec `calcParams`, hook orchestrateur `useCalculation`, composant accordéon `CalculationPanel` dans `SidePanel`, et marker amber MapLibre dans `MapView` pour l'impact partiel. Cette plan livre l'expérience utilisateur complète de la Phase 4 — un utilisateur ouvre l'app, trace un canal, sélectionne, voit les inputs et tous les résultats en intervalles, modifie largeur/profondeur, voit la barre IPCC évoluer, et si son canal a des montées, voit un marker amber sur la carte au point d'arrêt.

Purpose: Rendre les calculs Phase 4 visibles, interactifs, scientifiquement honnêtes (UX-01 affichage `[X – Y] unité`).

Output: 6 fichiers (2 nouveaux, 4 modifiés). Aucun nouveau test obligatoire pour l'UI (Vitest jsdom est lourd) — l'extension du store reste testée unitairement.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-moteur-de-calcul/04-CONTEXT.md
@.planning/phases/04-moteur-de-calcul/04-RESEARCH.md
@.planning/phases/04-moteur-de-calcul/04-UI-SPEC.md
@.planning/phases/04-moteur-de-calcul/04-VALIDATION.md
@.planning/phases/04-moteur-de-calcul/04-01-SUMMARY.md
@.planning/phases/04-moteur-de-calcul/04-02-SUMMARY.md

@src/types/calculation.ts
@src/types/canal.ts
@src/types/elevation.ts
@src/lib/calculationEngine.ts
@src/store/canalStore.ts
@src/store/canalStore.test.ts
@src/components/SidePanel.tsx
@src/components/ElevationPanel.tsx
@src/components/MapView.tsx

<interfaces>
<!-- Contrats des modules consommés — extraits des fichiers existants -->

From src/lib/calculationEngine.ts (T02 GREEN) :
```typescript
export function computeCalculation(
  canal: Canal,
  profile: ElevationProfile | null,
  widthM: number,
  depthM: number,
): CalculationResult | null

export function computePartialImpact(
  canal: Canal,
  profile: ElevationProfile,
  widthM: number,
  depthM: number,
): PartialImpactResult | null
```

From src/types/calculation.ts (T01) :
```typescript
export interface CalcParams { width: number; depth: number }
export const DEFAULT_CALC_PARAMS = { width: 50, depth: 5 }
export interface CalculationResult { lengthKm, volumeKm3, deltaSLmm, costMEur, ipccPercent: Interval; terrainBreakdown }
export interface PartialImpactResult { reachableKm: number; stopCoord: Coord; lengthKm, volumeKm3, deltaSLmm, costMEur: Interval; percentOfFull: number }
```

From src/store/canalStore.ts (existant — pattern à étendre) :
```typescript
interface CanalStore {
  // ... existant
  // À ajouter :
  calcParams: CalcParams
  setCalcParams: (params: Partial<CalcParams>) => void
}
```

From src/store/canalStore.test.ts (pattern beforeEach) :
```typescript
beforeEach(() => {
  useCanalStore.setState({
    canals: [], mode: 'selection', draftPoints: [], previewCoord: null,
    selectedCanalId: null, routingState: 'idle', routingStart: null, routingEnd: null,
    // À ajouter : calcParams: { width: 50, depth: 5 }
  })
})
```

Pattern UI accordéon (src/components/ElevationPanel.tsx — à dupliquer pour CalculationPanel) :
- isOpen state local + useEffect auto-open quand selectedCanalId change
- Header h-8 px-4 avec ChevronDown rotate-180 quand open
- text-[12px] font-normal text-gray-400 uppercase tracking-wider pour le label
- États empty / chargement / data
- border-t border-white/[0.08]

Pattern MapLibre Marker (src/components/MapView.tsx ligne 199-293) :
- useRef<maplibregl.Marker | null>
- new maplibregl.Marker({ color, scale }).setLngLat([lng,lat]).addTo(map)
- Cleanup obligatoire dans return du useEffect : marker.remove() + ref = null
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Étendre useCanalStore avec calcParams + adapter les tests + créer useCalculation</name>
  <read_first>
    - src/store/canalStore.ts (intégral)
    - src/store/canalStore.test.ts (pattern beforeEach et it())
    - src/types/calculation.ts (CalcParams, DEFAULT_CALC_PARAMS)
    - src/lib/calculationEngine.ts (computeCalculation, computePartialImpact)
    - src/hooks/useElevation.ts (pattern hook orchestrateur — si existe)
  </read_first>
  <behavior>
    - Le store gagne calcParams: CalcParams (init { width: 50, depth: 5 }) et setCalcParams(partial)
    - setCalcParams fait un merge partiel : set((s) => ({ calcParams: { ...s.calcParams, ...params } }))
    - Les tests existants restent verts ; au moins 2 nouveaux tests vérifient setCalcParams
    - Le hook useCalculation retourne { result: CalculationResult|null, partial: PartialImpactResult|null }
    - useCalculation utilise useMemo avec dépendances [selectedCanal?.elevation, selectedCanal?.points, calcParams.width, calcParams.depth] (Pitfall 2 RESEARCH.md)
  </behavior>
  <action>

**1.1 — Modifier `src/store/canalStore.ts` :**

Ajouter en haut du fichier (après les imports existants) :
```typescript
import type { CalcParams } from '../types/calculation'
import { DEFAULT_CALC_PARAMS } from '../types/calculation'
```

Dans l'interface `CanalStore`, ajouter (après `setElevationError`) :
```typescript
  // Calcul d'impact — Phase 4
  calcParams: CalcParams
  setCalcParams: (params: Partial<CalcParams>) => void
```

Dans `create<CanalStore>()((set, get) => ({...}))`, ajouter (après `setElevationError`) :
```typescript
  calcParams: DEFAULT_CALC_PARAMS,

  setCalcParams: (params) => set((state) => ({
    calcParams: { ...state.calcParams, ...params }
  })),
```

**1.2 — Mettre à jour `src/store/canalStore.test.ts` :**

Dans le `beforeEach`, ajouter `calcParams: { width: 50, depth: 5 }` à la liste des champs reset.

Ajouter un nouveau describe block à la fin du fichier :
```typescript
describe('useCanalStore — Phase 4 calcParams', () => {
  it('calcParams est initialisé à { width: 50, depth: 5 } (D-01)', () => {
    expect(useCanalStore.getState().calcParams).toEqual({ width: 50, depth: 5 })
  })

  it('setCalcParams({ width: 80 }) merge sans toucher depth', () => {
    useCanalStore.getState().setCalcParams({ width: 80 })
    expect(useCanalStore.getState().calcParams).toEqual({ width: 80, depth: 5 })
  })

  it('setCalcParams({ depth: 10 }) merge sans toucher width', () => {
    useCanalStore.getState().setCalcParams({ depth: 10 })
    expect(useCanalStore.getState().calcParams).toEqual({ width: 50, depth: 10 })
  })
})
```

**1.3 — Créer `src/hooks/useCalculation.ts` :**

Créer le fichier avec exactement :
```typescript
// src/hooks/useCalculation.ts
// Hook orchestrateur Phase 4 — lit le store + canal sélectionné, mémoïse le résultat.
// Pitfall 2 RESEARCH.md : useMemo obligatoire sinon recalcul à chaque keydown.
import { useMemo } from 'react'
import { useCanalStore } from '../store/canalStore'
import {
  computeCalculation,
  computePartialImpact,
} from '../lib/calculationEngine'
import type { CalculationResult, PartialImpactResult } from '../types/calculation'

export interface CalculationHookResult {
  result:  CalculationResult  | null  // null si pas de canal / pas de profile / dimensions invalides
  partial: PartialImpactResult | null  // null si canal entièrement gravitaire
}

export function useCalculation(): CalculationHookResult {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals          = useCanalStore((s) => s.canals)
  const calcParams      = useCanalStore((s) => s.calcParams)

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  const result = useMemo<CalculationResult | null>(() => {
    if (!selectedCanal) return null
    return computeCalculation(
      selectedCanal,
      selectedCanal.elevation ?? null,
      calcParams.width,
      calcParams.depth,
    )
  }, [
    selectedCanal,
    selectedCanal?.elevation,
    calcParams.width,
    calcParams.depth,
  ])

  const partial = useMemo<PartialImpactResult | null>(() => {
    if (!selectedCanal || !selectedCanal.elevation) return null
    return computePartialImpact(
      selectedCanal,
      selectedCanal.elevation,
      calcParams.width,
      calcParams.depth,
    )
  }, [
    selectedCanal,
    selectedCanal?.elevation,
    calcParams.width,
    calcParams.depth,
  ])

  return { result, partial }
}
```

Vérification : `npm test` doit passer (ancien tests + 3 nouveaux).
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm test 2>&1 | tee /tmp/t03-task1.txt; FAIL=$(grep -cE "FAIL|✗ " /tmp/t03-task1.txt); echo "FAIL=$FAIL"; if [ "$FAIL" -gt 0 ]; then exit 1; fi</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "calcParams: CalcParams" src/store/canalStore.ts` retourne 1
    - `grep -c "setCalcParams: (params: Partial<CalcParams>)" src/store/canalStore.ts` retourne 1
    - `grep -c "calcParams: DEFAULT_CALC_PARAMS" src/store/canalStore.ts` retourne 1
    - `grep -c "from '../types/calculation'" src/store/canalStore.ts` retourne 1
    - `grep -c "calcParams: { width: 50, depth: 5 }" src/store/canalStore.test.ts` retourne 1
    - `grep -c "Phase 4 calcParams" src/store/canalStore.test.ts` retourne 1
    - Le fichier `src/hooks/useCalculation.ts` existe
    - `grep -c "export function useCalculation" src/hooks/useCalculation.ts` retourne 1
    - `grep -c "useMemo" src/hooks/useCalculation.ts` retourne au moins 2
    - `grep -c "computeCalculation\|computePartialImpact" src/hooks/useCalculation.ts` retourne au moins 2
    - `npx tsc --noEmit` exit 0
    - `npm test` : 0 échec, tous tests verts (incluant 3 nouveaux Phase 4 calcParams)
  </acceptance_criteria>
  <done>Store étendu, tests calcParams ajoutés et verts, hook useCalculation créé avec useMemo, aucun test cassé.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Créer CalculationPanel.tsx (accordéon, inputs, résultats, IPCC bar, impact partiel)</name>
  <read_first>
    - src/components/ElevationPanel.tsx (pattern accordéon à dupliquer)
    - src/hooks/useCalculation.ts (créé en Task 1)
    - src/types/calculation.ts (Interval, types)
    - .planning/phases/04-moteur-de-calcul/04-UI-SPEC.md (intégral — copywriting, formats, classes Tailwind)
    - .planning/phases/04-moteur-de-calcul/04-RESEARCH.md (Pitfall 6 — formatCost)
  </read_first>
  <behavior>
    - Accordéon avec header "CALCUL D'IMPACT" — h-8, px-4, ChevronDown rotate-180 quand open
    - isOpen local useState(true) + useEffect auto-open quand selectedCanalId change
    - 3 états : (a) aucun canal sélectionné → message gris italique, (b) canal sans elevation → message ambre + AlertCircle, (c) inputs + résultats
    - Inputs Largeur/Profondeur : type=number, w-20 h-8, valeurs initiales depuis store calcParams, onChange → setCalcParams({...}), bg-gray-800
    - Section résultats : Volume → ΔSL → vs IPCC 2100 → Coût (ordre exact UI-SPEC)
    - Format intervalles : `[X – Y] unité` avec em dash U+2013 et brackets visuels (UX-01 strict)
    - Barre IPCC : div h-1.5 w-full bg-gray-700 + fill h-1.5 bg-blue-500 transition-all duration-300, width clampé à Math.min(percentMid, 100)%
    - Décomposition terrain affichée si non 100% plain
    - Section IMPACT PARTIEL conditionnelle (apparait si partial !== null)
    - Format coût : < 1000 M€ → "[X – Y] M€", >= 1000 M€ → "[X.X – Y.Y] Md€"
  </behavior>
  <action>

Créer `src/components/CalculationPanel.tsx` :

```typescript
// src/components/CalculationPanel.tsx
// Accordéon Phase 4 — inputs largeur/profondeur + résultats en intervalles UX-01
// Pattern dupliqué d'ElevationPanel.tsx — même structure, mêmes classes Tailwind.
import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { useCalculation } from '../hooks/useCalculation'
import type { Interval, TerrainBreakdown } from '../types/calculation'

// ─── Helpers de formatage UX-01 ──────────────────────────────────────────────

/** Format scientifique pour valeurs très petites (< 0.001) */
function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}

/** [X – Y] unité — em dash U+2013 obligatoire (UI-SPEC §Number Formatting) */
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}

/** Coût avec basculement M€ / Md€ (Pitfall 6 RESEARCH.md) */
function formatCost(iv: Interval): string {
  const [minMEur, maxMEur] = iv
  if (maxMEur >= 1000) {
    return `[${(minMEur / 1000).toFixed(1)} – ${(maxMEur / 1000).toFixed(1)}] Md€`
  }
  return `[${minMEur.toFixed(0)} – ${maxMEur.toFixed(0)}] M€`
}

/** Pourcentages de la décomposition terrain (déclencher seulement si non 100% plain) */
function formatTerrainBreakdown(b: TerrainBreakdown): string | null {
  if (b.totalKm <= 0) return null
  const pPlain    = (b.plain    / b.totalKm) * 100
  const pMixed    = (b.mixed    / b.totalKm) * 100
  const pMountain = (b.mountain / b.totalKm) * 100
  if (pPlain >= 99.5) return null  // 100% plaine — pas affiché (UI-SPEC)
  return `Plaine ${pPlain.toFixed(0)}% · Mixte ${pMixed.toFixed(0)}% · Montagne ${pMountain.toFixed(0)}%`
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function CalculationPanel() {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals          = useCanalStore((s) => s.canals)
  const calcParams      = useCanalStore((s) => s.calcParams)
  const setCalcParams   = useCanalStore((s) => s.setCalcParams)
  const { result, partial } = useCalculation()

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  // Accordéon ouvert auto à la sélection
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (selectedCanalId) setIsOpen(true)
  }, [selectedCanalId])

  // Inputs locaux pour permettre la saisie temporaire (string) avant validation
  const [widthInput, setWidthInput] = useState(String(calcParams.width))
  const [depthInput, setDepthInput] = useState(String(calcParams.depth))
  useEffect(() => { setWidthInput(String(calcParams.width)) }, [calcParams.width])
  useEffect(() => { setDepthInput(String(calcParams.depth)) }, [calcParams.depth])

  function handleWidthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setWidthInput(raw)
    const num = parseFloat(raw)
    if (Number.isFinite(num) && num > 0) {
      setCalcParams({ width: num })
    }
  }

  function handleDepthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setDepthInput(raw)
    const num = parseFloat(raw)
    if (Number.isFinite(num) && num > 0) {
      setCalcParams({ depth: num })
    }
  }

  function handleWidthBlur() {
    const num = parseFloat(widthInput)
    if (!Number.isFinite(num) || num <= 0) {
      setWidthInput('50')
      setCalcParams({ width: 50 })
    }
  }

  function handleDepthBlur() {
    const num = parseFloat(depthInput)
    if (!Number.isFinite(num) || num <= 0) {
      setDepthInput('5')
      setCalcParams({ depth: 5 })
    }
  }

  // ── États dérivés ──
  const noCanal = !selectedCanalId
  const noProfile = selectedCanal !== null && !selectedCanal.elevation
  const hasResult = result !== null

  // Pourcentage médian pour la barre IPCC (clampé)
  const ipccMid = result ? (result.ipccPercent[0] + result.ipccPercent[1]) / 2 : 0
  const ipccBarWidth = Math.min(ipccMid, 100)

  const terrainStr = result ? formatTerrainBreakdown(result.terrainBreakdown) : null

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
          Calcul d&apos;impact
        </span>
      </button>

      {isOpen && (
        <div>
          {/* État vide — aucun canal sélectionné */}
          {noCanal && (
            <div className="h-10 px-4 flex items-center">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
                Sélectionnez un canal pour calculer son impact
              </p>
            </div>
          )}

          {/* État pas de profil chargé */}
          {!noCanal && noProfile && (
            <div className="h-10 px-4 flex items-center gap-1">
              <AlertCircle size={12} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                Chargez le profil altimétrique pour calculer
              </p>
            </div>
          )}

          {/* État données — inputs + résultats */}
          {!noCanal && !noProfile && (
            <>
              {/* Inputs largeur / profondeur */}
              <div className="flex gap-4 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="canal-width" className="text-[11px] text-gray-400">Largeur</label>
                  <div className="flex items-end gap-1">
                    <input
                      id="canal-width"
                      type="number"
                      min="0.1"
                      step="1"
                      value={widthInput}
                      onChange={handleWidthChange}
                      onBlur={handleWidthBlur}
                      aria-label="Largeur du canal en mètres"
                      className="w-20 h-8 px-2 text-[13px] text-white bg-gray-800 rounded
                                 border border-white/[0.12] focus:border-blue-500 focus:outline-none
                                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[12px] text-gray-400 mb-[6px]">m</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="canal-depth" className="text-[11px] text-gray-400">Profondeur</label>
                  <div className="flex items-end gap-1">
                    <input
                      id="canal-depth"
                      type="number"
                      min="0.1"
                      step="1"
                      value={depthInput}
                      onChange={handleDepthChange}
                      onBlur={handleDepthBlur}
                      aria-label="Profondeur du canal en mètres"
                      className="w-20 h-8 px-2 text-[13px] text-white bg-gray-800 rounded
                                 border border-white/[0.12] focus:border-blue-500 focus:outline-none
                                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[12px] text-gray-400 mb-[6px]">m</span>
                  </div>
                </div>
              </div>

              {/* Résultats — affichés seulement si computeCalculation a retourné non-null */}
              {hasResult && result && (
                <dl className="flex flex-col">
                  {/* Volume */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Volume</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(result.volumeKm3, 'km³')}
                    </dd>
                  </div>

                  {/* ΔSL */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Impact mer</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(result.deltaSLmm, 'mm')}
                    </dd>
                  </div>

                  {/* % IPCC + barre */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">vs IPCC 2100</dt>
                    <dd>
                      <div
                        className="mt-1 h-1.5 w-full rounded-full bg-gray-700"
                        role="progressbar"
                        aria-valuenow={Math.round(ipccMid)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Comparaison IPCC"
                      >
                        <div
                          className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${ipccBarWidth}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatNumber(result.ipccPercent[0], 2)}–{formatNumber(result.ipccPercent[1], 2)}% du rythme annuel IPCC (4,5 mm/an)
                      </p>
                    </dd>
                  </div>

                  {/* Coût + décomposition terrain */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Coût estimé</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatCost(result.costMEur)}
                    </dd>
                    {terrainStr && (
                      <p className="text-[11px] text-gray-500 mt-1">{terrainStr}</p>
                    )}
                  </div>

                  {/* Section IMPACT PARTIEL — conditionnelle (CALC-05) */}
                  {partial && (
                    <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-2 flex flex-col gap-1">
                      <p className="text-[11px] text-amber-400 uppercase tracking-wider">Impact partiel</p>
                      <p className="text-[11px] text-gray-400">
                        Si arrêté au km {partial.reachableKm.toFixed(1)} :
                      </p>
                      <p className="text-[13px] font-semibold text-white">
                        {formatInterval(partial.deltaSLmm, 'mm')}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {partial.percentOfFull.toFixed(0)}% du tracé réalisable · Coût {formatCost(partial.costMEur)}
                      </p>
                    </div>
                  )}
                </dl>
              )}

              {/* Si computeCalculation null mais on a un canal+profile → dimensions invalides */}
              {!hasResult && (
                <div className="px-4 py-2">
                  <p role="alert" className="text-xs text-red-400">
                    Saisissez des dimensions valides (&gt; 0)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

Rien à tester unitairement pour l'UI Phase 4 (jsdom + Recharts non utilisé ici). Vérification : `npx tsc --noEmit` doit passer.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -c "CalculationPanel" src/components/CalculationPanel.tsx | awk '{ if ($1 < 2) { print "FAIL: composant non défini"; exit 1 } else print "OK" }'</automated>
  </verify>
  <acceptance_criteria>
    - Le fichier `src/components/CalculationPanel.tsx` existe
    - `grep -c "export function CalculationPanel" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "useCalculation()" src/components/CalculationPanel.tsx` retourne 1
    - `grep -cE "Calcul d.apos.impact|Calcul d'impact" src/components/CalculationPanel.tsx` retourne au moins 1
    - `grep -c "VOLUME\|Volume" src/components/CalculationPanel.tsx | grep -v '^#' | head -1` retourne au moins 1
    - `grep -c "Impact mer" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "vs IPCC 2100" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "Coût estimé" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "Impact partiel" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "role=\"progressbar\"" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "aria-label=\"Largeur du canal en mètres\"" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "aria-label=\"Profondeur du canal en mètres\"" src/components/CalculationPanel.tsx` retourne 1
    - `grep -c "formatInterval" src/components/CalculationPanel.tsx` retourne au moins 4 (helper + 3+ usages)
    - `grep -c " – " src/components/CalculationPanel.tsx` retourne au moins 1 (em dash U+2013)
    - `grep -c "Md€" src/components/CalculationPanel.tsx` retourne 1 (Pitfall 6)
    - `npx tsc --noEmit` exit 0
  </acceptance_criteria>
  <done>CalculationPanel créé conformément à UI-SPEC, helpers de formatage en place, accessibility labels ajoutés, em dash utilisé.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Brancher CalculationPanel dans SidePanel + ajouter stop marker amber dans MapView</name>
  <read_first>
    - src/components/SidePanel.tsx (intégral — emplacement après ElevationPanel)
    - src/components/MapView.tsx (lignes 199-293 — pattern routing markers)
    - src/components/CalculationPanel.tsx (créé en Task 2)
    - src/hooks/useCalculation.ts (créé en Task 1)
    - .planning/phases/04-moteur-de-calcul/04-UI-SPEC.md (§MapView Extension: Stop Marker)
  </read_first>
  <behavior>
    - SidePanel importe et rend <CalculationPanel /> entre <ElevationPanel /> et le footer (UI-SPEC §Positioning)
    - MapView gagne un stopMarkerRef = useRef<maplibregl.Marker | null>(null)
    - Un nouveau useEffect écoute [selectedCanalId, partialResult] et :
      - cleanup du marker existant (remove + ref = null)
      - si partial !== null, crée new maplibregl.Marker({ color: '#F59E0B', scale: 0.8 }).setLngLat(stopCoord).addTo(map)
      - cleanup obligatoire dans return (Pitfall 3 RESEARCH.md)
    - MapView utilise useCalculation() pour obtenir partial — exposé directement, pas via store
  </behavior>
  <action>

**3.1 — Modifier `src/components/SidePanel.tsx` :**

Ajouter l'import en haut (après les imports existants) :
```typescript
import { CalculationPanel } from './CalculationPanel'
```

Insérer `<CalculationPanel />` dans le JSX, ENTRE `<ElevationPanel />` et la div du footer. Remplacer la section actuelle :
```tsx
      {/* Section 4 — Profil altimétrique (accordéon) */}
      <ElevationPanel />

      {/* Section 5 — Footer (réservé Phase 6) */}
```
par :
```tsx
      {/* Section 4 — Profil altimétrique (accordéon) */}
      <ElevationPanel />

      {/* Section 5 — Calcul d'impact (accordéon) — Phase 4 */}
      <CalculationPanel />

      {/* Section 6 — Footer (réservé Phase 6) */}
```

**3.2 — Modifier `src/components/MapView.tsx` :**

Ajouter l'import du hook en haut (après les imports existants) :
```typescript
import { useCalculation } from '../hooks/useCalculation'
```

Ajouter dans le composant `MapView`, après les refs `startMarkerRef` / `endMarkerRef` (ligne ~200) :
```typescript
  // Marker point d'arrêt impact partiel — Phase 4 (Pitfall 3 : cleanup obligatoire)
  const stopMarkerRef = useRef<maplibregl.Marker | null>(null)
```

Ajouter dans le composant `MapView`, après le useEffect existant qui écoute `selectedCanalId` (celui qui appelle `syncUphillLayer` ~ligne 307-312), un nouveau useEffect :

```typescript
  // ── Marker amber au stopCoord du PartialImpactResult — Phase 4 CALC-05 ──
  const { partial } = useCalculation()

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    // Cleanup systématique du marker précédent
    stopMarkerRef.current?.remove()
    stopMarkerRef.current = null

    if (!partial) return

    const [lng, lat] = partial.stopCoord
    stopMarkerRef.current = new maplibregl.Marker({
      color: '#F59E0B',  // amber — distingué de start (#22C55E vert) et end (#EF4444 rouge)
      scale: 0.8,
    })
      .setLngLat([lng, lat])
      .addTo(map)

    // Cleanup au unmount ou quand selectedCanal/partial change (Pitfall 3)
    return () => {
      stopMarkerRef.current?.remove()
      stopMarkerRef.current = null
    }
  }, [partial?.stopCoord[0], partial?.stopCoord[1]])
```

Notes :
- Les dépendances `partial?.stopCoord[0]` et `partial?.stopCoord[1]` (et non `partial` lui-même) évitent les recréations inutiles si l'objet partial est nouveau mais le coord identique.
- `useCalculation` retourne déjà des valeurs memoïsées (T01) — pas de risque de boucle.
- Le marker n'est jamais dans Zustand (Anti-Pattern RESEARCH.md).

**3.3 — Vérification finale :**

Lancer la suite complète et le typecheck.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm test 2>&1 | tee /tmp/t03-task3.txt; FAIL=$(grep -cE "FAIL|✗ " /tmp/t03-task3.txt); echo "FAIL=$FAIL"; if [ "$FAIL" -gt 0 ]; then exit 1; fi; npm run build 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "import { CalculationPanel } from './CalculationPanel'" src/components/SidePanel.tsx` retourne 1
    - `grep -c "<CalculationPanel />" src/components/SidePanel.tsx` retourne 1
    - `grep -c "import { useCalculation } from '../hooks/useCalculation'" src/components/MapView.tsx` retourne 1
    - `grep -c "stopMarkerRef" src/components/MapView.tsx` retourne au least 3 (declaration + cleanup + creation)
    - `grep -c "#F59E0B" src/components/MapView.tsx` retourne 1 (couleur amber stop marker)
    - `grep -c "useCalculation()" src/components/MapView.tsx` retourne 1
    - `grep -c "scale: 0.8" src/components/MapView.tsx` retourne 1
    - `npx tsc --noEmit` exit 0
    - `npm test` : 0 échec, ALL GREEN
    - `npm run build` réussit (exit 0)
  </acceptance_criteria>
  <done>SidePanel intègre CalculationPanel, MapView affiche stopMarker amber pour impact partiel, build production passe, tous tests verts.</done>
</task>

</tasks>

<verification>
**Vérification finale du plan T03 :**

```bash
# Type safety
npx tsc --noEmit

# Tests complets (engine + store + Phase 1-3 préservés)
npm test

# Build production
npm run build

# Sanity grep
grep -c "CalculationPanel" src/components/SidePanel.tsx        # 2 (import + usage)
grep -c "stopMarkerRef" src/components/MapView.tsx              # 3+
grep -c "#F59E0B" src/components/MapView.tsx                    # 1
grep -c "calcParams" src/store/canalStore.ts                    # 3+ (interface + state + setter)
```

**Vérification manuelle attendue (post-execute, lors du recettage humain final) :**
1. Ouvrir l'app, tracer un canal (Paris→Marseille par ex.)
2. Le sélectionner — le panel "CALCUL D'IMPACT" s'ouvre avec inputs 50/5 et résultats en intervalles
3. Modifier largeur → la barre IPCC bouge
4. Tracer un canal avec montée — la section "IMPACT PARTIEL" apparaît + marker amber sur la carte au km d'arrêt
5. Désélectionner → marker amber disparaît
</verification>

<success_criteria>
- [ ] Store `useCanalStore` gagne `calcParams: { width: 50, depth: 5 }` + `setCalcParams`
- [ ] `src/store/canalStore.test.ts` contient 3 nouveaux tests Phase 4 GREEN
- [ ] `src/hooks/useCalculation.ts` créé, retourne `{ result, partial }` memoïsés
- [ ] `src/components/CalculationPanel.tsx` créé : accordéon, inputs, résultats en intervalles, barre IPCC, impact partiel conditionnel
- [ ] `src/components/SidePanel.tsx` rend `<CalculationPanel />` après `<ElevationPanel />`
- [ ] `src/components/MapView.tsx` affiche un marker amber `#F59E0B` au `stopCoord` quand `partial !== null`, et le nettoie au cleanup
- [ ] `npm test` : 0 échec (43+ existants + 3 nouveaux + tous tests engine GREEN de T02)
- [ ] `npm run build` réussit
- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] UX-01 respecté : tous les nombres affichés sont des intervalles `[X – Y] unité` (em dash U+2013)
</success_criteria>

<output>
Après complétion, créer `.planning/phases/04-moteur-de-calcul/04-03-SUMMARY.md` documentant :
- Liste des 6 fichiers modifiés/créés
- Compte de tests (avant/après)
- Confirmation que `npm run build` passe
- Captures écran ou checklist visuelle des 5 points de vérification manuelle ci-dessus (à compléter par l'utilisateur lors du recettage final)
- Toute déviation par rapport à UI-SPEC (formats, classes Tailwind, copywriting)
- Phase 4 complète : tous les requirements CALC-01..CALC-05 + UX-01 livrés
</output>

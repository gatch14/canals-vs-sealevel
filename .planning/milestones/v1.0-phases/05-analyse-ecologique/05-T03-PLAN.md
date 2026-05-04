---
phase: 05-analyse-ecologique
plan: T03
type: execute
wave: 3
depends_on: [T02]
files_modified:
  - src/hooks/useEcology.ts
  - src/components/EcologyPanel.tsx
  - src/components/SidePanel.tsx
autonomous: true
requirements:
  - ECO-01
  - ECO-02
  - ECO-03
  - ECO-04

must_haves:
  truths:
    - "useEcology() retourne EcologyResult | null via useMemo — recalcul seulement quand selectedCanal change"
    - "EcologyPanel s'ouvre automatiquement quand un canal est sélectionné"
    - "EcologyPanel affiche [X – Y] km² pour ECO-01 et [X – Y] ans pour ECO-02 avec em dash U+2013"
    - "ECO-03 alerte en rouge (text-red-400) avec role='alert' si bassin endorheïque détecté"
    - "ECO-04 warning en amber (text-amber-400) avec role='alert' si risque climatique"
    - "EcologyPanel est inséré dans SidePanel après CalculationPanel (Section 5b)"
    - "Les 6 états du panel sont tous implémentés conformément à UI-SPEC.md"
  artifacts:
    - path: "src/hooks/useEcology.ts"
      provides: "Hook useMemo lisant le canal sélectionné et appelant computeEcologyAnalysis"
      exports: ["useEcology"]
    - path: "src/components/EcologyPanel.tsx"
      provides: "Accordéon 6 états conforme UI-SPEC §Component Specification: EcologyPanel"
      exports: ["EcologyPanel"]
    - path: "src/components/SidePanel.tsx"
      provides: "SidePanel étendu avec EcologyPanel après CalculationPanel"
  key_links:
    - from: "src/components/EcologyPanel.tsx"
      to: "src/hooks/useEcology.ts"
      via: "import useEcology"
      pattern: "import.*useEcology.*from.*hooks"
    - from: "src/hooks/useEcology.ts"
      to: "src/lib/ecologyEngine.ts"
      via: "computeEcologyAnalysis dans useMemo"
      pattern: "computeEcologyAnalysis"
    - from: "src/components/SidePanel.tsx"
      to: "src/components/EcologyPanel.tsx"
      via: "<EcologyPanel /> après <CalculationPanel />"
      pattern: "EcologyPanel"
    - from: "src/components/EcologyPanel.tsx"
      to: "src/types/calculation.ts"
      via: "formatInterval (réutilisé depuis CalculationPanel ou extrait)"
      pattern: "formatInterval"
---

<objective>
Wave 2 UI: Créer le hook useEcology, le composant EcologyPanel (6 états) et l'insérer dans SidePanel. L'analyse écologique s'affiche automatiquement dès qu'un canal est sélectionné.

Purpose: Rendre visibles les résultats du moteur écologique (T02) à l'utilisateur — conformément à UI-SPEC.md § Component Specification: EcologyPanel.
Output: useEcology.ts + EcologyPanel.tsx (6 états) + SidePanel.tsx mis à jour.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/05-analyse-ecologique/05-CONTEXT.md
@.planning/phases/05-analyse-ecologique/05-UI-SPEC.md
@.planning/phases/05-analyse-ecologique/05-T02-SUMMARY.md

<interfaces>
<!-- Contrats établis dans T01 et T02 -->

From src/types/ecology.ts:
```typescript
export type AridityClass = 'hyperarid' | 'arid' | 'semiarid'

export interface DesertIntersection {
  totalDesertKm: number
  aridityClass: AridityClass
  areaKm2: Interval        // [min, max] km²
}

export interface EndorheicAlert {
  detected: boolean
  basinName?: string
  examples?: string
}

export interface EcologyResult {
  desertIntersection: DesertIntersection | null
  greeningTimeline: Interval | null
  endorheicAlert: EndorheicAlert
  climateRiskFlag: boolean
}
```

From src/lib/ecologyEngine.ts (exportée depuis T02):
```typescript
export function computeEcologyAnalysis(canal: Canal): EcologyResult | null
```

From src/hooks/useCalculation.ts (pattern exact à copier):
```typescript
export function useCalculation(): CalculationHookResult {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
  return useMemo(() => { ... }, [selectedCanal, selectedCanal?.elevation, ...])
}
```

From src/components/SidePanel.tsx (point d'insertion):
```tsx
{/* Section 5 — Calcul d'impact (accordéon) — Phase 4 */}
<CalculationPanel />

{/* Section 5b — Analyse écologique (accordéon) — Phase 5 ← INSÉRER ICI */}

{/* Section 6 — Footer (réservé Phase 6) */}
<div className="px-4 py-3 border-t border-white/[0.08] text-xs text-gray-500">
```

formatInterval helper (depuis CalculationPanel.tsx):
```typescript
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}
// Pour ECO-01 et ECO-02 : decimals = 0 (entiers)
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Hook useEcology.ts</name>
  <files>src/hooks/useEcology.ts</files>
  <behavior>
    - useEcology() lit selectedCanalId + canals depuis useCanalStore
    - Trouve selectedCanal = canals.find(c => c.id === selectedCanalId) ?? null
    - useMemo dépend uniquement de selectedCanal (pas de calcParams — pas de paramètres input pour l'écologie)
    - Retourne computeEcologyAnalysis(selectedCanal) ou null si pas de canal
    - Type de retour : EcologyResult | null
  </behavior>
  <action>
Créer `src/hooks/useEcology.ts` en copiant le pattern de `src/hooks/useCalculation.ts` :

```typescript
// src/hooks/useEcology.ts
// Hook orchestrateur Phase 5 — lit le canal sélectionné, mémoïse l'analyse écologique.
// Pattern identique à useCalculation.ts — useMemo obligatoire (Pitfall P2 RESEARCH.md).
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

Note : la dépendance sur `selectedCanal` couvre automatiquement les changements de points (canal.points est une propriété de l'objet Canal dans le store). Pas besoin de dépendance sur `selectedCanal?.elevation` car ecologyEngine n'utilise pas le profil d'élévation.
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -i "useEcology" || echo "useEcology OK"</automated>
  </verify>
  <done>useEcology.ts compile sans erreur TypeScript. Pattern useMemo identique à useCalculation.ts.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Composant EcologyPanel.tsx (6 états) + SidePanel intégration</name>
  <files>src/components/EcologyPanel.tsx, src/components/SidePanel.tsx</files>
  <behavior>
    État 1 (noCanal): message italique gris "Sélectionnez un canal pour analyser son impact écologique"
    État 2 (canal sans élévation): AlertCircle amber + message amber "Chargez le profil altimétrique pour l'analyse écologique"
    État 3 (résultat null, canal+élévation présents): message gris "Aucune zone écologique significative sur ce tracé"
    État 4 (desertIntersection non-null): dl avec areaKm2 en [X – Y] km² et greeningTimeline en [X – Y] ans + label d'aridité
    État 5 (endorheicAlert.detected): bloc rouge avec role="alert", AlertCircle, basinName, examples
    État 6 (climateRiskFlag): bloc amber avec role="alert", AlertCircle, deux lignes de texte
    États 4+5+6 sont additifs — peuvent s'afficher simultanément
    Accordéon: isOpen=true par défaut, s'ouvre automatiquement à la sélection d'un canal
    aria-expanded sur le bouton accordéon
    formatInterval avec decimals=0 pour ECO-01 et ECO-02
    formatInterval copié dans le composant (pas d'extraction — rester simple comme CalculationPanel.tsx)
    Copie EXACTE des classes Tailwind de CalculationPanel pour l'accordéon header (h-8, px-4, etc.)
  </behavior>
  <action>
1. Créer `src/components/EcologyPanel.tsx` — accordéon 6 états.

Copier exactement le pattern accordéon de CalculationPanel.tsx :
- wrapper `<div className="border-t border-white/[0.08]">`
- button avec `w-full h-8 px-4 flex items-center gap-2...` (classes identiques)
- ChevronDown size={14}, rotate-180 si isOpen
- label : `"Analyse écologique"` uppercase tracking-wider text-[12px] text-gray-400

Copier les fonctions de formatage depuis CalculationPanel.tsx :
```typescript
function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}
```
(em dash U+2013 obligatoire — vérifier dans le fichier CalculationPanel.tsx existant)

Logique des états dérivés :
```typescript
const noCanal = !selectedCanalId
const noProfile = selectedCanal !== null && !selectedCanal.elevation
// État 3 : résultat null mais canal + elevation présents
const noImpact = ecologyResult !== null &&
  ecologyResult.desertIntersection === null &&
  !ecologyResult.endorheicAlert.detected &&
  !ecologyResult.climateRiskFlag
```

Labels d'aridité (UI-SPEC §State 4) :
```typescript
const ARIDITY_LABELS: Record<string, string> = {
  hyperarid: 'Hyperaride (Sahara, Atacama, Namib)',
  arid: 'Aride (Sahel, steppes d\'Asie centrale)',
  semiarid: 'Semi-aride',
}
```

État 5 — alerte endorheïque (rouge) :
- role="alert" sur le container
- basinName fallback : "un bassin endorheïque fermé"
- examples : afficher seulement si défini

État 6 — risque climatique (amber) :
- role="alert" sur le container
- Deux lignes : "Introduction d'eau dans une zone aride et chaude" + "Risque de gradients de pression et de phénomènes météorologiques locaux"

2. Modifier `src/components/SidePanel.tsx` — ajouter EcologyPanel après CalculationPanel :
```tsx
import { EcologyPanel } from './EcologyPanel'
// ...
{/* Section 5 — Calcul d'impact (accordéon) — Phase 4 */}
<CalculationPanel />

{/* Section 5b — Analyse écologique (accordéon) — Phase 5 */}
<EcologyPanel />

{/* Section 6 — Footer (réservé Phase 6) */}
```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -E "(EcologyPanel|useEcology|ecology)" || echo "EcologyPanel OK"</automated>
  </verify>
  <done>
EcologyPanel.tsx compile sans erreur TypeScript.
SidePanel.tsx importe et rend EcologyPanel après CalculationPanel.
npx tsc --noEmit → 0 erreur sur l'ensemble du projet.
npm run build (si disponible) → 0 erreur de build.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Analyse écologique complète — hook useEcology + EcologyPanel (6 états) + intégration SidePanel.
L'analyse se déclenche automatiquement dès qu'un canal est sélectionné.
  </what-built>
  <how-to-verify>
1. Lancer l'app : `cd C:/dev/gsd/science/canal && npm run dev`
2. Ouvrir http://localhost:5173

**Test ECO-01 + ECO-02 (déserts) :**
3. Tracer un canal traversant le Sahara (ex: point A [-5, 20], point B [30, 25])
4. Charger le profil altimétrique (bouton dans SidePanel)
5. Dans EcologyPanel (sous "Calcul d'impact") : vérifier l'affichage "Zone aride traversée" avec [X – Y] km² et "Verdissement estimé" avec [X – Y] ans

**Test ECO-03 (bassin endorheïque) :**
6. Tracer un canal de [20, 45] vers [51, 43] (terminus dans la Mer Caspienne)
7. Vérifier : alerte rouge "Alerte — Bassin endorheïque" avec "Mer Caspienne" visible

**Test ECO-04 (risque climatique) :**
8. Le canal précédent (traversant le Sahara à lat ~22°) doit aussi montrer le warning amber "Risque climatique"

**Test états vides :**
9. Ne sélectionner aucun canal → EcologyPanel affiche "Sélectionnez un canal pour analyser son impact écologique"
10. Sélectionner un canal sans profil → EcologyPanel affiche le message amber "Chargez le profil altimétrique"
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| EcologyResult → EcologyPanel | Données calculées côté client — pas d'input utilisateur direct dans l'analyse écologique |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-06 | Information Disclosure | EcologyPanel affichage | accept | Affiche uniquement des données calculées localement — pas de données sensibles |
| T-05-07 | Tampering | basinName / examples depuis GeoJSON | mitigate | Ne pas appeler `.innerHTML` ou `dangerouslySetInnerHTML` — utiliser uniquement `{basinName}` en JSX (React escape automatique) |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# TypeScript compile — projet complet
npx tsc --noEmit
# Tous les tests passent (incluant T01/T02)
npm test
# Dev server démarre sans erreur
npm run dev
```
</verification>

<success_criteria>
- useEcology.ts compile et exporte useEcology(): EcologyResult | null
- EcologyPanel.tsx implémente les 6 états conformes à UI-SPEC.md
- SidePanel.tsx rend EcologyPanel après CalculationPanel
- npx tsc --noEmit → 0 erreur
- npm test → 11/11 tests ecologyEngine GREEN + aucune régression
- EcologyPanel s'ouvre automatiquement à la sélection d'un canal
- Alertes ECO-03 (rouge) et ECO-04 (amber) affichent role="alert"
- Checkpoint humain approuvé : 6 vérifications visuelles OK
</success_criteria>

<output>
After completion, create `.planning/phases/05-analyse-ecologique/05-T03-SUMMARY.md`
</output>

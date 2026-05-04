---
phase: 08-candidats-ia
plan: T03
type: execute
wave: 3
depends_on: [08-T02]
files_modified:
  - src/components/CandidatesPanel.tsx
  - src/components/CandidateListItem.tsx
  - src/components/SidePanel.tsx
autonomous: true
requirements: [IA-01, IA-02, IA-03]

must_haves:
  truths:
    - "L'utilisateur voit un accordéon 'Candidats mondiaux' dans le panneau latéral, collapsé par défaut"
    - "En ouvrant l'accordéon, l'utilisateur voit 25 items compacts triés par ΔSL décroissant"
    - "Chaque item affiche : nom, région, ΔSL [min – max] mm — sur 1–2 lignes"
    - "En cliquant sur un item, les détails s'affichent (faisabilité gravitaire, coût estimé [min – max] G€)"
    - "Un bouton 'Charger sur la carte' charge le tracé sans supprimer les canaux existants et le sélectionne"
    - "Qattara Depression est en tête de liste visible en premier"
  artifacts:
    - path: "src/components/CandidatesPanel.tsx"
      provides: "Accordéon principal — liste les CandidateListItem"
      exports: [CandidatesPanel]
    - path: "src/components/CandidateListItem.tsx"
      provides: "Item de liste compacte avec expand/collapse et bouton charger"
      exports: [CandidateListItem]
    - path: "src/components/SidePanel.tsx"
      provides: "Section 8 avec CandidatesPanel intégré après ClearDataButton"
      contains: "CandidatesPanel"
  key_links:
    - from: "src/components/CandidatesPanel.tsx"
      to: "src/hooks/useCandidates"
      via: "import useCandidates"
      pattern: "useCandidates"
    - from: "src/components/CandidateListItem.tsx"
      to: "src/store/canalStore.ts"
      via: "useCanalStore loadCandidate"
      pattern: "loadCandidate"
    - from: "src/components/SidePanel.tsx"
      to: "src/components/CandidatesPanel.tsx"
      via: "import CandidatesPanel + Section 8"
      pattern: "CandidatesPanel"
---

<objective>
Créer les composants UI CandidatesPanel et CandidateListItem suivant le pattern EcologyPanel (accordéon Tailwind dark), puis intégrer en Section 8 de SidePanel après ClearDataButton.

Purpose: L'utilisateur peut explorer la bibliothèque de 25 candidats mondiaux et charger n'importe quel tracé sur la carte en un clic — livraison finale de IA-01, IA-02, IA-03.

Output: CandidatesPanel.tsx, CandidateListItem.tsx, SidePanel.tsx (modifié Section 8)
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/08-candidats-ia/08-T02-SUMMARY.md

<interfaces>
<!-- Interfaces et patterns à utiliser directement — extraits du codebase -->

From src/types/candidate.ts (T01):
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
```

From src/hooks/useCandidates.ts (T02):
```typescript
export function useCandidates(): readonly CanalCandidate[]
// Retourne 25 candidats triés par dsl_max décroissant — pas de dépendances dynamiques
```

From src/store/canalStore.ts (T02 étendu):
```typescript
// Nouveau sélecteur disponible:
loadCandidate: (candidate: CanalCandidate) => void
// Usage: useCanalStore((s) => s.loadCandidate)
```

Pattern accordéon (EcologyPanel.tsx) — à reproduire exactement:
```typescript
const [isOpen, setIsOpen] = useState(false) // collapsé par défaut
// Header:
<button onClick={() => setIsOpen((o) => !o)}
  className="w-full h-8 px-4 flex items-center gap-2 text-left
             hover:bg-white/[0.04] transition-colors
             focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
             outline-none"
  aria-expanded={isOpen}>
  <ChevronDown size={14}
    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
  <span className="text-[12px] font-normal text-gray-400 uppercase tracking-wider">
    Titre section
  </span>
</button>
{isOpen && (<div>...contenu...</div>)}
```

Couleurs Tailwind dark theme établies:
- bg-gray-800 : fond item
- border-white/[0.08] : séparateur standard
- border-white/[0.06] : séparateur interne subtil
- text-gray-400 : texte secondaire
- text-gray-500 : texte tertiaire/hints
- text-white : valeur principale
- text-green-400 : indicateur faisabilité OK
- text-amber-400 : indicateur faisabilité KO / avertissement
- text-[11px] text-[12px] text-[13px] : échelle typographique des panels

Formatage UX-01 (em-dash obligatoire):
- ΔSL : `[${dsl_min.toFixed(2)} – ${dsl_max.toFixed(2)}] mm`
- Coût : `[${cost_min} – ${cost_max}] G€`
- Séparateur : em-dash U+2013 (–), pas tiret (-)

SidePanel.tsx — emplacement Section 8 (après ClearDataButton):
```tsx
{/* Section 7 — Effacement données (Phase 7) */}
<div className="px-4 py-4 border-t border-white/[0.08] mt-auto">
  <ClearDataButton />
</div>
// → Section 8 s'insère AVANT Section 7 (dans le corps scrollable, avant mt-auto)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Créer CandidateListItem.tsx</name>
  <files>src/components/CandidateListItem.tsx</files>
  <action>
Créer src/components/CandidateListItem.tsx.

Comportement :
- État local `isExpanded: boolean` (useState false) — clic sur l'item toggle l'expand
- Ligne compacte (toujours visible) : nom en text-[13px] text-white + région en text-[11px] text-gray-500 + ΔSL [min – max] mm en text-[12px] text-gray-400 à droite
- Zone étendue (isExpanded=true) : affiche faisabilité gravitaire + coût [min – max] G€ + bouton "Charger sur la carte"
- Faisabilité : icône CheckCircle (vert) si feasible=true, AlertCircle (ambre) si false, avec texte "Gravitairement faisable" / "Montée détectée"
- Bouton charger : appelle loadCandidate(candidate) via useCanalStore
- Classes : bg-gray-800/40 sur hover, rounded, cursor-pointer sur la ligne principale

```typescript
// src/components/CandidateListItem.tsx
// Item de liste Phase 8 — compact avec expand pour détails + bouton charger (IA-02, IA-03)
import { useState } from 'react'
import { ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import type { CanalCandidate } from '../types/candidate'

interface Props {
  candidate: CanalCandidate
}

export function CandidateListItem({ candidate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const loadCandidate = useCanalStore((s) => s.loadCandidate)

  const handleLoad = (e: React.MouseEvent) => {
    e.stopPropagation()
    loadCandidate(candidate)
  }

  return (
    <li className="rounded overflow-hidden">
      {/* Ligne compacte — toujours visible */}
      <button
        onClick={() => setIsExpanded((o) => !o)}
        className="w-full px-3 py-2 flex items-start gap-2 text-left
                   hover:bg-white/[0.04] transition-colors
                   focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                   outline-none"
        aria-expanded={isExpanded}
      >
        <ChevronDown
          size={12}
          className={`text-gray-500 mt-[3px] shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white truncate leading-tight">{candidate.name}</p>
          <p className="text-[11px] text-gray-500 truncate">{candidate.region}</p>
        </div>
        <span className="text-[11px] text-gray-400 shrink-0 mt-[1px]">
          [{candidate.dsl_min.toFixed(2)}&ndash;{candidate.dsl_max.toFixed(2)}] mm
        </span>
      </button>

      {/* Zone étendue — détails + bouton charger */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-white/[0.06] bg-white/[0.02]">
          <dl className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1">
              {candidate.feasible ? (
                <CheckCircle size={11} className="text-green-400 shrink-0" />
              ) : (
                <AlertCircle size={11} className="text-amber-400 shrink-0" />
              )}
              <span className={`text-[11px] ${candidate.feasible ? 'text-green-400' : 'text-amber-400'}`}>
                {candidate.feasible ? 'Gravitairement faisable' : 'Montée d’altitude détectée'}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <dt className="text-[11px] text-gray-500">Coût estimé</dt>
              <dd className="text-[12px] text-white">
                [{candidate.cost_min}&nbsp;–&nbsp;{candidate.cost_max}]&nbsp;G€
              </dd>
            </div>
          </dl>

          <button
            onClick={handleLoad}
            className="mt-3 w-full h-7 rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                       text-[12px] text-white font-medium transition-colors
                       focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                       outline-none"
          >
            Charger sur la carte
          </button>
        </div>
      )}
    </li>
  )
}
```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep "CandidateListItem" | head -5</automated>
  </verify>
  <done>CandidateListItem.tsx créé sans erreur TypeScript — props typées CanalCandidate, expand/collapse, bouton charger</done>
</task>

<task type="auto">
  <name>Task 2: Créer CandidatesPanel.tsx + intégrer SidePanel Section 8</name>
  <files>src/components/CandidatesPanel.tsx, src/components/SidePanel.tsx</files>
  <action>
**A) Créer src/components/CandidatesPanel.tsx**

Accordéon collapsé par défaut (isOpen=false — per décision CONTEXT.md).
Affiche la liste des 25 CandidateListItem via useCandidates().
Classe conteneur identique à EcologyPanel : `border-t border-white/[0.08]`.

```typescript
// src/components/CandidatesPanel.tsx
// Accordéon Phase 8 — bibliothèque de 25 canaux mondiaux pré-calculés (IA-01, IA-02, IA-03)
// Pattern EcologyPanel.tsx — accordéon collapsé par défaut, dark theme
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useCandidates } from '../hooks/useCandidates'
import { CandidateListItem } from './CandidateListItem'

export function CandidatesPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const candidates = useCandidates()

  return (
    <div className="border-t border-white/[0.08]">
      {/* Header accordéon — identique au pattern EcologyPanel */}
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
          Candidats mondiaux
        </span>
        <span className="ml-auto text-[11px] text-gray-600">{candidates.length}</span>
      </button>

      {isOpen && (
        <div className="pb-2">
          <ul className="flex flex-col gap-[2px] px-2">
            {candidates.map((candidate) => (
              <CandidateListItem key={candidate.id} candidate={candidate} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

**B) Modifier src/components/SidePanel.tsx**

Ajouter Section 8 avec CandidatesPanel dans le corps scrollable, AVANT la Section 7 (ClearDataButton).

Modifications à apporter :
1. Ajouter import en tête de fichier (après l'import ClearDataButton) :
   ```typescript
   import { CandidatesPanel } from './CandidatesPanel'
   ```

2. Dans le corps scrollable, ajouter Section 8 juste AVANT la div de Section 7 (`border-t border-white/[0.08] mt-auto`) :
   ```tsx
   {/* Section 8 — Candidats mondiaux pré-calculés (Phase 8) */}
   <CandidatesPanel />
   ```

La Section 7 (ClearDataButton avec mt-auto) reste en bas grâce au `mt-auto` existant — Section 8 s'insère naturellement dans le flux scrollable avant elle.
  </action>
  <verify>
    <automated>npx vitest run 2>&1 | tail -10</automated>
  </verify>
  <done>Suite complète passe GREEN (101+ tests), CandidatesPanel visible dans SidePanel entre DashboardPanel et ClearDataButton, accordéon collapsé par défaut</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| UI → loadCandidate → store | Action déclenchée par clic utilisateur — crée un Canal depuis données bundlées |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-08-05 | Tampering | CandidateListItem bouton charger | accept | loadCandidate crée un Canal depuis JSON bundlé (build-time), pas de données réseau ni user-input injectées |
| T-08-06 | Denial of Service | CandidatesPanel — 25 items render | accept | 25 items statiques avec expand individuel — pas de virtualisation nécessaire à cette échelle |
</threat_model>

<verification>
- `npx tsc --noEmit` passe sur l'ensemble du projet
- `npx vitest run` — suite complète sans régression
- Vérification manuelle : ouvrir l'app, Section 8 "CANDIDATS MONDIAUX" visible dans SidePanel
- Cliquer sur "Qattara Depression", expand affiche ΔSL [1.93 – 3.59] mm + coût [4 – 15] G€
- Cliquer "Charger sur la carte" — tracé apparaît sur la carte, Qattara sélectionné
- Charger un 2ème candidat — le 1er reste présent (non-destructif)
</verification>

<success_criteria>
- CandidatesPanel.tsx : accordéon collapsé par défaut, liste 25 items via useCandidates()
- CandidateListItem.tsx : compact avec expand (nom, région, ΔSL), zone étendue (faisabilité, coût, bouton charger)
- SidePanel.tsx : Section 8 ajoutée avant Section 7, import CandidatesPanel présent
- Suite complète tests GREEN sans régression
- Phase 8 entièrement livrée : IA-01 (liste triée) + IA-02 (métadonnées) + IA-03 (chargement un clic)
</success_criteria>

<output>
Après completion, créer `.planning/phases/08-candidats-ia/08-T03-SUMMARY.md`
</output>

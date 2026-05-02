---
phase: 01-map-shell-trac
plan: T03
type: execute
wave: 3
depends_on: [T01, T02]
files_modified:
  - src/App.tsx
  - src/components/SidePanel.tsx
  - src/components/ModeIndicator.tsx
  - src/components/DrawingToolbar.tsx
  - src/components/CanalList.tsx
  - src/components/CanalListItem.tsx
  - src/components/DeleteConfirmDialog.tsx
autonomous: true
requirements:
  - MAP-01
  - MAP-02

must_haves:
  truths:
    - "Le panneau latéral 320px s'affiche sur la droite de la carte avec fond semi-transparent sombre"
    - "Le badge de mode passe de 'Sélection' (gris) à 'Tracé en cours' (bleu) quand on clique 'Dessiner canal'"
    - "En mode sélection, le bouton 'Dessiner canal' est visible dans le panneau"
    - "En mode drawing, le bouton 'Annuler' remplace 'Dessiner canal'"
    - "La liste 'Canaux tracés' affiche l'état vide avec le bon texte d'instruction"
    - "Après avoir tracé un canal, il apparaît dans la liste avec son nom 'Canal N'"
    - "Le dialog de suppression s'ouvre, demande confirmation, supprime ou annule"
    - "L'info-bulle 'Qattara Depression = 2,76 mm' est visible dans le panneau"
  artifacts:
    - path: "src/App.tsx"
      provides: "Layout racine : MapView plein écran + SidePanel"
      exports: ["App"]
    - path: "src/components/SidePanel.tsx"
      provides: "Panneau 320px fixed droite, 4 sections"
      exports: ["SidePanel"]
    - path: "src/components/ModeIndicator.tsx"
      provides: "Bande 32px titre + badge mode"
      exports: ["ModeIndicator"]
    - path: "src/components/DrawingToolbar.tsx"
      provides: "Boutons Dessiner canal / Annuler selon mode"
      exports: ["DrawingToolbar"]
    - path: "src/components/CanalList.tsx"
      provides: "Liste scrollable + empty state + info-bulle Qattara"
      exports: ["CanalList"]
    - path: "src/components/CanalListItem.tsx"
      provides: "Ligne canal + bouton supprimer + sélection"
      exports: ["CanalListItem"]
    - path: "src/components/DeleteConfirmDialog.tsx"
      provides: "Modal confirmation suppression"
      exports: ["DeleteConfirmDialog"]
  key_links:
    - from: "src/App.tsx"
      to: "src/components/MapView.tsx"
      via: "import { MapView }"
      pattern: "MapView"
    - from: "src/App.tsx"
      to: "src/components/SidePanel.tsx"
      via: "import { SidePanel }"
      pattern: "SidePanel"
    - from: "src/components/CanalList.tsx"
      to: "src/store/canalStore.ts"
      via: "useCanalStore((s) => s.canals)"
      pattern: "useCanalStore"
    - from: "src/components/CanalListItem.tsx"
      to: "src/components/DeleteConfirmDialog.tsx"
      via: "confirmOpen state + modal conditionnelle"
      pattern: "DeleteConfirmDialog"
---

<objective>
Construction des 7 composants UI React du panneau latéral et wiring final dans App.tsx. Chaque composant lit le store Zustand via sélecteurs granulaires et se conforme au contrat visuel de UI-SPEC.md.

Purpose: Compléter la Phase 1 — l'utilisateur peut désormais tracer des canaux ET les voir listés avec possibilité de suppression. Tous les critères de succès ROADMAP Phase 1 sont satisfaits.

Output: App complète et fonctionnelle selon les 3 success criteria de ROADMAP : carte visible, tracé de canaux opérationnel, liste avec suppression.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-map-shell-trac/01-UI-SPEC.md
@.planning/phases/01-map-shell-trac/01-PATTERNS.md
@.planning/phases/01-map-shell-trac/01-T01-SUMMARY.md
@.planning/phases/01-map-shell-trac/01-T02-SUMMARY.md

<interfaces>
<!-- Contrats produits par T01 et T02 — T03 consomme ces exports -->

src/store/canalStore.ts :
```typescript
// Sélecteurs utilisés dans les composants UI
useCanalStore((s) => s.canals)          // Canal[]
useCanalStore((s) => s.mode)            // 'selection' | 'drawing'
useCanalStore((s) => s.draftPoints)     // Coord[]
useCanalStore((s) => s.selectedCanalId) // string | null
useCanalStore((s) => s.startDrawing)    // () => void
useCanalStore((s) => s.cancelDrawing)   // () => void
useCanalStore((s) => s.deleteCanal)     // (id: string) => void
useCanalStore((s) => s.selectCanal)     // (id: string | null) => void
```

src/types/canal.ts :
```typescript
export interface Canal { id: string; points: Coord[]; name: string; createdAt: number }
```

src/components/MapView.tsx :
```typescript
export function MapView() // div absolute inset-0 contenant la carte
```

Couleurs UI-SPEC (Tailwind) :
- Panneau : bg rgba(26,26,46,0.95) + backdrop-blur-sm (inline style)
- Border : border-l border-white/[0.08]
- Mode selection : bg-gray-800 (ModeIndicator)
- Mode drawing : bg-blue-700 (ModeIndicator)
- Bouton primary : bg-blue-500 hover:bg-blue-600 active:scale-[0.98]
- Bouton cancel : bg-gray-700 hover:bg-gray-600
- List item base : bg-gray-800 hover:bg-gray-700
- List item selected : bg-blue-500/20 border-blue-500/40
- Focus ring : focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900

Textes UI-SPEC (copywriting exact) :
- Titre : "Canal Explorer"
- Bouton draw : "Dessiner canal"
- Bouton cancel : "Annuler"
- Mode badge selection : "Sélection"
- Mode badge drawing : "Tracé en cours"
- Section heading : "Canaux tracés"
- Empty heading : "Aucun canal tracé"
- Empty body : "Cliquez sur \"Dessiner canal\" puis cliquez sur la carte pour poser les points de votre canal. Double-cliquez pour finaliser."
- Warning points : "Posez au moins 2 points pour finaliser le canal"
- Delete confirm title : "Supprimer ce canal ?"
- Delete confirm body : "Cette action est irréversible."
- Delete confirm button : "Supprimer"
- Delete cancel button : "Annuler"
- Info-bulle Qattara : "Qattara Depression = 2,76 mm de baisse si remplie"
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Composants UI panneau (ModeIndicator, DrawingToolbar, CanalList, CanalListItem, DeleteConfirmDialog, SidePanel)</name>
  <read_first>
    .planning/phases/01-map-shell-trac/01-PATTERNS.md (Pattern SidePanel, ModeIndicator, DrawingToolbar, CanalList, CanalListItem, DeleteConfirmDialog — intégralité)
    .planning/phases/01-map-shell-trac/01-UI-SPEC.md (Layout Contract, Color, Copywriting Contract, Interaction Contract)
  </read_first>
  <files>
    src/components/SidePanel.tsx,
    src/components/ModeIndicator.tsx,
    src/components/DrawingToolbar.tsx,
    src/components/CanalList.tsx,
    src/components/CanalListItem.tsx,
    src/components/DeleteConfirmDialog.tsx
  </files>
  <action>
Créer les 6 composants dans l'ordre de dépendance : feuilles d'abord, composites ensuite.

**Ordre de création :**
1. ModeIndicator (dépend de store seulement)
2. DrawingToolbar (dépend de store seulement)
3. DeleteConfirmDialog (dépend de store + props Canal)
4. CanalListItem (dépend de store + DeleteConfirmDialog + props Canal)
5. CanalList (dépend de store + CanalListItem)
6. SidePanel (compose ModeIndicator + DrawingToolbar + CanalList)

**ModeIndicator :**
- `const mode = useCanalStore((s) => s.mode)` — sélecteur granulaire
- Div h-8 (32px) flex items-center justify-between px-4
- Gauche : "Canal Explorer" text-base font-semibold text-white
- Droite : badge "Sélection" ou "Tracé en cours" text-xs
- Mode selection : bg-gray-800 badge text-gray-300
- Mode drawing : bg-blue-700 badge text-white
- Pas de classe bg sur le div — la couleur vient du bg du div entier

**DrawingToolbar :**
- 3 sélecteurs : mode, startDrawing, cancelDrawing, draftPoints
- Si mode === 'selection' : bouton "Dessiner canal" avec icône `<Pencil size={16} />`
  - Classes : `flex items-center gap-2 w-full px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white text-sm font-semibold transition-colors outline-none` + focusRing
- Si mode === 'drawing' : div flex-col gap-2
  - Si draftPoints.length < 2 : `<p className="text-xs text-gray-400">Posez au moins 2 points pour finaliser le canal</p>`
  - Bouton "Annuler" avec icône `<X size={16} />` : `bg-gray-700 hover:bg-gray-600 text-white text-sm`
- focusRing const : `'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'`

**DeleteConfirmDialog :**
- Props : `canal: Canal`, `onClose: () => void`
- Overlay : `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm`
- Card : `w-72 rounded-lg bg-gray-800 border border-white/[0.08] p-6 flex flex-col gap-4`
- Titre : "Supprimer ce canal ?" text-sm font-semibold text-white
- Sous-titre : "Cette action est irréversible." text-xs text-gray-400
- Boutons : row flex gap-2 justify-end
  - "Annuler" : bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded
  - "Supprimer" : bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded
- handleConfirm : `deleteCanal(canal.id)` puis `onClose()`
- Clic sur l'overlay ferme le dialog (stopPropagation sur la card)

**CanalListItem :**
- Props : `canal: Canal`
- State local : `const [confirmOpen, setConfirmOpen] = useState(false)`
- 2 sélecteurs : selectedCanalId, selectCanal
- `isSelected = canal.id === selectedCanalId`
- `<li>` cliquable avec tabIndex=0, onKeyDown Enter = selectCanal
- Classes non-sélectionné : `bg-gray-800 hover:bg-gray-700 border border-transparent`
- Classes sélectionné : `bg-blue-500/20 border border-blue-500/40`
- Nom canal : text-sm text-white truncate
- Bouton Trash2 (size=14) : ghost, hover text-red-500 bg-red-500/10, stopPropagation, aria-label
- Rendu conditionnel : `{confirmOpen && <DeleteConfirmDialog canal={canal} onClose={() => setConfirmOpen(false)} />}`

**CanalList :**
- `const canals = useCanalStore((s) => s.canals)` — sélecteur granulaire
- Heading "Canaux tracés" : text-xs font-normal text-gray-400 uppercase tracking-wider mb-3
- Empty state si `canals.length === 0` : div text-center py-8
  - "Aucun canal tracé" text-sm font-semibold text-gray-300 mb-2
  - Texte d'instruction text-xs text-gray-400 leading-relaxed
- Liste : `<ul className="flex flex-col gap-1">` avec `<CanalListItem key={canal.id} canal={canal} />`
- Info-bulle Qattara : div mt-6 px-3 py-2 rounded bg-gray-800 border border-white/[0.06]
  - "Qattara Depression = 2,76 mm de baisse si remplie" text-xs text-gray-400

**SidePanel :**
- `<aside>` avec classes : `fixed right-0 top-0 h-full w-80 flex flex-col z-10 border-l border-white/[0.08]`
- Style inline : `{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(4px)' }`
- Structure sections :
  1. `<ModeIndicator />` (pas de wrapper — prend toute la largeur)
  2. `<div className="px-4 py-4 border-b border-white/[0.08]"><DrawingToolbar /></div>`
  3. `<div className="flex-1 overflow-y-auto px-4 py-4"><CanalList /></div>`
  4. `<div className="px-4 py-3 border-t border-white/[0.08] text-xs text-gray-500">{/* Phase 6 */}</div>`
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <acceptance_criteria>
    - grep "Canal Explorer" src/components/ModeIndicator.tsx — titre présent
    - grep "Tracé en cours" src/components/ModeIndicator.tsx — badge drawing présent
    - grep "Dessiner canal" src/components/DrawingToolbar.tsx — bouton CTA présent
    - grep "Qattara Depression" src/components/CanalList.tsx — info-bulle ancre présente
    - grep "2,76 mm" src/components/CanalList.tsx — valeur exacte présente (virgule française)
    - grep "Aucun canal tracé" src/components/CanalList.tsx — empty state présent
    - grep "Supprimer ce canal" src/components/DeleteConfirmDialog.tsx — confirmation présente
    - grep "rgba(26, 26, 46, 0.95)" src/components/SidePanel.tsx — couleur panel exacte
    - grep "w-80" src/components/SidePanel.tsx — 320px panel (w-80 = 320px en Tailwind)
    - grep "DeleteConfirmDialog" src/components/CanalListItem.tsx — dialog intégré
    - npx tsc --noEmit — 0 erreurs TypeScript
  </acceptance_criteria>
  <done>
    Les 6 composants existent, compilent sans erreur TypeScript, contiennent les textes exacts du copywriting contract et les classes Tailwind spécifiées.
  </done>
</task>

<task type="auto">
  <name>Task 2: App.tsx wiring final — layout carte + panneau</name>
  <read_first>
    .planning/phases/01-map-shell-trac/01-PATTERNS.md (Pattern src/App.tsx)
    src/components/MapView.tsx (vérifier l'export nommé)
    src/components/SidePanel.tsx (vérifier l'export nommé)
  </read_first>
  <files>src/App.tsx</files>
  <action>
Remplacer le contenu du placeholder App.tsx (créé en T01) par le layout final :

```typescript
import { MapView } from './components/MapView'
import { SidePanel } from './components/SidePanel'

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Map — position absolute, plein écran, z-index 0 implicite */}
      <MapView />
      {/* Panneau — position fixed, z-index 10, 320px droite */}
      <SidePanel />
    </div>
  )
}
```

Classes Tailwind critiques pour le container racine :
- `relative` — context de positionnement pour le MapView absolute
- `h-screen w-screen` — plein viewport exactement (pas 100%, pas vh/vw potentiellement différents)
- `overflow-hidden` — empêche les scrollbars parasites
- `bg-gray-900` — fallback couleur si la carte n'est pas encore chargée

Ne rien ajouter d'autre dans App.tsx — tout l'état et la logique sont dans MapView + SidePanel + le store.
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - grep "MapView" src/App.tsx — import et usage présents
    - grep "SidePanel" src/App.tsx — import et usage présents
    - grep "h-screen w-screen" src/App.tsx — dimensions plein viewport
    - grep "overflow-hidden" src/App.tsx — pas de scrollbars
    - grep "relative" src/App.tsx — context de positionnement présent
    - npx tsc --noEmit — 0 erreurs TypeScript sur tout le projet
  </acceptance_criteria>
  <done>
    App.tsx compose MapView + SidePanel, compile sans erreur, les classes Tailwind du layout sont exactement celles spécifiées.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user input → canal.name render | Les noms de canaux ("Canal 1", "Canal N") sont auto-générés par le store — pas de saisie utilisateur libre en Phase 1 |
| user click → DeleteConfirmDialog | L'utilisateur peut déclencher la suppression via un clic — action irréversible en mémoire |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | Tampering | canal.name dans JSX | accept | Noms auto-générés par le store ("Canal N") — pas de saisie utilisateur libre. React échappe automatiquement les valeurs JSX |
| T-03-02 | Tampering | DeleteConfirmDialog | mitigate | Confirmation modale avec deux actions explicites (Supprimer / Annuler) — pas de suppression accidentelle sur un seul clic. stopPropagation sur la card évite la fermeture accidentelle |
| T-03-03 | Information Disclosure | SidePanel liste canaux | accept | App locale sans auth, sans backend, sans données sensibles — aucun risque de disclosure |
</threat_model>

<verification>
Suite complète de vérification Phase 1 :

1. `cd /c/dev/gsd/science/canal && npx tsc --noEmit` — 0 erreurs TypeScript sur tout le projet
2. `npx vitest run src/store/canalStore.test.ts` — 5 tests verts (MAP-02)
3. `grep "Qattara Depression" src/components/CanalList.tsx` — info-bulle présente
4. `grep "2,76 mm" src/components/CanalList.tsx` — valeur exacte avec virgule française
5. `grep "doubleClickZoom.disable" src/hooks/useMapInteraction.ts` — pitfall 1 mitigé
6. `grep "map.remove()" src/components/MapView.tsx` — cleanup WebGL présent
7. Smoke test manuel : `npm run dev` → http://localhost:5173 → carte monde visible, panneau droite visible, "Dessiner canal" cliquable
</verification>

<success_criteria>
Phase 1 est complète quand tous ces critères sont satisfaits :
1. `git clone + npm install + npm run dev` → carte monde visible, panneau latéral affiché — SUCCESS CRITERIA 1 ROADMAP
2. Clic sur la carte en mode drawing ajoute des waypoints, double-clic finalise le canal visible en bleu — SUCCESS CRITERIA 2 ROADMAP
3. La liste des canaux s'affiche dans le panneau, le bouton Supprimer ouvre la confirmation, le canal disparaît — SUCCESS CRITERIA 3 ROADMAP
4. `npx vitest run` — 5 tests verts, 0 échec
5. `npx tsc --noEmit` — 0 erreurs TypeScript
</success_criteria>

<output>
Après completion, créer `.planning/phases/01-map-shell-trac/01-T03-SUMMARY.md`
</output>

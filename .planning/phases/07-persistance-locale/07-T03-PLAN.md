---
plan_id: 07-T03
phase: 7
wave: 2
title: "ClearDataButton.tsx + intégration SidePanel (usePersistence + bouton effacement)"
depends_on:
  - 07-T02
files_modified:
  - src/components/ClearDataButton.tsx
  - src/components/SidePanel.tsx
requirements_addressed:
  - PERS-01
  - PERS-02
  - PERS-03
autonomous: true
must_haves:
  truths:
    - "usePersistence() est appelé dans SidePanel au même niveau que useElevation() et useRoutingWorker()"
    - "ClearDataButton est rendu dans la zone scrollable de SidePanel après DashboardPanel"
    - "Cliquer Effacer toutes les données ouvre un dialog de confirmation avec fond overlay"
    - "Confirmer l'effacement vide IndexedDB (canals + settings) ET remet le store à l'état initial"
    - "Annuler ferme le dialog sans effacement"
  anti_truths:
    - "usePersistence() est appelé deux fois (une fois dans SidePanel ET une fois dans App.tsx)"
    - "ClearDataButton modifie directement IndexedDB sans passer par l'action clearAll du store"
    - "Le dialog de confirmation utilise des classes Tailwind différentes de DeleteConfirmDialog"
---

<objective>
Connecter la couche de persistance à l'UI : monter usePersistence dans SidePanel, ajouter le bouton d'effacement avec dialog de confirmation.

Purpose: Rendre la persistance visible et contrôlable — l'utilisateur voit ses canaux restaurés automatiquement (PERS-01, PERS-02) et peut effacer ses données depuis l'interface (PERS-03).
Output: ClearDataButton.tsx (composant autonome), SidePanel.tsx modifié (usePersistence + ClearDataButton intégrés).
</objective>

<execution_context>
@C:\Users\gatch\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\gatch\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\dev\gsd\science\canal\.planning\PROJECT.md
@C:\dev\gsd\science\canal\.planning\ROADMAP.md
@C:\dev\gsd\science\canal\.planning\STATE.md
@C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-T02-SUMMARY.md

<interfaces>
<!-- SidePanel.tsx actuel — structure à connaître avant modification -->
```typescript
// src/components/SidePanel.tsx (état avant T03)
export function SidePanel() {
  useElevation()          // ligne 16
  useRoutingWorker()      // ligne 17
  // ... état routingState, cancelRouting ...

  return (
    <aside className="fixed right-0 top-0 h-full w-80 flex flex-col z-10 border-l border-white/[0.08]" ...>
      <ModeIndicator />                        {/* Section 1 */}
      <div className="px-4 py-4 border-b ..."> {/* Section 2 */}
        <DrawingToolbar />
      </div>
      {/* Section 2b — routing state, conditionnel */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">  {/* scroll container */}
        <div className="px-4 py-4 border-b ..."><CanalList /></div>    {/* Section 3 */}
        <ElevationPanel />                                              {/* Section 4 */}
        <CalculationPanel />                                            {/* Section 5 */}
        <EcologyPanel />                                                {/* Section 5b */}
        <DashboardPanel />                                              {/* Section 6 */}
        {/* ← ClearDataButton à insérer ici, Section 7 */}
      </div>
    </aside>
  )
}
```

<!-- DeleteConfirmDialog.tsx — modèle exact pour ClearDataButton -->
// Classes Tailwind du dialog (à reproduire exactement pour cohérence visuelle) :
// Overlay : "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
// Box : "w-72 rounded-lg bg-gray-800 border border-white/[0.08] p-6 flex flex-col gap-4"
// Bouton annuler : "px-4 py-2 rounded text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
// Bouton destructif : "px-4 py-2 rounded text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
// stopPropagation sur la box (onClick backdrop = ferme)

<!-- usePersistence.ts — signature (créé en T02) -->
```typescript
// src/hooks/usePersistence.ts
export function usePersistence(): void  // pas de retour, appelé comme side-effect
```

<!-- db.ts — méthodes utilisées dans ClearDataButton -->
```typescript
// src/services/db.ts
export const db: CanalDatabase
// db.transaction('rw', [db.canals, db.settings], async () => { ... })
// db.canals.clear()
// db.settings.clear()
```

<!-- store clearAll — action créée en T02 -->
// useCanalStore((s) => s.clearAll) → () => void
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Créer src/components/ClearDataButton.tsx</name>
  <files>src/components/ClearDataButton.tsx</files>
  <read_first>
    - C:\dev\gsd\science\canal\src\components\DeleteConfirmDialog.tsx — lire intégralement pour reproduire exactement le pattern dialog + classes Tailwind
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-PATTERNS.md (section ClearDataButton.tsx)
  </read_first>
  <action>
Créer src/components/ClearDataButton.tsx en suivant EXACTEMENT le pattern DeleteConfirmDialog.tsx (même structure, mêmes classes Tailwind) :

```typescript
// src/components/ClearDataButton.tsx
// Bouton d'effacement complet : IndexedDB + reset store.
// Pattern : DeleteConfirmDialog.tsx — même overlay + dialog de confirmation.
// PERS-03 : effacement depuis l'interface avec dialog de confirmation.
import { useState } from 'react'
import { useCanalStore } from '../store/canalStore'
import { db } from '../services/db'

export function ClearDataButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const clearAll = useCanalStore((s) => s.clearAll)

  const handleConfirm = async () => {
    // 1. Vider IndexedDB — transaction atomique (RESEARCH.md Pattern 4)
    await db.transaction('rw', [db.canals, db.settings], async () => {
      await db.canals.clear()
      await db.settings.clear()
    })
    // 2. Reset du store mémoire — après IndexedDB pour cohérence
    clearAll()
    setShowConfirm(false)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full px-4 py-2 rounded text-sm text-gray-400 bg-gray-700/50 hover:bg-gray-700 hover:text-gray-200 transition-colors text-left"
      >
        Effacer toutes les données
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-72 rounded-lg bg-gray-800 border border-white/[0.08] p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-semibold text-white mb-1">Effacer toutes les données ?</p>
              <p className="text-xs text-gray-400">
                Tous les canaux et paramètres seront supprimés. Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Effacer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

Points critiques :
- Overlay : onClick = ferme le dialog (même comportement que DeleteConfirmDialog)
- Box interne : e.stopPropagation() sur le onClick
- handleConfirm : d'abord db.transaction (IndexedDB), puis clearAll() (store mémoire)
- Le bouton principal est discret (text-gray-400) — action secondaire dans le panneau
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <acceptance_criteria>
    - src/components/ClearDataButton.tsx existe
    - `npx tsc --noEmit` retourne 0 erreurs
    - grep dans ClearDataButton.tsx trouve `db.transaction('rw'` (effacement atomique)
    - grep dans ClearDataButton.tsx trouve `clearAll()` (reset store après IndexedDB)
    - grep dans ClearDataButton.tsx trouve `e.stopPropagation()` (fermeture overlay)
    - grep dans ClearDataButton.tsx trouve `bg-red-500 hover:bg-red-600` (bouton destructif cohérent avec DeleteConfirmDialog)
    - grep dans ClearDataButton.tsx trouve `fixed inset-0 z-50` (overlay)
  </acceptance_criteria>
  <done>ClearDataButton.tsx créé, TypeScript propre, pattern dialog cohérent avec DeleteConfirmDialog.</done>
</task>

<task type="auto">
  <name>Task 2: Modifier SidePanel.tsx — monter usePersistence + ajouter ClearDataButton</name>
  <files>src/components/SidePanel.tsx</files>
  <read_first>
    - C:\dev\gsd\science\canal\src\components\SidePanel.tsx — lire intégralement avant modification
    - C:\dev\gsd\science\canal\.planning\phases\07-persistance-locale\07-PATTERNS.md (section SidePanel.tsx)
  </read_first>
  <action>
Modifier src/components/SidePanel.tsx — deux points de modification :

**1. Ajouter les imports** (après les imports existants, avant la fin des imports) :

```typescript
import { usePersistence } from '../hooks/usePersistence'
import { ClearDataButton } from './ClearDataButton'
```

**2. Appeler usePersistence()** dans le corps de SidePanel, immédiatement après useRoutingWorker() (ligne 17 actuellement) :

```typescript
export function SidePanel() {
  useElevation()
  useRoutingWorker()
  usePersistence()   // ← ajouter ici — Phase 7 — hydration + sync IndexedDB
  // ... reste du composant inchangé ...
```

**3. Ajouter ClearDataButton** dans le div `flex-1 overflow-y-auto`, après `<DashboardPanel />` (Section 6), en tant que Section 7 :

```tsx
        {/* Section 6 — Dashboard Global (accordéon) — Phase 6 */}
        <DashboardPanel />

        {/* Section 7 — Effacement données (Phase 7) */}
        <div className="px-4 py-4 border-t border-white/[0.08]">
          <ClearDataButton />
        </div>
```

Aucune autre modification du fichier.

Note : usePersistence n'est PAS appelé dans App.tsx — uniquement ici, cohérent avec useElevation et useRoutingWorker. Évite le double montage.
  </action>
  <verify>
    <automated>npm run test -- --run 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` retourne 0 erreurs
    - `npm run test -- --run` (suite complète) : 0 tests failed
    - grep dans SidePanel.tsx trouve `usePersistence()` dans le corps du composant (pas dans App.tsx)
    - grep dans SidePanel.tsx trouve `import { usePersistence }` et `import { ClearDataButton }`
    - grep dans SidePanel.tsx trouve `<ClearDataButton />` dans le JSX
    - grep dans SidePanel.tsx trouve `Section 7` dans un commentaire
    - grep dans App.tsx ne trouve PAS `usePersistence` (pas de double montage)
  </acceptance_criteria>
  <done>SidePanel.tsx intègre usePersistence + ClearDataButton. Suite complète verte. Phase 7 fonctionnelle.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| UI → IndexedDB | handleConfirm déclenche transaction d'effacement direct dans IndexedDB |
| IndexedDB → Store | SidePanel monte usePersistence qui hydrate le store au démarrage |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07-04 | Tampering | ClearDataButton — handleConfirm | accept | Action utilisateur explicite avec double confirmation (dialog) — usage personnel, pas de surface multi-utilisateur |
| T-07-05 | Denial of Service | usePersistence double montage | mitigate | usePersistence monté uniquement dans SidePanel.tsx — vérification acceptance_criteria que App.tsx ne l'importe pas |
</threat_model>

<verification>
Wave 2 complète quand :
1. `npx tsc --noEmit` → 0 erreurs
2. `npm run test -- --run` → suite complète GREEN (tous les tests, y compris persistence)
3. grep SidePanel.tsx confirme : usePersistence(), ClearDataButton dans Section 7
4. grep App.tsx confirme : pas d'import usePersistence (pas de double montage)

Vérification manuelle finale (checkpoint utilisateur post-exécution) :
- `npm run dev` → ouvrir l'app → tracer un canal → rafraîchir → canal toujours présent (PERS-01)
- Saisir largeur/profondeur → rafraîchir → valeurs pré-remplies (PERS-02)
- Cliquer "Effacer toutes les données" → confirmer → carte vide → rafraîchir → toujours vide (PERS-03)
</verification>

<success_criteria>
- ClearDataButton.tsx : dialog de confirmation avec transaction IndexedDB atomique + reset store
- SidePanel.tsx : usePersistence() monté après useRoutingWorker(), ClearDataButton dans Section 7
- 0 régression sur la suite de tests complète
- Phase 7 entièrement fonctionnelle : PERS-01 + PERS-02 (hydration auto) + PERS-03 (effacement UI)
</success_criteria>

<output>
After completion, create `.planning/phases/07-persistance-locale/07-T03-SUMMARY.md`
</output>

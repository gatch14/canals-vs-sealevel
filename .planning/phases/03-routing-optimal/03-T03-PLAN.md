---
phase: 03-routing-optimal
plan: T03
type: execute
wave: 2
depends_on: [03-T01, 03-T02]
files_modified:
  - src/components/DrawingToolbar.tsx
  - src/components/MapView.tsx
  - src/components/SidePanel.tsx
autonomous: true
requirements: [MAP-05]

must_haves:
  truths:
    - "L'utilisateur voit un bouton 'Tracé optimal' dans la toolbar (visible en mode selection)"
    - "En mode routing, l'utilisateur clique deux points — marqueur vert (départ) puis rouge (arrivée) apparaissent sur la carte"
    - "Pendant le calcul, SidePanel affiche un spinner + 'Calcul du tracé optimal en cours...' + bouton Annuler"
    - "Si aucun chemin : message 'Aucun chemin gravitaire trouvé — les deux points sont séparés par un obstacle infranchissable'"
    - "Si timeout : message 'Calcul interrompu — réduisez la distance ou relancez'"
    - "Après routing réussi, le canal routé apparaît sur la carte en bleu et le profil d'élévation se charge automatiquement"
    - "Les marqueurs temporaires (vert/rouge) sont retirés de la carte quand le mode change"
  artifacts:
    - path: "src/components/DrawingToolbar.tsx"
      provides: "Bouton Tracé optimal (mode routing) + bouton Annuler routing"
      contains: "startRouting"
    - path: "src/components/MapView.tsx"
      provides: "Handlers clics mode routing, marqueurs temporaires vert/rouge, cleanup"
      contains: "startMarkerRef"
    - path: "src/components/SidePanel.tsx"
      provides: "Section routing progress (spinner/no-path/error/timeout) + useRoutingWorker monté"
      contains: "useRoutingWorker"
  key_links:
    - from: "src/components/DrawingToolbar.tsx"
      to: "src/store/canalStore.ts"
      via: "useCanalStore startRouting + cancelRouting"
      pattern: "startRouting"
    - from: "src/components/MapView.tsx"
      to: "src/store/canalStore.ts"
      via: "useCanalStore.getState().setRoutingStart/setRoutingEnd dans handler clic"
      pattern: "setRoutingStart\|setRoutingEnd"
    - from: "src/components/SidePanel.tsx"
      to: "src/hooks/useRoutingWorker.ts"
      via: "useRoutingWorker() appelé au niveau SidePanel (même pattern que useElevation)"
      pattern: "useRoutingWorker"
---

<objective>
Intégration UI de la Phase 3 : bouton toolbar, marqueurs carte, section SidePanel routing.

Purpose: Connecter le moteur de routing (T02) à l'interface utilisateur existante. L'utilisateur peut déclencher le routing via la toolbar, voir le feedback visuel sur la carte et dans le SidePanel, et obtenir un canal routé qui s'intègre dans le flux existant (liste + profil élévation Phase 2).
Output: 3 composants étendus. Zéro nouveau fichier.
</objective>

<execution_context>
@C:\Users\gatch\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\gatch\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@C:\dev\gsd\science\canal\.planning\PROJECT.md
@C:\dev\gsd\science\canal\.planning\ROADMAP.md
@C:\dev\gsd\science\canal\.planning\phases\03-routing-optimal\03-T01-SUMMARY.md
@C:\dev\gsd\science\canal\.planning\phases\03-routing-optimal\03-T02-SUMMARY.md

<interfaces>
<!-- État actuel des fichiers à modifier — LIRE AVANT TOUTE MODIFICATION -->

From src/components/DrawingToolbar.tsx (état actuel):
```typescript
// Imports existants : Pencil, X de lucide-react + useCanalStore
// Constante focusRing disponible (à réutiliser — ne pas dupliquer)
// mode 'selection' → bouton "Dessiner canal" (bg-blue-500)
// mode 'drawing' → p + bouton "Annuler" (bg-gray-700)
// Phase 3 : ajouter mode 'routing' avec bouton "Tracé optimal" (bg-purple-600)
```

From src/components/MapView.tsx (état actuel — parties pertinentes):
```typescript
// useMapInteraction(mapRef.current) — ligne 236 — à étendre
// Mode 'drawing' : cursor = 'crosshair', doubleClickZoom disabled
// Pattern getState() dans handlers DOM : useCanalStore.getState().cancelDrawing()
// Pas de marqueurs temporaires existants — ajouter startMarkerRef + endMarkerRef
// useEffect sur [canals, draftPoints, previewCoord] → syncLayers
// useEffect sur [canals, selectedCanalId] → syncUphillLayer
// Phase 3 : useEffect sur [mode, routingState] pour markers + cursor routing
```

From src/components/SidePanel.tsx (état actuel):
```typescript
// useElevation() — hook monté au niveau SidePanel
// Structure : ModeIndicator | DrawingToolbar | CanalList | ElevationPanel | footer
// Phase 3 : ajouter useRoutingWorker() + RoutingProgressSection entre DrawingToolbar et CanalList
```

From src/hooks/useRoutingWorker.ts (créé en T02 — hook à appeler dans SidePanel):
```typescript
export function useRoutingWorker(): void
// Orchestre le worker : lancé quand routingState='computing', gère timeout + messages
```

From src/store/canalStore.ts (actions Phase 3 créées en T01):
```typescript
// Nouvelles actions disponibles :
startRouting: () => void           // mode → 'routing', routingState → 'selecting-start'
setRoutingStart: (coord) => void   // routingState → 'selecting-end'
setRoutingEnd: (coord) => void     // routingState → 'computing' → déclenche useRoutingWorker
cancelRouting: () => void          // retour 'selection'
// Nouveaux champs :
routingState: RoutingState         // 'idle'|'selecting-start'|'selecting-end'|'computing'|'timeout'|'error'|'no-path'
routingStart: [number,number] | null
routingEnd: [number,number] | null
```

From src/components/ElevationPanel.tsx (pattern spinner + erreur à reprendre):
```typescript
// Spinner pattern :
<div className="h-40 flex items-center justify-center">
  <div className="w-5 h-5 rounded-full border-2 border-gray-600 border-t-gray-300 animate-spin" role="status" aria-label="..." />
  <span className="ml-2 text-[11px] text-gray-500">...</span>
</div>
// Erreur pattern :
<div className="px-4 py-3">
  <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
    <AlertCircle size={12} className="inline" />
    Message d'erreur
  </p>
</div>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1 : Étendre DrawingToolbar.tsx + SidePanel.tsx</name>
  <read_first>
    - C:\dev\gsd\science\canal\src\components\DrawingToolbar.tsx (lire AVANT modification — état exact)
    - C:\dev\gsd\science\canal\src\components\SidePanel.tsx (lire AVANT modification — état exact)
    - C:\dev\gsd\science\canal\src\components\ElevationPanel.tsx (pattern spinner + erreur)
  </read_first>
  <files>src/components/DrawingToolbar.tsx, src/components/SidePanel.tsx</files>
  <action>
**1. Étendre `src/components/DrawingToolbar.tsx` :**

Ajouter `Route` aux imports lucide-react : `import { Pencil, Route, X } from 'lucide-react'`

Ajouter aux sélecteurs Zustand (après `cancelDrawing`) :
```typescript
const startRouting  = useCanalStore((s) => s.startRouting)
const cancelRouting = useCanalStore((s) => s.cancelRouting)
```

Modifier la condition de rendu pour gérer les 3 modes :

```typescript
return (
  <div className="flex flex-col gap-2">
    {mode === 'selection' && (
      <div className="flex flex-col gap-2">
        <button
          onClick={startDrawing}
          className={`flex items-center gap-2 w-full px-4 py-2 rounded
                      bg-blue-500 hover:bg-blue-600 active:scale-[0.98]
                      text-white text-sm font-semibold transition-colors
                      outline-none ${focusRing}`}
        >
          <Pencil size={16} />
          Dessiner canal
        </button>
        <button
          onClick={startRouting}
          className={`flex items-center gap-2 w-full px-4 py-2 rounded
                      bg-purple-600 hover:bg-purple-700 active:scale-[0.98]
                      text-white text-sm font-semibold transition-colors
                      outline-none ${focusRing}`}
        >
          <Route size={16} />
          Tracé optimal
        </button>
      </div>
    )}

    {mode === 'drawing' && (
      <div className="flex flex-col gap-2">
        {draftPoints.length < 2 && (
          <p className="text-xs text-gray-400">
            Posez au moins 2 points pour finaliser le canal
          </p>
        )}
        <button
          onClick={cancelDrawing}
          className={`flex items-center gap-2 w-full px-4 py-2 rounded
                      bg-gray-700 hover:bg-gray-600
                      text-white text-sm transition-colors
                      outline-none ${focusRing}`}
        >
          <X size={16} />
          Annuler
        </button>
      </div>
    )}

    {mode === 'routing' && (
      <div className="flex flex-col gap-2">
        <button
          onClick={cancelRouting}
          className={`flex items-center gap-2 w-full px-4 py-2 rounded
                      bg-gray-700 hover:bg-gray-600
                      text-white text-sm transition-colors
                      outline-none ${focusRing}`}
        >
          <X size={16} />
          Annuler
        </button>
      </div>
    )}
  </div>
)
```

**2. Étendre `src/components/SidePanel.tsx` :**

Ajouter les imports :
```typescript
import { AlertCircle } from 'lucide-react'
import { useRoutingWorker } from '../hooks/useRoutingWorker'
import { useCanalStore } from '../store/canalStore'
```

Ajouter `useRoutingWorker()` au niveau du composant (après `useElevation()`) :
```typescript
useRoutingWorker()
const routingState = useCanalStore((s) => s.routingState)
const cancelRouting = useCanalStore((s) => s.cancelRouting)
```

Insérer la section routing progress entre Section 2 et Section 3 :

```typescript
{/* Section 2b — Progression routing (visible si routingState !== 'idle') */}
{routingState !== 'idle' && (
  <div className="px-4 py-3 border-b border-white/[0.08]">

    {(routingState === 'selecting-start') && (
      <p className="text-xs text-purple-300">
        Cliquez le point de départ sur la carte
      </p>
    )}

    {(routingState === 'selecting-end') && (
      <p className="text-xs text-purple-300">
        Cliquez le point d&apos;arrivée sur la carte
      </p>
    )}

    {routingState === 'computing' && (
      <div className="flex flex-col gap-2">
        <div className="h-10 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-purple-400 animate-spin"
            role="status"
            aria-label="Calcul du tracé optimal..."
          />
          <span className="text-[11px] text-gray-400">Calcul du tracé optimal en cours...</span>
        </div>
        <button
          onClick={cancelRouting}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-left"
        >
          Annuler le calcul
        </button>
      </div>
    )}

    {routingState === 'no-path' && (
      <p className="text-xs text-amber-400 flex items-start gap-1">
        <AlertCircle size={12} className="mt-[2px] shrink-0" />
        Aucun chemin gravitaire trouvé — les deux points sont séparés par un obstacle infranchissable
      </p>
    )}

    {routingState === 'timeout' && (
      <p className="text-xs text-amber-400 flex items-start gap-1">
        <AlertCircle size={12} className="mt-[2px] shrink-0" />
        Calcul interrompu — réduisez la distance ou relancez
      </p>
    )}

    {routingState === 'error' && (
      <p className="text-xs text-red-400 flex items-start gap-1">
        <AlertCircle size={12} className="mt-[2px] shrink-0" />
        Erreur lors du calcul — vérifiez votre connexion et relancez
      </p>
    )}

  </div>
)}
```
  </action>
  <verify>
    <automated>cd C:\dev\gsd\science\canal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - `grep "startRouting\|cancelRouting" src/components/DrawingToolbar.tsx | wc -l` retourne >= 4
    - `grep "bg-purple-600" src/components/DrawingToolbar.tsx` retourne 1 ligne (bouton Tracé optimal)
    - `grep "Route" src/components/DrawingToolbar.tsx | grep "lucide"` retourne 1 ligne (import lucide)
    - `grep "useRoutingWorker" src/components/SidePanel.tsx` retourne >= 2 lignes (import + appel)
    - `grep "routingState" src/components/SidePanel.tsx | wc -l` retourne >= 6 (les 6 états couverts)
    - `grep "Aucun chemin gravitaire" src/components/SidePanel.tsx` retourne 1 ligne (message exact locked CONTEXT.md)
    - `grep "Calcul interrompu" src/components/SidePanel.tsx` retourne 1 ligne
    - `npx tsc --noEmit` retourne 0 erreur
  </acceptance_criteria>
  <done>DrawingToolbar avec bouton Tracé optimal (violet), SidePanel avec section routing (6 états couverts), messages exacts du CONTEXT.md, TypeScript 0 erreur.</done>
</task>

<task type="auto">
  <name>Task 2 : Étendre MapView.tsx — handlers clics + marqueurs temporaires</name>
  <read_first>
    - C:\dev\gsd\science\canal\src\components\MapView.tsx (lire AVANT modification — état exact complet)
    - C:\dev\gsd\science\canal\.planning\phases\03-routing-optimal\03-RESEARCH.md (Pattern 5 Marqueurs + Pattern getState())
    - C:\dev\gsd\science\canal\.planning\phases\03-routing-optimal\03-PATTERNS.md (section MapView.tsx)
  </read_first>
  <files>src/components/MapView.tsx</files>
  <action>
Ajouter dans `src/components/MapView.tsx` les éléments suivants :

**1. Importer RoutingState et les nouvelles actions dans les sélecteurs :**

Après les imports existants, ajouter dans le composant `MapView` :
```typescript
const mode = useCanalStore((s) => s.mode)
const routingState = useCanalStore((s) => s.routingState)
```

**2. Ajouter les refs marqueurs (après mapRef) :**
```typescript
const startMarkerRef = useRef<maplibregl.Marker | null>(null)
const endMarkerRef   = useRef<maplibregl.Marker | null>(null)
```

**3. Ajouter un useEffect pour le mode routing — cursor + handlers + cleanup marqueurs :**

Insérer après le `useEffect` existant de `useMapInteraction` (mais dans le composant MapView, pas dans le hook), en utilisant le pattern de gestion des événements natifs :

```typescript
// Mode routing — cursor, handlers clics, cleanup marqueurs
useEffect(() => {
  const map = mapRef.current
  if (!map) return

  if (mode === 'routing') {
    map.getCanvas().style.cursor = 'crosshair'

    const handleRoutingClick = (e: maplibregl.MapMouseEvent) => {
      const { routingStart: rStart, routingEnd: rEnd } = useCanalStore.getState()

      if (!rStart) {
        // Clic 1 : point de départ (vert)
        startMarkerRef.current?.remove()
        startMarkerRef.current = new maplibregl.Marker({ color: '#22C55E' })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map)
        useCanalStore.getState().setRoutingStart([e.lngLat.lng, e.lngLat.lat])
      } else if (!rEnd) {
        // Clic 2 : point d'arrivée (rouge) → déclenche le calcul
        endMarkerRef.current?.remove()
        endMarkerRef.current = new maplibregl.Marker({ color: '#EF4444' })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map)
        useCanalStore.getState().setRoutingEnd([e.lngLat.lng, e.lngLat.lat])
        // Après setRoutingEnd, routingState = 'computing' → useRoutingWorker lance le worker
        map.getCanvas().style.cursor = 'wait'
      }
    }

    map.on('click', handleRoutingClick)

    return () => {
      map.off('click', handleRoutingClick)
      map.getCanvas().style.cursor = ''
      // Cleanup obligatoire des marqueurs au changement de mode (PATTERNS.md)
      startMarkerRef.current?.remove()
      endMarkerRef.current?.remove()
      startMarkerRef.current = null
      endMarkerRef.current = null
    }
  }

  // Hors mode routing : s'assurer que les marqueurs sont nettoyés
  startMarkerRef.current?.remove()
  endMarkerRef.current?.remove()
  startMarkerRef.current = null
  endMarkerRef.current = null
}, [mode])  // re-exécuté à chaque changement de mode
```

**Note importante :** Ne pas modifier `syncLayers` ni `initSources`. Les marqueurs routing sont des objets `maplibregl.Marker`, pas des features GeoJSON (PATTERNS.md section MapView).

**Note importante :** Le `useEffect` de `useMapInteraction(mapRef.current)` n'est pas supprimé — il gère les modes `drawing` et `selection`. Le nouveau `useEffect` ci-dessus gère uniquement `mode === 'routing'`. Les deux coexistent sans conflit car `useMapInteraction` ne gère pas `'routing'` (le mode n'existait pas en Phase 1/2).

**Vérification que useMapInteraction ne capture pas les clics en mode routing :**
Lire `src/hooks/useMapInteraction.ts` pour confirmer que les handlers ne s'exécutent qu'en mode `'drawing'` avant de finaliser ce plan. Si useMapInteraction attache un listener `click` inconditionnel, ajouter une garde `if (mode !== 'routing')` dans ce handler. Ne pas modifier useMapInteraction si le handler est déjà conditionnel sur le mode.
  </action>
  <verify>
    <automated>cd C:\dev\gsd\science\canal && npx tsc --noEmit 2>&1 && npm test 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `grep "startMarkerRef\|endMarkerRef" src/components/MapView.tsx | wc -l` retourne >= 6 (déclaration + création + cleanup)
    - `grep "Marker.*22C55E\|color.*22C55E" src/components/MapView.tsx` retourne 1 ligne (marqueur vert départ)
    - `grep "Marker.*EF4444\|color.*EF4444" src/components/MapView.tsx | grep -v "canal-uphill"` retourne 1 ligne (marqueur rouge arrivée)
    - `grep "useCanalStore.getState().setRoutingStart\|useCanalStore.getState().setRoutingEnd" src/components/MapView.tsx` retourne 2 lignes (anti-stale-closure)
    - `grep "startMarkerRef.current?.remove()" src/components/MapView.tsx | wc -l` retourne >= 2 (cleanup dans return + hors mode)
    - `npx tsc --noEmit` retourne 0 erreur
    - `npm test` retourne 0 failed
  </acceptance_criteria>
  <done>MapView avec handlers routing, marqueurs vert/rouge, cursor crosshair→wait, cleanup sur changement de mode, TypeScript 0 erreur, tests existants toujours verts.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| utilisateur → MapLibre click | Coordonnées [lng, lat] issues d'un clic carte — valeur non-sanitisée au niveau UI |
| MapView → store → worker | Coordonnées transitent via store avant postMessage au worker |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-T03-01 | Tampering | MapView routing click → setRoutingStart/End | mitigate | validateCoords() appelée dans fetchGridElevations (T02 — T-03-T02-01) — couverture en profondeur |
| T-03-T03-02 | Tampering | SidePanel — injection HTML dans messages d'erreur | accept | Messages sont des littéraux TypeScript hardcodés — aucun contenu utilisateur rendu en HTML |
| T-03-T03-03 | DoS (self) | Marqueurs MapLibre non nettoyés → fuite mémoire | mitigate | Cleanup `marker.remove()` dans le return du useEffect + hors mode routing |
</threat_model>

<verification>
```bash
cd C:\dev\gsd\science\canal
npx tsc --noEmit
npm test
npm run dev  # Vérification visuelle UAT
```

TypeScript et tests automatisés verts. Vérification manuelle UAT :
1. Cliquer "Tracé optimal" → bouton violet visible en mode selection
2. SidePanel affiche "Cliquez le point de départ"
3. Cliquer point A sur la carte → marqueur vert visible
4. SidePanel affiche "Cliquez le point d'arrivée"
5. Cliquer point B → marqueur rouge visible, spinner démarre
6. Attendre → canal routé bleu apparaît sur carte, profil élévation se charge auto
7. Cliquer "Annuler" pendant un calcul → calcul stoppé, retour mode selection
</verification>

<success_criteria>
- DrawingToolbar : bouton "Tracé optimal" violet (bg-purple-600) visible en mode selection, bouton "Annuler" en mode routing
- SidePanel : useRoutingWorker() monté, section progress avec 6 états (selecting-start/end/computing/no-path/timeout/error)
- Message "Aucun chemin gravitaire trouvé..." exact (locked CONTEXT.md D-03)
- Message "Calcul interrompu — réduisez la distance ou relancez" (locked CONTEXT.md)
- MapView : marqueurs vert (#22C55E) départ + rouge (#EF4444) arrivée, cleanup sur mode change, getState() dans handlers
- npx tsc --noEmit : 0 erreur
- npm test : 0 failed (tests Phase 1+2+3 tous verts)
- Après canal routé : profil d'élévation Phase 2 se charge automatiquement (canal sélectionné via finalizeRoutedCanal → selectCanal → useElevation)
</success_criteria>

<output>
Après complétion, créer `.planning/phases/03-routing-optimal/03-T03-SUMMARY.md`
</output>

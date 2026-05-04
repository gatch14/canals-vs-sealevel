---
phase: 02-elevation-profil
plan: T03
type: execute
wave: 2
depends_on:
  - T01
  - T02
files_modified:
  - src/components/ElevationChart.tsx
  - src/components/ElevationPanel.tsx
  - src/components/CanalListItem.tsx
  - src/components/MapView.tsx
  - src/components/SidePanel.tsx
autonomous: false
requirements:
  - MAP-03
  - MAP-04

must_haves:
  truths:
    - "En sélectionnant un canal, le panneau latéral affiche le profil altimétrique (graphique altitude vs distance)"
    - "Les zones en montée apparaissent en rouge translucide sur le graphique"
    - "Les segments uphill sont surlignés en rouge (#EF4444, 5px) sur la carte MapLibre"
    - "Chaque CanalListItem affiche le badge gravitaire correct (⏳ / ✅ / ⚠)"
    - "L'accordéon ElevationPanel s'ouvre automatiquement à la sélection d'un canal"
    - "L'état de chargement (spinner 160px) empêche le layout shift"
  artifacts:
    - path: "src/components/ElevationChart.tsx"
      provides: "Recharts AreaChart avec ReferenceArea uphill"
      exports: ["ElevationChart"]
    - path: "src/components/ElevationPanel.tsx"
      provides: "Accordéon conteneur — états vide/loading/data/erreur"
      exports: ["ElevationPanel"]
    - path: "src/components/CanalListItem.tsx"
      provides: "Badge pill gravitaire sur chaque item"
      contains: "Gravitaire"
    - path: "src/components/MapView.tsx"
      provides: "Layer canal-uphill rouge sur la carte"
      contains: "canal-uphill-source"
    - path: "src/components/SidePanel.tsx"
      provides: "ElevationPanel monté + hook useElevation"
      contains: "ElevationPanel"
  key_links:
    - from: "src/components/SidePanel.tsx"
      to: "src/hooks/useElevation.ts"
      via: "useElevation() appelé dans SidePanel"
      pattern: "useElevation"
    - from: "src/components/ElevationPanel.tsx"
      to: "src/components/ElevationChart.tsx"
      via: "ElevationChart rendu dans ElevationPanel"
      pattern: "ElevationChart"
    - from: "src/components/MapView.tsx"
      to: "canal-uphill-source"
      via: "map.getSource('canal-uphill-source').setData()"
      pattern: "canal-uphill-source"
---

<objective>
Créer les composants UI (ElevationChart, ElevationPanel), étendre CanalListItem (badge gravitaire), MapView (layer uphill rouge), et SidePanel (monter le hook + panel). Phase 2 devient visible.

Purpose: Connecter la logique métier de T02 aux composants visuels — l'utilisateur peut voir le profil altimétrique et les segments impossibles gravitairement.
Output: 2 nouveaux composants + 3 composants étendus, UI complète Phase 2 fonctionnelle.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-UI-SPEC.md
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-CONTEXT.md

<interfaces>
<!-- Contrats issus de T01 et T02 -->

From src/types/elevation.ts:
```typescript
export interface ElevationPoint { distance: number; altitude: number }
export interface UphillSegment { distanceStart: number; distanceEnd: number; altitudeGain: number }
export interface ElevationProfile {
  points: ElevationPoint[]
  uphillSegments: UphillSegment[]
  totalUphillGain: number
  isFullyGravity: boolean
  fetchedAt: number
}
```

From src/types/canal.ts:
```typescript
export type Coord = [number, number]  // [lng, lat]
export interface Canal {
  id: string; points: Coord[]; name: string; createdAt: number
  elevation?: ElevationProfile
  elevationLoading?: boolean
  elevationError?: string
}
```

From src/hooks/useElevation.ts:
```typescript
export function useElevation(): void  // side-effects uniquement, pas de valeur retournée
```

From src/store/canalStore.ts (sélecteurs utiles pour T03):
```typescript
useCanalStore((s) => s.canals)           // Canal[]
useCanalStore((s) => s.selectedCanalId) // string | null
```

From src/components/MapView.tsx (état ACTUEL — fonctions à ne PAS modifier):
```typescript
// initSources(map) — à étendre avec canal-uphill-source APRÈS markers-circle
// syncLayers(map, canals, draftPoints, previewCoord) — ne pas toucher, ajouter syncUphillLayer séparé
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Créer ElevationChart.tsx + ElevationPanel.tsx</name>
  <read_first>
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-UI-SPEC.md — sections "ElevationChart — Contrat Recharts", "États de l'ElevationPanel", "Copywriting Contract", "Color"
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md — Pattern 4 (Recharts AreaChart + ReferenceArea ORDER) et Anti-Patterns ("Déclarer ReferenceArea après Area")
    - C:/dev/gsd/science/canal/src/types/elevation.ts — interfaces ElevationProfile, UphillSegment, ElevationPoint
    - C:/dev/gsd/science/canal/src/store/canalStore.ts — sélecteurs selectedCanalId, canals
  </read_first>
  <files>src/components/ElevationChart.tsx, src/components/ElevationPanel.tsx</files>
  <action>
1. Créer src/components/ElevationChart.tsx :
```tsx
// src/components/ElevationChart.tsx
// Graphique Recharts — profil altimétrique avec zones uphill en rouge
// ORDRE OBLIGATOIRE : ReferenceArea AVANT Area (sinon zones rouges par-dessus la courbe bleue)
import {
  AreaChart, Area, ReferenceArea, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ElevationPoint, UphillSegment } from '../types/elevation'

interface Props {
  points: ElevationPoint[]
  uphillSegments: UphillSegment[]
}

export function ElevationChart({ points, uphillSegments }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart
        data={points}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          vertical={false}
        />
        <XAxis
          dataKey="distance"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v: number) => `${v.toFixed(0)}`}
          label={{ value: 'km', position: 'insideBottomRight', offset: -4, fill: '#9CA3AF', fontSize: 10 }}
          tick={{ fill: '#9CA3AF', fontSize: 10 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v}`}
          label={{ value: 'm', angle: -90, position: 'insideLeft', offset: 8, fill: '#9CA3AF', fontSize: 10 }}
          tick={{ fill: '#9CA3AF', fontSize: 10 }}
          axisLine={{ stroke: '#374151' }}
          tickLine={{ stroke: '#374151' }}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#F3F4F6',
          }}
          formatter={(value: number) => [`${value.toFixed(0)} m`, 'Altitude']}
          labelFormatter={(label: number) => `Distance : ${label.toFixed(2)} km`}
        />

        {/* Zones uphill AVANT la courbe — obligatoire pour que le bleu soit au-dessus du rouge */}
        {uphillSegments.map((seg, i) => (
          <ReferenceArea
            key={i}
            x1={seg.distanceStart}
            x2={seg.distanceEnd}
            fill="#EF4444"
            fillOpacity={0.30}
            strokeOpacity={0}
          />
        ))}

        {/* Courbe principale bleue */}
        <Area
          type="monotone"
          dataKey="altitude"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="#3B82F6"
          fillOpacity={0.15}
          dot={false}
          activeDot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

2. Créer src/components/ElevationPanel.tsx :
```tsx
// src/components/ElevationPanel.tsx
// Accordéon conteneur du profil altimétrique — 4 états : vide / chargement / erreur / données
// Hauteur fixe 160px pour spinner ET graphique — évite le layout shift (Pitfall 4)
import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { ElevationChart } from './ElevationChart'

export function ElevationPanel() {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  // Accordéon ouvert automatiquement quand un canal est sélectionné
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (selectedCanalId) setIsOpen(true)
  }, [selectedCanalId])

  const profile = selectedCanal?.elevation ?? null
  const isLoading = selectedCanal?.elevationLoading ?? false
  const error = selectedCanal?.elevationError ?? null

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
          Profil altimétrique
        </span>
      </button>

      {/* Corps accordéon */}
      {isOpen && (
        <div>
          {/* État vide — aucun canal sélectionné */}
          {!selectedCanalId && (
            <div className="h-10 px-4 flex items-center">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
                Sélectionnez un canal pour voir son profil altimétrique
              </p>
            </div>
          )}

          {/* État chargement — hauteur fixe 160px identique au graphique */}
          {selectedCanalId && isLoading && !profile && !error && (
            <div className="h-40 flex items-center justify-center">
              <div
                className="w-5 h-5 rounded-full border-2 border-gray-600 border-t-gray-300 animate-spin"
                role="status"
                aria-label="Chargement du profil..."
              />
              <span className="ml-2 text-[11px] text-gray-500">Chargement du profil...</span>
            </div>
          )}

          {/* État erreur */}
          {selectedCanalId && error && (
            <div className="px-4 py-3">
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1">
                <AlertCircle size={12} className="inline" />
                Données d&apos;élévation indisponibles
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Open Topo Data inaccessible. Vérifiez votre connexion et cliquez sur le canal pour réessayer.
              </p>
            </div>
          )}

          {/* État données — graphique + message gravitaire/montées */}
          {selectedCanalId && profile && !error && (
            <div>
              <ElevationChart
                points={profile.points}
                uphillSegments={profile.uphillSegments}
              />
              {profile.isFullyGravity ? (
                <div className="px-4 py-1 flex items-center gap-1">
                  <p className="text-xs text-green-400">
                    ✅ Ce canal est entièrement réalisable par gravité
                  </p>
                </div>
              ) : (
                <div className="px-4 py-1 flex items-center gap-1">
                  <p className="text-xs text-amber-400">
                    ⚠ {profile.uphillSegments.length} segment(s) en montée
                    — {profile.totalUphillGain.toFixed(0)} m de dénivelé positif total
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - src/components/ElevationChart.tsx existe et contient "ReferenceArea"
    - grep -n "ReferenceArea" src/components/ElevationChart.tsx → déclaré AVANT "Area" dans le JSX (numéro de ligne ReferenceArea < numéro de ligne Area)
    - grep "isAnimationActive={false}" src/components/ElevationChart.tsx → présent
    - grep "fillOpacity={0.30}" src/components/ElevationChart.tsx → 30% opacité rouge présente
    - grep "fillOpacity={0.15}" src/components/ElevationChart.tsx → 15% opacité bleue présente
    - src/components/ElevationPanel.tsx existe et contient "ElevationChart"
    - grep "h-40" src/components/ElevationPanel.tsx → hauteur fixe 160px présente pour spinner ET graphique
    - grep "Chargement du profil" src/components/ElevationPanel.tsx → copywriting correct
    - grep "Sélectionnez un canal" src/components/ElevationPanel.tsx → placeholder état vide présent
    - grep "Open Topo Data inaccessible" src/components/ElevationPanel.tsx → message erreur correct
    - npx tsc --noEmit ne signale PAS d'erreur dans ElevationChart.tsx ni ElevationPanel.tsx
  </acceptance_criteria>
  <done>ElevationChart.tsx créé avec Recharts configuré (ReferenceArea avant Area, isAnimationActive=false, opacités correctes). ElevationPanel.tsx créé avec les 4 états (vide, chargement 160px fixe, erreur, données + message gravitaire).</done>
</task>

<task type="auto">
  <name>Task 2: Étendre CanalListItem + MapView + SidePanel</name>
  <read_first>
    - C:/dev/gsd/science/canal/src/components/CanalListItem.tsx — lire l'état ACTUEL complet
    - C:/dev/gsd/science/canal/src/components/MapView.tsx — lire l'état ACTUEL complet (initSources + syncLayers)
    - C:/dev/gsd/science/canal/src/components/SidePanel.tsx — lire l'état ACTUEL complet
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-UI-SPEC.md — sections "CanalListItem — Badges gravitaires", "Layer MapLibre canal-uphill", "Interaction Contract"
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md — Pattern 5 (layer MapLibre canal-uphill), Anti-Patterns ("Utiliser addSource() sans vérifier getSource()")
  </read_first>
  <files>src/components/CanalListItem.tsx, src/components/MapView.tsx, src/components/SidePanel.tsx</files>
  <action>
1. Modifier src/components/CanalListItem.tsx — ajouter le badge pill gravitaire sous le nom du canal.
   Remplacer la structure interne de la `<li>` pour inclure un `flex-col` et le badge conditionnel :

   Le `<span>` existant du nom du canal devient enfant d'un `<div className="flex flex-col gap-[2px] min-w-0">`.
   Ajouter le badge pill conditionnel après le nom :

   ```tsx
   // Badge pill gravitaire — conditions :
   // canal.elevationLoading && !canal.elevation → "⏳ Chargement..."
   // canal.elevation?.isFullyGravity === true → "✅ Gravitaire"
   // canal.elevation && !canal.elevation.isFullyGravity → "⚠ Montées détectées"
   ```

   Structure cible de la `<li>` :
   ```tsx
   <li
     onClick={() => selectCanal(canal.id)}
     className={`flex items-start justify-between px-3 py-2 rounded cursor-pointer
                 transition-colors outline-none ${focusRing}
                 ${
                   isSelected
                     ? 'bg-blue-500/20 border border-blue-500/40'
                     : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                 }`}
     tabIndex={0}
     onKeyDown={(e) => e.key === 'Enter' && selectCanal(canal.id)}
   >
     <div className="flex flex-col gap-[2px] min-w-0">
       <span className="text-sm text-white truncate">{canal.name}</span>
       {canal.elevationLoading && !canal.elevation && (
         <span className="text-[10px] px-[6px] py-[2px] rounded-full bg-gray-700 text-gray-400 w-fit">
           ⏳ Chargement...
         </span>
       )}
       {canal.elevation?.isFullyGravity === true && (
         <span className="text-[10px] px-[6px] py-[2px] rounded-full bg-green-500/15 text-green-400 w-fit">
           ✅ Gravitaire
         </span>
       )}
       {canal.elevation && !canal.elevation.isFullyGravity && (
         <span className="text-[10px] px-[6px] py-[2px] rounded-full bg-amber-500/15 text-amber-400 w-fit">
           ⚠ Montées détectées
         </span>
       )}
     </div>
     <button
       onClick={(e) => {
         e.stopPropagation()
         setConfirmOpen(true)
       }}
       className={`ml-2 p-1 rounded text-gray-400 hover:text-red-500
                   hover:bg-red-500/10 transition-colors outline-none ${focusRing}`}
       aria-label={`Supprimer ${canal.name}`}
     >
       <Trash2 size={14} />
     </button>
   </li>
   ```

2. Modifier src/components/MapView.tsx — ajouter la source et le layer canal-uphill, plus la fonction syncUphillLayer :

   a) Ajouter les imports en haut du fichier :
   ```typescript
   import { along, lineString } from '@turf/turf'
   import type { ElevationProfile } from '../types/elevation'
   ```

   b) Dans la fonction initSources(map), APRÈS l'appel addLayer markers-circle, ajouter :
   ```typescript
   // Layer uphill — segments où l'eau devrait monter (rouge, par-dessus le bleu)
   // Vérification défensive : évite l'erreur "source already exists" en cas de double-mount
   if (!map.getSource('canal-uphill-source')) {
     map.addSource('canal-uphill-source', { type: 'geojson', data: emptyFC })
     map.addLayer({
       id: 'canal-uphill',
       type: 'line',
       source: 'canal-uphill-source',
       layout: { 'line-join': 'round', 'line-cap': 'round' },
       paint: { 'line-color': '#EF4444', 'line-width': 5, 'line-opacity': 1.0 },
     })
   }
   ```

   c) Ajouter la fonction syncUphillLayer APRÈS la fonction syncLayers existante :
   ```typescript
   function syncUphillLayer(
     map: maplibregl.Map,
     profile: ElevationProfile | null,
     canalPoints: Coord[],
   ) {
     const source = map.getSource('canal-uphill-source') as GeoJSONSource | undefined
     if (!source) return

     if (!profile || profile.uphillSegments.length === 0) {
       source.setData({ type: 'FeatureCollection', features: [] })
       return
     }

     const line = lineString(canalPoints)
     const features = profile.uphillSegments.map((seg) => {
       const start = along(line, seg.distanceStart, { units: 'kilometers' })
       const end = along(line, seg.distanceEnd, { units: 'kilometers' })
       return {
         type: 'Feature' as const,
         properties: {},
         geometry: {
           type: 'LineString' as const,
           coordinates: [start.geometry.coordinates, end.geometry.coordinates],
         },
       }
     })
     source.setData({ type: 'FeatureCollection', features })
   }
   ```

   d) Dans le composant MapView, ajouter les sélecteurs Zustand et un useEffect pour uphill.
   Après les sélecteurs existants (canals, draftPoints, previewCoord), ajouter :
   ```typescript
   const selectedCanalId = useCanalStore((s) => s.selectedCanalId)

   useEffect(() => {
     const map = mapRef.current
     if (!map || !map.isStyleLoaded()) return
     const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
     syncUphillLayer(map, selectedCanal?.elevation ?? null, selectedCanal?.points ?? [])
   }, [canals, selectedCanalId])
   ```

3. Modifier src/components/SidePanel.tsx — monter useElevation + ajouter ElevationPanel.

   Remplacer le contenu de SidePanel.tsx par :
   ```tsx
   // src/components/SidePanel.tsx
   import { ModeIndicator } from './ModeIndicator'
   import { DrawingToolbar } from './DrawingToolbar'
   import { CanalList } from './CanalList'
   import { ElevationPanel } from './ElevationPanel'
   import { useElevation } from '../hooks/useElevation'

   export function SidePanel() {
     // Déclenche automatiquement le fetch d'élévation quand un canal est sélectionné
     useElevation()

     return (
       <aside
         className="fixed right-0 top-0 h-full w-80 flex flex-col z-10 border-l border-white/[0.08]"
         style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(4px)' }}
       >
         {/* Section 1 — Header + badge mode */}
         <ModeIndicator />

         {/* Section 2 — Actions de dessin */}
         <div className="px-4 py-4 border-b border-white/[0.08]">
           <DrawingToolbar />
         </div>

         {/* Section 3 — Liste des canaux (scrollable, flex-1) */}
         <div className="flex-1 overflow-y-auto px-4 py-4">
           <CanalList />
         </div>

         {/* Section 4 — Profil altimétrique (accordéon) */}
         <ElevationPanel />

         {/* Section 5 — Footer (réservé Phase 6) */}
         <div className="px-4 py-3 border-t border-white/[0.08] text-xs text-gray-500">
           {/* Global stats placeholder Phase 6 */}
         </div>
       </aside>
     )
   }
   ```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | head -30 && npm test 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - grep "Gravitaire" src/components/CanalListItem.tsx → badge ✅ Gravitaire présent
    - grep "Montées détectées" src/components/CanalListItem.tsx → badge ⚠ présent
    - grep "Chargement\.\.\." src/components/CanalListItem.tsx → badge ⏳ présent
    - grep "canal-uphill-source" src/components/MapView.tsx → source ajoutée
    - grep "canal-uphill" src/components/MapView.tsx → layer présent
    - grep "EF4444" src/components/MapView.tsx → couleur rouge correcte
    - grep "syncUphillLayer" src/components/MapView.tsx → fonction présente ET appelée dans useEffect
    - grep "getSource.*canal-uphill-source" src/components/MapView.tsx → vérification défensive présente
    - grep "ElevationPanel" src/components/SidePanel.tsx → composant monté
    - grep "useElevation" src/components/SidePanel.tsx → hook appelé
    - npx tsc --noEmit ne signale PAS d'erreur TypeScript
    - npm test → suite complète GREEN
  </acceptance_criteria>
  <done>CanalListItem étendu avec badge pill (3 variantes). MapView étendu avec canal-uphill-source + layer rouge + syncUphillLayer. SidePanel étendu avec useElevation() + ElevationPanel. TypeScript compile sans erreur.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Phase 2 complète — profil altimétrique, segments uphill rouges, badges gravitaires. Vérification visuelle et fonctionnelle requise.
  </what-built>
  <how-to-verify>
1. Démarrer l'app : `cd C:/dev/gsd/science/canal && npm run dev` → ouvrir http://localhost:5173

2. Vérifier l'état vide :
   - Le panneau latéral droit affiche "Profil altimétrique" en header accordéon
   - Sans canal sélectionné : corps affiche "Sélectionnez un canal pour voir son profil altimétrique"

3. Tracer un canal gravitaire (descente nette) :
   - Cliquer "Dessiner canal", poser des points en montagne vers la mer (ex. Alpes → Méditerranée)
   - Double-clic pour finaliser
   - Cliquer sur le canal tracé dans la liste
   - Observer : spinner h-40 pendant le chargement (~300–2000ms)
   - Observer : graphique altitude vs distance avec courbe bleue
   - Observer : badge "✅ Gravitaire" si aucune montée, ou "⚠ Montées détectées" sinon
   - Observer : message "✅ Ce canal est entièrement réalisable par gravité" OU "⚠ N segment(s) en montée"

4. Vérifier les segments uphill sur la carte :
   - Tracer un canal avec une montée visible (vallée → col → descente)
   - Après chargement : segments rouges épais (#EF4444, 5px) visibles sur la carte au-dessus du bleu

5. Vérifier le badge CanalListItem :
   - Pendant le chargement : badge gris "⏳ Chargement..."
   - Après chargement : badge vert "✅ Gravitaire" ou badge ambre "⚠ Montées détectées"

6. Tester le cache mémoire :
   - Désélectionner le canal (clic ailleurs sur la carte)
   - Re-sélectionner le même canal → profil apparaît immédiatement sans spinner (cache mémoire)

7. Vérifier l'accordéon :
   - Cliquer sur le header "Profil altimétrique" → accordéon se ferme
   - Cliquer à nouveau → accordéon s'ouvre
  </how-to-verify>
  <resume-signal>Tapez "approved" si tous les points ci-dessus sont vérifiés, ou décrivez les problèmes observés pour correction.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| API response → UI render | Données d'élévation non contrôlées rendues dans le DOM (Recharts) |
| store → MapLibre setData | Données de segments uphill envoyées à l'API WebGL MapLibre |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-06 | Tampering | ElevationChart — données API → SVG Recharts | mitigate | Les altitudes sont des `number` (ou 0 après normalisation T02). Recharts reçoit ElevationPoint[] typé. TypeScript bloque les injections de chaînes. |
| T-02-07 | Tampering | syncUphillLayer — GeoJSON → MapLibre WebGL | accept | Les features GeoJSON sont construites depuis des coordonnées numériques typées — aucune interpolation de chaîne utilisateur. |
| T-02-08 | Denial of Service | ElevationPanel — layout shift si hauteur non fixe | mitigate | Hauteur fixe h-40 (160px) sur spinner ET graphique — implémentée dans Task 1. |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# TypeScript compilation complète
npx tsc --noEmit
# Suite de tests complète
npm test
# Vérifications grep rapides
grep -c "canal-uphill-source" src/components/MapView.tsx
grep -c "ElevationPanel" src/components/SidePanel.tsx
grep -c "Gravitaire" src/components/CanalListItem.tsx
# Build production (optionnel — vérifie qu'aucun import manquant)
npm run build 2>&1 | tail -10
```
</verification>

<success_criteria>
- src/components/ElevationChart.tsx : ReferenceArea déclaré avant Area, isAnimationActive=false, fill rouge 30% opacité, fill bleu 15% opacité
- src/components/ElevationPanel.tsx : 4 états (vide/loading h-40/erreur/données), accordéon toggle, copywriting conforme UI-SPEC
- src/components/CanalListItem.tsx : badge pill 3 variantes (⏳ gris / ✅ vert / ⚠ ambre)
- src/components/MapView.tsx : canal-uphill-source + layer #EF4444 5px, syncUphillLayer avec getSource() défensif
- src/components/SidePanel.tsx : useElevation() monté, ElevationPanel en Section 4
- npx tsc --noEmit : 0 erreur
- npm test : suite complète GREEN
- Checkpoint humain : profil visible, segments rouges sur la carte, badges corrects, cache fonctionnel
</success_criteria>

<output>
After completion, create `.planning/phases/02-elevation-profil/02-T03-SUMMARY.md`
</output>

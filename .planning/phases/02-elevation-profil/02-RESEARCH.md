# Phase 2: Élévation + Profil — Research

**Researched:** 2026-04-30
**Domain:** Elevation data (Open Topo Data), charting (Recharts), geospatial sampling (Turf.js), MapLibre dynamic layers
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Source élévation : Open Topo Data GLO-30 (Copernicus) — gratuit, sans auth, conforme contrainte absolue client-side
- Sampling : 100 points interpolés linéairement sur le tracé via Turf.js `lineChunk` / `along`
- Batch API : regrouper les 100 coords en 1-2 requêtes POST batch (max 100 coords/req Open Topo Data)
- Fallback API down : afficher erreur explicite "Données d'élévation indisponibles — Open Topo Data inaccessible"
- Bibliothèque graphique : Recharts — React-native, TypeScript first, léger (~3KB gzip)
- Position graphique : panneau latéral bas — section accordéon sous CanalList
- Axes : x = Distance (km), y = Altitude (m)
- Zones uphill graphique : zones remplies rouge translucide (`#EF4444` à 30% opacité) via `ReferenceArea`
- Segments uphill carte : couche MapLibre séparée `canal-uphill` en rouge `#EF4444`, 5px
- Badge liste : pill sur CanalListItem — "✅ Gravitaire" / "⚠ Montées détectées" / "⏳ Chargement..."
- Extension type Canal : ajouter `elevation?: ElevationProfile` — optionnel pour rétrocompatibilité Phase 1
- Déclenchement fetch : automatique au `selectCanal()` — pas de bouton "Charger profil"
- Persistance : données d'élévation en mémoire Zustand uniquement (re-fetch si reload) — Dexie Phase 4

### Claude's Discretion
- Structure interne du hook `useElevation`
- Stratégie de gestion des erreurs réseau (retry ou pas)
- Nommage interne des helpers d'algorithme uphill
- Organisation du fichier `src/types/elevation.ts`

### Deferred Ideas (OUT OF SCOPE)
- Cache persistant des profils d'élévation → Phase 4 Dexie.js
- Routing automatique évitant les montées → Phase 3
- Calcul de l'impact partiel (canal arrêté avant obstacle) → Phase 4 CALC-05
- Comparaison multi-canaux sur même graphique → v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-03 | L'utilisateur peut voir le profil d'élévation du tracé — graphique altitude (m) vs distance (km) | Open Topo Data API (100 points) + Recharts AreaChart avec axes configurés |
| MAP-04 | Les segments en montée sont automatiquement flaggés (eau ne peut pas couler par gravité — affichage en rouge) | Algorithme de détection uphill sur série d'altitudes + ReferenceArea Recharts + layer MapLibre `canal-uphill` |
</phase_requirements>

---

## Summary

Phase 2 ajoute la conscience altimétrique au tracé de canal : fetch de 100 points d'élévation via Open Topo Data, rendu d'un profil altitude/distance via Recharts, et surlignage rouge des segments où l'eau devrait monter. C'est le premier point de contact avec la contrainte gravitaire fondamentale du projet.

L'API Open Topo Data (`copernicus30m`) est confirmée gratuite, sans authentification, avec une limite de 100 locations par requête et 1 requête/seconde. Les 100 points sont générés via `turf.along()` + `turf.length()` sur le LineString du canal. L'algorithme uphill est trivial (comparaison de paires consécutives d'altitudes) mais son résultat doit alimenter à la fois Recharts (zones rouges) et MapLibre (layer séparé de segments LineString).

Le schéma de state Zustand nécessite deux nouvelles actions (`setElevation`, `setElevationLoading`, `setElevationError`) et une extension optionnelle du type `Canal` — la rétrocompatibilité Phase 1 est garantie par le `?` optionnel sur `elevation`.

**Primary recommendation:** Implémenter dans l'ordre strict — (1) types + store, (2) hook `useElevation` (fetch + algorithme), (3) `ElevationChart` (Recharts), (4) `ElevationPanel` (accordéon + états), (5) layer MapLibre, (6) badges CanalListItem. Cet ordre garantit que chaque couche est testable avant d'ajouter la suivante.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetch élévation 100 points | Browser / Client | — | Appel direct vers API publique sans auth, 100% client-side |
| Sampling des points (turf.along) | Browser / Client | — | Calcul géospatial in-browser via Turf.js |
| Algorithme détection uphill | Browser / Client | — | Calcul pur JS sur tableau d'altitudes |
| Rendu graphique AreaChart | Browser / Client | — | Recharts = composants React rendus côté client |
| Layer MapLibre canal-uphill | Browser / Client | — | MapLibre WebGL, appel setData() sur source GeoJSON |
| State management (Zustand) | Browser / Client | — | Store in-memory, re-fetch au reload |
| Types ElevationProfile | Browser / Client | — | TypeScript compile-time only |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | Graphique profil altimétrique | React-native SVG, TypeScript first, ReferenceArea built-in |
| @turf/turf | 7.3.5 | Interpolation 100 points + calcul longueur | Déjà décidé, géodésique correct (WGS84), along() + length() |
| maplibre-gl | 5.24.0 (déjà installé) | Layer `canal-uphill` dynamique | Déjà installé, setData() pattern établi Phase 1 |
| zustand | 5.0.12 (déjà installé) | State elevation + loading + error | Déjà installé, pattern store établi Phase 1 |

> Versions vérifiées via `npm view` le 2026-04-30. [VERIFIED: npm registry]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.14.0 (déjà installé) | Icône ChevronDown accordéon, AlertCircle erreur | Déjà installé |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts AreaChart + ReferenceArea | Victory Charts | Recharts plus léger, API plus simple pour ce cas d'usage |
| recharts AreaChart + ReferenceArea | Chart.js + react-chartjs-2 | Chart.js non-React natif, configuration plus verboseuse |
| @turf/turf (full bundle) | @turf/along + @turf/length séparément | Bundle partiel possible mais turf full déjà décidé |

**Installation requise (packages non encore installés) :**
```bash
npm install recharts @turf/turf
```

**Version verification:**
```bash
npm view recharts version      # 3.8.1 (2026-03-25)
npm view @turf/turf version    # 7.3.5
```

---

## Architecture Patterns

### System Architecture Diagram

```
Utilisateur sélectionne un canal
          │
          ▼
selectCanal(id)   ──────────────────────────────────────────────┐
   [canalStore]                                                   │
          │                                                       │
          ▼                                                       ▼
useElevation hook                                     MapView useEffect
  abonné à selectedCanalId                            abonné à canals + elevation
          │                                                       │
          │  canal.elevation absent ?                             │
          │         │                                             │
          │         ▼                                             │
          │  turf.length(lineString) → totalKm                   │
          │  loop 100x turf.along() → [lng, lat] × 100           │
          │         │                                             │
          │         ▼                                             │
          │  POST https://api.opentopodata.org/v1/copernicus30m  │
          │  body: "lat1,lng1|lat2,lng2|...|lat100,lng100"       │
          │         │                                             │
          │     success │ error                                   │
          │         │   └── setElevationError() → état erreur    │
          │         ▼                                             │
          │  detectUphillSegments(elevations)                    │
          │  → ElevationProfile                                   │
          │         │                                             │
          │         ▼                                             │
          │  setElevation(canalId, profile) [store Zustand]      │
          │                                                       │
          │                                                       │
          ▼                                                       ▼
ElevationPanel                                        canal-uphill-source.setData()
  ElevationChart (Recharts)                           → segments LineString rouges
  ReferenceArea × N zones uphill                      visibles sur la carte
  Message gravitaire / montées
          │
          ▼
CanalListItem badge pill
  (✅ / ⚠ / ⏳ selon canal.elevation)
```

### Recommended Project Structure

```
src/
├── types/
│   ├── canal.ts            # Étendu : Canal.elevation?: ElevationProfile
│   └── elevation.ts        # NOUVEAU : ElevationPoint, UphillSegment, ElevationProfile
├── store/
│   └── canalStore.ts       # Étendu : setElevation, setElevationLoading, setElevationError
├── hooks/
│   ├── useMapInteraction.ts # Inchangé
│   └── useElevation.ts     # NOUVEAU : fetch + algorithme + store update
├── components/
│   ├── MapView.tsx          # Étendu : source + layer canal-uphill
│   ├── SidePanel.tsx        # Étendu : ElevationPanel ajouté
│   ├── CanalListItem.tsx    # Étendu : badge gravitaire
│   ├── ElevationPanel.tsx   # NOUVEAU : accordéon conteneur
│   └── ElevationChart.tsx  # NOUVEAU : Recharts AreaChart
└── services/
    └── elevationApi.ts     # NOUVEAU (optionnel) : fetch Open Topo Data isolé
```

---

### Pattern 1 : Fetch Open Topo Data via POST

**What:** Requête POST vers `https://api.opentopodata.org/v1/copernicus30m` avec les 100 coordonnées au format pipe-separated `"lat,lng|lat,lng|..."`.

**Endpoint confirmé:** `https://api.opentopodata.org/v1/copernicus30m`
[VERIFIED: opentopodata.org homepage + community usage confirmation]

**Limites confirmées:**
- Max 100 locations par requête [VERIFIED: opentopodata.org]
- Max 1 requête/seconde [VERIFIED: opentopodata.org]
- Max 1000 requêtes/jour [VERIFIED: opentopodata.org]

**Format body POST:** Les coordonnées sont au format `"lat,lng|lat,lng|..."` (pipe-separated), PAS un array JSON d'objets. Le body JSON contient une seule clé `locations` avec une string.

**Format de réponse:**
```json
{
  "results": [
    {
      "elevation": 45.0,
      "location": { "lat": 43.5, "lng": 1.5 },
      "dataset": "copernicus30m"
    }
  ],
  "status": "OK"
}
```
Les champs sont `lat`/`lng` (et non `latitude`/`longitude`). L'élévation peut être `null` si hors-couverture.
[CITED: https://www.opentopodata.org/api/]

**When to use:** Toujours POST pour 100 points — GET causerait des problèmes de longueur d'URL.

**Example:**
```typescript
// Source: https://www.opentopodata.org/api/
async function fetchElevations(coords: Array<[number, number]>): Promise<number[]> {
  // coords = [[lng, lat], ...] — attention : API attend lat,lng (ordre inversé vs Turf WGS84)
  const locations = coords
    .map(([lng, lat]) => `${lat},${lng}`)  // INVERSION obligatoire lng→lat pour l'API
    .join('|')

  const response = await fetch('https://api.opentopodata.org/v1/copernicus30m', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
  })

  if (!response.ok) {
    throw new Error(`Open Topo Data HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK') {
    throw new Error(`Open Topo Data status: ${data.status}`)
  }

  return data.results.map((r: { elevation: number | null }) => r.elevation ?? 0)
}
```

**Piège critique — ordre lat/lng:** Turf.js stocke en `[lng, lat]` (GeoJSON standard). Open Topo Data attend `lat,lng`. L'inversion est obligatoire lors de la construction de la string de locations.

---

### Pattern 2 : Sampling 100 points via Turf.js

**What:** Utiliser `turf.length()` pour obtenir la longueur totale du tracé, puis `turf.along()` 100 fois à intervalles réguliers pour extraire les coordonnées.

**When to use:** Pour tout tracé de canal (LineString avec ≥ 2 points).

**Example:**
```typescript
// Source: https://turfjs.org/docs/api/along + https://turfjs.org/docs/api/length
import { along, length, lineString } from '@turf/turf'
import type { Coord } from '../types/canal'

function samplePoints(points: Coord[], n = 100): Coord[] {
  const line = lineString(points)  // [lng, lat][] → GeoJSON LineString
  const totalKm = length(line, { units: 'kilometers' })
  const interval = totalKm / (n - 1)

  const sampled: Coord[] = []
  for (let i = 0; i < n; i++) {
    const dist = i * interval
    const pt = along(line, dist, { units: 'kilometers' })
    const [lng, lat] = pt.geometry.coordinates as [number, number]
    sampled.push([lng, lat])
  }
  return sampled
}
```

**Notes:**
- `along()` retourne un Feature<Point> dont les coordonnées sont `[lng, lat]` (GeoJSON standard). [VERIFIED: turfjs.org docs]
- Pour i=0 : `along(line, 0)` retourne le premier point du tracé.
- Pour i=n-1 : `along(line, totalKm)` retourne le dernier point (ou très proche).
- `lineString()` de Turf attend des coordonnées `[lng, lat][]` — cohérent avec la convention du projet.

---

### Pattern 3 : Algorithme détection uphill

**What:** Comparer chaque paire consécutive d'altitudes. Un segment est "uphill" si `altitude[i+1] > altitude[i]`. Grouper les segments uphill consécutifs en zones continues pour Recharts.

**Example:**
```typescript
interface ElevationPoint { distance: number; altitude: number }
interface UphillSegment { distanceStart: number; distanceEnd: number; altitudeGain: number }

function detectUphillSegments(points: ElevationPoint[]): UphillSegment[] {
  const segments: UphillSegment[] = []
  let segStart: number | null = null
  let segStartAlt: number | null = null

  for (let i = 1; i < points.length; i++) {
    const isUphill = points[i].altitude > points[i - 1].altitude

    if (isUphill && segStart === null) {
      // Début d'un nouveau segment montant
      segStart = points[i - 1].distance
      segStartAlt = points[i - 1].altitude
    } else if (!isUphill && segStart !== null) {
      // Fin du segment montant
      segments.push({
        distanceStart: segStart,
        distanceEnd: points[i - 1].distance,
        altitudeGain: points[i - 1].altitude - (segStartAlt ?? 0),
      })
      segStart = null
      segStartAlt = null
    }
  }
  // Fermer un segment éventellement ouvert à la fin
  if (segStart !== null) {
    const last = points[points.length - 1]
    segments.push({
      distanceStart: segStart,
      distanceEnd: last.distance,
      altitudeGain: last.altitude - (segStartAlt ?? 0),
    })
  }
  return segments
}
```

**Notes:**
- Le totalUphillGain est la somme des `altitudeGain` de tous les segments.
- `isFullyGravity = segments.length === 0`.
- Les altitudes nulles (hors-couverture DEM) doivent être traitées comme 0 — la vérification doit se faire lors du mapping des résultats API.

---

### Pattern 4 : Recharts AreaChart + ReferenceArea

**What:** AreaChart avec une courbe principale bleue (fill 15% opacité) et N ReferenceArea rouges (fill 30% opacité) pour les zones uphill.

**ReferenceArea props confirmées:**
- `x1`, `x2` : coordonnées de données sur l'axe X (km) [VERIFIED: recharts.github.io/en-US/api/ReferenceArea]
- `fill` : couleur SVG directe (pas Tailwind)
- `fillOpacity` : opacité du fill (0–1)
- `strokeOpacity` : mettre à 0 pour pas de bordure
- Les ReferenceArea se déclarent AVANT l'Area pour que la courbe soit par-dessus

**Example:**
```tsx
// Source: https://recharts.github.io/en-US/api/ReferenceArea
import { AreaChart, Area, ReferenceArea, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={160}>
  <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
    <XAxis dataKey="distance" type="number" domain={['dataMin', 'dataMax']}
           tick={{ fill: '#9CA3AF', fontSize: 10 }} />
    <YAxis domain={['auto', 'auto']}
           tick={{ fill: '#9CA3AF', fontSize: 10 }} width={36} />
    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.12)' }} />

    {/* Zones uphill AVANT la courbe — pour que la courbe bleue soit au-dessus */}
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

    <Area
      type="monotone"
      dataKey="altitude"
      stroke="#3B82F6"
      strokeWidth={2}
      fill="#3B82F6"
      fillOpacity={0.15}
      dot={false}
      isAnimationActive={false}
    />
  </AreaChart>
</ResponsiveContainer>
```

**Note sur recharts version 3.x vs 2.x:** Recharts 3.x est installé (3.8.1 publié 2026-03-25). L'API ReferenceArea est stable entre 2.x et 3.x. [VERIFIED: npm registry]

---

### Pattern 5 : Layer MapLibre canal-uphill dynamique

**What:** Ajouter `canal-uphill-source` (GeoJSON vide) et le layer `canal-uphill` au chargement de la carte (dans `initSources`). Mettre à jour via `setData()` quand l'élévation change.

**Vérification d'existence:** `map.getSource(id)` retourne `undefined` si la source n'existe pas. Pas de méthode `hasSource()`. [VERIFIED: maplibre.org/maplibre-gl-js/docs/API/classes/Map/]

**Example:**
```typescript
// Dans initSources(map) — pattern identique aux sources Phase 1
const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

map.addSource('canal-uphill-source', { type: 'geojson', data: emptyFC })
map.addLayer({
  id: 'canal-uphill',
  type: 'line',
  source: 'canal-uphill-source',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: { 'line-color': '#EF4444', 'line-width': 5, 'line-opacity': 1.0 },
})
// Ajouté APRÈS canals-line → rendu par-dessus le bleu

// Mise à jour depuis useEffect :
function syncUphillLayer(map: maplibregl.Map, profile: ElevationProfile | null, canalPoints: Coord[]) {
  const source = map.getSource('canal-uphill-source') as GeoJSONSource | undefined
  if (!source) return

  if (!profile || profile.uphillSegments.length === 0) {
    source.setData({ type: 'FeatureCollection', features: [] })
    return
  }

  // Convertir les segments (distanceStart/End) en sous-LineStrings
  // via turf.along() sur les points du canal sélectionné
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

**Note importante:** Pour des segments uphill avec beaucoup de points intermédiaires, il serait plus précis de reconstruire le sous-LineString à partir des points samplés (pas seulement start/end). Pour Phase 2, la version simplifiée (start/end) est acceptable — les segments sont de courte distance.

---

### Pattern 6 : Hook useElevation

**What:** Custom hook React s'abonnant au `selectedCanalId` dans le store Zustand, déclenchant le fetch si l'élévation est absente, mettant à jour le store via les actions.

**Pattern Zustand async recommandé:** Les actions async se définissent directement dans le store (pas besoin de middleware thunk). Le hook `useElevation` agit comme un orchestrateur de side-effect via `useEffect`. [CITED: github.com/pmndrs/zustand/discussions/1415]

**Example:**
```typescript
// src/hooks/useElevation.ts
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { samplePoints } from '../services/elevationApi'  // ou inline

export function useElevation() {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const setElevation = useCanalStore((s) => s.setElevation)
  const setElevationLoading = useCanalStore((s) => s.setElevationLoading)
  const setElevationError = useCanalStore((s) => s.setElevationError)

  useEffect(() => {
    if (!selectedCanalId) return
    const canal = canals.find((c) => c.id === selectedCanalId)
    if (!canal) return
    if (canal.elevation) return  // Cache hit — pas de re-fetch

    let cancelled = false

    const run = async () => {
      setElevationLoading(selectedCanalId, true)
      try {
        const sampledCoords = samplePoints(canal.points, 100)
        const altitudes = await fetchElevations(sampledCoords)
        if (cancelled) return
        const profile = buildProfile(sampledCoords, altitudes, canal.points)
        setElevation(selectedCanalId, profile)
      } catch (err) {
        if (cancelled) return
        setElevationError(selectedCanalId, err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setElevationLoading(selectedCanalId, false)
      }
    }

    run()
    return () => { cancelled = true }  // Annulation si selectedCanalId change pendant le fetch
  }, [selectedCanalId, canals, setElevation, setElevationLoading, setElevationError])
}
```

**Cleanup obligatoire:** Le flag `cancelled` évite les race conditions si l'utilisateur sélectionne un autre canal pendant le fetch.

---

### Pattern 7 : Extension du Store Zustand

**What:** Ajouter `elevation`, `elevationLoading`, `elevationError` dans le type Canal et les actions correspondantes dans le store.

**Example — extension du type Canal:**
```typescript
// src/types/canal.ts — extension rétrocompatible
import type { ElevationProfile } from './elevation'

export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  elevation?: ElevationProfile       // NOUVEAU — optionnel, rétrocompat Phase 1
  elevationLoading?: boolean         // NOUVEAU — optionnel
  elevationError?: string            // NOUVEAU — optionnel
}
```

**Example — nouvelles actions dans le store:**
```typescript
// Ajout dans CanalStore interface
setElevation: (id: string, profile: ElevationProfile) => void
setElevationLoading: (id: string, loading: boolean) => void
setElevationError: (id: string, error: string) => void

// Implémentation (immuable, pattern Zustand)
setElevation: (id, profile) => set((state) => ({
  canals: state.canals.map((c) => c.id === id ? { ...c, elevation: profile, elevationError: undefined } : c),
})),
setElevationLoading: (id, loading) => set((state) => ({
  canals: state.canals.map((c) => c.id === id ? { ...c, elevationLoading: loading } : c),
})),
setElevationError: (id, error) => set((state) => ({
  canals: state.canals.map((c) => c.id === id ? { ...c, elevationError: error, elevationLoading: false } : c),
})),
```

---

### Anti-Patterns to Avoid

- **Reconstruire le type Canal entier à chaque setData:** Zustand `set()` avec spread `...c` suffit — pas besoin de passer tout le canal.
- **Utiliser `addSource()` sans vérifier `getSource()`:** Si la carte est montée deux fois (rare mais possible en dev), `addSource()` lance une erreur si la source existe déjà. Utiliser `if (!map.getSource('canal-uphill-source'))` avant `addSource()`.
- **Déclarer ReferenceArea après Area:** Les zones rouges seraient par-dessus la courbe bleue. Toujours déclarer les ReferenceArea en premier dans l'AreaChart.
- **Ne pas annuler les fetches en cours:** Sans le flag `cancelled`, changer de canal rapidement peut déclencher plusieurs fetchs et le dernier résultat reçu n'est pas forcément le dernier demandé (race condition).
- **Oublier l'inversion lat/lng:** Turf = `[lng, lat]`, Open Topo Data attend `lat,lng`. C'est le piège le plus probable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sampling points along linestring | Boucle personnalisée avec interpolation linéaire de coords | `turf.along()` + `turf.length()` | Gère la courbure géodésique, cas limites (coord finale), projections correctes |
| Chart avec zones colorées | Canvas 2D + calculs manuels de rectangles | Recharts `ReferenceArea` | Props x1/x2 en coordonnées de données, gère automatiquement le mapping data→pixels |
| GeoJSON LineString pour segments uphill | Construction manuelle de features | `turf.along()` pour extraire coords aux distances calculées | Plus robuste que recalculer depuis les indices |
| Gestion du state async (loading/error/data) | Pattern useState + useEffect custom | Actions Zustand atomiques + hook `useElevation` | Cohérent avec le pattern store établi Phase 1 |

**Key insight:** La complexité de Phase 2 est dans l'orchestration (fetch → algorithme → store → deux rendus différents), pas dans les algorithmes eux-mêmes. Chaque algorithme individuel est simple ; c'est leur composition sans race conditions qui est le vrai défi.

---

## Common Pitfalls

### Pitfall 1 : Inversion lat/lng entre Turf et Open Topo Data

**What goes wrong:** Turf.js stocke toutes les coordonnées en `[lng, lat]` (convention GeoJSON). Open Topo Data attend `lat,lng` dans sa string de locations. Sans inversion, les points requêtés sont géographiquement incorrects (antarctique au lieu de France, etc.).

**Why it happens:** Deux conventions différentes coexistent — GeoJSON (lng, lat) vs Google Elevation API (lat, lng) que Open Topo Data imite.

**How to avoid:** Dans la construction de la string `locations`, toujours faire `coords.map(([lng, lat]) => \`${lat},${lng}\`)`. Ajouter un commentaire explicite.

**Warning signs:** Les altitudes retournées sont 0 ou null pour des zones montagneuses évidentes, ou des valeurs aberrantes (+8000m pour un canal en Bretagne).

---

### Pitfall 2 : Altitude null pour zones hors-couverture DEM

**What goes wrong:** Open Topo Data retourne `null` pour les locations en mer ou hors-couverture Copernicus GLO-30. Si non géré, `null` dans le tableau d'altitudes crée des NaN dans les calculs et un graphique cassé.

**Why it happens:** Le canal peut commencer ou finir en mer (point de départ côtier), ou traverser un lac dont la bathymétrie n'est pas dans le DEM.

**How to avoid:** Normaliser `r.elevation ?? 0` lors du mapping des résultats. Documenter que 0 = "au niveau de la mer ou hors-couverture".

**Warning signs:** `NaN` dans les altitudes, graphique vide ou avec des trous.

---

### Pitfall 3 : Race condition lors de sélections rapides de canaux

**What goes wrong:** L'utilisateur sélectionne Canal A → fetch démarre → sélectionne Canal B → fetch de A arrive → set l'élévation de A → l'affichage montre le profil de A alors que B est sélectionné.

**Why it happens:** Le fetch est asynchrone et les résultats peuvent arriver dans n'importe quel ordre.

**How to avoid:** Flag `cancelled = true` dans le cleanup du `useEffect`, vérifié avant tout `set*` dans les callbacks async.

**Warning signs:** Le graphique affiché ne correspond pas au canal sélectionné (nom différent dans le badge vs profil).

---

### Pitfall 4 : Layout shift lors de l'apparition du graphique

**What goes wrong:** L'ElevationPanel passe de hauteur 0 ou "auto" à la hauteur du graphique, poussant les autres éléments du panneau et causant un saut visuel.

**Why it happens:** Si la zone de chargement n'a pas la même hauteur que la zone graphique, ou si l'accordéon n'a pas de hauteur fixe pendant le chargement.

**How to avoid:** Hauteur fixe de 160px pour le conteneur graphique ET pour le spinner de chargement. Spécifié dans le UI-SPEC : `h-40 (160px)` dans les deux cas.

**Warning signs:** Saut de hauteur perceptible quand le graphique apparaît après le spinner.

---

### Pitfall 5 : addSource() sur source déjà existante (mode dev React double-mount)

**What goes wrong:** En mode développement, React peut monter les composants deux fois (ancien StrictMode). `initSources()` appelée deux fois sur la même instance map lève une erreur si la source existe déjà.

**Why it happens:** MapLibre lève une exception si on appelle `addSource()` avec un ID déjà enregistré.

**How to avoid:** Vérification `if (!map.getSource('canal-uphill-source'))` avant `addSource()`. La Phase 1 a déjà résolu ce problème en désactivant StrictMode (commit `fix(01)`). Ajouter la vérification défensive quand même.

**Warning signs:** Erreur console "There is already a source with this ID" en développement.

---

### Pitfall 6 : Rate limit Open Topo Data (1 req/s, 1000/jour)

**What goes wrong:** En développement avec Hot Module Replacement, ou si l'utilisateur sélectionne et désélectionne des canaux rapidement, plusieurs requêtes sont envoyées en succession rapide, déclenchant le rate limit (HTTP 429).

**Why it happens:** L'API publique est gratuite avec des limitations strictes. 1 req/s = facile à dépasser en mode dev.

**How to avoid:** Le cache mémoire Zustand (`if (canal.elevation) return`) évite les re-fetch. Toujours vérifier le cache avant tout appel. Ne pas ajouter de polling ni de retry automatique en Phase 2.

**Warning signs:** HTTP 429 dans les DevTools Network, erreur "Too Many Requests".

---

## Type Definitions

Extension complète pour `src/types/elevation.ts` (nouveau fichier) :

```typescript
// src/types/elevation.ts
// Types du profil altimétrique — Phase 2

export interface ElevationPoint {
  distance: number  // km depuis le début du tracé
  altitude: number  // mètres NGF / Copernicus GLO-30 (null normalisé à 0)
}

export interface UphillSegment {
  distanceStart: number  // km — début du segment montant
  distanceEnd:   number  // km — fin du segment montant
  altitudeGain:  number  // m — dénivelé positif du segment (toujours > 0)
}

export interface ElevationProfile {
  points:          ElevationPoint[]  // 100 points ordonnés par distance croissante
  uphillSegments:  UphillSegment[]   // segments où altitude monte (eau ne peut pas couler)
  totalUphillGain: number            // m — somme de tous les altitudeGain
  isFullyGravity:  boolean           // true si uphillSegments.length === 0
  fetchedAt:       number            // Date.now() — pour info, re-fetch si reload
}
```

---

## Error Handling

### Scénarios d'erreur et comportements attendus

| Scénario | HTTP Status | Comportement |
|----------|------------|--------------|
| API inaccessible (timeout, réseau) | — (TypeError) | `setElevationError` → ElevationPanel état erreur |
| HTTP 429 Rate Limit | 429 | `setElevationError("HTTP 429")` → état erreur |
| HTTP 500 serveur | 500 | `setElevationError("HTTP 500")` → état erreur |
| Status "INVALID_REQUEST" | 200 | `setElevationError(data.error)` → état erreur |
| Altitude null pour tous les points | 200 | Normalisé à 0, profil valide (canal en mer) |
| Altitude null pour certains points | 200 | Normalisé à 0, profil valide avec avertissement potentiel |

**Timeout recommandé:** `AbortController` avec 10s de timeout. Open Topo Data peut être lent sous charge.

**Pas de retry automatique:** Phase 2 n'implémente pas de retry — l'utilisateur peut re-sélectionner le canal pour réessayer. Le message d'erreur le dit explicitement : "cliquez sur le canal pour réessayer".

---

## Performance

### Timing estimé pour 100 points via Open Topo Data

| Opération | Durée estimée | Source |
|-----------|--------------|--------|
| `turf.length()` + 100x `turf.along()` | < 5ms | [ASSUMED] calcul JS in-browser trivial |
| POST Open Topo Data (100 points) | 300ms – 2000ms | [ASSUMED] basé sur API publique gratuite, latence variable |
| `detectUphillSegments()` | < 1ms | [ASSUMED] 99 comparaisons simples |
| Recharts render (100 points + N ReferenceArea) | < 50ms | [ASSUMED] SVG, pas de Canvas |

**Total attendu: 300ms – 2000ms** — entièrement dépendant du réseau vers l'API.

**Spinner obligatoire:** Hauteur fixe 160px pendant le chargement (identique à la hauteur finale du graphique) pour éviter le layout shift.

**`isAnimationActive={false}` sur tous les éléments Recharts:** Les animations de rendu SVG (défaut Recharts) créent une perception de lenteur sur un outil scientifique. Désactiver pour rendu immédiat.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | v24.13.1 | — |
| recharts | ElevationChart | ✗ (à installer) | 3.8.1 | — |
| @turf/turf | Sampling | ✗ (à installer) | 7.3.5 | — |
| Open Topo Data API (internet) | useElevation | ✓ (public) | — | Erreur explicite UI |
| maplibre-gl | canal-uphill layer | ✓ (installé) | 5.24.0 | — |
| zustand | store | ✓ (installé) | 5.0.12 | — |
| vitest | tests | ✓ (installé) | 3.2.1 | — |
| jsdom | tests DOM | ✓ (installé) | 26.1.0 | — |

**Missing dependencies with no fallback:**
- `recharts` et `@turf/turf` ne sont pas encore installés → Wave 0 doit inclure `npm install recharts @turf/turf`

**Missing dependencies with fallback:**
- Open Topo Data inaccessible → état erreur UI (prévu dans la spec)

---

## Validation Architecture

> `workflow.nyquist_validation` est `true` dans `.planning/config.json` — section obligatoire.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.1 |
| Config file | `vite.config.ts` (`test.environment: 'jsdom'`, `test.globals: true`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-03 | `samplePoints(coords, 100)` retourne exactement 100 points | unit | `npm test -- --reporter=verbose tests/samplePoints.test.ts` | ❌ Wave 0 |
| MAP-03 | `fetchElevations()` parse correctement la réponse Open Topo Data | unit (mock fetch) | `npm test -- --reporter=verbose tests/elevationApi.test.ts` | ❌ Wave 0 |
| MAP-03 | `buildProfile()` calcule correctement les distances (km) | unit | `npm test -- --reporter=verbose tests/elevationApi.test.ts` | ❌ Wave 0 |
| MAP-04 | `detectUphillSegments()` détecte 0 segments sur un profil monotone décroissant | unit | `npm test -- --reporter=verbose tests/uphill.test.ts` | ❌ Wave 0 |
| MAP-04 | `detectUphillSegments()` détecte les bons segments sur profil mixte | unit | `npm test -- --reporter=verbose tests/uphill.test.ts` | ❌ Wave 0 |
| MAP-04 | `detectUphillSegments()` : `isFullyGravity = true` si pas de montée | unit | `npm test -- --reporter=verbose tests/uphill.test.ts` | ❌ Wave 0 |
| MAP-03/04 | Inversion lat/lng : `samplePoints` retourne [lng,lat], API appelée avec `lat,lng` | unit | `npm test -- --reporter=verbose tests/elevationApi.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Par commit:** `npm test` (suite complète rapide, < 10s pour les tests unitaires purs)
- **Par wave merge:** `npm test` (suite complète)
- **Phase gate:** Suite complète verte avant `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/tests/samplePoints.test.ts` — couvre sampling Turf.js (100 points, distances)
- [ ] `src/tests/elevationApi.test.ts` — couvre fetch mock, parsing réponse, inversion lat/lng
- [ ] `src/tests/uphill.test.ts` — couvre détection segments uphill (cas nominaux + limites)
- [ ] `npm install recharts @turf/turf` — packages non encore installés

**Note:** MapLibre et Recharts ne sont pas testables unitairement dans jsdom (WebGL requis pour MapLibre, rendu SVG complexe pour Recharts). Les tests se concentrent sur la logique pure : sampling, fetch/parsing, algorithme uphill. L'intégration UI est validée manuellement au `/gsd-verify-work`.

---

## Security Domain

> `security_enforcement` non défini dans config.json → traité comme activé.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | API publique sans auth |
| V3 Session Management | no | Aucune session |
| V4 Access Control | no | Aucune ressource protégée |
| V5 Input Validation | yes (minimal) | Les altitudes API sont des nombres (ou null) — normaliser avant usage |
| V6 Cryptography | no | Pas de secrets, pas de données sensibles |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Réponse API malformée (injection via elevation string) | Tampering | Valider `typeof r.elevation === 'number' \|\| r.elevation === null` avant usage |
| Latitude/longitude saisie utilisateur dans l'URL API | Tampering | Les coords viennent de MapLibre (clics carte), pas d'input utilisateur libre — risque minimal |
| Exposition de données sensibles | Information Disclosure | Aucune donnée sensible — coordonnées géographiques de canaux fictifs |

**Conclusion sécurité:** Phase 2 n'introduit pas de risques de sécurité significatifs. L'API Open Topo Data est publique sans auth, les données sont géographiques non-sensibles, et les entrées utilisateur sont des clics sur carte (médiatisés par MapLibre).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | turf.along() < 5ms pour 100 appels | Performance | Spinning/lenteur si >100ms — peu probable |
| A2 | Recharts render SVG < 50ms pour 100 points | Performance | Lenteur perçue — peu probable pour 100 points |
| A3 | Open Topo Data `copernicus30m` couverture mondiale complète | Fetch | Altitudes null dans certaines zones (mer, régions isolées) — géré par normalisation à 0 |
| A4 | Recharts 3.x : `fillOpacity` prop sur ReferenceArea fonctionne identiquement à 2.x | Recharts | Graphique sans transparence rouge — vérifier après installation |

---

## Open Questions

1. **Segments uphill avec points intermédiaires pour le layer MapLibre**
   - What we know: La version simplifiée (LineString start→end) est correcte pour la plupart des cas
   - What's unclear: Pour des segments longs avec courbure, le segment rouge pourrait ne pas suivre exactement le tracé bleu
   - Recommendation: Implémenter la version simplifiée (start/end) en Phase 2. Si écart visuel notable, reconstruire depuis les points samplés en Phase 3 ou en correctif.

2. **Comportement Open Topo Data pour les zones côtières (début de canal en mer)**
   - What we know: L'API retourne `null` pour les zones sans donnée DEM
   - What's unclear: La limite exacte mer/terre dans Copernicus GLO-30
   - Recommendation: Normaliser `null → 0` systématiquement. Documenter dans le code.

---

## Sources

### Primary (HIGH confidence)
- [opentopodata.org](https://www.opentopodata.org/) — dataset `copernicus30m`, limites 100 locations/req, 1 req/s, 1000 req/jour, format pipe-separated
- [opentopodata.org/api/](https://www.opentopodata.org/api/) — format POST body, format réponse JSON (lat/lng, elevation, status)
- [turfjs.org/docs/api/along](https://turfjs.org/docs/api/along) — signature `along(line, distance, options)`, retour Feature<Point>
- [turfjs.org/docs/api/length](https://turfjs.org/docs/api/length) — signature `length(geojson, options)`, unités kilometers
- [recharts.github.io/en-US/api/ReferenceArea](https://recharts.github.io/en-US/api/ReferenceArea) — props x1, x2, fill, fillOpacity, strokeOpacity
- [maplibre.org/maplibre-gl-js/docs/API/classes/Map/](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) — getSource() retourne undefined si absent, pas de hasSource()
- npm registry — recharts 3.8.1 (2026-03-25), @turf/turf 7.3.5

### Secondary (MEDIUM confidence)
- [github.com/pmndrs/zustand discussions/1415](https://github.com/pmndrs/zustand/discussions/1415) — pattern async action dans store Zustand

### Tertiary (LOW confidence)
- Timings performance (< 5ms Turf, < 50ms Recharts) — estimations training knowledge, non mesurés

---

## Metadata

**Confidence breakdown:**
- Open Topo Data API: HIGH — endpoint, format, limites vérifiés sur opentopodata.org
- Recharts ReferenceArea: HIGH — props vérifiées sur recharts.github.io
- Turf.js sampling: HIGH — API vérifiée sur turfjs.org
- MapLibre dynamic layers: HIGH — pattern établi Phase 1, méthodes vérifiées
- Algorithme uphill: HIGH — logique triviale (comparaison paires)
- Performance: LOW — estimations non mesurées

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (APIs stables)

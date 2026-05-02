---
phase: 02-elevation-profil
reviewed: 2026-04-30T00:00:00Z
depth: quick
files_reviewed: 10
files_reviewed_list:
  - src/types/elevation.ts
  - src/types/canal.ts
  - src/store/canalStore.ts
  - src/services/elevationApi.ts
  - src/hooks/useElevation.ts
  - src/components/ElevationChart.tsx
  - src/components/ElevationPanel.tsx
  - src/components/CanalListItem.tsx
  - src/components/MapView.tsx
  - src/components/SidePanel.tsx
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 2 : Rapport de Revue de Code

**Reviewed:** 2026-04-30
**Depth:** quick
**Files Reviewed:** 10
**Status:** issues_found

## Résumé

Revue des 10 fichiers de la Phase 2 (élévation + profil altimétrique). Les scans automatiques (secrets, fonctions dangereuses, debug artifacts, empty catch) sont tous propres. Les problèmes identifiés sont issus de la lecture manuelle : un bug logique bloquant dans la détection des segments uphill, trois cas d'edge non gérés dans le service d'élévation, un problème de race condition dans le hook, et deux points de qualité mineurs.

---

## Critical Issues

### CR-01: Bug logique — `altitudeGain` peut être négatif ou nul dans `detectUphillSegments`

**File:** `src/services/elevationApi.ts:75`
**Issue:** Quand un segment montant se termine, `altitudeGain` est calculé comme `points[i-1].altitude - segStartAlt`. Or `points[i-1]` est le **dernier point encore en montée**, mais la condition `!isUphill` signifie que `points[i]` est déjà en descente — donc `points[i-1]` est bien le sommet. Jusque-là correct. Le problème survient quand le profil monte puis redescend à l'altitude de départ avant de remonter : plusieurs micro-segments peuvent être fusionnés incorrectement parce que la variable `segStartAlt` est réinitialisée à `null` mais **le segment précédent a pu être émis avec un `altitudeGain` de 0** si `points[i-1].altitude === segStartAlt` (plateau exact). Le type déclare `altitudeGain: number // toujours > 0` mais rien dans le code n'empêche un gain nul ou même négatif si les altitudes sont identiques au point de départ et d'arrivée du segment.

Plus grave : si l'API renvoie une séquence avec des valeurs nulles normalisées à 0 (hors-couverture DEM), un segment peut démarrer à altitude 5 m, passer par une zone 0 m (mer/hors-couverture), puis remonter à 5 m. Le code émettra un segment avec `altitudeGain = 0 - 5 = -5 m`, ce qui viole l'invariant du type et fausse `totalUphillGain`.

**Fix:**
```typescript
// Après le calcul de altitudeGain, filtrer les gains nuls/négatifs
const gain = points[i - 1].altitude - (segStartAlt ?? 0)
if (gain > 0) {
  segments.push({
    distanceStart: segStart,
    distanceEnd: points[i - 1].distance,
    altitudeGain: gain,
  })
}
// Idem pour le segment fermé en fin de boucle (ligne 85-90)
```

---

## Warnings

### WR-01: Race condition — `setElevationLoading(false)` dans `finally` après annulation

**File:** `src/hooks/useElevation.ts:40-41`
**Issue:** Le bloc `finally` contient `if (!cancelled) setElevationLoading(selectedCanalId, false)`. Cependant, si le composant se démonte alors que le fetch est en cours et que le canal est entre-temps supprimé du store, `setElevationLoading` sera appelé sur un `id` qui n'existe plus. Ce n'est pas un crash (le `map()` du store retourne simplement le tableau inchangé), mais c'est un état fantôme silencieux. Le vrai problème est que si `cancelled = true` est positionné **après** la résolution de la promise (race improbable mais possible avec microtasks), le `setElevationLoading(false)` dans `finally` ne s'exécute pas, laissant `elevationLoading: true` indéfiniment sur le canal.

Le flag `cancelled` est défini dans le cleanup, qui s'exécute de manière synchrone. La promise `run()` est asynchrone. Il n'y a pas de garantie que `cancelled = true` soit visible avant que le `finally` s'exécute si le fetch se termine exactement au moment du cleanup. En pratique sur JS monothreadé ce n'est pas un vrai race, mais le `clearTimeout(timeoutId)` est appelé deux fois (une dans `finally`, une dans le cleanup) ce qui est bénin mais inutile.

**Fix:**
```typescript
// Supprimer clearTimeout du cleanup — il est déjà dans finally
return () => {
  cancelled = true
  controller.abort()
  // clearTimeout géré dans finally
}
```

### WR-02: `samplePoints` retourne un tableau court si `points.length === 1`

**File:** `src/services/elevationApi.ts:11`
**Issue:** La garde `if (points.length < 2) return points as Coord[]` retourne le tableau d'entrée tel quel — potentiellement 1 seul point — au lieu des `n=100` points attendus. L'appelant `buildProfile` reçoit alors un tableau de 1 élément et appelle `lineString([singlePoint])` qui lève une erreur Turf (`lineString requires at least 2 coordinates`). Le store garantit `points.length >= 2` via la garde `finalizeCanal`, mais cette fonction est exportée publiquement et rien ne l'empêche d'être appelée ailleurs avec un seul point.

**Fix:**
```typescript
export function samplePoints(points: Coord[], n = 100): Coord[] {
  if (points.length < 2) throw new Error('samplePoints: au moins 2 points requis')
  // ...
}
```

### WR-03: `syncUphillLayer` produit des segments uphill à 2 points seulement

**File:** `src/components/MapView.tsx:177-186`
**Issue:** Pour chaque `UphillSegment`, la fonction crée un `LineString` avec exactement 2 coordonnées (le point de départ et le point de fin du segment). Cette représentation ne suit pas la courbure réelle du canal — elle trace une ligne droite entre les deux extrémités, qui peut passer à travers des montagnes ou des mers. Pour un outil scientifique affirmant "contrainte gravitaire obligatoire", les segments rouges sur la carte doivent suivre la géométrie réelle du tracé, pas une corde entre deux points distants potentiellement de dizaines de kilomètres.

**Fix:** Extraire les coordonnées intermédiaires du canal entre `distanceStart` et `distanceEnd` en utilisant `turf/line-slice` plutôt que seulement les deux points extrêmes :
```typescript
import { lineSliceAlong } from '@turf/turf'
// ...
const sliced = lineSliceAlong(line, seg.distanceStart, seg.distanceEnd, { units: 'kilometers' })
return {
  type: 'Feature' as const,
  properties: {},
  geometry: sliced.geometry,
}
```

### WR-04: Inconsistance entre le texte d'erreur UI et l'API réellement utilisée

**File:** `src/components/ElevationPanel.tsx:78`
**Issue:** Le message d'erreur affiché est *"Open Topo Data inaccessible"*, mais le service utilise **Open-Meteo** (voir commentaire ligne 27 de `elevationApi.ts` : "Open Topo Data n'envoie pas Access-Control-Allow-Origin → bloqué"). L'utilisateur qui cherche à diagnostiquer une erreur réseau sera induit en erreur en vérifiant le mauvais service.

**Fix:**
```tsx
<p className="text-xs text-gray-400 mt-1 leading-relaxed">
  Open-Meteo inaccessible. Vérifiez votre connexion et cliquez sur le canal pour réessayer.
</p>
```

---

## Info

### IN-01: Vérification défensive asymétrique pour `canal-uphill-source`

**File:** `src/components/MapView.tsx:71`
**Issue:** La source `canal-uphill-source` est créée avec un `if (!map.getSource(...))` défensif, alors que les 4 autres sources (`canals`, `draft`, `preview`, `markers`) sont créées sans garde. Le commentaire explique "évite l'erreur double-mount React StrictMode", mais si StrictMode peut déclencher un double-mount, il le fera pour toutes les sources. L'asymétrie indique soit que les 4 autres sources ont un bug latent en StrictMode, soit que la garde sur `canal-uphill-source` est superflue.

**Fix:** Supprimer la garde sur `canal-uphill-source` (le `useEffect` avec `mapRef.current` guard suffit), ou ajouter la même garde sur toutes les sources pour la cohérence.

### IN-02: `useMapInteraction` appelé avec `mapRef.current` potentiellement `null`

**File:** `src/components/MapView.tsx:236`
**Issue:** `useMapInteraction(mapRef.current)` est appelé directement dans le corps du composant, à chaque render. Au premier render, `mapRef.current` est `null` (la carte n'est pas encore initialisée). Le hook reçoit donc `null` à chaque render jusqu'au premier `load`. Ce pattern fonctionne si `useMapInteraction` gère le cas `null`, mais c'est une dépendance implicite non documentée. Par ailleurs, quand la carte sera initialisée et que `mapRef.current` changera de valeur, React ne re-rendra pas le composant (les refs ne déclenchent pas de render), donc `useMapInteraction` continuera à recevoir `null` — sauf si un autre state change provoque un re-render.

**Fix:** Utiliser un state pour signaler que la carte est prête, ou passer `mapRef` (pas `mapRef.current`) au hook :
```tsx
useMapInteraction(mapRef)  // Le hook lit mapRef.current en interne
```

---

_Reviewed: 2026-04-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_

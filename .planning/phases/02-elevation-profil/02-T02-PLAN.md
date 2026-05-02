---
phase: 02-elevation-profil
plan: T02
type: execute
wave: 1
depends_on:
  - T01
files_modified:
  - src/services/elevationApi.ts
  - src/hooks/useElevation.ts
  - src/tests/samplePoints.test.ts
  - src/tests/elevationApi.test.ts
autonomous: true
requirements:
  - MAP-03
  - MAP-04

must_haves:
  truths:
    - "samplePoints(points, 100) retourne exactement 100 coordonnées [lng,lat]"
    - "fetchElevations envoie les coords au format 'lat,lng|lat,lng' (inversion obligatoire)"
    - "buildProfile construit un ElevationProfile avec uphillSegments corrects"
    - "useElevation déclenche le fetch automatiquement au selectCanal() et ne re-fetche pas si cache présent"
    - "Le flag cancelled prévient les race conditions sur les sélections rapides de canaux"
    - "detectUphillSegments passe tous les tests unitaires en GREEN"
  artifacts:
    - path: "src/services/elevationApi.ts"
      provides: "samplePoints, fetchElevations, detectUphillSegments, buildProfile"
      exports: ["samplePoints", "fetchElevations", "detectUphillSegments", "buildProfile"]
    - path: "src/hooks/useElevation.ts"
      provides: "Hook d'orchestration fetch + store"
      exports: ["useElevation"]
  key_links:
    - from: "src/hooks/useElevation.ts"
      to: "src/store/canalStore.ts"
      via: "useCanalStore(s => s.setElevation)"
      pattern: "setElevation|setElevationLoading|setElevationError"
    - from: "src/services/elevationApi.ts"
      to: "https://api.opentopodata.org/v1/copernicus30m"
      via: "fetch POST"
      pattern: "opentopodata.org"
---

<objective>
Implémenter le service d'élévation (sampling Turf, fetch Open Topo Data, algorithme uphill) et le hook React d'orchestration. Ce plan produit toute la logique métier — les composants UI de T03 consomment ces fonctions.

Purpose: Séparer la logique pure (testable) des composants React (non-testables en jsdom), conformément au plan de validation Wave 0.
Output: src/services/elevationApi.ts (4 fonctions exportées), src/hooks/useElevation.ts, tests Wave 0 complétés en GREEN.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-CONTEXT.md
@C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-VALIDATION.md

<interfaces>
<!-- Contrats issus de T01 — le service et le hook s'appuient dessus -->

From src/types/elevation.ts (créé T01):
```typescript
export interface ElevationPoint {
  distance: number  // km depuis le début du tracé
  altitude: number  // mètres Copernicus GLO-30 (null normalisé à 0)
}
export interface UphillSegment {
  distanceStart: number  // km
  distanceEnd:   number  // km
  altitudeGain:  number  // m (toujours > 0)
}
export interface ElevationProfile {
  points:          ElevationPoint[]
  uphillSegments:  UphillSegment[]
  totalUphillGain: number
  isFullyGravity:  boolean
  fetchedAt:       number
}
```

From src/types/canal.ts (étendu T01):
```typescript
export type Coord = [number, number]  // [lng, lat] — convention stricte
export interface Canal {
  id: string
  points: Coord[]
  name: string
  createdAt: number
  elevation?: ElevationProfile
  elevationLoading?: boolean
  elevationError?: string
}
```

From src/store/canalStore.ts (étendu T01 — actions disponibles):
```typescript
selectedCanalId: string | null
canals: Canal[]
setElevation: (id: string, profile: ElevationProfile) => void
setElevationLoading: (id: string, loading: boolean) => void
setElevationError: (id: string, error: string) => void
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Créer src/services/elevationApi.ts + compléter les tests</name>
  <read_first>
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md — Pattern 1 (fetch POST), Pattern 2 (sampling Turf), Pattern 3 (algorithme uphill), section "Common Pitfalls" (Pitfall 1 inversion lat/lng, Pitfall 2 null altitude)
    - C:/dev/gsd/science/canal/src/tests/uphill.test.ts — tests RED créés en T01 (doivent passer GREEN)
    - C:/dev/gsd/science/canal/src/tests/samplePoints.test.ts — stubs à compléter
    - C:/dev/gsd/science/canal/src/tests/elevationApi.test.ts — stubs à compléter
    - C:/dev/gsd/science/canal/src/types/elevation.ts — interfaces à utiliser (créées T01)
    - C:/dev/gsd/science/canal/src/types/canal.ts — type Coord = [lng, lat]
  </read_first>
  <files>src/services/elevationApi.ts, src/tests/samplePoints.test.ts, src/tests/elevationApi.test.ts</files>
  <behavior>
    samplePoints(points, 100):
    - Retourne exactement n=100 coordonnées
    - Chaque coordonnée est au format [lng, lat] (GeoJSON standard, pas [lat, lng])
    - Premier point = début du tracé, dernier point = fin du tracé

    fetchElevations(coords):
    - Construit "lat,lng|lat,lng" (INVERSION : coords[i] = [lng,lat] → "lat,lng")
    - POST vers https://api.opentopodata.org/v1/copernicus30m
    - r.elevation === null normalisé à 0
    - Lance Error si response.ok === false
    - Lance Error si data.status !== "OK"

    detectUphillSegments(points) — doit passer les tests existants T01 :
    - altitude[i+1] > altitude[i] = uphill
    - Segments consécutifs groupés en zones continues
    - Segment ouvert en fin de tableau fermé avec le dernier point

    buildProfile(sampledCoords, altitudes, originalPoints):
    - Construit ElevationProfile.points avec distance en km (turf.length depuis début)
    - Calcule uphillSegments, totalUphillGain, isFullyGravity, fetchedAt
  </behavior>
  <action>
Créer src/services/elevationApi.ts avec exactement ce contenu :

```typescript
// src/services/elevationApi.ts
// Logique d'élévation Phase 2 : sampling, fetch Open Topo Data, détection uphill
// CONVENTION : Coord = [lng, lat] (GeoJSON) — inversion obligatoire vers lat,lng pour l'API
import { along, length, lineString } from '@turf/turf'
import type { Coord } from '../types/canal'
import type { ElevationPoint, ElevationProfile, UphillSegment } from '../types/elevation'

// ── 1. Sampling : 100 points interpolés sur le tracé ─────────────────────────

export function samplePoints(points: Coord[], n = 100): Coord[] {
  if (points.length < 2) return points as Coord[]
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

// ── 2. Fetch Open Topo Data (POST, 100 points max, 1 req/s) ──────────────────

export async function fetchElevations(
  coords: Coord[],
  signal?: AbortSignal,
): Promise<number[]> {
  // INVERSION OBLIGATOIRE : Turf = [lng, lat], API attend lat,lng
  const locations = coords
    .map(([lng, lat]) => `${lat},${lng}`)
    .join('|')

  const response = await fetch('https://api.opentopodata.org/v1/copernicus30m', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Open Topo Data HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK') {
    throw new Error(`Open Topo Data status: ${data.status}`)
  }

  // null = hors-couverture DEM (mer, région isolée) → normalisé à 0
  return data.results.map((r: { elevation: number | null }) => r.elevation ?? 0)
}

// ── 3. Détection des segments en montée ──────────────────────────────────────

export function detectUphillSegments(points: ElevationPoint[]): UphillSegment[] {
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

  // Fermer un segment éventuellement ouvert à la fin
  if (segStart !== null && points.length > 0) {
    const last = points[points.length - 1]
    segments.push({
      distanceStart: segStart,
      distanceEnd: last.distance,
      altitudeGain: last.altitude - (segStartAlt ?? 0),
    })
  }

  return segments
}

// ── 4. Construction du profil complet ────────────────────────────────────────

export function buildProfile(
  sampledCoords: Coord[],
  altitudes: number[],
): ElevationProfile {
  const line = lineString(sampledCoords)
  const totalKm = length(line, { units: 'kilometers' })
  const n = sampledCoords.length

  // Construire les ElevationPoint avec distances cumulées
  const points: ElevationPoint[] = sampledCoords.map((_, i) => ({
    distance: n > 1 ? (i / (n - 1)) * totalKm : 0,
    altitude: altitudes[i] ?? 0,
  }))

  const uphillSegments = detectUphillSegments(points)
  const totalUphillGain = uphillSegments.reduce((sum, s) => sum + s.altitudeGain, 0)

  return {
    points,
    uphillSegments,
    totalUphillGain,
    isFullyGravity: uphillSegments.length === 0,
    fetchedAt: Date.now(),
  }
}
```

Après avoir créé elevationApi.ts, compléter src/tests/samplePoints.test.ts :
```typescript
// src/tests/samplePoints.test.ts
import { describe, it, expect } from 'vitest'
import { samplePoints } from '../services/elevationApi'
import type { Coord } from '../types/canal'

describe('samplePoints', () => {
  const traceStraight: Coord[] = [
    [2.3, 48.8],   // Paris [lng, lat]
    [5.4, 43.3],   // Marseille [lng, lat]
  ]

  it('retourne exactement n points pour un tracé valide', () => {
    const result = samplePoints(traceStraight, 100)
    expect(result).toHaveLength(100)
  })

  it('retourne exactement n=50 points si demandé', () => {
    const result = samplePoints(traceStraight, 50)
    expect(result).toHaveLength(50)
  })

  it('retourne des coordonnées au format [lng, lat] (premier élément = longitude)', () => {
    const result = samplePoints(traceStraight, 100)
    // Convention projet : [lng, lat] — longitude = premier élément (entre -180 et 180)
    // Le tracé Paris-Marseille a des longitudes entre 2 et 5.4
    const firstPoint = result[0]
    expect(firstPoint[0]).toBeGreaterThan(-180)
    expect(firstPoint[0]).toBeLessThan(180)
    // La longitude du premier point doit être proche de Paris (2.3)
    expect(Math.abs(firstPoint[0] - 2.3)).toBeLessThan(0.1)
  })

  it('inclut un point proche du départ et de l\'arrivée', () => {
    const result = samplePoints(traceStraight, 100)
    const first = result[0]
    const last = result[result.length - 1]
    expect(Math.abs(first[0] - 2.3)).toBeLessThan(0.1)
    expect(Math.abs(last[0] - 5.4)).toBeLessThan(0.1)
  })
})
```

Compléter src/tests/elevationApi.test.ts :
```typescript
// src/tests/elevationApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchElevations, buildProfile } from '../services/elevationApi'
import type { Coord } from '../types/canal'

describe('fetchElevations', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('appelle l\'API avec "lat,lng|lat,lng" (inversion depuis [lng,lat])', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        results: [
          { elevation: 100, location: { lat: 48.8, lng: 2.3 } },
          { elevation: 200, location: { lat: 43.3, lng: 5.4 } },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const coords: Coord[] = [[2.3, 48.8], [5.4, 43.3]]  // [lng, lat]
    await fetchElevations(coords)

    expect(mockFetch).toHaveBeenCalledOnce()
    const callArgs = mockFetch.mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    // L'API doit recevoir "lat,lng" — l'inversion est obligatoire
    expect(body.locations).toBe('48.8,2.3|43.3,5.4')
  })

  it('normalise null à 0 pour les zones hors-couverture DEM', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        results: [
          { elevation: null, location: { lat: 0, lng: 0 } },
          { elevation: 50, location: { lat: 1, lng: 1 } },
        ],
      }),
    }))

    const coords: Coord[] = [[0, 0], [1, 1]]
    const result = await fetchElevations(coords)
    expect(result[0]).toBe(0)  // null → 0
    expect(result[1]).toBe(50)
  })

  it('lance une erreur si la réponse HTTP est non-OK (429)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    }))

    await expect(fetchElevations([[2.3, 48.8]])).rejects.toThrow('HTTP 429')
  })

  it('lance une erreur si data.status !== "OK"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'INVALID_REQUEST', error: 'Bad request' }),
    }))

    await expect(fetchElevations([[2.3, 48.8]])).rejects.toThrow('Open Topo Data status')
  })
})

describe('buildProfile', () => {
  it('construit ElevationProfile avec isFullyGravity = true si pas de montées', () => {
    const coords: Coord[] = [[2.3, 48.8], [5.4, 43.3]]
    const altitudes = [100, 50]  // décroissant = gravitaire
    const profile = buildProfile(coords, altitudes)
    expect(profile.isFullyGravity).toBe(true)
    expect(profile.uphillSegments).toHaveLength(0)
    expect(profile.totalUphillGain).toBe(0)
    expect(profile.points).toHaveLength(2)
  })

  it('calcule les distances en km (croissantes)', () => {
    const coords: Coord[] = [[2.3, 48.8], [5.4, 43.3]]
    const altitudes = [100, 50]
    const profile = buildProfile(coords, altitudes)
    expect(profile.points[0].distance).toBe(0)
    expect(profile.points[profile.points.length - 1].distance).toBeGreaterThan(0)
  })
})
```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npm test -- --reporter=verbose src/tests/uphill.test.ts src/tests/samplePoints.test.ts src/tests/elevationApi.test.ts 2>&1 | tail -30</automated>
  </verify>
  <acceptance_criteria>
    - src/services/elevationApi.ts existe et exporte samplePoints, fetchElevations, detectUphillSegments, buildProfile
    - grep "opentopodata.org/v1/copernicus30m" src/services/elevationApi.ts → présent
    - grep "lat.*lng.*join.*'|'" src/services/elevationApi.ts — la string de locations utilise le pipe comme séparateur
    - Les coords sont inversées : grep "map.*\(\[lng.*lat\]\)" src/services/elevationApi.ts → présent
    - grep "elevation ?? 0" src/services/elevationApi.ts → normalisation null présente
    - npm test uphill.test.ts → 5 tests GREEN (pas de RED ni de SKIP)
    - npm test samplePoints.test.ts → tests passent
    - npm test elevationApi.test.ts → tests passent
  </acceptance_criteria>
  <done>elevationApi.ts implémenté avec 4 fonctions, tous les tests Wave 0 passent en GREEN.</done>
</task>

<task type="auto">
  <name>Task 2: Créer src/hooks/useElevation.ts</name>
  <read_first>
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md — Pattern 6 (hook useElevation, flag cancelled, useEffect cleanup)
    - C:/dev/gsd/science/canal/src/services/elevationApi.ts — fonctions disponibles (créées en Task 1)
    - C:/dev/gsd/science/canal/src/store/canalStore.ts — selectedCanalId, canals, setElevation, setElevationLoading, setElevationError
    - C:/dev/gsd/science/canal/.planning/phases/02-elevation-profil/02-RESEARCH.md — Common Pitfalls #3 (race condition), #6 (rate limit + cache)
  </read_first>
  <files>src/hooks/useElevation.ts</files>
  <action>
Créer src/hooks/useElevation.ts avec exactement ce contenu :

```typescript
// src/hooks/useElevation.ts
// Orchestrateur : sélection canal → fetch élévation → mise à jour store
// Prévient les race conditions via flag `cancelled` dans le cleanup useEffect
import { useEffect } from 'react'
import { useCanalStore } from '../store/canalStore'
import { samplePoints, fetchElevations, buildProfile } from '../services/elevationApi'

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
    if (canal.elevation) return  // Cache mémoire — évite le re-fetch et respecte le rate limit 1 req/s

    // AbortController pour timeout 10s + annulation si le canal change pendant le fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    let cancelled = false

    const run = async () => {
      setElevationLoading(selectedCanalId, true)
      try {
        const sampledCoords = samplePoints(canal.points, 100)
        const altitudes = await fetchElevations(sampledCoords, controller.signal)
        if (cancelled) return
        const profile = buildProfile(sampledCoords, altitudes)
        setElevation(selectedCanalId, profile)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        setElevationError(selectedCanalId, message)
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) setElevationLoading(selectedCanalId, false)
      }
    }

    run()

    // Cleanup : annule le fetch si selectedCanalId change avant la fin (race condition)
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [selectedCanalId, canals, setElevation, setElevationLoading, setElevationError])
}
```
  </action>
  <verify>
    <automated>cd C:/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - src/hooks/useElevation.ts existe
    - grep "cancelled = true" src/hooks/useElevation.ts → flag race condition présent
    - grep "controller.abort()" src/hooks/useElevation.ts → AbortController utilisé
    - grep "canal.elevation" src/hooks/useElevation.ts → vérification cache présente
    - grep "samplePoints.*100" src/hooks/useElevation.ts → 100 points passés en argument
    - grep "AbortController" src/hooks/useElevation.ts → timeout 10s présent
    - npx tsc --noEmit ne signale PAS d'erreur TypeScript dans useElevation.ts
    - npm test passe toujours (aucun test cassé par ce fichier)
  </acceptance_criteria>
  <done>useElevation.ts créé avec gestion correcte du cache, des race conditions (flag cancelled + AbortController), et du timeout 10s. TypeScript compile sans erreur.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → api.opentopodata.org | Requête POST vers API publique externe — réponse non contrôlée |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-03 | Tampering | fetchElevations — réponse API | mitigate | Valider `r.elevation === null` (typeof number ou null) avant usage — normalisé à 0. Vérifier `data.status === 'OK'` avant de parser les résultats. |
| T-02-04 | Denial of Service | useElevation — rate limit API | mitigate | Cache mémoire Zustand (`if (canal.elevation) return`) évite les requêtes répétées. AbortController timeout 10s évite les connexions suspendues. |
| T-02-05 | Information Disclosure | coords envoyées à l'API | accept | Les coordonnées sont des tracés de canaux fictifs/géographiques — aucune donnée personnelle. L'API opentopodata.org est publique et ne requiert pas d'auth. |
</threat_model>

<verification>
```bash
cd C:/dev/gsd/science/canal
# Tests unitaires Wave 0
npm test -- --reporter=verbose src/tests/uphill.test.ts src/tests/samplePoints.test.ts src/tests/elevationApi.test.ts
# TypeScript check
npx tsc --noEmit
# Exports vérifiés
grep -n "^export" src/services/elevationApi.ts
grep -n "^export" src/hooks/useElevation.ts
```
</verification>

<success_criteria>
- src/services/elevationApi.ts exporte samplePoints, fetchElevations, detectUphillSegments, buildProfile
- src/hooks/useElevation.ts exporte useElevation
- Tous les tests Wave 0 passent en GREEN (uphill.test.ts + samplePoints.test.ts + elevationApi.test.ts)
- npx tsc --noEmit sans erreur
- La logique de cache mémoire (canal.elevation existant = skip fetch) est implémentée
- Le flag cancelled + AbortController prévient les race conditions
</success_criteria>

<output>
After completion, create `.planning/phases/02-elevation-profil/02-T02-SUMMARY.md`
</output>

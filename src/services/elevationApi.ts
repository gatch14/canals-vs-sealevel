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

// ── 2. Fetch Open-Meteo Elevation API (GET, CORS activé, gratuit, sans auth) ──
// Open Topo Data n'envoie pas Access-Control-Allow-Origin → bloqué par le navigateur.
// Open-Meteo supporte CORS, fournit les mêmes données Copernicus DEM, max 1000 coords/req.

export async function fetchElevations(
  coords: Coord[],
  signal?: AbortSignal,
): Promise<number[]> {
  // INVERSION : coords = [lng, lat], Open-Meteo attend latitude et longitude séparés
  const latitudes  = coords.map(([, lat]) => lat).join(',')
  const longitudes = coords.map(([lng]) => lng).join(',')

  const url = `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`

  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Open Meteo HTTP ${response.status}`)
  }

  const data = await response.json()

  if (!Array.isArray(data.elevation)) {
    throw new Error(`Open Meteo: réponse invalide`)
  }

  // null = hors-couverture → normalisé à 0
  return (data.elevation as (number | null)[]).map((v) => v ?? 0)
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

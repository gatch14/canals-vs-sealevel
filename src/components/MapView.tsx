// src/components/MapView.tsx
// Conteneur MapLibre GL — init carte, 4 sources GeoJSON, syncLayers via setData()
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { along, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import { useMapInteraction } from '../hooks/useMapInteraction'
import { useCalculation } from '../hooks/useCalculation'
import type { Canal, Coord } from '../types/canal'
import type { ElevationProfile } from '../types/elevation'

// ─── Sources GeoJSON + layers (appelé une seule fois au 'load') ──────────────

function initSources(map: maplibregl.Map) {
  const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

  // Canaux finalisés
  map.addSource('canals', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'canals-line',
    type: 'line',
    source: 'canals',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3B82F6', 'line-width': 3 },
  })

  // Ligne draft (tracé en cours)
  map.addSource('draft', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'draft-line',
    type: 'line',
    source: 'draft',
    paint: {
      'line-color': '#06B6D4',
      'line-width': 3,
      'line-dasharray': [4, 4],
    },
  })

  // Ligne preview (dernier point → curseur)
  map.addSource('preview', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'preview-line',
    type: 'line',
    source: 'preview',
    paint: {
      'line-color': '#06B6D4',
      'line-width': 2,
      'line-opacity': 0.6,
      'line-dasharray': [2, 4],
    },
  })

  // Marqueurs début/fin
  map.addSource('markers', { type: 'geojson', data: emptyFC })
  map.addLayer({
    id: 'markers-circle',
    type: 'circle',
    source: 'markers',
    paint: {
      'circle-radius': 6,
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })

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
}

// ─── Synchronisation store → sources (via setData, jamais addLayer en boucle) ─

function syncLayers(
  map: maplibregl.Map,
  canals: Canal[],
  draftPoints: Coord[],
  previewCoord: Coord | null,
) {
  // Canaux finalisés → LineString par canal
  const canalsFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: canals.map((canal) => ({
      type: 'Feature',
      id: canal.id,
      properties: { name: canal.name },
      geometry: { type: 'LineString', coordinates: canal.points },
    })),
  }
  ;(map.getSource('canals') as GeoJSONSource)?.setData(canalsFC)

  // Marqueurs début (vert) + fin (rouge)
  const markersFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: canals.flatMap((canal) => [
      {
        type: 'Feature' as const,
        properties: { color: '#22C55E', canalId: canal.id },
        geometry: { type: 'Point' as const, coordinates: canal.points[0] },
      },
      {
        type: 'Feature' as const,
        properties: { color: '#EF4444', canalId: canal.id },
        geometry: {
          type: 'Point' as const,
          coordinates: canal.points[canal.points.length - 1],
        },
      },
    ]),
  }
  ;(map.getSource('markers') as GeoJSONSource)?.setData(markersFC)

  // Ligne draft (points posés pendant le tracé)
  const draftFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features:
      draftPoints.length >= 2
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: draftPoints },
            },
          ]
        : [],
  }
  ;(map.getSource('draft') as GeoJSONSource)?.setData(draftFC)

  // Ligne preview (dernier point → curseur)
  const lastPoint = draftPoints[draftPoints.length - 1]
  const previewFC: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features:
      lastPoint && previewCoord
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [lastPoint, previewCoord],
              },
            },
          ]
        : [],
  }
  ;(map.getSource('preview') as GeoJSONSource)?.setData(previewFC)
}

// ─── Synchronisation store → layer uphill (canal sélectionné uniquement) ──────

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

// ─── Composant MapView ────────────────────────────────────────────────────────

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  // Refs marqueurs temporaires routing (objets non-sérialisables — jamais dans Zustand)
  const startMarkerRef = useRef<maplibregl.Marker | null>(null)
  const endMarkerRef   = useRef<maplibregl.Marker | null>(null)
  // Marker point d'arrêt impact partiel — Phase 4 (Pitfall 3 : cleanup obligatoire)
  const stopMarkerRef  = useRef<maplibregl.Marker | null>(null)

  // Init MapLibre — une seule fois (guard anti-double-mount React StrictMode — Pitfall 4)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#1a1a2e' } },
          { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.8 } },
        ],
      },
      center: [20, 20],
      zoom: 2,
    })
    mapRef.current = map

    map.on('load', () => {
      initSources(map)
    })

    // Cleanup obligatoire — libère le contexte WebGL (Pitfall 2 : fuite mémoire)
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // dépendances vides — init unique

  // Connecter les event handlers selon le mode courant (drawing + selection)
  useMapInteraction(mapRef.current)

  // Mode routing — cursor, handlers clics, cleanup marqueurs (STRIDE T-03-T03-03)
  const mode = useCanalStore((s) => s.mode)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (mode === 'routing') {
      map.getCanvas().style.cursor = 'crosshair'

      const handleRoutingClick = (e: maplibregl.MapMouseEvent) => {
        // getState() dans handler DOM — anti-stale-closure (PATTERNS.md Phase 1/2)
        const { routingStart: rStart, routingEnd: rEnd } = useCanalStore.getState()

        if (!rStart) {
          // Clic 1 : point de départ (vert #22C55E)
          startMarkerRef.current?.remove()
          startMarkerRef.current = new maplibregl.Marker({ color: '#22C55E' })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .addTo(map)
          useCanalStore.getState().setRoutingStart([e.lngLat.lng, e.lngLat.lat])
        } else if (!rEnd) {
          // Clic 2 : point d'arrivée (rouge #EF4444) → déclenche le calcul
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
        // Cleanup obligatoire des marqueurs au changement de mode (STRIDE T-03-T03-03)
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
  }, [mode]) // re-exécuté à chaque changement de mode

  // Synchroniser les layers GeoJSON avec le store
  const canals = useCanalStore((s) => s.canals)
  const draftPoints = useCanalStore((s) => s.draftPoints)
  const previewCoord = useCanalStore((s) => s.previewCoord)
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    syncLayers(map, canals, draftPoints, previewCoord)
  }, [canals, draftPoints, previewCoord])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
    syncUphillLayer(map, selectedCanal?.elevation ?? null, selectedCanal?.points ?? [])
  }, [canals, selectedCanalId])

  // ── Marker amber au stopCoord du PartialImpactResult — Phase 4 CALC-05 ──
  const { partial } = useCalculation()

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    // Cleanup systématique du marker précédent
    stopMarkerRef.current?.remove()
    stopMarkerRef.current = null

    if (!partial) return

    const [lng, lat] = partial.stopCoord
    stopMarkerRef.current = new maplibregl.Marker({
      color: '#F59E0B',  // amber — distingué de start (#22C55E vert) et end (#EF4444 rouge)
      scale: 0.8,
    })
      .setLngLat([lng, lat])
      .addTo(map)

    // Cleanup au unmount ou quand selectedCanal/partial change (Pitfall 3)
    return () => {
      stopMarkerRef.current?.remove()
      stopMarkerRef.current = null
    }
  }, [partial?.stopCoord[0], partial?.stopCoord[1]])

  return <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

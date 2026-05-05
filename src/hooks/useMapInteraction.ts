// src/hooks/useMapInteraction.ts
// Binding events MapLibre selon le mode actif (drawing / selection)
import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { useCanalStore } from '../store/canalStore'

export function useMapInteraction(map: maplibregl.Map | null) {
  // Sélecteurs granulaires — re-render uniquement si la valeur change
  const mode = useCanalStore((s) => s.mode)
  const addWaypoint = useCanalStore((s) => s.addWaypoint)
  const updatePreview = useCanalStore((s) => s.updatePreview)
  const finalizeCanal = useCanalStore((s) => s.finalizeCanal)
  const selectCanal = useCanalStore((s) => s.selectCanal)

  useEffect(() => {
    if (!map) return

    // ── Mode TRACÉ ────────────────────────────────────────────────────────────
    if (mode === 'drawing') {
      // CRITIQUE : désactiver le zoom double-clic — sinon dblclick = zoom parasite
      // + 2 waypoints posés + finalisation simultanée (Pitfall 1)
      map.doubleClickZoom.disable()
      map.getCanvas().style.cursor = 'crosshair'

      const handleClick = (e: maplibregl.MapMouseEvent) => {
        addWaypoint([e.lngLat.lng, e.lngLat.lat])
      }

      const handleDblClick = (e: maplibregl.MapMouseEvent) => {
        e.preventDefault()
        finalizeCanal()
      }

      const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
        updatePreview([e.lngLat.lng, e.lngLat.lat])
      }

      // getState() dans un handler DOM natif — hors cycle React, évite stale closure (Pitfall 3)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') useCanalStore.getState().cancelDrawing()
      }

      map.on('click', handleClick)
      map.on('dblclick', handleDblClick)
      map.on('mousemove', handleMouseMove)
      window.addEventListener('keydown', handleKeyDown)

      return () => {
        map.off('click', handleClick)
        map.off('dblclick', handleDblClick)
        map.off('mousemove', handleMouseMove)
        window.removeEventListener('keydown', handleKeyDown)
        // Rétablir le zoom double-clic et le curseur par défaut
        map.doubleClickZoom.enable()
        map.getCanvas().style.cursor = ''
      }
    }

    // ── Mode ROUTING ──────────────────────────────────────────────────────────
    // Les handlers routing sont gérés dans MapView.tsx (clicks start/end).
    // Ce hook ne les enregistre pas — pas de cleanup nécessaire ici.
    // Si des handlers routing sont ajoutés ici à l'avenir, penser à les nettoyer.
    if (mode === 'routing') return

    // ── Mode SÉLECTION ────────────────────────────────────────────────────────
    if (mode === 'selection') {
      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty('canals-line', 'line-width', 5)
      }

      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty('canals-line', 'line-width', 3)
      }

      const handleClickCanal = (e: maplibregl.MapLayerMouseEvent) => {
        if (e.features?.[0]) selectCanal(e.features[0].id as string)
      }

      map.on('mouseenter', 'canals-line', handleMouseEnter)
      map.on('mouseleave', 'canals-line', handleMouseLeave)
      map.on('click', 'canals-line', handleClickCanal)

      return () => {
        map.off('mouseenter', 'canals-line', handleMouseEnter)
        map.off('mouseleave', 'canals-line', handleMouseLeave)
        map.off('click', 'canals-line', handleClickCanal)
        map.getCanvas().style.cursor = ''
      }
    }
  }, [map, mode, addWaypoint, updatePreview, finalizeCanal, selectCanal])
}

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
                Open-Meteo inaccessible. Vérifiez votre connexion et cliquez sur le canal pour réessayer.
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

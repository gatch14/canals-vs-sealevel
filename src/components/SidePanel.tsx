// src/components/SidePanel.tsx
import { AlertCircle } from 'lucide-react'
import { ModeIndicator } from './ModeIndicator'
import { DrawingToolbar } from './DrawingToolbar'
import { CanalList } from './CanalList'
import { ElevationPanel } from './ElevationPanel'
import { CalculationPanel } from './CalculationPanel'
import { EcologyPanel } from './EcologyPanel'
import { DashboardPanel } from './DashboardPanel'
import { useElevation } from '../hooks/useElevation'
import { useRoutingWorker } from '../hooks/useRoutingWorker'
import { usePersistence } from '../hooks/usePersistence'
import { useDesalination } from '../hooks/useDesalination'
import { useCanalStore } from '../store/canalStore'
import { ClearDataButton } from './ClearDataButton'
import { CandidatesPanel } from './CandidatesPanel'

export function SidePanel() {
  // Déclenche automatiquement le fetch d'élévation quand un canal est sélectionné
  useElevation()
  // Orchestre le Web Worker routing (actif quand routingState === 'computing')
  useRoutingWorker()
  // Hydrate le store depuis IndexedDB au montage + sync Zustand→Dexie — Phase 7
  usePersistence()
  // Maintient le moteur dessalement actif pour EcologyPanel — Phase 9
  useDesalination()
  const routingState = useCanalStore((s) => s.routingState)
  const cancelRouting = useCanalStore((s) => s.cancelRouting)

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

      {/* Sections 3–6 — Corps scrollable (liste + tous les accordéons) */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* Section 3 — Liste des canaux */}
        <div className="px-4 py-4 border-b border-white/[0.08]">
          <CanalList />
        </div>

        {/* Section 4 — Profil altimétrique (accordéon) */}
        <ElevationPanel />

        {/* Section 5 — Calcul d'impact (accordéon) — Phase 4 */}
        <CalculationPanel />

        {/* Section 5b — Analyse écologique (accordéon) — Phase 5 */}
        <EcologyPanel />

        {/* Section 6 — Dashboard Global (accordéon) — Phase 6 */}
        <DashboardPanel />

        {/* Section 8 — Candidats mondiaux pré-calculés (Phase 8) */}
        <CandidatesPanel />

        {/* Section 7 — Effacement données (Phase 7) */}
        <div className="px-4 py-4 border-t border-white/[0.08] mt-auto">
          <ClearDataButton />
        </div>
      </div>
    </aside>
  )
}

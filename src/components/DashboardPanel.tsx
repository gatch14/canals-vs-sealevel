// src/components/DashboardPanel.tsx
// Accordéon Phase 6 — Dashboard global, 2 états, conforme UI-SPEC §DashboardPanel
import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { useDashboard } from '../hooks/useDashboard'
import { IpccComparisonChart } from './IpccComparisonChart'
import { formatInterval } from '../lib/formatters'
import type { Interval } from '../types/calculation'

// ─── Composant ────────────────────────────────────────────────────────────────

export function DashboardPanel() {
  const canals          = useCanalStore((s) => s.canals)
  const dashboardResult = useDashboard()

  // Accordéon ouvert par défaut, s'ouvre automatiquement dès qu'un canal existe
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (canals.length > 0) setIsOpen(true)
  }, [canals.length])

  const noCanals         = canals.length === 0
  const noProfiles       = dashboardResult === null && canals.length > 0
  const hasResult        = dashboardResult !== null
  const canalsWithProfil = dashboardResult?.canalsWithProfile ?? 0
  const totalCanals      = canals.length

  // Interval neutre pour le chart quand pas de résultat
  const realisticDeltaSL: Interval = hasResult
    ? dashboardResult.scenarios.realistic.deltaSLmm
    : [0, 0]

  const cumulativeDisplay: Interval = hasResult
    ? dashboardResult.cumulativeDeltaSLmm
    : [0, 0]

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
          Dashboard Global
        </span>
      </button>

      {isOpen && (
        <div>
          {/* État 1 — aucun canal */}
          {noCanals && (
            <div className="h-10 px-4 flex items-center">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
                Ajoutez des canaux pour voir l&apos;impact cumulé
              </p>
            </div>
          )}

          {/* État 2 — au moins un canal */}
          {!noCanals && (
            <>
              {/* ΔSL cumulé */}
              <dl className="px-4 py-2 flex flex-col gap-[2px]">
                <dt className="text-[11px] text-gray-500 uppercase tracking-wider">
                  Impact cumulé
                </dt>
                <dd className="text-[13px] font-semibold text-white">
                  {formatInterval(cumulativeDisplay, 'mm', 3)}
                </dd>
                {/* Annotation canaux avec profil */}
                {hasResult && canalsWithProfil < totalCanals && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    {totalCanals} canal{totalCanals > 1 ? 'aux' : ''} · {canalsWithProfil} avec profil chargé
                  </p>
                )}
                {(noProfiles || (hasResult && canalsWithProfil === 0)) && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    Chargez les profils altimétriques pour calculer
                  </p>
                )}
              </dl>

              {/* Scénarios 3 colonnes */}
              {hasResult && (
                <div className="grid grid-cols-3 gap-1 px-4 py-2">
                  {/* Optimiste */}
                  <div className="flex flex-col items-center gap-[2px]">
                    <span className="text-[10px] text-green-400 uppercase tracking-wider">
                      Optimiste
                    </span>
                    <span className="text-[12px] font-semibold text-white">
                      {formatInterval(dashboardResult.scenarios.optimistic.deltaSLmm, '', 2)}
                    </span>
                    <span className="text-[10px] text-gray-500">mm</span>
                  </div>
                  {/* Réaliste */}
                  <div className="flex flex-col items-center gap-[2px]">
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider">
                      Réaliste
                    </span>
                    <span className="text-[12px] font-semibold text-white">
                      {formatInterval(dashboardResult.scenarios.realistic.deltaSLmm, '', 2)}
                    </span>
                    <span className="text-[10px] text-gray-500">mm</span>
                  </div>
                  {/* Pessimiste */}
                  <div className="flex flex-col items-center gap-[2px]">
                    <span className="text-[10px] text-red-400 uppercase tracking-wider">
                      Pessimiste
                    </span>
                    <span className="text-[12px] font-semibold text-white">
                      {formatInterval(dashboardResult.scenarios.pessimistic.deltaSLmm, '', 2)}
                    </span>
                    <span className="text-[10px] text-gray-500">mm</span>
                  </div>
                </div>
              )}

              {/* Graphique IPCC */}
              <div className="px-2 pb-6">
                <IpccComparisonChart cumulativeDeltaSL={realisticDeltaSL} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// src/components/EconomicPanel.tsx
// Accordéon Phase 13 — Économie & ROI (CIRC-01–04, VIE-01–02, ROI-01–04)
// 4 états exclusifs : A) aucun canal, B) sans élévation, C) sans dessalement, D) données complètes
// Pattern identique à EcologyPanel.tsx (accordéon, 4 états, dt/dd, AlertCircle amber)
import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, AlertCircle, Leaf, Fish, Beaker, Wheat, Clock, Home, TrendingUp } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { useROI } from '../hooks/useROI'
import { useCircular } from '../hooks/useCircular'
import { calcAllCanalsRoi } from '../lib/roiEngine'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'

// ─── Constante module-level (T-13-02 : useMemo sur dépendances stables) ─────

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

// ─── Helpers de formatage UX-01 (copiés depuis DashboardPanel.tsx) ───────────

function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}

/** [X – Y] unité — em dash U+2013 obligatoire (UI-SPEC §Number Formatting) */
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}

/** Break-even : Infinity → "—" (tiret cadratin — UX honnête) */
function formatBreakEven(iv: Interval): string {
  if (iv[0] === Infinity) return '—'
  return formatInterval(iv, 'ans', 0)
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function EconomicPanel() {
  const selectedCanalId     = useCanalStore((s) => s.selectedCanalId)
  const canals              = useCanalStore((s) => s.canals)
  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
  const calcParams          = useCanalStore((s) => s.calcParams)

  const roiResult      = useROI()
  const circularResult = useCircular()

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  // Accordéon ouvert auto quand un canal avec élévation est sélectionné
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (selectedCanalId && selectedCanal?.elevation) setIsOpen(true)
  }, [selectedCanalId])

  // Sous-accordéon tableau comparatif — replié par défaut (UI-SPEC)
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  // T-13-02 : useMemo avec dépendances stables — pas de recalcul à chaque rendu
  const roiSummaries = useMemo(
    () => calcAllCanalsRoi(canals, calcParams, DESERT_FEATURES),
    [canals, calcParams],
  )

  // ── États dérivés — 4 états exclusifs ──
  const noCanal   = !selectedCanalId
  const noProfile = selectedCanal !== null && !selectedCanal.elevation
  const noDesal   = selectedCanal !== null && !!selectedCanal.elevation && !desalinationEnabled
  const hasData   = selectedCanal !== null && !!selectedCanal.elevation && roiResult !== null

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
          Économie &amp; ROI
        </span>
      </button>

      {isOpen && (
        <div>
          {/* État A — aucun canal sélectionné */}
          {noCanal && (
            <div className="h-10 px-4 flex items-center">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
                Sélectionnez un canal pour voir l&apos;analyse économique
              </p>
            </div>
          )}

          {/* État B — canal sélectionné mais pas de profil altimétrique */}
          {!noCanal && noProfile && (
            <div className="h-10 px-4 flex items-center gap-1">
              <AlertCircle size={12} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                Chargez le profil altimétrique pour l&apos;analyse économique
              </p>
            </div>
          )}

          {/* État C — dessalement désactivé (ROI partiel : KPI disponibles, co-produits non) */}
          {noDesal && roiResult && (
            <>
              <dl className="px-4 py-2 flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Seuil de rentabilité</dt>
                  <dd className="text-[13px] font-semibold text-white">{formatBreakEven(roiResult.breakEvenYears)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Investissement total</dt>
                  <dd className="text-[13px] font-semibold text-white">{formatInterval(roiResult.totalCostMEur, 'M€', 1)}</dd>
                </div>
              </dl>
              <div className="px-4 pb-3">
                <p className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  Activez les nœuds de dessalement pour les co-produits
                </p>
              </div>
            </>
          )}

          {/* État D — données complètes (elevation + roiResult disponibles) */}
          {hasData && desalinationEnabled && (
            <>
              {/* Section 1 — KPI : break-even + investissement */}
              <dl className="px-4 py-2 flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Seuil de rentabilité</dt>
                  <dd className="text-[13px] font-semibold text-white">{formatBreakEven(roiResult.breakEvenYears)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Investissement total</dt>
                  <dd className="text-[13px] font-semibold text-white">{formatInterval(roiResult.totalCostMEur, 'M€', 1)}</dd>
                </div>
              </dl>

              {/* Section 2 — Co-produits (visible si circularResult disponible) */}
              <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
                {circularResult && (
                  <dl className="flex flex-col gap-1">
                    <div className="flex flex-col gap-1">
                      <dt className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Leaf size={12} className="shrink-0" />
                        Spiruline
                      </dt>
                      <dd className="text-[13px] font-semibold text-white">
                        {formatInterval(circularResult.spirulineValue, '€/an', 0)}
                      </dd>
                      <dd className="text-[11px] text-gray-400">
                        {formatInterval(circularResult.spirulineTonnes, 't/an', 1)}
                      </dd>
                    </div>

                    <div className="flex flex-col gap-1">
                      <dt className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Fish size={12} className="shrink-0" />
                        Aquaculture
                      </dt>
                      <dd className="text-[13px] font-semibold text-white">
                        {formatInterval(circularResult.aquacultureValue, '€/an', 0)}
                      </dd>
                      <dd className="text-[11px] text-gray-400">
                        {formatInterval(circularResult.aquacultureTonnes, 't protéines/an', 1)}
                      </dd>
                    </div>

                    <div className="flex flex-col gap-1">
                      <dt className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Beaker size={12} className="shrink-0" />
                        Engrais &amp; minéraux
                      </dt>
                      <dd className="text-[13px] font-semibold text-white">
                        {formatInterval(circularResult.mineralsValue, '€/an', 0)}
                      </dd>
                      <dd className="text-[11px] text-gray-400">
                        Mg {formatInterval(circularResult.mgTonnes, 't/an', 1)}
                      </dd>
                      <dd className="text-[11px] text-gray-400">
                        K {formatInterval(circularResult.kTonnes, 't/an', 1)}
                      </dd>
                      <dd className="text-[11px] text-gray-400">
                        Ca {formatInterval(circularResult.caTonnes, 't/an', 1)}
                      </dd>
                    </div>

                    <div className="flex flex-col gap-1">
                      <dt className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Wheat size={12} className="shrink-0" />
                        Surface agricole créée
                      </dt>
                      <dd className="text-[13px] font-semibold text-white">
                        {formatInterval(circularResult.arableLandKm2, 'km²', 1)}
                      </dd>
                    </div>

                    <div className="flex flex-col gap-1">
                      <dt className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} className="shrink-0" />
                        Durée de vie estimée
                      </dt>
                      <dd className="text-[13px] font-semibold text-white">
                        {formatInterval(circularResult.lifespanYears, 'ans', 0)}
                      </dd>
                    </div>

                    <div className="flex flex-col gap-1">
                      <dt className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Home size={12} className="shrink-0" />
                        Timeline habitabilité
                      </dt>
                      <dd className="text-[13px] font-semibold text-white">
                        {formatInterval(circularResult.habitabilityYears, 'ans', 0)}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* Section 3 — Projections ROI à 25/50/100 ans */}
              <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={12} className="shrink-0" />
                  Projections ROI
                </p>
                <dl className="flex flex-col gap-1">
                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">ROI à 25 ans</dt>
                    <dd className="text-[13px] font-semibold text-white">{formatInterval(roiResult.roi25, 'M€', 1)}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">ROI à 50 ans</dt>
                    <dd className="text-[13px] font-semibold text-white">{formatInterval(roiResult.roi50, 'M€', 1)}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">ROI à 100 ans</dt>
                    <dd className="text-[13px] font-semibold text-white">{formatInterval(roiResult.roi100, 'M€', 1)}</dd>
                  </div>
                </dl>
              </div>

              {/* Section 4 — Sous-accordéon tableau comparatif multi-canaux (ROI-04) */}
              {canals.length > 0 && (
                <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
                  <button
                    onClick={() => setIsCompareOpen((o) => !o)}
                    className="flex items-center gap-1 text-left
                               focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                               outline-none"
                    aria-expanded={isCompareOpen}
                  >
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 transition-transform duration-200 ${isCompareOpen ? 'rotate-180' : ''}`}
                    />
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                      Comparer ({canals.length} canaux)
                    </span>
                  </button>

                  {isCompareOpen && (
                    <table className="w-full mt-1">
                      <thead>
                        <tr>
                          <th scope="col" className="text-left text-[10px] text-gray-500 uppercase tracking-wider pb-1">Nom</th>
                          <th scope="col" className="text-right text-[10px] text-gray-500 uppercase tracking-wider pb-1">Seuil</th>
                          <th scope="col" className="text-right text-[10px] text-gray-500 uppercase tracking-wider pb-1">Coût</th>
                          <th scope="col" className="text-right text-[10px] text-gray-500 uppercase tracking-wider pb-1">Valeur/an</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roiSummaries.map((summary) => (
                          <tr
                            key={summary.canalId}
                            className={summary.canalId === selectedCanalId ? 'bg-white/[0.04]' : ''}
                            aria-current={summary.canalId === selectedCanalId ? 'true' : undefined}
                          >
                            <td className="text-left text-[11px] text-gray-300 py-[2px] truncate max-w-[96px]">
                              {summary.canalName}
                            </td>
                            <td className="text-right text-[11px] text-gray-300 py-[2px]">
                              {summary.breakEvenYears[0] === Infinity ? '—' : formatInterval(summary.breakEvenYears, 'ans', 0)}
                            </td>
                            <td className="text-right text-[11px] text-gray-300 py-[2px]">
                              {formatInterval(summary.totalCostMEur, 'M€', 1)}
                            </td>
                            <td className="text-right text-[11px] text-gray-300 py-[2px]">
                              {formatInterval(summary.totalAnnualValueMEur, 'M€', 1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

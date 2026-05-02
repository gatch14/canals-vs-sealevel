// src/components/CalculationPanel.tsx
// Accordéon Phase 4 — inputs largeur/profondeur + résultats en intervalles UX-01
// Pattern dupliqué d'ElevationPanel.tsx — même structure, mêmes classes Tailwind.
import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { useCalculation } from '../hooks/useCalculation'
import type { Interval, TerrainBreakdown } from '../types/calculation'

// ─── Helpers de formatage UX-01 ──────────────────────────────────────────────

/** Format scientifique pour valeurs très petites (< 0.001) */
function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}

/** [X – Y] unité — em dash U+2013 obligatoire (UI-SPEC §Number Formatting) */
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}

/** Coût avec basculement M€ / Md€ (Pitfall 6 RESEARCH.md) */
function formatCost(iv: Interval): string {
  const [minMEur, maxMEur] = iv
  if (maxMEur >= 1000) {
    return `[${(minMEur / 1000).toFixed(1)} – ${(maxMEur / 1000).toFixed(1)}] Md€`
  }
  return `[${minMEur.toFixed(0)} – ${maxMEur.toFixed(0)}] M€`
}

/** Pourcentages de la décomposition terrain (déclencher seulement si non 100% plain) */
function formatTerrainBreakdown(b: TerrainBreakdown): string | null {
  if (b.totalKm <= 0) return null
  const pPlain    = (b.plain    / b.totalKm) * 100
  const pMixed    = (b.mixed    / b.totalKm) * 100
  const pMountain = (b.mountain / b.totalKm) * 100
  if (pPlain >= 99.5) return null  // 100% plaine — pas affiché (UI-SPEC)
  return `Plaine ${pPlain.toFixed(0)}% · Mixte ${pMixed.toFixed(0)}% · Montagne ${pMountain.toFixed(0)}%`
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function CalculationPanel() {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals          = useCanalStore((s) => s.canals)
  const calcParams      = useCanalStore((s) => s.calcParams)
  const setCalcParams   = useCanalStore((s) => s.setCalcParams)
  const { result, partial } = useCalculation()

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  // Accordéon ouvert auto à la sélection
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (selectedCanalId) setIsOpen(true)
  }, [selectedCanalId])

  // Inputs locaux pour permettre la saisie temporaire (string) avant validation
  const [widthInput, setWidthInput] = useState(String(calcParams.width))
  const [depthInput, setDepthInput] = useState(String(calcParams.depth))
  useEffect(() => { setWidthInput(String(calcParams.width)) }, [calcParams.width])
  useEffect(() => { setDepthInput(String(calcParams.depth)) }, [calcParams.depth])

  function handleWidthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setWidthInput(raw)
    const num = parseFloat(raw)
    if (Number.isFinite(num) && num > 0) {
      setCalcParams({ width: num })
    }
  }

  function handleDepthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setDepthInput(raw)
    const num = parseFloat(raw)
    if (Number.isFinite(num) && num > 0) {
      setCalcParams({ depth: num })
    }
  }

  function handleWidthBlur() {
    const num = parseFloat(widthInput)
    if (!Number.isFinite(num) || num <= 0) {
      setWidthInput('50')
      setCalcParams({ width: 50 })
    }
  }

  function handleDepthBlur() {
    const num = parseFloat(depthInput)
    if (!Number.isFinite(num) || num <= 0) {
      setDepthInput('5')
      setCalcParams({ depth: 5 })
    }
  }

  // ── États dérivés ──
  const noCanal = !selectedCanalId
  const noProfile = selectedCanal !== null && !selectedCanal.elevation
  const hasResult = result !== null

  // Pourcentage médian pour la barre IPCC (clampé)
  const ipccMid = result ? (result.ipccPercent[0] + result.ipccPercent[1]) / 2 : 0
  const ipccBarWidth = Math.min(ipccMid, 100)

  const terrainStr = result ? formatTerrainBreakdown(result.terrainBreakdown) : null

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
          Calcul d&apos;impact
        </span>
      </button>

      {isOpen && (
        <div>
          {/* État vide — aucun canal sélectionné */}
          {noCanal && (
            <div className="h-10 px-4 flex items-center">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
                Sélectionnez un canal pour calculer son impact
              </p>
            </div>
          )}

          {/* État pas de profil chargé */}
          {!noCanal && noProfile && (
            <div className="h-10 px-4 flex items-center gap-1">
              <AlertCircle size={12} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                Chargez le profil altimétrique pour calculer
              </p>
            </div>
          )}

          {/* État données — inputs + résultats */}
          {!noCanal && !noProfile && (
            <>
              {/* Inputs largeur / profondeur */}
              <div className="flex gap-4 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="canal-width" className="text-[11px] text-gray-400">Largeur</label>
                  <div className="flex items-end gap-1">
                    <input
                      id="canal-width"
                      type="number"
                      min="0.1"
                      step="1"
                      value={widthInput}
                      onChange={handleWidthChange}
                      onBlur={handleWidthBlur}
                      aria-label="Largeur du canal en mètres"
                      className="w-20 h-8 px-2 text-[13px] text-white bg-gray-800 rounded
                                 border border-white/[0.12] focus:border-blue-500 focus:outline-none
                                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[12px] text-gray-400 mb-[6px]">m</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="canal-depth" className="text-[11px] text-gray-400">Profondeur</label>
                  <div className="flex items-end gap-1">
                    <input
                      id="canal-depth"
                      type="number"
                      min="0.1"
                      step="1"
                      value={depthInput}
                      onChange={handleDepthChange}
                      onBlur={handleDepthBlur}
                      aria-label="Profondeur du canal en mètres"
                      className="w-20 h-8 px-2 text-[13px] text-white bg-gray-800 rounded
                                 border border-white/[0.12] focus:border-blue-500 focus:outline-none
                                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[12px] text-gray-400 mb-[6px]">m</span>
                  </div>
                </div>
              </div>

              {/* Résultats — affichés seulement si computeCalculation a retourné non-null */}
              {hasResult && result && (
                <dl className="flex flex-col">
                  {/* Volume */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Volume</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(result.volumeKm3, 'km³')}
                    </dd>
                  </div>

                  {/* ΔSL */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Impact mer</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(result.deltaSLmm, 'mm')}
                    </dd>
                  </div>

                  {/* % IPCC + barre */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">vs IPCC 2100</dt>
                    <dd>
                      <div
                        className="mt-1 h-1.5 w-full rounded-full bg-gray-700"
                        role="progressbar"
                        aria-valuenow={Math.round(ipccMid)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Comparaison IPCC"
                      >
                        <div
                          className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${ipccBarWidth}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatNumber(result.ipccPercent[0], 2)}–{formatNumber(result.ipccPercent[1], 2)}% du rythme annuel IPCC (4,5 mm/an)
                      </p>
                    </dd>
                  </div>

                  {/* Coût + décomposition terrain */}
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Coût estimé</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatCost(result.costMEur)}
                    </dd>
                    {terrainStr && (
                      <p className="text-[11px] text-gray-500 mt-1">{terrainStr}</p>
                    )}
                  </div>

                  {/* Section IMPACT PARTIEL — conditionnelle (CALC-05) */}
                  {partial && (
                    <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-2 flex flex-col gap-1">
                      <p className="text-[11px] text-amber-400 uppercase tracking-wider">Impact partiel</p>
                      <p className="text-[11px] text-gray-400">
                        Si arrêté au km {partial.reachableKm.toFixed(1)} :
                      </p>
                      <p className="text-[13px] font-semibold text-white">
                        {formatInterval(partial.deltaSLmm, 'mm')}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {partial.percentOfFull.toFixed(0)}% du tracé réalisable · Coût {formatCost(partial.costMEur)}
                      </p>
                    </div>
                  )}
                </dl>
              )}

              {/* Si computeCalculation null mais on a un canal+profile → dimensions invalides */}
              {!hasResult && (
                <div className="px-4 py-2">
                  <p role="alert" className="text-xs text-red-400">
                    Saisissez des dimensions valides (&gt; 0)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

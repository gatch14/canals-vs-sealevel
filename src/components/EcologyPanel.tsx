// src/components/EcologyPanel.tsx
// Accordéon Phase 5 — analyse écologique ECO-01 à ECO-04 (6 états)
// Étendu Phase 9 — alerte eau salée ECO-05 + section dessalement (DESAL-01 à DESAL-05)
// Étendu Phase 10 — section météorologique (METEO-01 à METEO-05)
// Pattern dupliqué de CalculationPanel.tsx — même structure, mêmes classes Tailwind.
import { useState, useEffect } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import { useEcology } from '../hooks/useEcology'
import { useDesalination } from '../hooks/useDesalination'
import { useMeteorology } from '../hooks/useMeteorology'
import type { Interval } from '../types/calculation'
import type { WeatherRisk } from '../types/meteorology'

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

// ─── Labels météo (METEO-05) ────────────────────────────────────────────────

const WEATHER_RISK_COLORS: Record<WeatherRisk, string> = {
  low: 'text-green-400',
  moderate: 'text-amber-400',
  high: 'text-red-400',
}

const WEATHER_RISK_LABELS: Record<WeatherRisk, string> = {
  low: 'Faible',
  moderate: 'Modéré',
  high: 'Élevé',
}

// ─── Labels d'aridité ────────────────────────────────────────────────────────

const ARIDITY_LABELS: Record<string, string> = {
  hyperarid: "Hyperaride (Sahara, Atacama, Namib)",
  arid: "Aride (Sahel, steppes d’Asie centrale)",
  semiarid: "Semi-aride",
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function EcologyPanel() {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)
  const ecologyResult = useEcology()

  const desalinationEnabled = useCanalStore((s) => s.desalinationEnabled)
  const toggleDesalination = useCanalStore((s) => s.toggleDesalination)
  const desalinationResult = useDesalination()
  const meteorologyResult = useMeteorology()

  const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null

  // Accordéon ouvert auto à la sélection
  const [isOpen, setIsOpen] = useState(true)
  useEffect(() => {
    if (selectedCanalId) setIsOpen(true)
  }, [selectedCanalId])

  // ── États dérivés ──
  const noCanal = !selectedCanalId
  const noProfile = selectedCanal !== null && !selectedCanal.elevation
  const noImpact =
    ecologyResult !== null &&
    ecologyResult.desertIntersection === null &&
    !ecologyResult.endorheicAlert.detected &&
    !ecologyResult.climateRiskFlag

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
          Analyse &eacute;cologique
        </span>
      </button>

      {isOpen && (
        <div>
          {/* État 1 — aucun canal sélectionné */}
          {noCanal && (
            <div className="h-10 px-4 flex items-center">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed w-full">
                S&eacute;lectionnez un canal pour analyser son impact &eacute;cologique
              </p>
            </div>
          )}

          {/* État 2 — canal sélectionné mais pas de profil chargé */}
          {!noCanal && noProfile && (
            <div className="h-10 px-4 flex items-center gap-1">
              <AlertCircle size={12} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                Chargez le profil altim&eacute;trique pour l&apos;analyse &eacute;cologique
              </p>
            </div>
          )}

          {/* État 3 — canal + élévation mais aucune intersection désertique/endorheïque */}
          {!noCanal && !noProfile && noImpact && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 italic leading-relaxed">
                Aucune intersection d&eacute;sertique ni alerte endorhe&iuml;que sur ce trac&eacute;
              </p>
            </div>
          )}

          {/* États 4+5+6 — additifs, s'affichent simultanément */}
          {!noCanal && !noProfile && ecologyResult !== null && !noImpact && (
            <>
              {/* État 4 — zone désertique traversée (ECO-01 + ECO-02) */}
              {ecologyResult.desertIntersection !== null && (
                <dl className="flex flex-col">
                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Zone aride travers&eacute;e</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(ecologyResult.desertIntersection.areaKm2, 'km²', 0)}
                    </dd>
                  </div>

                  <div className="px-4 py-1 flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Verdissement estim&eacute;</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {ecologyResult.greeningTimeline
                        ? formatInterval(ecologyResult.greeningTimeline, 'ans', 0)
                        : '—'}
                    </dd>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {ARIDITY_LABELS[ecologyResult.desertIntersection.aridityClass] ?? ecologyResult.desertIntersection.aridityClass}
                    </p>
                  </div>
                </dl>
              )}

              {/* État 5 — alerte bassin endorheïque (ECO-03) */}
              {ecologyResult.endorheicAlert.detected && (
                <div
                  role="alert"
                  className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-1"
                >
                  <p className="text-[11px] text-red-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    Alerte &mdash; Bassin endorhe&iuml;que
                  </p>
                  <p className="text-[12px] text-red-300 leading-relaxed">
                    Le canal aboutit dans{' '}
                    {ecologyResult.endorheicAlert.basinName ?? 'un bassin endorheïque fermé'}{' '}
                    &mdash; risque de salinisation irr&eacute;versible
                  </p>
                  {ecologyResult.endorheicAlert.examples && (
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                      Exemples historiques : {ecologyResult.endorheicAlert.examples}
                    </p>
                  )}
                </div>
              )}

              {/* État 6 — risque climatique (ECO-04) */}
              {ecologyResult.climateRiskFlag && (
                <div
                  role="alert"
                  className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-1"
                >
                  <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    Risque climatique
                  </p>
                  <p className="text-[12px] text-amber-300 leading-relaxed">
                    Introduction d&apos;eau dans une zone aride et chaude
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                    Risque de gradients de pression et de ph&eacute;nom&egrave;nes m&eacute;t&eacute;orologiques locaux
                  </p>
                </div>
              )}
            </>
          )}
          {/* Toggle dessalement + section résultats (DESAL-01 à DESAL-05) */}
          {/* Note : ECO-05 alerte 'critical' reportée jusqu'à GeoJSON cours d'eau disponible */}
          {!noCanal && (
            <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
              {/* Toggle */}
              <button
                onClick={toggleDesalination}
                className="flex items-center gap-2 text-left focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 outline-none rounded"
                aria-pressed={desalinationEnabled}
              >
                <span
                  className={`w-8 h-4 rounded-full transition-colors duration-200 relative shrink-0 ${
                    desalinationEnabled ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                      desalinationEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                  N&oelig;uds dessalement solaire
                </span>
              </button>

              {/* Section résultats — visible uniquement si toggle activé ET résultat disponible */}
              {desalinationEnabled && desalinationResult && desalinationResult.nodes > 0 && (
                <dl className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">
                      N&oelig;uds ({desalinationResult.nodes})
                    </dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(desalinationResult.waterProduction, 'm³/jour', 0)}
                    </dd>
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Valeur sels r&eacute;cup&eacute;r&eacute;s</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(desalinationResult.saltValue, '€/an', 0)}
                    </dd>
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Zones habitables cr&eacute;&eacute;es</dt>
                    <dd className="text-[13px] font-semibold text-white">
                      {formatInterval(desalinationResult.habitableZones, 'km²', 0)}
                    </dd>
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Co&ucirc;t infrastructure</dt>
                    <dd className="text-[13px] font-semibold text-amber-300">
                      {formatInterval(
                        [desalinationResult.desalinationCost[0] / 1_000_000, desalinationResult.desalinationCost[1] / 1_000_000],
                        'M€',
                        0,
                      )}
                    </dd>
                  </div>
                </dl>
              )}

              {/* Message si toggle activé mais canal trop court pour un nœud */}
              {desalinationEnabled && desalinationResult && desalinationResult.nodes === 0 && (
                <p className="text-[11px] text-gray-500 italic">
                  Canal trop court pour un n&oelig;ud (minimum 500 km)
                </p>
              )}
            </div>
          )}

          {/* ─── Section météorologique (METEO-01 à METEO-05) ────────────────── */}
          {!noCanal && meteorologyResult && (
            <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Impact m&eacute;t&eacute;orologique</p>
              <dl className="flex flex-col gap-1">
                <div className="flex flex-col gap-[2px]">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">&Eacute;vaporation</dt>
                  <dd className="text-[13px] font-semibold text-white">
                    {formatInterval(meteorologyResult.evaporationKm3, 'km³/an')}
                  </dd>
                </div>

                <div className="flex flex-col gap-[2px]">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Rayon d&apos;influence</dt>
                  <dd className="text-[13px] font-semibold text-white">
                    {formatInterval(meteorologyResult.influenceRadiusKm, 'km', 0)}
                  </dd>
                </div>

                <div className="flex flex-col gap-[2px]">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Pr&eacute;cipitations induites</dt>
                  <dd className="text-[13px] font-semibold text-white">
                    {formatInterval(meteorologyResult.precipitationMmY, 'mm/an', 0)}
                  </dd>
                </div>

                <div className="flex flex-col gap-[2px]">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Refroidissement local</dt>
                  <dd className="text-[13px] font-semibold text-white">
                    &minus;{formatInterval(
                      [Math.abs(meteorologyResult.coolingDeltaC[1]), Math.abs(meteorologyResult.coolingDeltaC[0])],
                      '°C', 2,
                    )}
                  </dd>
                </div>

                <div className="flex flex-col gap-[2px]">
                  <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Risque m&eacute;t&eacute;o</dt>
                  <dd className={`text-[13px] font-semibold ${WEATHER_RISK_COLORS[meteorologyResult.weatherRisk]}`}>
                    {WEATHER_RISK_LABELS[meteorologyResult.weatherRisk]}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

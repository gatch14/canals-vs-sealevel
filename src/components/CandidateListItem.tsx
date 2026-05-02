// src/components/CandidateListItem.tsx
// Item de liste Phase 8 — compact avec expand pour détails + bouton charger (IA-02, IA-03)
import { useState } from 'react'
import { ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'
import type { CanalCandidate } from '../types/candidate'

interface Props {
  candidate: CanalCandidate
}

export function CandidateListItem({ candidate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const loadCandidate = useCanalStore((s) => s.loadCandidate)

  const handleLoad = (e: React.MouseEvent) => {
    e.stopPropagation()
    loadCandidate(candidate)
  }

  return (
    <li className="rounded overflow-hidden">
      {/* Ligne compacte — toujours visible */}
      <button
        onClick={() => setIsExpanded((o) => !o)}
        className="w-full px-3 py-2 flex items-start gap-2 text-left
                   hover:bg-white/[0.04] transition-colors
                   focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                   outline-none"
        aria-expanded={isExpanded}
      >
        <ChevronDown
          size={12}
          className={`text-gray-500 mt-[3px] shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white truncate leading-tight">{candidate.name}</p>
          <p className="text-[11px] text-gray-500 truncate">{candidate.region}</p>
        </div>
        <span className="text-[11px] text-gray-400 shrink-0 mt-[1px]">
          [{candidate.dsl_min.toFixed(2)}&ndash;{candidate.dsl_max.toFixed(2)}]&nbsp;mm
        </span>
      </button>

      {/* Zone étendue — détails + bouton charger */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-white/[0.06] bg-white/[0.02]">
          <dl className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1">
              {candidate.feasible ? (
                <CheckCircle size={11} className="text-green-400 shrink-0" />
              ) : (
                <AlertCircle size={11} className="text-amber-400 shrink-0" />
              )}
              <span className={`text-[11px] ${candidate.feasible ? 'text-green-400' : 'text-amber-400'}`}>
                {candidate.feasible ? 'Gravitairement faisable' : "Montée d'altitude détectée"}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <dt className="text-[11px] text-gray-500">Coût estimé</dt>
              <dd className="text-[12px] text-white">
                [{candidate.cost_min}&nbsp;&ndash;&nbsp;{candidate.cost_max}]&nbsp;G&euro;
              </dd>
            </div>
          </dl>

          <button
            onClick={handleLoad}
            className="mt-3 w-full h-7 rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                       text-[12px] text-white font-medium transition-colors
                       focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                       outline-none"
          >
            Charger sur la carte
          </button>
        </div>
      )}
    </li>
  )
}

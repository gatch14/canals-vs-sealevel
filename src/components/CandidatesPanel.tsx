// src/components/CandidatesPanel.tsx
// Accordéon Phase 8 — bibliothèque de 25 canaux mondiaux pré-calculés (IA-01, IA-02, IA-03)
// Pattern EcologyPanel.tsx — accordéon collapsé par défaut, dark theme
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useCandidates } from '../hooks/useCandidates'
import { CandidateListItem } from './CandidateListItem'

export function CandidatesPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const candidates = useCandidates()

  return (
    <div className="border-t border-white/[0.08]">
      {/* Header accordéon — identique au pattern EcologyPanel */}
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
          Candidats mondiaux
        </span>
        <span className="ml-auto text-[11px] text-gray-600">{candidates.length}</span>
      </button>

      {isOpen && (
        <div className="pb-2">
          <ul className="flex flex-col gap-[2px] px-2">
            {candidates.map((candidate) => (
              <CandidateListItem key={candidate.id} candidate={candidate} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

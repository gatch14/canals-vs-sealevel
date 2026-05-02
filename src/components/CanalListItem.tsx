// src/components/CanalListItem.tsx
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useCanalStore } from '../store/canalStore'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type { Canal } from '../types/canal'

interface Props {
  canal: Canal
}

const focusRing =
  'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'

export function CanalListItem({ canal }: Props) {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const selectCanal = useCanalStore((s) => s.selectCanal)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isSelected = canal.id === selectedCanalId

  return (
    <>
      <li
        onClick={() => selectCanal(canal.id)}
        className={`flex items-start justify-between px-3 py-2 rounded cursor-pointer
                    transition-colors outline-none ${focusRing}
                    ${
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/40'
                        : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                    }`}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && selectCanal(canal.id)}
      >
        <div className="flex flex-col gap-[2px] min-w-0">
          <span className="text-sm text-white truncate">{canal.name}</span>
          {canal.elevationLoading && !canal.elevation && (
            <span className="text-[10px] px-[6px] py-[2px] rounded-full bg-gray-700 text-gray-400 w-fit">
              ⏳ Chargement...
            </span>
          )}
          {canal.elevation?.isFullyGravity === true && (
            <span className="text-[10px] px-[6px] py-[2px] rounded-full bg-green-500/15 text-green-400 w-fit">
              ✅ Gravitaire
            </span>
          )}
          {canal.elevation && !canal.elevation.isFullyGravity && (
            <span className="text-[10px] px-[6px] py-[2px] rounded-full bg-amber-500/15 text-amber-400 w-fit">
              ⚠ Montées détectées
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setConfirmOpen(true)
          }}
          className={`ml-2 p-1 rounded text-gray-400 hover:text-red-500
                      hover:bg-red-500/10 transition-colors outline-none ${focusRing}`}
          aria-label={`Supprimer ${canal.name}`}
        >
          <Trash2 size={14} />
        </button>
      </li>

      {confirmOpen && (
        <DeleteConfirmDialog canal={canal} onClose={() => setConfirmOpen(false)} />
      )}
    </>
  )
}

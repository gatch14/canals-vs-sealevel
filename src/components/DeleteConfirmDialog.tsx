// src/components/DeleteConfirmDialog.tsx
import { useCanalStore } from '../store/canalStore'
import type { Canal } from '../types/canal'

interface Props {
  canal: Canal
  onClose: () => void
}

export function DeleteConfirmDialog({ canal, onClose }: Props) {
  const deleteCanal = useCanalStore((s) => s.deleteCanal)

  const handleConfirm = () => {
    deleteCanal(canal.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-72 rounded-lg bg-gray-800 border border-white/[0.08]
                   p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-semibold text-white mb-1">Supprimer ce canal ?</p>
          <p className="text-xs text-gray-400">Cette action est irréversible.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-gray-300
                       bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded text-sm text-white
                       bg-red-500 hover:bg-red-600 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

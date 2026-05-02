// src/components/DrawingToolbar.tsx
import { Pencil, Route, X } from 'lucide-react'
import { useCanalStore } from '../store/canalStore'

const focusRing =
  'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'

export function DrawingToolbar() {
  const mode = useCanalStore((s) => s.mode)
  const startDrawing = useCanalStore((s) => s.startDrawing)
  const cancelDrawing = useCanalStore((s) => s.cancelDrawing)
  const draftPoints = useCanalStore((s) => s.draftPoints)
  const startRouting  = useCanalStore((s) => s.startRouting)
  const cancelRouting = useCanalStore((s) => s.cancelRouting)

  return (
    <div className="flex flex-col gap-2">
      {mode === 'selection' && (
        <div className="flex flex-col gap-2">
          <button
            onClick={startDrawing}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded
                        bg-blue-500 hover:bg-blue-600 active:scale-[0.98]
                        text-white text-sm font-semibold transition-colors
                        outline-none ${focusRing}`}
          >
            <Pencil size={16} />
            Dessiner canal
          </button>
          <button
            onClick={startRouting}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded
                        bg-purple-600 hover:bg-purple-700 active:scale-[0.98]
                        text-white text-sm font-semibold transition-colors
                        outline-none ${focusRing}`}
          >
            <Route size={16} />
            Tracé optimal
          </button>
        </div>
      )}

      {mode === 'drawing' && (
        <div className="flex flex-col gap-2">
          {draftPoints.length < 2 && (
            <p className="text-xs text-gray-400">
              Posez au moins 2 points pour finaliser le canal
            </p>
          )}
          <button
            onClick={cancelDrawing}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded
                        bg-gray-700 hover:bg-gray-600
                        text-white text-sm transition-colors
                        outline-none ${focusRing}`}
          >
            <X size={16} />
            Annuler
          </button>
        </div>
      )}

      {mode === 'routing' && (
        <div className="flex flex-col gap-2">
          <button
            onClick={cancelRouting}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded
                        bg-gray-700 hover:bg-gray-600
                        text-white text-sm transition-colors
                        outline-none ${focusRing}`}
          >
            <X size={16} />
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}

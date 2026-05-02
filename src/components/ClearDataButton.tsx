// src/components/ClearDataButton.tsx
// Bouton d'effacement complet : IndexedDB + reset store.
// Pattern : DeleteConfirmDialog.tsx — même overlay + dialog de confirmation.
// PERS-03 : effacement depuis l'interface avec dialog de confirmation.
import { useState } from 'react'
import { useCanalStore } from '../store/canalStore'
import { db } from '../services/db'

export function ClearDataButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const clearAll = useCanalStore((s) => s.clearAll)

  const handleConfirm = async () => {
    // 1. Vider IndexedDB — transaction atomique (RESEARCH.md Pattern 4)
    await db.transaction('rw', [db.canals, db.settings], async () => {
      await db.canals.clear()
      await db.settings.clear()
    })
    // 2. Reset du store mémoire — après IndexedDB pour cohérence
    clearAll()
    setShowConfirm(false)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full px-4 py-2 rounded text-sm text-gray-400 bg-gray-700/50 hover:bg-gray-700 hover:text-gray-200 transition-colors text-left"
      >
        Effacer toutes les données
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-72 rounded-lg bg-gray-800 border border-white/[0.08] p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-semibold text-white mb-1">Effacer toutes les données ?</p>
              <p className="text-xs text-gray-400">
                Tous les canaux et paramètres seront supprimés. Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Effacer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// src/components/CanalList.tsx
import { useCanalStore } from '../store/canalStore'
import { CanalListItem } from './CanalListItem'

export function CanalList() {
  const canals = useCanalStore((s) => s.canals)

  return (
    <div>
      <h2 className="text-xs font-normal text-gray-400 uppercase tracking-wider mb-3">
        Canaux tracés
      </h2>

      {canals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-semibold text-gray-300 mb-2">Aucun canal tracé</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Cliquez sur &ldquo;Dessiner canal&rdquo; puis cliquez sur la carte pour poser les points
            de votre canal. Double-cliquez pour finaliser.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {canals.map((canal) => (
            <CanalListItem key={canal.id} canal={canal} />
          ))}
        </ul>
      )}

      {/* Info-bulle ordre de grandeur — ancre Qattara dès Phase 1 */}
      <div className="mt-6 px-3 py-2 rounded bg-gray-800 border border-white/[0.06]">
        <p className="text-xs text-gray-400 leading-relaxed">
          Qattara Depression = 2,76 mm de baisse si remplie
        </p>
      </div>
    </div>
  )
}

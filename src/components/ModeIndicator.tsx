// src/components/ModeIndicator.tsx
import { useCanalStore } from '../store/canalStore'

const MODE_CONFIG = {
  selection: {
    label: 'Sélection',
    bg: 'bg-gray-800',
    text: 'text-gray-300',
  },
  drawing: {
    label: 'Tracé en cours',
    bg: 'bg-blue-700',
    text: 'text-white',
  },
  routing: {
    label: 'Tracé optimal',
    bg: 'bg-purple-700',
    text: 'text-white',
  },
} as const

export function ModeIndicator() {
  const mode = useCanalStore((s) => s.mode)
  const cfg = MODE_CONFIG[mode]

  return (
    <div className={`h-8 flex items-center justify-between px-4 ${cfg.bg}`}>
      <span className="text-base font-semibold text-white">Canal Explorer</span>
      <span className={`text-xs font-normal ${cfg.text}`}>{cfg.label}</span>
    </div>
  )
}

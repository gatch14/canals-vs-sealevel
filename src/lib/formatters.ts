// src/lib/formatters.ts
// Helpers de formatage partagés — UX-01 (intervalles [min, max], em dash U+2013)
// Importé par CalculationPanel, EcologyPanel, EconomicPanel, DashboardPanel.
import type { Interval } from '../types/calculation'

/** Format scientifique pour valeurs très petites (< 0.001) */
export function formatNumber(n: number, decimals: number = 3): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 0.001) return n.toExponential(2)
  return n.toFixed(decimals)
}

/** [X – Y] unité — em dash U+2013 obligatoire (UI-SPEC §Number Formatting) */
export function formatInterval(iv: Interval, unit: string, decimals: number = 3): string {
  return `[${formatNumber(iv[0], decimals)} – ${formatNumber(iv[1], decimals)}] ${unit}`
}

// src/types/roi.ts
// Types ROI & Break-even Phase 12 — UX-01 strict (Interval partout)
import type { Interval } from './calculation'

// ─── Paramètres d'entrée ROI ──────────────────────────────────────────────────

export interface RoiParams {
  /** Coût de construction du canal en millions d'euros [min, max] */
  costMEur: Interval
  /** Coût de l'installation de désalinisation en euros [min, max] */
  desalinationCostEur: Interval
  /** Production d'eau potable en m³/jour [min, max] */
  waterProductionM3PerDay: Interval
  /** Valeur annuelle du sel extrait en euros [min, max] */
  saltValueEurPerYear: Interval
  /** Valeur annuelle de la spiruline en euros [min, max] */
  spirulineValueEurPerYear: Interval
  /** Valeur annuelle de l'aquaculture en euros [min, max] */
  aquacultureValueEurPerYear: Interval
  /** Valeur annuelle des minéraux extraits en euros [min, max] */
  mineralsValueEurPerYear: Interval
}

// ─── Résultat d'analyse ROI ──────────────────────────────────────────────────

export interface RoiResult {
  /** Valeur annuelle totale de toutes les sources en millions d'euros [min, max] */
  totalAnnualValueMEur: Interval
  /** Coût total (construction + désalinisation) en millions d'euros [min, max] */
  totalCostMEur: Interval
  /** Nombre d'années pour atteindre le break-even [min, max] */
  breakEvenYears: Interval
  /** ROI net cumulé à 25 ans en millions d'euros [min, max] */
  roi25: Interval
  /** ROI net cumulé à 50 ans en millions d'euros [min, max] */
  roi50: Interval
  /** ROI net cumulé à 100 ans en millions d'euros [min, max] */
  roi100: Interval
}

// ─── Résumé ROI d'un canal (pour dashboard global) ───────────────────────────

export interface RoiSummary {
  /** Identifiant unique du canal */
  canalId: string
  /** Nom lisible du canal */
  canalName: string
  /** Coût total en millions d'euros [min, max] */
  totalCostMEur: Interval
  /** Valeur annuelle totale en millions d'euros [min, max] */
  totalAnnualValueMEur: Interval
  /** Années au break-even [min, max] */
  breakEvenYears: Interval
  /** ROI net à 25 ans [min, max] */
  roi25: Interval
  /** ROI net à 50 ans [min, max] */
  roi50: Interval
  /** ROI net à 100 ans [min, max] */
  roi100: Interval
}

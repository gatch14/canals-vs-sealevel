// src/lib/circularEngine.ts
// Moteur économique circulaire Phase 11 — pur TypeScript, sans React, sans Zustand.
// Même pattern que desalinationEngine.ts : fonctions pures, intervalles [min, max].
// Wave 1 : implémentation complète (T02).
import type { FeatureCollection } from 'geojson'
import type { Interval } from '../types/calculation'
import type { CircularParams, CircularResult } from '../types/circular'
import { calcAridityFactor } from './meteorologyEngine'

// ─── Constantes scientifiques locked (CONTEXT.md) ────────────────────────────

// Rendement commercial en bassin ouvert (raceway) zone tropicale/aride : 21–32 t/ha/an (ScienceDirect 2023)
const SPIRULINE_YIELD_MIN = 15
const SPIRULINE_YIELD_MAX = 30
const SPIRULINE_BASIN_FRACTION = 0.10
// Hypothèse de production de masse — prix de marché actuel : 70–280 €/kg ; ces valeurs supposent
// une massification à grande échelle qui effondrerait les prix vers un niveau commodity.
const SPIRULINE_PRICE_MIN = 5_000
const SPIRULINE_PRICE_MAX = 20_000

const AQUACULTURE_YIELD_MIN = 2
const AQUACULTURE_YIELD_MAX = 8
const AQUACULTURE_BASIN_FRACTION = 0.30
const AQUACULTURE_PRICE_MIN = 2_000
const AQUACULTURE_PRICE_MAX = 8_000

const BRINE_SALT_CONCENTRATION = 35
// Fractions par rapport à la masse de sel dissous (Lenntech Seawater Composition) :
// Mg²⁺ = 1,262 g/L / 35 g/L TDS = 3,6% — K⁺ = 0,38/35 = 1,1% — Ca²⁺ = 0,40/35 = 1,1%
const MG_FRACTION = 0.036
const K_FRACTION  = 0.011
const CA_FRACTION = 0.011
// Prix sels solubles (MgSO₄/MgCl₂, KCl, CaCl₂) — non métal pur (USGS 2024)
const MG_PRICE = 200   // MgSO₄ industriel : ~150–400 $/t
const K_PRICE  = 300   // KCl (potasse) : ~300–383 $/t (USGS 2024)
const CA_PRICE = 100   // CaCl₂ industriel : ~200–450 $/t (bas de fourchette)

// NOTE: 2_000 m³/km²/an = heuristique d'impact (non agronomique)
const ARABLE_WATER_REQ = 2_000

const LIFESPAN_MIN_BASE = 20
const LIFESPAN_MAX_BASE = 50
const LIFESPAN_DESERT_FACTOR = 1.3
const LIFESPAN_HUMID_FACTOR  = 1.0

const HABITABILITY_WITH_RESOURCES: Interval = [5, 20]
const HABITABILITY_WITHOUT: Interval = [20, 50]

// ─── CIRC-01 : Production spiruline ──────────────────────────────────────────
export function calcSpirulineProduction(
  habitableZones: Interval,
  _solarFactor: number,
): { tonnes: Interval; value: Interval } {
  if (habitableZones[0] === 0 && habitableZones[1] === 0) {
    return { tonnes: [0, 0], value: [0, 0] }
  }

  const surfaceHaMin = habitableZones[0] * 100 * SPIRULINE_BASIN_FRACTION
  const surfaceHaMax = habitableZones[1] * 100 * SPIRULINE_BASIN_FRACTION

  const tonnesMin = surfaceHaMin * SPIRULINE_YIELD_MIN
  const tonnesMax = surfaceHaMax * SPIRULINE_YIELD_MAX

  return {
    tonnes: [tonnesMin, tonnesMax],
    value: [tonnesMin * SPIRULINE_PRICE_MIN, tonnesMax * SPIRULINE_PRICE_MAX],
  }
}

// ─── CIRC-02 : Production aquaculture ────────────────────────────────────────
export function calcAquacultureProduction(
  habitableZones: Interval,
): { tonnes: Interval; value: Interval } {
  if (habitableZones[0] === 0 && habitableZones[1] === 0) {
    return { tonnes: [0, 0], value: [0, 0] }
  }

  const surfaceMin = habitableZones[0] * AQUACULTURE_BASIN_FRACTION
  const surfaceMax = habitableZones[1] * AQUACULTURE_BASIN_FRACTION

  const tonnesMin = surfaceMin * AQUACULTURE_YIELD_MIN
  const tonnesMax = surfaceMax * AQUACULTURE_YIELD_MAX

  return {
    tonnes: [tonnesMin, tonnesMax],
    value: [tonnesMin * AQUACULTURE_PRICE_MIN, tonnesMax * AQUACULTURE_PRICE_MAX],
  }
}

// ─── CIRC-03 : Extraction minéraux/engrais ────────────────────────────────────
export function calcMineralExtraction(
  waterProductionMinDaily: number,
  _solarFactor: number,
): { mgTonnes: Interval; kTonnes: Interval; caTonnes: Interval; value: Interval } {
  if (waterProductionMinDaily === 0) {
    return { mgTonnes: [0, 0], kTonnes: [0, 0], caTonnes: [0, 0], value: [0, 0] }
  }

  const saltMassKgMin = waterProductionMinDaily * 365 * BRINE_SALT_CONCENTRATION
  const saltMassKgMax = saltMassKgMin * 1.2

  const mgMin = (saltMassKgMin * MG_FRACTION) / 1000
  const mgMax = (saltMassKgMax * MG_FRACTION) / 1000
  const kMin  = (saltMassKgMin * K_FRACTION) / 1000
  const kMax  = (saltMassKgMax * K_FRACTION) / 1000
  const caMin = (saltMassKgMin * CA_FRACTION) / 1000
  const caMax = (saltMassKgMax * CA_FRACTION) / 1000

  const valueMin = mgMin * MG_PRICE + kMin * K_PRICE + caMin * CA_PRICE
  const valueMax = mgMax * MG_PRICE + kMax * K_PRICE + caMax * CA_PRICE

  return {
    mgTonnes: [mgMin, mgMax],
    kTonnes:  [kMin, kMax],
    caTonnes: [caMin, caMax],
    value: [valueMin, valueMax],
  }
}

// ─── CIRC-04 : Surface agricole potentielle ───────────────────────────────────
export function calcArableLand(waterProductionMinDaily: number): Interval {
  if (waterProductionMinDaily === 0) return [0, 0]

  const base = (waterProductionMinDaily * 365) / ARABLE_WATER_REQ
  return [base * 0.7, base * 1.3]
}

// ─── VIE-01 : Durée de vie estimée ────────────────────────────────────────────
export function calcLifespan(
  _lengthKm: number,
  aridityFactor: number,
): Interval {
  const factor =
    aridityFactor >= 1.0 ? LIFESPAN_DESERT_FACTOR :
    aridityFactor < 0.5  ? LIFESPAN_HUMID_FACTOR  :
    1.0

  return [
    LIFESPAN_MIN_BASE * factor,
    LIFESPAN_MAX_BASE * factor,
  ]
}

// ─── VIE-02 : Timeline habitabilité ──────────────────────────────────────────
export function calcHabitabilityTimeline(
  waterProductionMin: Interval,
  mineralsValue: Interval,
): Interval {
  const hasWater    = waterProductionMin[0] > 0
  const hasMinerals = mineralsValue[0] > 0

  return hasWater && hasMinerals
    ? [...HABITABILITY_WITH_RESOURCES]
    : [...HABITABILITY_WITHOUT]
}

// ─── Orchestrateur principal ──────────────────────────────────────────────────
export function computeCircularAnalysis(
  params: CircularParams,
  desertFeatures: FeatureCollection,
): CircularResult | null {
  if (params.nodes === 0) return null

  const aridityFactor = calcAridityFactor(params.points, desertFeatures)
  const solarFactor = params.points.every(([_lng, lat]) => Math.abs(lat) < 35) ? 1.0 : 0.7

  const spiruline    = calcSpirulineProduction(params.habitableZones, solarFactor)
  const aquaculture  = calcAquacultureProduction(params.habitableZones)
  const minerals     = calcMineralExtraction(params.waterProduction[0], solarFactor)
  const arableLand   = calcArableLand(params.waterProduction[0])
  const lifespan     = calcLifespan(params.lengthKm, aridityFactor)
  const habitability = calcHabitabilityTimeline(params.waterProduction, minerals.value)

  return {
    spirulineTonnes:    spiruline.tonnes,
    spirulineValue:     spiruline.value,
    aquacultureTonnes:  aquaculture.tonnes,
    aquacultureValue:   aquaculture.value,
    mgTonnes:           minerals.mgTonnes,
    kTonnes:            minerals.kTonnes,
    caTonnes:           minerals.caTonnes,
    mineralsValue:      minerals.value,
    arableLandKm2:      arableLand,
    lifespanYears:      lifespan,
    habitabilityYears:  habitability,
  }
}

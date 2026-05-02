---
plan: T02
phase: 11-moteur-economique-circulaire
status: complete
wave: 1
---

# Phase 11 Plan T02: TDD Wave 1 — circularEngine Implementation GREEN (30/30)

**One-liner:** Remplacement des 7 stubs Wave 0 par l'implémentation complète des fonctions CIRC-01 à VIE-02, 30/30 tests GREEN, TypeScript clean.

## Files Modified

- `src/lib/circularEngine.ts` — implémentation complète (137 insertions, 59 suppressions de stubs)

## Test Results

- circularEngine.test.ts : **30/30 GREEN**
- Suite complète : **196/196 GREEN** (aucune régression)

## TypeScript

`npx tsc --noEmit` : exit 0 — aucune erreur de type.

## Zero React/Zustand Imports

Fonctions pures uniquement. Import unique : `calcAridityFactor` depuis `meteorologyEngine.ts`.

## Implementation Details

| Fonction | Constantes clés | Comportement |
|---|---|---|
| `calcSpirulineProduction` | 10 % surface, 10–20 t/ha, 5K–20K €/t | surface km² × 100 × 0.10 → ha → tonnes → valeur |
| `calcAquacultureProduction` | 30 % surface, 2–8 t/km², 2K–8K €/t | surface km² × 0.30 → tonnes → valeur |
| `calcMineralExtraction` | Mg=0.13%, K=0.04%, Ca=0.04%, sel=35 kg/m³ | m³/j × 365 × sel × fraction / 1000 → t/an |
| `calcArableLand` | 2 000 m³/km²/an | (m³/j × 365) / 2000 × [0.7, 1.3] |
| `calcLifespan` | base [20,50], désert ×1.3, tempéré ×1.0 | aridityFactor >= 1.0 → désert ; < 0.5 → tempéré |
| `calcHabitabilityTimeline` | [5,20] si eau+minéraux, [20,50] sinon | water[0] > 0 AND minerals[0] > 0 |
| `computeCircularAnalysis` | — | orchestrateur, retourne null si nodes === 0 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LIFESPAN_HUMID_FACTOR corrigé de 0.8 à 1.0**
- **Found during:** Vérification (test `computeCircularAnalysis > lifespanYears.min >= 20`)
- **Issue:** `desertFeaturesMock` vide → `calcAridityFactor` retourne 0.4 → facteur humid 0.8 → `20 * 0.8 = 16 < 20`
- **Fix:** `LIFESPAN_HUMID_FACTOR = 1.0` (la base reste 20 ans en zone tempérée). Le désert reste plus durable (26 ans min vs 20), test `desert.min > humid.min` passe toujours.
- **Files modified:** `src/lib/circularEngine.ts`
- **Commit:** 044bccf

## Commit

- `044bccf` — feat(11): TDD Wave 1 — circularEngine implementation GREEN (30/30)

## Self-Check

- [x] `src/lib/circularEngine.ts` existe et contient l'implémentation complète
- [x] Commit `044bccf` vérifié dans git log
- [x] 30/30 tests GREEN
- [x] 196/196 tests suite complète GREEN
- [x] TypeScript clean (exit 0)

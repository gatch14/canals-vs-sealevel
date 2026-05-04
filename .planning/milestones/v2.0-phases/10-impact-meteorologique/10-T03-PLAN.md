---
phase: 10-impact-meteorologique
plan: T03
type: execute
wave: 2
depends_on: [T02]
files_modified:
  - src/hooks/useMeteorology.ts
  - src/components/EcologyPanel.tsx
autonomous: true
requirements: [METEO-01, METEO-02, METEO-03, METEO-04, METEO-05]

must_haves:
  truths:
    - "L'utilisateur voit la section Impact météorologique dans EcologyPanel dès qu'un canal est sélectionné"
    - "Évaporation, rayon d'influence, précipitations, refroidissement sont affichés comme intervalles [min, max]"
    - "Le badge de risque est vert (low), orange (moderate) ou rouge (high)"
    - "Le calcul est automatique — aucun toggle utilisateur requis"
    - "Les 138+ tests GREEN sont préservés (useMeteorology.ts non testé directement — hook React)"
  artifacts:
    - path: "src/hooks/useMeteorology.ts"
      provides: "Hook React mémoïsé retournant MeteorologyResult | null"
      exports: ["useMeteorology"]
    - path: "src/components/EcologyPanel.tsx"
      provides: "Section MeteorologySection avec 4 intervalles + badge risque"
      contains: "useMeteorology"
  key_links:
    - from: "src/components/EcologyPanel.tsx"
      to: "src/hooks/useMeteorology.ts"
      via: "import { useMeteorology }"
      pattern: "useMeteorology"
    - from: "src/hooks/useMeteorology.ts"
      to: "src/lib/meteorologyEngine.ts"
      via: "import { computeMeteorologyAnalysis }"
      pattern: "computeMeteorologyAnalysis"
    - from: "src/hooks/useMeteorology.ts"
      to: "src/store/canalStore.ts"
      via: "useCanalStore — selectedCanalId + canals + calcParams"
      pattern: "useCanalStore"
---

<objective>
Créer le hook useMeteorology.ts et étendre EcologyPanel.tsx avec une section météorologique affichant les 5 métriques METEO-01 à METEO-05.

Purpose: Le moteur météo (T02) est pur et testé — T03 le branche sur l'UI existante. Aucune nouvelle entrée SidePanel n'est créée : la section météo s'insère dans l'accordéon EcologyPanel après la section dessalement, cohérente visuellement avec les alertes existantes.

Output: useMeteorology.ts (hook) + EcologyPanel.tsx (étendu avec MeteorologySection).
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/10-impact-meteorologique/10-CONTEXT.md
@.planning/phases/10-impact-meteorologique/10-PATTERNS.md
@.planning/phases/10-impact-meteorologique/10-T02-SUMMARY.md

<interfaces>
<!-- Contrats T01/T02 à consommer. -->

Depuis src/hooks/useDesalination.ts (modèle exact pour useMeteorology.ts) :
```typescript
import { useMemo } from 'react'
import { length, lineString } from '@turf/turf'
import { useCanalStore } from '../store/canalStore'
import desertZones from '../data/desertZones.geojson'
import type { FeatureCollection } from 'geojson'

const DESERT_FEATURES = desertZones as unknown as FeatureCollection

export function useDesalination(): DesalinationResult | null {
  const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
  const canals = useCanalStore((s) => s.canals)

  return useMemo<DesalinationResult | null>(() => {
    const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null  // find() DANS useMemo
    if (!selectedCanal || selectedCanal.points.length < 2) return null

    const line = lineString(selectedCanal.points)
    const lengthKm = length(line, { units: 'kilometers' })
    const solarFactor = calcSolarFactor(selectedCanal.points)

    return computeDesalinationAnalysis(
      { lengthKm, points: selectedCanal.points, solarFactor },
      DESERT_FEATURES,
    )
  }, [selectedCanalId, canals])
}
```

Différence clé useMeteorology vs useDesalination :
- Ajouter `const calcParams = useCanalStore((s) => s.calcParams)` (widthM requis)
- Passer `widthM: calcParams.width` dans MeteorologyParams
- Ajouter `calcParams.width` dans le tableau de dépendances useMemo
- Pas d'état `enabled` dans le store — calcul automatique

Depuis src/types/meteorology.ts (T01) :
```typescript
export type WeatherRisk = 'low' | 'moderate' | 'high'

export interface MeteorologyResult {
  evaporationKm3: Interval     // METEO-01
  influenceRadiusKm: Interval  // METEO-02
  precipitationMmY: Interval   // METEO-03
  coolingDeltaC: Interval      // METEO-04
  weatherRisk: WeatherRisk     // METEO-05
}
```

Depuis src/components/EcologyPanel.tsx (à étendre) :
```typescript
// Helpers disponibles dans le fichier — NE PAS dupliquer :
function formatNumber(n: number, decimals: number = 3): string { ... }
function formatInterval(iv: Interval, unit: string, decimals: number = 3): string { ... }

// Pattern section dessalement (lignes 184–254) — modèle pour MeteorologySection :
{!noCanal && (
  <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
    {/* contenu section */}
  </div>
)}

// Pattern dl/dt/dd par métrique :
<dl className="flex flex-col gap-1 mt-1">
  <div className="flex flex-col gap-[2px]">
    <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Label</dt>
    <dd className="text-[13px] font-semibold text-white">{formatInterval(...)}</dd>
  </div>
</dl>

// Classes badge coloré (cohérent alertes ECO-03/ECO-04) :
// 'low'      → text-green-400
// 'moderate' → text-amber-400
// 'high'     → text-red-400
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Hook useMeteorology.ts</name>
  <files>src/hooks/useMeteorology.ts</files>

  <read_first>
    - src/hooks/useDesalination.ts — modèle exact (pattern useMemo + find() intérieur + DESERT_FEATURES cast)
    - src/lib/meteorologyEngine.ts — vérifier la signature de computeMeteorologyAnalysis
    - src/types/meteorology.ts — vérifier MeteorologyParams et MeteorologyResult
    - src/store/canalStore.ts — vérifier que calcParams.width existe dans le store
  </read_first>

  <action>
    Créer src/hooks/useMeteorology.ts avec le contenu exact suivant :

    ```typescript
    // src/hooks/useMeteorology.ts
    // Hook orchestrateur Phase 10 — lit le canal sélectionné, mémoïse l'analyse météorologique.
    // Pattern identique à useDesalination.ts — useMemo obligatoire, find() à l'intérieur (Pitfall P2).
    // Différence vs useDesalination : calcParams.width requis + pas d'état enabled dans le store.
    import { useMemo } from 'react'
    import { length, lineString } from '@turf/turf'
    import { useCanalStore } from '../store/canalStore'
    import { computeMeteorologyAnalysis } from '../lib/meteorologyEngine'
    import desertZones from '../data/desertZones.geojson'
    import type { FeatureCollection } from 'geojson'
    import type { MeteorologyResult } from '../types/meteorology'

    const DESERT_FEATURES = desertZones as unknown as FeatureCollection

    export function useMeteorology(): MeteorologyResult | null {
      const selectedCanalId = useCanalStore((s) => s.selectedCanalId)
      const canals = useCanalStore((s) => s.canals)
      const calcParams = useCanalStore((s) => s.calcParams)

      return useMemo<MeteorologyResult | null>(() => {
        // find() à l'intérieur du useMemo — ne JAMAIS le sortir (Pitfall P2 / commit aa3826e)
        const selectedCanal = canals.find((c) => c.id === selectedCanalId) ?? null
        if (!selectedCanal || selectedCanal.points.length < 2) return null

        const line = lineString(selectedCanal.points)
        const lengthKm = length(line, { units: 'kilometers' })

        return computeMeteorologyAnalysis(
          { lengthKm, widthM: calcParams.width, points: selectedCanal.points },
          DESERT_FEATURES,
        )
      }, [selectedCanalId, canals, calcParams.width])
    }
    ```
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -E "useMeteorology|error TS" | head -10</automated>
  </verify>

  <acceptance_criteria>
    - `src/hooks/useMeteorology.ts` contient `export function useMeteorology(): MeteorologyResult | null`
    - `src/hooks/useMeteorology.ts` contient `const selectedCanal = canals.find` à l'intérieur du callback `useMemo` (après `return useMemo`, avant `}, [`)
    - `src/hooks/useMeteorology.ts` contient `}, [selectedCanalId, canals, calcParams.width]` (3 dépendances useMemo)
    - `src/hooks/useMeteorology.ts` contient `const DESERT_FEATURES = desertZones as unknown as FeatureCollection`
    - `npx tsc --noEmit` se termine sans erreur TypeScript sur ce fichier
  </acceptance_criteria>

  <done>useMeteorology.ts créé — hook mémoïsé avec find() à l'intérieur du useMemo, 3 dépendances, TypeScript clean.</done>
</task>

<task type="auto">
  <name>Task 2: Étendre EcologyPanel.tsx avec MeteorologySection</name>
  <files>src/components/EcologyPanel.tsx</files>

  <read_first>
    - src/components/EcologyPanel.tsx — LIRE ENTIÈREMENT avant de modifier (état courant du fichier)
    - src/hooks/useMeteorology.ts — créé en Task 1 (signature useMeteorology)
    - src/types/meteorology.ts — vérifier WeatherRisk et MeteorologyResult
    - .planning/phases/10-impact-meteorologique/10-PATTERNS.md — Section EcologyPanel patterns (classes Tailwind exactes)
  </read_first>

  <action>
    Ajouter la section météorologique dans src/components/EcologyPanel.tsx.

    Modifications à apporter dans l'ordre :

    1. Ajouter l'import du hook météo après la ligne `import { useDesalination } from '../hooks/useDesalination'` :
    ```typescript
    import { useMeteorology } from '../hooks/useMeteorology'
    import type { WeatherRisk } from '../types/meteorology'
    ```

    2. Ajouter l'appel hook dans le corps du composant EcologyPanel(), après la ligne `const desalinationResult = useDesalination()` :
    ```typescript
    const meteorologyResult = useMeteorology()
    ```

    3. Ajouter les constantes de badge AVANT le return du composant (après les constantes existantes, avant le JSX) :
    ```typescript
    const WEATHER_RISK_COLORS: Record<WeatherRisk, string> = {
      low: 'text-green-400',
      moderate: 'text-amber-400',
      high: 'text-red-400',
    }
    const WEATHER_RISK_LABELS: Record<WeatherRisk, string> = {
      low: 'Faible',
      moderate: 'Modéré',
      high: 'Élevé',
    }
    ```

    4. Ajouter la section MeteorologySection APRÈS la section dessalement existante (après la div `{!noCanal && ( ... dessalement ... )}`) et AVANT la balise fermante `</div>` du bloc `{isOpen && (`.

    La section à insérer :
    ```tsx
    {/* Section météorologique — calcul automatique (pas de toggle) — METEO-01 à METEO-05 */}
    {!noCanal && meteorologyResult && (
      <div className="border-t border-white/[0.06] mt-2 pt-2 px-4 pb-3 flex flex-col gap-2">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider">
          Impact m&eacute;t&eacute;orologique
        </p>
        <dl className="flex flex-col gap-1">
          {/* METEO-01 : Évaporation */}
          <div className="flex flex-col gap-[2px]">
            <dt className="text-[11px] text-gray-500 uppercase tracking-wider">&Eacute;vaporation</dt>
            <dd className="text-[13px] font-semibold text-white">
              {formatInterval(meteorologyResult.evaporationKm3, 'km³/an', 4)}
            </dd>
          </div>

          {/* METEO-02 : Rayon d'influence */}
          <div className="flex flex-col gap-[2px]">
            <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Rayon d&apos;influence</dt>
            <dd className="text-[13px] font-semibold text-white">
              {formatInterval(meteorologyResult.influenceRadiusKm, 'km', 0)}
            </dd>
          </div>

          {/* METEO-03 : Précipitations induites */}
          <div className="flex flex-col gap-[2px]">
            <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Pr&eacute;cipitations induites</dt>
            <dd className="text-[13px] font-semibold text-white">
              {formatInterval(meteorologyResult.precipitationMmY, 'mm/an', 1)}
            </dd>
          </div>

          {/* METEO-04 : Refroidissement local */}
          <div className="flex flex-col gap-[2px]">
            <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Refroidissement local</dt>
            <dd className="text-[13px] font-semibold text-white">
              {formatInterval(meteorologyResult.coolingDeltaC, '°C', 1)}
            </dd>
          </div>

          {/* METEO-05 : Badge risque météorologique */}
          <div className="flex flex-col gap-[2px]">
            <dt className="text-[11px] text-gray-500 uppercase tracking-wider">Risque m&eacute;t&eacute;o</dt>
            <dd className={`text-[13px] font-semibold ${WEATHER_RISK_COLORS[meteorologyResult.weatherRisk]}`}>
              {WEATHER_RISK_LABELS[meteorologyResult.weatherRisk]}
            </dd>
          </div>
        </dl>
      </div>
    )}
    ```

    Règles à respecter :
    - Ne pas modifier les sections existantes (écologie, dessalement)
    - Ne pas dupliquer formatInterval ou formatNumber — ils sont déjà définis dans le fichier
    - La section météo est conditionnelle : s'affiche seulement si `!noCanal && meteorologyResult !== null`
    - Pas de toggle bouton — le calcul est automatique (différence vs dessalement)
    - Insérer juste avant la balise `</div>` qui ferme le bloc `{isOpen && (`
  </action>

  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx tsc --noEmit 2>&1 | grep -E "EcologyPanel|error TS" | head -10</automated>
  </verify>

  <acceptance_criteria>
    - `src/components/EcologyPanel.tsx` contient `import { useMeteorology } from '../hooks/useMeteorology'`
    - `src/components/EcologyPanel.tsx` contient `const meteorologyResult = useMeteorology()`
    - `src/components/EcologyPanel.tsx` contient `meteorologyResult.evaporationKm3` (affichage METEO-01)
    - `src/components/EcologyPanel.tsx` contient `meteorologyResult.influenceRadiusKm` (affichage METEO-02)
    - `src/components/EcologyPanel.tsx` contient `meteorologyResult.precipitationMmY` (affichage METEO-03)
    - `src/components/EcologyPanel.tsx` contient `meteorologyResult.coolingDeltaC` (affichage METEO-04)
    - `src/components/EcologyPanel.tsx` contient `WEATHER_RISK_COLORS[meteorologyResult.weatherRisk]` (badge METEO-05)
    - `src/components/EcologyPanel.tsx` contient `text-green-400` et `text-amber-400` et `text-red-400` (3 couleurs badge)
    - `src/components/EcologyPanel.tsx` ne contient PAS de doublon de `function formatInterval` (helper existant réutilisé)
    - `npx tsc --noEmit` se termine sans erreur TypeScript
    - `npm test` affiche 0 failing (tous les tests restent GREEN — les hooks React ne sont pas testés directement)
  </acceptance_criteria>

  <done>EcologyPanel.tsx étendu avec section météorologique — 5 métriques METEO-01 à METEO-05, badge coloré, TypeScript clean, tous les tests GREEN.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Store Zustand → useMeteorology | calcParams.width peut être 0 (état initial) — surfaceKm2 = 0 → evaporation [0,0] → section masquée |
| EcologyPanel → useMeteorology | meteorologyResult === null si aucun canal sélectionné — condition !noCanal && meteorologyResult protège |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-10-04 | Tampering | useMeteorology | mitigate | Guard dans computeMeteorologyAnalysis : points.length < 2 → null → section non affichée |
| T-10-05 | Information Disclosure | EcologyPanel | accept | Données calculées en local (client-side) — aucune donnée sensible exposée |
</threat_model>

<verification>
```bash
cd /c/dev/gsd/science/canal
npm test 2>&1 | tail -5
npx tsc --noEmit 2>&1 | grep -c "error"   # doit retourner 0
npm run dev &
# Vérification manuelle : sélectionner un canal → section "Impact météorologique" apparaît
# Badge : vert pour canal court (<500 km), rouge pour canal désertique long (>1500 km)
```
</verification>

<success_criteria>
- useMeteorology.ts créé avec find() dans useMemo et 3 dépendances (selectedCanalId, canals, calcParams.width)
- EcologyPanel.tsx affiche les 5 métriques METEO-01 à METEO-05 sans toggle utilisateur
- Badge de risque : vert (low) / orange (moderate) / rouge (high)
- Tous les tests GREEN (138+ tests) — zéro régression
- npx tsc --noEmit clean
</success_criteria>

<output>
Après complétion, créer `.planning/phases/10-impact-meteorologique/10-T03-SUMMARY.md`
</output>

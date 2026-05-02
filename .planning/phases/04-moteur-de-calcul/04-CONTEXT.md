# Phase 4: Moteur de Calcul - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Cette phase délivre le moteur de calcul scientifique complet : l'utilisateur saisit largeur et profondeur d'un canal sélectionné, et obtient immédiatement volume (km³), ΔSL (mm), coût estimé (€) et comparaison avec le rythme IPCC — tous affichés comme intervalles [min, max]. Si le canal a des segments rouges (gravitairement impossibles), l'impact partiel est calculé automatiquement jusqu'au premier obstacle.

</domain>

<decisions>
## Implementation Decisions

### Paramètres de saisie
- Formulaire largeur/profondeur dans SidePanel, accordéon "Calcul d'impact" sous ElevationPanel — cohérence avec le pattern existant
- Inputs numériques textuels avec unité affichée (m) — pas de sliders
- Valeurs par défaut : 50m × 5m (canal fluvial standard) — ordre de grandeur concret dès l'ouverture
- Paramètres globaux partagés entre tous les canaux — simplifie l'UI, compare des canaux à dimensions égales

### Affichage des résultats
- Panel accordéon "Calcul d'impact" dans SidePanel — même pattern qu'ElevationPanel
- Format des intervalles : texte structuré `[X – Y] km³` avec label clair
- Indicateur % IPCC : barre de progression fine + texte "N–M% du rythme annuel (4,5 mm/an)"
- Ordre d'affichage : Volume → ΔSL → % IPCC → Coût — du plus physique au plus appliqué

### Classification terrain & coût
- Automatique depuis les données d'élévation : variance altimétrique par segment → plaine/mixte/montagne
- Seuils : Δalt < 50m/km → plaine (1–5 M€/km) · 50–200m/km → mixte (10–50 M€/km) · >200m/km → montagne (100–500 M€/km)
- Afficher la décomposition "%km plaine / %km mixte / %km montagne" — éducatif et transparent
- Propagation min/max par segment typé → fourchette totale stricte — respecte UX-01

### Impact partiel (CALC-05)
- Déclenchement automatique si canal a des segments rouges — section conditionnelle dans le panel
- Longueur réalisable = jusqu'au premier segment rouge continu (> seuil 10%) — simple et conservateur
- Affichage : sous-section "Si arrêté au km X : ΔSL partiel = [Y–Z] mm"
- Marker visuel sur la carte au point d'arrêt estimé (MapLibre marker ou ligne pointillée)

### Claude's Discretion
- Format exact des nombres grands (ex: 1 234 567 M€ vs 1,2 B€) — choisir le plus lisible
- Gestion cas limite : canal sans élévation chargée (pas encore de profil), canal trop court (<1km), largeur/profondeur à 0
- Micro-animations (si panel calc ouvert) ou transition statique

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ElevationPanel.tsx` — pattern accordéon exact à dupliquer pour `CalculationPanel.tsx`
- `useCanalStore` (Zustand) — étendre avec `calcParams: { width: number; depth: number }` et actions `setCalcParams`
- `canal.ts` type — étendre avec `calculation?: CalculationResult` ou calculer à la volée depuis les params globaux
- `ElevationChart.tsx` / profil d'élévation — les données `UphillSegments` sont déjà disponibles pour la classification terrain
- `SidePanel.tsx` — ajouter `<CalculationPanel />` après `<ElevationPanel />`

### Established Patterns
- Zustand store avec actions atomiques — pattern confirmé Phases 1, 2, 3
- Dark theme Tailwind — palette établie (bg-gray-900, text-gray-300, #3B82F6 bleu, #EF4444 rouge)
- Accordéon avec état local `isOpen` + auto-open quand canal sélectionné
- Hauteur fixe pour les panels pour éviter layout shift
- Coordonnées [lng, lat] WGS84 — convention stricte
- UX-01 stricte : JAMAIS de valeur ponctuelle, TOUJOURS intervalles [min, max]

### Integration Points
- `elevation.ts` types — `UphillSegment[]` déjà dans `ElevationProfile`, utilisable pour classification terrain
- `canal.ts` — formule centrale : `ΔSL (mm) = Volume (km³) / 361.8`
- Nouveau fichier `src/lib/calculationEngine.ts` — logique pure (pas de React), testable unitairement
- Nouveau hook `useCalculation.ts` — orchestre calculs + params globaux
- MapLibre markers — pour le point d'arrêt partiel sur la carte

</code_context>

<specifics>
## Specific Ideas

- La formule centrale `ΔSL (mm) = Volume (km³) / 361,8` est un principe non-négociable du projet
- UX-01 est absolue : toutes les valeurs numériques en intervalles [min, max] — même le volume, même la longueur
- L'indicateur Qattara Depression (2,76 mm) doit rester visible comme référence d'ordre de grandeur
- Les calculs doivent être "défendables mais pas publiables dans Nature" — fourchettes larges préférées à fausse précision

</specifics>

<deferred>
## Deferred Ideas

- Paramètres par canal individuel (override des dims globales) → v2
- Export PDF du rapport de calcul → v2 requirements
- Comparaison côte-à-côte de deux canaux → v2
- Calculs hydrologiques de précision (évaporation, absorption nappes) → v2

</deferred>

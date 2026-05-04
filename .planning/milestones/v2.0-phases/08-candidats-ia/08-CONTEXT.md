# Phase 8: Candidats IA - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Cette phase ajoute une bibliothèque de canaux mondiaux pré-calculés (25 candidats) chargeable en un clic depuis le panneau latéral. Les données sont entièrement bundlées dans un fichier JSON statique — zéro appel réseau. L'utilisateur peut explorer les candidats triés par ΔSL décroissant, voir leurs métadonnées, et charger un tracé directement sur la carte où tous les calculs existants s'appliquent automatiquement.

</domain>

<decisions>
## Implementation Decisions

### Panneau UI
- Placé en Section 8 dans SidePanel, après ClearDataButton — suit l'ordre logique existant
- Accordéon collapsé par défaut — cohérent avec EcologyPanel et DashboardPanel
- Items compacts : nom + région + ΔSL estimé sur 1–2 lignes, expand pour détails complets
- Tri par ΔSL décroissant uniquement (ROADMAP spec) — pas de filtre région en v1

### Comportement de chargement
- Charger un candidat s'ajoute à la liste existante (non destructif) — permet de comparer
- Canal chargé automatiquement sélectionné — cohérent avec finalizeCanal
- Points du tracé pré-calculés stockés dans le JSON — zéro appel réseau (contrainte absolue)
- Panneaux calcul/écologie ne s'ouvrent pas automatiquement — l'utilisateur déroule ce qu'il veut

### Structure des données JSON
- Fichier : src/data/candidates.json (nouveau dossier data dédié)
- 25 candidats — dans les bornes ROADMAP (20–30), représentatif mondialement
- Champs par candidat : id, name, region, dsl_min, dsl_max, points (Coord[]), feasible (bool), cost_min, cost_max

### Claude's Discretion
- Sélection des 25 candidats mondiaux (avec Qattara Depression, Sahara canaux, Atacama, etc.)
- Valeurs ΔSL/coût à calculer avec la formule ΔSL = V/361.8 et les formules coût existantes
- Composants : CandidatesPanel.tsx + CandidateListItem.tsx en suivant le pattern EcologyPanel
- Type CanalCandidate dans src/types/candidate.ts ou inline

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- EcologyPanel.tsx (180 lignes) — modèle d'accordéon : useState isOpen, ChevronDown, pattern collapsible
- DashboardPanel.tsx (152 lignes) — même pattern accordéon, référence pour Section 6
- CanalListItem.tsx — pattern d'item de liste compacte avec sélection
- useCanalStore — actions finalizeCanal, hydrateCanals, deleteCanal, selectCanal
- StoredCanal/Canal types depuis src/types/canal.ts — Canal.points: Coord[] utilisable directement
- calculationEngine, ecologyEngine déjà disponibles — calculs s'appliquent automatiquement dès que le canal est sélectionné

### Established Patterns
- Accordéon : useState(false) isOpen + button avec ChevronDown rotate + div conditionnel
- Store pattern : useCanalStore((s) => s.xxx) pour chaque sélecteur
- Tailwind dark theme : bg-gray-800, border-white/[0.08], text-gray-400, text-white
- Intervalles : `[min – max] unité` avec em-dash (UX-01)
- Icônes : lucide-react (ChevronDown, AlertCircle, etc.)

### Integration Points
- SidePanel.tsx : ajouter import + `<CandidatesPanel />` en Section 8 après `<ClearDataButton />`
- canalStore.ts : utiliser finalizeCanal (ou action similaire) pour ajouter le canal chargé
- src/data/ : nouveau dossier pour candidates.json
- src/types/ : nouveau type CanalCandidate

</code_context>

<specifics>
## Specific Ideas

- La Dépression de Qattara (Égypte) doit être incluse en candidat #1 — référence explicite dans CanalList.tsx ("Qattara Depression = 2,76 mm de baisse si remplie")
- Les valeurs ΔSL doivent être affichées comme intervalles [min, max] mm — jamais valeur ponctuelle (UX-01 verrouillé)
- Les 25 candidats doivent couvrir tous les continents habités pour illustration mondiale

</specifics>

<deferred>
## Deferred Ideas

- Filtre par région ou faisabilité gravitaire — déféré à une version ultérieure si besoin
- Auto-ouverture des panneaux calcul/écologie lors du chargement — déféré
- Pré-calcul données écologie dans le JSON — déféré (l'écologie se calcule en live au chargement)

</deferred>

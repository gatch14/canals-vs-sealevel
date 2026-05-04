---
phase: 01-map-shell-trac
plan: T01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - vite.config.ts
  - tsconfig.json
  - tsconfig.app.json
  - index.html
  - src/main.tsx
  - src/index.css
  - src/types/canal.ts
  - src/store/canalStore.ts
  - src/store/canalStore.test.ts
autonomous: true
requirements:
  - MAP-01
  - MAP-02

must_haves:
  truths:
    - "npm install puis npm run dev démarre l'app sans erreur ni clé API"
    - "npx vitest run passe toute la suite canalStore.test.ts (5 tests verts)"
    - "Le store Zustand accepte addWaypoint, finalizeCanal, cancelDrawing, deleteCanal"
    - "finalizeCanal est no-op si draftPoints < 2"
    - "Les types Canal et Coord sont exportés depuis src/types/canal.ts"
  artifacts:
    - path: "package.json"
      provides: "Dépendances du projet"
      contains: "maplibre-gl"
    - path: "vite.config.ts"
      provides: "Config Vite avec plugin Tailwind CSS v4 et Vitest jsdom"
      contains: "tailwindcss"
    - path: "src/types/canal.ts"
      provides: "Types Canal, Coord, UIMode"
      exports: ["Canal", "Coord", "UIMode"]
    - path: "src/store/canalStore.ts"
      provides: "Store Zustand useCanalStore"
      exports: ["useCanalStore"]
    - path: "src/store/canalStore.test.ts"
      provides: "Suite Vitest pour les 5 comportements MAP-02"
      contains: "finalizeCanal"
  key_links:
    - from: "src/store/canalStore.ts"
      to: "src/types/canal.ts"
      via: "import type { Canal, Coord, UIMode }"
      pattern: "import type.*canal"
    - from: "src/store/canalStore.test.ts"
      to: "src/store/canalStore.ts"
      via: "import { useCanalStore }"
      pattern: "useCanalStore"
---

<objective>
Scaffolding complet du projet greenfield : initialisation Vite + React + TypeScript, installation de toutes les dépendances, configuration Tailwind CSS v4 + Vitest, création des types de données Canal et du store Zustand useCanalStore, suite de tests unitaires pour MAP-02.

Purpose: Establir la fondation technique que MapView (T02) et les composants UI (T03) consomment. Sans ce plan, rien ne peut être construit.

Output: Projet installable (`npm install + npm run dev` fonctionne), store Zustand avec logique métier testée, types exportés prêts pour les plans suivants.
</objective>

<execution_context>
@C:/Users/gatch/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/gatch/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-map-shell-trac/01-CONTEXT.md
@.planning/phases/01-map-shell-trac/01-RESEARCH.md
@.planning/phases/01-map-shell-trac/01-PATTERNS.md

<interfaces>
<!-- Contrats que les plans T02 et T03 consommeront. À créer dans ce plan. -->

src/types/canal.ts (à créer) :
```typescript
export type Coord = [number, number]  // [lng, lat] WGS84 — JAMAIS [lat, lng]
export type UIMode = 'selection' | 'drawing'
export interface Canal {
  id: string             // crypto.randomUUID()
  points: Coord[]        // minimum 2 points pour finaliser
  name: string           // "Canal 1", "Canal 2", ...
  createdAt: number      // Date.now()
}
```

src/store/canalStore.ts (à créer) :
```typescript
// Actions exportées via useCanalStore
startDrawing: () => void
addWaypoint: (coord: Coord) => void
updatePreview: (coord: Coord) => void
finalizeCanal: () => void      // no-op si draftPoints.length < 2
cancelDrawing: () => void
deleteCanal: (id: string) => void
selectCanal: (id: string | null) => void
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Scaffold Vite + dépendances + config Tailwind CSS v4 + Vitest</name>
  <read_first>
    .planning/phases/01-map-shell-trac/01-RESEARCH.md (Standard Stack, Pitfalls, Patterns Tailwind v4)
  </read_first>
  <files>
    package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, index.html, src/main.tsx, src/index.css
  </files>
  <behavior>
    - npm run dev démarre sans erreur (exit code 0)
    - npx vitest run ne crash pas (configuration valide jsdom)
    - @import 'tailwindcss' dans index.css active les classes Tailwind dans le navigateur
  </behavior>
  <action>
Créer le projet Vite React-TypeScript et configurer toutes les dépendances.

**Étape 1 — Scaffold Vite :**
```bash
cd /c/dev/gsd/science/canal
npm create vite@latest . -- --template react-ts
```
(Le projet existe déjà si la commande échoue — passer à l'étape 2.)

**Étape 2 — Installer les dépendances :**
```bash
npm install maplibre-gl zustand lucide-react
npm install -D tailwindcss @tailwindcss/vite vitest @vitest/ui jsdom
```
Note : `@types/maplibre-gl` n'est PAS nécessaire — MapLibre GL JS v5 inclut ses types natifs.

**Étape 3 — vite.config.ts :**
Remplacer le contenu par exactement :
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

**Étape 4 — src/index.css :**
Remplacer tout le contenu par :
```css
@import 'tailwindcss';
@import 'maplibre-gl/dist/maplibre-gl.css';
```
Ne pas conserver les styles Vite par défaut (reset, :root, etc.).

**Étape 5 — src/main.tsx :**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Étape 6 — src/App.tsx (placeholder minimal) :**
```typescript
export default function App() {
  return <div className="h-screen w-screen bg-gray-900" />
}
```
(Sera remplacé en T03 avec le layout complet.)

**Étape 7 — index.html :**
Vérifier que le titre est `Canal Explorer` :
```html
<title>Canal Explorer</title>
```

**Étape 8 — Supprimer les fichiers Vite par défaut inutiles :**
Supprimer (si présents) : `src/App.css`, `public/vite.svg`, `src/assets/react.svg`
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx vitest run --reporter=verbose 2>&1 | head -20</automated>
  </verify>
  <done>
    - package.json contient "maplibre-gl", "zustand", "lucide-react", "tailwindcss", "@tailwindcss/vite", "vitest"
    - vite.config.ts contient "tailwindcss" et `environment: 'jsdom'`
    - src/index.css contient "@import 'tailwindcss'" et "@import 'maplibre-gl/dist/maplibre-gl.css'"
    - npx vitest run ne produit pas d'erreur de configuration
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Types Canal + Store Zustand useCanalStore + Suite de tests</name>
  <read_first>
    .planning/phases/01-map-shell-trac/01-PATTERNS.md (Pattern `src/types/canal.ts`, Pattern `src/store/canalStore.ts`, Pattern `src/store/canalStore.test.ts`)
    .planning/phases/01-map-shell-trac/01-RESEARCH.md (Pattern 3: Store Zustand)
  </read_first>
  <files>
    src/types/canal.ts, src/store/canalStore.ts, src/store/canalStore.test.ts
  </files>
  <behavior>
    - addWaypoint([2.35, 48.85]) ajoute exactement [2.35, 48.85] à draftPoints
    - finalizeCanal() avec 2 points crée 1 canal, mode revient à 'selection', draftPoints = []
    - finalizeCanal() avec 1 seul point est un no-op : canals reste [], mode reste 'drawing'
    - cancelDrawing() réinitialise draftPoints à [] et mode à 'selection'
    - deleteCanal(id) retire le canal et désélectionne si selectedCanalId === id
  </behavior>
  <action>
Créer les 3 fichiers dans l'ordre : types → store → tests.

**Étape 1 — src/types/canal.ts :**
```typescript
// Coordonnées toujours [lng, lat] WGS84 — JAMAIS [lat, lng] (Pitfall 10)
export type Coord = [number, number]

export type UIMode = 'selection' | 'drawing'

export interface Canal {
  id: string             // crypto.randomUUID()
  points: Coord[]        // minimum 2 points pour finaliser
  name: string           // "Canal 1", "Canal 2", ...
  createdAt: number      // Date.now()
}
```

**Étape 2 — src/store/canalStore.ts :**
Implémenter exactement le pattern du PATTERNS.md (disponible dans le fichier lu en read_first). Points critiques :
- `import { create } from 'zustand'`
- `import type { Canal, Coord, UIMode } from '../types/canal'`
- State initial : `{ canals: [], mode: 'selection', draftPoints: [], previewCoord: null, selectedCanalId: null }`
- `finalizeCanal` : guard `if (draftPoints.length < 2) return` — OBLIGATOIRE
- `finalizeCanal` : `name: \`Canal ${canals.length + 1}\``
- `deleteCanal` : désélectionner si `selectedCanalId === id`
- Ne PAS mettre de référence `mapRef` dans le store

**Étape 3 — src/store/canalStore.test.ts :**
Implémenter exactement le pattern du PATTERNS.md. Points critiques :
- `import { describe, it, expect, beforeEach } from 'vitest'`
- `beforeEach(() => { useCanalStore.setState({ canals: [], mode: 'selection', draftPoints: [], previewCoord: null, selectedCanalId: null }) })`
- 5 tests couvrant : addWaypoint, finalizeCanal >= 2, finalizeCanal < 2 (no-op), cancelDrawing, deleteCanal

**Étape 4 — Lancer les tests :**
```bash
cd /c/dev/gsd/science/canal && npx vitest run src/store/canalStore.test.ts --reporter=verbose
```
Tous les tests doivent être verts avant de terminer ce plan.
  </action>
  <verify>
    <automated>cd /c/dev/gsd/science/canal && npx vitest run src/store/canalStore.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - src/types/canal.ts existe et exporte Canal, Coord, UIMode
    - src/store/canalStore.ts existe et exporte useCanalStore
    - grep -c "finalizeCanal" src/store/canalStore.ts retourne >= 1
    - grep "draftPoints.length < 2" src/store/canalStore.ts trouve la garde obligatoire
    - npx vitest run src/store/canalStore.test.ts — 5 tests passent, 0 échec
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user interaction → MapLibre events | Les clics utilisateur génèrent des coordonnées via MapLibre — source fiable (Pitfall 5 : les coordonnées viennent de e.lngLat, toujours des nombres valides) |
| canal.name → JSX render | Les noms de canaux sont affichés dans le DOM via React |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering | src/store/canalStore.ts | accept | Coordonnées viennent de MapLibre e.lngLat (toujours valides numériquement) — pas de saisie texte libre en Phase 1 |
| T-01-02 | Tampering | canal.name dans JSX | mitigate | React échappe automatiquement les valeurs JSX — `{canal.name}` est safe sans sanitisation explicite |
| T-01-03 | Denial of Service | draftPoints array | accept | Array en mémoire — aucun utilisateur malveillant (app locale), aucun envoi réseau |
</threat_model>

<verification>
1. `cd /c/dev/gsd/science/canal && npm install` — exit code 0
2. `npx vitest run src/store/canalStore.test.ts` — 5 tests verts
3. `grep -c "maplibre-gl" package.json` — retourne 1
4. `grep "draftPoints.length < 2" src/store/canalStore.ts` — ligne trouvée
5. `grep "Coord = \[number, number\]" src/types/canal.ts` — ligne trouvée
</verification>

<success_criteria>
- npm install se termine sans erreur
- 5 tests Vitest passent (addWaypoint, finalizeCanal ×2, cancelDrawing, deleteCanal)
- types/canal.ts exporte Canal, Coord, UIMode avec [lng, lat] WGS84
- store Zustand a la garde finalizeCanal < 2 points
- vite.config.ts configure Tailwind CSS v4 + Vitest jsdom
</success_criteria>

<output>
Après completion, créer `.planning/phases/01-map-shell-trac/01-T01-SUMMARY.md`
</output>

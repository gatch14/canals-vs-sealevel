# UI-SPEC — Phase 7: Persistance Locale

**Mode:** Auto-generated (autonomous, minimal UI phase)
**Date:** 2026-05-02
**Status:** Ready for planning

---

## Phase UI Scope

Phase 7 est principalement une couche de persistance (IndexedDB via Dexie.js). L'impact UI est **minimal** :
- La restauration des données au démarrage est transparente (aucune nouvelle UI)
- Un seul composant UI ajouté : bouton "Effacer toutes les données" dans le SidePanel

---

## Design System (existant)

- **Couleurs** : fond `rgba(26, 26, 46, 0.95)` — texte blanc/grisé — accents purple/rouge
- **Typographie** : Tailwind CSS v4 — `text-xs`, `text-sm` pour les labels de panneau
- **Composant dialog** : `DeleteConfirmDialog` existant — réutiliser le même pattern
- **Border** : `border-white/[0.08]` entre sections du SidePanel

---

## Composant : ClearDataButton (dans SidePanel)

### Emplacement
Footer du SidePanel, section distincte après DashboardPanel — séparée par `border-t border-white/[0.08]`

### Apparence
```
┌─────────────────────────────┐
│  [🗑] Effacer les données    │  ← texte rouge pâle (text-red-400), petit (text-xs)
│      Supprimer tous les     │
│      canaux et paramètres   │  ← sous-texte gris (text-white/40)
└─────────────────────────────┘
```

- Bouton : `px-3 py-2 rounded text-xs text-red-400 hover:bg-red-950/30 transition-colors`
- Icône : Trash2 de lucide-react (cohérent avec DeleteConfirmDialog)
- Discret par défaut, rouge au hover

### Dialog de confirmation
Réutiliser le pattern `DeleteConfirmDialog` existant :
- Titre : "Effacer toutes les données"
- Message : "Cette action supprimera tous vos canaux et paramètres. Cette action est irréversible."
- Bouton confirmer : rouge destructif
- Bouton annuler : neutre

### État après effacement
- Feedback visuel bref : message dans le SidePanel `text-xs text-green-400` pendant ~2s : "Données effacées"
- Le store Zustand est réinitialisé → la carte devient vide automatiquement

---

## Loading State au démarrage

- Pendant la lecture de IndexedDB (< 100ms typiquement), afficher un indicateur minimal
- Ou : afficher l'app normalement — la restauration est quasi-instantanée pour des données légères
- **Recommandé** : pas d'écran de chargement visible — hydration silencieuse avant premier rendu

---

## Accessibilité

- `aria-label` sur le bouton de suppression
- Focus ring sur le bouton (cohérent avec le reste de l'app)
- Dialog avec focus trap (si DeleteConfirmDialog l'a déjà — oui, pattern existant)

---

## Ce qui NE change PAS

- MapView, CalculationPanel, EcologyPanel, DashboardPanel — aucune modification UI
- ElevationChart — aucune modification
- La persistance est transparente pour l'utilisateur sauf pour le bouton d'effacement

---

*Phase: 07-persistance-locale — UI-SPEC auto-generated 2026-05-02*

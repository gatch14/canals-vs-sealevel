# Milestones

## v3.0 Économie Circulaire & ROI (Shipped: 2026-05-02)

**Phases completed:** 13 phases, 38 plans, 38 tasks

**Key accomplishments:**

- Service Dexie singleton (db.ts), actions clearAll/hydrateCanals dans le store Zustand, hook usePersistence.ts avec hydration au montage et subscribe sync — 101/101 tests GREEN
- ClearDataButton.tsx avec dialog de confirmation (pattern DeleteConfirmDialog), usePersistence() monté dans SidePanel — Phase 7 entièrement fonctionnelle (PERS-01 + PERS-02 + PERS-03)
- One-liner
- One-liner
- One-liner
- Contrat de données dessalement verrouillé : types DesalinationResult/DesalinationParams, 8 fonctions pures stubées, et 31 tests RED couvrant ECO-05 + DESAL-01 à DESAL-05
- Moteur de dessalement pur implémenté : 6 fonctions pures + calcSolarFactor utilisant booleanIntersects Turf.js sur desertZones.geojson, intervalles [min, max] UX-01, 31 tests GREEN sans régression
- Toggle dessalement câblé dans EcologyPanel avec alerte ECO-05, hook useDesalination (useMemo), store Zustand étendu, et SidePanel wiring — 138/138 tests GREEN
- One-liner:
- One-liner:
- `src/hooks/useROI.ts`
- EconomicPanel.tsx — accordéon "Économie & ROI" 4 états exposant la chaîne de valeur complète (KPI break-even, 6 co-produits circulaires, ROI@25/50/100 ans, tableau comparatif multi-canaux)
- EconomicPanel intégré dans SidePanel.tsx à la position finale (après CandidatesPanel, avant ClearDataButton) — réalisé en Wave 1, Wave 2 confirme l'état et valide les critères

---

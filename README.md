# Canals vs Sea Level

A scientific web app exploring whether a global network of canals could counter rising sea levels.

Draw canals on a world map, calculate their real impact on ocean levels, analyze ecological effects, and compare the results against IPCC 2100 projections — all running locally in your browser, no server required.

![Canal tracing with elevation profile and impact calculation](https://raw.githubusercontent.com/gatch14/canals-vs-sealevel/master/docs/screenshot.png)

---

## The Concept

The central question: **could we redirect seawater into desert basins and low-lying inland areas to reduce ocean levels?**

The app lets you explore this idea with real topographic data (Copernicus GLO-30 DEM via Open-Meteo), honest scientific estimates, and immediate visual feedback. The short answer: a single canal moves a few millimeters at most. But the tool shows you *exactly* how much, why, and what else it affects.

**Central formula:** `ΔSL (mm) = Canal Volume (km³) / 361.8`  
*(Ocean surface area = 361.8 million km²)*

---

## Getting Started

```bash
git clone https://github.com/gatch14/canals-vs-sealevel.git
cd canals-vs-sealevel
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — that's it. No API keys, no accounts, no configuration.

**Requirements:** Node.js 18+

---

## Features

### Draw Canals
Click anywhere on the world map to place waypoints and trace a canal. Select a canal from the list to inspect it. Delete canals you no longer need.

### Elevation Profile
For each canal, the app fetches real elevation data along the route and displays an altitude (m) vs distance (km) chart. Uphill segments — where gravity would prevent water from flowing — are highlighted in red.

> Uphill segments don't invalidate the canal; they tell you where pumping infrastructure would be needed.

### Optimal Routing
Instead of drawing manually, let the app find the most gravitationally favorable path between two points. A Dijkstra algorithm runs in a Web Worker on real DEM data, minimizing elevation gain so water can flow as naturally as possible.

### Impact Calculation
Enter canal width and depth to get:
- **Volume** (km³) with uncertainty range
- **ΔSL** (mm) — how much this canal would lower the ocean
- **Cost estimate** (€) by terrain type (plain / mixed / mountain)
- **IPCC comparison** — your canal's ΔSL as a % of annual sea-level rise (4.5 mm/year)
- **Partial impact** — if the canal hits an impassable obstacle, the impact up to that point

All values are displayed as **[min – max] intervals**, never as false-precision point values.

### Ecological Analysis
- Desert zones crossed: estimated greening area (km²) and timeline (years)
- Endorheic basin alert: if the canal ends in a closed basin (no ocean outlet), a salinization risk warning is shown — this is irreversible, like what happened to the Aral Sea
- Climate risk flag: introducing water into hot arid zones creates atmospheric pressure gradients that may generate local weather events

### Global Dashboard
With multiple canals drawn:
- **Cumulative ΔSL** across all canals
- **Three scenarios**: optimistic (100% water retained), realistic (60%), pessimistic (30%)
- **IPCC comparison chart**: your canals' realistic impact vs IPCC AR6 2021 projected sea-level rise (300–1000 mm by 2100)

---

## Scientific Honesty

This tool is built around a principle of **honest uncertainty**:

- Every value is a range, not a point estimate
- The IPCC chart uses a linear Y axis — canals typically produce millimeter-scale effects against a 300–1000 mm IPCC projection. The scale difference is the scientific message.
- Elevation data has ±5–15 m inherent error (Copernicus GLO-30). Calculations reflect this.
- This is an order-of-magnitude explorer, not a hydrodynamic simulation. Results are defensible, not publishable.

**The Qattara Depression** (Egypt) is the best known candidate globally: filling it would lower sea levels by approximately 2.76 mm — already annotated on the map.

---

## Architecture

100% client-side — no backend, no database, no API keys required.

| Layer | Technology |
|-------|-----------|
| Map | MapLibre GL JS |
| Framework | React + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Elevation data | Open-Meteo Elevation API (Copernicus GLO-30, free, no auth) |
| Routing | Dijkstra via ngraph.path in Web Worker |
| Charts | recharts |
| Geo calculations | @turf/turf |

---

## Roadmap

**v1.0** (current) — Draw, route, calculate, analyze, dashboard  
**v2.0** (in progress) — Local persistence, pre-computed optimal canal candidates, salt water ecological context, solar desalination nodes, long-term meteorological impact  
**v3.0** (planned) — Full economic model (ROI, break-even), spirulina/aquaculture potential, multi-canal network modeling

---

## License

MIT — see [LICENSE](LICENSE)

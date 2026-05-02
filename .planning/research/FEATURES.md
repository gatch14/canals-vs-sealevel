# FEATURES.md — Feature Analysis: Canal Network Scientific Study App

**Domain:** Scientific geospatial simulation / exploratory hydrology
**Researched:** 2026-04-30
**Overall confidence:** MEDIUM (routing algorithms HIGH, climate impacts MEDIUM, sea level math HIGH, negative risks LOW)

---

## Table Stakes (must-have for v1)

These are the features without which the app cannot answer its core question.
Missing any one of them makes the app a demo, not a tool.

### 1. Interactive World Map with Elevation Layer

**Why:** Every other feature depends on visualizing terrain. The user draws canals on a map; the map must show elevation so routing decisions make visual sense.

**What it requires:**
- MapLibre GL JS as the base renderer (open-source, no API key tax, supports 3D terrain)
- SRTM 30m DEM data served as terrain tiles (NASA/USGS, free, global coverage 56°S–60°N)
- Hillshade + elevation color ramp layer, toggleable
- Smooth pan/zoom, no tile flickering

**Source:** MapLibre supports 3D terrain draped on SRTM tiles natively via `addSource` with terrain type.

---

### 2. Canal Drawing Tool (Manual Route Input)

**Why:** The core interaction. The user must be able to draw a candidate canal route on the map — point A to point B — before anything else can be computed.

**What it requires:**
- Click-to-add waypoints (polyline drawing)
- Drag-to-adjust waypoints
- Delete/reset
- Display total route distance in km

**Design choice:** Manual drawing first, automated routing second. Automated routing is complex (least-cost path on a DEM requires significant compute); manual drawing lets the user test hypotheses immediately.

---

### 3. Terrain Profile / Cross-Section View

**Why:** A canal planner's fundamental need. For any drawn route, show the elevation profile along the route so the user can see where the canal goes uphill (requiring locks or tunnels), downhill (gravity flow), or is flat.

**What it requires:**
- Extract elevation samples from DEM along the drawn polyline (every ~1 km)
- Render as a 2D chart (elevation on Y axis, distance on X axis)
- Highlight segments above sea level vs. below sea level
- Mark maximum elevation point (the "watershed crossing")
- Show required lock/tunnel zones (segments where uphill grade exceeds a configurable threshold, e.g., >0.1%)

**Scientific basis:** Canal routing historically follows contour lines downhill; uphill segments require either locks (slow, expensive) or tunnels (10x more expensive than open-air). The cross-section makes this immediately visible.

---

### 4. Sea Level Impact Calculator

**Why:** The entire project's scientific premise — does diverting ocean water inland lower sea levels? This must produce a number, even a rough one.

**Inputs:**
- Canal length (km), width (m), depth (m) → total water volume diverted per year (m³/yr), estimated from flow rate assumptions
- User-adjustable flow rate (m³/s)
- Destination basin area (km²) — the inland sea/depression being filled
- Evaporation rate for destination region (mm/yr) — default by climate zone, overridable

**Outputs:**
- Volume stored inland (m³)
- Estimated global sea level drop (mm) — using the standard formula: sea level change = volume / ocean surface area (361.8 × 10⁶ km²)
- Time to fill destination basin at current flow rate (years)
- Annual evaporation loss from destination basin (m³/yr)
- Net sea level effect accounting for evaporation (some water returns as rain, but not all)

**Scientific basis:** A 1 mm global sea level drop requires ~361.8 km³ of water removed from the ocean. Current sea level rise rate is ~3.7 mm/yr (~1,340 km³/yr). This gives the user a sense of scale immediately.

**Confidence note:** The calculator gives order-of-magnitude results. The uncertainty in evaporation return rates (fraction that rains back into the ocean vs. stays inland) should be shown as a range, not a point estimate.

---

### 5. Cost Estimator (Order of Magnitude)

**Why:** Without a cost number, the project cannot be evaluated as feasible or absurd. The user needs to know if a canal is "$10 billion" or "$10 trillion" scale.

**Inputs:**
- Canal length (km)
- Estimated terrain difficulty (flat / hilly / mountainous) — derived from elevation profile
- Number of lock systems needed (derived from elevation profile)
- Number of tunnel segments needed (km of tunneling)

**Outputs:**
- Open-cut canal: €1–5M per km (flat terrain), up to €20M/km (rocky/hilly)
- Lock construction: €50–200M per lock unit
- Tunnel segment: ~10× open-cut cost as baseline multiplier
- Total project cost range (min–max, not a single figure)
- Comparison reference: "This is roughly X times the cost of the Suez Canal (€5B in 2001 terms)"

**Sources:** UK HS2 tunnel cost data, PIARC Road Tunnels Manual, ResearchGate canal routing studies. These are rough figures; the app should display them with explicit uncertainty.

---

### 6. Destination Basin Selector

**Why:** The user needs to specify where the water goes. Different basins have radically different characteristics (size, depth below sea level, evaporation rate, existing ecosystems).

**Predefined basins (v1):**
- Qattara Depression (Egypt, −133m, 19,605 km²)
- Sahara interior lowlands
- Dead Sea basin (already below sea level)
- Caspian Sea (already exists, partially below sea level)
- Chott el Djerid (Tunisia)
- Salton Sea (California, for reference)
- Custom polygon (user-drawn)

**What it provides:** Pre-filled basin area, depth below sea level, estimated evaporation rate, existing ecosystem notes.

---

### 7. Uncertainty / Confidence Display

**Why:** This is a scientific tool. Presenting false precision destroys credibility. Every output number must show a range.

**Implementation:**
- All computed values shown as [low estimate – high estimate] with a central value
- A "confidence slider" concept: user can see what happens if evaporation rate is 30% higher or lower
- Color coding: green = well-constrained, yellow = order-of-magnitude, red = highly speculative

**Scientific basis:** Ecological impact studies consistently use this pattern. The EPA's HAWC tool and IPCC reports both present uncertainty ranges, not point estimates.

---

## Differentiators (valuable but not required for v1)

These features add depth and would make the app significantly more useful, but the app functions without them.

### D1. Automated Least-Cost Route Optimizer

The user draws a start and end point; the app finds the lowest-cost route through the terrain.

**Algorithm:** Dijkstra's / A* on a DEM grid where the cost function weights uphill movement heavily (avoids elevation gain), rewards following contour lines, and penalizes protected areas.

**Why defer:** Requires either server-side compute with DEM tile sampling or a WASM-compiled pathfinding library. Complex to build correctly. Manual routing covers 80% of use cases. Add in v2.

**Source:** ResearchGate paper "A direction dependent least-cost-path algorithm for roads and canals" establishes the academic foundation.

---

### D2. Climate Impact Projection Panel

Shows what the scientific literature says would happen to regional climate if large-scale water redistribution occurred.

**Key effects to display (per-basin):**
- Surface temperature cooling effect (irrigation increases latent heat flux, reducing surface temperature by 1–3°C locally — MEDIUM confidence based on multiple MIT/Nature studies)
- Precipitation feedback: increased evaporation raises local rainfall (up to +20% within 200 km in some studies), but the effect is complex and season-dependent
- Wind pattern changes: large water bodies create sea-breeze effects, influencing regional circulation
- Vegetation feedback: the Green Sahara research shows vegetation-dust feedbacks amplify precipitation beyond initial forcing

**Implementation:** Static lookup tables by region, not live simulation. Show as "expected effects based on analogous historical events" with citations.

**Confidence note:** This is MEDIUM confidence — the science is real but highly region-specific and non-linear.

---

### D3. Negative Risk Assessment Panel

Displays known negative risks associated with large inland water bodies.

**Cyclone/tornado risk:**
- Warm inland water bodies in arid regions increase atmospheric instability
- Literature shows tropical cyclones intensify over warm water; inland lakes in hot climates can generate convective storms
- Show risk heat map: regions where a new inland sea would be within cyclone generation zones

**Salinity/soil degradation:**
- Canal seepage raises water table → soil salinization (historical precedent: Aral Sea diversion, Murray-Darling basin)
- Show salinization risk zone along canal corridor

**Ecosystem disruption:**
- Habitat fragmentation along canal path
- Invasive species corridors

**Why defer to D-tier:** Quantifying these risks requires region-specific ecological data that is hard to generalize. Build as qualitative overlays in v2.

---

### D4. Scenario Comparison

Side-by-side view of two drawn canal routes, comparing cost, volume, sea level impact, and climate effects.

**Why defer:** Requires the core calculator to be solid first. UI complexity is significant (split map view or overlay comparison).

---

### D5. Timeline Simulation

Animated visualization of basin filling over decades — year 1, year 10, year 50, year 100.

**What it shows:**
- Water level rise in the destination basin
- Cumulative sea level drop
- Vegetation spread (based on greening studies: vegetation expands at ~1–5 km/yr from water edge in previously arid areas)

**Why defer:** Impressive but not necessary for evaluating feasibility. Animation adds engagement but not information.

---

### D6. Historical Analogue Overlays

Show real-world canal projects (Suez, Panama, Rhine-Main-Danube, China's South-to-North Diversion) with their actual costs, throughput, and timeline overlaid on the map.

**Why:** Anchors the user's cost intuitions to reality. Makes clear that the proposed canals are 10–100× larger than anything built.

---

### D7. Shareable Scenario Links

URL-encoded scenario state so a user can share their specific canal route and parameters.

**Why defer:** Nice for collaboration but not core to the scientific exploration.

---

## Anti-Features (deliberately out of scope)

These features seem relevant but should not be built, at least not in v1–v2.

### AF1. Full Hydrological Simulation Engine

**What it would be:** A coupled hydrological model (like GCAM or HydroPy) that simulates actual water flow, aquifer recharge, groundwater dynamics, and multi-basin interactions.

**Why not build it:** GCAM has 235 water basins, 250+ equations, runs on supercomputers, and takes months to calibrate. HydroPy is a Python model requiring significant climate forcing data. These are PhD-level research tools. The Canal app's value is in rapid, intuitive order-of-magnitude exploration, not peer-reviewed simulation accuracy. Building this would take years.

**Instead:** Use lookup-table approximations with stated assumptions. Be explicit that the app produces exploratory estimates, not simulation outputs.

---

### AF2. Real-Time Water Flow Physics

**What it would be:** Manning's equation applied to simulate actual flow velocity, sediment transport, lock fill/empty cycles, etc.

**Why not build it:** Correct hydraulic simulation requires precise cross-section geometry, Manning's roughness coefficients, and downstream boundary conditions — all data that doesn't exist for hypothetical canals. The results would be spuriously precise.

**Instead:** Use a simple flow rate input (m³/s) that the user sets manually, and derive everything from that.

---

### AF3. Detailed Ecological Species Impact

**What it would be:** Species distribution models showing which specific species are affected by flooding or canal construction in each region.

**Why not build it:** Requires IUCN Red List API integration, species distribution datasets (GBIF), and region-specific ecological expertise. Enormous scope creep.

**Instead:** Show qualitative "ecosystem type" overlays (desert, steppe, wetland, agricultural) and note that detailed ecological assessment is required before any real project.

---

### AF4. Multi-User / Collaborative Editing

**Why not build it:** The target user is a solo explorer with scientific curiosity, not a team of engineers. Authentication, conflict resolution, and shared state add infrastructure complexity that delays the core product.

---

### AF5. Economic Cost-Benefit Analysis Beyond Construction

**What it would be:** ROI calculations including benefits from agriculture, shipping, tourism, and carbon credits vs. full lifecycle costs.

**Why not build it:** The economic modeling is as complex as the hydrological modeling, and deeply political. The app should show construction cost estimates only, and note that economic benefits are out of scope. Entering this space turns a scientific tool into an advocacy tool.

---

### AF6. Mobile-First / Offline Mode

**Why not build it:** The app requires a large map, DEM data, and complex panels. Mobile screen real estate is fundamentally insufficient. Offline mode requires service workers, IndexedDB caching of DEM tiles, and significant complexity. Desktop-first is correct for a scientific tool of this type.

---

## Feature Dependencies

```
MapLibre base map
  └─→ Terrain Profile View (requires DEM tiles loaded in MapLibre)
       └─→ Lock/Tunnel Zone Detector (derived from elevation profile)
            └─→ Cost Estimator (uses lock count + tunnel length)
                 └─→ Scenario Comparison (requires cost estimator working)

Canal Drawing Tool
  └─→ Terrain Profile View (profile is computed for drawn route)
  └─→ Sea Level Impact Calculator (canal length/width from drawn route)
       └─→ Destination Basin Selector (feeds basin area/depth into calculator)
            └─→ Timeline Simulation (uses fill rate from calculator)

Sea Level Impact Calculator
  └─→ Uncertainty Display (all outputs need confidence ranges)
  └─→ Climate Impact Panel (calibrated against volume numbers)

Automated Route Optimizer (D1)
  └─→ Requires: DEM tile access + server-side compute OR WASM pathfinding
  └─→ Replaces: Manual waypoint refinement (but doesn't replace manual drawing)
```

---

## Existing Tools to Learn From

### What the Canal app is NOT trying to be

| Tool | What it does | Why we don't replicate it |
|------|-------------|--------------------------|
| **GCAM** (PNNL) | Integrated assessment of energy, water, land, economy to 2100 | Full Earth system model, requires supercomputer, academic calibration. Not interactive. |
| **HydroPy** | Global hydrological model in Python | Research code, not a UI. Assumes known climate forcing data. |
| **NOAA Sea Level Rise Viewer** | Shows coastal flooding at +N feet of sea level | Shows existing projections only, no "what if we diverted water" mode. |
| **NASA Sea Level Projection Tool** | IPCC AR6 projections by location | Same — projections only, no intervention modeling. |
| **Vensim / ANEMI** | System dynamics world model with water sector | Stock-and-flow GUI, very technical, not geospatial, not accessible to curious non-experts. |
| **EPANET** (EPA) | Hydraulic modeling of water distribution networks | For existing pipe networks, not planetary-scale terrain routing. |
| **Aqueduct (WRI)** | Global water risk mapping | Flood and drought risk, not redistribution scenarios. |
| **floodmap.net** | Sea level rise flood visualization | Passive flooding (what gets inundated), not active diversion. |

### What the Canal app borrows from these tools

| Concept | Source | How Canal uses it |
|---------|--------|------------------|
| Volume/sea level math | USGS, NASA NSIDC | 361.8 km³ per 1 mm sea level rise formula |
| Basin-level water balance | GCAM | Per-basin accounting of inflow vs evaporation vs storage |
| Least-cost path routing | ResearchGate canal routing literature | Basis for automated routing (D1) |
| Uncertainty range display | IPCC AR6 reports, EPA HAWC | Every output shown as [low–high] range |
| Terrain profile extraction | QGIS Profile Tool (concept) | Web equivalent: sample DEM along polyline |
| Irrigation-precipitation feedback | MIT study (2015), Nature npj Climate | Input to climate impact panel |
| Desert greening timescales | Green Sahara research (Science Advances) | Vegetation spread rates for timeline simulation |
| Evaporation rate data | USGS arid hydrology, AGU publications | Default evaporation rates by climate zone (1400–1900 mm/yr for semi-arid water bodies) |

### Closest existing analogues

- **[NOAA Sea Level Rise Viewer](https://coast.noaa.gov/digitalcoast/tools/slr.html)** — shows passive flooding; teaches us what a clean SLR UI looks like
- **[NASA Sea Level Projection Tool](https://sealevel.nasa.gov/ipcc-ar6-sea-level-projection-tool)** — model for uncertainty visualization (scenario bands)
- **[floodmap.net](https://www.floodmap.net/)** — simple elevation-based flood visualization; demonstrates the minimum viable map interaction
- **[Aqueduct Global Flood Analyzer](https://www.wri.org/aqueduct)** — layer-based risk overlay UI pattern

---

## MVP Recommendation

Build in this order:

1. **MapLibre map + DEM terrain layer** — the canvas everything else sits on
2. **Canal drawing tool** — lets the user start exploring immediately
3. **Terrain profile view** — first "aha" moment: see what the canal actually crosses
4. **Sea level impact calculator** — the headline number: "this canal would lower sea level by X mm"
5. **Cost estimator** — grounds the idea in economic reality
6. **Destination basin selector** (predefined list) — makes the calculator usable without custom polygon drawing
7. **Uncertainty display** — non-negotiable for scientific credibility; build it into the calculator from day one, not as an afterthought

**Defer to v2:** Automated routing optimizer, climate impact panel, negative risk assessment, scenario comparison, timeline simulation.

**Never build:** Full hydrological simulation, real-time hydraulics, species-level ecological modeling.

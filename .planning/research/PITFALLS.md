# PITFALLS.md — Risks & Pitfalls for the Canal Network Scientific Study

**Domain:** Scientific web app — global canal routing, sea level impact, ecological analysis
**Researched:** 2026-04-30
**Overall confidence:** HIGH (physical/engineering), MEDIUM (ecological feedbacks), HIGH (technical/app)

---

## Critical Scientific Mistakes to Avoid

### Pitfall 1: Order-of-Magnitude Blindness (the most important pitfall of all)

**What goes wrong:** Building a polished routing tool without first establishing whether the
intervention is even in the right ballpark numerically. Users (and authors) conclude "it works"
based on plausible-looking outputs without checking the math.

**The numbers:**
- Ocean surface area: ~361 million km²
- 1 mm of global sea level rise = ~362 km³ of water
- IPCC projected rise by 2100: 0.3–1 m → to compensate fully you must permanently remove
  108 000 – 362 000 km³ from the ocean
- The Qattara Depression — the most-studied candidate globally — could absorb ~1 000 km³
  total (source: AghaKouchak, Mongabay 2025), producing ~2.7 mm of sea level drop
- The world's largest irrigation canal (Indira Gandhi Canal, India): ~1 133 m³/s = ~13 km³/year
  You would need roughly 8 300 such canals running for 100 years to compensate 1 m of rise
- Conclusion: canal networks can contribute millimetres, not metres; the approach is a
  "complementary, limited-scale option" (AghaKouchak 2025), not a solution

**Why it matters:** Present the correct framing from the start. The scientific value of this app
is precisely in quantifying *how much* canals could contribute. Don't obscure this.

**Prevention:** Display the order-of-magnitude comparison prominently in the UI.
Phase 1 should hard-code this sanity check before any dynamic routing.

---

### Pitfall 2: Ignoring Gravity — Routing Water Uphill

**What goes wrong:** A routing algorithm finds the "shortest path" from coast to inland
basin ignoring elevation, then displays a route that would require pumping water over a
mountain range. The route is physically impossible by gravity alone.

**Physics:** Water flows only downhill (or through pressurised systems). Any route that
passes through a ridge elevation higher than its start point requires:
- Active pumping infrastructure (massive energy cost)
- Or a tunnel through the mountain (massive construction cost)

**Prevention:**
- Canal routing must be elevation-constrained from day one
- Use DEM data to reject any path where intermediate elevation exceeds the ocean starting
  point (for gravity-only flow)
- Clearly label pumped vs. gravity routes with separate cost models
- Rule of thumb: every 10 m of lift requires roughly 27 kWh per 1 000 m³ pumped (pump
  efficiency ~85%) — this adds to cost estimates

---

### Pitfall 3: Salt Water in Desert Ecosystems — Possible Ecological Destruction

**What goes wrong:** The study assumes "water = greening." But ocean water is ~3.5% salt.
Introducing seawater to desert soil causes:
- Soil salinization: salt accumulates as water evaporates, binding nutrients and preventing
  plant uptake — about one-third of the world's irrigated land is already affected by salt
  buildup from irrigation (source: Frontiers/OSTI research)
- Hypersaline endorheic lakes: the Qattara Depression feasibility study (2023) explicitly
  flags the risk of the reservoir becoming an "increasingly salty lake with difficult-to-reverse
  environmental impacts" (source: ClickPetroleoeGas)
- Groundwater contamination: salt percolates into aquifers used by desert communities
- Vegetation death: salinity suppresses soil microbial communities and plant growth

**Prevention:**
- Distinguish between three scenarios in the app: gravity-fed saltwater basin (evaporation
  sink), freshwater canal (river diversion), and treated/diluted water delivery
- Flag any inland destination as "saline risk zone" if the basin is endorheic (no ocean outlet)
- Acknowledge the Qattara paradox: evaporation is what makes the concept work for sea level
  reduction, but evaporation is also what concentrates the salt

---

### Pitfall 4: Evaporation vs. Ecological Effect

**What goes wrong:** The study claims water will "green the desert," but in hot arid
conditions, evaporation rates are 4–10 mm/day (source: desert hydrology literature).
Water evaporates faster than it can establish vegetation. The mechanism for greening
requires sustained soil moisture over years — not a one-time flood.

**The math:**
- Sahara surface area: ~9.2 million km²
- To deliver even 500 mm/year of precipitation equivalent across the Sahara:
  500 mm × 9.2 million km² = 4 600 km³/year just for the Sahara
- This is 350x the entire Indira Gandhi Canal annual flow
- Evapotranspiration in hyperarid deserts is 10–33x annual rainfall

**What's realistic:** Localised greening around canal corridors and filling basins that act
as moisture sources for regional rainfall feedbacks — not continent-scale greening.

**Prevention:** Scope claims clearly. The mechanism for greening is:
1. Fill basin (evaporation sink removes water from ocean)
2. Increased evaporation over the basin increases local humidity
3. Positive feedback loop may develop rainfall (documented in Sahel — source: OSTI 2018)
4. This is a decades-long process, not an instant effect

---

### Pitfall 5: Confusing "Sea Level Fall" with "Sea Level Offset"

**What goes wrong:** The study frames canal networks as "lowering" sea level. In reality,
they can only *offset* or *slow* the rise driven by ice melt and thermal expansion.
They cannot reverse past rise. This distinction matters for communicating results honestly.

**Prevention:** Use precise language in the UI: "Projected sea level offset: X mm by 2100"
not "sea level reduction." Model the offset against IPCC rise scenarios.

---

## Engineering Reality Checks

### Pitfall 6: The Qattara Depression Lesson — Cost Always Explodes

**What happened:** The Qattara Depression Project was studied continuously from the 1920s
through 2023 (new Egyptian government feasibility study signed April 2023). It was never
built because:
- Canal/tunnel excavation cost exceeded economic return from hydroelectric generation
- 1970s proposals involved 213 nuclear warheads (1–1.5 Mt each) detonated underground —
  rejected by Egypt
- WWII unexploded ordnance along the route (North African theatre) would require mass
  demining
- The reservoir would gradually become a saltier and saltier endorheic lake with
  irreversible environmental damage

**Lesson for the app:** Qattara is the *best-case* scenario globally (large area, very close
to sea, below sea level, arid climate). If even the best candidate hasn't been built after
100 years of study, that tells you something about the cost-benefit reality for other routes.

---

### Pitfall 7: Lock Systems Multiply Cost and Complexity Non-Linearly

**What goes wrong:** A route that passes through undulating terrain needs locks at every
elevation change. The Panama Canal — 80 km long, only 26 m of lift — has six lock chambers
and cost $375 million in 1914 ($11 billion in today's dollars). Each lock operation also loses
one "lockful" of freshwater — for saltwater canals this creates additional environmental risks.

**Prevention:**
- In the routing model, flag any route requiring intermediate elevation gain as "lock-required"
- Assign a cost multiplier per lock stage
- For ocean-to-inland routes targeting below-sea-level basins, gravity flow is possible and
  no locks are needed — this is the sweet spot

---

### Pitfall 8: Geology, Water Table, and Soil Permeability

**What goes wrong:** Routing through sandy desert seems cheap until you discover the canal
requires lining because sandy soil is so permeable the water disappears underground. Conversely,
canal construction through hard rock requires blasting and dramatically increases cost.

**Documented failures:**
- The Aral Sea diversion canals lost 25–75% of water to seepage through unlined earthwork
  (source: Columbia University Aral Sea Crisis study)
- The All-American Canal (USA) lost ~68 million m³/year to seepage before lining

**Prevention:** In the feasibility model, flag routes through:
- Sand/dune terrain (high permeability → lining required)
- Fractured rock (blasting required)
- High water-table zones (dewatering required during construction)

---

## Technical App Mistakes

### Pitfall 9: DEM Data — Sinks, Artifacts, and Vertical Error

**What goes wrong:** Global DEMs (SRTM, ASTER) have significant errors that break routing
algorithms:

- **Sinks:** Artificial depressions in DEM data where there is no real low point, created
  by integer rounding of elevation values. A routing algorithm treats these as valid
  collection points when they are just data artifacts. Must be filled/corrected before
  any hydrological routing.
- **Vertical error:** SRTM accuracy: ±5.9 m RMSE globally; ASTER: ±9–13 m RMSE. In flat
  coastal terrain (exactly where you need accuracy for canal routing), errors are worst.
- **Artifacts:** ASTER is optical — cloud tops appear as mountains thousands of meters high
  in the raw data. SRTM (radar) avoids this but has striping artifacts in flat areas.
- **Vegetation masking:** SRTM measures the surface (canopy top in forests), not bare ground.
  A forest-covered mountain pass reads 20–30 m higher than the actual terrain.

**Prevention:**
- Use NASADEM or Copernicus GLO-30 DEM (better accuracy than raw SRTM/ASTER) for routing
- Always run sink-filling pre-processing before any hydrological analysis
- Use CoastalDEM or DiluviumDEM for coastal zones (specifically corrected for coastal bias)
- Flag any route through areas with RMSE > 5 m as "uncertain elevation — verify"
- Best free global DEM for this project: Copernicus GLO-30 (1 arc-second, ~30 m horizontal,
  ~4 m vertical RMSE globally)

---

### Pitfall 10: Map Projection Errors at Global Scale

**What goes wrong:** Most web mapping defaults to Web Mercator (EPSG:3857). Distance and
area calculations in Web Mercator are incorrect at global scale — polar areas are inflated,
and planar distance calculations can be 100+ km wrong compared to geodesic distances
(source: GIS research literature).

**Specific traps:**
- Calculating canal length in pixel units then converting using a per-pixel meter estimate
  derived from equatorial scale — this is wrong everywhere except the equator
- Using `turf.area()` with Web Mercator tiles — turf uses geodesic calculations by default,
  but if you feed it projected coordinates, results are wrong
- Assuming a "straight line" on a Mercator map is the shortest path — it is not; great-circle
  routes must be used for long-distance routing

**Prevention:**
- Store all coordinates in WGS84 (EPSG:4326) geographic coordinates
- Calculate distances and areas using geodesic/great-circle methods (e.g., `turf.js` with
  geographic input, or `pyproj` with geodesic=True)
- Project to local UTM only for small-scale visualisation or analysis where accuracy matters
- Never use pixel-based distance approximations

---

### Pitfall 11: Sea Level Calculation Methodology Errors

**What goes wrong:** Calculating sea level impact by dividing "volume of water diverted" by
"ocean surface area" and getting a wildly wrong number because:
- Isostatic rebound: as you remove water from ocean, the ocean floor rises slightly
  (glacial isostatic adjustment) — reduces effective sea level change by ~10–30%
- Geoid changes: the ocean surface is not a perfect sphere; redistributing water changes
  the gravitational field, which changes sea surface height differently in different regions
- Thermal expansion/contraction: removing cold deep water has different volume effects
  than removing warm surface water (thermal expansion coefficient varies with temperature)

**For this app's purpose (order-of-magnitude):** The simple V/A calculation is fine and
should be explicitly labelled as "simplified first-order estimate." Error is <30%.
Do not attempt to model isostatic rebound or geoid changes in v1 — that is graduate-level
geophysics, not order-of-magnitude science communication.

**Prevention:** Add a clear methodological footnote to every sea level calculation.
Label all outputs as "simplified estimate, ±30% due to isostatic and geoid effects."

---

## Scope Traps

### Pitfall 12: The Infinite Rabbit Holes — What to Explicitly NOT Build in v1

**What expands infinitely:**

| Rabbit hole | Why it never ends | What to do instead |
|-------------|-------------------|--------------------|
| Full hydrological routing | Requires accounting for infiltration, evapotranspiration, soil type, seasonal variation, tributary networks — this is what entire PhD theses are about | Use simplified gravity-constrained pathfinding on DEM with flagged elevation barriers |
| Realistic ecological impact | Requires species distribution data, salinity tolerance curves, succession models, soil type mapping — active research field | Classify zones as "high risk / medium risk / low risk" using salinity and precipitation thresholds |
| Economic cost modelling | Requires per-country construction cost data, geology surveys, labour costs, land acquisition — the Qattara was studied for 100 years | Use order-of-magnitude cost ranges per km based on terrain type (flat desert / mountain / urban) |
| Geopolitical feasibility | Canal routes cross borders; international water law is complex | Flag which countries a route crosses — leave geopolitical assessment to the user |
| Climate feedback simulation | Requires GCM (General Circulation Model) integration — supercomputer territory | Cite the Sahel positive feedback studies as supporting evidence; do not simulate |
| Real-time DEM streaming | Terabytes of data, complex tiling, GPU rendering | Use pre-processed tiles at 90–500 m resolution for global view |

**Minimum viable v1 scope:**
1. Select a source point (ocean) and destination (inland basin)
2. Display terrain profile with elevation along the path
3. Calculate: is gravity flow possible? (is destination below sea level?)
4. Calculate: volume of water the basin can absorb (from DEM area × depth below sea level)
5. Calculate: sea level offset in mm (volume / 361 million km²)
6. Flag: salt water risk (endorheic basin), evaporation rate (lat/lon → climate zone),
   countries crossed
7. Show the global context: this offset vs. IPCC projections

**That's it for v1.** Every additional feature is a separate feature request.

---

### Pitfall 13: Confusing the Scientific Premise with Engineering Advocacy

**What goes wrong:** The app slides from "let's study whether this could work" into
"here's how to build it." This shifts the mental model from scientific exploration to
engineering proposal, which then demands accuracy that a personal study cannot provide.

**Prevention:** Keep the framing as "What if?" exploration throughout. Explicitly state
the app does not constitute an engineering feasibility study. The value is in
comparative analysis: which basins have the best ratio of accessible volume to
sea-level impact, not in any specific route design.

---

## Historical Case Studies

### Case Study 1: Aral Sea (Soviet Central Asia, 1960s–present) — Water Removed, Disaster

**What happened:** Soviet irrigation projects diverted 75% of inflow from the Amu Darya
and Syr Darya rivers. The Aral Sea (formerly 4th largest lake in the world) lost 90% of
its volume by the 2000s.

**Consequences:**
- Annual dust storms from exposed lakebed (14–27 million tons/year) now affect Tehran,
  Dushanbe, and glacier snowpack supplying 1 billion people
- Regional temperature swings increased by 18°F; summer temperatures 10°F hotter
- Precipitation decreased by ~60% in the region
- 40 000–60 000 fishermen lost their livelihoods
- The exposed lakebed is now called the Aralkum Desert

**Lesson for this project:** This is the *inverse* of what canal reflooding proposes.
But it confirms that large bodies of water profoundly affect regional climate —
both their creation AND removal has major consequences. The canal project proposes
to *create* inland water bodies, which could have positive feedback effects on
regional rainfall, but also permanent salinity effects on soil.

---

### Case Study 2: Caspian Sea Level Changes (USSR, 20th century)

**What happened:** Soviet dam construction on the Volga (which provides 80% of Caspian
inflow) lowered Caspian Sea levels significantly through the 20th century. Current
rapid decline is attributed primarily to reduced Volga discharge plus increased evaporation
from climate warming (source: Nature Communications Earth & Environment, 2025).

**Lesson:** A sea that is primarily fed by river inflow is extremely sensitive to upstream
diversions. Conversely, a canal system feeding an inland basin would similarly dominate
that basin's water balance.

---

### Case Study 3: Qattara Depression Project (Egypt, 1920s–2023) — Best Case, Never Built

**What happened:** Studied continuously for over 100 years. Proposed mechanisms included:
canal, tunnel, and 213 nuclear weapons. Never built. New feasibility study contracted in 2023.

**Key numbers:**
- Depression sits 133 m below sea level
- Could absorb ~1 000 km³ total → ~2.76 mm global sea level drop
- Distance from Mediterranean coast: ~56 km (relatively short)
- It is the single best candidate globally for gravity-fed ocean-to-inland diversion

**Why not built:**
- Excavation cost exceeds economic return
- WWII unexploded ordnance across the route
- Reservoir would become progressively hypersaline with irreversible environmental impact
- Energy generation (hydroelectric) insufficient to justify cost

**Lesson:** If the best candidate globally is still theoretical after 100 years, cost and
environmental concerns dominate over technical feasibility. The app should present this as
the benchmark "best case" and scale all other routes relative to it.

---

### Case Study 4: Salton Sea (California, 1905) — Accidental Creation

**What happened:** In 1905, an irrigation canal carrying Colorado River water broke,
flooding the Imperial Valley for two years, creating a 345 sq-mile inland sea.

**Consequences:**
- Initially an ecological success and recreational destination (1950s–1980s)
- As agricultural runoff became the only water source, salinity rose steadily
- Now hypersaline, with dying fisheries and toxic dust from exposed lakebed
- Asthma rate 22% in surrounding communities vs. 8% national average
- Projected to lose 75% of remaining volume by end of decade

**Lesson:** Even an *accidentally created* inland sea powered by freshwater ultimately
becomes a salinity and dust disaster as evaporation concentrates salts. Any ocean-fed
inland sea starts saline and only gets saltier. The "greening" effect is therefore
geographically constrained to the zone around the canal, not the evaporating basin itself.

---

### Case Study 5: Sahel Greening (West Africa, 1980s–present) — Positive Feedback

**What happened:** After severe droughts in the 1970s–80s, rainfall in the Sahel
region recovered partially, and vegetation increased significantly. Research confirmed
a positive vegetation-rainfall feedback loop: more vegetation → more evapotranspiration
→ more precipitable water → more rainfall → more vegetation.

**Lesson for this project:** This is the mechanism that *could* make canal-fed desert
greening self-sustaining over decades. BUT the Sahel recovery was driven by natural
rainfall recovery, not saltwater introduction. Freshwater canals or rainfall-fed zones
near canal corridors could trigger this feedback; saltwater basins would not.

**Quantification:** Simulations suggest desert greening with 500 mm/year of precipitation
becomes self-sustaining due to rainfall feedback — but achieving that initial 500 mm
requires the water input first (source: Springer Nature, 2024).

---

## Phase Mapping

| Phase | Pitfall to address | Mitigation |
|-------|-------------------|------------|
| Phase 1: Core calculation engine | Pitfall 1 (order of magnitude), Pitfall 5 (offset vs lowering), Pitfall 11 (methodology) | Hard-code Qattara benchmark; label all outputs as simplified estimates |
| Phase 1: Core calculation engine | Pitfall 2 (gravity routing) | Elevation-constrained pathfinding from day one; no routing that crosses elevation barriers |
| Phase 2: DEM integration | Pitfall 9 (DEM artifacts, sinks) | Use Copernicus GLO-30; run sink-filling; flag high-error zones |
| Phase 2: DEM integration | Pitfall 10 (projection errors) | Store WGS84; geodesic calculations only; no Web Mercator distances |
| Phase 3: Feasibility scoring | Pitfall 6 (Qattara cost lesson), Pitfall 7 (locks), Pitfall 8 (geology) | Cost ranges by terrain type; lock flags for elevation gains; permeability flags for sand/rock |
| Phase 3: Feasibility scoring | Pitfall 3 (salt water ecology), Pitfall 4 (evaporation) | Salt risk flag for endorheic basins; evaporation rate from climate zone |
| Phase 4: Visualisation | Pitfall 13 (advocacy vs science) | Framing copy: "What if?" not "How to build" |
| All phases | Pitfall 12 (scope creep) | Feature freeze at v1 scope list above; log deferred features in backlog |

---

## Sources

- [Mongabay: Can we create new inland seas to lower sea level rise? (Dec 2025)](https://news.mongabay.com/2025/12/can-we-create-new-inland-seas-to-lower-sea-level-rise-interview-with-researcher-amir-aghakouchak/)
- [Wikipedia: Qattara Depression Project](https://en.wikipedia.org/wiki/Qattara_Depression_Project)
- [Frontiers: The Need for a High-Accuracy, Open-Access Global DEM](https://www.frontiersin.org/journals/earth-science/articles/10.3389/feart.2018.00225/full)
- [Columbia University: The Aral Sea Crisis](https://www.columbia.edu/~tmt2120/introduction.htm)
- [Earth.Org: The Aral Sea Catastrophe](https://earth.org/the-aral-sea-catastrophe-understanding-one-of-the-worst-ecological-calamities-of-the-last-century/)
- [Nature: Rapid decline of Caspian Sea level (2025)](https://www.nature.com/articles/s43247-025-02212-5)
- [Interesting Engineering: Salton Sea — Born From an Engineering Mistake](https://interestingengineering.com/innovation/salton-sea-largest-lake-of-california-born-from-an-engineering-mistake)
- [OSTI: Positive vegetation-rainfall feedbacks in the Sahel](https://www.osti.gov/biblio/1422593)
- [MDPI: Vertical Accuracy of Global DEMs (2020)](https://www.mdpi.com/2072-4292/12/21/3482)
- [Wiley: Approximations, Errors, and Misconceptions in Map Projections (2021)](https://onlinelibrary.wiley.com/doi/10.1155/2021/1094602)
- [Quora / sealevel.info: 1 mm sea level rise = 362 km³](https://sealevel.info/conversion_factors.html)
- [PMC: Salinization effects on coastal ecosystems](https://pmc.ncbi.nlm.nih.gov/articles/PMC6283962/)
- [Springer: Moisture recycling Saudi Arabia irrigation (2024)](https://link.springer.com/article/10.1007/s10113-024-02284-7)

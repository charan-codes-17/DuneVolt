# Product Requirements Document
## Autonomous Desert Solar Farm — AI-Powered Digital Twin

| | |
|---|---|
| **Document type** | Product Requirements Document (PRD) |
| **Product** | Autonomous Desert Solar Farm — live digital twin prototype |
| **Prepared for** | Ideathon submission |
| **Status** | Draft — v1.0 |
| **Owner** | Charan |

---

# 1. Executive Summary

Rooftop solar cannot scale to every Indian household — space, cost, housing suitability, and maintenance burden all work against it. This product reframes the problem: instead of asking millions of households to individually own and maintain solar hardware, generate power centrally at scale in India's high-sunlight desert regions, using AI and automation to make farm-scale solar operation efficient, resilient, and largely self-managing, and deliver that power to communities through existing grid infrastructure.

For the ideathon, we are not shipping an actual solar farm. We are building a **live, interactive digital twin** that proves the concept is technically coherent and demonstrable in three minutes: one operator (me) manipulates simulated environmental conditions from a phone or laptop; a second, professional judge-facing dashboard shows the exact same solar farm, in a synchronized live 3D view, autonomously sensing, deciding, and acting — tracking the sun, defending against sandstorms, detecting faults, prioritizing cleaning, managing heat, and routing energy — without manual intervention from the operator.

The product succeeds if a judge with no prior explanation can watch the three-minute demo and understand, unprompted: *this system runs itself, and it runs itself well enough to make centralized desert solar a credible alternative to universal rooftop adoption.*

---

# 2. Problem Statement

India has enormous solar-energy potential, but rooftop solar adoption remains difficult for many households, because of:

- **Limited rooftop space** — many homes, especially in dense urban or informal housing, do not have adequate south-facing roof area.
- **High upfront installation and maintenance cost** — purchasing panels, inverters, batteries, and installation labor is a significant capital outlay for lower-income households.
- **Unsuitable housing conditions** — structural, shading, ownership (rented housing), or roof-material constraints prevent installation even where space exists.
- **Complexity of ownership** — the household becomes responsible for monitoring, cleaning, fault diagnosis, and repair of a technical system they did not choose to become experts in.

The net effect: a strategy that relies primarily on individual rooftop installations scales slowly and unevenly, and systematically excludes the households least able to absorb the cost and complexity — which are often the households that would benefit most from cheaper electricity.

---

# 3. Proposed Solution

**A large-scale, AI-powered solar energy system built in high-sunlight desert regions**, where land is abundant and solar irradiance is high, generating electricity centrally and distributing it to communities through existing power infrastructure — removing the need for individual households to purchase, install, or maintain their own panels.

The differentiator is not "put panels in a desert" — deserts are harsh, dusty, hot, and prone to sandstorms, which is exactly why utility-scale desert solar has historically been operationally expensive. The differentiator is that **AI, sensors, and automation absorb that operational burden**, so the farm:

1. **Tracks sunlight dynamically** to maximize generation.
2. **Predicts sandstorms** and defends itself proactively, before damage occurs.
3. **Detects faults and degradation** with root-cause precision, not just symptom monitoring.
4. **Performs automated visual/thermal inspection** to catch physical damage and contamination early.
5. **Cleans and maintains itself** on an economic, condition-based schedule using water-efficient methods suited to a desert.
6. **Manages heat-driven efficiency loss** proactively.
7. **Routes the energy it generates intelligently** — to immediate local demand, to storage, or to the grid — based on real-time conditions.

This turns a standard photovoltaic installation into what the brief calls a **"fully autonomous, high-efficiency energy platform,"** combining real-time computer vision, multi-sensor arrays, machine learning, and predictive modeling.

---

# 4. Product Vision

> A desert solar farm that senses its environment, understands what that environment means for its own operation, predicts what's about to happen, protects itself, recovers on its own, and continuously optimizes — so that scaling solar in India stops being bottlenecked by what an individual household can afford, install, and maintain.

For this ideathon, the vision is proven through a **prototype digital twin**: not a real farm, but a real, working, synchronized simulation of one, architected so that every behavior a judge sees is driven by an actual state machine and actual (if simplified) calculations — not a scripted animation.

---

# 5. Goals & Success Metrics

| Goal | How it's measured in the prototype |
|---|---|
| Prove centralized desert solar can be operationally autonomous | Judge observes a full sense → predict → protect → recover cycle with zero manual panel control during the main demo |
| Prove the concept is technically groundable, not just a pitch | Underlying farm state, physics-approximate calculations, and event log are real and internally consistent, not decorative |
| Make the concept legible to a non-technical judge in ~3 minutes | Demo script (Section 15) completes the full story arc without narration beyond what's on screen |
| Demonstrate this scales beyond "just tracking the sun" | Distinct, visibly different responses to dust, heat, storm, and panel fault — each with its own diagnostic and corrective path |
| Connect the technical system back to the original problem | Energy-flow visualization explicitly shows Generation → Grid/Storage → Shared Solar → Households |

**Out of scope for success measurement:** actual kWh accuracy, real hardware integration, real computer-vision inference, or production-grade security/auth. This is a judged prototype demo, not a deployable product.

---

# 6. Target Users / Stakeholders

| Role | Who | What they need from the product |
|---|---|---|
| **Operator (Controller user)** | Me, presenting, using phone or laptop | A fast, simple, low-friction way to trigger environmental changes without needing to think about UI during the pitch |
| **Judge (Dashboard viewer)** | Ideathon judges, watching a projected screen | A professional, legible, "control-room" view that explains itself — what's happening, why, and what the system is doing about it |
| **(Conceptual, non-demo) End beneficiary** | Households that would otherwise need rooftop solar | Not a literal user of this prototype, but the reason the energy-flow visualization and problem framing exist — the product must keep this connection visible |

---

# 7. Scope

## 7.1 In scope (prototype)

- One shared, authoritative simulation state for the whole farm.
- Two synchronized real-time web interfaces (Controller, Judge Dashboard).
- A live, interactive 3D visualization of 2–3 solar panels in a desert scene, rendered identically (from shared state) in both interfaces.
- Simulated/rule-based AI for: storm prediction, soiling risk, fault risk, cleaning prioritization, heat-loss prediction, and energy routing decisions.
- Real (not simulated) calculations for: sun angle, panel tracking orientation, dust/temperature efficiency loss, and energy-flow arithmetic.
- Full autonomous storm defense cycle (Normal → Warning → Protection → Storm → Recovery).
- Multi-factor, root-cause fault diagnosis (heat / dust / degradation / cracks / wiring / hotspot / shading) — simulated, not real CV inference.
- Simulated visual/thermal inspection findings (cracks, discoloration, contamination, loose components, sand buildup) surfaced through the dashboard, without actual camera hardware or trained models.
- Economic, threshold-based cleaning prioritization (dollars-lost framing), and a simulated waterless cleaning mechanism.
- Simulated battery state-of-charge and grid-pricing-aware energy routing logic.
- Event timeline, alerts, panel selection/inspection, and a reliable reset mechanism.

## 7.2 Out of scope (explicitly, for this prototype)

- Real satellite/weather-API-driven storm prediction (rule-based simulation only).
- Real computer-vision models for crack/contamination detection (dashboard presents plausible simulated findings).
- Real IoT sensor hardware, real panel actuators, or real cleaning robotics.
- Real grid integration, real utility pricing feeds, or real battery hardware.
- Multi-tenant accounts, authentication, or production security hardening.
- Physically exact solar geometry, thermal physics, or aerodynamic sandstorm modeling.
- Financial/regulatory modeling of the centralized-vs-rooftop economic case (this PRD assumes that case; it is not re-litigated in the product).

---

# 8. Core Architectural Principle: One Shared Farm State

This is the single most important requirement in the entire product, and every feature below depends on it.

There must be **one authoritative simulation state**, not one simulation for the controller and a separate one for the dashboard.

```text
                 SHARED FARM STATE
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
   CONTROLLER VIEW            JUDGE DASHBOARD
      3D MODEL                    3D MODEL
          │                         │
          └──── SAME STATE ─────────┘
```

The controller writes to the shared state (directly, for environmental inputs like sun/dust/wind/temperature) or indirectly (by triggering events that the autonomous logic then acts on, like storms and faults). Both 3D views, both dashboards, and all metrics render *from* that same state. If `panelAngle` changes to `safePosition` because the autonomous protection logic decided to stow the panels, both views must show that transition — the dashboard is never told to "look protected," it *is* rendering the protected state.

**Synchronization requirement:** the architecture must support real-time state propagation (WebSockets, Socket.IO, Firebase Realtime, Supabase Realtime, or an equivalent lightweight mechanism). Do not over-engineer this — the priority is reliable, visually synchronized behavior during a live demo, not a general-purpose real-time platform.

---

# 9. System Loop

The product is best understood as one continuous loop, and every functional requirement below is a piece of this loop:

```text
                 ENVIRONMENT
                     │
       ┌─────────────┼──────────────┐
       ↓             ↓              ↓
      SUN           DUST           WIND / HEAT
       │             │              │
       └─────────────┼──────────────┘
                     ↓
                  SENSING
                     ↓
               AI / ANALYSIS
                     ↓
     ┌───────────────┼────────────────┐
     ↓               ↓                ↓
  PREDICT         DIAGNOSE         ROUTE ENERGY
     ↓               ↓                ↓
  PROTECT         MAINTAIN        STORAGE / GRID
     │               │                │
     └───────────────┴────────────────┘
                     ↓
               SOLAR FARM ACTS
                     ↓
            POWER GENERATION
                     ↓
              GRID / STORAGE
                     ↓
              SHARED SOLAR
                     ↓
                HOUSEHOLDS
                     │
                     ↓
              NEW FARM DATA
                     │
                     └────→ CONTINUOUS LOOP
```

---

# 10. Functional Requirements

Requirements are grouped by module. Each includes the underlying concept, the behavior the system must exhibit, and what's real vs. simulated for the prototype (see also Section 13).

## 10.1 Environmental Simulation Engine

**Purpose:** the ground-truth inputs everything else reacts to.

| Requirement | Detail |
|---|---|
| Controllable sun | Position, direction, angle — adjustable via the Controller |
| Controllable dust level | 0–100% scale, adjustable directly or via a "Simulate Dust Event" trigger |
| Controllable wind speed | km/h scale, adjustable directly or via a "Simulate Storm" trigger |
| Controllable temperature | °C scale, adjustable directly |
| Controllable panel fault injection | "Create Fault" trigger, targeting a specific panel |
| Reset | Restores all environmental variables and farm state to defaults instantly (see Section 10.10) |

All four core sliders (sun, dust, wind, temperature) must be visible and adjustable from the Controller interface at all times, in addition to the one-tap event triggers (Simulate Dust, Simulate Storm, Create Fault, Reset).

## 10.2 Dynamic Solar Tracking

**Concept (from brief):** *"The system optimizes panel angles by pairing real-time sunlight intensity sensors and computer vision with predictive solar-position algorithms to continuously target peak irradiance."*

**Prototype behavior:**

```text
Sun moves
   ↓
Incident angle changes
   ↓
Panel tracking system reacts
   ↓
Panel orientation changes
   ↓
Generation changes
```

- Panel orientation must **never** be manually set by the operator during normal operation — it is always derived from current sun position by the tracking logic.
- Physically exact solar geometry is not required; the visual and numerical relationship (sun angle → panel angle → output) must be believable and monotonic.
- Both 3D views must show identical panel orientation at all times, since both render the same shared state.

## 10.3 Storm Prediction & Proactive Defense

**Concept (from brief):** *"Atmospheric sensors, wind data, and historical weather patterns predict sandstorms up to 25 minutes in advance. The site automatically transitions through a multi-stage defensive protocol (Normal → Warning → Protection → Storm → Recovery)."*

**Prototype behavior — Storm Risk calculation:**

- A **Storm Risk** score (0–100%) is continuously computed from wind speed, dust level, and visibility/environmental inputs.
- This is explicitly a **rule-based prototype model**, not a trained ML system — the dashboard must never claim otherwise (see Section 16).
- The "up to 25 minutes in advance" framing from the brief is the *real-world claim the concept is based on*; the prototype represents this compressed into a **visible countdown** (target: ~10 seconds) so the judge can see the full defensive sequence within the demo window. The dashboard copy should describe this as a **prototype simulation of an early-warning lead time**, not assert that 10 seconds is the real prediction window.

**Multi-stage defensive protocol — the farm's top-level system state:**

```text
NORMAL → WARNING → PROTECTING → STORM → RECOVERY → MAINTENANCE → RESUMING → NORMAL
```

| State | Trigger | Visible behavior |
|---|---|---|
| NORMAL | Default / post-recovery | Standard generation, sun tracking active, "● SYSTEM NORMAL" |
| WARNING | Storm Risk crosses threshold | "⚠ EARLY STORM WARNING", risk % shown, countdown begins |
| PROTECTING | Warning countdown completes | Panels automatically move to safe/stowed position; protective shield visual deploys |
| STORM | Protection complete + storm risk still high | Storm visuals (dust/particles, reduced visibility, darker atmosphere, wind animation); panels remain stowed; generation drops accordingly |
| RECOVERY | Storm conditions subside | "↻ RECOVERY MODE" — inspection begins |
| MAINTENANCE | Recovery inspection finds required cleaning/damage | Cleaning and/or repair sequence runs (see 10.5, 10.6) |
| RESUMING | Maintenance complete, electrical test passes | Panels return to tracking; generation ramps back up |
| NORMAL | Resuming completes | Loop closes |

**Non-negotiable requirement:** the operator triggers the environmental cause (raising wind/dust); the operator never manually presses "Stow Panels," "Deploy Shield," or advances the state machine by hand during the main demo. The full Normal→Warning→Protection→Storm→Recovery cycle must run autonomously off the Storm Risk calculation. Manual overrides may exist for debugging but must not be part of the primary demonstration path.

**Protective shield / safe position:** the exact stowing mechanism can be represented conceptually — panels tilting to a safe angle, folding, or a shield/cover closing — prioritizing clear visual communication of "protected before impact" over mechanical realism.

**Post-storm sequence (from brief):** *"the AI automatically inspects panels for structural or dust damage, cleans affected areas, tests electrical continuity, and resumes operations."*

```text
STORM PASSED
        ↓
RECOVERY MODE
        ↓
INSPECTION (structural + dust damage check)
        ↓
CLEAN AFFECTED AREAS (if required)
        ↓
TEST ELECTRICAL CONTINUITY
        ↓
RESUME GENERATION
```

## 10.4 Multi-Factor Fault Detection & Root-Cause Diagnosis

**Concept (from brief):** *"Standard systems only monitor temperature, but this AI isolates specific root causes — distinguishing whether a power loss stems from extreme heat, dust accumulation, cell degradation, physical cracks, wiring faults, hotspots, or localized shading."*

**Prototype behavior:**

- Each panel's actual output is continuously compared against its **expected output** (derived from current sun angle, temperature, and dust) and against **neighboring panels** under the same environmental conditions.
- When a panel deviates abnormally, the system attributes the loss across candidate root causes and presents a **loss-attribution breakdown**, not just a single "FAULT" flag:

```text
WHY IS OUTPUT LOW? — PANEL #027

Expected Output     4.20 kW
Actual Output       2.70 kW

AI DIAGNOSIS (attributed loss)
Dust                    38%
Temperature             12%
Possible Cell Degradation  9%
Other / Unexplained     41%

Fault Risk: HIGH
Recommended: → Inspect Panel #27
```

- The seven candidate root causes named in the brief — **extreme heat, dust accumulation, cell degradation, physical cracks, wiring faults, hotspots, localized shading** — should all exist as selectable/attributable categories in the diagnosis model, even if only 2–3 are actively demonstrated live (via the "Create Fault" trigger and the dust/heat sliders).
- **Panel-to-panel comparison** view, to visually justify the anomaly call:

```text
Panel #27        Output: 2.8 kW
Nearby panels:   #26 → 4.1 kW   #28 → 4.2 kW   #29 → 4.0 kW
```

- This is simulated/rule-based attribution for the prototype (see Section 13) — the concept being demonstrated is *"detect abnormal behavior → identify panel → isolate probable cause → prioritize maintenance,"* not a production diagnostic model.

## 10.5 Automated Visual & Thermal Inspection

**Concept (from brief):** *"Visual and thermal cameras scanning the farm leverage computer vision to baseline historical image data, automatically detecting physical cracks, discoloration, animal contamination, loose components, and sand buildup."*

**Prototype behavior:**

- No real camera feed or trained CV model is required. Instead, the Panel Selection view (10.8.3) and Fault Detection flow (10.4) surface a simulated **"Visual Inspection"** result when a panel is flagged or selected, framed as if produced by a vision system:

```text
VISUAL INSPECTION — PANEL #027

● Physical crack: not detected
● Discoloration: minor, consistent with dust
● Contamination (animal/debris): not detected
● Loose components: not detected
● Sand buildup: 27% surface coverage
Baseline comparison: -1.8% reflectivity vs. last clean scan
```

- These findings must stay consistent with the panel's actual simulated `dust`, `health`, and `faultStatus` fields — i.e., they are a *presentation layer* over real state, not randomly generated flavor text.
- This module should be clearly labeled in the UI as illustrating what a real visual/thermal inspection system would report, since no physical inspection is occurring (see Section 16, honesty requirements).

## 10.6 Maintenance Prioritization & Waterless Cleaning

**Concept (from brief):** *"Rather than adhering to rigid schedules, the AI quantifies exact dust buildup and lost generation dollars to calculate the precise economic threshold for cleaning... coordinates low-water or dry cleaning technologies — such as dry-brushing robotics, electrostatic dust removal, or targeted air blasts — only when and where financially justified."*

**Prototype behavior — economic cleaning trigger:**

- Cleaning priority is **not** purely a fixed calendar schedule. The system computes an estimated **$-value of generation lost to soiling** per panel/sector, and only escalates cleaning priority once that loss crosses a configurable economic threshold.

```text
CLEANING PRIORITY

Sector B / Panel #27
Priority: HIGH

Dust level:            61%
Est. generation loss:  0.9 kW
Est. value lost/day:   ₹142
Cleaning cost estimate: ₹35
→ Threshold exceeded — cleaning economically justified
```

- The dashboard should still display a **reference schedule** (Last Cleaned / Next Recommended Cleaning) for context, but must make clear that the actual trigger is condition-and-economics-based, and can fire earlier than the scheduled date if soiling loss justifies it.

**Cleaning mechanism (waterless, desert-appropriate):**

- The cleaning visualization should represent one of the water-efficient methods named in the brief — **dry-brushing robotics**, **electrostatic dust removal**, or **targeted air blasts** — rather than a generic "cleaning robot" with no method implied. Pick one primary method for the visual (dry-brushing robot recommended, as it's the most legible in a 3D scene) and label it explicitly in the UI copy so the "waterless" framing lands with the judge.
- Sequence:

```text
Cleaning economically justified
      ↓
Cleaning method dispatched (e.g. dry-brush robot)
      ↓
Panel cleaned
      ↓
Dust ↓  →  Efficiency ↑  →  Output ↑
```

**Maintenance queue (farm-wide):** beyond single-panel cleaning, the system maintains a prioritized queue across all flagged panels, ordered by actual generation-loss severity (not by panel ID or detection time), so a technical team would always work the highest-impact item first.

## 10.7 Extreme-Heat Mitigation

**Concept (from brief):** *"Desert heat significantly reduces PV efficiency. The system continuously tracks panel thermal profiles, predicts heat-induced losses, flags abnormal overheating, and initiates local ventilation or operational adjustments before severe degradation occurs."*

**Prototype behavior:**

```text
Temperature ↑
      ↓
Thermal profile tracked per panel
      ↓
Efficiency loss predicted
      ↓
If abnormal overheating (panel deviates from expected thermal curve):
      → Flag panel, contribute to fault diagnosis (10.4)
      → Trigger "ventilation / operational adjustment" indicator
      ↓
Power output ↓ (reflecting real thermal efficiency loss)
```

- The temperature slider on the Controller should visibly affect both the farm-wide efficiency metric and, for the currently selected panel, a thermal-profile readout.
- "Ventilation or operational adjustment" can be represented as a dashboard status indicator (e.g., a small "Thermal Management: ACTIVE" badge) rather than a distinct 3D animation — this is a lower-visual-priority feature relative to storm defense and cleaning.

## 10.8 Energy Storage & Intelligent Routing

**Concept (from brief):** *"When paired with energy storage, the AI expands beyond panel management into an intelligent grid controller. By evaluating real-time production, battery state-of-charge, local load requirements, dynamic grid pricing, and upcoming weather forecasts, it dynamically routes power — determining whether to supply immediate local consumption, charge storage reserves, or export energy to the grid during peak-demand windows."*

**Prototype behavior:**

- Extend the existing energy-flow visualization (10.8.5) with a simple **routing decision layer**:

```text
ENERGY ROUTING DECISION

Production:        4.6 MW
Battery SoC:        62%
Local load:          LOW
Grid price:          PEAK (₹9.2/unit)
Forecast:            Clear, next 3 hrs

→ DECISION: Export to grid (peak pricing window)
```

- Inputs feeding the routing decision (battery state-of-charge, local load, a simulated grid price signal, and a simple weather-forecast flag) can all be simulated values that update on a slow tick (e.g., every 10–20 seconds) or shift in response to the Controller's environmental sliders — they do not need their own dedicated controls.
- Routing decision should visibly change the downstream energy-flow diagram (which path — Grid vs. Storage vs. Local — is highlighted as active).
- This module is explicitly **Tier 2** (Section 14) — a differentiator if time allows, not required for the core storm/dust/tracking demo to succeed.

## 10.9 Two Interfaces

### 10.9.1 Interface A — Judge Dashboard (primary, projected)

Must read as a professional solar-farm operations/control-center product, not a generic admin template. Required sections:

- **A. Live Status strip** — Power Output, Efficiency, Panel Health, Dust Level, Temperature, Wind — all live-updating.
- **B. Large 3D Live Monitor** — the dominant visual element; shows the same farm state as the controller's 3D view (panels, desert, sun, orientation, dust, storm, cleaning activity, faulty panels, protective behavior). Must actually react to state changes, never a static render.
- **Panel selection** — clicking a panel in the 3D scene selects it and opens its detail panel (output, temperature, dust, health, last/next cleaning, and the Visual Inspection readout from 10.5).
- **C. AI Operations panel** — Storm Risk, Soiling Risk, Fault Risk, Cleaning Priority, Generation Forecast, all reactive to state.
- **D. Event Timeline** — chronological, live-updating log (e.g. `16:42:03 Wind increased` → `16:42:08 Storm risk detected` → `16:42:10 Protective mode activated` → …). This is the judge's fallback if they miss a visual beat.
- **E. Energy Flow diagram** — Generation → Grid/Storage → Shared Solar → Households, with the routing decision (10.8) highlighting the active path.
- **Live Alerts / System State banner** — reflects the top-level state machine (Section 10.3 table) at all times.

### 10.9.2 Interface B — Controller (operator, mobile-first)

- Primary purpose: manipulate the **environment**, not the panels. Sliders for Sun Angle, Dust Level, Wind Speed, Temperature; one-tap triggers for Simulate Dust, Simulate Storm, Create Fault, Reset.
- Must be usable one-handed, on a phone, without looking away from the projected dashboard for long — large touch targets, minimal text, no dense desktop-style controls.
- No manual "Stow Panels" / "Start Cleaning" controls should be part of the primary demo flow (debug-only controls may exist but must be visually/structurally separated from the main panel).

### 10.9.3 3D Scene Requirements

- Sandy desert terrain, subtle terrain variation, non-photorealistic but atmospheric; clean visualization prioritized over realism.
- 2–3 visible, fully modeled panels (surface, frame, support structure, tracking mechanism, panel ID, orientation, and visible operational/dust/health state) — enough to demonstrate tracking, dust difference, faults, cleaning, and storm protection without rendering an entire farm.
- Panel states that must be visually distinguishable: NORMAL, TRACKING, DUSTY, FAULT, PROTECTING, PROTECTED, INSPECTION, CLEANING, RECOVERY, ONLINE.

## 10.10 Reset / Demo Safety

A single, reliable reset action must restore: normal sun position, zero dust, calm wind, normal temperature, all panels operational and correctly oriented, no active storm, no active cleaning, normal generation, "NORMAL" system state, and a cleared/reset event log. This exists so the operator can recover instantly if the live demo goes sideways in front of judges.

---

# 11. Farm Data Model

Conceptual shape of the single shared state object. Implementation details (exact tech, field types) are flexible, but this separation of concerns should be preserved:

```text
FarmState

environment:
    sunAngle, sunPosition
    dustLevel
    windSpeed
    temperature
    stormIntensity
    visibility

prediction:
    stormRisk
    soilingRisk
    faultRisk
    heatLossRisk
    generationForecast

farm:
    totalPower
    efficiency
    health
    operatingMode        # NORMAL | WARNING | PROTECTING | STORM | RECOVERY | MAINTENANCE | RESUMING

panels:
    id
    position, orientation
    output, expectedOutput
    dust, temperature, health
    state                 # NORMAL | TRACKING | DUSTY | FAULT | PROTECTING | PROTECTED | INSPECTION | CLEANING | RECOVERY | ONLINE
    lastCleaned, nextCleaning
    faultStatus, faultAttribution   # {heat, dust, degradation, crack, wiring, hotspot, shading}
    visualInspection       # {crack, discoloration, contamination, looseComponents, sandBuildup}

maintenance:
    cleaningQueue          # ordered by economic loss, not detection time
    currentOperation
    priority

energy:
    generated
    batterySoC
    gridPrice
    routingDecision         # LOCAL | STORAGE | GRID
    grid, storage, sharedSolar

events:
    timestamp, eventType, message
```

---

# 12. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Real-time sync** | State changes must propagate to both interfaces with imperceptible lag during a live demo; no polling delay that breaks the "same state" illusion |
| **Performance** | Smooth interaction and stable demo behavior take priority over visual fidelity; 3D geometry must stay lightweight enough to run on a normal laptop |
| **Visual design** | Modern, technical, clean, data-dense-but-readable, dark/professional control-room aesthetic; explicitly avoid generic SaaS templates, "school project" card grids, or gaming-HUD effects |
| **Animation** | Every animation should communicate a state change (panel rotation, dust accumulation, storm particles, cleaning motion, stowing, recovery, live number transitions, timeline updates) — no decorative motion unrelated to system behavior |
| **Mobile (Controller)** | Large touch targets, minimal text, simple single-screen layout |
| **Responsive (Dashboard)** | Remains usable on a laptop; on narrow screens, secondary panels stack below the 3D view rather than compressing it |
| **Resilience** | Reset must work reliably under demo pressure (Section 10.10) |

---

# 13. Real Calculations vs. Simulated/Rule-Based AI

To avoid wasting build time on unnecessary ML work, and to keep the honesty requirements in Section 16 easy to satisfy, this is the intended real/simulated split:

| Compute with real math/logic | Simulate / rule-base for the prototype |
|---|---|
| Sun angle and panel tracking orientation | Storm probability |
| Approximate power generation | Fault risk and root-cause attribution |
| Dust-driven efficiency loss | Soiling risk |
| Temperature-driven efficiency loss | Cleaning priority / economic threshold |
| Panel state transitions | Loss attribution percentages |
| Cleaning effect on output | Generation forecasting |
| Storm protection state transitions | Visual/thermal inspection findings |
| Energy-flow arithmetic | Energy routing decision logic |

The system must still behave **consistently and believably** — a simulated value should never contradict a real one (e.g., soiling risk should not read "LOW" while dust-driven efficiency loss reads 40%).

---

# 14. Prioritization (MoSCoW-style)

### Tier 1 — MUST WORK (core demo depends on these)

- Shared real-time state, rendered identically in two synchronized 3D views
- Sun movement + automatic panel tracking
- Dust simulation, with visible panel soiling and output impact
- Storm prediction/risk calculation (prototype logic) and the full autonomous Normal→Warning→Protection→Storm→Recovery cycle, including the visible countdown
- Live-updating dashboard metrics

### Tier 2 — SHOULD WORK (strong differentiators, from the expanded ideathon brief)

- Panel selection with detail view
- Multi-factor fault simulation with root-cause attribution (10.4)
- Simulated visual/thermal inspection readout (10.5)
- Economic, threshold-based cleaning prioritization with waterless cleaning visualization (10.6)
- Event timeline
- Energy-flow diagram with routing decision (10.8)
- Cleaning schedule display (Last/Next Cleaned)

### Tier 3 — NICE TO HAVE

- Highly detailed 3D environment
- Real/trained ML models for any of the above
- Extreme-heat ventilation visualization as its own animated system (10.7)
- Realistic cleaning robotics geometry
- Detailed multi-battery / multi-tariff grid simulation

**If time runs out, cut Tier 3 first, then the less-visual parts of Tier 2 (energy routing, heat visualization) before ever compromising Tier 1.**

---

# 15. The 3-Minute Demo Script

The product should be built to make this sequence work end-to-end, live, with no manual panel control:

1. **Normal operation** — farm generating (~4.8 MW / ~91% efficiency / ~98% health / LOW storm risk), sun moving, panels tracking.
2. **Introduce dust** — dust rises → panels visibly soil → output drops → "SOILING DETECTED" → economic cleaning threshold crossed → "CLEANING PRIORITY — SECTOR B" → dry-brush cleaning runs → output recovers.
3. **Introduce storm conditions** — wind rises → Storm Risk climbs (e.g. 18% → 82%) → "AI EARLY WARNING" → countdown → panels automatically stow (operator does not touch them).
4. **Storm** — storm visuals play; panels remain protected; generation dips accordingly.
5. **Recovery** — "RECOVERY MODE" → inspection (structural + dust check, 10.5) → clean if required → test electrical continuity → resume; generation ramps back up.
6. **End on energy** — Generation → Grid/Storage → Shared Solar → Households, closing the loop back to the original problem statement (Section 2).

If time allows within the 3 minutes, a fault-injection beat (10.4) can be inserted between steps 2 and 3 to show root-cause diagnosis distinct from the dust/storm story.

---

# 16. Honesty & Claims Guidelines

Because this is a prototype standing in for a much larger real-world system, the product must not overstate what it actually does. Do not present or word any UI copy as:

- "100% autonomous," "100% accurate prediction," "maximum efficiency," "zero maintenance," "guaranteed storm prediction"
- "Fully trained AI" for anything that is rule-based
- "10-second real-world storm prediction" (the countdown is a compressed demo representation of the brief's "up to 25 minutes in advance" concept, not a literal claim)
- "Completely eliminates rooftop solar" (the pitch is *reducing dependence on* universal rooftop adoption, not eliminating rooftop solar as a category)
- "Works without human intervention under all conditions"
- Any claim that the simulated visual/thermal inspection (10.5) or fault attribution (10.4) reflects real computer-vision inference

Where a feature is simulated, UI copy should read as a **prototype demonstration of the concept**, not as an assertion of a production capability already built.

---

# 17. Risks & Assumptions

| Risk / Assumption | Notes |
|---|---|
| Real-time sync fails or lags live, breaking the "one shared state" illusion during judging | Mitigate by keeping the sync mechanism simple (Section 8) and rehearsing the full 3-minute script before presenting |
| Judges may probe on "is this real AI," given the brief's ML/CV/sensor framing | Product must be able to honestly say which parts are real calculations vs. rule-based simulation (Section 13) without undercutting the pitch |
| Tier 2/3 scope creep threatens Tier 1 demo reliability | Section 14 prioritization exists specifically to prevent this — Tier 1 is non-negotiable |
| Ideathon judges evaluate feasibility of desert-solar-at-scale, not just the software demo | Keep the Problem Statement (Section 2) and energy-flow-to-households framing visibly present in the UI, not just in this document |
| Network/venue conditions during live judging | Reset mechanism (10.10) and a rehearsed manual fallback narration should exist in case of technical failure |

---

# 18. Open Questions

- Which fault-attribution categories (of the seven named in the brief) get an active, demoable trigger vs. which are shown only as static UI categories?
- Does the energy-routing module (10.8) make the cut given the 3-minute time budget, or does it stay as a dashboard-only visual with no live decision changes?
- Exact wording/labeling for the "compressed" storm countdown, to stay honest per Section 16 while remaining punchy for a live pitch.

---

# 19. One-Sentence Product Summary

> **"A real-time synchronized digital twin of an autonomous desert solar farm where an operator remotely manipulates environmental conditions from a controller, while a professional judge-facing web dashboard renders the exact same live 3D farm — with autonomous sun tracking, AI-based storm/soiling/fault/heat analysis, automatic protective and cleaning actions, simulated visual/thermal inspection, economic maintenance prioritization, intelligent energy routing, live operational metrics, and an event timeline — demonstrating that centralized, AI-managed desert solar can reduce India's dependence on individual rooftop adoption."**

**The single most important implementation requirement:** the controller and judge dashboard must never have separate simulation states — they must render one shared farm state in real time.

# END OF DOCUMENT

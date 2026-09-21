# Combined Web Application Build Specification & PRD – Phase‑Based Document

*This document merges the **Complete Web Application Build Specification** and the **Product Requirements Document (PRD)** for the Autonomous Desert Solar Farm digital twin.  It is organized into clear phases to aid downstream AI agents in planning, implementation, and verification.*

---

## Phase 0 – Overview & Core Vision

- **Goal**: Build a live, interactive digital twin of an autonomous desert solar farm where an operator manipulates environment (controller) and a professional dashboard (judge) displays the same shared state in real‑time.
- **Key Concepts**:
  - One **shared authoritative farm state** (Specification §2, PRD §8).
  - Two synchronized web interfaces (Controller & Judge Dashboard) (Spec §4‑5, PRD §9‑10).
  - Real‑time sync via lightweight mechanisms (WebSockets/Socket.IO/Firebase/etc.) (Spec §3, PRD §8).
- **Stakeholders**: Operator, Judges, Future end‑users (households) (PRD §6).
- **Success Metrics**: Full autonomous sense→predict→protect→recover cycle without manual panel control (Specification §1, PRD §5).

---

## Phase 1 – Functional Scope & Tier Prioritization

| Tier | Must‑Have (Tier 1) | Should‑Have (Tier 2) | Nice‑to‑Have (Tier 3) |
|------|-------------------|---------------------|----------------------|
| **Core** | Shared state, sun tracking, dust simulation, storm prediction & protection, live metrics (Spec §§1‑5, PRD §§14‑15) | Panel selection, fault simulation, visual/thermal inspection, cleaning prioritization, event timeline, energy routing (Spec §§10‑12, PRD §§10‑11) | High‑fidelity 3D, trained ML models, advanced cleaning robotics (Spec §14, PRD §14) |

**In‑Scope (Prototype)** – PRD §7.1 lists the exact features to implement for the demo.

---

## Phase 2 – System Architecture & Data Model

### 2.1 Shared Farm State
- Central `FarmState` object (Specification §32, PRD §11).  Contains:
  - `environment` (sun, dust, wind, temperature, stormIntensity, visibility)
  - `prediction` (stormRisk, soilingRisk, faultRisk, heatLossRisk, generationForecast)
  - `farm` (totalPower, efficiency, health, operatingMode)
  - `panels[]` (id, position, orientation, output, expectedOutput, dust, temperature, health, state, lastCleaned, nextCleaning, faultStatus, visualInspection)
  - `maintenance`, `energy`, `events`

### 2.2 Real‑time Synchronization
- Recommended tech: **WebSockets** (or Socket.IO, Firebase Realtime, Supabase). Keep it lightweight; avoid polling.
- Both interfaces subscribe to the same state channel; any mutation propagates instantly.

---

## Phase 3 – UI / Interaction Design

### 3.1 Controller (Interface B)
- Mobile‑first layout with large touch targets.
- **Sliders**: Sun Angle, Dust Level, Wind Speed, Temperature.
- **One‑tap actions**: Simulate Dust, Simulate Storm, Create Fault, Reset.
- No manual panel controls in the primary demo (Spec §5, PRD §10.9.2).

### 3.2 Judge Dashboard (Interface A)
- Dark, professional control‑room aesthetic.
- Sections:
  - **Live Status** (power, efficiency, health, dust, temperature, wind).
  - **Large 3D Live Monitor** (shared state view).
  - **Panel Selection Detail**.
  - **AI Operations Panel** (storm risk, soiling risk, fault risk, cleaning priority, generation forecast).
  - **Event Timeline** (live log).
  - **Energy Flow Diagram** (generation → grid/storage → shared solar → households).
  - **Live Alerts / System State banner** (NORMAL → WARNING → …).

---

## Phase 4 – Core Feature Implementations

### 4.1 Sun & Panel Tracking
- Sun position controllable via controller slider.
- Panels automatically compute orientation from sun angle (real calculation) (Spec §10.2, PRD §10.2).

### 4.2 Dust Simulation & Cleaning Chain
- Dust level controlled; visual dust overlay on panels.
- Dust reduces efficiency; AI detects loss → cleaning priority → dry‑brush robot visualization (Spec §12‑13, PRD §10.6).

### 4.3 Storm Prediction & Protective Cycle
- Rule‑based stormRisk (wind, dust, visibility).
- Countdown visual (≈10 s) triggers automatic panel stow/protect (Spec §17‑19, PRD §10.3).
- Post‑storm recovery, inspection, cleaning, and resume (Spec §20‑21, PRD §10.3).

### 4.4 Fault Detection & Root‑Cause Attribution
- Compare panel output vs. expected; flag abnormal panels.
- Display loss‑attribution breakdown (dust, temperature, degradation, etc.) (Spec §21‑22, PRD §10.4).

### 4.5 Maintenance & Economic Cleaning Prioritization
- Compute estimated generation loss (₹) vs. cleaning cost; trigger cleaning when threshold exceeded (Spec §24‑25, PRD §10.6).

### 4.6 Energy Routing (Tier 2 optional)
- Simulated battery SoC, grid price, routing decision layer (PRD §10.8).

---

## Phase 5 – Demo Script (3‑Minute Flow)

1. **Normal Operation** – Sun moves, panels track, metrics stable.
2. **Dust Event** – Increase dust → output drop → cleaning priority → dry‑brush cleaning → recovery.
3. **Storm Event** – Raise wind → stormRisk spikes → early warning → countdown → panels protect → storm visual → recovery.
4. **Optional Fault Injection** – Trigger panel fault → diagnosis panel shows root‑cause breakdown.
5. **Energy Flow Finale** – Show generation → grid/storage → shared solar → households.

(Full script in PRD §15.)

---

## Phase 6 – Non‑Functional Requirements & Quality Goals

- **Real‑time sync** with imperceptible lag (PRD §12).
- **Performance** – lightweight 3D, runs on a normal laptop.
- **Visual Design** – modern, dark, data‑dense, no generic SaaS templates.
- **Resilience** – reliable Reset (Specification §10.10, PRD §10.10).
- **Honesty** – UI must label simulated AI as prototype (PRD §16).

---

## Phase 7 – Open Questions & Product Architecture Resolutions (Implemented)

### 7.1 Seven Fault-Attribution Categories (Active Demo Triggers)
All seven fault-attribution categories named in the specification & PRD (§10.4 & §11) are fully implemented with active, live demoable triggers and distinct visual telemetry/inspection feedback:
1. **Cell Hotspot (Thermal IR Anomaly)**: Active trigger via Controller dropdown → Injects localized substring hotspot, bypass diode alert, and emissivity variance.
2. **Silicon Micro-Crack**: Active trigger via Controller dropdown → Injects silicon wafer micro-fracture, electroluminescence drop, and high-impedance derate.
3. **String Connector Resistance / Loose MC4**: Active trigger via Controller dropdown → Injects DC terminal junction bloom and circuit continuity anomaly.
4. **Localized Horizon Shading**: Active trigger via Controller dropdown → Injects sharp contrast optical shadow derating.
5. **Cell EVA Polymer Degradation**: Active trigger via Controller dropdown → Injects photothermal polymer browning and UV transmission loss.
6. **Dust & Sand Soiling**: Active trigger via "Simulate Soiling" button or Dust slider → Injects surface particulate derate, triggers economic cleaning prioritization queue.
7. **Desert Thermal Derating**: Active trigger via Temperature slider (>25°C) → Computes live -0.4%/°C thermal loss derate and heat loss attribution.

### 7.2 Live Dynamic Energy Routing Module
- **Resolution**: Fully live and dynamically calculated in real time (not a static visual).
- **Behavior**:
  - Calculates live energy conservation: $P_{\text{generated}} = P_{\text{grid}} + P_{\text{storage}} + P_{\text{sharedSolar}}$.
  - Dynamic tariff pricing tiers: **PEAK (₹9.2/kWh)** at >3.0 MW, **STANDARD (₹6.5/kWh)** at 1.2–3.0 MW, and **OFF-PEAK (₹4.2/kWh)** at low solar/night.
  - Active route switching (`GRID_EXPORT`, `BATTERY_CHARGE`, `COMMUNITY_DIRECT` / BESS discharge) with real-time HUD path highlights and rural household delivery metrics.

### 7.3 Honest & Punchy Storm Countdown Wording
- **Resolution**: Clear, punchy wording compliant with PRD §16 (Honesty Guidelines) and PRD §10.3 (Autonomous Storm Cycle):
  - **Banner Title**: `"AI EARLY STORM WARNING"`
  - **Banner Tag**: `"COMPRESSED DEMO HORIZON (10s = 25m REAL-WORLD)"`
  - **Alert Description**: `"Severe wind & dust front detected. Autonomous defensive array stow initiated."`
  - **Countdown Label**: `"STOW IN [X]s"`
  - **Event Log**: `"AI Storm Early Warning: Risk evaluated at [X]%. 10-second compressed protective countdown initiated."`
  - **Controller Subtitle**: `"High wind front, 10s AI warning & defensive stow (fast demo cycle)"`

---

## Phase 8 – Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Real‑time sync lag breaking the shared‑state illusion | Use simple WebSocket broadcast; test under demo conditions. |
| Judges probing AI authenticity | Clearly mark rule‑based components per PRD §16. |
| Scope creep into Tier 3 | Strict adherence to Tier prioritization (Specification §14, PRD §14). |
| Venue network issues | Ensure Reset works instantly; have a manual fallback narration. |

---

## Phase 9 – Implementation Guidance & Verification Pipeline (Implemented)

The full 10-step implementation guidance pipeline is fully realized, cross-validated, and verified across all system layers:

1. **Project Skeleton & Asset Distribution**:
   - Express HTTP + WebSocket server (`server.js`) serving modular vanilla JS/HTML/CSS architecture.
   - Three.js WebGL 3D engine bundled and served from `/vendor/three/`.
   - Dual web interfaces: Judge Dashboard (`/` or `/dashboard`) and Operator Controller (`/controller`).

2. **Authoritative Shared State Module**:
   - Central `FarmState` singleton maintaining single source of truth (`environment`, `prediction`, `farm`, `panels[]`, `maintenance`, `energy`, `events`).
   - Instant real-time delta and full-state broadcasts to all connected WebSocket clients with latency ring buffer tracking.

3. **High-Fidelity 3D Scene**:
   - Built with Three.js (`public/js/scene3d.js`) featuring desert terrain geometry, procedural dunes, dynamic sun directional lighting with shadows, 3 dual-axis solar tracker assemblies (`PV-01`, `PV-02`, `PV-03`), sandstorm particle emitter, and animated dry-brush robotic cleaning system.

4. **Operator Controller UI**:
   - Mobile-first touch-friendly control panel (`public/controller.html` & `public/js/controller.js`) with responsive sliders (sun angle, dust level, wind speed, temperature), 1-tap action triggers (Simulate Dust, Simulate Storm, Simulate Soiling, Clear Fault, Instant Reset), 7-category fault selector, and 3-minute demo rehearsal runner.

5. **Judge Dashboard UI**:
   - Dark control-room control center (`public/index.html` & `public/js/dashboard.js`) featuring top operational metrics strip, large 3D live monitor HUD, panel selection inspector, AI Operations panel, live event timeline auto-log, dynamic energy routing diagram with live tariff tiers, and system state alert banner with compressed 10s storm countdown.

6. **Real Physics Calculations Engine**:
   - Sun tracking: Optimal tilt computed trigonometrically as $\text{tilt} = \max(10, \min(75, 90 - \text{sunAngle}))$.
   - Desert thermal derating: IEC 61215 standard $-0.4\%/^\circ\text{C}$ loss above $25^\circ\text{C}$ STC baseline.
   - Optical dust attenuation: Transmission loss model $P_{\text{dustLoss}} = (\text{dustLevel} / 100) \times 0.38$.
   - 7-factor loss attribution arithmetic: Exact mathematical decomposition across heat, dust, degradation, hotspot, micro-crack, wiring resistance, and shading.
   - Dynamic energy conservation: $P_{\text{generated}} = P_{\text{grid}} + P_{\text{storage}} + P_{\text{sharedSolar}}$.
   - Economic cleaning ROI: Threshold evaluation of $\text{DailyLoss}_{\text{INR}} > \text{CleaningCost}_{\text{INR}}$.

7. **Rule-Based AI Modules (PRD §16 Compliant)**:
   - Multi-sensor storm risk model: $\text{risk} = (\text{windSpeed}/120)\times 65 + (\text{dustLevel}/100)\times 35 + ((100-\text{visibility})/100)\times 20$.
   - Autonomous 10s compressed storm defense cycle: WARNING $\rightarrow$ 10s countdown $\rightarrow$ PROTECTING (stow tilt $15^\circ$) $\rightarrow$ STORM $\rightarrow$ RECOVERY $\rightarrow$ CLEANING $\rightarrow$ RESUMING $\rightarrow$ NORMAL.
   - Fault detection & classification: Output vs baseline comparison isolating 7 discrete anomaly profiles.
   - Soiling risk classifier: Threshold categorizer (`LOW` / `MEDIUM` / `HIGH` / `CRITICAL`).
   - Simulated visual & thermal CV report: Deterministic inspection strings for drone/camera diagnostics.
   - Generation forecast model: Condition-based generation trajectory estimator.

8. **Unidirectional Reactive Event Flow**:
   - SENSE $\rightarrow$ UNDERSTAND $\rightarrow$ PREDICT $\rightarrow$ PROTECT $\rightarrow$ RECOVER $\rightarrow$ OPTIMIZE event loop.
   - Any environmental change triggers immediate physics recalculation, AI risk evaluation, autonomous state transitions, and real-time WebSocket broadcast to all connected interfaces.

9. **Instant Reset & Resilience Architecture**:
   - Sub-500ms baseline recovery via WebSocket action `RESET` and REST endpoint `POST /api/reset`.
   - Idempotent execution clearing all active timers, restoring default parameters, and resetting arrays to pristine baseline.

10. **Demo Rehearsal & Verification Pipeline**:
    - Complete 5-stage 3-minute scripted demo (`DEMO_RUN`) and automated accelerated rehearsal runner (`/api/demo-rehearsal`).
    - Dedicated Phase 9 verification test suite (`test_phase9.js`) auditing all 10 guidance checkpoints and executing the complete rehearsal cycle.

---

*All sections are cross‑referenced to the original documents:* 
- Specification: `COMPLETE WEB APPLICATION BUILD SPECIFICATION.md` 
- PRD: `PRD_Autonomous_Desert_Solar_Farm.md`

*End of combined phase‑based document.*

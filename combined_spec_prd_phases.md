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

## Phase 7 – Open Questions (to be answered by Product Owner)

- Which of the seven fault‑attribution categories will have active demo triggers?
- Should the energy‑routing module be fully live or a static visual only?
- Precise wording for the compressed storm countdown to stay honest yet punchy.

---

## Phase 8 – Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Real‑time sync lag breaking the shared‑state illusion | Use simple WebSocket broadcast; test under demo conditions. |
| Judges probing AI authenticity | Clearly mark rule‑based components per PRD §16. |
| Scope creep into Tier 3 | Strict adherence to Tier prioritization (Specification §14, PRD §14). |
| Venue network issues | Ensure Reset works instantly; have a manual fallback narration. |

---

## Phase 9 – Implementation Guidance for Development Team

1. **Set up project skeleton** (e.g., Vite + vanilla JS/HTML/CSS).
2. **Create shared state module** (`FarmState` JSON, synchronized via WebSocket server).
3. **Build 3D scene** (Three.js) with 2‑3 panels, desert terrain, sun light.
4. **Implement controller UI** (sliders + action buttons).
5. **Implement dashboard UI** (status strip, 3D view, panels, AI ops, timeline, energy flow).
6. **Add real calculations** (sun angle → panel orientation, dust/temperature efficiency loss).
7. **Add rule‑based AI modules** (storm risk, fault risk, cleaning priority).
8. **Wire up event flow** (environment → sensing → AI → actions → state updates).
9. **Create Reset endpoint** to restore default state instantly.
10. **Iterate with demo rehearsals**, focusing on Tier 1 features first.

---

*All sections are cross‑referenced to the original documents:* 
- Specification: `COMPLETE WEB APPLICATION BUILD SPECIFICATION.md` 
- PRD: `PRD_Autonomous_Desert_Solar_Farm.md`

*End of combined phase‑based document.*

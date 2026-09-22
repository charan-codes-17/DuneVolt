# DuneVolt — Demo Strategy & Project State Document

> **Purpose:** A single reference for any presenter to understand what is built, what is simulated, what is missing, and exactly how to conduct the ideal end-to-end demo.

---

## 1. What Is Already Completed

### ✅ Fully Implemented & Working

**Infrastructure**
- Node.js + Express server (`server.js`) with native WebSocket sync (`ws` library)
- Single authoritative `FarmState` singleton — one state, two synchronized views
- Auto-reconnect with exponential backoff (up to 50 retries); PING/PONG latency ring-buffer
- REST API fallbacks: `/api/state`, `/api/health`, `/api/reset`
- Instant full reset in < 500 ms via button, hotkey (`Shift+R`), or POST `/api/reset`

**Judge Dashboard (`/`)**
- Header: live IST clock, SYNCED/OFFLINE badge with real latency (ms), system-mode pill
- Full-width AI alert banner with 10-second countdown timer
- 6-metric live telemetry strip: Power (MW), Efficiency (%), Health (%), Dust (%), Temp (°C), Wind (km/h)
- 3D WebGL scene (Three.js): desert terrain with procedural dune waves, sky dome, sun sphere + directional lighting
- 3 dual-axis solar tracker assemblies (PV-01, PV-02, PV-03) with procedural PV cell canvas texture, steel masts, gimbal torque boxes, dust overlay mesh, RGB LED status indicators, selection halo rings
- Smooth panel tilt interpolation (lerp at 6%) responding to live sun angle
- Sandstorm particle system (2,800 particles) with wind velocity simulation and storm-mode 2.4× speed multiplier
- Animated waterless dry-brush cleaning robot (amber beam + dual cylinders + cyan beacon) traversing panel surface
- Camera orbit (drag), zoom (scroll wheel), 3 preset views: Overview / Array Close-up / Profile
- Click-to-select any array via Three.js raycasting → Panel Inspector updates instantly
- FPS counter (green ≥ 45 / amber ≥ 25 / red < 25) with HQ / SAVER quality mode toggle
- HUD chips: Sun Elevation, Tracking Tilt, Farm Mode, Cleaning progress % overlay
- AI Operations panel: Storm Risk % (animated bar, colour-coded), Soiling Risk tier, Heat Derating (IEC 61215), Fault Risk, Economic Cleaning Priority — every module labeled `⚙ RULE-BASED` or `∑ REAL MATH` (PRD §16)
- Generation Loss Attribution bar (Nominal / Dust / Thermal / Anomaly) with live segment percentages
- Prioritized Economic Cleaning Queue ranked by estimated ₹/day loss vs. dispatch threshold
- Per-panel inspector: output vs. expected MW, surface dust %, operating temp, last/next cleaned date
- 7-factor root-cause loss chips: Dust, Thermal, Hotspot, Wiring, Crack, Shading, Degradation
- Simulated Visual/Thermal CV inspection report: crack detection, discoloration, contamination, sand coverage, findings summary
- Dynamic Energy Routing diagram: Generation → Regional Grid / Desert BESS / Rural Households with active-route highlight and live tariff tier badge (PEAK ₹9.2 / STANDARD ₹6.5 / OFF-PEAK ₹4.2/kWh)
- Chronological Live Event Timeline (auto-scrolling, top 25 events, colour-coded by type)
- 5-stage Demo Mode overlay (step dots, progress bar, SVG ring timer, stage name, narration, stop button)
- Prototype Architecture & Honesty Modal (PRD §13 & §16) triggered from header and footer
- Compliance footer with "real math vs rule-based AI breakdown" link

**Operator Controller (`/controller`)**
- Mobile-first interface with live sync bar (mode + MW)
- 4 environmental sliders: Sun Elevation (10–90°), Dust (0–100%), Wind (0–120 km/h), Temperature (20–55°C)
- One-tap buttons: Simulate Sandstorm, Simulate Soiling, Inject Array Fault, Dispatch Robot, Instant Reset
- Array selector (PV-01/02/03) and 5-type fault selector (Hotspot, Crack, MC4 Wiring, Shading, EVA Degradation)

**Autonomous State Machine (server-side)**
- Full state cycle: `NORMAL → WARNING → PROTECTING → STORM → RECOVERY → CLEANING → RESUMING → NORMAL`
- Storm Risk composite formula (wind + dust + visibility) triggers autonomous panel stow at 15° defensive tilt
- 7-fault classification: per-factor loss attribution computed and injected per panel
- Economic ROI dispatch: cleaning only when daily ₹ loss exceeds ₹ cleaning cost threshold

---

## 2. Current State — Working vs Simulated vs Future

| Category | Status |
|---|---|
| Real-time WebSocket sync (two interfaces) | ✅ Working |
| 3D panel tilt tracking from sun angle | ✅ Working (real trig formula) |
| Storm particle system & autonomous stow | ✅ Working |
| Live telemetry strip & energy routing | ✅ Working |
| IEC 61215 thermal derating math | ✅ Real physics formula |
| Dust optical attenuation formula | ✅ Real math |
| Energy balance conservation arithmetic | ✅ Real math |
| Storm / soiling / fault AI classification | ⚙️ Rule-based / simulated (clearly labeled) |
| Visual/Thermal CV inspection report | ⚙️ Simulated — deterministic strings derived from state |
| Cleaning robot animation | ⚙️ Simulated — progress counter drives X position |
| Battery SoC, grid tariff pricing | ⚙️ Simulated — rule-based routing logic |
| Second 3D view on controller screen | ⚠️ Uncertain — controller shows text sync bar only, not a mirrored 3D scene |
| Real weather / satellite data ingestion | ❌ Not implemented — all inputs are manual or scripted |
| Trained ML model for storm prediction | ❌ Not implemented — rule-based threshold, PRD §16 compliant |

---

## 3. What Remains / Should Be Completed

Priority order for a convincing demo:

1. **Run `npm start` and confirm both URLs load before the presentation** — venue network / port blocks are the most likely failure point.
2. **Validate the `🎬 Start Demo` auto-sequence runs all 5 stages without any manual slider input** — this is the single most important polish item.
3. **(Nice-to-have) Add a mirrored mini-3D view on the controller** — README promises two synchronized 3D views; controller currently only shows a text sync bar. Even a small canvas would strengthen the "live digital twin" claim.
4. **(Nice-to-have) Per-stage talking-point cards** — on-screen tooltips or a floating narration box per demo stage so the presenter can pause without losing the audience.
5. **(Nice-to-have) Reset toast/flash feedback** — brief on-screen confirmation after reset so judges see the system "restart cleanly."

---

## 4. Ideal End-to-End Demo Workflow

**Setup:** Dashboard on projected screen. Controller on presenter's phone/tablet. Server on `localhost:3000`.

| # | Stage | Presenter Action | Audience Sees | Key Talking Point |
|---|---|---|---|---|
| 1 | **Problem** | No interaction — point to dashboard | 4.82 MW live, 91% efficiency, panels autonomously tracking | *"Desert solar is plagued by dust, heat, sandstorms. DuneVolt automates all of it."* |
| 2 | **Solar Environment** | Drag Sun Elevation slider on controller | 3D sun sphere moves; all panels tilt in real time; HUD shows new tilt angle | *"Real formula: tilt = 90° − sun angle. No manual control."* |
| 3 | **Sensors & Dust** | Slowly raise Dust slider to ~60% | Dust overlay darkens on 3D panels; MW drops; Loss Attribution bar shifts; Cleaning Queue shows ₹ loss | *"Sensors detect soiling attenuation. Economic model calculates revenue loss vs. cleaning cost."* |
| 4 | **AI Decision** | Watch AI Ops panel | Cleaning Priority changes from STANDBY → DISPATCH JUSTIFIED; Event Timeline logs decision | *"AI decides to dispatch — not because dust is high, but because ₹ loss crossed the ROI threshold."* |
| 5 | **Cleaning** | Tap **Dispatch Robot** (or watch auto-trigger) | Robot traverses PV-02; HUD shows "🧹 0–100%"; dust overlay fades; MW recovers | *"Waterless dry-brush — no water waste in the desert."* |
| 6 | **Storm Warning** | Tap **Simulate Sandstorm** | Alert banner appears; storm risk bar goes red; 10-second countdown begins | *"AI sees wind + dust composite exceed threshold. 10 s demo = 25-minute real-world radar horizon."* |
| 7 | **Autonomous Stow** | Wait for countdown | All 3 panels tilt to 15° automatically; LEDs turn amber; mode = AUTONOMOUS ARRAY STOW | *"Nobody touched the panels. The farm protected itself."* |
| 8 | **Storm Active** | Watch 3D scene | 2,800 sand particles swirl; fog thickens; sun dims; MW drops sharply; Loss bar shows anomaly | *"Full storm — panels physically protected, minimal structural loss."* |
| 9 | **Recovery & Inspection** | Watch auto-transition | Panels tilt back; CV inspection report updates; Timeline logs each autonomous action | *"Post-storm inspection: crack detection, sand coverage, baseline comparison — autonomous."* |
| 10 | **Fault Detection** | Select PV-01, choose Cell Hotspot, tap **Inject Fault** | PV-01 LED pulses red; Inspector shows ANOMALY; 7-factor chips update; Queue reorders by ₹ loss | *"Root-cause precision — not just 'something is wrong,' but exactly which cell string and which failure mode."* |
| 11 | **Energy Management** | Point to Energy Routing diagram | Flow diagram highlights active route; tariff badge shows PEAK / STANDARD / OFF-PEAK | *"Intelligent dispatch: peak rate → export to grid. Off-peak → charge storage, share with households. Closes the loop to the problem."* |
| 12 | **Reset** | Press **🔄 Reset** or `Shift+R` | All metrics return to baseline in < 500 ms | *"System resets instantly — ready for the next run."* |

---

## 5. Feature Coverage Map

| Feature | Location on Website | How Demonstrated | Why It Matters |
|---|---|---|---|
| Sun tracking (real trig) | 3D scene + HUD tilt chip | Sun slider → panels rotate | Autonomous solar optimization |
| Thermal derating (IEC 61215) | AI Ops panel + temp strip | Temp slider → Temp Loss % | Real physics, not mock numbers |
| Dust optical attenuation | Loss Attribution bar + inspector | Soiling trigger / slider | Quantifies economic cost of dust |
| Storm prediction & stow | Alert banner + 3D panels | Storm trigger → countdown → stow | Core autonomy claim |
| Sandstorm particle system | 3D WebGL scene | Storm trigger | Visual impact for judges |
| Cleaning robot animation | 3D scene + HUD chip | Soiling trigger / Dispatch button | Waterless maintenance concept |
| 7-factor fault attribution | Panel inspector chips | Fault injection | Root-cause precision |
| CV Inspection report | Panel inspector section | Post-storm / fault state | Simulated drone/thermal scan concept |
| Economic cleaning queue | AI Ops panel | Dust builds → ROI threshold crossed | AI-managed cost optimization |
| Dynamic energy routing | Right column flow diagram | Live — updates with all state changes | Closes loop to household energy problem |
| Dual-interface WebSocket sync | Controller + Dashboard | Any slider action reflects on both screens | Core architecture differentiator |
| Honesty modal | Header 🔬 button + footer | Click to open | PRD §16 compliance; builds judge trust |
| Live Event Timeline | Right column | All transitions auto-logged | Proves autonomous decision chain |
| Demo Mode overlay | Header 🎬 button | Click Start Demo | Guided sequence for non-interactive contexts |

---

## 6. Ideal Final Demo State

At the end of a successful presentation, the dashboard should show:

- **Status pill:** `SYSTEM NORMAL • AUTONOMOUS` (green, pulsing dot)
- **3D scene:** All 3 panels at optimal sun-tracking tilt, sun sphere correctly positioned, zero storm particles, no robot visible, all LEDs green
- **Metrics:** Power ~4.8 MW, Efficiency ~91%, Health ~98%, Dust LOW
- **Event Timeline:** A full scroll of logged events covering storm warning → stow → recovery → cleaning → fault → resolution — visible on screen as an autonomous decision log
- **Energy routing:** Flow diagram with highlighted active route and correct tariff tier

**The dashboard and 3D simulation work as one connected display.** Every controller action propagates to both the 3D model (physical panel response) and all dashboard data panels (telemetry, AI analysis, energy routing) within WebSocket latency — demonstrating that DuneVolt is a live digital twin, not a slide deck.

---

*Based on verified source-code inspection of `server.js`, `scene3d.js`, `dashboard.js`, `state.js`, `controller.js`, `index.html`, and `controller.html` — September 2026.*

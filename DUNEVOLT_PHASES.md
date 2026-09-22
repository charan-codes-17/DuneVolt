# DuneVolt — Pre-Demo Polish: Implementation Phases

> Scope: the 5 changes requested before presenting DuneVolt to judges. Each phase lists the goal, current behavior (per `DEMO_GUIDE.md`), target behavior, and acceptance criteria. Items still needing a decision are flagged — nothing here should be built until those are confirmed.

---

## Phase 1 — 3D Visual Overhaul

**Goal:** Full realism pass on the 3D scene — not one fix, the whole look.

**Current state:** Procedural dune-wave terrain, sky dome, single sun sphere + directional light, procedural PV-cell canvas texture, steel masts, RGB LED indicators. Functional, reads as flat/stylized rather than realistic.

**Target:** Meaningful upgrade across all three axes:
- **Lighting & shadows** — cast shadows from panels/masts onto terrain, softer/more directional sun lighting, ambient occlusion in crevices (gimbal boxes, mast joints)
- **Materials & textures** — higher-fidelity PV cell material (reflectivity, anti-reflective coating look), dust buildup as a real surface material rather than a flat overlay, weathered/brushed-metal masts
- **Terrain & environment** — more varied dune geometry, ground texture/normal mapping, atmospheric haze/depth (especially useful later for the storm sequence)

**Constraint:** Must stay compatible with the existing FPS counter and HQ/SAVER quality toggle — realism should not tank frame rate on the presentation PC. SAVER mode should degrade gracefully.

**Acceptance:** Scene reads as a plausible desert solar installation rather than a stylized mockup, at stable frame rate in HQ mode on a normal laptop/PC.

---

## Phase 2 — Storm Countdown Fix

**Current state:** Per `DEMO_GUIDE.md`, the storm risk composite (wind + dust + visibility) triggers the countdown once it crosses a threshold — meaning the visible 10s timer doesn't necessarily start the instant the operator clicks "Simulate Sandstorm."

**Target:** Clicking **Simulate Sandstorm** on the controller starts the visible 10-second countdown immediately and deterministically — no variable delay waiting for a risk threshold to be crossed first.

**Acceptance:** Countdown appears on the dashboard the instant the button is pressed, every time, and runs for ~10 seconds.

---

## Phase 3 — Panel Protection: Visual + Timing

Two distinct problems, both in the same sequence:

**3a. Visual appeal.** Currently panels just tilt to a 15° defensive angle — functional but not dramatic enough to read as "the farm protected itself" to a judge watching from a distance.

**3b. Timing.** Panels currently finish stowing right at the end of the 10-second countdown (the last second). Target: fully stowed by **~4-5 seconds**, so there's a visible "protected and holding" window before storm visuals (particles, fog, wind) kick in — the audience should clearly see protection *complete before* the storm hits, not simultaneously with it.

**Open question (need your input):** what should "more visually appealing" protection look like — a shield/cover element deploying (as PRD §10.3 allows conceptually), a more dramatic multi-stage tilt/fold motion, warning-light choreography, or something else? Flagging this rather than picking a direction myself.

**Acceptance:** By second 4-5 of the countdown, all panels are fully stowed and visibly marked protected; the storm visuals begin only after that, with panels already safe.

---

## Phase 4 — Dashboard Decluttering (5–7 features on first view)

**Current state:** Front view has 8+ persistent blocks at once (telemetry strip, 3D scene, panel inspector, 5-module AI Ops panel, loss attribution bar, cleaning queue, energy routing, event timeline).

**Proposed grouping — not a decision, please confirm or edit:**

*Stays on first view:*
1. Live status strip (Power / Efficiency / Health / Dust / Temp / Wind)
2. 3D live scene + HUD chips
3. System mode / alert banner (incl. storm countdown)
4. AI Operations — condensed to headline risk numbers only (not all 5 modules expanded)
5. Energy Routing diagram
6. Event Timeline (compact)
7. Panel Inspector — arguably already "secondary" since it only appears on click

*Moves to a secondary section/tab/dropdown:*
- Generation Loss Attribution bar
- Prioritized Economic Cleaning Queue
- Simulated CV Inspection report (detail view)
- 7-factor root-cause chips (can stay nested inside the inspector)

**Acceptance:** First view shows ≤7 persistent blocks; everything else reachable via a clearly-labeled secondary panel/tab without leaving the page.

---

## Phase 5 — Hosted Deployment

**Goal:** DuneVolt reachable via a browser link on the classroom PC — no local `npm install`/setup required at presentation time, per your preference for a hosted deployment since the venue has internet.

**Open questions (need answers before this can be built):**
- Any existing hosting account (Render, Railway, Fly.io, Vercel, etc.), or should one be chosen for you?
- The app uses a native WebSocket server — the host must support persistent WebSocket connections (rules out plain static hosts like GitHub Pages or a bare Vercel static deploy). OK to pick a host on that basis?
- Free subdomain from the host, or a custom domain? custom domain
- Does the same hosted URL need to serve both the judge dashboard and the `/controller` route (so you open the controller on your phone from the same link), or is the controller only ever run locally? Yes it should be like , I should be able to open controller on my phone from the same link .  As I move the controls on my phone , it should reflect on PC real time. 

**Acceptance:** A single URL, reachable from the classroom PC's browser, loads the live-synced dashboard; the controller is reachable from a phone on the same network/internet.

---

## Cross-cutting: "usable by anyone"

Interpreting this as: no technical setup for the audience — just open the link and it works. **Open question:** does this also mean simplifying on-screen labels/jargon for a non-technical viewer, separate from the Phase 4 layout cleanup? Flagging since it could mean either "no setup friction" or "no jargon," and the two lead to different work.

---

## Summary of Open Questions

- [ ] Phase 3a: what should the panel-protection visual actually look like?
- [ ] Phase 4: confirm or edit the proposed 7-feature front-view grouping
- [ ] Phase 5: hosting provider, domain preference, and whether controller must be served from the same deployed URL
- [ ] "Usable by anyone": setup-friction only, or also label/jargon simplification?

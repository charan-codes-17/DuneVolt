## 0. IMPORTANT — READ THIS FIRST

Build a **live, interactive digital twin of an autonomous desert solar farm**.

This is NOT a static solar-energy dashboard, NOT a website that merely displays numbers about a separate simulation, and NOT two independent 3D models.

The core concept:

> **ONE virtual solar farm, ONE shared real-time state, MULTIPLE synchronized views.**

I control the environmental conditions from my own device — laptop or phone. The judge sees a professional dashboard projected on another screen, with its OWN LIVE 3D VISUALIZATION OF THE SAME SOLAR FARM. When I manipulate the simulation from my device, everything — panel movement, dust, storm conditions, autonomous protection, cleaning, power/efficiency/health stats, event logs, AI status — changes identically in both views.

The judge should feel like they are looking at a live operational digital twin while I am remotely controlling the simulated environment. (See Section 2 for how this shared-state requirement must be architected, and Section 40 for the specific behaviors that must stay synchronized.)

---

# 1. PROJECT PURPOSE

The project demonstrates an intelligent autonomous desert solar farm designed to maintain solar generation despite environmental challenges such as:

- changing sunlight
- dust accumulation
- high temperature
- strong wind
- dust/sandstorms
- panel faults
- maintenance requirements

The system continuously:

> SENSE → UNDERSTAND → PREDICT → PROTECT → RECOVER → OPTIMIZE

The most important demonstration is that I control the ENVIRONMENT, while the SOLAR FARM reacts autonomously. For example: I increase wind. I do NOT manually press "Protect Panels." Instead the full autonomous chain runs on its own:

```text
Wind increases
      ↓
Environmental state changes
      ↓
AI / prediction logic evaluates storm risk
      ↓
Storm risk increases
      ↓
Early warning
      ↓
Protective mode automatically activated
      ↓
Panels automatically move to safe position
      ↓
Storm occurs
      ↓
Storm passes
      ↓
Recovery mode
      ↓
Inspection
      ↓
Cleaning / testing if required
      ↓
Generation resumes
```

This autonomous cause → decision → action → recovery chain is the heart of the prototype, and it is the same chain referenced throughout this spec (Sections 17–22, 40, 41).

---

# 2. THE MOST IMPORTANT ARCHITECTURAL REQUIREMENT

## ONE SHARED FARM STATE

There must be ONE authoritative simulation state. Do NOT create one independent 3D simulation for the controller and another independent 3D simulation for the dashboard. Instead:

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

The controller changes the shared state. Both 3D views render that same state. For example, if:

```text
sunAngle = 72°
dustLevel = 45%
windSpeed = 51 km/h
temperature = 43°C
panelAngle = 68°
stormRisk = 82%
```

then both interfaces must represent those exact states. If the autonomous system changes `panelAngle = safePosition`, both 3D views must show the panels moving into that position.

---

# 3. REAL-TIME SYNCHRONIZATION

The application should behave like a real-time control system: my controls flow into the real-time farm state, which pushes out to both my simulator view and the judge dashboard (3D farm, statistics, AI status, event timeline, energy flow all included).

The exact technology can be chosen by the coding agent, but the architecture must support real-time synchronization. Suitable approaches may include:

- WebSockets
- Socket.IO
- Firebase realtime capabilities
- Supabase realtime
- another lightweight realtime state mechanism

Do NOT over-engineer this. The priority is:

> **Reliable synchronized visual behavior during the demonstration.**

---

# 4. TWO INTERFACES

## INTERFACE A — PROFESSIONAL JUDGE DASHBOARD

This is the polished interface. It will be projected for judges. It must look like a professional solar-farm operations/control center. It contains:

- live 3D solar farm
- live operational metrics
- AI operations
- storm prediction
- maintenance information
- event timeline
- energy flow
- selected-panel information
- system state
- alerts

The dashboard must NOT feel like a generic admin dashboard. The 3D farm is a major visual component.

---

# 5. INTERFACE B — MY SIMULATOR / CONTROLLER

This is operated by me from my laptop or phone. Its primary purpose is to manipulate the ENVIRONMENT. Examples:

- move sun
- increase/decrease dust
- increase/decrease wind
- change temperature
- simulate environmental events
- introduce a panel fault

## The controller should NOT primarily be a manual control panel for the solar panels.

I control the environment. The autonomous solar-farm system controls the panels — I should not have to press "Stow Panels" for the main autonomous demonstration (see Section 19). Manual controls can exist for testing/debugging, but the main demo should emphasize autonomy.

---

# 6. THE 3D SOLAR FARM

The project needs a browser-rendered 3D representation of a desert solar farm. The environment should contain:

### Desert

- sandy desert terrain
- believable large open solar-farm environment
- subtle terrain variation
- appropriate desert atmosphere
- no need for photorealistic graphics
- prioritize clean visualization and performance

Important: Do NOT portray the desert as completely meaningless/empty land in the project's conceptual messaging. The 3D environment is primarily a visualization of the solar farm.

---

# 7. SOLAR FARM SCALE

Use a small demonstrative solar farm rather than attempting to render hundreds/thousands of physically detailed panels.

Target:

> approximately 2-3 visible panels

This is enough to demonstrate tracking, dust differences, panel faults, sector behavior, cleaning, storm protection, and individual panel selection. The visual should suggest a larger farm without requiring an enormous 3D scene.

---

# 8. SOLAR PANEL 3D MODEL

Each solar panel should be an actual interactive 3D object, with:

- panel surface
- frame
- support structure
- mounting/tracking mechanism
- identifiable panel ID
- orientation/rotation
- operational state
- dust state
- health state

---

# 9. PANEL STATES

A panel can have states such as:

- **NORMAL** — normal generation
- **TRACKING** — automatically following sunlight
- **DUSTY** — visible dust/soiling and reduced output
- **FAULT** — abnormal operation
- **PROTECTING** — moving toward its safe storm position
- **PROTECTED** — stowed/safe
- **INSPECTION** — being evaluated after an event
- **CLEANING** — cleaning operation in progress
- **RECOVERY** — being tested before returning to generation
- **ONLINE** — back to normal generation

These states should be visible through the 3D model and/or dashboard indicators.

---

# 10. SUN SIMULATION & PANEL TRACKING

The simulation must have a controllable sun with position, direction, visual representation, and changing angle. The controller can change the sun position; the solar panels should automatically track it:

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

The judge's 3D view must show the same movement. Panel orientation should NOT be manually changed for normal operation — the system should calculate/approximate the appropriate orientation based on the sun. For a prototype, physically accurate solar geometry is not required if it becomes unnecessarily complex, but the visual relationship should stay believable (sun direction changes → panel rotates → power output responds).

---

# 11. DUST SIMULATION

Dust is one of the major environmental variables. The controller should allow dust to increase/decrease.

### VISUAL

Panels should visibly become dustier. This can be represented through material opacity, overlay, color/roughness adjustment, particles, dust texture, or another efficient visual technique. Do NOT require expensive realistic particle simulation if it hurts performance.

### DATA / GENERATION / AI / MAINTENANCE

Dust level increases → panel efficiency/output decreases → the system detects soiling / abnormal generation loss → cleaning priority may be generated.

---

# 12. DUST → CLEANING CHAIN

The complete chain should be:

```text
Dust increases
      ↓
Panels visibly become dusty
      ↓
Efficiency decreases
      ↓
Power output decreases
      ↓
AI detects abnormal loss
      ↓
Soiling detected
      ↓
Cleaning priority generated
      ↓
Cleaning operation
      ↓
Dust decreases
      ↓
Panel becomes visually clean
      ↓
Output recovers
```

This should happen automatically wherever practical. The dashboard should clearly communicate the cause and effect. (This is the same chain driving the cleaning-priority and scheduling behavior in Sections 25–26, and the "Step 2" of the demo script in Section 41.)

---

# 13. LOSS ATTRIBUTION / "WHY IS OUTPUT LOW?"

This is an important technical feature. The system should not merely say "Output decreased" — it should attempt to explain WHY. Example:

```text
WHY IS OUTPUT LOW?

Expected Output     4.20 kW
Actual Output       3.40 kW

AI DIAGNOSIS

Dust               61%
Temperature        17%
Other              22%

RECOMMENDED ACTION

→ Schedule cleaning
```

The percentages can be calculated or simulated for the prototype. The purpose is to demonstrate: environmental data → diagnosis → actionable recommendation. Do not simply add a decorative "AI" label.

---

# 14. TEMPERATURE

Temperature is another environmental variable, controllable, affecting generation/efficiency:

```text
Temperature ↑ → Efficiency ↓ → Power output ↓
```

The dashboard should show current temperature, the efficiency effect, and potentially its contribution to output loss.

---

# 15. WIND

Wind speed should be controllable. Wind itself should affect storm-risk calculation, environmental visualization, and system state. Its main purpose is to feed the storm prediction/protection system (Sections 16–19).

---

# 16. AI STORM PREDICTION

This is one of the most important features. The system should monitor environmental inputs (wind, dust, visibility/environmental conditions, other simulated weather inputs) and calculate a storm-risk value:

```text
STORM RISK
████████████████░░ 82%
```

The exact calculation can be a prototype model/rule-based simulation rather than a genuinely trained production ML model. Do NOT falsely claim "we trained an advanced ML model on thousands of historical storms" unless that is actually implemented — present it honestly as an AI-based prototype prediction / predictive simulation.

---

# 17. CRITICAL STORM REQUIREMENT — PREDICTIVE PROTECTION

The solar panels should protect themselves BEFORE the simulated dust/sandstorm arrives. This is a core concept:

```text
Environmental conditions change
        ↓
Storm risk increases
        ↓
AI detects elevated risk
        ↓
EARLY WARNING
        ↓
Protection countdown
        ↓
PANELS AUTOMATICALLY MOVE
        ↓
SAFE / PROTECTIVE POSITION
        ↓
STORM ARRIVES
```

The countdown is a visual representation of the warning/protection window:

```text
STORM RISK: 84%

AI EARLY WARNING

PROTECTIVE ACTION INITIATED

10
9
8
7
6
5
4
3
2
1

PROTECTIVE MODE ACTIVE
```

Do not represent the 10-second countdown as a scientifically guaranteed prediction lead time — it is a prototype demonstration of the system responding BEFORE the simulated event.

This entire sequence must run autonomously (Section 5): I trigger the environmental condition (e.g. raise wind), and the AI/system chain — not me — decides on and executes the protective action. I should not have to manually rotate or stow the panels during the main demo.

---

# 18. PROTECTIVE SHELL / SAFE POSITION

The concept includes protection from dust/sandstorm conditions. The exact physical mechanism can be represented conceptually in the prototype. Possible visualization:

- panels tilt into a safe angle
- panels fold/stow
- a protective shell/cover closes
- another clearly understandable protective mechanism

The implementation should prioritize clear visual communication of "panel protected before storm" over highly detailed mechanical engineering.

---

# 19. STORM EVENT

After the warning and protection stage, "STORM DETECTED" — the 3D environment should visually communicate the storm through dust/sand particles, reduced visibility, darker atmosphere, strong wind animation, moving environmental particles, and warning indicators. Do not make the scene so visually intense that the judge cannot see the panels.

---

# 20. RECOVERY SYSTEM

After the storm passes:

```text
STORM PASSED
        ↓
RECOVERY MODE
        ↓
INSPECTION
        ↓
CHECK PANEL CONDITION
        ↓
CLEAN IF REQUIRED
        ↓
TEST
        ↓
RESUME GENERATION
```

The event timeline should show these transitions. (This is the same recovery flow used in "Step 5" of the demo script, Section 41.)

---

# 21. PANEL FAULT SIMULATION

The controller should be able to create a panel fault. Example:

```text
Panel #27
Output unexpectedly decreases
```

The system should detect that the panel behaves differently from expected/neighboring panels. The dashboard can display:

```text
FAULT DETECTED

Panel #27

Expected Output: 4.2 kW
Actual Output:   2.7 kW

Fault Risk: HIGH

Recommended:
→ Inspect Panel #27
```

The exact fault-detection algorithm can be simulated. The important concept: detect abnormal behavior → identify panel → prioritize maintenance.

---

# 22. PANEL-TO-PANEL COMPARISON

Where useful, compare nearby panels:

```text
Panel #27
Output: 2.8 kW

Nearby panels:
#26 → 4.1 kW
#28 → 4.2 kW
#29 → 4.0 kW
```

This strengthens the anomaly-detection concept — if one panel behaves differently from its neighbors under similar environmental conditions, the system can flag it.

---

# 23. CLEANING SYSTEM

Cleaning should be represented visually — e.g. a cleaning robot moves across a panel, or a cleaning mechanism passes over panels, dust overlay disappears, panel efficiency rises, output recovers. The visual doesn't need to be physically perfect. The important sequence:

```text
Cleaning required
      ↓
Cleaning started
      ↓
Panel cleaned
      ↓
Dust ↓
      ↓
Efficiency ↑
      ↓
Output ↑
```

---

# 24. CLEANING SCHEDULING

The dashboard should display:

```text
LAST CLEANED
18 Sep 2026

NEXT RECOMMENDED CLEANING
23 Sep 2026
```

However, the system should demonstrate that cleaning is condition-based rather than merely blindly following a fixed schedule. If soiling becomes severe enough (per the chain in Section 12), cleaning priority should increase:

```text
CLEANING PRIORITY

Sector B
Panel #27
HIGH

Reason:
Soiling loss > threshold
```

---

# 25. PROFESSIONAL DASHBOARD — INFORMATION ARCHITECTURE

The dashboard should have these major areas.

## A. LIVE STATUS

```text
POWER OUTPUT
4.82 MW

EFFICIENCY
91.4%

PANEL HEALTH
97.8%

DUST LEVEL
18%

TEMPERATURE
39°C

WIND
21 km/h
```

All values must update when the simulation changes.

---

# 26. B. LARGE 3D LIVE MONITOR

This should be one of the largest/most important sections of the dashboard. It must show the SAME farm state as the controller's 3D view (Section 2): solar panels, desert, sun, panel orientation, dust, storm, cleaning activity, faulty panels, protective behavior. The 3D model must actually react — it must NOT be a static decorative model.

---

# 27. PANEL SELECTION

Clicking a panel on the professional dashboard should select it and display something like:

```text
PANEL #027

Output             82%
Temperature        43°C
Dust               27%
Health             NORMAL

Last Cleaned
18 Sep 2026

Next Recommended Cleaning
23 Sep 2026
```

The panel should visibly become selected in the 3D scene.

---

# 28. C. AI OPERATIONS PANEL

```text
AI OPERATIONS

Storm Risk            78% ↑
Soiling Risk          MEDIUM
Fault Risk            LOW
Cleaning Priority     PANEL #27
Generation Forecast   +4.2%
```

Values should react to simulation state.

---

# 29. D. EVENT TIMELINE

This is extremely important during judging. Show chronological system events:

```text
16:42:03   Wind increased
16:42:08   Storm risk detected
16:42:10   Protective mode activated
16:42:12   Panels stowed

16:45:31   Storm passed
16:45:35   Inspection started
16:46:02   Cleaning required
16:47:10   Cleaning completed
16:47:15   Generation restored
```

The timeline should update live. This allows the judge to understand what happened even if they miss a visual detail.

---

# 30. E. ENERGY FLOW

Show the farm's energy pathway:

```text
SOLAR FARM
     ↓
GENERATION
     ↓
 ┌───┴─────┐
 ↓         ↓
GRID     STORAGE
 ↓
SHARED SOLAR
 ↓
HOUSEHOLDS
```

This connects the technical solar-farm system to the broader shared-solar concept.

---

# 31. LIVE ALERTS & SYSTEM STATES

The dashboard should have a clear alert/status area, e.g.:

```text
● SYSTEM NORMAL
```

```text
⚠ EARLY STORM WARNING
Storm Risk: 82%
Protective action initiated.
```

```text
🛡 PROTECTIVE MODE
Panels automatically stowed.
```

```text
↻ RECOVERY MODE
Inspecting panels...
```

The entire farm should also have a clearly visible high-level state, cycling through something like:

```text
NORMAL → WARNING → PROTECTING → STORM → RECOVERY → MAINTENANCE → RESUMING → NORMAL
```

---

# 32. FARM DATA MODEL

The implementation should maintain a central state resembling:

```text
FarmState

environment:
    sunAngle
    sunPosition
    dustLevel
    windSpeed
    temperature
    stormIntensity
    visibility

prediction:
    stormRisk
    soilingRisk
    faultRisk
    generationForecast

farm:
    totalPower
    efficiency
    health
    operatingMode

panels:
    id
    position
    orientation
    output
    dust
    temperature
    health
    state
    lastCleaned
    nextCleaning
    faultStatus

maintenance:
    cleaningQueue
    currentOperation
    priority

energy:
    generated
    grid
    storage
    sharedSolar

events:
    timestamp
    eventType
    message
```

The exact implementation can differ, but the conceptual separation should remain.

---

# 33. REAL CALCULATIONS VS SIMULATION

Do not waste development time trying to create sophisticated ML models for every feature. Use a hybrid approach.

## Prefer REAL calculations for:

- sun angle
- panel orientation
- approximate generation
- dust-related efficiency reduction
- temperature-related efficiency reduction
- panel state
- cleaning effect
- storm protection state
- energy flow

## Simulation/rule-based AI is acceptable for:

- storm probability
- fault risk
- soiling risk
- cleaning priority
- loss attribution
- generation forecasting

The system must behave consistently and believably. If a feature is simulated, do not falsely claim that it is a trained production ML model.

---

# 34. CONTROLLER FEATURES

## ENVIRONMENT

- **Sun Angle** — slider / interactive control
- **Dust Level** — slider
- **Wind Speed** — slider
- **Temperature** — slider

## EVENTS

- **Simulate Dust** — triggers a dust increase/event
- **Simulate Storm** — triggers the storm demonstration
- **Create Fault** — creates a panel anomaly
- **Reset** — returns the farm to normal state (see Section 43 for full reset behavior)

---

# 35. CONTROLLER DESIGN PRINCIPLE

The controller should be extremely simple — I need to operate it quickly during judging. Do NOT create a huge complicated control panel. The main question should always be: "What environmental condition do I want to change?" Then the system handles the rest.

---

# 36. WHAT THE JUDGE SHOULD EXPERIENCE

The judge should understand the system without needing a long explanation. The visual story:

```text
I change the environment
        ↓
The solar farm notices
        ↓
The AI understands/predicts
        ↓
The system makes a decision
        ↓
The solar panels react automatically
        ↓
The numbers change
        ↓
The event appears in the timeline
        ↓
The system recovers
```

---

# 37. SYNCHRONIZED 3D BEHAVIOR — NON-NEGOTIABLE

Every environmental change I make on my device must visibly and correctly propagate to both 3D views at once, matching the chains already defined above (sun tracking in Section 10, dust/cleaning in Sections 11–12, storm protection in Sections 16–20). The 3D animation and dashboard data must never drift out of sync.

---

# 38. THE 3-MINUTE DEMONSTRATION

The application should be designed around this demo script, which walks through the full chains defined earlier in this spec.

## STEP 1 — NORMAL OPERATION

Show the farm operating normally:

```text
POWER        4.8 MW
EFFICIENCY   ~91%
HEALTH       ~98%
STORM RISK   LOW
```

The sun moves and panels track it (Section 10).

## STEP 2 — INTRODUCE DUST

Increase dust. Judge sees the same thing happen on the dashboard 3D farm, following the chain in Section 12: dust ↑ → panels become dusty → output ↓ → "SOILING DETECTED" → "CLEANING PRIORITY — SECTOR B" → cleaning happens → output recovers.

## STEP 3 — INTRODUCE STORM CONDITIONS

Increase wind/environmental stress. Storm Risk rises (e.g. 18% → 82%). Dashboard shows "AI EARLY WARNING — Protective action initiated," the 10-second countdown runs (Section 17), and panels automatically move into their protective position. I do NOT manually move them.

## STEP 4 — STORM

Storm visualization appears (Section 19). Panels remain protected. Generation/dispatch can change appropriately.

## STEP 5 — RECOVERY

Storm passes. Dashboard runs through "RECOVERY MODE" → inspecting → cleaning if required → testing → resuming (Section 20). Panels return to operational state; generation recovers.

## STEP 6 — END WITH ENERGY

Show Generated → Grid/Storage → Shared Solar → Households (Section 30). This completes the story from environmental problem, to autonomous operation, to energy delivery.

---

# 39. VISUAL DESIGN DIRECTION

The dashboard should feel like a professional operations platform. Desired characteristics:

- modern
- technical
- clean
- premium
- data-dense but readable
- dark/professional control-room aesthetic is acceptable
- strong visual hierarchy
- subtle animations
- live indicators
- charts where useful
- 3D visualization as a major focal point
- avoid excessive decorative UI

Do NOT make it look like a generic SaaS admin template, a school project dashboard, a random collection of cards, or a gaming HUD with unnecessary effects. Every UI element should communicate something useful.

---

# 40. ANIMATION PRINCIPLES

Animations should communicate system behavior. Good animations: panel rotation, sun movement, dust accumulation, storm particles, cleaning movement, protective stowing, recovery, live numerical transitions, event timeline updates.

Avoid unnecessary constant glowing, excessive transitions, distracting particles, or decorative animations unrelated to system behavior. The judge must be able to understand what changed.

---

# 41. PERFORMANCE

This is a live prototype. Prioritize, in order: (1) smooth interaction, (2) reliable synchronization, (3) clear visuals, (4) fast loading, (5) stable demo. Do not create unnecessarily complex 3D geometry — use optimized/simple models. The application should remain usable on a normal laptop.

---

# 42. MOBILE CONTROLLER & RESPONSIVE DASHBOARD

The controller may be operated from a phone, so it needs large controls, large touch targets, a simple layout, minimal text, sliders/buttons easy to operate, and no tiny desktop-only controls. The controller is mobile-first.

The judge-facing dashboard is desktop/projector-first, but should also remain usable on a normal laptop. The 3D farm should have enough space to remain visually meaningful; on smaller screens, secondary information can stack below the main 3D visualization.

---

# 43. RESET / DEMO SAFETY

Include a reliable RESET mechanism. Reset should restore:

```text
normal sun
normal dust
normal wind
normal temperature
all panels operational
normal panel orientation
no active storm
no active cleaning
normal generation
normal AI status
clear/reset event state as appropriate
```

The reset should allow me to restart the demonstration quickly if something goes wrong.

---

# 44. IMPORTANT: DO NOT OVERBUILD

The goal is NOT to simulate every physical property of a real solar farm. The goal is to create a convincing, connected prototype that demonstrates the concept.

### Tier 1 — MUST WORK

- shared real-time state
- two synchronized 3D views
- sun movement
- automatic panel tracking
- dust simulation
- power changes
- storm prediction/prototype logic
- automatic panel protection
- visible 10-second protection sequence
- recovery
- dashboard updates

### Tier 2 — SHOULD WORK

- panel selection
- fault simulation
- cleaning animation
- loss attribution
- event timeline
- energy flow
- maintenance dates

### Tier 3 — NICE TO HAVE

- highly detailed 3D environment
- sophisticated ML models
- advanced weather physics
- realistic cleaning robotics
- extremely detailed grid simulation

If time becomes limited, sacrifice Tier 3 before compromising Tier 1.

---

# 45. WHAT NOT TO CLAIM

Do not present the prototype as having capabilities that have not actually been implemented. Avoid claims such as:

- "100% autonomous"
- "100% accurate prediction"
- "maximum efficiency"
- "zero maintenance"
- "guaranteed storm prediction"
- "fully trained AI" if it is rule-based
- "10-second real-world storm prediction"
- "completely eliminates rooftop solar"
- "works without human intervention under all conditions"

This is a prototype demonstration. Be technically honest.

---

# 46. THE CORE PRODUCT IDEA

If you understand only one thing from this entire specification, understand this:

> **This is a live digital twin of an autonomous desert solar farm.**

The controller changes environmental conditions. The system interprets those conditions. The solar farm responds autonomously. The judge sees the same virtual farm responding in real time. The dashboard shows WHY the system responded. The event timeline shows WHAT happened. The metrics show the CONSEQUENCE. The recovery system shows HOW the farm returns to operation.

---

# 47. FINAL SYSTEM LOOP

```text
                 ENVIRONMENT
                     │
       ┌─────────────┼──────────────┐
       ↓             ↓              ↓
      SUN           DUST           WIND
       │             │              │
       └─────────────┼──────────────┘
                     ↓
                  SENSING
                     ↓
               AI / ANALYSIS
                     ↓
          ┌──────────┴──────────┐
          ↓                     ↓
       PREDICT                DIAGNOSE
          ↓                     ↓
       PROTECT                MAINTAIN
          │                     │
          └──────────┬──────────┘
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

# 48. THE ONE SENTENCE TO GIVE THE CODING AI

> **"A real-time synchronized digital twin of an autonomous desert solar farm where I remotely manipulate environmental conditions from a controller, while a professional judge-facing web dashboard renders the exact same live 3D farm, with autonomous panel tracking, AI-based storm/soiling/fault analysis, automatic protective actions, cleaning, recovery, live operational metrics, event timelines, and energy-flow visualization."**

The most important implementation requirement is:

> **The controller and judge dashboard must never have separate simulation states. They must render the same shared farm state in real time.**

# END OF SPECIFICATION
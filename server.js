import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve vendor assets (Three.js)
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three', 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// Fallback routes for easy navigation
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/controller', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'controller.html'));
});

// Phase 6 REST API Endpoints for testing, external telemetry, & resilience
app.get('/api/state', (req, res) => {
  res.json({
    status: 'success',
    serverTimestamp: Date.now(),
    state: farmState
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    connectedClients: wss.clients.size,
    activeTimers: activeTimers.length + demoTimers.length,
    demoActive,
    operatingMode: farmState.farm.operatingMode,
    memoryUsageMB: +(process.memoryUsage().rss / (1024 * 1024)).toFixed(2),
    timestamp: Date.now()
  });
});

app.all('/api/reset', (req, res) => {
  clearDemoTimers();
  clearAllTimers();
  farmState = defaultState();
  addEvent('INFO', 'System Reset (via REST API): Restored to pristine baseline defaults.');
  recalculateFarmPhysics();
  broadcastState();
  broadcastDemoEnd();
  res.json({
    status: 'success',
    message: 'Farm digital twin reset to baseline default state',
    timestamp: Date.now()
  });
});

app.post('/api/action', (req, res) => {
  const { action, payload } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }
  handleClientAction({ action, payload }, null);
  res.json({
    status: 'success',
    action,
    timestamp: Date.now()
  });
});

// Authoritative Farm State
// Authoritative Farm State (Phase 2 Data Model)
const defaultState = () => ({
  environment: {
    sunAngle: 50,          // 10° (dawn/dusk) to 90° (solar noon)
    sunAzimuth: 180,       // South
    dustLevel: 15,         // 0% - 100%
    windSpeed: 18,         // km/h
    temperature: 36,       // °C
    stormIntensity: 0,     // 0 - 100%
    visibility: 95         // %
  },
  prediction: {
    stormRisk: 14,
    soilingRisk: 'LOW',
    faultRisk: 'LOW',
    heatLossRisk: 'MODERATE (-4.4%)',
    generationForecast: '+4.5%',
    countdown: null
  },
  farm: {
    totalPower: 4.82,      // MW
    efficiency: 91.8,      // %
    health: 98.4,          // %
    operatingMode: 'NORMAL', // NORMAL | WARNING | PROTECTING | STORM | RECOVERY | INSPECTION | CLEANING | RESUMING
    activeAlert: null
  },
  panels: [
    {
      id: 'PV-01',
      name: 'Sector A - Array 01',
      position: [-6, 0, 0],
      tilt: 40,
      azimuth: 180,
      output: 1.62,
      expectedOutput: 1.64,
      dust: 15,
      temperature: 38,
      health: 'NORMAL',
      state: 'TRACKING',
      lastCleaned: '18 Sep 2026',
      nextCleaning: '23 Sep 2026',
      faultStatus: 'NONE',
      faultAttribution: {
        heat: 38,
        dust: 52,
        degradation: 10,
        crack: 0,
        wiring: 0,
        hotspot: 0,
        shading: 0,
        primaryCause: 'Nominal Dust & Thermal Derate'
      },
      visualInspection: {
        crack: 'Not detected',
        discoloration: 'Nominal anti-reflective film',
        contamination: 'Minor desert particulate',
        looseComponents: 'Torque verified nominal',
        sandBuildup: '15% surface coverage',
        baselineComparison: '-1.8% reflectivity vs baseline scan',
        summary: 'Nominal condition. Cell reflection consistent. No micro-cracks.'
      }
    },
    {
      id: 'PV-02',
      name: 'Sector A - Array 02',
      position: [0, 0, 0],
      tilt: 40,
      azimuth: 180,
      output: 1.61,
      expectedOutput: 1.64,
      dust: 15,
      temperature: 39,
      health: 'NORMAL',
      state: 'TRACKING',
      lastCleaned: '18 Sep 2026',
      nextCleaning: '23 Sep 2026',
      faultStatus: 'NONE',
      faultAttribution: {
        heat: 40,
        dust: 50,
        degradation: 10,
        crack: 0,
        wiring: 0,
        hotspot: 0,
        shading: 0,
        primaryCause: 'Nominal Dust & Thermal Derate'
      },
      visualInspection: {
        crack: 'Not detected',
        discoloration: 'Nominal anti-reflective film',
        contamination: 'Minimal particulate deposit',
        looseComponents: 'Dual-axis gimbal calibrated',
        sandBuildup: '15% surface coverage',
        baselineComparison: '-1.7% reflectivity vs baseline scan',
        summary: 'Optimal tracking alignment. Tracker gimbal calibrated.'
      }
    },
    {
      id: 'PV-03',
      name: 'Sector B - Array 03',
      position: [6, 0, 0],
      tilt: 40,
      azimuth: 180,
      output: 1.59,
      expectedOutput: 1.64,
      dust: 16,
      temperature: 38,
      health: 'NORMAL',
      state: 'TRACKING',
      lastCleaned: '18 Sep 2026',
      nextCleaning: '23 Sep 2026',
      faultStatus: 'NONE',
      faultAttribution: {
        heat: 36,
        dust: 54,
        degradation: 10,
        crack: 0,
        wiring: 0,
        hotspot: 0,
        shading: 0,
        primaryCause: 'Nominal Dust & Thermal Derate'
      },
      visualInspection: {
        crack: 'Not detected',
        discoloration: 'Nominal anti-reflective film',
        contamination: 'Desert particulate within tolerance',
        looseComponents: 'Structural clamps secure',
        sandBuildup: '16% surface coverage',
        baselineComparison: '-2.1% reflectivity vs baseline scan',
        summary: 'Surface clear. Dust deposition within dry-brushing tolerance.'
      }
    }
  ],
  maintenance: {
    cleaningQueue: [],
    currentOperation: 'STANDBY',
    priority: 'NONE',
    cleaningProgress: 0,
    cleaningRobotActive: false,
    cleaningRobotX: 0,
    estimatedDailyLossInr: 450,
    cleaningThresholdInr: 3200
  },
  energy: {
    generated: 4.82,
    grid: 3.20,
    storage: 1.10,
    sharedSolar: 0.52,
    batterySoC: 76,
    gridPrice: 'PEAK (₹9.2/kWh)',
    routingDecision: 'GRID_EXPORT', // GRID_EXPORT | BATTERY_CHARGE | COMMUNITY_DIRECT
    activeRoute: 'GRID_EXPORT'
  },
  events: [
    { id: 1, time: getFormattedTime(), type: 'INFO', message: 'Autonomous Farm Twin connected. Central state synchronized.' },
    { id: 2, time: getFormattedTime(), type: 'SUCCESS', message: 'Sensors calibrated. AI predictive supervisory loop active.' }
  ]
});

let farmState = defaultState();
let activeTimers = [];
let demoActive = false;
let demoTimers = [];

function clearAllTimers() {
  activeTimers.forEach(t => clearTimeout(t));
  activeTimers = [];
}

function clearDemoTimers() {
  demoTimers.forEach(t => clearTimeout(t));
  demoTimers = [];
  demoActive = false;
}

function getFormattedTime() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

function addEvent(type, message) {
  const newEvent = {
    id: Date.now() + Math.random(),
    time: getFormattedTime(),
    type,
    message
  };
  farmState.events.unshift(newEvent);
  if (farmState.events.length > 50) farmState.events.pop();
}

// Authoritative Physics and AI Calculations (Phase 2 Model)
function recalculateFarmPhysics() {
  const { environment, farm, panels, prediction, maintenance, energy } = farmState;

  // 1. Sun tracking angle: optimal panel tilt = 90 - sunAngle (bounded between 10° and 75°)
  const targetTilt = Math.max(10, Math.min(75, 90 - environment.sunAngle));
  const targetAzimuth = environment.sunAzimuth || 180;

  // 2. Storm Risk Calculation (simulated AI predictive model)
  const windFactor = (environment.windSpeed / 120) * 65;
  const dustFactor = (environment.dustLevel / 100) * 35;
  const visibilityFactor = ((100 - environment.visibility) / 100) * 20;
  let rawStormRisk = Math.round(windFactor + dustFactor + visibilityFactor);
  rawStormRisk = Math.max(5, Math.min(100, rawStormRisk));
  prediction.stormRisk = rawStormRisk;

  // 3. Heat Loss Risk & Thermal Derating Calculation
  // Standard Test Condition is 25°C. Derating coefficient = -0.4% per °C.
  const tempExcess = Math.max(0, environment.temperature - 25);
  const tempDeratePct = +(tempExcess * 0.4).toFixed(1);
  const tempDerating = 1 - tempExcess * 0.004;

  if (environment.temperature >= 48) {
    prediction.heatLossRisk = `CRITICAL (-${tempDeratePct}%)`;
  } else if (environment.temperature >= 40) {
    prediction.heatLossRisk = `HIGH (-${tempDeratePct}%)`;
  } else if (environment.temperature >= 32) {
    prediction.heatLossRisk = `MODERATE (-${tempDeratePct}%)`;
  } else {
    prediction.heatLossRisk = `LOW (-${tempDeratePct}%)`;
  }

  // 4. Soiling Risk & Maintenance Economics
  if (environment.dustLevel > 55) {
    prediction.soilingRisk = 'CRITICAL';
    maintenance.priority = 'HIGH - SECTOR B';
  } else if (environment.dustLevel > 35) {
    prediction.soilingRisk = 'HIGH';
    maintenance.priority = 'MEDIUM';
  } else if (environment.dustLevel > 20) {
    prediction.soilingRisk = 'MEDIUM';
    maintenance.priority = 'LOW';
  } else {
    prediction.soilingRisk = 'LOW';
    maintenance.priority = 'NONE';
  }

  // Farm-wide daily revenue loss calculation (₹)
  const baseKwhPerDay = 36000;
  const tariffPerKwh = 6.5; // Average solar tariff in INR
  const soilingLossRatio = (environment.dustLevel / 100) * 0.38;
  maintenance.estimatedDailyLossInr = Math.round(baseKwhPerDay * soilingLossRatio * tariffPerKwh);

  // Generation Forecast
  if (prediction.stormRisk >= 70) {
    prediction.generationForecast = '-65.0% (Storm Approaching)';
  } else if (farm.operatingMode === 'STORM') {
    prediction.generationForecast = '-92.0% (Defensive Stow)';
  } else if (environment.dustLevel >= 50) {
    prediction.generationForecast = '-28.5% (Heavy Soiling)';
  } else if (environment.temperature >= 45) {
    prediction.generationForecast = '-12.0% (High Heat Derate)';
  } else {
    prediction.generationForecast = '+4.5%';
  }

  // 5. Panel Output, Multi-Factor Fault Attribution & Visual Telemetry
  const sunInsolation = Math.sin((environment.sunAngle * Math.PI) / 180);
  const dustEfficiency = 1 - (environment.dustLevel / 100) * 0.38;

  let totalPower = 0;
  const cleaningQueueList = [];

  panels.forEach((panel) => {
    // Individual dust variation for realism
    panel.dust = environment.dustLevel;
    panel.temperature = environment.temperature + Math.round(sunInsolation * 6);

    const ratedCapacity = 1.65; // MW at STC
    const unconstrainedExpected = +(ratedCapacity * sunInsolation * tempDerating).toFixed(2);
    panel.expectedOutput = unconstrainedExpected;

    if (farm.operatingMode === 'PROTECTING' || farm.operatingMode === 'STORM') {
      panel.state = farm.operatingMode === 'STORM' ? 'PROTECTED' : 'PROTECTING';
      panel.tilt = 12; // Flat defensive aerodynamic stow angle
      panel.azimuth = 180;
      panel.output = +(unconstrainedExpected * 0.08).toFixed(2);
    } else {
      panel.state = farm.operatingMode === 'CLEANING' ? 'CLEANING' : (panel.faultStatus !== 'NONE' ? 'FAULT' : 'TRACKING');
      panel.tilt = targetTilt;
      panel.azimuth = targetAzimuth;

      let actual = unconstrainedExpected * dustEfficiency;

      // Fault penalty
      if (panel.faultStatus !== 'NONE') {
        const severity = panel.faultStatus === 'HOTSPOT' ? 0.48
          : panel.faultStatus === 'CRACK' ? 0.42
          : panel.faultStatus === 'WIRING' ? 0.35
          : panel.faultStatus === 'SHADING' ? 0.55
          : 0.50; // Generic FAULT or DEGRADATION
        actual = actual * severity;
        panel.health = 'FAULT';
      } else {
        panel.health = 'NORMAL';
      }

      panel.output = +Math.max(0.05, actual).toFixed(2);
    }

    totalPower += panel.output;

    // 7-Factor Loss Attribution Math (PRD §10.4 & §11)
    // Categories: heat, dust, degradation, crack, wiring, hotspot, shading
    const idealNoLossPower = ratedCapacity * sunInsolation;
    const totalLostPower = Math.max(0.01, idealNoLossPower - panel.output);

    const heatLossPower = idealNoLossPower * Math.max(0, (panel.temperature - 25) * 0.004);
    const dustLossPower = (idealNoLossPower - heatLossPower) * ((panel.dust / 100) * 0.38);
    const anomalyLossPower = Math.max(0, totalLostPower - heatLossPower - dustLossPower);

    let crackShare = 0, wiringShare = 0, hotspotShare = 0, shadingShare = 0, degradationShare = 0;

    if (panel.faultStatus === 'HOTSPOT') {
      hotspotShare = anomalyLossPower * 0.75;
      wiringShare = anomalyLossPower * 0.15;
      degradationShare = anomalyLossPower * 0.10;
    } else if (panel.faultStatus === 'CRACK') {
      crackShare = anomalyLossPower * 0.80;
      degradationShare = anomalyLossPower * 0.20;
    } else if (panel.faultStatus === 'WIRING') {
      wiringShare = anomalyLossPower * 0.85;
      degradationShare = anomalyLossPower * 0.15;
    } else if (panel.faultStatus === 'SHADING') {
      shadingShare = anomalyLossPower * 0.85;
      degradationShare = anomalyLossPower * 0.15;
    } else if (panel.faultStatus === 'DEGRADATION') {
      degradationShare = anomalyLossPower * 0.85;
      hotspotShare = anomalyLossPower * 0.15;
    } else if (panel.faultStatus === 'FAULT') {
      hotspotShare = anomalyLossPower * 0.65;
      wiringShare = anomalyLossPower * 0.20;
      degradationShare = anomalyLossPower * 0.15;
    } else {
      // Nominal minor cell aging
      degradationShare = anomalyLossPower * 0.90;
    }

    // Compute integer percentages summing to 100%
    const pHeat = Math.round((heatLossPower / totalLostPower) * 100);
    const pDust = Math.round((dustLossPower / totalLostPower) * 100);
    const pCrack = Math.round((crackShare / totalLostPower) * 100);
    const pWiring = Math.round((wiringShare / totalLostPower) * 100);
    const pHotspot = Math.round((hotspotShare / totalLostPower) * 100);
    const pShading = Math.round((shadingShare / totalLostPower) * 100);
    const pDegradation = Math.max(0, 100 - (pHeat + pDust + pCrack + pWiring + pHotspot + pShading));

    let primaryCause = 'Nominal Sun Tracking';
    if (panel.faultStatus === 'HOTSPOT') primaryCause = 'Localized Cell Hotspot';
    else if (panel.faultStatus === 'CRACK') primaryCause = 'Cell Busbar Micro-Crack';
    else if (panel.faultStatus === 'WIRING') primaryCause = 'String Connector Resistance';
    else if (panel.faultStatus === 'SHADING') primaryCause = 'Localized Horizon Shading';
    else if (panel.faultStatus === 'DEGRADATION') primaryCause = 'Cell EVA Degradation';
    else if (panel.faultStatus === 'FAULT') primaryCause = 'String Mismatch & Hotspot';
    else if (pDust > pHeat) primaryCause = 'Dust Particle Soiling';
    else if (pHeat > 10) primaryCause = 'Desert Thermal Derating';

    panel.faultAttribution = {
      heat: pHeat,
      dust: pDust,
      degradation: pDegradation,
      crack: pCrack,
      wiring: pWiring,
      hotspot: pHotspot,
      shading: pShading,
      primaryCause
    };

    // Structured Simulated Visual/Thermal Inspection Telemetry (PRD §10.5 & §11)
    if (panel.faultStatus === 'HOTSPOT' || panel.faultStatus === 'FAULT') {
      panel.visualInspection = {
        crack: 'Not detected',
        discoloration: '⚠️ Localized thermal browning on substring #4 (68°C)',
        contamination: 'Nominal surface particulate',
        looseComponents: 'Not detected',
        sandBuildup: `${panel.dust}% surface coverage`,
        baselineComparison: '-14.8% emissivity variance (Localized Hotspot)',
        summary: '⚠️ Thermal IR anomaly detected. Localized hotspot on substring #4. Bypass diode active.'
      };
    } else if (panel.faultStatus === 'CRACK') {
      panel.visualInspection = {
        crack: '⚠️ Micro-crack fracture detected across silicon wafer 3B',
        discoloration: 'Minor oxidation along micro-fracture boundary',
        contamination: 'Not detected',
        looseComponents: 'Not detected',
        sandBuildup: `${panel.dust}% surface coverage`,
        baselineComparison: '-18.2% electroluminescence variance',
        summary: '⚠️ Physical micro-crack detected. High impedance substring derated.'
      };
    } else if (panel.faultStatus === 'WIRING') {
      panel.visualInspection = {
        crack: 'Not detected',
        discoloration: 'Thermal bloom around DC terminal junction box',
        contamination: 'Not detected',
        looseComponents: '⚠️ Loose MC4 connector pin tension detected',
        sandBuildup: `${panel.dust}% surface coverage`,
        baselineComparison: '-22.5% string circuit continuity anomaly',
        summary: '⚠️ Connector resistance fault. DC string bypass clamp engaged.'
      };
    } else if (panel.faultStatus === 'SHADING') {
      panel.visualInspection = {
        crack: 'Not detected',
        discoloration: 'Sharp contrast shadow boundary on bottom module row',
        contamination: 'Not detected',
        looseComponents: 'Not detected',
        sandBuildup: `${panel.dust}% surface coverage`,
        baselineComparison: '-31.0% optical transmission differential',
        summary: '⚠️ Localized structural shadow detected. Partial string derate.'
      };
    } else if (panel.faultStatus === 'DEGRADATION') {
      panel.visualInspection = {
        crack: 'Not detected',
        discoloration: '⚠️ Yellowing / browning of EVA encapsulant polymer',
        contamination: 'UV photochemical browning',
        looseComponents: 'Not detected',
        sandBuildup: `${panel.dust}% surface coverage`,
        baselineComparison: '-16.4% transmission loss (EVA Polymer Aging)',
        summary: '⚠️ Photothermal EVA degradation detected. Substring output derated.'
      };
    } else {
      panel.visualInspection = {
        crack: 'Not detected',
        discoloration: panel.dust > 40 ? 'Diffuse particulate haze obscuring ARC coating' : 'Nominal anti-reflective film',
        contamination: panel.dust > 65 ? 'Sand drift deposition along module bevel' : 'Not detected',
        looseComponents: 'Torque verified nominal. Dual-axis gimbal calibrated.',
        sandBuildup: `${panel.dust}% surface coverage`,
        baselineComparison: `-${((panel.dust / 100) * 12.5).toFixed(1)}% reflectivity vs baseline scan`,
        summary: panel.dust > 40
          ? 'Surface dust accumulation exceeds threshold. Condition-based dry-brush cleaning recommended.'
          : 'Nominal condition. Cell reflection consistent. No micro-cracks.'
      };
    }

    // Economic Cleaning Prioritization per Panel (PRD §10.6 & §11)
    const panelDailyKwh = 12000;
    const panelSoilingLossRatio = (panel.dust / 100) * 0.38;
    const panelDailyLossInr = Math.round(panelDailyKwh * panelSoilingLossRatio * tariffPerKwh);
    const cleaningCostInr = 450;
    const thresholdExceeded = panelDailyLossInr >= cleaningCostInr;

    let priority = 'LOW';
    if (panelDailyLossInr >= 1200) priority = 'CRITICAL';
    else if (panelDailyLossInr >= 750) priority = 'HIGH';
    else if (panelDailyLossInr >= 450) priority = 'MEDIUM';

    cleaningQueueList.push({
      panelId: panel.id,
      name: panel.name,
      dust: panel.dust,
      estimatedDailyLossInr: panelDailyLossInr,
      cleaningCostInr,
      thresholdExceeded,
      priority
    });
  });

  // Sort cleaning queue by economic loss severity descending (PRD §10.6)
  cleaningQueueList.sort((a, b) => b.estimatedDailyLossInr - a.estimatedDailyLossInr);
  maintenance.cleaningQueue = cleaningQueueList;

  // Farm-level aggregates
  farm.totalPower = +totalPower.toFixed(2);
  const maxPossiblePower = 1.65 * 3 * sunInsolation;
  farm.efficiency = maxPossiblePower > 0 ? +((totalPower / maxPossiblePower) * 100).toFixed(1) : 0;

  const faultedPanel = panels.find(p => p.faultStatus !== 'NONE');
  prediction.faultRisk = faultedPanel ? `HIGH (${faultedPanel.id} - ${faultedPanel.faultStatus})` : 'LOW';
  farm.health = faultedPanel ? 78.6 : 98.4;

  // 6. Energy Routing Decision Logic (PRD §10.8 & §11)
  energy.generated = farm.totalPower;
  if (farm.totalPower > 3.0) {
    energy.grid = +(farm.totalPower * 0.65).toFixed(2);
    energy.storage = +(farm.totalPower * 0.23).toFixed(2);
    energy.sharedSolar = +(farm.totalPower * 0.12).toFixed(2);
    energy.routingDecision = 'GRID_EXPORT';
    energy.activeRoute = 'GRID_EXPORT';
    energy.gridPrice = 'PEAK (₹9.2/kWh)';
  } else if (farm.totalPower > 1.2) {
    energy.grid = +(farm.totalPower * 0.40).toFixed(2);
    energy.storage = +(farm.totalPower * 0.35).toFixed(2);
    energy.sharedSolar = +(farm.totalPower * 0.25).toFixed(2);
    energy.routingDecision = 'BATTERY_CHARGE';
    energy.activeRoute = 'BATTERY_CHARGE';
    energy.gridPrice = 'STANDARD (₹6.5/kWh)';
  } else {
    energy.grid = 0;
    energy.storage = 0;
    energy.sharedSolar = 0.85; // Discharging from storage for rural community
    energy.routingDecision = 'COMMUNITY_DIRECT';
    energy.activeRoute = 'COMMUNITY_DIRECT';
    energy.gridPrice = 'OFF-PEAK (₹4.2/kWh)';
  }
}

// Automatic Autonomous Storm Lifecycle
function checkAndTriggerStormSequence() {
  if (farmState.prediction.stormRisk >= 72 && farmState.farm.operatingMode === 'NORMAL') {
    startStormDefenseSequence();
  }
}

function startStormDefenseSequence() {
  if (farmState.farm.operatingMode !== 'NORMAL') return;

  farmState.farm.operatingMode = 'WARNING';
  farmState.farm.activeAlert = 'AI EARLY WARNING: High storm probability detected. Initiating automated protective stow cycle.';
  addEvent('WARNING', `AI Storm Early Warning: Risk evaluated at ${farmState.prediction.stormRisk}%. Countdown started.`);
  broadcastState();

  let count = 10;
  farmState.prediction.countdown = count;

  const countdownInterval = setInterval(() => {
    count--;
    farmState.prediction.countdown = count;
    if (count > 0) {
      broadcastState();
    } else {
      clearInterval(countdownInterval);
      farmState.prediction.countdown = null;
      executePanelProtection();
    }
  }, 1000);

  activeTimers.push(countdownInterval);
}

function executePanelProtection() {
  farmState.farm.operatingMode = 'PROTECTING';
  farmState.farm.activeAlert = 'PROTECTIVE MODE ACTIVE: Actuators stowing panels to aerodynamic desert defensive position.';
  addEvent('ACTION', 'Autonomous Protection: Panel arrays moving to 12° stow angle.');
  recalculateFarmPhysics();
  broadcastState();

  // After stowing finishes, storm arrives
  const stormArrivalTimer = setTimeout(() => {
    farmState.farm.operatingMode = 'STORM';
    farmState.environment.stormIntensity = 95;
    farmState.environment.visibility = 25;
    farmState.farm.activeAlert = 'SEVERE SANDSTORM IN PROGRESS: Arrays securely locked in defensive profile.';
    addEvent('CRITICAL', 'Sandstorm Peak: Visibility dropped to 25%. Solar arrays protected.');
    recalculateFarmPhysics();
    broadcastState();

    // Storm duration: 8 seconds
    const stormPassTimer = setTimeout(() => {
      recoverFromStorm();
    }, 8000);
    activeTimers.push(stormPassTimer);
  }, 2500);
  activeTimers.push(stormArrivalTimer);
}

function recoverFromStorm() {
  farmState.farm.operatingMode = 'RECOVERY';
  farmState.environment.stormIntensity = 0;
  farmState.environment.windSpeed = 22;
  farmState.environment.visibility = 90;
  farmState.environment.dustLevel = 48; // Leaves dust deposition
  farmState.farm.activeAlert = 'STORM PASSED: Autonomous post-storm telemetry inspection initiated.';
  addEvent('INFO', 'Storm passed. Commencing optical and thermal array inspection.');
  recalculateFarmPhysics();
  broadcastState();

  // Post-storm inspection (3 seconds)
  const inspectionTimer = setTimeout(() => {
    farmState.farm.operatingMode = 'CLEANING';
    farmState.farm.activeAlert = 'SOILING DETECTED: Condition-based waterless dry-brush robotic cleaning dispatched.';
    farmState.maintenance.cleaningRobotActive = true;
    farmState.maintenance.cleaningProgress = 0;
    addEvent('ACTION', 'Waterless Dry-Brush Cleaning Robot dispatched across Array Sector B.');
    broadcastState();

    // Simulate cleaning sweep (4 seconds)
    let progress = 0;
    const cleanProgressInterval = setInterval(() => {
      progress += 25;
      farmState.maintenance.cleaningProgress = progress;
      if (progress >= 100) {
        clearInterval(cleanProgressInterval);
        farmState.environment.dustLevel = 10;
        farmState.maintenance.cleaningRobotActive = false;
        farmState.farm.operatingMode = 'RESUMING';
        farmState.farm.activeAlert = 'CLEANING COMPLETE: Efficiency restored. Re-aligning arrays to sun vector.';
        addEvent('SUCCESS', 'Robotic dry-brush sweep finished. Array soiling cleared to 10%.');
        recalculateFarmPhysics();
        broadcastState();

        const resumeTimer = setTimeout(() => {
          farmState.farm.operatingMode = 'NORMAL';
          farmState.farm.activeAlert = null;
          addEvent('SUCCESS', 'Autonomous cycle complete. Generation restored to optimal tracking.');
          recalculateFarmPhysics();
          broadcastState();
        }, 2000);
        activeTimers.push(resumeTimer);
      } else {
        broadcastState();
      }
    }, 1000);
    activeTimers.push(cleanProgressInterval);
  }, 3000);
  activeTimers.push(inspectionTimer);
}

function triggerIndependentCleaning() {
  if (farmState.farm.operatingMode === 'CLEANING') return;
  farmState.farm.operatingMode = 'CLEANING';
  farmState.farm.activeAlert = 'SOILING MITIGATION: Condition-based waterless dry-brush robot cleaning active.';
  farmState.maintenance.cleaningRobotActive = true;
  farmState.maintenance.cleaningProgress = 0;
  addEvent('ACTION', 'Condition-based cleaning triggered. Dry-brush robotics clearing dust accumulation.');
  broadcastState();

  let progress = 0;
  const cleanInterval = setInterval(() => {
    progress += 20;
    farmState.maintenance.cleaningProgress = progress;
    if (progress >= 100) {
      clearInterval(cleanInterval);
      farmState.environment.dustLevel = 10;
      farmState.maintenance.cleaningRobotActive = false;
      farmState.farm.operatingMode = 'NORMAL';
      farmState.farm.activeAlert = null;
      addEvent('SUCCESS', 'Waterless cleaning complete. Generation efficiency fully recovered.');
      recalculateFarmPhysics();
      broadcastState();
    } else {
      broadcastState();
    }
  }, 800);
  activeTimers.push(cleanInterval);
}

// WebSocket broadcast helper
function broadcastState() {
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    serverTimestamp: Date.now(),
    data: farmState
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Demo Step broadcast — carries stage metadata separate from state
function broadcastDemoStep(stepIndex, stageName, narration, totalSteps) {
  const payload = JSON.stringify({
    type: 'DEMO_STEP',
    data: {
      stepIndex,
      stageName,
      narration,
      totalSteps,
      active: true
    }
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastDemoEnd() {
  const payload = JSON.stringify({
    type: 'DEMO_STEP',
    data: { active: false, stepIndex: 0, stageName: '', narration: '', totalSteps: 5 }
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 – Guided 3-Minute Demo Script
// Stages: Normal → Dust Event → Storm → Fault Injection → Energy Flow Finale
// ─────────────────────────────────────────────────────────────────────────────
function runDemoScript() {
  if (demoActive) return; // Already running
  clearAllTimers();
  clearDemoTimers();

  // Clean slate
  farmState = defaultState();
  recalculateFarmPhysics();
  demoActive = true;

  const TOTAL_STEPS = 5;

  function demoTimeout(fn, delay) {
    const t = setTimeout(fn, delay);
    demoTimers.push(t);
    return t;
  }

  // ── Stage 1: Normal Operation (0s – 12s) ───────────────────────────────────
  broadcastDemoStep(1, 'Stage 1: Normal Operation', 'Optimal sun conditions. Dual-axis trackers aligned. All arrays generating at peak capacity.', TOTAL_STEPS);
  addEvent('INFO', '🎬 DEMO START — Stage 1: Normal Operation. Trackers aligned to solar noon.');
  farmState.environment.sunAngle = 72;
  farmState.environment.dustLevel = 10;
  farmState.environment.windSpeed = 12;
  farmState.environment.temperature = 34;
  recalculateFarmPhysics();
  broadcastState();

  demoTimeout(() => {
    farmState.environment.sunAngle = 60;
    recalculateFarmPhysics();
    addEvent('INFO', 'Demo: Sun arc progressing — panel tilt adjusting autonomously.');
    broadcastState();
  }, 5000);

  demoTimeout(() => {
    farmState.environment.sunAngle = 50;
    recalculateFarmPhysics();
    broadcastState();
  }, 9000);

  // ── Stage 2: Dust Event (12s – 42s) ────────────────────────────────────────
  demoTimeout(() => {
    if (!demoActive) return;
    broadcastDemoStep(2, 'Stage 2: Dust Event', 'Desert dust storm front detected. Soiling loss triggers autonomous condition-based dry-brush robotic cleaning dispatch.', TOTAL_STEPS);
    farmState.environment.dustLevel = 72;
    farmState.environment.windSpeed = 28;
    recalculateFarmPhysics();
    addEvent('WARNING', '🎬 Demo Stage 2: Dust Event — Soiling concentration elevated to 72%. Array output degrading.');
    broadcastState();
  }, 12000);

  demoTimeout(() => {
    if (!demoActive) return;
    addEvent('ACTION', 'Demo: AI Soiling Risk elevated to CRITICAL. Economic loss threshold exceeded. Waterless dry-brush robot dispatched.');
    triggerIndependentCleaning();
  }, 18000);

  // Stage 2 ends naturally when cleaning completes (~30s from trigger, ~48s total)
  // We schedule Stage 3 at 52s to give cleaning time to complete

  // ── Stage 3: Storm Event (52s – 97s) ───────────────────────────────────────
  demoTimeout(() => {
    if (!demoActive) return;
    // Ensure we're back to normal before triggering storm
    if (farmState.farm.operatingMode !== 'NORMAL') {
      clearAllTimers();
      farmState = defaultState();
      farmState.environment.dustLevel = 10;
      recalculateFarmPhysics();
    }
    broadcastDemoStep(3, 'Stage 3: Storm Event', 'Extreme wind front approaching. AI storm risk model fires early warning. Autonomous countdown → array stow → sandstorm → recovery chain begins.', TOTAL_STEPS);
    farmState.environment.windSpeed = 95;
    farmState.environment.dustLevel = 68;
    farmState.environment.visibility = 58;
    recalculateFarmPhysics();
    addEvent('WARNING', '🎬 Demo Stage 3: Storm Event — Extreme 95 km/h wind front. AI risk model: CRITICAL.');
    startStormDefenseSequence();
  }, 52000);

  // ── Stage 4: Fault Injection (97s – 117s) ──────────────────────────────────
  // Storm recovery completes ~30s after start of storm sequence = ~82s
  // We wait until 97s to inject fault (giving RESUMING → NORMAL time)
  demoTimeout(() => {
    if (!demoActive) return;
    broadcastDemoStep(4, 'Stage 4: Fault Injection', 'Simulating hotspot anomaly on PV-02. AI root-cause attribution isolates thermal substring fault. Diagnosis panel active.', TOTAL_STEPS);
    // Ensure environment is calm for fault demo
    farmState.environment.windSpeed = 15;
    farmState.environment.dustLevel = 14;
    farmState.environment.temperature = 36;
    if (farmState.farm.operatingMode !== 'NORMAL') {
      clearAllTimers();
      farmState.farm.operatingMode = 'NORMAL';
      farmState.farm.activeAlert = null;
      farmState.prediction.countdown = null;
    }
    const pv2 = farmState.panels.find(p => p.id === 'PV-02');
    if (pv2) pv2.faultStatus = 'HOTSPOT';
    recalculateFarmPhysics();
    addEvent('CRITICAL', '🎬 Demo Stage 4: Fault Injection — HOTSPOT anomaly injected on PV-02. Thermal IR deviation: +43°C above baseline.');
    broadcastState();
  }, 97000);

  demoTimeout(() => {
    if (!demoActive) return;
    addEvent('INFO', 'Demo: PV-02 fault diagnosis complete. Root-cause: Localized Cell Hotspot (substring #4). Bypass diode engaged.');
    broadcastState();
  }, 107000);

  demoTimeout(() => {
    if (!demoActive) return;
    const pv2 = farmState.panels.find(p => p.id === 'PV-02');
    if (pv2) pv2.faultStatus = 'NONE';
    recalculateFarmPhysics();
    addEvent('SUCCESS', 'Demo: PV-02 anomaly cleared. Array telemetry returned to nominal. Generation fully restored.');
    broadcastState();
  }, 113000);

  // ── Stage 5: Energy Flow Finale (117s – 132s) ───────────────────────────────
  demoTimeout(() => {
    if (!demoActive) return;
    broadcastDemoStep(5, 'Stage 5: Energy Flow Finale', 'Peak generation achieved. Autonomous routing: 65% to grid, 23% battery storage, 12% shared solar to rural households.', TOTAL_STEPS);
    farmState.environment.sunAngle = 80;
    farmState.environment.dustLevel = 10;
    farmState.environment.windSpeed = 10;
    farmState.environment.temperature = 32;
    farmState.farm.operatingMode = 'NORMAL';
    farmState.farm.activeAlert = null;
    const pv2 = farmState.panels.find(p => p.id === 'PV-02');
    if (pv2) pv2.faultStatus = 'NONE';
    recalculateFarmPhysics();
    addEvent('SUCCESS', '🎬 Demo Stage 5: Energy Flow Finale — Peak output. AI routing: GRID_EXPORT active. Rural community shared solar live.');
    broadcastState();
  }, 117000);

  demoTimeout(() => {
    if (!demoActive) return;
    addEvent('INFO', 'Demo: Energy routing telemetry — Grid: ' +
      farmState.energy.grid.toFixed(2) + 'MW | Storage: ' +
      farmState.energy.storage.toFixed(2) + 'MW | Shared Solar: ' +
      farmState.energy.sharedSolar.toFixed(2) + 'MW');
    broadcastState();
  }, 123000);

  // ── Demo Complete (132s) ────────────────────────────────────────────────────
  demoTimeout(() => {
    if (!demoActive) return;
    demoActive = false;
    addEvent('SUCCESS', '🎬 DEMO COMPLETE — Full autonomous sense→predict→protect→recover→route cycle verified.');
    broadcastState();
    broadcastDemoEnd();
  }, 132000);
}

wss.on('connection', (ws) => {
  // Send immediate initial state
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    serverTimestamp: Date.now(),
    data: farmState
  }));

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      handleClientAction(msg, ws);
    } catch (e) {
      console.error('Error handling message:', e);
    }
  });
});

function handleClientAction(msg, ws) {
  switch (msg.action) {
    case 'PING': {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'PONG',
          clientTimestamp: msg.timestamp || Date.now(),
          serverTimestamp: Date.now()
        }));
      }
      break;
    }

    case 'SET_ENVIRONMENT': {
      // Operator manipulated sliders: sunAngle, dustLevel, windSpeed, temperature
      const { sunAngle, dustLevel, windSpeed, temperature } = msg.payload || {};
      if (sunAngle !== undefined) farmState.environment.sunAngle = Number(sunAngle);
      if (dustLevel !== undefined) farmState.environment.dustLevel = Number(dustLevel);
      if (windSpeed !== undefined) farmState.environment.windSpeed = Number(windSpeed);
      if (temperature !== undefined) farmState.environment.temperature = Number(temperature);

      recalculateFarmPhysics();
      checkAndTriggerStormSequence();
      broadcastState();
      break;
    }

    case 'SIMULATE_DUST': {
      // Dust spike trigger
      farmState.environment.dustLevel = 68;
      addEvent('WARNING', 'Simulate Dust Event: Dust concentration elevated to 68%.');
      recalculateFarmPhysics();
      broadcastState();

      // Trigger condition-based dry-brush cleaning after 4 seconds
      const dustCleaningTimer = setTimeout(() => {
        if (farmState.farm.operatingMode === 'NORMAL') {
          triggerIndependentCleaning();
        }
      }, 4000);
      activeTimers.push(dustCleaningTimer);
      break;
    }

    case 'SIMULATE_STORM': {
      // Storm trigger: raise wind & dust, triggering autonomous prediction and stow
      farmState.environment.windSpeed = 92;
      farmState.environment.dustLevel = 65;
      farmState.environment.visibility = 60;
      addEvent('WARNING', 'Simulate Storm Event: Extreme wind front (92 km/h) approaching solar farm.');
      recalculateFarmPhysics();
      startStormDefenseSequence();
      break;
    }

    case 'SET_FAULT': {
      // Injects or clears specific fault category on specified panel
      const targetId = msg.payload?.panelId || 'PV-02';
      const faultType = msg.payload?.faultType || 'HOTSPOT';
      const targetPanel = farmState.panels.find(p => p.id === targetId);
      if (targetPanel) {
        targetPanel.faultStatus = faultType;
        if (faultType === 'NONE') {
          addEvent('SUCCESS', `Panel ${targetId} Anomaly Cleared. Telemetry returned to nominal.`);
        } else {
          addEvent('CRITICAL', `Panel ${targetId} Anomaly Injected: [${faultType}] loss attribution isolated.`);
        }
        recalculateFarmPhysics();
        broadcastState();
      }
      break;
    }

    case 'CREATE_FAULT': {
      // Legacy / quick-toggle trigger on PV-02
      const pv2 = farmState.panels.find(p => p.id === 'PV-02');
      if (pv2) {
        if (pv2.faultStatus !== 'NONE') {
          pv2.faultStatus = 'NONE';
          addEvent('SUCCESS', 'Panel PV-02 Fault Cleared. Restored to nominal array operation.');
        } else {
          const reqType = msg.payload?.faultType || 'HOTSPOT';
          pv2.faultStatus = reqType;
          addEvent('CRITICAL', `Panel PV-02 Anomaly Injected: [${reqType}] localized diagnostic alert.`);
        }
      }
      recalculateFarmPhysics();
      broadcastState();
      break;
    }

    case 'TRIGGER_CLEANING': {
      triggerIndependentCleaning();
      break;
    }

    case 'DEMO_RUN': {
      // Phase 5: Start the guided 3-minute demo script
      runDemoScript();
      break;
    }

    case 'DEMO_STOP': {
      // Phase 5: Abort demo and reset
      clearDemoTimers();
      clearAllTimers();
      demoActive = false;
      farmState = defaultState();
      addEvent('INFO', 'Demo stopped. System reset to baseline.');
      recalculateFarmPhysics();
      broadcastState();
      broadcastDemoEnd();
      break;
    }

    case 'RESET': {
      // Instant recovery to baseline defaults
      clearDemoTimers();
      clearAllTimers();
      demoActive = false;
      farmState = defaultState();
      addEvent('INFO', 'System Reset: All environmental variables and solar arrays restored to baseline.');
      recalculateFarmPhysics();
      broadcastState();
      broadcastDemoEnd();
      break;
    }

    default:
      break;
  }
}

// Initial physics calculation
recalculateFarmPhysics();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`DuneVolt Digital Twin server running on http://localhost:${PORT}`);
  console.log(`- Judge Dashboard: http://localhost:${PORT}/`);
  console.log(`- Operator Controller: http://localhost:${PORT}/controller`);
});

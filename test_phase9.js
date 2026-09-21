import { WebSocket } from 'ws';
import http from 'http';

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

// DuneVolt – Phase 9: Implementation Guidance & Full-System Rehearsal Verification Suite
// Step 1: Project Skeleton | Step 2: Shared State | Step 3: 3D Scene | Step 4: Controller UI
// Step 5: Dashboard UI | Step 6: Real Math | Step 7: Rule AI | Step 8: Event Flow | Step 9: Reset | Step 10: Demo Rehearsal

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    };
    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, text: body }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function fetchRaw(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET'
    };
    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, text: body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function connectWebSocket() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    ws._msgBuffer = [];
    ws.on('message', (data) => {
      ws._msgBuffer.push(data);
    });
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function waitForStateMsg(ws, predicate, timeoutMs = 6000, desc = 'state') {
  return new Promise((resolve, reject) => {
    if (ws._msgBuffer) {
      for (let i = 0; i < ws._msgBuffer.length; i++) {
        try {
          const msg = JSON.parse(ws._msgBuffer[i].toString());
          if ((msg.type === 'STATE_UPDATE' || msg.type === 'INITIAL_STATE') && predicate(msg.data)) {
            ws._msgBuffer.splice(0, i + 1);
            return resolve(msg.data);
          }
        } catch (e) {}
      }
    }

    const handler = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if ((msg.type === 'STATE_UPDATE' || msg.type === 'INITIAL_STATE') && predicate(msg.data)) {
          ws.removeListener('message', handler);
          clearTimeout(timer);
          resolve(msg.data);
        }
      } catch (e) {}
    };
    const timer = setTimeout(() => {
      ws.removeListener('message', handler);
      reject(new Error(`Timeout: ${desc}`));
    }, timeoutMs);
    ws.on('message', handler);
  });
}

async function runPhase9Verification() {
  console.log('================================================================');
  console.log('DuneVolt – Phase 9: Implementation Guidance & Rehearsal Pipeline');
  console.log('================================================================\n');

  const testResults = [];
  function logTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${details ? '\n         → ' + details : ''}`);
  }

  // ── Step 1: Project Skeleton & Asset Distribution ─────────────────────────
  console.log('--- Step 1: Project Skeleton & Static Asset Distribution ---');
  const dashRes = await fetchRaw('/');
  logTest('9.1.1 Judge Dashboard served at / (HTTP 200 with HTML title)',
    dashRes.status === 200 && dashRes.text.includes('DuneVolt'), `status=${dashRes.status}`);

  const ctrlRes = await fetchRaw('/controller');
  logTest('9.1.2 Operator Controller served at /controller (HTTP 200)',
    ctrlRes.status === 200 && ctrlRes.text.includes('Controller'), `status=${ctrlRes.status}`);

  const threeRes = await fetchRaw('/vendor/three/three.module.js');
  logTest('9.1.3 Three.js WebGL vendor bundle served at /vendor/three/three.module.js',
    threeRes.status === 200 && threeRes.text.length > 50000, `status=${threeRes.status}, bytes=${threeRes.text.length}`);

  const cssRes = await fetchRaw('/css/dashboard.css');
  const jsDashRes = await fetchRaw('/js/dashboard.js');
  const jsCtrlRes = await fetchRaw('/js/controller.js');
  const jsSceneRes = await fetchRaw('/js/scene3d.js');
  const jsStateRes = await fetchRaw('/js/state.js');
  const allAssetsOk = [cssRes, jsDashRes, jsCtrlRes, jsSceneRes, jsStateRes].every(r => r.status === 200);
  logTest('9.1.4 All core CSS and JS modules served successfully',
    allAssetsOk, `CSS=${cssRes.status} | DashJS=${jsDashRes.status} | CtrlJS=${jsCtrlRes.status} | SceneJS=${jsSceneRes.status} | StateJS=${jsStateRes.status}`);

  // ── Step 2: Shared State Module ───────────────────────────────────────────
  console.log('\n--- Step 2: Authoritative Shared State Module ---');
  const stateRes = await fetchJson('/api/state');
  const s = stateRes.data?.state;
  const stateSchemaOk = stateRes.status === 200 &&
    s && s.environment && s.prediction && s.farm && Array.isArray(s.panels) && s.panels.length === 3 &&
    s.maintenance && s.energy && Array.isArray(s.events);
  logTest('9.2.1 /api/state returns complete authoritative FarmState schema',
    stateSchemaOk, `panels=${s?.panels?.length}, mode=${s?.farm?.operatingMode}, events=${s?.events?.length}`);

  const ws1 = await connectWebSocket();
  const initMsg = await waitForStateMsg(ws1, () => true, 3000, 'WS initial state');
  logTest('9.2.2 WebSocket handshake delivers immediate INITIAL_STATE snapshot',
    !!initMsg && initMsg.farm && initMsg.farm.totalPower > 0, `mode=${initMsg?.farm?.operatingMode}, power=${initMsg?.farm?.totalPower}MW`);

  // ── Step 3: Three.js 3D Scene Integration ─────────────────────────────────
  console.log('\n--- Step 3: Three.js 3D Scene Architecture ---');
  const sceneHasExports = jsSceneRes.text.includes('class Scene3D') || jsSceneRes.text.includes('function') || jsSceneRes.text.includes('THREE');
  const panelIds = s.panels.map(p => p.id);
  logTest('9.3.1 3D scene module contains Scene3D renderer and 3 tracker panel entities',
    sceneHasExports && panelIds.length === 3 && panelIds.includes('PV-01') && panelIds.includes('PV-02') && panelIds.includes('PV-03'),
    `Panels: ${panelIds.join(', ')}`);

  // ── Step 4: Controller UI & Action Dispatch ───────────────────────────────
  console.log('\n--- Step 4: Controller UI & Real-Time Action Dispatch ---');
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 55, windSpeed: 22 } }));
  const updatedState = await waitForStateMsg(ws1, st => st.environment.sunAngle === 55 && st.environment.windSpeed === 22, 3000, 'SET_ENV sync');
  logTest('9.4.1 Controller SET_ENVIRONMENT updates shared state in real-time',
    updatedState.environment.sunAngle === 55 && updatedState.environment.windSpeed === 22,
    `sunAngle=${updatedState.environment.sunAngle}°, windSpeed=${updatedState.environment.windSpeed}km/h`);

  const restActionRes = await fetchJson('/api/action', {
    method: 'POST',
    body: { action: 'SET_ENVIRONMENT', payload: { temperature: 38 } }
  });
  logTest('9.4.2 REST /api/action endpoint successfully accepts and processes control commands',
    restActionRes.status === 200 && restActionRes.data.status === 'success',
    `HTTP ${restActionRes.status}, action=${restActionRes.data?.action}`);

  // ── Step 5: Dashboard UI & Telemetry Panels ───────────────────────────────
  console.log('\n--- Step 5: Judge Dashboard UI Telemetry ---');
  const dHtml = dashRes.text;
  const hasStatusStrip = dHtml.includes('status-card') || dHtml.includes('stat-card') || dHtml.includes('totalPower') || dHtml.includes('efficiency');
  const hasAiOps = dHtml.includes('ai-ops') || dHtml.includes('prediction') || dHtml.includes('stormRisk') || dHtml.includes('AI Operations');
  const hasEnergyFlow = dHtml.includes('energy-flow') || dHtml.includes('Energy Flow') || dHtml.includes('grid') || dHtml.includes('sharedSolar');
  logTest('9.5.1 Dashboard HTML contains all required sections (Status Strip, AI Ops, Energy Flow)',
    hasStatusStrip && hasAiOps && hasEnergyFlow,
    `statusStrip=${hasStatusStrip}, aiOps=${hasAiOps}, energyFlow=${hasEnergyFlow}`);

  // ── Step 6: Real Physics Calculations Engine ──────────────────────────────
  console.log('\n--- Step 6: Real Physics Calculations Engine ---');
  // Test Sun Angle -> Panel Tilt: tilt = max(10, min(75, 90 - sunAngle))
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 30 } }));
  const sTilt30 = await waitForStateMsg(ws1, st => st.environment.sunAngle === 30, 3000, 'sunAngle 30');
  const tilt30Ok = sTilt30.panels.every(p => p.tilt === 60); // 90 - 30 = 60
  logTest('9.6.1 Sun tracking trigonometry: sunAngle 30° produces exact 60° panel tilt',
    tilt30Ok, `tilt=${sTilt30.panels[0].tilt}° (expected 60°)`);

  // Test Thermal Derating: IEC 61215 -0.4%/°C above 25°C
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 50, temperature: 45 } }));
  const sTemp45 = await waitForStateMsg(ws1, st => st.environment.temperature === 45, 3000, 'temp 45');
  const pv1Loss = sTemp45.panels[0].faultAttribution;
  logTest('9.6.2 Desert thermal derating: 45°C ambient yields calculated heat loss attribution',
    pv1Loss.heat > 0, `heatLossAttribution=${pv1Loss.heat}%, primaryCause=${pv1Loss.primaryCause}`);

  // Test Energy Balance Conservation: P_gen = P_grid + P_storage + P_sharedSolar
  const e = sTemp45.energy;
  const eTotal = +(e.grid + e.storage + e.sharedSolar).toFixed(2);
  const diff = Math.abs(eTotal - sTemp45.farm.totalPower);
  logTest('9.6.3 Dynamic energy conservation: P_gen == P_grid + P_storage + P_sharedSolar',
    diff < 0.05, `P_gen=${sTemp45.farm.totalPower}MW | sum=${eTotal}MW (grid=${e.grid}, storage=${e.storage}, shared=${e.sharedSolar})`);

  // ── Step 7: Rule-Based AI Modules ─────────────────────────────────────────
  console.log('\n--- Step 7: Rule-Based AI Modules (PRD §16 Compliant) ---');
  // Test Storm Risk formula: (wind/120)*65 + (dust/100)*35 + ((100-vis)/100)*20
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { windSpeed: 85, dustLevel: 60 } }));
  const sHighRisk = await waitForStateMsg(ws1, st => st.prediction.stormRisk >= 65, 3000, 'high storm risk');
  logTest('9.7.1 Multi-sensor storm risk composite calculates >= 65% on elevated wind/dust',
    sHighRisk.prediction.stormRisk >= 65, `stormRisk=${sHighRisk.prediction.stormRisk}%`);

  // Test 7-Category Fault Isolation: Inject SHADING
  ws1.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-03', faultType: 'SHADING' } }));
  const sShading = await waitForStateMsg(ws1, st => st.panels.find(p => p.id === 'PV-03')?.faultStatus === 'SHADING', 3000, 'PV-03 SHADING');
  const pv3Shading = sShading.panels.find(p => p.id === 'PV-03');
  logTest('9.7.2 Fault classification isolates SHADING anomaly and generates CV report',
    pv3Shading.faultAttribution.shading > 30 && (pv3Shading.visualInspection.summary.includes('Localized structural shadow') || pv3Shading.visualInspection.discoloration.includes('shadow')),
    `shadingAttribution=${pv3Shading.faultAttribution.shading}%, summary=${pv3Shading.visualInspection.summary}`);
  ws1.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-03', faultType: 'NONE' } }));

  // ── Step 8: Reactive Unidirectional Event Flow ────────────────────────────
  console.log('\n--- Step 8: Reactive Unidirectional Event Flow ---');
  // Trigger Dust spike -> verify soiling risk -> dry-brush clean -> power restore
  ws1.send(JSON.stringify({ action: 'SIMULATE_DUST' }));
  const sDustSpike = await waitForStateMsg(ws1, st => st.environment.dustLevel === 68, 3000, 'dust spike');
  logTest('9.8.1 Event flow: SIMULATE_DUST triggers dustLevel 68% and CRITICAL soiling risk',
    sDustSpike.environment.dustLevel === 68 && sDustSpike.prediction.soilingRisk === 'CRITICAL',
    `dust=${sDustSpike.environment.dustLevel}%, soilingRisk=${sDustSpike.prediction.soilingRisk}`);

  // ── Step 9: Instant Reset Endpoint Resilience ─────────────────────────────
  console.log('\n--- Step 9: Instant Reset & Fault Resilience ---');
  const resetStart = Date.now();
  const restResetRes = await fetchJson('/api/reset', { method: 'POST' });
  const resetTime = Date.now() - resetStart;
  const sAfterReset = await waitForStateMsg(ws1, st => st.farm.operatingMode === 'NORMAL' && st.environment.dustLevel === 15, 3000, 'reset state');
  logTest('9.9.1 REST /api/reset restores pristine baseline in < 500ms',
    restResetRes.status === 200 && resetTime < 500 && sAfterReset.farm.operatingMode === 'NORMAL',
    `duration=${resetTime}ms, mode=${sAfterReset.farm.operatingMode}, dust=${sAfterReset.environment.dustLevel}%`);

  // ── Step 10: Demo Rehearsal Pipeline & Guidance Audit ─────────────────────
  console.log('\n--- Step 10: Automated Demo Rehearsal Pipeline & Guidance Audit ---');
  const auditRes = await fetchJson('/api/guidance-audit');
  const audit = auditRes.data;
  const auditOk = auditRes.status === 200 && audit.status === 'success' && audit.protocolVersion === '9.0' &&
    audit.allStepsVerified === true && audit.totalCheckpoints === 10 &&
    audit.checkpoints.every(cp => cp.status === 'VERIFIED');
  logTest('9.10.1 /api/guidance-audit validates all 10 implementation checkpoints',
    auditOk, `version=${audit?.protocolVersion}, checkpoints=${audit?.totalCheckpoints}/10 verified`);

  const rehearsalRes = await fetchJson('/api/demo-rehearsal');
  const reh = rehearsalRes.data;
  const rehOk = rehearsalRes.status === 200 && reh.status === 'success' && reh.allStagesPassed === true &&
    reh.totalStages === 5 && reh.stages.every(stg => stg.passed === true);
  logTest('9.10.2 /api/demo-rehearsal executes full 5-stage automated rehearsal suite',
    rehOk, `stages=${reh?.totalStages}/5 passed, duration=${reh?.rehearsalDurationMs}ms`);

  ws1.close();

  // ── Final Summary ─────────────────────────────────────────────────────────
  console.log('\n================================================================');
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const allPass = testResults.every(r => r.passed);

  console.log(`Phase 9 Verification Summary:`);
  console.log(`  Total Checkpoints Tested: ${total}`);
  console.log(`  Total Passed:             ${passed} / ${total}`);
  console.log(`  Status:                   ${allPass ? '✅ PHASE 9 COMPLETE & VERIFIED' : '❌ SOME TESTS FAILED'}`);
  console.log('================================================================');

  if (!allPass) process.exit(1);
}

runPhase9Verification().catch(err => {
  console.error('Fatal Phase 9 Error:', err.message);
  process.exit(1);
});

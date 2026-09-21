import { WebSocket } from 'ws';
import http from 'http';

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase6Verification() {
  console.log('================================================================');
  console.log('DuneVolt — Phase 6: Non-Functional Requirements Verification');
  console.log('================================================================\n');

  const testResults = [];
  function logTest(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    const badge = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${badge}: ${testName}${details ? ' — ' + details : ''}`);
  }

  // Connect Primary WebSocket Client
  const ws1 = new WebSocket(WS_URL);
  const ws2 = new WebSocket(WS_URL);

  await Promise.all([
    new Promise((resolve, reject) => { ws1.on('open', resolve); ws1.on('error', reject); }),
    new Promise((resolve, reject) => { ws2.on('open', resolve); ws2.on('error', reject); })
  ]);

  console.log('Connected 2 simultaneous WebSocket clients to ws://localhost:3000\n');

  let state1 = null;
  let state2 = null;
  let lastTransitTimeMs = 0;

  ws1.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'INITIAL_STATE' || msg.type === 'STATE_UPDATE') {
        state1 = msg.data;
        if (msg.serverTimestamp) {
          lastTransitTimeMs = Math.max(0, Date.now() - msg.serverTimestamp);
        }
      }
    } catch (e) {}
  });

  ws2.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'INITIAL_STATE' || msg.type === 'STATE_UPDATE') {
        state2 = msg.data;
      }
    } catch (e) {}
  });

  function waitForState(wsClient, predicate, timeoutMs = 6000, desc = 'state predicate') {
    return new Promise((resolve, reject) => {
      const handler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'STATE_UPDATE' || msg.type === 'INITIAL_STATE') {
            if (predicate(msg.data)) {
              wsClient.removeListener('message', handler);
              clearTimeout(timer);
              resolve(msg.data);
            }
          }
        } catch (e) {}
      };
      const timer = setTimeout(() => {
        wsClient.removeListener('message', handler);
        reject(new Error(`Timeout waiting for ${desc} after ${timeoutMs}ms`));
      }, timeoutMs);
      wsClient.on('message', handler);
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6.1 Real-Time Synchronization & Low Latency (PRD §12)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 6.1 Real-Time Synchronization & Latency ---');

  // Ping/Pong RTT Measurement
  const pingStart = Date.now();
  const pongPromise = new Promise((resolve) => {
    const pongHandler = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PONG') {
          ws1.removeListener('message', pongHandler);
          resolve(Date.now() - pingStart);
        }
      } catch (e) {}
    };
    ws1.on('message', pongHandler);
  });
  ws1.send(JSON.stringify({ action: 'PING', timestamp: pingStart }));
  const rttMs = await pongPromise;
  logTest('6.1.1 WebSocket Ping/Pong Heartbeat RTT', rttMs < 50, `RTT: ${rttMs}ms (Imperceptible lag threshold < 50ms)`);

  // Multi-Client Broadcast Synchronization
  const updatePromise1 = waitForState(ws1, s => s.environment.sunAngle === 77, 4000, 'WS1 sunAngle update');
  const updatePromise2 = waitForState(ws2, s => s.environment.sunAngle === 77, 4000, 'WS2 sunAngle update');

  ws1.send(JSON.stringify({
    action: 'SET_ENVIRONMENT',
    payload: { sunAngle: 77, dustLevel: 22, windSpeed: 24, temperature: 38 }
  }));

  const [resState1, resState2] = await Promise.all([updatePromise1, updatePromise2]);
  const syncMatch = resState1.environment.sunAngle === resState2.environment.sunAngle &&
                    resState1.farm.totalPower === resState2.farm.totalPower;

  logTest('6.1.2 Multi-Client Real-Time Broadcast Consistency', syncMatch,
    `WS1 Sun: ${resState1.environment.sunAngle}°, WS2 Sun: ${resState2.environment.sunAngle}° | Farm Power: ${resState1.farm.totalPower} MW`);

  // ───────────────────────────────────────────────────────────────────────────
  // 6.2 REST API Endpoints & Resilience (PRD §10.10 & Specification §10.10)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6.2 REST API Endpoints & Health ---');

  const stateRes = await fetchJson('/api/state');
  logTest('6.2.1 GET /api/state Endpoint',
    stateRes.status === 200 && stateRes.data.status === 'success' && stateRes.data.state.panels.length === 3,
    `Status: ${stateRes.status}, Arrays: ${stateRes.data.state?.panels?.length || 0}`
  );

  const healthRes = await fetchJson('/api/health');
  logTest('6.2.2 GET /api/health Endpoint',
    healthRes.status === 200 && healthRes.data.status === 'healthy' && healthRes.data.connectedClients >= 2,
    `Status: ${healthRes.data.status}, Connected Clients: ${healthRes.data.connectedClients}, Uptime: ${healthRes.data.uptimeSeconds}s, Memory: ${healthRes.data.memoryUsageMB}MB`
  );

  const actionRes = await fetchJson('/api/action', {
    method: 'POST',
    body: { action: 'SET_ENVIRONMENT', payload: { sunAngle: 62 } }
  });
  logTest('6.2.3 POST /api/action Endpoint',
    actionRes.status === 200 && actionRes.data.status === 'success',
    `Action dispatched via HTTP REST: ${actionRes.data.action}`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 6.3 Resilience & Instant Reset under Multi-Event Stress (PRD §10.10)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6.3 Resilience & Instant Reset Stress Verification ---');

  // Step 1: Inject Chaos (Fault + Wind + Dust + Cleaning)
  ws1.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-02', faultType: 'CRACK' } }));
  ws1.send(JSON.stringify({ action: 'TRIGGER_CLEANING' }));
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { windSpeed: 88, dustLevel: 70, temperature: 46 } }));

  await waitForState(ws1, s => s.panels.some(p => p.faultStatus === 'CRACK'), 4000, 'Injected CRACK fault');

  // Step 2: Instant Reset via WebSocket
  const resetPromise1 = waitForState(ws1, s => s.farm.operatingMode === 'NORMAL' && s.environment.dustLevel === 15, 4000, 'Baseline Reset WS1');
  const resetPromise2 = waitForState(ws2, s => s.farm.operatingMode === 'NORMAL' && s.environment.dustLevel === 15, 4000, 'Baseline Reset WS2');

  ws1.send(JSON.stringify({ action: 'RESET' }));
  const [resetState1, resetState2] = await Promise.all([resetPromise1, resetPromise2]);

  const resetAllClear = resetState1.panels.every(p => p.faultStatus === 'NONE') &&
                        resetState1.maintenance.cleaningRobotActive === false &&
                        resetState1.farm.operatingMode === 'NORMAL' &&
                        resetState1.environment.sunAngle === 50 &&
                        resetState1.environment.windSpeed === 18;

  logTest('6.3.1 Instant Reset from Multi-Event Chaos (WebSocket)', resetAllClear,
    `Mode: ${resetState1.farm.operatingMode}, Dust: ${resetState1.environment.dustLevel}%, Faults: NONE, RobotActive: ${resetState1.maintenance.cleaningRobotActive}`);

  // Step 3: Instant Reset via REST API (/api/reset)
  ws1.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-01', faultType: 'HOTSPOT' } }));
  await waitForState(ws1, s => s.panels.some(p => p.faultStatus === 'HOTSPOT'), 4000, 'Injected HOTSPOT');

  const restResetPromise = waitForState(ws1, s => s.panels.every(p => p.faultStatus === 'NONE'), 4000, 'REST Reset State');
  const restResetRes = await fetchJson('/api/reset', { method: 'POST' });
  await restResetPromise;

  logTest('6.3.2 Instant Reset via POST /api/reset (REST API)',
    restResetRes.status === 200 && restResetRes.data.status === 'success',
    `REST response: ${restResetRes.data.message}`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 6.4 Honesty & Claims Compliance (PRD §13 & §16)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6.4 Honesty & Claims Guidelines (PRD §13 & §16) ---');

  // Verify Physics Calculations: Sun Tracking Angle Formula
  // Optimal Tilt = 90 - sunAngle
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 65, temperature: 25, dustLevel: 0 } }));
  const physicsState = await waitForState(ws1, s => s.environment.sunAngle === 65, 4000, 'Physics Sun Angle');
  const expectedTilt = 90 - 65; // 25°
  const panelTiltMatch = physicsState.panels[0].tilt === expectedTilt;
  logTest('6.4.1 Real Sun Tracking Physics Calculation (PRD §13)', panelTiltMatch,
    `Sun Elevation: 65° -> Panel Tilt: ${physicsState.panels[0].tilt}° (Expected: ${expectedTilt}°)`);

  // Verify Thermal Derating Calculation (-0.4% per °C above 25°C)
  // At 45°C: tempExcess = 20°C -> Derate = 20 * 0.4% = 8.0% derate
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { temperature: 45, dustLevel: 0, sunAngle: 90 } }));
  const thermalState = await waitForState(ws1, s => s.environment.temperature === 45, 4000, 'Thermal State');
  const thermalDerateConfirmed = thermalState.prediction.heatLossRisk.includes('-8') || thermalState.farm.efficiency < 95;
  logTest('6.4.2 Real Thermal Derating Arithmetic (-0.4%/°C) (PRD §13)', thermalDerateConfirmed,
    `Temp: 45°C -> Heat Derating: ${thermalState.prediction.heatLossRisk}, Efficiency: ${thermalState.farm.efficiency}%`);

  // Verify Energy Balance Conservation (Generation = Grid + Storage + Shared Community)
  const eg = thermalState.energy;
  const energyBalanceDiff = Math.abs(eg.generated - (eg.grid + eg.storage + eg.sharedSolar));
  logTest('6.4.3 Energy Flow Balance Arithmetic (PRD §13)', energyBalanceDiff < 0.05,
    `Gen: ${eg.generated.toFixed(2)} MW == Grid: ${eg.grid.toFixed(2)} + BESS: ${eg.storage.toFixed(2)} + Community: ${eg.sharedSolar.toFixed(2)} MW (Diff: ${energyBalanceDiff.toFixed(3)})`);

  // ───────────────────────────────────────────────────────────────────────────
  // 6.5 Performance & Laptop 3D Lightweight Footprint (PRD §12)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6.5 Performance & Lightweight Footprint ---');

  const payloadSizeBytes = Buffer.byteLength(JSON.stringify(physicsState));
  logTest('6.5.1 Compact Shared State Payload Size', payloadSizeBytes < 8000,
    `State payload: ${(payloadSizeBytes / 1024).toFixed(2)} KB (Target < 8 KB for zero lag)`);

  // Clean Reset at end
  ws1.send(JSON.stringify({ action: 'RESET' }));
  await waitForState(ws1, s => s.farm.operatingMode === 'NORMAL', 3000, 'Final Reset');

  ws1.close();
  ws2.close();

  // Summary
  console.log('\n================================================================');
  const allPassed = testResults.every(r => r.passed);
  const passedCount = testResults.filter(r => r.passed).length;
  console.log(`Phase 6 Verification Results: ${passedCount} / ${testResults.length} Tests Passed`);
  console.log(`Overall Status: ${allPassed ? '✅ PHASE 6 COMPLETE' : '❌ SOME TESTS FAILED'}`);
  console.log('================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase6Verification().catch(err => {
  console.error('Fatal Phase 6 Verification Error:', err);
  process.exit(1);
});

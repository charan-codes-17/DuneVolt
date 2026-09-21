import { WebSocket } from 'ws';

const WS_URL = 'ws://localhost:3000';

async function runVerification() {
  const ws = new WebSocket(WS_URL);
  const testResults = [];

  function logTest(testName, passed, details) {
    details = details || '';
    testResults.push({ testName, passed, details });
    const icon = passed ? 'PASS' : 'FAIL';
    console.log(icon + ': ' + testName + (details ? ' (' + details + ')' : ''));
  }

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  console.log('Connected to DuneVolt on ws://localhost:3000');
  console.log('Starting Phase 5 Demo Script Verification\n');

  let latestState = null;
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'STATE_UPDATE' || msg.type === 'INITIAL_STATE') {
        latestState = msg.data;
      }
    } catch (e) { }
  });

  function sendAction(action, payload) {
    payload = payload || {};
    ws.send(JSON.stringify({ action, payload }));
  }

  function waitForState(predicate, timeoutMs, description) {
    timeoutMs = timeoutMs || 8000;
    description = description || 'state update';
    if (latestState && predicate(latestState)) {
      return Promise.resolve(latestState);
    }
    return new Promise((resolve, reject) => {
      let resolved = false;
      const handler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type !== 'STATE_UPDATE' && msg.type !== 'INITIAL_STATE') return;
          if (predicate(msg.data)) {
            resolved = true;
            ws.removeListener('message', handler);
            clearTimeout(timer);
            resolve(msg.data);
          }
        } catch (e) { }
      };
      const timer = setTimeout(() => {
        if (!resolved) {
          ws.removeListener('message', handler);
          reject(new Error('Timeout: ' + description + ' after ' + timeoutMs + 'ms'));
        }
      }, timeoutMs);
      ws.on('message', handler);
    });
  }

  function waitForDemoStep(expectedStep, timeoutMs) {
    timeoutMs = timeoutMs || 20000;
    return new Promise((resolve, reject) => {
      let resolved = false;
      const handler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type !== 'DEMO_STEP') return;
          if (msg.data.stepIndex === expectedStep && msg.data.active) {
            resolved = true;
            ws.removeListener('message', handler);
            clearTimeout(timer);
            resolve(msg.data);
          }
        } catch (e) { }
      };
      const timer = setTimeout(() => {
        if (!resolved) {
          ws.removeListener('message', handler);
          reject(new Error('Timeout DEMO_STEP ' + expectedStep + ' after ' + timeoutMs + 'ms'));
        }
      }, timeoutMs);
      ws.on('message', handler);
    });
  }

  function waitForDemoEnd(timeoutMs) {
    timeoutMs = timeoutMs || 20000;
    return new Promise((resolve, reject) => {
      let resolved = false;
      const handler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type !== 'DEMO_STEP') return;
          if (!msg.data.active) {
            resolved = true;
            ws.removeListener('message', handler);
            clearTimeout(timer);
            resolve(msg.data);
          }
        } catch (e) { }
      };
      const timer = setTimeout(() => {
        if (!resolved) {
          ws.removeListener('message', handler);
          reject(new Error('Timeout demo end after ' + timeoutMs + 'ms'));
        }
      }, timeoutMs);
      ws.on('message', handler);
    });
  }

  // 5.0 Baseline reset
  sendAction('RESET');
  await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Baseline Reset');
  logTest('5.0 System Reset to Baseline', true, 'Pre-demo clean state confirmed');

  // 5.1 Stage 1
  console.log('\n--- 5.1 Stage 1: Normal Operation ---');
  const step1Promise = waitForDemoStep(1, 5000);
  sendAction('DEMO_RUN');
  let step1Data;
  try {
    step1Data = await step1Promise;
    logTest('5.1 DEMO_RUN Triggers Stage 1', step1Data.active && step1Data.stepIndex === 1,
      'Stage: ' + step1Data.stageName + ', Narration: ' + (step1Data.narration.length > 0));
  } catch (e) {
    logTest('5.1 DEMO_RUN Triggers Stage 1', false, e.message);
  }

  const stage1State = await waitForState(
    s => s.environment.sunAngle >= 70 && s.farm.operatingMode === 'NORMAL',
    6000, 'Stage 1 Optimal Sun'
  );
  logTest('5.1 Stage 1: Optimal Tracking State',
    stage1State.environment.sunAngle >= 70 && stage1State.farm.operatingMode === 'NORMAL',
    'Sun: ' + stage1State.environment.sunAngle + 'deg, Power: ' + stage1State.farm.totalPower + 'MW'
  );

  // 5.2 Stage 2: Dust Event
  console.log('\n--- 5.2 Stage 2: Dust Event ---');
  let step2Data;
  try {
    step2Data = await waitForDemoStep(2, 20000);
    logTest('5.2 Stage 2 DEMO_STEP Received', step2Data.active && step2Data.stepIndex === 2, step2Data.stageName);
  } catch (e) {
    logTest('5.2 Stage 2 DEMO_STEP Received', false, e.message);
  }
  const stage2State = await waitForState(s => s.environment.dustLevel >= 60, 20000, 'Dust >= 60%');
  logTest('5.2 Stage 2: Dust Elevated', stage2State.environment.dustLevel >= 60,
    'Dust: ' + stage2State.environment.dustLevel + '%, Soiling: ' + stage2State.prediction.soilingRisk);

  const cleanState = await waitForState(
    s => s.farm.operatingMode === 'CLEANING' && s.maintenance.cleaningRobotActive, 25000, 'Cleaning Active');
  logTest('5.2 Stage 2: Robotic Cleaning Dispatched', cleanState.maintenance.cleaningRobotActive,
    'Mode: ' + cleanState.farm.operatingMode);

  // 5.3 Stage 3: Storm Event
  console.log('\n--- 5.3 Stage 3: Storm Event ---');
  let step3Data;
  try {
    step3Data = await waitForDemoStep(3, 60000);
    logTest('5.3 Stage 3 DEMO_STEP Received', step3Data.active && step3Data.stepIndex === 3, step3Data.stageName);
  } catch (e) {
    logTest('5.3 Stage 3 DEMO_STEP Received', false, e.message);
  }
  const warnState = await waitForState(
    s => s.farm.operatingMode === 'WARNING' && s.prediction.stormRisk >= 70, 20000, 'Storm Warning');
  logTest('5.3 Stage 3: AI Storm Warning', warnState.prediction.stormRisk >= 70,
    'Risk: ' + warnState.prediction.stormRisk + '%, Mode: ' + warnState.farm.operatingMode);

  const stormState = await waitForState(s => s.farm.operatingMode === 'STORM', 30000, 'Storm Active');
  logTest('5.3 Stage 3: Sandstorm Active', stormState.environment.stormIntensity >= 80,
    'Intensity: ' + stormState.environment.stormIntensity + '%, Visibility: ' + stormState.environment.visibility + '%');

  // 5.4 Stage 4: Fault Injection
  console.log('\n--- 5.4 Stage 4: Fault Injection ---');
  let step4Data;
  try {
    step4Data = await waitForDemoStep(4, 65000);
    logTest('5.4 Stage 4 DEMO_STEP Received', step4Data.active && step4Data.stepIndex === 4, step4Data.stageName);
  } catch (e) {
    logTest('5.4 Stage 4 DEMO_STEP Received', false, e.message);
  }
  const faultState = await waitForState(
    s => { const p = s.panels.find(x => x.id === 'PV-02'); return p && p.faultStatus === 'HOTSPOT'; },
    15000, 'PV-02 Hotspot');
  const pv2f = faultState.panels.find(p => p.id === 'PV-02');
  logTest('5.4 Hotspot Fault Injected', pv2f.faultStatus === 'HOTSPOT' && pv2f.faultAttribution.hotspot > 20,
    'Fault: ' + pv2f.faultStatus + ', Attribution: ' + pv2f.faultAttribution.hotspot + '%');

  const faultClearState = await waitForState(
    s => { const p = s.panels.find(x => x.id === 'PV-02'); return p && p.faultStatus === 'NONE'; },
    25000, 'PV-02 Cleared');
  logTest('5.4 Fault Cleared', faultClearState.panels.find(p => p.id === 'PV-02').health === 'NORMAL', 'PV-02 health = NORMAL');

  // 5.5 Stage 5: Energy Finale
  console.log('\n--- 5.5 Stage 5: Energy Flow Finale ---');
  let step5Data;
  try {
    step5Data = await waitForDemoStep(5, 30000);
    logTest('5.5 Stage 5 DEMO_STEP Received', step5Data.active && step5Data.stepIndex === 5, step5Data.stageName);
  } catch (e) {
    logTest('5.5 Stage 5 DEMO_STEP Received', false, e.message);
  }
  const energyState = await waitForState(
    s => s.energy.routingDecision === 'GRID_EXPORT' && s.farm.totalPower > 3.0, 15000, 'GRID_EXPORT');
  logTest('5.5 Peak Generation & GRID_EXPORT', energyState.energy.routingDecision === 'GRID_EXPORT',
    'Grid: ' + energyState.energy.grid + 'MW, Storage: ' + energyState.energy.storage + 'MW, Shared: ' + energyState.energy.sharedSolar + 'MW');

  // 5.6 Demo Completion
  console.log('\n--- 5.6 Demo Completion ---');
  let demoEnd;
  try {
    demoEnd = await waitForDemoEnd(25000);
    logTest('5.6 Demo End Broadcast', !demoEnd.active, 'active=false received');
  } catch (e) {
    logTest('5.6 Demo End Broadcast', false, e.message);
  }
  const finalState = await waitForState(s => s.farm.operatingMode === 'NORMAL', 5000, 'Final NORMAL');
  logTest('5.6 Final State NORMAL', finalState.farm.operatingMode === 'NORMAL',
    'Mode: ' + finalState.farm.operatingMode + ', Power: ' + finalState.farm.totalPower + 'MW');

  // 5.7 DEMO_STOP
  console.log('\n--- 5.7 DEMO_STOP Early Termination ---');
  const es1 = waitForDemoStep(1, 6000);
  sendAction('DEMO_RUN');
  try { await es1; } catch (e) { }
  const ee = waitForDemoEnd(6000);
  sendAction('DEMO_STOP');
  try {
    const ed = await ee;
    logTest('5.7 DEMO_STOP Broadcasts active=false', !ed.active, 'abort confirmed');
  } catch (e) {
    logTest('5.7 DEMO_STOP Broadcasts active=false', false, e.message);
  }
  const stopState = await waitForState(s => s.farm.operatingMode === 'NORMAL', 5000, 'Post-stop NORMAL');
  logTest('5.7 DEMO_STOP Restores Baseline', stopState.farm.operatingMode === 'NORMAL', 'Mode: ' + stopState.farm.operatingMode);

  ws.close();
  return testResults;
}

runVerification()
  .then(results => {
    console.log('\n======================================================');
    console.log('       PHASE 5 DEMO SCRIPT VERIFICATION REPORT       ');
    console.log('======================================================');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log('Results: ' + passed + ' / ' + total + ' tests passed.\n');
    results.forEach(r => {
      if (!r.passed) console.log('  FAILED: ' + r.testName + (r.details ? '\n     ' + r.details : ''));
    });
    if (passed === total && total >= 14) {
      console.log('ALL PHASE 5 DEMO REQUIREMENTS FULLY VERIFIED AND PASSING!');
      process.exit(0);
    } else {
      console.error('' + (total - passed) + ' tests failed.');
      process.exit(1);
    }
  })
  .catch(err => { console.error('Verification failed:', err); process.exit(1); });
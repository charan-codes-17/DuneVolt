import { WebSocket } from 'ws';

const WS_URL = 'ws://localhost:3000';

async function runVerification() {
  const ws = new WebSocket(WS_URL);
  const testResults = [];

  function logTest(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName} ${details ? '(' + details + ')' : ''}`);
  }

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  console.log('🔗 Connected to DuneVolt Digital Twin on ws://localhost:3000');

  // Helper to wait for a state condition with timeout
  function waitForState(predicate, timeoutMs = 8000, description = 'state update') {
    return new Promise((resolve, reject) => {
      let resolved = false;

      const handler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type !== 'STATE_UPDATE' && msg.type !== 'INITIAL_STATE') return;
          const state = msg.data;
          if (predicate(state)) {
            resolved = true;
            ws.removeListener('message', handler);
            clearTimeout(timer);
            resolve(state);
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      const timer = setTimeout(() => {
        if (!resolved) {
          ws.removeListener('message', handler);
          reject(new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      ws.on('message', handler);
    });
  }

  function sendAction(action, payload = {}) {
    ws.send(JSON.stringify({ action, payload }));
  }

  // --- Step 0: Clean Reset ---
  sendAction('RESET');
  const baselineState = await waitForState(s => s.farm.operatingMode === 'NORMAL' && s.panels.length === 3, 4000, 'Baseline State');
  logTest('4.0 Shared Authoritative Farm State & Baseline', 
    baselineState.farm.operatingMode === 'NORMAL' && baselineState.panels.length === 3,
    `Mode: ${baselineState.farm.operatingMode}, Total Power: ${baselineState.farm.totalPower}MW`
  );

  // --- Step 1: 4.1 Sun & Dynamic Panel Tracking ---
  console.log('\n--- 4.1 Sun & Panel Tracking ---');
  sendAction('SET_ENVIRONMENT', { sunAngle: 65, dustLevel: 10, windSpeed: 15, temperature: 32 });
  const trackState = await waitForState(s => s.environment.sunAngle === 65, 4000, 'Sun Angle 65°');
  const p1 = trackState.panels[0];
  const expectedTilt = Math.max(10, Math.min(75, 90 - 65)); // 25°
  const tiltCorrect = Math.abs(p1.tilt - expectedTilt) <= 1;
  const insolationPower = p1.output > 1.2;
  logTest('4.1 Sun Elevation to Panel Tilt Mechanical Tracking',
    tiltCorrect && insolationPower,
    `Sun: 65°, Target Tilt: ${p1.tilt}° (Expected: ${expectedTilt}°), Array Output: ${p1.output}MW`
  );

  // --- Step 2: 4.5 Maintenance & Economic Cleaning Prioritization ---
  console.log('\n--- 4.5 Maintenance & Economic Cleaning Prioritization ---');
  sendAction('SET_ENVIRONMENT', { sunAngle: 50, dustLevel: 65, windSpeed: 20, temperature: 36 });
  const econState = await waitForState(s => s.environment.dustLevel === 65, 4000, 'Dust Level 65%');
  const queue = econState.maintenance.cleaningQueue;
  const isRanked = queue && queue.length === 3 && queue[0].estimatedDailyLossInr >= queue[1].estimatedDailyLossInr;
  const thresholdExceeded = queue && queue[0].thresholdExceeded === true;
  const highSoiling = econState.prediction.soilingRisk === 'CRITICAL' || econState.prediction.soilingRisk === 'HIGH';
  logTest('4.5 Economic Cleaning Queue Prioritization & ROI Loss Threshold',
    isRanked && thresholdExceeded && highSoiling,
    `Highest Priority Panel: ${queue[0].panelId}, Loss: ₹${queue[0].estimatedDailyLossInr}/day, ROI Justified: ${queue[0].thresholdExceeded}, Priority: ${queue[0].priority}`
  );

  // --- Step 3: 4.4 Fault Detection & Root-Cause Attribution (Hotspot) ---
  console.log('\n--- 4.4 Fault Detection & Root-Cause Attribution (7 Factors) ---');
  sendAction('SET_FAULT', { panelId: 'PV-02', faultType: 'HOTSPOT' });
  const hotspotState = await waitForState(s => {
    const p = s.panels.find(x => x.id === 'PV-02');
    return p && p.faultStatus === 'HOTSPOT';
  }, 4000, 'PV-02 Hotspot Fault');
  
  const pv2Hotspot = hotspotState.panels.find(x => x.id === 'PV-02');
  const hsAttr = pv2Hotspot.faultAttribution;
  const hsCV = pv2Hotspot.visualInspection;
  const hsCorrect = pv2Hotspot.health === 'FAULT' && hsAttr.hotspot > 20 && hsAttr.primaryCause.includes('Hotspot');
  const cvThermalCorrect = hsCV.discoloration.includes('thermal') || hsCV.summary.includes('Hotspot') || hsCV.summary.includes('hotspot');
  logTest('4.4 Anomaly Detection & Attribution: Localized Hotspot (IR Anomaly)',
    hsCorrect && cvThermalCorrect,
    `Attribution: Hotspot ${hsAttr.hotspot}%, Dust ${hsAttr.dust}%, Heat ${hsAttr.heat}%, Cause: "${hsAttr.primaryCause}", CV: "${hsCV.summary}"`
  );

  // --- Step 4: 4.4 Micro-Crack Fault Diagnosis ---
  sendAction('SET_FAULT', { panelId: 'PV-02', faultType: 'CRACK' });
  const crackState = await waitForState(s => {
    const p = s.panels.find(x => x.id === 'PV-02');
    return p && p.faultStatus === 'CRACK';
  }, 4000, 'PV-02 Crack Fault');
  const pv2Crack = crackState.panels.find(x => x.id === 'PV-02');
  const crackAttr = pv2Crack.faultAttribution;
  const crackCV = pv2Crack.visualInspection;
  const crackCorrect = crackAttr.crack > 30 && crackCV.crack.includes('Micro-crack');
  logTest('4.4 Anomaly Detection & Attribution: Silicon Busbar Micro-Crack',
    crackCorrect,
    `Attribution: Crack ${crackAttr.crack}%, Degradation ${crackAttr.degradation}%, CV Crack: "${crackCV.crack}"`
  );

  // --- Step 5: Anomaly Clear & Return to Health ---
  sendAction('SET_FAULT', { panelId: 'PV-02', faultType: 'NONE' });
  const clearState = await waitForState(s => {
    const p = s.panels.find(x => x.id === 'PV-02');
    return p && p.faultStatus === 'NONE' && p.health === 'NORMAL';
  }, 4000, 'PV-02 Fault Cleared');
  logTest('4.4 Anomaly Recovery & Array Telemetry Normalization',
    clearState.panels.find(x => x.id === 'PV-02').health === 'NORMAL',
    'PV-02 returned to NORMAL health'
  );

  // --- Step 6: 4.6 Dynamic Energy Routing Decision ---
  console.log('\n--- 4.6 Energy Routing (Tier 2) ---');
  sendAction('SET_ENVIRONMENT', { sunAngle: 60, dustLevel: 10, windSpeed: 12, temperature: 28 });
  const energyState = await waitForState(s => s.farm.totalPower > 3.0, 4000, 'High Generation State');
  const energy = energyState.energy;
  const validRouting = energy.routingDecision === 'GRID_EXPORT' && energy.grid > 0 && energy.storage > 0;
  logTest('4.6 Dynamic Energy Routing & Distribution Network',
    validRouting,
    `Decision: ${energy.routingDecision}, Total: ${energy.generated}MW, Grid: ${energy.grid}MW, BESS: ${energy.storage}MW, Tariff: ${energy.gridPrice}`
  );

  // --- Step 7: 4.2 Dust Simulation & Waterless Robotic Cleaning ---
  console.log('\n--- 4.2 Dust Simulation & Waterless Cleaning Chain ---');
  sendAction('TRIGGER_CLEANING');
  const cleanActiveState = await waitForState(s => s.farm.operatingMode === 'CLEANING' && s.maintenance.cleaningRobotActive, 4000, 'Cleaning Active');
  logTest('4.2 Waterless Dry-Brush Robotic Sweep Dispatched',
    cleanActiveState.maintenance.cleaningRobotActive === true,
    `Mode: ${cleanActiveState.farm.operatingMode}, Robot Active: ${cleanActiveState.maintenance.cleaningRobotActive}`
  );

  const cleanDoneState = await waitForState(s => s.farm.operatingMode === 'NORMAL' && s.environment.dustLevel === 10, 10000, 'Cleaning Complete');
  logTest('4.2 Robotic Sweep Completed & Surface Soiling Cleared',
    cleanDoneState.environment.dustLevel === 10 && !cleanDoneState.maintenance.cleaningRobotActive,
    `Post-Cleaning Dust: ${cleanDoneState.environment.dustLevel}%, Total Power Restored: ${cleanDoneState.farm.totalPower}MW`
  );

  // --- Step 8: 4.3 Storm Prediction & Full Defensive Cycle ---
  console.log('\n--- 4.3 Storm Prediction & Proactive Defense Cycle ---');
  sendAction('SIMULATE_STORM');
  const warningState = await waitForState(s => s.farm.operatingMode === 'WARNING' && s.prediction.stormRisk >= 70, 4000, 'Storm Warning');
  logTest('4.3 AI Predictive Storm Risk Warning & Automated Countdown',
    warningState.prediction.stormRisk >= 70,
    `Storm Risk: ${warningState.prediction.stormRisk}%, Alert: "${warningState.farm.activeAlert}"`
  );

  const protectState = await waitForState(s => s.farm.operatingMode === 'PROTECTING', 12000, 'Defensive Array Stow');
  const stowedPanel = protectState.panels[0];
  logTest('4.3 Autonomous Panel Stow Defense (12° Aerodynamic Stow Angle)',
    stowedPanel.tilt === 12 && stowedPanel.state === 'PROTECTING',
    `Defensive Stow Angle: ${stowedPanel.tilt}°, Operating Mode: ${protectState.farm.operatingMode}`
  );

  const stormState = await waitForState(s => s.farm.operatingMode === 'STORM', 5000, 'Sandstorm Peak');
  logTest('4.3 Severe Sandstorm Phase & Atmospheric Attenuation',
    stormState.environment.stormIntensity >= 80 && stormState.environment.visibility <= 30,
    `Storm Intensity: ${stormState.environment.stormIntensity}%, Atmospheric Visibility: ${stormState.environment.visibility}%`
  );

  const recoverState = await waitForState(s => s.farm.operatingMode === 'RECOVERY' || s.farm.operatingMode === 'CLEANING', 12000, 'Post-Storm Recovery & Cleaning');
  logTest('4.3 Post-Storm Autonomous Recovery & Inspection Phase',
    recoverState.farm.operatingMode === 'RECOVERY' || recoverState.farm.operatingMode === 'CLEANING',
    `Recovery Operating Mode: ${recoverState.farm.operatingMode}`
  );

  const finalState = await waitForState(s => s.farm.operatingMode === 'NORMAL' && s.panels[0].state === 'TRACKING', 12000, 'Resume Generation');
  logTest('4.3 Full Sense -> Predict -> Protect -> Recover -> Resume Cycle Complete',
    finalState.farm.operatingMode === 'NORMAL' && finalState.panels[0].state === 'TRACKING',
    `Final Operating Mode: ${finalState.farm.operatingMode}, Panels Re-aligned: ${finalState.panels[0].tilt}°`
  );

  // Clean Reset at end
  sendAction('RESET');
  await new Promise(r => setTimeout(r, 500));
  ws.close();

  return testResults;
}

runVerification()
  .then(results => {
    console.log('\n======================================================');
    console.log('       PHASE 4 CORE FEATURES VERIFICATION REPORT      ');
    console.log('======================================================');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`Results: ${passed} / ${total} tests passed.\n`);
    if (passed === total && total >= 11) {
      console.log('🎉 ALL PHASE 4 REQUIREMENTS FULLY VERIFIED AND PASSING!');
      process.exit(0);
    } else {
      console.error('❌ Some tests failed or were skipped.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
  });

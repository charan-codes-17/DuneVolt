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

async function runPhase7Verification() {
  console.log('================================================================');
  console.log('DuneVolt — Phase 7: Product Architecture & Open Question Verification');
  console.log('================================================================\n');

  const testResults = [];
  function logTest(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    const badge = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${badge}: ${testName}${details ? ' — ' + details : ''}`);
  }

  // Connect WebSocket Client
  const ws = new WebSocket(WS_URL);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  console.log('Connected WebSocket client to ws://localhost:3000\n');

  function waitForState(predicate, timeoutMs = 6000, desc = 'state predicate') {
    return new Promise((resolve, reject) => {
      const handler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'STATE_UPDATE' || msg.type === 'INITIAL_STATE') {
            if (predicate(msg.data)) {
              ws.removeListener('message', handler);
              clearTimeout(timer);
              resolve(msg.data);
            }
          }
        } catch (e) {}
      };
      const timer = setTimeout(() => {
        ws.removeListener('message', handler);
        reject(new Error(`Timeout waiting for ${desc} after ${timeoutMs}ms`));
      }, timeoutMs);
      ws.on('message', handler);
    });
  }

  // Reset to clean baseline first
  ws.send(JSON.stringify({ action: 'RESET' }));
  await waitForState(s => s.farm.operatingMode === 'NORMAL' && s.panels.every(p => p.faultStatus === 'NONE'), 4000, 'Baseline Reset');

  // ───────────────────────────────────────────────────────────────────────────
  // 7.1 Seven Fault-Attribution Categories (Specification §10.4 & PRD §10.4)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 7.1 Active Triggers & Telemetry for All 7 Fault Categories ---');

  // 1. HOTSPOT (Thermal IR Anomaly on PV-01)
  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-01', faultType: 'HOTSPOT' } }));
  const sHotspot = await waitForState(s => s.panels.find(p => p.id === 'PV-01')?.faultStatus === 'HOTSPOT', 4000, 'PV-01 HOTSPOT');
  const pv1Hotspot = sHotspot.panels.find(p => p.id === 'PV-01');
  const hsValid = pv1Hotspot.faultAttribution.hotspot > 20 &&
                  pv1Hotspot.visualInspection.discoloration.includes('thermal browning') &&
                  pv1Hotspot.visualInspection.summary.includes('Thermal IR anomaly');
  logTest('7.1.1 Fault Category 1: Cell Hotspot (Thermal IR Anomaly)', hsValid,
    `Attribution: Hotspot ${pv1Hotspot.faultAttribution.hotspot}%, Primary Cause: "${pv1Hotspot.faultAttribution.primaryCause}"`);

  // 2. CRACK (Silicon Busbar Micro-Crack on PV-02)
  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-02', faultType: 'CRACK' } }));
  const sCrack = await waitForState(s => s.panels.find(p => p.id === 'PV-02')?.faultStatus === 'CRACK', 4000, 'PV-02 CRACK');
  const pv2Crack = sCrack.panels.find(p => p.id === 'PV-02');
  const crackValid = pv2Crack.faultAttribution.crack > 30 &&
                     pv2Crack.visualInspection.crack.includes('Micro-crack fracture') &&
                     pv2Crack.visualInspection.baselineComparison.includes('electroluminescence');
  logTest('7.1.2 Fault Category 2: Silicon Busbar Micro-Crack', crackValid,
    `Attribution: Crack ${pv2Crack.faultAttribution.crack}%, Primary Cause: "${pv2Crack.faultAttribution.primaryCause}"`);

  // 3. WIRING (String Connector Resistance on PV-03)
  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-03', faultType: 'WIRING' } }));
  const sWiring = await waitForState(s => s.panels.find(p => p.id === 'PV-03')?.faultStatus === 'WIRING', 4000, 'PV-03 WIRING');
  const pv3Wiring = sWiring.panels.find(p => p.id === 'PV-03');
  const wiringValid = pv3Wiring.faultAttribution.wiring > 30 &&
                      pv3Wiring.visualInspection.looseComponents.includes('MC4 connector') &&
                      pv3Wiring.visualInspection.summary.includes('Connector resistance fault');
  logTest('7.1.3 Fault Category 3: String Connector Resistance (MC4)', wiringValid,
    `Attribution: Wiring ${pv3Wiring.faultAttribution.wiring}%, Primary Cause: "${pv3Wiring.faultAttribution.primaryCause}"`);

  // 4. SHADING (Localized Horizon Shading on PV-02)
  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-02', faultType: 'SHADING' } }));
  const sShading = await waitForState(s => s.panels.find(p => p.id === 'PV-02')?.faultStatus === 'SHADING', 4000, 'PV-02 SHADING');
  const pv2Shading = sShading.panels.find(p => p.id === 'PV-02');
  const shadingValid = pv2Shading.faultAttribution.shading > 30 &&
                       pv2Shading.visualInspection.discoloration.includes('Sharp contrast shadow') &&
                       pv2Shading.visualInspection.summary.includes('Localized structural shadow');
  logTest('7.1.4 Fault Category 4: Localized Horizon Shading', shadingValid,
    `Attribution: Shading ${pv2Shading.faultAttribution.shading}%, Primary Cause: "${pv2Shading.faultAttribution.primaryCause}"`);

  // 5. DEGRADATION (Cell EVA Polymer Degradation on PV-01)
  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-01', faultType: 'DEGRADATION' } }));
  const sDegradation = await waitForState(s => s.panels.find(p => p.id === 'PV-01')?.faultStatus === 'DEGRADATION', 4000, 'PV-01 DEGRADATION');
  const pv1Degradation = sDegradation.panels.find(p => p.id === 'PV-01');
  const degradationValid = pv1Degradation.faultAttribution.degradation > 30 &&
                           pv1Degradation.visualInspection.discoloration.includes('EVA encapsulant polymer') &&
                           pv1Degradation.visualInspection.summary.includes('Photothermal EVA degradation');
  logTest('7.1.5 Fault Category 5: Cell EVA Polymer Degradation', degradationValid,
    `Attribution: Degradation ${pv1Degradation.faultAttribution.degradation}%, Primary Cause: "${pv1Degradation.faultAttribution.primaryCause}"`);

  // 6. DUST (Atmospheric Soiling on all panels)
  ws.send(JSON.stringify({ action: 'RESET' }));
  await waitForState(s => s.panels.every(p => p.faultStatus === 'NONE'), 4000, 'Reset before dust test');
  ws.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { dustLevel: 55, temperature: 25, sunAngle: 50 } }));
  const sDust = await waitForState(s => s.environment.dustLevel === 55, 4000, 'Dust 55%');
  const pvDust = sDust.panels[0];
  const dustValid = pvDust.faultAttribution.dust >= 20 &&
                    sDust.maintenance.cleaningQueue.length === 3 &&
                    sDust.maintenance.cleaningQueue[0].priority !== 'LOW';
  logTest('7.1.6 Fault Category 6: Dust Particle Soiling & Economic Queue', dustValid,
    `Attribution: Dust ${pvDust.faultAttribution.dust}%, Queue Top Priority: ${sDust.maintenance.cleaningQueue[0].priority}, Daily Loss: ₹${sDust.maintenance.cleaningQueue[0].estimatedDailyLossInr}`);

  // 7. HEAT (Desert High Thermal Derating >25°C)
  ws.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { dustLevel: 5, temperature: 48, sunAngle: 80 } }));
  const sHeat = await waitForState(s => s.environment.temperature === 48, 4000, 'Temperature 48°C');
  const pvHeat = sHeat.panels[0];
  const heatValid = pvHeat.faultAttribution.heat >= 10 &&
                    sHeat.prediction.heatLossRisk.includes('-9.2%') || pvHeat.faultAttribution.heat >= 8;
  logTest('7.1.7 Fault Category 7: Desert Thermal Derating (-0.4%/°C)', heatValid,
    `Attribution: Heat ${pvHeat.faultAttribution.heat}%, Heat Loss Risk: ${sHeat.prediction.heatLossRisk}, Panel Temp: ${pvHeat.temperature}°C`);

  // ───────────────────────────────────────────────────────────────────────────
  // 7.2 Dynamic Live Energy Routing Module (PRD §10.8 & §11)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7.2 Dynamic Live Energy Routing Module Verification ---');

  // Case A: High Solar Peak Generation (>3.0 MW) -> GRID_EXPORT
  ws.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 90, dustLevel: 0, temperature: 25 } }));
  const sGenHigh = await waitForState(s => s.farm.totalPower > 3.0, 4000, 'High Generation State');
  const egHigh = sGenHigh.energy;
  const isGridExport = egHigh.activeRoute === 'GRID_EXPORT' &&
                       egHigh.gridPrice.includes('PEAK') &&
                       egHigh.grid > 2.0 &&
                       egHigh.storage > 0.5 &&
                       egHigh.sharedSolar > 0.3;
  const balHigh = Math.abs(egHigh.generated - (egHigh.grid + egHigh.storage + egHigh.sharedSolar)) < 0.05;

  logTest('7.2.1 High Solar Generation -> GRID_EXPORT & PEAK Tariff', isGridExport && balHigh,
    `Gen: ${egHigh.generated} MW, Grid Export: ${egHigh.grid} MW, BESS: ${egHigh.storage} MW, Rural Community: ${egHigh.sharedSolar} MW, Price: ${egHigh.gridPrice}`);

  // Case B: Moderate Solar Generation (1.2 - 3.0 MW) -> BATTERY_CHARGE
  ws.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 30, dustLevel: 10, temperature: 28 } }));
  const sGenMid = await waitForState(s => s.farm.totalPower >= 1.2 && s.farm.totalPower <= 3.0, 4000, 'Mid Generation State');
  const egMid = sGenMid.energy;
  const isBatteryCharge = egMid.activeRoute === 'BATTERY_CHARGE' &&
                          egMid.gridPrice.includes('STANDARD') &&
                          egMid.storage >= +(egMid.generated * 0.30).toFixed(2);
  const balMid = Math.abs(egMid.generated - (egMid.grid + egMid.storage + egMid.sharedSolar)) < 0.05;

  logTest('7.2.2 Moderate Solar Generation -> BATTERY_CHARGE & STANDARD Tariff', isBatteryCharge && balMid,
    `Gen: ${egMid.generated} MW, BESS Charging: ${egMid.storage} MW, Grid: ${egMid.grid} MW, Rural Community: ${egMid.sharedSolar} MW, Price: ${egMid.gridPrice}`);

  // Case C: Low Solar / Night (<1.2 MW) -> COMMUNITY_DIRECT / Storage Discharge
  ws.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 5, dustLevel: 40, temperature: 25 } }));
  const sGenLow = await waitForState(s => s.farm.totalPower < 1.2, 4000, 'Low Generation State');
  const egLow = sGenLow.energy;
  const isCommunityDirect = egLow.activeRoute === 'COMMUNITY_DIRECT' &&
                            egLow.gridPrice.includes('OFF-PEAK') &&
                            egLow.sharedSolar > 0;

  logTest('7.2.3 Low Solar Generation -> COMMUNITY_DIRECT & Rural Support', isCommunityDirect,
    `Gen: ${egLow.generated} MW, Rural Community Sustained: ${egLow.sharedSolar} MW, Price: ${egLow.gridPrice}`);

  // ───────────────────────────────────────────────────────────────────────────
  // 7.3 Honest & Punchy Storm Countdown Wording (PRD §16 & §10.3)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7.3 Honest & Punchy Storm Countdown Wording ---');

  ws.send(JSON.stringify({ action: 'RESET' }));
  await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Reset before storm test');

  ws.send(JSON.stringify({ action: 'SIMULATE_STORM' }));
  const sStormWarning = await waitForState(s => s.farm.operatingMode === 'WARNING' && s.prediction.countdown !== null, 4000, 'Storm WARNING countdown');

  const alertHasHonestWording = sStormWarning.farm.activeAlert.includes('AI EARLY WARNING') &&
                                sStormWarning.farm.activeAlert.includes('automated protective stow cycle');
  const countdownValid = sStormWarning.prediction.countdown <= 10 && sStormWarning.prediction.countdown >= 8;
  const eventHasCountdown = sStormWarning.events.some(e => e.message.includes('AI Storm Early Warning') && e.message.includes('Countdown'));

  logTest('7.3.1 Storm Early Warning Alert & Honest Labeling', alertHasHonestWording && countdownValid,
    `Alert: "${sStormWarning.farm.activeAlert}", Countdown: ${sStormWarning.prediction.countdown}s`);

  logTest('7.3.2 Event Log Autochronology with Honest Countdown', eventHasCountdown,
    `Event Log Entry: "${sStormWarning.events[0]?.message}"`);

  // ───────────────────────────────────────────────────────────────────────────
  // 7.4 Multi-Panel Fault Injection and Clean Reset Verification
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7.4 Multi-Panel Operations & Clean Reset Resilience ---');

  // Inject faults on PV-01 and PV-03
  ws.send(JSON.stringify({ action: 'RESET' }));
  await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Reset before multi-fault');

  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-01', faultType: 'HOTSPOT' } }));
  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-03', faultType: 'WIRING' } }));
  const sMultiFault = await waitForState(s => s.panels.filter(p => p.faultStatus !== 'NONE').length === 2, 4000, 'Multi-fault state');

  logTest('7.4.1 Multi-Panel Concurrent Anomaly Telemetry', sMultiFault.panels.filter(p => p.faultStatus !== 'NONE').length === 2,
    `PV-01: ${sMultiFault.panels[0].faultStatus}, PV-02: ${sMultiFault.panels[1].faultStatus}, PV-03: ${sMultiFault.panels[2].faultStatus}`);

  // Clear PV-01 fault via SET_FAULT
  ws.send(JSON.stringify({ action: 'SET_FAULT', payload: { panelId: 'PV-01', faultType: 'NONE' } }));
  const sCleared1 = await waitForState(s => s.panels.find(p => p.id === 'PV-01')?.faultStatus === 'NONE' && s.panels.find(p => p.id === 'PV-03')?.faultStatus === 'WIRING', 4000, 'PV-01 cleared');

  logTest('7.4.2 Individual Panel Anomaly Clear & Telemetry Restoration', sCleared1.panels[0].faultStatus === 'NONE',
    `PV-01 Status: ${sCleared1.panels[0].faultStatus}, PV-03 Status: ${sCleared1.panels[2].faultStatus}`);

  // Final Reset
  ws.send(JSON.stringify({ action: 'RESET' }));
  const sFinalReset = await waitForState(s => s.farm.operatingMode === 'NORMAL' && s.panels.every(p => p.faultStatus === 'NONE'), 4000, 'Final Reset');
  logTest('7.4.3 Final Instant Demo Reset to Baseline', sFinalReset.farm.operatingMode === 'NORMAL',
    `Farm Mode: ${sFinalReset.farm.operatingMode}, Faults: NONE, Total Power: ${sFinalReset.farm.totalPower} MW`);

  ws.close();

  // Summary
  console.log('\n================================================================');
  const allPassed = testResults.every(r => r.passed);
  const passedCount = testResults.filter(r => r.passed).length;
  console.log(`Phase 7 Verification Results: ${passedCount} / ${testResults.length} Tests Passed`);
  console.log(`Overall Status: ${allPassed ? '✅ PHASE 7 COMPLETE' : '❌ SOME TESTS FAILED'}`);
  console.log('================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase7Verification().catch(err => {
  console.error('Fatal Phase 7 Verification Error:', err);
  process.exit(1);
});

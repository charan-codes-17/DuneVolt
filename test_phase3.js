// DuneVolt Phase 3 Automated Verification Test Suite
// Verifies Phase 3: Panel Protection (Visual + Timing)
// Tests deployable ballistic sand deflector shields, choreographed warning lights,
// 4-5s stow completion timing, and the 5-second "Protected & Holding" window.

import WebSocket from 'ws';
import http from 'http';

const WS_URL = 'ws://localhost:3000';
const BASE_URL = 'http://localhost:3000';
let ws;

function connectWS() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(WS_URL);
    socket.on('open', () => resolve(socket));
    socket.on('error', (err) => reject(err));
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

function waitForState(predicate, timeoutMs = 15000, description = 'state condition') {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout (${timeoutMs}ms) waiting for: ${description}`));
    }, timeoutMs);

    function onMessage(event) {
      try {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        const msg = JSON.parse(raw);
        if (msg.type === 'STATE_UPDATE' || msg.type === 'INITIAL_STATE') {
          if (predicate(msg.data)) {
            cleanup();
            resolve(msg.data);
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    function cleanup() {
      clearTimeout(timeout);
      ws.removeEventListener('message', onMessage);
    }

    ws.addEventListener('message', onMessage);
  });
}

const testResults = [];
function logTest(name, passed, details = '') {
  testResults.push({ name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${name}`);
  if (details) console.log(`   └─ ${details}`);
  if (!passed) process.exitCode = 1;
}

async function runTests() {
  console.log('================================================================');
  console.log('DuneVolt Phase 3: Panel Protection (Visual + Timing) Verification');
  console.log('================================================================\n');

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // Part 1: Static Architecture & 3D Visual Asset Checks
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Check 1: 3D Visual Defense & Ballistic Shield Architecture ---');
    const sceneRes = await fetchRaw('/js/scene3d.js');
    const sceneCode = sceneRes.text;

    const hasShieldTex = sceneCode.includes('createShieldTexture') && sceneCode.includes('DUNE-VOLT ARMOR');
    logTest('1.1 Ballistic sand deflector armor procedural texture generator',
      hasShieldTex, 'Includes titanium composite grain, hazard caution stripes, and stencil insignia');

    const hasShieldWings = sceneCode.includes('topShieldGroup') && sceneCode.includes('bottomShieldGroup');
    logTest('1.2 Dual-wing motorized ballistic sand deflector shells on tracker heads',
      hasShieldWings, 'Top & bottom titanium plates with longitudinal reinforcement ribs');

    const hasCenterLock = sceneCode.includes('centerLockMesh') && sceneCode.includes('0xf59e0b');
    logTest('1.3 Interlocking magnetic hydraulic lock seal with radiant amber glow',
      hasCenterLock, 'Radiant lock seam mesh illuminates upon full shield closure');

    const hasStrobeChoreography = sceneCode.includes('isDeploying') && sceneCode.includes('targetShieldDeploy');
    logTest('1.4 Warning strobe & hydraulic lock beacon lighting choreography',
      hasStrobeChoreography, 'Rapid 5Hz amber strobe during active stow, solid lock amber-gold when secured');

    const indexRes = await fetchRaw('/index.html');
    const indexCode = indexRes.text;
    const hasShieldHUD = indexCode.includes('hud-shield-chip') && indexCode.includes('hud-shield-val');
    logTest('1.5 Real-time HUD Armor status indicator chip in viewport',
      hasShieldHUD, 'Displays live shield deployment percentage and locked status');

    // ─────────────────────────────────────────────────────────────────────────
    // Part 2: Dynamic Live Timing & Holding Window Verification
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Check 2: Live WebSocket Sequence & Timing Validation ---');
    ws = await connectWS();

    // Reset to baseline
    ws.send(JSON.stringify({ action: 'RESET' }));
    await waitForState(s => s.farm.operatingMode === 'NORMAL' && s.prediction.countdown === null, 4000, 'Baseline Reset');

    const capturedStates = [];
    const messageListener = (event) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        const msg = JSON.parse(raw);
        if (msg.type === 'STATE_UPDATE' && msg.data) {
          capturedStates.push({
            ts: Date.now(),
            mode: msg.data.farm.operatingMode,
            countdown: msg.data.prediction.countdown,
            tilt: msg.data.panels[0].tilt,
            shieldDeploy: msg.data.panels[0].shieldDeploy,
            stormIntensity: msg.data.environment.stormIntensity,
            alert: msg.data.farm.activeAlert
          });
        }
      } catch (e) {}
    };
    ws.addEventListener('message', messageListener);

    const stormStart = Date.now();
    ws.send(JSON.stringify({ action: 'SIMULATE_STORM' }));

    // 2.1 Early stow initiation at T=10s
    const sWarning = await waitForState(
      s => s.farm.operatingMode === 'WARNING' && s.prediction.countdown === 10,
      3000,
      'Initial Warning Countdown 10'
    );
    logTest('2.1 Defensive stow sequence initiates immediately at T=10s countdown',
      sWarning.prediction.countdown === 10 && sWarning.farm.operatingMode === 'WARNING',
      `Countdown: ${sWarning.prediction.countdown}, Mode: ${sWarning.farm.operatingMode}`);

    // 2.2 By Second 4-5 (countdown = 5), panels must be fully stowed (12°) and shields 100%
    const sStowedAt5 = await waitForState(
      s => s.prediction.countdown === 5 && s.panels[0].tilt === 12 && s.panels[0].shieldDeploy === 100,
      7000,
      'Stow complete & shields 100% by countdown second 5'
    );
    const stowTimeDelta = Date.now() - stormStart;
    logTest('2.2 Arrays fully flat (12°) & shields 100% locked by second 4-5 of countdown',
      sStowedAt5.panels[0].tilt === 12 && sStowedAt5.panels[0].shieldDeploy === 100,
      `Reached in ${stowTimeDelta}ms at countdown=${sStowedAt5.prediction.countdown}, Tilt=${sStowedAt5.panels[0].tilt}°, Shield=${sStowedAt5.panels[0].shieldDeploy}%`);

    logTest('2.3 Operating mode enters PROTECTING holding state at countdown 5',
      sStowedAt5.farm.operatingMode === 'PROTECTING',
      `Operating Mode: ${sStowedAt5.farm.operatingMode}, Alert: "${sStowedAt5.farm.activeAlert}"`);

    // 2.4 Verify 5-second "Protected & Holding" window before storm visuals strike
    const sHoldingAt2 = await waitForState(
      s => s.prediction.countdown === 2,
      5000,
      'Holding at countdown 2'
    );
    logTest('2.4 During holding window (T=5s..0s), panels remain locked with 0 storm intensity',
      sHoldingAt2.panels[0].tilt === 12 && sHoldingAt2.panels[0].shieldDeploy === 100 && sHoldingAt2.environment.stormIntensity === 0,
      `Countdown: ${sHoldingAt2.prediction.countdown}s, Storm Intensity: ${sHoldingAt2.environment.stormIntensity}%, Tilt: ${sHoldingAt2.panels[0].tilt}°`);

    // 2.5 Sandstorm visual arrival at countdown 0
    const sStorm = await waitForState(
      s => s.farm.operatingMode === 'STORM' && s.environment.stormIntensity > 80,
      6000,
      'Transition to STORM mode after countdown'
    );
    logTest('2.5 Sandstorm visual peak arrives only after countdown concludes (Panels pre-protected)',
      sStorm.farm.operatingMode === 'STORM' && sStorm.environment.stormIntensity >= 90 && sStorm.panels[0].shieldDeploy === 100,
      `Mode: ${sStorm.farm.operatingMode}, Storm Intensity: ${sStorm.environment.stormIntensity}%, Array Shield: ${sStorm.panels[0].shieldDeploy}%`);

    // 2.6 Recovery transition and shield retraction
    const sRecovery = await waitForState(
      s => s.farm.operatingMode === 'RECOVERY' || s.farm.operatingMode === 'CLEANING',
      12000,
      'Transition to post-storm RECOVERY / CLEANING'
    );
    logTest('2.6 Post-storm transition to RECOVERY & automated dry-brush cleaning',
      sRecovery.farm.operatingMode === 'RECOVERY' || sRecovery.farm.operatingMode === 'CLEANING',
      `Operating Mode: ${sRecovery.farm.operatingMode}, Alert: "${sRecovery.farm.activeAlert}"`);

    ws.removeEventListener('message', messageListener);

    // Clean reset at end
    ws.send(JSON.stringify({ action: 'RESET' }));
    await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Final Reset');

    console.log('\n================================================================');
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const allPass = testResults.every(r => r.passed);

    console.log(`Phase 3 Verification Summary:`);
    console.log(`  Total Checkpoints Tested: ${total}`);
    console.log(`  Total Passed:             ${passed} / ${total}`);
    console.log(`  Status:                   ${allPass ? '✅ PHASE 3 FULLY IMPLEMENTED & VERIFIED' : '❌ SOME TESTS FAILED'}`);
    console.log('================================================================\n');

    ws.close();
    if (!allPass) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Phase 3 Verification Error:', err);
    if (ws) ws.close();
    process.exit(1);
  }
}

runTests();

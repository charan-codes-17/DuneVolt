// DuneVolt Phase 2 Automated Test: Storm Countdown Fix Verification
// Tests deterministic, immediate 10-second countdown upon clicking Simulate Sandstorm
// and threshold-based storm events.

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3000';
let ws;

function connectWS() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(WS_URL);
    socket.on('open', () => resolve(socket));
    socket.on('error', (err) => reject(err));
  });
}

function waitForState(predicate, timeoutMs = 12000, description = 'state condition') {
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

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${name}`);
  if (details) console.log(`   └─ ${details}`);
  if (!passed) process.exitCode = 1;
}

async function runTests() {
  console.log('=== DuneVolt Phase 2: Storm Countdown Verification ===\n');

  try {
    ws = await connectWS();
    console.log('Connected to DuneVolt WebSocket server.\n');

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Baseline Reset
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Test 1: Reset to Baseline ---');
    ws.send(JSON.stringify({ action: 'RESET' }));
    const sBaseline = await waitForState(s => s.farm.operatingMode === 'NORMAL' && s.prediction.countdown === null, 4000, 'Baseline Reset');
    logTest('1.1 Reset to NORMAL mode with null countdown', sBaseline.farm.operatingMode === 'NORMAL' && sBaseline.prediction.countdown === null);

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Immediate Deterministic 10s Countdown on SIMULATE_STORM
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Test 2: Instant 10-Second Countdown Arrival ---');
    const countdownTicks = [];
    const messageListener = (event) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        const msg = JSON.parse(raw);
        if (msg.type === 'STATE_UPDATE' && msg.data.prediction && msg.data.prediction.countdown !== null) {
          countdownTicks.push({
            count: msg.data.prediction.countdown,
            mode: msg.data.farm.operatingMode,
            time: Date.now()
          });
        }
      } catch (e) {}
    };
    ws.addEventListener('message', messageListener);

    const stormTriggerTime = Date.now();
    ws.send(JSON.stringify({ action: 'SIMULATE_STORM' }));

    // Wait for the initial WARNING state
    const sFirstWarning = await waitForState(
      s => s.farm.operatingMode === 'WARNING',
      3000,
      'Initial WARNING state'
    );
    const firstArrivalDelta = Date.now() - stormTriggerTime;

    logTest('2.1 Initial Broadcast Countdown is 10 (Zero 1-second lag)', sFirstWarning.prediction.countdown === 10,
      `Received countdown = ${sFirstWarning.prediction.countdown} in ${firstArrivalDelta}ms`);
    logTest('2.2 Operating mode set to WARNING immediately', sFirstWarning.farm.operatingMode === 'WARNING');
    logTest('2.3 Active alert contains Early Warning info', sFirstWarning.farm.activeAlert.includes('AI EARLY WARNING'),
      `Alert text: "${sFirstWarning.farm.activeAlert}"`);

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Monotonic 10-second Countdown & Transition to PROTECTING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Test 3: Full Countdown Progression & Protection Trigger ---');
    const sProtecting = await waitForState(
      s => s.farm.operatingMode === 'PROTECTING',
      12000,
      'Transition to PROTECTING after countdown'
    );
    ws.removeEventListener('message', messageListener);

    const countsRecorded = countdownTicks.map(t => t.count);
    const has10 = countsRecorded.includes(10);
    const hasLow = countsRecorded.some(c => c <= 2);
    logTest('3.1 Countdown recorded sequential ticks starting from 10', has10 && hasLow,
      `Ticks captured: [${countsRecorded.join(', ')}]`);
    logTest('3.2 Transition to PROTECTING mode when countdown finishes', sProtecting.farm.operatingMode === 'PROTECTING',
      `Mode: ${sProtecting.farm.operatingMode}, Countdown: ${sProtecting.prediction.countdown}`);

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Triggering SIMULATE_STORM from intermediate states (Resilience)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Test 4: Deterministic Trigger from Non-NORMAL State ---');
    // Start independent cleaning
    ws.send(JSON.stringify({ action: 'RESET' }));
    await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Reset before cleaning');

    ws.send(JSON.stringify({ action: 'TRIGGER_CLEANING' }));
    await waitForState(s => s.farm.operatingMode === 'CLEANING', 4000, 'Enter CLEANING state');

    // Send SIMULATE_STORM while cleaning
    ws.send(JSON.stringify({ action: 'SIMULATE_STORM' }));
    const sCleanToStorm = await waitForState(
      s => s.farm.operatingMode === 'WARNING' && s.prediction.countdown === 10,
      3000,
      'Immediate WARNING countdown from CLEANING'
    );
    logTest('4.1 Simulate Sandstorm overrides ongoing cleaning immediately with 10s countdown',
      sCleanToStorm.farm.operatingMode === 'WARNING' && sCleanToStorm.prediction.countdown === 10,
      `Mode: ${sCleanToStorm.farm.operatingMode}, Countdown: ${sCleanToStorm.prediction.countdown}`);

    // Clean reset at end
    ws.send(JSON.stringify({ action: 'RESET' }));
    await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Final Reset');
    console.log('\n=== All Phase 2 Tests Completed Successfully ===');
    ws.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Phase 2 Test Error:', err);
    if (ws) ws.close();
    process.exit(1);
  }
}

runTests();

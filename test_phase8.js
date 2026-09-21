import { WebSocket } from 'ws';
import http from 'http';

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

// DuneVolt – Phase 8: Risks & Mitigations Verification Suite
// Risk 1: Real-time sync lag | Risk 2: AI authenticity | Risk 3: Scope creep | Risk 4: Venue network

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

async function runPhase8Verification() {
  console.log('================================================================');
  console.log('DuneVolt - Phase 8: Risks & Mitigations Verification Suite');
  console.log('================================================================\n');

  const testResults = [];
  function logTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${details ? '\n         → ' + details : ''}`);
  }

  // --- Risk 1: WebSocket Sync Lag Mitigation ---
  console.log('--- Risk 1: WebSocket Sync Lag Mitigation ---');

  const latRes = await fetchJson('/api/latency-stats');
  logTest('8.1.1 /api/latency-stats endpoint available', latRes.status === 200 && latRes.data.status === 'success',
    `HTTP ${latRes.status}, count=${latRes.data.count}`);

  const ws1 = await connectWebSocket();
  await waitForStateMsg(ws1, () => true, 3000, 'ws1 initial');
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 60 } }));
  await new Promise(r => setTimeout(r, 200));
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 75 } }));
  await new Promise(r => setTimeout(r, 500));

  const latAfter = await fetchJson('/api/latency-stats');
  const tracked = latAfter.data.count > 0 && typeof latAfter.data.minMs === 'number' && typeof latAfter.data.maxMs === 'number';
  logTest('8.1.2 Broadcast latency ring buffer records min/max/avg', tracked,
    `count=${latAfter.data.count}, min=${latAfter.data.minMs}ms, max=${latAfter.data.maxMs}ms, avg=${latAfter.data.avgMs}ms`);

  const stressRes = await fetchJson('/api/sync-stress?count=20');
  const stressOk = stressRes.status === 200 && stressRes.data.broadcastCount === 20 && stressRes.data.underThreshold100ms === true;
  logTest('8.1.3 /api/sync-stress: 20 broadcasts all complete < 100ms',
    stressOk, `maxMs=${stressRes.data.maxMs}ms, avgMs=${stressRes.data.avgMs}ms, underThreshold=${stressRes.data.underThreshold100ms}`);

  const ws2 = await connectWebSocket();
  const ws3 = await connectWebSocket();
  await waitForStateMsg(ws2, () => true, 3000, 'ws2 initial');
  await waitForStateMsg(ws3, () => true, 3000, 'ws3 initial');
  const p1 = waitForStateMsg(ws1, s => s.environment.sunAngle === 42, 5000, 'ws1 sync');
  const p2 = waitForStateMsg(ws2, s => s.environment.sunAngle === 42, 5000, 'ws2 sync');
  const p3 = waitForStateMsg(ws3, s => s.environment.sunAngle === 42, 5000, 'ws3 sync');
  ws1.send(JSON.stringify({ action: 'SET_ENVIRONMENT', payload: { sunAngle: 42 } }));
  const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
  const allSync = r1.environment.sunAngle === 42 && r2.environment.sunAngle === 42 && r3.environment.sunAngle === 42;
  logTest('8.1.4 Multi-client sync: 3 concurrent clients receive identical state',
    allSync, `WS1=${r1.farm.totalPower}MW | WS2=${r2.farm.totalPower}MW | WS3=${r3.farm.totalPower}MW`);
  ws2.close(); ws3.close();

  ws1.close();
  await new Promise(r => setTimeout(r, 300));
  const wsNew = await connectWebSocket();
  const initMsg = await new Promise(resolve => {
    const t = setTimeout(() => resolve(false), 3000);
    wsNew.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'INITIAL_STATE') { clearTimeout(t); resolve(msg.data); }
    });
  });
  logTest('8.1.5 Reconnect: INITIAL_STATE sent immediately on new connection',
    !!initMsg && typeof initMsg === 'object', `received INITIAL_STATE: ${!!initMsg}, mode=${initMsg?.farm?.operatingMode}`);

  const wsMain = wsNew;

  // --- Risk 2: AI Authenticity Transparency (PRD §16) ---
  console.log('\n--- Risk 2: AI Authenticity Transparency (PRD §16) ---');

  const archRes = await fetchJson('/api/architecture');
  const arch = archRes.data;
  const schemaValid = archRes.status === 200 && arch.status === 'success' && arch.protocolVersion === '8.0' &&
    Array.isArray(arch.realPhysicsCalculations) && Array.isArray(arch.ruleBasedAiModules) &&
    arch.prdCompliance.includes('PRD');
  logTest('8.2.1 /api/architecture: PRD §16 compliant schema with correct structure', schemaValid,
    `version=${arch.protocolVersion}, realCalcs=${arch.realPhysicsCalculations?.length}, ruleModules=${arch.ruleBasedAiModules?.length}`);

  const allLabeled = arch.ruleBasedAiModules?.every(m => m.type === 'RULE_BASED' && m.label && m.rules);
  logTest('8.2.2 All rule-based AI modules labeled RULE_BASED with label & rules fields',
    allLabeled, `Modules: ${arch.ruleBasedAiModules?.map(m => m.id).join(', ')}`);

  const required = ['STORM_RISK', 'STORM_COUNTDOWN', 'FAULT_DETECTION', 'SOILING_RISK', 'VISUAL_INSPECTION', 'GENERATION_FORECAST'];
  const missing = required.filter(id => !arch.ruleBasedAiModules?.find(m => m.id === id));
  logTest('8.2.3 All 6 required rule-based modules present in architecture manifest',
    missing.length === 0, missing.length === 0 ? 'All 6 present' : `Missing: ${missing.join(', ')}`);

  const mitigations = arch.phase8RiskMitigations;
  const mitigOk = Array.isArray(mitigations) && mitigations.length === 4 && mitigations.every(m => m.verified === true);
  logTest('8.2.4 All 4 Phase 8 risk mitigations documented & verified in /api/architecture',
    mitigOk, `count=${mitigations?.length}, all verified: ${mitigOk}`);

  // --- Risk 3: Scope Creep & Tier Compliance Audit ---
  console.log('\n--- Risk 3: Scope Creep & Tier Compliance Audit ---');

  const tc = arch.tierCompliance;
  const t1 = tc?.tier1MustHave || [];
  logTest('8.3.1 All Tier 1 Must-Have features implemented (>=8)',
    t1.length >= 8 && t1.every(f => f.implemented), `count=${t1.length}, allImpl=${t1.every(f => f.implemented)}`);

  const t2 = tc?.tier2ShouldHave || [];
  logTest('8.3.2 All Tier 2 Should-Have features implemented (>=6)',
    t2.length >= 6 && t2.every(f => f.implemented), `count=${t2.length}, allImpl=${t2.every(f => f.implemented)}`);

  const t3 = tc?.tier3NiceToHave || [];
  logTest('8.3.3 All Tier 3 Nice-To-Have NOT implemented (scope boundary)',
    t3.length > 0 && t3.every(f => !f.implemented), `count=${t3.length}, allNOTImpl=${t3.every(f => !f.implemented)}`);

  // --- Risk 4: Venue Network & Reset Resilience ---
  console.log('\n--- Risk 4: Venue Network & Reset Resilience ---');

  wsMain.send(JSON.stringify({ action: 'SIMULATE_STORM' }));
  await waitForStateMsg(wsMain, s => s.farm.operatingMode === 'WARNING', 5000, 'WARNING mode');
  const t0 = Date.now();
  wsMain.send(JSON.stringify({ action: 'RESET' }));
  const resetState = await waitForStateMsg(wsMain, s => s.farm.operatingMode === 'NORMAL', 3000, 'NORMAL after reset');
  const dur = Date.now() - t0;
  logTest('8.4.1 WebSocket RESET: normalizes from storm to NORMAL in < 2000ms',
    resetState.farm.operatingMode === 'NORMAL' && dur < 2000, `resetTime=${dur}ms, mode=${resetState.farm.operatingMode}`);

  const restReset = await fetchJson('/api/reset', { method: 'POST' });
  const restOk = restReset.status === 200 && restReset.data.status === 'success' &&
    typeof restReset.data.resetDurationMs === 'number' && restReset.data.resetDurationMs < 500;
  logTest('8.4.2 REST /api/reset responds in <500ms, includes resetDurationMs',
    restOk, `HTTP ${restReset.status}, resetDurationMs=${restReset.data.resetDurationMs}ms`);

  for (let i = 0; i < 5; i++) {
    wsMain.send(JSON.stringify({ action: 'RESET' }));
    await new Promise(r => setTimeout(r, 80));
  }
  await new Promise(r => setTimeout(r, 600));
  const finalState = await fetchJson('/api/state');
  const fs = finalState.data.state;
  const idempOk = fs.farm.operatingMode === 'NORMAL' && fs.environment.dustLevel === 15 && fs.panels.every(p => p.faultStatus === 'NONE');
  logTest('8.4.3 Idempotent Reset: 5 rapid RESETs always leave clean baseline',
    idempOk, `mode=${fs.farm.operatingMode}, dust=${fs.environment.dustLevel}, noFaults=${fs.panels.every(p => p.faultStatus === 'NONE')}`);

  const healthRes = await fetchJson('/api/health');
  const healthOk = healthRes.status === 200 && healthRes.data.operatingMode === 'NORMAL' && healthRes.data.activeTimers === 0;
  logTest('8.4.4 /api/health: 0 active timers, NORMAL mode confirmed after reset',
    healthOk, `mode=${healthRes.data.operatingMode}, activeTimers=${healthRes.data.activeTimers}, clients=${healthRes.data.connectedClients}`);

  wsMain.close();

  // --- Summary ---
  console.log('\n================================================================');
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const allPass = testResults.every(r => r.passed);

  const r1t = testResults.filter(r => r.name.startsWith('8.1'));
  const r2t = testResults.filter(r => r.name.startsWith('8.2'));
  const r3t = testResults.filter(r => r.name.startsWith('8.3'));
  const r4t = testResults.filter(r => r.name.startsWith('8.4'));

  console.log(`\nPhase 8 Results by Risk Category:`);
  console.log(`  Risk 1 (Sync Lag):        ${r1t.filter(r=>r.passed).length}/${r1t.length} passed`);
  console.log(`  Risk 2 (AI Authenticity): ${r2t.filter(r=>r.passed).length}/${r2t.length} passed`);
  console.log(`  Risk 3 (Scope Creep):     ${r3t.filter(r=>r.passed).length}/${r3t.length} passed`);
  console.log(`  Risk 4 (Venue Network):   ${r4t.filter(r=>r.passed).length}/${r4t.length} passed`);
  console.log(`\nOverall: ${passed} / ${total} Tests Passed`);
  console.log(`Status:  ${allPass ? '✅ PHASE 8 COMPLETE' : '❌ SOME TESTS FAILED'}`);
  console.log('================================================================');
  if (!allPass) process.exit(1);
}

runPhase8Verification().catch(err => {
  console.error('Fatal Phase 8 Error:', err.message);
  process.exit(1);
});

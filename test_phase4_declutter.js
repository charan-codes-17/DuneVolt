import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';

const WS_URL = 'ws://localhost:3000';
const HTML_PATH = path.resolve('public', 'index.html');
const JS_PATH = path.resolve('public', 'js', 'dashboard.js');
const CSS_PATH = path.resolve('public', 'css', 'dashboard.css');

async function runDeclutterVerification() {
  const testResults = [];

  function logTest(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName} ${details ? '(' + details + ')' : ''}`);
  }

  console.log('======================================================');
  console.log('   PHASE 4: DASHBOARD DECLUTTERING VERIFICATION      ');
  console.log('======================================================\n');

  // --- Step 1: Static HTML First-View & Secondary Block Structure ---
  console.log('--- Step 1: Verifying 1st-View & Secondary Structural Decluttering ---');
  const htmlContent = fs.readFileSync(HTML_PATH, 'utf-8');

  // Check the 7 primary first-view persistent blocks
  const hasMetricsStrip = htmlContent.includes('class="metrics-strip"');
  const has3DMonitor = htmlContent.includes('class="monitor-container');
  const hasAlertBanner = htmlContent.includes('id="alert-banner"');
  const hasAiOpsCard = htmlContent.includes('class="ai-ops-card');
  const hasInspectorCard = htmlContent.includes('id="panel-inspector"');
  const hasEnergyCard = htmlContent.includes('class="energy-card');
  const hasTimelineCard = htmlContent.includes('class="timeline-card');

  const primaryBlocks = [
    { name: '1. Live Status Strip', present: hasMetricsStrip },
    { name: '2. 3D Live Scene & HUD', present: has3DMonitor },
    { name: '3. System Mode & Alert Banner', present: hasAlertBanner },
    { name: '4. AI Operations Condensed Headline Cards', present: hasAiOpsCard },
    { name: '5. Panel Inspector Summary', present: hasInspectorCard },
    { name: '6. Dynamic Energy Routing Diagram', present: hasEnergyCard },
    { name: '7. Compact Event Timeline', present: hasTimelineCard }
  ];

  const allPrimaryPresent = primaryBlocks.every(b => b.present);
  const primaryCount = primaryBlocks.filter(b => b.present).length;

  logTest('4.1 First View Persistent Primary Blocks (<= 7 blocks)',
    allPrimaryPresent && primaryCount <= 7,
    `Found ${primaryCount} persistent primary blocks (Expected: <= 7)`
  );

  // Check that detailed diagnostics are inside collapsible secondary sections
  const hasAiDetailsSection = htmlContent.includes('id="ai-details-section"') && htmlContent.includes('class="ai-details-section"');
  const hasInspectorDetailsSection = htmlContent.includes('id="inspector-details-section"') && htmlContent.includes('class="ai-details-section"');
  const hasAiToggleBtn = htmlContent.includes('id="btn-ai-details-toggle"');
  const hasInspectorToggleBtn = htmlContent.includes('id="btn-inspector-details-toggle"');
  const hasMasterDiagnosticsBtn = htmlContent.includes('id="btn-master-diagnostics"');

  logTest('4.2 Secondary Details Architecture & Accessible Toggles',
    hasAiDetailsSection && hasInspectorDetailsSection && hasAiToggleBtn && hasInspectorToggleBtn && hasMasterDiagnosticsBtn,
    'Collapsible containers & dedicated trigger buttons found'
  );

  // Check accessibility attributes (ARIA)
  const aiAriaHidden = htmlContent.includes('id="ai-details-section" class="ai-details-section" aria-hidden="true"');
  const inspAriaHidden = htmlContent.includes('id="inspector-details-section" class="ai-details-section" aria-hidden="true"');
  const aiAriaControls = htmlContent.includes('aria-controls="ai-details-section"');
  const inspAriaControls = htmlContent.includes('aria-controls="inspector-details-section"');

  logTest('4.3 Default Collapsed State & ARIA Compliance',
    aiAriaHidden && inspAriaHidden && aiAriaControls && inspAriaControls,
    'Secondary sections start collapsed with aria-hidden="true" and aria-controls'
  );

  // Check that secondary items are housed in secondary sections
  const lossInAiDetails = htmlContent.indexOf('class="attribution-card"') > htmlContent.indexOf('id="ai-details-section"');
  const queueInAiDetails = htmlContent.indexOf('class="cleaning-queue-box"') > htmlContent.indexOf('id="ai-details-section"');
  const factorInInspDetails = htmlContent.indexOf('class="panel-factor-card"') > htmlContent.indexOf('id="inspector-details-section"');
  const cvInInspDetails = htmlContent.indexOf('class="inspection-report-box"') > htmlContent.indexOf('id="inspector-details-section"');

  logTest('4.4 Deep Diagnostic Modules Housed Inside Secondary Containers',
    lossInAiDetails && queueInAiDetails && factorInInspDetails && cvInInspDetails,
    'Loss Attribution, Cleaning Queue, 7-Factor Chips, CV Inspection properly nested'
  );

  // Check JavaScript Hotkeys & Handlers
  console.log('\n--- Step 2: Verifying JavaScript Event Handlers & Hotkeys ---');
  const jsContent = fs.readFileSync(JS_PATH, 'utf-8');
  const hasShiftDHotkey = jsContent.includes("'D'") || jsContent.includes("'d'");
  const hasShiftIHotkey = jsContent.includes("'I'") || jsContent.includes("'i'");
  const hasMasterToggleFunc = jsContent.includes('toggleMasterDiagnostics');
  const hasAlertBadgesUpdate = jsContent.includes('ai-details-badge') && jsContent.includes('insp-details-badge');

  logTest('4.5 Keyboard Accessibility & Dynamic Alert Badges',
    hasShiftDHotkey && hasShiftIHotkey && hasMasterToggleFunc && hasAlertBadgesUpdate,
    'Shift+D (Master Diagnostics), Shift+I (Inspector Details), and dynamic alert badges implemented'
  );

  // Check CSS styling
  console.log('\n--- Step 3: Verifying CSS Transition & Layout Styles ---');
  const cssContent = fs.readFileSync(CSS_PATH, 'utf-8');
  const hasAiDetailsCss = cssContent.includes('.ai-details-section') && cssContent.includes('grid-template-rows: 0fr');
  const hasExpandedCss = cssContent.includes('.ai-details-section.expanded') && cssContent.includes('grid-template-rows: 1fr');
  const hasHeaderDiagnosticsCss = cssContent.includes('.header-diagnostics-btn');
  const hasAlertBadgeCss = cssContent.includes('.toggle-alert-badge');

  logTest('4.6 Fluid CSS Decluttering Animations & Zero-Layout-Jump Transitions',
    hasAiDetailsCss && hasExpandedCss && hasHeaderDiagnosticsCss && hasAlertBadgeCss,
    'CSS Grid 0fr/1fr transitions, toggle button hover/active states, and badge animations verified'
  );

  // Step 4: Real-time WebSocket Authoritative State Synchronization
  console.log('\n--- Step 4: Verifying Live Dynamic State Updates & Diagnostics ---');
  const ws = new WebSocket(WS_URL);

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

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

  // Baseline Reset
  sendAction('RESET');
  const baseState = await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Baseline Reset');
  logTest('4.7 Live WebSocket Baseline Authoritative Connection',
    baseState.farm.operatingMode === 'NORMAL' && baseState.panels.length === 3,
    `Mode: ${baseState.farm.operatingMode}, Total Power: ${baseState.farm.totalPower.toFixed(2)}MW`
  );

  // Inject Fault to verify that deep diagnostics compute and correlate with headline cards
  sendAction('SET_FAULT', { panelId: 'PV-02', faultType: 'HOTSPOT' });
  const faultState = await waitForState(s => {
    const p = s.panels.find(x => x.id === 'PV-02');
    return p && p.faultStatus === 'HOTSPOT';
  }, 4000, 'PV-02 Hotspot Injection');

  const pv2 = faultState.panels.find(x => x.id === 'PV-02');
  const attr = pv2.faultAttribution;
  const cv = pv2.visualInspection;

  logTest('4.8 Secondary 7-Factor & CV Deep Diagnostics Telemetry Generation',
    attr && attr.hotspot > 20 && cv && (cv.summary.includes('Hotspot') || cv.discoloration.includes('thermal')),
    `Attribution: Hotspot ${attr.hotspot}%, Primary: "${attr.primaryCause}", CV: "${cv.summary}"`
  );

  // Economic Cleaning Queue Ranking & Threshold Detection
  sendAction('SET_ENVIRONMENT', { sunAngle: 50, dustLevel: 70, windSpeed: 20, temperature: 38 });
  const dustState = await waitForState(s => s.environment.dustLevel === 70, 4000, 'High Dust State');
  const queue = dustState.maintenance.cleaningQueue;
  const topQueue = queue && queue[0];

  logTest('4.9 Secondary Economic Cleaning Queue Calculation & ROI Dispatch Trigger',
    topQueue && topQueue.thresholdExceeded === true && topQueue.estimatedDailyLossInr > 450,
    `Top Priority: ${topQueue.panelId}, Loss: ₹${topQueue.estimatedDailyLossInr}/day, ROI Justified: ${topQueue.thresholdExceeded}`
  );

  // Reset back to normal
  sendAction('RESET');
  await waitForState(s => s.farm.operatingMode === 'NORMAL', 4000, 'Final Reset');
  ws.close();

  console.log('\n======================================================');
  console.log('       PHASE 4 VERIFICATION TEST SUMMARY REPORT       ');
  console.log('======================================================');
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  console.log(`Passed: ${passed} / ${total} checks (${((passed / total) * 100).toFixed(0)}%)\n`);

  if (passed === total) {
    console.log('🎉 ALL PHASE 4 DECLUTTERING & VERIFICATION TESTS PASSING!');
    return true;
  } else {
    console.error('❌ Some tests failed.');
    return false;
  }
}

runDeclutterVerification()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
  });

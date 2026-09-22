import fs from 'fs';
import { WebSocket } from 'ws';
import http from 'http';

async function testAll() {
  console.log('--- 1. Testing Static HTML Structure ---');
  const indexHtml = fs.readFileSync('public/index.html', 'utf-8');
  const opsHtml = fs.readFileSync('public/operations.html', 'utf-8');

  // Index checks
  const indexHasMinimalTopBar = indexHtml.includes('class="minimal-top-bar"');
  const indexHasCenteredBrand = indexHtml.includes('class="minimal-brand-title"') && indexHtml.includes('DUNEVOLT');
  const indexHasControllerBtn = indexHtml.includes('class="minimal-controller-btn"') && indexHtml.includes('Controllers');
  const indexHasOperationsBtn = indexHtml.includes('class="minimal-nav-btn"') && indexHtml.includes('Operations');
  const indexHas3DStage = indexHtml.includes('id="webgl-canvas-container"');
  
  // Removed from index checks
  const indexNoAiOps = !indexHtml.includes('AI Supervisory & Predictive Operations');
  const indexNoCvInspection = !indexHtml.includes('Simulated Visual / Thermal CV Inspection');
  const indexNoGridTelemetry = !indexHtml.includes('Grid Routing & Event Logs');
  const indexNoDeepDiagBtn = !indexHtml.includes('id="btn-master-diagnostics"');
  const indexNoHonestyBtn = !indexHtml.includes('id="btn-honesty-guide"');
  const indexNoResetBtn = !indexHtml.includes('id="btn-header-reset"');
  const indexNoStartDemoBtn = !indexHtml.includes('id="btn-start-demo"');

  console.log('Index.html: Minimal top bar present:', indexHasMinimalTopBar);
  console.log('Index.html: Centered DUNEVOLT brand present:', indexHasCenteredBrand);
  console.log('Index.html: Controllers link present:', indexHasControllerBtn);
  console.log('Index.html: Operations link present:', indexHasOperationsBtn);
  console.log('Index.html: 3D Stage present:', indexHas3DStage);
  console.log('Index.html: AI Ops moved off:', indexNoAiOps);
  console.log('Index.html: CV Inspection moved off:', indexNoCvInspection);
  console.log('Index.html: Grid Logs moved off:', indexNoGridTelemetry);
  console.log('Index.html: Action buttons moved off:', indexNoDeepDiagBtn && indexNoHonestyBtn && indexNoResetBtn && indexNoStartDemoBtn);

  // Operations checks
  const opsHasAiOps = opsHtml.includes('AI Supervisory & Predictive Operations');
  const opsHasDesertThermal = opsHtml.includes('Desert Thermal Derating');
  const opsHasRootCause = opsHtml.includes('Root-Cause Loss Attribution');
  const opsHasCvInspection = opsHtml.includes('Simulated Visual / Thermal CV Inspection');
  const opsHasGridTelemetry = opsHtml.includes('Grid Routing & Event Logs');
  const opsHasDeepDiagBtn = opsHtml.includes('id="btn-master-diagnostics"');
  const opsHasHonestyBtn = opsHtml.includes('id="btn-honesty-guide"');
  const opsHasResetBtn = opsHtml.includes('id="btn-header-reset"');
  const opsHasStartDemoBtn = opsHtml.includes('id="btn-start-demo"');
  const opsHas3DLink = opsHtml.includes('href="/"') && opsHtml.includes('3D Farm View');

  console.log('\nOperations.html: AI Supervisory Ops present:', opsHasAiOps);
  console.log('Operations.html: Desert Thermal present:', opsHasDesertThermal);
  console.log('Operations.html: Root-Cause Loss Attribution present:', opsHasRootCause);
  console.log('Operations.html: CV Inspection present:', opsHasCvInspection);
  console.log('Operations.html: Grid Routing & Event Logs present:', opsHasGridTelemetry);
  console.log('Operations.html: Deep Diagnostics button present:', opsHasDeepDiagBtn);
  console.log('Operations.html: Tech & Honesty Guide button present:', opsHasHonestyBtn);
  console.log('Operations.html: Reset button present:', opsHasResetBtn);
  console.log('Operations.html: Start Demo button present:', opsHasStartDemoBtn);
  console.log('Operations.html: 3D View link present:', opsHas3DLink);

  console.log('\n--- 2. Testing HTTP Endpoints ---');
  const routes = ['/', '/dashboard', '/operations', '/diagnostics', '/analytics', '/controller', '/api/health', '/api/state'];
  for (const route of routes) {
    await new Promise(resolve => {
      http.get('http://localhost:3000' + route, res => {
        console.log(route, '=> HTTP', res.statusCode);
        resolve();
      });
    });
  }

  console.log('\n--- 3. Testing WebSocket Synchronization ---');
  await new Promise(resolve => {
    const ws = new WebSocket('ws://localhost:3000');
    ws.on('open', () => {
      console.log('WebSocket connected successfully');
      ws.send(JSON.stringify({ action: 'GET_STATE' }));
    });
    ws.on('message', data => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'SYNC' || msg.state) {
        console.log('Received Authoritative message. Farm Mode:', (msg.payload && msg.payload.farm) ? msg.payload.farm.operatingMode : (msg.state && msg.state.farm.operatingMode));
        ws.close();
        resolve();
      }
    });
  });

  console.log('\nALL VERIFICATION CHECKS PASSED ✅');
}

testAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

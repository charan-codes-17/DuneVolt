// DuneVolt Judge Dashboard Controller
import { farmStateManager } from './state.js';
import { SolarFarmScene } from './scene3d.js';

let scene = null;
let currentSelectedPanelId = 'PV-02';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Canvas
  const canvasContainer = document.getElementById('webgl-canvas-container');
  scene = new SolarFarmScene(canvasContainer, (panelId) => {
    currentSelectedPanelId = panelId;
    if (farmStateManager.state) {
      updatePanelInspector(farmStateManager.state);
    }
  });

  // 2. Camera Preset Listeners
  const camBtns = document.querySelectorAll('.cam-btn');
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-cam');
      scene.setCameraPreset(preset);
    });
  });

  // 2b. Panel Selector Tabs Listeners
  const panelTabs = document.querySelectorAll('.panel-tab');
  panelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const panelId = tab.getAttribute('data-panel-id');
      if (panelId) {
        currentSelectedPanelId = panelId;
        if (scene) {
          scene.selectPanel(panelId);
        }
        if (farmStateManager.state) {
          updatePanelInspector(farmStateManager.state);
        }
      }
    });
  });

  // 3. Live Clock (IST & UTC)
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // 4. WebSocket Connection Status & Latency Indicator
  farmStateManager.onConnectionChange((isConnected) => {
    const syncBadge = document.getElementById('sync-badge');
    const syncText = document.getElementById('sync-status-text');
    const syncDot = document.getElementById('sync-dot-indicator');
    if (isConnected) {
      syncBadge.className = 'badge cyan';
      syncText.innerText = 'SYNCED';
      if (syncDot) syncDot.className = 'status-dot info';
    } else {
      syncBadge.className = 'badge rose';
      syncText.innerText = 'RECONNECTING';
      if (syncDot) syncDot.className = 'status-dot critical';
    }
  });

  farmStateManager.onLatencyChange((rtt) => {
    const latencyEl = document.getElementById('sync-latency-text');
    const syncBadge = document.getElementById('sync-badge');
    if (latencyEl) {
      latencyEl.innerText = `${rtt}ms`;
    }
    if (syncBadge && farmStateManager.isConnected) {
      if (rtt < 25) {
        syncBadge.className = 'badge emerald';
      } else if (rtt < 90) {
        syncBadge.className = 'badge cyan';
      } else {
        syncBadge.className = 'badge amber';
      }
    }
  });

  // 4b. Phase 6: 3D Scene FPS Tracking & Quality Mode Toggle
  if (scene) {
    const fpsValEl = document.getElementById('hud-fps-val');
    scene.setFpsCallback((fps, qualityMode) => {
      if (fpsValEl) {
        fpsValEl.innerText = fps;
        fpsValEl.style.color = fps >= 45 ? '#10b981' : (fps >= 25 ? '#f59e0b' : '#ef4444');
      }
    });

    const btnToggleQuality = document.getElementById('btn-toggle-quality');
    if (btnToggleQuality) {
      btnToggleQuality.addEventListener('click', () => {
        const nextMode = scene.qualityMode === 'HIGH' ? 'SAVER' : 'HIGH';
        scene.setQualityMode(nextMode);
        btnToggleQuality.innerText = nextMode === 'HIGH' ? 'HQ' : 'SAVER';
        btnToggleQuality.classList.toggle('active-saver', nextMode === 'SAVER');
      });
    }
  }

  // 5. Subscribe to Authoritative Shared State
  farmStateManager.subscribe((state) => {
    if (!state) return;
    updateDashboardUI(state);
    if (scene) {
      scene.updateFromState(state);
    }
  });

  // 6. Phase 5 & 6: Demo Mode & Instant Reset Wiring
  const btnStartDemo = document.getElementById('btn-start-demo');
  const btnStopDemo = document.getElementById('btn-stop-demo');
  const btnHeaderReset = document.getElementById('btn-header-reset');

  if (btnStartDemo) {
    btnStartDemo.addEventListener('click', () => {
      if (btnStartDemo.classList.contains('demo-running')) return;
      farmStateManager.startDemo();
      btnStartDemo.classList.add('demo-running');
      btnStartDemo.querySelector('span:last-child').innerText = 'Demo Running…';
    });
  }

  if (btnStopDemo) {
    btnStopDemo.addEventListener('click', () => {
      farmStateManager.stopDemo();
    });
  }

  if (btnHeaderReset) {
    btnHeaderReset.addEventListener('click', () => {
      farmStateManager.reset();
      flashHeaderReset();
    });
  }

  // Hotkey: Shift + R for Instant System Reset (PRD §10.10)
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      e.preventDefault();
      farmStateManager.reset();
      flashHeaderReset();
    }
  });

  function flashHeaderReset() {
    if (btnHeaderReset) {
      btnHeaderReset.style.transform = 'scale(0.92)';
      btnHeaderReset.style.borderColor = '#10b981';
      setTimeout(() => {
        btnHeaderReset.style.transform = '';
        btnHeaderReset.style.borderColor = '';
      }, 250);
    }
  }

  // 7. Phase 6: Architecture & Honesty Guide Modal Wiring
  const honestyModal = document.getElementById('modal-honesty');
  const btnOpenHonestyHeader = document.getElementById('btn-honesty-guide');
  const btnOpenHonestyFooter = document.getElementById('btn-open-honesty-footer');
  const btnCloseHonesty = document.getElementById('btn-close-honesty-modal');
  const btnAckHonesty = document.getElementById('btn-ack-honesty');

  function openHonestyModal() {
    if (honestyModal) {
      honestyModal.classList.add('visible');
      honestyModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeHonestyModal() {
    if (honestyModal) {
      honestyModal.classList.remove('visible');
      honestyModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (btnOpenHonestyHeader) btnOpenHonestyHeader.addEventListener('click', openHonestyModal);
  if (btnOpenHonestyFooter) btnOpenHonestyFooter.addEventListener('click', openHonestyModal);
  if (btnCloseHonesty) btnCloseHonesty.addEventListener('click', closeHonestyModal);
  if (btnAckHonesty) btnAckHonesty.addEventListener('click', closeHonestyModal);

  if (honestyModal) {
    honestyModal.addEventListener('click', (e) => {
      if (e.target === honestyModal) closeHonestyModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && honestyModal && honestyModal.classList.contains('visible')) {
      closeHonestyModal();
    }
  });

  farmStateManager.onDemoStep((demoData) => {
    updateDemoOverlay(demoData);
  });
});

function updateLiveClock() {
  const clockEl = document.getElementById('live-clock');
  const now = new Date();
  clockEl.innerText = now.toLocaleTimeString('en-GB') + ' IST';
}

function updateDashboardUI(state) {
  const { environment, farm, panels, prediction, maintenance, energy, events } = state;

  // 1. System Status Pill
  const statusPill = document.getElementById('system-status-pill');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('system-status-text');

  statusPill.className = 'system-status-pill';
  statusDot.className = 'status-dot pulsing';

  switch (farm.operatingMode) {
    case 'WARNING':
      statusPill.classList.add('warning');
      statusDot.classList.add('warning');
      statusText.innerText = 'AI EARLY STORM WARNING';
      break;
    case 'PROTECTING':
      statusPill.classList.add('protecting');
      statusDot.classList.add('info');
      statusText.innerText = 'AUTONOMOUS ARRAY STOW';
      break;
    case 'STORM':
      statusPill.classList.add('critical');
      statusDot.classList.add('critical');
      statusText.innerText = 'SEVERE SANDSTORM ACTIVE';
      break;
    case 'RECOVERY':
      statusPill.classList.add('protecting');
      statusDot.classList.add('info');
      statusText.innerText = 'POST-STORM INSPECTION';
      break;
    case 'CLEANING':
      statusPill.classList.add('warning');
      statusDot.classList.add('warning');
      statusText.innerText = 'WATERLESS DRY-BRUSH CLEANING';
      break;
    case 'RESUMING':
      statusPill.classList.add('protecting');
      statusDot.classList.add('info');
      statusText.innerText = 'RE-ESTABLISHING SUN TRACK';
      break;
    default:
      statusText.innerText = 'SYSTEM NORMAL • AUTONOMOUS';
      break;
  }

  // 2. Alert / Countdown Banner
  const alertBanner = document.getElementById('alert-banner');
  const alertTitle = document.getElementById('alert-title');
  const alertDesc = document.getElementById('alert-desc');
  const countdownBox = document.getElementById('countdown-box');
  const countdownTimer = document.getElementById('countdown-timer');

  if (farm.activeAlert) {
    alertBanner.classList.add('visible');
    alertDesc.innerText = farm.activeAlert;

    if (prediction.countdown !== null) {
      countdownBox.style.display = 'flex';
      countdownTimer.innerText = prediction.countdown;
      alertTitle.innerText = 'AI EARLY STORM WARNING — COUNTDOWN';
    } else {
      countdownBox.style.display = 'none';
      alertTitle.innerText = farm.operatingMode === 'STORM' ? 'SEVERE SANDSTORM IN PROGRESS' : 'AUTONOMOUS DEFENSE ACTIVE';
    }
  } else {
    alertBanner.classList.remove('visible');
  }

  // 3. Telemetry Metrics Strip
  document.getElementById('val-power').innerText = farm.totalPower.toFixed(2);
  document.getElementById('val-efficiency').innerText = farm.efficiency.toFixed(1);
  document.getElementById('val-health').innerText = farm.health.toFixed(1);
  document.getElementById('val-dust').innerText = environment.dustLevel;
  document.getElementById('val-temperature').innerText = environment.temperature;
  document.getElementById('val-wind').innerText = environment.windSpeed;

  const tempLoss = Math.max(0, environment.temperature - 25) * 0.4;
  document.getElementById('val-temp-derating').innerText = `Temp Loss: -${tempLoss.toFixed(1)}%`;
  const dustLoss = (environment.dustLevel / 100) * 38;
  document.getElementById('val-dust-loss').innerText = `Soiling Derate: -${dustLoss.toFixed(1)}%`;

  // 4. HUD Chips on 3D Monitor
  document.getElementById('hud-sun-angle').innerText = `${environment.sunAngle}°`;
  const primaryPanel = panels[1] || panels[0];
  document.getElementById('hud-panel-tilt').innerText = `${primaryPanel.tilt}°`;
  document.getElementById('hud-farm-mode').innerText = farm.operatingMode;

  const cleaningChip = document.getElementById('hud-cleaning-chip');
  if (maintenance.cleaningRobotActive) {
    cleaningChip.style.display = 'flex';
    document.getElementById('hud-cleaning-pct').innerText = maintenance.cleaningProgress;
  } else {
    cleaningChip.style.display = 'none';
  }

  // 5. AI Operations Section
  document.getElementById('ai-storm-risk').innerText = `${prediction.stormRisk}%`;
  const stormBar = document.getElementById('storm-risk-bar');
  stormBar.style.width = `${prediction.stormRisk}%`;
  if (prediction.stormRisk > 70) {
    stormBar.style.backgroundColor = '#ef4444';
    document.getElementById('ai-storm-risk').style.color = '#f87171';
  } else if (prediction.stormRisk > 35) {
    stormBar.style.backgroundColor = '#f59e0b';
    document.getElementById('ai-storm-risk').style.color = '#fbbf24';
  } else {
    stormBar.style.backgroundColor = '#10b981';
    document.getElementById('ai-storm-risk').style.color = '#10b981';
  }

  const soilingEl = document.getElementById('ai-soiling-risk');
  soilingEl.innerText = prediction.soilingRisk;
  soilingEl.style.color = prediction.soilingRisk === 'CRITICAL' ? '#f87171' : prediction.soilingRisk === 'HIGH' ? '#fbbf24' : '#10b981';

  // Heat Derating Risk (Phase 2)
  const heatRiskEl = document.getElementById('ai-heat-risk');
  if (heatRiskEl && prediction.heatLossRisk) {
    heatRiskEl.innerText = prediction.heatLossRisk;
    heatRiskEl.style.color = prediction.heatLossRisk.includes('CRITICAL') ? '#f87171'
      : prediction.heatLossRisk.includes('HIGH') ? '#fbbf24' : '#10b981';
  }
  const heatDerateSub = document.getElementById('ai-heat-derate');
  if (heatDerateSub) {
    const cellEst = environment.temperature + 6;
    heatDerateSub.innerText = `Cell Est: ~${cellEst}°C (-0.4%/°C derate)`;
  }

  const faultEl = document.getElementById('ai-fault-risk');
  faultEl.innerText = prediction.faultRisk;
  faultEl.style.color = prediction.faultRisk.includes('HIGH') ? '#f87171' : '#10b981';

  document.getElementById('ai-cleaning-priority').innerText = maintenance.priority;
  document.getElementById('ai-revenue-loss').innerText = `Est. Loss: ₹${maintenance.estimatedDailyLossInr.toLocaleString()} / Cost: ₹${maintenance.cleaningThresholdInr.toLocaleString()}`;

  // 6. Loss Attribution Breakdown
  updateLossAttribution(state);

  // 7. Prioritized Economic Cleaning Queue (Phase 2)
  updateCleaningQueue(maintenance.cleaningQueue);

  // 8. Selected Panel Inspector
  updatePanelInspector(state);

  // 9. Energy Flow Diagram
  updateEnergyFlow(energy);

  // 10. Chronological Event Timeline
  updateEventTimeline(events);
}

function updateCleaningQueue(queue) {
  const container = document.getElementById('cleaning-queue-table');
  if (!container || !queue) return;

  container.innerHTML = queue.map(item => `
    <div class="queue-row ${item.priority.toLowerCase()}">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="queue-panel-id">${item.panelId}</span>
        <span style="color: var(--text-muted);">${item.name}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="queue-loss">₹${item.estimatedDailyLossInr.toLocaleString()}/day</span>
        <span class="badge ${item.thresholdExceeded ? 'rose' : 'cyan'}" style="font-size: 9px;">
          ${item.thresholdExceeded ? 'ROI JUSTIFIED' : 'SUB-THRESHOLD'}
        </span>
      </div>
    </div>
  `).join('');
}

function updateLossAttribution(state) {
  const { environment, farm, panels } = state;
  const isStowed = farm.operatingMode === 'PROTECTING' || farm.operatingMode === 'STORM';

  const expectedTotal = panels.reduce((acc, p) => acc + p.expectedOutput, 0);
  const actualTotal = farm.totalPower;

  document.getElementById('attr-expected').innerText = `${expectedTotal.toFixed(2)} MW`;
  document.getElementById('attr-actual').innerText = `${actualTotal.toFixed(2)} MW`;

  const hasFault = panels.some(p => p.faultStatus !== 'NONE');
  const legendFault = document.getElementById('legend-anomaly-item');

  let pctDust = Math.round((environment.dustLevel / 100) * 35);
  let pctTemp = Math.round(Math.max(0, environment.temperature - 25) * 0.35);
  let pctAnomaly = hasFault ? 25 : 0;
  let pctNominal = Math.max(10, 100 - pctDust - pctTemp - pctAnomaly);

  if (isStowed) {
    pctNominal = 8;
    pctDust = 20;
    pctTemp = 5;
    pctAnomaly = 67; // Defensive stow reduction
  }

  document.getElementById('bar-nominal').style.width = `${pctNominal}%`;
  document.getElementById('bar-dust').style.width = `${pctDust}%`;
  document.getElementById('bar-temp').style.width = `${pctTemp}%`;
  document.getElementById('bar-anomaly').style.width = `${pctAnomaly}%`;

  document.getElementById('pct-nominal').innerText = pctNominal;
  document.getElementById('pct-dust').innerText = pctDust;
  document.getElementById('pct-temp').innerText = pctTemp;
  document.getElementById('pct-anomaly').innerText = pctAnomaly;

  if (hasFault) {
    legendFault.style.display = 'flex';
  } else {
    legendFault.style.display = 'none';
  }
}

function updatePanelInspector(state) {
  const panel = state.panels.find(p => p.id === currentSelectedPanelId) || state.panels[0];
  if (!panel) return;

  // Update panel selector tabs active state
  const panelTabs = document.querySelectorAll('.panel-tab');
  panelTabs.forEach(tab => {
    if (tab.getAttribute('data-panel-id') === panel.id) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  const inspIdEl = document.getElementById('insp-id');
  if (inspIdEl) inspIdEl.innerText = panel.id;
  const inspNameEl = document.getElementById('insp-name');
  if (inspNameEl) inspNameEl.innerText = panel.name;

  const healthBadge = document.getElementById('insp-health');
  if (panel.faultStatus && panel.faultStatus !== 'NONE') {
    healthBadge.className = 'badge rose';
    healthBadge.innerText = `ANOMALY: ${panel.faultStatus}`;
  } else if (panel.state === 'PROTECTED') {
    healthBadge.className = 'badge amber';
    healthBadge.innerText = 'DEFENSIVE STOW';
  } else {
    healthBadge.className = 'badge emerald';
    healthBadge.innerText = 'OPTIMAL HEALTH';
  }

  document.getElementById('insp-output').innerText = panel.output.toFixed(2);
  document.getElementById('insp-expected').innerText = panel.expectedOutput.toFixed(2);
  document.getElementById('insp-dust').innerText = `${panel.dust}%`;
  document.getElementById('insp-temp').innerText = `${panel.temperature}°C`;
  document.getElementById('insp-last-cleaned').innerText = panel.lastCleaned;
  document.getElementById('insp-next-cleaned').innerText = panel.nextCleaning;

  // 7-Factor Loss Attribution (Phase 2)
  if (panel.faultAttribution) {
    const fa = panel.faultAttribution;
    const dustEl = document.getElementById('chip-dust');
    const heatEl = document.getElementById('chip-heat');
    const hotspotEl = document.getElementById('chip-hotspot');
    const wiringEl = document.getElementById('chip-wiring');
    const crackEl = document.getElementById('chip-crack');
    const shadingEl = document.getElementById('chip-shading');
    const degradeEl = document.getElementById('chip-degradation');
    const causeBadge = document.getElementById('insp-primary-cause');

    if (dustEl) dustEl.innerText = `${fa.dust}%`;
    if (heatEl) heatEl.innerText = `${fa.heat}%`;
    if (hotspotEl) hotspotEl.innerText = `${fa.hotspot}%`;
    if (wiringEl) wiringEl.innerText = `${fa.wiring}%`;
    if (crackEl) crackEl.innerText = `${fa.crack}%`;
    if (shadingEl) shadingEl.innerText = `${fa.shading}%`;
    if (degradeEl) degradeEl.innerText = `${fa.degradation}%`;
    if (causeBadge) causeBadge.innerText = fa.primaryCause || 'Nominal Sun Tracking';
  }

  // Structured Visual / Thermal CV Telemetry (Phase 2)
  if (panel.visualInspection && typeof panel.visualInspection === 'object') {
    const vi = panel.visualInspection;
    const crackEl = document.getElementById('cv-crack');
    const discEl = document.getElementById('cv-discoloration');
    const contamEl = document.getElementById('cv-contamination');
    const compEl = document.getElementById('cv-components');
    const sandEl = document.getElementById('cv-sand');
    const baseChip = document.getElementById('insp-baseline-chip');
    const findingsEl = document.getElementById('insp-findings');

    if (crackEl) crackEl.innerText = vi.crack || 'Not detected';
    if (discEl) discEl.innerText = vi.discoloration || 'Nominal';
    if (contamEl) contamEl.innerText = vi.contamination || 'Not detected';
    if (compEl) compEl.innerText = vi.looseComponents || 'Nominal';
    if (sandEl) sandEl.innerText = vi.sandBuildup || `${panel.dust}%`;
    if (baseChip) baseChip.innerText = vi.baselineComparison || 'Nominal';
    if (findingsEl) findingsEl.innerText = vi.summary || 'Nominal condition.';
  } else if (typeof panel.visualInspection === 'string') {
    const findingsEl = document.getElementById('insp-findings');
    if (findingsEl) findingsEl.innerText = panel.visualInspection;
  }
}

function updateEnergyFlow(energy) {
  document.getElementById('flow-gen').innerText = `${energy.generated.toFixed(2)} MW`;
  document.getElementById('flow-grid').innerText = `${energy.grid.toFixed(2)} MW`;
  document.getElementById('flow-battery').innerText = `${energy.batterySoC}% SoC`;
  document.getElementById('flow-shared').innerText = `${energy.sharedSolar.toFixed(2)} MW`;
  document.getElementById('grid-price-badge').innerText = energy.gridPrice;

  const nodeGrid = document.getElementById('flow-node-grid');
  const nodeStorage = document.getElementById('flow-node-storage');
  const nodeCommunity = document.getElementById('flow-node-community');

  nodeGrid.classList.remove('active');
  nodeStorage.classList.remove('active');
  nodeCommunity.classList.remove('active');

  if (energy.activeRoute === 'GRID_EXPORT') {
    nodeGrid.classList.add('active');
  } else if (energy.activeRoute === 'BATTERY_CHARGE') {
    nodeStorage.classList.add('active');
  } else {
    nodeCommunity.classList.add('active');
  }
}

function updateEventTimeline(events) {
  const container = document.getElementById('timeline-list');
  if (!container || !events) return;

  container.innerHTML = events.slice(0, 25).map(ev => `
    <div class="timeline-item ${ev.type}">
      <span class="timeline-time">${ev.time}</span>
      <span class="timeline-msg">${ev.message}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 – Demo Overlay Updater
// Receives DEMO_STEP data and updates all overlay UI elements
// ─────────────────────────────────────────────────────────────────────────────
function updateDemoOverlay(demoData) {
  const overlay = document.getElementById('demo-overlay');
  const btnStart = document.getElementById('btn-start-demo');
  if (!overlay) return;

  if (!demoData.active) {
    // Demo ended or stopped
    overlay.classList.remove('visible');
    if (btnStart) {
      btnStart.classList.remove('demo-running');
      btnStart.querySelector('span:last-child').innerText = 'Start Demo';
    }
    return;
  }

  // Show the overlay
  overlay.classList.add('visible');

  const { stepIndex, stageName, narration, totalSteps } = demoData;

  // Stage name & narration
  const stageNameEl = document.getElementById('demo-stage-name');
  const narrationEl = document.getElementById('demo-narration');
  if (stageNameEl) stageNameEl.innerText = stageName;
  if (narrationEl) narrationEl.innerText = narration;

  // Step label
  const stepLabelEl = document.getElementById('demo-step-label');
  if (stepLabelEl) stepLabelEl.innerText = `Step ${stepIndex} / ${totalSteps}`;

  // Ring label
  const ringLabelEl = document.getElementById('demo-ring-label');
  if (ringLabelEl) ringLabelEl.innerText = `${stepIndex}/${totalSteps}`;

  // Progress bar (percentage of steps completed)
  const progressBar = document.getElementById('demo-progress-bar');
  if (progressBar) {
    const pct = ((stepIndex - 1) / totalSteps) * 100;
    progressBar.style.width = `${pct}%`;
  }

  // SVG ring fill (stroke-dashoffset: 113 = 0%, 0 = 100%)
  const ringFill = document.getElementById('demo-ring-fill');
  if (ringFill) {
    const circumference = 113;
    const filled = ((stepIndex - 1) / totalSteps) * circumference;
    ringFill.style.strokeDashoffset = `${circumference - filled}`;
  }

  // Step dots
  const dots = document.querySelectorAll('.demo-dot');
  dots.forEach(dot => {
    const step = parseInt(dot.getAttribute('data-step'), 10);
    dot.classList.remove('active', 'done');
    if (step < stepIndex) {
      dot.classList.add('done');
    } else if (step === stepIndex) {
      dot.classList.add('active');
    }
  });
}

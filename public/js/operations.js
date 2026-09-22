// DuneVolt AI Operations & Diagnostics Controller
import { farmStateManager } from './state.js';

let currentSelectedPanelId = 'PV-02';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Panel Selector Tabs Listeners
  const panelTabs = document.querySelectorAll('.panel-tab');
  panelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const panelId = tab.getAttribute('data-panel-id');
      if (panelId) {
        currentSelectedPanelId = panelId;
        if (farmStateManager.state) {
          updatePanelInspector(farmStateManager.state);
        }
      }
    });
  });

  // 2. WebSocket Connection Status & Latency Indicator
  farmStateManager.onConnectionChange((isConnected, reconnectAttempt, nextRetryMs) => {
    const syncBadge = document.getElementById('sync-badge');
    const syncText = document.getElementById('sync-status-text');
    const syncDot = document.getElementById('sync-dot-indicator');
    const latencyEl = document.getElementById('sync-latency-text');
    if (isConnected) {
      if (syncBadge) syncBadge.className = 'badge cyan';
      if (syncText) syncText.innerText = 'SYNCED';
      if (syncDot) syncDot.className = 'status-dot info';
      if (latencyEl) latencyEl.style.display = '';
    } else {
      if (syncBadge) syncBadge.className = 'badge rose';
      const retryLabel = reconnectAttempt > 0
        ? `OFFLINE · RETRY #${reconnectAttempt}${nextRetryMs > 0 ? ' in ' + Math.round(nextRetryMs / 1000) + 's' : ''}`
        : 'OFFLINE';
      if (syncText) syncText.innerText = retryLabel;
      if (syncDot) syncDot.className = 'status-dot critical';
      if (latencyEl) { latencyEl.innerText = '--ms'; latencyEl.style.display = ''; }
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

  // 3. Subscribe to Authoritative Shared State
  farmStateManager.subscribe((state) => {
    if (!state) return;
    updateOperationsUI(state);
  });

  // 4. Demo Mode & Instant Reset Wiring
  const btnStartDemo = document.getElementById('btn-start-demo');
  const btnStopDemo = document.getElementById('btn-stop-demo');
  const btnHeaderReset = document.getElementById('btn-header-reset');

  if (btnStartDemo) {
    btnStartDemo.addEventListener('click', () => {
      if (btnStartDemo.classList.contains('demo-running')) return;
      farmStateManager.startDemo();
      btnStartDemo.classList.add('demo-running');
      const label = btnStartDemo.querySelector('span:last-child');
      if (label) label.innerText = 'Demo Running…';
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

  // Hotkeys: Shift + R, Shift + D, Shift + I
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      e.preventDefault();
      farmStateManager.reset();
      flashHeaderReset();
    } else if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      toggleMasterDiagnostics();
    } else if (e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
      toggleInspectorDetails();
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

  // 5. Architecture & Honesty Guide Modal
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

  // 6. Secondary Toggles Wiring
  const btnMasterDiagnostics = document.getElementById('btn-master-diagnostics');
  const btnAiDetailsToggle = document.getElementById('btn-ai-details-toggle');
  const aiDetailsSection = document.getElementById('ai-details-section');
  const btnInspectorDetailsToggle = document.getElementById('btn-inspector-details-toggle');
  const inspectorDetailsSection = document.getElementById('inspector-details-section');
  const btnGridTelemetryToggle = document.getElementById('btn-grid-telemetry-toggle');
  const gridTelemetrySection = document.getElementById('grid-telemetry-section');

  function toggleAiDetails(forceState) {
    if (!btnAiDetailsToggle || !aiDetailsSection) return;
    const isExpanded = forceState !== undefined ? !forceState : btnAiDetailsToggle.getAttribute('aria-expanded') === 'true';
    const newExpanded = !isExpanded;
    btnAiDetailsToggle.setAttribute('aria-expanded', String(newExpanded));
    btnAiDetailsToggle.classList.toggle('active', newExpanded);
    aiDetailsSection.setAttribute('aria-hidden', String(!newExpanded));
    aiDetailsSection.classList.toggle('expanded', newExpanded);
    updateMasterDiagnosticsBtnState();
  }

  function toggleInspectorDetails(forceState) {
    if (!btnInspectorDetailsToggle || !inspectorDetailsSection) return;
    const isExpanded = forceState !== undefined ? !forceState : btnInspectorDetailsToggle.getAttribute('aria-expanded') === 'true';
    const newExpanded = !isExpanded;
    btnInspectorDetailsToggle.setAttribute('aria-expanded', String(newExpanded));
    btnInspectorDetailsToggle.classList.toggle('active', newExpanded);
    inspectorDetailsSection.setAttribute('aria-hidden', String(!newExpanded));
    inspectorDetailsSection.classList.toggle('expanded', newExpanded);
    updateMasterDiagnosticsBtnState();
  }

  function toggleGridTelemetry(forceState) {
    if (!btnGridTelemetryToggle || !gridTelemetrySection) return;
    const isExpanded = forceState !== undefined ? !forceState : btnGridTelemetryToggle.getAttribute('aria-expanded') === 'true';
    const newExpanded = !isExpanded;
    btnGridTelemetryToggle.setAttribute('aria-expanded', String(newExpanded));
    btnGridTelemetryToggle.classList.toggle('active', newExpanded);
    gridTelemetrySection.setAttribute('aria-hidden', String(!newExpanded));
    gridTelemetrySection.classList.toggle('expanded', newExpanded);
  }

  function toggleMasterDiagnostics() {
    const aiOpen = aiDetailsSection && aiDetailsSection.classList.contains('expanded');
    const inspOpen = inspectorDetailsSection && inspectorDetailsSection.classList.contains('expanded');
    const shouldOpen = !(aiOpen && inspOpen);
    toggleAiDetails(shouldOpen);
    toggleInspectorDetails(shouldOpen);
  }

  function updateMasterDiagnosticsBtnState() {
    if (!btnMasterDiagnostics) return;
    const aiOpen = aiDetailsSection && aiDetailsSection.classList.contains('expanded');
    const inspOpen = inspectorDetailsSection && inspectorDetailsSection.classList.contains('expanded');
    btnMasterDiagnostics.classList.toggle('active', Boolean(aiOpen || inspOpen));
  }

  if (btnAiDetailsToggle) btnAiDetailsToggle.addEventListener('click', () => toggleAiDetails());
  if (btnInspectorDetailsToggle) btnInspectorDetailsToggle.addEventListener('click', () => toggleInspectorDetails());
  if (btnGridTelemetryToggle) btnGridTelemetryToggle.addEventListener('click', () => toggleGridTelemetry());
  if (btnMasterDiagnostics) btnMasterDiagnostics.addEventListener('click', toggleMasterDiagnostics);
});

function updateOperationsUI(state) {
  const { environment, farm, panels, prediction, maintenance, energy, events } = state;

  // 1. System Status Pill
  const statusPill = document.getElementById('system-status-pill');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('system-status-text');

  if (statusPill && statusDot && statusText) {
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
  }

  // 2. Alert / Countdown Banner
  const alertBanner = document.getElementById('alert-banner');
  const alertTitle = document.getElementById('alert-title');
  const alertDesc = document.getElementById('alert-desc');
  const countdownBox = document.getElementById('countdown-box');
  const countdownTimer = document.getElementById('countdown-timer');

  if (alertBanner && alertTitle && alertDesc) {
    if (farm.activeAlert) {
      alertBanner.classList.add('visible');
      alertDesc.innerText = farm.activeAlert;

      if (prediction.countdown !== null && countdownBox && countdownTimer) {
        countdownBox.style.display = 'flex';
        countdownTimer.innerText = prediction.countdown;
        if (prediction.countdown <= 5) {
          alertTitle.innerText = 'DEFENSE COMPLETE — HOLDING FOR STORM';
        } else {
          alertTitle.innerText = 'AI EARLY STORM WARNING — COUNTDOWN';
        }
      } else if (countdownBox) {
        countdownBox.style.display = 'none';
        alertTitle.innerText = farm.operatingMode === 'STORM' ? 'SEVERE SANDSTORM IN PROGRESS' : 'AUTONOMOUS DEFENSE ACTIVE';
      }
    } else {
      alertBanner.classList.remove('visible');
    }
  }

  // 3. Telemetry Metrics Strip
  const valPower = document.getElementById('val-power');
  const valEff = document.getElementById('val-efficiency');
  const valHealth = document.getElementById('val-health');
  const valDust = document.getElementById('val-dust');
  const valTemp = document.getElementById('val-temperature');
  const valWind = document.getElementById('val-wind');

  if (valPower) valPower.innerText = farm.totalPower.toFixed(2);
  if (valEff) valEff.innerText = farm.efficiency.toFixed(1);
  if (valHealth) valHealth.innerText = farm.health.toFixed(1);
  if (valDust) valDust.innerText = environment.dustLevel;
  if (valTemp) valTemp.innerText = environment.temperature;
  if (valWind) valWind.innerText = environment.windSpeed;

  const tempLoss = Math.max(0, environment.temperature - 25) * 0.4;
  const tempDerateEl = document.getElementById('val-temp-derating');
  if (tempDerateEl) tempDerateEl.innerText = `Temp Loss: -${tempLoss.toFixed(1)}%`;

  const dustLoss = (environment.dustLevel / 100) * 38;
  const dustLossEl = document.getElementById('val-dust-loss');
  if (dustLossEl) dustLossEl.innerText = `Soiling Derate: -${dustLoss.toFixed(1)}%`;

  // 4. AI Operations Section
  const stormRiskEl = document.getElementById('ai-storm-risk');
  const stormBar = document.getElementById('storm-risk-bar');
  if (stormRiskEl && stormBar) {
    stormRiskEl.innerText = `${prediction.stormRisk}%`;
    stormBar.style.width = `${prediction.stormRisk}%`;
    if (prediction.stormRisk > 70) {
      stormBar.style.backgroundColor = '#ef4444';
      stormRiskEl.style.color = '#f87171';
    } else if (prediction.stormRisk > 35) {
      stormBar.style.backgroundColor = '#f59e0b';
      stormRiskEl.style.color = '#fbbf24';
    } else {
      stormBar.style.backgroundColor = '#10b981';
      stormRiskEl.style.color = '#10b981';
    }
  }

  const soilingEl = document.getElementById('ai-soiling-risk');
  if (soilingEl) {
    soilingEl.innerText = prediction.soilingRisk;
    soilingEl.style.color = prediction.soilingRisk === 'CRITICAL' ? '#f87171' : prediction.soilingRisk === 'HIGH' ? '#fbbf24' : '#10b981';
  }

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
  if (faultEl) {
    faultEl.innerText = prediction.faultRisk;
    faultEl.style.color = prediction.faultRisk.includes('HIGH') ? '#f87171' : '#10b981';
  }

  const cleanPriorityEl = document.getElementById('ai-cleaning-priority');
  if (cleanPriorityEl) cleanPriorityEl.innerText = maintenance.priority;

  const revLossEl = document.getElementById('ai-revenue-loss');
  if (revLossEl) revLossEl.innerText = `Est. Loss: ₹${maintenance.estimatedDailyLossInr.toLocaleString()} / Cost: ₹${maintenance.cleaningThresholdInr.toLocaleString()}`;

  // 5. Loss Attribution Breakdown
  updateLossAttribution(state);

  // 6. Prioritized Economic Cleaning Queue
  updateCleaningQueue(maintenance.cleaningQueue);

  // 7. Selected Panel Inspector
  updatePanelInspector(state);

  // 8. Energy Flow Diagram
  updateEnergyFlow(energy);

  // 9. Chronological Event Timeline
  updateEventTimeline(events);
}

function updateCleaningQueue(queue) {
  function renderQueueRows(queue) {
    return (queue || []).map(item => `
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

  const container = document.getElementById('cleaning-queue-table');
  if (container) container.innerHTML = renderQueueRows(queue);
}

function updateLossAttribution(state) {
  const { environment, farm, panels } = state;
  const isStowed = farm.operatingMode === 'PROTECTING' || farm.operatingMode === 'STORM';

  const expectedTotal = panels.reduce((acc, p) => acc + p.expectedOutput, 0);
  const actualTotal = farm.totalPower;

  const attrExp = document.getElementById('attr-expected');
  const attrAct = document.getElementById('attr-actual');
  if (attrExp) attrExp.innerText = `${expectedTotal.toFixed(2)} MW`;
  if (attrAct) attrAct.innerText = `${actualTotal.toFixed(2)} MW`;

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
    pctAnomaly = 67;
  }

  const barNom = document.getElementById('bar-nominal');
  const barDust = document.getElementById('bar-dust');
  const barTemp = document.getElementById('bar-temp');
  const barAnom = document.getElementById('bar-anomaly');

  if (barNom) barNom.style.width = `${pctNominal}%`;
  if (barDust) barDust.style.width = `${pctDust}%`;
  if (barTemp) barTemp.style.width = `${pctTemp}%`;
  if (barAnom) barAnom.style.width = `${pctAnomaly}%`;

  const pctNomEl = document.getElementById('pct-nominal');
  const pctDustEl = document.getElementById('pct-dust');
  const pctTempEl = document.getElementById('pct-temp');
  const pctAnomEl = document.getElementById('pct-anomaly');

  if (pctNomEl) pctNomEl.innerText = pctNominal;
  if (pctDustEl) pctDustEl.innerText = pctDust;
  if (pctTempEl) pctTempEl.innerText = pctTemp;
  if (pctAnomEl) pctAnomEl.innerText = pctAnomaly;

  if (legendFault) {
    legendFault.style.display = hasFault ? 'flex' : 'none';
  }
}

function updatePanelInspector(state) {
  const panel = state.panels.find(p => p.id === currentSelectedPanelId) || state.panels[0];
  if (!panel) return;

  const panelTabs = document.querySelectorAll('.panel-tab');
  panelTabs.forEach(tab => {
    if (tab.getAttribute('data-panel-id') === panel.id) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  const inspNameEl = document.getElementById('insp-name');
  if (inspNameEl) inspNameEl.innerText = panel.name;

  const healthBadge = document.getElementById('insp-health');
  if (healthBadge) {
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
  }

  const inspOut = document.getElementById('insp-output');
  const inspExp = document.getElementById('insp-expected');
  const inspDust = document.getElementById('insp-dust');
  const inspTemp = document.getElementById('insp-temp');
  const inspLast = document.getElementById('insp-last-cleaned');
  const inspNext = document.getElementById('insp-next-cleaned');

  if (inspOut) inspOut.innerText = panel.output.toFixed(2);
  if (inspExp) inspExp.innerText = panel.expectedOutput.toFixed(2);
  if (inspDust) inspDust.innerText = `${panel.dust}%`;
  if (inspTemp) inspTemp.innerText = `${panel.temperature}°C`;
  if (inspLast) inspLast.innerText = panel.lastCleaned;
  if (inspNext) inspNext.innerText = panel.nextCleaning;

  // 7-Factor Loss Attribution
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

  // Structured Visual / Thermal CV Telemetry
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

  // Dynamic Alert Badges
  const aiDetailsBadge = document.getElementById('ai-details-badge');
  const hasFault = state.panels.some(p => p.faultStatus !== 'NONE');
  if (aiDetailsBadge) {
    const queueExceeded = state.maintenance && state.maintenance.cleaningQueue && state.maintenance.cleaningQueue.some(q => q.thresholdExceeded);
    if (queueExceeded || hasFault) {
      aiDetailsBadge.style.display = 'inline-block';
      aiDetailsBadge.innerText = queueExceeded ? 'ROI DISPATCH' : 'ANOMALY';
    } else {
      aiDetailsBadge.style.display = 'none';
    }
  }

  const inspDetailsBadge = document.getElementById('insp-details-badge');
  if (inspDetailsBadge) {
    if (panel.faultStatus && panel.faultStatus !== 'NONE') {
      inspDetailsBadge.style.display = 'inline-block';
      inspDetailsBadge.innerText = panel.faultStatus;
    } else {
      inspDetailsBadge.style.display = 'none';
    }
  }
}

function updateEnergyFlow(energy) {
  const genEl = document.getElementById('flow-gen');
  const gridEl = document.getElementById('flow-grid');
  const battEl = document.getElementById('flow-battery');
  const shareEl = document.getElementById('flow-shared');
  const priceEl = document.getElementById('grid-price-badge');

  if (genEl) genEl.innerText = `${energy.generated.toFixed(2)} MW`;
  if (gridEl) gridEl.innerText = `${energy.grid.toFixed(2)} MW`;
  if (battEl) battEl.innerText = `${energy.batterySoC}% SoC`;
  if (shareEl) shareEl.innerText = `${energy.sharedSolar.toFixed(2)} MW`;
  if (priceEl) priceEl.innerText = energy.gridPrice;

  const nodeGrid = document.getElementById('flow-node-grid');
  const nodeStorage = document.getElementById('flow-node-storage');
  const nodeCommunity = document.getElementById('flow-node-community');

  if (nodeGrid) nodeGrid.classList.remove('active');
  if (nodeStorage) nodeStorage.classList.remove('active');
  if (nodeCommunity) nodeCommunity.classList.remove('active');

  if (energy.activeRoute === 'GRID_EXPORT' && nodeGrid) {
    nodeGrid.classList.add('active');
  } else if (energy.activeRoute === 'BATTERY_CHARGE' && nodeStorage) {
    nodeStorage.classList.add('active');
  } else if (nodeCommunity) {
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

function updateDemoOverlay(demoData) {
  const overlay = document.getElementById('demo-overlay');
  const btnStart = document.getElementById('btn-start-demo');
  if (!overlay) return;

  if (!demoData.active) {
    overlay.classList.remove('visible');
    if (btnStart) {
      btnStart.classList.remove('demo-running');
      const label = btnStart.querySelector('span:last-child');
      if (label) label.innerText = 'Start Demo';
    }
    return;
  }

  overlay.classList.add('visible');

  const { stepIndex, stageName, narration, totalSteps } = demoData;

  const stageNameEl = document.getElementById('demo-stage-name');
  const narrationEl = document.getElementById('demo-narration');
  if (stageNameEl) stageNameEl.innerText = stageName;
  if (narrationEl) narrationEl.innerText = narration;

  const stepLabelEl = document.getElementById('demo-step-label');
  if (stepLabelEl) stepLabelEl.innerText = `Step ${stepIndex} / ${totalSteps}`;

  const ringLabelEl = document.getElementById('demo-ring-label');
  if (ringLabelEl) ringLabelEl.innerText = `${stepIndex}/${totalSteps}`;

  const progressBar = document.getElementById('demo-progress-bar');
  if (progressBar) {
    const pct = ((stepIndex - 1) / totalSteps) * 100;
    progressBar.style.width = `${pct}%`;
  }

  const ringFill = document.getElementById('demo-ring-fill');
  if (ringFill) {
    const circumference = 113;
    const filled = ((stepIndex - 1) / totalSteps) * circumference;
    ringFill.style.strokeDashoffset = `${circumference - filled}`;
  }

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

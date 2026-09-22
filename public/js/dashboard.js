// DuneVolt 3D Digital Twin Farm Dashboard Controller
import { farmStateManager } from './state.js';
import { SolarFarmScene } from './scene3d.js';

let scene = null;
let currentSelectedPanelId = 'PV-02';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Canvas
  const canvasContainer = document.getElementById('webgl-canvas-container');
  if (canvasContainer) {
    scene = new SolarFarmScene(canvasContainer, (panelId) => {
      currentSelectedPanelId = panelId;
      if (farmStateManager.state) {
        updatePanelInspector(farmStateManager.state);
      }
    });
  }

  // 2. Camera Preset Listeners
  const camBtns = document.querySelectorAll('.cam-btn');
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-cam');
      if (scene) {
        scene.setCameraPreset(preset);
      }
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

  // 3. 3D Scene FPS Tracking & Quality Mode Toggle
  if (scene) {
    const fpsValEl = document.getElementById('hud-fps-val');
    scene.setFpsCallback((fps) => {
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

  // 4. Subscribe to Authoritative Shared State
  farmStateManager.subscribe((state) => {
    if (!state) return;
    updateDashboardUI(state);
    if (scene) {
      scene.updateFromState(state);
    }
  });

  // 5. Window Resize Handler
  window.addEventListener('resize', () => {
    if (scene && typeof scene.onResize === 'function') {
      scene.onResize();
    }
  });
});

function updateDashboardUI(state) {
  const { environment, farm, panels, prediction, maintenance } = state;

  // 1. Alert / Countdown Banner
  const alertBanner = document.getElementById('alert-banner');
  const alertTitle = document.getElementById('alert-title');
  const alertDesc = document.getElementById('alert-desc');
  const countdownBox = document.getElementById('countdown-box');
  const countdownTimer = document.getElementById('countdown-timer');

  if (alertBanner && alertTitle && alertDesc) {
    if (farm.activeAlert) {
      alertBanner.classList.add('visible');
      alertDesc.innerText = farm.activeAlert;

      if (prediction && prediction.countdown !== null && countdownBox && countdownTimer) {
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

  // 2. Telemetry Metrics Strip
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

  // 3. HUD Chips on 3D Monitor
  const hudSun = document.getElementById('hud-sun-angle');
  if (hudSun) hudSun.innerText = `${environment.sunAngle}°`;

  const primaryPanel = (panels && panels.length > 1) ? panels[1] : (panels && panels[0]);
  const hudTilt = document.getElementById('hud-panel-tilt');
  if (hudTilt && primaryPanel) hudTilt.innerText = `${primaryPanel.tilt}°`;

  const hudMode = document.getElementById('hud-farm-mode');
  if (hudMode) hudMode.innerText = farm.operatingMode;

  const shieldChip = document.getElementById('hud-shield-chip');
  const shieldVal = document.getElementById('hud-shield-val');
  if (shieldChip && shieldVal) {
    const primaryShield = (primaryPanel && primaryPanel.shieldDeploy !== undefined) 
      ? primaryPanel.shieldDeploy 
      : (farm.operatingMode === 'PROTECTING' || farm.operatingMode === 'STORM' ? 100 : 0);

    if (primaryShield > 0 || farm.operatingMode === 'PROTECTING' || farm.operatingMode === 'STORM') {
      shieldChip.style.display = 'flex';
      if (primaryShield >= 100 || farm.operatingMode === 'PROTECTING' || farm.operatingMode === 'STORM') {
        shieldVal.innerText = 'LOCKED (100%) • 12° STOW';
        shieldVal.style.color = '#fbbf24';
      } else {
        shieldVal.innerText = `DEPLOYING ${primaryShield}%`;
        shieldVal.style.color = '#f59e0b';
      }
    } else {
      shieldChip.style.display = 'none';
    }
  }

  const cleaningChip = document.getElementById('hud-cleaning-chip');
  const cleaningPct = document.getElementById('hud-cleaning-pct');
  if (cleaningChip && cleaningPct && maintenance) {
    if (maintenance.cleaningRobotActive) {
      cleaningChip.style.display = 'flex';
      cleaningPct.innerText = maintenance.cleaningProgress;
    } else {
      cleaningChip.style.display = 'none';
    }
  }

  // 4. Floating Array Inspector Telemetry
  updatePanelInspector(state);
}

function updatePanelInspector(state) {
  if (!state || !state.panels) return;
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

  const inspIdBadge = document.getElementById('insp-id-badge');
  if (inspIdBadge) inspIdBadge.innerText = panel.id;

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

  if (inspOut) inspOut.innerText = panel.output.toFixed(2);
  if (inspExp) inspExp.innerText = panel.expectedOutput.toFixed(2);
  if (inspDust) inspDust.innerText = `${panel.dust}%`;
  if (inspTemp) inspTemp.innerText = `${panel.temperature}°C`;
}

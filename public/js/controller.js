// DuneVolt Operator Controller Logic
import { farmStateManager } from './state.js';

let isUserDraggingSlider = false;

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sliderSun = document.getElementById('slider-sun');
  const sliderDust = document.getElementById('slider-dust');
  const sliderWind = document.getElementById('slider-wind');
  const sliderTemp = document.getElementById('slider-temp');

  const badgeSun = document.getElementById('badge-sun');
  const badgeDust = document.getElementById('badge-dust');
  const badgeWind = document.getElementById('badge-wind');
  const badgeTemp = document.getElementById('badge-temp');

  const btnSimulateStorm = document.getElementById('btn-simulate-storm');
  const btnSimulateDust = document.getElementById('btn-simulate-dust');
  const btnInjectFault = document.getElementById('btn-inject-fault');
  const btnFaultTitle = document.getElementById('btn-fault-title');
  const btnTriggerCleaning = document.getElementById('btn-trigger-cleaning');
  const btnReset = document.getElementById('btn-reset');

  const syncDot = document.getElementById('ctrl-sync-dot');
  const syncLabel = document.getElementById('ctrl-sync-label');
  const modeBadge = document.getElementById('ctrl-mode-badge');
  const totalPower = document.getElementById('ctrl-total-power');

  // Track slider dragging
  [sliderSun, sliderDust, sliderWind, sliderTemp].forEach(slider => {
    slider.addEventListener('pointerdown', () => { isUserDraggingSlider = true; });
    slider.addEventListener('pointerup', () => {
      isUserDraggingSlider = false;
      dispatchEnvironmentChange();
    });
    slider.addEventListener('input', () => {
      updateSliderBadges();
      dispatchEnvironmentChange();
    });
  });

  updateSliderBadges();

  function updateSliderBadges() {
    badgeSun.innerText = `${sliderSun.value}°`;
    badgeDust.innerText = `${sliderDust.value}%`;
    badgeWind.innerText = `${sliderWind.value} km/h`;
    badgeTemp.innerText = `${sliderTemp.value}°C`;

    updateSliderGradients();
  }

  function updateSliderGradients() {
    const sunPct = ((sliderSun.value - sliderSun.min) / (sliderSun.max - sliderSun.min)) * 100;
    const dustPct = ((sliderDust.value - sliderDust.min) / (sliderDust.max - sliderDust.min)) * 100;
    const windPct = ((sliderWind.value - sliderWind.min) / (sliderWind.max - sliderWind.min)) * 100;
    const tempPct = ((sliderTemp.value - sliderTemp.min) / (sliderTemp.max - sliderTemp.min)) * 100;

    sliderSun.style.background = `linear-gradient(to right, #f59e0b 0%, #fbbf24 ${sunPct}%, #1e293b ${sunPct}%, #1e293b 100%)`;
    sliderDust.style.background = `linear-gradient(to right, #d97706 0%, #b45309 ${dustPct}%, #1e293b ${dustPct}%, #1e293b 100%)`;
    sliderWind.style.background = `linear-gradient(to right, #06b6d4 0%, #3b82f6 ${windPct}%, #1e293b ${windPct}%, #1e293b 100%)`;
    sliderTemp.style.background = `linear-gradient(to right, #ef4444 0%, #f43f5e ${tempPct}%, #1e293b ${tempPct}%, #1e293b 100%)`;
  }

  function dispatchEnvironmentChange() {
    farmStateManager.setEnvironment({
      sunAngle: Number(sliderSun.value),
      dustLevel: Number(sliderDust.value),
      windSpeed: Number(sliderWind.value),
      temperature: Number(sliderTemp.value)
    });
  }

  // One-Tap Triggers
  btnSimulateStorm.addEventListener('click', () => {
    farmStateManager.simulateStorm();
    flashButton(btnSimulateStorm);
  });

  btnSimulateDust.addEventListener('click', () => {
    farmStateManager.simulateDust();
    flashButton(btnSimulateDust);
  });

  const selectFaultPanel = document.getElementById('select-fault-panel');
  const selectFaultType = document.getElementById('select-fault-type');
  const ctrlLatency = document.getElementById('ctrl-latency');

  btnInjectFault.addEventListener('click', () => {
    const selectedPanelId = selectFaultPanel ? selectFaultPanel.value : 'PV-02';
    const selectedType = selectFaultType ? selectFaultType.value : 'HOTSPOT';

    // If selected panel is already faulted, clear it; otherwise inject selected fault type
    const currentFaulted = farmStateManager.state?.panels?.find(p => p.id === selectedPanelId && p.faultStatus !== 'NONE');
    if (currentFaulted) {
      farmStateManager.setFault(selectedPanelId, 'NONE');
    } else {
      farmStateManager.setFault(selectedPanelId, selectedType);
    }
    flashButton(btnInjectFault);
  });

  btnTriggerCleaning.addEventListener('click', () => {
    farmStateManager.triggerCleaning();
    flashButton(btnTriggerCleaning);
  });

  btnReset.addEventListener('click', () => {
    farmStateManager.reset();
    flashButton(btnReset);
  });

  function flashButton(btn) {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => { btn.style.transform = ''; }, 150);
  }

  // Connection status & Latency (Phase 2)
  farmStateManager.onConnectionChange((connected) => {
    if (connected) {
      syncDot.className = 'status-dot';
      syncLabel.innerText = 'SYNCED';
      syncLabel.style.color = '#10b981';
    } else {
      syncDot.className = 'status-dot critical';
      syncLabel.innerText = 'DISCONNECTED';
      syncLabel.style.color = '#ef4444';
    }
  });

  farmStateManager.onLatencyChange((rtt) => {
    if (ctrlLatency) {
      ctrlLatency.innerText = `${rtt}ms`;
    }
  });

  // State Subscription
  farmStateManager.subscribe((state) => {
    if (!state) return;
    const { environment, farm, panels } = state;

    totalPower.innerText = farm.totalPower.toFixed(2);
    modeBadge.innerText = farm.operatingMode;

    if (farm.operatingMode === 'NORMAL') {
      modeBadge.style.color = '#10b981';
    } else if (farm.operatingMode === 'WARNING' || farm.operatingMode === 'CLEANING') {
      modeBadge.style.color = '#f59e0b';
    } else if (farm.operatingMode === 'STORM') {
      modeBadge.style.color = '#ef4444';
    } else {
      modeBadge.style.color = '#06b6d4';
    }

    const selectedPanelId = selectFaultPanel ? selectFaultPanel.value : 'PV-02';
    const targetFaulted = panels.find(p => p.id === selectedPanelId && p.faultStatus !== 'NONE');
    const anyFaulted = panels.find(p => p.faultStatus !== 'NONE');

    if (targetFaulted) {
      btnFaultTitle.innerText = `Clear ${selectedPanelId} [${targetFaulted.faultStatus}]`;
      btnInjectFault.style.borderColor = '#ef4444';
    } else if (anyFaulted) {
      btnFaultTitle.innerText = `Inject ${selectedPanelId} (Clear ${anyFaulted.id})`;
      btnInjectFault.style.borderColor = '#f59e0b';
    } else {
      btnFaultTitle.innerText = `Inject ${selectedPanelId} Fault`;
      btnInjectFault.style.borderColor = 'rgba(168, 85, 247, 0.4)';
    }

    // Only update slider positions if user is not actively interacting with them
    if (!isUserDraggingSlider) {
      sliderSun.value = environment.sunAngle;
      sliderDust.value = environment.dustLevel;
      sliderWind.value = environment.windSpeed;
      sliderTemp.value = environment.temperature;
      updateSliderBadges();
    }
  });
});

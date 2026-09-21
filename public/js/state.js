// DuneVolt Shared State Synchronization Client
// Subscribes to central authoritative WebSocket server with auto-reconnect & heartbeat

class FarmStateManager {
  constructor() {
    this.state = null;
    this.listeners = [];
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 50;
    this.isConnected = false;
    this.connectionStatusListeners = [];
    this.latencyListeners = [];
    this.demoListeners = [];
    this.latency = 0;
    this.heartbeatTimer = null;
    this.initWebSocket();
  }

  initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionStatus(true);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'INITIAL_STATE' || message.type === 'STATE_UPDATE') {
            this.state = message.data;
            this.notifyListeners(this.state);
          } else if (message.type === 'PONG') {
            const rtt = Math.max(1, Date.now() - (message.clientTimestamp || Date.now()));
            this.latency = rtt;
            this.notifyLatency(rtt);
          } else if (message.type === 'DEMO_STEP') {
            this.notifyDemoListeners(message.data);
          }
        } catch (err) {
          console.error('[StateSync] Failed to parse message', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.notifyConnectionStatus(false);
        this.attemptReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[StateSync] WebSocket error:', err);
      };
    } catch (e) {
      console.error('[StateSync] Socket init failed', e);
      this.attemptReconnect();
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          action: 'PING',
          timestamp: Date.now()
        }));
      }
    }, 2500);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(3000, 1000 * this.reconnectAttempts);
      setTimeout(() => this.initWebSocket(), delay);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    if (this.state) {
      callback(this.state);
    }
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback) {
    this.connectionStatusListeners.push(callback);
    callback(this.isConnected);
    return () => {
      this.connectionStatusListeners = this.connectionStatusListeners.filter(cb => cb !== callback);
    };
  }

  onLatencyChange(callback) {
    this.latencyListeners.push(callback);
    callback(this.latency);
    return () => {
      this.latencyListeners = this.latencyListeners.filter(cb => cb !== callback);
    };
  }

  notifyLatency(rtt) {
    for (const cb of this.latencyListeners) {
      try {
        cb(rtt);
      } catch (err) {
        console.error('[StateSync] Latency callback error', err);
      }
    }
  }

  notifyListeners(state) {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[StateSync] Listener error', err);
      }
    }
  }

  notifyConnectionStatus(status) {
    for (const cb of this.connectionStatusListeners) {
      try {
        cb(status);
      } catch (err) {
        console.error('[StateSync] Status callback error', err);
      }
    }
  }

  sendAction(action, payload = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, payload }));
    } else {
      console.warn('[StateSync] Cannot send action, socket not open:', action);
    }
  }

  // Demo step subscription
  onDemoStep(callback) {
    this.demoListeners.push(callback);
    return () => {
      this.demoListeners = this.demoListeners.filter(cb => cb !== callback);
    };
  }

  notifyDemoListeners(demoData) {
    for (const cb of this.demoListeners) {
      try {
        cb(demoData);
      } catch (err) {
        console.error('[StateSync] Demo listener error', err);
      }
    }
  }

  // Operator Action Helpers
  setEnvironment(envUpdates) {
    this.sendAction('SET_ENVIRONMENT', envUpdates);
  }

  simulateDust() {
    this.sendAction('SIMULATE_DUST');
  }

  simulateStorm() {
    this.sendAction('SIMULATE_STORM');
  }

  setFault(panelId, faultType) {
    this.sendAction('SET_FAULT', { panelId, faultType });
  }

  createFault(faultType = 'HOTSPOT') {
    this.sendAction('CREATE_FAULT', { faultType });
  }

  triggerCleaning() {
    this.sendAction('TRIGGER_CLEANING');
  }

  reset() {
    this.sendAction('RESET');
  }

  startDemo() {
    this.sendAction('DEMO_RUN');
  }

  stopDemo() {
    this.sendAction('DEMO_STOP');
  }

  // Phase 6 REST Fallback & Diagnostic Helpers
  async fetchStateRest() {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.state) {
        this.state = data.state;
        this.notifyListeners(this.state);
      }
      return data;
    } catch (e) {
      console.warn('[StateSync] REST state fetch failed:', e);
      return null;
    }
  }

  async fetchHealthRest() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('[StateSync] REST health fetch failed:', e);
      return null;
    }
  }

  async resetRest() {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('[StateSync] REST reset failed:', e);
      return null;
    }
  }
}

export const farmStateManager = new FarmStateManager();

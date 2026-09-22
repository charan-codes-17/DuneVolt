// DuneVolt 3D Solar Farm Digital Twin (Three.js Realistic PBR Edition)
import * as THREE from '/vendor/three/three.module.js';

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Octave Perlin & Fractal Brownian Motion (fBm) Desert Ground Generator
// Generates natural, irregular, non-repeating bumps, dips, and ridges
// ─────────────────────────────────────────────────────────────────────────────

const PERM_TABLE = new Uint8Array([
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
]);

const P = new Uint8Array(512);
for (let i = 0; i < 256; i++) {
  P[i] = PERM_TABLE[i];
  P[256 + i] = PERM_TABLE[i];
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad2d(hash, x, y) {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin2d(x, y) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = P[P[X] + Y];
  const ab = P[P[X] + Y + 1];
  const ba = P[P[X + 1] + Y];
  const bb = P[P[X + 1] + Y + 1];

  const x1 = (1 - u) * grad2d(aa, xf, yf) + u * grad2d(ba, xf - 1, yf);
  const x2 = (1 - u) * grad2d(ab, xf, yf - 1) + u * grad2d(bb, xf - 1, yf - 1);
  return (1 - v) * x1 + v * x2;
}

// Multi-octave Fractional Brownian Motion (fBm) with domain warping
function fbmDesertNoise(x, y) {
  // Domain warping gives organic, irregular desert contours rather than aligned axes
  const qx = perlin2d(x * 0.025 + 1.7, y * 0.025 + 3.1);
  const qy = perlin2d(x * 0.025 + 5.3, y * 0.025 + 7.9);
  const wx = x + qx * 5.0;
  const wy = y + qy * 5.0;

  let total = 0;
  let amp = 0.55;
  let freq = 0.035;
  let maxAmp = 0;

  for (let i = 0; i < 4; i++) {
    total += perlin2d(wx * freq, wy * freq) * amp;
    maxAmp += amp;
    amp *= 0.5;
    freq *= 2.1;
  }

  // Micro-scale surface roughness layer
  const micro = perlin2d(x * 0.3 + 12.0, y * 0.3 + 45.0) * 0.07;

  return (total / maxAmp) * 0.7 + micro;
}

// ─────────────────────────────────────────────────────────────────────────────
// Procedural Texture & PBR Map Generators
// ─────────────────────────────────────────────────────────────────────────────

function createPhotovoltaicTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Dark silicon substrate background
  ctx.fillStyle = '#060c18';
  ctx.fillRect(0, 0, 1024, 1024);

  const cols = 6;
  const rows = 10;
  const margin = 6;
  const cellW = (1024 - margin * 2) / cols;
  const cellH = (1024 - margin * 2) / rows;
  const cornerCut = 12; // Monocrystalline chamfered wafer corners

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = margin + c * cellW;
      const y = margin + r * cellH;
      const w = cellW - 4;
      const h = cellH - 4;

      // Draw octagonal monocrystalline wafer
      ctx.beginPath();
      ctx.moveTo(x + cornerCut, y);
      ctx.lineTo(x + w - cornerCut, y);
      ctx.lineTo(x + w, y + cornerCut);
      ctx.lineTo(x + w, y + h - cornerCut);
      ctx.lineTo(x + w - cornerCut, y + h);
      ctx.lineTo(x + cornerCut, y + h);
      ctx.lineTo(x, y + h - cornerCut);
      ctx.lineTo(x, y + cornerCut);
      ctx.closePath();

      // Deep anti-reflective silicon nitride coating gradient (royal indigo to deep cobalt)
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#102d58');
      grad.addColorStop(0.3, '#0c2244');
      grad.addColorStop(0.7, '#081730');
      grad.addColorStop(1, '#050f22');
      ctx.fillStyle = grad;
      ctx.fill();

      // Wafer border outline
      ctx.strokeStyle = '#040a14';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Fine silver fingers (horizontal contact grid lines)
      ctx.strokeStyle = 'rgba(180, 215, 255, 0.22)';
      ctx.lineWidth = 0.6;
      const fingerCount = 18;
      const fingerStep = h / fingerCount;
      for (let f = 1; f < fingerCount; f++) {
        ctx.beginPath();
        ctx.moveTo(x + 4, y + f * fingerStep);
        ctx.lineTo(x + w - 4, y + f * fingerStep);
        ctx.stroke();
      }

      // 9-Busbar (9-BB) silver ribbons (vertical power collection ribbons)
      const bbCount = 5;
      const bbStep = w / (bbCount + 1);
      ctx.strokeStyle = 'rgba(235, 245, 255, 0.75)';
      ctx.lineWidth = 1.4;
      for (let b = 1; b <= bbCount; b++) {
        const bx = x + b * bbStep;
        ctx.beginPath();
        ctx.moveTo(bx, y + 2);
        ctx.lineTo(bx, y + h - 2);
        ctx.stroke();
      }
    }
  }

  // Exterior module frame edge sealing line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(margin / 2, margin / 2, 1024 - margin, 1024 - margin);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createPVNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Flat normal base (RGB 128, 128, 255 -> pointing directly up +Z)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 6;
  const rows = 10;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * cellW;
      const y = r * cellH;

      // Bevel grooves around each cell
      ctx.strokeStyle = 'rgb(100, 100, 240)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // Raised busbar normal lines
      const bbCount = 5;
      const bbStep = cellW / (bbCount + 1);
      ctx.strokeStyle = 'rgb(160, 160, 255)';
      ctx.lineWidth = 1.5;
      for (let b = 1; b <= bbCount; b++) {
        const bx = x + b * bbStep;
        ctx.beginPath();
        ctx.moveTo(bx, y + 2);
        ctx.lineTo(bx, y + cellH - 2);
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createSandTextures() {
  // 1. Sand Albedo Texture
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = 1024;
  albedoCanvas.height = 1024;
  const aCtx = albedoCanvas.getContext('2d');

  // Desert sand base tone with directional wind striations
  const grad = aCtx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#c78442');
  grad.addColorStop(0.3, '#d89753');
  grad.addColorStop(0.7, '#b77232');
  grad.addColorStop(1, '#cb8a49');
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, 1024, 1024);

  // Procedural sand granule micro-noise
  const imgData = aCtx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.8));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.5));
  }
  aCtx.putImageData(imgData, 0, 0);

  // Soft dune wave ripples on albedo
  aCtx.fillStyle = 'rgba(255, 230, 180, 0.08)';
  for (let y = 0; y < 1024; y += 32) {
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    for (let x = 0; x < 1024; x += 64) {
      aCtx.quadraticCurveTo(x + 32, y + Math.sin(x * 0.02) * 8, x + 64, y);
    }
    aCtx.lineTo(1024, 1024);
    aCtx.lineTo(0, 1024);
    aCtx.closePath();
    aCtx.fill();
  }

  const albedoTex = new THREE.CanvasTexture(albedoCanvas);
  albedoTex.wrapS = THREE.RepeatWrapping;
  albedoTex.wrapT = THREE.RepeatWrapping;
  albedoTex.repeat.set(8, 8);

  // 2. Sand Normal Map for grazing sunlight highlights
  const normCanvas = document.createElement('canvas');
  normCanvas.width = 512;
  normCanvas.height = 512;
  const nCtx = normCanvas.getContext('2d');
  nCtx.fillStyle = 'rgb(128, 128, 255)';
  nCtx.fillRect(0, 0, 512, 512);

  // Sine wave sand ripples
  for (let y = 0; y < 512; y += 16) {
    nCtx.fillStyle = 'rgb(148, 118, 245)';
    nCtx.fillRect(0, y, 512, 6);
    nCtx.fillStyle = 'rgb(108, 138, 255)';
    nCtx.fillRect(0, y + 6, 512, 6);
  }

  const normTex = new THREE.CanvasTexture(normCanvas);
  normTex.wrapS = THREE.RepeatWrapping;
  normTex.wrapT = THREE.RepeatWrapping;
  normTex.repeat.set(16, 16);

  return { albedoTex, normTex };
}

function createDustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Transparent base
  ctx.clearRect(0, 0, 512, 512);

  // Heavy sand deposition gradient along bottom frame edge (natural wind/gravity settling)
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(195, 145, 88, 0.15)');
  grad.addColorStop(0.65, 'rgba(210, 155, 95, 0.45)');
  grad.addColorStop(1, 'rgba(180, 125, 70, 0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Granular speckle noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.25) {
      data[i + 3] = Math.min(255, data[i + 3] + Math.random() * 80);
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createBrushedMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8a929a';
  ctx.fillRect(0, 0, 512, 512);

  // Directional brushed streak lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * 512;
    const h = 1 + Math.random() * 2;
    ctx.fillRect(0, y, 512, h);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let i = 0; i < 300; i++) {
    const y = Math.random() * 512;
    const h = 1 + Math.random() * 2;
    ctx.fillRect(0, y, 512, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createShieldTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark titanium brushed composite base
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#1c2430');
  grad.addColorStop(0.5, '#253040');
  grad.addColorStop(1, '#18202b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Brushed streak texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let i = 0; i < 200; i++) {
    const y = Math.random() * 512;
    ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
  }

  // Structural armor plate seams
  ctx.strokeStyle = '#0f1722';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, 500, 500);
  ctx.beginPath();
  ctx.moveTo(256, 6);
  ctx.lineTo(256, 506);
  ctx.stroke();

  // Carbon-composite reinforcement grid lines
  ctx.strokeStyle = 'rgba(100, 140, 190, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 32; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 6);
    ctx.lineTo(x, 506);
    ctx.stroke();
  }

  // High-contrast hazard caution stripe on leading edge
  const stripeH = 28;
  const stripeW = 20;
  for (let x = 0; x < 512; x += stripeW * 2) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x, 512 - stripeH);
    ctx.lineTo(x + stripeW, 512 - stripeH);
    ctx.lineTo(x + stripeW - 14, 512);
    ctx.lineTo(x - 14, 512);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(x + stripeW, 512 - stripeH);
    ctx.lineTo(x + stripeW * 2, 512 - stripeH);
    ctx.lineTo(x + stripeW * 2 - 14, 512);
    ctx.lineTo(x + stripeW - 14, 512);
    ctx.closePath();
    ctx.fill();
  }

  // Stenciled military/industrial armor insignia
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('⚡ DUNE-VOLT ARMOR', 30, 60);
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
  ctx.fillText('BALLISTIC DEFLECTOR • AUTO-LOCK', 30, 84);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main 3D Solar Farm Scene Class
// ─────────────────────────────────────────────────────────────────────────────

export class SolarFarmScene {
  constructor(containerElement, onPanelSelectCallback) {
    this.container = containerElement;
    this.onPanelSelect = onPanelSelectCallback;
    this.panels = new Map(); // id -> panel entity record
    this.selectedPanelId = 'PV-02';

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.sunMesh = null;
    this.sunGlowMesh = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.stormParticles = null;
    this.cleaningRobot = null;
    this.lidarBeam = null;
    this.terrainMesh = null;
    this.skyMesh = null;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.cameraAngle = { theta: 0.35, phi: 1.15, radius: 24 };
    this.cameraTarget = new THREE.Vector3(0, 1.8, 0);

    this.currentDustVisual = 0.15;
    this.currentStormIntensity = 0;
    this.activeOperatingMode = 'NORMAL';

    // Performance & Quality Controls
    this.qualityMode = 'HIGH'; // 'HIGH' | 'SAVER'
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.onFpsUpdateCallback = null;
    this.resizeObserver = null;

    // Generated Procedural Textures Cache
    this.textures = {
      pv: createPhotovoltaicTexture(),
      pvNormal: createPVNormalMap(),
      sand: createSandTextures(),
      dust: createDustTexture(),
      metal: createBrushedMetalTexture(),
      shield: createShieldTexture()
    };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 500;

    // 1. Scene & Depth Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1422);
    this.scene.fog = new THREE.FogExp2(0xc88f58, 0.007);

    // 2. Perspective Camera with wide desert field of view
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 450);
    this.updateCameraPosition();

    // 3. High-Fidelity WebGL Renderer with Tone Mapping & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.qualityMode === 'HIGH',
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.qualityMode === 'HIGH' ? Math.min(window.devicePixelRatio, 2) : 1);
    this.renderer.shadowMap.enabled = this.qualityMode === 'HIGH';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    // Context Loss Guardrails
    const domEl = this.renderer.domElement;
    domEl.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[3D] WebGL Context Lost — pausing render loop');
    }, false);

    domEl.addEventListener('webglcontextrestored', () => {
      console.info('[3D] WebGL Context Restored — reinitializing');
      this.onWindowResize();
    }, false);

    this.container.appendChild(domEl);

    // 4. Photorealistic Desert Lighting & Directional Shadows
    // Upper Sky & Ground Fill Hemispheric Light
    this.hemiLight = new THREE.HemisphereLight(0xffeed6, 0x8a5b28, 0.55);
    this.scene.add(this.hemiLight);

    // Sky Ambient Light
    this.ambientLight = new THREE.AmbientLight(0x82a5cf, 0.4);
    this.scene.add(this.ambientLight);

    // Primary Solar Directional Light with Crisp Shadows
    this.sunLight = new THREE.DirectionalLight(0xfff7e6, 2.4);
    this.sunLight.castShadow = this.qualityMode === 'HIGH';
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 120;
    const shadowD = 22;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // Sun Solar Disk & Corona Flare Glow
    const sunGeo = new THREE.SphereGeometry(2.0, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    // Atmospheric Solar Halo Sprite
    const haloGeo = new THREE.PlaneGeometry(16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffe28a,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.sunGlowMesh = new THREE.Mesh(haloGeo, haloMat);
    this.scene.add(this.sunGlowMesh);

    // 5. Environment: Smooth Desert Ground & Sky
    this.createDesertTerrain();
    this.createSkyAtmosphere();

    // 6. Photovoltaic Solar Tracker Arrays (3 Units)
    this.createSolarArrays();

    // 7. Atmospheric Storm Particle System
    this.createStormParticles();

    // 8. Waterless Autonomous Cleaning Robot
    this.createCleaningRobot();

    // 9. Interactive Controls & Resize Observer
    this.setupInteractions();

    if (window.ResizeObserver && this.container) {
      this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
      this.resizeObserver.observe(this.container);
    }

    // 10. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createDesertTerrain() {
    // Irregular chaotic desert terrain with layered Perlin noise (no repeating waves)
    const terrainGeo = new THREE.PlaneGeometry(160, 160, 128, 128);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Multi-octave Perlin noise height with chaotic, non-repeating bumps and dips
      const rawHeight = fbmDesertNoise(x, z);

      // Soft leveling around tracker foundation pads (x: -6, 0, 6, z: 0)
      let minPadDist = 999;
      [-6, 0, 6].forEach(px => {
        const dx = (x - px) * 0.8;
        const dz = z * 0.8;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minPadDist) minPadDist = dist;
      });

      // Grade flat right around the foundation pads, blend into natural uneven desert ground
      const blend = Math.max(0, Math.min(1, (minPadDist - 1.6) / 2.2));
      const height = rawHeight * blend - 0.04;

      pos.setY(i, height);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: this.textures.sand.albedoTex,
      normalMap: this.qualityMode === 'HIGH' ? this.textures.sand.normTex : null,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.9,
      metalness: 0.02,
      flatShading: false
    });

    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Weathered Concrete Foundation Pads with chamfers & mounting anchor plates
    [-6, 0, 6].forEach(x => {
      // Main concrete footing
      const padGeo = new THREE.BoxGeometry(2.6, 0.32, 2.6);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x6e747c,
        roughness: 0.9,
        metalness: 0.1
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(x, 0.1, 0);
      pad.receiveShadow = true;
      pad.castShadow = true;
      this.scene.add(pad);

      // Steel Anchor Baseplate
      const plateGeo = new THREE.BoxGeometry(1.2, 0.06, 1.2);
      const plateMat = new THREE.MeshStandardMaterial({
        color: 0x3d434d,
        metalness: 0.8,
        roughness: 0.35
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(x, 0.27, 0);
      plate.receiveShadow = true;
      plate.castShadow = true;
      this.scene.add(plate);
    });
  }

  createSkyAtmosphere() {
    // Sky Dome with realistic desert atmospheric scattering gradient
    const skyGeo = new THREE.SphereGeometry(200, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x152844,
      side: THREE.BackSide
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);
  }

  createSolarArrays() {
    const arrayConfigs = [
      { id: 'PV-01', x: -6, name: 'Sector A - Array 01' },
      { id: 'PV-02', x: 0, name: 'Sector A - Array 02' },
      { id: 'PV-03', x: 6, name: 'Sector B - Array 03' }
    ];

    // PBR Materials
    const brushedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xa0a8b2,
      map: this.textures.metal,
      metalness: 0.85,
      roughness: 0.32
    });

    const darkAnodizedMat = new THREE.MeshStandardMaterial({
      color: 0x1e2734,
      metalness: 0.7,
      roughness: 0.4
    });

    const pvCellMat = new THREE.MeshStandardMaterial({
      map: this.textures.pv,
      normalMap: this.qualityMode === 'HIGH' ? this.textures.pvNormal : null,
      roughness: 0.16,
      metalness: 0.82,
      color: 0x6ca3f0
    });

    arrayConfigs.forEach(cfg => {
      const rootGroup = new THREE.Group();
      rootGroup.position.set(cfg.x, 0, 0);

      // 1. Heavy Galvanized Steel Pedestal Mast
      const mastGeo = new THREE.CylinderGeometry(0.24, 0.32, 2.6, 20);
      const mast = new THREE.Mesh(mastGeo, brushedSteelMat);
      mast.position.y = 1.35;
      mast.castShadow = true;
      mast.receiveShadow = true;
      rootGroup.add(mast);

      // Pedestal Flange Reinforcing Collar
      const collarGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.2, 20);
      const collar = new THREE.Mesh(collarGeo, darkAnodizedMat);
      collar.position.y = 0.4;
      collar.castShadow = true;
      rootGroup.add(collar);

      // Dual-Axis Slew Drive & Gimbal Box
      const gimbalGeo = new THREE.BoxGeometry(0.8, 0.65, 0.65);
      const gimbal = new THREE.Mesh(gimbalGeo, darkAnodizedMat);
      gimbal.position.y = 2.65;
      gimbal.castShadow = true;
      gimbal.receiveShadow = true;
      rootGroup.add(gimbal);

      // Actuator motor cylinder
      const motorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.5, 16);
      motorGeo.rotateZ(Math.PI / 2);
      const motor = new THREE.Mesh(motorGeo, brushedSteelMat);
      motor.position.set(0.45, 2.65, 0);
      motor.castShadow = true;
      rootGroup.add(motor);

      // 2. Rotating Array Head Assembly
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.65, 0);

      // Heavy Structural Torque Tube (Horizontal Rotational Spine)
      const torqueTubeGeo = new THREE.CylinderGeometry(0.14, 0.14, 6.0, 16);
      torqueTubeGeo.rotateZ(Math.PI / 2);
      const torqueTube = new THREE.Mesh(torqueTubeGeo, brushedSteelMat);
      torqueTube.castShadow = true;
      torqueTube.receiveShadow = true;
      headGroup.add(torqueTube);

      // Rear Reinforcing Truss Struts (W-truss backing)
      [-1.8, 0, 1.8].forEach(sx => {
        const strutGeo = new THREE.BoxGeometry(0.08, 0.08, 3.1);
        const strut = new THREE.Mesh(strutGeo, darkAnodizedMat);
        strut.position.set(sx, -0.1, 0);
        strut.castShadow = true;
        headGroup.add(strut);
      });

      // Photovoltaic Panel Aluminum Frame (5.4m x 3.2m)
      const frameGeo = new THREE.BoxGeometry(5.4, 0.12, 3.2);
      const frameMesh = new THREE.Mesh(frameGeo, darkAnodizedMat);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      headGroup.add(frameMesh);

      // High-Fidelity Photovoltaic Silicon Face
      const cellGeo = new THREE.PlaneGeometry(5.24, 3.04);
      cellGeo.rotateX(-Math.PI / 2);
      const cellMesh = new THREE.Mesh(cellGeo, pvCellMat);
      cellMesh.position.y = 0.065;
      cellMesh.receiveShadow = true;
      cellMesh.userData = { panelId: cfg.id };
      headGroup.add(cellMesh);

      // Real-Time Dynamic Dust Layer (Procedural Graded Deposition)
      const dustGeo = new THREE.PlaneGeometry(5.24, 3.04);
      dustGeo.rotateX(-Math.PI / 2);
      const dustMat = new THREE.MeshStandardMaterial({
        map: this.textures.dust,
        color: 0xcca068,
        roughness: 0.98,
        metalness: 0.0,
        transparent: true,
        opacity: 0.15,
        depthWrite: false
      });
      const dustMesh = new THREE.Mesh(dustGeo, dustMat);
      dustMesh.position.y = 0.072;
      headGroup.add(dustMesh);

      // ─────────────────────────────────────────────────────────────────────────
      // Phase 3a: Deployable Ballistic Sand Deflector Shields (Dual-Wing Shells)
      // ─────────────────────────────────────────────────────────────────────────
      const shieldMat = new THREE.MeshStandardMaterial({
        map: this.textures.shield,
        color: 0xa4b0c2,
        metalness: 0.86,
        roughness: 0.28
      });
      const shieldTrimMat = new THREE.MeshStandardMaterial({
        color: 0x141b24,
        metalness: 0.92,
        roughness: 0.22
      });

      // Top Motorized Deflector Shield Wing
      const topShieldGroup = new THREE.Group();
      const topPlateGeo = new THREE.BoxGeometry(5.24, 0.035, 1.52);
      const topPlate = new THREE.Mesh(topPlateGeo, shieldMat);
      topPlate.castShadow = true;
      topPlate.receiveShadow = true;
      topShieldGroup.add(topPlate);

      // Longitudinal Titanium Reinforcing Ribs (Top Wing)
      [-1.8, -0.6, 0.6, 1.8].forEach(rx => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 1.50), shieldTrimMat);
        rib.position.set(rx, 0.012, 0);
        rib.castShadow = true;
        topShieldGroup.add(rib);
      });
      // Retracted position tucked into top frame cowl
      topShieldGroup.position.set(0, 0.088, -2.3);
      headGroup.add(topShieldGroup);

      // Bottom Motorized Deflector Shield Wing
      const bottomShieldGroup = new THREE.Group();
      const bottomPlateGeo = new THREE.BoxGeometry(5.24, 0.035, 1.52);
      const bottomPlate = new THREE.Mesh(bottomPlateGeo, shieldMat);
      bottomPlate.castShadow = true;
      bottomPlate.receiveShadow = true;
      bottomShieldGroup.add(bottomPlate);

      // Longitudinal Titanium Reinforcing Ribs (Bottom Wing)
      [-1.8, -0.6, 0.6, 1.8].forEach(rx => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 1.50), shieldTrimMat);
        rib.position.set(rx, 0.012, 0);
        rib.castShadow = true;
        bottomShieldGroup.add(rib);
      });
      // Retracted position tucked into bottom frame cowl
      bottomShieldGroup.position.set(0, 0.088, 2.3);
      headGroup.add(bottomShieldGroup);

      // Interlocking Center Seam Magnetic Hydraulic Lock Indicator (Glows Amber upon Lock)
      const lockGeo = new THREE.BoxGeometry(5.24, 0.045, 0.06);
      const lockMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0
      });
      const centerLockMesh = new THREE.Mesh(lockGeo, lockMat);
      centerLockMesh.position.set(0, 0.098, 0);
      centerLockMesh.visible = false;
      headGroup.add(centerLockMesh);

      // Multi-State Status Indicator Beacon (RGB LED)
      const ledGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(2.48, 0.12, 1.45);
      headGroup.add(ledMesh);

      // Interactive Selection Halo
      const haloGeo = new THREE.RingGeometry(2.3, 2.5, 48);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: cfg.id === this.selectedPanelId ? 0.95 : 0
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(0, 0.18, 0);
      rootGroup.add(haloMesh);

      rootGroup.add(headGroup);
      this.scene.add(rootGroup);

      this.panels.set(cfg.id, {
        rootGroup,
        headGroup,
        cellMesh,
        dustMesh,
        ledMesh,
        haloMesh,
        topShieldGroup,
        bottomShieldGroup,
        centerLockMesh,
        targetTilt: 40,
        targetAzimuth: 180,
        currentTilt: 40,
        currentAzimuth: 180,
        targetShieldDeploy: 0,
        currentShieldDeploy: 0
      });
    });
  }

  createStormParticles() {
    const particleCount = this.qualityMode === 'HIGH' ? 3200 : 900;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = Math.random() * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;

      velocities[i * 3] = 14 + Math.random() * 26;       // Horizontal gale wind
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 3; // Swirling vertical turbulence
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.userData = { velocities };

    const mat = new THREE.PointsMaterial({
      color: 0xdeb076,
      size: this.qualityMode === 'HIGH' ? 0.22 : 0.14,
      transparent: true,
      opacity: 0.06,
      blending: THREE.NormalBlending
    });

    this.stormParticles = new THREE.Points(geo, mat);
    this.scene.add(this.stormParticles);
  }

  createCleaningRobot() {
    // High-Fidelity Autonomous Waterless Cleaning Carriage
    this.cleaningRobot = new THREE.Group();

    // Main robot chassis beam
    const beamGeo = new THREE.BoxGeometry(0.36, 0.24, 3.12);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.65,
      roughness: 0.35
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 0.14;
    beam.castShadow = true;
    this.cleaningRobot.add(beam);

    // Dual Microfiber Helical Cleaning Rollers
    const brushGeo = new THREE.CylinderGeometry(0.11, 0.11, 3.04, 16);
    const brushMat = new THREE.MeshStandardMaterial({
      color: 0x242c38,
      roughness: 0.96
    });

    const brush1 = new THREE.Mesh(brushGeo, brushMat);
    brush1.position.set(-0.18, 0.09, 0);
    this.cleaningRobot.add(brush1);

    const brush2 = new THREE.Mesh(brushGeo, brushMat);
    brush2.position.set(0.18, 0.09, 0);
    this.cleaningRobot.add(brush2);

    // Optical Inspection Lidar Beacon (Cyan)
    const beaconGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 0.3, 0);
    this.cleaningRobot.add(beacon);

    // Active Lidar Scanning Fan Laser (Projected down onto panel)
    const lidarGeo = new THREE.PlaneGeometry(0.4, 2.9);
    lidarGeo.rotateX(-Math.PI / 2);
    const lidarMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.lidarBeam = new THREE.Mesh(lidarGeo, lidarMat);
    this.lidarBeam.position.set(0, 0.075, 0);
    this.cleaningRobot.add(this.lidarBeam);

    this.cleaningRobot.visible = false;

    // Attach to Sector A - Array 02 head by default
    const pv2 = this.panels.get('PV-02');
    if (pv2) {
      pv2.headGroup.add(this.cleaningRobot);
    }
  }

  setupInteractions() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.prevMousePos.x;
        const deltaY = e.clientY - this.prevMousePos.y;

        this.cameraAngle.theta -= deltaX * 0.007;
        this.cameraAngle.phi = Math.max(0.15, Math.min(Math.PI / 2.05, this.cameraAngle.phi - deltaY * 0.007));

        this.prevMousePos = { x: e.clientX, y: e.clientY };
        this.updateCameraPosition();
      }
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraAngle.radius = Math.max(10, Math.min(55, this.cameraAngle.radius + e.deltaY * 0.02));
      this.updateCameraPosition();
    }, { passive: false });

    // Click selection via Raycasting
    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const interactables = [];
      this.panels.forEach(p => interactables.push(p.cellMesh));

      const intersects = this.raycaster.intersectObjects(interactables);
      if (intersects.length > 0) {
        const hitPanelId = intersects[0].object.userData.panelId;
        if (hitPanelId) {
          this.selectPanel(hitPanelId);
          if (this.onPanelSelect) this.onPanelSelect(hitPanelId);
        }
      }
    });

    window.addEventListener('resize', () => this.onWindowResize());
  }

  selectPanel(panelId) {
    this.selectedPanelId = panelId;
    this.panels.forEach((p, id) => {
      if (p.haloMesh) {
        p.haloMesh.material.opacity = id === panelId ? 0.95 : 0;
      }
    });
  }

  setCameraPreset(preset) {
    if (preset === 'overview') {
      this.cameraAngle = { theta: 0.35, phi: 1.15, radius: 24 };
      this.cameraTarget.set(0, 1.8, 0);
    } else if (preset === 'closeup') {
      const p = this.panels.get(this.selectedPanelId || 'PV-02');
      const targetX = p ? p.rootGroup.position.x : 0;
      this.cameraAngle = { theta: 0.2, phi: 1.3, radius: 11 };
      this.cameraTarget.set(targetX, 2.6, 0);
    } else if (preset === 'side') {
      this.cameraAngle = { theta: Math.PI / 2, phi: 1.25, radius: 20 };
      this.cameraTarget.set(0, 2.0, 0);
    }
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    const x = this.cameraTarget.x + this.cameraAngle.radius * Math.sin(this.cameraAngle.phi) * Math.sin(this.cameraAngle.theta);
    const y = this.cameraTarget.y + this.cameraAngle.radius * Math.cos(this.cameraAngle.phi);
    const z = this.cameraTarget.z + this.cameraAngle.radius * Math.sin(this.cameraAngle.phi) * Math.cos(this.cameraAngle.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  onWindowResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Update State Hook from Central State Manager
  updateFromState(state) {
    if (!state) return;
    const { environment, farm, panels, maintenance } = state;

    this.activeOperatingMode = farm.operatingMode;
    this.currentDustVisual = environment.dustLevel / 100;
    this.currentStormIntensity = environment.stormIntensity / 100;

    // 1. Dynamic Sun Position, Lighting Color, & Corona Flare
    const sunElevationRad = (environment.sunAngle * Math.PI) / 180;
    const sunAzimuthRad = (environment.sunAzimuth * Math.PI) / 180;
    const sunDist = 75;

    const sunX = sunDist * Math.cos(sunElevationRad) * Math.sin(sunAzimuthRad);
    const sunY = Math.max(3.5, sunDist * Math.sin(sunElevationRad));
    const sunZ = -sunDist * Math.cos(sunElevationRad) * Math.cos(sunAzimuthRad);

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunGlowMesh.position.set(sunX, sunY, sunZ);
    this.sunGlowMesh.lookAt(this.camera.position);

    // Dynamic solar color temperature
    if (environment.sunAngle < 22) {
      this.sunLight.color.setHex(0xff6e30);
      this.ambientLight.color.setHex(0x5c3320);
      this.hemiLight.color.setHex(0xffaa66);
      this.scene.fog.color.setHex(0xa66538);
      this.skyMesh.material.color.setHex(0x281822);
    } else if (environment.sunAngle < 45) {
      this.sunLight.color.setHex(0xffba55);
      this.ambientLight.color.setHex(0x6e809e);
      this.hemiLight.color.setHex(0xffddaa);
      this.scene.fog.color.setHex(0xc88f58);
      this.skyMesh.material.color.setHex(0x1a2438);
    } else {
      this.sunLight.color.setHex(0xfff7e6);
      this.ambientLight.color.setHex(0x82a5cf);
      this.hemiLight.color.setHex(0xffeed6);
      this.scene.fog.color.setHex(0xd09a65);
      this.skyMesh.material.color.setHex(0x152844);
    }

    // 2. Update Panels (Orientation, Shield Deployment, Dust Deposition, Status LEDs)
    panels.forEach(pData => {
      const panel = this.panels.get(pData.id);
      if (panel) {
        panel.targetTilt = pData.tilt;
        panel.targetAzimuth = pData.azimuth;

        // Phase 3a/3b: Synchronize Shield Target Deployment
        const deployVal = pData.shieldDeploy !== undefined
          ? pData.shieldDeploy
          : (pData.state === 'PROTECTED' || this.activeOperatingMode === 'STORM' ? 100 : (pData.state === 'PROTECTING' ? 60 : 0));
        panel.targetShieldDeploy = Math.max(0, Math.min(100, deployVal)) / 100;

        // Realistic non-linear dust opacity
        const dustOpacity = Math.max(0.04, Math.min(0.92, Math.pow(pData.dust / 100, 0.85) * 0.9));
        panel.dustMesh.material.opacity = dustOpacity;

        // Status LED Indicator & Defensive Strobes
        if (pData.faultStatus && pData.faultStatus !== 'NONE') {
          panel.ledMesh.material.color.setHex(0xef4444); // Critical Fault
        } else if (panel.targetShieldDeploy >= 0.95 || pData.state === 'PROTECTED' || this.activeOperatingMode === 'STORM') {
          panel.ledMesh.material.color.setHex(0xf59e0b); // Defensive Locked Radiant Gold
        } else if (panel.targetShieldDeploy > 0 || pData.state === 'PROTECTING' || this.activeOperatingMode === 'WARNING') {
          panel.ledMesh.material.color.setHex(0xf59e0b); // Warning Stow Strobe
        } else if (pData.state === 'CLEANING') {
          panel.ledMesh.material.color.setHex(0x06b6d4); // Autonomous Sweep
        } else {
          panel.ledMesh.material.color.setHex(0x10b981); // Nominal Tracking
        }
      }
    });

    // 3. Waterless Cleaning Robot Animation & Laser Sweep
    if (maintenance.cleaningRobotActive && this.cleaningRobot) {
      this.cleaningRobot.visible = true;
      // Sweep traverse across panel width (-2.2m to +2.2m)
      const sweepX = -2.2 + (maintenance.cleaningProgress / 100) * 4.4;
      this.cleaningRobot.position.x = sweepX;
    } else if (this.cleaningRobot) {
      this.cleaningRobot.visible = false;
    }

    // 4. Atmospheric Storm Visuals & Fog Attenuation
    if (this.activeOperatingMode === 'STORM' || this.currentStormIntensity > 0.1) {
      this.stormParticles.material.opacity = 0.65 + this.currentStormIntensity * 0.35;
      this.scene.fog.density = 0.02 + this.currentStormIntensity * 0.06;
      this.scene.fog.color.setHex(0xb87840);
      this.sunLight.intensity = Math.max(0.25, 2.4 * (1 - this.currentStormIntensity * 0.85));
    } else {
      this.stormParticles.material.opacity = 0.06;
      this.scene.fog.density = 0.007;
      this.sunLight.intensity = 2.4;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Smooth Mechanical Rotation & Shield Lerping
    this.panels.forEach(panel => {
      // Smooth tilt lerping
      panel.currentTilt += (panel.targetTilt - panel.currentTilt) * 0.085;
      const tiltRad = (panel.currentTilt * Math.PI) / 180;
      panel.headGroup.rotation.x = tiltRad;

      // Phase 3a/3b: Smooth Shield Deployment Lerping
      panel.currentShieldDeploy += (panel.targetShieldDeploy - panel.currentShieldDeploy) * 0.09;
      const s = Math.max(0, Math.min(1.0, panel.currentShieldDeploy));

      // Top shield moves from -2.3 (retracted) to -0.76 (fully deployed)
      if (panel.topShieldGroup) {
        panel.topShieldGroup.position.z = -2.3 + s * 1.54;
      }
      // Bottom shield moves from +2.3 (retracted) to +0.76 (fully deployed)
      if (panel.bottomShieldGroup) {
        panel.bottomShieldGroup.position.z = 2.3 - s * 1.54;
      }

      // Center magnetic hydraulic lock seal glow when locked
      if (panel.centerLockMesh) {
        if (s >= 0.90) {
          panel.centerLockMesh.visible = true;
          panel.centerLockMesh.material.opacity = ((s - 0.90) / 0.10) * 0.95;
        } else {
          panel.centerLockMesh.visible = false;
        }
      }

      // Choreographed Warning Strobes & Lock Lighting
      if (panel.ledMesh) {
        const isFault = panel.ledMesh.material.color.getHex() === 0xef4444;
        const isDeploying = panel.targetShieldDeploy > 0 && s < 0.95;
        const isLocked = s >= 0.95 || panel.targetShieldDeploy >= 0.95;

        if (isFault) {
          panel.ledMesh.scale.setScalar(1.0 + Math.sin(Date.now() * 0.009) * 0.38);
        } else if (isDeploying) {
          // Rapid amber strobe at 5Hz during active stowing
          const strobe = (Math.floor(Date.now() / 150) % 2 === 0);
          panel.ledMesh.material.color.setHex(strobe ? 0xf59e0b : 0x78350f);
          panel.ledMesh.scale.setScalar(strobe ? 1.45 : 0.85);
        } else if (isLocked) {
          // Solid radiant lock beacon
          panel.ledMesh.material.color.setHex(0xf59e0b);
          panel.ledMesh.scale.setScalar(1.3);
        } else {
          panel.ledMesh.scale.setScalar(1.0);
        }
      }
    });

    // Atmospheric Storm Particles Swirl Simulation
    if (this.stormParticles) {
      const posAttr = this.stormParticles.geometry.attributes.position;
      const positions = posAttr.array;
      const vels = this.stormParticles.geometry.userData.velocities;
      const isStorm = this.activeOperatingMode === 'STORM';
      const speedMult = isStorm ? 2.5 : 0.65;

      for (let i = 0; i < posAttr.count; i++) {
        positions[i * 3] += vels[i * 3] * 0.016 * speedMult;
        positions[i * 3 + 1] += vels[i * 3 + 1] * 0.016 * speedMult;
        positions[i * 3 + 2] += vels[i * 3 + 2] * 0.016 * speedMult;

        // Wrap around boundary limits
        if (positions[i * 3] > 45) positions[i * 3] = -45;
        if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 16;
        if (positions[i * 3 + 1] > 18) positions[i * 3 + 1] = 0;
        if (positions[i * 3 + 2] > 45) positions[i * 3 + 2] = -45;
        if (positions[i * 3 + 2] < -45) positions[i * 3 + 2] = 45;
      }
      posAttr.needsUpdate = true;
    }

    // Laser Beam Pulse Animation
    if (this.lidarBeam && this.cleaningRobot && this.cleaningRobot.visible) {
      this.lidarBeam.material.opacity = 0.35 + Math.sin(Date.now() * 0.012) * 0.25;
    }

    // FPS Calculation & Performance Telemetry
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsTime;
    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;
      if (this.onFpsUpdateCallback) {
        this.onFpsUpdateCallback(this.fps, this.qualityMode);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  setFpsCallback(callback) {
    this.onFpsUpdateCallback = callback;
  }

  setQualityMode(mode) {
    if (mode !== 'HIGH' && mode !== 'SAVER') return;
    this.qualityMode = mode;
    if (!this.renderer) return;

    if (mode === 'SAVER') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      if (this.sunLight) this.sunLight.castShadow = false;
      if (this.stormParticles) this.stormParticles.material.size = 0.14;
      if (this.terrainMesh && this.terrainMesh.material) {
        this.terrainMesh.material.normalMap = null;
        this.terrainMesh.material.needsUpdate = true;
      }
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      if (this.sunLight) this.sunLight.castShadow = true;
      if (this.stormParticles) this.stormParticles.material.size = 0.22;
      if (this.terrainMesh && this.terrainMesh.material) {
        this.terrainMesh.material.normalMap = this.textures.sand.normTex;
        this.terrainMesh.material.needsUpdate = true;
      }
    }
  }
}

// Named alias for flexible import compatibility
export const Scene3D = SolarFarmScene;

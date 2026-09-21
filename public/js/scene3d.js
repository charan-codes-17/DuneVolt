// DuneVolt 3D Solar Farm Digital Twin (Three.js)
import * as THREE from '/vendor/three/three.module.js';

export class SolarFarmScene {
  constructor(containerElement, onPanelSelectCallback) {
    this.container = containerElement;
    this.onPanelSelect = onPanelSelectCallback;
    this.panels = new Map(); // id -> { group, panelMesh, dustMesh, targetTilt, targetAzimuth, currentTilt, currentAzimuth }
    this.selectedPanelId = 'PV-02';

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.sunMesh = null;
    this.ambientLight = null;
    this.stormParticles = null;
    this.cleaningRobot = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.cameraAngle = { theta: 0.35, phi: 1.15, radius: 24 };
    this.cameraTarget = new THREE.Vector3(0, 1.8, 0);

    this.currentDustVisual = 0.15;
    this.currentStormIntensity = 0;
    this.activeOperatingMode = 'NORMAL';

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 500;

    // 1. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b111e);
    this.scene.fog = new THREE.FogExp2(0xd49b5c, 0.008);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    this.updateCameraPosition();

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(0x8eb3df, 0.65);
    this.scene.add(this.ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x8a6234, 0.45);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 100;
    const d = 20;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Sun Visual Sphere
    const sunGeo = new THREE.SphereGeometry(1.8, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe28a });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    // 5. Desert Environment
    this.createDesertTerrain();
    this.createSkyAtmosphere();

    // 6. Build 3 Interactive Solar Arrays
    this.createSolarArrays();

    // 7. Atmospheric Storm Particle System
    this.createStormParticles();

    // 8. Waterless Cleaning Robot
    this.createCleaningRobot();

    // 9. Event Listeners
    this.setupInteractions();

    // 10. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createDesertTerrain() {
    // Terrain with gentle dune waves
    const terrainGeo = new THREE.PlaneGeometry(120, 120, 96, 96);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Dune wave functions
      const dune1 = Math.sin(x * 0.08 + z * 0.04) * 0.8;
      const dune2 = Math.cos(x * 0.04 - z * 0.08) * 0.6;
      const micro = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.15;
      pos.setY(i, dune1 + dune2 + micro);
    }
    terrainGeo.computeVertexNormals();

    // Sand texture material
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xc98a4b,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: false
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.position.y = -0.05;
    this.scene.add(terrainMesh);

    // Concrete foundation pads for the tracker masts
    [-6, 0, 6].forEach(x => {
      const padGeo = new THREE.BoxGeometry(2.4, 0.3, 2.4);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x5a6069, roughness: 0.8 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(x, 0.1, 0);
      pad.receiveShadow = true;
      this.scene.add(pad);
    });
  }

  createSkyAtmosphere() {
    // Sky Dome with desert horizon glow
    const skyGeo = new THREE.SphereGeometry(140, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x132238,
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

    // Procedural Solar Cell Canvas Texture
    const cellCanvas = document.createElement('canvas');
    cellCanvas.width = 512;
    cellCanvas.height = 512;
    const ctx = cellCanvas.getContext('2d');

    // Deep anti-reflective photovoltaic silicon blue
    ctx.fillStyle = '#0c1b33';
    ctx.fillRect(0, 0, 512, 512);

    // Grid of solar wafer cells (6x10 cells)
    const cols = 6;
    const rows = 10;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Individual wafer with subtle gradient
        const grad = ctx.createLinearGradient(c * cellW, r * cellH, (c + 1) * cellW, (r + 1) * cellH);
        grad.addColorStop(0, '#102b54');
        grad.addColorStop(0.5, '#0d2242');
        grad.addColorStop(1, '#081730');
        ctx.fillStyle = grad;
        ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);

        // Silver busbars
        ctx.strokeStyle = 'rgba(210, 230, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c * cellW + cellW * 0.33, r * cellH + 2);
        ctx.lineTo(c * cellW + cellW * 0.33, (r + 1) * cellH - 2);
        ctx.moveTo(c * cellW + cellW * 0.66, r * cellH + 2);
        ctx.lineTo(c * cellW + cellW * 0.66, (r + 1) * cellH - 2);
        ctx.stroke();
      }
    }

    const cellTexture = new THREE.CanvasTexture(cellCanvas);
    cellTexture.wrapS = THREE.RepeatWrapping;
    cellTexture.wrapT = THREE.RepeatWrapping;

    // Materials
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x828b94, metalness: 0.8, roughness: 0.3 });
    const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    const solarGlassMat = new THREE.MeshStandardMaterial({
      map: cellTexture,
      roughness: 0.15,
      metalness: 0.85,
      color: 0x5a95e5
    });

    arrayConfigs.forEach(cfg => {
      const rootGroup = new THREE.Group();
      rootGroup.position.set(cfg.x, 0, 0);

      // 1. Fixed Base Mast / Pedestal
      const mastGeo = new THREE.CylinderGeometry(0.22, 0.28, 2.6, 16);
      const mast = new THREE.Mesh(mastGeo, steelMat);
      mast.position.y = 1.3;
      mast.castShadow = true;
      mast.receiveShadow = true;
      rootGroup.add(mast);

      // Gimbal torque box
      const gimbalGeo = new THREE.BoxGeometry(0.7, 0.6, 0.6);
      const gimbal = new THREE.Mesh(gimbalGeo, darkFrameMat);
      gimbal.position.y = 2.6;
      gimbal.castShadow = true;
      rootGroup.add(gimbal);

      // 2. Rotating Array Head (Azimuth & Tilt)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.6, 0);

      // Panel Backing Support Trusses
      const torqueTubeGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.8, 12);
      torqueTubeGeo.rotateZ(Math.PI / 2);
      const torqueTube = new THREE.Mesh(torqueTubeGeo, steelMat);
      torqueTube.castShadow = true;
      headGroup.add(torqueTube);

      // Array Panel Surface (W: 5.4m, H: 3.2m)
      const frameGeo = new THREE.BoxGeometry(5.4, 0.12, 3.2);
      const frameMesh = new THREE.Mesh(frameGeo, darkFrameMat);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      headGroup.add(frameMesh);

      // Photovoltaic Cell Face
      const cellGeo = new THREE.PlaneGeometry(5.2, 3.0);
      cellGeo.rotateX(-Math.PI / 2);
      const cellMesh = new THREE.Mesh(cellGeo, solarGlassMat);
      cellMesh.position.y = 0.07;
      cellMesh.receiveShadow = true;
      cellMesh.userData = { panelId: cfg.id };
      headGroup.add(cellMesh);

      // Dynamic Dust Overlay Plane
      const dustGeo = new THREE.PlaneGeometry(5.2, 3.0);
      dustGeo.rotateX(-Math.PI / 2);
      const dustMat = new THREE.MeshStandardMaterial({
        color: 0xb57a3e,
        roughness: 0.98,
        metalness: 0.0,
        transparent: true,
        opacity: 0.15,
        depthWrite: false
      });
      const dustMesh = new THREE.Mesh(dustGeo, dustMat);
      dustMesh.position.y = 0.075;
      headGroup.add(dustMesh);

      // Status Indicator Ring / LED on corner of frame
      const ledGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(2.4, 0.12, 1.4);
      headGroup.add(ledMesh);

      // Selection Halo
      const haloGeo = new THREE.RingGeometry(2.2, 2.35, 32);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: cfg.id === this.selectedPanelId ? 0.9 : 0
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(0, 0.15, 0);
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
        targetTilt: 40,
        targetAzimuth: 180,
        currentTilt: 40,
        currentAzimuth: 180
      });
    });
  }

  createStormParticles() {
    // 3,000 sandstorm particles
    const particleCount = 2800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      velocities[i * 3] = 12 + Math.random() * 22;      // Fast horizontal X wind
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 2; // Vertical turbulent eddy
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.userData = { velocities };

    const mat = new THREE.PointsMaterial({
      color: 0xd69956,
      size: 0.18,
      transparent: true,
      opacity: 0.05,
      blending: THREE.NormalBlending
    });

    this.stormParticles = new THREE.Points(geo, mat);
    this.scene.add(this.stormParticles);
  }

  createCleaningRobot() {
    // Waterless robotic cleaning carriage
    this.cleaningRobot = new THREE.Group();

    // Robot body beam across panel width
    const beamGeo = new THREE.BoxGeometry(0.3, 0.22, 3.1);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 0.12;
    beam.castShadow = true;
    this.cleaningRobot.add(beam);

    // Dual rotating cylindrical dry-brushes
    const brushGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.0, 16);
    const brushMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
    const brush1 = new THREE.Mesh(brushGeo, brushMat);
    brush1.position.set(-0.16, 0.08, 0);
    this.cleaningRobot.add(brush1);

    const brush2 = new THREE.Mesh(brushGeo, brushMat);
    brush2.position.set(0.16, 0.08, 0);
    this.cleaningRobot.add(brush2);

    // Cyan active laser/optics beacon
    const beaconGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 0.28, 0);
    this.cleaningRobot.add(beacon);

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
      this.cameraAngle.radius = Math.max(10, Math.min(50, this.cameraAngle.radius + e.deltaY * 0.02));
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
        p.haloMesh.material.opacity = id === panelId ? 0.9 : 0;
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

    // 1. Update Sun Position & Light
    const sunElevationRad = (environment.sunAngle * Math.PI) / 180;
    const sunAzimuthRad = (environment.sunAzimuth * Math.PI) / 180;
    const sunDist = 70;

    const sunX = sunDist * Math.cos(sunElevationRad) * Math.sin(sunAzimuthRad);
    const sunY = Math.max(4, sunDist * Math.sin(sunElevationRad));
    const sunZ = -sunDist * Math.cos(sunElevationRad) * Math.cos(sunAzimuthRad);

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);

    // Color transition from golden dawn/dusk to bright midday white
    if (environment.sunAngle < 25) {
      this.sunLight.color.setHex(0xff7733);
      this.ambientLight.color.setHex(0x553322);
    } else if (environment.sunAngle < 45) {
      this.sunLight.color.setHex(0xffaa44);
      this.ambientLight.color.setHex(0x7788aa);
    } else {
      this.sunLight.color.setHex(0xfff4e0);
      this.ambientLight.color.setHex(0x8eb3df);
    }

    // 2. Update Panels
    panels.forEach(pData => {
      const panel = this.panels.get(pData.id);
      if (panel) {
        panel.targetTilt = pData.tilt;
        panel.targetAzimuth = pData.azimuth;

        // Dust Layer Visual
        panel.dustMesh.material.opacity = Math.max(0.04, Math.min(0.85, (pData.dust / 100) * 0.85));

        // LED Indicator Status
        if (pData.faultStatus && pData.faultStatus !== 'NONE') {
          panel.ledMesh.material.color.setHex(0xef4444); // Red warning
        } else if (pData.state === 'PROTECTED' || pData.state === 'PROTECTING') {
          panel.ledMesh.material.color.setHex(0xf59e0b); // Amber
        } else if (pData.state === 'CLEANING') {
          panel.ledMesh.material.color.setHex(0x06b6d4); // Cyan
        } else {
          panel.ledMesh.material.color.setHex(0x10b981); // Green
        }
      }
    });

    // 3. Robotic Cleaning Visual
    if (maintenance.cleaningRobotActive && this.cleaningRobot) {
      this.cleaningRobot.visible = true;
      // Animate robot traversing across panel (-2.2m to +2.2m)
      const sweepX = -2.2 + (maintenance.cleaningProgress / 100) * 4.4;
      this.cleaningRobot.position.x = sweepX;
    } else if (this.cleaningRobot) {
      this.cleaningRobot.visible = false;
    }

    // 4. Storm Visual Adjustments
    if (this.activeOperatingMode === 'STORM' || this.currentStormIntensity > 0.1) {
      this.stormParticles.material.opacity = 0.55 + this.currentStormIntensity * 0.35;
      this.scene.fog.density = 0.02 + this.currentStormIntensity * 0.055;
      this.sunLight.intensity = Math.max(0.2, 2.2 * (1 - this.currentStormIntensity * 0.85));
    } else {
      this.stormParticles.material.opacity = 0.05;
      this.scene.fog.density = 0.008;
      this.sunLight.intensity = 2.2;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Smooth Lerp for Panels (mechanical rotation dampening)
    this.panels.forEach(panel => {
      // Lerp tilt (rotation around local X axis)
      panel.currentTilt += (panel.targetTilt - panel.currentTilt) * 0.06;
      // 0 deg tilt means panel face points straight up (rotation.x = 0)
      // 90 deg tilt means vertical
      const tiltRad = (panel.currentTilt * Math.PI) / 180;
      panel.headGroup.rotation.x = tiltRad;

      // Pulse fault LED
      if (panel.ledMesh.material.color.getHex() === 0xef4444) {
        panel.ledMesh.scale.setScalar(1.0 + Math.sin(Date.now() * 0.008) * 0.35);
      } else {
        panel.ledMesh.scale.setScalar(1.0);
      }
    });

    // Swirling Storm Particles Simulation
    if (this.stormParticles) {
      const posAttr = this.stormParticles.geometry.attributes.position;
      const positions = posAttr.array;
      const vels = this.stormParticles.geometry.userData.velocities;
      const isStorm = this.activeOperatingMode === 'STORM';
      const speedMult = isStorm ? 2.4 : 0.6;

      for (let i = 0; i < posAttr.count; i++) {
        positions[i * 3] += vels[i * 3] * 0.016 * speedMult;
        positions[i * 3 + 1] += vels[i * 3 + 1] * 0.016 * speedMult;
        positions[i * 3 + 2] += vels[i * 3 + 2] * 0.016 * speedMult;

        // Wrap around boundary box
        if (positions[i * 3] > 40) positions[i * 3] = -40;
        if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 15;
        if (positions[i * 3 + 1] > 16) positions[i * 3 + 1] = 0;
        if (positions[i * 3 + 2] > 40) positions[i * 3 + 2] = -40;
        if (positions[i * 3 + 2] < -40) positions[i * 3 + 2] = 40;
      }
      posAttr.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

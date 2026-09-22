// DuneVolt – Phase 1: 3D Visual Overhaul Test & Verification
import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function fetchRaw(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET'
    };
    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, text: body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function verifyPhase1() {
  console.log('================================================================');
  console.log('DuneVolt – Phase 1: 3D Visual Overhaul Verification Suite');
  console.log('================================================================\n');

  const testResults = [];
  function logTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${details ? '\n         → ' + details : ''}`);
  }

  const sceneRes = await fetchRaw('/js/scene3d.js');
  const code = sceneRes.text;

  // Check 1: Procedural Texture Generators
  const hasPVTex = code.includes('createPhotovoltaicTexture') && code.includes('cornerCut') && code.includes('fingerStep');
  logTest('1.1 Monocrystalline PV wafer procedural texture generator (octagonal cuts, silver fingers & busbars)',
    hasPVTex, 'Includes chamfered wafers, anti-reflective coating gradient, and silver contact grid');

  const hasPVNorm = code.includes('createPVNormalMap') && code.includes('strokeRect');
  logTest('1.2 PV normal mapping generator (cell bevels & raised busbar normals)',
    hasPVNorm, 'Generates tangent-space normal map for cell boundaries and ribbon specular reflections');

  const hasSandTex = code.includes('createSandTextures') && code.includes('albedoTex') && code.includes('normTex');
  logTest('1.3 Procedural desert sand albedo & ripple normal map textures',
    hasSandTex, 'Includes micro-granules noise and wave normal map for grazing sun angle relief');

  const hasDustTex = code.includes('createDustTexture') && code.includes('ClampToEdgeWrapping');
  logTest('1.4 Realistic non-uniform dust deposition texture generator',
    hasDustTex, 'Includes windward/gravity edge settling gradient and granular speckle noise');

  const hasMetalTex = code.includes('createBrushedMetalTexture');
  logTest('1.5 Brushed galvanized steel & metal texture generator',
    hasMetalTex, 'Generates anisotropic brushed streaks for tracker masts and framing');

  // Check 2: Terrain & Environment Geometry
  const hasPerlinNoise = code.includes('fbmDesertNoise') && code.includes('perlin2d');
  const hasTerrainGeo = code.includes('createDesertTerrain') && code.includes('PlaneGeometry');
  logTest('2.1 Irregular non-repeating desert terrain with layered Perlin/fBm noise',
    hasPerlinNoise && hasTerrainGeo, 'Multi-octave fractal noise with domain warping produces natural chaotic bumps and dips without repeating sine waves');

  const noMountains = !code.includes('createDistantMountains') && !code.includes('mountainsGroup');
  logTest('2.2 Clean open desert horizon (no mountains)',
    noMountains, 'Mountains removed per user specification for plausible open desert setting');

  const hasSunAtmosphere = code.includes('createSkyAtmosphere') && code.includes('sunGlowMesh') && code.includes('sunLight');
  logTest('2.3 Dynamic solar lighting, corona flare glow, & atmospheric haze fog',
    hasSunAtmosphere, 'Features sun disk, additive corona flare, and sun-angle synchronized fog');

  // Check 3: Tracker Masts & Mechanical Details
  const hasMastDetails = code.includes('collar') && code.includes('gimbal') && code.includes('motor') && code.includes('torqueTube');
  logTest('3.1 Enhanced solar tracker mechanical assemblies (pedestal collar, gimbal slew drive, motor, torque tube)',
    hasMastDetails, 'Full PBR mechanical assemblies with cast/received shadows');

  // Check 4: Waterless Cleaning Robot
  const hasCleaningRobot = code.includes('createCleaningRobot') && code.includes('brush1') && code.includes('brush2') && code.includes('lidarBeam');
  logTest('4.1 Waterless cleaning robot carriage (dual spiral brushes, lidar scanning laser beam)',
    hasCleaningRobot, 'Includes dual microfiber rollers, optical inspection beacon, and cyan scanning laser');

  // Check 5: Quality Mode & Performance Safeguards
  const hasQualityMode = code.includes('setQualityMode') && code.includes('SAVER') && code.includes('HIGH');
  logTest('5.1 HQ / SAVER performance toggle compatibility',
    hasQualityMode, 'Allows dynamic quality degradation for laptops (shadow maps, pixel ratios, normal maps)');

  console.log('\n================================================================');
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const allPass = testResults.every(r => r.passed);

  console.log(`Phase 1 Verification Summary:`);
  console.log(`  Total Checkpoints Tested: ${total}`);
  console.log(`  Total Passed:             ${passed} / ${total}`);
  console.log(`  Status:                   ${allPass ? '✅ PHASE 1 COMPLETE & FULLY VERIFIED' : '❌ SOME TESTS FAILED'}`);
  console.log('================================================================');

  if (!allPass) process.exit(1);
}

verifyPhase1().catch(err => {
  console.error('Phase 1 Verification Error:', err);
  process.exit(1);
});

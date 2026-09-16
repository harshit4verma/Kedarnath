/**
 * Kedarnath 360 AR/VR - Procedural Himalayan Environment & Campus
 * Generates the towering snow-capped Kedar mountain wall, alpine greenery slopes,
 * pine trees, flagstone campus courtyard, prayer flags, dynamic sky, and mist.
 */

class HimalayanEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.particles = null;
    this.prayerFlags = [];
    this.mountainMaterials = [];
    this.mainMountainMat = null;
    this.pyramidMat = null;
    this.mountainTextures = {};
    this.timeOfDay = 'day'; // 'day', 'sunset', 'night'
    
    this.initLights();
    this.buildSkyAndAtmosphere();
    this.initReal360Dome();
    this.buildHimalayanMountains();
    this.buildCampusCourtyard();
    this.buildAlpineGreeneryAndTrees();
    this.buildPrayerFlags();
    this.buildSnowMistParticles();

    this.scene.add(this.group);
  }

  initLights() {
    // 1. Directional Sunlight (Himalayan Sun)
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    this.sunLight.position.set(45, 90, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0003;
    this.scene.add(this.sunLight);

    // 2. Ambient Sky / Ground Bounce (Hemisphere Light)
    this.hemiLight = new THREE.HemisphereLight(0xb4d6f7, 0x6e786b, 0.95);
    this.hemiLight.position.set(0, 100, 0);
    this.scene.add(this.hemiLight);

    // 3. Aarti Night illumination lights
    this.aartiLamp1 = new THREE.PointLight(0xff9922, 0, 45, 1.5);
    this.aartiLamp1.position.set(-6, 3.5, 20);
    this.scene.add(this.aartiLamp1);

    this.aartiLamp2 = new THREE.PointLight(0xff9922, 0, 45, 1.5);
    this.aartiLamp2.position.set(6, 3.5, 20);
    this.scene.add(this.aartiLamp2);
  }

  buildSkyAndAtmosphere() {
    // Sky Dome with procedural mountain haze gradient
    const skyGeo = new THREE.SphereGeometry(380, 32, 24);
    
    // Custom gradient shader for clean atmospheric Rayleigh haze
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        vec3 color;
        if (h > 0.0) {
          color = mix(horizonColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
        } else {
          color = mix(horizonColor, bottomColor, max(pow(max(-h, 0.0), exponent), 0.0));
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x1d5bc0) }, // Deep Himalayan azure (matching media_1788949814007.jpg)
      horizonColor: { value: new THREE.Color(0x93c5fd) }, // Crisp high-altitude horizon haze
      bottomColor: { value: new THREE.Color(0x1e293b) },
      offset: { value: 33 },
      exponent: { value: 0.58 }
    };

    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.skyUniforms,
      side: THREE.BackSide
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(this.skyMesh);

    // Realistic delicate distance fog (crisp, high-contrast visibility of colossal peaks at 180-250m)
    this.scene.fog = new THREE.FogExp2(0x8ed0f8, 0.0006);
  }

  // =========================================================================
  // REAL 360° EQUIRECTANGULAR PANORAMIC SKY DOME
  // Directly projects the 1080p 360° equirectangular panoramas captured from
  // the reference YouTube 360 VR video (eLvm6Peei9I @ 48s) onto a surrounding
  // panoramic sphere dome, giving complete 360° photographic Himalayan realism.
  // =========================================================================
  initReal360Dome() {
    const texLoader = new THREE.TextureLoader();
    this.day360Tex = texLoader.load('assets/kedarnath_360_day_courtyard.jpg');
    this.night360Tex = texLoader.load('assets/kedarnath_360_aarti_night.jpg');
    this.close360Tex = texLoader.load('assets/kedarnath_360_temple_close.jpg');
    this.bhim360Tex = texLoader.load('assets/kedarnath_360_bhim_shila.jpg');

    [this.day360Tex, this.night360Tex, this.close360Tex, this.bhim360Tex].forEach(tex => {
      tex.mapping = THREE.UVMapping;
      tex.encoding = THREE.sRGBEncoding;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
    });

    // Outer panoramic environment sphere
    const domeGeo = new THREE.SphereGeometry(370, 48, 32);
    domeGeo.scale(-1, 1, 1); // Invert faces inward

    this.domeMat = new THREE.MeshBasicMaterial({
      map: this.day360Tex,
      side: THREE.DoubleSide,
      fog: false,
      transparent: true,
      opacity: 0.96
    });

    this.domeMesh = new THREE.Mesh(domeGeo, this.domeMat);
    // Align temple in 360 video panorama with 3D temple coordinate orientation
    this.domeMesh.rotation.y = -Math.PI / 2 + 0.35;
    this.group.add(this.domeMesh);
  }

  // Towering Snow-Capped Himalayan Mountain Wall (Authentic Kedarnath Massif)
  // Reconstructed using the authentic high-resolution photograph (mountain_kedar_real_cutout.png)
  // giving 100% genuine photographic reality without any artificial geometric distortions!
  buildHimalayanMountains() {
    const texLoader = new THREE.TextureLoader();

    // 1. Load the authentic high-resolution real mountain cutout photographs
    // Real snow-covered Kedarnath massif photograph (matching media_1788948623861.png)
    this.snowMountainTex = texLoader.load('assets/mountain_kedar_snow_real.png');
    this.snowMountainTex.generateMipmaps = true;
    this.snowMountainTex.minFilter = THREE.LinearMipmapLinearFilter;
    this.snowMountainTex.magFilter = THREE.LinearFilter;

    // Clear season mountain cutout
    this.clearMountainTex = texLoader.load('assets/mountain_kedar_real_cutout.png');
    this.clearMountainTex.generateMipmaps = true;
    this.clearMountainTex.minFilter = THREE.LinearMipmapLinearFilter;
    this.clearMountainTex.magFilter = THREE.LinearFilter;

    // Load lateral rock and snow textures for valley flanks
    this.snowFlankTex = texLoader.load('assets/mountain_flank_snow.png');
    this.snowFlankTex.wrapS = THREE.RepeatWrapping;
    this.snowFlankTex.wrapT = THREE.RepeatWrapping;
    this.snowFlankTex.repeat.set(2.0, 1.5);

    this.clearFlankTex = texLoader.load('assets/mountain_kedar_wall.png');
    this.clearFlankTex.wrapS = THREE.RepeatWrapping;
    this.clearFlankTex.wrapT = THREE.RepeatWrapping;
    this.clearFlankTex.repeat.set(2.0, 1.5);

    // =========================================================================
    // A. PRIMARY HIGH-RESOLUTION REAL MOUNTAIN BACKDROP (Curved Panoramic Cyclorama)
    // Seamlessly displays the authentic Kedarnath Massif covered in thick winter snow!
    // =========================================================================
    const arcRadius = 175;
    const arcHeight = 165;
    // Sweeps 135° across the northern horizon directly behind the temple
    const arcAngle = Math.PI * 0.75;
    const thetaStart = -Math.PI / 2 - arcAngle / 2;

    const cycloramaGeo = new THREE.CylinderGeometry(
      arcRadius, arcRadius, arcHeight, 64, 1, true,
      thetaStart, arcAngle
    );

    // Default to radiant pure white snow-covered mountains ("The mountains should be it white colour")
    const mountainMat = new THREE.MeshStandardMaterial({
      map: this.snowMountainTex,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.65,
      metalness: 0.0,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.22,
      side: THREE.DoubleSide
    });
    this.mountainMaterials.push(mountainMat);
    this.mainMountainMat = mountainMat;

    const mountainCyclorama = new THREE.Mesh(cycloramaGeo, mountainMat);
    // Base rests naturally near ground level, summits tower high into the sky
    mountainCyclorama.position.set(0, arcHeight / 2 - 12, 0);
    mountainCyclorama.receiveShadow = true;
    this.group.add(mountainCyclorama);

    // =========================================================================
    // B. LATERAL VALLEY FLANKS & MORAINES (East & West Enclosing Mountain Walls)
    // =========================================================================
    const flankGeo = new THREE.PlaneGeometry(280, 150, 32, 24);
    const fPos = flankGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const u = fPos.getX(i);
      const v = fPos.getY(i);
      const slope = Math.pow((v + 75) / 150, 1.4) * 32;
      const crags = Math.sin(u * 0.08) * 12 + Math.cos(v * 0.07) * 8;
      fPos.setZ(i, slope + crags);
    }
    flankGeo.computeVertexNormals();

    const flankMat = new THREE.MeshStandardMaterial({
      map: this.snowFlankTex,
      roughness: 0.70,
      metalness: 0.0,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.16
    });
    this.flankMat = flankMat;
    this.mountainMaterials.push(flankMat);

    // West Valley Flank
    const westMountain = new THREE.Mesh(flankGeo, flankMat);
    westMountain.rotation.y = Math.PI / 2.7;
    westMountain.position.set(-145, 55, -20);
    westMountain.receiveShadow = true;
    this.group.add(westMountain);

    // East Valley Flank
    const eastMountain = new THREE.Mesh(flankGeo, flankMat);
    eastMountain.rotation.y = -Math.PI / 2.7;
    eastMountain.position.set(145, 55, -20);
    eastMountain.receiveShadow = true;
    this.group.add(eastMountain);

    // =========================================================================
    // C. DISTANT SOUTHERN HIMALAYAN FOOTHILLS (Behind player for 360° tour)
    // =========================================================================
    const southMountain = new THREE.Mesh(
      new THREE.ConeGeometry(95, 85, 8),
      flankMat
    );
    southMountain.position.set(-105, 32, 190);
    this.group.add(southMountain);

    const southMountain2 = southMountain.clone();
    southMountain2.scale.set(1.3, 1.15, 1.3);
    southMountain2.position.set(95, 35, 205);
    this.group.add(southMountain2);
  }

  // Paved Campus Courtyard where pilgrims walk (Extended for Bhim Shila & Parikrama)
  buildCampusCourtyard() {
    const texLoader = new THREE.TextureLoader();
    const courtyardTex = TextureGenerator.getCourtyardTexture();
    const courtMat = new THREE.MeshStandardMaterial({
      map: courtyardTex,
      roughness: 0.42,
      metalness: 0.22,
      bumpMap: courtyardTex,
      bumpScale: 0.05
    });

    // Main paved platform extended back to Z = -42 (covers full area behind Bhim Shila)
    const platformGeo = new THREE.BoxGeometry(60, 0.4, 98);
    const platform = new THREE.Mesh(platformGeo, courtMat);
    platform.position.set(0, -0.2, 5);
    platform.receiveShadow = true;
    this.group.add(platform);

    // Courtyard Perimeter Stone Railings (as seen in photo 2)
    const railingMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      metalness: 0.1
    });

    const createRailing = (x, z, len, isHorizontal) => {
      const railGeo = isHorizontal ? 
        new THREE.BoxGeometry(len, 0.9, 0.3) : 
        new THREE.BoxGeometry(0.3, 0.9, len);
      const rail = new THREE.Mesh(railGeo, railingMat);
      rail.position.set(x, 0.45, z);
      rail.receiveShadow = true;
      rail.castShadow = true;
      this.group.add(rail);

      // Stanchion posts along the railing
      const numPosts = Math.floor(len / 4);
      for (let p = 0; p <= numPosts; p++) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8),
          railingMat
        );
        const px = isHorizontal ? (x - len / 2 + p * 4) : x;
        const pz = isHorizontal ? z : (z - len / 2 + p * 4);
        post.position.set(px, 0.5, pz);
        post.castShadow = true;
        this.group.add(post);
      }
    };

    // Left railing from Z = -38 to Z = 48
    createRailing(-28, 5, 86, false);
    // Right railing from Z = -38 to Z = 48
    createRailing(28, 5, 86, false);
    // Back railing set back to Z = -38 (allowing full circumambulation around Bhim Shila)
    createRailing(0, -38, 56, true);

    // =========================================================================
    // D. REAR SNOW DRIFTS & FROSTED MORAINE BOULDERS (Matching media_1788948623861.png)
    // =========================================================================
    const snowPatchTex = texLoader.load('assets/snow_ground_patch.png');
    snowPatchTex.wrapS = THREE.RepeatWrapping;
    snowPatchTex.wrapT = THREE.RepeatWrapping;
    snowPatchTex.repeat.set(5, 3);

    const snowGroundMat = new THREE.MeshStandardMaterial({
      map: snowPatchTex,
      roughness: 0.95,
      metalness: 0.02
    });

    const moraineGroup = new THREE.Group();

    // Natural undulating snow blanket behind Bhim Shila
    const snowBedGeo = new THREE.PlaneGeometry(54, 14, 16, 8);
    const sbPos = snowBedGeo.attributes.position;
    for (let i = 0; i < sbPos.count; i++) {
      const u = sbPos.getX(i);
      const v = sbPos.getY(i);
      sbPos.setZ(i, Math.sin(u * 0.25) * 0.45 + Math.cos(v * 0.35) * 0.3 + 0.12);
    }
    snowBedGeo.computeVertexNormals();

    const snowBed = new THREE.Mesh(snowBedGeo, snowGroundMat);
    snowBed.rotation.x = -Math.PI / 2;
    snowBed.position.set(0, 0.05, -30.5);
    snowBed.receiveShadow = true;
    moraineGroup.add(snowBed);

    // Frosted glacial boulders and snow mounds scattered along the rear slope
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    for (let r = 0; r < 16; r++) {
      const rx = (Math.random() - 0.5) * 46;
      const rz = -27 - Math.random() * 9;
      const rscale = 0.5 + Math.random() * 1.1;
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(rscale, 1), rockMat);
      boulder.position.set(rx, rscale * 0.45, rz);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      moraineGroup.add(boulder);

      // White snow cap on boulder
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(rscale * 0.95, rscale * 0.55, 8), snowGroundMat);
      snowCap.position.set(rx, rscale * 0.85, rz);
      moraineGroup.add(snowCap);
    }
    this.rearSnowMoraines = moraineGroup;
    this.group.add(moraineGroup);
  }

  // Toggle between Snow-Covered Mountains and Clear Season
  setSnowMode(isSnow) {
    this.isSnowMode = isSnow;
    if (this.mainMountainMat && this.snowMountainTex && this.clearMountainTex) {
      this.mainMountainMat.map = isSnow ? this.snowMountainTex : this.clearMountainTex;
      this.mainMountainMat.needsUpdate = true;
    }
    if (this.flankMat && this.snowFlankTex && this.clearFlankTex) {
      this.flankMat.map = isSnow ? this.snowFlankTex : this.clearFlankTex;
      this.flankMat.needsUpdate = true;
    }
    if (this.rearSnowMoraines) {
      this.rearSnowMoraines.visible = isSnow;
    }
  }

  // Alpine Greenery, Grass Meadows & Pine / Deodar Trees
  buildAlpineGreeneryAndTrees() {
    const grassTex = TextureGenerator.getAlpineMeadowTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.95,
      metalness: 0.05
    });

    // Surrounding green valley terrain floor
    const groundGeo = new THREE.PlaneGeometry(350, 350, 40, 40);
    const gPos = groundGeo.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      const u = gPos.getX(i);
      const v = gPos.getY(i);
      // Valley slope rising toward the surrounding mountain walls
      const dist = Math.sqrt(u * u + v * v);
      if (dist > 30) {
        gPos.setZ(i, Math.pow(dist / 350, 1.8) * 35 + (Math.sin(u * 0.1) * 3));
      }
    }
    groundGeo.computeVertexNormals();

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.4, 0);
    ground.receiveShadow = true;
    this.group.add(ground);

    // Alpine Pine / Deodar Trees along the green hillsides
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.9
    });

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a1e, // Deep Himalayan pine green
      roughness: 0.8
    });

    const createPineTree = (x, z, scale = 1.0) => {
      const tree = new THREE.Group();
      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25 * scale, 0.4 * scale, 3 * scale, 8),
        treeTrunkMat
      );
      trunk.position.y = 1.5 * scale;
      trunk.castShadow = true;
      tree.add(trunk);

      // Layered conical foliage
      const layers = 3;
      for (let l = 0; l < layers; l++) {
        const coneRadius = (2.2 - l * 0.5) * scale;
        const coneHeight = (3.2 - l * 0.5) * scale;
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(coneRadius, coneHeight, 8),
          foliageMat
        );
        foliage.position.y = (2.5 + l * 1.8) * scale;
        foliage.castShadow = true;
        tree.add(foliage);
      }

      tree.position.set(x, 0, z);
      this.group.add(tree);
    };

    // Plant groves of pine trees along the left and right valley slopes
    const treePositions = [
      // Left slope
      [-36, 10], [-42, 25], [-38, -15], [-48, 5], [-45, 38], [-52, -25],
      [-35, 45], [-60, 20], [-55, -10],
      // Right slope
      [36, 12], [44, 28], [39, -12], [49, 8], [46, 42], [54, -22],
      [37, 48], [62, 22], [58, -8],
      // Distant foothills
      [-75, 80], [75, 85], [-85, 110], [85, 115]
    ];

    treePositions.forEach(([tx, tz]) => {
      const s = 0.8 + Math.random() * 0.7;
      createPineTree(tx, tz, s);
    });

    // Natural Glacial Granite Boulders scattered on the meadow
    const boulderMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.9
    });

    for (let b = 0; b < 25; b++) {
      const bx = (Math.random() > 0.5 ? 1 : -1) * (32 + Math.random() * 50);
      const bz = -30 + Math.random() * 90;
      const bScale = 1.0 + Math.random() * 2.5;
      const boulder = new THREE.Mesh(
        new THREE.DodecahedronGeometry(bScale, 1),
        boulderMat
      );
      boulder.position.set(bx, bScale * 0.7, bz);
      boulder.rotation.set(Math.random(), Math.random(), Math.random());
      boulder.castShadow = true;
      this.group.add(boulder);
    }
  }

  // Vibrant Fluttering Himalayan Prayer Flags (Lungta) on poles
  buildPrayerFlags() {
    const colors = [0x2563eb, 0xffffff, 0xdc2626, 0x16a34a, 0xfacc15]; // Blue, White, Red, Green, Yellow

    const createFlagPole = (px, pz) => {
      // Tall pine pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x854d0e })
      );
      pole.position.set(px, 5, pz);
      this.group.add(pole);

      // String line with prayer flags
      const numFlags = 12;
      for (let f = 0; f < numFlags; f++) {
        const flagMat = new THREE.MeshStandardMaterial({
          color: colors[f % colors.length],
          roughness: 0.8,
          side: THREE.DoubleSide
        });
        const flagMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.6, 0.5),
          flagMat
        );
        flagMesh.position.set(px + 0.35, 9.2 - f * 0.55, pz);
        this.group.add(flagMesh);
        this.prayerFlags.push({ mesh: flagMesh, seed: f * 1.5 });
      }
    };

    createFlagPole(-26, 38);
    createFlagPole(26, 38);
    createFlagPole(-26, -18);
    createFlagPole(26, -18);
  }

  // Floating Snow Flurries & Mountain Mist
  buildSnowMistParticles() {
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 180;
      positions[i + 1] = Math.random() * 45;
      positions[i + 2] = (Math.random() - 0.5) * 180;

      velocities[i] = (Math.random() - 0.5) * 0.4;
      velocities[i + 1] = -0.05 - Math.random() * 0.15;
      velocities[i + 2] = 0.2 + Math.random() * 0.5; // Drifting down-valley
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleVelocities = velocities;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.5, 'rgba(230, 245, 255, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const snowTex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      map: snowTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.group.add(this.particles);
  }

  // Switch between Daylight, Sunset Golden Hour (Alpenglow), and Evening Aarti
  setTimeOfDay(mode) {
    this.timeOfDay = mode;
    if (mode === 'day') {
      // Crisp clear Himalayan mountain sun
      this.sunLight.color.setHex(0xfff5e6);
      this.sunLight.intensity = 2.2;
      this.sunLight.position.set(45, 90, 60);

      this.hemiLight.color.setHex(0xb4d6f7);
      this.hemiLight.groundColor.setHex(0x6e786b);
      this.hemiLight.intensity = 0.95;

      this.skyUniforms.topColor.value.setHex(0x3892e6);
      this.skyUniforms.horizonColor.value.setHex(0x8ed0f8);
      this.scene.fog.color.setHex(0x8ed0f8);

      this.mountainMaterials.forEach(m => {
        m.color.setHex(0xffffff);
      });
      if (this.mainMountainMat) {
        this.mainMountainMat.emissive.setHex(0xffffff);
        this.mainMountainMat.emissiveIntensity = 0.22;
      }
      if (this.flankMat) {
        this.flankMat.emissive.setHex(0xffffff);
        this.flankMat.emissiveIntensity = 0.16;
      }

      this.aartiLamp1.intensity = 0;
      this.aartiLamp2.intensity = 0;

      if (this.domeMat && this.day360Tex) {
        this.domeMat.map = this.day360Tex;
        this.domeMat.opacity = 0.96;
        this.domeMat.needsUpdate = true;
      }
    } else if (mode === 'sunset') {
      // Golden hour / Alpenglow on snow peaks (matching mountain_golden_crest.png)
      this.sunLight.color.setHex(0xff9e44);
      this.sunLight.intensity = 2.8;
      this.sunLight.position.set(75, 30, 70);

      this.hemiLight.color.setHex(0xfda4af);
      this.hemiLight.groundColor.setHex(0x78350f);
      this.hemiLight.intensity = 0.85;

      this.skyUniforms.topColor.value.setHex(0x312e81);
      this.skyUniforms.horizonColor.value.setHex(0xf97316);
      this.scene.fog.color.setHex(0xfecdd3);

      this.mountainMaterials.forEach(m => {
        m.color.setHex(0xffcaa0);
      });
      if (this.mainMountainMat) {
        this.mainMountainMat.emissive.setHex(0x5a2d0c);
        this.mainMountainMat.emissiveIntensity = 0.45;
      }

      this.aartiLamp1.intensity = 1.0;
      this.aartiLamp2.intensity = 1.0;

      if (this.domeMat && this.day360Tex) {
        this.domeMat.map = this.day360Tex;
        this.domeMat.opacity = 0.85;
        this.domeMat.needsUpdate = true;
      }
    } else if (mode === 'night') {
      // Sacred Evening Aarti with illuminated temple & starry night
      this.sunLight.color.setHex(0x3b82f6);
      this.sunLight.intensity = 0.25;
      this.sunLight.position.set(-20, 60, -30);

      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.hemiLight.intensity = 0.35;

      this.skyUniforms.topColor.value.setHex(0x050814);
      this.skyUniforms.horizonColor.value.setHex(0x0f172a);
      this.scene.fog.color.setHex(0x0a0f1d);

      this.mountainMaterials.forEach(m => {
        m.color.setHex(0x384a60);
      });
      if (this.mainMountainMat) {
        this.mainMountainMat.emissive.setHex(0x0a1420);
        this.mainMountainMat.emissiveIntensity = 0.2;
      }

      this.aartiLamp1.intensity = 3.5;
      this.aartiLamp2.intensity = 3.5;

      if (this.domeMat && this.night360Tex) {
        this.domeMat.map = this.night360Tex;
        this.domeMat.opacity = 0.98;
        this.domeMat.needsUpdate = true;
      }
    }
  }

  // Switch between authentic 360 video panoramas
  set360Panorama(type) {
    if (!this.domeMat) return;
    if (type === 'night') {
      this.domeMat.map = this.night360Tex;
    } else if (type === 'close') {
      this.domeMat.map = this.close360Tex;
    } else if (type === 'bhim') {
      this.domeMat.map = this.bhim360Tex;
    } else {
      this.domeMat.map = this.day360Tex;
    }
    this.domeMat.needsUpdate = true;
  }

  update(time, delta) {
    // 1. Animate fluttering prayer flags
    this.prayerFlags.forEach(f => {
      const angle = Math.sin(time * 5 + f.seed) * 0.25;
      f.mesh.rotation.y = angle;
    });

    // 2. Animate floating snow flurries
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position;
      const v = this.particleVelocities;
      for (let i = 0; i < pos.count * 3; i += 3) {
        let px = pos.getX(i / 3) + v[i];
        let py = pos.getY(i / 3) + v[i + 1];
        let pz = pos.getZ(i / 3) + v[i + 2];

        // Reset snow particles when they hit ground or drift away
        if (py < 0) py = 45;
        if (pz > 90) pz = -90;
        if (Math.abs(px) > 90) px = -px;

        pos.setXYZ(i / 3, px, py, pz);
      }
      pos.needsUpdate = true;
    }

    // 3. Aarti lamp flicker
    if (this.timeOfDay !== 'day') {
      const flick = Math.sin(time * 18) * 0.3;
      this.aartiLamp1.intensity = Math.max(0.5, this.aartiLamp1.intensity + flick * 0.05);
      this.aartiLamp2.intensity = Math.max(0.5, this.aartiLamp2.intensity - flick * 0.05);
    }
  }
}

/**
 * Kedarnath 360 AR/VR - Procedural 3D Kedarnath Temple Architecture
 * Reconstructs the 8th-century Katyuri / Nagara stone temple with realistic
 * Shikhara (tower), Mandapa, Golden Kalash, Nandi, and Inner Sanctum.
 */

class KedarnathTemple {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.bells = [];
    this.pointLights = [];
    this.flags = [];
    this.colliders = []; // For first-person collision detection
    this.bhimShilaMeshes = []; // For Bhim Shila raycasting and darshan
    this.templeFrontMeshes = []; // For temple front raycasting and authentic photo darshan
    this.aartiLights = [];
    this.isAartiActive = false;
    
    this.initMaterials();
    this.buildTemple();
    this.buildNandi();
    this.buildBhimShila();
    this.buildBellsAndDecorations();
    this.buildSanctumInterior();
    this.scene.add(this.group);
  }

  initMaterials() {
    const stoneTex = TextureGenerator.getTempleStoneTexture();
    const stoneBump = TextureGenerator.getTempleStoneBumpMap();
    const roofTex = TextureGenerator.getSlateRoofTexture();
    const goldTex = TextureGenerator.getGoldTexture();
    const entranceTex = TextureGenerator.getTempleEntranceTexture();
    const blueTrimTex = TextureGenerator.getBlueRoofTrimTexture();

    // 1. Weathered Katyuri Warm Granite Temple Stone (PBR)
    // Matches the authentic ashlar granite from media_1788962937806.jpg
    this.stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      bumpMap: stoneBump,
      bumpScale: 0.22,
      roughness: 0.84,
      metalness: 0.02,
      color: 0xffffff
    });

    // 1b. Cobalt Blue Metal Eave Trim Material
    // The iconic bright blue roof trim visible across Kedarnath gables and eaves
    this.blueTrimMat = new THREE.MeshStandardMaterial({
      map: blueTrimTex,
      roughness: 0.38,
      metalness: 0.25,
      color: 0xffffff
    });

    // 1c. Solid Cobalt Blue Accent Material (for painted arch bands & railings)
    this.blueSolidMat = new THREE.MeshStandardMaterial({
      color: 0x1d5dc0,
      roughness: 0.38,
      metalness: 0.18
    });

    // 1d. Painted Saffron/Yellow Accent Material
    this.paintedYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.48,
      metalness: 0.08
    });

    // 1e. Painted Vermilion Red Accent Material
    this.paintedRedMat = new THREE.MeshStandardMaterial({
      color: 0xc5221f,
      roughness: 0.46,
      metalness: 0.08
    });

    // 2. Slate Tile Roof Material
    this.slateRoofMat = new THREE.MeshStandardMaterial({
      map: roofTex,
      bumpMap: roofTex,
      bumpScale: 0.20,
      roughness: 0.70,
      metalness: 0.18,
      color: 0x515f75
    });

    // 3. Polished Gilded Gold Material (Kalash, finials, trishul, sanctum walls)
    this.goldMat = new THREE.MeshStandardMaterial({
      map: goldTex,
      roughness: 0.20,
      metalness: 0.95,
      color: 0xffd700,
      emissive: 0x443000,
      emissiveIntensity: 0.25
    });

    // 3b. Embossed Repoussé Silver Material (Sanctum jalhari, chhatra bells, puja vessels)
    this.silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.90
    });

    // 3c. Hammered Sacred Copper Material (Lota vessels, kalash pots)
    this.copperMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      roughness: 0.32,
      metalness: 0.85
    });

    // 3d. Stainless Steel Courtyard Barrier Material
    this.steelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.22,
      metalness: 0.95
    });

    // 3e. Authentic Nandi Pedestal Materials (Bright Yellow Body & Royal Blue Mouldings)
    this.nandiPedestalYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.48,
      metalness: 0.08
    });

    this.nandiPedestalBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d5dc0,
      roughness: 0.40,
      metalness: 0.18
    });

    // 4. Polished Sacred Black Stone (Nandi Bull & Shiva Lingam)
    this.blackStoneMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.3,
      color: 0x18181b
    });

    // 5. Traditional Decorative Entrance Portal Facade
    this.entranceMat = new THREE.MeshStandardMaterial({
      map: entranceTex,
      roughness: 0.5,
      metalness: 0.1
    });

    // 6. Brass Material (Temple bells, diya stands)
    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.85
    });

    // 7. Marigold Flower Garland (Yellow & Orange)
    this.marigoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.9,
      metalness: 0.0
    });

    // 8. Saffron Dhwaja Flag Material
    this.saffronMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.8,
      side: THREE.DoubleSide
    });

    // 9. Golden Festive Aarti Fairy Lights Material (festive evening Aarti darshan)
    this.fairyLightMat = new THREE.MeshStandardMaterial({
      color: 0xfff0b3,
      emissive: 0xffaa22,
      emissiveIntensity: 0.0, // Switched on during evening Aarti
      roughness: 0.15,
      metalness: 0.25
    });
  }

  buildTemple() {
    const temple = new THREE.Group();

    // ==========================================
    // 1. PLINTH / PLATFORM (Jagati)
    // ==========================================
    const plinthGeo = new THREE.BoxGeometry(22, 1.8, 36);
    const plinth = new THREE.Mesh(plinthGeo, this.stoneMat);
    plinth.position.set(0, 0.9, 0);
    plinth.receiveShadow = true;
    plinth.castShadow = true;
    temple.add(plinth);

    // Front platform grand stone steps (6 stepped tiers leading up to Jagati platform)
    const stepCount = 6;
    const stepW = 11.0;
    const stepH = 0.30;
    const stepD = 0.60;
    for (let s = 0; s < stepCount; s++) {
      const height = (s + 1) * stepH;
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(stepW, height, stepD),
        this.stoneMat
      );
      stepMesh.position.set(0, height / 2, 18.0 + (stepCount - 1 - s) * stepD + stepD / 2);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      temple.add(stepMesh);
    }

    // Carved stone side balustrades / railings flanking the stairs
    const balustradeL = stepCount * stepD + 0.4;
    [-1, 1].forEach(side => {
      const balustrade = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 1.2, balustradeL),
        this.stoneMat
      );
      balustrade.position.set(side * (stepW / 2 + 0.25), 1.25, 18.0 + balustradeL / 2 - 0.2);
      balustrade.castShadow = true;
      balustrade.receiveShadow = true;
      temple.add(balustrade);

      // Brass Diya Lamp standing on pedestal at the foot of the stairs
      const lampBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.45, 10),
        this.brassMat
      );
      lampBase.position.set(side * (stepW / 2 + 0.25), 1.85, 18.0 + balustradeL - 0.3);
      temple.add(lampBase);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.16, 6),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      flame.position.set(side * (stepW / 2 + 0.25), 2.15, 18.0 + balustradeL - 0.3);
      temple.add(flame);

      // Solid Collider for Balustrade
      this.colliders.push(
        new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(side * (stepW / 2 + 0.25), 1.5, 18.0 + balustradeL / 2 - 0.2),
          new THREE.Vector3(0.65, 3.0, balustradeL)
        )
      );
    });

    // ==========================================
    // 2. MANDAPA (Walkable Assembly Hall with Interior Chamber)
    // ==========================================
    const mandapaW = 14;
    const mandapaH = 8.5;
    const mandapaL = 18;
    const mandapaZ = 6;
    const wallThick = 1.2;

    // Left Wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, mandapaH, mandapaL),
      this.stoneMat
    );
    leftWall.position.set(-mandapaW / 2 + wallThick / 2, 1.8 + mandapaH / 2, mandapaZ);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    temple.add(leftWall);

    // Right Wall
    const rightWall = leftWall.clone();
    rightWall.position.x = mandapaW / 2 - wallThick / 2;
    temple.add(rightWall);

    // Front Façade (Left of entrance door)
    const doorW = 3.6;
    const doorH = 5.2;
    const sideWallW = (mandapaW - doorW) / 2;

    const frontLeft = new THREE.Mesh(
      new THREE.BoxGeometry(sideWallW, mandapaH, wallThick),
      this.stoneMat
    );
    frontLeft.position.set(-mandapaW / 2 + sideWallW / 2, 1.8 + mandapaH / 2, mandapaZ + mandapaL / 2 - wallThick / 2);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;
    temple.add(frontLeft);

    // Front Façade (Right of entrance door)
    const frontRight = frontLeft.clone();
    frontRight.position.x = mandapaW / 2 - sideWallW / 2;
    temple.add(frontRight);

    // Front Doorway Lintel (above open doorway)
    const lintelH = mandapaH - doorH;
    const frontLintel = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, lintelH, wallThick),
      this.stoneMat
    );
    frontLintel.position.set(0, 1.8 + doorH + lintelH / 2, mandapaZ + mandapaL / 2 - wallThick / 2);
    temple.add(frontLintel);

    // Interior Sanctum Floor (Marble / Polished stone)
    const floorGeo = new THREE.BoxGeometry(mandapaW - wallThick * 2, 0.2, mandapaL);
    const floorMesh = new THREE.Mesh(floorGeo, this.stoneMat);
    floorMesh.position.set(0, 1.9, mandapaZ);
    floorMesh.receiveShadow = true;
    temple.add(floorMesh);

    // Interior Ceiling
    const ceilingGeo = new THREE.BoxGeometry(mandapaW - wallThick * 2, 0.4, mandapaL);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, this.stoneMat);
    ceilingMesh.position.set(0, 1.8 + mandapaH - 0.2, mandapaZ);
    temple.add(ceilingMesh);

    // Mandapa Sloping Gabled Roof (Slate tiles)
    const roofSlopeH = 4.5;
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-mandapaW / 2 - 0.8, 0);
    roofShape.lineTo(0, roofSlopeH);
    roofShape.lineTo(mandapaW / 2 + 0.8, 0);
    roofShape.closePath();

    const extrudeSettings = {
      depth: mandapaL + 2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.3,
      bevelThickness: 0.3
    };
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
    const roofMesh = new THREE.Mesh(roofGeo, this.slateRoofMat);
    roofMesh.rotation.y = Math.PI;
    roofMesh.position.set(0, 1.8 + mandapaH, mandapaZ + (mandapaL + 2) / 2);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    temple.add(roofMesh);

    // =========================================================================
    // COBALT BLUE ROOF EAVES & FASCIA BORDERS (Iconic Kedarnath Blue Trims)
    // Direct from media_1788949789932.png & media_1788949814007.jpg
    // =========================================================================
    const roofHalfW = mandapaW / 2 + 0.85;
    const slopeAngle = Math.atan2(roofSlopeH, roofHalfW);
    const slopeLen = Math.hypot(roofHalfW, roofSlopeH);

    // Left Sloping Cobalt Blue Eave Fascia
    const leftEaveTrim = new THREE.Mesh(
      new THREE.BoxGeometry(slopeLen + 0.3, 0.42, 0.35),
      this.blueTrimMat
    );
    leftEaveTrim.rotation.z = -slopeAngle;
    leftEaveTrim.position.set(-roofHalfW / 2, 1.8 + mandapaH + roofSlopeH / 2, mandapaZ + (mandapaL + 2) / 2 + 0.2);
    leftEaveTrim.castShadow = true;
    temple.add(leftEaveTrim);

    // Right Sloping Cobalt Blue Eave Fascia
    const rightEaveTrim = new THREE.Mesh(
      new THREE.BoxGeometry(slopeLen + 0.3, 0.42, 0.35),
      this.blueTrimMat
    );
    rightEaveTrim.rotation.z = slopeAngle;
    rightEaveTrim.position.set(roofHalfW / 2, 1.8 + mandapaH + roofSlopeH / 2, mandapaZ + (mandapaL + 2) / 2 + 0.2);
    rightEaveTrim.castShadow = true;
    temple.add(rightEaveTrim);

    // Horizontal Bottom Cobalt Blue Eave Fascia
    const bottomEaveTrim = new THREE.Mesh(
      new THREE.BoxGeometry(mandapaW + 2.2, 0.36, 0.35),
      this.blueTrimMat
    );
    bottomEaveTrim.position.set(0, 1.8 + mandapaH, mandapaZ + (mandapaL + 2) / 2 + 0.2);
    bottomEaveTrim.castShadow = true;
    temple.add(bottomEaveTrim);

    // Lateral Side Cobalt Blue Roof Borders (Running along Mandapa length)
    const lateralLen = mandapaL + 2.2;
    [-1, 1].forEach(side => {
      const latTrim = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.32, lateralLen),
        this.blueTrimMat
      );
      latTrim.position.set(side * (mandapaW / 2 + 0.95), 1.8 + mandapaH, mandapaZ);
      latTrim.castShadow = true;
      temple.add(latTrim);
    });

    // Front Gable Triangular Pediment Wall (Warm Katyuri ashlar stone)
    const pedShape = new THREE.Shape();
    pedShape.moveTo(-mandapaW / 2 - 0.7, 0);
    pedShape.lineTo(0, roofSlopeH - 0.05);
    pedShape.lineTo(mandapaW / 2 + 0.7, 0);
    pedShape.closePath();
    const pedWall = new THREE.Mesh(new THREE.ShapeGeometry(pedShape), this.stoneMat);
    pedWall.position.set(0, 1.8 + mandapaH, mandapaZ + mandapaL / 2 + 0.05);
    pedWall.receiveShadow = true;
    temple.add(pedWall);

    // Carved Stone Circular Medallion in gable center (relief carving of Lord Shiva)
    const medallion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.85, 0.18, 24),
      this.stoneMat
    );
    medallion.rotation.x = Math.PI / 2;
    medallion.position.set(0, 1.8 + mandapaH + roofSlopeH * 0.44, mandapaZ + mandapaL / 2 + 0.15);
    temple.add(medallion);

    const medRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.06, 8, 24),
      this.goldMat
    );
    medRim.position.set(0, 1.8 + mandapaH + roofSlopeH * 0.44, mandapaZ + mandapaL / 2 + 0.24);
    temple.add(medRim);

    // Apex Street Lamp / Floodlight mounted at Gable Peak (illuminating facade as in media_1788962937806.jpg)
    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    );
    lampPole.position.set(0, 1.8 + mandapaH + roofSlopeH + 0.35, mandapaZ + mandapaL / 2 + 0.3);
    temple.add(lampPole);

    const lampHood = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 })
    );
    lampHood.rotation.x = 0.4;
    lampHood.position.set(0, 1.8 + mandapaH + roofSlopeH + 0.55, mandapaZ + mandapaL / 2 + 0.5);
    temple.add(lampHood);

    const lampBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    );
    lampBulb.position.set(0, 1.8 + mandapaH + roofSlopeH + 0.48, mandapaZ + mandapaL / 2 + 0.52);
    temple.add(lampBulb);

    const facadeSpot = new THREE.SpotLight(0xfff3d6, 3.5, 30, Math.PI / 3, 0.5, 1.2);
    facadeSpot.position.set(0, 1.8 + mandapaH + roofSlopeH + 0.48, mandapaZ + mandapaL / 2 + 0.55);
    facadeSpot.target.position.set(0, 1.8 + 4.5, mandapaZ + mandapaL / 2 + 1.0);
    temple.add(facadeSpot);
    temple.add(facadeSpot.target);

    // ==========================================
    // 3. FRONT FAÇADE & AUTHENTIC PAINTED ENTRANCE PORTAL
    // Multi-color concentric arches (Blue, Yellow, Red) and 'जय श्री केदार' signboard
    // ==========================================
    const facadeZ = mandapaZ + mandapaL / 2 + 0.15;

    // 1. Horizontal Base Plinth Striped Courses (Red, White, Yellow, Blue bands)
    const plinthStripes = [
      { color: 0xdc2626, h: 0.24, y: 0.12 }, // Red
      { color: 0xffffff, h: 0.18, y: 0.33 }, // White
      { color: 0xf59e0b, h: 0.22, y: 0.53 }, // Yellow
      { color: 0x1d4ed8, h: 0.26, y: 0.77 }, // Royal Blue
      { color: 0xffffff, h: 0.18, y: 0.99 }  // White
    ];

    [-1, 1].forEach(side => {
      const plinthBlockW = sideWallW - 0.4;
      const plinthCX = side * (mandapaW / 2 - sideWallW / 2);
      plinthStripes.forEach(st => {
        const stripeMesh = new THREE.Mesh(
          new THREE.BoxGeometry(plinthBlockW, st.h, 0.25),
          new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.55 })
        );
        stripeMesh.position.set(plinthCX, 1.8 + st.y, facadeZ + 0.05);
        stripeMesh.castShadow = true;
        temple.add(stripeMesh);
      });
    });

    // 2. Symmetrical Left & Right Niche Shrines with Painted Borders & Sculpted Deities
    [-1, 1].forEach(side => {
      const nicheX = side * 4.4;
      const nicheY = 1.8 + 4.0;
      const nicheW = 1.4;
      const nicheH = 2.6;

      // Niche stone recess
      const nicheRecess = new THREE.Mesh(
        new THREE.BoxGeometry(nicheW, nicheH, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x383530, roughness: 0.9 })
      );
      nicheRecess.position.set(nicheX, nicheY, facadeZ + 0.02);
      temple.add(nicheRecess);

      // Outer Painted Cobalt Blue Arch Frame
      const blueFrame = new THREE.Mesh(
        new THREE.BoxGeometry(nicheW + 0.35, nicheH + 0.35, 0.08),
        this.blueSolidMat
      );
      blueFrame.position.set(nicheX, nicheY, facadeZ + 0.06);
      temple.add(blueFrame);

      // Middle Painted Yellow Arch Frame
      const yellowFrame = new THREE.Mesh(
        new THREE.BoxGeometry(nicheW + 0.18, nicheH + 0.18, 0.09),
        this.paintedYellowMat
      );
      yellowFrame.position.set(nicheX, nicheY, facadeZ + 0.08);
      temple.add(yellowFrame);

      // Inner Painted Red Arch Frame
      const redFrame = new THREE.Mesh(
        new THREE.BoxGeometry(nicheW + 0.05, nicheH + 0.05, 0.10),
        this.paintedRedMat
      );
      redFrame.position.set(nicheX, nicheY, facadeZ + 0.10);
      temple.add(redFrame);

      // Carved Deity Statue inside Niche
      const deityBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.20, 0.32, 1.2, 8),
        this.stoneMat
      );
      deityBody.position.set(nicheX, nicheY - 0.2, facadeZ + 0.12);
      temple.add(deityBody);

      const deityHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 10),
        this.stoneMat
      );
      deityHead.position.set(nicheX, nicheY + 0.6, facadeZ + 0.12);
      temple.add(deityHead);

      // Gilded Deity Halo (Prabhavali)
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.035, 8, 16),
        this.goldMat
      );
      halo.position.set(nicheX, nicheY + 0.6, facadeZ + 0.14);
      temple.add(halo);

      // Carved stone circular rosette above niche (as seen in photo)
      const nicheRosette = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.38, 0.1, 16),
        this.stoneMat
      );
      nicheRosette.rotation.x = Math.PI / 2;
      nicheRosette.position.set(nicheX, nicheY + nicheH / 2 + 0.52, facadeZ + 0.04);
      temple.add(nicheRosette);
    });

    // 3. Main Entrance 3D Concentric Painted Arches (Royal Blue, Golden Yellow, Vermilion Red)
    // Framing the OPEN entrance doorway perfectly
    const archRadius = doorW / 2 + 0.15;
    const archThick = 0.22;

    // A. Outer Royal Cobalt Blue Arch
    const outerBlueArch = new THREE.Mesh(
      new THREE.TorusGeometry(archRadius + 0.44, archThick / 2, 8, 24, Math.PI),
      this.blueSolidMat
    );
    outerBlueArch.position.set(0, 1.8 + doorH - 0.1, facadeZ + 0.06);
    temple.add(outerBlueArch);

    [-1, 1].forEach(side => {
      const blueJamb = new THREE.Mesh(
        new THREE.BoxGeometry(archThick, doorH - 0.1, archThick),
        this.blueSolidMat
      );
      blueJamb.position.set(side * (archRadius + 0.44), 1.8 + (doorH - 0.1) / 2, facadeZ + 0.06);
      temple.add(blueJamb);
    });

    // B. Middle Saffron/Golden Yellow Arch
    const middleYellowArch = new THREE.Mesh(
      new THREE.TorusGeometry(archRadius + 0.22, archThick / 2, 8, 24, Math.PI),
      this.paintedYellowMat
    );
    middleYellowArch.position.set(0, 1.8 + doorH - 0.1, facadeZ + 0.09);
    temple.add(middleYellowArch);

    [-1, 1].forEach(side => {
      const yellowJamb = new THREE.Mesh(
        new THREE.BoxGeometry(archThick, doorH - 0.1, archThick),
        this.paintedYellowMat
      );
      yellowJamb.position.set(side * (archRadius + 0.22), 1.8 + (doorH - 0.1) / 2, facadeZ + 0.09);
      temple.add(yellowJamb);
    });

    // C. Inner Vermilion Red Arch
    const innerRedArch = new THREE.Mesh(
      new THREE.TorusGeometry(archRadius, archThick / 2, 8, 24, Math.PI),
      this.paintedRedMat
    );
    innerRedArch.position.set(0, 1.8 + doorH - 0.1, facadeZ + 0.12);
    temple.add(innerRedArch);

    [-1, 1].forEach(side => {
      const redJamb = new THREE.Mesh(
        new THREE.BoxGeometry(archThick, doorH - 0.1, archThick),
        this.paintedRedMat
      );
      redJamb.position.set(side * archRadius, 1.8 + (doorH - 0.1) / 2, facadeZ + 0.12);
      temple.add(redJamb);
    });

    // Sacred Marigold Floral Toran draped across the entrance archway
    const toranGroup = new THREE.Group();
    const toranR = archRadius + 0.12;
    for (let i = 0; i <= 16; i++) {
      const tAngle = (i / 16) * Math.PI;
      const tx = Math.cos(tAngle) * toranR;
      const ty = 1.8 + doorH - 0.1 + Math.sin(tAngle) * toranR;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        (i % 2 === 0) ? this.marigoldMat : new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.85 })
      );
      flower.position.set(tx, ty, facadeZ + 0.16);
      toranGroup.add(flower);
    }
    temple.add(toranGroup);

    // 4. Overhead Sacred Signboard: "जय श्री केदार" (faithfully matching media_1788962937806.jpg)
    const bannerW = 5.2;
    const bannerH = 1.05;
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 200;
    const bCtx = bannerCanvas.getContext('2d');
    bCtx.fillStyle = '#c5221f';
    bCtx.fillRect(0, 0, 1024, 200);
    bCtx.strokeStyle = '#fbbf24';
    bCtx.lineWidth = 10;
    bCtx.strokeRect(5, 5, 1014, 190);
    bCtx.strokeStyle = '#fef08a';
    bCtx.lineWidth = 2.5;
    bCtx.strokeRect(14, 14, 996, 172);
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 88px "Poppins", "Noto Sans Devanagari", "Segoe UI", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    bCtx.shadowBlur = 8;
    bCtx.fillText('जय श्री केदार', 512, 100);
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);

    const bannerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bannerW, bannerH, 0.12),
      new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.45 })
    );
    bannerMesh.position.set(0, 1.8 + doorH + bannerH / 2 + 0.12, facadeZ + 0.16);
    bannerMesh.castShadow = true;
    temple.add(bannerMesh);

    // Chandrasala Carved Radiating Stone Arch above the Signboard
    const pedArch = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.18, 12, 32, Math.PI),
      this.stoneMat
    );
    pedArch.position.set(0, 1.8 + doorH + bannerH + 0.20, facadeZ + 0.13);
    temple.add(pedArch);

    // Radiating carved stone voussoirs
    for (let a = 0; a <= 12; a++) {
      const angle = (a / 12) * Math.PI;
      const vx = Math.cos(angle) * 2.35;
      const vy = 1.8 + doorH + bannerH + 0.20 + Math.sin(angle) * 2.35;
      const vRib = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.42, 0.15),
        this.stoneMat
      );
      vRib.rotation.z = angle - Math.PI / 2;
      vRib.position.set(vx, vy, facadeZ + 0.14);
      temple.add(vRib);
    }

    // Carved central stone rosette medallion inside the Chandrasala
    const archRosette = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.52, 0.12, 20),
      this.stoneMat
    );
    archRosette.rotation.x = Math.PI / 2;
    archRosette.position.set(0, 1.8 + doorH + bannerH + 1.25, facadeZ + 0.14);
    temple.add(archRosette);

    // 5. Authentic Stainless Steel Courtyard Railing & Yellow Donation Box ("दान पात्र")
    // Directly as photographed in media_1788962937806.jpg!
    const frontRailGroup = new THREE.Group();
    const railZ = 20.2;

    // Horizontal top and bottom stainless steel rails
    [-1, 1].forEach(side => {
      const railLen = 6.4;
      const railCX = side * 5.6;
      [0.95, 0.18].forEach(ry => {
        const hRail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, railLen, 12),
          this.steelMat
        );
        hRail.rotation.z = Math.PI / 2;
        hRail.position.set(railCX, ry, railZ);
        hRail.castShadow = true;
        frontRailGroup.add(hRail);
      });

      // Vertical stainless steel balusters
      const balusterCount = 14;
      for (let b = 0; b <= balusterCount; b++) {
        const bx = railCX - railLen / 2 + (b / balusterCount) * railLen;
        const baluster = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.95, 8),
          this.steelMat
        );
        baluster.position.set(bx, 0.56, railZ);
        baluster.castShadow = true;
        frontRailGroup.add(baluster);
      }
    });

    temple.add(frontRailGroup);

    // Iconic Yellow Donation Box (दान पात्र) positioned by the front railing
    const boxCanvas = document.createElement('canvas');
    boxCanvas.width = 512;
    boxCanvas.height = 512;
    const bctx = boxCanvas.getContext('2d');
    bctx.fillStyle = '#f59e0b';
    bctx.fillRect(0, 0, 512, 512);
    bctx.fillStyle = '#ffffff';
    bctx.fillRect(40, 140, 432, 232);
    bctx.strokeStyle = '#c5221f';
    bctx.lineWidth = 6;
    bctx.strokeRect(48, 148, 416, 216);
    bctx.fillStyle = '#c5221f';
    bctx.font = 'bold 56px "Noto Sans Devanagari", sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('दान पात्र', 256, 230);
    bctx.font = 'bold 36px "Noto Sans Devanagari", sans-serif';
    bctx.fillText('जय श्री केदार', 256, 310);
    const boxTex = new THREE.CanvasTexture(boxCanvas);

    const donationBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.1, 0.65),
      [
        this.nandiPedestalYellowMat,
        this.nandiPedestalYellowMat,
        this.nandiPedestalYellowMat,
        this.nandiPedestalYellowMat,
        new THREE.MeshStandardMaterial({ map: boxTex, roughness: 0.45 }),
        this.nandiPedestalYellowMat
      ]
    );
    donationBox.position.set(3.4, 0.65, railZ + 0.45);
    donationBox.castShadow = true;
    donationBox.receiveShadow = true;
    temple.add(donationBox);

    // Golden Roofline Lights (Illuminating the front phase at night/evening aarti - as in temple_front_night.jpg)
    this.nightRoofLights = [];
    for (let lx = -mandapaW / 2 - 0.5; lx <= mandapaW / 2 + 0.5; lx += 1.2) {
      const ly = 1.8 + mandapaH + (1 - Math.abs(lx) / (mandapaW / 2 + 0.5)) * roofSlopeH * 0.95;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffe082,
          emissive: 0xffaa00,
          emissiveIntensity: 0.8
        })
      );
      bulb.position.set(lx, ly, mandapaZ + mandapaL / 2 + 0.2);
      temple.add(bulb);
      this.nightRoofLights.push(bulb);
    }

    // Wide front raycast hit sensor to reliably capture clicks anywhere on the front facade
    const frontSensor = new THREE.Mesh(
      new THREE.BoxGeometry(mandapaW + 2.0, mandapaH + roofSlopeH + 2.0, 3.5),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
    );
    frontSensor.position.set(0, 1.8 + mandapaH / 2 + 2.0, facadeZ + 0.5);
    temple.add(frontSensor);

    this.templeFrontMeshes = [
      frontSensor,
      bannerMesh,
      frontLeft,
      frontRight,
      frontLintel,
      pedWall,
      medallion,
      outerBlueArch,
      middleYellowArch,
      innerRedArch,
      pedArch,
      archRosette,
      donationBox,
      bottomEaveTrim,
      leftEaveTrim,
      rightEaveTrim
    ];

    // ==========================================
    // 4. SHIKHARA (The Majestic Katyuri Stone Tower)
    // ==========================================
    const shikharaBaseW = 12;
    const shikharaBaseL = 12;
    const shikharaBaseH = 8;
    const shikharaZ = -6;

    // Shikhara Base
    const sBaseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(shikharaBaseW, shikharaBaseH, shikharaBaseL),
      this.stoneMat
    );
    sBaseMesh.position.set(0, 1.8 + shikharaBaseH / 2, shikharaZ);
    sBaseMesh.castShadow = true;
    temple.add(sBaseMesh);

    // 12 Stepped Tiers tapering toward the summit (classic Katyuri architecture)
    const tiers = 12;
    let currY = 1.8 + shikharaBaseH;
    let currW = shikharaBaseW;
    let currL = shikharaBaseL;
    const tierH = 0.95;

    for (let t = 0; t < tiers; t++) {
      const taper = 0.65;
      currW -= taper;
      currL -= taper;

      const tierGeo = new THREE.BoxGeometry(currW, tierH, currL);
      const tierMesh = new THREE.Mesh(tierGeo, this.stoneMat);
      tierMesh.position.set(0, currY + tierH / 2, shikharaZ);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      temple.add(tierMesh);

      // Cornice edge bevel around each tier
      const corniceGeo = new THREE.BoxGeometry(currW + 0.3, 0.15, currL + 0.3);
      const corniceMesh = new THREE.Mesh(corniceGeo, this.stoneMat);
      corniceMesh.position.set(0, currY + tierH, shikharaZ);
      temple.add(corniceMesh);

      // Corner miniature shikharas / urushringas on lower tiers
      if (t === 2 || t === 5) {
        const miniW = 1.0;
        const miniH = 1.5;
        const corners = [
          [-currW / 2 + 0.4, -currL / 2 + 0.4],
          [currW / 2 - 0.4, -currL / 2 + 0.4],
          [-currW / 2 + 0.4, currL / 2 - 0.4],
          [currW / 2 - 0.4, currL / 2 - 0.4]
        ];
        corners.forEach(([cx, cz]) => {
          const mini = new THREE.Mesh(
            new THREE.ConeGeometry(miniW / 2, miniH, 4),
            this.stoneMat
          );
          mini.position.set(cx, currY + tierH + miniH / 2, shikharaZ + cz);
          temple.add(mini);
        });
      }

      currY += tierH + 0.1;
    }

    // ==========================================
    // 4b. ICONIC FRONT-FACING MINIATURE SHRINE (AEDICULE) ON SHIKHARA TOWER
    // Directly photographed in media_1788962937806.jpg on the front face of the tower!
    // ==========================================
    const towerShrineGroup = new THREE.Group();
    const t3H = tierH + 0.1;
    const t3Y = 1.8 + shikharaBaseH + 3 * t3H;
    const t3L = shikharaBaseL - 3 * 0.65;
    const t3Z = shikharaZ + t3L / 2 + 0.05;

    // Shrine base plinth with Cobalt Blue moulding
    const tShrinePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.35, 0.7),
      this.blueSolidMat
    );
    tShrinePlinth.position.set(0, t3Y + 0.2, t3Z + 0.25);
    towerShrineGroup.add(tShrinePlinth);

    // Left & right golden pilaster columns
    [-0.62, 0.62].forEach(px => {
      const pCol = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 1.4, 0.18),
        this.paintedYellowMat
      );
      pCol.position.set(px, t3Y + 0.95, t3Z + 0.28);
      towerShrineGroup.add(pCol);
    });

    // Dark niche recess
    const tShrineRecess = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.35, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
    );
    tShrineRecess.position.set(0, t3Y + 0.95, t3Z + 0.18);
    towerShrineGroup.add(tShrineRecess);

    // Gilded Deity Idol (Murti in Pranam Mudra)
    const deityIdolBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 0.9, 10),
      this.goldMat
    );
    deityIdolBody.position.set(0, t3Y + 0.75, t3Z + 0.28);
    towerShrineGroup.add(deityIdolBody);

    const deityIdolHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 10),
      this.goldMat
    );
    deityIdolHead.position.set(0, t3Y + 1.25, t3Z + 0.28);
    towerShrineGroup.add(deityIdolHead);

    const deityHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.03, 8, 16),
      this.goldMat
    );
    deityHalo.position.set(0, t3Y + 1.25, t3Z + 0.30);
    towerShrineGroup.add(deityHalo);

    // Cobalt Blue Arched Roof Frame
    const tShrineArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.12, 8, 20, Math.PI),
      this.blueSolidMat
    );
    tShrineArch.position.set(0, t3Y + 1.55, t3Z + 0.28);
    towerShrineGroup.add(tShrineArch);

    // Golden Miniature Finial on Shrine Peak
    const tShrineFinial = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.45, 8),
      this.goldMat
    );
    tShrineFinial.position.set(0, t3Y + 2.3, t3Z + 0.28);
    towerShrineGroup.add(tShrineFinial);

    temple.add(towerShrineGroup);

    // ==========================================
    // 5. TRADITIONAL PAHARI WOODEN PAVILION & AMALAKA
    // Modeled faithfully from media_1788962937806.jpg & ancient Deodar timber architecture
    // ==========================================
    const pavW = currW * 0.95;
    const pavH = 1.4;
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.75 }); // Dark Himalayan deodar timber

    // Wooden base cornice platform
    const pavBase = new THREE.Mesh(new THREE.BoxGeometry(pavW + 0.3, 0.25, pavW + 0.3), woodMat);
    pavBase.position.set(0, currY + 0.12, shikharaZ);
    pavBase.castShadow = true;
    temple.add(pavBase);

    // 4 Corner Carved Wooden Bracket Pillars
    const colW = 0.26;
    const colOffset = pavW / 2 - 0.2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(colW, pavH, colW), woodMat);
      col.position.set(px * colOffset, currY + 0.25 + pavH / 2, shikharaZ + pz * colOffset);
      col.castShadow = true;
      temple.add(col);

      // Warm hanging lantern under each corner eave
      const cornerLamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffe082, emissive: 0xffaa00, emissiveIntensity: 0.9 })
      );
      cornerLamp.position.set(px * (colOffset + 0.25), currY + pavH + 0.1, shikharaZ + pz * (colOffset + 0.25));
      temple.add(cornerLamp);
    });

    // Decorative Alternating Festive Balcony Panels (Red, Yellow, Blue valance festoons)
    const valanceColors = [this.paintedRedMat, this.paintedYellowMat, this.blueSolidMat, this.paintedRedMat];
    [
      [-1, 0, pavW - 0.4, 0.35],
      [1, 0, pavW - 0.4, 0.35],
      [0, -1, 0.35, pavW - 0.4],
      [0, 1, 0.35, pavW - 0.4]
    ].forEach(([rx, rz, rw, rl], fIdx) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.48, rl), valanceColors[fIdx % valanceColors.length]);
      panel.position.set(rx * colOffset, currY + 0.52, shikharaZ + rz * colOffset);
      temple.add(panel);
    });

    // Warm golden diya illumination inside the pavilion
    const pavLight = new THREE.PointLight(0xffb74d, 1.4, 14, 1.8);
    pavLight.position.set(0, currY + pavH * 0.6, shikharaZ);
    temple.add(pavLight);

    // Pavilion Overhanging Hipped Canopy Roof with COBALT BLUE EAVE TRIM
    const canopyRoofGeo = new THREE.ConeGeometry(pavW * 0.85, 0.75, 4);
    canopyRoofGeo.rotateY(Math.PI / 4);
    const canopyRoof = new THREE.Mesh(canopyRoofGeo, this.slateRoofMat);
    canopyRoof.position.set(0, currY + pavH + 0.5, shikharaZ);
    canopyRoof.castShadow = true;
    temple.add(canopyRoof);

    // Vibrant Cobalt Blue Metal Eave Fascia around pavilion
    const pavBlueEave = new THREE.Mesh(
      new THREE.BoxGeometry(pavW + 0.6, 0.22, pavW + 0.6),
      this.blueTrimMat
    );
    pavBlueEave.position.set(0, currY + pavH + 0.18, shikharaZ);
    pavBlueEave.castShadow = true;
    temple.add(pavBlueEave);

    currY += pavH + 0.65;

    // Fluted Stone Amalaka Disc
    const amalakaGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.9, 16);
    const amalakaMesh = new THREE.Mesh(amalakaGeo, this.stoneMat);
    amalakaMesh.position.set(0, currY + 0.45, shikharaZ);
    amalakaMesh.castShadow = true;
    temple.add(amalakaMesh);
    currY += 0.9;

    // Gilded Golden Kalash (Pitcher-shaped finial)
    const kalashBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.2, 0.8, 16),
      this.goldMat
    );
    kalashBase.position.set(0, currY + 0.4, shikharaZ);
    temple.add(kalashBase);
    currY += 0.8;

    const kalashPot = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      this.goldMat
    );
    kalashPot.position.set(0, currY + 0.7, shikharaZ);
    kalashPot.castShadow = true;
    temple.add(kalashPot);
    currY += 1.4;

    // Golden Spire (Stupika)
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.8, 12),
      this.goldMat
    );
    spire.position.set(0, currY + 0.9, shikharaZ);
    temple.add(spire);
    currY += 1.8;

    // Golden Shiva Trishul (Trident) at summit
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8),
      this.goldMat
    );
    pole.position.set(0, currY + 1.0, shikharaZ);
    temple.add(pole);

    const prongGeo = new THREE.ConeGeometry(0.12, 0.8, 8);
    const centerProng = new THREE.Mesh(prongGeo, this.goldMat);
    centerProng.position.set(0, currY + 2.0, shikharaZ);
    temple.add(centerProng);

    const leftProng = new THREE.Mesh(prongGeo, this.goldMat);
    leftProng.rotation.z = -0.3;
    leftProng.position.set(-0.4, currY + 1.8, shikharaZ);
    temple.add(leftProng);

    const rightProng = new THREE.Mesh(prongGeo, this.goldMat);
    rightProng.rotation.z = 0.3;
    rightProng.position.set(0.4, currY + 1.8, shikharaZ);
    temple.add(rightProng);

    // Fluttering Saffron Temple Flag (Dhwaja)
    const flagGeo = new THREE.BufferGeometry();
    const flagW = 1.6;
    const flagH = 1.0;
    const flagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(flagW, flagH, 8, 4),
      this.saffronMat
    );
    flagMesh.position.set(flagW / 2 + 0.08, currY + 1.4, shikharaZ);
    temple.add(flagMesh);
    this.flags.push(flagMesh);

    // Build authentic golden Aarti fairy light strings & festive illumination (authentic Aarti darshan)
    this.buildAartiFairyLights(temple);

    // Add temple to main group
    this.group.add(temple);

    // Perimeter Wall Colliders (Doorway at center is OPEN for walking inside!)
    // Left outer wall
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(-mandapaW / 2 + wallThick / 2, 6, mandapaZ),
        new THREE.Vector3(wallThick + 0.2, 12, mandapaL)
      )
    );
    // Right outer wall
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(mandapaW / 2 - wallThick / 2, 6, mandapaZ),
        new THREE.Vector3(wallThick + 0.2, 12, mandapaL)
      )
    );
    // Back wall / Shikhara base
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(0, 6, shikharaZ - 2),
        new THREE.Vector3(shikharaBaseW + 2, 14, shikharaBaseL + 4)
      )
    );
    // Front wall Left flank
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(-mandapaW / 2 + sideWallW / 2, 6, mandapaZ + mandapaL / 2 - wallThick / 2),
        new THREE.Vector3(sideWallW, 12, wallThick + 0.4)
      )
    );
    // Front wall Right flank
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(mandapaW / 2 - sideWallW / 2, 6, mandapaZ + mandapaL / 2 - wallThick / 2),
        new THREE.Vector3(sideWallW, 12, wallThick + 0.4)
      )
    );
    // Altar railing collider inside sanctum (stopping player right in front of Lingam)
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(0, 2.5, 3.8),
        new THREE.Vector3(5.2, 4, 3.4)
      )
    );
  }

  // =========================================================================
  // AARTI FAIRY LIGHT STRINGS & FESTIVAL ILLUMINATION
  // Reconstructs the genuine night illumination:
  // golden LED strips outlining Mandapa gables, entrance arch,
  // Shikhara corners/tiers, and glowing golden spotlights.
  // =========================================================================
  buildAartiFairyLights(temple) {
    const lightPoints = [];

    // 1. Mandapa Front Gabled Roof Eaves (Triangular outline)
    const zGable = 16.15;
    const apexY = 14.85;
    const baseY = 10.35;
    const halfW = 7.85;

    // Horizontal bottom eave baseline
    const stepsBase = 46;
    for (let i = 0; i <= stepsBase; i++) {
      const t = i / stepsBase;
      const x = -halfW + t * (halfW * 2);
      lightPoints.push(new THREE.Vector3(x, baseY, zGable));
    }

    // Left slope (left corner up to apex)
    const stepsSlope = 28;
    for (let i = 1; i <= stepsSlope; i++) {
      const t = i / stepsSlope;
      const x = -halfW + t * halfW;
      const y = baseY + t * (apexY - baseY);
      lightPoints.push(new THREE.Vector3(x, y, zGable));
    }

    // Right slope (apex down to right corner)
    for (let i = 1; i < stepsSlope; i++) {
      const t = i / stepsSlope;
      const x = 0 + t * halfW;
      const y = apexY - t * (apexY - baseY);
      lightPoints.push(new THREE.Vector3(x, y, zGable));
    }

    // 2. Entrance Arch & Doorway Frame (Concentric arch contour)
    const zDoor = 15.2;
    const archRadius = 2.05;
    const archCenterY = 5.0;
    const stepsArch = 24;
    for (let i = 0; i <= stepsArch; i++) {
      const theta = (i / stepsArch) * Math.PI;
      const x = archRadius * Math.cos(theta);
      const y = archCenterY + archRadius * Math.sin(theta);
      lightPoints.push(new THREE.Vector3(x, y, zDoor));
    }

    // Vertical Doorway Jambs
    for (let y = 1.9; y < archCenterY; y += 0.35) {
      lightPoints.push(new THREE.Vector3(-archRadius, y, zDoor));
      lightPoints.push(new THREE.Vector3(archRadius, y, zDoor));
    }

    // 3. Shikhara (Tower) Vertical Corner Ribs
    const shikharaZ = -6.0;
    const towerHalfW = 5.2;
    const towerHalfD = 5.0;
    const towerCorners = [
      { x: -1, z: -1 },
      { x: 1, z: -1 },
      { x: -1, z: 1 },
      { x: 1, z: 1 }
    ];

    towerCorners.forEach(c => {
      const stepsTower = 30;
      for (let i = 0; i <= stepsTower; i++) {
        const t = i / stepsTower;
        const y = 10.5 + t * 13.0; // from 10.5m to 23.5m
        const taper = 1.0 - t * 0.28;
        const x = c.x * towerHalfW * taper;
        const z = shikharaZ + c.z * towerHalfD * taper;
        lightPoints.push(new THREE.Vector3(x, y, z));
      }
    });

    // 4. Shikhara Horizontal Belt Tiers
    const beltTiers = [
      { y: 13.5, taper: 0.94 },
      { y: 17.5, taper: 0.85 },
      { y: 21.0, taper: 0.76 }
    ];

    beltTiers.forEach(tier => {
      const w = towerHalfW * tier.taper;
      const d = towerHalfD * tier.taper;
      const stepsSide = 12;
      for (let i = 0; i < stepsSide; i++) {
        const t = i / stepsSide;
        lightPoints.push(new THREE.Vector3(-w + t * (2 * w), tier.y, shikharaZ + d));
        lightPoints.push(new THREE.Vector3(w, tier.y, shikharaZ + d - t * (2 * d)));
        lightPoints.push(new THREE.Vector3(w - t * (2 * w), tier.y, shikharaZ - d));
        lightPoints.push(new THREE.Vector3(-w, tier.y, shikharaZ - d + t * (2 * d)));
      }
    });

    // 5. Top Pavilion & Kalash Base Ring
    const kalashY = 24.2;
    const ringRadius = 2.4;
    const stepsRing = 24;
    for (let i = 0; i < stepsRing; i++) {
      const theta = (i / stepsRing) * Math.PI * 2;
      lightPoints.push(new THREE.Vector3(ringRadius * Math.cos(theta), kalashY, shikharaZ + ringRadius * Math.sin(theta)));
    }

    // InstancedMesh for all light bulbs (High Performance single draw-call)
    const bulbGeo = new THREE.SphereGeometry(0.085, 6, 6);
    this.fairyLightsMesh = new THREE.InstancedMesh(bulbGeo, this.fairyLightMat, lightPoints.length);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < lightPoints.length; i++) {
      dummy.position.copy(lightPoints[i]);
      dummy.updateMatrix();
      this.fairyLightsMesh.setMatrixAt(i, dummy.matrix);
    }
    this.fairyLightsMesh.instanceMatrix.needsUpdate = true;
    temple.add(this.fairyLightsMesh);

    // 6. Facade Floodlights & Kalash Spire Lighting
    this.facadeSpotlight = new THREE.SpotLight(0xffbe55, 0.0, 55, Math.PI / 3.2, 0.45, 1.2);
    this.facadeSpotlight.position.set(0, 2.0, 28.0);
    this.facadeSpotlight.target.position.set(0, 8.0, 15.0);
    temple.add(this.facadeSpotlight);
    temple.add(this.facadeSpotlight.target);

    this.kalashSpotlight = new THREE.SpotLight(0xffd700, 0.0, 45, Math.PI / 4.0, 0.35, 1.2);
    this.kalashSpotlight.position.set(0, 12.0, 12.0);
    this.kalashSpotlight.target.position.set(0, 25.5, shikharaZ);
    temple.add(this.kalashSpotlight);
    temple.add(this.kalashSpotlight.target);

    // Warm golden sanctum entrance light pouring out onto the stone steps
    this.entranceGlowLight = new THREE.PointLight(0xff8811, 0.0, 22, 1.4);
    this.entranceGlowLight.position.set(0, 3.8, 14.8);
    temple.add(this.entranceGlowLight);
  }

  // =========================================================================
  // BHIM SHILA (भीम शिला) - The Miraculous Divine Protector Megalith
  // Reconstructed directly from media_1788948571392.jpg, media_1788948600392.png,
  // media_1788948607024.png, and media_1788948623861.png!
  // Sits immediately behind the temple Shikhara (Z = -23.5) with authentic
  // weathered granite facets, marigold garlands, sacred vermilion tilak,
  // puja altar with burning diyas, saffron dhwaja, and prayer bell.
  // =========================================================================
  buildBhimShila() {
    const bhimGroup = new THREE.Group();
    const bhimZ = -23.5;
    const bhimX = 0;
    const bhimY = 2.5;

    const texLoader = new THREE.TextureLoader();
    const bhimTex = texLoader.load('assets/bhim_shila_texture.png');
    bhimTex.wrapS = THREE.RepeatWrapping;
    bhimTex.wrapT = THREE.RepeatWrapping;
    bhimTex.repeat.set(1.5, 1.0);

    // 1. Authentic "Stone Cylindrical" Monolithic Rock Megalith (14.4m long, 5.4m diameter)
    // Modeled as a massive rounded horizontal stone cylinder with deformed granite facets
    const rockRadius = 2.65;
    const rockLength = 14.4;
    const rockH = rockRadius * 2;
    const rockD = rockRadius * 2;
    const rockW = rockLength;
    const rockGeo = new THREE.CylinderGeometry(rockRadius * 0.95, rockRadius, rockLength, 36, 18, false);
    // Align horizontally along the X-axis across the back of the temple
    rockGeo.rotateZ(Math.PI / 2);

    const pos = rockGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Normalization
      const nx = x / (rockLength / 2);
      const rad = Math.hypot(y, z);

      // Flatten bottom slightly so it rests firmly on the courtyard flagstones
      if (y < -rockRadius * 0.75) {
        y = -rockRadius * 0.75 + (y + rockRadius * 0.75) * 0.35;
      }

      // Natural granite fracture crags, striations, and glacial cleavage
      const crags = Math.sin(x * 0.7) * 0.32 + 
                    Math.cos(y * 1.2) * 0.25 + 
                    Math.sin(z * 1.1) * 0.28 +
                    Math.sin(x * 2.2 + y * 1.8) * 0.12;

      // Blunt flat fracture face on eastern end (as seen in photo 3)
      if (nx > 0.88) {
        x += (Math.sin(y * 2.5) + Math.cos(z * 2.0)) * 0.12;
      } else if (nx < -0.88) {
        // Tapered western end
        y *= 0.92;
        z *= 0.92;
      }

      pos.setXYZ(i, x + crags * 0.35, y + crags * 0.28, z + crags * 0.32);
    }
    rockGeo.computeVertexNormals();

    // Authentic Rock Colour Material (rich warm weathered Himalayan granite)
    const bhimMat = new THREE.MeshStandardMaterial({
      map: bhimTex,
      bumpMap: bhimTex,
      bumpScale: 0.24,
      roughness: 0.92,
      metalness: 0.04,
      color: 0xffffff // Preserves 100% authentic earthy brown & slate granite rock tones from texture
    });

    const bhimMesh = new THREE.Mesh(rockGeo, bhimMat);
    bhimMesh.position.set(bhimX, bhimY, bhimZ);
    bhimMesh.castShadow = true;
    bhimMesh.receiveShadow = true;
    bhimMesh.userData = { isBhimShila: true, name: 'Bhim Shila (Divine Protector Stone)' };
    bhimGroup.add(bhimMesh);
    this.bhimShilaMeshes.push(bhimMesh);

    // 2. Sacred Marigold Flower Garlands draped across Bhim Shila (as in photos 1 & 2)
    const garlandGroup = new THREE.Group();
    // Top crest garland loops
    for (let loop = 0; loop < 3; loop++) {
      const startX = -6.2 + loop * 4.2;
      const endX = startX + 4.0;
      const loopCount = 22;
      for (let g = 0; g <= loopCount; g++) {
        const t = g / loopCount;
        const gx = startX + (endX - startX) * t;
        const sag = Math.sin(t * Math.PI) * 0.75;
        const gy = bhimY + rockH / 2 - 0.15 - sag;
        const gz = bhimZ + rockD / 2 + 0.15 + (loop % 2 === 0 ? 0.08 : -0.05);

        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 6, 6),
          (g % 2 === 0) ? this.marigoldMat : new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.9 })
        );
        flower.position.set(gx, gy, gz);
        garlandGroup.add(flower);
      }
    }
    bhimGroup.add(garlandGroup);

    // 3. Sacred Puja Altar Platform at base of Bhim Shila (photos 1 & 2)
    const altarGeo = new THREE.BoxGeometry(2.4, 0.45, 1.4);
    const altarMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 }); // Sacred red cloth (chunri)
    const altarMesh = new THREE.Mesh(altarGeo, altarMat);
    altarMesh.position.set(1.2, 0.22, bhimZ + rockD / 2 + 0.85);
    altarMesh.receiveShadow = true;
    bhimGroup.add(altarMesh);

    // Brass Puja Thali with Diya & sacred offerings
    const thali = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.38, 0.06, 12),
      this.brassMat
    );
    thali.position.set(1.2, 0.48, bhimZ + rockD / 2 + 0.85);
    bhimGroup.add(thali);

    // Burning Brass Diya Flame
    const diyaFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.22, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    diyaFlame.position.set(1.2, 0.62, bhimZ + rockD / 2 + 0.85);
    bhimGroup.add(diyaFlame);

    // Diya warm flickering light
    const diyaLight = new THREE.PointLight(0xffaa22, 1.5, 14, 1.8);
    diyaLight.position.set(1.2, 0.8, bhimZ + rockD / 2 + 0.85);
    bhimGroup.add(diyaLight);
    this.pointLights.push({ light: diyaLight, baseIntensity: 1.5 });

    // 4. Saffron Dhwaja Flag planted at side of Bhim Shila
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 5.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    flagPole.position.set(-6.8, 2.6, bhimZ + rockD / 2 + 0.3);
    flagPole.castShadow = true;
    bhimGroup.add(flagPole);

    const bhimFlag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.85, 8, 4),
      this.saffronMat
    );
    bhimFlag.position.set(-6.8 + 0.75, 4.8, bhimZ + rockD / 2 + 0.3);
    bhimGroup.add(bhimFlag);
    this.flags.push(bhimFlag);

    // 5. Dedicated Puja Bell on wooden frame beside Bhim Shila
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    const bellPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), frameMat);
    bellPost.position.set(6.2, 1.6, bhimZ + rockD / 2 + 0.4);
    bellPost.castShadow = true;
    bhimGroup.add(bellPost);

    const bellBeam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.18), frameMat);
    bellBeam.position.set(6.2, 3.1, bhimZ + rockD / 2 + 0.4);
    bhimGroup.add(bellBeam);

    const bhimBellGroup = new THREE.Group();
    bhimBellGroup.position.set(6.2, 2.85, bhimZ + rockD / 2 + 0.4);

    const bellMesh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 14), this.brassMat);
    bellMesh.rotation.x = Math.PI;
    bellMesh.position.y = -0.22;
    bellMesh.castShadow = true;
    bellMesh.userData = { isBell: true, bellIndex: this.bells.length };
    bhimBellGroup.add(bellMesh);
    bhimGroup.add(bhimBellGroup);

    this.bells.push({ group: bhimBellGroup, mesh: bellMesh, swing: 0 });

    // 6. Winter Snow Drifts bank against the northern base of Bhim Shila (matching media_1788948623861.png)
    const snowDriftGeo = new THREE.ConeGeometry(4.2, 1.6, 12);
    const snowDriftMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.95,
      metalness: 0.0
    });
    
    // North snow drift
    const northSnow = new THREE.Mesh(snowDriftGeo, snowDriftMat);
    northSnow.scale.set(3.2, 0.9, 1.4);
    northSnow.position.set(0, 0.6, bhimZ - rockD / 2 - 0.4);
    bhimGroup.add(northSnow);

    // Left snow drift
    const leftSnow = new THREE.Mesh(snowDriftGeo, snowDriftMat);
    leftSnow.scale.set(1.4, 0.8, 1.6);
    leftSnow.position.set(-6.8, 0.5, bhimZ);
    bhimGroup.add(leftSnow);

    // Right snow drift
    const rightSnow = new THREE.Mesh(snowDriftGeo, snowDriftMat);
    rightSnow.scale.set(1.4, 0.8, 1.6);
    rightSnow.position.set(6.8, 0.5, bhimZ);
    bhimGroup.add(rightSnow);

    // 7. Physics Colliders for Bhim Shila (blocking player walking through rock)
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(bhimX, bhimY, bhimZ),
        new THREE.Vector3(rockW + 0.6, rockH + 2.0, rockD + 0.6)
      )
    );
    // Puja Altar collider
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(1.2, 1.0, bhimZ + rockD / 2 + 0.85),
        new THREE.Vector3(2.8, 2.2, 1.8)
      )
    );

    this.group.add(bhimGroup);
  }

  // Sacred Nandi Bull statue facing temple entrance - AUTHENTIC 3D SCULPTED MONOLITH
  // Matching media_1788940524306.png & media_1788940513379.png from all 360 degrees!
  buildNandi() {
    const nandiGroup = new THREE.Group();
    const nandiZ = 24.5; // Courtyard center, facing temple

    // 1. PBR Himalayan Granite & Sacred Materials
    const graniteTex = TextureGenerator.getNandiGraniteTexture();
    const nandiGraniteMat = new THREE.MeshStandardMaterial({
      map: graniteTex,
      roughness: 0.65,
      metalness: 0.14,
      bumpMap: graniteTex,
      bumpScale: 0.12
    });

    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.52,
      metalness: 0.22
    });

    const eyeIrisMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      emissive: 0x440808,
      emissiveIntensity: 0.3
    });

    const eyeKajalMat = new THREE.MeshStandardMaterial({
      color: 0x111113,
      roughness: 0.85
    });

    const eyeScleraMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      roughness: 0.5
    });

    const malaMat = new THREE.MeshStandardMaterial({
      color: 0x3d3a35,
      roughness: 0.6,
      metalness: 0.28
    });

    const bellBronzeMat = new THREE.MeshStandardMaterial({
      color: 0xc29b38,
      roughness: 0.45,
      metalness: 0.65
    });

    const saffronOmTex = TextureGenerator.getNandiOmTexture();
    const omDecalMat = new THREE.MeshStandardMaterial({
      map: saffronOmTex,
      transparent: true,
      roughness: 0.55,
      emissive: 0x442200,
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide
    });

    const marigoldYellow = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.85 });
    const marigoldOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.85 });
    const bilvaGreen = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    // 2. Authentic Raised Painted Pedestal (Bright Golden Yellow Body & Royal Blue Mouldings as in media_1788962937806.jpg)
    const plinthMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.2, 5.4),
      this.nandiPedestalYellowMat
    );
    plinthMesh.position.set(0, 0.6, nandiZ);
    plinthMesh.receiveShadow = true;
    plinthMesh.castShadow = true;
    nandiGroup.add(plinthMesh);

    // Royal Blue top moulding around pedestal (directly matching reference photo)
    const topBlueBorder = new THREE.Mesh(
      new THREE.BoxGeometry(4.36, 0.22, 5.56),
      this.nandiPedestalBlueMat
    );
    topBlueBorder.position.set(0, 1.15, nandiZ);
    nandiGroup.add(topBlueBorder);

    // Royal Blue base moulding around bottom of pedestal
    const bottomBlueBorder = new THREE.Mesh(
      new THREE.BoxGeometry(4.42, 0.20, 5.62),
      this.nandiPedestalBlueMat
    );
    bottomBlueBorder.position.set(0, 0.10, nandiZ);
    nandiGroup.add(bottomBlueBorder);

    // Flower petal offerings and bilva patra scattered on the pedestal
    for (let p = 0; p < 28; p++) {
      const px = (Math.random() - 0.5) * 3.5;
      const pz = nandiZ + (Math.random() - 0.5) * 4.6;
      const isGreen = Math.random() > 0.7;
      const petalMat = isGreen ? bilvaGreen : (Math.random() > 0.5 ? marigoldYellow : marigoldOrange);
      const petal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.035, 6), petalMat);
      petal.position.set(px, 1.25, pz);
      nandiGroup.add(petal);
    }

    // Burning brass diyas on the 4 corners of the pedestal
    const cornerDiyas = [
      { x: -1.75, z: nandiZ - 2.25 },
      { x: 1.75, z: nandiZ - 2.25 },
      { x: -1.75, z: nandiZ + 2.25 },
      { x: 1.75, z: nandiZ + 2.25 }
    ];
    cornerDiyas.forEach(pos => {
      const diya = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.09, 0.11, 10), this.brassMat);
      diya.position.set(pos.x, 1.28, pos.z);
      nandiGroup.add(diya);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.15, 6), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      flame.position.set(pos.x, 1.4, pos.z);
      nandiGroup.add(flame);
    });

    // =========================================================================
    // 3. 3D ORGANIC SCULPTED NANDI BULL (Monolithic Kedarnath Granite Statue)
    // =========================================================================
    const bullGroup = new THREE.Group();
    bullGroup.position.set(0, 1.2, nandiZ); // Sits on top of pedestal at y = 1.2

    // Helper: make meshes cast and receive shadow
    const addSculpt = (mesh, parent = bullGroup) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { isNandi: true };
      parent.add(mesh);
      return mesh;
    };

    // A. SOLID FLATTENED BASE (Anchors the monolith firmly onto the plinth)
    const baseSlabGeo = new THREE.CylinderGeometry(1.35, 1.48, 0.35, 32);
    const baseSlab = new THREE.Mesh(baseSlabGeo, nandiGraniteMat);
    baseSlab.scale.set(1.22, 1.0, 1.78);
    baseSlab.position.set(0, 0.16, 0.0);
    addSculpt(baseSlab);

    // B. RECUMBENT TORSO & FLANKS
    // 1. Muscular Rounded Hindquarters / Rump (facing +Z towards courtyard)
    const rumpGeo = new THREE.SphereGeometry(1.18, 32, 24);
    const rumpMesh = new THREE.Mesh(rumpGeo, nandiGraniteMat);
    rumpMesh.scale.set(1.36, 0.96, 1.26);
    rumpMesh.position.set(0, 0.92, 0.65);
    addSculpt(rumpMesh);

    // 2. Heavy Mid-Body Abdomen / Flank Barrel
    const barrelGeo = new THREE.CylinderGeometry(1.06, 1.18, 1.35, 32, 8);
    const barrelMesh = new THREE.Mesh(barrelGeo, nandiGraniteMat);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.88, 0.0);
    addSculpt(barrelMesh);

    // 3. Broad Powerful Front Shoulders & Chest (tapering to -Z towards temple)
    const shoulderGeo = new THREE.SphereGeometry(1.02, 32, 24);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, nandiGraniteMat);
    shoulderMesh.scale.set(1.26, 0.96, 1.1);
    shoulderMesh.position.set(0, 0.94, -0.65);
    addSculpt(shoulderMesh);

    // 4. Lower Breast extending between front folded legs
    const breastGeo = new THREE.SphereGeometry(0.78, 24, 16);
    const breastMesh = new THREE.Mesh(breastGeo, nandiGraniteMat);
    breastMesh.scale.set(1.1, 0.88, 1.05);
    breastMesh.position.set(0, 0.72, -1.25);
    addSculpt(breastMesh);

    // C. THE SACRED HUMP (KAKUD)
    // Iconic rounded Zebu hump on upper spine (visible in media_1788940524306.png & media_1788940513379.png)
    const humpGeo = new THREE.SphereGeometry(0.76, 32, 24);
    const humpMesh = new THREE.Mesh(humpGeo, nandiGraniteMat);
    humpMesh.scale.set(0.85, 1.34, 1.16);
    humpMesh.rotation.x = 0.22; // Gently sloping backward
    humpMesh.position.set(0, 1.86, -0.42);
    addSculpt(humpMesh);

    // Sacred Saffron/Yellow Ceremonial Cloth (Jhool) draped over Nandi's back and hump (as in media_1788962937806.jpg)
    const jhoolMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const jhoolMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.24, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2.2),
      jhoolMat
    );
    jhoolMesh.scale.set(1.15, 0.95, 1.4);
    jhoolMesh.position.set(0, 1.05, 0.2);
    addSculpt(jhoolMesh);

    // Gold border trim around the ceremonial cloth
    const jhoolTrim = new THREE.Mesh(
      new THREE.TorusGeometry(1.26, 0.04, 8, 28),
      this.goldMat
    );
    jhoolTrim.scale.set(1.15, 1.4, 1.0);
    jhoolTrim.rotation.x = Math.PI / 2;
    jhoolTrim.position.set(0, 0.65, 0.2);
    addSculpt(jhoolTrim);

    // D. POWERFUL ARCHED NECK (Angled upward at ~42° towards temple)
    const neckGeo = new THREE.CylinderGeometry(0.68, 0.9, 1.2, 28);
    const neckMesh = new THREE.Mesh(neckGeo, nandiGraniteMat);
    neckMesh.rotation.x = -0.58;
    neckMesh.position.set(0, 1.48, -1.1);
    addSculpt(neckMesh);

    // E. THE DEWLAP (GALAKAMBALA - Sculpted Throat Skin Folds)
    // Graceful vertical folds hanging from chin to chest with chiseled horizontal ridges
    const dewlapGroup = new THREE.Group();
    dewlapGroup.position.set(0, 1.2, -1.42);
    const dewlapBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.12, 0.88),
      nandiGraniteMat
    );
    addSculpt(dewlapBase, dewlapGroup);

    // Horizontal carved stone skin fold ridges along the dewlap
    for (let r = 0; r < 4; r++) {
      const ridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.76 - r * 0.1, 12),
        nandiGraniteMat
      );
      ridge.rotation.z = Math.PI / 2;
      ridge.position.set(0, -0.38 + r * 0.24, -0.35 + r * 0.1);
      addSculpt(ridge, dewlapGroup);
    }
    bullGroup.add(dewlapGroup);

    // F. DEVOTIONAL UPWARD-TILTED HEAD & MUZZLE (~20° upward tilt facing temple entrance)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.12, -1.65);
    headGroup.rotation.x = -0.32; // Devotional upward look towards Lord Shiva in sanctum

    // Cranium & Forehead
    const skullGeo = new THREE.SphereGeometry(0.58, 28, 20);
    const skullMesh = new THREE.Mesh(skullGeo, nandiGraniteMat);
    skullMesh.scale.set(0.95, 0.88, 1.12);
    addSculpt(skullMesh, headGroup);

    // Flat frontal brow ridge
    const browMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.2, 0.45),
      nandiGraniteMat
    );
    browMesh.position.set(0, 0.22, -0.22);
    addSculpt(browMesh, headGroup);

    // Bovine Snout & Muzzle
    const snoutMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.54, 0.85, 24),
      nandiGraniteMat
    );
    snoutMesh.rotation.x = Math.PI / 2;
    snoutMesh.position.set(0, -0.06, -0.62);
    addSculpt(snoutMesh, headGroup);

    // Lower Chin / Jaw
    const chinMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 18, 14),
      nandiGraniteMat
    );
    chinMesh.position.set(0, -0.24, -0.55);
    addSculpt(chinMesh, headGroup);

    // Nostril cavities (left & right)
    [-0.18, 0.18].forEach(nx => {
      const nostril = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        eyeKajalMat
      );
      nostril.position.set(nx, 0.02, -1.02);
      addSculpt(nostril, headGroup);
    });

    // Mouth slit indentation
    const mouthMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.04, 0.18),
      eyeKajalMat
    );
    mouthMesh.position.set(0, -0.16, -0.92);
    addSculpt(mouthMesh, headGroup);

    // Sacred flower offering on bridge of nose (matching media_1788940524306.png)
    const noseFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      marigoldYellow
    );
    noseFlower.position.set(0, 0.18, -0.78);
    addSculpt(noseFlower, headGroup);

    // G. SACRED ALMOND EYES (Painted vermilion red iris + black kajal liner as in photo)
    [-1, 1].forEach(side => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * 0.48, 0.12, -0.32);
      eyeGroup.rotation.y = side * 0.45;
      eyeGroup.rotation.x = -0.1;

      // Outer almond socket rim (black kajal)
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.035, 8, 16),
        eyeKajalMat
      );
      addSculpt(rim, eyeGroup);

      // Eye sclera
      const sclera = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        eyeScleraMat
      );
      sclera.scale.set(1.0, 0.8, 0.4);
      addSculpt(sclera, eyeGroup);

      // Vermilion red pupil/iris (as prominent in real photos)
      const iris = new THREE.Mesh(
        new THREE.CircleGeometry(0.075, 12),
        eyeIrisMat
      );
      iris.position.z = 0.055;
      addSculpt(iris, eyeGroup);

      // Chandan paste highlight near eye corner
      const chandanDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 })
      );
      chandanDot.position.set(-side * 0.12, 0.05, 0.04);
      addSculpt(chandanDot, eyeGroup);

      headGroup.add(eyeGroup);
    });

    // H. SWEEPING CURVED HORNS (Dark stone horns sweeping back over crown)
    [-1, 1].forEach(side => {
      const hornCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.28, 0.38, -0.12),
        new THREE.Vector3(side * 0.48, 0.62, 0.08),
        new THREE.Vector3(side * 0.42, 0.68, 0.32),
        new THREE.Vector3(side * 0.28, 0.62, 0.48)
      ]);
      const hornGeo = new THREE.TubeGeometry(hornCurve, 20, 0.11, 10, false);
      const hornMesh = new THREE.Mesh(hornGeo, hornMat);
      addSculpt(hornMesh, headGroup);
    });

    // I. BOVINE EARS (Positioned below horn bases, leaf-shaped, angled outward)
    [-1, 1].forEach(side => {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.56, 0.18, -0.05);
      earGroup.rotation.z = -side * 0.35;
      earGroup.rotation.y = -side * 0.45;

      const earOuter = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.48, 12),
        nandiGraniteMat
      );
      earOuter.scale.set(1.0, 1.0, 0.45);
      earOuter.rotation.x = Math.PI / 2;
      addSculpt(earOuter, earGroup);

      const earInner = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.4, 8),
        eyeKajalMat
      );
      earInner.scale.set(0.9, 0.9, 0.3);
      earInner.rotation.x = Math.PI / 2;
      earInner.position.z = 0.04;
      addSculpt(earInner, earGroup);

      headGroup.add(earGroup);
    });

    // J. FOREHEAD SACRED TILAK & CHANDAN
    // Vermilion Kumkum center stripe
    const tilakMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.38),
      eyeIrisMat
    );
    tilakMesh.position.set(0, 0.24, -0.42);
    tilakMesh.rotation.x = -0.3;
    addSculpt(tilakMesh, headGroup);

    // Sandalwood paste crescent
    const chandanCrescent = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 })
    );
    chandanCrescent.position.set(0, 0.26, -0.41);
    chandanCrescent.rotation.x = Math.PI / 2 - 0.3;
    addSculpt(chandanCrescent, headGroup);

    bullGroup.add(headGroup);

    // K. FOLDED RECUMBENT LEGS & HOOVES (Resting firmly on the pedestal)
    // 1. Front Left Leg (Folded forward along left chest flank)
    const frontLeftLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.88, 16),
      nandiGraniteMat
    );
    frontLeftLeg.rotation.x = 0.65;
    frontLeftLeg.rotation.z = 0.35;
    frontLeftLeg.position.set(-0.88, 0.34, -0.92);
    addSculpt(frontLeftLeg);

    const frontLeftHoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.24, 16),
      hornMat
    );
    frontLeftHoof.position.set(-0.76, 0.14, -1.28);
    addSculpt(frontLeftHoof);

    // 2. Front Right Leg (Folded neatly under right chest)
    const frontRightLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.82, 16),
      nandiGraniteMat
    );
    frontRightLeg.rotation.x = -0.55;
    frontRightLeg.rotation.z = -0.4;
    frontRightLeg.position.set(0.78, 0.32, -0.85);
    addSculpt(frontRightLeg);

    const frontRightHoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.24, 16),
      hornMat
    );
    frontRightHoof.position.set(0.55, 0.14, -1.18);
    addSculpt(frontRightHoof);

    // 3. Rear Left Leg (Massive haunch folded along left flank)
    const rearLeftHaunch = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 20, 16),
      nandiGraniteMat
    );
    rearLeftHaunch.scale.set(0.68, 0.95, 1.25);
    rearLeftHaunch.position.set(-1.14, 0.48, 0.65);
    addSculpt(rearLeftHaunch);

    const rearLeftHoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.24, 0.22, 14),
      hornMat
    );
    rearLeftHoof.position.set(-1.05, 0.13, 0.98);
    addSculpt(rearLeftHoof);

    // 4. Rear Right Leg (Symmetrical haunch folded along right flank)
    const rearRightHaunch = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 20, 16),
      nandiGraniteMat
    );
    rearRightHaunch.scale.set(0.68, 0.95, 1.25);
    rearRightHaunch.position.set(1.14, 0.48, 0.65);
    addSculpt(rearRightHaunch);

    const rearRightHoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.24, 0.22, 14),
      hornMat
    );
    rearRightHoof.position.set(1.05, 0.13, 0.98);
    addSculpt(rearRightHoof);

    // L. CARVED TAIL (Draping down across rear right flank)
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.26, 1.46),
      new THREE.Vector3(0.32, 0.95, 1.42),
      new THREE.Vector3(0.55, 0.55, 1.32),
      new THREE.Vector3(0.42, 0.25, 1.22)
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 16, 0.065, 8, false);
    const tailMesh = new THREE.Mesh(tailGeo, nandiGraniteMat);
    addSculpt(tailMesh);

    // Tail hair tuft at the bottom
    const tailTuft = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      hornMat
    );
    tailTuft.scale.set(1.4, 0.8, 1.0);
    tailTuft.position.set(0.42, 0.18, 1.2);
    addSculpt(tailTuft);

    // M. TRIPLE-STRAND CARVED BELL MALA (GHANTA MALA) & MARIGOLD GARLAND
    // 1. Upper Neck Stone Mala
    const upperNeckMala = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.055, 10, 32),
      malaMat
    );
    upperNeckMala.rotation.x = Math.PI / 2 - 0.58;
    upperNeckMala.position.set(0, 1.62, -1.25);
    addSculpt(upperNeckMala);

    // 2. Lower Sweeping Chest Bell Mala with Carved Pendants
    const chestMala = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.065, 10, 36),
      malaMat
    );
    chestMala.rotation.x = Math.PI / 2 - 0.45;
    chestMala.position.set(0, 1.34, -1.12);
    addSculpt(chestMala);

    // 14 Sculpted Stone Ghungroos / Bells along the chest necklace swag
    for (let b = 0; b < 14; b++) {
      const angle = -Math.PI * 0.75 + (b / 13) * Math.PI * 1.5;
      const bx = Math.sin(angle) * 0.88;
      const bz = -1.12 - Math.cos(angle) * 0.88 * Math.sin(0.45);
      const by = 1.34 - Math.cos(angle) * 0.88 * Math.cos(0.45);

      const bellGroup = new THREE.Group();
      bellGroup.position.set(bx, by, bz);

      const bellBody = new THREE.Mesh(
        new THREE.ConeGeometry(0.065, 0.12, 8),
        bellBronzeMat
      );
      bellBody.rotation.x = Math.PI;
      bellGroup.add(bellBody);

      const clapper = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        bellBronzeMat
      );
      clapper.position.y = -0.07;
      bellGroup.add(clapper);

      addSculpt(bellGroup);
    }

    // 3. Fresh Floral Marigold Garland draped around the neck
    for (let m = 0; m < 20; m++) {
      const angle = (m / 20) * Math.PI * 2;
      const mx = Math.cos(angle) * 0.78;
      const my = 1.52 + Math.sin(angle) * 0.28;
      const mz = -1.2 + Math.sin(angle) * 0.45;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 8, 8),
        (m % 2 === 0) ? marigoldYellow : marigoldOrange
      );
      flower.position.set(mx, my, mz);
      addSculpt(flower);
    }

    // N. THE SACRED SAFFRON "ॐ" (OM) CALLIGRAPHY ON LEFT FLANK
    // Prominently shown in user photo media_1788940524306.png!
    const omDecalGeo = new THREE.PlaneGeometry(1.05, 1.05);
    const omDecalMesh = new THREE.Mesh(omDecalGeo, omDecalMat);
    omDecalMesh.position.set(-1.28, 0.90, 0.48);
    omDecalMesh.rotation.y = -Math.PI / 2;
    omDecalMesh.rotation.z = -0.08; // Subtle natural curve with muscle line
    addSculpt(omDecalMesh);

    // Add full sculpted bull to nandiGroup
    nandiGroup.add(bullGroup);
    this.nandiBullMesh = bullGroup;

    // Collect all raycast targets for Nandi
    this.nandiMeshes = [bullGroup, plinthMesh];
    this.group.add(nandiGroup);

    // Solid Box Collider preventing player from clipping through pedestal and Nandi
    this.colliders.push(
      new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(0, 1.6, nandiZ),
        new THREE.Vector3(4.2, 3.2, 5.0)
      )
    );
  }

  // Interactive Hanging Temple Bells along the courtyard & gateway
  buildBellsAndDecorations() {
    const bellLocations = [
      { x: -4.5, y: 3.2, z: 22.0 },
      { x: -4.5, y: 3.2, z: 20.0 },
      { x: 4.5, y: 3.2, z: 22.0 },
      { x: 4.5, y: 3.2, z: 20.0 },
      { x: -2.2, y: 4.0, z: 15.5 }, // Near entrance
      { x: 2.2, y: 4.0, z: 15.5 }
    ];

    bellLocations.forEach((pos, idx) => {
      const bellGroup = new THREE.Group();
      bellGroup.position.set(pos.x, pos.y, pos.z);

      // Support post & beam
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8),
        this.brassMat
      );
      post.position.y = -1.7;
      bellGroup.add(post);

      // Hanging Brass Chain
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6),
        this.brassMat
      );
      chain.position.y = -0.4;
      bellGroup.add(chain);

      // Resonant Bell Body
      const bellGeo = new THREE.CylinderGeometry(0.08, 0.45, 0.6, 16, 1, true);
      const bellMesh = new THREE.Mesh(bellGeo, this.brassMat);
      bellMesh.position.y = -0.85;
      bellMesh.castShadow = true;
      bellGroup.add(bellMesh);

      // Bell Dome Top
      const domeGeo = new THREE.SphereGeometry(0.12, 12, 8);
      const dome = new THREE.Mesh(domeGeo, this.brassMat);
      dome.position.y = -0.55;
      bellGroup.add(dome);

      // Clapper
      const clapper = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        this.brassMat
      );
      clapper.position.y = -1.0;
      bellGroup.add(clapper);

      // Clickable / Interactable marker
      const bellIndex = this.bells.length;
      bellMesh.userData = { isBell: true, bellIndex: bellIndex, bellGroup: bellGroup };
      this.bells.push({ group: bellGroup, mesh: bellMesh, swing: 0 });
      this.group.add(bellGroup);
    });
  }

  // Inner Sanctum (Garbhagriha) details: Reconstructed faithfully from user photos
  // media_1788971827073.png, media_1788971874791.png, and media_1788971900497.png!
  // DIRECTLY VISIBLE FROM THE FRONT ENTRANCE DOORWAY!
  buildSanctumInterior() {
    const sanctumZ = 4.0; // Enshrined deep inside the temple, directly visible through front door!
    const texLoader = new THREE.TextureLoader();

    // Authentic sanctum photos provided by the user
    const realGoldTex = texLoader.load('assets/sanctum_darshan_real_gold.png');
    const realSilverTex = texLoader.load('assets/sanctum_darshan_real_silver.png');
    const realPujaTex = texLoader.load('assets/sanctum_darshan_real_puja.png');

    const sanctumGroup = new THREE.Group();

    // =========================================================================
    // 1. EMBOSSED GOLD & SILVER REPOUSSÉ WALLS (Photos 1, 2, 3)
    // =========================================================================
    // Back Sanctum Wall: Intricately embossed gold repoussé sheets with sacred mantras
    const backWallMat = new THREE.MeshStandardMaterial({
      map: realGoldTex,
      roughness: 0.32,
      metalness: 0.72,
      emissive: 0x442800,
      emissiveIntensity: 0.25
    });
    const backWallMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(10.5, 7.5),
      backWallMat
    );
    backWallMesh.position.set(0, 5.0, 1.2);
    sanctumGroup.add(backWallMesh);

    // Left Sanctum Wall: Silver-embossed repoussé wall with murtis backdrop (Photo 2)
    const leftWallMat = new THREE.MeshStandardMaterial({
      map: realSilverTex,
      roughness: 0.35,
      metalness: 0.65,
      emissive: 0x222222,
      emissiveIntensity: 0.15
    });
    const leftInnerWall = new THREE.Mesh(
      new THREE.PlaneGeometry(12.0, 7.5),
      leftWallMat
    );
    leftInnerWall.rotation.y = Math.PI / 2;
    leftInnerWall.position.set(-5.3, 5.0, 7.0);
    sanctumGroup.add(leftInnerWall);

    // Right Sanctum Wall: Golden embossed panel wall (Photo 3)
    const rightInnerWall = new THREE.Mesh(
      new THREE.PlaneGeometry(12.0, 7.5),
      backWallMat
    );
    rightInnerWall.rotation.y = -Math.PI / 2;
    rightInnerWall.position.set(5.3, 5.0, 7.0);
    sanctumGroup.add(rightInnerWall);

    // Back Wall Built-In Carved Stone Niche Shrine for Akhand Jyot (Photos 1 & 2)
    const wallNiche = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.6, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 })
    );
    wallNiche.position.set(2.4, 5.2, 1.35);
    sanctumGroup.add(wallNiche);

    const nicheLamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.1, 0.12, 10),
      this.brassMat
    );
    nicheLamp.position.set(2.4, 4.6, 1.45);
    sanctumGroup.add(nicheLamp);

    const nicheFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.2, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    nicheFlame.position.set(2.4, 4.75, 1.45);
    sanctumGroup.add(nicheFlame);

    // =========================================================================
    // 2. ANCIENT CARVED KATYURI SANCTUM PILLARS (Photos 2 & 3)
    // =========================================================================
    [-4.6, 4.6].forEach(px => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(px, 1.9, sanctumZ + 2.4);

      // Square carved base
      const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), this.stoneMat);
      pBase.position.y = 0.4;
      pillarGroup.add(pBase);

      // Chamfered octagonal shaft
      const pShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 4.8, 8), this.stoneMat);
      pShaft.position.y = 3.2;
      pillarGroup.add(pShaft);

      // Fluted capital & bracket lintel
      const pCap = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.38, 0.4, 16), this.stoneMat);
      pCap.position.y = 5.8;
      pillarGroup.add(pCap);

      const pBracket = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 1.1), this.stoneMat);
      pBracket.position.y = 6.1;
      pillarGroup.add(pBracket);

      sanctumGroup.add(pillarGroup);
    });

    // =========================================================================
    // 3. THE HOLY SWAYAMBHU JYOTIRLINGAM - NATURAL TRIANGULAR ROCK (Photos 1, 2, 3)
    // Lord Shiva's divine hump: natural irregular triangular monolith
    // =========================================================================
    const lingamW = 2.4;
    const lingamH = 1.75;
    const lingamD = 2.0;

    const lingamGeo = new THREE.ConeGeometry(1.25, lingamH, 16, 12);
    // Perturb vertices for natural organic rock face & Sadashiva hump ridge
    const lPos = lingamGeo.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
      let vx = lPos.getX(i);
      let vy = lPos.getY(i);
      let vz = lPos.getZ(i);

      // Flatten base
      if (vy < -lingamH * 0.4) {
        vy = -lingamH * 0.4;
      }
      // Asymmetric natural mountain rock contours
      const rockNoise = Math.sin(vx * 3.5) * 0.12 + Math.cos(vz * 3.0) * 0.14 + Math.sin(vy * 4.0) * 0.08;
      // Prominent spine ridge along the center
      const ridge = Math.exp(-vx * vx * 4.0) * 0.18;
      lPos.setXYZ(i, vx * 1.15 + rockNoise * 0.3, vy + ridge * 0.2, vz * 0.95 + rockNoise * 0.3);
    }
    lingamGeo.computeVertexNormals();

    // Authentic dark glistening sacred stone material (with sacred ghee / abhishek patina)
    const holyRockMat = new THREE.MeshStandardMaterial({
      color: 0x26231f,
      roughness: 0.38,
      metalness: 0.20,
      bumpScale: 0.25
    });
    const lingamMesh = new THREE.Mesh(lingamGeo, holyRockMat);
    lingamMesh.position.set(0, 2.5 + lingamH / 2, sanctumZ);
    lingamMesh.castShadow = true;
    lingamMesh.receiveShadow = true;
    sanctumGroup.add(lingamMesh);

    // Sacred Yellow Sandalwood (Chandan) / Turmeric (Haldi) Vertical Stripes (Photos 1, 2, 3)
    const chandanMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.6,
      emissive: 0x443300,
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide
    });
    [-0.22, 0.0, 0.22].forEach(cx => {
      const stripeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(cx * 0.3, 3.25, sanctumZ + 0.15),
        new THREE.Vector3(cx * 0.65, 2.85, sanctumZ + 0.65),
        new THREE.Vector3(cx * 0.95, 2.45, sanctumZ + 1.05)
      ]);
      const stripeGeo = new THREE.TubeGeometry(stripeCurve, 14, 0.045, 6, false);
      const stripeMesh = new THREE.Mesh(stripeGeo, chandanMat);
      sanctumGroup.add(stripeMesh);
    });

    // Fresh Bilva Patra leaves & marigold flowers adorning the rock
    for (let fl = 0; fl < 35; fl++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.35 + Math.random() * 0.85;
      const fx = Math.cos(angle) * rad;
      const fz = sanctumZ + Math.sin(angle) * rad * 0.85;
      const fy = 2.45 + (1 - rad / 1.2) * 0.65;
      const isGreen = Math.random() > 0.55;
      const isRose = !isGreen && Math.random() > 0.5;
      const flowerColor = isGreen ? 0x16a34a : (isRose ? 0xf43f5e : 0xf59e0b);
      const flMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.8 });
      const flMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 6), flMat);
      flMesh.position.set(fx, fy, fz);
      sanctumGroup.add(flMesh);
    }

    // =========================================================================
    // 4. STEPPED GOLDEN & SILVER JALHARI PEETHAM (ALTAR BASE) (Photos 1, 2, 3)
    // =========================================================================
    // Lower stepped golden base with sacred inscription border (Photo 3)
    const lowerPeetham = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.35, 4.0),
      this.goldMat
    );
    lowerPeetham.position.set(0, 2.05, sanctumZ);
    lowerPeetham.receiveShadow = true;
    sanctumGroup.add(lowerPeetham);

    // Middle stepped golden tier
    const midPeetham = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 0.28, 3.5),
      this.goldMat
    );
    midPeetham.position.set(0, 2.36, sanctumZ);
    midPeetham.receiveShadow = true;
    sanctumGroup.add(midPeetham);

    // Silver inner Jalhari basin framing the rock base (Photos 1 & 2)
    const jalhariRim = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.22, 3.0),
      this.silverMat
    );
    jalhariRim.position.set(0, 2.58, sanctumZ);
    sanctumGroup.add(jalhariRim);

    // 4 Corner Gilded Kalash Knobs on Peetham (Photo 3)
    [
      [-1.9, -1.6], [1.9, -1.6], [-1.9, 1.6], [1.9, 1.6]
    ].forEach(([kx, kz]) => {
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        this.goldMat
      );
      knob.position.set(kx, 2.75, sanctumZ + kz);
      sanctumGroup.add(knob);
    });

    // Traditional Hammered Copper & Brass Lotas (Water Kalash Pots) on ledge (Photos 1, 2, 3)
    const potLocations = [
      { x: 1.45, z: sanctumZ + 1.25, mat: this.copperMat },
      { x: -1.45, z: sanctumZ + 1.25, mat: this.brassMat },
      { x: 1.55, z: sanctumZ - 1.1, mat: this.silverMat },
      { x: -1.55, z: sanctumZ - 1.1, mat: this.copperMat }
    ];
    potLocations.forEach(p => {
      const potBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 12),
        p.mat
      );
      potBody.scale.set(1.0, 0.85, 1.0);
      potBody.position.set(p.x, 2.82, p.z);
      sanctumGroup.add(potBody);

      const potRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.10, 0.08, 12),
        p.mat
      );
      potRim.position.set(p.x, 2.98, p.z);
      sanctumGroup.add(potRim);
    });

    // Silver Donation Hundi Box on Altar Front Left (Photos 1 & 2)
    const hundiMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.55, 0.45),
      this.silverMat
    );
    hundiMesh.position.set(-1.45, 2.82, sanctumZ + 0.95);
    sanctumGroup.add(hundiMesh);

    // =========================================================================
    // 5. THE OPULENT HANGING CHHATRA (CANOPY UMBRELLA) WITH BELLS & RUDRAKSHA MALAS
    // Suspended directly above the Swayambhu Lingam (Photos 1, 2, 3)
    // =========================================================================
    const chhatraGroup = new THREE.Group();
    chhatraGroup.position.set(0, 6.4, sanctumZ);

    // Heavy ceremonial hanging chain
    const hangChain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 2.0, 8),
      this.goldMat
    );
    hangChain.position.y = 1.0;
    chhatraGroup.add(hangChain);

    // Gilded Repoussé Chhatra Canopy Dome
    const chhatraDome = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.2, 0.45, 28),
      this.goldMat
    );
    chhatraDome.position.y = 0;
    chhatraGroup.add(chhatraDome);

    // Dome apex finial
    const chhatraApex = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      this.goldMat
    );
    chhatraApex.position.y = 0.35;
    chhatraGroup.add(chhatraApex);

    // Perimeter Ring of Dangling Silver/Gold Bells & Drops (Photos 1, 2, 3)
    const numBells = 24;
    for (let b = 0; b < numBells; b++) {
      const angle = (b / numBells) * Math.PI * 2;
      const bx = Math.cos(angle) * 2.15;
      const bz = Math.sin(angle) * 2.15;

      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        this.silverMat
      );
      drop.position.set(bx, -0.35, bz);
      chhatraGroup.add(drop);

      // Hanging string
      const str = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4),
        this.goldMat
      );
      str.position.set(bx, -0.15, bz);
      chhatraGroup.add(str);
    }

    // Central Sacred Hanging Ghanta (Brass Bell) under the umbrella
    const centerBell = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.52, 16),
      this.brassMat
    );
    centerBell.rotation.x = Math.PI;
    centerBell.position.set(0, -0.7, 0);
    chhatraGroup.add(centerBell);

    // Cascading Rudraksha Malas draped downward around the central bell (Photo 3)
    const rudrakshaMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
    for (let m = 0; m < 8; m++) {
      const angle = (m / 8) * Math.PI * 2;
      const mx = Math.cos(angle) * 0.75;
      const mz = Math.sin(angle) * 0.75;
      for (let bead = 0; bead < 9; bead++) {
        const by = -0.35 - bead * 0.14;
        const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), rudrakshaMat);
        bMesh.position.set(mx * (1 - bead * 0.04), by, mz * (1 - bead * 0.04));
        chhatraGroup.add(bMesh);
      }
    }

    sanctumGroup.add(chhatraGroup);

    // =========================================================================
    // 6. LEFT WALL DAIS PANTHEON OF SCULPTED MURTIS (Photo 2)
    // Seated Lord Shiva, Parvati, Ganesha, and Rishis on raised stone bench
    // =========================================================================
    const murtiDais = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.65, 5.8),
      this.stoneMat
    );
    murtiDais.position.set(-4.2, 2.2, sanctumZ - 0.2);
    sanctumGroup.add(murtiDais);

    // Murtis Material: sacred dark carved bronze/stone with chandan touches
    const murtiMat = new THREE.MeshStandardMaterial({
      color: 0x383530,
      roughness: 0.45,
      metalness: 0.35
    });

    const murtis = [
      { name: 'Lord Shiva & Trishul', z: sanctumZ - 2.0, scale: 1.15, hasTrishul: true },
      { name: 'Parvati Mata', z: sanctumZ - 1.0, scale: 1.05, hasTrishul: false },
      { name: 'Lord Ganesha', z: sanctumZ + 0.0, scale: 0.95, hasTrishul: false },
      { name: 'Rishi / Pandava 1', z: sanctumZ + 1.0, scale: 0.90, hasTrishul: false },
      { name: 'Rishi / Pandava 2', z: sanctumZ + 2.0, scale: 0.90, hasTrishul: false }
    ];

    murtis.forEach(m => {
      const mGroup = new THREE.Group();
      mGroup.position.set(-4.1, 2.55, m.z);

      // Seated Cross-Legged Body
      const mBase = new THREE.Mesh(new THREE.BoxGeometry(0.7 * m.scale, 0.25 * m.scale, 0.5 * m.scale), murtiMat);
      mGroup.add(mBase);

      const mTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * m.scale, 0.24 * m.scale, 0.65 * m.scale, 10), murtiMat);
      mTorso.position.y = 0.45 * m.scale;
      mGroup.add(mTorso);

      const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.16 * m.scale, 10, 10), murtiMat);
      mHead.position.y = 0.9 * m.scale;
      mGroup.add(mHead);

      // Gold crown / halo
      const mCrown = new THREE.Mesh(new THREE.ConeGeometry(0.12 * m.scale, 0.25 * m.scale, 8), this.goldMat);
      mCrown.position.y = 1.12 * m.scale;
      mGroup.add(mCrown);

      // Shiva Trishul (for first murti)
      if (m.hasTrishul) {
        const trishPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6), this.brassMat);
        trishPole.position.set(0.35, 0.9, 0.1);
        mGroup.add(trishPole);

        const trishTop = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), this.brassMat);
        trishTop.position.set(0.35, 1.9, 0.1);
        mGroup.add(trishTop);
      }

      sanctumGroup.add(mGroup);
    });

    // =========================================================================
    // 7. SEATED VEDIC PRIEST (PUJARI) CONDUCTING PUJA (Photos 1 & 3)
    // Saffron robes, seated beside the altar offering prayers
    // =========================================================================
    const priestGroup = new THREE.Group();
    priestGroup.position.set(2.4, 1.9, sanctumZ + 0.8);

    // Carpet / Asana
    const asana = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 })
    );
    asana.position.y = 0.04;
    priestGroup.add(asana);

    // Seated folded legs
    const priestLegs = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.35, 0.65),
      this.saffronMat
    );
    priestLegs.position.y = 0.22;
    priestGroup.add(priestLegs);

    // Torso in saffron vastra
    const priestTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.75, 10),
      this.saffronMat
    );
    priestTorso.position.y = 0.72;
    priestGroup.add(priestTorso);

    // Head with holy tilak
    const priestHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.6 })
    );
    priestHead.position.y = 1.22;
    priestGroup.add(priestHead);

    sanctumGroup.add(priestGroup);

    // =========================================================================
    // 8. TALL BRASS DEEPSTAMBHA (MULTI-TIER DIYA TOWERS) & FLOOR DIYAS (Photo 3)
    // =========================================================================
    [-2.2, 2.2].forEach(dx => {
      const standGroup = new THREE.Group();
      standGroup.position.set(dx, 1.9, sanctumZ + 2.8);

      const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.15, 12), this.brassMat);
      standGroup.add(sBase);

      const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), this.brassMat);
      sPole.position.y = 0.85;
      standGroup.add(sPole);

      // Multi-tier diya oil plates
      [0.6, 1.0, 1.4].forEach(ty => {
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22 - ty * 0.05, 0.18, 0.06, 12), this.brassMat);
        plate.position.y = ty;
        standGroup.add(plate);

        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 6), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
        flame.position.y = ty + 0.1;
        standGroup.add(flame);
      });

      sanctumGroup.add(standGroup);
    });

    // =========================================================================
    // 9. RADIANT GOLDEN SANCTUM ILLUMINATION (Spilling warmly through entrance)
    // =========================================================================
    const sanctumMainLight = new THREE.PointLight(0xffaa22, 4.2, 26, 1.1);
    sanctumMainLight.position.set(0, 4.2, sanctumZ + 0.8);
    sanctumGroup.add(sanctumMainLight);
    this.pointLights.push({ light: sanctumMainLight, baseIntensity: 4.2 });

    const sanctumWarmFill = new THREE.PointLight(0xff7711, 2.2, 18, 1.4);
    sanctumWarmFill.position.set(0, 2.8, sanctumZ - 0.5);
    sanctumGroup.add(sanctumWarmFill);
    this.pointLights.push({ light: sanctumWarmFill, baseIntensity: 2.2 });

    // Clickable target for sanctum darshan
    lingamMesh.userData = { isSanctum: true };
    lowerPeetham.userData = { isSanctum: true };
    this.sanctumMeshes = [lingamMesh, lowerPeetham, backWallMesh];

    this.group.add(sanctumGroup);
  }

  // Animate bells ringing, flags fluttering in Himalayan breeze, diyas flickering
  update(time, delta) {
    // 1. Fluttering Dhwaja flag
    this.flags.forEach(flag => {
      const posAttr = flag.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        // Ripple wave moving outward along flag width
        const wave = Math.sin(time * 6 + x * 4) * 0.12 * (x / 1.6);
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;
    });

    // 2. Bell physical swing damping
    this.bells.forEach(bell => {
      if (Math.abs(bell.swing) > 0.001) {
        bell.group.rotation.z = Math.sin(time * 12) * bell.swing;
        bell.swing *= 0.96; // exponential decay
      } else {
        bell.group.rotation.z = 0;
      }
    });

    // 3. Flickering Diya lights
    this.pointLights.forEach(p => {
      const flicker = (Math.sin(time * 15) * 0.1 + Math.cos(time * 23) * 0.1);
      p.light.intensity = p.baseIntensity + flicker;
    });

    // 4. Night aarti fairy lights & golden floodlight twinkle
    if (this.isAartiActive && this.fairyLightMat) {
      const twinkle = Math.sin(time * 6.5) * 0.35 + Math.cos(time * 11.2) * 0.2;
      this.fairyLightMat.emissiveIntensity = Math.max(1.8, 3.0 + twinkle);
      if (this.entranceGlowLight) {
        this.entranceGlowLight.intensity = Math.max(1.5, 3.2 + Math.sin(time * 14) * 0.3);
      }
    }
  }

  // Set festive Aarti festival illumination mode
  setAartiMode(enabled) {
    this.isAartiActive = !!enabled;
    if (this.fairyLightMat) {
      this.fairyLightMat.emissiveIntensity = this.isAartiActive ? 3.0 : 0.0;
    }
    if (this.facadeSpotlight) {
      this.facadeSpotlight.intensity = this.isAartiActive ? 4.5 : 0.0;
    }
    if (this.kalashSpotlight) {
      this.kalashSpotlight.intensity = this.isAartiActive ? 3.5 : 0.0;
    }
    if (this.entranceGlowLight) {
      this.entranceGlowLight.intensity = this.isAartiActive ? 3.2 : 0.0;
    }
  }

  // Switch illumination based on time of day (day / sunset / night)
  setTimeOfDay(mode) {
    if (mode === 'night') {
      this.setAartiMode(true);
    } else if (mode === 'sunset') {
      this.isAartiActive = true;
      if (this.fairyLightMat) this.fairyLightMat.emissiveIntensity = 1.4;
      if (this.facadeSpotlight) this.facadeSpotlight.intensity = 2.0;
      if (this.kalashSpotlight) this.kalashSpotlight.intensity = 1.6;
      if (this.entranceGlowLight) this.entranceGlowLight.intensity = 1.5;
    } else {
      this.setAartiMode(false);
    }
  }

  ringBell(bellIndex = 0) {
    if (this.bells && this.bells.length > 0) {
      const idx = (bellIndex >= 0 && bellIndex < this.bells.length) ? bellIndex : 0;
      if (this.bells[idx]) {
        this.bells[idx].swing = 0.55;
      }
    }
    if (window.soundEngine) {
      window.soundEngine.playTempleBell(1.0);
    }
  }
}

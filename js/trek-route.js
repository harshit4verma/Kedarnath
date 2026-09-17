/**
 * Kedarnath 360 AR/VR - Pilgrimage Trek Route Generator
 * Procedurally generates the 16km mountain trek route (Yatra Marg) to Kedarnath:
 * - Gaurikund valley gorge, Mandakini river rapids, Bhimbali suspension bridge,
 *   Linchauli switchbacks, prayer flags, pilgrim shelters, pack mules, and pilgrims.
 * - Connects seamlessly into the Kedarnath Temple campus courtyard.
 */

class KedarnathTrekRoute {
  constructor(scene, templeRef) {
    this.scene = scene;
    this.templeRef = templeRef;
    this.group = new THREE.Group();
    this.group.name = 'trek_route_system';

    this.mules = [];
    this.pilgrims = [];
    this.prayerBanners = [];
    this.riverMesh = null;
    this.chevronMeshes = [];

    // Milestone markers along the 16km pilgrimage route
    this.milestones = [
      {
        id: 'gaurikund',
        name: 'Gaurikund Trailhead',
        t: 0.0,
        elev: 2040,
        distKm: 16.0,
        desc: 'Deep pine forest canyon & roaring Mandakini river gorge',
        coords: '30.5847° N, 79.0305° E'
      },
      {
        id: 'junglechatti',
        name: 'Jungle Chatti',
        t: 0.18,
        elev: 2350,
        distKm: 12.8,
        desc: 'Waterfall cascades, stone steps & traditional tea stalls',
        coords: '30.6120° N, 79.0380° E'
      },
      {
        id: 'bhimbali',
        name: 'Bhimbali Suspension Bridge',
        t: 0.38,
        elev: 2675,
        distKm: 10.2,
        desc: 'Steel suspension bridge across the rushing Mandakini river',
        coords: '30.6480° N, 79.0490° E'
      },
      {
        id: 'linchauli',
        name: 'Linchauli Mountain Pass',
        t: 0.64,
        elev: 3150,
        distKm: 5.5,
        desc: 'High-altitude switchbacks, prayer flags & pack mule caravans',
        coords: '30.6920° N, 79.0580° E'
      },
      {
        id: 'basecamp',
        name: 'Kedarnath Base Camp',
        t: 0.86,
        elev: 3450,
        distKm: 1.8,
        desc: 'Glacial valley moraine, cool alpine mist & snow couloirs',
        coords: '30.7230° N, 79.0630° E'
      },
      {
        id: 'temple',
        name: 'Kedarnath Temple Campus',
        t: 1.0,
        elev: 3583,
        distKm: 0.0,
        desc: 'Shri Nandi Maharaj & the sacred Jyotirlinga temple shrine',
        coords: '30.7346° N, 79.0669° E'
      }
    ];

    this.initSpline();
    this.buildTrailPath();
    this.buildMandakiniRiver();
    this.buildBhimbaliBridge();
    this.buildValleyTerrainAndCliffs();
    this.buildPilgrimSheltersAndDhabas();
    this.buildPrayerFlags();
    this.buildPackMules();
    this.buildWalkingPilgrims();
    this.buildStreetViewChevrons();

    this.scene.add(this.group);
  }

  // 1. Spline representing the continuous mountain trail
  initSpline() {
    const rawPoints = [
      new THREE.Vector3(40, -68, 480),   // Gaurikund Gorge
      new THREE.Vector3(25, -60, 440),   // Lower forest trail
      new THREE.Vector3(10, -54, 400),   // Jungle Chatti
      new THREE.Vector3(-15, -48, 360),  // Mandakini approach
      new THREE.Vector3(-32, -43, 315),  // South Bridge Abutment
      new THREE.Vector3(-28, -42, 275),  // Over Bhimbali Suspension Bridge
      new THREE.Vector3(-12, -37, 235),  // North Bank Dhaba row
      new THREE.Vector3(22, -30, 195),   // Lower Linchauli hairpins
      new THREE.Vector3(-18, -23, 155),  // Upper Linchauli ridge
      new THREE.Vector3(12, -15, 115),   // Chhoti Linchauli rest stop
      new THREE.Vector3(-6, -8, 80),     // Glacial moraine approach
      new THREE.Vector3(0, -3, 52),      // Valley entrance bridge
      new THREE.Vector3(0, 0, 36),       // Grand Pilgrim Avenue approach
      new THREE.Vector3(0, 0.4, 25.5)    // Arrives directly facing Nandi & Temple facade
    ];

    this.curve = new THREE.CatmullRomCurve3(rawPoints, false, 'centripetal', 0.4);
    this.sampleCount = 600;
    this.curvePoints = this.curve.getSpacedPoints(this.sampleCount);
    this.totalLength = this.curve.getLength();
  }

  // Get 3D point and orientation at normalized parameter t [0, 1]
  getTrailTransformAt(t) {
    const clampedT = THREE.MathUtils.clamp(t, 0, 1);
    const point = this.curve.getPointAt(clampedT);
    const tangent = this.curve.getTangentAt(clampedT).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    return { point, tangent, normal, up };
  }

  // Interpolate current elevation and distance for HUD display
  getInfoAt(t) {
    const clampedT = THREE.MathUtils.clamp(t, 0, 1);
    
    let m1 = this.milestones[0];
    let m2 = this.milestones[this.milestones.length - 1];
    for (let i = 0; i < this.milestones.length - 1; i++) {
      if (clampedT >= this.milestones[i].t && clampedT <= this.milestones[i + 1].t) {
        m1 = this.milestones[i];
        m2 = this.milestones[i + 1];
        break;
      }
    }

    const span = Math.max(0.0001, m2.t - m1.t);
    const localT = (clampedT - m1.t) / span;
    const elev = Math.round(m1.elev + (m2.elev - m1.elev) * localT);
    const distKm = (m1.distKm + (m2.distKm - m1.distKm) * localT).toFixed(1);

    let closestMilestone = m1;
    let minDiff = 999;
    this.milestones.forEach(m => {
      const diff = Math.abs(m.t - clampedT);
      if (diff < minDiff) {
        minDiff = diff;
        closestMilestone = m;
      }
    });

    return {
      t: clampedT,
      elev,
      distKm,
      milestone: closestMilestone,
      coords: closestMilestone.coords
    };
  }

  // 2. Extruded stone flagstone walking trail with curbs & railings
  buildTrailPath() {
    const trailWidth = 4.2;
    const pathSegments = this.sampleCount;
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= pathSegments; i++) {
      const t = i / pathSegments;
      const { point, normal } = this.getTrailTransformAt(t);

      const leftEdge = point.clone().addScaledVector(normal, -trailWidth * 0.5);
      const rightEdge = point.clone().addScaledVector(normal, trailWidth * 0.5);

      leftEdge.y -= 0.05;
      rightEdge.y -= 0.05;

      vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
      vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);

      const vRepeat = t * 120;
      uvs.push(0, vRepeat);
      uvs.push(1, vRepeat);

      if (i < pathSegments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trailGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trailGeo.setIndex(indices);
    trailGeo.computeVertexNormals();

    const trailMat = new THREE.MeshStandardMaterial({
      map: window.materialsCache ? window.materialsCache.stoneTexture : null,
      roughness: 0.92,
      metalness: 0.05,
      color: 0x8a847a
    });

    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
    trailMesh.receiveShadow = true;
    this.group.add(trailMesh);

    this.buildSafetyRailings(trailWidth);
  }

  buildSafetyRailings(trailWidth) {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.15, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x3d4a36, roughness: 0.8 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });

    const postSpacing = 6.0;
    const totalDist = this.totalLength;
    const numPosts = Math.floor(totalDist / postSpacing);
    const railGroup = new THREE.Group();

    for (let i = 0; i < numPosts; i++) {
      const t = (i * postSpacing) / totalDist;
      if (t > 0.92) continue;
      
      const { point, normal } = this.getTrailTransformAt(t);
      const postPos = point.clone().addScaledVector(normal, trailWidth * 0.52);
      postPos.y += 0.55;

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.copy(postPos);
      railGroup.add(post);

      if (i < numPosts - 1) {
        const nextT = ((i + 1) * postSpacing) / totalDist;
        const nextInfo = this.getTrailTransformAt(nextT);
        const nextPostPos = nextInfo.point.clone().addScaledVector(nextInfo.normal, trailWidth * 0.52);
        nextPostPos.y += 0.55;

        const p1 = postPos.clone(); p1.y += 0.45;
        const p2 = nextPostPos.clone(); p2.y += 0.45;
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const len = p1.distanceTo(p2);

        const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, len, 6);
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.copy(mid);
        pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
        railGroup.add(pipe);

        const p1Low = postPos.clone(); p1Low.y -= 0.05;
        const p2Low = nextPostPos.clone(); p2Low.y -= 0.05;
        const midLow = new THREE.Vector3().addVectors(p1Low, p2Low).multiplyScalar(0.5);
        const pipeLow = new THREE.Mesh(pipeGeo, pipeMat);
        pipeLow.position.copy(midLow);
        pipeLow.quaternion.copy(pipe.quaternion);
        railGroup.add(pipeLow);
      }
    }

    this.group.add(railGroup);
  }

  // 3. Mandakini Glacial River with turquoise water & rapids
  buildMandakiniRiver() {
    const riverCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(15, -78, 500),
      new THREE.Vector3(-10, -70, 440),
      new THREE.Vector3(-35, -62, 380),
      new THREE.Vector3(-30, -53, 310),
      new THREE.Vector3(-45, -45, 240),
      new THREE.Vector3(-35, -36, 170),
      new THREE.Vector3(-25, -24, 110),
      new THREE.Vector3(-18, -14, 60),
      new THREE.Vector3(-12, -8, 20)
    ]);

    const riverWidth = 14;
    const riverPoints = riverCurve.getSpacedPoints(180);
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i < riverPoints.length; i++) {
      const pt = riverPoints[i];
      const t = i / (riverPoints.length - 1);
      const tangent = riverCurve.getTangentAt(t).normalize();
      const norm = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().addScaledVector(norm, -riverWidth * 0.5);
      const right = pt.clone().addScaledVector(norm, riverWidth * 0.5);

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      uvs.push(0, t * 40);
      uvs.push(1, t * 40);

      if (i < riverPoints.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const riverGeo = new THREE.BufferGeometry();
    riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    riverGeo.setIndex(indices);
    riverGeo.computeVertexNormals();

    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x2288aa,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });

    this.riverMesh = new THREE.Mesh(riverGeo, riverMat);
    this.group.add(this.riverMesh);

    const rockGeo = new THREE.DodecahedronGeometry(1.5, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a5650, roughness: 0.9 });
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });

    for (let i = 0; i < 45; i++) {
      const randT = Math.random();
      const pt = riverCurve.getPointAt(randT);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        pt.x + (Math.random() - 0.5) * riverWidth * 0.7,
        pt.y + (Math.random() - 0.5) * 0.8,
        pt.z + (Math.random() - 0.5) * 6
      );
      const s = 0.8 + Math.random() * 1.8;
      rock.scale.set(s, s * 0.6, s * 1.2);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      this.group.add(rock);

      const foamGeo = new THREE.RingGeometry(s * 1.1, s * 1.6, 12);
      const foam = new THREE.Mesh(foamGeo, foamMat);
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(rock.position.x, pt.y + 0.1, rock.position.z);
      this.group.add(foam);
    }
  }

  // 4. Bhimbali Steel Suspension Bridge
  buildBhimbaliBridge() {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'bhimbali_suspension_bridge';

    const startInfo = this.getTrailTransformAt(0.35);
    const endInfo = this.getTrailTransformAt(0.41);

    const startPos = startInfo.point.clone();
    const endPos = endInfo.point.clone();
    const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

    const towerGeo = new THREE.BoxGeometry(0.45, 11, 0.45);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.6, metalness: 0.7 });

    const createTower = (pos, norm) => {
      const towerPair = new THREE.Group();
      const leftCol = new THREE.Mesh(towerGeo, steelMat);
      leftCol.position.set(-2.4, 5.5, 0);
      const rightCol = new THREE.Mesh(towerGeo, steelMat);
      rightCol.position.set(2.4, 5.5, 0);

      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 0.4), steelMat);
      crossBeam.position.set(0, 10.5, 0);

      const crossBeamMid = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 0.3), steelMat);
      crossBeamMid.position.set(0, 5.5, 0);

      towerPair.add(leftCol, rightCol, crossBeam, crossBeamMid);
      towerPair.position.copy(pos);

      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        norm
      );
      towerPair.quaternion.copy(quat);
      return towerPair;
    };

    bridgeGroup.add(createTower(startPos, startInfo.normal));
    bridgeGroup.add(createTower(endPos, endInfo.normal));

    const cableMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.3 });
    const cableCurveLeft = new THREE.CatmullRomCurve3([
      startPos.clone().addScaledVector(startInfo.normal, -2.4).add(new THREE.Vector3(0, 10.5, 0)),
      midPos.clone().add(new THREE.Vector3(0, 2.0, 0)).addScaledVector(startInfo.normal, -2.4),
      endPos.clone().addScaledVector(endInfo.normal, -2.4).add(new THREE.Vector3(0, 10.5, 0))
    ]);

    const cableCurveRight = new THREE.CatmullRomCurve3([
      startPos.clone().addScaledVector(startInfo.normal, 2.4).add(new THREE.Vector3(0, 10.5, 0)),
      midPos.clone().add(new THREE.Vector3(0, 2.0, 0)).addScaledVector(startInfo.normal, 2.4),
      endPos.clone().addScaledVector(endInfo.normal, 2.4).add(new THREE.Vector3(0, 10.5, 0))
    ]);

    const cableGeoLeft = new THREE.TubeGeometry(cableCurveLeft, 32, 0.08, 8, false);
    const cableGeoRight = new THREE.TubeGeometry(cableCurveRight, 32, 0.08, 8, false);

    bridgeGroup.add(new THREE.Mesh(cableGeoLeft, cableMat));
    bridgeGroup.add(new THREE.Mesh(cableGeoRight, cableMat));

    const hangerGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 6);
    for (let k = 1; k < 16; k++) {
      const tH = k / 16;
      const cPtL = cableCurveLeft.getPoint(tH);
      const dPtL = startPos.clone().lerp(endPos, tH).addScaledVector(startInfo.normal, -2.4);
      const hLen = cPtL.y - dPtL.y;

      if (hLen > 0.2) {
        const hanger = new THREE.Mesh(hangerGeo, cableMat);
        hanger.scale.set(1, hLen, 1);
        hanger.position.set(cPtL.x, (cPtL.y + dPtL.y) * 0.5, cPtL.z);
        bridgeGroup.add(hanger);

        const cPtR = cableCurveRight.getPoint(tH);
        const dPtR = startPos.clone().lerp(endPos, tH).addScaledVector(startInfo.normal, 2.4);
        const hangerR = new THREE.Mesh(hangerGeo, cableMat);
        hangerR.scale.set(1, hLen, 1);
        hangerR.position.set(cPtR.x, (cPtR.y + dPtR.y) * 0.5, cPtR.z);
        bridgeGroup.add(hangerR);
      }
    }

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x6b533e, roughness: 0.95 });
    const plankGeo = new THREE.BoxGeometry(4.4, 0.12, 0.35);
    for (let p = 0; p < 80; p++) {
      const tP = 0.35 + (p / 80) * 0.06;
      const { point, normal } = this.getTrailTransformAt(tP);
      const plank = new THREE.Mesh(plankGeo, deckMat);
      plank.position.copy(point);
      plank.position.y += 0.06;
      plank.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), normal);
      bridgeGroup.add(plank);
    }

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 })
    );
    signBoard.position.copy(startPos);
    signBoard.position.y += 2.8;
    signBoard.position.addScaledVector(startInfo.normal, -2.6);
    bridgeGroup.add(signBoard);

    this.group.add(bridgeGroup);
  }

  // 5. Surrounding Valley Slopes, Cliffs & Deodar Trees
  buildValleyTerrainAndCliffs() {
    const terrainGroup = new THREE.Group();
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.95 });
    const cliffGeo = new THREE.DodecahedronGeometry(8.0, 1);

    for (let i = 0; i < 35; i++) {
      const t = 0.05 + Math.random() * 0.85;
      const { point, normal } = this.getTrailTransformAt(t);
      const side = Math.random() > 0.5 ? 1 : -1;
      const dist = 12 + Math.random() * 25;

      const cliff = new THREE.Mesh(cliffGeo, cliffMat);
      cliff.position.copy(point).addScaledVector(normal, side * dist);
      cliff.position.y += (Math.random() - 0.2) * 15;
      cliff.scale.set(1 + Math.random() * 1.5, 2 + Math.random() * 2.5, 1.2 + Math.random() * 1.8);
      cliff.rotation.set(Math.random(), Math.random(), Math.random());
      terrainGroup.add(cliff);
    }

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x1f3822, roughness: 0.85 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x2e4e33, roughness: 0.85 });

    const createTree = (pos, scale) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.25;
      tree.add(trunk);

      const fMat = Math.random() > 0.5 ? foliageMat1 : foliageMat2;
      for (let lvl = 0; lvl < 3; lvl++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(2.2 - lvl * 0.45, 3.2, 7),
          fMat
        );
        cone.position.y = 3.5 + lvl * 1.8;
        tree.add(cone);
      }

      tree.position.copy(pos);
      tree.scale.setScalar(scale);
      return tree;
    };

    for (let j = 0; j < 80; j++) {
      const t = Math.random() * 0.75;
      const { point, normal } = this.getTrailTransformAt(t);
      const side = Math.random() > 0.5 ? 1 : -1;
      const offset = (5.5 + Math.random() * 30) * side;

      const treePos = point.clone().addScaledVector(normal, offset);
      treePos.y -= 0.5;

      const scale = (1.0 - t * 0.4) * (0.8 + Math.random() * 0.6);
      terrainGroup.add(createTree(treePos, scale));
    }

    this.group.add(terrainGroup);
  }

  // 6. Traditional Himalayan Pilgrim Shelters & Tea Stalls
  buildPilgrimSheltersAndDhabas() {
    const shelterGroup = new THREE.Group();

    const shelterLocations = [
      { t: 0.12, side: -1 },
      { t: 0.28, side: 1 },
      { t: 0.44, side: 1 },
      { t: 0.60, side: -1 },
      { t: 0.78, side: 1 },
      { t: 0.90, side: -1 }
    ];

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7c7365, roughness: 0.9 });
    const tinRoofMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.7, roughness: 0.4 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });

    shelterLocations.forEach(loc => {
      const { point, normal } = this.getTrailTransformAt(loc.t);
      const shelter = new THREE.Group();

      const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 4), wallMat);
      walls.position.y = 1.6;
      shelter.add(walls);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.4, 4), tinRoofMat);
      roof.position.y = 3.9;
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.4, 1.0, 1.0);
      shelter.add(roof);

      for (let p = -2; p <= 2; p += 4) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), woodMat);
        post.position.set(p, 1.3, 2.5);
        shelter.add(post);
      }

      const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 0.4), woodMat);
      bench.position.set(0, 0.35, 2.5);
      shelter.add(bench);

      shelter.position.copy(point).addScaledVector(normal, loc.side * 7.5);
      shelter.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().multiplyScalar(-loc.side));

      shelterGroup.add(shelter);
    });

    this.group.add(shelterGroup);
  }

  // 7. Fluttering Prayer Flags
  buildPrayerFlags() {
    const flagColors = [0x2563eb, 0xffffff, 0xdc2626, 0x16a34a, 0xfacc15];
    const flagGeo = new THREE.PlaneGeometry(0.4, 0.3);

    const flagStrings = [
      { tStart: 0.34, tEnd: 0.42, sideA: -1, sideB: 1, height: 8.5 },
      { tStart: 0.62, tEnd: 0.68, sideA: 1, sideB: -1, height: 6.0 },
      { tStart: 0.82, tEnd: 0.88, sideA: -1, sideB: 1, height: 5.5 }
    ];

    flagStrings.forEach(str => {
      const infoA = this.getTrailTransformAt(str.tStart);
      const infoB = this.getTrailTransformAt(str.tEnd);

      const posA = infoA.point.clone().addScaledVector(infoA.normal, str.sideA * 10);
      posA.y += str.height;
      const posB = infoB.point.clone().addScaledVector(infoB.normal, str.sideB * 10);
      posB.y += str.height;

      const numFlags = 28;
      for (let f = 0; f < numFlags; f++) {
        const flagFrac = f / numFlags;
        const flagPos = new THREE.Vector3().lerpVectors(posA, posB, flagFrac);
        flagPos.y -= Math.sin(flagFrac * Math.PI) * 1.8;

        const col = flagColors[f % flagColors.length];
        const fMat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
        const flagMesh = new THREE.Mesh(flagGeo, fMat);
        flagMesh.position.copy(flagPos);
        flagMesh.rotation.y = Math.random() * 0.4;
        flagMesh.userData = { initialRotZ: (Math.random() - 0.5) * 0.2, phase: f * 0.3 };

        this.prayerBanners.push(flagMesh);
        this.group.add(flagMesh);
      }
    });
  }

  // 8. Pack Mules & Himalayan Horses
  buildPackMules() {
    const muleLocations = [
      { t: 0.22, speed: 0.003, side: 0.8 },
      { t: 0.48, speed: 0.0025, side: -0.9 },
      { t: 0.72, speed: 0.0028, side: 0.7 }
    ];

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x453229, roughness: 0.8 });
    const packMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

    muleLocations.forEach(loc => {
      const mule = new THREE.Group();

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.4, 8), bodyMat);
      body.rotation.x = Math.PI / 2;
      body.position.y = 1.15;
      mule.add(body);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.75, 6), bodyMat);
      neck.position.set(0, 1.6, 0.55);
      neck.rotation.x = -0.65;
      mule.add(neck);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.5), bodyMat);
      head.position.set(0, 1.85, 0.85);
      head.rotation.x = 0.25;
      mule.add(head);

      const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 1.05, 6);
      const legPositions = [
        [-0.22, 0.52, 0.45],
        [0.22, 0.52, 0.45],
        [-0.22, 0.52, -0.45],
        [0.22, 0.52, -0.45]
      ];
      legPositions.forEach(lp => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(lp[0], lp[1], lp[2]);
        mule.add(leg);
      });

      const bagGeo = new THREE.BoxGeometry(0.3, 0.5, 0.75);
      const leftBag = new THREE.Mesh(bagGeo, packMat);
      leftBag.position.set(-0.45, 1.25, 0);
      const rightBag = new THREE.Mesh(bagGeo, packMat);
      rightBag.position.set(0.45, 1.25, 0);
      mule.add(leftBag, rightBag);

      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 8), bellMat);
      bell.position.set(0, 1.35, 0.6);
      mule.add(bell);

      mule.userData = {
        t: loc.t,
        speed: loc.speed,
        sideOffset: loc.side,
        bellRef: bell
      };

      this.mules.push(mule);
      this.group.add(mule);
    });
  }

  // 9. Fellow Pilgrims walking naturally
  buildWalkingPilgrims() {
    const pilgrimPlacements = [
      { t: 0.08, jacketColor: 0xd97706, side: 0.6 },
      { t: 0.16, jacketColor: 0xef4444, side: -0.7 },
      { t: 0.32, jacketColor: 0x2563eb, side: 0.5 },
      { t: 0.55, jacketColor: 0x10b981, side: -0.6 },
      { t: 0.68, jacketColor: 0x9333ea, side: 0.8 },
      { t: 0.84, jacketColor: 0xf59e0b, side: -0.5 },
      { t: 0.94, jacketColor: 0xdc2626, side: 0.4 }
    ];

    const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.8 });
    const torsoGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8);
    const legsGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.85, 6);
    const legsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const stickGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6);
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });

    pilgrimPlacements.forEach((p, idx) => {
      const pilgrim = new THREE.Group();

      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.55;
      pilgrim.add(head);

      const jacketMat = new THREE.MeshStandardMaterial({ color: p.jacketColor, roughness: 0.85 });
      const torso = new THREE.Mesh(torsoGeo, jacketMat);
      torso.position.y = 1.15;
      pilgrim.add(torso);

      const pack = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.45, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
      );
      pack.position.set(0, 1.18, -0.22);
      pilgrim.add(pack);

      const legs = new THREE.Mesh(legsGeo, legsMat);
      legs.position.y = 0.45;
      pilgrim.add(legs);

      const stick = new THREE.Mesh(stickGeo, stickMat);
      stick.position.set(0.35, 0.7, 0.3);
      stick.rotation.x = -0.15;
      pilgrim.add(stick);

      pilgrim.userData = {
        t: p.t,
        speed: 0.002 + Math.random() * 0.001,
        sideOffset: p.side,
        stepPhase: idx * 1.5
      };

      this.pilgrims.push(pilgrim);
      this.group.add(pilgrim);
    });
  }

  // 10. Street View 3D Projected Ground Chevrons
  buildStreetViewChevrons() {
    this.chevronGroup = new THREE.Group();
    this.chevronGroup.name = 'sv_ground_chevrons';

    const chevronShape = new THREE.Shape();
    chevronShape.moveTo(0, 0.8);
    chevronShape.lineTo(0.7, 0);
    chevronShape.lineTo(0.35, 0);
    chevronShape.lineTo(0, 0.45);
    chevronShape.lineTo(-0.35, 0);
    chevronShape.lineTo(-0.7, 0);
    chevronShape.closePath();

    const chevronGeo = new THREE.ShapeGeometry(chevronShape);
    const chevronMat = new THREE.MeshBasicMaterial({
      color: 0x4285f4,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i++) {
      const chevron = new THREE.Mesh(chevronGeo, chevronMat.clone());
      chevron.rotation.x = -Math.PI / 2;
      chevron.userData = { index: i };
      this.chevronMeshes.push(chevron);
      this.chevronGroup.add(chevron);
    }

    this.group.add(this.chevronGroup);
  }

  updateChevrons(currentT, isStreetViewActive) {
    if (!this.chevronGroup) return;
    this.chevronGroup.visible = isStreetViewActive && currentT < 0.98;
    if (!this.chevronGroup.visible) return;

    const chevronDistances = [0.012, 0.024, 0.038];
    const time = performance.now() * 0.003;

    this.chevronMeshes.forEach((ch, idx) => {
      const targetT = Math.min(0.99, currentT + chevronDistances[idx]);
      const { point, normal, tangent } = this.getTrailTransformAt(targetT);

      ch.position.copy(point);
      ch.position.y += 0.08;

      ch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      const forwardQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        tangent
      );
      ch.quaternion.multiply(forwardQuat);
      ch.rotation.x = -Math.PI / 2;

      const wave = Math.sin(time - idx * 1.2) * 0.5 + 0.5;
      ch.material.opacity = 0.4 + wave * 0.45;
      const scale = 0.9 + wave * 0.2;
      ch.scale.set(scale, scale, 1);
    });
  }

  update(elapsedTime, delta) {
    this.prayerBanners.forEach(flag => {
      const sway = Math.sin(elapsedTime * 4.0 + flag.userData.phase) * 0.25;
      flag.rotation.z = flag.userData.initialRotZ + sway;
      flag.rotation.x = Math.cos(elapsedTime * 3.2 + flag.userData.phase) * 0.15;
    });

    this.mules.forEach(mule => {
      mule.userData.t += mule.userData.speed * delta;
      if (mule.userData.t > 0.95) mule.userData.t = 0.05;

      const { point, normal, tangent } = this.getTrailTransformAt(mule.userData.t);
      mule.position.copy(point).addScaledVector(normal, mule.userData.sideOffset);
      mule.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      mule.position.y += Math.abs(Math.sin(elapsedTime * 5.0)) * 0.04;
      if (mule.userData.bellRef) {
        mule.userData.bellRef.rotation.z = Math.sin(elapsedTime * 8.0) * 0.3;
      }
    });

    this.pilgrims.forEach(pilgrim => {
      pilgrim.userData.t += pilgrim.userData.speed * delta;
      if (pilgrim.userData.t > 0.98) pilgrim.userData.t = 0.02;

      const { point, normal, tangent } = this.getTrailTransformAt(pilgrim.userData.t);
      pilgrim.position.copy(point).addScaledVector(normal, pilgrim.userData.sideOffset);
      pilgrim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      pilgrim.position.y += Math.abs(Math.sin(elapsedTime * 4.5 + pilgrim.userData.stepPhase)) * 0.035;
    });
  }
}

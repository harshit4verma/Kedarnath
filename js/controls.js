/**
 * Kedarnath 360 AR/VR - Walking, Camera & Interaction Controls
 * Supports First-Person Walking (WASD + Mouse Look), Mobile Joysticks,
 * 360° Orbit Drone Mode, Collision Detection, and Bell Interaction.
 */

class ControllerManager {
  constructor(camera, renderer, temple, environment) {
    this.camera = camera;
    this.renderer = renderer;
    this.temple = temple;
    this.environment = environment;

    this.mode = 'walk'; // 'walk', 'drone'
    
    // First-person state
    this.isLocked = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Head-bobbing & Footstep sync
    this.walkDistance = 0;
    this.eyeHeight = 1.7; // 1.7 meters (human eye height)
    // Starting position: Frames Nandi right in the lower foreground with temple behind!
    this.camera.position.set(0, 2.2, 31.0);
    this.camera.lookAt(0, 2.6, 8.0);
    this.euler.setFromQuaternion(this.camera.quaternion);

    // Drone & Nandi Orbit state
    this.orbitAngle = 0;
    this.orbitRadius = 45;
    this.orbitHeight = 16;
    this.isDroneOrbiting = false;
    this.nandiOrbitAngle = -Math.PI / 2;

    // Stair-climbing & Floor elevation physics
    this.currentFloorY = 0.0;
    this.lastStepElevation = 0.0;
    this.lastFootstepTime = 0;

    // Mobile joystick state
    this.joystickMove = { x: 0, y: 0 };
    this.joystickLook = { x: 0, y: 0 };

    // Interactive raycaster
    this.raycaster = new THREE.Raycaster();
    this.centerScreen = new THREE.Vector2(0, 0);
    this.hoveredBell = null;
    this.hoveredTempleFront = false;

    this.initKeyboard();
    this.initPointerLock();
    this.initMobileJoysticks();
    this.initTouchLook();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = true; break;
        case 'KeyE': case 'Space':
          if (this.hoveredBell) {
            this.temple.ringBell(this.hoveredBell.userData.bellIndex);
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = false; break;
      }
    });
  }

  initPointerLock() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', (e) => {
      let targetTempleFront = this.hoveredTempleFront;
      let targetSanctum = this.hoveredSanctum;
      let targetNandi = this.hoveredNandi;
      let targetBhim = this.hoveredBhimShila;
      let targetBell = this.hoveredBell;

      // When pointer is NOT locked, raycast directly from the mouse click pixel coordinates
      if (!this.isLocked) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const clickRay = new THREE.Raycaster();
        clickRay.setFromCamera({ x: mouseX, y: mouseY }, this.camera);

        // Check temple front (when in courtyard outside)
        if (this.temple.templeFrontMeshes && this.camera.position.z >= 13.0) {
          const hits = clickRay.intersectObjects(this.temple.templeFrontMeshes, true);
          if (hits.length > 0 && hits[0].distance < 45.0) targetTempleFront = true;
        }

        // Check sanctum (when inside)
        if (this.temple.sanctumMeshes && this.camera.position.z < 14.0) {
          const hits = clickRay.intersectObjects(this.temple.sanctumMeshes, true);
          if (hits.length > 0 && hits[0].distance < 16.0) targetSanctum = true;
        }

        // Check Nandi
        if (this.temple.nandiMeshes) {
          const hits = clickRay.intersectObjects(this.temple.nandiMeshes, true);
          if (hits.length > 0 && hits[0].distance < 14.0) targetNandi = true;
        }

        // Check Bhim Shila
        if (this.temple.bhimShilaMeshes) {
          const hits = clickRay.intersectObjects(this.temple.bhimShilaMeshes, true);
          if (hits.length > 0 && hits[0].distance < 22.0) targetBhim = true;
        }

        // Check bells
        const bellMeshes = this.temple.bells.map(b => b.mesh);
        const bellHits = clickRay.intersectObjects(bellMeshes, true);
        if (bellHits.length > 0 && bellHits[0].distance < 9.0) targetBell = bellHits[0].object;
      }

      if (targetTempleFront) {
        const modal = document.getElementById('temple-photos-modal');
        if (modal) {
          modal.classList.add('active');
          if (document.exitPointerLock) document.exitPointerLock();
        }
        if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
      } else if (targetSanctum) {
        const modal = document.getElementById('sanctum-modal');
        if (modal) {
          modal.classList.add('active');
          if (document.exitPointerLock) document.exitPointerLock();
        }
        if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
      } else if (targetNandi) {
        const modal = document.getElementById('nandi-modal');
        if (modal) {
          modal.classList.add('active');
          if (document.exitPointerLock) document.exitPointerLock();
        }
        if (window.soundEngine) window.soundEngine.playTempleBell(0.8);
      } else if (targetBhim) {
        const modal = document.getElementById('bhimshila-modal');
        if (modal) {
          modal.classList.add('active');
          if (document.exitPointerLock) document.exitPointerLock();
        }
        if (window.soundEngine) window.soundEngine.playTempleBell(0.9);
      } else if (targetBell) {
        this.temple.ringBell(targetBell.userData.bellIndex);
      } else if ((this.mode === 'walk' || this.mode === 'real360') && !this.isLocked) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = (document.pointerLockElement === canvas);
      const guide = document.getElementById('controls-guide');
      if (guide && this.isLocked) {
        guide.style.opacity = '0.3';
      } else if (guide) {
        guide.style.opacity = '1.0';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      if (this.mode !== 'walk' && this.mode !== 'real360') return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= movementX * 0.0022;
      this.euler.x -= movementY * 0.0022;

      // Limit pitch to prevent flipping
      this.euler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  // Mobile virtual dual-joystick controls
  initMobileJoysticks() {
    const leftZone = document.getElementById('joystick-left');
    const leftKnob = document.getElementById('knob-left');
    const rightZone = document.getElementById('joystick-right');
    const rightKnob = document.getElementById('knob-right');

    if (!leftZone || !rightZone) return;

    // Show mobile controls if touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const mobileControls = document.getElementById('mobile-controls');
      if (mobileControls) mobileControls.style.display = 'flex';
    }

    const setupJoystick = (zone, knob, onMove) => {
      let activeTouchId = null;
      let startX = 0, startY = 0;
      const maxRadius = 45;

      zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        const rect = zone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }, { passive: false });

      zone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === activeTouchId) {
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const dist = Math.min(maxRadius, Math.hypot(dx, dy));
            const angle = Math.atan2(dy, dx);
            const clampedX = Math.cos(angle) * dist;
            const clampedY = Math.sin(angle) * dist;

            knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
            onMove(clampedX / maxRadius, clampedY / maxRadius);
          }
        }
      }, { passive: false });

      const endTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            activeTouchId = null;
            knob.style.transform = 'translate(-50%, -50%)';
            onMove(0, 0);
          }
        }
      };

      zone.addEventListener('touchend', endTouch);
      zone.addEventListener('touchcancel', endTouch);
    };

    // Left joystick controls movement
    setupJoystick(leftZone, leftKnob, (x, y) => {
      this.joystickMove.x = x;
      this.joystickMove.y = y;
    });

    // Right joystick controls 360 look
    setupJoystick(rightZone, rightKnob, (x, y) => {
      this.joystickLook.x = x;
      this.joystickLook.y = y;
    });
  }

  // Swipe screen to look around on mobile & desktop drag look
  initTouchLook() {
    let lastX = 0, lastY = 0;
    this.isDraggingLook = false;
    this.dragCooldown = 0;

    // Mobile Touch Drag Look (works across entire screen)
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, a, input, select, textarea, .real-360-card, .modal-content, .nandi-card, .bottom-nandi-dock, .hotspots-row, .actions-row, .header-bar')) return;
      if (e.touches.length === 1) {
        this.isDraggingLook = true;
        this.dragCooldown = 1.2;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDraggingLook || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= dx * 0.004;
      this.euler.x -= dy * 0.004;
      this.euler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    }, { passive: true });

    const endTouch = () => {
      this.isDraggingLook = false;
    };
    window.addEventListener('touchend', endTouch, { passive: true });
    window.addEventListener('touchcancel', endTouch, { passive: true });

    // Desktop Mouse Drag Look (when pointer is not locked, works on full viewport)
    let mouseLastX = 0, mouseLastY = 0;
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, input, select, textarea, .real-360-card, .modal-content, .nandi-card, .bottom-nandi-dock, .hotspots-row, .actions-row, .header-bar')) return;
      this.isDraggingLook = true;
      this.dragCooldown = 1.2;
      mouseLastX = e.clientX;
      mouseLastY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingLook) return;
      if (this.isLocked) return;
      const dx = e.clientX - mouseLastX;
      const dy = e.clientY - mouseLastY;
      mouseLastX = e.clientX;
      mouseLastY = e.clientY;

      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= dx * 0.0035;
      this.euler.x -= dy * 0.0035;
      this.euler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingLook = false;
    });

    // Smooth Zoom FOV with mouse wheel (30° telephoto to 95° wide-angle)
    window.addEventListener('wheel', (e) => {
      if (this.camera) {
        this.camera.fov = Math.max(30, Math.min(95, this.camera.fov + e.deltaY * 0.05));
        this.camera.updateProjectionMatrix();
      }
    }, { passive: true });
  }

  setMode(newMode) {
    this.mode = newMode;
    const crosshair = document.getElementById('crosshair');
    if (newMode === 'real360') {
      if (document.exitPointerLock) document.exitPointerLock();
      if (crosshair) crosshair.style.display = 'none';
      this.isDroneOrbiting = false;
    } else if (newMode === 'drone') {
      if (document.exitPointerLock) document.exitPointerLock();
      if (crosshair) crosshair.style.display = 'none';
      this.isDroneOrbiting = true;
    } else {
      if (crosshair) crosshair.style.display = 'block';
      this.isDroneOrbiting = false;
      this.camera.position.set(0, 2.2, 31.0);
      this.camera.lookAt(0, 2.6, 8.0);
      this.euler.setFromQuaternion(this.camera.quaternion);
    }
  }

  // 360° Smooth Orbit around 3D Sculpted Nandi Bull
  orbitNandi() {
    this.mode = 'nandiOrbit';
    this.nandiOrbitAngle = -Math.PI / 2; // Start from left flank with sacred Om
    this.isDroneOrbiting = false;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // Physical floor elevation computation for stairs, platforms, and interior sanctum
  getFloorElevation(x, z) {
    // 1. Mandapa Assembly Hall Interior & Inner Sanctum (elevated stone floor)
    if (Math.abs(x) <= 5.8 && z >= -3.0 && z <= 15.0) {
      return 1.90;
    }

    // 2. 6-Tier Front Stone Stairs (each step is 30cm high, 60cm deep, 11m wide)
    if (Math.abs(x) <= 5.5 && z >= 18.0 && z <= 21.65) {
      if (z >= 21.0) return 0.30;
      if (z >= 20.4) return 0.60;
      if (z >= 19.8) return 0.90;
      if (z >= 19.2) return 1.20;
      if (z >= 18.6) return 1.50;
      return 1.80;
    }

    // 3. Plinth Platform (Jagati Terrace & Parikrama Path around Temple)
    if (Math.abs(x) <= 10.8 && z >= -17.8 && z < 18.0) {
      return 1.80;
    }

    // 4. Default Courtyard Level
    return 0.0;
  }

  // Sacred Hotspots Jump
  teleportTo(spotId) {
    this.mode = 'walk';
    this.isDroneOrbiting = false;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'block';

    const spots = {
      front: { pos: new THREE.Vector3(0, 2.2, 31.0), lookAt: new THREE.Vector3(0, 2.6, 8.0), floorY: 0.0 },
      nandi: { pos: new THREE.Vector3(-3.8, 2.1, 24.5), lookAt: new THREE.Vector3(0, 2.2, 24.5), floorY: 0.0 },
      sanctum: { pos: new THREE.Vector3(0, 1.90 + this.eyeHeight, 8.5), lookAt: new THREE.Vector3(0, 3.0, 4.0), floorY: 1.90 },
      parikrama: { pos: new THREE.Vector3(12, 1.80 + this.eyeHeight, -6), lookAt: new THREE.Vector3(0, 15, -6), floorY: 1.80 },
      bhimshila: { pos: new THREE.Vector3(8.5, 2.2, -26.5), lookAt: new THREE.Vector3(-1.0, 3.5, -23.0), floorY: 0.0 },
      lookout: { pos: new THREE.Vector3(-24, this.eyeHeight + 0.4, 38), lookAt: new THREE.Vector3(0, 45, -100), floorY: 0.0 }
    };

    const target = spots[spotId];
    if (target) {
      this.currentFloorY = target.floorY;
      this.lastStepElevation = target.floorY;
      this.camera.position.copy(target.pos);
      this.camera.lookAt(target.lookAt);
      this.euler.setFromQuaternion(this.camera.quaternion);
    }
  }

  update(delta, time) {
    if (this.mode === 'real360') {
      // 100% Real 360° Photosphere Mode
      // Smooth manual navigation with Arrow Keys / WASD
      const rotSpeed = 1.8;
      if (this.moveLeft) this.euler.y += rotSpeed * delta;
      if (this.moveRight) this.euler.y -= rotSpeed * delta;
      if (this.moveForward) this.euler.x = Math.min(Math.PI / 2.1, this.euler.x + rotSpeed * delta);
      if (this.moveBackward) this.euler.x = Math.max(-Math.PI / 2.1, this.euler.x - rotSpeed * delta);

      // Apply mobile joystick look rotation in 360 mode if active
      if (Math.abs(this.joystickLook.x) > 0.05 || Math.abs(this.joystickLook.y) > 0.05) {
        this.euler.y -= this.joystickLook.x * delta * 2.2;
        this.euler.x -= this.joystickLook.y * delta * 1.8;
        this.euler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.euler.x));
      }

      this.camera.quaternion.setFromEuler(this.euler);

      const compassRose = document.getElementById('compass-rose');
      if (compassRose) {
        const headingDeg = THREE.MathUtils.radToDeg(this.euler.y);
        compassRose.style.transform = `rotate(${headingDeg}deg)`;
      }
      return;
    }

    if (this.mode === 'drone') {
      // 360° Aerial Cinematic Orbit Tour
      this.orbitAngle += delta * 0.12;
      this.camera.position.x = Math.sin(this.orbitAngle) * this.orbitRadius;
      this.camera.position.z = Math.cos(this.orbitAngle) * this.orbitRadius;
      this.camera.position.y = this.orbitHeight + Math.sin(time * 0.5) * 3;
      this.camera.lookAt(0, 7.5, 6);

      const compassRose = document.getElementById('compass-rose');
      if (compassRose) {
        const headingDeg = THREE.MathUtils.radToDeg(this.orbitAngle);
        compassRose.style.transform = `rotate(${headingDeg}deg)`;
      }
      return;
    }

    if (this.mode === 'nandiOrbit') {
      // 360° Continuous Orbit around 3D Sculpted Nandi Bull
      this.nandiOrbitAngle += delta * 0.32;
      const radius = 5.2;
      this.camera.position.x = Math.sin(this.nandiOrbitAngle) * radius;
      this.camera.position.z = 24.5 + Math.cos(this.nandiOrbitAngle) * radius;
      this.camera.position.y = 2.3 + Math.sin(this.nandiOrbitAngle * 2) * 0.25;
      this.camera.lookAt(0, 2.0, 24.5);

      // Exit orbit if user presses walk keys
      if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
        this.mode = 'walk';
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';
        this.euler.setFromQuaternion(this.camera.quaternion);
      }
      return;
    }

    // First-Person Walk Movement
    const speed = (this.isSprinting ? 9.0 : 4.5);
    const friction = 10.0;

    this.velocity.x -= this.velocity.x * friction * delta;
    this.velocity.z -= this.velocity.z * friction * delta;

    // Combine keyboard input + mobile joystick
    let forwardInput = (this.moveForward ? 1 : 0) - (this.moveBackward ? 1 : 0);
    let strafeInput = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);

    if (Math.abs(this.joystickMove.y) > 0.05) forwardInput = -this.joystickMove.y;
    if (Math.abs(this.joystickMove.x) > 0.05) strafeInput = this.joystickMove.x;

    // Apply mobile joystick look rotation
    if (Math.abs(this.joystickLook.x) > 0.05 || Math.abs(this.joystickLook.y) > 0.05) {
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= this.joystickLook.x * delta * 2.2;
      this.euler.x -= this.joystickLook.y * delta * 1.8;
      this.euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    }

    this.direction.z = forwardInput;
    this.direction.x = strafeInput;
    this.direction.normalize();

    if (forwardInput !== 0 || strafeInput !== 0) {
      this.velocity.z -= this.direction.z * speed * friction * delta;
      this.velocity.x -= this.direction.x * speed * friction * delta;
    }

    // Move camera horizontally relative to view direction
    const prevPos = this.camera.position.clone();
    
    // Forward / backward
    const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forwardVec.y = 0;
    forwardVec.normalize();

    // Left / right strafe
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    rightVec.y = 0;
    rightVec.normalize();

    const moveX = (-this.velocity.z * forwardVec.x + -this.velocity.x * rightVec.x) * delta;
    const moveZ = (-this.velocity.z * forwardVec.z + -this.velocity.x * rightVec.z) * delta;

    const nextX = Math.max(-27, Math.min(27, this.camera.position.x + moveX));
    const nextZ = Math.max(-36, Math.min(48, this.camera.position.z + moveZ));

    // Height step obstacle checking:
    // Can step up onto steps (<= 0.42m rise), but cannot jump sheer 1.8m plinth walls where there are no stairs
    const nextFloorY = this.getFloorElevation(nextX, nextZ);
    const heightDifference = nextFloorY - this.currentFloorY;

    let allowMove = true;
    if (heightDifference > 0.42) {
      allowMove = false; // Blocked by sheer plinth side wall
    }

    // Prevent accidentally walking off high 1.8m terrace edges where there are no stairs
    if (this.currentFloorY >= 1.70 && nextFloorY < 1.40 && (nextZ < 18.0 || Math.abs(nextX) > 5.5)) {
      allowMove = false; // Keep pilgrim safely on the terrace
    }

    if (allowMove) {
      this.camera.position.x = nextX;
      this.camera.position.z = nextZ;
    }

    // Check collision against temple walls, doorposts, and Nandi monolith
    // Test collision sphere at torso height (currentFloorY + 1.1) with human shoulder radius (0.55m)
    const torsoPos = new THREE.Vector3(this.camera.position.x, this.currentFloorY + 1.1, this.camera.position.z);
    const playerSphere = new THREE.Sphere(torsoPos, 0.55);
    for (let c of this.temple.colliders) {
      if (c.intersectsSphere(playerSphere)) {
        this.camera.position.x = prevPos.x;
        this.camera.position.z = prevPos.z;
        break;
      }
    }

    // Update physical floor elevation with smooth, responsive stair-climbing
    const targetFloorY = this.getFloorElevation(this.camera.position.x, this.camera.position.z);
    const elevDiff = targetFloorY - this.currentFloorY;
    if (Math.abs(elevDiff) > 0.005) {
      this.currentFloorY += elevDiff * Math.min(1.0, delta * 15.0);

      // Play stone step sound when ascending/descending step tiers
      if (Math.abs(targetFloorY - this.lastStepElevation) >= 0.28) {
        if (window.soundEngine) window.soundEngine.playFootstep();
        this.lastStepElevation = targetFloorY;
      }
    } else {
      this.currentFloorY = targetFloorY;
    }

    // Camera Y height: physical currentFloorY + human eye height + walking head bob
    if (forwardInput !== 0 || strafeInput !== 0) {
      const moveMag = Math.hypot(this.velocity.x, this.velocity.z);
      this.walkDistance += moveMag * delta;
      const bobY = Math.sin(this.walkDistance * 9) * 0.05;
      this.camera.position.y = this.currentFloorY + this.eyeHeight + bobY;

      // Stone footstep audio cadence
      if (Math.sin(this.walkDistance * 9) < -0.95 && (time - this.lastFootstepTime) > 0.28) {
        this.lastFootstepTime = time;
        if (window.soundEngine) window.soundEngine.playFootstep();
      }
    } else {
      // Smooth resting eye height
      const targetY = this.currentFloorY + this.eyeHeight;
      this.camera.position.y += (targetY - this.camera.position.y) * Math.min(1.0, delta * 12.0);
    }

    // Check bell interaction raycasting
    this.checkBellInteraction();

    // Update compass HUD
    this.updateCompass();
  }

  checkBellInteraction() {
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const hint = document.getElementById('interaction-hint');
    const crosshair = document.getElementById('crosshair');
    const nandiCard = document.getElementById('nandi-darshan-card');
    const sanctumCard = document.getElementById('sanctum-darshan-card');

    // 1. Check Sanctum Lingam distance & proximity
    const lingamPos = new THREE.Vector3(0, 3.0, 4.0);
    const distToLingam = this.camera.position.distanceTo(lingamPos);

    if (distToLingam < 7.5 && this.mode === 'walk' && this.camera.position.z < 15.0) {
      if (sanctumCard && !sanctumCard.dataset.manuallyClosed) {
        sanctumCard.classList.add('visible');
      }
    } else if (distToLingam >= 9.0 || this.camera.position.z >= 16.0) {
      if (sanctumCard) {
        sanctumCard.classList.remove('visible');
        delete sanctumCard.dataset.manuallyClosed;
      }
    }

    // 2. Check Nandi distance & proximity
    const nandiPos = new THREE.Vector3(0, 1.7, 24.5);
    const distToNandi = this.camera.position.distanceTo(nandiPos);

    if (distToNandi < 7.5 && this.mode === 'walk' && this.camera.position.z > 17.0) {
      if (nandiCard && !nandiCard.dataset.manuallyClosed) {
        nandiCard.classList.add('visible');
      }
    } else if (distToNandi >= 9.0) {
      if (nandiCard) {
        nandiCard.classList.remove('visible');
        delete nandiCard.dataset.manuallyClosed;
      }
    }

    // 2b. Check Bhim Shila distance & proximity (Back side of Kedarnath Temple)
    const bhimCard = document.getElementById('bhimshila-darshan-card');
    const bhimPos = new THREE.Vector3(0, 2.5, -23.5);
    const distToBhim = this.camera.position.distanceTo(bhimPos);

    if (distToBhim < 10.5 && this.mode === 'walk' && this.camera.position.z < -16.0) {
      if (bhimCard && !bhimCard.dataset.manuallyClosed) {
        bhimCard.classList.add('visible');
      }
    } else if (distToBhim >= 12.0 || this.camera.position.z >= -15.0) {
      if (bhimCard) {
        bhimCard.classList.remove('visible');
        delete bhimCard.dataset.manuallyClosed;
      }
    }

    // 3. Check raycasting against Sanctum Lingam Altar (when inside)
    this.hoveredSanctum = false;
    if (this.temple.sanctumMeshes && this.camera.position.z < 14.0) {
      const sanctumIntersects = this.raycaster.intersectObjects(this.temple.sanctumMeshes, true);
      if (sanctumIntersects.length > 0 && sanctumIntersects[0].distance < 14.0) {
        this.hoveredSanctum = true;
        this.hoveredTempleFront = false;
        if (crosshair) crosshair.classList.add('interactable');
        if (hint) {
          hint.textContent = '🪔 Click to view Real Photos of Kedarnath Swayambhu Jyotirlinga';
          hint.classList.add('visible');
        }
        return;
      }
    }

    // 3b. Check raycasting against Temple Front Facade (when outside in courtyard)
    this.hoveredTempleFront = false;
    if (this.temple.templeFrontMeshes && this.camera.position.z >= 13.0) {
      const frontIntersects = this.raycaster.intersectObjects(this.temple.templeFrontMeshes, true);
      if (frontIntersects.length > 0 && frontIntersects[0].distance < 45.0) {
        this.hoveredTempleFront = true;
        if (crosshair) crosshair.classList.add('interactable');
        if (hint) {
          hint.textContent = '🏛️ Click to view Authentic Temple Photos & Darshan';
          hint.classList.add('visible');
        }
        return;
      }
    }

    // 4. Check raycasting against Nandi
    this.hoveredNandi = false;
    if (this.temple.nandiMeshes) {
      const nandiIntersects = this.raycaster.intersectObjects(this.temple.nandiMeshes, true);
      if (nandiIntersects.length > 0 && nandiIntersects[0].distance < 8.0) {
        this.hoveredNandi = true;
        if (crosshair) crosshair.classList.add('interactable');
        if (hint) {
          hint.textContent = '🐂 Click to view Real Photos of Kedarnath Nandi Maharaj';
          hint.classList.add('visible');
        }
        return;
      }
    }

    // 4b. Check raycasting against Bhim Shila (Back side megalith)
    this.hoveredBhimShila = false;
    if (this.temple.bhimShilaMeshes) {
      const bhimIntersects = this.raycaster.intersectObjects(this.temple.bhimShilaMeshes, true);
      if (bhimIntersects.length > 0 && bhimIntersects[0].distance < 15.0) {
        this.hoveredBhimShila = true;
        if (crosshair) crosshair.classList.add('interactable');
        if (hint) {
          hint.textContent = '🪨 Click to view Real Photos & 2013 Miracle of Bhim Shila';
          hint.classList.add('visible');
        }
        return;
      }
    }

    // 5. Check raycasting against Bells
    const bellMeshes = this.temple.bells.map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(bellMeshes, true);

    if (intersects.length > 0 && intersects[0].distance < 7.0) {
      this.hoveredBell = intersects[0].object;
      if (crosshair) crosshair.classList.add('interactable');
      if (hint) {
        hint.textContent = '🔔 Tap or Press E to Ring the Sacred Temple Bell';
        hint.classList.add('visible');
      }
    } else {
      this.hoveredBell = null;
      if (crosshair) crosshair.classList.remove('interactable');
      if (hint) hint.classList.remove('visible');
    }
  }

  updateCompass() {
    const compass = document.getElementById('compass-rose');
    if (compass) {
      const heading = (this.euler.y * (180 / Math.PI)) % 360;
      compass.style.transform = `rotate(${heading}deg)`;
    }
  }
}

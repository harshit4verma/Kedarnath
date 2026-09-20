/**
 * Kedarnath 360 AR/VR - Enhanced WebXR, Stereoscopic Cardboard VR & Mobile AR Portal Manager
 * Supports:
 * 1. Native WebXR Immersive-VR (Meta Quest, Apple Vision Pro, PCVR)
 * 2. Universal Dual-Eye Stereoscopic 3D VR (Google Cardboard, Split-Screen 3D on phones & desktop)
 * 3. Mobile/Webcam Real-Time AR Portal (Camera passthrough, glowing sacred portal ring, tabletop scaling & gyro tracking)
 */

class XRManager {
  constructor(renderer, scene, camera, temple, environment, controls) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.temple = temple;
    this.environment = environment;
    this.controls = controls;
    this.app = null;

    this.isVRSupported = false;
    this.isARSupported = false;
    this.isStereoVR = false;
    this.isARActive = false;
    this.isGyroActive = false;
    this.xrSession = null;

    // AR Video & Stream state
    this.arVideo = null;
    this.arStream = null;
    this.arCameraFacing = 'environment'; // 'environment' (back) or 'user' (front/webcam)
    this.arScale = 1.0;
    this.originalClearColor = new THREE.Color(0x0c111c);
    this.originalClearAlpha = 1.0;

    // Gyroscope tracking state
    this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.alphaOffset = 0;
    this.hasCalibratedAlpha = false;

    // Build 3D Sacred Golden AR Portal Ring on ground
    this.portalGroup = null;
    this.initPortalRing();

    this.initWebXR();
    this.setupControllers();
    this.bindUI();
  }

  setApp(app) {
    this.app = app;
  }

  setEnvironment(env) {
    this.environment = env;
  }

  setControls(ctrls) {
    this.controls = ctrls;
  }

  async initWebXR() {
    if ('xr' in navigator) {
      try {
        this.isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
        this.isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
        this.updateButtons();
      } catch (e) {
        console.warn('WebXR session query error:', e);
      }
    }
  }

  updateButtons() {
    const vrBtn = document.getElementById('btn-vr');
    const arBtn = document.getElementById('btn-ar');

    if (vrBtn) {
      vrBtn.classList.add('available');
      vrBtn.title = this.isVRSupported
        ? 'Enter Native WebXR VR (Meta Quest, Vision Pro, PCVR)'
        : 'Enter Stereoscopic 3D VR (Cardboard & Side-by-Side 3D)';
    }

    if (arBtn) {
      arBtn.classList.add('available');
      arBtn.title = 'Open Augmented Reality Portal with Live Camera Feed & Gyroscope';
    }
  }

  // Setup VR Hand Controllers for Meta Quest / PCVR
  setupControllers() {
    this.renderer.xr.enabled = true;

    // Controller 0 (Right hand)
    this.controller1 = this.renderer.xr.getController(0);
    this.controller1.addEventListener('selectstart', () => this.onControllerSelect());
    this.scene.add(this.controller1);

    // Controller 1 (Left hand)
    this.controller2 = this.renderer.xr.getController(1);
    this.controller2.addEventListener('selectstart', () => this.onControllerSelect());
    this.scene.add(this.controller2);

    // Laser pointers for VR controllers
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5)
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
    this.controller1.add(new THREE.Line(laserGeo, laserMat));
    this.controller2.add(new THREE.Line(laserGeo, laserMat));
  }

  onControllerSelect() {
    // Ring temple bell in VR
    if (this.temple && this.temple.bells && this.temple.bells.length > 0) {
      this.temple.ringBell(0);
      if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
    }
  }

  // Build 3D Sacred Golden AR Portal Ring on ground
  initPortalRing() {
    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(0, 0.05, 0);
    this.portalGroup.visible = false;

    // 1. Inner Golden Glowing Ring
    const innerRingGeo = new THREE.RingGeometry(18, 19.6, 64);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.portalGroup.add(this.innerRingMesh);

    // 2. Outer Concentric Ring
    const outerRingGeo = new THREE.RingGeometry(24, 25.2, 64);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xfb8500,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    this.outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.portalGroup.add(this.outerRingMesh);

    // 3. Floating Gold Spark Particles around Portal
    const partCount = 140;
    const partGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      const angle = (i / partCount) * Math.PI * 2;
      const radius = 18 + Math.random() * 7.5;
      posArr[i * 3] = Math.cos(angle) * radius;
      posArr[i * 3 + 1] = 0.1 + Math.random() * 2.8;
      posArr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xffe066,
      size: 0.35,
      transparent: true,
      opacity: 0.9
    });
    this.portalParticles = new THREE.Points(partGeo, partMat);
    this.portalGroup.add(this.portalParticles);

    this.scene.add(this.portalGroup);
  }

  update(delta, time) {
    if (this.portalGroup && this.portalGroup.visible) {
      if (this.innerRingMesh) this.innerRingMesh.rotation.y += delta * 0.4;
      if (this.outerRingMesh) this.outerRingMesh.rotation.y -= delta * 0.25;
      if (this.portalParticles) {
        this.portalParticles.rotation.y += delta * 0.15;
      }
    }
  }

  // =========================================================================
  // IMMERSIVE VR (NATIVE WEBXR OR DUAL-EYE STEREOSCOPIC CARDBOARD 3D)
  // =========================================================================
  async enterVR() {
    // 1. If native WebXR is supported and user has a headset connected:
    if (navigator.xr && this.isVRSupported) {
      if (this.xrSession) {
        await this.xrSession.end();
        this.xrSession = null;
        return;
      }
      try {
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
        });
        this.renderer.xr.setSession(session);
        this.xrSession = session;

        session.addEventListener('end', () => {
          this.xrSession = null;
          this.updateVRButtons(false);
        });

        this.updateVRButtons(true);
        return;
      } catch (err) {
        console.warn('Native WebXR session not granted, falling back to Stereoscopic 3D VR:', err);
      }
    }

    // 2. Universal Stereoscopic Cardboard / Side-by-Side 3D VR Mode
    this.toggleStereoVR();
  }

  toggleStereoVR() {
    if (this.isStereoVR) {
      this.exitStereoVR();
    } else {
      this.enterStereoVR();
    }
  }

  enterStereoVR() {
    this.isStereoVR = true;
    const dock = document.getElementById('vr-stereo-dock');
    if (dock) dock.style.display = 'flex';

    this.updateVRButtons(true);

    // Request fullscreen for full immersion
    const container = document.getElementById('canvas-container') || document.documentElement;
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {});
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }

    // On mobile, auto-activate Gyroscope head tracking for Cardboard headsets!
    this.enableGyro();
  }

  exitStereoVR() {
    this.isStereoVR = false;
    const dock = document.getElementById('vr-stereo-dock');
    if (dock) dock.style.display = 'none';

    this.updateVRButtons(false);

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    if (!this.isARActive) {
      this.disableGyro();
    }

    // Reset renderer viewport & scissors
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  updateVRButtons(active) {
    const vrBtn = document.getElementById('btn-vr');
    const vr360Btn = document.getElementById('btn-real-360-vr');
    if (vrBtn) vrBtn.classList.toggle('active', active);
    if (vr360Btn) vr360Btn.classList.toggle('active', active);
  }

  // Dual-eye side-by-side stereoscopic rendering
  renderStereo(scene, camera) {
    const size = this.renderer.getSize(new THREE.Vector2());
    const halfWidth = Math.floor(size.x / 2);
    const height = Math.floor(size.y);

    const autoClear = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.renderer.clear();

    const eyeSepHalf = 0.032; // ~64mm human IPD
    const originalPos = camera.position.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    // Left Eye Viewport
    this.renderer.setViewport(0, 0, halfWidth, height);
    this.renderer.setScissor(0, 0, halfWidth, height);
    this.renderer.setScissorTest(true);
    camera.position.copy(originalPos).addScaledVector(right, -eyeSepHalf);
    camera.aspect = halfWidth / height;
    camera.updateProjectionMatrix();
    this.renderer.render(scene, camera);

    // Right Eye Viewport
    this.renderer.setViewport(halfWidth, 0, halfWidth, height);
    this.renderer.setScissor(halfWidth, 0, halfWidth, height);
    this.renderer.setScissorTest(true);
    camera.position.copy(originalPos).addScaledVector(right, eyeSepHalf);
    camera.aspect = halfWidth / height;
    camera.updateProjectionMatrix();
    this.renderer.render(scene, camera);

    // Restore camera & viewport
    camera.position.copy(originalPos);
    camera.aspect = size.x / size.y;
    camera.updateProjectionMatrix();

    this.renderer.setViewport(0, 0, size.x, height);
    this.renderer.setScissorTest(false);
    this.renderer.autoClear = autoClear;
  }

  // =========================================================================
  // AR PORTAL MODE (CAMERA PASSTHROUGH, GOLDEN PORTAL RING & GYROSCOPE)
  // =========================================================================
  async toggleARPortal() {
    if (this.isARActive) {
      this.exitARPortal();
    } else {
      await this.enterARPortal();
    }
  }

  async enterARPortal() {
    this.isARActive = true;
    const arBtn = document.getElementById('btn-ar');
    if (arBtn) arBtn.classList.add('active');

    const arDock = document.getElementById('ar-portal-dock');
    if (arDock) arDock.style.display = 'flex';

    // 1. Try starting device camera stream
    try {
      await this.startARCamera();
      const hint = document.getElementById('ar-dock-hint');
      if (hint) hint.textContent = 'Kedarnath Dham in Your Real Space • Turn device to explore';
    } catch (err) {
      console.warn('AR Camera not accessible, running Simulated AR Portal:', err);
      const hint = document.getElementById('ar-dock-hint');
      if (hint) hint.textContent = 'Simulated AR Portal • Drag or turn device to look around';
    }

    // 2. Adjust Three.js scene for AR:
    // Make background transparent so video feed shines through!
    this.renderer.setClearColor(0x000000, 0);

    // Hide procedural mountain wall & courtyard so the real room becomes the world!
    if (this.environment && this.environment.group) {
      this.environment.group.visible = false;
    }

    // Show golden sacred portal ring on ground
    if (this.portalGroup) {
      this.portalGroup.visible = true;
    }

    // Position camera for optimal AR temple view
    this.camera.position.set(0, 3.2, 22.0);
    this.camera.lookAt(0, 4.0, 0);

    // 3. Activate Gyroscope motion tracking
    this.enableGyro();
  }

  async startARCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera getUserMedia not supported on this browser');
    }

    // Stop existing stream if any
    if (this.arStream) {
      this.arStream.getTracks().forEach(t => t.stop());
      this.arStream = null;
    }

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: this.arCameraFacing },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.arStream = stream;

    if (!this.arVideo) {
      this.arVideo = document.getElementById('ar-camera-video');
    }

    if (this.arVideo) {
      this.arVideo.srcObject = stream;
      this.arVideo.style.display = 'block';
      await this.arVideo.play();
    }
  }

  exitARPortal() {
    this.isARActive = false;

    const arBtn = document.getElementById('btn-ar');
    if (arBtn) arBtn.classList.remove('active');

    const arDock = document.getElementById('ar-portal-dock');
    if (arDock) arDock.style.display = 'none';

    // Stop camera video stream
    if (this.arStream) {
      this.arStream.getTracks().forEach(t => t.stop());
      this.arStream = null;
    }
    if (this.arVideo) {
      this.arVideo.srcObject = null;
      this.arVideo.style.display = 'none';
    }

    // Restore clear color
    this.renderer.setClearColor(this.originalClearColor, this.originalClearAlpha);

    // Restore environment
    if (this.environment && this.environment.group) {
      this.environment.group.visible = true;
    }

    // Hide portal ring
    if (this.portalGroup) {
      this.portalGroup.visible = false;
    }

    // Restore temple scale
    this.setTempleScale(1.0);

    // Restore camera position
    this.camera.position.set(0, 2.2, 31.0);
    this.camera.lookAt(0, 2.6, 8.0);

    // Disable gyro if not in Stereo VR
    if (!this.isStereoVR) {
      this.disableGyro();
    }
  }

  async flipCamera() {
    this.arCameraFacing = this.arCameraFacing === 'environment' ? 'user' : 'environment';
    if (this.isARActive) {
      try {
        await this.startARCamera();
      } catch (e) {
        console.warn('Failed to switch camera:', e);
      }
    }
  }

  setTempleScale(scale) {
    this.arScale = scale;
    if (this.temple && this.temple.group) {
      this.temple.group.scale.set(scale, scale, scale);
    }
    if (this.portalGroup) {
      this.portalGroup.scale.set(scale, scale, scale);
    }
    if (scale <= 0.3) {
      // Tabletop view: Move camera close and slightly elevated
      this.camera.position.set(0, 1.4, 7.5);
      this.camera.lookAt(0, 1.0, 0);
    } else {
      // Full view
      this.camera.position.set(0, 3.2, 22.0);
      this.camera.lookAt(0, 4.0, 0);
    }
  }

  // =========================================================================
  // GYROSCOPE HEAD / DEVICE ORIENTATION TRACKING
  // =========================================================================
  enableGyro() {
    if (this.isGyroActive) return;

    const zee = new THREE.Vector3(0, 0, 1);
    const euler = new THREE.Euler();
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -PI/2 around X

    const onOrientation = (e) => {
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      this.deviceOrientation = e;

      // Calibration: on first reading, offset alpha so temple is facing forward
      if (!this.hasCalibratedAlpha && e.alpha !== null) {
        this.alphaOffset = -THREE.MathUtils.degToRad(e.alpha);
        this.hasCalibratedAlpha = true;
      }

      const alpha = THREE.MathUtils.degToRad(e.alpha || 0) + this.alphaOffset;
      const beta = THREE.MathUtils.degToRad(e.beta || 0);
      const gamma = THREE.MathUtils.degToRad(e.gamma || 0);
      const orient = window.orientation ? THREE.MathUtils.degToRad(window.orientation) : 0;

      euler.set(beta, alpha, -gamma, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);
      this.camera.quaternion.multiply(q1);
      this.camera.quaternion.multiply(q0.setFromAxisAngle(zee, -orient));

      if (this.controls) {
        this.controls.euler.setFromQuaternion(this.camera.quaternion);
      }
    };

    this.gyroHandler = onOrientation;

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            this.isGyroActive = true;
            this.hasCalibratedAlpha = false;
            window.addEventListener('deviceorientation', this.gyroHandler, true);
          }
        })
        .catch(() => {});
    } else if (window.DeviceOrientationEvent) {
      this.isGyroActive = true;
      this.hasCalibratedAlpha = false;
      window.addEventListener('deviceorientation', this.gyroHandler, true);
    }
  }

  disableGyro() {
    this.isGyroActive = false;
    this.hasCalibratedAlpha = false;
    if (this.gyroHandler) {
      window.removeEventListener('deviceorientation', this.gyroHandler, true);
      this.gyroHandler = null;
    }
  }

  bindUI() {
    // Exit Stereo VR button
    const exitVrBtn = document.getElementById('btn-exit-stereo-vr');
    if (exitVrBtn) {
      exitVrBtn.addEventListener('click', () => this.exitStereoVR());
    }

    // AR Dock Exit button
    const exitArBtn = document.getElementById('btn-exit-ar-dock');
    if (exitArBtn) {
      exitArBtn.addEventListener('click', () => this.exitARPortal());
    }

    // AR Flip Camera
    const flipCamBtn = document.getElementById('btn-ar-flip-camera');
    if (flipCamBtn) {
      flipCamBtn.addEventListener('click', () => this.flipCamera());
    }

    // AR Tabletop Scale buttons
    const miniScaleBtn = document.getElementById('btn-ar-scale-mini');
    const normScaleBtn = document.getElementById('btn-ar-scale-normal');
    if (miniScaleBtn && normScaleBtn) {
      miniScaleBtn.addEventListener('click', () => {
        miniScaleBtn.classList.add('active');
        normScaleBtn.classList.remove('active');
        this.setTempleScale(0.25);
      });
      normScaleBtn.addEventListener('click', () => {
        normScaleBtn.classList.add('active');
        miniScaleBtn.classList.remove('active');
        this.setTempleScale(1.0);
      });
    }

    // AR Bell Ring button
    const arBellBtn = document.getElementById('btn-ar-bell');
    if (arBellBtn) {
      arBellBtn.addEventListener('click', () => {
        if (this.temple && this.temple.ringBell) this.temple.ringBell(0);
        if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
      });
    }
  }
}


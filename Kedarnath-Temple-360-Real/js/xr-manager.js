/**
 * Kedarnath 360 AR/VR - WebXR and Mobile Gyroscope Manager
 * Seamlessly manages Immersive-VR (Quest, Vision Pro, Cardboard),
 * Immersive-AR, and Mobile Gyroscope 360° device orientation portal.
 */

class XRManager {
  constructor(renderer, scene, camera, temple) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.temple = temple;

    this.isVRSupported = false;
    this.isARSupported = false;
    this.isGyroActive = false;
    this.xrSession = null;

    this.initWebXR();
    this.setupControllers();
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
      if (this.isVRSupported) {
        vrBtn.classList.add('available');
      } else {
        vrBtn.title = 'WebXR VR (Meta Quest, PCVR, Apple Vision Pro)';
      }
    }

    if (arBtn) {
      // AR is always supported on mobile via Gyroscope portal or WebXR
      arBtn.classList.add('available');
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
    // Ring nearest bell or teleport forward in VR
    if (this.temple && this.temple.bells.length > 0) {
      this.temple.ringBell(0);
    }
  }

  // Enter WebXR VR
  async enterVR() {
    if (!navigator.xr) {
      alert('WebXR is not supported on this browser. Try opening on Meta Quest, Chrome on Android, or Apple Vision Pro.');
      return;
    }

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
        document.getElementById('btn-vr').classList.remove('active');
      });

      document.getElementById('btn-vr').classList.add('active');
    } catch (e) {
      console.error('Failed to start VR session:', e);
      alert('Could not start VR session: ' + e.message);
    }
  }

  // Toggle Mobile Gyroscope 360° AR Portal Mode
  toggleARPortal() {
    const arBtn = document.getElementById('btn-ar');

    if (this.isGyroActive) {
      this.disableGyro();
      if (arBtn) arBtn.classList.remove('active');
      return;
    }

    // Check for iOS 13+ permission request
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            this.enableGyro();
            if (arBtn) arBtn.classList.add('active');
          } else {
            alert('Motion sensor permission is required for 360° AR mode.');
          }
        })
        .catch(err => {
          console.warn('DeviceOrientation error:', err);
          this.showARModal();
        });
    } else if (window.DeviceOrientationEvent) {
      this.enableGyro();
      if (arBtn) arBtn.classList.add('active');
    } else {
      this.showARModal();
    }
  }

  enableGyro() {
    this.isGyroActive = true;
    this.gyroHandler = (e) => {
      if (!e.alpha) return;
      const alpha = THREE.MathUtils.degToRad(e.alpha);
      const beta = THREE.MathUtils.degToRad(e.beta - 90);
      const gamma = THREE.MathUtils.degToRad(-e.gamma);

      this.camera.quaternion.setFromEuler(new THREE.Euler(beta, alpha, gamma, 'YXZ'));
    };
    window.addEventListener('deviceorientation', this.gyroHandler, true);
  }

  disableGyro() {
    this.isGyroActive = false;
    if (this.gyroHandler) {
      window.removeEventListener('deviceorientation', this.gyroHandler, true);
      this.gyroHandler = null;
    }
  }

  showARModal() {
    const modal = document.getElementById('ar-modal');
    if (modal) modal.classList.add('active');
  }
}

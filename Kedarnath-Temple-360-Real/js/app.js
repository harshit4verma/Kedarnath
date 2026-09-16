/**
 * Kedarnath 360 AR/VR - Main Application Orchestrator
 * Bootstraps Three.js WebGL/WebXR, loads temple & environment,
 * connects HUD buttons, hotkeys, and render loop.
 */

class KedarnathApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    
    this.initThree();
    this.initWorld();
    this.initUI();
    this.startLoop();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 800);

    // 3. Renderer with Photorealistic PBR & ACES Filmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initWorld() {
    // 1. Himalayan Mountain Environment & Campus
    this.environment = new HimalayanEnvironment(this.scene);

    // 2. 3D Kedarnath Temple, Nandi & Bells
    this.temple = new KedarnathTemple(this.scene);

    // 3. First-Person Walk, Drone & Interaction Controls
    this.controls = new ControllerManager(this.camera, this.renderer, this.temple, this.environment);

    // 4. WebXR VR & Mobile Gyro AR Manager
    this.xr = new XRManager(this.renderer, this.scene, this.camera, this.temple);

    // 5. Authentic 360° Real Photosphere VR Experience (YouTube 360 Video @ 48s)
    this.initReal360Viewer();
  }

  initUI() {
    // 1. Atmosphere / Time of Day Toggle (Day -> Sunset -> Night Aarti)
    const timeBtn = document.getElementById('btn-time');
    const timeModes = ['day', 'sunset', 'night'];
    const timeLabels = { day: '☀️ Day', sunset: '🌅 Sunset', night: '🪔 Aarti' };
    let currentTimeIndex = 0;

    if (timeBtn) {
      timeBtn.addEventListener('click', () => {
        currentTimeIndex = (currentTimeIndex + 1) % timeModes.length;
        const selectedMode = timeModes[currentTimeIndex];
        this.environment.setTimeOfDay(selectedMode);
        this.temple.setTimeOfDay(selectedMode);
        timeBtn.querySelector('.label-text').textContent = timeLabels[selectedMode];

        if (selectedMode === 'night') {
          if (window.soundEngine) window.soundEngine.playRealAarti();
        } else {
          if (window.soundEngine && !this.isReal360Active) window.soundEngine.pauseRealAarti();
        }
      });
    }

    // 1b. Real Snow Mountain Toggle ("Put the mountain are covered from snow look like real")
    const snowBtn = document.getElementById('btn-snow');
    let isSnowMode = true;
    if (snowBtn) {
      snowBtn.addEventListener('click', () => {
        isSnowMode = !isSnowMode;
        this.environment.setSnowMode(isSnowMode);
        snowBtn.classList.toggle('active', isSnowMode);
        snowBtn.querySelector('.label-text').textContent = isSnowMode ? 'Snow Mountain' : 'Clear Mountain';
        snowBtn.querySelector('.btn-icon').textContent = isSnowMode ? '❄️' : '🏔️';
      });
    }

    // 2. Audio & Chant Toggle
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (window.soundEngine) {
          const isMuted = window.soundEngine.toggleMute();
          soundBtn.classList.toggle('active', !isMuted);
          soundBtn.querySelector('.label-text').textContent = isMuted ? 'Muted' : 'Audio On';
          // Always ring the temple bell with resonant bronze sound on click
          window.soundEngine.playTempleBell(1.0);
          if (this.temple) this.temple.ringBell(0);
        }
      });
    }

    // 3. Mode Toggle (Walk vs 360° Drone Tour)
    const modeBtn = document.getElementById('btn-mode');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        if (this.controls.mode === 'walk') {
          this.controls.setMode('drone');
          modeBtn.querySelector('.btn-text').textContent = 'Walk Tour';
          modeBtn.querySelector('.btn-icon').textContent = '🚶';
        } else {
          this.controls.setMode('walk');
          modeBtn.querySelector('.btn-text').textContent = '360° Drone';
          modeBtn.querySelector('.btn-icon').textContent = '🚁';
        }
      });
    }

    // 4. WebXR VR Button
    const vrBtn = document.getElementById('btn-vr');
    if (vrBtn) {
      vrBtn.addEventListener('click', () => {
        this.xr.enterVR();
      });
    }

    // 5. Mobile Gyro / AR Button
    const arBtn = document.getElementById('btn-ar');
    if (arBtn) {
      arBtn.addEventListener('click', () => {
        this.xr.toggleARPortal();
      });
    }

    // 5b. Real 360° Video VR Experience Mode Toggle (YouTube 360 Video @ 48s)
    const real360TopBtn = document.getElementById('btn-real-360');
    const real360BottomBtn = document.getElementById('btn-real-360-bottom');
    const exitReal360Btn = document.getElementById('btn-exit-real-360');
    const real360AudioBtn = document.getElementById('btn-real-360-audio');
    const real360VrBtn = document.getElementById('btn-real-360-vr');

    const toggleReal360 = () => {
      if (this.isReal360Active) {
        this.exitReal360Mode();
      } else {
        this.enterReal360Mode('day');
      }
    };

    if (real360TopBtn) real360TopBtn.addEventListener('click', toggleReal360);
    if (real360BottomBtn) real360BottomBtn.addEventListener('click', toggleReal360);
    if (exitReal360Btn) exitReal360Btn.addEventListener('click', () => this.exitReal360Mode());

    if (real360AudioBtn) {
      real360AudioBtn.addEventListener('click', () => {
        if (window.soundEngine) {
          const playing = window.soundEngine.toggleRealAarti();
          real360AudioBtn.classList.toggle('active', playing);
          const txt = document.getElementById('aarti-audio-text');
          if (txt) txt.textContent = playing ? 'Aarti Audio: On' : 'Aarti Audio: Muted';
        }
      });
    }

    if (real360VrBtn) {
      real360VrBtn.addEventListener('click', () => {
        if (this.xr) this.xr.enterVR();
      });
    }

    // Viewpoint Selector buttons (Courtyard 48s, Temple Close, Bhim Shila, Night Aarti)
    const viewButtons = document.querySelectorAll('.real-360-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewKey = btn.getAttribute('data-view');
        this.switch360View(viewKey);
      });
    });

    // 6. Sacred Hotspots Quick-Jump
    const hotspotButtons = document.querySelectorAll('.hotspot-btn');
    hotspotButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        hotspotButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const spotId = btn.getAttribute('data-spot');
        this.controls.teleportTo(spotId);
      });
    });

    // 7. Fullscreen Toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });
    }

    // 8. Info Modal
    const infoBtn = document.getElementById('btn-info');
    const infoModal = document.getElementById('info-modal');
    const closeModals = document.querySelectorAll('.modal-close');

    if (infoBtn && infoModal) {
      infoBtn.addEventListener('click', () => infoModal.classList.add('active'));
    }

    closeModals.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      });
    });

    // Close modals on clicking backdrop background
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });

    // Close modals and cards on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.nandi-card').forEach(c => c.classList.remove('visible'));
      }
    });

    // 9. Close guide card
    const closeGuide = document.querySelector('.close-guide');
    if (closeGuide) {
      closeGuide.addEventListener('click', () => {
        const guide = document.getElementById('controls-guide');
        if (guide) guide.style.display = 'none';
      });
    }

    // 10. Real Nandi Photo Card & Gallery Modal
    const viewNandiBtn = document.getElementById('btn-view-nandi-photos');
    const nandiModal = document.getElementById('nandi-modal');
    const closeNandiBtn = document.getElementById('btn-close-nandi-modal');
    const closeNandiCardBtn = document.getElementById('btn-close-nandi-card');
    const ringNandiBellBtn = document.getElementById('btn-ring-nandi-bell');

    if (viewNandiBtn && nandiModal) {
      viewNandiBtn.addEventListener('click', () => nandiModal.classList.add('active'));
    }
    if (closeNandiBtn && nandiModal) {
      closeNandiBtn.addEventListener('click', () => nandiModal.classList.remove('active'));
    }
    if (closeNandiCardBtn) {
      closeNandiCardBtn.addEventListener('click', () => {
        const card = document.getElementById('nandi-darshan-card');
        if (card) {
          card.classList.remove('visible');
          card.dataset.manuallyClosed = 'true';
        }
      });
    }
    if (ringNandiBellBtn) {
      ringNandiBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
        this.temple.ringBell(0);
      });
    }

    // 10b. Dedicated Bottom Nandi Dock Widget Controls ("On the bottom put Nandi show it")
    const dockFocusBtn = document.getElementById('btn-dock-nandi-focus');
    const dock360Btn = document.getElementById('btn-dock-nandi-360');
    const dockPhotosBtn = document.getElementById('btn-dock-nandi-photos');
    const dockBellBtn = document.getElementById('btn-dock-nandi-bell');

    if (dockFocusBtn) {
      dockFocusBtn.addEventListener('click', () => {
        this.controls.teleportTo('nandi');
        const hotspotButtons = document.querySelectorAll('.hotspot-btn');
        hotspotButtons.forEach(b => b.classList.remove('active'));
        const nandiSpotBtn = document.querySelector('.hotspot-btn[data-spot="nandi"]');
        if (nandiSpotBtn) nandiSpotBtn.classList.add('active');
      });
    }

    if (dock360Btn) {
      dock360Btn.addEventListener('click', () => {
        this.controls.orbitNandi();
        dock360Btn.classList.add('active');
        setTimeout(() => dock360Btn.classList.remove('active'), 2000);
      });
    }

    if (dockPhotosBtn && nandiModal) {
      dockPhotosBtn.addEventListener('click', () => {
        nandiModal.classList.add('active');
      });
    }

    if (dockBellBtn) {
      dockBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(1.0);
        this.temple.ringBell(0);
      });
    }

    // Nandi modal thumbnail strip switching
    const nandiThumbs = document.querySelectorAll('.nandi-thumbs-strip .nandi-thumb:not(.sanctum-thumb)');
    const nandiMainImg = document.getElementById('nandi-main-img');
    const nandiCaption = document.getElementById('nandi-caption');
    nandiThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        nandiThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (nandiMainImg) nandiMainImg.src = thumb.dataset.img;
        if (nandiCaption) nandiCaption.textContent = thumb.dataset.cap;
      });
    });

    // 11. Real Sanctum Jyotirlinga Card & Gallery Modal
    const viewSanctumBtn = document.getElementById('btn-view-sanctum-photos');
    const sanctumModal = document.getElementById('sanctum-modal');
    const closeSanctumBtn = document.getElementById('btn-close-sanctum-modal');
    const closeSanctumCardBtn = document.getElementById('btn-close-sanctum-card');
    const darshanBellBtn = document.getElementById('btn-darshan-bell');

    if (viewSanctumBtn && sanctumModal) {
      viewSanctumBtn.addEventListener('click', () => sanctumModal.classList.add('active'));
    }
    if (closeSanctumBtn && sanctumModal) {
      closeSanctumBtn.addEventListener('click', () => sanctumModal.classList.remove('active'));
    }
    if (closeSanctumCardBtn) {
      closeSanctumCardBtn.addEventListener('click', () => {
        const card = document.getElementById('sanctum-darshan-card');
        if (card) {
          card.classList.remove('visible');
          card.dataset.manuallyClosed = 'true';
        }
      });
    }
    if (darshanBellBtn) {
      darshanBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(1.2);
        this.temple.ringBell(1);
      });
    }

    // Sanctum modal thumbnail strip switching
    const sanctumThumbs = document.querySelectorAll('#sanctum-modal .thumb-item');
    const sanctumHeroImg = document.getElementById('sanctum-hero-img');
    const sanctumCaption = document.getElementById('sanctum-hero-caption');
    sanctumThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        sanctumThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (sanctumHeroImg) sanctumHeroImg.src = thumb.dataset.src;
        if (sanctumCaption) sanctumCaption.innerHTML = thumb.dataset.caption;
      });
    });

    // 12. Real Bhim Shila Photo Card & Gallery Modal ("Back this from back side")
    const viewBhimBtn = document.getElementById('btn-view-bhim-photos');
    const bhimModal = document.getElementById('bhimshila-modal');
    const closeBhimBtn = document.getElementById('btn-close-bhim-modal');
    const closeBhimCardBtn = document.getElementById('btn-close-bhim-card');
    const ringBhimBellBtn = document.getElementById('btn-ring-bhim-bell');

    if (viewBhimBtn && bhimModal) {
      viewBhimBtn.addEventListener('click', () => bhimModal.classList.add('active'));
    }
    if (closeBhimBtn && bhimModal) {
      closeBhimBtn.addEventListener('click', () => bhimModal.classList.remove('active'));
    }
    if (closeBhimCardBtn) {
      closeBhimCardBtn.addEventListener('click', () => {
        const card = document.getElementById('bhimshila-darshan-card');
        if (card) {
          card.classList.remove('visible');
          card.dataset.manuallyClosed = 'true';
        }
      });
    }
    if (ringBhimBellBtn) {
      ringBhimBellBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playTempleBell(0.9);
        this.temple.ringBell(2); // Ring Bhim Shila bell
      });
    }

    // Bhim Shila modal thumbnail strip switching
    const bhimThumbs = document.querySelectorAll('#bhimshila-modal .thumb-item');
    const bhimHeroImg = document.getElementById('bhim-hero-img');
    const bhimCaption = document.getElementById('bhim-hero-caption');
    bhimThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        bhimThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (bhimHeroImg) bhimHeroImg.src = thumb.dataset.src;
        if (bhimCaption) bhimCaption.innerHTML = thumb.dataset.caption;
      });
    });

    // 13. Real Temple & Mountains Photo Gallery Modal ("temple colour and mountains like this image")
    const viewTemplePhotosBtn = document.getElementById('btn-real-photos');
    const templeModal = document.getElementById('temple-photos-modal');
    const closeTempleBtn = document.getElementById('btn-close-temple-modal');

    if (viewTemplePhotosBtn && templeModal) {
      viewTemplePhotosBtn.addEventListener('click', () => templeModal.classList.add('active'));
    }
    if (closeTempleBtn && templeModal) {
      closeTempleBtn.addEventListener('click', () => templeModal.classList.remove('active'));
    }

    const templeThumbs = document.querySelectorAll('#temple-photos-modal .thumb-item');
    const templeHeroImg = document.getElementById('temple-hero-img');
    const templeCaption = document.getElementById('temple-hero-caption');
    templeThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        templeThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        if (templeHeroImg) templeHeroImg.src = thumb.dataset.src;
        if (templeCaption) templeCaption.innerHTML = thumb.dataset.caption;
      });
    });
  }

  // =========================================================================
  // AUTHENTIC 360° REAL PHOTOSPHERE VR VIEWER (Direct from YouTube @ 48s)
  // Reconstructs the 100% genuine photographic reality of Kedarnath Dham.
  // =========================================================================
  initReal360Viewer() {
    this.isReal360Active = false;
    this.current360View = 'day';

    const texLoader = new THREE.TextureLoader();
    this.real360Textures = {
      day: texLoader.load('assets/kedarnath_360_day_courtyard.jpg'),
      close: texLoader.load('assets/kedarnath_360_temple_close.jpg'),
      bhim: texLoader.load('assets/kedarnath_360_bhim_shila.jpg'),
      night: texLoader.load('assets/kedarnath_360_aarti_night.jpg')
    };

    Object.values(this.real360Textures).forEach(tex => {
      tex.mapping = THREE.UVMapping;
      tex.encoding = THREE.sRGBEncoding;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
    });

    // 300m inward-facing spherical photosphere
    const sphereGeo = new THREE.SphereGeometry(300, 64, 40);
    sphereGeo.scale(-1, 1, 1); // Invert faces inward

    this.real360Mat = new THREE.MeshBasicMaterial({
      map: this.real360Textures.day,
      side: THREE.DoubleSide,
      fog: false
    });

    this.real360Sphere = new THREE.Mesh(sphereGeo, this.real360Mat);
    this.real360Sphere.rotation.y = -Math.PI / 2;
    this.real360Sphere.visible = false;
    this.scene.add(this.real360Sphere);
  }

  enterReal360Mode(viewKey = 'day') {
    this.isReal360Active = true;
    this.temple.group.visible = false;
    this.environment.group.visible = false;
    this.real360Sphere.visible = true;

    // Center camera and sphere
    this.controls.setMode('real360');
    this.camera.position.set(0, 0, 0);
    this.real360Sphere.position.set(0, 0, 0);

    // Update UI HUD
    const realHud = document.getElementById('real-360-hud');
    if (realHud) realHud.style.display = 'block';

    const nandiDock = document.getElementById('bottom-nandi-dock');
    if (nandiDock) nandiDock.style.display = 'none';

    const hotspotsRow = document.querySelector('.hotspots-row');
    if (hotspotsRow) hotspotsRow.style.display = 'none';

    const actionsRow = document.querySelector('.actions-row');
    if (actionsRow) actionsRow.style.display = 'none';

    const btnReal360 = document.getElementById('btn-real-360');
    if (btnReal360) btnReal360.classList.add('active');

    const btnReal360Bottom = document.getElementById('btn-real-360-bottom');
    if (btnReal360Bottom) btnReal360Bottom.classList.add('active');

    this.switch360View(viewKey);
  }

  exitReal360Mode() {
    this.isReal360Active = false;
    this.real360Sphere.visible = false;
    this.temple.group.visible = true;
    this.environment.group.visible = true;

    this.controls.setMode('walk');

    // Restore UI
    const realHud = document.getElementById('real-360-hud');
    if (realHud) realHud.style.display = 'none';

    const nandiDock = document.getElementById('bottom-nandi-dock');
    if (nandiDock) nandiDock.style.display = '';

    const hotspotsRow = document.querySelector('.hotspots-row');
    if (hotspotsRow) hotspotsRow.style.display = '';

    const actionsRow = document.querySelector('.actions-row');
    if (actionsRow) actionsRow.style.display = '';

    const btnReal360 = document.getElementById('btn-real-360');
    if (btnReal360) btnReal360.classList.remove('active');

    const btnReal360Bottom = document.getElementById('btn-real-360-bottom');
    if (btnReal360Bottom) btnReal360Bottom.classList.remove('active');

    if (this.environment.timeOfDay !== 'night' && window.soundEngine) {
      window.soundEngine.pauseRealAarti();
    }
  }

  switch360View(viewKey) {
    this.current360View = viewKey;
    const tex = this.real360Textures[viewKey];
    if (tex && this.real360Mat) {
      this.real360Mat.map = tex;
      this.real360Mat.needsUpdate = true;
    }

    // Update active button state
    document.querySelectorAll('.real-360-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewKey);
    });

    const titleEl = document.getElementById('real-360-title');
    const descEl = document.getElementById('real-360-desc');
    const audioBtn = document.getElementById('btn-real-360-audio');
    const audioText = document.getElementById('aarti-audio-text');

    if (viewKey === 'day') {
      if (titleEl) titleEl.textContent = 'Kedarnath Temple Courtyard (00:48)';
      if (descEl) descEl.textContent = 'Authentic 360° VR view at 48s from reference video with pilgrims and Himalayan peaks';
      this.temple.setTimeOfDay('day');
      this.environment.setTimeOfDay('day');
      if (window.soundEngine) window.soundEngine.pauseRealAarti();
      if (audioBtn) audioBtn.classList.remove('active');
      if (audioText) audioText.textContent = 'Aarti Audio: Off';
    } else if (viewKey === 'close') {
      if (titleEl) titleEl.textContent = 'Kedarnath Temple Front Close (01:30)';
      if (descEl) descEl.textContent = 'Authentic close-up view facing the grand carved temple entrance, bell garlands, and devotees';
      this.temple.setTimeOfDay('day');
      if (window.soundEngine) window.soundEngine.pauseRealAarti();
      if (audioBtn) audioBtn.classList.remove('active');
      if (audioText) audioText.textContent = 'Aarti Audio: Off';
    } else if (viewKey === 'bhim') {
      if (titleEl) titleEl.textContent = 'Miraculous Shri Bhim Shila (05:30)';
      if (descEl) descEl.textContent = 'Sacred protector megalith directly behind the temple, adorned with dhwaja flags & puja diyas';
      this.temple.setTimeOfDay('day');
      if (window.soundEngine) window.soundEngine.pauseRealAarti();
      if (audioBtn) audioBtn.classList.remove('active');
      if (audioText) audioText.textContent = 'Aarti Audio: Off';
    } else if (viewKey === 'night') {
      if (titleEl) titleEl.textContent = 'Sacred Evening Aarti Darshan (08:45)';
      if (descEl) descEl.textContent = 'Temple glowing with festive golden fairy lights & floodlights, surrounded by chanting devotees';
      this.temple.setTimeOfDay('night');
      this.environment.setTimeOfDay('night');
      if (window.soundEngine) {
        window.soundEngine.playRealAarti();
        if (audioBtn) audioBtn.classList.add('active');
        if (audioText) audioText.textContent = 'Aarti Audio: On';
      }
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startLoop() {
    // Set animation loop compatible with WebXR stereoscopic rendering
    this.renderer.setAnimationLoop((timestamp) => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsedTime = this.clock.getElapsedTime();

      // Update controllers & physics
      this.controls.update(delta, elapsedTime);

      if (this.isReal360Active) {
        if (this.real360Sphere) {
          this.real360Sphere.position.copy(this.camera.position);
        }
      } else {
        // Update temple animations (flags, bells, diyas)
        this.temple.update(elapsedTime, delta);

        // Update environment (snow particles, prayer flags, lights)
        this.environment.update(elapsedTime, delta);
      }

      // Render frame
      this.renderer.render(this.scene, this.camera);
    });
  }
}

// Start app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new KedarnathApp();
});

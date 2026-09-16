/**
 * Kedarnath 360 AR/VR - Google Maps Street View UI & Interactive Minimap
 * Renders the authentic Google Maps Street View interface:
 * - Top-left location badge with live GPS coordinates, elevation, and distance
 * - Interactive 2D Himalayan minimap with live Pegman and directional radar FOV
 * - Control dock with Play/Pause, speed selection (0.5x, 1x, 2x), and milestone jump
 */

class StreetViewUI {
  constructor(trekController, trekRoute, onModeChange) {
    this.trekController = trekController;
    this.trekRoute = trekRoute;
    this.onModeChange = onModeChange;

    this.minimapCanvas = null;
    this.minimapCtx = null;
    this.isMinimapExpanded = false;

    this.createDOM();
    this.initMinimap();
    this.bindEvents();
  }

  createDOM() {
    let container = document.getElementById('streetview-hud');
    if (!container) {
      container = document.createElement('div');
      container.id = 'streetview-hud';
      document.body.appendChild(container);
    }

    container.innerHTML = 
      <!-- Top-Left Location & Trek Statistics Card -->
      <div class="sv-header-card">
        <div class="sv-location-top">
          <div class="sv-pin-icon">📍</div>
          <div class="sv-location-info">
            <div class="sv-location-title" id="sv-title">Kedarnath Trek Route • Uttarakhand</div>
            <div class="sv-location-sub" id="sv-desc">Gaurikund to Kedarnath Dham Holy Pilgrimage</div>
          </div>
        </div>

        <div class="sv-stats-grid">
          <div class="sv-stat-item">
            <span class="sv-stat-label">Elevation</span>
            <span class="sv-stat-val" id="sv-elev">2,040 m</span>
          </div>
          <div class="sv-stat-item">
            <span class="sv-stat-label">To Temple</span>
            <span class="sv-stat-val" id="sv-dist">16.0 km</span>
          </div>
          <div class="sv-stat-item">
            <span class="sv-stat-label">GPS Coords</span>
            <span class="sv-stat-val" id="sv-coords" style="font-size:11px;">30.58° N, 79.03° E</span>
          </div>
        </div>

        <div class="sv-progress-container">
          <div class="sv-progress-bar-bg">
            <div class="sv-progress-bar-fill" id="sv-progress-fill"></div>
          </div>
          <div class="sv-progress-labels">
            <span>Gaurikund (2,040m)</span>
            <span id="sv-progress-pct">0%</span>
            <span>Kedarnath (3,583m)</span>
          </div>
        </div>
      </div>

      <!-- Bottom-Left Google Maps Himalayan Minimap -->
      <div class="sv-minimap-card" id="sv-minimap-card">
        <div class="sv-minimap-header">
          <span>🗺️ Google Maps • Kedarnath Yatra</span>
          <div class="sv-minimap-controls">
            <button class="sv-map-btn" id="btn-expand-map" title="Expand / Collapse Map">⛶</button>
          </div>
        </div>
        <div class="sv-minimap-canvas-wrap">
          <canvas id="sv-minimap-canvas" width="300" height="300"></canvas>
        </div>
      </div>

      <!-- Bottom Street View Walking Control Dock -->
      <div class="sv-controls-dock">
        <!-- Play / Pause Auto Walk -->
        <div class="sv-btn-group">
          <button class="sv-icon-btn active" id="sv-btn-play" title="Play / Pause Auto-Walk (Spacebar)">
            <span id="sv-play-icon">⏸️</span>
          </button>
          <button class="sv-icon-btn" id="sv-btn-step-back" title="Step Back (S / Down)">
            <span>⏮️</span>
          </button>
          <button class="sv-icon-btn" id="sv-btn-step-fwd" title="Step Forward (W / Up)">
            <span>⏭️</span>
          </button>
        </div>

        <!-- Walking Pace Multiplier -->
        <div class="sv-btn-group">
          <div class="sv-speed-selector">
            <button class="sv-speed-btn" data-speed="0.5" title="Slow Stroll ~2 km/h">0.5x</button>
            <button class="sv-speed-btn active" data-speed="1.0" title="Normal Walk ~4 km/h">1x</button>
            <button class="sv-speed-btn" data-speed="2.0" title="Brisk Hike ~8 km/h">2x</button>
          </div>
        </div>

        <!-- Milestone Jump Menu -->
        <div class="sv-btn-group sv-milestones-menu">
          <button class="sv-milestone-btn" id="btn-milestones-toggle">
            <span>🚩</span> Milestones ▾
          </button>
          <div class="sv-milestones-dropdown" id="sv-milestones-dropdown">
            <button class="sv-dropdown-item" data-milestone="gaurikund">
              <span>1. Gaurikund Trailhead</span>
              <span class="sv-item-elev">2,040 m</span>
            </button>
            <button class="sv-dropdown-item" data-milestone="junglechatti">
              <span>2. Jungle Chatti</span>
              <span class="sv-item-elev">2,350 m</span>
            </button>
            <button class="sv-dropdown-item" data-milestone="bhimbali">
              <span>3. Bhimbali Bridge</span>
              <span class="sv-item-elev">2,675 m</span>
            </button>
            <button class="sv-dropdown-item" data-milestone="linchauli">
              <span>4. Linchauli Pass</span>
              <span class="sv-item-elev">3,150 m</span>
            </button>
            <button class="sv-dropdown-item" data-milestone="basecamp">
              <span>5. Kedarnath Base Camp</span>
              <span class="sv-item-elev">3,450 m</span>
            </button>
            <button class="sv-dropdown-item" data-milestone="temple">
              <span>6. Kedarnath Temple</span>
              <span class="sv-item-elev">3,583 m</span>
            </button>
          </div>
        </div>

        <!-- Mode Switch: Street View Trek vs Temple Campus -->
        <div class="sv-btn-group">
          <button class="sv-milestone-btn" id="btn-switch-to-temple" style="background:rgba(234,67,53,0.2); border-color:#ea4335;" title="Jump directly to Temple Campus & Nandi">
            <span>🏛️</span> Temple Campus
          </button>
        </div>
      </div>
    ;

    this.container = container;
  }

  initMinimap() {
    this.minimapCanvas = document.getElementById('sv-minimap-canvas');
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
    }
  }

  bindEvents() {
    // 1. Play / Pause
    const playBtn = document.getElementById('sv-btn-play');
    const playIcon = document.getElementById('sv-play-icon');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const isWalking = this.trekController.toggleWalk();
        playIcon.textContent = isWalking ? '⏸️' : '▶️';
        playBtn.classList.toggle('active', isWalking);
      });
    }

    // 2. Step forward & backward
    const stepFwd = document.getElementById('sv-btn-step-fwd');
    const stepBack = document.getElementById('sv-btn-step-back');
    if (stepFwd) {
      stepFwd.addEventListener('click', () => this.trekController.stepForward(0.015));
    }
    if (stepBack) {
      stepBack.addEventListener('click', () => this.trekController.stepForward(-0.015));
    }

    // 3. Speed selector
    const speedBtns = document.querySelectorAll('.sv-speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.dataset.speed);
        this.trekController.setSpeed(speed);
      });
    });

    // 4. Milestones dropdown
    const milestoneToggle = document.getElementById('btn-milestones-toggle');
    const dropdown = document.getElementById('sv-milestones-dropdown');
    if (milestoneToggle && dropdown) {
      milestoneToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });
      document.addEventListener('click', () => dropdown.classList.remove('show'));
    }

    const dropdownItems = document.querySelectorAll('.sv-dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', () => {
        dropdownItems.forEach(d => d.classList.remove('active'));
        item.classList.add('active');
        const mId = item.dataset.milestone;
        this.trekController.jumpToMilestone(mId);
      });
    });

    // 5. Expand / Collapse Minimap
    const expandMapBtn = document.getElementById('btn-expand-map');
    const mapCard = document.getElementById('sv-minimap-card');
    if (expandMapBtn && mapCard) {
      expandMapBtn.addEventListener('click', () => {
        this.isMinimapExpanded = !this.isMinimapExpanded;
        mapCard.classList.toggle('expanded', this.isMinimapExpanded);
        expandMapBtn.textContent = this.isMinimapExpanded ? '🗗' : '⛶';
      });
    }

    // 6. Minimap Click-to-Teleport / Glide
    if (this.minimapCanvas) {
      this.minimapCanvas.addEventListener('click', (e) => {
        const rect = this.minimapCanvas.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const normY = clickY / rect.height;
        // Top of map is Temple (t=1.0), bottom of map is Gaurikund (t=0.0)
        const targetT = THREE.MathUtils.clamp(1.0 - normY, 0, 1);
        this.trekController.glideTo(targetT, 2.0);
      });
    }

    // 7. Switch to Temple Campus mode
    const templeSwitchBtn = document.getElementById('btn-switch-to-temple');
    if (templeSwitchBtn) {
      templeSwitchBtn.addEventListener('click', () => {
        if (this.onModeChange) this.onModeChange('temple');
      });
    }
  }

  // Update HUD text and stats
  updateHUD(info) {
    const titleEl = document.getElementById('sv-title');
    const descEl = document.getElementById('sv-desc');
    const elevEl = document.getElementById('sv-elev');
    const distEl = document.getElementById('sv-dist');
    const coordsEl = document.getElementById('sv-coords');
    const fillEl = document.getElementById('sv-progress-fill');
    const pctEl = document.getElementById('sv-progress-pct');

    if (titleEl && info.milestone) titleEl.textContent = info.milestone.name;
    if (descEl && info.milestone) descEl.textContent = info.milestone.desc;
    if (elevEl) elevEl.textContent = ${info.elev.toLocaleString()} m;
    if (distEl) distEl.textContent = ${info.distKm} km;
    if (coordsEl) coordsEl.textContent = info.coords;

    const pct = Math.round(info.t * 100);
    if (fillEl) fillEl.style.width = ${pct}%;
    if (pctEl) pctEl.textContent = ${pct}%;
  }

  // Draw 2D Google Maps style topographic minimap
  drawMinimap(currentT, cameraHeadingRad) {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    // Background: Mountain topographic relief
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1a2e26');   // High alpine moraine
    bgGrad.addColorStop(0.5, '#223c2d'); // Mountain meadows
    bgGrad.addColorStop(1, '#1b3224');   // Gaurikund deodar forest
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle contour lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let c = 20; c < h; c += 25) {
      ctx.beginPath();
      ctx.arc(w / 2, c, w * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Mandakini River curve (Cyan glacial torrent)
    ctx.strokeStyle = 'rgba(34, 180, 220, 0.65)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.95);
    ctx.bezierCurveTo(w * 0.35, h * 0.7, w * 0.6, h * 0.45, w * 0.48, h * 0.05);
    ctx.stroke();

    // Pilgrimage Route Curve (Google Maps Blue with white casing)
    const trailPoints = [];
    const numPoints = 80;
    for (let i = 0; i <= numPoints; i++) {
      const tSample = i / numPoints;
      // Map world coords: Gaurikund (bottom) -> Kedarnath Temple (top)
      const raw = this.trekRoute.curve.getPointAt(tSample);
      const mx = w * 0.5 + (raw.x / 140) * (w * 0.38);
      const my = h * 0.92 - tSample * (h * 0.84);
      trailPoints.push({ x: mx, y: my, t: tSample });
    }

    // White outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    trailPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Google Blue path
    ctx.strokeStyle = '#1a73e8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    trailPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Milestone Marker Dots
    this.trekRoute.milestones.forEach((m, idx) => {
      const idxPoint = Math.min(trailPoints.length - 1, Math.round(m.t * (trailPoints.length - 1)));
      const pt = trailPoints[idxPoint];
      if (!pt) return;

      ctx.fillStyle = idx === this.trekRoute.milestones.length - 1 ? '#ea4335' : '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Label on expanded map
      if (this.isMinimapExpanded) {
        ctx.fillStyle = '#e8eaed';
        ctx.font = '10px Roboto, sans-serif';
        const labelSide = idx % 2 === 0 ? 8 : -75;
        ctx.fillText(m.name.split(' ')[0], pt.x + labelSide, pt.y + 3);
      }
    });

    // Current Walker Position (Google Pegman & Directional Radar FOV)
    const currentIdx = Math.min(trailPoints.length - 1, Math.round(currentT * (trailPoints.length - 1)));
    const curPt = trailPoints[currentIdx];

    if (curPt) {
      // Directional Radar FOV Cone (Google Street View style)
      const radarRadius = 26;
      const fovAngle = 0.85; // ~50 degrees FOV
      const angle = cameraHeadingRad - Math.PI / 2; // Adjust for canvas Y-down

      const fovGrad = ctx.createRadialGradient(curPt.x, curPt.y, 2, curPt.x, curPt.y, radarRadius);
      fovGrad.addColorStop(0, 'rgba(66, 133, 244, 0.6)');
      fovGrad.addColorStop(1, 'rgba(66, 133, 244, 0.0)');

      ctx.fillStyle = fovGrad;
      ctx.beginPath();
      ctx.moveTo(curPt.x, curPt.y);
      ctx.arc(curPt.x, curPt.y, radarRadius, angle - fovAngle / 2, angle + fovAngle / 2);
      ctx.closePath();
      ctx.fill();

      // Yellow Google Pegman circle / avatar
      ctx.fillStyle = '#fbbc04'; // Google Yellow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(curPt.x, curPt.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Black center dot
      ctx.fillStyle = '#202124';
      ctx.beginPath();
      ctx.arc(curPt.x, curPt.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  show() {
    if (this.container) this.container.classList.remove('hidden');
  }

  hide() {
    if (this.container) this.container.classList.add('hidden');
  }
}

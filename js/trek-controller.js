/**
 * Kedarnath 360 AR/VR - Street View Walking Controller
 * Implements ultra-realistic first-person human walking mechanics:
 * - Natural walking gait (dual-harmonic vertical head bob & lateral shoulder sway)
 * - Continuous forward movement along the authentic mountain pilgrimage route
 * - Realistic 360° looking around with mouse / touch drag while walking
 * - Audio-synced rhythmic footsteps on mountain stone
 * - Smooth camera navigation via Street View ground chevrons and minimap
 */

class TrekWalkController {
  constructor(camera, renderer, trekRoute, onMilestoneChange) {
    this.camera = camera;
    this.renderer = renderer;
    this.trekRoute = trekRoute;
    this.onMilestoneChange = onMilestoneChange;

    // Movement state
    this.isActive = false;
    this.t = 0.0;              // Position along pilgrimage spline [0, 1]
    this.targetT = null;       // Smooth glide target
    this.isWalking = true;     // Continuous forward walk
    this.speedMultiplier = 1.0; // 0.5x, 1.0x, 2.0x
    this.baseSpeed = 0.008;    // Human hiking speed (~4.0 km/h)
    
    // Human biomechanics
    this.eyeHeight = 1.68;     // 1.68 meters eye level
    this.stepPhase = 0;
    this.stepCadence = 1.8;    // Steps per second
    this.lastFootstepTime = 0;

    // 360° Look Angles (Relative to trail forward direction)
    this.userYaw = 0;          // Horizontal look offset
    this.userPitch = 0;        // Vertical look offset (-1.4 to 1.4 rad)
    this.targetYaw = 0;
    this.targetPitch = 0;

    // Drag / Touch state
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.touchStartDist = 0;

    // Raycaster for ground chevrons
    this.raycaster = new THREE.Raycaster();
    this.mouseCoords = new THREE.Vector2();

    this.initMouseLook();
    this.initTouchLook();
    this.initKeyboard();
  }

  initMouseLook() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };

      // Check click on 3D ground chevrons
      this.checkChevronClick(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isDragging) return;
      const deltaX = e.clientX - this.prevMousePos.x;
      const deltaY = e.clientY - this.prevMousePos.y;
      this.prevMousePos = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.0028;
      this.targetYaw -= deltaX * sensitivity;
      this.targetPitch -= deltaY * sensitivity;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -1.35, 1.35);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  initTouchLook() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('touchstart', (e) => {
      if (!this.isActive) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.checkChevronClick(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (!this.isActive || !this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.prevMousePos.x;
      const deltaY = e.touches[0].clientY - this.prevMousePos.y;
      this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const sensitivity = 0.0035;
      this.targetYaw -= deltaX * sensitivity;
      this.targetPitch -= deltaY * sensitivity;
      this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -1.35, 1.35);
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    }, { passive: true });
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      switch (e.code) {
        case 'Space':
          this.toggleWalk();
          e.preventDefault();
          break;
        case 'KeyW': case 'ArrowUp':
          this.stepForward(0.006);
          break;
        case 'KeyS': case 'ArrowDown':
          this.stepForward(-0.004);
          break;
        case 'KeyA': case 'ArrowLeft':
          this.targetYaw += 0.08;
          break;
        case 'KeyD': case 'ArrowRight':
          this.targetYaw -= 0.08;
          break;
      }
    });
  }

  // Raycast click detection on 3D ground chevrons
  checkChevronClick(clientX, clientY) {
    if (!this.trekRoute.chevronMeshes || this.trekRoute.chevronMeshes.length === 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseCoords.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseCoords.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseCoords, this.camera);
    const intersects = this.raycaster.intersectObjects(this.trekRoute.chevronMeshes);

    if (intersects.length > 0) {
      const chIdx = intersects[0].object.userData.index;
      const stepAdvances = [0.012, 0.024, 0.038];
      const advanceAmount = stepAdvances[chIdx] || 0.015;
      this.glideTo(Math.min(1.0, this.t + advanceAmount), 0.8);
      if (window.soundEngine) window.soundEngine.playFootstep();
    }
  }

  // Smooth glide to specific parameter t (from minimap or milestone jump)
  glideTo(targetT, durationSec = 1.8) {
    this.targetT = THREE.MathUtils.clamp(targetT, 0, 1);
    this.glideDuration = durationSec;
    this.glideElapsed = 0;
    this.glideStartT = this.t;
  }

  // Manual step forward or backward
  stepForward(amount) {
    this.t = THREE.MathUtils.clamp(this.t + amount, 0, 1);
    if (window.soundEngine && Math.abs(amount) > 0.001) {
      window.soundEngine.playFootstep();
    }
  }

  toggleWalk() {
    this.isWalking = !this.isWalking;
    return this.isWalking;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
  }

  jumpToMilestone(milestoneId) {
    const m = this.trekRoute.milestones.find(item => item.id === milestoneId);
    if (m) {
      this.glideTo(m.t, 2.2);
    }
  }

  setActive(active) {
    this.isActive = active;
    if (active) {
      // Smooth look orientation reset to trail tangent
      this.userYaw = 0;
      this.userPitch = 0;
      this.targetYaw = 0;
      this.targetPitch = 0;
      this.isWalking = true;
    }
  }

  // Main update loop called every animation frame
  update(delta, elapsedTime) {
    if (!this.isActive) return;

    // 1. Advance position along route
    if (this.targetT !== null) {
      // Smooth glide to destination
      this.glideElapsed += delta;
      const progress = Math.min(1.0, this.glideElapsed / Math.max(0.1, this.glideDuration));
      // Ease in-out cubic
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      this.t = THREE.MathUtils.lerp(this.glideStartT, this.targetT, ease);

      if (progress >= 1.0) {
        this.t = this.targetT;
        this.targetT = null;
      }
    } else if (this.isWalking && this.t < 1.0) {
      // Continuous human walking pace
      const stepSpeed = (this.baseSpeed * this.speedMultiplier) / Math.max(1, this.trekRoute.totalLength * 0.002);
      this.t = Math.min(1.0, this.t + stepSpeed * delta);
    }

    // 2. Dual-harmonic human walking gait & head bob
    let bobY = 0;
    let swayX = 0;
    let tiltZ = 0;

    const isMoving = (this.isWalking && this.t < 1.0) || this.targetT !== null;
    if (isMoving) {
      this.stepPhase += delta * this.stepCadence * Math.PI * 2 * Math.sqrt(this.speedMultiplier);

      // Vertical head dip (two step impacts per full stride cycle)
      bobY = Math.sin(this.stepPhase * 2) * 0.038;

      // Lateral shoulder sway (sways left on left foot, right on right foot)
      swayX = Math.sin(this.stepPhase) * 0.016;

      // Subtle lateral roll tilt
      tiltZ = Math.sin(this.stepPhase) * 0.005;

      // Sync footstep sound to footstrike bottom of bob cycle
      const footstrikePhase = Math.sin(this.stepPhase * 2);
      if (footstrikePhase < -0.92 && (elapsedTime - this.lastFootstepTime) > (0.42 / this.speedMultiplier)) {
        if (window.soundEngine) window.soundEngine.playFootstep();
        this.lastFootstepTime = elapsedTime;
      }
    } else {
      // Gentle breathing idle sway
      bobY = Math.sin(elapsedTime * 1.5) * 0.008;
    }

    // 3. Interpolate 3D position & forward tangent from spline
    const { point, tangent, normal, up } = this.trekRoute.getTrailTransformAt(this.t);

    // Compute eye position with human height and head bob
    const eyePos = point.clone();
    eyePos.y += this.eyeHeight + bobY;
    eyePos.addScaledVector(normal, swayX);
    this.camera.position.copy(eyePos);

    // 4. Smooth user freelook interpolation
    this.userYaw = THREE.MathUtils.lerp(this.userYaw, this.targetYaw, delta * 12);
    this.userPitch = THREE.MathUtils.lerp(this.userPitch, this.targetPitch, delta * 12);

    // Base forward orientation from spline tangent
    const baseQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), tangent);

    // Superimpose user 360° freelook (yaw around world up, pitch around local right)
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.userYaw);
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.userPitch);
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tiltZ);

    const finalQuat = baseQuat.clone().multiply(yawQuat).multiply(pitchQuat).multiply(rollQuat);
    this.camera.quaternion.copy(finalQuat);

    // 5. Update ground projected chevrons
    this.trekRoute.updateChevrons(this.t, this.isActive);

    // 6. Notify UI with milestone & progress info
    if (this.onMilestoneChange) {
      const info = this.trekRoute.getInfoAt(this.t);
      this.onMilestoneChange(info, this);
    }
  }
}

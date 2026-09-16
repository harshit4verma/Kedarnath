import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { TourNode, InfoHotspot } from '../data/tourNodes';

interface Viewer360Props {
  currentNode: TourNode;
  onNavigate: (targetNodeId: string) => void;
  onSelectHotspot: (hotspot: InfoHotspot) => void;
  onHeadingChange: (yaw: number, pitch: number) => void;
  isGyroActive: boolean;
  onVRSupportChange?: (supported: boolean) => void;
  vrTrigger?: number;
}

export const Viewer360: React.FC<Viewer360Props> = ({
  currentNode,
  onNavigate,
  onSelectHotspot,
  onHeadingChange,
  isGyroActive,
  onVRSupportChange,
  vrTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentMeshRef = useRef<THREE.Mesh | null>(null);
  const fadeMeshRef = useRef<THREE.Mesh | null>(null);
  const chevronsGroupRef = useRef<THREE.Group | null>(null);
  const hotspotsGroupRef = useRef<THREE.Group | null>(null);

  // Textures cache
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());

  // Interaction & Orientation state
  const isDraggingRef = useRef(false);
  const previousPointerPos = useRef({ x: 0, y: 0 });
  const pointerVelocity = useRef({ x: 0, y: 0 });
  const yawPitchRef = useRef({ yaw: 0, pitch: 0 }); // In degrees
  const targetYawPitchRef = useRef({ yaw: 0, pitch: 0 });
  const isTransitioningRef = useRef(false);

  // Ground raycasting
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseCoordsRef = useRef(new THREE.Vector2());

  // Crossfade transition state
  const transitionProgressRef = useRef(1.0);
  const transitionStartCamPos = useRef(new THREE.Vector3(0, 0, 0));
  const transitionTargetCamPos = useRef(new THREE.Vector3(0, 0, 0));

  // Helper to load or fetch cached texture
  const loadTexture = useCallback((url: string): Promise<THREE.Texture> => {
    if (textureCacheRef.current.has(url)) {
      return Promise.resolve(textureCacheRef.current.get(url)!);
    }
    return new Promise((resolve) => {
      textureLoaderRef.current.load(
        url,
        (tex) => {
          tex.mapping = THREE.EquirectangularReflectionMapping;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          textureCacheRef.current.set(url, tex);
          resolve(tex);
        },
        undefined,
        () => {
          // Fallback procedural canvas texture if offline or failed
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 512;
          const ctx = canvas.getContext('2d')!;
          const grad = ctx.createLinearGradient(0, 0, 0, 512);
          grad.addColorStop(0, '#1e3a8a');
          grad.addColorStop(0.5, '#93c5fd');
          grad.addColorStop(1, '#e2e8f0');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1024, 512);
          const fallbackTex = new THREE.CanvasTexture(canvas);
          textureCacheRef.current.set(url, fallbackTex);
          resolve(fallbackTex);
        }
      );
    });
  }, []);

  // 1. INITIALIZE THREE.JS SCENE
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Check WebXR VR support
    if (navigator.xr && onVRSupportChange) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        onVRSupportChange(supported);
      }).catch(() => {
        onVRSupportChange(false);
      });
    }

    // Panorama Spheres (Current and Incoming Fade Sphere)
    const sphereGeo = new THREE.SphereGeometry(450, 60, 40);
    sphereGeo.scale(-1, 1, 1); // Invert faces inward for 360 viewer

    const currentMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const currentMesh = new THREE.Mesh(sphereGeo, currentMat);
    scene.add(currentMesh);
    currentMeshRef.current = currentMesh;

    const fadeMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const fadeMesh = new THREE.Mesh(sphereGeo, fadeMat);
    scene.add(fadeMesh);
    fadeMeshRef.current = fadeMesh;

    // Groups for Interactive 3D Objects
    const chevronsGroup = new THREE.Group();
    scene.add(chevronsGroup);
    chevronsGroupRef.current = chevronsGroup;

    const hotspotsGroup = new THREE.Group();
    scene.add(hotspotsGroup);
    hotspotsGroupRef.current = hotspotsGroup;

    // Ambient light
    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambLight);

    // Initial orientation
    yawPitchRef.current = { yaw: currentNode.initialYaw, pitch: currentNode.initialPitch };
    targetYawPitchRef.current = { yaw: currentNode.initialYaw, pitch: currentNode.initialPitch };

    // Load initial texture
    loadTexture(currentNode.panorama).then((tex) => {
      if (currentMeshRef.current) {
        (currentMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
        (currentMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    });

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Inertia damping on drag
      if (!isDraggingRef.current) {
        targetYawPitchRef.current.yaw += pointerVelocity.current.x;
        targetYawPitchRef.current.pitch += pointerVelocity.current.y;
        pointerVelocity.current.x *= 0.91;
        pointerVelocity.current.y *= 0.91;
      }

      // Smooth interpolation toward target yaw/pitch
      yawPitchRef.current.yaw += (targetYawPitchRef.current.yaw - yawPitchRef.current.yaw) * 0.18;
      yawPitchRef.current.pitch += (targetYawPitchRef.current.pitch - yawPitchRef.current.pitch) * 0.18;
      // Clamp pitch to avoid flipping upside down
      yawPitchRef.current.pitch = Math.max(-85, Math.min(85, yawPitchRef.current.pitch));
      targetYawPitchRef.current.pitch = Math.max(-85, Math.min(85, targetYawPitchRef.current.pitch));

      // Handle transition crossfade animation
      if (isTransitioningRef.current) {
        transitionProgressRef.current = Math.min(1.0, transitionProgressRef.current + delta * 1.8);
        const t = transitionProgressRef.current;

        // Smooth camera push forward during transition (Google Street View step effect)
        camera.position.lerpVectors(transitionStartCamPos.current, transitionTargetCamPos.current, Math.sin(t * Math.PI));

        if (fadeMeshRef.current) {
          (fadeMeshRef.current.material as THREE.MeshBasicMaterial).opacity = t;
        }

        if (t >= 1.0) {
          isTransitioningRef.current = false;
          camera.position.set(0, 0, 0);

          // Swap fadeMesh texture to currentMesh
          if (currentMeshRef.current && fadeMeshRef.current) {
            const incomingTex = (fadeMeshRef.current.material as THREE.MeshBasicMaterial).map;
            (currentMeshRef.current.material as THREE.MeshBasicMaterial).map = incomingTex;
            (currentMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 1.0;
            (currentMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
            (fadeMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.0;
          }
        }
      }

      // Update camera rotation from spherical angles
      const phi = THREE.MathUtils.degToRad(90 - yawPitchRef.current.pitch);
      const theta = THREE.MathUtils.degToRad(yawPitchRef.current.yaw);

      const targetX = Math.sin(phi) * Math.sin(theta);
      const targetY = Math.cos(phi);
      const targetZ = -Math.sin(phi) * Math.cos(theta);

      camera.lookAt(camera.position.x + targetX, camera.position.y + targetY, camera.position.z + targetZ);

      // Animate Chevrons pulsing
      if (chevronsGroupRef.current) {
        chevronsGroupRef.current.children.forEach((child, i) => {
          const pulse = 1.0 + Math.sin(time * 3.5 + i) * 0.08;
          child.scale.set(pulse, pulse, pulse);
        });
      }

      // Animate Hotspot Beacons breathing
      if (hotspotsGroupRef.current) {
        hotspotsGroupRef.current.children.forEach((child, i) => {
          const breath = 1.0 + Math.sin(time * 4.0 + i * 1.5) * 0.12;
          child.scale.set(breath, breath, breath);
        });
      }

      // Sync heading back to HUD minimap
      onHeadingChange(yawPitchRef.current.yaw, yawPitchRef.current.pitch);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
    };
  }, [loadTexture, onHeadingChange, onVRSupportChange]);

  // 2. REBUILD CHEVRONS AND HOTSPOTS ON NODE CHANGE
  useEffect(() => {
    if (!chevronsGroupRef.current || !hotspotsGroupRef.current) return;

    // Clear previous chevrons
    while (chevronsGroupRef.current.children.length > 0) {
      chevronsGroupRef.current.remove(chevronsGroupRef.current.children[0]);
    }

    // Clear previous hotspots
    while (hotspotsGroupRef.current.children.length > 0) {
      hotspotsGroupRef.current.remove(hotspotsGroupRef.current.children[0]);
    }

    // Build Ground Chevrons for each transition
    currentNode.transitions.forEach((trans) => {
      const chevronGroup = new THREE.Group();
      chevronGroup.userData = { targetNodeId: trans.targetNodeId, label: trans.label };

      // Azimuth angle to 3D ground coordinates
      const rad = THREE.MathUtils.degToRad(trans.yaw);
      const groundDist = 18;
      const gx = Math.sin(rad) * groundDist;
      const gz = -Math.cos(rad) * groundDist;
      const gy = -5.0; // Ground plane elevation

      chevronGroup.position.set(gx, gy, gz);

      // Outer Pulsing Circle Ring
      const ringGeo = new THREE.RingGeometry(1.2, 1.5, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      chevronGroup.add(ringMesh);

      // Inner Solid Disc
      const discGeo = new THREE.CircleGeometry(1.1, 32);
      discGeo.rotateX(-Math.PI / 2);
      const discMat = new THREE.MeshBasicMaterial({
        color: 0xd97706,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      chevronGroup.add(discMesh);

      // Directional Chevron Arrow Cone
      const arrowGeo = new THREE.ConeGeometry(0.75, 1.4, 3);
      arrowGeo.rotateX(Math.PI / 2);
      arrowGeo.rotateY(Math.PI);
      const arrowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
      arrowMesh.position.y = 0.05;
      // Rotate chevron toward target heading
      arrowMesh.rotation.y = -rad;
      chevronGroup.add(arrowMesh);

      chevronsGroupRef.current!.add(chevronGroup);
    });

    // Build Floating 3D Information Beacons
    currentNode.hotspots.forEach((spot) => {
      const beaconGroup = new THREE.Group();
      beaconGroup.userData = { hotspot: spot };

      // Convert spherical yaw/pitch to 3D vector at radius 38
      const phi = THREE.MathUtils.degToRad(90 - spot.pitch);
      const theta = THREE.MathUtils.degToRad(spot.yaw);
      const r = 38;

      const bx = r * Math.sin(phi) * Math.sin(theta);
      const by = r * Math.cos(phi);
      const bz = -r * Math.sin(phi) * Math.cos(theta);

      beaconGroup.position.set(bx, by, bz);

      // Glowing Inner Core
      const coreGeo = new THREE.SphereGeometry(0.85, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      beaconGroup.add(core);

      // Outer Halo Ring
      const haloGeo = new THREE.RingGeometry(1.2, 1.6, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.lookAt(0, 0, 0); // Face center camera
      beaconGroup.add(halo);

      hotspotsGroupRef.current!.add(beaconGroup);
    });
  }, [currentNode]);

  // 3. TRIGGER CROSSFADE TRANSITION ON NODE CHANGE
  useEffect(() => {
    if (!fadeMeshRef.current || !currentMeshRef.current || !cameraRef.current) return;

    // Load incoming panorama onto fadeMesh
    loadTexture(currentNode.panorama).then((tex) => {
      if (fadeMeshRef.current) {
        (fadeMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
        (fadeMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }

      // Setup forward camera push along initial yaw direction
      const rad = THREE.MathUtils.degToRad(currentNode.initialYaw);
      transitionStartCamPos.current.set(0, 0, 0);
      transitionTargetCamPos.current.set(Math.sin(rad) * 3.5, 0, -Math.cos(rad) * 3.5);

      transitionProgressRef.current = 0.0;
      isTransitioningRef.current = true;

      targetYawPitchRef.current.yaw = currentNode.initialYaw;
      targetYawPitchRef.current.pitch = currentNode.initialPitch;
    });
  }, [currentNode, loadTexture]);

  // 4. MOUSE AND TOUCH DRAG HANDLERS
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousPointerPos.current = { x: e.clientX, y: e.clientY };
    pointerVelocity.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - previousPointerPos.current.x;
    const dy = e.clientY - previousPointerPos.current.y;

    previousPointerPos.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.18;
    targetYawPitchRef.current.yaw -= dx * sensitivity;
    targetYawPitchRef.current.pitch += dy * sensitivity;

    pointerVelocity.current = { x: -dx * sensitivity * 0.35, y: dy * sensitivity * 0.35 };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Click Raycaster for Ground Chevrons and Info Beacons
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseCoordsRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseCoordsRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);

    // 1. Test Ground Chevrons
    if (chevronsGroupRef.current) {
      const chevronHits = raycasterRef.current.intersectObjects(chevronsGroupRef.current.children, true);
      if (chevronHits.length > 0) {
        let root = chevronHits[0].object;
        while (root.parent && root.parent !== chevronsGroupRef.current) {
          root = root.parent;
        }
        if (root.userData && root.userData.targetNodeId) {
          onNavigate(root.userData.targetNodeId);
          return;
        }
      }
    }

    // 2. Test Info Beacons
    if (hotspotsGroupRef.current) {
      const beaconHits = raycasterRef.current.intersectObjects(hotspotsGroupRef.current.children, true);
      if (beaconHits.length > 0) {
        let root = beaconHits[0].object;
        while (root.parent && root.parent !== hotspotsGroupRef.current) {
          root = root.parent;
        }
        if (root.userData && root.userData.hotspot) {
          onSelectHotspot(root.userData.hotspot);
          return;
        }
      }
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = Math.max(35, Math.min(90, cameraRef.current.fov + e.deltaY * 0.05));
    cameraRef.current.updateProjectionMatrix();
  };

  // Keyboard navigation (WASD / Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        // Step forward: find transition closest to current yaw heading
        const currentYaw = ((yawPitchRef.current.yaw % 360) + 360) % 360;
        let bestTrans = currentNode.transitions[0];
        let bestDiff = 999;

        currentNode.transitions.forEach((t) => {
          const targetYaw = ((t.yaw % 360) + 360) % 360;
          let diff = Math.abs(currentYaw - targetYaw);
          if (diff > 180) diff = 360 - diff;
          if (diff < bestDiff) {
            bestDiff = diff;
            bestTrans = t;
          }
        });

        if (bestTrans && bestDiff < 90) {
          onNavigate(bestTrans.targetNodeId);
        }
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        // Step backward: find transition closest to opposite of current yaw
        const currentYawOpp = (((yawPitchRef.current.yaw + 180) % 360) + 360) % 360;
        let bestTrans = currentNode.transitions[0];
        let bestDiff = 999;

        currentNode.transitions.forEach((t) => {
          const targetYaw = ((t.yaw % 360) + 360) % 360;
          let diff = Math.abs(currentYawOpp - targetYaw);
          if (diff > 180) diff = 360 - diff;
          if (diff < bestDiff) {
            bestDiff = diff;
            bestTrans = t;
          }
        });

        if (bestTrans && bestDiff < 90) {
          onNavigate(bestTrans.targetNodeId);
        }
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        targetYawPitchRef.current.yaw -= 12;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        targetYawPitchRef.current.yaw += 12;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNode, onNavigate]);

  // Mobile Gyroscope DeviceOrientation listener
  useEffect(() => {
    if (!isGyroActive) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null) {
        // Map beta (pitch) and alpha (yaw)
        targetYawPitchRef.current.pitch = Math.max(-80, Math.min(80, e.beta - 60));
        targetYawPitchRef.current.yaw = -e.alpha;
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isGyroActive]);

  // Handle VR Trigger from HUD
  useEffect(() => {
    if (!vrTrigger || !rendererRef.current) return;
    if (navigator.xr) {
      navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor']
      }).then((session) => {
        rendererRef.current?.xr.setSession(session);
      }).catch((err) => {
        console.warn("Could not start VR session", err);
        alert("WebXR VR session could not be started on this display device.");
      });
    }
  }, [vrTrigger]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  );
};
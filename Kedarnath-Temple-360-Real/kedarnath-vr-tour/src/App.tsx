import { useState, useRef, useEffect, useCallback } from 'react';
import { TOUR_NODES } from './data/tourNodes';
import type { TourNode, InfoHotspot } from './data/tourNodes';
import { Viewer360 } from './components/Viewer360';
import { HUD } from './components/HUD';
import { Hotspot } from './components/Hotspot';

export function App() {
  const [currentNodeId, setCurrentNodeId] = useState<string>('approach-walkway');
  const [selectedHotspot, setSelectedHotspot] = useState<InfoHotspot | null>(null);
  const [currentYaw, setCurrentYaw] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isGyroActive, setIsGyroActive] = useState<boolean>(false);
  const [vrTrigger, setVrTrigger] = useState<number>(0);
  const [hasVRSupport, setHasVRSupport] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentNode: TourNode = TOUR_NODES[currentNodeId] || TOUR_NODES['approach-walkway'];

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio('/assets/kedarnath_aarti_real.mp3');
    audio.loop = true;
    audio.volume = 0.65;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Toggle Audio Ambience
  const handleToggleAudio = useCallback(() => {
    if (!audioRef.current) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch((e) => {
        console.warn("Audio playback blocked", e);
      });
    }
  }, [isAudioPlaying]);

  // Sacred Temple Bell Chime (Web Audio API)
  const handleRingBell = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const baseFreq = 880; // High bronze bell
      const modes = [
        { r: 0.5, d: 2.8, g: 0.3 },
        { r: 1.0, d: 2.2, g: 1.0 },
        { r: 1.2, d: 1.8, g: 0.5 },
        { r: 1.5, d: 1.4, g: 0.4 },
        { r: 2.0, d: 1.0, g: 0.3 }
      ];

      modes.forEach((m) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * m.r, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(m.g * 0.15, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + m.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + m.d);
      });
    } catch (err) {
      console.warn("Could not play bell sound", err);
    }
  }, []);

  // Navigate between nodes
  const handleNavigate = useCallback((nodeId: string) => {
    if (TOUR_NODES[nodeId]) {
      setCurrentNodeId(nodeId);
      setSelectedHotspot(null);
      // Soft chime on step
      handleRingBell();
    }
  }, [handleRingBell]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 360 Panoramic WebGL Canvas */}
      <Viewer360
        currentNode={currentNode}
        onNavigate={handleNavigate}
        onSelectHotspot={(hotspot) => setSelectedHotspot(hotspot)}
        onHeadingChange={(yaw, pitch) => {
          setCurrentYaw(yaw);
          setCurrentPitch(pitch);
        }}
        isGyroActive={isGyroActive}
        onVRSupportChange={(supported) => setHasVRSupport(supported)}
        vrTrigger={vrTrigger}
      />

      {/* Floating Glassmorphic HUD & Radar */}
      <HUD
        currentNode={currentNode}
        currentYaw={currentYaw}
        currentPitch={currentPitch}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
        onNavigate={handleNavigate}
        isGyroActive={isGyroActive}
        onToggleGyro={() => setIsGyroActive(!isGyroActive)}
        onEnterVR={() => setVrTrigger(Date.now())}
        hasVRSupport={hasVRSupport}
      />

      {/* Landmark Information Dialog */}
      <Hotspot
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        onChime={handleRingBell}
      />
    </main>
  );
}

export default App;
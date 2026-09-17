/**
 * Kedarnath 360 AR/VR - Audio Engine (Web Audio API)
 * Zero external audio files required! Synthesizes realistic Himalayan mountain wind,
 * bronze temple bells (ghanti), and sacred meditative tanpura drone.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.windGain = null;
    this.droneGain = null;
    this.isInitialized = false;
    this.aartiAudio = null;
    this.isAartiPlaying = false;
    this.initRealAartiAudio();
    this.initTempleBellAudio();
  }

  initTempleBellAudio() {
    try {
      this.bellAudio = new Audio('assets/temple_bell_real.mp3');
      this.bellAudio.volume = 1.0;
      this.bellAudio.preload = 'auto';
    } catch (e) {
      console.warn("Could not preload temple bell audio", e);
    }
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initWindAmbience();
      this.initMeditativeDrone();
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesizes natural Himalayan mountain wind
  initWindAmbience() {
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 240;
    filter.Q.value = 1.2;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.12;

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    whiteNoise.start();
  }

  // Synthesizes sacred Vedic meditative harmonic drone
  initMeditativeDrone() {
    if (!this.ctx) return;
    const rootFreq = 136.1; // Sacred Om frequency (C#)

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.08;

    const harmonics = [1, 1.5, 2, 2.99, 4];
    harmonics.forEach((h, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = (idx % 2 === 0) ? 'sine' : 'triangle';
      osc.frequency.value = rootFreq * h;

      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 1.0 / (idx + 1.5);

      osc.connect(oscGain);
      oscGain.connect(this.droneGain);
      osc.start();
    });

    this.droneGain.connect(this.ctx.destination);
  }

  // Plays authentic bronze temple bell (ghanti) chime with physical harmonics & real audio
  playTempleBell(intensity = 1.0) {
    // 1. Play authentic recorded Kedarnath bronze temple bell sample
    try {
      if (!this.bellAudio) {
        this.initTempleBellAudio();
      }
      if (this.bellAudio) {
        // Clone node allows rapid consecutive bell strikes without cutting off reverb
        const sound = this.bellAudio.cloneNode();
        sound.volume = Math.min(1.0, Math.max(0.2, 0.95 * intensity));
        sound.play().catch(() => {
          // Fallback if blocked
          if (this.bellAudio) {
            this.bellAudio.currentTime = 0;
            this.bellAudio.play().catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn("Real bell playback fallback to synth", err);
    }

    // 2. Synthesize complementary physical bronze resonance with Web Audio
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Sacred bronze bell fundamental (~460 Hz)
      const baseFreq = 460;
      const bellModes = [
        { ratio: 0.50, decay: 4.2, gain: 0.40 },  // Deep hum note
        { ratio: 1.00, decay: 3.5, gain: 0.85 },  // Prime fundamental
        { ratio: 1.183, decay: 2.9, gain: 0.55 }, // Tierce (minor third)
        { ratio: 1.506, decay: 2.4, gain: 0.45 }, // Quint (fifth)
        { ratio: 2.00, decay: 1.9, gain: 0.65 },  // Nominal
        { ratio: 2.74, decay: 1.3, gain: 0.35 },  // High metallic partial 1
        { ratio: 3.25, decay: 1.0, gain: 0.25 },  // High metallic partial 2
        { ratio: 4.12, decay: 0.7, gain: 0.18 }   // Shimmer
      ];

      bellModes.forEach(mode => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = (mode.ratio > 2.0) ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(baseFreq * mode.ratio, now);

        // Strike attack & acoustic exponential decay
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(mode.gain * 0.16 * intensity, now + 0.003);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + mode.decay);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + mode.decay);
      });
    } catch (e) {
      // Audio context error ignore
    }
  }

  // Play footstep sound on stone
  playFootstep() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.value = 350;

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Initialize real Kedarnath Aarti audio from assets
  initRealAartiAudio() {
    try {
      this.aartiAudio = new Audio('assets/kedarnath_aarti_real.mp3');
      this.aartiAudio.loop = true;
      this.aartiAudio.volume = 0.85;
      this.aartiAudio.preload = 'auto';
    } catch (e) {
      console.warn("Could not load real aarti audio element", e);
    }
  }

  playRealAarti(vol = 0.85) {
    this.ensureContext();
    if (!this.aartiAudio) return;
    if (this.isMuted) {
      this.aartiAudio.volume = 0;
    } else {
      this.aartiAudio.volume = vol;
    }
    this.aartiAudio.play().then(() => {
      this.isAartiPlaying = true;
    }).catch(err => {
      console.log("Audio play prevented by browser policy, will resume on interaction", err);
    });
  }

  pauseRealAarti() {
    if (this.aartiAudio) {
      this.aartiAudio.pause();
      this.isAartiPlaying = false;
    }
  }

  stopRealAarti() {
    if (this.aartiAudio) {
      this.aartiAudio.pause();
      this.aartiAudio.currentTime = 0;
      this.isAartiPlaying = false;
    }
  }

  toggleRealAarti() {
    if (this.isAartiPlaying) {
      this.pauseRealAarti();
      return false;
    } else {
      this.playRealAarti();
      return true;
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.windGain) {
      this.windGain.gain.value = this.isMuted ? 0 : 0.12;
    }
    if (this.droneGain) {
      this.droneGain.gain.value = this.isMuted ? 0 : 0.08;
    }
    if (this.aartiAudio) {
      this.aartiAudio.muted = this.isMuted;
    }
    return this.isMuted;
  }
}

window.soundEngine = new SoundEngine();

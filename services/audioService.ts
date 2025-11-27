
// Simple synthesizer using Web Audio API to avoid external assets

let audioCtx: AudioContext | null = null;
let musicOscillators: AudioNode[] = [];
let musicInterval: number | null = null;

const getCtx = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  return audioCtx;
};

export type SoundType = 'spawn' | 'click' | 'miss' | 'levelComplete' | 'gameOver' | 'gameWon';

export const startMusic = (level: number = 1) => {
  stopMusic(); // Ensure we don't layer tracks
  const ctx = getCtx();
  if (!ctx) return;

  // Resume if suspended
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // --- 1. The Drone (Atmosphere) ---
  // A low sawtooth wave filtered down creates a "dark sci-fi" hum
  const droneOsc = ctx.createOscillator();
  const droneGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  droneOsc.type = 'sawtooth';
  droneOsc.frequency.value = 45; // Deep bass F#
  
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  filter.Q.value = 5;
  
  // LFO to modulate the filter (makes the sound "breathe" or pulse slowly)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.2; // Slow modulation
  lfoGain.gain.value = 100; // Filter cutoff swings by +/- 100Hz
  
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  
  droneOsc.connect(filter);
  filter.connect(droneGain);
  droneGain.connect(ctx.destination);
  
  // Fade in drone
  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.08, now + 1); // Keep volume subtle
  
  droneOsc.start(now);
  lfo.start(now);
  
  musicOscillators.push(droneOsc, droneGain, filter, lfo, lfoGain);

  // --- 2. The Rhythm (Tension) ---
  // A "kick drum" pulse that gets faster with levels
  const baseBPM = 110;
  const bpm = baseBPM + ((level - 1) * 20); // Level 1: 110, Level 2: 130, Level 3: 150
  const intervalMs = (60 / bpm) * 1000;
  
  // We use setInterval for the rhythm to keep it simple, 
  // though accurate scheduling usually uses lookahead.
  // For this retro feel, a slight drift is acceptable/imperceptible.
  
  const playBeat = () => {
    if (ctx.state === 'suspended') return;
    const t = ctx.currentTime;
    
    // Kick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.1);
    
    // Hi-hat (ticking clock sound) every beat
    const hatOsc = ctx.createOscillator();
    const hatGain = ctx.createGain();
    const bandpass = ctx.createBiquadFilter();
    
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    
    hatOsc.type = 'square';
    hatOsc.connect(bandpass);
    bandpass.connect(hatGain);
    hatGain.connect(ctx.destination);
    
    hatGain.gain.setValueAtTime(0.02, t);
    hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    hatOsc.start(t);
    hatOsc.stop(t + 0.05);
  };
  
  playBeat(); // Play first beat immediately
  musicInterval = window.setInterval(playBeat, intervalMs);
};

export const stopMusic = () => {
  const ctx = getCtx();
  
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  
  // Ramp down volume to avoid clicking pop when stopping
  if (ctx) {
     const now = ctx.currentTime;
     musicOscillators.forEach(node => {
        if (node instanceof GainNode) {
             // Quick fade out
             node.gain.cancelScheduledValues(now);
             node.gain.setValueAtTime(node.gain.value, now);
             node.gain.linearRampToValueAtTime(0, now + 0.1);
        }
     });
  }

  // Actually stop nodes after fade out
  setTimeout(() => {
      musicOscillators.forEach(node => {
        try {
          if (node instanceof OscillatorNode) node.stop();
          node.disconnect();
        } catch (e) {}
      });
      musicOscillators = [];
  }, 150);
};

export const playSound = (type: SoundType) => {
  const ctx = getCtx();
  if (!ctx) return;
  
  // Resume context if suspended (browser policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  switch (type) {
    case 'spawn':
      // High-tech blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
      
    case 'click':
      // Satisfying switch-off click
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      break;

    case 'miss':
      // Error buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'levelComplete':
      // Ascending success chime
      playTone(ctx, 440, 0, 0.1, 'sine'); // A4
      playTone(ctx, 554, 0.1, 0.1, 'sine'); // C#5
      playTone(ctx, 659, 0.2, 0.2, 'sine'); // E5
      break;

    case 'gameWon':
      // Major chord fanfare
      playTone(ctx, 523.25, 0, 0.2, 'triangle'); // C5
      playTone(ctx, 659.25, 0.1, 0.2, 'triangle'); // E5
      playTone(ctx, 783.99, 0.2, 0.4, 'triangle'); // G5
      playTone(ctx, 1046.50, 0.4, 0.6, 'triangle'); // C6
      break;

    case 'gameOver':
      // Descending failure
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
  }
};

const playTone = (ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime + startTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  osc.start(now);
  osc.stop(now + duration);
};

/**
 * Synthesizes a realistic two-stage mechanical camera shutter sound
 * (blade close snap + release click) using the Web Audio API.
 * Zero external audio assets; handles browser autoplay policies silently.
 */

let audioCtx = null;
let noiseBuffer = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextCtor();
  }
  return audioCtx;
}

function getNoiseBuffer(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

function scheduleCurtainClick(ctx, destination, startTime, {
  noiseFreq,
  noiseQ,
  noiseGain,
  noiseDuration,
  bodyStartFreq,
  bodyEndFreq,
  bodyGain,
  bodyDuration
}) {
  // Metallic blade burst (bandpass-filtered noise)
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = getNoiseBuffer(ctx);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(noiseFreq, startTime);
  bandpass.Q.setValueAtTime(noiseQ, startTime);

  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.0001, startTime);
  nGain.gain.exponentialRampToValueAtTime(noiseGain, startTime + 0.003);
  nGain.gain.exponentialRampToValueAtTime(0.0001, startTime + noiseDuration);

  noiseSrc.connect(bandpass);
  bandpass.connect(nGain);
  nGain.connect(destination);

  noiseSrc.start(startTime);
  noiseSrc.stop(startTime + noiseDuration + 0.005);

  // Mechanical housing thump (fast pitch-drop oscillator)
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(bodyStartFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(bodyEndFreq, startTime + bodyDuration);

  const oGain = ctx.createGain();
  oGain.gain.setValueAtTime(0.0001, startTime);
  oGain.gain.exponentialRampToValueAtTime(bodyGain, startTime + 0.002);
  oGain.gain.exponentialRampToValueAtTime(0.0001, startTime + bodyDuration);

  osc.connect(oGain);
  oGain.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + bodyDuration + 0.005);
}

/**
 * Unlocks Web Audio on the first user gesture so subsequent hover events play immediately.
 */
export function unlockShutterAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // Ignore audio context errors in restricted environments
  }
}

/**
 * Plays a two-stage mechanical shutter click synced to the 760ms iris animation:
 * - Stage 1 (~40ms): Iris closing snap
 * - Stage 2 (~340ms): Iris release / reopen click
 */
export function playShutterSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const trigger = () => {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.24, now);
      master.connect(ctx.destination);

      // Stage 1: Closing snap (blades converging)
      scheduleCurtainClick(ctx, master, now + 0.04, {
        noiseFreq: 2600,
        noiseQ: 1.5,
        noiseGain: 0.9,
        noiseDuration: 0.032,
        bodyStartFreq: 190,
        bodyEndFreq: 58,
        bodyGain: 0.45,
        bodyDuration: 0.036
      });

      // Stage 2: Reopening release click (blades retracting)
      scheduleCurtainClick(ctx, master, now + 0.36, {
        noiseFreq: 3600,
        noiseQ: 2.1,
        noiseGain: 0.65,
        noiseDuration: 0.024,
        bodyStartFreq: 250,
        bodyEndFreq: 85,
        bodyGain: 0.28,
        bodyDuration: 0.028
      });
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(trigger).catch(() => {});
    } else {
      trigger();
    }
  } catch {
    // Ignore autoplay/audio restrictions silently
  }
}

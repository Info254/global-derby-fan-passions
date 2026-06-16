// Lightweight WebAudio cues — no assets, no deps.
// cheer = ascending major arpeggio + crowd-ish noise burst
// groan = descending minor + low rumble
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain = 0.15, type: OscillatorType = "triangle") {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(start: number, dur: number, gain = 0.08) {
  const a = ac(); if (!a) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.value = gain;
  const filt = a.createBiquadFilter();
  filt.type = "bandpass"; filt.frequency.value = 1200;
  src.connect(filt).connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

export function playCheer() {
  // C-E-G-C crowd cheer
  tone(523, 0, 0.25, 0.12, "triangle");
  tone(659, 0.08, 0.25, 0.12, "triangle");
  tone(784, 0.16, 0.3, 0.14, "triangle");
  tone(1046, 0.24, 0.5, 0.16, "sawtooth");
  noiseBurst(0, 0.7, 0.06);
}

export function playGroan() {
  // descending Eb-C-A-F minor groan
  tone(622, 0, 0.3, 0.12, "sine");
  tone(523, 0.18, 0.3, 0.12, "sine");
  tone(440, 0.36, 0.35, 0.12, "sine");
  tone(349, 0.54, 0.55, 0.14, "sawtooth");
  noiseBurst(0.2, 0.5, 0.04);
}

export function playWhistle() {
  tone(1800, 0, 0.15, 0.08, "square");
  tone(1800, 0.18, 0.4, 0.1, "square");
}

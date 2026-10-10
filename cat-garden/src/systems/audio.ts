/* All sound is synthesised with the Web Audio API; there are no audio files. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.7;
let windStarted = false;

export function initAudio() {
  if (ctx) { if (ctx.state === "suspended") void ctx.resume(); return; }
  try {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    startWind();
  } catch { ctx = null; }
}

export function setVolume(v: number) {
  volume = v;
  if (master) master.gain.value = v;
}

function noiseBuffer(seconds: number) {
  const b = ctx!.createBuffer(1, ctx!.sampleRate * seconds, ctx!.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function startWind() {
  if (!ctx || !master || windStarted) return;
  windStarted = true;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(4);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 380;
  const g = ctx.createGain();
  g.gain.value = 0.035;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain).connect(g.gain);
  src.connect(f).connect(g).connect(master);
  src.start();
  lfo.start();
}

function bell(freq: number, when: number, dur = 1.6, gain = 0.18) {
  if (!ctx || !master) return;
  for (const [mult, amp] of [[1, 1], [2.01, 0.35], [3.98, 0.12]]) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain * amp, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(master);
    o.start(when);
    o.stop(when + dur + 0.05);
  }
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];

export function playCollect(count: number) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const root = PENTA[Math.min(count - 1, PENTA.length - 1)];
  bell(root, t, 1.4);
  bell(root * 1.5, t + 0.09, 1.4, 0.12);
  bell(root * 2, t + 0.18, 1.8, 0.1);
}

export function playJump() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(620, t + 0.09);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.16);
}

export function playLand(strength: number) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(0.2);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12 * strength, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  s.connect(f).connect(g).connect(master);
  s.start(t);
}

export function playFirework(delay = 0) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(1.2);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(1800, t);
  f.frequency.exponentialRampToValueAtTime(120, t + 1.1);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.32, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
  s.connect(f).connect(g).connect(master);
  s.start(t);
  bell(PENTA[Math.floor(Math.random() * PENTA.length)] * 2, t + 0.05, 1.2, 0.05);
}

export function playFanfare() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [0, 2, 4, 6, 5].forEach((n, i) => bell(PENTA[n], t + i * 0.16, 2.2, 0.14));
}

// =====================================================================
// audio.js – Klang über Web Audio, gleichstufige Stimmung (a¹ = 440 Hz)
// Klavier: lokale Samples (alle kleinen Terzen), Zwischentöne per exakter
// Abspielrate 2^(n/12). Fallback: E-Piano-Synthese. Dazu Synth-Percussion
// und ein Metallophon-Klang für Gamelan-Annäherungen.
// =====================================================================

let ctx = null;
let master = null;
const buffers = new Map(); // Sample-Name -> Promise<AudioBuffer|null>
const SAMPLE_NAMES = ['C', 'Eb', 'Gb', 'A'];
const SAMPLE_MIN = 36; // C2
const SAMPLE_MAX = 84; // C6

export function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -14;
    master.ratio.value = 3;
    const out = ctx.createGain();
    out.gain.value = 0.9;
    master.connect(out).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// iOS: Web Audio ist sonst bei Stummschalter stumm. Ein stilles <audio>
// beim ersten Tippen schaltet die Sitzung auf „Wiedergabe“.
let unlocked = false;
export function unlock() {
  if (unlocked) return;
  unlocked = true;
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (e) { /* ignorieren */ }
  try {
    const a = new Audio('data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwAZYAAAAAAAAAABQ4JAMGQgAAOAAAAnGMHkkIAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
    a.setAttribute('playsinline', '');
    a.volume = 0.01;
    a.play().catch(() => {});
  } catch (e) { /* ignorieren */ }
  getCtx();
}
['pointerdown', 'keydown', 'touchend'].forEach((ev) =>
  window.addEventListener(ev, unlock, { once: true, capture: true }));

function sampleFor(m) {
  const clamped = Math.max(SAMPLE_MIN, Math.min(SAMPLE_MAX, m));
  const base = Math.round((clamped - SAMPLE_MIN) / 3) * 3 + SAMPLE_MIN; // nächste kleine Terz
  const octave = Math.floor(base / 12) - 1;
  const name = SAMPLE_NAMES[(base % 12) / 3] + octave;
  return { name, base };
}

function loadSample(name) {
  if (!buffers.has(name)) {
    const p = fetch(`audio/piano/${name}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('fehlt'))))
      .then((ab) => new Promise((res, rej) => getCtx().decodeAudioData(ab, res, rej)))
      .catch(() => null);
    buffers.set(name, p);
  }
  return buffers.get(name);
}

/** Lädt die Samples für die angegebenen MIDI-Töne vorab */
export function preload(midis) {
  const names = new Set(midis.map((m) => sampleFor(m).name));
  return Promise.all([...names].map(loadSample));
}

/** Klavierton spielen. when = Zeit in ctx-Sekunden (optional) */
export async function playNote(m, { when = 0, dur = 1.2, vel = 0.8 } = {}) {
  const c = getCtx();
  const { name, base } = sampleFor(m);
  const buf = await loadSample(name);
  const t = Math.max(when || 0, c.currentTime + 0.005);
  if (!buf) return synthPiano(m, t, dur, vel);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = Math.pow(2, (m - base) / 12);
  const g = c.createGain();
  g.gain.setValueAtTime(vel, t);
  g.gain.setTargetAtTime(0, t + dur, 0.12);
  src.connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 1);
}

// Weiches E-Piano (FM), falls Samples (noch) nicht da sind
function synthPiano(m, t, dur, vel) {
  const c = getCtx();
  const f = midiToFreq(m);
  const car = c.createOscillator();
  const modOsc = c.createOscillator();
  const modGain = c.createGain();
  const g = c.createGain();
  car.frequency.value = f;
  modOsc.frequency.value = f * 2;
  modGain.gain.setValueAtTime(f * 1.4, t);
  modGain.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
  modOsc.connect(modGain).connect(car.frequency);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel * 0.35, t + 0.008);
  g.gain.exponentialRampToValueAtTime(vel * 0.12, t + 0.5);
  g.gain.setTargetAtTime(0.0001, t + dur, 0.15);
  car.connect(g).connect(master);
  car.start(t); modOsc.start(t);
  car.stop(t + dur + 1); modOsc.stop(t + dur + 1);
}

let seqId = 0;
let activeTimers = [];
export function stopAll() {
  seqId++;
  if (grooveTimer) { clearInterval(grooveTimer); grooveTimer = null; }
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
}

/**
 * Spielt eine Folge: events = [{midi|midis, beat, beats}]; tempo in BPM.
 * onNote(index) wird synchron zum Klang aufgerufen (für Hervorhebung).
 */
export async function playSequence(events, { tempo = 96, onNote, onEnd } = {}) {
  stopAll();
  const my = seqId;
  const c = getCtx();
  const all = events.flatMap((e) => e.midis || [e.midi]);
  await preload(all);
  if (my !== seqId) return;
  const spb = 60 / tempo;
  const t0 = c.currentTime + 0.08;
  let end = 0;
  events.forEach((e, i) => {
    const t = t0 + e.beat * spb;
    const d = (e.beats || 1) * spb * 0.95;
    (e.midis || [e.midi]).forEach((m) => playNote(m, { when: t, dur: Math.max(d, 0.25), vel: e.vel || 0.75 }));
    if (onNote) activeTimers.push(setTimeout(() => my === seqId && onNote(i), (t - c.currentTime) * 1000));
    end = Math.max(end, t + d);
  });
  if (onEnd) activeTimers.push(setTimeout(() => my === seqId && onEnd(), (end - c.currentTime) * 1000 + 150));
}

/** Tonleiter/Melodie aus MIDI-Liste gleichmäßig spielen */
export function playMelody(midis, opts = {}) {
  return playSequence(midis.map((m, i) => ({ midi: m, beat: i, beats: 1 })), opts);
}
export function playChord(midis, opts = {}) {
  return playSequence([{ midis, beat: 0, beats: 3 }], opts);
}

// ---------- Metallophon (für Gamelan-Annäherung) ----------
export function playBell(freq, when = 0, dur = 1.8, vel = 0.5) {
  const c = getCtx();
  const t = Math.max(when, c.currentTime + 0.005);
  // leicht unharmonische Teiltöne wie bei Metallplatten
  [[1, 1], [2.76, 0.35], [5.4, 0.12], [8.93, 0.05]].forEach(([ratio, amp]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq * ratio;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel * amp * 0.5, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur / ratio ** 0.5);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.1);
  });
}

/** Folge von Frequenzen (Hz) als Metallophon spielen */
export function playBellSequence(freqs, { tempo = 110, onNote } = {}) {
  stopAll();
  const my = seqId;
  const c = getCtx();
  const spb = 60 / tempo;
  const t0 = c.currentTime + 0.06;
  freqs.forEach((f, i) => {
    const t = t0 + i * spb;
    playBell(f, t);
    if (onNote) activeTimers.push(setTimeout(() => my === seqId && onNote(i), (t - c.currentTime) * 1000));
  });
}

// ---------- Bordun (Drone) für Raga-Idee ----------
export function playDrone(freq, seconds = 6) {
  const c = getCtx();
  const t = c.currentTime + 0.05;
  [[freq, 0.16], [freq * 1.5, 0.1], [freq * 2, 0.08]].forEach(([f, a]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    const filt = c.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = f;
    filt.type = 'lowpass';
    filt.frequency.value = 900;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + 0.8);
    g.gain.setValueAtTime(a, t + seconds - 1);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    o.connect(filt).connect(g).connect(master);
    o.start(t);
    o.stop(t + seconds + 0.1);
  });
}

// ---------- Percussion (synthetisch) ----------
let noiseBuf = null;
function noise() {
  const c = getCtx();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}
function env(g, t, a, peak, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
}
function tone(t, { type = "sine", f0, f1, dur, peak, filter }) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  env(g, t, 0.002, peak, dur);
  let node = o;
  if (filter) { const fl = c.createBiquadFilter(); fl.type = filter.type; fl.frequency.value = filter.f; fl.Q.value = filter.q || 1; node.connect(fl); node = fl; }
  node.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function hiss(t, { dur, peak, type = 'highpass', f = 7000, q = 0.7 }) {
  const c = getCtx();
  const s = noise();
  const fl = c.createBiquadFilter();
  fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = c.createGain();
  env(g, t, 0.001, peak, dur);
  s.connect(fl).connect(g).connect(master);
  s.start(t);
  s.stop(t + dur + 0.05);
}

/**
 * Einzelner Schlag. sound: click | clickAcc | kick | snare | rim | hat | surdo | surdoMute | tamborim | caixa | clave | shaker | agogoHi | agogoLo
 */
export function drum(sound, when = 0, vel = 1) {
  const c = getCtx();
  const t = Math.max(when, c.currentTime + 0.003);
  const v = vel;
  switch (sound) {
    case 'click': tone(t, { type: 'square', f0: 1500, dur: 0.03, peak: 0.12 * v, filter: { type: 'bandpass', f: 1500, q: 3 } }); break;
    case 'clickAcc': tone(t, { type: 'square', f0: 2400, dur: 0.04, peak: 0.18 * v, filter: { type: 'bandpass', f: 2400, q: 3 } }); break;
    case 'kick': tone(t, { f0: 140, f1: 45, dur: 0.35, peak: 0.9 * v }); break;
    case 'surdo': tone(t, { f0: 85, f1: 62, dur: 0.7, peak: 0.85 * v }); hiss(t, { dur: 0.05, peak: 0.08 * v, type: 'lowpass', f: 800 }); break;
    case 'surdoMute': tone(t, { f0: 85, f1: 70, dur: 0.15, peak: 0.6 * v }); break;
    case 'snare': tone(t, { type: 'triangle', f0: 220, f1: 160, dur: 0.12, peak: 0.35 * v }); hiss(t, { dur: 0.18, peak: 0.35 * v, type: 'highpass', f: 1800 }); break;
    case 'rim': tone(t, { type: 'square', f0: 900, dur: 0.04, peak: 0.18 * v, filter: { type: 'bandpass', f: 1700, q: 6 } }); break;
    case 'caixa': hiss(t, { dur: 0.08, peak: 0.28 * v, type: 'bandpass', f: 3500, q: 0.8 }); tone(t, { type: 'triangle', f0: 330, dur: 0.05, peak: 0.12 * v }); break;
    case 'hat': hiss(t, { dur: 0.045, peak: 0.16 * v, type: 'highpass', f: 8000 }); break;
    case 'shaker': hiss(t, { dur: 0.06, peak: 0.12 * v, type: 'bandpass', f: 6000, q: 1.2 }); break;
    case 'tamborim': tone(t, { type: 'triangle', f0: 1050, f1: 900, dur: 0.07, peak: 0.3 * v }); hiss(t, { dur: 0.03, peak: 0.1 * v, f: 5000 }); break;
    case 'clave': tone(t, { f0: 2500, dur: 0.07, peak: 0.45 * v, filter: { type: 'bandpass', f: 2500, q: 12 } }); tone(t, { type: 'triangle', f0: 2500, dur: 0.05, peak: 0.25 * v }); break;
    case 'agogoHi': tone(t, { type: 'triangle', f0: 1320, dur: 0.18, peak: 0.25 * v }); break;
    case 'agogoLo': tone(t, { type: 'triangle', f0: 990, dur: 0.18, peak: 0.25 * v }); break;
    case 'tap': tone(t, { type: 'triangle', f0: 700, f1: 500, dur: 0.06, peak: 0.25 * v }); break;
    default: break;
  }
}

/** Aktuelle Audiozeit */
export function now() {
  return getCtx().currentTime;
}

/** Plant einen Rückruf zu einer Audiozeit (stoppbar mit stopAll) */
export function at(time, fn) {
  const my = seqId;
  const c = getCtx();
  activeTimers.push(setTimeout(() => my === seqId && fn(), Math.max(0, (time - c.currentTime) * 1000)));
}

/**
 * Spielt Schläge zu festen Zeiten: events = [{t (Sekunden ab Start), sound, vel, midis}]
 * Gibt die Startzeit (Audiozeit) zurück.
 */
export async function playHits(events, { lead = 0.12, onEvent, onEnd } = {}) {
  stopAll();
  const my = seqId;
  const c = getCtx();
  const pianoMidis = events.flatMap((e) => e.midis || []);
  if (pianoMidis.length) await preload(pianoMidis);
  if (my !== seqId) return null;
  const t0 = c.currentTime + lead;
  let end = 0;
  events.forEach((e, i) => {
    const t = t0 + e.t;
    if (e.midis) e.midis.forEach((m) => playNote(m, { when: t, dur: e.dur || 0.18, vel: e.vel || 0.6 }));
    else drum(e.sound, t, e.vel ?? 1);
    if (onEvent) activeTimers.push(setTimeout(() => my === seqId && onEvent(i, e), (t - c.currentTime) * 1000));
    end = Math.max(end, t + (e.dur || 0.1));
  });
  if (onEnd) activeTimers.push(setTimeout(() => my === seqId && onEnd(), (end - c.currentTime) * 1000 + 200));
  return t0;
}

// ---------- Endlos-Groove (Pattern-Schleife mit Vorausplanung) ----------
let grooveTimer = null;
/**
 * startGroove({ steps, stepsPerBeat, bpm, layers:[{sound|midis, hits, accents, vel, dur}], onStep })
 * Läuft, bis stopGroove() oder stopAll() aufgerufen wird.
 */
export function startGroove(cfg) {
  stopGroove();
  stopAll();
  const my = seqId;
  const c = getCtx();
  const pianoMidis = cfg.layers.flatMap((l) => l.midis || (l.chords ? l.chords.flat() : l.bass ? l.bass.flatMap((x) => Object.values(x)) : []));
  if (pianoMidis.length) preload(pianoMidis);
  let step = 0;
  let next = c.currentTime + 0.12;
  const state = { bpm: cfg.bpm };
  grooveTimer = setInterval(() => {
    if (my !== seqId) return stopGroove();
    const stepDur = 60 / state.bpm / cfg.stepsPerBeat;
    while (next < c.currentTime + 0.12) {
      const s = step % cfg.steps;
      for (const l of cfg.layers) {
        if (l.muted || !l.hits.includes(s)) continue;
        const acc = l.accents && l.accents.includes(s);
        const vel = (l.vel ?? 1) * (l.accents ? (acc ? 1 : 0.55) : 1);
        if (l.chords) {
          const chord = l.chords[Math.floor(step / cfg.steps) % l.chords.length];
          chord.forEach((m) => playNote(m, { when: next, dur: l.dur || 0.14, vel: 0.5 * vel }));
        } else if (l.bass) {
          const b = l.bass[Math.floor(step / cfg.steps) % l.bass.length][s];
          if (b !== undefined) playNote(b, { when: next, dur: l.dur || 0.4, vel: 0.9 * vel });
        } else drum(l.sound, next, vel);
      }
      if (cfg.onStep) {
        const tt = next;
        activeTimers.push(setTimeout(() => my === seqId && cfg.onStep(s), Math.max(0, (tt - c.currentTime) * 1000)));
      }
      next += stepDur;
      step++;
    }
  }, 25);
  return state;
}
export function stopGroove() {
  if (grooveTimer) clearInterval(grooveTimer);
  grooveTimer = null;
}

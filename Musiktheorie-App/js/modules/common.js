// common.js – gemeinsame Bausteine für die Module
import * as T from '../core/theory.js';
import * as A from '../core/audio.js';
import * as R from '../core/rhythm.js';
import { renderPitches, renderAbc } from '../ui/notation.js';
import { h, icon, playButton } from '../ui/dom.js';

export const nm = T.germanName;
export const cap = T.capitalize;

/** Tonfolge abspielen und im Notenbild mitleuchten lassen */
export function playOn(api, pitches, tempo = 112) {
  A.playMelody(pitches.map(T.midi), { tempo, onNote: (i) => api && api.highlight(i), onEnd: () => api && api.clear() });
}

/** Notenbild + Abspielknopf */
export function staffWithPlay(container, pitches, opts = {}) {
  const box = h('div', {});
  container.append(box);
  const api = renderPitches(box, pitches, opts);
  const row = h('div', { class: 'btn-row' }, playButton(opts.playLabel || 'Anhören', () => (opts.onPlay ? opts.onPlay(api) : playOn(api, pitches, opts.tempo))));
  container.append(row);
  return { api, row, box };
}

/** Multiple Choice. options: [{label (Text oder Node-Funktion), correct}] */
export function mc({ kind, title, hint, options, explain, pre, cols, solution, onRender }) {
  const opts = T.shuffle(options);
  let chosen = null;
  let btns = [];
  return {
    kind, title, hint,
    render(body, ctx) {
      if (pre) pre(body);
      const wrap = h('div', { class: 'opts' + (cols ? ' opts--2' : ''), role: 'group', 'aria-label': 'Antwortmöglichkeiten' });
      btns = opts.map((o, i) => {
        const b = h('button', {
          class: 'opt' + (o.node ? ' opt--rich' : ''), type: 'button', 'aria-pressed': 'false',
          'aria-label': o.aria || null,
          onclick: () => {
            chosen = i;
            btns.forEach((x, k) => x.setAttribute('aria-pressed', String(k === i)));
            ctx.setReady(true);
          },
        }, o.node ? '' : o.label);
        return b;
      });
      wrap.append(...btns);
      body.append(wrap);
      // reiche Optionen (z. B. Notenbilder) erst nach dem Einhängen rendern
      opts.forEach((o, i) => o.node && o.node(btns[i]));
      if (onRender) onRender(body, ctx);
    },
    check() {
      const ok = !!opts[chosen].correct;
      btns.forEach((b, k) => {
        if (opts[k].correct) b.classList.add('is-ok');
        else if (k === chosen) b.classList.add('is-bad');
      });
      return { ok, explain: typeof explain === 'function' ? explain(ok, opts[chosen]) : explain, solution };
    },
  };
}

/** Lern-Reiter (Check das) */
export function learnTabs(root, tabs) {
  const bar = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Themen' });
  const panel = h('div', { class: 'panel', role: 'tabpanel', id: 'learn-panel', tabindex: '0' });
  tabs.forEach(([label], i) => {
    const b = h('button', { class: 'tab', role: 'tab', type: 'button', id: `tab-${i}`, 'aria-controls': 'learn-panel', 'aria-selected': 'false' }, label);
    b.addEventListener('click', () => show(i));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { show((i + 1) % tabs.length); bar.children[(i + 1) % tabs.length].focus(); }
      if (e.key === 'ArrowLeft') { show((i + tabs.length - 1) % tabs.length); bar.children[(i + tabs.length - 1) % tabs.length].focus(); }
    });
    bar.append(b);
  });
  function show(i) {
    A.stopAll();
    [...bar.children].forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    panel.setAttribute('aria-labelledby', `tab-${i}`);
    panel.innerHTML = '';
    tabs[i][1](panel);
  }
  root.append(bar, panel);
  show(0);
}

/** Kleine Umschalter-Reihe (z. B. Dur/Moll). Gibt {el, value()} zurück */
export function segmented(options, onChange, initial = 0) {
  let val = options[initial].value;
  const el = h('div', { class: 'btn-row', role: 'group' });
  const btns = options.map((o) => h('button', {
    class: 'tab', type: 'button', 'aria-pressed': String(o.value === val), 'aria-selected': String(o.value === val),
    onclick: () => {
      val = o.value;
      btns.forEach((b, k) => { const on = options[k].value === val; b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-selected', String(on)); });
      onChange(val);
    },
  }, o.label));
  el.append(...btns);
  return { el, value: () => val };
}

// ---------- Rhythmus ----------

/** Rhythmus als Notenbild (eine Linie). Rückgabe: renderAbc-API */
export function renderRhythm(el, measures, meter, opts = {}) {
  const abc = R.rhythmTune(measures, meter, { oneLine: opts.oneLine !== false, showMeter: opts.showMeter !== false });
  return renderAbc(el, abc, { ariaLabel: opts.ariaLabel || 'Rhythmus in Noten', staffwidth: opts.staffwidth });
}

/** Ereignisse (Sekunden) für einen Rhythmus inkl. optionalem Einzähler und Metronom */
export function rhythmEvents(measures, meter, { bpm = 80, countIn = true, click = true, sound = 'clave' } = {}) {
  const M = R.METERS[meter];
  const uSec = 60 / bpm / M.beatUnits; // Sekunden pro Einheit
  const bar = M.units;
  const ev = [];
  const offset = countIn ? bar : 0;
  if (countIn) for (let b = 0; b < M.beats; b++) ev.push({ t: b * M.beatUnits * uSec, sound: b === 0 ? 'clickAcc' : 'click', count: true });
  if (click) for (let m = 0; m < measures.length; m++) for (let b = 0; b < M.beats; b++) ev.push({ t: (offset + m * bar + b * M.beatUnits) * uSec, sound: b === 0 ? 'clickAcc' : 'click', vel: 0.7 });
  const ons = R.onsets(measures, meter);
  ons.forEach((u, i) => ev.push({ t: (offset + u) * uSec, sound, note: i }));
  ev.sort((a, b) => a.t - b.t);
  return { ev, onsetsSec: ons.map((u) => (offset + u) * uSec), uSec, offsetSec: offset * uSec, totalSec: (offset + measures.length * bar) * uSec };
}

/** Rhythmus abspielen, Noten im Bild mitleuchten lassen */
export function playRhythm(api, measures, meter, opts = {}) {
  const { ev } = rhythmEvents(measures, meter, opts);
  return A.playHits(ev, {
    onEvent: (i, e) => { if (api && e.note !== undefined) api.highlight(e.note); },
    onEnd: () => api && api.clear(),
  });
}

/** Rhythmus-Notenbild mit Abspielknopf */
export function rhythmWithPlay(container, measures, meter, opts = {}) {
  const box = h('div', {});
  container.append(box);
  const api = renderRhythm(box, measures, meter, opts);
  const row = h('div', { class: 'btn-row' }, playButton(opts.playLabel || 'Anhören', () => playRhythm(api, measures, meter, opts)));
  container.append(row);
  return { api, row };
}

/**
 * Tipp-Fläche: Einzählen, dann tippt man den Rhythmus mit.
 * Bewertung: jeder Sollschlag braucht einen Tipp in der Nähe; eine gleichbleibende
 * Verzögerung des Geräts (Bluetooth, Bildschirm) wird herausgerechnet.
 * onResult({ ok, hits:[{ dt }], extra, missing })
 */
export function tapPad(container, measures, meter, { bpm = 80, sound = 'clave', onResult, label = 'Tippen' } = {}) {
  let taps = [];
  let running = false;
  let t0 = null;
  let plan = null;
  const status = h('p', { class: 'tap-status', 'aria-live': 'polite' }, 'Drück auf Start. Du hörst 1 Takt zum Einzählen, dann tippst du mit.');
  const pad = h('button', { class: 'tap-pad', type: 'button', disabled: true, 'aria-label': 'Hier tippen (oder Leertaste)' }, h('span', {}, label));
  const lights = h('div', { class: 'tap-lights', 'aria-hidden': 'true' });
  const startBtn = h('button', { class: 'btn btn--primary', type: 'button' }, icon('play'), 'Start');
  const listenBtn = h('button', { class: 'btn', type: 'button' }, icon('ear'), 'Vorspielen');
  const row = h('div', { class: 'btn-row' }, startBtn, listenBtn);
  container.append(row, lights, pad, status);
  const M = R.METERS[meter];
  for (let b = 0; b < M.beats; b++) lights.append(h('span', {}));

  function hit() {
    if (!running) return;
    const t = A.now() - t0;
    taps.push(t);
    A.drum('tap', 0, 0.8);
    pad.classList.remove('is-hit');
    void pad.offsetWidth;
    pad.classList.add('is-hit');
  }
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(); });
  pad.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hit(); }
  });

  listenBtn.addEventListener('click', () => {
    running = false;
    const { ev } = rhythmEvents(measures, meter, { bpm, sound, countIn: true });
    A.playHits(ev, { onEvent: (i, e) => flash(e) });
    status.textContent = 'So klingt es. Danach: Start drücken und mittippen.';
  });

  function flash(e) {
    if (!e.sound || !e.sound.startsWith('click')) return;
    const idx = Math.round(e.t / (60 / bpm)) % M.beats;
    [...lights.children].forEach((l, k) => l.classList.toggle('is-on', k === idx));
  }

  startBtn.addEventListener('click', async () => {
    taps = [];
    plan = rhythmEvents(measures, meter, { bpm, sound, countIn: true });
    // beim Mittippen klingt nur das Metronom (der Rhythmus kommt von dir)
    const ev = plan.ev.filter((e) => e.note === undefined);
    pad.disabled = false;
    pad.focus();
    status.textContent = 'Eins, zwei, drei, vier … jetzt mittippen!';
    running = true;
    t0 = await A.playHits(ev, { onEvent: (i, e) => flash(e) });
    const endMs = (plan.totalSec + 0.5) * 1000 + 150;
    setTimeout(() => {
      if (!running) return;
      running = false;
      [...lights.children].forEach((l) => l.classList.remove('is-on'));
      evaluate();
    }, endMs);
  });

  function evaluate() {
    const target = plan.onsetsSec;
    const tol = Math.min(0.12, plan.uSec * 3.2 + 0.03);
    // Taps vor dem Einzähl-Ende großzügig ignorieren
    const used = taps.filter((t) => t > plan.offsetSec - 0.25);
    // gleichbleibende Verzögerung schätzen (Median der Abstände zum nächsten Sollschlag)
    const diffs = used.map((t) => {
      let best = Infinity;
      target.forEach((s) => { if (Math.abs(t - s) < Math.abs(best)) best = t - s; });
      return best;
    }).filter((d) => Math.abs(d) < 0.25).sort((a, b) => a - b);
    const lat = diffs.length ? Math.max(-0.08, Math.min(0.18, diffs[Math.floor(diffs.length / 2)])) : 0;
    const free = used.map((t) => t - lat);
    const taken = new Set();
    const hits = target.map((s) => {
      let bi = -1, bd = Infinity;
      free.forEach((t, i) => { if (!taken.has(i) && Math.abs(t - s) < Math.abs(bd)) { bd = t - s; bi = i; } });
      if (bi >= 0 && Math.abs(bd) <= tol) { taken.add(bi); return { dt: bd }; }
      return { dt: null };
    });
    const missing = hits.filter((x) => x.dt === null).length;
    const extra = free.length - taken.size;
    const ok = missing === 0 && extra === 0;
    status.textContent = ok ? 'Im Groove! Drück jetzt auf Prüfen.' : `${hits.length - missing} von ${hits.length} Schlägen getroffen${extra ? `, ${extra} zu viel` : ''}. Du kannst es nochmal versuchen oder prüfen.`;
    if (onResult) onResult({ ok, hits, extra, missing, used: free.length });
  }

  return {
    stop() { running = false; },
  };
}

/** Aufgabe: Rhythmus mittippen */
export function tapTask({ kind = 'Rhythmus tippen', title, hint, measures, meter = '4/4', bpm = 80, sound = 'clave', explainOk, explainBad }) {
  let last = null;
  let api = null;
  return {
    kind, title, hint,
    render(body, ctx) {
      const box = h('div', {});
      body.append(box);
      api = renderRhythm(box, measures, meter);
      tapPad(body, measures, meter, {
        bpm, sound,
        onResult: (r) => {
          last = r;
          r.hits.forEach((x, i) => { api.mark(i, 'is-wrong', x.dt === null); api.mark(i, 'is-sel', x.dt !== null); });
          ctx.setReady(true);
        },
      });
    },
    check() {
      const r = last;
      const n = r.hits.length;
      const got = n - r.missing;
      let detail = '';
      if (!r.ok) {
        const early = r.hits.filter((x) => x.dt !== null && x.dt < -0.05).length;
        const late = r.hits.filter((x) => x.dt !== null && x.dt > 0.05).length;
        detail = `<p>Getroffen: ${got} von ${n}${r.extra ? ` · ${r.extra} Tipp${r.extra > 1 ? 's' : ''} zu viel` : ''}. Rot markierte Noten hast du verpasst.</p>`;
        if (early > late && early > 0) detail += '<p>Tipp: Du warst oft etwas zu früh. Lass dir mehr Zeit und zähle innerlich mit.</p>';
        else if (late > 0) detail += '<p>Tipp: Du warst oft etwas zu spät. Hör auf den Klick und tippe gleichzeitig.</p>';
      }
      return {
        ok: r.ok,
        explain: (r.ok ? `<p>Alle ${n} Schläge im Timing.</p>` : detail) + (r.ok ? explainOk || '' : explainBad || explainOk || ''),
        solution: (el) => {
          el.append(h('p', { class: 'staff-cap' }, 'So klingt es richtig (mit Metronom):'));
          rhythmWithPlay(el, measures, meter, { bpm, sound, countIn: true, playLabel: 'Anhören' });
        },
      };
    },
  };
}

/** Option als Notenbild-Rhythmus (für mc) */
export function rhythmOption(measures, meter, label) {
  return (btn) => {
    btn.classList.add('opt--staff');
    const cap = h('span', { class: 'opt__label' }, label);
    const box = h('div', { class: 'opt__staff' });
    btn.append(cap, box);
    renderRhythm(box, measures, meter, { staffwidth: 300 });
  };
}
/** Option als Notenbild (Tonhöhen) */
export function pitchOption(pitches, label, opts = {}) {
  return (btn) => {
    btn.classList.add('opt--staff');
    const cap = h('span', { class: 'opt__label' }, label);
    const box = h('div', { class: 'opt__staff' });
    btn.append(cap, box);
    renderPitches(box, pitches, { staffwidth: 260, ...opts });
  };
}

export const LETTERS = ['A', 'B', 'C', 'D'];

/** Zufällige Auswahl ohne Wiederholung */
export function pickN(arr, n, exclude = () => false) {
  return T.shuffle(arr.filter((x) => !exclude(x))).slice(0, n);
}

/** Akkord/Intervall gleichzeitig spielen mit Hervorhebung */
export function playTogether(api, pitches) {
  A.playChord(pitches.map(T.midi), { onNote: () => api && pitches.forEach((_, i) => api.mark(i, 'is-playing', true)), onEnd: () => api && api.clear() });
}

/** Zeigt eine Sammlung von „Merkzetteln“ */
export function callout(title, text, warn = false) {
  return h('div', { class: 'callout' + (warn ? ' callout--warn' : '') }, h('strong', {}, title + ' '), text);
}

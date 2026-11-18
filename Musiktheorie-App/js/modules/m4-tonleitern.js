// =====================================================================
// Modul 4 – Tonleitern (Schwerpunkt)
// Alle Aufgaben werden aus dem Theorie-Kern erzeugt.
// =====================================================================
import * as T from '../core/theory.js';
import * as A from '../core/audio.js';
import { renderPitches, renderKeySignature, renderCustomKeySignature } from '../ui/notation.js';
import { createKeyboard } from '../ui/keyboard.js';
import { createBlocks } from '../ui/blocks.js';
import { createCircle, durLabel, mollLabel } from '../ui/circle.js';
import { h, icon, playButton } from '../ui/dom.js';

const nm = T.germanName;
// Tonartname mit geschütztem Bindestrich (kein Zeilenumbruch in „D-Dur“)
const KN = (k, m) => T.keyName(k, m).replace('-', '‑');
const DUR = T.DUR_KEYS; // C G D A F B Es
const MOLL = T.MOLL_KEYS; // a e h fis d g c
const ALL_KEYS = [...DUR.map((k) => ({ k, m: 'dur' })), ...MOLL.map((k) => ({ k, m: 'moll' }))];
const hasAcc = ({ k, m }) => T.keySignature(k, m).length > 0;
const MODE_WORD = { dur: 'Dur', moll: 'Moll' };

// ---------- Helfer ----------
function scaleAt(k, m, clef = 'treble') {
  const octave = clef === 'bass' ? (k.step <= 1 ? 3 : 2) : 4;
  return T.scale({ step: k.step, alter: k.alter, octave }, m);
}
function withSlurs(pitches, degrees) {
  return pitches.map((p, i) => ({
    pitch: p,
    pre: degrees.includes(i + 1) ? '(' : '',
    post: degrees.includes(i) ? ')' : '',
  }));
}
function playOn(api, pitches, tempo = 112) {
  A.playMelody(pitches.map(T.midi), { tempo, onNote: (i) => api && api.highlight(i), onEnd: () => api && api.clear() });
}
/** Notenbild + Abspielknopf */
function staffWithPlay(container, pitches, opts = {}) {
  const box = h('div', {});
  container.append(box);
  const api = renderPitches(box, pitches, opts);
  const row = h('div', { class: 'btn-row' }, playButton(opts.playLabel || 'Anhören', () => playOn(api, pitches)));
  container.append(row);
  return { api, row };
}
function solutionScale(k, m, { withKey = false, clef = 'treble' } = {}) {
  return (el) => {
    const p = scaleAt(k, m, clef);
    el.append(h('p', { class: 'staff-cap' }, `Lösung: ${KN(k, m)}${m === 'moll' ? ' (natürlich)' : ''} – Halbtonschritte mit Bogen`));
    staffWithPlay(el, p, { items: withSlurs(p, T.halfStepDegrees(m)), tonic: k, mode: m, withKey, clef, ariaLabel: `${KN(k, m)} in Noten`, playLabel: 'Lösung anhören' });
  };
}
function listNames(pitches) {
  return pitches.map(nm).join(' – ');
}
function pickN(arr, n, exclude = () => false) {
  return T.shuffle(arr.filter((x) => !exclude(x))).slice(0, n);
}
function stepWord(s) {
  return s === 1 ? 'Halbtonschritt' : 'Ganztonschritt';
}

/** Multiple Choice (Optionen werden gemischt) */
function mc({ kind, title, hint, options, explain, pre, cols, solution }) {
  const opts = T.shuffle(options);
  let chosen = null;
  let btns = [];
  return {
    kind, title, hint,
    render(body, ctx) {
      if (pre) pre(body);
      const wrap = h('div', { class: 'opts' + (cols ? ' opts--2' : ''), role: 'group', 'aria-label': 'Antwortmöglichkeiten' });
      btns = opts.map((o, i) => h('button', {
        class: 'opt', type: 'button', 'aria-pressed': 'false',
        onclick: () => {
          chosen = i;
          btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
          ctx.setReady(true);
        },
      }, o.label));
      wrap.append(...btns);
      body.append(wrap);
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

// =====================================================================
// AUFGABEN
// =====================================================================

// --- Halbtonschritte markieren ---
function markHalfSteps(level) {
  const m = level === 'hop' ? 'dur' : level === 'step' ? 'moll' : T.pick(['dur', 'moll']);
  const pool = level === 'hop' ? DUR.slice(0, 5) : m === 'dur' ? DUR : MOLL;
  const k = T.pick(pool);
  const withKey = level === 'jump';
  const clef = level === 'jump' && Math.random() < 0.4 ? 'bass' : 'treble';
  const p = scaleAt(k, m, clef);
  const correct = T.halfStepDegrees(m);
  const sel = new Set();
  let api, toggles;
  return {
    kind: 'Notenbild',
    title: withKey ? `Markiere die Halbtonschritte in ${KN(k, m)}.` : `Wo liegen in ${KN(k, m)} die Halbtonschritte?`,
    hint: withKey
      ? `Achte auf die Generalvorzeichen${clef === 'bass' ? ' und den Bassschlüssel' : ''}. Tippe die Stufenpaare an.`
      : 'Tippe die Stufenpaare an, zwischen denen ein Halbtonschritt liegt.',
    render(body, ctx) {
      const box = h('div', {});
      body.append(box);
      api = renderPitches(box, p, { tonic: k, mode: m, withKey, clef, ariaLabel: `${KN(k, m)} in Noten` });
      body.append(h('div', { class: 'btn-row' }, playButton('Anhören', () => playOn(api, p))));
      toggles = h('div', { class: 'toggles', role: 'group', 'aria-label': 'Stufenpaare' });
      for (let d = 1; d <= 7; d++) {
        const t = h('button', {
          class: 'toggle', type: 'button', 'aria-pressed': 'false',
          'aria-label': `Stufe ${d} zu ${d + 1}${level === 'hop' ? `: ${nm(p[d - 1])} – ${nm(p[d])}` : ''}`,
          onclick: () => {
            sel.has(d) ? sel.delete(d) : sel.add(d);
            t.setAttribute('aria-pressed', String(sel.has(d)));
            api.mark(d - 1, 'is-sel', [...sel].some((x) => x === d || x === d - 1));
            api.mark(d, 'is-sel', [...sel].some((x) => x === d || x === d + 1));
            ctx.setReady(sel.size > 0);
          },
        }, `${d}–${d + 1}`, level === 'hop' ? h('small', {}, `${nm(p[d - 1])}–${nm(p[d])}`) : '');
        toggles.append(t);
      }
      body.append(toggles);
    },
    check() {
      const ok = sel.size === correct.length && correct.every((d) => sel.has(d));
      [...toggles.children].forEach((t, i) => {
        const d = i + 1;
        if (correct.includes(d)) t.classList.add('is-ok');
        else if (sel.has(d)) t.classList.add('is-bad');
      });
      const pairs = correct.map((d) => `${d}. und ${d + 1}. Stufe (${nm(p[d - 1])}–${nm(p[d])})`).join(' sowie der ');
      return {
        ok,
        explain: `<p>In ${m === 'dur' ? 'Dur' : 'natürlichem Moll'} liegen die Halbtonschritte immer zwischen der ${pairs}. Alle anderen Schritte sind Ganztonschritte.</p>`
          + (m === 'dur' ? '' : '<p>Merke: Dur 3–4 und 7–8, Moll 2–3 und 5–6.</p>'),
        solution: solutionScale(k, m, { withKey, clef }),
      };
    },
  };
}

// --- Tonleiter auf der Klaviatur bauen ---
function buildOnKeyboard(level) {
  const pool = level === 'hop' ? [DUR[0], DUR[1], DUR[4]].map((k) => ({ k, m: 'dur' })).concat([{ k: MOLL[0], m: 'moll' }]) : ALL_KEYS;
  const { k, m } = T.pick(pool);
  const exp = scaleAt(k, m);
  const expMidi = exp.map(T.midi);
  const played = [];
  let kb, builtEl, staffBox;
  const labels = level === 'hop';

  function spell(midi, i) {
    const e = exp[i] || exp[exp.length - 1];
    const diff = midi - T.midi(e);
    if (Math.abs(diff) <= 1 && Math.abs(e.alter + diff) <= 1) return { ...e, alter: e.alter + diff };
    const pc = ((midi % 12) + 12) % 12;
    const map = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
    return { step: map[pc][0], alter: map[pc][1], octave: Math.floor(midi / 12) - 1 };
  }
  function refresh(ctx) {
    kb.clearMarks();
    kb.el.querySelectorAll('[data-n]').forEach((b) => b.removeAttribute('data-n'));
    played.forEach((mm, i) => {
      kb.mark(mm, 'is-sel');
      const b = kb.el.querySelector(`[data-midi="${mm}"]`);
      if (b) b.dataset.n = b.dataset.n ? `${b.dataset.n},${i + 1}` : String(i + 1);
    });
    builtEl.innerHTML = '';
    if (!played.length) builtEl.append(h('span', { class: 'built__ph' }, 'Noch keine Töne – tippe auf die Tasten.'));
    played.forEach((mm, i) => builtEl.append(h('span', { class: 'built__note' }, nm(spell(mm, i)))));
    staffBox.innerHTML = '';
    if (played.length) renderPitches(staffBox, played.map(spell), { ariaLabel: 'Deine Töne in Noten' });
    ctx.setReady(played.length === 8);
  }
  return {
    kind: 'Klaviatur',
    title: `Baue ${KN(k, m)} aufwärts.`,
    hint: `Starte auf ${T.germanNameOctave(exp[0])} und tippe 8 Töne bis zur Oktave.${level === 'hop' ? ` Muster: ${T.stepPattern(m).join(' ')}` : ''}`,
    render(body, ctx) {
      staffBox = h('div', {});
      builtEl = h('div', { class: 'built', 'aria-live': 'polite' });
      const kwrap = h('div', { class: 'kbd-wrap' });
      body.append(kwrap, builtEl, staffBox);
      kb = createKeyboard(kwrap, {
        from: 60, to: 83, labels,
        onKey: (mm) => {
          if (played.length >= 8) return;
          played.push(mm);
          refresh(ctx);
        },
      });
      body.append(h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { played.pop(); refresh(ctx); } }, icon('undo'), 'Rückgängig'),
        h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => { played.length = 0; refresh(ctx); } }, 'Neu starten')));
      refresh(ctx);
    },
    check() {
      const wrongAt = played.findIndex((mm, i) => mm !== expMidi[i]);
      kb.clearMarks();
      played.forEach((mm, i) => kb.mark(mm, mm === expMidi[i] ? 'is-ok' : 'is-bad'));
      const ok = wrongAt === -1;
      let explain;
      if (ok) explain = `<p>${KN(k, m)}: ${listNames(exp)}. Die Halbtonschritte liegen zwischen ${T.halfStepDegrees(m).map((d) => `${d}.–${d + 1}.`).join(' und ')} Stufe.</p>`;
      else {
        const i = wrongAt;
        const should = exp[i];
        const got = spell(played[i], i);
        explain = i === 0
          ? `<p>Du musst auf ${T.germanNameOctave(exp[0])} starten.</p>`
          : `<p>Die ${i + 1}. Stufe ist <strong>${nm(should)}</strong>, nicht ${nm(got)}. Von der ${i}. zur ${i + 1}. Stufe geht in ${MODE_WORD[m]} ein <strong>${stepWord(T.SCALES[m].steps[i - 1])}</strong> (${nm(exp[i - 1])}–${nm(should)}).</p>`;
        explain += `<p>${KN(k, m)}: ${listNames(exp)}</p>`;
      }
      return { ok, explain, solution: solutionScale(k, m) };
    },
  };
}

// --- Baukasten: Ganz-/Halbtonschritte ---
function blocksTask(level) {
  const m = level === 'hop' ? 'dur' : level === 'step' ? 'moll' : T.pick(['dur', 'moll']);
  const k = T.pick(m === 'dur' ? DUR : MOLL);
  const pattern = T.stepPattern(m);
  let blocks;
  function playBuilt() {
    const vals = blocks.values();
    let mm = T.midi(scaleAt(k, m)[0]);
    const seq = [mm];
    vals.forEach((v) => { if (v) { mm += v === 'G' ? 2 : 1; seq.push(mm); } });
    A.playMelody(seq, { tempo: 120 });
  }
  return {
    kind: 'Baukasten',
    title: `Bau das Schrittmuster von ${m === 'dur' ? 'Dur' : 'natürlichem Moll'}.`,
    hint: `Zieh die Bausteine in die Felder oder tippe sie an. Mit „Anhören“ hörst du dein Muster (Startton: ${T.germanNameOctave(scaleAt(k, m)[0])}).`,
    render(body, ctx) {
      blocks = createBlocks(body, { onChange: (v) => ctx.setReady(v.every(Boolean)) });
      body.append(h('div', { class: 'btn-row' }, playButton('Anhören', playBuilt)));
    },
    check() {
      const v = blocks.values();
      blocks.markResult(pattern);
      const ok = v.join('') === pattern.join('');
      const hs = T.halfStepDegrees(m).map((d) => `${d}–${d + 1}`).join(' und ');
      return {
        ok,
        explain: `<p>${m === 'dur' ? 'Dur' : 'Natürliches Moll'}: <strong>${pattern.join(' ')}</strong> – Halbtonschritte zwischen ${hs}. Das Muster gilt für jede ${MODE_WORD[m]}-Tonleiter, egal auf welchem Ton sie beginnt.</p>`,
        solution: solutionScale(k, m),
      };
    },
  };
}

// --- Hören: Dur oder Moll (Jump: auch Pentatonik) ---
function hearTask(level) {
  const choices = level === 'jump' ? ['dur', 'moll', 'penta'] : ['dur', 'moll'];
  const ans = T.pick(choices);
  const tonics = level === 'hop' ? [DUR[0], DUR[4], DUR[1]] : [...DUR, ...MOLL.slice(0, 3)];
  const k = T.pick(tonics);
  const base = { step: k.step, alter: k.alter, octave: 4 };
  const pitches = ans === 'penta' ? T.majorPentatonic(base) : T.scale(base, ans);
  const seq = level === 'hop' ? pitches : [...pitches, ...pitches.slice(0, -1).reverse()];
  const LABEL = { dur: 'Dur', moll: 'Moll', penta: 'Dur-Pentatonik' };
  const play = () => A.playMelody(seq.map(T.midi), { tempo: level === 'hop' ? 110 : 130 });
  const task = mc({
    kind: 'Hören',
    title: level === 'jump' ? 'Was hörst du: Dur, Moll oder Pentatonik?' : 'Dur oder Moll?',
    hint: 'Hör dir die Tonleiter an – so oft du willst.',
    cols: level !== 'jump',
    pre: (body) => {
      body.append(h('div', { class: 'btn-row' }, playButton('Tonleiter abspielen', play)));
      setTimeout(play, 350);
    },
    options: choices.map((c) => ({ label: LABEL[c], correct: c === ans })),
    explain: () => {
      const why = {
        dur: 'Dur: Zwischen 1. und 3. Stufe liegt eine große Terz (4 Halbtöne). Das klingt für viele hell und klar.',
        moll: 'Moll: Zwischen 1. und 3. Stufe liegt nur eine kleine Terz (3 Halbtöne). Das klingt für viele eher dunkel oder weich.',
        penta: 'Pentatonik: nur fünf verschiedene Töne und keine Halbtonschritte. Sie klingt offen und „schwebend“.',
      }[ans];
      return `<p>Das war <strong>${ans === 'penta' ? nm(k).replace(/^./, (c) => c.toUpperCase()) + '-Dur-Pentatonik' : KN(k, ans)}</strong>. ${why}</p>`;
    },
    solution: (el) => {
      el.append(h('p', { class: 'staff-cap' }, 'So sieht das Gehörte aus:'));
      staffWithPlay(el, pitches, { ariaLabel: 'Gehörte Tonleiter in Noten', playLabel: 'Nochmal hören' });
    },
  });
  return task;
}

// --- Welcher Ton ist die n. Stufe? ---
function degreeTask(level) {
  const pool = level === 'hop' ? [DUR[0], DUR[1], DUR[4]].map((k) => ({ k, m: 'dur' })) : ALL_KEYS;
  const { k, m } = T.pick(pool);
  const s = scaleAt(k, m);
  const n = 2 + T.rand(6); // Stufe 2–7
  const corr = s[n - 1];
  const cands = new Map();
  for (const a of [-1, 0, 1]) if (a !== corr.alter) cands.set(nm({ step: corr.step, alter: a }), 1);
  cands.set(nm(s[n % 7]), 1);
  cands.set(nm(s[n - 2]), 1);
  const distract = T.shuffle([...cands.keys()].filter((x) => x !== nm(corr))).slice(0, 3);
  const bh = ['b', 'h'].includes(nm(corr)) || distract.some((d) => ['b', 'h'].includes(d));
  return mc({
    kind: 'Tonnamen',
    title: `Welcher Ton ist die ${n}. Stufe von ${KN(k, m)}?`,
    cols: true,
    options: [{ label: nm(corr), correct: true }, ...distract.map((d) => ({ label: d }))],
    explain: `<p>${KN(k, m)}: ${s.map((p, i) => (i === n - 1 ? `<strong>${nm(p)}</strong>` : nm(p))).join(' – ')}</p>`
      + (bh ? '<p>Achtung, deutsche Namen: <strong>b</strong> ist das B mit ♭, <strong>h</strong> ist das B ohne Vorzeichen.</p>' : ''),
  });
}

// --- Regelwissen: Wo liegen die Halbtonschritte? ---
function ruleTask() {
  const m = T.pick(['dur', 'moll']);
  const opts = ['3–4 und 7–8', '2–3 und 5–6', '4–5 und 7–8', '3–4 und 6–7'];
  const corr = m === 'dur' ? opts[0] : opts[1];
  return mc({
    kind: 'Regel',
    title: `Zwischen welchen Stufen liegen in ${m === 'dur' ? 'Dur' : 'natürlichem Moll'} die Halbtonschritte?`,
    cols: true,
    options: opts.map((o) => ({ label: o, correct: o === corr })),
    explain: `<p>Dur: <strong>3–4 und 7–8</strong> (G G H G G G H). Natürliches Moll: <strong>2–3 und 5–6</strong> (G H G G H G G).</p>`,
  });
}

// --- Vorzeichen ergänzen / Fehler finden ---
function fixTask(level) {
  const mode = level === 'jump' ? 'wrong' : 'missing';
  const pool = mode === 'missing' ? ALL_KEYS.filter(hasAcc) : ALL_KEYS;
  const { k, m } = T.pick(pool);
  const exp = scaleAt(k, m);
  const fifths = T.keyFifths(k, m);
  let deg;
  if (mode === 'missing') {
    const cand = [1, 2, 3, 4, 5, 6].filter((i) => exp[i].alter !== 0);
    deg = T.pick(cand);
  } else deg = 1 + T.rand(6);
  const shown = exp.map((p) => ({ ...p }));
  if (mode === 'missing') shown[deg].alter = 0;
  else shown[deg].alter = exp[deg].alter !== 0 ? 0 : fifths >= 0 ? 1 : -1;
  let selected = null;
  let api, staffBox, picks;
  function draw() {
    staffBox.innerHTML = '';
    api = renderPitches(staffBox, shown, { ariaLabel: `Tonleiter auf ${nm(exp[0])}`, onClickNote: (i) => choose(i) });
    if (selected !== null) api.mark(selected, 'is-sel');
  }
  function choose(i) {
    selected = i;
    [...picks.children].forEach((b, k2) => b.setAttribute('aria-pressed', String(k2 === i)));
    draw();
  }
  return {
    kind: mode === 'missing' ? 'Vorzeichen ergänzen' : 'Fehlersuche',
    title: mode === 'missing'
      ? `Hier fehlt ein Vorzeichen: ${KN(k, m)}.`
      : `In dieser ${KN(k, m)}-Tonleiter steckt ein Fehler.`,
    hint: 'Wähle die Note (antippen oder Nummer) und setz das richtige Zeichen.',
    render(body, ctx) {
      staffBox = h('div', {});
      body.append(staffBox);
      picks = h('div', { class: 'note-picks', role: 'group', 'aria-label': 'Note auswählen' });
      for (let i = 0; i < 8; i++) {
        picks.append(h('button', { class: 'toggle', type: 'button', 'aria-pressed': 'false', 'aria-label': `${i + 1}. Note`, onclick: () => choose(i) }, String(i + 1)));
      }
      body.append(picks);
      const accBtn = (alter, sym, label, short) => h('button', {
        class: 'btn', type: 'button', 'aria-label': label,
        onclick: () => {
          if (selected === null) return;
          shown[selected].alter = alter;
          draw();
          ctx.setReady(true);
          A.playNote(T.midi(shown[selected]));
        },
      }, h('span', { class: 'acc-sym', 'aria-hidden': 'true' }, sym), h('span', { class: 'acc-txt', 'aria-hidden': 'true' }, short));
      body.append(h('div', { class: 'acc-row' },
        accBtn(1, '♯', 'Kreuz setzen', 'Kreuz'), accBtn(-1, '♭', 'B setzen', 'B'), accBtn(0, '♮', 'Stammton ohne Vorzeichen', 'Stammton')));
      body.append(h('div', { class: 'btn-row' }, playButton('Deine Version anhören', () => playOn(api, shown))));
      draw();
    },
    check() {
      const ok = shown.every((p, i) => p.alter === exp[i].alter);
      const prev = exp[deg - 1], cur = exp[deg];
      const st = T.SCALES[m].steps[deg - 1];
      return {
        ok,
        explain: `<p>Die ${deg + 1}. Stufe von ${KN(k, m)} heißt <strong>${nm(cur)}</strong>. Von ${nm(prev)} nach ${nm(cur)} braucht ${MODE_WORD[m]} hier einen ${stepWord(st)}.</p>`
          + `<p>Generalvorzeichen von ${KN(k, m)}: ${T.keySignature(k, m).map(nm).join(', ') || 'keine'}.</p>`,
        solution: solutionScale(k, m),
      };
    },
  };
}

// --- Generalvorzeichen lesen ---
function readKeyTask(level) {
  const both = level === 'jump' || level === 'challenge';
  const idx = T.rand(7);
  const k = DUR[idx];
  const clef = both && Math.random() < 0.5 ? 'bass' : 'treble';
  const others = pickN([0, 1, 2, 3, 4, 5, 6], 3, (i) => i === idx);
  const label = (i) => (both ? `${KN(DUR[i], 'dur')} / ${KN(MOLL[i], 'moll')}` : KN(DUR[i], 'dur'));
  const f = T.CURRICULUM_FIFTHS[idx];
  let rule;
  if (f === 0) rule = 'Keine Vorzeichen: C-Dur (bzw. a-Moll).';
  else if (f > 0) rule = `Bei Kreuzen gilt: letztes Kreuz + Halbtonschritt aufwärts = Dur-Grundton. Hier: ${nm(T.keySignature(k).at(-1))} → <strong>${nm(k)}</strong>.`;
  else if (f === -1) rule = 'Ein B: Das ist F-Dur (bzw. d-Moll) – einfach merken.';
  else rule = `Bei B-Vorzeichen gilt: Das vorletzte B ist der Dur-Grundton. Hier: ${T.keySignature(k).map(nm).join(', ')} → <strong>${nm(T.keySignature(k).at(-2))}</strong>.`;
  return mc({
    kind: 'Generalvorzeichen',
    title: both ? 'Welche zwei Tonarten haben diese Generalvorzeichen?' : 'Welche Dur-Tonart ist das?',
    hint: clef === 'bass' ? 'Achtung: Bassschlüssel!' : '',
    pre: (body) => {
      const box = h('div', { style: { maxWidth: '260px' } });
      body.append(box);
      renderKeySignature(box, k, 'dur', clef);
    },
    options: [{ label: label(idx), correct: true }, ...others.map((i) => ({ label: label(i) }))],
    explain: `<p>${rule}</p>` + (both ? `<p>Die parallele Molltonart liegt eine kleine Terz tiefer: ${KN(MOLL[idx], 'moll')}.</p>` : ''),
  });
}

// --- Paralleltonart ---
function parallelTask() {
  const idx = T.rand(7);
  const fromDur = Math.random() < 0.5;
  const ask = fromDur ? DUR[idx] : MOLL[idx];
  const targetList = fromDur ? MOLL : DUR;
  const tm = fromDur ? 'moll' : 'dur';
  const others = pickN([0, 1, 2, 3, 4, 5, 6], 3, (i) => i === idx);
  return mc({
    kind: 'Paralleltonart',
    title: fromDur ? `Welche Molltonart ist parallel zu ${KN(ask, 'dur')}?` : `Welche Durtonart ist parallel zu ${KN(ask, 'moll')}?`,
    cols: true,
    options: [{ label: KN(targetList[idx], tm), correct: true }, ...others.map((i) => ({ label: KN(targetList[i], tm) }))],
    explain: `<p>${KN(DUR[idx], 'dur')} und ${KN(MOLL[idx], 'moll')} haben dieselben Töne und dieselben Generalvorzeichen (${T.keySignature(DUR[idx]).map(nm).join(', ') || 'keine'}). `
      + `Die parallele Molltonart beginnt auf der 6. Stufe von Dur – das ist eine kleine Terz (3 Halbtöne) unter dem Dur-Grundton.</p>`,
  });
}

// --- Generalvorzeichen setzen (Reihenfolge!) ---
function buildKeyTask() {
  const pool = ALL_KEYS.filter(hasAcc);
  const { k, m } = T.pick(pool);
  const target = T.keySignature(k, m);
  const chosen = [];
  let staffBox, chipsEl;
  const sharps = T.SHARP_ORDER.slice(0, 4).map((s) => ({ step: s, alter: 1 }));
  const flats = T.FLAT_ORDER.slice(0, 4).map((s) => ({ step: s, alter: -1 }));
  const chips = T.shuffle(sharps).concat(T.shuffle(flats));
  function draw(ctx) {
    staffBox.innerHTML = '';
    renderCustomKeySignature(staffBox, chosen);
    [...chipsEl.children].forEach((b, i) => b.setAttribute('aria-pressed', String(chosen.some((c) => T.samePitchClass(c, chips[i])))));
    ctx.setReady(chosen.length > 0);
  }
  return {
    kind: 'Generalvorzeichen setzen',
    title: `Setze die Generalvorzeichen für ${KN(k, m)}.`,
    hint: 'Tippe die Vorzeichen in der richtigen Reihenfolge an.',
    render(body, ctx) {
      staffBox = h('div', { style: { maxWidth: '300px' } });
      chipsEl = h('div', { class: 'toggles', style: { gridTemplateColumns: 'repeat(4, 1fr)' }, role: 'group', 'aria-label': 'Vorzeichen' });
      chips.forEach((c) => chipsEl.append(h('button', {
        class: 'toggle', type: 'button', 'aria-pressed': 'false',
        onclick: () => {
          if (chosen.some((x) => T.samePitchClass(x, c))) return;
          chosen.push(c);
          draw(ctx);
        },
      }, nm(c), h('small', {}, c.alter > 0 ? '♯' : '♭'))));
      body.append(staffBox, chipsEl, h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { chosen.pop(); draw(ctx); } }, icon('undo'), 'Rückgängig'),
        h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => { chosen.length = 0; draw(ctx); } }, 'Alles löschen')));
      draw(ctx);
    },
    check() {
      const sameSet = chosen.length === target.length && target.every((t) => chosen.some((c) => T.samePitchClass(c, t)));
      const ok = sameSet && target.every((t, i) => T.samePitchClass(t, chosen[i]));
      let explain = `<p>${KN(k, m)} hat ${target.length} ${target[0].alter > 0 ? 'Kreuz' + (target.length > 1 ? 'e' : '') : 'B'}: <strong>${target.map(nm).join(' – ')}</strong>.</p>`;
      if (sameSet && !ok) explain += '<p>Die richtigen Vorzeichen – aber die Reihenfolge stimmt nicht.</p>';
      explain += '<p>Reihenfolge immer gleich: Kreuze fis – cis – gis – dis – ais … · B b – es – as – des – ges …</p>';
      return {
        ok, explain,
        solution: (el) => {
          el.append(h('p', { class: 'staff-cap' }, `Lösung: ${KN(k, m)}`));
          const b = h('div', { style: { maxWidth: '300px' } });
          el.append(b);
          renderKeySignature(b, k, m);
        },
      };
    },
  };
}

// --- Quintenzirkel ergänzen ---
function circleTask() {
  const all = Array.from({ length: 12 }, (_, i) => i).filter((i) => T.CURRICULUM_FIFTHS.includes(i <= 6 ? i : i - 12) && i !== 0);
  const hiddenIdx = T.shuffle(all).slice(0, 3);
  const hidden = hiddenIdx.map((index) => ({ index, ring: Math.random() < 0.6 ? 'dur' : 'moll' }));
  const data = T.circleOfFifths();
  const answer = (hd) => (hd.ring === 'dur' ? durLabel(data[hd.index]) : mollLabel(data[hd.index]));
  const filled = {};
  let current = 0;
  let circle, info, optsEl;
  const distractPool = data.filter((e, i) => !hiddenIdx.includes(i) && e.inCurriculum);
  const options = T.shuffle([...hidden.map(answer), ...pickN(distractPool, 3).map((e) => (Math.random() < 0.5 ? durLabel(e) : mollLabel(e)))]
    .filter((v, i, a) => a.indexOf(v) === i));
  function refresh(ctx) {
    const hd = hidden[current];
    info.textContent = `Feld ${current + 1} von ${hidden.length}: ${hd.ring === 'dur' ? 'Dur-Tonart (außen)' : 'Moll-Tonart (innen)'} – wähle unten.`;
    circle.seg(hd.index).classList.add('is-sel');
    hidden.forEach((x, i) => i !== current && circle.seg(x.index).classList.remove('is-sel'));
    ctx.setReady(Object.keys(filled).length === hidden.length);
  }
  return {
    kind: 'Quintenzirkel',
    title: 'Ergänze den Quintenzirkel.',
    hint: 'Tippe ein Feld mit „?“ an und wähle dann den passenden Namen.',
    render(body, ctx) {
      circle = createCircle(body, {
        hidden,
        onSelect: (e, i) => {
          const hi = hidden.findIndex((x) => x.index === i);
          if (hi >= 0) { current = hi; refresh(ctx); }
        },
      });
      info = h('p', { class: 'task__hint', 'aria-live': 'polite' });
      optsEl = h('div', { class: 'opts opts--2' });
      options.forEach((o) => optsEl.append(h('button', {
        class: 'opt', type: 'button',
        onclick: () => {
          const hd = hidden[current];
          filled[current] = o;
          circle.setText(hd.index, hd.ring, o);
          const nextOpen = hidden.findIndex((_, i) => !(i in filled));
          if (nextOpen >= 0) current = nextOpen;
          refresh(ctx);
        },
      }, o)));
      body.append(info, optsEl);
      refresh(ctx);
    },
    check() {
      const ok = hidden.every((hd, i) => filled[i] === answer(hd));
      return {
        ok,
        explain: '<p>' + hidden.map((hd, i) => `${filled[i] === answer(hd) ? '✓' : '✗'} ${hd.ring === 'dur' ? 'Dur' : 'Moll'} mit ${Math.abs(data[hd.index].fifths)} ${data[hd.index].fifths > 0 ? '♯' : '♭'}: <strong>${answer(hd)}</strong>${filled[i] === answer(hd) ? '' : ` (du: ${filled[i]})`}`).join('<br>') + '</p>'
          + '<p>Im Uhrzeigersinn: eine Quinte höher, ein Kreuz mehr. Gegen den Uhrzeigersinn: eine Quinte tiefer, ein B mehr.</p>',
      };
    },
  };
}

// --- Pentatonik ---
function pentaTask() {
  const k = T.pick([DUR[0], DUR[1], DUR[2], DUR[4]]);
  const s = T.scale({ ...k, octave: 4 }, 'dur');
  const pick = (degs) => degs.map((d) => nm(s[d - 1])).join(' – ');
  const corr = pick([1, 2, 3, 5, 6]);
  const wrong = [pick([1, 2, 3, 4, 5]), pick([1, 3, 4, 5, 7]), pick([1, 2, 4, 5, 6])];
  return mc({
    kind: 'Pentatonik',
    title: `Welche Töne bilden die ${T.capitalize(nm(k))}-Dur-Pentatonik?`,
    options: [{ label: corr, correct: true }, ...wrong.map((w) => ({ label: w }))],
    explain: `<p>Dur-Pentatonik = Dur-Tonleiter <strong>ohne 4. und 7. Stufe</strong>. Genau diese beiden Töne bilden in Dur die Halbtonschritte – deshalb hat die Pentatonik keine Halbtonschritte.</p>`,
    solution: (el) => staffWithPlay(el, T.majorPentatonic({ ...k, octave: 4 }), { ariaLabel: 'Dur-Pentatonik in Noten' }),
  });
}

// =====================================================================
// CHECK DAS – Erklärteil
// =====================================================================
function renderLearn(root) {
  const tabs = [
    ['Dur & Moll', learnDurMoll],
    ['Vorzeichen', learnKeys],
    ['Quintenzirkel', learnCircle],
    ['Pentatonik & Welt', learnWorld],
  ];
  const bar = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Themen' });
  const panel = h('div', { class: 'panel', role: 'tabpanel', id: 'learn-panel', tabindex: '0' });
  tabs.forEach(([label, fn], i) => {
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

function pills(m) {
  return h('div', { class: 'steps', 'aria-label': `Schrittmuster ${T.stepPattern(m).join(' ')}` },
    T.SCALES[m].steps.map((s, i) => h('span', { class: `step-pill ${s === 1 ? 'is-h' : ''}` }, `${i + 1}–${i + 2}`, h('br'), s === 1 ? 'H' : 'G')));
}

function learnDurMoll(p) {
  const C = DUR[0], a = MOLL[0];
  const cs = scaleAt(C, 'dur'), as = scaleAt(a, 'moll');
  p.append(
    h('h3', {}, 'Eine Treppe aus Ganz- und Halbtonschritten'),
    h('p', {}, 'Eine Tonleiter geht Stufe für Stufe von einem Grundton bis zur Oktave. Ob sie nach Dur oder Moll klingt, hängt nur davon ab, wo die Halbtonschritte (H) liegen. Alle anderen Schritte sind Ganztonschritte (G).'),
    h('h3', {}, 'Dur: Halbtonschritte bei 3–4 und 7–8'));
  staffWithPlay(p, cs, { items: withSlurs(cs, [3, 7]), ariaLabel: 'C-Dur-Tonleiter, Halbtonschritte e–f und h–c mit Bogen markiert', playLabel: 'C-Dur anhören' });
  p.append(pills('dur'),
    h('h3', {}, 'Natürliches Moll: Halbtonschritte bei 2–3 und 5–6'));
  staffWithPlay(p, as, { items: withSlurs(as, [2, 5]), ariaLabel: 'a-Moll-Tonleiter, Halbtonschritte h–c und e–f mit Bogen markiert', playLabel: 'a-Moll anhören' });
  p.append(pills('moll'),
    h('div', { class: 'callout' }, h('strong', {}, 'Parallele Tonarten. '),
      'C-Dur und a-Moll benutzen genau dieselben Töne – nur der Grundton ist ein anderer. Die parallele Molltonart beginnt auf der 6. Stufe der Dur-Tonleiter, also eine kleine Terz (3 Halbtöne) unter dem Dur-Grundton.'),
    h('h3', {}, 'Hör den Unterschied'),
    h('p', {}, 'Gleicher Grundton, anderes Muster: Vergleich C-Dur mit c-Moll.'));
  const cm = scaleAt(MOLL[6], 'moll');
  p.append(h('div', { class: 'btn-row' },
    playButton('C-Dur', () => A.playMelody(cs.map(T.midi), { tempo: 120 })),
    playButton('c-Moll', () => A.playMelody(cm.map(T.midi), { tempo: 120 }))),
  h('p', { class: 'muted small' }, 'Neben dem natürlichen Moll gibt es noch harmonisches und melodisches Moll – die kommen später.'));
}

function learnKeys(p) {
  const G = DUR[1];
  const gs = scaleAt(G, 'dur');
  p.append(
    h('h3', {}, 'Warum Vorzeichen?'),
    h('p', {}, 'Wenn du das Dur-Muster G G H G G G H auf g startest, brauchst du auf der 7. Stufe fis statt f – sonst wäre der Schritt von e nach f ein Halbton und f nach g ein Ganzton. Falsche Reihenfolge!'));
  staffWithPlay(p, gs, { items: withSlurs(gs, [3, 7]), ariaLabel: 'G-Dur mit Kreuz vor dem f', playLabel: 'G-Dur anhören' });
  p.append(h('p', {}, 'Damit man das Kreuz nicht vor jedes f schreiben muss, steht es als Generalvorzeichen am Anfang jeder Zeile. Es gilt dann für alle f in allen Oktaven:'));
  staffWithPlay(p, gs, { tonic: G, mode: 'dur', withKey: true, ariaLabel: 'G-Dur mit Generalvorzeichen fis', playLabel: 'Anhören' });

  // Tonarten-Explorer
  p.append(h('h3', {}, 'Deine Tonarten für Jahrgang 7'),
    h('p', { class: 'muted small' }, 'Tippe eine Tonart an. Mit dem Schalter siehst du sie im Violin- oder Bassschlüssel.'));
  const chips = h('div', { class: 'toggles', style: { gridTemplateColumns: 'repeat(7, 1fr)' }, role: 'group', 'aria-label': 'Tonart wählen' });
  const modeChips = h('div', { class: 'btn-row' });
  const out = h('div', {});
  let sel = 0, mode = 'dur', clef = 'treble';
  function draw() {
    [...chips.children].forEach((b, i) => {
      b.setAttribute('aria-pressed', String(i === sel));
      b.firstChild.textContent = mode === 'dur' ? T.capitalize(nm(DUR[i])) : nm(MOLL[i]);
    });
    [...modeChips.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === mode || b.dataset.c === clef)));
    out.innerHTML = '';
    const k = mode === 'dur' ? DUR[sel] : MOLL[sel];
    const s = scaleAt(k, mode, clef);
    const sig = T.keySignature(k, mode);
    out.append(h('p', {}, h('strong', {}, KN(k, mode)), ` · Generalvorzeichen: ${sig.map(nm).join(', ') || 'keine'} · parallel: ${mode === 'dur' ? KN(MOLL[sel], 'moll') : KN(DUR[sel], 'dur')}`));
    staffWithPlay(out, s, { items: withSlurs(s, T.halfStepDegrees(mode)), tonic: k, mode, withKey: true, clef, ariaLabel: `${KN(k, mode)} mit Generalvorzeichen` });
    out.append(h('p', { class: 'staff-cap' }, listNames(s)));
  }
  DUR.forEach((k, i) => chips.append(h('button', { class: 'toggle', type: 'button', onclick: () => { sel = i; draw(); } }, h('span', {}, ''), h('small', {}, (() => { const f = T.CURRICULUM_FIFTHS[i]; return f === 0 ? '0' : f > 0 ? `${f}♯` : `${-f}♭`; })()))));
  const mbtn = (label, attrs, fn) => h('button', { class: 'tab', type: 'button', ...attrs, onclick: fn }, label);
  modeChips.append(
    mbtn('Dur', { 'data-v': 'dur' }, () => { mode = 'dur'; draw(); }),
    mbtn('Moll', { 'data-v': 'moll' }, () => { mode = 'moll'; draw(); }),
    mbtn('Violin', { 'data-c': 'treble' }, () => { clef = 'treble'; draw(); }),
    mbtn('Bass', { 'data-c': 'bass' }, () => { clef = 'bass'; draw(); }));
  modeChips.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  p.append(modeChips, chips, out);
  // aria-pressed für Tabs optisch wie aria-selected
  modeChips.addEventListener('click', () => modeChips.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', b.getAttribute('aria-pressed'))));
  draw();
  modeChips.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', b.getAttribute('aria-pressed')));

  p.append(
    h('div', { class: 'callout' }, h('strong', {}, 'Reihenfolge merken. '),
      'Kreuze kommen immer in dieser Folge: fis – cis – gis – dis – ais … B immer so: b – es – as – des – ges … (das ist die Kreuz-Reihe rückwärts).'),
    h('div', { class: 'callout' }, h('strong', {}, 'Tonart erkennen. '),
      'Kreuz-Tonarten: letztes Kreuz + Halbton aufwärts = Dur-Grundton (fis, cis → d → D-Dur). B-Tonarten: das vorletzte B ist der Grundton (b, es, as → Es-Dur). F-Dur (1 B) einfach merken.'),
    h('div', { class: 'callout callout--warn' }, h('strong', {}, 'b oder h? '),
      'Im Deutschen heißt der Ton ohne Vorzeichen h, mit ♭ heißt er b. Darum sagen wir B-Dur – international heißt das „B♭ major“.'));
}

function learnCircle(p) {
  p.append(h('h3', {}, 'Der Quintenzirkel'),
    h('p', {}, 'Er ordnet alle Tonarten nach ihren Vorzeichen. Im Uhrzeigersinn geht es jeweils eine Quinte nach oben, und es kommt ein Kreuz dazu. Gegen den Uhrzeigersinn geht es eine Quinte nach unten, und es kommt ein B dazu. Außen stehen die Dur-Tonarten, innen ihre parallelen Moll-Tonarten.'),
    h('p', { class: 'muted small' }, 'Hervorgehoben: deine Tonarten für Jahrgang 7. Tippe ein Feld an.'));
  const info = h('div', { 'aria-live': 'polite' });
  createCircle(p, {
    dimOutside: true,
    onSelect: (e) => {
      info.innerHTML = '';
      const sig = e.fifths === 0 ? 'keine Vorzeichen' : `${Math.abs(e.fifths)} ${e.fifths > 0 ? 'Kreuz' + (e.fifths > 1 ? 'e' : '') : 'B'}`;
      info.append(h('p', {}, h('strong', {}, `${durLabel(e)}-Dur · ${mollLabel(e)}-Moll`), ` – ${sig}`));
      const box = h('div', { style: { maxWidth: '300px' } });
      info.append(box);
      renderKeySignature(box, e.dur, 'dur');
      const s = T.scale({ ...e.dur, octave: 4 }, 'dur');
      const sm = T.scale({ ...e.moll, octave: 4 }, 'moll');
      info.append(h('div', { class: 'btn-row' },
        playButton(`${durLabel(e).split('/')[0]}-Dur`, () => A.playMelody(s.map(T.midi), { tempo: 130 })),
        playButton(`${mollLabel(e).split('/')[0]}-Moll`, () => A.playMelody(sm.map(T.midi), { tempo: 130 }))));
      if (e.durAlt) info.append(h('p', { class: 'muted small' }, 'Fis-Dur (6 ♯) und Ges-Dur (6 ♭) klingen gleich – enharmonische Verwechslung.'));
    },
  });
  p.append(info);
}

function learnWorld(p) {
  const c = { step: 0, alter: 0, octave: 4 };
  const penta = T.majorPentatonic(c);
  p.append(h('h3', {}, 'Pentatonik: fünf Töne für die ganze Welt'),
    h('p', {}, 'Lass in der Dur-Tonleiter die 4. und 7. Stufe weg. Dann bleibt die Dur-Pentatonik übrig: fünf Töne ohne Halbtonschritte. Darum klingt fast jede Tonkombination daraus gut, und das macht sie perfekt zum Improvisieren.'));
  staffWithPlay(p, penta, { ariaLabel: 'C-Dur-Pentatonik: c d e g a c', playLabel: 'C-Dur-Pentatonik' });
  p.append(h('p', {}, 'Probier es aus: Die schwarzen Tasten allein ergeben eine Pentatonik (Fis-/Ges-Dur-Pentatonik). Spiel irgendwas nur auf Schwarz.'));
  const kw = h('div', { class: 'kbd-wrap' });
  p.append(kw);
  const kb = createKeyboard(kw, { from: 60, to: 83 });
  [61, 63, 66, 68, 70, 73, 75, 78, 80, 82].forEach((mm) => kb.mark(mm, 'is-hint'));
  p.append(h('div', { class: 'callout' }, h('strong', {}, 'Wo kommt sie vor? '),
    'Fünftönige Skalen gibt es in vielen Musikkulturen, zum Beispiel in Teilen Westafrikas, in Ostasien, im Blues, im Rock und Pop. Gitarrensoli nutzen oft die Moll-Pentatonik. Achtung: Nicht jede Musik dieser Regionen ist pentatonisch. Westafrikanische Instrumente wie die Kora werden auch siebentönig gestimmt.'));

  // Gamelan
  p.append(h('h3', {}, 'Gamelan: Slendro und Pelog'),
    h('p', {}, 'Ein Gamelan ist ein Orchester aus Gongs und Metallophonen aus Indonesien (Java, Bali). Es gibt zwei Tonsysteme: Slendro hat fünf Töne in etwa gleich großen Schritten. Pelog hat sieben Töne mit großen und kleinen Schritten.'),
    h('div', { class: 'callout callout--warn' }, h('strong', {}, 'Wichtig: '),
      'Slendro und Pelog passen nicht in unser System aus Ganz- und Halbtönen. Jedes Gamelan ist individuell gestimmt, und die Instrumente eines Ensembles gehören fest zusammen. Deshalb gibt es hier kein Notenbild. Die Klänge unten sind nur eine Annäherung an ein mögliches Beispiel, keine Originalaufnahme.'));
  const base = 280;
  const slendro = [0, 240, 480, 720, 960, 1200];
  const pelog = [0, 120, 270, 540, 670, 785, 950, 1200];
  const cents = (arr) => arr.map((c2) => base * Math.pow(2, c2 / 1200));
  p.append(h('div', { class: 'btn-row' },
    playButton('Slendro (Annäherung)', () => A.playBellSequence(cents(slendro))),
    playButton('Pelog (Annäherung)', () => A.playBellSequence(cents(pelog))),
    playButton('Zum Vergleich: Dur-Pentatonik', () => A.playMelody(penta.map(T.midi), { tempo: 110 }))),
  h('p', { class: 'muted small' }, 'Annäherung: Slendro mit 5 gleichen Schritten von je etwa 240 Cent, Pelog nach einem Beispiel aus der Literatur. Zum Vergleich: Ein Halbton hat 100 Cent.'));

  // Raga
  const bhupali = T.majorPentatonic(c);
  p.append(h('h3', {}, 'Indien: die Idee des Raga'),
    h('p', {}, 'Ein Raga ist mehr als eine Tonleiter. Er legt fest, welche Töne vorkommen, wie man auf- und absteigt, welche Töne wichtig sind und welche Wendungen typisch sind. Oft gehört auch eine Stimmung oder Tageszeit dazu. Dazu klingt ein Bordun, meist von der Tanpura, mit Grundton (Sa) und Quinte (Pa).'),
    h('p', {}, 'Spannend: Der Raga Bhupali benutzt dieselben fünf Stufen wie unsere Dur-Pentatonik: Sa Re Ga Pa Dha.'),
    h('div', { class: 'callout callout--warn' }, h('strong', {}, 'Annäherung: '),
      'In indischer Musik werden Töne oft anders intoniert und mit Gleittönen (Gamakas) verziert. Das Beispiel hier ist gleichstufig gestimmt und stark vereinfacht.'),
    h('div', { class: 'btn-row' },
      playButton('Bordun + Bhupali (Annäherung)', () => {
        A.playDrone(T.midi(c) >= 0 ? 130.81 : 130.81, 9);
        const asc = [...bhupali, ...bhupali.slice(0, -1).reverse()];
        setTimeout(() => A.playSequence(asc.map((pp, i) => ({ midi: T.midi(pp), beat: i * 0.9, beats: 0.9 })), { tempo: 80 }), 900);
      })));
}

// =====================================================================
// FAKTEN („Wusstest du?“)
// =====================================================================
const facts = [
  { id: 'm4-gamelan', title: 'Ein Gamelan gehört zusammen', text: 'Die Instrumente eines Gamelan werden gemeinsam gebaut und aufeinander gestimmt. Ein Gong aus einem anderen Gamelan passt meist nicht dazu, weil jedes Ensemble seine eigene Stimmung hat.' },
  { id: 'm4-bhupali', title: 'Pentatonik in Indien', text: 'Der Raga Bhupali benutzt fünf Töne, die unserer Dur-Pentatonik entsprechen: Sa Re Ga Pa Dha. Gesungen wird er traditionell am Abend.' },
  { id: 'm4-kora', title: 'Die Kora wird umgestimmt', text: 'Die Kora ist eine Stegharfe mit 21 Saiten aus Westafrika (Mande-Kultur). Je nach Stück stimmen die Musikerinnen und Musiker sie in verschiedene siebentönige Stimmungen, zum Beispiel Hardino oder Sauta.' },
  { id: 'm4-solmisation', title: 'Do Re Mi ist fast 1000 Jahre alt', text: 'Um das Jahr 1000 benutzte der Mönch Guido von Arezzo die Anfangssilben eines lateinischen Hymnus (ut, re, mi, fa, sol, la) als Namen für Tonstufen. Daraus wurde unser Do Re Mi.' },
  { id: 'm4-blues', title: 'Pentatonik im Gitarrensolo', text: 'Viele Rock- und Bluessoli beruhen auf der Moll-Pentatonik. Auf der Gitarre liegt sie als einfaches „Kästchen“-Muster unter den Fingern. Deshalb lernen sie viele als Erstes.' },
  { id: 'm4-quintenzirkel', title: 'Der Quintenzirkel ist über 300 Jahre alt', text: 'Schon um 1700 beschrieben Musiktheoretiker wie Johann David Heinichen in Deutschland einen „Musicalischen Circul“ aller Tonarten.' },
];

// =====================================================================
export default {
  id: 'tonleitern',
  num: 4,
  title: 'Tonleitern',
  short: 'Dur, Moll, Vorzeichen, Pentatonik',
  color: '--c4',
  motif: 'scale',
  ready: true,
  renderLearn,
  levelInfo: {
    hop: 'Halbtonschritte finden, C-, G- und F-Dur bauen, Dur und Moll hören.',
    step: 'Alle Tonarten bis 3 Vorzeichen, Moll, Generalvorzeichen lesen, Paralleltonarten.',
    jump: 'Quintenzirkel, Generalvorzeichen setzen, Fehler finden, Bassschlüssel, Pentatonik.',
  },
  generators: {
    hop: [markHalfSteps, buildOnKeyboard, blocksTask, hearTask, degreeTask, ruleTask],
    step: [buildOnKeyboard, fixTask, readKeyTask, parallelTask, markHalfSteps, blocksTask, hearTask, degreeTask],
    jump: [circleTask, buildKeyTask, hearTask, fixTask, readKeyTask, markHalfSteps, pentaTask, buildOnKeyboard],
  },
  speedGenerators: [degreeTask, () => readKeyTask('step'), parallelTask, ruleTask, pentaTask],
  facts,
};

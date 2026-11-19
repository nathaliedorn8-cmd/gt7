// =====================================================================
// Modul 3 – Halbton, Ganzton & Vorzeichen (deutsche Tonnamen, Enharmonik)
// =====================================================================
import * as T from '../core/theory.js';
import * as A from '../core/audio.js';
import { renderPitches, renderAbc } from '../ui/notation.js';
import { createKeyboard } from '../ui/keyboard.js';
import { h, icon, playButton } from '../ui/dom.js';
import { mc, learnTabs, staffWithPlay, playOn, callout, nm, cap } from './common.js';

const P = (s, a = 0, o = 4) => ({ step: s, alter: a, octave: o });
const NO = T.germanNameOctave;
/** Tonnamen mit Oktavangabe nur bei Bedarf */
const nameO = (p) => NO(p);

// Töne im Umfang c¹–h¹ (Hop: Stammtöne; Step und Jump: + ein Vorzeichen auf schwarzen Tasten)
const NATURALS = [0, 1, 2, 3, 4, 5, 6].map((s) => P(s));
const COMMON = [P(0, 1), P(1, -1), P(1, 1), P(2, -1), P(3, 1), P(4, -1), P(4, 1), P(5, -1), P(5, 1), P(6, -1)];
const RARE = [P(2, 1), P(6, 1, 4), P(0, -1, 4), P(3, -1)];
function pool(level) {
  if (level === 'hop') return NATURALS;
  if (level === 'step') return [...NATURALS, ...COMMON];
  return [...NATURALS, ...COMMON];
}
const midiName = {
  0: ['c'], 1: ['cis', 'des'], 2: ['d'], 3: ['dis', 'es'], 4: ['e'], 5: ['f'], 6: ['fis', 'ges'], 7: ['g'], 8: ['gis', 'as'], 9: ['a'], 10: ['ais', 'b'], 11: ['h'],
};
const keyLabel = (m) => midiName[m % 12].join(' / ');

function hearTwo(a, b, tempo = 90) {
  A.playMelody([T.midi(a), T.midi(b)], { tempo });
}

// =====================================================================
// AUFGABEN
// =====================================================================

// --- Halbton oder Ganzton auf der Klaviatur ---
function htGtKeys(level) {
  const ht = Math.random() < 0.5;
  // Hop: nur weiße Tasten (e–f, h–c als Halbton-Fallen), sonst beliebig
  let a, b;
  if (level === 'hop') {
    const pairs = ht ? [[64, 65], [71, 72]] : [[60, 62], [62, 64], [65, 67], [67, 69], [69, 71]];
    [a, b] = T.pick(pairs);
  } else {
    a = 60 + T.rand(20);
    b = a + (ht ? 1 : 2);
  }
  let kb;
  return mc({
    kind: 'Klaviatur',
    title: 'Halbton- oder Ganztonschritt?',
    hint: 'Schau, ob zwischen den beiden markierten Tasten noch eine andere Taste liegt.',
    pre: (body) => {
      const w = h('div', { class: 'kbd-wrap' });
      body.append(w);
      kb = createKeyboard(w, { from: 60, to: 83 });
      kb.mark(a, 'is-sel'); kb.mark(b, 'is-sel');
      body.append(h('div', { class: 'btn-row' }, playButton('Anhören', () => A.playMelody([a, b], { tempo: 90 }))));
    },
    options: [{ label: 'Halbtonschritt', correct: ht }, { label: 'Ganztonschritt', correct: !ht }],
    cols: true,
    explain: ht
      ? `<p><strong>Halbtonschritt</strong>: ${keyLabel(a)} und ${keyLabel(b)} sind direkte Nachbartasten – keine Taste dazwischen.${level === 'hop' ? ' Merke: e–f und h–c sind Halbtöne, obwohl beide Tasten weiß sind.' : ''}</p>`
      : `<p><strong>Ganztonschritt</strong>: Zwischen ${keyLabel(a)} und ${keyLabel(b)} liegt noch genau eine Taste (${keyLabel(a + 1)}). Ganzton = 2 Halbtöne.</p>`,
  });
}

// --- Taste finden ---
function findKey(level) {
  const p = T.pick(pool(level === 'jump' ? 'step' : level));
  const oct = Math.random() < 0.5 ? 4 : 5;
  const target = { ...p, octave: oct };
  const m = T.midi(target);
  let chosen = null;
  let kb;
  return {
    kind: 'Klaviatur',
    title: `Tippe auf ${nameO(target)}.`,
    hint: oct === 4 ? 'c¹ ist die erste Taste links (eingestrichene Oktave).' : 'Zweigestrichene Oktave: c² bis h², die rechte Hälfte.',
    render(body, ctx) {
      const w = h('div', { class: 'kbd-wrap' });
      body.append(w);
      kb = createKeyboard(w, {
        from: 60, to: 83,
        onKey: (k) => { if (chosen !== null) kb.mark(chosen, 'is-sel', false); chosen = k; kb.mark(k, 'is-sel'); ctx.setReady(true); },
      });
    },
    check() {
      const ok = chosen === m;
      kb.clearMarks('is-sel');
      kb.mark(m, 'is-ok');
      if (!ok) kb.mark(chosen, 'is-bad');
      let why = '';
      if (target.alter === 1) why = `${cap(nm(target))} ist ${nm({ ...target, alter: 0 })} mit Kreuz: einen Halbton höher als ${nm({ ...target, alter: 0 })}.`;
      else if (target.alter === -1) why = `${cap(nm(target))} ist ${nm({ ...target, alter: 0 })} mit B: einen Halbton tiefer als ${nm({ ...target, alter: 0 })}.`;
      else why = `${cap(nm(target))} ist eine weiße Taste.`;
      if (!ok && Math.floor(chosen / 12) !== Math.floor(m / 12) && chosen % 12 === m % 12) why += ' Du hattest den richtigen Ton, aber in der falschen Oktave.';
      return { ok, explain: `<p>${why}</p>` };
    },
  };
}

// --- Taste benennen ---
function nameKey(level) {
  const p = T.pick(level === 'hop' ? NATURALS : COMMON);
  const m = T.midi(p) + (Math.random() < 0.5 ? 0 : 12);
  const correct = midiName[m % 12];
  const all = Object.values(midiName).flat();
  const wrong = T.shuffle(all.filter((x) => !correct.includes(x))).slice(0, 3);
  const label = correct.length > 1 ? correct.join(' oder ') : correct[0];
  return mc({
    kind: 'Klaviatur',
    title: 'Wie heißt die markierte Taste?',
    pre: (body) => {
      const w = h('div', { class: 'kbd-wrap' });
      body.append(w);
      const kb = createKeyboard(w, { from: 60, to: 83 });
      kb.mark(m, 'is-sel');
    },
    options: [{ label, correct: true }, ...wrong.map((x) => ({ label: x }))],
    cols: true,
    explain: correct.length > 1
      ? `<p>Die schwarze Taste hat zwei Namen: <strong>${correct[0]}</strong> (Kreuz: von unten erhöht) und <strong>${correct[1]}</strong> (B: von oben erniedrigt).</p>`
      : `<p>Das ist <strong>${correct[0]}</strong>. Orientierung: c liegt immer links neben der Zweiergruppe der schwarzen Tasten, f links neben der Dreiergruppe.</p>`,
  });
}

// --- Note im Notensystem benennen ---
function nameNote(level) {
  const clef = 'treble';
  const base = T.pick(pool(level));
  const octave = clef === 'bass' ? (base.step >= 5 ? 2 : 3) : (Math.random() < 0.3 && base.step <= 4 ? 5 : 4);
  const p = { ...base, octave };
  const correct = nm(p);
  const near = [nm({ ...p, alter: 0 }), nm({ ...p, alter: p.alter === 0 ? 1 : 0 }), nm({ ...p, alter: p.alter === -1 ? 1 : -1 }), nm({ step: (p.step + 1) % 7, alter: p.alter }), nm({ step: (p.step + 6) % 7, alter: p.alter })];
  if (p.step === 6 && p.alter === 0) near.unshift('b');
  if (p.step === 6 && p.alter === -1) near.unshift('h');
  const wrong = [...new Set(near.filter((x) => x !== correct))].slice(0, 3);
  let explain = `<p>Das ist <strong>${correct}</strong> (${NO(p)}).`;
  if (p.alter === 1) explain += ` Ein Kreuz (♯) erhöht um einen Halbton: Man hängt „-is“ an.`;
  if (p.alter === -1) explain += ` Ein B (♭) erniedrigt um einen Halbton: Man hängt „-es“ an – Ausnahmen: e → es, a → as, h → b.`;
  if (p.step === 6 && p.alter === 0) explain += ' Achtung: Im Deutschen heißt dieser Ton h, nicht b.';
  if (clef === 'bass') explain += ' Bassschlüssel: Die Linie zwischen den beiden Punkten ist das kleine f.';
  explain += '</p>';
  return mc({
    kind: clef === 'bass' ? 'Bassschlüssel' : 'Notenbild',
    title: 'Wie heißt dieser Ton?',
    pre: (body) => staffWithPlay(body, [p], { clef, staffwidth: 170, ariaLabel: `Ein Ton im ${clef === 'bass' ? 'Bass' : 'Violin'}schlüssel` }),
    options: [{ label: correct, correct: true }, ...wrong.map((x) => ({ label: x }))],
    cols: true,
    explain,
  });
}

// --- Schritt von einem Ton aus ---
function stepFrom(level) {
  const up = level === 'hop' ? true : Math.random() < 0.6;
  const ht = Math.random() < 0.5;
  const start = T.pick(level === 'hop' ? NATURALS : pool('step'));
  const semis = ht ? 1 : 2;
  // Halbton aufwärts: diatonisch (nächster Buchstabe) bevorzugt, wenn Hop; sonst Klangname zählt
  const targetMidi = T.midi(start) + (up ? semis : -semis);
  const correct = midiName[((targetMidi % 12) + 12) % 12];
  const all = Object.values(midiName).flat();
  const wrong = T.shuffle(all.filter((x) => !correct.includes(x) && Math.abs((Object.keys(midiName).find((k) => midiName[k].includes(x)) - (targetMidi % 12) + 12) % 12) <= 3)).slice(0, 3);
  while (wrong.length < 3) { const x = T.pick(all); if (!correct.includes(x) && !wrong.includes(x)) wrong.push(x); }
  return mc({
    kind: 'Halbton & Ganzton',
    title: `Welcher Ton liegt einen ${ht ? 'Halbton' : 'Ganzton'} ${up ? 'über' : 'unter'} ${nm(start)}?`,
    hint: level === 'hop' ? 'Denk an die Klaviatur. Halbton = direkte Nachbartaste.' : '',
    pre: (body) => {
      const w = h('div', { class: 'kbd-wrap' });
      body.append(w);
      const kb = createKeyboard(w, { from: 60, to: 83 });
      kb.mark(T.midi(start) < 60 ? T.midi(start) + 12 : T.midi(start), 'is-sel');
    },
    options: [{ label: correct.join(' / '), correct: true }, ...wrong.map((x) => ({ label: x }))],
    cols: true,
    explain: `<p>${cap(nm(start))} ${up ? '+' : '−'} ${semis} Halbton${semis > 1 ? 'schritte' : ''} = <strong>${correct.join(' oder ')}</strong>.${correct.length > 1 ? ' Beide Namen meinen dieselbe Taste.' : ''}</p>`,
  });
}

// --- Gültigkeit von Vorzeichen im Takt ---
function validityTask(level) {
  const acc = level === 'jump' ? T.pick([1, -1]) : 1;
  const s = T.pick(acc === 1 ? [3, 0, 4, 1, 5] : [1, 2, 4, 5, 6]);
  const accNote = P(s, acc);
  const nat = P(s, 0);
  const other = P((s + 1) % 7, 0, s === 6 ? 5 : 4);
  const variant = T.pick(['carry', 'natural', 'bar']);
  // Folge: Ton mit Vorzeichen, anderer Ton, gleicher Stammton …
  let items, ask, answer, why;
  if (variant === 'carry') {
    items = [accNote, other, { ...accNote, hideAccidental: true }];
    ask = 3; answer = accNote;
    why = 'Ein Vorzeichen gilt bis zum Ende des Takts für alle Noten auf derselben Linie oder im selben Zwischenraum.';
  } else if (variant === 'natural') {
    items = [accNote, other, nat];
    ask = 3; answer = nat;
    why = 'Das Auflösungszeichen ♮ hebt das Vorzeichen auf – der Ton ist wieder ein Stammton.';
  } else {
    items = [accNote, other, '|', { ...nat }];
    ask = 3; answer = nat;
    why = 'Nach dem Taktstrich gilt das Vorzeichen nicht mehr.';
  }
  const answerName = nm(answer);
  const wrong = [nm(answer.alter === 0 ? accNote : nat), nm(other), nm({ ...nat, alter: -acc })].filter((x) => x !== answerName);
  return mc({
    kind: 'Vorzeichen',
    title: `Wie heißt die Note Nummer ${ask}?`,
    hint: 'Schau genau: Wo stehen Vorzeichen, Auflösungszeichen und Taktstriche?',
    pre: (body) => {
      const box = h('div', {});
      body.append(box);
      const { body: abcBody } = T.abcNotes(items.map((x) => (x === '|' ? '|' : { pitch: x, len: '' })));
      const api = renderAbc(box, T.abcTune({ body: abcBody + ' |]', unit: '1/4' }), { ariaLabel: 'Drei Noten' });
      api.mark(2, 'is-sel');
      body.append(h('div', { class: 'btn-row' }, playButton('Anhören', () => playOn(api, items.filter((x) => x !== '|').map((x) => ({ ...x, hideAccidental: undefined })), 100))));
    },
    options: [{ label: answerName, correct: true }, ...[...new Set(wrong)].slice(0, 3).map((x) => ({ label: x }))],
    cols: true,
    explain: `<p>Note 3 ist <strong>${answerName}</strong>. ${why}</p>`,
  });
}

// --- Enharmonik ---
function enharmonicTask() {
  const pairs = [[P(3, 1), P(4, -1)], [P(0, 1), P(1, -1)], [P(1, 1), P(2, -1)], [P(4, 1), P(5, -1)], [P(5, 1), P(6, -1)]];
  const [a, b] = T.shuffle(T.pick(pairs));
  const correct = nm(b);
  const wrong = [nm({ ...b, alter: b.alter + (b.alter >= 0 ? -1 : 1) }), nm({ step: (a.step + 2) % 7, alter: 0 }), nm({ ...a, alter: 0 })].filter((x) => x !== correct && x !== nm(a));
  return mc({
    kind: 'Enharmonik',
    title: `Welcher Ton klingt genauso wie ${nm(a)}?`,
    hint: 'Gleiche Taste, anderer Name: enharmonische Verwechslung.',
    pre: (body) => {
      const w = h('div', { class: 'kbd-wrap' });
      body.append(w);
      createKeyboard(w, { from: 60, to: 83, labels: false });
    },
    options: [{ label: correct, correct: true }, ...[...new Set(wrong)].slice(0, 3).map((x) => ({ label: x }))],
    cols: true,
    explain: `<p><strong>${nm(a)}</strong> und <strong>${correct}</strong> liegen auf derselben Taste. ${a.alter === 0 || b.alter === 0 ? 'Zwischen e–f und h–c gibt es keine schwarze Taste – darum ist eis = f, his = c, fes = e und ces = h.' : 'Kreuz-Name von unten, B-Name von oben.'}</p>`,
    solution: (el) => {
      el.append(h('p', { class: 'staff-cap' }, 'Beide Schreibweisen im Notenbild:'));
      // Oktave des zweiten Tons so wählen, dass beide wirklich gleich klingen
      const a4 = { ...a, octave: 4 };
      const b4 = { ...b, octave: 4 + (T.midi(a4) - T.midi({ ...b, octave: 4 })) / 12 };
      staffWithPlay(el, [a4, b4], { staffwidth: 200, ariaLabel: 'Zwei enharmonisch gleiche Töne' });
    },
  });
}

// --- Vorzeichen setzen (Notenbild) ---
function setAccidental(level) {
  const target = T.pick(COMMON);
  const p = { ...target, octave: target.octave ?? 4 };
  let alter = 0;
  let box, api;
  const draw = () => { api = renderPitches(box, [{ ...p, alter, forceAccidental: alter !== 0 }], { staffwidth: 170, ariaLabel: `Ton ${nm({ ...p, alter })}` }); };
  const accBtn = (val, sym, txt) => {
    const b = h('button', { class: 'btn', type: 'button', 'aria-pressed': String(val === 0), 'aria-label': `${txt} setzen` },
      h('span', { class: 'acc-sym', 'aria-hidden': 'true' }, sym), h('span', { class: 'acc-txt' }, txt));
    return b;
  };
  return {
    kind: 'Notenbild',
    title: `Mach aus dieser Note ${nm(p)}.`,
    hint: 'Wähle das passende Vorzeichen.',
    render(body, ctx) {
      box = h('div', {});
      body.append(box);
      draw();
      const row = h('div', { class: 'acc-row', role: 'group', 'aria-label': 'Vorzeichen' });
      const opts = [[1, '♯', 'Kreuz'], [-1, '♭', 'B'], [0, '♮', 'ohne']];
      const btns = opts.map(([v, s, t]) => {
        const b = accBtn(v, s, t);
        b.addEventListener('click', () => { alter = v; btns.forEach((x, i) => x.setAttribute('aria-pressed', String(opts[i][0] === v))); draw(); ctx.setReady(true); A.playNote(T.midi({ ...p, alter: v }), { dur: 0.8 }); });
        return b;
      });
      row.append(...btns);
      body.append(row);
    },
    check() {
      const ok = alter === p.alter;
      if (!ok) api.mark(0, 'is-wrong');
      return {
        ok,
        explain: `<p>${cap(nm(p))} = ${nm({ ...p, alter: 0 })} ${p.alter > 0 ? '+ Kreuz (♯)' : '+ B (♭)'}. ${p.alter > 0 ? 'Endung „-is“ heißt Kreuz.' : 'Endung „-es“/„-s“ (oder b) heißt B.'}${ok ? '' : ` Du hast ${nm({ ...p, alter })} geschrieben.`}</p>`,
        solution: (el) => staffWithPlay(el, [p], { staffwidth: 170, ariaLabel: `Lösung ${nm(p)}`, playLabel: 'Lösung anhören' }),
      };
    },
  };
}

// --- Fehlersuche bei Tonnamen ---
function errorNames(level) {
  const src = T.shuffle(pool(level === 'hop' ? 'step' : level)).slice(0, 5).map((p) => ({ ...p, octave: p.octave ?? 4 }));
  const bad = T.rand(5);
  const shown = src.map((p, i) => {
    if (i !== bad) return nm(p);
    // typische Fehler: h/b, es/eis, Endungs-Fehler
    const swaps = { h: 'b', b: 'h', es: 'eis', as: 'ais', fis: 'fes', cis: 'ces', des: 'dis', ges: 'gis' };
    return swaps[nm(p)] || nm({ ...p, alter: p.alter === 0 ? 1 : 0 });
  });
  let chosen = null;
  let btns, api;
  return {
    kind: 'Fehlersuche',
    title: 'Ein Tonname unter den Noten ist falsch. Welcher?',
    render(body, ctx) {
      const box = h('div', {});
      body.append(box);
      api = renderPitches(box, src, { ariaLabel: 'Fünf Töne mit Namen darunter', items: src.map((p, i) => ({ pitch: { ...p, forceAccidental: p.alter !== 0 }, post: '', pre: `"_${shown[i]}"` })) });
      const wrap = h('div', { class: 'toggles', style: { gridTemplateColumns: 'repeat(5, 1fr)' }, role: 'group', 'aria-label': 'Name wählen' });
      btns = shown.map((s, i) => h('button', { class: 'toggle', type: 'button', 'aria-pressed': 'false', onclick: () => { chosen = i; btns.forEach((x, j) => x.setAttribute('aria-pressed', String(j === i))); ctx.setReady(true); } }, s));
      wrap.append(...btns);
      body.append(wrap, h('div', { class: 'btn-row' }, playButton('Anhören', () => playOn(api, src, 100))));
    },
    check() {
      const ok = chosen === bad;
      btns[bad].classList.add('is-ok');
      if (!ok) btns[chosen].classList.add('is-bad');
      api.mark(bad, 'is-wrong');
      return { ok, explain: `<p>Note ${bad + 1} heißt <strong>${nm(src[bad])}</strong>, nicht ${shown[bad]}.${nm(src[bad]) === 'h' || nm(src[bad]) === 'b' ? ' Merke: h ohne Vorzeichen, b mit ♭.' : ''}</p>` };
    },
  };
}

// --- Hören: Halbton oder Ganzton ---
function hearStep(level) {
  const ht = Math.random() < 0.5;
  const a = 55 + T.rand(15);
  const down = level === 'jump' && Math.random() < 0.5;
  const b = a + (down ? -1 : 1) * (ht ? 1 : 2);
  return mc({
    kind: 'Hören',
    title: 'Halbton- oder Ganztonschritt?',
    hint: down ? 'Diesmal geht es auch abwärts.' : 'Ein Halbton klingt sehr eng, ein Ganzton etwas weiter.',
    pre: (body) => body.append(h('div', { class: 'btn-row' }, playButton('Abspielen', () => A.playMelody([a, b], { tempo: 80 })), playButton('Zusammen', () => A.playChord([a, b])))),
    options: [{ label: 'Halbtonschritt', correct: ht }, { label: 'Ganztonschritt', correct: !ht }],
    cols: true,
    explain: `<p>Es war ein <strong>${ht ? 'Halbtonschritt' : 'Ganztonschritt'}</strong> (${keyLabel(a)} → ${keyLabel(b)}). ${ht ? 'Zusammen gespielt reibt ein Halbton stark.' : 'Ein Ganzton ist der Schritt am Anfang von „Alle meine Entchen“ (c–d).'}</p>`,
  });
}

// =====================================================================
// CHECK DAS
// =====================================================================
function renderLearn(root) {
  learnTabs(root, [
    ['Halbton & Ganzton', learnSteps],
    ['Vorzeichen', learnAcc],
    ['Enharmonik', learnEnh],
  ]);
}

function learnSteps(p) {
  p.append(h('h3', {}, 'Die Klaviatur als Landkarte'),
    h('p', {}, 'Der kleinste Abstand zwischen zwei Tönen in unserer Musik ist der Halbton: von einer Taste zur direkt benachbarten – egal ob weiß oder schwarz. Zwei Halbtöne ergeben einen Ganzton.'),
    h('p', { class: 'muted small' }, 'Tippe zwei Tasten nacheinander an – du siehst, wie weit sie auseinanderliegen.'));
  const info = h('p', { class: 'callout', 'aria-live': 'polite' }, 'Tippe eine Taste …');
  const w = h('div', { class: 'kbd-wrap' });
  p.append(w, info);
  let last = null;
  const kb = createKeyboard(w, {
    from: 60, to: 83, labels: true,
    onKey: (m) => {
      kb.clearMarks('is-sel');
      kb.mark(m, 'is-sel');
      if (last !== null && last !== m) {
        kb.mark(last, 'is-sel');
        const d = Math.abs(m - last);
        info.textContent = `${keyLabel(last)} → ${keyLabel(m)}: ${d} Halbton${d === 1 ? '' : 'schritte'}${d === 1 ? ' = Halbtonschritt' : d === 2 ? ' = Ganztonschritt' : ''}.`;
        last = null;
      } else {
        info.textContent = `${keyLabel(m)} – jetzt eine zweite Taste.`;
        last = m;
      }
    },
  });
  p.append(callout('Achtung, Falle:', 'Zwischen e–f und h–c liegt keine schwarze Taste. Diese weißen Nachbarn sind Halbtonschritte!', true),
    h('h3', {}, 'Stammtöne'),
    h('p', {}, 'Die weißen Tasten heißen Stammtöne: c d e f g a h. Danach beginnt es wieder mit c – eine Oktave höher.'));
  staffWithPlay(p, [0, 1, 2, 3, 4, 5, 6, 7].map((s) => P(s % 7, 0, s === 7 ? 5 : 4)), { ariaLabel: 'Stammtöne c¹ bis c²', playLabel: 'Stammtöne anhören', items: [0, 1, 2, 3, 4, 5, 6, 7].map((s) => ({ pitch: P(s % 7, 0, s === 7 ? 5 : 4), pre: `"_${['c¹', 'd¹', 'e¹', 'f¹', 'g¹', 'a¹', 'h¹', 'c²'][s]}"` })) });
}

function learnAcc(p) {
  p.append(h('h3', {}, 'Kreuz, B und Auflösungszeichen'),
    h('table', { class: 'key-table' },
      h('tr', {}, h('th', {}, 'Zeichen'), h('th', {}, 'Wirkung'), h('th', {}, 'Name')),
      h('tr', {}, h('td', { class: 'acc-sym' }, '♯'), h('td', {}, 'einen Halbton höher'), h('td', {}, '+ is: c → cis, f → fis')),
      h('tr', {}, h('td', { class: 'acc-sym' }, '♭'), h('td', {}, 'einen Halbton tiefer'), h('td', {}, '+ es: d → des, g → ges')),
      h('tr', {}, h('td', { class: 'acc-sym' }, '♮'), h('td', {}, 'hebt das Vorzeichen auf'), h('td', {}, 'wieder Stammton'))));
  const sharps = [P(0, 1), P(1, 1), P(3, 1), P(4, 1), P(5, 1)];
  const flats = [P(1, -1), P(2, -1), P(4, -1), P(5, -1), P(6, -1)];
  p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'Kreuz-Töne'));
  staffWithPlay(p, sharps, { items: sharps.map((x) => ({ pitch: x, pre: `"_${nm(x)}"` })), ariaLabel: 'cis dis fis gis ais' });
  p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'B-Töne'));
  staffWithPlay(p, flats, { items: flats.map((x) => ({ pitch: x, pre: `"_${nm(x)}"` })), ariaLabel: 'des es ges as b' });
  p.append(callout('Ausnahmen bei B:', 'e → es, a → as und h → b (nicht „hes“). Darum heißt der Ton zwischen a und h im Deutschen b.', true),
    h('h3', {}, 'Wie lange gilt ein Vorzeichen?'),
    h('p', {}, 'Ein Vorzeichen vor einer Note gilt bis zum Taktstrich – für alle Noten auf derselben Linie oder im selben Zwischenraum. Im nächsten Takt ist es vorbei. Mit ♮ kannst du es schon vorher aufheben.'));
  const ex = [P(3, 1), P(4), P(3, 1, 4), '|', P(3)];
  const box = h('div', {});
  p.append(box);
  const { body } = T.abcNotes(ex.map((x) => (x === '|' ? '|' : { pitch: { ...x, hideAccidental: x === ex[2] }, pre: `"_${x === ex[4] ? 'f' : nm(x)}"` })));
  renderAbc(box, T.abcTune({ body: body + ' |]', unit: '1/4' }), { ariaLabel: 'fis g fis | f' });
  p.append(h('p', { class: 'staff-cap' }, 'Takt 1: fis – g – fis (das Kreuz gilt weiter). Takt 2: wieder f.'),
    h('div', { class: 'btn-row' }, playButton('Anhören', () => A.playMelody([66, 67, 66, 65], { tempo: 100 }))));
}

function learnEnh(p) {
  p.append(h('h3', {}, 'Ein Ton, zwei Namen'),
    h('p', {}, 'Jede schwarze Taste hat zwei Namen: Von unten gesehen ist es ein Kreuz-Ton, von oben ein B-Ton. fis und ges klingen gleich – sie werden nur anders geschrieben. Das nennt man enharmonische Verwechslung.'));
  const pairs = [[P(0, 1), P(1, -1)], [P(3, 1), P(4, -1)], [P(5, 1), P(6, -1)]];
  pairs.forEach(([a, b]) => staffWithPlay(p, [a, b], { items: [{ pitch: a, pre: `"_${nm(a)}"` }, { pitch: b, pre: `"_${nm(b)}"` }], staffwidth: 220, ariaLabel: `${nm(a)} und ${nm(b)}`, playLabel: `${nm(a)} = ${nm(b)}` }));
  p.append(callout('Warum nicht einfach immer gleich?', 'Der Name hängt von der Tonleiter ab: In jeder Tonleiter kommt jeder Buchstabe genau einmal vor. In D-Dur heißt der Ton fis (nicht ges), weil g schon vorkommt.'));
}

// =====================================================================
const facts = [
  { id: 'm3-h', title: 'Warum heißt es bei uns h?', text: 'Im Mittelalter schrieb man für zwei Varianten des Tons b zwei Formen: ein rundes b (tiefer) und ein eckiges. Das eckige b sah in alten Drucken aus wie ein h. So blieb es im Deutschen beim h – in fast allen anderen Ländern heißt der Ton B.' },
  { id: 'm3-kreuz', title: 'Das Kreuz kommt vom b', text: 'Das Kreuz ♯ und das Auflösungszeichen ♮ haben sich aus dem eckigen b entwickelt. Darum sehen sie sich so ähnlich.' },
  { id: 'm3-12', title: '12 Halbtöne pro Oktave', text: 'In unserer gleichstufigen Stimmung ist die Oktave in 12 gleiche Halbtöne geteilt. Andere Musikkulturen teilen anders, etwa die arabische Musik mit Vierteltönen oder die indonesische Gamelan-Musik.' },
  { id: 'm3-klavier', title: 'Schwarze Tasten waren mal weiß', text: 'Bei vielen alten Cembali und frühen Klavieren waren die Farben umgekehrt: Die Untertasten waren dunkel (oft aus Ebenholz), die Obertasten hell.' },
];

export default {
  id: 'vorzeichen',
  num: 3,
  title: 'Halbton, Ganzton & Vorzeichen',
  short: '♯ ♭ ♮ und deutsche Tonnamen',
  color: '--c3',
  motif: 'keys',
  ready: true,
  renderLearn,
  levelInfo: {
    hop: 'Weiße Tasten finden und benennen, Halbton oder Ganzton?',
    step: 'Kreuz und B: schwarze Tasten benennen, Noten mit Vorzeichen lesen.',
    jump: 'Ein Ton – zwei Namen (fis = ges), Vorzeichen im Takt, Fehler finden.',
  },
  generators: {
    hop: [htGtKeys, findKey, nameKey, nameNote, hearStep, htGtKeys],
    step: [nameKey, nameNote, stepFrom, validityTask, setAccidental, findKey, hearStep],
    jump: [enharmonicTask, validityTask, setAccidental, errorNames, stepFrom, nameNote],
  },
  speedGenerators: [() => nameNote('step'), () => nameKey('step'), () => stepFrom('step'), enharmonicTask, () => htGtKeys('step')],
  facts,
};

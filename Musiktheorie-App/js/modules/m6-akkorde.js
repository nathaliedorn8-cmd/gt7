// =====================================================================
// Modul 6 – Akkorde: Dreiklänge, Umkehrungen, Stufen I–IV–V–vi, Reggae
// =====================================================================
import * as T from '../core/theory.js';
import * as A from '../core/audio.js';
import { renderPitches } from '../ui/notation.js';
import { createKeyboard } from '../ui/keyboard.js';
import { h, icon, playButton } from '../ui/dom.js';
import { mc, learnTabs, staffWithPlay, callout, nm, cap } from './common.js';

const P = (s, a = 0, o = 4) => ({ step: s, alter: a, octave: o });
const TYPES = ['dur', 'moll', 'vermindert', 'uebermaessig'];
const TYPE_NAME = { dur: 'Dur', moll: 'Moll', vermindert: 'vermindert', uebermaessig: 'übermäßig' };
const DEG = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const DEG_TYPE = ['dur', 'moll', 'moll', 'dur', 'dur', 'moll', 'vermindert'];

/** Name eines Dreiklangs: C-Dur, a-Moll, h-vermindert, C-übermäßig */
export function chordName(root, type) {
  const n = nm(root);
  if (type === 'dur') return `${cap(n)}-Dur`;
  if (type === 'moll') return `${n}-Moll`;
  if (type === 'vermindert') return `${n}-vermindert`;
  return `${cap(n)}-übermäßig`;
}
const KN = (s) => s.replace('-', '‑');

const ROOTS = {
  hop: [P(0), P(3), P(4), P(1), P(5)],
  step: [P(0), P(1), P(2), P(3), P(4), P(5), P(6), P(6, -1), P(2, -1), P(5, -1), P(3, 1)],
};
function okSpelling(ch) {
  return ch.every((p) => Math.abs(p.alter) <= 1);
}
function randomTriad(level, types) {
  for (let i = 0; i < 100; i++) {
    const type = T.pick(types);
    const root = { ...T.pick(level === 'hop' ? ROOTS.hop : ROOTS.step) };
    const ch = T.triad(root, type);
    if (okSpelling(ch)) return { root, type, ch };
  }
  return { root: P(0), type: 'dur', ch: T.triad(P(0), 'dur') };
}
/** Umkehrung: 0 Grundstellung, 1 Sextakkord, 2 Quartsextakkord */
function invert(ch, inv) {
  const up = (p) => ({ ...p, octave: p.octave + 1 });
  if (inv === 1) return [ch[1], ch[2], up(ch[0])];
  if (inv === 2) return [ch[2], up(ch[0]), up(ch[1])];
  return ch;
}
const INV_NAME = ['Grundstellung', '1. Umkehrung (Sextakkord)', '2. Umkehrung (Quartsextakkord)'];
function toBass(ch) {
  const shift = ch[0].step >= 4 ? 2 : 1;
  return ch.map((p) => ({ ...p, octave: p.octave - shift }));
}
/** Leitereigener Dreiklang auf Stufe deg (0-basiert) in Dur */
export function diatonic(tonic, deg) {
  const s = T.scale({ ...tonic, octave: 4 }, 'dur').slice(0, 7);
  const ext = [...s, ...s.map((p) => ({ ...p, octave: p.octave + 1 }))];
  return [ext[deg], ext[deg + 2], ext[deg + 4]];
}
function typeOf(ch) {
  const a = T.midi(ch[1]) - T.midi(ch[0]);
  const b = T.midi(ch[2]) - T.midi(ch[0]);
  return TYPES.find((t) => T.TRIADS[t].semis[0] === a && T.TRIADS[t].semis[1] === b);
}
const midis = (ch) => ch.map(T.midi);
function playCh(ch, arp = false) {
  const m = midis(ch);
  if (arp) A.playSequence([...m.map((x, i) => ({ midi: x, beat: i * 0.5, beats: 0.5 })), { midis: m, beat: 1.6, beats: 2.5 }], { tempo: 100 });
  else A.playChord(m);
}
function chordStaff(container, ch, { clef = 'treble', label, playLabel = 'Anhören', arp = true } = {}) {
  const box = h('div', {});
  container.append(box);
  const api = renderPitches(box, ch, { items: [{ chord: ch, len: '' }], clef, staffwidth: 170, ariaLabel: label || 'Akkord in Noten' });
  container.append(h('div', { class: 'btn-row' }, playButton(playLabel, () => playCh(ch, arp)), arp ? playButton('Zerlegt', () => A.playMelody(midis(ch), { tempo: 120 })) : ''));
  return api;
}
function thirdsText(ch) {
  const t1 = T.interval(ch[0], ch[1]);
  const t2 = T.interval(ch[1], ch[2]);
  return `${nm(ch[0])}–${nm(ch[1])}: ${t1.label} (${t1.semis}), ${nm(ch[1])}–${nm(ch[2])}: ${t2.label} (${t2.semis})`;
}
const KEYS = { easy: [P(0), P(4), P(3)], all: [P(0), P(4), P(3), P(1), P(6, -1), P(5), P(2, -1)] };

// =====================================================================
// AUFGABEN
// =====================================================================

function hearType(level) {
  const types = level === 'hop' ? ['dur', 'moll'] : level === 'step' ? ['dur', 'moll', 'vermindert'] : TYPES;
  const { root, type, ch } = randomTriad('step', types);
  return mc({
    kind: 'Hören',
    title: 'Welcher Dreiklang klingt hier?',
    hint: level === 'hop' ? 'Dur klingt oft hell und fröhlich, Moll eher dunkel oder nachdenklich.' : 'Vermindert klingt eng und angespannt, übermäßig schwebend und unaufgelöst.',
    pre: (body) => body.append(h('div', { class: 'btn-row' }, playButton('Abspielen', () => playCh(ch, true)), playButton('Nur zusammen', () => playCh(ch)))),
    options: types.map((t) => ({ label: TYPE_NAME[t], correct: t === type })),
    cols: true,
    explain: `<p>Das war <strong>${chordName(root, type)}</strong>: ${thirdsText(ch)}.</p>`,
    solution: (el) => chordStaff(el, ch, { label: chordName(root, type), playLabel: 'Nochmal' }),
  });
}

function typeByNotes(level) {
  const types = level === 'jump' ? TYPES : ['dur', 'moll', 'vermindert'];
  const { root, type, ch } = randomTriad(level === 'hop' ? 'hop' : 'step', level === 'hop' ? ['dur', 'moll'] : types);
  const clef = level === 'jump' && Math.random() < 0.45 ? 'bass' : 'treble';
  const shown = clef === 'bass' ? toBass(ch) : ch;
  return mc({
    kind: clef === 'bass' ? 'Bassschlüssel' : 'Notenbild',
    title: 'Welche Art von Dreiklang ist das?',
    hint: 'Untersuche die beiden Terzen von unten: groß (4 Halbtöne) oder klein (3 Halbtöne)?',
    pre: (body) => chordStaff(body, shown, { clef, label: 'Dreiklang' }),
    options: (level === 'hop' ? ['dur', 'moll'] : types).map((t) => ({ label: TYPE_NAME[t], correct: t === type })),
    cols: true,
    explain: `<p>${thirdsText(ch)} → <strong>${chordName(root, type)}</strong>. ${{ dur: 'Dur = große + kleine Terz.', moll: 'Moll = kleine + große Terz.', vermindert: 'Vermindert = zwei kleine Terzen.', uebermaessig: 'Übermäßig = zwei große Terzen.' }[type]}</p>`,
  });
}

function buildTriad(level) {
  const types = level === 'hop' ? ['dur'] : level === 'step' ? ['dur', 'moll'] : ['dur', 'moll', 'vermindert', 'uebermaessig'];
  const { root, type, ch } = randomTriad(level === 'hop' ? 'hop' : 'step', types);
  const r = { ...root, octave: 4 };
  const target = T.triad(r, type).map(T.midi);
  const sel = new Set();
  let kb;
  return {
    kind: 'Klaviatur',
    title: `Baue ${KN(chordName(root, type))} auf der Klaviatur.`,
    hint: level === 'hop' ? 'Grundton, dann eine große Terz (4 Halbtöne) und darauf eine kleine Terz (3 Halbtöne).' : 'Grundton ist markiert. Tippe drei Tasten an (nochmal tippen = abwählen).',
    render(body, ctx) {
      const w = h('div', { class: 'kbd-wrap' });
      body.append(w);
      kb = createKeyboard(w, {
        from: 60, to: 83,
        onKey: (m) => {
          if (sel.has(m)) sel.delete(m); else if (sel.size < 3) sel.add(m);
          kb.clearMarks('is-sel');
          sel.forEach((x) => kb.mark(x, 'is-sel'));
          ctx.setReady(sel.size === 3);
        },
      });
      kb.mark(target[0], 'is-hint');
      body.append(h('div', { class: 'btn-row' }, h('button', { class: 'btn btn--sm', type: 'button', onclick: () => { sel.clear(); kb.clearMarks('is-sel'); ctx.setReady(false); } }, icon('undo'), 'Zurücksetzen'),
        playButton('Meine Töne', () => A.playChord([...sel].sort((a, b) => a - b)))));
    },
    check() {
      const mine = [...sel].sort((a, b) => a - b);
      const ok = target.every((m) => sel.has(m)) || (mine.length === 3 && mine.map((x) => x % 12).sort().join() === target.map((x) => x % 12).sort().join());
      kb.clearMarks('is-sel');
      target.forEach((m) => kb.mark(m, 'is-ok'));
      mine.filter((m) => !target.map((x) => x % 12).includes(m % 12)).forEach((m) => kb.mark(m, 'is-bad'));
      return {
        ok,
        explain: `<p>${chordName(root, type)}: <strong>${ch.map(nm).join(' – ')}</strong>. ${thirdsText(ch)}.</p>`,
        solution: (el) => chordStaff(el, T.triad(r, type), { label: 'Lösung', playLabel: 'Lösung anhören' }),
      };
    },
  };
}

function symbolTask(level) {
  const { root, type, ch } = randomTriad('step', level === 'jump' ? ['dur', 'moll', 'vermindert'] : ['dur', 'moll']);
  const correct = T.chordSymbol(root, type);
  const alt = [
    T.chordSymbol(root, type === 'dur' ? 'moll' : 'dur'),
    T.chordSymbol(ch[1], type),
    T.chordSymbol({ ...root, alter: root.alter === 0 ? (root.step === 6 ? -1 : 1) : 0 }, type),
    root.step === 6 && root.alter === 0 ? 'B' + (type === 'moll' ? 'm' : '') : T.chordSymbol(ch[2], type),
  ];
  const wrong = [...new Set(alt.filter((x) => x !== correct))].slice(0, 3);
  return mc({
    kind: 'Akkordsymbol',
    title: 'Welches Akkordsymbol passt?',
    hint: 'Großer Buchstabe = Dur, kleines „m“ = Moll, ° = vermindert. Deutsche Namen: H und B!',
    pre: (body) => chordStaff(body, ch, { label: 'Dreiklang' }),
    options: [{ label: correct, correct: true }, ...wrong.map((w) => ({ label: w }))],
    cols: true,
    explain: `<p>${ch.map(nm).join(' – ')} ist <strong>${chordName(root, type)}</strong> → Symbol <strong>${correct}</strong>.${root.step === 6 ? ' Achtung: h heißt im Symbol H, b heißt B (international B♭).' : ''}</p>`,
  });
}

function inversionTask(level) {
  const { root, type, ch } = randomTriad(level === 'jump' ? 'step' : 'hop', ['dur', 'moll']);
  const inv = T.rand(3);
  let shown = invert(ch, inv);
  const clef = level === 'jump' && Math.random() < 0.4 ? 'bass' : 'treble';
  if (clef === 'bass') shown = toBass(shown);
  const askRoot = level === 'jump' && Math.random() < 0.5;
  if (askRoot) {
    const correct = cap(nm(root));
    const wrong = [cap(nm(shown[0])), cap(nm(shown[1])), cap(nm(shown[2]))].filter((x) => x !== correct);
    const w2 = [...new Set([...wrong, cap(nm(T.letterUp(root, 1, 2)))])].slice(0, 2);
    return mc({
      kind: 'Umkehrung',
      title: 'Wie heißt der Grundton dieses Akkords?',
      hint: 'Ordne die Töne so um, dass sie in Terzen übereinanderliegen. Der unterste ist dann der Grundton.',
      pre: (body) => chordStaff(body, shown, { clef, label: 'Akkord' }),
      options: [{ label: correct, correct: true }, ...w2.map((x) => ({ label: x }))],
      cols: true,
      explain: `<p>In Terzen geschichtet: ${ch.map(nm).join(' – ')}. Grundton ist <strong>${nm(root)}</strong> – ${chordName(root, type)} in ${INV_NAME[inv]}.</p>`,
    });
  }
  return mc({
    kind: 'Umkehrung',
    title: 'In welcher Lage steht dieser Akkord?',
    hint: 'Welcher Ton liegt ganz unten: Grundton, Terz oder Quinte?',
    pre: (body) => chordStaff(body, shown, { clef, label: 'Akkord' }),
    options: INV_NAME.map((n, i) => ({ label: n, correct: i === inv })),
    explain: `<p>Das ist ${chordName(root, type)} (${ch.map(nm).join(' – ')}). Unten liegt <strong>${nm(shown[0])}</strong> – ${['der Grundton', 'die Terz', 'die Quinte'][inv]}. Also: <strong>${INV_NAME[inv]}</strong>.</p>`,
  });
}

function degreeTask(level) {
  const tonic = T.pick(level === 'jump' ? KEYS.all : KEYS.easy);
  const deg = T.pick(level === 'hop' ? [0, 3, 4] : [0, 3, 4, 5, 1]);
  const ch = diatonic(tonic, deg);
  const correct = T.chordSymbol(ch[0], DEG_TYPE[deg]);
  const wrong = T.shuffle([0, 1, 2, 3, 4, 5].filter((d) => d !== deg)).slice(0, 3).map((d) => T.chordSymbol(diatonic(tonic, d)[0], DEG_TYPE[d]));
  const keyN = `${cap(nm(tonic))}-Dur`;
  return mc({
    kind: 'Stufen',
    title: `Welcher Akkord ist die ${DEG[deg]}. Stufe in ${KN(keyN)}?`,
    hint: 'Zähle in der Tonleiter bis zur Stufe und baue darauf einen Dreiklang aus leitereigenen Tönen.',
    options: [{ label: correct, correct: true }, ...wrong.map((w) => ({ label: w }))],
    cols: true,
    explain: `<p>${keyN}: ${T.scale({ ...tonic, octave: 4 }, 'dur').slice(0, 7).map(nm).join(' ')}. Stufe ${DEG[deg]} = ${ch.map(nm).join(' – ')} → <strong>${correct}</strong> (${TYPE_NAME[DEG_TYPE[deg]]}). Große römische Zahl = Dur, kleine = Moll.</p>`,
    solution: (el) => chordStaff(el, ch, { label: correct, playLabel: `${correct} anhören` }),
  });
}

function progressionTask(level) {
  const tonic = T.pick(KEYS.easy);
  const end = T.pick([0, 5]);
  const seq = level === 'jump' ? T.pick([[0, 3, 4], [0, 5, 3, 4]]) : [0, 3, 4];
  const chords = [...seq, end].map((d) => diatonic(tonic, d));
  const play = () => A.playSequence(chords.map((ch, i) => ({ midis: [T.midi(ch[0]) - 12, ...midis(ch)], beat: i * 2, beats: 1.9 })), { tempo: 92 });
  const sym = (d) => T.chordSymbol(diatonic(tonic, d)[0], DEG_TYPE[d]);
  return mc({
    kind: 'Hören',
    title: `Auf welchem Akkord endet die Folge?`,
    hint: `${seq.map((d) => DEG[d]).join(' – ')} – ? in ${cap(nm(tonic))}-Dur. Klingt das Ende abgeschlossen (I) oder eher traurig-offen (vi)?`,
    pre: (body) => body.append(h('div', { class: 'btn-row' }, playButton('Folge abspielen', play))),
    options: [{ label: `I (${sym(0)}) – abgeschlossen`, correct: end === 0 }, { label: `vi (${sym(5)}) – Moll, offen`, correct: end === 5 }],
    explain: `<p>Die Folge endete auf <strong>${end === 0 ? 'I' : 'vi'}</strong> (${sym(end)}). ${end === 5 ? 'V → vi heißt Trugschluss: Man erwartet die I, hört aber den Moll-Akkord vi.' : 'V → I ist der Ganzschluss – das klingt wie ein Punkt am Satzende.'}</p>`,
  });
}

function thirdsTask() {
  const type = T.pick(TYPES);
  const ans = { dur: 'große Terz + kleine Terz', moll: 'kleine Terz + große Terz', vermindert: 'kleine Terz + kleine Terz', uebermaessig: 'große Terz + große Terz' };
  return mc({
    kind: 'Wissen',
    title: `Aus welchen Terzen (von unten) besteht ein ${TYPE_NAME[type] === 'Dur' || TYPE_NAME[type] === 'Moll' ? TYPE_NAME[type] + '-Dreiklang' : TYPE_NAME[type].replace('vermindert', 'verminderter').replace('übermäßig', 'übermäßiger') + ' Dreiklang'}?`,
    options: TYPES.map((t) => ({ label: ans[t], correct: t === type })),
    explain: `<p>${{ dur: 'Dur', moll: 'Moll', vermindert: 'Vermindert', uebermaessig: 'Übermäßig' }[type]}: <strong>${ans[type]}</strong>. Zusammen ergeben die beiden Terzen ${type === 'dur' || type === 'moll' ? 'eine reine Quinte (7 Halbtöne)' : type === 'vermindert' ? 'eine verminderte Quinte (6 Halbtöne)' : 'eine übermäßige Quinte (8 Halbtöne)'}.</p>`,
    solution: (el) => chordStaff(el, T.triad(P(0), type), { label: chordName(P(0), type), playLabel: `${chordName(P(0), type)} anhören` }),
  });
}

function fixChord() {
  const { root, type, ch } = randomTriad('step', ['dur', 'moll']);
  // Terz oder Quinte falsch (um einen Halbton verschoben, gleicher Buchstabe)
  const k = T.pick([1, 2]);
  // Terz: Dur ↔ Moll vertauschen; Quinte: einen Halbton daneben. Keine Exoten wie eis/his/fes/ces.
  const weird = (p) => Math.abs(p.alter) > 1 || (p.alter === 1 && [2, 6].includes(p.step)) || (p.alter === -1 && [0, 3].includes(p.step));
  let dir = k === 1 ? (type === 'dur' ? -1 : 1) : (Math.random() < 0.5 ? 1 : -1);
  let wrongP = { ...ch[k], alter: ch[k].alter + dir };
  if (weird(wrongP)) { dir = -dir; wrongP = { ...ch[k], alter: ch[k].alter + dir }; }
  const shown = ch.map((p, i) => (i === k ? wrongP : p));
  let chosen = null, btns, api;
  return {
    kind: 'Fehlersuche',
    title: `Das soll ${KN(chordName(root, type))} sein. Welcher Ton ist falsch?`,
    render(body, ctx) {
      const box = h('div', {});
      body.append(box);
      api = renderPitches(box, shown, { items: [{ chord: shown.map((p) => ({ ...p, forceAccidental: p.alter !== 0 && false })), len: '' }], staffwidth: 170, ariaLabel: 'Akkord mit Fehler' });
      body.append(h('div', { class: 'btn-row' }, playButton('Anhören', () => playCh(shown, true))));
      const wrap = h('div', { class: 'toggles', style: { gridTemplateColumns: 'repeat(3, 1fr)' }, role: 'group', 'aria-label': 'Ton wählen' });
      btns = ['Grundton', 'Terz', 'Quinte'].map((l, i) => h('button', { class: 'toggle', type: 'button', 'aria-pressed': 'false', onclick: () => { chosen = i; btns.forEach((x, j) => x.setAttribute('aria-pressed', String(j === i))); ctx.setReady(true); } }, l, h('small', {}, nm(shown[i]))));
      wrap.append(...btns);
      body.append(wrap);
    },
    check() {
      const ok = chosen === k;
      btns[k].classList.add('is-ok');
      if (!ok) btns[chosen].classList.add('is-bad');
      void api;
      return {
        ok,
        explain: `<p>${chordName(root, type)} = <strong>${ch.map(nm).join(' – ')}</strong>. Die ${k === 1 ? 'Terz' : 'Quinte'} muss ${nm(ch[k])} heißen, nicht ${nm(wrongP)}. ${k === 1 ? (type === 'dur' ? 'Dur braucht unten eine große Terz (4 Halbtöne).' : 'Moll braucht unten eine kleine Terz (3 Halbtöne).') : 'Grundton und Quinte bilden eine reine Quinte (7 Halbtöne).'}</p>`,
        solution: (el) => chordStaff(el, ch, { label: 'Lösung', playLabel: 'Richtig anhören' }),
      };
    },
  };
}

// =====================================================================
// CHECK DAS
// =====================================================================
function renderLearn(root) {
  learnTabs(root, [
    ['Dreiklänge', learnTriads],
    ['Umkehrungen', learnInv],
    ['Stufen', learnDegrees],
    ['Reggae-Groove', learnReggae],
  ]);
}

function learnTriads(p) {
  p.append(h('h3', {}, 'Terzen übereinander'),
    h('p', {}, 'Ein Dreiklang besteht aus drei Tönen, die in Terzen übereinanderliegen: Grundton, Terz und Quinte. Im Notenbild sieht das aus wie ein Schneemann – alle Noten auf Linien oder alle in Zwischenräumen.'));
  const c = P(0);
  TYPES.forEach((t) => {
    const ch = T.triad(c, t);
    p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700', marginTop: '8px' } }, `${chordName(c, t)} (${T.chordSymbol(c, t)}): ${T.TRIADS[t].thirds[0]} + ${T.TRIADS[t].thirds[1]} Terz`));
    chordStaff(p, ch, { label: chordName(c, t), playLabel: TYPE_NAME[t] });
  });
  p.append(h('h3', {}, 'Im Bassschlüssel'),
    h('p', {}, 'Bassinstrumente und die linke Hand am Klavier lesen den Bassschlüssel. Der Akkord bleibt derselbe – nur tiefer.'));
  chordStaff(p, T.triad(P(0, 0, 3), 'dur'), { clef: 'bass', label: 'C-Dur im Bassschlüssel', playLabel: 'C-Dur (Bass)' });
  chordStaff(p, T.triad(P(5, 0, 2), 'moll'), { clef: 'bass', label: 'a-Moll im Bassschlüssel', playLabel: 'a-Moll (Bass)' });
  p.append(callout('Akkordsymbole:', 'C = C-Dur, Am = a-Moll, H° = h-vermindert, C+ = C-übermäßig. Mit deutschen Namen: H-Dur heißt H, B-Dur heißt B (international B♭).'));
}

function learnInv(p) {
  p.append(h('h3', {}, 'Gleiche Töne, andere Reihenfolge'),
    h('p', {}, 'Legt man den untersten Ton eine Oktave nach oben, entsteht eine Umkehrung. Der Akkord heißt weiterhin gleich – er klingt nur etwas anders.'));
  const ch = T.triad(P(0), 'dur');
  [0, 1, 2].forEach((i) => {
    const v = invert(ch, i);
    p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700', marginTop: '8px' } }, `${INV_NAME[i]}: ${v.map(nm).join(' – ')}`));
    chordStaff(p, v, { label: INV_NAME[i], playLabel: 'Anhören' });
  });
  p.append(callout('Grundton finden:', 'Schiebe die Töne so zusammen, dass sie in Terzen übereinanderliegen (Schneemann). Der unterste Ton ist dann der Grundton.'),
    callout('Warum Umkehrungen?', 'Pianistinnen und Gitarristen nutzen Umkehrungen, damit die Hand bei Akkordwechseln kaum springen muss. C – F – G klingt mit Umkehrungen viel flüssiger.'));
  const smooth = [[P(0), P(2), P(4)], [P(0), P(3), P(5)], [P(6, 0, 3), P(1), P(4)], [P(0), P(2), P(4)]];
  p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'C – F – G – C mit Umkehrungen'));
  const box = h('div', {});
  p.append(box);
  renderPitches(box, smooth.flat(), { items: smooth.map((c, i) => ({ chord: c, len: '', pre: `"_${['C', 'F', 'G', 'C'][i]}"` })), ariaLabel: 'C F G C mit Umkehrungen' });
  p.append(h('div', { class: 'btn-row' }, playButton('Anhören', () => A.playSequence(smooth.map((c, i) => ({ midis: [T.midi(diatonic(P(0), [0, 3, 4, 0][i])[0]) - 12, ...midis(c)], beat: i * 2, beats: 1.9 })), { tempo: 92 }))));
}

function learnDegrees(p) {
  p.append(h('h3', {}, 'Akkorde auf den Stufen einer Tonleiter'),
    h('p', {}, 'Auf jedem Ton einer Dur-Tonleiter kann man einen Dreiklang aus leitereigenen Tönen bauen. Die Stufen schreibt man mit römischen Zahlen: groß für Dur, klein für Moll.'));
  const sel = h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Tonart wählen' });
  const out = h('div', {});
  let tonic = P(0);
  function draw() {
    out.innerHTML = '';
    const chords = [0, 1, 2, 3, 4, 5, 6].map((d) => diatonic(tonic, d));
    const box = h('div', {});
    out.append(box);
    renderPitches(box, chords.flat(), { tonic, mode: 'dur', withKey: true, items: chords.map((c, d) => ({ chord: c, len: '', pre: `"_${DEG[d]}"` })), ariaLabel: `Stufenakkorde in ${cap(nm(tonic))}-Dur` });
    const row = h('div', { class: 'chord-row' });
    chords.forEach((c, d) => {
      const sym = T.chordSymbol(c[0], DEG_TYPE[d]);
      const b = h('button', { class: 'chord-chip', type: 'button', style: [0, 3, 4, 5].includes(d) ? {} : { opacity: '.6' }, onclick: () => playCh([{ ...c[0], octave: c[0].octave - 1 }, ...c]) }, sym, h('small', {}, DEG[d]));
      row.append(b);
    });
    out.append(row, h('p', { class: 'muted small' }, 'Tippe einen Akkord zum Anhören. Die wichtigsten: I, IV, V und vi.'));
    const prog = (degs) => () => A.playSequence(degs.map((d, i) => ({ midis: [T.midi(chords[d][0]) - 12, ...midis(chords[d])], beat: i * 2, beats: 1.9 })), { tempo: 96, onNote: (i) => [...row.children].forEach((x, k) => x.classList.toggle('is-now', k === degs[i])), onEnd: () => [...row.children].forEach((x) => x.classList.remove('is-now')) });
    const sym = (d) => T.chordSymbol(chords[d][0], DEG_TYPE[d]);
    out.append(h('div', { class: 'btn-row' },
      playButton(`I–IV–V–I (${[0, 3, 4, 0].map(sym).join(' ')})`, prog([0, 3, 4, 0])),
      playButton(`I–V–vi–IV (${[0, 4, 5, 3].map(sym).join(' ')})`, prog([0, 4, 5, 3]))));
  }
  KEYS.all.forEach((k, i) => {
    const b = h('button', { class: 'tab', type: 'button', 'aria-selected': String(i === 0) }, cap(nm(k)));
    b.addEventListener('click', () => { tonic = k; [...sel.children].forEach((x) => x.setAttribute('aria-selected', String(x === b))); draw(); });
    sel.append(b);
  });
  p.append(sel, out,
    callout('I – IV – V:', 'Tonika, Subdominante, Dominante. Mit diesen drei Akkorden kannst du unzählige Volkslieder, Blues- und Rocksongs begleiten.'),
    callout('I – V – vi – IV:', 'Diese Folge steckt in sehr vielen Popsongs. Hör mal bewusst im Radio darauf!'));
  draw();
}

function learnReggae(p) {
  p.append(h('h3', {}, 'Akkorde im Reggae-Groove'),
    h('p', {}, 'Im Reggae spielt die Gitarre oder das Keyboard die Akkorde ganz kurz auf dem Offbeat – dem „und“. Der Bass spielt eine tiefe, ruhige Linie, die Bassdrum kommt beim One Drop nur auf die 3.'));
  const progs = {
    'I – IV – V – IV': [0, 3, 4, 3],
    'I – vi – IV – V': [0, 5, 3, 4],
    'vi – IV (Moll-Feeling)': [5, 3, 5, 3],
  };
  let tonic = P(4);
  let progName = 'I – IV – V – IV';
  let playing = false;
  const chips = h('div', { class: 'chord-row', 'aria-live': 'off' });
  const keySel = h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Tonart' });
  const progSel = h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Akkordfolge' });
  const playBtn = h('button', { class: 'btn btn--primary', type: 'button' }, icon('play'), 'Play');
  function chordsNow() {
    return progs[progName].map((d) => diatonic(tonic, d));
  }
  function drawChips() {
    chips.innerHTML = '';
    progs[progName].forEach((d, i) => chips.append(h('div', { class: 'chord-chip' }, T.chordSymbol(chordsNow()[i][0], DEG_TYPE[d]), h('small', {}, DEG[d]))));
  }
  function stop() { A.stopAll(); playing = false; playBtn.innerHTML = ''; playBtn.append(icon('play'), 'Play'); [...chips.children].forEach((c) => c.classList.remove('is-now')); }
  function start() {
    const chs = chordsNow();
    const voiced = chs.map((c) => midis(c).map((m) => (m > 72 ? m - 12 : m)));
    const bass = chs.map((c) => { const r = T.midi(c[0]) - 24 + (T.midi(c[0]) - 24 < 40 ? 12 : 0); return { 0: r, 3: r, 6: r + 7, 10: r + 12 - 12, 12: r }; });
    let bar = -1;
    A.startGroove({
      steps: 16, stepsPerBeat: 4, bpm: 74,
      layers: [
        { name: 'Skank', chords: voiced, hits: [2, 6, 10, 14], dur: 0.12 },
        { name: 'Hi-Hat', sound: 'hat', hits: [0, 2, 4, 6, 8, 10, 12, 14], vel: 0.7 },
        { name: 'Rim', sound: 'rim', hits: [8] },
        { name: 'Kick', sound: 'kick', hits: [8] },
        { name: 'Bass', bass, hits: [0, 3, 6, 12], dur: 0.32 },
      ],
      onStep: (s) => { if (s === 0) { bar = (bar + 1) % chs.length; [...chips.children].forEach((c, i) => c.classList.toggle('is-now', i === bar)); } },
    });
    playing = true;
    playBtn.innerHTML = '';
    playBtn.append(icon('stop'), 'Stopp');
  }
  playBtn.addEventListener('click', () => (playing ? stop() : start()));
  [P(4), P(0), P(1), P(5)].forEach((k, i) => {
    const b = h('button', { class: 'tab', type: 'button', 'aria-selected': String(i === 0) }, `${cap(nm(k))}-Dur`);
    b.addEventListener('click', () => { tonic = k; [...keySel.children].forEach((x) => x.setAttribute('aria-selected', String(x === b))); const was = playing; stop(); drawChips(); if (was) start(); });
    keySel.append(b);
  });
  Object.keys(progs).forEach((n, i) => {
    const b = h('button', { class: 'tab', type: 'button', 'aria-selected': String(i === 0) }, n);
    b.addEventListener('click', () => { progName = n; [...progSel.children].forEach((x) => x.setAttribute('aria-selected', String(x === b))); const was = playing; stop(); drawChips(); if (was) start(); });
    progSel.append(b);
  });
  p.append(h('p', { class: 'muted small' }, 'Tonart:'), keySel, h('p', { class: 'muted small' }, 'Akkordfolge:'), progSel, chips, h('div', { class: 'btn-row' }, playBtn),
    callout('Mitspielen:', 'Spiel auf Keyboard oder Gitarre die Akkorde kurz und knackig nur auf „und“ – 1 UND 2 UND 3 UND 4 UND. Die anderen zählen und klatschen auf die 3.'),
    callout('Hinweis:', 'Das Beispiel ist ein vereinfachtes Grundmuster. Echte Reggae-Bands spielen viele Variationen – hör dir Aufnahmen aus Jamaika an!', true));
  drawChips();
}

// =====================================================================
const facts = [
  { id: 'm6-dreiklang', title: 'Drei Töne reichen', text: 'Mit nur drei Akkorden (I, IV, V) lassen sich viele Volkslieder, fast der ganze klassische Blues und unzählige Rock-’n’-Roll-Songs begleiten.' },
  { id: 'm6-gitarre', title: 'Gitarrengriffe sind Umkehrungen', text: 'Ein Gitarrengriff enthält meist dieselben drei Akkordtöne mehrfach in verschiedenen Oktaven. Der C-Dur-Griff hat zum Beispiel fünf Saiten, aber nur die Töne c, e und g.' },
  { id: 'm6-reggae', title: 'Der Skank kommt vom Ska', text: 'Ska aus Jamaika (um 1960) betonte schon den Offbeat – schnell und tanzbar. Daraus entwickelten sich Rocksteady und später der langsamere Reggae.' },
  { id: 'm6-dur-moll', title: 'Fröhlich und traurig?', text: 'Dur gilt oft als fröhlich, Moll als traurig. Das ist aber vor allem Gewohnheit unserer Musikkultur – es gibt auch viele fröhliche Lieder in Moll, zum Beispiel in osteuropäischer Volksmusik.' },
];

export default {
  id: 'akkorde',
  num: 6,
  title: 'Akkorde',
  short: 'Dreiklänge, Stufen, Reggae-Groove',
  color: '--c6',
  motif: 'chord',
  ready: true,
  renderLearn,
  levelInfo: {
    hop: 'Dur und Moll hören und erkennen, Dur-Dreiklänge bauen, I – IV – V.',
    step: 'Vermindert, Akkordsymbole, Umkehrungen, Stufen in Dur, Moll-Dreiklänge bauen.',
    jump: 'Übermäßig, Bassschlüssel, Grundton in Umkehrungen, Trugschluss, Fehlersuche.',
  },
  generators: {
    hop: [hearType, typeByNotes, buildTriad, thirdsTask, degreeTask, hearType],
    step: [hearType, typeByNotes, buildTriad, symbolTask, inversionTask, degreeTask, progressionTask, thirdsTask],
    jump: [typeByNotes, buildTriad, inversionTask, symbolTask, degreeTask, progressionTask, fixChord, hearType],
  },
  speedGenerators: [() => typeByNotes('step'), () => symbolTask('step'), () => degreeTask('step'), thirdsTask],
  facts,
};

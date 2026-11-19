// =====================================================================
// Modul 5 – Intervalle (mit Merkhilfen aus gemeinfreien Liedern)
// =====================================================================
import * as T from '../core/theory.js';
import * as A from '../core/audio.js';
import { renderPitches } from '../ui/notation.js';
import { createKeyboard } from '../ui/keyboard.js';
import { h, playButton } from '../ui/dom.js';
import { mc, learnTabs, staffWithPlay, playOn, callout, nm, cap } from './common.js';

const P = (s, a = 0, o = 4) => ({ step: s, alter: a, octave: o });
const NO = T.germanNameOctave;

// Merkhilfen – nur gemeinfreie Lieder (traditionell oder sehr alt)
export const MNEMO = {
  'reine Prime': { song: '„Morgen kommt der Weihnachtsmann“', where: 'Mor-gen: zweimal derselbe Ton', dir: 'gleich' },
  'kleine Sekunde': { song: '„Hänschen klein“', where: 'bei „klein – ging“ (e – f)', dir: 'aufwärts' },
  'große Sekunde': { song: '„Alle meine Entchen“', where: 'Al-le (c – d)', dir: 'aufwärts' },
  'kleine Terz': { song: '„Kuckuck, Kuckuck, ruft’s aus dem Wald“', where: 'Ku-ckuck (g – e)', dir: 'abwärts' },
  'große Terz': { song: '„When the Saints Go Marching In“ (Spiritual)', where: 'Oh – when (c – e)', dir: 'aufwärts' },
  'reine Quarte': { song: '„O Tannenbaum“', where: 'O – Tan-nen (d – g)', dir: 'aufwärts', extra: 'Auch das Martinshorn („Tatü-tata“) klingt im Quartabstand.' },
  'übermäßige Quarte': { song: 'Tritonus – das „Teufelsintervall“', where: 'genau die halbe Oktave: 6 Halbtöne, klingt wie eine Sirene voller Spannung', dir: '' },
  'verminderte Quinte': { song: 'Tritonus – das „Teufelsintervall“', where: 'klingt genauso wie die übermäßige Quarte: 6 Halbtöne', dir: '' },
  'reine Quinte': { song: '„Morgen kommt der Weihnachtsmann“', where: 'Mor-gen – kommt (c – g)', dir: 'aufwärts' },
  'kleine Sexte': { song: '„The Entertainer“ (Scott Joplin, 1902)', where: 'nach dem Auftakt der Sprung e – c', dir: 'aufwärts' },
  'große Sexte': { song: '„My Bonnie Is Over the Ocean“ (Volkslied)', where: 'My – Bon-nie (g – e)', dir: 'aufwärts' },
  'kleine Septime': { song: 'Oktave minus Ganzton', where: 'klingt offen und will sich auflösen – typisch für Blues und Funk', dir: '' },
  'große Septime': { song: 'Oktave minus Halbton', where: 'reibt stark – nur ein Halbton fehlt bis zur Oktave', dir: '' },
  'reine Oktave': { song: 'gleicher Ton, eine Etage höher', where: 'Singen Frauen und Männer dasselbe Lied, liegen sie oft eine Oktave auseinander', dir: '' },
};
function mnemoHtml(label) {
  const m = MNEMO[label];
  if (!m) return '';
  const song = m.song.startsWith('„');
  return `<p class="mnemo-line"><strong>Merkhilfe:</strong> ${song ? `${m.song} – ${m.where}${m.dir && m.dir !== 'gleich' ? ` (${m.dir})` : ''}` : `${m.song}: ${m.where}`}.${m.extra ? ' ' + m.extra : ''}</p>`;
}

const ALLOWED = {
  hop: [[1, 'rein'], [2, 'groß'], [3, 'groß'], [4, 'rein'], [5, 'rein'], [8, 'rein']],
  step: [[2, 'klein'], [2, 'groß'], [3, 'klein'], [3, 'groß'], [4, 'rein'], [5, 'rein'], [6, 'klein'], [6, 'groß'], [8, 'rein']],
  jump: [[2, 'klein'], [2, 'groß'], [3, 'klein'], [3, 'groß'], [4, 'rein'], [5, 'rein'], [6, 'klein'], [6, 'groß'], [7, 'klein'], [7, 'groß'], [8, 'rein']],
};
const labelOf = (n, q) => `${q}e ${T.INTERVAL_NAMES[n - 1]}`;
const SEMIS = { 'reine Prime': 0, 'kleine Sekunde': 1, 'große Sekunde': 2, 'kleine Terz': 3, 'große Terz': 4, 'reine Quarte': 5, 'übermäßige Quarte': 6, 'verminderte Quinte': 6, 'reine Quinte': 7, 'kleine Sexte': 8, 'große Sexte': 9, 'kleine Septime': 10, 'große Septime': 11, 'reine Oktave': 12 };

const COMMON_LOW = [P(0), P(1), P(2), P(3), P(4), P(5), P(1, -1), P(2, -1), P(3, 1), P(4, -1), P(5, -1), P(0, 1)];

/** Zufälliges Intervall: { a, b, iv } – Unterton a, Oberton b */
function randomInterval(level, { naturalOnly = false, clef = 'treble' } = {}) {
  for (let i = 0; i < 200; i++) {
    let [n, q] = T.pick(ALLOWED[level === 'challenge' ? 'step' : level]);
    const lowPool = naturalOnly ? [0, 1, 2, 3, 4, 5, 6].map((s) => P(s)) : COMMON_LOW;
    let a = { ...T.pick(lowPool) };
    if (clef === 'bass') a.octave = 3;
    if (clef === 'treble' && a.step >= 5 && n >= 6) a.octave = 4;
    const b = T.transpose(a, n, q);
    if (Math.abs(b.alter) > 1) continue;
    if (naturalOnly && b.alter !== 0) continue;
    if (clef === 'treble' && T.midi(b) > 81) continue;
    if (clef === 'bass' && T.midi(b) > 62) { a = { ...a, octave: 2 }; }
    const bb = T.transpose(a, n, q);
    const iv = T.interval(a, bb);
    return { a, b: bb, iv };
  }
  const a = P(0);
  return { a, b: P(4), iv: T.interval(a, P(4)) };
}

function drawInterval(container, a, b, { harmonic = false, clef = 'treble', ariaLabel } = {}) {
  const items = harmonic ? [{ chord: [a, b], len: '' }] : [a, b];
  const box = h('div', {});
  container.append(box);
  const api = renderPitches(box, [a, b], { items, clef, staffwidth: 200, ariaLabel: ariaLabel || 'Intervall in Noten' });
  const row = h('div', { class: 'btn-row' },
    playButton('Nacheinander', () => A.playMelody([T.midi(a), T.midi(b)], { tempo: 90 })),
    playButton('Zusammen', () => A.playChord([T.midi(a), T.midi(b)])));
  container.append(row);
  return api;
}

// =====================================================================
// AUFGABEN
// =====================================================================

// --- Intervall zählen (nur Zahl) ---
function countInterval(level) {
  const { a, b, iv } = randomInterval(level === 'hop' ? 'step' : level, { naturalOnly: true });
  const harmonic = Math.random() < 0.4;
  const options = T.INTERVAL_NAMES.map((name, i) => ({ label: name, correct: i + 1 === iv.number }));
  const wrong = T.shuffle(options.filter((o) => !o.correct && Math.abs(T.INTERVAL_NAMES.indexOf(o.label) + 1 - iv.number) <= 2)).slice(0, 3);
  return mc({
    kind: 'Notenbild',
    title: 'Welches Intervall ist das?',
    hint: 'Zähle Linien und Zwischenräume vom unteren bis zum oberen Ton – beide mitgezählt.',
    pre: (body) => drawInterval(body, a, b, { harmonic, ariaLabel: `${nm(a)} und ${nm(b)}` }),
    options: [options.find((o) => o.correct), ...wrong],
    cols: true,
    explain: `<p>${cap(nm(a))} → ${nm(b)}: ${[...Array(iv.number)].map((_, i) => ['c', 'd', 'e', 'f', 'g', 'a', 'h'][(a.step + i) % 7]).join(' – ')} = ${iv.number} Stufen, also eine <strong>${iv.name}</strong>.</p>${mnemoHtml(iv.label === 'reine Prime' ? 'reine Prime' : iv.label)}`,
  });
}

// --- Intervall genau bestimmen (mit Qualität) ---
function fullInterval(level) {
  const clef = 'treble';
  const { a, b, iv } = randomInterval(level, { naturalOnly: level !== 'jump', clef });
  const harmonic = Math.random() < 0.4;
  const same = ALLOWED.jump.filter(([n]) => n === iv.number).map(([n, q]) => labelOf(n, q));
  const near = ALLOWED.jump.filter(([n]) => Math.abs(n - iv.number) === 1).map(([n, q]) => labelOf(n, q));
  const wrong = [...new Set([...T.shuffle(same), ...T.shuffle(near)])].filter((l) => l !== iv.label).slice(0, 3);
  return mc({
    kind: clef === 'bass' ? 'Bassschlüssel' : 'Notenbild',
    title: 'Bestimme das Intervall genau.',
    hint: 'Erst die Zahl (zählen), dann die Größe (Halbtöne).',
    pre: (body) => drawInterval(body, a, b, { harmonic, clef, ariaLabel: `${nm(a)} und ${nm(b)}` }),
    options: [{ label: iv.label, correct: true }, ...wrong.map((l) => ({ label: l }))],
    cols: true,
    explain: `<p>${cap(nm(a))} → ${nm(b)}: ${iv.number} Stufen = ${iv.name}. Abstand: <strong>${iv.semis} Halbtöne</strong> → <strong>${iv.label}</strong>.</p>${mnemoHtml(iv.label)}`,
  });
}

// --- Intervall auf der Klaviatur spielen ---
function buildOnKeys(level) {
  const lv = level === 'challenge' ? 'step' : level;
  const { a, b, iv } = randomInterval(lv === 'hop' ? 'hop' : lv, { naturalOnly: lv === 'hop' });
  const target = T.midi(b);
  let chosen = null;
  let kb;
  return {
    kind: 'Klaviatur',
    title: `Spiele eine ${iv.label} über ${NO(a)}.`,
    hint: lv === 'jump' ? 'Der Grundton ist markiert. Wie viele Halbtöne hat das Intervall?' : `Der Grundton ist markiert. Eine ${iv.label} hat ${iv.semis} Halbtöne.`,
    render(body, ctx) {
      const w = h('div', { class: 'kbd-wrap' });
      body.append(w);
      kb = createKeyboard(w, {
        from: 60, to: 83,
        onKey: (m) => {
          if (m === T.midi(a)) return;
          if (chosen !== null) kb.mark(chosen, 'is-sel', false);
          chosen = m; kb.mark(m, 'is-sel'); ctx.setReady(true);
        },
      });
      kb.mark(T.midi(a), 'is-hint');
    },
    check() {
      const ok = chosen === target;
      kb.clearMarks('is-sel');
      kb.mark(target, 'is-ok');
      if (!ok) kb.mark(chosen, 'is-bad');
      const d = chosen - T.midi(a);
      return {
        ok,
        explain: `<p>${cap(nm(a))} + ${iv.semis} Halbtöne = <strong>${nm(b)}</strong>.${!ok ? ` Du warst ${d} Halbtöne über ${nm(a)}.` : ''}</p>${mnemoHtml(iv.label)}`,
        solution: (el) => { el.append(h('p', { class: 'staff-cap' }, `${iv.label}: ${NO(a)} – ${NO(b)}`)); drawInterval(el, a, b, { ariaLabel: 'Lösung' }); },
      };
    },
  };
}

// --- Intervall hören ---
function hearInterval(level) {
  const pools = {
    hop: ['reine Prime', 'große Sekunde', 'große Terz', 'reine Quarte', 'reine Quinte', 'reine Oktave'],
    step: ['kleine Sekunde', 'große Sekunde', 'kleine Terz', 'große Terz', 'reine Quarte', 'reine Quinte', 'große Sexte', 'reine Oktave'],
    jump: ['kleine Sekunde', 'große Sekunde', 'kleine Terz', 'große Terz', 'reine Quarte', 'reine Quinte', 'kleine Sexte', 'große Sexte', 'kleine Septime', 'große Septime', 'reine Oktave'],
  };
  const pool = pools[level === 'challenge' ? 'step' : level];
  const label = T.pick(pool);
  const semis = SEMIS[label];
  const low = 55 + T.rand(10);
  const melodic = level === 'hop' || Math.random() < 0.6;
  const wrong = T.shuffle(pool.filter((l) => l !== label && SEMIS[l] !== semis)).sort((x, y) => Math.abs(SEMIS[x] - semis) - Math.abs(SEMIS[y] - semis)).slice(0, level === 'hop' ? 2 : 3);
  const play = () => (melodic ? A.playMelody([low, low + semis], { tempo: 84 }) : A.playChord([low, low + semis]));
  return mc({
    kind: 'Hören',
    title: 'Welches Intervall hörst du?',
    hint: melodic ? 'Die Töne kommen nacheinander. Denk an die Merkhilfen!' : 'Die Töne klingen zusammen.',
    pre: (body) => body.append(h('div', { class: 'btn-row' }, playButton('Abspielen', play), playButton(melodic ? 'Zusammen' : 'Nacheinander', () => (melodic ? A.playChord([low, low + semis]) : A.playMelody([low, low + semis], { tempo: 84 }))))),
    options: [{ label, correct: true }, ...wrong.map((l) => ({ label: l }))],
    cols: true,
    explain: `<p>Das war eine <strong>${label}</strong> (${semis} Halbtöne).</p>${mnemoHtml(label)}`,
  });
}

// --- Liedanfang → Intervall ---
export const SONGS = [
  ['„Alle meine Entchen“', 'große Sekunde', [60, 62]],
  ['„Kuckuck, Kuckuck, ruft’s aus dem Wald“', 'kleine Terz', [67, 64]],
  ['„O Tannenbaum“', 'reine Quarte', [62, 67]],
  ['„Morgen kommt der Weihnachtsmann“ (Mor-gen – kommt)', 'reine Quinte', [60, 67]],
  ['„When the Saints Go Marching In“', 'große Terz', [60, 64]],
  ['„My Bonnie Is Over the Ocean“', 'große Sexte', [67, 76]],
  ['„Hänschen klein“ (Häns-chen)', 'kleine Terz', [67, 64]],
  ['„Stille Nacht“ (Stil-le)', 'große Sekunde', [67, 69]],
];
function songTask() {
  const [song, label, notes] = T.pick(SONGS);
  const others = T.shuffle(Object.keys(SEMIS).filter((l) => l !== label && !l.includes('vermindert') && !l.includes('übermäßig') && !l.includes('Septime'))).slice(0, 3);
  return mc({
    kind: 'Merkhilfe',
    title: `Mit welchem Intervall beginnt ${song}?`,
    hint: 'Sing den Anfang leise vor dich hin.',
    pre: (body) => body.append(h('div', { class: 'btn-row' }, playButton('Die ersten zwei Töne', () => A.playMelody(notes, { tempo: 92 })))),
    options: [{ label, correct: true }, ...others.map((l) => ({ label: l }))],
    cols: true,
    explain: `<p>${song} beginnt mit einer <strong>${label}</strong>${notes[1] < notes[0] ? ' abwärts' : ' aufwärts'}.</p>`,
  });
}

// --- Halbtöne zählen ---
function semisTask(level) {
  const pool = level === 'jump' ? Object.keys(SEMIS).filter((l) => SEMIS[l] !== 6) : ['kleine Sekunde', 'große Sekunde', 'kleine Terz', 'große Terz', 'reine Quarte', 'reine Quinte', 'kleine Sexte', 'große Sexte', 'reine Oktave'];
  const label = T.pick(pool);
  const s = SEMIS[label];
  const opts = [...new Set([s, s + 1, s - 1, s + 2, s - 2].filter((x) => x >= 0))].slice(0, 4);
  return mc({
    kind: 'Halbtöne',
    title: `Wie viele Halbtonschritte hat eine ${label}?`,
    options: opts.map((x) => ({ label: String(x), correct: x === s })),
    cols: true,
    explain: `<p>Eine ${label} hat <strong>${s} Halbtöne</strong>. ${label.startsWith('kleine') ? 'Klein = ein Halbton weniger als groß.' : label.startsWith('große') ? 'Groß = ein Halbton mehr als klein.' : label.startsWith('reine') ? 'Prime, Quarte, Quinte und Oktave heißen „rein“.' : ''}</p>${mnemoHtml(label)}`,
  });
}

// --- Oberton notieren (Buchstabe + Vorzeichen wählen) ---
function notateUpper(level) {
  const { a, b, iv } = randomInterval(level === 'hop' ? 'step' : level, { naturalOnly: level !== 'jump' });
  let step = null, alter = 0;
  let box, api;
  const draw = () => {
    box.innerHTML = '';
    const pts = step === null ? [a] : [a, { ...T.letterUp(a, (step - a.step + 7) % 7 || (iv.number === 8 ? 7 : 0), 0), alter }];
    api = renderPitches(box, pts, { staffwidth: 200, ariaLabel: 'Dein Intervall' });
    return pts;
  };
  const upper = () => {
    const base = T.letterUp(a, ((step - a.step + 7) % 7) || (iv.number === 8 ? 7 : 0), 0);
    return { ...base, alter };
  };
  return {
    kind: 'Notenbild',
    title: `Notiere eine ${iv.label} über ${nm(a)}.`,
    hint: 'Wähle den Tonbuchstaben und das Vorzeichen. Erst zählen, dann Halbtöne prüfen.',
    render(body, ctx) {
      box = h('div', {});
      body.append(box);
      draw();
      const letters = h('div', { class: 'toggles', role: 'group', 'aria-label': 'Tonbuchstabe' });
      const L = ['c', 'd', 'e', 'f', 'g', 'a', 'h'];
      const lb = L.map((l, s) => h('button', { class: 'toggle', type: 'button', 'aria-pressed': 'false', onclick: () => { step = s; lb.forEach((x, k) => x.setAttribute('aria-pressed', String(k === s))); draw(); ctx.setReady(true); A.playNote(T.midi(upper()), { dur: 0.7 }); } }, l));
      letters.append(...lb);
      const accs = h('div', { class: 'acc-row', role: 'group', 'aria-label': 'Vorzeichen' });
      const av = [[1, '♯', 'Kreuz'], [-1, '♭', 'B'], [0, '♮', 'ohne']];
      const ab = av.map(([v, s, t]) => h('button', { class: 'btn', type: 'button', 'aria-pressed': String(v === 0), 'aria-label': t, onclick: () => { alter = v; ab.forEach((x, k) => x.setAttribute('aria-pressed', String(av[k][0] === v))); draw(); if (step !== null) A.playNote(T.midi(upper()), { dur: 0.7 }); } }, h('span', { class: 'acc-sym', 'aria-hidden': 'true' }, s), h('span', { class: 'acc-txt' }, t)));
      accs.append(...ab);
      body.append(letters, accs);
    },
    check() {
      const u = upper();
      const ok = u.step === b.step && u.alter === b.alter;
      if (!ok) api.mark(1, 'is-wrong');
      let why = '';
      if (!ok && u.step !== b.step) why = ` Zähl nochmal: ${iv.number} Stufen über ${nm(a)} landest du beim Buchstaben ${nm({ step: b.step, alter: 0 })}.`;
      else if (!ok) why = ` Der Buchstabe stimmt, aber ${nm(a)} → ${nm(u)} sind ${T.midi(u) - T.midi(a)} Halbtöne statt ${iv.semis}.`;
      return {
        ok,
        explain: `<p>${iv.label} über ${nm(a)} = <strong>${nm(b)}</strong> (${iv.semis} Halbtöne).${why}</p>${mnemoHtml(iv.label)}`,
        solution: (el) => drawInterval(el, a, b, { ariaLabel: 'Lösung' }),
      };
    },
  };
}

// --- Fehlersuche: falsch beschriftetes Intervall ---
function errorInterval(level) {
  const ivs = Array.from({ length: 3 }, () => randomInterval(level === 'hop' ? 'step' : level, { naturalOnly: level !== 'jump' }));
  const bad = T.rand(3);
  const labels = ivs.map((x, i) => {
    if (i !== bad) return x.iv.label;
    const alt = ALLOWED.jump.map(([n, q]) => labelOf(n, q)).filter((l) => l !== x.iv.label && (l.endsWith(x.iv.name) || SEMIS[l] === x.iv.semis + 1 || SEMIS[l] === x.iv.semis - 1));
    return T.pick(alt);
  });
  let chosen = null;
  let btns;
  return {
    kind: 'Fehlersuche',
    title: 'Eine Beschriftung ist falsch. Welche?',
    render(body, ctx) {
      ivs.forEach((x, i) => {
        body.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700', marginTop: '8px' } }, `${i + 1}: ${labels[i]}`));
        const box = h('div', {});
        body.append(box);
        renderPitches(box, [x.a, x.b], { staffwidth: 200, ariaLabel: `Intervall ${i + 1}` });
      });
      const wrap = h('div', { class: 'toggles', style: { gridTemplateColumns: 'repeat(3, 1fr)' }, role: 'group', 'aria-label': 'Beschriftung wählen' });
      btns = labels.map((l, i) => h('button', { class: 'toggle', type: 'button', 'aria-pressed': 'false', onclick: () => { chosen = i; btns.forEach((x, j) => x.setAttribute('aria-pressed', String(j === i))); ctx.setReady(true); } }, `Nr. ${i + 1}`));
      wrap.append(...btns);
      body.append(wrap);
    },
    check() {
      const ok = chosen === bad;
      btns[bad].classList.add('is-ok');
      if (!ok) btns[chosen].classList.add('is-bad');
      const x = ivs[bad];
      return { ok, explain: `<p>Nr. ${bad + 1}: ${nm(x.a)} → ${nm(x.b)} ist eine <strong>${x.iv.label}</strong> (${x.iv.semis} Halbtöne), keine ${labels[bad]}.</p>${mnemoHtml(x.iv.label)}` };
    },
  };
}

// =====================================================================
// CHECK DAS
// =====================================================================
function renderLearn(root) {
  learnTabs(root, [
    ['Zählen', learnCount],
    ['Groß, klein, rein', learnQuality],
    ['Merkhilfen', learnMnemo],
  ]);
}

function learnCount(p) {
  p.append(h('h3', {}, 'Was ist ein Intervall?'),
    h('p', {}, 'Ein Intervall ist der Abstand zwischen zwei Tönen. Erklingen sie nacheinander, ist es ein melodisches Intervall, erklingen sie gleichzeitig, ein harmonisches. Die Namen kommen aus dem Lateinischen und sind Ordnungszahlen: Prime = die erste, Sekunde = die zweite …'),
    h('p', {}, 'So zählst du: Starte beim unteren Ton mit 1 und zähle jede Linie und jeden Zwischenraum bis zum oberen Ton mit.'));
  const c = P(0);
  const seq = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => T.letterUp(c, i, [0, 2, 4, 5, 7, 9, 11, 12][i]));
  const items = [];
  seq.slice(1).forEach((x, i) => items.push({ chord: [c, x], len: '', pre: `"_${['2', '3', '4', '5', '6', '7', '8'][i]}"` }));
  const box = h('div', {});
  p.append(box);
  const api = renderPitches(box, seq, { items: [{ chord: [c, c], len: '', pre: '"_1"' }, ...items], ariaLabel: 'Intervalle von c¹ aus: Prime bis Oktave' });
  void api;
  p.append(h('table', { class: 'key-table' },
    h('tr', {}, h('th', {}, 'Zahl'), h('th', {}, 'Name'), h('th', {}, 'von c¹ aus')),
    ...T.INTERVAL_NAMES.map((n, i) => h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, n), h('td', {}, `c¹ – ${NO(seq[i])}`)))));
  p.append(h('div', { class: 'btn-row' }, ...[1, 2, 3, 4, 5, 6, 7].map((i) => playButton(T.INTERVAL_NAMES[i], () => A.playMelody([60, T.midi(seq[i])], { tempo: 90 })))));
  p.append(h('h3', {}, 'Intervall-Labor'),
    h('p', { class: 'muted small' }, 'Tippe zwei Tasten – du siehst den Abstand in Halbtönen und den Namen.'));
  const info = h('p', { class: 'callout', 'aria-live': 'polite' }, 'Tippe eine Taste …');
  const w = h('div', { class: 'kbd-wrap' });
  p.append(w, info);
  let last = null;
  const names = Object.entries(SEMIS);
  const kb = createKeyboard(w, {
    from: 60, to: 84, labels: true,
    onKey: (m) => {
      kb.clearMarks('is-sel');
      kb.mark(m, 'is-sel');
      if (last !== null && last !== m) {
        kb.mark(last, 'is-sel');
        const d = Math.abs(m - last);
        const n = names.filter(([, s]) => s === d).map(([l]) => l).join(' oder ');
        info.textContent = d <= 12 ? `${d} Halbtöne = ${n}` : `${d} Halbtöne – größer als eine Oktave.`;
        A.playChord([Math.min(m, last), Math.max(m, last)]);
        last = null;
      } else { info.textContent = 'Jetzt eine zweite Taste.'; last = m; }
    },
  });
}

function learnQuality(p) {
  p.append(h('h3', {}, 'Die Größe: Halbtöne zählen'),
    h('p', {}, 'Zwei Terzen können verschieden groß sein: c–e hat 4 Halbtöne (große Terz), e–g nur 3 (kleine Terz). Darum braucht ein Intervall zwei Angaben: die Zahl und die Größe.'),
    h('p', {}, 'Prime, Quarte, Quinte und Oktave heißen „rein“. Sekunde, Terz, Sexte und Septime gibt es „klein“ und „groß“.'));
  const rows = [['reine Prime', 0], ['kleine Sekunde', 1], ['große Sekunde', 2], ['kleine Terz', 3], ['große Terz', 4], ['reine Quarte', 5], ['Tritonus', 6], ['reine Quinte', 7], ['kleine Sexte', 8], ['große Sexte', 9], ['kleine Septime', 10], ['große Septime', 11], ['reine Oktave', 12]];
  p.append(h('table', { class: 'key-table' },
    h('tr', {}, h('th', {}, 'Intervall'), h('th', {}, 'Halbtöne'), h('th', {}, '')),
    ...rows.map(([l, s]) => h('tr', {}, h('td', {}, l), h('td', {}, String(s)), h('td', {}, h('button', { class: 'btn btn--sm btn--play', type: 'button', 'aria-label': `${l} anhören`, onclick: () => A.playMelody([60, 60 + s], { tempo: 96 }) }, '▶'))))));
  p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'Große und kleine Terz im Vergleich'));
  staffWithPlay(p, [P(0), P(2), P(2), P(4)], { items: [{ chord: [P(0), P(2)], len: '', pre: '"_c–e: groß"' }, { chord: [P(2), P(4)], len: '', pre: '"_e–g: klein"' }], staffwidth: 240, ariaLabel: 'c–e und e–g', onPlay: () => A.playSequence([{ midis: [60, 64], beat: 0, beats: 1.5 }, { midis: [64, 67], beat: 2, beats: 1.5 }], { tempo: 80 }) });
  p.append(callout('Tritonus:', 'Zwischen Quarte und Quinte liegt ein Abstand mit 6 Halbtönen (z. B. f–h). Er heißt Tritonus und klingt sehr spannungsvoll.'));
}

function learnMnemo(p) {
  p.append(h('h3', {}, 'Intervalle mit Liedanfängen merken'),
    h('p', {}, 'Viele Lieder beginnen mit einem typischen Intervall. Wenn du den Anfang im Kopf singst, findest du das Intervall. Alle Lieder hier sind gemeinfrei (Volkslieder oder sehr alt).'));
  const list = h('div', { class: 'mnemo' });
  const order = ['reine Prime', 'kleine Sekunde', 'große Sekunde', 'kleine Terz', 'große Terz', 'reine Quarte', 'übermäßige Quarte', 'reine Quinte', 'kleine Sexte', 'große Sexte', 'kleine Septime', 'große Septime', 'reine Oktave'];
  order.forEach((l) => {
    const m = MNEMO[l];
    const s = SEMIS[l];
    const down = m.dir === 'abwärts';
    list.append(h('div', { class: 'mnemo__row' },
      h('div', {}, h('strong', {}, `${l} (${s})`), h('span', {}, m.song.startsWith('„') ? `${m.song} – ${m.where}${m.dir && m.dir !== 'gleich' ? `, ${m.dir}` : ''}` : `${m.song}: ${m.where}`)),
      h('button', { class: 'btn btn--sm btn--play', type: 'button', 'aria-label': `${l} anhören`, onclick: () => A.playMelody(down ? [64 + s, 64] : [60, 60 + s], { tempo: 92 }) }, '▶')));
  });
  p.append(list, callout('Tipp:', 'Such dir für jedes Intervall dein eigenes Lieblingslied. Hauptsache, du kannst den Anfang sicher singen.'));
}

// =====================================================================
const facts = [
  { id: 'm5-pythagoras', title: 'Pythagoras und die Saiten', text: 'Schon im antiken Griechenland untersuchte man Intervalle mit einer Saite: Teilt man sie in der Mitte, klingt die Oktave (2:1). Bei 2/3 der Länge klingt die Quinte (3:2). Der Legende nach geht das auf Pythagoras zurück.' },
  { id: 'm5-tritonus', title: 'Das „Teufelsintervall“', text: 'Der Tritonus wurde später „diabolus in musica“ genannt – der Teufel in der Musik. Ein Verbot durch die Kirche ist aber eine Legende. Heute ist er ganz normal und steckt in vielen Akkorden, etwa im Blues.' },
  { id: 'm5-martinshorn', title: 'Tatü-tata ist eine Quarte', text: 'Das Martinshorn von Polizei, Feuerwehr und Rettungsdienst in Deutschland spielt zwei Töne im Abstand einer reinen Quarte.' },
  { id: 'm5-oktave', title: 'Die Oktave ist doppelt so schnell', text: 'Ein Ton eine Oktave höher schwingt genau doppelt so schnell. a¹ hat 440 Schwingungen pro Sekunde, a² hat 880.' },
];

export default {
  id: 'intervalle',
  num: 5,
  title: 'Intervalle',
  short: 'Von der Prime bis zur Oktave',
  color: '--c5',
  motif: 'interval',
  ready: true,
  renderLearn,
  levelInfo: {
    hop: 'Intervalle zählen (Sekunde, Terz …), hören und auf der Klaviatur spielen.',
    step: 'Groß, klein oder rein? Halbtöne zählen, Liedanfänge erkennen.',
    jump: 'Mit Vorzeichen, Septimen, Intervalle selbst notieren, Fehler finden.',
  },
  generators: {
    hop: [countInterval, hearInterval, songTask, buildOnKeys, countInterval, hearInterval],
    step: [fullInterval, hearInterval, buildOnKeys, semisTask, songTask, countInterval, notateUpper, hearInterval],
    jump: [fullInterval, notateUpper, hearInterval, errorInterval, buildOnKeys, semisTask, fullInterval, hearInterval],
  },
  speedGenerators: [() => countInterval('step'), () => fullInterval('step'), semisTask, songTask],
  facts,
};

// =====================================================================
// Modul 2 – Triolen & Synkopen (Clave, Samba, Reggae)
// =====================================================================
import * as T from '../core/theory.js';
import * as R from '../core/rhythm.js';
import * as A from '../core/audio.js';
import { h, icon, playButton } from '../ui/dom.js';
import { mc, learnTabs, renderRhythm, rhythmWithPlay, rhythmOption, playRhythm, tapTask, callout, LETTERS } from './common.js';

const B = (s) => R.parseBars(s);

// ---------- Rhythmen zum Mittippen ----------
export const TAP = {
  hop: ['4 4 4 4', '4 8 8 4 4', '8 8 4 8 8 4', '4 r4 4 8 8', '2 4 4', '8 8 8 8 4 4', '4 4 8 8 4'],
  step: ['8 4 8 4 4', '4 8 4 8 4', '8 4 8 8 4 8', 'r8 8 r8 8 r8 8 r8 8', '8 4 8 2', '4 8 4 8 8 8'],
  jump: ['t8 4 t8 4', '4 t8 4 4', 't8 t8 4 4', '4 4 t8 t8', '8 8 t8 4 4', '4. 4. 4 | r4 4 4 r4'],
};
export const SYNC_RHYTHMS = ['8 4 8 4 4', '4 8 4 8 4', '8 4 8 8 4 8', '8 4 4 4 8', '4 8 4 8 8 8'];
export const PLAIN_RHYTHMS = ['4 4 4 4', '4 8 8 4 4', '8 8 4 8 8 4', '2 4 4', '4 4 8 8 4', '8 8 8 8 4 4', '2 8 8 4', '4 4 2'];

// ---------- Grooves für das Groove-Lab und die Hör-Aufgaben ----------
const AM = [57, 60, 64], G = [55, 59, 62];
export const GROOVES = {
  clave: {
    name: '3-2-Son-Clave',
    culture: 'Kuba / Lateinamerika',
    text: 'Die Clave („Schlüssel“) ist ein Rhythmus aus fünf Schlägen über zwei Takte: drei im ersten, zwei im zweiten Takt. Sie hält Son und Salsa zusammen – alle anderen Instrumente richten sich nach ihr. Gespielt wird sie auf zwei Holzstäben, den Claves.',
    steps: 16, stepsPerBeat: 2, bpm: 100, count: ['1', '+', '2', '+', '3', '+', '4', '+'],
    layers: [
      { name: 'Clave', sound: 'clave', hits: [0, 3, 6, 10, 12] },
      { name: 'Shaker', sound: 'shaker', hits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], accents: [1, 3, 5, 7, 9, 11, 13, 15], vel: 0.8 },
      { name: 'Bass­trommel', sound: 'kick', hits: [0, 8], vel: 0.7 },
    ],
  },
  samba: {
    name: 'Samba-Batucada',
    culture: 'Brasilien (Rio de Janeiro)',
    text: 'Samba-Batucada spielt eine große Trommelgruppe im 2/4-Takt. Die tiefen Surdos geben den Puls: Eine Surdo spielt auf die 1, die andere antwortet auf die 2 – die 2 ist betont. Darüber laufen die Caixa (Schnarrtrommel) in Sechzehnteln und das helle Tamborim.',
    steps: 16, stepsPerBeat: 4, bpm: 96, count: ['1', 'e', '+', 'e', '2', 'e', '+', 'e'],
    layers: [
      { name: 'Tamborim', sound: 'tamborim', hits: [0, 2, 3, 5, 7, 8, 10, 11, 13, 15] },
      { name: 'Caixa', sound: 'caixa', hits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], accents: [0, 3, 4, 7, 8, 11, 12, 15], vel: 0.9 },
      { name: 'Surdo 2 (auf 1)', sound: 'surdoMute', hits: [0, 8], vel: 0.8 },
      { name: 'Surdo 1 (auf 2)', sound: 'surdo', hits: [4, 12] },
    ],
  },
  reggae: {
    name: 'Reggae: Offbeat & One Drop',
    culture: 'Jamaika',
    text: 'Im Reggae spielen Gitarre oder Keyboard kurze Akkorde nur auf das „und“ – den Offbeat (Skank). Beim One Drop fällt die Bassdrum zusammen mit dem Rimshot nur auf die 3 – die 1 bleibt leer. So entsteht das typische, entspannte Gefühl.',
    steps: 16, stepsPerBeat: 4, bpm: 76, count: ['1', 'e', '+', 'e', '2', 'e', '+', 'e', '3', 'e', '+', 'e', '4', 'e', '+', 'e'],
    layers: [
      { name: 'Skank (Akkord)', chords: [AM, G], hits: [2, 6, 10, 14], dur: 0.12 },
      { name: 'Hi-Hat', sound: 'hat', hits: [0, 2, 4, 6, 8, 10, 12, 14], vel: 0.8 },
      { name: 'Rimshot', sound: 'rim', hits: [8] },
      { name: 'Bassdrum', sound: 'kick', hits: [8] },
      { name: 'Bass', bass: [{ 0: 45, 3: 45, 6: 52, 12: 48 }, { 0: 43, 3: 43, 6: 50, 12: 47 }], hits: [0, 3, 6, 12], dur: 0.35 },
    ],
  },
};
function cloneGroove(g) {
  return { ...g, layers: g.layers.map((l) => ({ ...l, hits: [...l.hits], bass: l.bass && l.bass.map((b) => ({ ...b })) })) };
}

/** Raster-Ansicht eines Grooves (bearbeitbar) */
function seqGrid(container, groove, { editable = true, onChange } = {}) {
  const wrap = h('div', { class: 'seq' });
  const rows = groove.layers.map((l, li) => {
    const cells = h('div', { class: 'seq__cells', 'data-n': groove.steps, style: { gridTemplateColumns: `repeat(${groove.steps}, 1fr)` } });
    for (let s = 0; s < groove.steps; s++) {
      const on = l.hits.includes(s);
      const c = h('button', {
        class: `seq__cell ${on ? 'is-on' : ''} ${s % groove.stepsPerBeat === 0 ? 'is-beat' : ''} ${l.accents && l.accents.includes(s) ? 'is-acc' : ''}`,
        type: 'button', 'aria-pressed': String(on), 'aria-label': `${l.name}, Schritt ${s + 1}`,
        disabled: !editable,
      });
      c.addEventListener('click', () => {
        const i = l.hits.indexOf(s);
        if (i >= 0) l.hits.splice(i, 1); else l.hits.push(s);
        c.classList.toggle('is-on', i < 0);
        c.setAttribute('aria-pressed', String(i < 0));
        if (l.bass && i < 0) l.bass.forEach((b) => { if (b[s] === undefined) b[s] = b[0] || 45; });
        if (onChange) onChange();
      });
      cells.append(c);
    }
    const row = h('div', { class: 'seq__row' }, h('span', { class: 'seq__name' }, l.name), cells);
    wrap.append(row);
    return cells;
  });
  if (groove.count) {
    const cnt = h('div', { class: 'seq__count', style: { gridTemplateColumns: `repeat(${groove.steps}, 1fr)` }, 'aria-hidden': 'true' });
    for (let s = 0; s < groove.steps; s++) cnt.append(h('span', {}, groove.count[s % groove.count.length]));
    wrap.append(h('div', { class: 'seq__row' }, h('span', { class: 'seq__name' }, 'Zählen'), cnt));
  }
  container.append(wrap);
  return {
    now(s) {
      rows.forEach((r) => [...r.children].forEach((c, k) => c.classList.toggle('is-now', k === s)));
    },
    clear() { rows.forEach((r) => [...r.children].forEach((c) => c.classList.remove('is-now'))); },
    rows,
  };
}

// =====================================================================
// AUFGABEN
// =====================================================================

function tapRhythm(level) {
  const lv = level === 'challenge' ? T.pick(['hop', 'step', 'jump']) : level;
  const str = T.pick(TAP[lv]);
  const measures = B(str);
  const isClave = str.includes('|');
  const hasTri = str.includes('t');
  const hasSync = SYNC_RHYTHMS.includes(str) || str.startsWith('r8');
  return tapTask({
    title: isClave ? 'Tippe die 3-2-Son-Clave.' : hasTri ? 'Tippe den Rhythmus mit Triolen.' : hasSync ? 'Tippe den Rhythmus mit Synkope.' : 'Tippe den Rhythmus.',
    hint: hasTri ? 'Triole: drei gleich lange Töne auf einen Schlag – zähle „1-ta-te“.' : str.startsWith('r8') ? 'Nur auf das „und“ tippen – wie der Reggae-Skank.' : 'Drück auf Start, hör 1 Takt Einzählen und tippe dann mit (Bildschirm oder Leertaste).',
    measures, meter: '4/4', bpm: isClave ? 84 : hasTri ? 66 : 76, sound: isClave ? 'clave' : 'clave',
    explainOk: hasSync ? '<p>Die Synkope sitzt: Der lange Ton beginnt auf dem „und“ und klingt über den nächsten Schlag hinweg.</p>' : '',
  });
}

function hearTriplet(level) {
  const tri = Math.random() < 0.5;
  const pairs = level === 'jump'
    ? [['4 t8 4 4', '4 8 8 4 4'], ['t8 t8 4 4', '8 8 8 8 4 4'], ['2 t4', '2 4 4']]
    : [['t8 t8 t8 t8', '8 8 8 8 8 8 8 8'], ['t8 4 t8 4', '8 8 4 8 8 4']];
  const [a, b] = T.pick(pairs);
  const m = B(tri ? a : b);
  return mc({
    kind: 'Hören',
    title: 'Hörst du Triolen oder normale Achtel?',
    hint: 'Achte darauf, ob ein Schlag in zwei oder in drei Teile geteilt wird.',
    pre: (body) => body.append(h('div', { class: 'btn-row' }, playButton('Abspielen', () => playRhythm(null, m, '4/4', { bpm: 72 })))),
    options: [{ label: 'Triolen (3 pro Schlag)', correct: tri }, { label: 'Achtel (2 pro Schlag)', correct: !tri }],
    explain: `<p>Es waren <strong>${tri ? 'Triolen' : 'normale Achtel'}</strong>. ${tri ? 'Eine Achteltriole teilt einen Viertelschlag in drei gleich lange Töne.' : 'Normale Achtel teilen einen Viertelschlag in zwei Hälften.'}</p>`,
    solution: (el) => rhythmWithPlay(el, m, '4/4', { bpm: 72, playLabel: 'Nochmal anhören' }),
  });
}

function findSync() {
  const sync = B(T.pick(SYNC_RHYTHMS));
  const plain = T.shuffle(PLAIN_RHYTHMS).slice(0, 2).map(B);
  return mc({
    kind: 'Notenbild',
    title: 'Welcher Rhythmus enthält eine Synkope?',
    hint: 'Synkope: Ein Ton beginnt auf dem „und“ und hält über den nächsten Schlag.',
    options: [{ node: rhythmOption(sync, '4/4', ''), correct: true, aria: 'Rhythmus' }, ...plain.map((m) => ({ node: rhythmOption(m, '4/4', ''), aria: 'Rhythmus' }))],
    onRender: (body) => [...body.querySelectorAll('.opt__label')].forEach((l, i) => (l.textContent = LETTERS[i])),
    explain: '<p>In der Synkope beginnt ein langer Ton <strong>zwischen</strong> zwei Schlägen (auf dem „und“) und klingt über den nächsten Schlag hinweg. Dadurch wird eine unbetonte Stelle betont – das gibt Drive.</p>',
    solution: (el) => rhythmWithPlay(el, sync, '4/4', { playLabel: 'Synkope anhören' }),
  });
}

export const KNOW = [
  { q: 'Wie viele Achteltriolen passen in eine Viertel?', a: '3', w: ['2', '4', '6'], e: 'Eine Achteltriole teilt eine Viertel in <strong>drei</strong> gleiche Teile (statt zwei normale Achtel).' },
  { q: 'Wie viele Vierteltriolen passen in eine halbe Note?', a: '3', w: ['2', '4', '6'], e: 'Drei Vierteltriolen dauern so lang wie <strong>eine halbe Note</strong> (statt zwei Viertel).' },
  { q: 'Was zeigt die kleine 3 über einer Notengruppe?', a: 'Eine Triole', w: ['Den 3/4-Takt', 'Dreimal wiederholen', 'Den dritten Finger'], e: 'Die 3 mit Klammer oder Balken bedeutet: <strong>Triole</strong> – drei Töne in der Zeit von zwei.' },
  { q: 'Was ist eine Synkope?', a: 'Eine Betonung auf einer unbetonten Stelle', w: ['Eine sehr lange Pause', 'Drei Töne auf einen Schlag', 'Ein besonders lauter Schlag auf die 1'], e: 'Bei der Synkope wird eine <strong>unbetonte Zählzeit betont</strong>, meist weil ein Ton auf dem „und“ beginnt und über den Schlag hält.' },
  { q: 'Worauf spielt der Skank im Reggae?', a: 'Auf das „und“ (Offbeat)', w: ['Auf die 1', 'Auf jeden Schlag', 'Nur auf die 3'], e: 'Der Skank (kurzer Gitarren- oder Keyboardakkord) liegt auf dem <strong>Offbeat</strong> – zwischen den Schlägen.' },
  { q: 'Wie viele Schläge hat die Son-Clave in zwei Takten?', a: '5', w: ['4', '6', '8'], e: 'Die Son-Clave hat <strong>fünf</strong> Schläge: drei in einem Takt, zwei im anderen (3-2 oder 2-3).' },
  { q: 'In welcher Taktart wird Samba meist notiert?', a: '2/4', w: ['3/4', '6/8', '5/4'], e: 'Samba wird meist im <strong>2/4-Takt</strong> notiert und schnell gespielt. Die tiefe Surdo betont die 2.' },
  { q: 'Wo liegt beim „One Drop“ die Bassdrum?', a: 'Auf der 3', w: ['Auf der 1', 'Auf 1 und 3', 'Auf jedem Schlag'], e: 'Beim One Drop fällt die Bassdrum nur auf die <strong>3</strong>. Die 1 bleibt frei – typisch Reggae.' },
];
function knowTask(level) {
  const pool = level === 'hop' ? KNOW.slice(0, 5) : KNOW;
  const k = T.pick(pool);
  return mc({ kind: 'Wissen', title: k.q, options: [{ label: k.a, correct: true }, ...k.w.map((w) => ({ label: w }))], explain: `<p>${k.e}</p>` });
}

function whichGroove() {
  const keys = Object.keys(GROOVES);
  const k = T.pick(keys);
  const g = GROOVES[k];
  let playing = false;
  return mc({
    kind: 'Hören',
    title: 'Welcher Groove ist das?',
    hint: 'Hör auf die typischen Instrumente und darauf, wo die Betonungen liegen.',
    pre: (body) => {
      const btn = h('button', { class: 'btn btn--play', type: 'button' }, icon('play'), 'Abspielen');
      btn.addEventListener('click', () => {
        if (playing) { A.stopAll(); playing = false; btn.lastChild.textContent = 'Abspielen'; return; }
        playing = true;
        btn.lastChild.textContent = 'Stopp';
        A.startGroove({ ...cloneGroove(g) });
        setTimeout(() => { if (playing) { A.stopAll(); playing = false; btn.lastChild.textContent = 'Abspielen'; } }, 9000);
      });
      body.append(h('div', { class: 'btn-row' }, btn));
    },
    options: keys.map((x) => ({ label: `${GROOVES[x].name} (${GROOVES[x].culture})`, correct: x === k })),
    explain: () => {
      A.stopAll();
      return `<p>Das war <strong>${g.name}</strong>. ${k === 'clave' ? 'Erkennungszeichen: fünf helle Holzschläge über zwei Takte (3 + 2).' : k === 'samba' ? 'Erkennungszeichen: tiefe Surdos mit Betonung auf der 2, durchlaufende Sechzehntel der Caixa.' : 'Erkennungszeichen: kurze Akkorde nur auf dem „und“, Bassdrum auf der 3.'}</p>`;
    },
  });
}

function buildPattern(level) {
  const which = level === 'jump' ? T.pick(['clave', 'clave', 'skank']) : 'skank';
  const target = which === 'clave' ? [0, 3, 6, 10, 12] : [1, 3, 5, 7, 9, 11, 13, 15];
  const g = { steps: 16, stepsPerBeat: 2, bpm: which === 'clave' ? 100 : 80, count: ['1', '+', '2', '+', '3', '+', '4', '+'], layers: [{ name: which === 'clave' ? 'Clave' : 'Skank', sound: which === 'clave' ? 'clave' : 'rim', hits: [] }] };
  let grid;
  const demo = () => A.startGroove({ ...g, layers: [{ ...g.layers[0], hits: target }, { name: 'Klick', sound: 'click', hits: [0, 2, 4, 6, 8, 10, 12, 14], vel: 0.6 }], onStep: (s) => grid.now(s) });
  const mine = () => A.startGroove({ ...g, layers: [g.layers[0], { name: 'Klick', sound: 'click', hits: [0, 2, 4, 6, 8, 10, 12, 14], vel: 0.6 }], onStep: (s) => grid.now(s) });
  return {
    kind: 'Raster',
    title: which === 'clave' ? 'Baue die 3-2-Son-Clave im Raster.' : 'Baue den Reggae-Skank: Schläge nur auf jedes „und“.',
    hint: which === 'clave' ? 'Zwei Takte in Achteln. Drei Schläge im ersten Takt, zwei im zweiten. Tipp: Hör sie dir vorher an.' : 'Zwei Takte in Achteln. Tippe die Felder an, die gespielt werden sollen.',
    render(body, ctx) {
      grid = seqGrid(body, g, { onChange: () => ctx.setReady(g.layers[0].hits.length > 0) });
      body.append(h('div', { class: 'btn-row' },
        playButton('Vorbild anhören', demo),
        playButton('Mein Muster', mine),
        h('button', { class: 'btn', type: 'button', onclick: () => { A.stopAll(); grid.clear(); } }, icon('stop'), 'Stopp')));
    },
    check() {
      A.stopAll();
      grid.clear();
      const hits = g.layers[0].hits;
      const ok = hits.length === target.length && target.every((x) => hits.includes(x));
      [...grid.rows[0].children].forEach((c, s) => {
        if (target.includes(s)) c.classList.add(hits.includes(s) ? 'is-ok' : 'is-bad');
        else if (hits.includes(s)) c.classList.add('is-bad');
      });
      return {
        ok,
        explain: which === 'clave'
          ? '<p>3-2-Son-Clave: Takt 1 auf <strong>1, 2+ und 4</strong>, Takt 2 auf <strong>2 und 3</strong>. Grün umrandet = richtige Felder, gestrichelt = falsch oder fehlt.</p>'
          : '<p>Der Skank liegt auf <strong>jedem „und“</strong> (2., 4., 6. und 8. Feld jedes Takts) – nie auf dem Schlag selbst.</p>',
      };
    },
  };
}

function errorTriplet() {
  const pool = ['t8 4 t8 4', '4 t8 4 4', 't8 t8 4 4', '2 t4', '4 4 t8 t8', '8 8 t8 4 4', '4 8 8 t8 4'];
  const bars = T.shuffle(pool).slice(0, 4).map((s) => R.parseRhythm(s));
  const bad = T.rand(4);
  // eine Viertel durch eine Vierteltriole (= Halbe) ersetzen → Takt zu lang
  const m = bars[bad];
  const qi = m.findIndex((it) => !it.tri && it.u === 12);
  if (qi >= 0) m[qi] = { tri: [{ u: 8 }, { u: 8 }, { u: 8 }] };
  else m.push({ u: 12 });
  let chosen = null;
  let btns;
  const q = (u) => `${u / 12} Viertel`.replace('.5', ',5');
  return {
    kind: 'Fehlersuche',
    title: 'Ein Takt hat zu viele Zählzeiten. Welcher?',
    hint: '4/4-Takt. Achteltriole (3 Töne) = 1 Viertel, Vierteltriole (3 Töne) = 2 Viertel.',
    render(body, ctx) {
      const box = h('div', {});
      body.append(box);
      renderRhythm(box, bars, '4/4', { oneLine: true, ariaLabel: 'Vier Takte mit Triolen' });
      const wrap = h('div', { class: 'toggles', style: { gridTemplateColumns: 'repeat(4, 1fr)' }, role: 'group', 'aria-label': 'Takt wählen' });
      btns = bars.map((_, i) => h('button', { class: 'toggle', type: 'button', 'aria-pressed': 'false', onclick: () => { chosen = i; btns.forEach((x, j) => x.setAttribute('aria-pressed', String(j === i))); ctx.setReady(true); } }, `Takt ${i + 1}`));
      wrap.append(...btns);
      body.append(wrap);
    },
    check() {
      const ok = chosen === bad;
      btns[bad].classList.add('is-ok');
      if (!ok) btns[chosen].classList.add('is-bad');
      return { ok, explain: `<p>Takt ${bad + 1} hat ${q(R.measureUnits(bars[bad]))} statt 4 Viertel. ${qi >= 0 ? 'Die Vierteltriole dauert so lang wie eine halbe Note – nicht wie eine Viertel.' : ''}</p><ul>${bars.map((mm, i) => `<li>Takt ${i + 1}: ${q(R.measureUnits(mm))}</li>`).join('')}</ul>` };
    },
  };
}

// =====================================================================
// CHECK DAS
// =====================================================================
function renderLearn(root) {
  learnTabs(root, [
    ['Triolen', learnTriplets],
    ['Synkopen', learnSync],
    ['Groove-Lab', learnLab],
  ]);
}

function learnTriplets(p) {
  p.append(h('h3', {}, 'Drei statt zwei'),
    h('p', {}, 'Normalerweise teilt man einen Viertelschlag in zwei Achtel. Bei einer Triole teilt man ihn in drei gleich lange Töne. Man erkennt sie an der kleinen 3 über der Gruppe.'),
    h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'Achtel: „1 und 2 und …“'));
  rhythmWithPlay(p, B('8 8 8 8 8 8 8 8'), '4/4', { bpm: 72, playLabel: 'Achtel anhören' });
  p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'Achteltriolen: „1-ta-te 2-ta-te …“'));
  rhythmWithPlay(p, B('t8 t8 t8 t8'), '4/4', { bpm: 72, playLabel: 'Triolen anhören' });
  p.append(h('h3', {}, 'Vierteltriolen'),
    h('p', {}, 'Drei Vierteltriolen dauern so lang wie eine halbe Note. Sie klingen, als würde die Musik kurz „schweben“.'));
  rhythmWithPlay(p, B('2 t4 | 4 4 4 4'), '4/4', { bpm: 72, playLabel: 'Vierteltriole anhören' });
  p.append(callout('Wo hörst du Triolen?', 'Im Blues und Swing, im 12/8-Feeling vieler Soul-Balladen, in westafrikanischer Trommelmusik und in vielen Filmmusiken.'));
}

function learnSync(p) {
  p.append(h('h3', {}, 'Betonung gegen den Schlag'),
    h('p', {}, 'Bei einer Synkope wird eine eigentlich unbetonte Stelle betont. Meist beginnt ein Ton auf dem „und“ und klingt über den nächsten Schlag hinweg. Das wirkt, als würde der Rhythmus nach vorne stolpern – das gibt Drive.'),
    h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'Ohne Synkope'));
  rhythmWithPlay(p, B('4 4 4 4'), '4/4', { playLabel: 'Anhören' });
  p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'Mit Synkope: Achtel – Viertel – Achtel'));
  rhythmWithPlay(p, B('8 4 8 4 4'), '4/4', { playLabel: 'Synkope anhören' });
  p.append(h('p', { class: 'staff-cap', style: { color: 'var(--text)', fontWeight: '700' } }, 'Synkopen auf 1+ und 2+'));
  rhythmWithPlay(p, B('4 8 4 8 4'), '4/4', { playLabel: 'Anhören' });
  p.append(h('h3', {}, 'Offbeat'),
    h('p', {}, 'Wenn nur die „und“-Stellen gespielt werden, spricht man vom Offbeat. Genau so klingt der Skank im Reggae.'));
  rhythmWithPlay(p, B('r8 8 r8 8 r8 8 r8 8'), '4/4', { sound: 'rim', playLabel: 'Offbeat anhören' });
  p.append(h('h3', {}, 'Die Clave'),
    h('p', {}, 'Die 3-2-Son-Clave aus Kuba ist voller Synkopen: Der zweite Schlag liegt auf 2+, also zwischen den Schlägen.'));
  rhythmWithPlay(p, B('4. 4. 4 | r4 4 4 r4'), '4/4', { bpm: 92, playLabel: 'Clave anhören' });
}

function learnLab(p) {
  p.append(h('h3', {}, 'Groove-Lab'),
    h('p', {}, 'Wähle einen Groove, drück auf Play und schalte einzelne Instrumente stumm. Du kannst Felder im Raster antippen und so dein eigenes Pattern bauen.'));
  const sel = h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Groove wählen' });
  const out = h('div', {});
  let current = 'clave';
  let state = null;
  let groove = null;
  let grid = null;
  const playBtn = h('button', { class: 'btn btn--primary', type: 'button' }, icon('play'), 'Play');
  const tempo = h('input', { type: 'range', min: '60', max: '130', value: '100', 'aria-label': 'Tempo in BPM' });
  const tempoOut = h('output', {}, '100 BPM');
  let playing = false;
  function stop() { A.stopAll(); playing = false; playBtn.innerHTML = ''; playBtn.append(icon('play'), 'Play'); if (grid) grid.clear(); }
  function start() {
    state = A.startGroove({ ...groove, bpm: Number(tempo.value), onStep: (s) => grid.now(s) });
    playing = true;
    playBtn.innerHTML = '';
    playBtn.append(icon('stop'), 'Stopp');
  }
  playBtn.addEventListener('click', () => (playing ? stop() : start()));
  tempo.addEventListener('input', () => { tempoOut.textContent = `${tempo.value} BPM`; if (state) state.bpm = Number(tempo.value); });
  function draw() {
    stop();
    groove = cloneGroove(GROOVES[current]);
    tempo.value = groove.bpm;
    tempoOut.textContent = `${groove.bpm} BPM`;
    out.innerHTML = '';
    out.append(h('p', {}, h('strong', {}, `${groove.name} · ${groove.culture}. `), groove.text));
    grid = seqGrid(out, groove);
    const mutes = h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Instrumente an/aus' });
    groove.layers.forEach((l) => {
      const b = h('button', { class: 'tab', type: 'button', 'aria-pressed': 'true', 'aria-selected': 'true' }, l.name.replace('­', ''));
      b.addEventListener('click', () => { l.muted = !l.muted; b.setAttribute('aria-pressed', String(!l.muted)); b.setAttribute('aria-selected', String(!l.muted)); });
      mutes.append(b);
    });
    out.append(h('p', { class: 'muted small' }, 'Instrumente an/aus:'), mutes,
      h('button', { class: 'btn btn--sm', type: 'button', onclick: () => draw() }, icon('undo'), 'Original wiederherstellen'));
  }
  Object.keys(GROOVES).forEach((k) => {
    const b = h('button', { class: 'tab', type: 'button', 'aria-selected': String(k === current) }, GROOVES[k].name.split(':')[0]);
    b.addEventListener('click', () => { current = k; [...sel.children].forEach((x) => x.setAttribute('aria-selected', String(x === b))); draw(); });
    sel.append(b);
  });
  p.append(sel, h('div', { class: 'btn-row' }, playBtn), h('div', { class: 'tempo' }, h('span', { class: 'small muted' }, 'Tempo'), tempo, tempoOut), out,
    callout('Respekt vor dem Original:', 'Die Grooves hier sind vereinfachte Grundmuster. In echten Samba-Schulen, Son-Bands und Reggae-Bands spielen die Musikerinnen und Musiker viele Variationen – hör dir unbedingt echte Aufnahmen an!', true));
  draw();
}

// =====================================================================
const facts = [
  { id: 'm2-clave', title: 'Die Clave ist der „Schlüssel“', text: 'Das spanische Wort „clave“ heißt Schlüssel. In der kubanischen Musik ist sie der rhythmische Schlüssel: Spielt jemand „gegen die Clave“, klingt das für Kennerinnen und Kenner sofort falsch.' },
  { id: 'm2-samba', title: 'Hunderte Trommeln auf einmal', text: 'Beim Karneval in Rio de Janeiro ziehen Sambaschulen mit einer Bateria von oft 200 bis 300 Trommlerinnen und Trommlern durch das Sambódromo. Ein Dirigent, der Mestre, gibt mit Pfeife und Handzeichen die Einsätze.' },
  { id: 'm2-reggae', title: 'Reggae ist Weltkulturerbe', text: 'Die UNESCO hat Reggae aus Jamaika 2018 in die Liste des immateriellen Kulturerbes der Menschheit aufgenommen.' },
  { id: 'm2-onedrop', title: 'Warum „One Drop“?', text: 'Beim One Drop „fällt“ die Bassdrum nur einmal pro Takt – auf die 3. Diese Spielweise prägte der Schlagzeuger Carlton Barrett, der lange mit Bob Marley spielte.' },
  { id: 'm2-swing', title: 'Swing steckt voller Triolen', text: 'Im Jazz werden Achtel oft „geswingt“: Sie klingen ungefähr wie die erste und dritte Note einer Triole – lang, kurz, lang, kurz.' },
];

export default {
  id: 'rhythmus',
  num: 2,
  title: 'Triolen & Synkopen',
  short: 'Clave, Samba, Reggae-Offbeat',
  color: '--c2',
  motif: 'circle',
  ready: true,
  renderLearn,
  levelInfo: {
    hop: 'Einfache Rhythmen mittippen, Triolen hören, Offbeat ausprobieren.',
    step: 'Synkopen erkennen und tippen, Grooves aus Samba und Reggae hören.',
    jump: 'Triolen tippen, Clave bauen, Fehler finden.',
  },
  generators: {
    hop: [tapRhythm, knowTask, hearTriplet, tapRhythm, buildPattern, knowTask],
    step: [tapRhythm, findSync, knowTask, whichGroove, hearTriplet, buildPattern],
    jump: [tapRhythm, buildPattern, findSync, whichGroove, errorTriplet, hearTriplet, knowTask],
  },
  speedGenerators: [knowTask, findSync, () => hearTriplet('hop'), errorTriplet],
  facts,
};

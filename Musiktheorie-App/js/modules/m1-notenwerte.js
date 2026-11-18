// =====================================================================
// Modul 1 – Notenwerte & Pausen
// =====================================================================
import * as T from '../core/theory.js';
import * as R from '../core/rhythm.js';
import * as A from '../core/audio.js';
import { h, icon, playButton } from '../ui/dom.js';
import { mc, learnTabs, renderRhythm, rhythmWithPlay, rhythmOption, playRhythm, callout, LETTERS } from './common.js';

const V = { 48: 'ganze Note', 24: 'halbe Note', 12: 'Viertelnote', 6: 'Achtelnote', 3: 'Sechzehntelnote', 36: 'punktierte halbe Note', 18: 'punktierte Viertelnote', 9: 'punktierte Achtelnote' };
const P = { 48: 'ganze Pause', 24: 'halbe Pause', 12: 'Viertelpause', 6: 'Achtelpause', 3: 'Sechzehntelpause' };
const nameOf = (u, rest) => (rest ? P[u] : V[u]);
const SHORT_NAME = { 48: 'Ganze', 24: 'Halbe', 12: 'Viertel', 6: 'Achtel', 3: 'Sechzehntel', 36: 'punktierte Halbe', 18: 'punktierte Viertel', 9: 'punktierte Achtel' };
/** Dauer in Vierteln als Text */
function inQuarters(u) {
  const q = u / 12;
  const map = { 4: '4 Viertel', 2: '2 Viertel', 1: '1 Viertel', 0.5: '½ Viertel', 0.25: '¼ Viertel', 3: '3 Viertel', 1.5: '1½ Viertel', 0.75: '¾ Viertel' };
  return map[q] || `${q} Viertel`;
}
function sumText(items) {
  return items.map((it) => SHORT_NAME[it.u] + (it.rest ? 'pause' : '')).join(' + ');
}

// ---------- Zufallstakte, die nach Zählzeiten sinnvoll notiert sind ----------
const BEAT_PATTERNS = {
  hop: ['4', '8 8', 'r4'],
  step: ['4', '8 8', '16 16 16 16', '8 16 16', '16 16 8', 'r4', 'r8 8'],
  jump: ['4', '8 8', '16 16 16 16', '8 16 16', '16 16 8', '8. 16', 'r4', 'r8 8'],
};
const TWO_BEAT = { hop: ['2'], step: ['2'], jump: ['2', '4. 8'] };
const SIX8 = ['8 8 8', '4 8', '4.', '16 16 8 8', 'r8 8 8', '8 4'];

export function genMeasure(meter, level = 'hop') {
  const lv = level === 'challenge' ? 'step' : level;
  if (meter === '6/8') {
    if (Math.random() < 0.12) return R.parseRhythm('2.');
    return [...R.parseRhythm(T.pick(SIX8)), ...R.parseRhythm(T.pick(SIX8))];
  }
  const beats = R.METERS[meter].beats;
  if (meter === '4/4' && Math.random() < 0.08) return R.parseRhythm('1');
  if (meter !== '2/4' && Math.random() < 0.08) return R.parseRhythm(meter === '3/4' ? '2.' : '2. 4');
  const out = [];
  let b = 0;
  while (b < beats) {
    const canTwo = beats - b >= 2 && (meter !== '4/4' || b % 2 === 0);
    if (canTwo && Math.random() < 0.3) { out.push(...R.parseRhythm(T.pick(TWO_BEAT[lv]))); b += 2; }
    else { out.push(...R.parseRhythm(T.pick(BEAT_PATTERNS[lv]))); b += 1; }
  }
  return out;
}

// =====================================================================
// AUFGABEN
// =====================================================================

// --- Notenwert / Pause benennen ---
function nameValue(level) {
  const notePool = level === 'hop' ? [48, 24, 12, 6] : level === 'step' ? [48, 24, 12, 6, 3] : [24, 12, 6, 3, 36, 18, 9];
  const restPool = level === 'hop' ? [] : level === 'step' ? [48, 24, 12, 6] : [48, 24, 12, 6, 3];
  const useRest = restPool.length && Math.random() < 0.45;
  const u = T.pick(useRest ? restPool : notePool);
  const pool = useRest ? restPool : notePool;
  const wrong = T.shuffle(pool.filter((x) => x !== u)).slice(0, 3);
  const name = nameOf(u, useRest);
  let explain;
  if (useRest && (u === 48 || u === 24)) explain = `<p>Das ist eine <strong>${name}</strong>. Merkhilfe: Die ganze Pause <em>hängt</em> unter der Linie (sie ist schwer), die halbe Pause <em>sitzt</em> auf der Linie.</p>`;
  else if (useRest) explain = `<p>Das ist eine <strong>${name}</strong>. Sie dauert so lang wie eine ${V[u]}: ${inQuarters(u)}.</p>`;
  else if ([36, 18, 9].includes(u)) explain = `<p>Das ist eine <strong>${name}</strong>. Der Punkt verlängert die Note um die Hälfte ihres Werts: ${SHORT_NAME[u / 1.5]} + ${SHORT_NAME[u / 3]}.</p>`;
  else explain = `<p>Das ist eine <strong>${name}</strong> (${inQuarters(u)}). ${{ 48: 'Hohler Kopf, kein Hals.', 24: 'Hohler Kopf mit Hals.', 12: 'Gefüllter Kopf mit Hals.', 6: 'Gefüllter Kopf, Hals und ein Fähnchen.', 3: 'Gefüllter Kopf, Hals und zwei Fähnchen.' }[u]}</p>`;
  return mc({
    kind: useRest ? 'Pausen' : 'Notenwerte',
    title: useRest ? 'Welche Pause ist das?' : 'Welcher Notenwert ist das?',
    pre: (body) => { const b = h('div', { class: 'staff--narrow' }); body.append(b); renderRhythm(b, [[{ u, rest: useRest }]], '4/4', { oneLine: false, showMeter: false, staffwidth: 150, ariaLabel: 'Ein einzelnes Zeichen im Notensystem' }); },
    options: [{ label: name, correct: true }, ...wrong.map((w) => ({ label: nameOf(w, useRest) }))],
    cols: true,
    explain,
  });
}

// --- Wie viele passen hinein? ---
function countFit(level) {
  const pairs = level === 'hop'
    ? [[48, 12], [24, 12], [48, 24], [12, 6], [24, 6]]
    : level === 'step'
      ? [[48, 6], [24, 6], [12, 3], [24, 3], [48, 3], [6, 3]]
      : [[36, 12], [18, 6], [36, 6], [18, 3], [9, 3], [48, 6]];
  const [big, small] = T.pick(pairs);
  const n = big / small;
  const distract = T.shuffle([n - 1, n + 1, n * 2, n + 2, Math.max(1, n / 2)].filter((x) => x !== n && x > 0 && Number.isInteger(x)));
  const opts = [n, ...[...new Set(distract)].slice(0, 3)];
  return mc({
    kind: 'Notenwerte rechnen',
    title: `Wie viele ${SHORT_NAME[small]} passen in eine ${SHORT_NAME[big]}?`,
    pre: (body) => {
      const row = h('div', { class: 'two-staffs' });
      const a = h('div', {}), b = h('div', {});
      row.append(a, b);
      body.append(row);
      renderRhythm(a, [[{ u: big }]], '4/4', { oneLine: false, showMeter: false, staffwidth: 120, ariaLabel: SHORT_NAME[big] });
      renderRhythm(b, [[{ u: small }]], '4/4', { oneLine: false, showMeter: false, staffwidth: 120, ariaLabel: SHORT_NAME[small] });
    },
    options: opts.map((x) => ({ label: String(x), correct: x === n })),
    cols: true,
    explain: `<p>Eine ${SHORT_NAME[big]} dauert ${inQuarters(big)}, eine ${SHORT_NAME[small]} ${inQuarters(small)}. Also passen <strong>${n}</strong> ${SHORT_NAME[small]} hinein.</p>`,
  });
}

// --- Takt füllen (Baukasten) ---
function fillMeasure(level) {
  const meter = level === 'hop' ? T.pick(['4/4', '3/4']) : level === 'step' ? T.pick(['4/4', '3/4', '2/4']) : T.pick(['4/4', '3/4', '6/8']);
  const bar = R.METERS[meter].units;
  // ein Stück ist schon vorgegeben
  const full = genMeasure(meter, level === 'jump' ? 'step' : level);
  const given = [];
  for (const it of full) { if (it.tri || R.measureUnits([...given, it]) > bar / 2) break; given.push(it); }
  const palette = level === 'hop' ? [24, 12, 6] : level === 'step' ? [24, 12, 6, 3, { u: 12, rest: true }] : [24, 18, 12, 6, 3, { u: 12, rest: true }, { u: 6, rest: true }];
  const added = [];
  let api, gauge, info;
  const showGauge = level === 'hop';
  const draw = () => {
    const items = [...given, ...added];
    const sum = R.measureUnits(items);
    api.innerHTML = '';
    try {
      renderRhythm(api, [items], meter, { oneLine: false, ariaLabel: `Takt mit ${sumText(items)}` });
    } catch (e) {
      api.textContent = sumText(items);
    }
    if (gauge) gauge.firstChild.style.width = `${Math.min(100, (sum / bar) * 100)}%`;
    info.textContent = sum > bar ? 'Zu viel! Nimm etwas zurück.' : sum === bar ? 'Takt voll.' : showGauge ? `Noch frei: ${inQuarters(bar - sum)}` : 'Füge Notenwerte hinzu.';
    return sum;
  };
  return {
    kind: 'Takt-Baukasten',
    title: `Fülle den ${meter}-Takt genau voll.`,
    hint: `Ein ${meter}-Takt hat ${meter === '6/8' ? '6 Achtel' : inQuarters(bar)}. Tippe Notenwerte an, um sie anzuhängen.`,
    render(body, ctx) {
      api = h('div', {});
      body.append(api);
      if (showGauge) { gauge = h('div', { class: 'progress progress--lg', 'aria-hidden': 'true' }, h('div', { class: 'progress__fill' })); body.append(gauge); }
      info = h('p', { class: 'task__hint', 'aria-live': 'polite' });
      body.append(info);
      const pal = h('div', { class: 'value-palette', role: 'group', 'aria-label': 'Notenwerte' });
      palette.forEach((p) => {
        const it = typeof p === 'number' ? { u: p } : p;
        const b = h('button', { class: 'value-btn', type: 'button', 'aria-label': nameOf(it.u, it.rest) + ' anhängen' });
        pal.append(b);
        b.addEventListener('click', () => { added.push({ ...it }); const s = draw(); ctx.setReady(s >= bar); });
        b._render = () => {
          const box = h("div", { class: "value-btn__staff" });
          b.append(box, h("span", {}, SHORT_NAME[it.u] + (it.rest ? "pause" : "")));
          renderRhythm(box, [[it]], "4/4", { oneLine: true, showMeter: false, staffwidth: 60, ariaLabel: nameOf(it.u, it.rest) });
        };
      });
      const undo = h('button', { class: 'btn btn--sm', type: 'button' }, icon('undo'), 'Zurück');
      undo.addEventListener('click', () => { added.pop(); const s = draw(); ctx.setReady(s >= bar); });
      const play = playButton('Anhören', () => playRhythm(null, [[...given, ...added]], meter, { countIn: false, bpm: 84 }));
      body.append(pal, h("div", { class: "btn-row" }, undo, play));
      [...pal.children].forEach((b) => b._render());
      draw();
    },
    check() {
      const items = [...given, ...added];
      const sum = R.measureUnits(items);
      const ok = sum === bar;
      const quarters = (u) => (meter === '6/8' ? `${u / 6} Achtel` : inQuarters(u));
      return {
        ok,
        explain: `<p>${sumText(items)} = <strong>${quarters(sum)}</strong>. ${ok ? `Genau ${quarters(bar)} – der Takt ist voll.` : sum > bar ? `Das sind ${quarters(sum - bar)} zu viel.` : `Es fehlen noch ${quarters(bar - sum)}.`}</p>`,
      };
    },
  };
}

// --- Welcher Wert fehlt? ---
function missingValue(level) {
  const meter = level === 'jump' ? T.pick(['4/4', '3/4', '6/8']) : T.pick(['4/4', '3/4']);
  let m, idx;
  for (let i = 0; i < 30; i++) {
    m = genMeasure(meter, level);
    const cands = m.map((it, k) => k).filter((k) => !m[k].tri && (level !== 'hop' || [24, 12, 6].includes(m[k].u)));
    if (m.length >= 2 && cands.length) { idx = T.pick(cands); break; }
  }
  const missing = m[idx];
  const shown = m.map((it, k) => (k === idx ? { u: it.u, gap: true } : it));
  const pool = [48, 24, 12, 6, 3, 36, 18, 9].filter((u) => u !== missing.u && (level === 'jump' || ![36, 9].includes(u)));
  const wrong = T.shuffle(pool).slice(0, 3);
  const others = m.filter((_, k) => k !== idx);
  const bar = R.METERS[meter].units;
  const unitTxt = (u) => (meter === '6/8' ? `${u / 6} Achtel` : inQuarters(u));
  return mc({
    kind: 'Lücke füllen',
    title: `Welcher Wert gehört an die Stelle mit dem Fragezeichen?`,
    hint: `Der Takt ist ein ${meter}-Takt.`,
    pre: (body) => { const b = h('div', {}); body.append(b); renderRhythm(b, [shown], meter, { oneLine: false, ariaLabel: `${meter}-Takt mit einer Lücke` }); },
    options: [{ label: nameOf(missing.u, missing.rest), correct: true }, ...wrong.map((u) => ({ label: nameOf(u, missing.rest && P[u]) || V[u] }))],
    cols: true,
    explain: `<p>Der Takt braucht ${unitTxt(bar)}. Vorhanden sind ${unitTxt(R.measureUnits(others))} (${sumText(others)}). Es fehlen <strong>${unitTxt(missing.u)}</strong> – also eine ${nameOf(missing.u, missing.rest)}.</p>`,
    solution: (el) => rhythmWithPlay(el, [m], meter, { oneLine: false, countIn: false, playLabel: 'Lösung anhören' }),
  });
}

// --- Fehlersuche: Welcher Takt stimmt nicht? ---
function errorMeasure(level) {
  const meter = level === 'jump' ? T.pick(['4/4', '3/4', '6/8']) : T.pick(['4/4', '3/4']);
  const n = 4;
  const bars = Array.from({ length: n }, () => genMeasure(meter, level === 'hop' ? 'hop' : 'step'));
  const bad = T.rand(n);
  // einen Wert so verändern, dass die Summe nicht mehr stimmt
  const b = bars[bad];
  const k = b.findIndex((it) => !it.tri && [24, 12, 6].includes(it.u)) >= 0 ? b.findIndex((it) => !it.tri && [24, 12, 6].includes(it.u)) : 0;
  const swap = { 24: T.pick([12, 36]), 12: T.pick([6, 24, 18]), 6: T.pick([12, 3]) }[b[k].u] || 12;
  b[k] = { ...b[k], u: swap };
  const barU = R.METERS[meter].units;
  const unitTxt = (u) => (meter === '6/8' ? `${u / 6} Achtel` : inQuarters(u));
  let chosen = null;
  let btns;
  return {
    kind: 'Fehlersuche',
    title: 'In einem Takt stimmt die Anzahl der Zählzeiten nicht. In welchem?',
    hint: `${meter}-Takt: Jeder Takt muss genau ${unitTxt(barU)} haben.`,
    render(body, ctx) {
      const box = h('div', {});
      body.append(box);
      renderRhythm(box, bars, meter, { oneLine: false, ariaLabel: `Vier Takte im ${meter}-Takt` });
      const wrap = h('div', { class: 'toggles', style: { gridTemplateColumns: 'repeat(4, 1fr)' }, role: 'group', 'aria-label': 'Takt wählen' });
      btns = bars.map((_, i) => h('button', {
        class: 'toggle', type: 'button', 'aria-pressed': 'false',
        onclick: () => { chosen = i; btns.forEach((x, j) => x.setAttribute('aria-pressed', String(j === i))); ctx.setReady(true); },
      }, `Takt ${i + 1}`));
      wrap.append(...btns);
      body.append(wrap);
    },
    check() {
      const ok = chosen === bad;
      btns[bad].classList.add('is-ok');
      if (!ok) btns[chosen].classList.add('is-bad');
      const rows = bars.map((m, i) => `<li>Takt ${i + 1}: ${unitTxt(R.measureUnits(m))}${i === bad ? ' ✗' : ' ✓'}</li>`).join('');
      return { ok, explain: `<p>Takt ${bad + 1} hat ${unitTxt(R.measureUnits(bars[bad]))} statt ${unitTxt(barU)}.</p><ul>${rows}</ul>` };
    },
  };
}

// --- Taktart erkennen ---
function meterTask(level) {
  const meters = level === 'jump' ? ['2/4', '4/4', T.pick(['3/4', '6/8'])] : ['2/4', '3/4', '4/4'];
  const meter = T.pick(meters);
  const bars = [genMeasure(meter, level), genMeasure(meter, level)];
  const why = meter === '6/8'
    ? '6/8: zwei Schwerpunkte mit je drei Achteln. Die Achtel sind in Dreiergruppen verbunden – daran erkennst du ihn.'
    : `${meter}: ${R.METERS[meter].beats} Viertel pro Takt.`;
  return mc({
    kind: 'Taktart',
    title: 'Welche Taktart passt?',
    hint: 'Die Taktangabe ist versteckt. Zähle, wie lang jeder Takt ist.',
    pre: (body) => { const b = h('div', {}); body.append(b); renderRhythm(b, bars, meter, { oneLine: false, showMeter: false, ariaLabel: 'Zwei Takte ohne Taktangabe' }); },
    options: meters.map((m) => ({ label: m, correct: m === meter })),
    cols: true,
    explain: `<p>Jeder Takt hat ${meter === '6/8' ? '6 Achtel' : inQuarters(R.METERS[meter].units)}. ${why}</p>`,
    solution: (el) => rhythmWithPlay(el, bars, meter, { oneLine: false, playLabel: 'Mit Metronom anhören' }),
  });
}

// --- Rhythmus hören: welcher war es? ---
function hearRhythm(level) {
  const meter = level === 'jump' ? T.pick(['4/4', '3/4']) : '4/4';
  const opts = [];
  const sig = (m) => JSON.stringify(m);
  while (opts.length < 3) {
    const m = genMeasure(meter, level === 'jump' ? 'jump' : level === 'step' ? 'step' : 'hop');
    if (!opts.some((o) => sig(o) === sig(m)) && R.onsets([m], meter).length > 1) opts.push(m);
  }
  const target = opts[0];
  const bpm = 80;
  return mc({
    kind: 'Hören',
    title: 'Welchen Rhythmus hörst du?',
    hint: 'Erst kommt 1 Takt Einzählen, dann der Rhythmus.',
    pre: (body) => body.append(h('div', { class: 'btn-row' }, playButton('Rhythmus abspielen', () => playRhythm(null, [target], meter, { bpm, click: true })))),
    options: opts.map((m, i) => ({ node: rhythmOption([m], meter, ''), correct: i === 0, aria: `Rhythmus ${i + 1}` })),
    explain: (ok) => `<p>${ok ? 'Richtig gehört.' : 'Hör noch einmal genau hin – achte auf lange und kurze Töne.'} Es war: ${sumText(target)}.</p>`,
    solution: (el) => rhythmWithPlay(el, [target], meter, { bpm, playLabel: 'Nochmal anhören' }),
    onRender: (body) => {
      [...body.querySelectorAll('.opt')].forEach((b, i) => b.querySelector('.opt__label').textContent = LETTERS[i]);
    },
  });
}

// --- Punkt ---
function dotTask() {
  const u = T.pick([24, 12, 6]);
  const correct = `${SHORT_NAME[u]} + ${SHORT_NAME[u / 2]}`;
  const wrong = [`${SHORT_NAME[u]} + ${SHORT_NAME[u]}`, `${SHORT_NAME[u]} + ${SHORT_NAME[u / 4] || 'Zweiunddreißigstel'}`, `${SHORT_NAME[u * 2]} + ${SHORT_NAME[u]}`];
  return mc({
    kind: 'Punktierung',
    title: `Eine punktierte ${SHORT_NAME[u]} dauert so lang wie …`,
    pre: (body) => { const b = h('div', { class: 'staff--narrow' }); body.append(b); renderRhythm(b, [[{ u: u * 1.5 }]], '4/4', { oneLine: false, showMeter: false, staffwidth: 150, ariaLabel: `punktierte ${SHORT_NAME[u]}` }); },
    options: [{ label: correct, correct: true }, ...wrong.map((w) => ({ label: w }))],
    explain: `<p>Der Punkt verlängert eine Note um die <strong>Hälfte ihres Werts</strong>. Die Hälfte einer ${SHORT_NAME[u]} ist eine ${SHORT_NAME[u / 2]}. Also: ${correct} = ${inQuarters(u * 1.5)}.</p>`,
  });
}

// --- Pausen-Gegenstück ---
function restMatch(level) {
  const pool = level === 'hop' ? [48, 24, 12] : [48, 24, 12, 6, 3];
  const u = T.pick(pool);
  const wrong = T.shuffle(pool.filter((x) => x !== u)).slice(0, 3);
  return mc({
    kind: 'Pausen',
    title: `Welche Pause ist genauso lang wie eine ${V[u]}?`,
    pre: (body) => { const b = h('div', { class: 'staff--narrow' }); body.append(b); renderRhythm(b, [[{ u }]], '4/4', { oneLine: false, showMeter: false, staffwidth: 150, ariaLabel: V[u] }); },
    options: [u, ...wrong].map((x) => ({ node: (btn) => { btn.classList.add('opt--staff'); const box = h('div', { class: 'opt__staff' }); btn.append(box); renderRhythm(box, [[{ u: x, rest: true }]], '4/4', { oneLine: false, showMeter: false, staffwidth: 110, ariaLabel: 'Pause' }); }, correct: x === u, aria: 'Pause' })),
    cols: true,
    explain: `<p>Zur ${V[u]} gehört die <strong>${P[u]}</strong>.${u === 48 || u === 24 ? ' Merkhilfe: Die ganze Pause hängt, die halbe Pause sitzt.' : ''}</p>`,
  });
}

// =====================================================================
// CHECK DAS
// =====================================================================
function renderLearn(root) {
  learnTabs(root, [
    ['Notenwerte', learnValues],
    ['Pausen', learnRests],
    ['Punkte & Takte', learnMeters],
  ]);
}

function learnValues(p) {
  p.append(h('h3', {}, 'Der Notenbaum'),
    h('p', {}, 'Jeder Notenwert ist halb so lang wie der darüber. Eine Ganze teilt sich in zwei Halbe, eine Halbe in zwei Viertel und so weiter. Im 4/4-Takt füllt jede Zeile genau einen Takt.'));
  const rows = [['Ganze', '1'], ['Halbe', '2 2'], ['Viertel', '4 4 4 4'], ['Achtel', '8 8 8 8 8 8 8 8'], ['Sechzehntel', '16 16 16 16 16 16 16 16 16 16 16 16 16 16 16 16']];
  rows.forEach(([name, str]) => {
    const m = R.parseRhythm(str);
    p.append(h('p', { class: 'staff-cap', style: { marginTop: '10px', color: 'var(--text)', fontWeight: '700' } }, `${name} – ${m.length} pro Takt`));
    rhythmWithPlay(p, [m], '4/4', { oneLine: false, countIn: false, bpm: 76, playLabel: `${name} anhören` });
  });
  p.append(h('table', { class: 'key-table' },
    h('tr', {}, h('th', {}, 'Notenwert'), h('th', {}, 'Dauer'), h('th', {}, 'Aussehen')),
    ...[['ganze Note', '4 Viertel', 'hohler Kopf, kein Hals'], ['halbe Note', '2 Viertel', 'hohler Kopf, Hals'], ['Viertelnote', '1 Viertel', 'gefüllter Kopf, Hals'], ['Achtelnote', '½ Viertel', 'ein Fähnchen oder Balken'], ['Sechzehntelnote', '¼ Viertel', 'zwei Fähnchen oder Balken']]
      .map((r) => h('tr', {}, ...r.map((c) => h('td', {}, c))))),
  callout('Balken.', 'Mehrere Achtel oder Sechzehntel werden oft mit Balken verbunden – meistens so, dass man die Zählzeiten (Schläge) gut erkennt.'));
}

function learnRests(p) {
  p.append(h('h3', {}, 'Pausen: hörbare Stille'),
    h('p', {}, 'Zu jedem Notenwert gibt es eine Pause mit derselben Dauer. In einer Pause wird nicht gespielt – aber weitergezählt!'));
  const rests = [48, 24, 12, 6, 3];
  const grid = h('div', { class: 'rest-grid' });
  p.append(grid);
  rests.forEach((u) => {
    const cell = h('div', { class: 'rest-cell' });
    grid.append(cell);
    const box = h('div', {});
    cell.append(box, h('p', { class: 'staff-cap' }, P[u], h('br'), inQuarters(u)));
    renderRhythm(box, [[{ u, rest: true }]], "4/4", { oneLine: false, showMeter: false, staffwidth: 90, ariaLabel: P[u] });
  });
  p.append(callout('Merkhilfe:', 'Die ganze Pause hängt unter der Linie (sie ist schwer und voll). Die halbe Pause sitzt auf der Linie wie ein Hut.'),
    h('h3', {}, 'Hör mal: Pausen machen Groove'),
    h('p', {}, 'Derselbe Takt einmal ohne und einmal mit Pausen. Die Pausen machen den Rhythmus spannender.'));
  rhythmWithPlay(p, [R.parseRhythm('4 4 4 4')], '4/4', { oneLine: false, countIn: true, playLabel: 'Ohne Pausen' });
  rhythmWithPlay(p, [R.parseRhythm('4 r8 8 r4 4')], '4/4', { oneLine: false, countIn: true, playLabel: 'Mit Pausen' });
}

function learnMeters(p) {
  p.append(h('h3', {}, 'Der Punkt'),
    h('p', {}, 'Ein Punkt hinter einer Note verlängert sie um die Hälfte ihres Werts.'),
    h('table', { class: 'key-table' },
      h('tr', {}, h('th', {}, 'punktiert'), h('th', {}, 'Rechnung'), h('th', {}, 'Dauer')),
      ...[['punktierte Halbe', 'Halbe + Viertel', '3 Viertel'], ['punktierte Viertel', 'Viertel + Achtel', '1½ Viertel'], ['punktierte Achtel', 'Achtel + Sechzehntel', '¾ Viertel']]
        .map((r) => h('tr', {}, ...r.map((c) => h('td', {}, c))))));
  rhythmWithPlay(p, [R.parseRhythm('4. 8 4. 8')], '4/4', { oneLine: false, playLabel: 'Punktierte Viertel anhören' });
  p.append(h('h3', {}, 'Taktarten'),
    h('p', {}, 'Die Taktangabe sagt, wie viele Schläge ein Takt hat und welcher Notenwert ein Schlag ist. Die obere Zahl zählt, die untere nennt den Notenwert. Der erste Schlag ist meist betont.'));
  const meters = [
    ['2/4', '2 Viertel pro Takt. Typisch für Märsche und für Samba.', '4 4'],
    ['3/4', '3 Viertel pro Takt: der Walzer – „EINS zwei drei“.', '2 4'],
    ['4/4', '4 Viertel pro Takt. Der häufigste Takt in Pop, Rock, Hip-Hop und Reggae.', '4 8 8 4 4'],
    ['6/8', '6 Achtel pro Takt, aber zwei Schwerpunkte mit je drei Achteln: „EINS zwei drei VIER fünf sechs“. Typisch zum Beispiel für irische Jigs. Viele westafrikanische Rhythmen werden in 6/8 oder 12/8 notiert.', '8 8 8 8 8 8'],
  ];
  meters.forEach(([m, txt, pat]) => {
    p.append(h('p', {}, h('strong', {}, m + ' – '), txt));
    rhythmWithPlay(p, [R.parseRhythm(pat), R.parseRhythm(pat)], m, { oneLine: false, playLabel: `${m} anhören` });
  });
  p.append(callout('Zählen.', 'Achtel zählst du „1 und 2 und …“, Sechzehntel „1 e und e 2 e und e …“.'));
}

// =====================================================================
const facts = [
  { id: 'm1-semibrevis', title: 'Die Ganze war mal kurz', text: 'Im Mittelalter hieß unsere ganze Note „Semibrevis“ – die „halbe Kurze“. Es gab noch viel längere Noten wie die Brevis und die Longa. Im Lauf der Jahrhunderte wurde Musik mit immer kürzeren Notenwerten geschrieben.' },
  { id: 'm1-metronom', title: 'Das Metronom ist über 200 Jahre alt', text: 'Johann Nepomuk Mälzel ließ das mechanische Metronom 1815 patentieren. Die Idee dazu stammte vom Niederländer Dietrich Nikolaus Winkel. Beethoven gehörte zu den ersten, die Metronomzahlen in ihre Noten schrieben.' },
  { id: 'm1-englisch', title: 'Quarter Note und Crotchet', text: 'Auf Englisch heißt die Viertelnote in den USA „quarter note“ – genau wie bei uns. In Großbritannien sagt man „crotchet“, die Achtel heißt dort „quaver“.' },
  { id: 'm1-bpm', title: 'BPM: Schläge pro Minute', text: 'Das Tempo wird in BPM (beats per minute) angegeben. Viele Popsongs liegen zwischen 90 und 130 BPM, Reggae oft eher langsam um 70–90 BPM, Samba ziemlich schnell.' },
];

export default {
  id: 'notenwerte',
  num: 1,
  title: 'Notenwerte & Pausen',
  short: 'Ganze bis Sechzehntel, Punkte, Taktarten',
  color: '--c1',
  motif: 'values',
  ready: true,
  renderLearn,
  levelInfo: {
    hop: 'Ganze bis Achtel erkennen, Notenwerte rechnen, Takte füllen.',
    step: 'Sechzehntel, Pausen, Lücken finden, Taktarten, Rhythmen hören.',
    jump: 'Punktierte Noten, 6/8-Takt, Fehlersuche, schwierigere Hörbeispiele.',
  },
  generators: {
    hop: [nameValue, countFit, fillMeasure, restMatch, hearRhythm, missingValue],
    step: [nameValue, countFit, fillMeasure, missingValue, errorMeasure, meterTask, hearRhythm, restMatch],
    jump: [nameValue, dotTask, fillMeasure, missingValue, errorMeasure, meterTask, hearRhythm, countFit],
  },
  speedGenerators: [nameValue, countFit, () => meterTask('step'), restMatch, dotTask],
  facts,
};

// keyboard.js – anklickbare Klaviatur (Tasten sind Buttons → Tastatur & Screenreader)
import { playNote } from '../core/audio.js';

const WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11];
const WHITE_NAMES = ['c', 'd', 'e', 'f', 'g', 'a', 'h'];
const BLACK = { 1: ['cis', 'des'], 3: ['dis', 'es'], 6: ['fis', 'ges'], 8: ['gis', 'as'], 10: ['ais', 'b'] };
const SUP = { 4: '¹', 5: '²', 6: '³', 3: '' };

/**
 * createKeyboard(container, { from: 60, to: 83, labels: true, onKey(midi) })
 * Rückgabe: { el, mark(midi, cls), clearMarks(), setLabels(bool) }
 */
export function createKeyboard(container, opts = {}) {
  const from = opts.from ?? 60;
  const to = opts.to ?? 83;
  const wrap = document.createElement('div');
  wrap.className = 'kbd' + (opts.labels ? ' kbd--labels' : '');
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', 'Klaviatur');
  const whites = [];
  for (let m = from; m <= to; m++) if (WHITE_STEPS.includes(m % 12)) whites.push(m);
  const wCount = whites.length;
  const keys = new Map();

  whites.forEach((m, i) => {
    const b = keyButton(m, 'kbd__w');
    b.style.left = `${(i / wCount) * 100}%`;
    b.style.width = `${100 / wCount}%`;
    const name = WHITE_NAMES[WHITE_STEPS.indexOf(m % 12)];
    const oct = Math.floor(m / 12) - 1;
    b.setAttribute('aria-label', name + (SUP[oct] ?? ''));
    b.innerHTML = `<span class="kbd__lbl">${name}<sup>${(SUP[oct] ?? '').trim()}</sup></span>`;
    wrap.appendChild(b);
    keys.set(m, b);
  });
  for (let m = from; m <= to; m++) {
    const pc = m % 12;
    if (!BLACK[pc]) continue;
    const leftWhite = whites.indexOf(m - 1);
    if (leftWhite < 0) continue;
    const b = keyButton(m, 'kbd__b');
    const w = 100 / wCount;
    b.style.left = `${(leftWhite + 1) * w - w * 0.31}%`;
    b.style.width = `${w * 0.62}%`;
    const oct = Math.floor(m / 12) - 1;
    b.setAttribute('aria-label', `${BLACK[pc][0]}${SUP[oct] ?? ''} oder ${BLACK[pc][1]}${SUP[oct] ?? ''}`);
    b.innerHTML = `<span class="kbd__lbl">${BLACK[pc][0]}<br>${BLACK[pc][1]}</span>`;
    wrap.appendChild(b);
    keys.set(m, b);
  }

  function keyButton(m, cls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.dataset.midi = m;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      press(m);
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        press(m);
      }
    });
    return b;
  }
  function press(m) {
    if (wrap.classList.contains('is-disabled')) return;
    playNote(m, { dur: 0.9 });
    const b = keys.get(m);
    b.classList.add('is-down');
    setTimeout(() => b.classList.remove('is-down'), 180);
    if (opts.onKey) opts.onKey(m);
  }

  container.appendChild(wrap);
  return {
    el: wrap,
    mark(m, cls, on = true) {
      const b = keys.get(m);
      if (b) b.classList.toggle(cls, on);
    },
    clearMarks(cls) {
      keys.forEach((b) => (cls ? b.classList.remove(cls) : b.classList.remove('is-sel', 'is-ok', 'is-bad', 'is-hint')));
    },
    setLabels(on) {
      wrap.classList.toggle('kbd--labels', on);
    },
    disable(on = true) {
      wrap.classList.toggle('is-disabled', on);
    },
  };
}

// blocks.js – Tonleiter-Baukasten: Ganz-/Halbton-Bausteine per Drag & Drop
// Bedienung auch per Tippen (nächstes freies Feld) und Tastatur.
import { h } from './dom.js';

const LABEL = { G: 'Ganzton', H: 'Halbton' };

export function createBlocks(container, { slots = 7, onChange } = {}) {
  const values = Array(slots).fill(null);
  const palette = h('div', { class: 'blocks-palette', role: 'group', 'aria-label': 'Bausteine' },
    ['G', 'H'].map((k) => {
      const b = h('button', { class: `block block--${k}`, type: 'button', 'data-k': k, 'aria-label': `${LABEL[k]} ins nächste freie Feld legen` }, LABEL[k]);
      enableDrag(b, k);
      return b;
    }));
  const row = h('div', { class: 'slots' });
  const slotEls = [];
  for (let i = 0; i < slots; i++) {
    const s = h('button', { class: 'slot', type: 'button', 'data-i': i, 'aria-label': `Schritt ${i + 1} zu ${i + 2}: leer` }, h('small', {}, `${i + 1}–${i + 2}`), h('span', {}, ''));
    s.addEventListener('click', () => {
      if (values[i]) set(i, null);
    });
    slotEls.push(s);
    row.append(s);
  }
  container.append(palette, row);

  function set(i, k) {
    values[i] = k;
    const s = slotEls[i];
    s.className = 'slot' + (k ? ` is-${k}` : '');
    s.lastChild.textContent = k || '';
    s.setAttribute('aria-label', `Schritt ${i + 1} zu ${i + 2}: ${k ? LABEL[k] : 'leer'}${k ? ' (antippen zum Entfernen)' : ''}`);
    if (onChange) onChange(values.slice());
  }
  function fillNext(k) {
    const i = values.indexOf(null);
    if (i >= 0) set(i, k);
  }

  function enableDrag(btn, k) {
    let ghost = null, startX = 0, startY = 0, moved = false, target = null;
    btn.addEventListener('pointerdown', (e) => {
      if (container.closest('.is-locked')) return;
      e.preventDefault();
      startX = e.clientX; startY = e.clientY; moved = false;
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener('pointermove', (e) => {
      if (!btn.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 6) {
        moved = true;
        ghost = btn.cloneNode(true);
        ghost.classList.add('is-drag');
        document.body.append(ghost);
      }
      if (moved) {
        ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`;
        ghost.style.top = `${e.clientY - ghost.offsetHeight / 2}px`;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const s = el && el.closest('.slot');
        if (target && target !== s) target.classList.remove('is-target');
        target = s && slotEls.includes(s) ? s : null;
        if (target) target.classList.add('is-target');
      }
    });
    const end = (e) => {
      if (!btn.hasPointerCapture(e.pointerId)) return;
      btn.releasePointerCapture(e.pointerId);
      if (ghost) ghost.remove();
      ghost = null;
      if (moved) {
        if (target) {
          target.classList.remove('is-target');
          set(Number(target.dataset.i), k);
        }
      } else {
        fillNext(k);
      }
      target = null;
    };
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fillNext(k);
      }
    });
  }

  return {
    values: () => values.slice(),
    markResult(expected) {
      expected.forEach((k, i) => slotEls[i].classList.add(values[i] === k ? 'is-ok' : 'is-bad'));
    },
  };
}

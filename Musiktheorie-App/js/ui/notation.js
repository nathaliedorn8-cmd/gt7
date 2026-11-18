// notation.js – Notenbilder ausschließlich über abcjs (lokal eingebunden)
import { abcNotes, abcTune, abcKeyField, keySignature, midi } from '../core/theory.js';

/**
 * Rendert eine Tonfolge in ein Element.
 * opts: { tonic, mode, withKey (Generalvorzeichen), clef, unit, label, onClickNote }
 * Rückgabe: { notes: [SVG-Elemente je Note], abc, highlight(i), mark(i, cls) }
 */
export function renderPitches(el, pitches, opts = {}) {
  const { tonic, mode = 'dur', withKey = false, clef = 'treble', unit = '1/1', items, ariaLabel } = opts;
  const keySig = withKey && tonic ? keySignature(tonic, mode) : [];
  const { body } = abcNotes(items || pitches, { keySig });
  const abc = abcTune({ body: body + ' |]', key: withKey && tonic ? abcKeyField(tonic, mode) : 'C', clef, unit });
  return renderAbc(el, abc, { ...opts, ariaLabel, pitches });
}

export function renderAbc(el, abc, opts = {}) {
  el.classList.add('staff');
  el.innerHTML = '';
  const inner = document.createElement('div');
  el.appendChild(inner);
  // Einheitliche Vergrößerung (~1,18×) unabhängig von der Bildschirmbreite
  const avail = (el.clientWidth || 340) - 16;
  const auto = Math.max(220, Math.min(560, avail / 1.18));
  const tunes = window.ABCJS.renderAbc(inner, abc, {
    add_classes: true,
    responsive: 'resize',
    staffwidth: opts.staffwidth ? Math.min(opts.staffwidth, auto) : auto,
    scale: 1,
    paddingtop: 6,
    paddingbottom: 6,
    paddingleft: 4,
    paddingright: 4,
    selectTypes: false,
    clickListener: null,
  });
  const notes = collectNotes(tunes[0]);
  const svg = inner.querySelector('svg');
  if (svg) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', opts.ariaLabel || 'Notenbeispiel');
  }
  const api = {
    abc,
    notes,
    highlight(i) {
      notes.forEach((n, k) => n.forEach((e) => e.classList.toggle('is-playing', k === i)));
    },
    clear() {
      notes.forEach((n) => n.forEach((e) => e.classList.remove('is-playing')));
    },
    mark(i, cls, on = true) {
      (notes[i] || []).forEach((e) => e.classList.toggle(cls, on));
    },
  };
  if (opts.onClickNote) {
    notes.forEach((group, i) =>
      group.forEach((e) => {
        e.style.cursor = 'pointer';
        e.addEventListener('click', () => opts.onClickNote(i));
      }));
  }
  return api;
}

/** Sammelt die SVG-Elemente aller Noten (ohne Pausen) in Reihenfolge */
function collectNotes(tune) {
  const out = [];
  if (!tune || !tune.lines) return out;
  for (const line of tune.lines) {
    if (!line.staff) continue;
    for (const staff of line.staff) {
      for (const voice of staff.voices) {
        for (const elem of voice) {
          if (elem.el_type === 'note' && !elem.rest && elem.abselem && elem.abselem.elemset) {
            out.push(elem.abselem.elemset.filter(Boolean));
          }
        }
      }
    }
  }
  return out;
}

/** Nur Generalvorzeichen zeigen (für „Tonart erkennen“) */
export function renderKeySignature(el, tonic, mode = 'dur', clef = 'treble') {
  const abc = abcTune({ body: 'x', key: abcKeyField(tonic, mode), clef, unit: '1/1' });
  return renderAbc(el, abc, { staffwidth: 160, ariaLabel: 'Generalvorzeichen' });
}

/** Eigene Vorzeichenfolge (exp) – für „Generalvorzeichen setzen“ */
export function renderCustomKeySignature(el, accidentals, clef = 'treble') {
  const map = { 1: '^', '-1': '_' };
  const letters = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
  const exp = accidentals.map((a) => map[a.alter] + letters[a.step]).join(' ');
  const abc = abcTune({ body: 'x', key: accidentals.length ? `C exp ${exp}` : 'C', clef, unit: '1/1' });
  return renderAbc(el, abc, { staffwidth: 200, ariaLabel: 'Generalvorzeichen' });
}

/** Spielt die Töne mit Hervorhebung im Notenbild */
export function midisOf(pitches) {
  return pitches.map(midi);
}

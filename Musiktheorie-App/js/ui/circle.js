// circle.js – interaktiver Quintenzirkel (Grafik, keine Notenschrift)
import { circleOfFifths, germanName, capitalize } from '../core/theory.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 180;

function arc(r1, r2, a1, a2) {
  const p = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const [x1, y1] = p(r2, a1), [x2, y2] = p(r2, a2), [x3, y3] = p(r1, a2), [x4, y4] = p(r1, a1);
  return `M${x1} ${y1} A${r2} ${r2} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}
function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

export function durLabel(e) {
  return e.durAlt ? `${capitalize(germanName(e.dur))}/${capitalize(germanName(e.durAlt))}` : capitalize(germanName(e.dur));
}
export function mollLabel(e) {
  return e.mollAlt ? `${germanName(e.moll)}/${germanName(e.mollAlt)}` : germanName(e.moll);
}
function sigLabel(f) {
  if (f === 0) return '';
  return f > 0 ? `${f}♯` : `${-f}♭`;
}

/**
 * createCircle(container, { onSelect(entry), hidden: [{index, ring:'dur'|'moll'}], dimOutside })
 */
export function createCircle(container, opts = {}) {
  const data = circleOfFifths();
  const svg = el('svg', { viewBox: '0 0 360 360', class: 'cof', role: 'group', 'aria-label': 'Quintenzirkel' });
  const segs = [];
  const hidden = opts.hidden || [];
  const filled = {};
  data.forEach((e, i) => {
    const mid = (i * 30 - 90) * (Math.PI / 180);
    const a1 = mid - Math.PI / 12 + 0.01, a2 = mid + Math.PI / 12 - 0.01;
    const g = el('g', { class: 'cof__seg', tabindex: '0', role: 'button' });
    const outer = el('path', { d: arc(108, 172, a1, a2) });
    const inner = el('path', { d: arc(58, 104, a1, a2) });
    g.append(outer, inner);
    const hd = hidden.find((x) => x.index === i && x.ring === 'dur');
    const hm = hidden.find((x) => x.index === i && x.ring === 'moll');
    if (hd) outer.parentNode && outer.classList.add('cof__qpath');
    const tx = (r) => C + r * Math.cos(mid), ty = (r) => C + r * Math.sin(mid);
    const tDur = el('text', { x: tx(146), y: ty(146) + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': e.durAlt ? 12 : 17 });
    tDur.textContent = hd ? '?' : durLabel(e);
    const tSig = el('text', { x: tx(122), y: ty(122) + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 10, class: 'cof__minor' });
    tSig.textContent = sigLabel(e.fifths);
    const tMoll = el('text', { x: tx(82), y: ty(82) + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'cof__minor', 'font-size': e.mollAlt ? 10 : 13 });
    tMoll.textContent = hm ? '?' : mollLabel(e);
    g.append(tDur, tSig, tMoll);
    if (hd || hm) g.classList.add('cof__q');
    if (opts.dimOutside && !e.inCurriculum) g.classList.add('is-dim');
    if (e.inCurriculum) g.classList.add('is-cur');
    g.setAttribute('aria-label', hd || hm ? `Leeres Feld an Position ${i + 1}` :
      `${durLabel(e)}-Dur und ${mollLabel(e)}-Moll, ${e.fifths === 0 ? 'keine Vorzeichen' : sigLabel(e.fifths).replace('♯', ' Kreuze').replace('♭', ' B')}`);
    const choose = () => {
      segs.forEach((s) => s.classList.remove('is-sel'));
      g.classList.add('is-sel');
      if (opts.onSelect) opts.onSelect(e, i);
    };
    g.addEventListener('click', choose);
    g.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(); }
    });
    segs.push(g);
    svg.append(g);
    g._texts = { dur: tDur, moll: tMoll };
  });
  // Mitte
  [['Dur außen', -4], ['Moll innen', 10]].forEach(([t, dy]) => {
    const mid = el('text', { x: C, y: C + dy, 'text-anchor': 'middle', 'font-size': 11 });
    mid.textContent = t;
    mid.setAttribute('style', 'fill: var(--muted); font-family: var(--font)');
    svg.append(mid);
  });
  container.append(svg);
  return {
    select(i) { segs[i].dispatchEvent(new Event('click')); },
    setText(i, ring, txt) { segs[i]._texts[ring].textContent = txt; filled[`${i}${ring}`] = txt; },
    seg: (i) => segs[i],
  };
}

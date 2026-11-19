// card.js – Lernstand-Karte (zum Screenshot fürs Portfolio)
import * as S from '../core/store.js';
import { h, icon } from './dom.js';

export function showCard(mod, levelName, scoreText) {
  const st = S.load();
  const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const nameInput = h('input', {
    class: 'input', id: 'card-name', type: 'text', maxlength: '24', autocomplete: 'off',
    placeholder: 'Vorname oder Kürzel', value: st.name || '',
  });
  const nameOut = h('span', { class: 'lcard__name' }, st.name || '—');
  nameInput.addEventListener('input', () => {
    nameOut.textContent = nameInput.value.trim() || '—';
    S.setName(nameInput.value.trim());
  });
  const levels = S.LEVELS.map((l) => {
    const ls = S.levelState(mod.id, l);
    return h('li', { class: ls.passed ? 'is-on' : '' }, h('span', { class: 'lcard__dot', 'aria-hidden': 'true' }),
      `${S.LEVEL_NAMES[l]}: ${ls.passed ? 'bestanden' : 'offen'}`);
  });
  const card = h('article', { class: 'lcard', style: { '--mod': `var(${mod.color})` }, 'aria-label': 'Lernstand-Karte' },
    h('div', { class: 'lcard__top' },
      h('span', { class: 'lcard__brand' }, 'Groove & Theorie'),
      h('span', { class: 'lcard__school' }, 'Gymnasium im Eilbektal')),
    h('div', { class: 'lcard__mod' }, `Modul ${mod.num}`),
    h('h2', { class: 'lcard__title' }, mod.title),
    h('dl', { class: 'lcard__facts' },
      h('div', {}, h('dt', {}, 'Stufe'), h('dd', {}, levelName)),
      h('div', {}, h('dt', {}, 'Ergebnis'), h('dd', {}, scoreText)),
      h('div', {}, h('dt', {}, 'Datum'), h('dd', {}, date)),
      h('div', {}, h('dt', {}, 'Name'), h('dd', {}, nameOut))),
    h('ul', { class: 'lcard__levels' }, levels),
    h('div', { class: 'lcard__foot' }, `Gesamt: ${st.xp} XP · Musik`));
  const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Lernstand-Karte' },
    h('div', { class: 'overlay__inner' },
      card,
      h('label', { class: 'label', for: 'card-name' }, 'Dein Name auf der Karte (bleibt nur auf diesem Gerät)'),
      nameInput,
      h('p', { class: 'muted small' }, 'Mach einen Screenshot und zeig ihn vor oder leg ihn in dein Portfolio.'),
      h('button', { class: 'btn btn--wide', type: 'button', onclick: close }, icon('close'), 'Schließen')));
  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  nameInput.focus();
}

// app.js – Startseite, Modulseiten, Navigation (Hash-Routing: #tonleitern, #tonleitern/hop)
import { MODULES, byId } from './modules/index.js';
import * as S from './core/store.js';
import { startRound } from './ui/runner.js';
import { stopAll } from './core/audio.js';
import { h, icon } from './ui/dom.js';

const app = document.getElementById('app');

// ---------- Hell/Dunkel ----------
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
let theme = null;
try { theme = localStorage.getItem('gt-theme'); } catch (e) { /* egal */ }
applyTheme(theme);
function toggleTheme() {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  theme = dark ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('gt-theme', theme); } catch (e) { /* egal */ }
}

// ---------- Router ----------
function route() {
  stopAll();
  const [id, sub] = location.hash.replace(/^#\/?/, '').split('/');
  const mod = id && byId(id);
  window.scrollTo(0, 0);
  if (!mod) return renderHome();
  if (!mod.ready) return renderSoon(mod);
  if (sub && ['hop', 'step', 'jump', 'challenge', 'speed'].includes(sub)) {
    const level = sub === 'speed' ? 'challenge' : sub;
    if (level !== 'challenge' && !S.isUnlocked(mod.id, level)) return (location.hash = mod.id);
    document.title = `${mod.title} · Groove & Theorie`;
    return startRound(app, mod, level, { speed: sub === 'speed', onExit: () => (location.hash = mod.id) });
  }
  renderModule(mod);
}
window.addEventListener('hashchange', route);

function topbar(back) {
  const st = S.load();
  return h('header', { class: 'topbar' },
    back
      ? h('a', { class: 'icon-btn', href: '#', 'aria-label': 'Zur Startseite' }, icon('back'))
      : h('div', { class: 'brand' }, h('span', { class: 'brand__mark', 'aria-hidden': 'true' }, brandMark()), h('span', {}, 'Groove ', h('em', {}, '&'), ' Theorie')),
    h('div', { class: 'topbar__stats' },
      h('span', { class: 'stat', title: 'Tage in Folge geübt' }, icon('flame'), h('span', { class: 'sr-only' }, 'Serie: '), `${S.streak()}`),
      h('span', { class: 'stat', title: 'Erfahrungspunkte' }, icon('bolt'), `${st.xp} XP`),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Hell/Dunkel umschalten', onclick: toggleTheme }, icon('moon'))));
}

function brandMark() {
  // Mini-Pattern-Kreis: 3-2-Son-Clave auf 16 Schritten
  const hits = [0, 3, 6, 10, 12];
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', 16 + 12 * Math.cos(a));
    c.setAttribute('cy', 16 + 12 * Math.sin(a));
    c.setAttribute('r', hits.includes(i) ? 3 : 1.3);
    c.setAttribute('class', hits.includes(i) ? 'on' : 'off');
    svg.append(c);
  }
  return svg;
}

// ---------- Startseite ----------
function renderHome() {
  document.title = 'Groove & Theorie';
  app.className = 'page';
  app.innerHTML = '';
  const st = S.load();
  const hero = h('section', { class: 'hero' },
    h('p', { class: 'hero__kicker' }, 'Musiktheorie · Klasse 5 bis 8'),
    h('h1', { class: 'hero__title' }, 'Versteh die Musik, die du spielst.'),
    h('p', { class: 'hero__text' }, 'Samba, Reggae, Clave, Gamelan, Pop: Hier lernst du das Handwerkszeug dahinter. Jedes Modul hat drei Stufen: Hop, Step und Jump.'),
    heroPattern());
  const how = h('section', { class: 'how', 'aria-label': 'So geht’s' },
    h('h2', { class: 'how__h' }, 'So geht’s'),
    h('ol', { class: 'how__list' },
      h('li', {}, h('b', {}, 'Modul antippen. '), 'Fang am besten mit Modul 1 an.'),
      h('li', {}, h('b', {}, '„Check das“ lesen. '), 'Dort wird alles erklärt. Tippe auf die Knöpfe zum Anhören.'),
      h('li', {}, h('b', {}, 'Üben: erst Hop, dann Step, dann Jump. '), 'Schaffst du 6 von 8 Aufgaben, geht die nächste Stufe auf.')));
  const grid = h('section', { class: 'mods', 'aria-label': 'Module' },
    MODULES.map((m) => {
      const p = S.moduleProgress(m.id);
      const badges = S.LEVELS.map((l) => S.levelState(m.id, l).passed);
      return h('a', { class: `mod-tile ${m.ready ? '' : 'is-soon'}`, href: `#${m.id}`, style: { '--mod': `var(${m.color})` } },
        h('div', { class: 'mod-tile__motif', 'aria-hidden': 'true', html: motif(m.motif) }),
        h('div', { class: 'mod-tile__body' },
          h('span', { class: 'mod-tile__num' }, `Modul ${m.num}`),
          h('h2', { class: 'mod-tile__title' }, m.title),
          h('p', { class: 'mod-tile__short' }, m.short),
          m.ready
            ? h('div', { class: 'mod-tile__meta' },
              h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': p, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': `Fortschritt ${p} Prozent` },
                h('div', { class: 'progress__fill', style: { width: p + '%' } })),
              h('span', { class: 'mini-badges', 'aria-label': `Abzeichen: ${badges.filter(Boolean).length} von 3` },
                badges.map((b, i) => h('span', { class: `mini-badge ${b ? 'is-on' : ''}` }, ['H', 'S', 'J'][i]))))
            : h('span', { class: 'chip' }, 'kommt bald')));
    }));
  const foot = h('footer', { class: 'site-foot' },
    h('p', {}, 'Gymnasium im Eilbektal · Fachschaft Musik'),
    h('p', { class: 'muted small' }, 'Kein Login, kein Tracking. Dein Fortschritt bleibt nur auf diesem Gerät.'),
    h('p', { class: 'muted small' }, `Gesamt: ${st.xp} XP`));
  app.append(topbar(false), hero, how, grid, foot);
}

function heroPattern() {
  // 16er-Raster wie bei einer Drum-Machine: Surdo, Caixa, Tamborim
  const rows = [
    { name: 'Tamborim', hits: [0, 2, 3, 5, 7, 8, 10, 11, 13, 15] },
    { name: 'Caixa', hits: [0, 3, 4, 7, 8, 11, 12, 15] },
    { name: 'Surdo', hits: [4, 12] },
  ];
  return h('div', { class: 'grid16', 'aria-hidden': 'true' },
    rows.map((r, ri) => h('div', { class: 'grid16__row' },
      Array.from({ length: 16 }, (_, i) => h('span', {
        class: `grid16__cell ${r.hits.includes(i) ? 'is-on' : ''} ${i % 4 === 0 ? 'is-beat' : ''}`,
        style: { '--d': `${i * 0.11}s`, '--r': ri },
      })))));
}

function motif(kind) {
  // Musikalische Grafik ohne Notenschrift: Piano-Roll, Pattern-Kreis, Tasten …
  switch (kind) {
    case 'values':
      return `<svg viewBox="0 0 64 40"><rect x="2" y="6" width="60" height="6" rx="3"/><rect x="2" y="16" width="29" height="6" rx="3"/><rect x="33" y="16" width="29" height="6" rx="3"/><g>${[0, 1, 2, 3].map((i) => `<rect x="${2 + i * 15.5}" y="26" width="13.5" height="6" rx="3"/>`).join('')}</g></svg>`;
    case 'circle':
      return `<svg viewBox="0 0 64 40">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 6.283 - 1.571; const on = [0, 3, 6, 10, 12].includes(i); return `<circle cx="${32 + 16 * Math.cos(a)}" cy="${20 + 16 * Math.sin(a)}" r="${on ? 3.4 : 1.6}" opacity="${on ? 1 : 0.4}"/>`; }).join('')}</svg>`;
    case 'keys':
      return `<svg viewBox="0 0 64 40">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${4 + i * 8.2}" y="4" width="7.2" height="32" rx="1.5" opacity=".35"/>`).join('')}${[0, 1, 3, 4, 5].map((i) => `<rect x="${9.5 + i * 8.2}" y="4" width="5" height="19" rx="1"/>`).join('')}</svg>`;
    case 'scale':
      return `<svg viewBox="0 0 64 40">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const y = 33 - [0, 2, 4, 5, 7, 9, 11, 12][i] * 2.3; return `<rect x="${2 + i * 7.7}" y="${y}" width="6.6" height="4.2" rx="2" ${[2, 3, 6, 7].includes(i) ? '' : 'opacity=".45"'}/>`; }).join('')}</svg>`;
    case 'interval':
      return `<svg viewBox="0 0 64 40"><rect x="6" y="28" width="16" height="5" rx="2.5"/><rect x="42" y="8" width="16" height="5" rx="2.5"/><path d="M22 30 Q 34 30 42 11" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/></svg>`;
    case 'chord':
      return `<svg viewBox="0 0 64 40"><rect x="10" y="28" width="44" height="5" rx="2.5"/><rect x="10" y="18" width="44" height="5" rx="2.5" opacity=".7"/><rect x="10" y="8" width="44" height="5" rx="2.5" opacity=".45"/></svg>`;
    default:
      return '';
  }
}

// ---------- Modulseite ----------
function renderModule(mod) {
  document.title = `${mod.title} · Groove & Theorie`;
  app.className = 'page';
  app.innerHTML = '';
  app.style.setProperty('--mod', `var(${mod.color})`);
  app.style.setProperty('--mod-ink', `var(${mod.color}-ink)`);
  const p = S.moduleProgress(mod.id);
  const head = h('section', { class: 'mod-head', style: { '--mod': `var(${mod.color})` } },
    h('div', { class: 'mod-head__motif', 'aria-hidden': 'true', html: motif(mod.motif) }),
    h('p', { class: 'mod-head__num' }, `Modul ${mod.num}`),
    h('h1', { class: 'mod-head__title' }, mod.title),
    h('div', { class: 'progress progress--lg', role: 'progressbar', 'aria-valuenow': p, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': `Fortschritt ${p} Prozent` },
      h('div', { class: 'progress__fill', style: { width: p + '%' } })),
    h('p', { class: 'muted small' }, `${p} % geschafft`));

  const learn = h('section', { class: 'learn', 'aria-labelledby': 'learn-h' },
    h('h2', { class: 'section-h', id: 'learn-h' }, h('span', { class: 'section-h__tag' }, 'Check das'), 'Erst verstehen, dann üben'));
  const learnBody = h('div', { class: 'learn__body' });
  learn.append(learnBody);

  const practice = h('section', { class: 'practice', 'aria-labelledby': 'practice-h' },
    h('h2', { class: 'section-h', id: 'practice-h' }, h('span', { class: 'section-h__tag' }, 'Üben'), 'Hop · Step · Jump'),
    h('p', { class: 'muted' }, 'Fang mit Hop an. Wenn du 6 von 8 Aufgaben schaffst, geht Step auf. Danach kommt Jump.'),
    h('div', { class: 'levels' }, S.LEVELS.map((l) => levelCard(mod, l))),
    challengeCard(mod));

  app.append(topbar(true), head, learn, practice,
    h('footer', { class: 'site-foot' }, h('p', { class: 'muted small' }, 'Gymnasium im Eilbektal · Groove & Theorie')));
  mod.renderLearn(learnBody);
}

function levelCard(mod, level) {
  const ls = S.levelState(mod.id, level);
  const open = S.isUnlocked(mod.id, level);
  const prev = S.LEVEL_NAMES[S.LEVELS[S.LEVELS.indexOf(level) - 1]];
  const inner = [
    h('div', { class: `level__badge badge--${level} ${ls.passed ? '' : 'badge--off'}`, 'aria-hidden': 'true' }, S.LEVEL_NAMES[level][0]),
    h('div', { class: 'level__text' },
      h('h3', {}, S.LEVEL_NAMES[level], ls.passed ? h('span', { class: 'chip chip--ok' }, icon('check'), 'bestanden') : ''),
      h('p', {}, mod.levelInfo[level]),
      open
        ? h('p', { class: 'muted small' }, ls.best ? `Bestes Ergebnis: ${ls.best}/${ls.total}` : '8 Aufgaben · 6 richtige zum Bestehen')
        : h('p', { class: 'muted small' }, icon('lock'), ` Erst ${prev} schaffen`)),
  ];
  return open
    ? h('a', { class: `level level--${level}`, href: `#${mod.id}/${level}` }, inner, icon('arrow', 'level__go'))
    : h('div', { class: `level level--${level} is-locked`, 'aria-disabled': 'true' }, inner, icon('lock', 'level__go'));
}

function challengeCard(mod) {
  const c = S.moduleState(mod.id).challenge;
  return h('div', { class: 'challenge' },
    h('div', { class: 'challenge__text' },
      h('h3', {}, icon('bolt'), 'Challenge'),
      h('p', {}, 'Gemischte Aufgaben aus allen Stufen. Oder auf Zeit: Wie viele schaffst du in 60 Sekunden?'),
      h('p', { class: 'muted small' }, `Rekord: ${c.best || 0}/10 · Speed: ${c.speedBest || 0}`)),
    h('div', { class: 'challenge__btns' },
      h('a', { class: 'btn btn--primary', href: `#${mod.id}/challenge` }, '10 Aufgaben'),
      h('a', { class: 'btn', href: `#${mod.id}/speed` }, icon('timer'), '60 Sekunden')));
}

function renderSoon(mod) {
  app.className = 'page';
  app.innerHTML = '';
  app.append(topbar(true),
    h('section', { class: 'mod-head', style: { '--mod': `var(${mod.color})` } },
      h('div', { class: 'mod-head__motif', 'aria-hidden': 'true', html: motif(mod.motif) }),
      h('p', { class: 'mod-head__num' }, `Modul ${mod.num}`),
      h('h1', { class: 'mod-head__title' }, mod.title),
      h('p', {}, 'Dieses Modul ist gerade im Aufbau. Schau bald wieder rein!')));
}

route();

// Offline-Fähigkeit (PWA)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

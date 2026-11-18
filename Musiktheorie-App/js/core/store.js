// store.js – Fortschritt nur lokal im Browser (localStorage, abgesichert)
const KEY = 'groove-theorie-v1';
let memory = null;

function blank() {
  return { xp: 0, days: [], name: '', modules: {}, seenFacts: [] };
}

export function load() {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    memory = raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch (e) {
    memory = blank();
  }
  return memory;
}

export function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch (e) {
    /* privater Modus o. Ä. – Fortschritt gilt dann nur bis zum Schließen */
  }
}

export function moduleState(id) {
  const s = load();
  if (!s.modules[id]) s.modules[id] = { levels: {}, challenge: { best: 0, speedBest: 0 } };
  return s.modules[id];
}

export function levelState(modId, level) {
  const m = moduleState(modId);
  if (!m.levels[level]) m.levels[level] = { best: 0, total: 0, passed: false, date: null };
  return m.levels[level];
}

export const LEVELS = ['hop', 'step', 'jump'];
export const LEVEL_NAMES = { hop: 'Hop', step: 'Step', jump: 'Jump' };

/** Step ist offen, wenn Hop bestanden ist; Jump, wenn Step bestanden ist. */
export function isUnlocked(modId, level) {
  if (unlockAll()) return true;
  const i = LEVELS.indexOf(level);
  if (i <= 0) return true;
  return levelState(modId, LEVELS[i - 1]).passed;
}

/** Lehrkraft-Freischaltung über ?frei im Link (für den Unterricht) */
export function unlockAll() {
  try {
    if (new URLSearchParams(location.search).has('frei')) sessionStorage.setItem('gt-frei', '1');
    return sessionStorage.getItem('gt-frei') === '1';
  } catch (e) {
    return false;
  }
}

export function addXp(n) {
  load().xp += n;
  touchDay();
  save();
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function touchDay() {
  const s = load();
  const t = today();
  if (!s.days.includes(t)) {
    s.days.push(t);
    s.days = s.days.slice(-60);
  }
}

/** Anzahl Tage in Folge (bis heute oder gestern) */
export function streak() {
  const s = load();
  const set = new Set(s.days);
  const d = new Date();
  if (!set.has(today())) d.setDate(d.getDate() - 1);
  let n = 0;
  for (;;) {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!set.has(k)) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Fortschritt eines Moduls in % (Hop/Step/Jump je 30 %, Challenge 10 %) */
export function moduleProgress(modId) {
  const m = moduleState(modId);
  let p = 0;
  for (const l of LEVELS) if (m.levels[l] && m.levels[l].passed) p += 30;
  if (m.challenge && m.challenge.best > 0) p += 10;
  return p;
}

export function setName(n) {
  load().name = n.slice(0, 24);
  save();
}

// runner.js – führt eine Übungsrunde (Hop/Step/Jump/Challenge) durch
import * as S from '../core/store.js';
import { stopAll } from '../core/audio.js';
import { shuffle } from '../core/theory.js';
import { showCard } from './card.js';
import { h, icon } from './dom.js';

const TASKS_PER_LEVEL = 8;
const PASS_RATIO = 0.75;
const XP = { hop: 10, step: 15, jump: 20, challenge: 15 };

function buildQueue(gens, n) {
  const out = [];
  let pool = [];
  while (out.length < n) {
    if (!pool.length) pool = shuffle(gens);
    out.push(pool.pop());
  }
  return out;
}

/**
 * startRound(root, mod, level, { speed })
 * level: 'hop' | 'step' | 'jump' | 'challenge'
 */
export function startRound(root, mod, level, { speed = false, onExit } = {}) {
  const isChallenge = level === 'challenge';
  const gens = isChallenge
    ? speed
      ? mod.speedGenerators
      : [...mod.generators.hop, ...mod.generators.step, ...mod.generators.jump]
    : mod.generators[level];
  const total = speed ? Infinity : isChallenge ? 10 : TASKS_PER_LEVEL;
  const queue = speed ? [] : buildQueue(gens, total);
  let index = 0;
  let correct = 0;
  let answered = 0;
  let xpGained = 0;
  let timeLeft = 60;
  let timer = null;
  let ended = false;
  let factShown = false;

  root.innerHTML = '';
  root.className = 'round';
  root.style.setProperty('--mod', `var(${mod.color})`);
  root.style.setProperty('--mod-ink', `var(${mod.color}-ink)`);

  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Runde beenden', onclick: exit }, icon('close'));
  const bar = h('div', { class: 'round__bar' }, h('div', { class: 'round__fill' }));
  const counter = h('div', { class: 'round__count', 'aria-live': 'polite' });
  const head = h('header', { class: 'round__head' }, closeBtn, bar, counter);
  const stage = h('main', { class: 'round__stage', id: 'stage' });
  const checkBtn = h('button', { class: 'btn btn--primary btn--wide', type: 'button', disabled: true }, 'Prüfen');
  const foot = h('footer', { class: 'round__foot' }, checkBtn);
  root.append(head, stage, foot);

  if (speed) {
    timer = setInterval(() => {
      timeLeft--;
      updateHead();
      if (timeLeft <= 0) finish();
    }, 1000);
  }

  function updateHead() {
    const fill = bar.firstChild;
    if (speed) {
      fill.style.width = `${(timeLeft / 60) * 100}%`;
      counter.textContent = `${timeLeft}s · ${correct} ✓`;
    } else {
      fill.style.width = `${(index / total) * 100}%`;
      counter.textContent = `${Math.min(index + 1, total)}/${total}`;
    }
  }

  function exit() {
    ended = true;
    clearInterval(timer);
    stopAll();
    if (onExit) onExit();
  }

  function next() {
    stopAll();
    if (ended) return;
    if (!speed && index >= total) return finish();
    // Einmal pro Runde: „Wusstest du?“
    if (!speed && !factShown && index === Math.floor(total / 2) && mod.facts && mod.facts.length) {
      factShown = true;
      return showFact();
    }
    const gen = speed ? shuffle(gens)[0] : queue[index];
    const task = gen(isChallenge ? 'challenge' : level);
    renderTask(task);
  }

  function showFact() {
    const s = S.load();
    const unseen = mod.facts.filter((f) => !s.seenFacts.includes(f.id));
    const f = (unseen.length ? unseen : mod.facts)[Math.floor(Math.random() * (unseen.length || mod.facts.length))];
    s.seenFacts.push(f.id);
    S.save();
    stage.innerHTML = '';
    stage.append(
      h('section', { class: 'fact' },
        h('div', { class: 'fact__kicker' }, icon('globe'), 'Wusstest du?'),
        h('h2', { class: 'fact__title' }, f.title),
        h('p', {}, f.text),
        f.extra ? f.extra() : '')
    );
    setButton('Weiter', () => next());
    checkBtn.disabled = false;
  }

  function setButton(label, fn) {
    checkBtn.textContent = label;
    checkBtn.onclick = fn;
  }

  function renderTask(task) {
    updateHead();
    stage.innerHTML = '';
    foot.querySelector('.feedback')?.remove();
    foot.classList.remove('is-static');
    const card = h('section', { class: 'task', 'aria-labelledby': 'task-title' },
      h('p', { class: 'task__kind' }, task.kind || ''),
      h('h2', { class: 'task__title', id: 'task-title' }, task.title));
    if (task.hint) card.append(h('p', { class: 'task__hint' }, task.hint));
    const body = h('div', { class: 'task__body' });
    card.append(body);
    stage.append(card);
    checkBtn.disabled = true;
    setButton('Prüfen', () => evaluate(task, body));
    task.render(body, {
      setReady: (ok) => (checkBtn.disabled = !ok),
      submit: () => !checkBtn.disabled && evaluate(task, body),
    });
    stage.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    setTimeout(() => card.querySelector('h2')?.focus?.(), 50);
  }

  function evaluate(task, body) {
    const res = task.check();
    answered++;
    if (res.ok) {
      correct++;
      const x = XP[level] || 10;
      xpGained += x;
      S.addXp(x);
    } else S.touchDay();
    body.classList.add('is-locked');
    const fb = h('div', { class: `feedback ${res.ok ? 'feedback--ok' : 'feedback--bad'}`, role: 'status' },
      h('div', { class: 'feedback__head' }, icon(res.ok ? 'check' : 'cross'),
        h('strong', {}, res.ok ? pickPraise() : 'Nicht ganz.'),
        res.ok ? h('span', { class: 'feedback__xp' }, `+${XP[level] || 10} XP`) : ''),
      h('div', { class: 'feedback__text', html: res.explain || '' }));
    if (res.solution) {
      const sol = h('div', { class: 'feedback__solution' });
      fb.append(sol);
      requestAnimationFrame(() => res.solution(sol));
    }
    foot.prepend(fb);
    foot.classList.add('is-static');
    requestAnimationFrame(() => fb.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    index++;
    if (speed) {
      setButton('Weiter', () => next());
      if (res.ok) setTimeout(() => !ended && fb.isConnected && next(), 900);
    } else {
      setButton(index >= total ? 'Ergebnis' : 'Weiter', () => next());
    }
    checkBtn.disabled = false;
    checkBtn.focus();
  }

  function finish() {
    if (ended) return;
    ended = true;
    clearInterval(timer);
    stopAll();
    foot.querySelector('.feedback')?.remove();
    const st = S.load();
    let passed = false;
    let newBadge = false;
    let scoreText;
    if (isChallenge) {
      const m = S.moduleState(mod.id);
      if (speed) m.challenge.speedBest = Math.max(m.challenge.speedBest || 0, correct);
      else m.challenge.best = Math.max(m.challenge.best || 0, correct);
      passed = true;
      scoreText = speed ? `${correct} richtig in 60 Sekunden` : `${correct} von ${total} richtig`;
    } else {
      const ls = S.levelState(mod.id, level);
      passed = correct / total >= PASS_RATIO;
      if (passed && !ls.passed) newBadge = true;
      ls.best = Math.max(ls.best, correct);
      ls.total = total;
      if (passed) {
        ls.passed = true;
        ls.date = new Date().toISOString();
      }
      scoreText = `${correct} von ${total} richtig`;
    }
    S.save();
    void st;
    const levelName = isChallenge ? (speed ? 'Speed-Challenge' : 'Challenge') : S.LEVEL_NAMES[level];
    const nextLevel = !isChallenge && passed && S.LEVELS[S.LEVELS.indexOf(level) + 1];
    stage.innerHTML = '';
    counter.textContent = '';
    bar.firstChild.style.width = '100%';
    const result = h('section', { class: 'result' },
      h('div', { class: `badge badge--${isChallenge ? 'challenge' : level} ${passed ? '' : 'badge--off'}` },
        h('span', {}, levelName)),
      h('h2', {}, isChallenge ? 'Challenge geschafft' : passed ? (newBadge ? `${levelName} geschafft – Abzeichen!` : `${levelName} bestanden`) : 'Noch nicht ganz'),
      h('p', { class: 'result__score' }, scoreText),
      h('p', { class: 'result__sub' }, isChallenge ? `+${xpGained} XP` : passed
        ? nextLevel ? `+${xpGained} XP · ${S.LEVEL_NAMES[nextLevel]} ist jetzt offen.` : `+${xpGained} XP`
        : `+${xpGained} XP · Zum Bestehen brauchst du ${Math.ceil(total * PASS_RATIO)} richtige. Du schaffst das.`));
    const actions = h('div', { class: 'result__actions' },
      h('button', { class: 'btn btn--primary', type: 'button', onclick: () => showCard(mod, levelName, scoreText) }, icon('card'), 'Lernstand-Karte'),
      h('button', { class: 'btn', type: 'button', onclick: () => startRound(root, mod, level, { speed, onExit }) }, icon('repeat'), 'Nochmal'),
      h('button', { class: 'btn btn--ghost', type: 'button', onclick: exit }, 'Zurück zum Modul'));
    stage.append(result, actions);
    foot.innerHTML = '';
  }

  next();
}

const PRAISE = ['Richtig!', 'Stimmt genau.', 'Sitzt.', 'Sauber.', 'Genau so.', 'Treffer.'];
function pickPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

// =====================================================================
// theory.js – Theorie-Kern von „Groove & Theorie“
// Alle Aufgaben und Lösungen werden aus diesen Funktionen erzeugt.
//
// Tonhöhe:  { step, alter, octave }
//   step   0–6  = Stammton C D E F G A H (intern: Buchstabenstufe)
//   alter  -2…+2 = Doppel-B … Doppelkreuz
//   octave       = wissenschaftliche Oktave (c¹ = C4 = MIDI 60)
// Tonklasse: { step, alter } (ohne Oktave)
// =====================================================================

const BASE_PC = [0, 2, 4, 5, 7, 9, 11];
const DE_BASE = ['c', 'd', 'e', 'f', 'g', 'a', 'h'];
const DE_FLAT1 = ['ces', 'des', 'es', 'fes', 'ges', 'as', 'b'];
const DE_FLAT2 = ['ceses', 'deses', 'eses', 'feses', 'geses', 'asas', 'heses'];
const ABC_LETTER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
// Position auf der Quintenreihe (C = 0)
const FIFTHS_POS = [0, 2, 4, -1, 1, 3, 5];

const mod = (n, m) => ((n % m) + m) % m;

export const pitch = (step, alter = 0, octave = 4) => ({ step, alter, octave });

export function midi(p) {
  return 12 * (p.octave + 1) + BASE_PC[p.step] + p.alter;
}
export function pitchClass(p) {
  return mod(BASE_PC[p.step] + p.alter, 12);
}
export function samePitchClass(a, b) {
  return a.step === b.step && a.alter === b.alter;
}
export function enharmonic(a, b) {
  return pitchClass(a) === pitchClass(b);
}

// ---------- Deutsche Tonnamen -------------------------------------------

export function germanName(p) {
  const { step, alter } = p;
  if (alter === 0) return DE_BASE[step];
  if (alter > 0) return DE_BASE[step] + 'is'.repeat(alter);
  if (alter === -1) return DE_FLAT1[step];
  if (alter === -2) return DE_FLAT2[step];
  throw new Error('Vorzeichen außerhalb des Bereichs');
}

/** Großschreibung für Dur-Tonarten/Akkorde: Es, B, Fis, H */
export function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const NAME_TABLE = (() => {
  const t = {};
  for (let s = 0; s < 7; s++) for (let a = -2; a <= 2; a++) t[germanName({ step: s, alter: a })] = { step: s, alter: a };
  return t;
})();

/** „fis“ → {step:3, alter:1}; akzeptiert auch Großschreibung („Es“) */
export function parseGerman(name) {
  const r = NAME_TABLE[name.toLowerCase()];
  if (!r) throw new Error('Unbekannter Tonname: ' + name);
  return { ...r };
}

const SUP = { 1: '¹', 2: '²', 3: '³', 4: '⁴' };
/** Name mit Oktavbezeichnung (Helmholtz): C, c, c¹, c² … */
export function germanNameOctave(p) {
  const n = germanName(p);
  if (p.octave >= 4) return n + SUP[p.octave - 3];
  if (p.octave === 3) return n;
  if (p.octave === 2) return capitalize(n);
  return capitalize(n) + '₁';
}

/** Vorzeichen-Symbol */
export function accidentalSymbol(alter) {
  return { '-2': '𝄫', '-1': '♭', 0: '♮', 1: '♯', 2: '𝄪' }[alter];
}

// ---------- Schritte nach Buchstaben ------------------------------------

/** Geht `letters` Stammtonstufen nach oben und wählt das Vorzeichen so,
 *  dass der Abstand genau `semis` Halbtöne beträgt. */
export function letterUp(p, letters, semis) {
  if (p.octave === undefined) p = { ...p, octave: 4 };
  const raw = p.step + letters;
  const step = mod(raw, 7);
  const octave = p.octave + Math.floor(raw / 7);
  const natural = midi({ step, alter: 0, octave });
  const alter = midi(p) + semis - natural;
  return { step, alter, octave };
}

// ---------- Tonleitern --------------------------------------------------

export const SCALES = {
  dur: { name: 'Dur', steps: [2, 2, 1, 2, 2, 2, 1] },
  moll: { name: 'Moll', steps: [2, 1, 2, 2, 1, 2, 2] },
};

/** Tonleiter aufwärts über eine Oktave (8 Töne inkl. Oktavton) */
export function scale(tonic, mode = 'dur') {
  const t = { octave: 4, ...tonic };
  const out = [t];
  let cur = t;
  for (const s of SCALES[mode].steps) {
    cur = letterUp(cur, 1, s);
    out.push(cur);
  }
  return out;
}

/** Stufen (1-basiert, jeweils die untere), zwischen denen Halbtonschritte liegen */
export function halfStepDegrees(mode = 'dur') {
  return SCALES[mode].steps.map((s, i) => (s === 1 ? i + 1 : null)).filter((x) => x !== null);
}

/** Schrittmuster als Text: „G G H G G G H“ */
export function stepPattern(mode = 'dur') {
  return SCALES[mode].steps.map((s) => (s === 1 ? 'H' : 'G'));
}

/** Dur-Pentatonik: Stufen 1 2 3 5 6 (+ Oktave) */
export function majorPentatonic(tonic) {
  const s = scale(tonic, 'dur');
  return [s[0], s[1], s[2], s[4], s[5], s[7]];
}
/** Moll-Pentatonik: Stufen 1 3 4 5 7 (+ Oktave) des natürlichen Moll */
export function minorPentatonic(tonic) {
  const s = scale(tonic, 'moll');
  return [s[0], s[2], s[3], s[4], s[6], s[7]];
}

// ---------- Tonarten & Generalvorzeichen --------------------------------

export const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // fis cis gis dis ais eis his
export const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // b es as des ges ces fes

/** Anzahl Vorzeichen: + = Kreuze, − = B */
export function keyFifths(tonic, mode = 'dur') {
  const pos = FIFTHS_POS[tonic.step] + 7 * tonic.alter;
  return mode === 'moll' ? pos - 3 : pos;
}

/** Tonika aus Vorzeichenzahl */
export function tonicFromFifths(fifths, mode = 'dur') {
  const pos = fifths + (mode === 'moll' ? 4 : 1); // F C G D A E B als Reihe
  const step = [3, 0, 4, 1, 5, 2, 6][mod(pos, 7)];
  return { step, alter: Math.floor(pos / 7) };
}

/** Generalvorzeichen in korrekter Reihenfolge */
export function keySignature(tonic, mode = 'dur') {
  const f = keyFifths(tonic, mode);
  if (f >= 0) return SHARP_ORDER.slice(0, f).map((step) => ({ step, alter: 1 }));
  return FLAT_ORDER.slice(0, -f).map((step) => ({ step, alter: -1 }));
}

export function keyName(tonic, mode = 'dur') {
  const n = germanName(tonic);
  return mode === 'dur' ? capitalize(n) + '-Dur' : n + '-Moll';
}

export function relativeMinor(majorTonic) {
  const s = scale(majorTonic, 'dur')[5];
  return { step: s.step, alter: s.alter };
}
export function relativeMajor(minorTonic) {
  const s = scale(minorTonic, 'moll')[2];
  return { step: s.step, alter: s.alter };
}

/** Tonarten im Unterricht (bis 3 Vorzeichen) */
export const CURRICULUM_FIFTHS = [0, 1, 2, 3, -1, -2, -3];
export const DUR_KEYS = CURRICULUM_FIFTHS.map((f) => tonicFromFifths(f, 'dur')); // C G D A F B Es
export const MOLL_KEYS = CURRICULUM_FIFTHS.map((f) => tonicFromFifths(f, 'moll')); // a e h fis d g c

/** Quintenzirkel: 12 Positionen (Dur außen, Moll innen), ab C im Uhrzeigersinn.
 *  Position 6 (Fis/Ges) wird mit beiden Schreibweisen angegeben. */
export function circleOfFifths() {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const f = i <= 6 ? i : i - 12; // 0…6 Kreuze, dann −5…−1
    const entry = {
      index: i,
      fifths: f,
      dur: tonicFromFifths(f, 'dur'),
      moll: tonicFromFifths(f, 'moll'),
      inCurriculum: CURRICULUM_FIFTHS.includes(f),
    };
    if (i === 6) {
      entry.durAlt = tonicFromFifths(-6, 'dur');
      entry.mollAlt = tonicFromFifths(-6, 'moll');
    }
    out.push(entry);
  }
  return out;
}

// ---------- Intervalle --------------------------------------------------

export const INTERVAL_NAMES = ['Prime', 'Sekunde', 'Terz', 'Quarte', 'Quinte', 'Sexte', 'Septime', 'Oktave'];
const PERFECT_REF = { 1: 0, 4: 5, 5: 7, 8: 12 };
const MAJOR_REF = { 2: 2, 3: 4, 6: 9, 7: 11 };
const QUAL_PERFECT = { '-1': 'vermindert', 0: 'rein', 1: 'übermäßig' };
const QUAL_IMPERFECT = { '-2': 'vermindert', '-1': 'klein', 0: 'groß', 1: 'übermäßig' };

export function isPerfectNumber(n) {
  return n in PERFECT_REF;
}

/** Intervall von a (unten) nach b (oben), bis zur Oktave */
export function interval(a, b) {
  const number = b.step + 7 * b.octave - (a.step + 7 * a.octave) + 1;
  if (number < 1 || number > 8) throw new Error('Nur Intervalle von Prime bis Oktave');
  const semis = midi(b) - midi(a);
  const quality = isPerfectNumber(number)
    ? QUAL_PERFECT[semis - PERFECT_REF[number]]
    : QUAL_IMPERFECT[semis - MAJOR_REF[number]];
  if (!quality) throw new Error('Intervallqualität außerhalb des Bereichs');
  const name = INTERVAL_NAMES[number - 1];
  return { number, semis, quality, name, label: `${quality}e ${name}` };
}

/** Ton im Abstand eines Intervalls über p */
export function transpose(p, number, quality) {
  const ref = isPerfectNumber(number) ? PERFECT_REF[number] : MAJOR_REF[number];
  const table = isPerfectNumber(number) ? QUAL_PERFECT : QUAL_IMPERFECT;
  const delta = Number(Object.keys(table).find((k) => table[k] === quality));
  if (Number.isNaN(delta)) throw new Error('Ungültige Qualität für dieses Intervall');
  return letterUp(p, number - 1, ref + delta);
}

// ---------- Dreiklänge --------------------------------------------------

export const TRIADS = {
  dur: { name: 'Dur-Dreiklang', semis: [4, 7], thirds: ['große', 'kleine'] },
  moll: { name: 'Moll-Dreiklang', semis: [3, 7], thirds: ['kleine', 'große'] },
  vermindert: { name: 'verminderter Dreiklang', semis: [3, 6], thirds: ['kleine', 'kleine'] },
  uebermaessig: { name: 'übermäßiger Dreiklang', semis: [4, 8], thirds: ['große', 'große'] },
};

/** Dreiklang in Grundstellung: [Grundton, Terz, Quinte] */
export function triad(root, type = 'dur') {
  const r = { octave: 4, ...root };
  const [t, q] = TRIADS[type].semis;
  return [r, letterUp(r, 2, t), letterUp(r, 4, q)];
}

/** Akkordsymbol mit deutschen Grundtonnamen: C, Am, B, Hm, Es, Fism, H°, C+ */
export function chordSymbol(root, type = 'dur') {
  const n = capitalize(germanName(root));
  return n + { dur: '', moll: 'm', vermindert: '°', uebermaessig: '+' }[type];
}

// ---------- abc-Notation -------------------------------------------------

export function abcKeyField(tonic, mode = 'dur') {
  if (!tonic) return 'C';
  const acc = tonic.alter > 0 ? '#'.repeat(tonic.alter) : 'b'.repeat(-tonic.alter);
  return ABC_LETTER[tonic.step] + acc + (mode === 'moll' ? 'm' : '');
}

function abcPitchLetters(p) {
  let s = p.octave >= 5 ? ABC_LETTER[p.step].toLowerCase() : ABC_LETTER[p.step];
  if (p.octave >= 6) s += "'".repeat(p.octave - 5);
  if (p.octave <= 3) s += ','.repeat(4 - p.octave);
  return s;
}
const ABC_ACC = { '-2': '__', '-1': '_', 0: '=', 1: '^', 2: '^^' };

/**
 * Schreibt eine Folge von Tönen als abc-Notenzeile – mit korrekter
 * Vorzeichen-Logik (Generalvorzeichen + Gültigkeit bis zum Taktstrich).
 * items: Tonhöhen oder {pitch, len, pre, post, bar}
 * Rückgabe: { body, ranges } – ranges[i] = [start,end] im body-String
 */
export function abcNotes(items, { keySig = [], len = '' } = {}) {
  const keyAlter = {};
  keySig.forEach((k) => (keyAlter[k.step] = k.alter));
  let state = {};
  let body = '';
  const ranges = [];
  for (const it of items) {
    if (it === '|' || (it && it.bar)) {
      body += (it.bar || '|') + ' ';
      state = {};
      continue;
    }
    if (it.chord) {
      // Zusammenklang: [CEG] – Vorzeichen für jeden Ton einzeln prüfen
      const noteLen = it.len !== undefined ? it.len : len;
      const parts = it.chord.map((p) => {
        const id = p.step + 7 * p.octave;
        const current = id in state ? state[id] : keyAlter[p.step] || 0;
        const acc = p.forceAccidental || current !== p.alter ? ABC_ACC[p.alter] : '';
        state[id] = p.alter;
        return acc + abcPitchLetters(p);
      });
      const start = body.length + (it.pre ? it.pre.length : 0);
      const note = '[' + parts.join('') + ']' + noteLen;
      body += (it.pre || '') + note;
      ranges.push([start, start + note.length]);
      body += (it.post || '') + ' ';
      continue;
    }
    const p = it.step !== undefined ? it : it.pitch;
    const noteLen = it.len !== undefined ? it.len : len;
    const id = p.step + 7 * p.octave;
    const current = id in state ? state[id] : keyAlter[p.step] || 0;
    let acc = '';
    if (p.forceAccidental || current !== p.alter) acc = ABC_ACC[p.alter];
    if (p.hideAccidental) acc = '';
    state[id] = p.hideAccidental ? current : p.alter;
    const start = body.length + (it.pre ? it.pre.length : 0);
    const note = acc + abcPitchLetters(p) + noteLen;
    body += (it.pre || '') + note;
    ranges.push([start, start + note.length]);
    body += (it.post || '') + ' ';
  }
  return { body: body.trim(), ranges };
}

/** Komplettes abc-Stück */
export function abcTune({ body, key = 'C', clef = 'treble', meter = 'none', unit = '1/1', title = '' }) {
  return `X:1\n${title ? 'T:' + title + '\n' : ''}M:${meter}\nL:${unit}\nK:${key} clef=${clef}\n${body}`;
}

// ---------- Hilfen für Zufallsaufgaben ----------------------------------

export function rand(n) {
  return Math.floor(Math.random() * n);
}
export function pick(arr) {
  return arr[rand(arr.length)];
}
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function names(pitches) {
  return pitches.map(germanName).join(' – ');
}

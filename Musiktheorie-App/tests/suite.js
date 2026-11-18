// Automatisierte Tests für den Theorie-Kern.
// Läuft im Browser über tests.html. Die Erwartungswerte sind bewusst
// von Hand aufgeschrieben (unabhängig von den Funktionen im Kern).
import * as T from '../js/core/theory.js';
import * as R from '../js/core/rhythm.js';
import { genMeasure } from '../js/modules/m1-notenwerte.js';
import { TAP, SYNC_RHYTHMS, PLAIN_RHYTHMS, GROOVES } from '../js/modules/m2-rhythmus.js';
import { SONGS, MNEMO } from '../js/modules/m5-intervalle.js';
import { diatonic } from '../js/modules/m6-akkorde.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function eq(actual, expected, msg = '') {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} erwartet ${e}, erhalten ${a}`);
}
const n = (s) => T.parseGerman(s);
const list = (pitches) => pitches.map(T.germanName).join(' ');

// ---------- Tonnamen ----------
test('Deutsche Tonnamen: Stammtöne inkl. h', () => {
  eq([0, 1, 2, 3, 4, 5, 6].map((s) => T.germanName({ step: s, alter: 0 })), ['c', 'd', 'e', 'f', 'g', 'a', 'h']);
});
test('Deutsche Tonnamen: Kreuz-Töne', () => {
  eq([0, 1, 2, 3, 4, 5, 6].map((s) => T.germanName({ step: s, alter: 1 })), ['cis', 'dis', 'eis', 'fis', 'gis', 'ais', 'his']);
});
test('Deutsche Tonnamen: B-Töne (es, as, b)', () => {
  eq([0, 1, 2, 3, 4, 5, 6].map((s) => T.germanName({ step: s, alter: -1 })), ['ces', 'des', 'es', 'fes', 'ges', 'as', 'b']);
});
test('Deutsche Tonnamen: Doppelvorzeichen', () => {
  eq(T.germanName({ step: 6, alter: -2 }), 'heses');
  eq(T.germanName({ step: 2, alter: -2 }), 'eses');
  eq(T.germanName({ step: 5, alter: -2 }), 'asas');
  eq(T.germanName({ step: 3, alter: 2 }), 'fisis');
});
test('Tonnamen zurücklesen (parseGerman)', () => {
  for (const s of ['c', 'cis', 'des', 'es', 'fis', 'ges', 'as', 'b', 'h', 'his', 'heses']) eq(T.germanName(n(s)), s);
});
test('Oktavbezeichnung c¹ = MIDI 60, a¹ = MIDI 69', () => {
  eq(T.midi(T.pitch(0, 0, 4)), 60);
  eq(T.midi(T.pitch(5, 0, 4)), 69);
  eq(T.germanNameOctave(T.pitch(0, 0, 4)), 'c¹');
  eq(T.germanNameOctave(T.pitch(6, -1, 3)), 'b');
  eq(T.germanNameOctave(T.pitch(4, 0, 2)), 'G');
});
test('Enharmonische Verwechslung: fis = ges, cis = des, h = ces', () => {
  eq(T.enharmonic(n('fis'), n('ges')), true);
  eq(T.enharmonic(n('cis'), n('des')), true);
  eq(T.enharmonic(n('h'), n('ces')), true);
  eq(T.enharmonic(n('b'), n('h')), false);
});

// ---------- Tonleitern ----------
const DUR = {
  C: 'c d e f g a h c', G: 'g a h c d e fis g', D: 'd e fis g a h cis d', A: 'a h cis d e fis gis a',
  F: 'f g a b c d e f', B: 'b c d es f g a b', Es: 'es f g as b c d es',
};
const MOLL = {
  a: 'a h c d e f g a', e: 'e fis g a h c d e', h: 'h cis d e fis g a h', fis: 'fis gis a h cis d e fis',
  d: 'd e f g a b c d', g: 'g a b c d es f g', c: 'c d es f g as b c',
};
for (const [k, exp] of Object.entries(DUR)) test(`${k}-Dur: Töne`, () => eq(list(T.scale(n(k), 'dur')), exp));
for (const [k, exp] of Object.entries(MOLL)) test(`${k}-Moll: Töne`, () => eq(list(T.scale(n(k), 'moll')), exp));

test('Tonleitern steigen immer genau eine Oktave (12 Halbtöne)', () => {
  for (const k of [...T.DUR_KEYS, ...T.MOLL_KEYS]) {
    for (const m of ['dur', 'moll']) {
      const s = T.scale(k, m);
      eq(T.midi(s[7]) - T.midi(s[0]), 12, T.keyName(k, m));
    }
  }
});
test('Halbtonschritte: Dur 3–4 und 7–8, Moll 2–3 und 5–6', () => {
  eq(T.halfStepDegrees('dur'), [3, 7]);
  eq(T.halfStepDegrees('moll'), [2, 5]);
});
test('Halbtonschritte in jeder Tonleiter tatsächlich 1 Halbton', () => {
  for (const k of T.DUR_KEYS) {
    const s = T.scale(k, 'dur');
    eq([T.midi(s[3]) - T.midi(s[2]), T.midi(s[7]) - T.midi(s[6])], [1, 1], T.keyName(k));
  }
  for (const k of T.MOLL_KEYS) {
    const s = T.scale(k, 'moll');
    eq([T.midi(s[2]) - T.midi(s[1]), T.midi(s[5]) - T.midi(s[4])], [1, 1], T.keyName(k, 'moll'));
  }
});
test('Jeder Buchstabe kommt in einer Tonleiter genau einmal vor', () => {
  for (const k of [...T.DUR_KEYS, ...T.MOLL_KEYS]) for (const m of ['dur', 'moll']) {
    const steps = T.scale(k, m).slice(0, 7).map((p) => p.step).sort();
    eq(steps, [0, 1, 2, 3, 4, 5, 6]);
  }
});

// ---------- Tonarten & Generalvorzeichen ----------
test('Tonarten des Umfangs: Dur C G D A F B Es', () => {
  eq(T.DUR_KEYS.map((k) => T.keyName(k, 'dur')), ['C-Dur', 'G-Dur', 'D-Dur', 'A-Dur', 'F-Dur', 'B-Dur', 'Es-Dur']);
});
test('Tonarten des Umfangs: Moll a e h fis d g c', () => {
  eq(T.MOLL_KEYS.map((k) => T.keyName(k, 'moll')), ['a-Moll', 'e-Moll', 'h-Moll', 'fis-Moll', 'd-Moll', 'g-Moll', 'c-Moll']);
});
const SIG = {
  C: '', G: 'fis', D: 'fis cis', A: 'fis cis gis', F: 'b', B: 'b es', Es: 'b es as',
};
for (const [k, exp] of Object.entries(SIG)) {
  test(`Generalvorzeichen ${k}-Dur: ${exp || 'keine'}`, () => eq(list(T.keySignature(n(k), 'dur')), exp));
}
const SIG_M = { a: '', e: 'fis', h: 'fis cis', fis: 'fis cis gis', d: 'b', g: 'b es', c: 'b es as' };
for (const [k, exp] of Object.entries(SIG_M)) {
  test(`Generalvorzeichen ${k}-Moll: ${exp || 'keine'}`, () => eq(list(T.keySignature(n(k), 'moll')), exp));
}
test('Generalvorzeichen = Vorzeichen, die in der Tonleiter vorkommen', () => {
  for (const k of [...T.DUR_KEYS]) for (const m of ['dur', 'moll']) {
    const fromScale = T.scale(k, m).slice(0, 7).filter((p) => p.alter !== 0).map(T.germanName).sort();
    const sig = T.keySignature(k, m).map(T.germanName).sort();
    eq(fromScale, sig, T.keyName(k, m));
  }
});
test('Parallele Tonarten', () => {
  const pairs = { C: 'a', G: 'e', D: 'h', A: 'fis', F: 'd', B: 'g', Es: 'c' };
  for (const [d, m] of Object.entries(pairs)) {
    eq(T.germanName(T.relativeMinor(n(d))), m);
    eq(T.germanName(T.relativeMajor(n(m))), T.germanName(n(d)));
  }
});
test('abc-Tonart-Feld (für abcjs)', () => {
  eq(T.abcKeyField(n('es'), 'dur'), 'Eb');
  eq(T.abcKeyField(n('b'), 'dur'), 'Bb');
  eq(T.abcKeyField(n('fis'), 'moll'), 'F#m');
  eq(T.abcKeyField(n('h'), 'moll'), 'Bm');
});
test('Quintenzirkel: Reihenfolge und Paralleltonarten', () => {
  const c = T.circleOfFifths();
  eq(c.map((e) => T.germanName(e.dur)).join(' '), 'c g d a e h fis des as es b f');
  eq(c.map((e) => T.germanName(e.moll)).join(' '), 'a e h fis cis gis dis b f c g d');
  eq(T.germanName(c[6].durAlt), 'ges');
});

// ---------- Pentatonik ----------
test('Dur-Pentatonik: C, G, F', () => {
  eq(list(T.majorPentatonic(n('c'))), 'c d e g a c');
  eq(list(T.majorPentatonic(n('g'))), 'g a h d e g');
  eq(list(T.majorPentatonic(n('f'))), 'f g a c d f');
});
test('Moll-Pentatonik: a', () => eq(list(T.minorPentatonic(n('a'))), 'a c d e g a'));

// ---------- Intervalle zwischen Stammtönen ----------
// Von Hand: Intervall vom Stammton (Zeile) aufwärts, 1 = Prime … 8 = Oktave
const STAMM = ['c', 'd', 'e', 'f', 'g', 'a', 'h'];
const IV = {
  c: ['reine Prime', 'große Sekunde', 'große Terz', 'reine Quarte', 'reine Quinte', 'große Sexte', 'große Septime', 'reine Oktave'],
  d: ['reine Prime', 'große Sekunde', 'kleine Terz', 'reine Quarte', 'reine Quinte', 'große Sexte', 'kleine Septime', 'reine Oktave'],
  e: ['reine Prime', 'kleine Sekunde', 'kleine Terz', 'reine Quarte', 'reine Quinte', 'kleine Sexte', 'kleine Septime', 'reine Oktave'],
  f: ['reine Prime', 'große Sekunde', 'große Terz', 'übermäßige Quarte', 'reine Quinte', 'große Sexte', 'große Septime', 'reine Oktave'],
  g: ['reine Prime', 'große Sekunde', 'große Terz', 'reine Quarte', 'reine Quinte', 'große Sexte', 'kleine Septime', 'reine Oktave'],
  a: ['reine Prime', 'große Sekunde', 'kleine Terz', 'reine Quarte', 'reine Quinte', 'kleine Sexte', 'kleine Septime', 'reine Oktave'],
  h: ['reine Prime', 'kleine Sekunde', 'kleine Terz', 'reine Quarte', 'verminderte Quinte', 'kleine Sexte', 'kleine Septime', 'reine Oktave'],
};
for (const [lowName, exp] of Object.entries(IV)) {
  test(`Intervalle über ${lowName}¹ (alle Stammtöne)`, () => {
    const low = { ...n(lowName), octave: 4 };
    const got = [];
    for (let k = 0; k < 8; k++) got.push(T.interval(low, naturalUp(low, k)).label);
    eq(got, exp);
  });
}
function naturalUp(low, k) {
  const raw = low.step + k;
  return { step: raw % 7, alter: 0, octave: low.octave + Math.floor(raw / 7) };
}
test('Intervall: Halbtonzahlen', () => {
  eq(T.interval(T.pitch(0, 0, 4), T.pitch(2, 0, 4)).semis, 4);
  eq(T.interval(T.pitch(2, 0, 4), T.pitch(4, 0, 4)).semis, 3);
  eq(T.interval(T.pitch(3, 0, 4), T.pitch(6, 0, 4)).semis, 6);
});
test('Intervalle mit Vorzeichen', () => {
  eq(T.interval(T.pitch(0, 0, 4), T.pitch(2, -1, 4)).label, 'kleine Terz'); // c–es
  eq(T.interval(T.pitch(3, 1, 4), T.pitch(5, 1, 4)).label, 'große Terz'); // fis–ais
  eq(T.interval(T.pitch(6, -1, 3), T.pitch(3, 0, 4)).label, 'reine Quinte'); // b–f
  eq(T.interval(T.pitch(0, 0, 4), T.pitch(3, 1, 4)).label, 'übermäßige Quarte'); // c–fis
});
test('Transponieren nach Intervall', () => {
  eq(T.germanName(T.transpose(n('d'), 3, 'groß')), 'fis');
  eq(T.germanName(T.transpose(n('es'), 5, 'rein')), 'b');
  eq(T.germanName(T.transpose(n('h'), 3, 'klein')), 'd');
  eq(T.germanName(T.transpose(n('e'), 2, 'klein')), 'f');
});

// ---------- Dreiklänge ----------
const ROOTS = ['c', 'cis', 'd', 'e', 'es', 'f', 'fis', 'g', 'gis', 'a', 'as', 'b', 'h'];
const CHORDS = {
  dur: ['c e g', 'cis eis gis', 'd fis a', 'e gis h', 'es g b', 'f a c', 'fis ais cis', 'g h d', 'gis his dis', 'a cis e', 'as c es', 'b d f', 'h dis fis'],
  moll: ['c es g', 'cis e gis', 'd f a', 'e g h', 'es ges b', 'f as c', 'fis a cis', 'g b d', 'gis h dis', 'a c e', 'as ces es', 'b des f', 'h d fis'],
  vermindert: ['c es ges', 'cis e g', 'd f as', 'e g b', 'es ges heses', 'f as ces', 'fis a c', 'g b des', 'gis h d', 'a c es', 'as ces eses', 'b des fes', 'h d f'],
  uebermaessig: ['c e gis', 'cis eis gisis', 'd fis ais', 'e gis his', 'es g h', 'f a cis', 'fis ais cisis', 'g h dis', 'gis his disis', 'a cis eis', 'as c e', 'b d fis', 'h dis fisis'],
};
for (const [type, exp] of Object.entries(CHORDS)) {
  test(`Dreiklänge ${T.TRIADS[type].name} auf ${ROOTS.length} Grundtönen`, () => {
    eq(ROOTS.map((r) => list(T.triad(n(r), type))), exp);
  });
}
test('Dreiklänge: Halbtonabstände Dur 4+3, Moll 3+4, vermindert 3+3, übermäßig 4+4', () => {
  const exp = { dur: [4, 3], moll: [3, 4], vermindert: [3, 3], uebermaessig: [4, 4] };
  for (const r of ROOTS) for (const [type, e] of Object.entries(exp)) {
    const [a, b, c] = T.triad(n(r), type);
    eq([T.midi(b) - T.midi(a), T.midi(c) - T.midi(b)], e, r + ' ' + type);
  }
});
test('Akkordsymbole (deutsch)', () => {
  eq(T.chordSymbol(n('a'), 'moll'), 'Am');
  eq(T.chordSymbol(n('b'), 'dur'), 'B');
  eq(T.chordSymbol(n('h'), 'moll'), 'Hm');
  eq(T.chordSymbol(n('es'), 'dur'), 'Es');
});

// ---------- abc-Ausgabe ----------
test('abc: D-Dur ohne Generalvorzeichen schreibt Kreuze aus', () => {
  eq(T.abcNotes(T.scale(n('d'))).body, 'D E ^F G A B ^c d');
});
test('abc: D-Dur mit Generalvorzeichen schreibt keine Kreuze', () => {
  eq(T.abcNotes(T.scale(n('d')), { keySig: T.keySignature(n('d')) }).body, 'D E F G A B c d');
});
test('abc: Vorzeichen gilt bis Taktende, danach Auflösung nötig', () => {
  const f = T.pitch(3, 0, 4), fis = T.pitch(3, 1, 4);
  eq(T.abcNotes([fis, f, '|', fis, fis]).body, '^F =F | ^F F');
});
test('abc: Es-Dur-Tonleiter', () => {
  eq(T.abcNotes(T.scale(n('es'))).body, '_E F G _A _B c d _e');
});
test('abc: Oktavlagen', () => {
  eq(T.abcNotes([T.pitch(0, 0, 3), T.pitch(0, 0, 4), T.pitch(0, 0, 5), T.pitch(0, 0, 6)]).body, "C, C c c'");
});

// ---------- Rhythmus ----------
test('Notenwerte: Einheiten', () => {
  eq(R.VALUES.punktViertel.units, R.VALUES.viertel.units + R.VALUES.achtel.units);
  eq(R.VALUES.achtelTriole.units * 3, R.VALUES.viertel.units);
  eq(R.VALUES.viertelTriole.units * 3, R.VALUES.halbe.units);
});
test('Taktsummen', () => {
  eq(R.measureIsFull(['viertel', 'viertel', 'halbe'], '4/4'), true);
  eq(R.measureIsFull(['punktViertel', 'punktViertel'], '6/8'), true);
  eq(R.measureIsFull(['punktViertel', 'achtel', 'viertel'], '3/4'), true);
  eq(R.measureIsFull(['viertel', 'viertel', 'viertel'], '4/4'), false);
  eq(R.measureIsFull(['achtelTriole', 'achtelTriole', 'achtelTriole', 'viertel'], '2/4'), true);
});
test('Rhythmus-Patterns passen ins Raster', () => {
  for (const p of Object.values(R.PATTERNS)) eq(R.patternIsValid(p), true, p.name);
});

// ---------- Rhythmus-Notation (Module 1 und 2) ----------
const bars = (s) => R.parseBars(s);
test('Rhythmus: Kurzschreibweise → Einheiten', () => {
  eq(R.parseRhythm('4 8 8 2').map((x) => x.u), [12, 6, 6, 24]);
  eq(R.parseRhythm('4. 8 r4 16').map((x) => [x.u, !!x.rest]), [[18, false], [6, false], [12, true], [3, false]]);
  eq(R.measureUnits(R.parseRhythm('t8 4 t4')), 48);
});
test('Rhythmus: abc-Balken nach Zählzeiten (4/4)', () => {
  eq(R.rhythmAbc(bars('8 8 4 8 8 4'), '4/4'), 'B2B2 B4 B2B2 B4 |]');
  eq(R.rhythmAbc(bars('8 4 8 4 4'), '4/4'), 'B2 B4 B2 B4 B4 |]');
  eq(R.rhythmAbc(bars('8. 16 4 2'), '4/4'), 'B3B B4 B8 |]');
  eq(R.rhythmAbc(bars('r8 8 r4 2'), '4/4'), 'z2 B2 z4 B8 |]');
  eq(R.rhythmAbc(bars('16 16 16 16 1'), '4/4').startsWith('BBBB'), true);
});
test('Rhythmus: Triolen und 6/8 in abc', () => {
  eq(R.rhythmAbc(bars('t8 4 t8 4'), '4/4'), '(3B2B2B2 B4 (3B2B2B2 B4 |]');
  eq(R.rhythmAbc(bars('2 t4'), '4/4'), 'B8 (3B4B4B4 |]');
  eq(R.rhythmAbc(bars('8 8 8 8 8 8'), '6/8'), 'B2B2B2 B2B2B2 |]');
  eq(R.rhythmAbc(bars('4. 4. 4 | r4 4 4 r4'), '4/4'), 'B6 B6 B4 | z4 B4 B4 z4 |]');
});
test('Rhythmus: Einsätze (Onsets) der Clave passen zum Groove-Raster', () => {
  // Notation 4. 4. 4 | r4 4 4 r4 = Raster-Felder 0 3 6 | 10 12 (Achtel = 6 Einheiten)
  eq(R.onsets(bars('4. 4. 4 | r4 4 4 r4'), '4/4'), [0, 18, 36, 60, 72]);
  eq(GROOVES.clave.layers[0].hits.map((x) => x * 6), [0, 18, 36, 60, 72]);
});
test('Modul 2: alle festen Rhythmen füllen genau 4/4-Takte', () => {
  const all = [...TAP.hop, ...TAP.step, ...TAP.jump, ...SYNC_RHYTHMS, ...PLAIN_RHYTHMS];
  for (const s of all) for (const m of bars(s)) eq(R.measureUnits(m), 48, s);
});
test('Modul 2: Synkopen-Rhythmen haben einen Ton, der auf „und“ beginnt und über den Schlag hält', () => {
  for (const s of SYNC_RHYTHMS) {
    let pos = 0, found = false;
    for (const it of R.parseRhythm(s)) { if (!it.rest && pos % 12 !== 0 && Math.floor(pos / 12) !== Math.floor((pos + it.u - 1) / 12)) found = true; pos += it.u; }
    eq(found, true, s);
  }
  for (const s of PLAIN_RHYTHMS) {
    let pos = 0, found = false;
    for (const it of R.parseRhythm(s)) { if (!it.rest && pos % 12 !== 0 && Math.floor(pos / 12) !== Math.floor((pos + it.u - 1) / 12)) found = true; pos += it.u; }
    eq(found, false, s);
  }
});
test('Modul 1: 1.200 Zufallstakte haben immer die richtige Länge', () => {
  for (const meter of ['2/4', '3/4', '4/4', '6/8']) for (const lv of ['hop', 'step', 'jump']) for (let i = 0; i < 100; i++) {
    const m = genMeasure(meter, lv);
    eq(R.measureUnits(m), R.METERS[meter].units, `${meter} ${lv}`);
    R.rhythmAbc([m], meter); // darf keinen Fehler werfen
  }
});

// ---------- Akkorde im Notenbild, Stufen ----------
test('abc: Akkorde mit Vorzeichen und Generalvorzeichen', () => {
  eq(T.abcNotes([{ chord: T.triad(n('d'), 'dur'), len: '' }]).body, '[D^FA]');
  eq(T.abcNotes([{ chord: T.triad(n('d'), 'dur'), len: '' }], { keySig: T.keySignature(n('d')) }).body, '[DFA]');
  eq(T.abcNotes([{ chord: T.triad(n('es'), 'dur'), len: '' }]).body, '[_EG_B]');
});
test('Stufenakkorde in Dur', () => {
  const sym = (k) => [0, 1, 2, 3, 4, 5, 6].map((d) => T.chordSymbol(diatonic(n(k), d)[0], ['dur', 'moll', 'moll', 'dur', 'dur', 'moll', 'vermindert'][d])).join(' ');
  eq(sym('c'), 'C Dm Em F G Am H°');
  eq(sym('g'), 'G Am Hm C D Em Fis°');
  eq(sym('f'), 'F Gm Am B C Dm E°');
  eq(sym('b'), 'B Cm Dm Es F Gm A°');
  // Stufenakkorde haben wirklich die angegebene Art
  for (const k of ['c', 'g', 'd', 'a', 'f', 'b', 'es']) [0, 1, 2, 3, 4, 5, 6].forEach((d) => {
    const ch = diatonic(n(k), d);
    const semis = [T.midi(ch[1]) - T.midi(ch[0]), T.midi(ch[2]) - T.midi(ch[0])];
    eq(semis, [[4, 7], [3, 7], [3, 7], [4, 7], [4, 7], [3, 7], [3, 6]][d], `${k} Stufe ${d + 1}`);
  });
});

// ---------- Intervall-Merkhilfen ----------
const SONG_SEMIS = { 'große Sekunde': 2, 'kleine Terz': 3, 'große Terz': 4, 'reine Quarte': 5, 'reine Quinte': 7, 'große Sexte': 9 };
test('Modul 5: Liedanfänge klingen wirklich im genannten Intervall', () => {
  for (const [song, label, notes] of SONGS) eq(Math.abs(notes[1] - notes[0]), SONG_SEMIS[label], song);
});
test('Modul 5: Für jedes Intervall gibt es eine Merkhilfe', () => {
  for (const l of ['reine Prime', 'kleine Sekunde', 'große Sekunde', 'kleine Terz', 'große Terz', 'reine Quarte', 'übermäßige Quarte', 'verminderte Quinte', 'reine Quinte', 'kleine Sexte', 'große Sexte', 'kleine Septime', 'große Septime', 'reine Oktave']) eq(!!MNEMO[l], true, l);
});
test('Modul 5: Merkhilfen-Beispiele stimmen (Tonnamen nachgerechnet)', () => {
  eq(T.interval(T.pitch(0), T.pitch(1)).label, 'große Sekunde'); // Alle meine Entchen c–d
  eq(T.interval(T.pitch(2), T.pitch(4)).label, 'kleine Terz'); // Kuckuck g–e (abwärts)
  eq(T.interval(T.pitch(1), T.pitch(4)).label, 'reine Quarte'); // O Tannenbaum d–g
  eq(T.interval(T.pitch(0), T.pitch(4)).label, 'reine Quinte'); // Morgen kommt … c–g
  eq(T.interval(T.pitch(0), T.pitch(2)).label, 'große Terz'); // Saints c–e
  eq(T.interval(T.pitch(2), T.pitch(3)).label, 'kleine Sekunde'); // Hänschen klein e–f
  eq(T.interval(T.pitch(2), T.pitch(0, 0, 5)).label, 'kleine Sexte'); // Entertainer e–c
  eq(T.interval(T.pitch(4), T.pitch(2, 0, 5)).label, 'große Sexte'); // My Bonnie g–e
});

// ---------- Enharmonik (Modul 3) ----------
test('Enharmonik: eis = f, his = c, fes = e, ces = h, fis = ges', () => {
  eq(T.enharmonic(n('eis'), n('f')), true);
  eq(T.enharmonic(n('his'), n('c')), true);
  eq(T.enharmonic(n('fes'), n('e')), true);
  eq(T.enharmonic(n('ces'), n('h')), true);
  eq(T.enharmonic(n('fis'), n('ges')), true);
  eq(T.enharmonic(n('fis'), n('g')), false);
});
export function runAll() {
  const results = [];
  for (const t of tests) {
    try { t.fn(); results.push({ name: t.name, ok: true }); }
    catch (e) { results.push({ name: t.name, ok: false, error: e.message }); }
  }
  return results;
}

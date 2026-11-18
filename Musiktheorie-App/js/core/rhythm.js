// =====================================================================
// rhythm.js – Notenwerte, Taktarten und Rhythmus-Patterns
// Dauer-Einheit: 1/48 ganze Note (damit gehen auch Triolen glatt auf)
// =====================================================================

export const UNIT = 48; // eine ganze Note

export const VALUES = {
  ganze: { name: 'Ganze', units: 48, abc: '8' },
  halbe: { name: 'Halbe', units: 24, abc: '4' },
  viertel: { name: 'Viertel', units: 12, abc: '2' },
  achtel: { name: 'Achtel', units: 6, abc: '' },
  sechzehntel: { name: 'Sechzehntel', units: 3, abc: '/' },
  punktHalbe: { name: 'punktierte Halbe', units: 36, abc: '6' },
  punktViertel: { name: 'punktierte Viertel', units: 18, abc: '3' },
  punktAchtel: { name: 'punktierte Achtel', units: 9, abc: '3/2' },
  achtelTriole: { name: 'Achtel (Triole)', units: 4, abc: '' },
  viertelTriole: { name: 'Viertel (Triole)', units: 8, abc: '2' },
};

export const METERS = {
  '2/4': { units: 24, beats: 2, beatUnits: 12 },
  '3/4': { units: 36, beats: 3, beatUnits: 12 },
  '4/4': { units: 48, beats: 4, beatUnits: 12 },
  '6/8': { units: 36, beats: 2, beatUnits: 18 },
};

export function sum(values) {
  return values.reduce((s, v) => s + VALUES[v].units, 0);
}
export function measureIsFull(values, meter) {
  return sum(values) === METERS[meter].units;
}

/**
 * Rhythmus-Patterns aus den Kulturräumen der Einheit.
 * steps: Raster (16 = Sechzehntel im 4/4, bzw. 2 Takte 2/4 bei Samba)
 * hits: Positionen der Schläge (0-basiert), accents optional
 */
export const PATTERNS = {
  sonClave32: {
    name: '3-2-Son-Clave',
    culture: 'Kuba / Lateinamerika',
    meter: '4/4', bars: 2, steps: 32,
    hits: [0, 6, 12, 20, 24],
  },
  surdo: {
    name: 'Surdo (Samba Batucada)',
    culture: 'Brasilien',
    meter: '2/4', bars: 2, steps: 16,
    hits: [4, 12], // Schlag auf Zählzeit 2 – die „Antwort“-Surdo betont die 2
  },
  tamborim: {
    name: 'Tamborim-Teleco',
    culture: 'Brasilien',
    meter: '2/4', bars: 2, steps: 16,
    hits: [0, 2, 3, 5, 7, 8, 10, 11, 13, 15],
  },
  caixa: {
    name: 'Caixa (Grundmuster)',
    culture: 'Brasilien',
    meter: '2/4', bars: 1, steps: 8,
    hits: [0, 1, 2, 3, 4, 5, 6, 7],
    accents: [0, 3, 4, 7],
  },
  reggaeSkank: {
    name: 'Reggae-Offbeat (Skank)',
    culture: 'Jamaika',
    meter: '4/4', bars: 1, steps: 8,
    hits: [1, 3, 5, 7],
  },
  oneDrop: {
    name: 'One Drop (Bassdrum)',
    culture: 'Jamaika',
    meter: '4/4', bars: 1, steps: 16,
    hits: [8],
  },
};

/** Prüft, ob ein Pattern rechnerisch ins Raster passt */
export function patternIsValid(p) {
  const perBar = p.steps / p.bars;
  return Number.isInteger(perBar) && p.hits.every((h) => Number.isInteger(h) && h >= 0 && h < p.steps);
}

// ---------- Rhythmen als Takte -------------------------------------------
// Ein Takt ist eine Liste von Elementen:
//   { u: Einheiten, rest?: true }            – Note oder Pause
//   { tri: [{u, rest?}, …] }                 – Triole (3 Elemente)
// Triolen: drei Achteltriolen (je 4) = 12 = eine Viertel,
//          drei Vierteltriolen (je 8) = 24 = eine Halbe.

/** Länge eines Elements in Einheiten */
export function itemUnits(it) {
  return it.tri ? it.tri.reduce((s, x) => s + x.u, 0) : it.u;
}
export function measureUnits(m) {
  return m.reduce((s, it) => s + itemUnits(it), 0);
}
/** Startzeitpunkte (in Einheiten ab Taktbeginn 1) aller Noten (ohne Pausen) */
export function onsets(measures, meter) {
  const bar = METERS[meter].units;
  const out = [];
  measures.forEach((m, mi) => {
    let pos = mi * bar;
    for (const it of m) {
      const parts = it.tri || [it];
      for (const p of parts) {
        if (!p.rest && !p.gap) out.push(pos);
        pos += p.u;
      }
    }
  });
  return out;
}

// abc-Längen bei L:1/16 (eine Sechzehntel = 3 Einheiten)
const ABC_LEN = { 48: '16', 36: '12', 24: '8', 18: '6', 12: '4', 9: '3', 6: '2', 3: '' };
// innerhalb einer Triole: Achteltriole (4) = notiert wie Achtel, Vierteltriole (8) wie Viertel
const ABC_TRI = { 4: '2', 8: '4' };

/**
 * abc-Notenzeile für Rhythmus-Takte.
 * Balken: Achtel und kürzer werden innerhalb einer Zählzeit verbunden.
 * opts.pitch: abc-Tonhöhe (Standard „B“ = Mittellinie)
 */
export function rhythmAbc(measures, meter, { pitch = 'B', final = true } = {}) {
  const beat = METERS[meter].beatUnits;
  const parts = [];
  measures.forEach((m, mi) => {
    let pos = 0;
    let line = '';
    let prevBeamable = false;
    for (const it of m) {
      if (it.tri) {
        const notes = it.tri.map((x) => (x.rest ? 'z' : pitch) + ABC_TRI[x.u]).join('');
        line += (line ? ' ' : '') + '(3' + notes;
        prevBeamable = false;
        pos += itemUnits(it);
        line += ' ';
        continue;
      }
      const len = ABC_LEN[it.u];
      if (len === undefined) throw new Error('Notenwert nicht darstellbar: ' + it.u);
      const beamable = !it.rest && !it.gap && it.u < 12;
      const startBeat = Math.floor(pos / beat);
      const endBeat = Math.floor((pos + it.u - 1) / beat);
      const sameBeat = startBeat === endBeat && pos % beat !== 0;
      const join = beamable && prevBeamable && sameBeat;
      line += (join || line === "" ? "" : " ") + (it.gap ? "\"^?\"x" : it.rest ? "z" : pitch) + len;
      prevBeamable = beamable && startBeat === endBeat;
      pos += it.u;
      if (pos % beat === 0) prevBeamable = false;
    }
    parts.push(line.replace(/\s+/g, ' ').trim());
    void mi;
  });
  return parts.join(' | ') + (final ? ' |]' : ' |');
}

/** Komplettes abc-Stück für Rhythmen (eine Linie, Schlagzeugschlüssel) */
export function rhythmTune(measures, meter, { oneLine = true, showMeter = true } = {}) {
  const head = `X:1\n%%stretchlast 1\nM:${showMeter ? meter : "none"}\nL:1/16\n`;
  const key = oneLine ? 'K:C clef=perc stafflines=1\n' : 'K:C clef=treble\n';
  return head + key + rhythmAbc(measures, meter);
}

// Kurzschreibweise für Aufgaben: „4 8 8 4 4“ = Viertel Achtel Achtel …
// Zahlen: 1 ganze, 2 halbe, 4 viertel, 8 achtel, 16 sechzehntel; „.“ = punktiert;
// „r“ davor = Pause (r4); „t8“ = Achteltriole (3 Stück), „t4“ = Vierteltriole (3 Stück)
const SHORT = { 1: 48, 2: 24, 4: 12, 8: 6, 16: 3 };
export function parseRhythm(str) {
  return str.trim().split(/\s+/).map((tok) => {
    if (tok === 't8') return { tri: [{ u: 4 }, { u: 4 }, { u: 4 }] };
    if (tok === 't4') return { tri: [{ u: 8 }, { u: 8 }, { u: 8 }] };
    const rest = tok.startsWith('r');
    const t = rest ? tok.slice(1) : tok;
    const dotted = t.endsWith('.');
    const base = SHORT[dotted ? t.slice(0, -1) : t];
    if (!base) throw new Error('Unbekannter Wert: ' + tok);
    const u = dotted ? base * 1.5 : base;
    return rest ? { u, rest: true } : { u };
  });
}
/** Takte aus Kurzschreibweise, getrennt durch „|“ */
export function parseBars(str) {
  return str.split('|').map((s) => parseRhythm(s));
}

/** Name eines Notenwerts aus Einheiten */
export function valueName(u, rest = false) {
  const NOTE = { 48: "ganze Note", 24: "halbe Note", 12: "Viertelnote", 6: "Achtelnote", 3: "Sechzehntelnote", 36: "punktierte halbe Note", 18: "punktierte Viertelnote", 9: "punktierte Achtelnote" };
  const REST = { 48: "ganze Pause", 24: "halbe Pause", 12: "Viertelpause", 6: "Achtelpause", 3: "Sechzehntelpause", 36: "punktierte halbe Pause", 18: "punktierte Viertelpause", 9: "punktierte Achtelpause" };
  return (rest ? REST : NOTE)[u];
}

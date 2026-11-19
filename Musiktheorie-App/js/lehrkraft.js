// lehrkraft.js – Seite für Lehrkräfte: QR-Codes (lokal erzeugt), Stundenvorschlag, Lösungen
import { MODULES } from './modules/index.js';
import { KNOW } from './modules/m2-rhythmus.js';
import { SONGS, MNEMO } from './modules/m5-intervalle.js';
import { diatonic } from './modules/m6-akkorde.js';
import * as T from './core/theory.js';
import { h, icon } from './ui/dom.js';

const app = document.getElementById('app');
const nm = T.germanName;
const cap = T.capitalize;

// ---------- Basis-Adresse ----------
function defaultBase() {
  const u = new URL(location.href);
  u.hash = '';
  u.search = '';
  u.pathname = u.pathname.replace(/lehrkraft\.html$/, '');
  return u.href;
}
let base = defaultBase();
try { base = localStorage.getItem('gt-base-url') || base; } catch (e) { /* egal */ }
const isLocal = (u) => /\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(u) || u.startsWith('file:');
const join = (b, hash = '', q = '') => {
  const clean = b.endsWith('/') || b.endsWith('.html') ? b : b + '/';
  return clean + q + (hash ? '#' + hash : '');
};

function qrSvg(text) {
  const qr = window.qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true, title: text });
}

// ---------- Aufbau ----------
const urlInput = h('input', { class: 'input', id: 'u', type: 'url', value: base, 'aria-label': 'Adresse der veröffentlichten Seite', spellcheck: 'false' });
const localWarn = h('p', { class: 'warn', hidden: true },
  'Achtung: Das ist eine lokale Adresse. Sie funktioniert nur auf diesem Computer. Trage nach dem Veröffentlichen die echte Adresse ein (z. B. https://deinname.github.io/groove-theorie/) – dann stimmen die QR-Codes.');
const qrGrid = h('div', { class: 'qr-grid' });
const freiLink = h('code', {});

function drawQR() {
  base = urlInput.value.trim() || defaultBase();
  try { localStorage.setItem('gt-base-url', base); } catch (e) { /* egal */ }
  localWarn.hidden = !isLocal(base);
  qrGrid.innerHTML = '';
  const entries = [{ title: 'Startseite', sub: 'Groove & Theorie', url: join(base), color: '--c4' },
    ...MODULES.map((m) => ({ title: `Modul ${m.num}`, sub: m.title, url: join(base, m.id), color: m.color }))];
  entries.forEach((e) => {
    const card = h('div', { class: 'qr-card', style: { '--mod': `var(${e.color})` } });
    card.innerHTML = qrSvg(e.url);
    card.append(h('strong', {}, e.title), h('span', {}, e.sub), h('small', {}, e.url));
    qrGrid.append(card);
  });
  freiLink.textContent = join(base, '', '?frei');
}
urlInput.addEventListener('change', drawQR);

const topbar = h('header', { class: 'topbar no-print' },
  h('div', { class: 'brand' }, h('span', {}, 'Groove ', h('em', {}, '&'), ' Theorie · Lehrkraft')),
  h('div', { class: 'topbar__stats' },
    h('button', { class: 'btn btn--sm', type: 'button', onclick: () => window.print() }, 'Drucken')));

app.append(topbar,
  h('h1', {}, 'Bereich für Lehrkräfte'),
  h('p', { class: 'muted' }, 'Diese Seite ist von der App aus nicht verlinkt. Gymnasium im Eilbektal · Fachschaft Musik · Klassen 5 bis 8'),
  nav());

function nav() {
  return h('p', { class: 'btn-row no-print' },
    ...[['qr', 'QR-Codes'], ['plan', 'Stundenvorschlag'], ['tipps', 'Praxis-Tipps'], ['loesungen', 'Lösungen'], ['daten', 'Datenschutz']]
      .map(([id, t]) => h('a', { class: 'btn btn--sm', href: '#' + id }, t)),
    // Lernkontrollen gibt es nur lokal auf dem Rechner der Lehrkraft (nicht online)
    isLocal(location.href) ? h('a', { class: 'btn btn--sm btn--primary', href: 'lernkontrolle.html' }, 'Lernkontrollen (Tests drucken)') : null);
}

// --- QR ---
app.append(h('section', { id: 'qr' },
  h('h2', {}, 'QR-Codes'),
  h('p', {}, 'Die Codes werden direkt hier im Browser erzeugt – ohne externen Dienst. Ausdrucken, an die Tafel hängen oder am Beamer zeigen.'),
  h('div', { class: 'url-row no-print' }, h('label', { class: 'small muted', for: 'u' }, 'Adresse der App:'), urlInput,
    h('button', { class: 'btn btn--sm', type: 'button', onclick: drawQR }, 'QR-Codes erneuern')),
  localWarn,
  qrGrid,
  h('h3', { style: { marginTop: '18px' } }, 'Alle Stufen sofort freischalten'),
  h('p', {}, 'Normalerweise öffnet sich Step erst nach bestandenem Hop und Jump erst nach Step. Mit diesem Link sind auf dem jeweiligen Gerät alle Stufen offen (z. B. für dich am Beamer oder für starke Schülerinnen und Schüler):'),
  h('p', {}, freiLink),
  h('p', { class: 'muted small' }, 'Die Freischaltung gilt nur für das Browserfenster, in dem der Link geöffnet wurde.')));
drawQR();

// --- Stundenvorschlag ---
const planRows = [
  ['1', 'Modul 1 · Notenwerte & Pausen', 'Einstieg: Bodypercussion im 4/4-Takt. „Check das“ am Beamer: Notenbaum anhören. Hop in Einzelarbeit, Takt-Baukasten in Partnerarbeit.', 'Hop'],
  ['2', 'Modul 1 + 2', 'Pausen und Punkte wiederholen (Step). Danach Modul 2: Triolen hören, gemeinsam „1-ta-te“ klatschen. Hop: Rhythmen mittippen.', 'Step / Hop'],
  ['3', 'Modul 2 · Clave, Samba, Reggae', 'Groove-Lab am Beamer: Instrumente einzeln stumm schalten, Gruppen übernehmen die Stimmen live (Surdo, Caixa, Tamborim). Step: Synkopen.', 'Step'],
  ['4', 'Modul 3 · Halbton, Ganzton, Vorzeichen', 'Klaviatur-Labor: Halbtöne suchen (e–f, h–c!). Deutsche Tonnamen inkl. h und b. Hop und Step.', 'Hop / Step'],
  ['5–6', 'Modul 4 · Tonleitern (Schwerpunkt)', 'Dur-Muster G G H G G G H mit Baukasten erarbeiten, Molltonleiter, Generalvorzeichen und Quintenzirkel. Pentatonik & Welt: Gamelan- und Raga-Annäherung hören und einordnen.', 'Hop → Jump'],
  ['7', 'Modul 5 · Intervalle', 'Merkhilfen singen (Alle meine Entchen, O Tannenbaum …). Intervall-Labor. Hörübungen in Paaren mit Kopfhörern.', 'Hop / Step'],
  ['8', 'Modul 6 · Akkorde', 'Dreiklänge schichten, Dur/Moll hören. Stufen I–IV–V–vi in C- und G-Dur.', 'Hop / Step'],
  ['9', 'Modul 6 · Reggae-Groove', 'Reggae-Groove: Keyboard/Gitarre spielen den Skank auf „und“, Bass auf Grundtönen, Rest klatscht auf 3. Jump für Schnelle.', 'Step / Jump'],
  ['10', 'Wiederholung', 'Challenges (10 Aufgaben oder 60 Sekunden) aus allen Modulen. Lernstand-Karten als Screenshot sammeln oder vorzeigen lassen.', 'Challenge'],
];
app.append(h('section', { id: 'plan' },
  h('h2', {}, 'Stundenvorschlag (10 Einzelstunden)'),
  h('p', {}, 'Ein Vorschlag – die Reihenfolge ist flexibel. Rhythmus (Module 1–2) und Tonhöhe (Module 3–6) lassen sich auch parallel unterrichten.'),
  h('table', { class: 'key-table plan' },
    h('tr', {}, h('th', {}, 'Std.'), h('th', {}, 'Thema'), h('th', {}, 'Ablauf'), h('th', {}, 'Stufe')),
    ...planRows.map((r) => h('tr', {}, ...r.map((c) => h('td', {}, c))))),
  h('h3', {}, 'Ablauf einer 45-Minuten-Stunde'),
  h('table', { class: 'key-table' },
    ...[['5 min', 'Einstieg: Groove, Hörbeispiel oder Lied aus der Merkhilfen-Liste'],
      ['10 min', '„Check das“ gemeinsam am Beamer, Hörbeispiele, Fragen'],
      ['20 min', 'Üben in Einzel- oder Partnerarbeit: Hop für alle, danach Step/Jump nach eigenem Tempo'],
      ['5 min', '„Wusstest du?“ oder ein Groove aus dem Groove-Lab zum Mitmachen'],
      ['5 min', 'Abschluss: Lernstand-Karte zeigen lassen, Ausblick']].map((r) => h('tr', {}, h('td', {}, r[0]), h('td', {}, r[1]))))));

// --- Praxis ---
app.append(h('section', { id: 'tipps' },
  h('h2', {}, 'Praxis-Tipps'),
  h('ul', {},
    h('li', {}, 'Kopfhörer für Hör- und Tippaufgaben. Ohne Kopfhörer lieber Hop-Aufgaben ohne Ton oder Partnerarbeit an einem Gerät.'),
    h('li', {}, 'iPhone/iPad: Wenn kein Ton kommt, den Stumm-Schalter prüfen und die Lautstärke hochstellen. Ton startet erst nach dem ersten Antippen.'),
    h('li', {}, 'Tippaufgaben: Eine gleichbleibende Verzögerung (z. B. Bluetooth-Kopfhörer) wird automatisch herausgerechnet. Schwankungen nicht.'),
    h('li', {}, 'Offline: Nach dem ersten Öffnen funktioniert die App auch ohne Netz (Startbildschirm-Symbol: „Zum Home-Bildschirm“).'),
    h('li', {}, 'Lernstand-Karte: Die Schülerinnen und Schüler können einen frei gewählten Vornamen oder Initialen eintragen und einen Screenshot machen. Nichts wird übertragen.'),
    h('li', {}, 'Fortschritt gehört zum Gerät und Browser. Auf geteilten iPads sieht die nächste Person den Fortschritt der vorherigen – für Bewertungen deshalb die Lernstand-Karte nutzen.'))));

// --- Lösungen ---
function table(head, rows) {
  return h('table', { class: 'key-table' }, h('tr', {}, ...head.map((x) => h('th', {}, x))), ...rows.map((r) => h('tr', {}, ...r.map((c) => h('td', {}, c)))));
}
const sigText = (k, m) => { const s = T.keySignature(k, m); return s.length ? s.map(nm).join(', ') : '–'; };
const sol = h('section', { id: 'loesungen' },
  h('h2', {}, 'Lösungen'),
  h('p', {}, 'Die meisten Aufgaben werden zufällig erzeugt und zeigen ihre Lösung mit Begründung direkt in der App. Hier stehen die festen Inhalte, die immer gleich sind.'));
app.append(sol);

sol.append(h('h3', {}, 'Modul 1 · Notenwerte'),
  table(['Wert', 'Dauer (Viertel)', 'Pause gleich lang'], [
    ['ganze Note', '4', 'ganze Pause (hängt)'], ['halbe Note', '2', 'halbe Pause (sitzt)'], ['Viertelnote', '1', 'Viertelpause'], ['Achtelnote', '½', 'Achtelpause'], ['Sechzehntelnote', '¼', 'Sechzehntelpause'],
    ['punktierte Halbe', '3 (Halbe + Viertel)', '–'], ['punktierte Viertel', '1½ (Viertel + Achtel)', '–'], ['punktierte Achtel', '¾ (Achtel + Sechzehntel)', '–']]));

sol.append(h('h3', {}, 'Modul 2 · Wissensfragen'),
  table(['Frage', 'Richtige Antwort'], KNOW.map((k) => [k.q, k.a])),
  h('p', { class: 'muted small' }, 'Raster-Aufgaben (Achtel-Raster, 2 Takte): 3-2-Son-Clave = Felder 1, 4, 7 | 11, 13 (Takt 1: 1, 2+, 4 · Takt 2: 2, 3). Reggae-Skank = alle geraden Felder (jedes „und“).'));

const two = h('div', { class: 'two-col' });
two.append(
  h('div', {}, h('h4', {}, 'Dur-Tonarten'), table(['Tonart', 'Vorzeichen', 'Parallele'], T.DUR_KEYS.map((k) => [`${cap(nm(k))}-Dur`, sigText(k, 'dur'), `${nm(T.relativeMinor(k))}-Moll`]))),
  h('div', {}, h('h4', {}, 'Moll-Tonarten'), table(['Tonart', 'Vorzeichen', 'Parallele'], T.MOLL_KEYS.map((k) => [`${nm(k)}-Moll`, sigText(k, 'moll'), `${cap(nm(T.relativeMajor(k)))}-Dur`]))));
sol.append(h('h3', {}, 'Modul 3 · Enharmonik'),
  table(['Ton', 'gleiche Taste'], [['cis', 'des'], ['dis', 'es'], ['fis', 'ges'], ['gis', 'as'], ['ais', 'b'], ['eis', 'f'], ['his', 'c'], ['fes', 'e'], ['ces', 'h']]),
  h('h3', {}, 'Modul 4 · Tonleitern & Tonarten'),
  h('p', {}, 'Dur: G G H G G G H (Halbtöne 3–4, 7–8) · Moll: G H G G H G G (Halbtöne 2–3, 5–6).'),
  two,
  h('p', {}, 'Reihenfolge der Kreuze: fis – cis – gis – dis – ais – eis – his · der B: b – es – as – des – ges – ces – fes.'),
  h('h4', {}, 'Tonleitern (aufwärts)'),
  table(['Tonart', 'Töne'], [...T.DUR_KEYS.map((k) => [`${cap(nm(k))}-Dur`, T.scale(k, 'dur').map(nm).join(' ')]), ...T.MOLL_KEYS.map((k) => [`${nm(k)}-Moll`, T.scale(k, 'moll').map(nm).join(' ')])]));

const SEM = [['reine Prime', 0], ['kleine Sekunde', 1], ['große Sekunde', 2], ['kleine Terz', 3], ['große Terz', 4], ['reine Quarte', 5], ['Tritonus (überm. Quarte / verm. Quinte)', 6], ['reine Quinte', 7], ['kleine Sexte', 8], ['große Sexte', 9], ['kleine Septime', 10], ['große Septime', 11], ['reine Oktave', 12]];
sol.append(h('h3', {}, 'Modul 5 · Intervalle'),
  table(['Intervall', 'Halbtöne', 'Merkhilfe'], SEM.map(([l, s]) => { const m = MNEMO[l] || MNEMO['übermäßige Quarte']; return [l, String(s), m.song.startsWith('„') ? `${m.song} – ${m.where}` : `${m.song}: ${m.where}`]; })),
  h('h4', {}, 'Liedanfänge (Aufgabe „Mit welchem Intervall beginnt …?“)'),
  table(['Lied', 'Intervall'], SONGS.map(([s, l, n]) => [s, `${l} ${n[1] < n[0] ? 'abwärts' : 'aufwärts'}`])),
  h('p', { class: 'muted small' }, 'Alle Lieder sind gemeinfrei (traditionell oder vor über 70 Jahren entstanden). Es werden nur die ersten zwei Töne gespielt, keine Notenbilder.'));

const DEG = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const DT = ['dur', 'moll', 'moll', 'dur', 'dur', 'moll', 'vermindert'];
const keys6 = [T.pitch(0, 0), T.pitch(4, 0), T.pitch(3, 0), T.pitch(1, 0), T.pitch(6, -1), T.pitch(5, 0), T.pitch(2, -1)];
sol.append(h('h3', {}, 'Modul 6 · Akkorde'),
  table(['Dreiklang', 'Terzen von unten', 'Beispiel auf c'], [
    ['Dur', 'groß + klein', T.triad(T.pitch(0), 'dur').map(nm).join(' – ')],
    ['Moll', 'klein + groß', T.triad(T.pitch(0), 'moll').map(nm).join(' – ')],
    ['vermindert', 'klein + klein', T.triad(T.pitch(0), 'vermindert').map(nm).join(' – ')],
    ['übermäßig', 'groß + groß', T.triad(T.pitch(0), 'uebermaessig').map(nm).join(' – ')]]),
  h('h4', {}, 'Stufenakkorde'),
  table(['Tonart', ...DEG], keys6.map((k) => [`${cap(nm(k))}-Dur`, ...DEG.map((_, d) => T.chordSymbol(diatonic(k, d)[0], DT[d]))])));

// --- Datenschutz ---
app.append(h('section', { id: 'daten' },
  h('h2', {}, 'Datenschutz in Kurzform'),
  h('ul', {},
    h('li', {}, 'Keine Anmeldung, keine Konten, keine Cookies, kein Tracking, keine Analyse-Dienste.'),
    h('li', {}, 'Alle Dateien (Notensatz, Schriften, Klänge, QR-Codes) liegen auf demselben Server wie die App. Es werden keine fremden Server oder CDNs angefragt.'),
    h('li', {}, 'Fortschritt (XP, Abzeichen, Name auf der Lernstand-Karte) wird nur im Browser des Geräts gespeichert (localStorage) und nie übertragen.'),
    h('li', {}, 'Beim Hosting (z. B. GitHub Pages oder Netlify) speichert der Anbieter technisch bedingt Server-Protokolle (z. B. IP-Adressen). Das bitte in der Datenschutzerklärung der Schule erwähnen bzw. mit der Schulleitung abklären.')),
  h('p', { class: 'muted small' }, 'Lizenzen der verwendeten Bausteine: siehe Datei LIZENZEN.md im Projektordner.')));

app.append(h('footer', { class: 'site-foot' }, h('p', { class: 'muted small' }, 'Groove & Theorie · Gymnasium im Eilbektal')));
void icon;

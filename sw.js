// Service Worker: macht die Seite offline nutzbar (PWA).
// Bei jeder Veröffentlichung VERSION erhöhen, damit alle Geräte die neue Fassung laden.
const VERSION = 'gt-2026-11-18d';
const CORE = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'vendor/abcjs-basic-min.js', 'fonts/inter.woff2', 'fonts/space-grotesk.woff2',
  'icons/icon.svg', 'icons/icon-192.png',
  'js/app.js', 'js/core/theory.js', 'js/core/rhythm.js', 'js/core/audio.js', 'js/core/store.js',
  'js/ui/dom.js', 'js/ui/notation.js', 'js/ui/keyboard.js', 'js/ui/blocks.js', 'js/ui/circle.js',
  'js/ui/runner.js', 'js/ui/card.js', 'js/modules/index.js', 'js/modules/common.js',
  'js/modules/m1-notenwerte.js', 'js/modules/m2-rhythmus.js', 'js/modules/m3-vorzeichen.js',
  'js/modules/m4-tonleitern.js', 'js/modules/m5-intervalle.js', 'js/modules/m6-akkorde.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Erst Netz, bei Ausfall Cache – Klaviersamples: erst Cache (ändern sich nie)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/audio/')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    })));
    return;
  }
  e.respondWith(fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});

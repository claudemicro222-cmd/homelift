// Service worker: appens skal och övningsbilder cachas. API-svar sparas som reserv när servern inte går att nå (offlineläge).
const CACHE = 'homelift-v5';
const API_CACHE = 'homelift-api-v1';
const SHELL = ['/', '/index.html', '/app.js', '/i18n.js', '/moves.js', '/style.css', '/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/videos/') || url.pathname.startsWith('/ha/')) return;
  if (url.pathname.startsWith('/api/')) {
    if (/^\/api\/(export|backups|videos|import)/.test(url.pathname) || url.pathname.endsWith('.csv') || url.pathname.endsWith('/embed')) return;
    e.respondWith(apiFetch(e.request));
    return;
  }
  if (url.pathname.startsWith('/img/')) {
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
  // Nätverk först, cache som reserv när servern inte nås
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html'))));
});
// Tryck på notisen (vilan är slut): öppna appen igen
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => list[0] ? list[0].focus() : self.clients.openWindow('/')));
});

// API: nätverket först (med tidsgräns), senast sparade svaret när servern inte svarar
async function apiFetch(req) {
  const cache = await caches.open(API_CACHE);
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(req, { signal: ctl.signal });
    clearTimeout(to);
    if (r.ok) cache.put(req, r.clone());
    return r;
  } catch {
    const hit = await cache.match(req);
    if (!hit) return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json', 'x-homelift-cache': 'miss' } });
    const h = new Headers(hit.headers); h.set('x-homelift-cache', 'hit');
    return new Response(await hit.blob(), { status: hit.status, headers: h });
  }
}

'use strict';
// ---------- Språk och tema ----------
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
let lang = store.get('lang') || ((navigator.language || 'sv').startsWith('sv') ? 'sv' : 'en');
let L = I18N[lang];
function t(key, vars = {}) {
  const v = key.split('.').reduce((o, k) => o?.[k], L) ?? key.split('.').reduce((o, k) => o?.[k], I18N.sv) ?? key;
  return typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v;
}
async function setLang(l) { lang = l; L = I18N[l]; store.set('lang', l); document.documentElement.lang = l; await loadNames(); drawChrome(); }
// Svenska övningsnamn hämtas en gång från servern
let SVN = {};
async function loadNames() {
  if (lang !== 'sv') { SVN = {}; return; }
  try { SVN = await fetch('/api/exercise-names?lang=sv').then(r => r.json()); } catch { SVN = {}; }
}
const exName = ex => (ex && (SVN[ex.id] || ex.name)) || '';
function setTheme(th) {
  store.set('theme', th);
  if (th === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = th;
  const dark = th === 'dark' || (th === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').content = dark ? '#0b1120' : '#2563eb';
}
setTheme(store.get('theme') || 'auto');
document.documentElement.lang = lang;

// ---------- Ikoner (linjeikoner i samma stil som loggan) ----------
const ICONS = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/><path d="M3.5 12h4l2-3 3 6 2-3h6"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>',
  circle: '<circle cx="12" cy="12" r="6"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  flame: '<path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4S9 12 11 12c0-3 1-6 1-9z"/>',
  stretch: '<circle cx="12" cy="4.5" r="2"/><path d="M4 9.5 12 8l8 1.5M12 8v6l-4 7M12 14l4 7"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  ha: '<path d="M3 11 12 3l9 8"/><path d="M5 9.5V21h14V9.5"/><circle cx="12" cy="11" r="1.5"/><circle cx="9" cy="15.5" r="1.2"/><circle cx="15" cy="15.5" r="1.2"/><path d="M12 12.5V21M9.8 16.3 12 18M14.2 16.3 12 18"/>',
  arrow: '<path d="M15 18l-6-6 6-6"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  plates: '<rect x="3" y="7" width="3" height="10" rx="1"/><rect x="7" y="5" width="3" height="14" rx="1"/><rect x="14" y="5" width="3" height="14" rx="1"/><rect x="18" y="7" width="3" height="10" rx="1"/><path d="M10 12h4M1 12h2M21 12h2"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8M8 21v-7h8v7"/>',
  voice: '<path d="M4 9h3l5-4v14l-5-4H4z"/><path d="M16 8.5c1.2 1 1.2 6 0 7M19 6c2.5 2.5 2.5 9.5 0 12"/><circle cx="20.5" cy="3.5" r="1.5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  body: '<circle cx="12" cy="4" r="2"/><path d="M8 8h8l-1 7h-6zM9 15l-1 7M15 15l1 7M8 8l-3 6M16 8l3 6"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
  report: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  cloudOff: '<path d="M3 3l18 18"/><path d="M7 18H6a4 4 0 0 1-.6-8M10 6.3A6 6 0 0 1 18 10a3.5 3.5 0 0 1 2.4 6.2"/>',
};
const icon = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

// ---------- Hjälpare ----------
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const muscle = m => t('muscles')[m] || m;
const equip = e => t('equipDb')[e] || e;
const thumb = ex => ex?.images?.length ? `<img class="thumb" src="${img(ex)}" alt="" loading="lazy">` : `<span class="thumb icon-thumb">${icon('dumbbell')}</span>`;
const img = (ex, n = 0) => ex?.images?.[n] ? `/img/${encodeURI(ex.images[n])}` : '';
const fmt = (n, d = 1) => Number(n || 0).toLocaleString(L.locale, { maximumFractionDigits: d });
const parseDate = d => new Date(d.replace(' ', 'T') + (d.length > 10 ? 'Z' : 'T12:00:00'));
const dateFmt = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => parseDate(d).toLocaleDateString(L.locale, opts);
const ytEmbed = vid => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?rel=0&modestbranding=1&playsinline=1`;
const videoSearchUrl = name => `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' exercise proper form')}`;
const cardioName = id => t('cardioTypes')[id] || id;
// Passnamn sparas på svenska av schemageneratorn, översätt vid visning
function tplName(name) {
  let n = String(name || '');
  for (const [sv, en] of Object.entries(L.tpl || {})) n = n.replace(sv, en);
  return n;
}
const sessionName = s => s.kind === 'cardio' ? cardioName(s.cardio_type || s.name) : tplName(s.name);
const weekdayIdx = (d = new Date()) => (d.getDay() + 6) % 7;
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtBytes = b => b > 1e9 ? `${fmt(b / 1e9)} GB` : `${fmt(b / 1e6, 0)} MB`;

// ---------- Offline: ändringar köas och skickas när servern går att nå igen ----------
const OUTBOX = 'outbox';
const outbox = () => store.get(OUTBOX) || [];
const tmpMap = () => store.get('tmpIds') || {};
const QUEUEABLE = [/^\/sessions\/[\w-]+\/(sets|rpe|finish|swap)$/, /^\/sessions\/[\w-]+$/, /^\/users\/\d+\/(sessions|bodyweight|measurements)$/];
const resolveTmp = path => path.replace(/off-\d+/g, m => tmpMap()[m] || m);
let offline = false;
function setOffline(on) {
  offline = on;
  const bar = $('#netbar'); if (!bar) return;
  const n = outbox().length;
  bar.hidden = !on && !n;
  bar.innerHTML = on ? `${icon('cloudOff', 'sm')} ${t('offlineBar')}${n ? ' · ' + t('offlinePending', { n }) : ''}` : `${icon('swap', 'sm')} ${t('syncing', { n })}`;
  bar.classList.toggle('warn', on);
}
function queueWrite(method, path, body) {
  const box = outbox();
  const entry = { method, path, body, at: new Date().toISOString().replace('T', ' ').slice(0, 19) };
  // Nytt pass utan server: ge det ett tillfälligt id som byts mot det riktiga vid synk
  if (method === 'POST' && /\/sessions$/.test(path)) entry.tmp = 'off-' + Date.now();
  box.push(entry); store.set(OUTBOX, box); setOffline(true);
  if (entry.tmp) return { id: entry.tmp, offline: true };
  return { ok: true, queued: true, pr: [] };
}
let flushing = null;
async function flushOutbox() {
  if (flushing) return flushing;
  flushing = (async () => {
    let box = outbox();
    while (box.length) {
      const e = box[0];
      let res;
      try {
        res = await fetch('/api' + resolveTmp(e.path), { method: e.method, headers: e.body ? { 'Content-Type': 'application/json' } : {}, body: e.body ? JSON.stringify(e.body) : undefined });
      } catch { setOffline(true); return false; }
      const data = await res.json().catch(() => ({}));
      if (res.ok && e.tmp && data.id) {
        const m = tmpMap(); m[e.tmp] = data.id; store.set('tmpIds', m);
        if (location.hash === `#/pass/${e.tmp}`) location.replace(`#/pass/${data.id}`);
      }
      box = outbox().slice(1); store.set(OUTBOX, box);
      setOffline(false);
    }
    setOffline(false);
    return true;
  })().finally(() => { flushing = null; });
  return flushing;
}
window.addEventListener('online', () => flushOutbox());
setInterval(() => { if (outbox().length) flushOutbox(); }, 30000);

async function api(path, opts = {}) {
  const method = opts.method || 'GET';
  const canQueue = method !== 'GET' && QUEUEABLE.some(re => re.test(path));
  // Ligger det redan ändringar i kön skickas de först, så att ordningen behålls
  if (canQueue && outbox().length && !(await flushOutbox())) return queueWrite(method, path, opts.body);
  let res;
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
  try {
    res = await fetch('/api' + resolveTmp(path), {
      method,
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctl.signal,
    });
  } catch {
    if (canQueue) return queueWrite(method, path, opts.body);
    setOffline(true);
    throw new Error(t('offlineError'));
  } finally { clearTimeout(to); }
  if (res.headers.get('x-homelift-cache') === 'miss') { setOffline(true); throw new Error(t('offlineError')); }
  if (offline && res.headers.get('x-homelift-cache') !== 'hit') setOffline(false);
  if (res.headers.get('x-homelift-cache') === 'hit') setOffline(true);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || t('error'));
  return data;
}
// Visa köade set i ett pass som laddats från cachen
function mergeOutbox(s) {
  for (const e of outbox()) {
    const m = resolveTmp(e.path).match(/^\/sessions\/([\w-]+)\/(sets|rpe|finish|swap)$/);
    if (!m || String(m[1]) !== String(s.id)) continue;
    const it = s.items?.find(i => i.exerciseId === e.body?.exerciseId);
    if (m[2] === 'finish') { s.finished_at = e.at; continue; }
    if (!it) continue;
    const i = it.logs.findIndex(l => l.set_no === e.body.setNo);
    if (m[2] === 'sets' && e.method === 'PUT') { const log = { set_no: e.body.setNo, weight: e.body.weight, reps: e.body.reps, seconds: e.body.seconds, rpe: e.body.rpe }; if (i >= 0) it.logs[i] = log; else it.logs.push(log); }
    if (m[2] === 'sets' && e.method === 'DELETE' && i >= 0) it.logs.splice(i, 1);
    if (m[2] === 'rpe' && i >= 0) it.logs[i].rpe = e.body.rpe;
  }
  return s;
}
// Pass som startats utan kontakt med servern byggs av det sparade schemat
function offlineSession(id) {
  const e = outbox().find(x => x.tmp === id);
  if (!e) throw new Error(t('offlineError'));
  const b = e.body;
  if (b.kind === 'cardio') return { id, kind: 'cardio', cardio_type: b.cardioType, duration_min: b.minutes, started_at: e.at, items: [] };
  const p = (store.get('progCache') || []).find(x => x.id === b.programId);
  const tp = p?.plan.templates[b.templateIndex];
  if (!tp) throw new Error(t('offlineError'));
  return mergeOutbox({ id, kind: 'strength', name: tp.name, started_at: e.at, quick: 0, offline: true, groups: [...new Set(tp.items.map(i => i.group).filter(Boolean))], items: tp.items.map((i, index) => ({ ...i, index, logs: [], suggestion: null })) });
}
function toast(msg) {
  document.querySelectorAll('.toast').forEach(x => x.remove());
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg; document.body.append(el);
  setTimeout(() => el.remove(), 2400);
}
function modal(html) {
  const d = $('#modal');
  $('#modalBody').innerHTML = html;
  if (!d.open) d.showModal();
  return d;
}
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').close(); });
$('#modal').addEventListener('close', () => { runner?.stop(true); });

// Ljud och vibration för timers
let audioCtx;
const soundOn = () => store.get('sound') !== false;
function beep(freq = 880, ms = 160) {
  if (!soundOn()) return;
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + ms / 1000);
    o.start(); o.stop(audioCtx.currentTime + ms / 1000);
  } catch {}
}
// Notis när vilan är slut och appen ligger i bakgrunden (kräver https eller localhost)
async function notify(title, body) {
  if (!store.get('notify') || !('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const opts = { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'homelift-rest', renotify: true, vibrate: [200, 100, 200], silent: !soundOn() };
    if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
  } catch {}
}
// Röstcoach: läser upp nästa övning och räknar ner vilan (talsyntes i webbläsaren)
const voiceOn = () => store.get('voice') === true;
function say(text) {
  if (!voiceOn() || !text || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'sv' ? 'sv-SE' : 'en-US';
    const v = speechSynthesis.getVoices().find(x => x.lang?.replace('_', '-').startsWith(lang === 'sv' ? 'sv' : 'en'));
    if (v) u.voice = v;
    u.rate = 1.02;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch {}
}
const kgWords = w => lang === 'sv' ? `${String(w).replace('.', ',')} kilo` : `${w} kilos`;
function nextUpText(n) {
  if (!n) return t('voiceLastSet');
  const what = n.timed ? t('voiceSec', { n: n.reps }) : `${n.weight ? kgWords(n.weight) + ', ' : ''}${t('voiceReps', { n: n.reps })}`;
  return t('voiceNext', { name: n.name, set: n.set, sets: n.sets, what });
}
let wakeLock = null;
async function keepAwake(on) {
  try { if (on && !wakeLock) wakeLock = await navigator.wakeLock?.request('screen'); else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; } } catch {}
}

let user = store.get('user');

// ---------- Ram: toppfält och flikar ----------
function drawChrome() {
  $('#tabbar').innerHTML = [['home', '#/', 'home'], ['schema', '#/schema', 'calendar'], ['stats', '#/statistik', 'chart'], ['library', '#/ovningar', 'book']]
    .map(([tab, href, ic]) => `<a href="${href}" data-tab="${tab}">${icon(ic)}<span>${t('tabs.' + tab)}</span></a>`).join('');
  $('#settingsBtn').setAttribute('aria-label', t('settings'));
  $('#settingsBtn').innerHTML = icon('settings');
}
function setTab(tab) {
  $('#tabbar').hidden = !user;
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  const ub = $('#userBtn');
  ub.hidden = !user;
  $('#settingsBtn').hidden = !user;
  if (user) ub.innerHTML = `<span class="avatar">${esc(user.name.slice(0, 1).toUpperCase())}</span>${esc(user.name)}`;
}

// ---------- Router ----------
const views = {};
async function render() {
  const [, route, ...args] = (location.hash || '#/').slice(1).split('/');
  if (!user && route !== 'profil') { location.hash = '#/profil'; return; }
  if (route !== 'pass') stopTimer();
  if (route !== 'pass') document.querySelectorAll('.pr-pop').forEach(x => x.remove());
  const view = views[route || 'home'] || views.home;
  try { await view(...args.map(decodeURIComponent)); }
  catch (e) { console.error(e); app.innerHTML = `<div class="card"><h3>${t('oops')}</h3><p>${esc(e.message)}</p><a class="btn" href="#/">${t('toStart')}</a></div>`; }
  if (!render.keepScroll) window.scrollTo(0, 0);
  render.keepScroll = false;
}
window.addEventListener('hashchange', render);
$('#userBtn').onclick = () => { location.hash = '#/profil'; };
async function refreshUser() { if (user) { user = await api(`/users/${user.id}`); store.set('user', user); } return user; }

// ---------- Profil ----------
views.profil = async () => {
  setTab(null);
  const users = await api('/users');
  app.innerHTML = `
    ${users.length ? `<h1>${t('whoTrains')}</h1>` : `<div class="empty"><img src="/icon.svg" alt=""><h1>HomeLift</h1></div>`}
    ${users.map(u => `<button class="card link btn-user row" data-id="${u.id}" style="width:100%;text-align:left;font:inherit;cursor:pointer"><span class="icon-btn" style="border:0;padding:0"><span class="avatar" style="width:36px;height:36px;font-size:1rem">${esc(u.name.slice(0, 1).toUpperCase())}</span></span><b class="grow">${esc(u.name)}</b></button>`).join('')}
    <form id="newUser" class="card stack">
      <h3>${users.length ? t('addPerson') : t('welcome')}</h3>
      <input type="text" name="name" placeholder="${t('name')}" required maxlength="50" autocomplete="given-name">
      <button class="btn block">${t('createProfile')}</button>
    </form>`;
  app.querySelectorAll('.btn-user').forEach(b => b.onclick = () => {
    user = users.find(u => u.id == b.dataset.id); store.set('user', user); location.hash = '#/';
  });
  $('#newUser').onsubmit = async e => {
    e.preventDefault();
    user = await api('/users', { method: 'POST', body: { name: e.target.name.value } });
    store.set('user', user); location.hash = '#/ny';
  };
};

// ---------- Hem ----------
async function activeProgram() {
  const programs = await api(`/users/${user.id}/programs`);
  store.set('progCache', programs);
  return { programs, active: programs.find(p => p.active) };
}
async function startStrength(programId, templateIndex, ongoing, quick) {
  if (ongoing && !confirm(t('ongoingConfirm'))) return;
  const s = await api(`/users/${user.id}/sessions`, { method: 'POST', body: { programId, templateIndex, quick: !!quick } });
  location.hash = `#/pass/${s.id}`;
}
async function startCardio(type, minutes, programId, ongoing) {
  if (ongoing && !confirm(t('ongoingConfirm'))) return;
  const s = await api(`/users/${user.id}/sessions`, { method: 'POST', body: { kind: 'cardio', cardioType: type, minutes, programId } });
  location.hash = `#/pass/${s.id}`;
}
function cardioPicker(onPick, preset = {}) {
  const types = Object.keys(t('cardioTypes'));
  const d = modal(`<h3>${t('whichCardio')}</h3>
    <div class="choices" style="margin-top:12px">${types.map(id => `<div class="choice"><input type="radio" name="ct" id="ct-${id}" value="${id}" ${id === (preset.type || types[0]) ? 'checked' : ''}><label for="ct-${id}"><b>${esc(cardioName(id))}</b></label></div>`).join('')}</div>
    ${preset.withDay ? `<label class="field" style="margin-top:14px">${t('day')}</label><div class="choices days">${L.days.map((dn, i) => `<div class="choice"><input type="radio" name="cd" id="cd-${i}" value="${i}" ${i === (preset.day ?? 5) ? 'checked' : ''}><label for="cd-${i}">${dn}</label></div>`).join('')}</div>` : ''}
    <label class="field" style="margin-top:14px">${t('duration')} (${t('min')})</label>
    <input type="number" id="cmin" min="5" max="240" step="5" value="${preset.minutes || 30}" inputmode="numeric">
    <div class="wizard-nav"><button class="btn ghost" data-close>${t('cancel')}</button><button class="btn" id="cok">${preset.okLabel || t('start')}</button></div>`);
  $('#cok', d).onclick = () => {
    const type = $('input[name=ct]:checked', d).value;
    const day = Number($('input[name=cd]:checked', d)?.value ?? 0);
    d.close(); onPick({ type, day, minutes: Number($('#cmin', d).value) || 30 });
  };
}

views.home = async () => {
  setTab('home');
  const [{ active }, sessions, sum, mus] = await Promise.all([activeProgram(), api(`/users/${user.id}/sessions`), api(`/users/${user.id}/summary`), api(`/users/${user.id}/muscles`).catch(() => null)]);
  const ongoing = sessions.find(s => !s.finished_at);
  if (!active) {
    app.innerHTML = `<div class="card empty"><img src="/icon.svg" alt=""><h1>${t('hi', { name: esc(user.name) })}</h1><p class="muted">${t('noProgram')}</p><a class="btn" href="#/ny">${t('createProgram')}</a></div>`;
    return;
  }
  const tpls = active.plan.templates;
  const next = sum.next_workout;
  const today = sum.today;
  const nextDate = sum.next_training_date ? dateFmt(sum.next_training_date, { weekday: 'long', day: 'numeric', month: 'long' }) : '–';
  const goal = sum.weekly_goal || sum.planned_per_week;
  const pct = goal ? Math.min(100, Math.round(100 * sum.sessions_this_week / goal)) : 0;
  const days = sum.training_days || [];
  const sDays = active.settings.days || [];
  let hero;
  if (today && !today.done) {
    hero = today.kind === 'cardio'
      ? `<div class="card hero"><div class="eyebrow">${t('today')} · ${t('cardio')}</div><h1 style="margin:.3rem 0">${esc(cardioName(today.cardio_type))}</h1><p class="muted">${t('approxMin', { n: today.minutes })}</p><button class="btn block" id="heroStart" style="margin-top:10px">${icon('play', 'sm')}${t('startCardio')}</button></div>`
      : `<div class="card hero"><div class="eyebrow">${t('today')} · ${t('strength')}</div><h1 style="margin:.3rem 0">${esc(tplName(today.name))}</h1><p class="muted">${t('exercisesCount', { n: today.exercises })} · ${t('approxMin', { n: today.minutes })}</p><button class="btn block" id="heroStart" style="margin-top:10px">${icon('play', 'sm')}${t('startWorkout')}</button>
        <button class="btn ghost block" id="heroQuick" style="margin-top:8px">${icon('bolt', 'sm')}${t('quickWorkout')}</button></div>`;
  } else {
    hero = `<div class="card"><div class="row"><span class="pill ${today?.done ? 'ok' : 'neutral'}">${today?.done ? icon('check', 'sm') + t('doneToday') : t('restDay')}</span></div>
      <p class="muted small" style="margin-top:8px">${t('restDayText', { date: nextDate })}</p>
      <hr class="divider"><div class="eyebrow">${t('nextWorkout')}</div>
      <div class="row between" style="margin-top:4px"><div><h3>${esc(tplName(next.name))}</h3><div class="muted small">${t('exercisesCount', { n: next.exercises })} · ${t('approxMin', { n: next.minutes })}</div></div>
      <button class="btn secondary sm" id="heroStart">${t('start')}</button></div>
      <button class="btn ghost block" id="heroQuick" style="margin-top:10px">${icon('bolt', 'sm')}${t('quickWorkout')}</button></div>`;
  }
  app.innerHTML = `
    <h1>${t('hi', { name: esc(user.name) })}</h1>
    ${ongoing ? `<a class="card link" href="#/pass/${ongoing.id}" style="border-color:var(--warn)"><span class="pill warn">${t('ongoing')}</span><h3 style="margin-top:8px">${esc(sessionName(ongoing))}</h3><p class="muted small">${t('startedAt', { date: dateFmt(ongoing.started_at).replace(/\.$/, '') })}</p></a>` : ''}
    ${adviceCard(mus)}
    ${hero}
    <div class="card">
      <div class="row between"><span class="eyebrow">${t('thisWeek')}</span><span class="small ${sum.weekly_goal_reached ? '' : 'muted'}" style="${sum.weekly_goal_reached ? 'color:var(--ok);font-weight:700' : ''}">${sum.weekly_goal_reached ? icon('check', 'sm') + ' ' : ''}${t('weekGoalProgress', { done: sum.sessions_this_week, goal })}</span></div>
      <div class="progress ${sum.weekly_goal_reached ? 'ok' : ''}" style="margin:10px 0"><i style="width:${pct}%"></i></div>
      <div class="choices days">${L.days.map((dn, i) => `<div class="pill ${days.includes(i) ? '' : 'neutral'}" style="justify-content:center;padding:6px 0;${i === weekdayIdx() ? 'outline:2px solid var(--brand);outline-offset:1px' : ''}" title="${days.includes(i) ? (sDays.includes(i) ? t('strength') : t('cardio')) : ''}">${dn}</div>`).join('')}</div>
      <div class="row" style="margin-top:12px;gap:16px">
        <span class="small">${icon('flame', 'sm')} ${sum.week_streak} ${t('weekStreak').toLowerCase()}</span>
        <span class="small" title="${t('goalStreakHint')}">${icon('target', 'sm')} ${t('goalStreakShort', { n: sum.goal_streak })}</span>
        ${user.bmi ? `<span class="small">${t('bmi')} ${fmt(user.bmi)}</span>` : ''}
      </div>
    </div>
    <div class="row" style="gap:8px"><button class="btn ghost grow" id="logCardio">${icon('heart', 'sm')}${t('logCardio')}</button></div>
    <h2>${t('allWorkouts', { name: esc(tplName(active.name)) })}</h2>
    ${tpls.map((tp, i) => `
      <div class="card"><div class="row between"><div class="grow"><h3>${esc(tplName(tp.name))}</h3>
      <p class="muted small" style="margin:0">${tp.items.map(it => esc(exName(it.exercise))).slice(0, 3).join(', ')}${tp.items.length > 3 ? '…' : ''}</p></div>
      <button class="btn secondary sm" data-start="${i}">${t('start')}</button></div></div>`).join('')}
    <h2>${t('recent')}</h2>
    ${sessions.filter(s => s.finished_at).slice(0, 5).map(s => `<a class="card link row between" href="#/pass/${s.id}"><div class="row"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon(s.kind === 'cardio' ? 'heart' : 'dumbbell')}</span><div><b>${esc(sessionName(s))}</b><div class="muted small">${dateFmt(s.started_at)} · ${s.kind === 'cardio' ? `${fmt(s.duration_min, 0)} ${t('min')}${s.distance_km ? ` · ${fmt(s.distance_km)} ${t('km')}` : ''}` : t('setsAndVolume', { sets: s.set_count, volume: fmt(s.volume, 0) })}</div></div></div>${icon('arrow', 'sm chev')}</a>`).join('') || `<p class="muted">${t('noneLogged')}</p>`}`;
  $('#heroStart').onclick = () => {
    const w = today && !today.done ? today : next;
    if (w.kind === 'cardio') startCardio(w.cardio_type, w.minutes, active.id, ongoing);
    else startStrength(active.id, w.template_index, ongoing);
  };
  $('#heroQuick').onclick = () => startStrength(active.id, (today && !today.done && today.kind === 'strength' ? today : next).template_index, ongoing, true);
  $('#logCardio').onclick = () => cardioPicker(c => startCardio(c.type, c.minutes, active.id, ongoing));
  app.querySelectorAll('[data-start]').forEach(b => b.onclick = () => startStrength(active.id, Number(b.dataset.start), ongoing));
};

// Råd om vila utifrån vilka muskler som hunnit återhämta sig
function adviceCard(mus) {
  const a = mus?.advice;
  if (!a || a.type === 'ok') return '';
  const names = (a.muscles || []).slice(0, 4).map(muscle).join(', ').toLowerCase();
  const txt = a.type === 'rest' ? t('adviceRest', { n: a.days }) : a.type === 'cardio' ? t('adviceCardio', { m: names }) : t('advicePartial', { m: names });
  return `<div class="card advice ${a.type === 'partial' ? '' : 'warn'}"><div class="row" style="align-items:flex-start">${icon(a.type === 'partial' ? 'info' : 'bed')}<div class="grow"><b>${t(a.type === 'partial' ? 'adviceTitlePartial' : 'adviceTitle')}</b><p class="small" style="margin:4px 0 0">${esc(txt)}</p></div></div>
    <a class="small" href="#/statistik/muskler">${t('seeRecovery')}</a></div>`;
}

// ---------- Guide för nytt schema ----------
const GROUP_KEYS = ['brost', 'rygg', 'axlar', 'biceps', 'triceps', 'ben', 'mage'];
views.ny = async () => {
  setTab('schema');
  const s = { step: 0, equipment: ['kroppsvikt', 'hantlar'], groups: [...GROUP_KEYS], level: 'nyborjare', days: [0, 2, 4], minutes: 45, cardioTypes: [], cardioDays: [], cardioMinutes: 30, ...(store.get('wizard') || {}) };
  if (!s.days) s.days = [0, 2, 4];
  const choices = (name, list, selected, type, cls = '') =>
    `<div class="choices ${cls}">${list.map(([v, l, sub]) => `<div class="choice"><input type="${type}" id="${name}-${v}" name="${name}" value="${v}" ${selected.map(String).includes(String(v)) ? 'checked' : ''} ${v === 'kroppsvikt' ? 'disabled' : ''}><label for="${name}-${v}">${cls ? esc(l) : `<b>${esc(l)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`}</label></div>`).join('')}</div>`;
  const dayList = name => L.days.map((d, i) => [i, d]);
  const steps = [
    { title: t('wizEquipment'), hint: t('wizEquipmentHint'), html: () => choices('equipment', Object.entries(t('equipment')).map(([k, [l, sub]]) => [k, l, sub]), s.equipment, 'checkbox') },
    { title: t('wizGroups'), hint: t('wizGroupsHint'), html: () => choices('groups', GROUP_KEYS.map(g => [g, t('groups')[g], '']), s.groups, 'checkbox') },
    { title: t('wizLevel'), hint: t('wizLevelHint'), html: () => choices('level', Object.entries(t('levels')).map(([k, [l, sub]]) => [k, l, sub]), [s.level], 'radio') },
    {
      title: t('wizDays'), hint: t('wizDaysHint'),
      html: () => `${choices('days', dayList(), s.days, 'checkbox', 'days')}<p class="muted small" id="splitHint" style="margin-top:8px"></p>
        <h3 style="margin-top:16px">${t('perSession')}</h3>${choices('minutes', [30, 45, 60, 75, 90].map(n => [n, `${n} ${t('min')}`, '']), [s.minutes], 'radio')}`,
    },
    {
      title: t('wizCardio'), hint: t('wizCardioHint'),
      html: () => `<h3>${t('cardioTypesLabel')}</h3>${choices('cardioTypes', Object.entries(t('cardioTypes')).map(([k, l]) => [k, l, '']), s.cardioTypes, 'checkbox')}
        <h3 style="margin-top:16px">${t('cardioDaysLabel')}</h3>${choices('cardioDays', dayList(), s.cardioDays, 'checkbox', 'days')}
        <h3 style="margin-top:16px">${t('cardioMinutes')}</h3>${choices('cardioMinutes', [20, 30, 45, 60, 90].map(n => [n, `${n} ${t('min')}`, '']), [s.cardioMinutes], 'radio')}`,
    },
  ];
  function read() {
    const f = $('#wiz');
    const vals = n => [...f.querySelectorAll(`input[name=${n}]:checked`)].map(i => i.value);
    if (s.step === 0) s.equipment = ['kroppsvikt', ...vals('equipment').filter(v => v !== 'kroppsvikt')];
    if (s.step === 1) s.groups = vals('groups');
    if (s.step === 2) s.level = vals('level')[0] || s.level;
    if (s.step === 3) { s.days = vals('days').map(Number); s.minutes = Number(vals('minutes')[0]); }
    if (s.step === 4) { s.cardioTypes = vals('cardioTypes'); s.cardioDays = vals('cardioDays').map(Number); s.cardioMinutes = Number(vals('cardioMinutes')[0]) || 30; }
    store.set('wizard', s);
  }
  function draw() {
    const st = steps[s.step];
    app.innerHTML = `
      <div class="steps">${steps.map((_, i) => `<i class="${i <= s.step ? 'on' : ''}"></i>`).join('')}</div>
      <h1>${st.title}</h1><p class="muted">${st.hint}</p>
      <form id="wiz" style="margin-top:14px">${st.html()}
        <div class="wizard-nav">
          ${s.step > 0 ? `<button type="button" class="btn ghost" id="back">${t('back')}</button>` : ''}
          <button class="btn">${s.step < steps.length - 1 ? t('next') : t('createProgram')}</button>
        </div>
      </form>`;
    const hint = () => { const n = $('#wiz').querySelectorAll('input[name=days]:checked').length; const el = $('#splitHint'); if (el) el.textContent = n ? `${n} × · ${t('splitHint')[Math.min(6, n)] || ''}` : ''; };
    if (s.step === 3) { hint(); $('#wiz').addEventListener('change', hint); }
    $('#back')?.addEventListener('click', () => { read(); s.step--; draw(); });
    $('#wiz').onsubmit = async e => {
      e.preventDefault(); read();
      if (s.step === 1 && !s.groups.length) return toast(t('pickGroup'));
      if (s.step === 3 && !s.days.length) return toast(t('pickDay'));
      if (s.step === 3 && s.days.length > 6) return toast(t('maxDays'));
      if (s.step === 4 && s.cardioDays.length && !s.cardioTypes.length) return toast(t('pickCardioType'));
      if (s.step < steps.length - 1) { s.step++; return draw(); }
      store.set('wizard', { ...s, step: 0 });
      location.hash = '#/forhandsvisning';
    };
  }
  draw();
};

views.forhandsvisning = async () => {
  setTab('schema');
  const w = store.get('wizard') || {};
  const settings = { ...w, daysPerWeek: (w.days || []).length || 3, seed: store.get('seed') || 1 };
  delete settings.step;
  const plan = await api('/generate', { method: 'POST', body: settings });
  const levelLabel = t('levels')[settings.level]?.[0];
  const dayName = i => L.days[i];
  app.innerHTML = `
    <h1>${t('newProgram')}</h1>
    <div class="card">
      <p style="margin-top:0">${t('programSummary', { split: esc(tplName(plan.splitName)), days: plan.days.length, min: settings.minutes, level: esc(levelLabel) })}</p>
      <p class="muted small">${t('theWeek')}: ${plan.days.map((d, i) => `${dayName(d)} ${esc(tplName(plan.templates[plan.week[i]].name))}`).concat(plan.cardio.map(c => `${dayName(c.day)} ${esc(cardioName(c.type))}`)).join(' · ')}</p>
      <label class="field" for="pname" style="margin-top:12px">${t('programName')}</label>
      <input type="text" id="pname" value="${esc(tplName(plan.splitName))} ${new Date().toLocaleDateString(L.locale, { month: 'short', year: 'numeric' })}">
    </div>
    ${plan.templates.map(tp => templateCard(tp)).join('')}
    ${plan.cardio.length ? `<div class="card"><h3>${t('cardioSessions')}</h3>${plan.cardio.map(c => cardioRow(c)).join('')}</div>` : ''}
    <div class="wizard-nav">
      <button class="btn ghost" id="regen">${icon('swap', 'sm')}${t('newExercises')}</button>
      <button class="btn" id="save">${t('saveAndUse')}</button>
    </div>
    <p class="center"><a href="#/ny">${t('changeAnswers')}</a></p>`;
  $('#regen').onclick = () => { store.set('seed', Math.floor(Math.random() * 1e9)); render(); };
  $('#save').onclick = async () => {
    await api(`/users/${user.id}/programs`, { method: 'POST', body: { name: $('#pname').value, settings: { ...settings, days: plan.days }, plan } });
    toast(t('programSaved')); location.hash = '#/';
  };
};

const itemScheme = it => it.timed
  ? t('setsTimed', { sets: it.sets, min: it.secMin, max: it.secMax, rest: it.rest })
  : t('setsReps', { sets: it.sets, min: it.repsMin, max: it.repsMax, rest: it.rest });
function templateCard(tp, ti, editable) {
  return `<div class="card"><h3>${esc(tplName(tp.name))}</h3>
    ${tp.items.map((it, i) => `
      <div class="ex-row">
        ${thumb(it.exercise)}
        <a class="grow" href="#/ovning/${encodeURIComponent(it.exerciseId)}" style="color:inherit;text-decoration:none">
          <b>${esc(exName(it.exercise))}</b>
          <div class="muted small">${itemScheme(it)} · ${esc(t('groups')[it.group] || '')}</div>
          ${it.linkNext ? `<div class="small" style="color:var(--brand)">${icon('link', 'sm')} ${t('supersetWithNext')}</div>` : ''}
        </a>
        ${editable ? `<button class="btn ghost sm ic" data-edit="${ti}:${i}" aria-label="${t('editExercise')}" title="${t('editExercise')}">${icon('sliders', 'sm')}</button>
          <button class="btn ghost sm ic" data-timed="${ti}:${i}:${it.timed ? 0 : 1}" aria-label="${it.timed ? t('measureReps') : t('measureTime')}" title="${it.timed ? t('measureReps') : t('measureTime')}" style="${it.timed ? 'color:var(--brand);border-color:var(--brand)' : ''}">${icon('clock', 'sm')}</button>
          <button class="btn ghost sm ic" data-swap="${ti}:${i}" aria-label="${t('swap')}" title="${t('swap')}">${icon('swap', 'sm')}</button>` : ''}
      </div>`).join('')}
  </div>`;
}
function cardioRow(c, idx) {
  return `<div class="ex-row"><span class="thumb icon-thumb">${icon('heart')}</span><div class="grow"><b>${esc(cardioName(c.type))}</b><div class="muted small">${L.daysLong[c.day]} · ${c.minutes} ${t('min')}</div></div>
    ${idx !== undefined ? `<button class="btn ghost sm" data-cstart="${idx}">${t('start')}</button><button class="btn danger sm" data-cdel="${idx}" aria-label="${t('remove')}">${icon('trash', 'sm')}</button>` : ''}</div>`;
}

// ---------- Schema ----------
views.schema = async () => {
  setTab('schema');
  const { programs, active } = await activeProgram();
  if (!active) { location.hash = '#/ny'; return; }
  const sDays = active.settings.days || { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] }[active.plan.week.length] || [0, 2, 4];
  const cardio = active.plan.cardio || [];
  app.innerHTML = `
    <h1>${esc(tplName(active.name))}</h1>
    <p class="muted">${esc(tplName(active.plan.splitName))} · ${t('perWeek', { n: sDays.length + cardio.length })} · ${active.settings.minutes} ${t('min')}</p>
    <div class="card">
      <div class="row between"><h3>${t('weekPlan')}</h3><button class="btn ghost sm" id="editDays">${t('changeDays')}</button></div>
      ${L.days.map((dn, i) => {
        const si = sDays.indexOf(i);
        const c = cardio.filter(x => x.day === i);
        const items = [si >= 0 ? `<span class="pill">${icon('dumbbell', 'sm')}${esc(tplName(active.plan.templates[active.plan.week[si] ?? si % active.plan.templates.length].name))}</span>` : '', ...c.map(x => `<span class="pill ok">${icon('heart', 'sm')}${esc(cardioName(x.type))} ${x.minutes}′</span>`)].filter(Boolean);
        return `<div class="ex-row" style="padding:8px 0"><b style="width:44px">${dn}</b><div class="row wrap grow">${items.join('') || `<span class="muted small">${t('restShort')}</span>`}</div></div>`;
      }).join('')}
    </div>
    <p class="muted small">${t('scheduleHint')}</p>
    ${active.plan.templates.map((tp, i) => templateCard(tp, i, true)).join('')}
    <div class="card"><div class="row between"><h3>${t('cardioSessions')}</h3><button class="btn secondary sm" id="addCardio">${icon('plus', 'sm')}${t('add')}</button></div>
      ${cardio.length ? cardio.map((c, i) => cardioRow(c, i)).join('') : `<p class="muted small">${t('noCardio')}</p>`}</div>
    <h2>${t('myPrograms', { n: programs.length })}</h2>
    <div class="card">
      ${programs.map(p => `<div class="ex-row"><span class="thumb icon-thumb" style="width:40px;height:40px;${p.active ? '' : 'color:var(--muted);background:var(--surface-2)'}">${icon('calendar')}</span>
        <div class="grow"><b>${esc(tplName(p.name))}</b><div class="muted small">${p.active ? `<span class="pill ok">${t('activeProgram')}</span> ` : ''}${esc(tplName(p.plan.splitName || ''))} · ${dateFmt(p.created_at)}</div></div>
        ${p.active ? '' : `<button class="btn secondary sm" data-act="${p.id}">${t('use')}</button>`}
        <button class="btn ghost sm ic" data-ren="${p.id}" aria-label="${t('rename')}" title="${t('rename')}">${icon('edit', 'sm')}</button>
        <button class="btn danger sm ic" data-del="${p.id}" aria-label="${t('remove')}" title="${t('remove')}">${icon('trash', 'sm')}</button></div>`).join('')}
      <a class="btn secondary block" href="#/ny" style="margin-top:10px">${icon('plus', 'sm')}${t('newProgramBtn')}</a>
    </div>`;
  const keep = () => { render.keepScroll = true; render(); };
  app.querySelectorAll('[data-swap]').forEach(b => b.onclick = async () => {
    const [ti, i] = b.dataset.swap.split(':').map(Number);
    const alts = await api(`/programs/${active.id}/alternatives?t=${ti}&i=${i}`);
    const d = modal(`<h3>${t('swapTitle', { name: esc(exName(active.plan.templates[ti].items[i].exercise)) })}</h3>
      ${alts.length ? alts.map(a => `<div class="ex-row">${thumb(a)}<div class="grow"><b>${esc(exName(a))}</b><div class="muted small">${esc(equip(a.equipment))} · ${a.primaryMuscles.map(muscle).join(', ')}</div></div><button class="btn secondary sm" data-pick="${esc(a.id)}">${t('choose')}</button></div>`).join('') : `<p class="muted">${t('noAlternatives')}</p>`}
      <button class="btn ghost block" data-close style="margin-top:12px">${t('cancel')}</button>`);
    d.querySelectorAll('[data-pick]').forEach(p => p.onclick = async () => {
      await api(`/programs/${active.id}/swap`, { method: 'POST', body: { t: ti, i, exerciseId: p.dataset.pick } });
      d.close(); keep();
    });
  });
  app.querySelectorAll('[data-timed]').forEach(b => b.onclick = async () => {
    const [ti, i, on] = b.dataset.timed.split(':').map(Number);
    await api(`/programs/${active.id}/timed`, { method: 'POST', body: { t: ti, i, timed: !!on } });
    toast(t(on ? 'timedOn' : 'timedOff', { name: exName(active.plan.templates[ti].items[i].exercise) })); keep();
  });
  $('#editDays').onclick = () => {
    const d = modal(`<h3>${t('wizDays')}</h3><div class="choices days" style="margin-top:12px">${L.days.map((dn, i) => `<div class="choice"><input type="checkbox" id="ed-${i}" value="${i}" ${sDays.includes(i) ? 'checked' : ''}><label for="ed-${i}">${dn}</label></div>`).join('')}</div>
      <div class="wizard-nav"><button class="btn ghost" data-close>${t('cancel')}</button><button class="btn" id="dok">${t('save')}</button></div>`);
    $('#dok', d).onclick = async () => {
      const days = [...d.querySelectorAll('input:checked')].map(i => Number(i.value));
      if (!days.length) return toast(t('pickDay'));
      if (days.length > 6) return toast(t('maxDays'));
      await api(`/programs/${active.id}/days`, { method: 'PUT', body: { days } });
      d.close(); keep();
    };
  };
  $('#addCardio').onclick = () => cardioPicker(async c => {
    await api(`/programs/${active.id}/cardio`, { method: 'POST', body: c }); keep();
  }, { withDay: true, okLabel: t('add') });
  app.querySelectorAll('[data-cdel]').forEach(b => b.onclick = async () => { await api(`/programs/${active.id}/cardio/${b.dataset.cdel}`, { method: 'DELETE' }); keep(); });
  app.querySelectorAll('[data-cstart]').forEach(b => b.onclick = () => { const c = cardio[Number(b.dataset.cstart)]; startCardio(c.type, c.minutes, active.id); });
  app.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => { await api(`/programs/${b.dataset.act}/activate`, { method: 'POST' }); toast(t('programSwitched')); render(); });
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const p = programs.find(x => x.id == b.dataset.del);
    if (!confirm(t(p.active ? 'removeActiveProgram' : 'removeProgram', { name: tplName(p.name) }))) return;
    await api(`/programs/${p.id}`, { method: 'DELETE' });
    if (p.active && programs.length === 1) { location.hash = '#/'; return; }
    render();
  });
  app.querySelectorAll('[data-ren]').forEach(b => b.onclick = () => {
    const p = programs.find(x => x.id == b.dataset.ren);
    const d = modal(`<h3>${t('rename')}</h3><input type="text" id="rn" maxlength="80" value="${esc(tplName(p.name))}" style="margin-top:12px">
      <div class="wizard-nav"><button class="btn ghost" data-close>${t('cancel')}</button><button class="btn" id="rok">${t('save')}</button></div>`);
    $('#rn', d).select();
    $('#rok', d).onclick = async () => { const name = $('#rn', d).value.trim(); if (!name) return; await api(`/programs/${p.id}`, { method: 'PATCH', body: { name } }); d.close(); keep(); };
  });
  // Set, vila och superset per övning
  app.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const [ti, i] = b.dataset.edit.split(':').map(Number);
    const items = active.plan.templates[ti].items, it = items[i];
    const rests = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
    if (!rests.includes(it.rest)) rests.push(it.rest), rests.sort((a, b) => a - b);
    const d = modal(`<h3>${esc(exName(it.exercise))}</h3>
      <div class="row" style="margin-top:12px"><div class="grow"><label class="field" for="esets">${t('setsLabel')}</label><select id="esets">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option ${n === it.sets ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="grow"><label class="field" for="erest">${t('restLabel')}</label><select id="erest">${rests.map(n => `<option value="${n}" ${n === it.rest ? 'selected' : ''}>${n ? fmtTime(n) : t('noRest')}</option>`).join('')}</select></div></div>
      ${i < items.length - 1 ? `<div class="setting" style="border-top:0;margin-top:8px"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('link')}</span><div class="grow"><b>${t('superset')}</b><div class="muted small">${t('supersetHint', { name: esc(exName(items[i + 1].exercise)) })}</div></div><label class="switch"><input type="checkbox" id="elink" ${it.linkNext ? 'checked' : ''}><span></span></label></div>` : `<p class="muted small">${t('supersetLast')}</p>`}
      <div class="wizard-nav"><button class="btn ghost" data-close>${t('cancel')}</button><button class="btn" id="eok">${t('save')}</button></div>`);
    $('#eok', d).onclick = async () => {
      await api(`/programs/${active.id}/item`, { method: 'POST', body: { t: ti, i, sets: Number($('#esets', d).value), rest: Number($('#erest', d).value), linkNext: !!$('#elink', d)?.checked } });
      d.close(); toast(t('saved')); keep();
    };
  });
};

// ---------- Uppvärmning och stretch ----------
function mobilityFor(kind, groups) {
  const list = MOBILITY[kind];
  const pick = list.filter(m => !m.g.length || m.g.some(g => groups.includes(g)));
  const cap = kind === 'warmup' ? 330 : 300; // sekunder
  const maxItems = kind === 'warmup' ? 8 : 6;
  // Varva kroppsdelar så att alla dagens grupper får något innan listan blir full
  const general = pick.filter(m => !m.g.length);
  const byGroup = groups.map(g => pick.filter(m => m.g.includes(g)));
  const ordered = [...general];
  for (let i = 0; byGroup.some(l => l[i]); i++) for (const l of byGroup) if (l[i] && !ordered.includes(l[i])) ordered.push(l[i]);
  const out = []; let total = 0;
  for (const m of ordered) { if (out.length >= maxItems || total + m.s > cap) continue; out.push(m); total += m.s; }
  return { items: out, minutes: Math.max(1, Math.round(total / 60)) };
}
function mobilityCard(kind, groups) {
  const { items, minutes } = mobilityFor(kind, groups);
  if (!items.length) return '';
  return `<div class="card">
    <div class="row between"><div class="row"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon(kind === 'warmup' ? 'flame' : 'stretch')}</span><div><h3>${t(kind)}</h3><div class="muted small">${t(kind + 'Text', { n: minutes })}</div></div></div></div>
    <details class="mob"><summary class="small">${t('showMoves', { n: items.length })}</summary>
    <ul class="mob-list">${items.map(m => `<li><div><b>${esc(m[lang][0])}</b><div class="muted small">${esc(m[lang][1])}</div></div><span class="sec">${m.side ? `${m.s / 2} s ${t('perSide')}` : `${m.s} s`}</span></li>`).join('')}</ul></details>
    <button class="btn secondary block" data-guided="${kind}" style="margin-top:10px">${icon('play', 'sm')}${t('startGuided')}</button>
  </div>`;
}
function guidedSteps(kind, groups) {
  const steps = [];
  for (const m of mobilityFor(kind, groups).items) {
    if (m.side) {
      steps.push({ name: `${m[lang][0]} (1/2)`, desc: m[lang][1], seconds: m.s / 2 });
      steps.push({ name: `${m[lang][0]} (2/2)`, desc: m[lang][1], seconds: m.s / 2 });
    } else steps.push({ name: m[lang][0], desc: m[lang][1], seconds: m.s });
  }
  return steps;
}

// ---------- Timer med ring: tidsövningar och guidad uppvärmning ----------
let runner = null;
function runSteps(steps, { title, onDone, getReady = 5 } = {}) {
  runner?.stop(true);
  const all = getReady ? [{ name: t('getReady'), desc: steps[0]?.name, seconds: getReady, prep: true }, ...steps] : steps;
  let idx = 0, left = all[0].seconds, paused = false, iv, lastTick = Date.now(), activeSeconds = 0;
  const R = 100, C = 2 * Math.PI * R;
  const d = modal(`<div class="bigtimer"><div class="eyebrow">${esc(title || '')}</div>
    <div class="ring"><svg viewBox="0 0 220 220"><circle class="bg" cx="110" cy="110" r="${R}"/><circle class="fg" id="rfg" cx="110" cy="110" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
      <div class="num"><b id="rnum"></b><small id="rsub"></small></div></div>
    <h3 id="rname"></h3><p class="muted small" id="rdesc"></p><p class="muted small" id="rnext"></p>
    <div class="wizard-nav"><button class="btn ghost" id="rpause">${t('pause')}</button><button class="btn ghost" id="rskip">${t('skip')}</button><button class="btn" id="rstop">${t('done')}</button></div></div>`);
  keepAwake(true);
  const draw = () => {
    const st = all[idx];
    $('#rnum', d).textContent = left >= 60 ? fmtTime(Math.ceil(left)) : Math.ceil(left);
    $('#rsub', d).textContent = paused ? t('paused') : `${idx + (getReady ? 0 : 1)}/${steps.length}`;
    $('#rname', d).textContent = st.name;
    $('#rdesc', d).textContent = st.prep ? '' : st.desc || '';
    $('#rnext', d).textContent = all[idx + 1] ? t('upNext', { name: all[idx + 1].name }) : '';
    $('#rfg', d).style.strokeDashoffset = C * (1 - left / st.seconds);
    $('#rfg', d).style.stroke = st.prep ? 'var(--warn)' : 'var(--brand)';
  };
  const advance = () => {
    idx++;
    if (idx >= all.length) { finish(); return; }
    left = all[idx].seconds; beep(all[idx].prep ? 660 : 990, 250); navigator.vibrate?.(200); draw();
    say(all[idx].prep ? all[idx].desc : `${all[idx].name}. ${t('voiceSec', { n: Math.round(all[idx].seconds) })}`);
  };
  const tick = () => {
    const now = Date.now(), dt = (now - lastTick) / 1000; lastTick = now;
    if (paused) return;
    const before = Math.ceil(left);
    left -= dt;
    if (!all[idx].prep) activeSeconds += dt;
    if (Math.ceil(left) !== before && Math.ceil(left) <= 3 && Math.ceil(left) > 0) beep(660, 90);
    if (left <= 0) advance(); else draw();
  };
  const finish = (aborted) => {
    clearInterval(iv); keepAwake(false); runner = null;
    if (!aborted) { beep(1180, 400); navigator.vibrate?.([200, 100, 300]); }
    if (d.open) d.close();
    onDone?.(Math.round(activeSeconds), aborted);
  };
  $('#rpause', d).onclick = e => { paused = !paused; e.target.textContent = paused ? t('resume') : t('pause'); draw(); };
  $('#rskip', d).onclick = advance;
  $('#rstop', d).onclick = () => finish(false);
  runner = { stop: (silent) => { if (runner) { runner = null; clearInterval(iv); keepAwake(false); if (!silent) onDone?.(Math.round(activeSeconds), true); } } };
  draw(); beep(660, 120);
  say(getReady ? `${t('getReady')}. ${steps[0]?.name || ''}` : steps[0]?.name);
  iv = setInterval(tick, 200);
}

// ---------- Pass-läge ----------
views.pass = async id => {
  setTab('home');
  const s = String(id).startsWith('off-') && !tmpMap()[id] ? offlineSession(id) : mergeOutbox(await api(`/sessions/${resolveTmp(id)}`));
  if (tmpMap()[id]) { location.replace(`#/pass/${tmpMap()[id]}`); return; }
  if (s.kind === 'cardio') return cardioView(s);
  const done = !!s.finished_at;
  const started = parseDate(s.started_at);
  const prefs = user.prefs || { warmup: true, stretch: true };
  const groups = s.groups?.length ? s.groups : GROUP_KEYS;
  const quick = !!s.quick;
  app.innerHTML = `
    <div class="row between"><h1 class="grow">${quick ? `${t('quickShort')}: ` : ''}${esc(tplName(s.name))}</h1>
      ${done ? `<span class="pill ok">${icon('check', 'sm')}${t('finished')}</span>` : `<button class="icon-btn voice-btn ${voiceOn() ? 'on' : ''}" id="voiceBtn" aria-label="${t('voiceCoach')}" title="${t('voiceCoach')}">${icon('voice')}</button><span class="pill neutral" id="elapsed"></span>`}</div>
    ${quick && !done ? `<div class="hint">${icon('bolt')}<span>${t('quickHint')}</span></div>` : ''}
    ${!done && prefs.warmup && !quick ? mobilityCard('warmup', groups) : ''}
    ${s.items.map((it, xi) => exCard(it, xi, done, s.items[xi - 1])).join('')}
    ${!done && prefs.stretch && !quick ? mobilityCard('stretch', groups) : ''}
    ${done ? `${s.note ? `<div class="card"><b>${t('noteFinished')}:</b> ${esc(s.note)}</div>` : ''}<button class="btn danger block" id="del">${icon('trash', 'sm')}${t('deleteWorkout')}</button>`
      : `<div class="card stack"><textarea id="note" rows="2" placeholder="${t('notePlaceholder')}"></textarea><button class="btn block" id="finish">${icon('check', 'sm')}${t('finishWorkout')}</button></div>
         <button class="btn danger block" id="del">${t('abortWorkout')}</button>`}`;
  if (!done) {
    const tick = () => { const el = $('#elapsed'); if (!el) return clearInterval(iv); el.textContent = `${Math.floor((Date.now() - started) / 60000)} ${t('min')}`; };
    const iv = setInterval(tick, 15000); tick();
  }
  app.querySelectorAll('[data-guided]').forEach(b => b.onclick = () => runSteps(guidedSteps(b.dataset.guided, groups), { title: t(b.dataset.guided), getReady: 5 }));
  $('#voiceBtn')?.addEventListener('click', e => {
    store.set('voice', !voiceOn()); e.currentTarget.classList.toggle('on', voiceOn());
    toast(t(voiceOn() ? 'voiceOn' : 'voiceOff'));
    if (voiceOn()) say(firstUp());
  });
  // Röstcoach: vad som väntar härnäst
  const setInfo = (xi, setNo) => {
    const it = s.items[xi]; if (!it) return null;
    const row = app.querySelector(`[data-set="${xi}:${setNo}"]`);
    return { name: exName(it.exercise), set: setNo, sets: it.sets, timed: it.timed, weight: Number(row?.querySelector('[name=w]')?.value) || 0, reps: row?.querySelector('[name=r]')?.value || (it.timed ? it.secMax : it.repsMax) };
  };
  const firstUp = () => {
    const xi = s.items.findIndex(it => it.logs.length < it.sets);
    if (xi < 0) return t('voiceAllDone');
    const it = s.items[xi];
    return t('voiceFirst', { name: exName(it.exercise), scheme: it.timed ? t('voiceSchemeTimed', { sets: it.sets, sec: it.secMax }) : t('voiceScheme', { sets: it.sets, min: it.repsMin, max: it.repsMax }) });
  };
  if (!done && voiceOn() && !s.items.some(it => it.logs.length) && say.lastSession !== s.id) { say.lastSession = s.id; setTimeout(() => say(firstUp()), 600); }
  // Byt övning bara i det här passet
  app.querySelectorAll('[data-sswap]').forEach(b => b.onclick = async () => {
    const xi = Number(b.dataset.sswap), it = s.items[xi];
    const { original, alternatives: alts } = await api(`/sessions/${id}/alternatives?index=${it.index}`);
    const row = a => `<div class="ex-row">${thumb(a)}<div class="grow"><b>${esc(exName(a))}</b><div class="muted small">${esc(equip(a.equipment))} · ${a.primaryMuscles.map(muscle).join(', ')}</div></div><button class="btn secondary sm" data-pick="${esc(a.id)}">${t('choose')}</button></div>`;
    const d = modal(`<h3>${t('swapInWorkout', { name: esc(exName(it.exercise)) })}</h3><p class="muted small">${t('swapInWorkoutHint')}</p>
      ${original ? `<div class="eyebrow" style="margin-top:10px">${t('backToOriginal')}</div>${row(original)}<hr class="divider">` : ''}
      ${alts.length ? alts.map(row).join('') : `<p class="muted">${t('noAlternatives')}</p>`}
      <button class="btn ghost block" data-close style="margin-top:12px">${t('cancel')}</button>`);
    d.querySelectorAll('[data-pick]').forEach(pk => pk.onclick = async () => {
      await api(`/sessions/${id}/swap`, { method: 'POST', body: { index: it.index, exerciseId: pk.dataset.pick } });
      d.close(); toast(t('swappedTo', { name: exName(alts.concat(original || []).find(a => a.id === pk.dataset.pick)) })); render.keepScroll = true; render();
    });
  });
  // Ansträngning per set
  app.querySelectorAll('[data-rpe] button').forEach(b => b.onclick = async () => {
    const box = b.closest('[data-rpe]'), [xi, setNo] = box.dataset.rpe.split(':').map(Number), it = s.items[xi];
    const v = b.classList.contains('on') ? null : Number(b.dataset.v);
    box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b && v != null));
    await api(`/sessions/${id}/rpe`, { method: 'PUT', body: { exerciseId: it.exerciseId, setNo, rpe: v } });
    const log = it.logs.find(l => l.set_no === setNo); if (log) log.rpe = v;
  });

  const shownPr = {};
  async function logSet(btn, xi, setNo, value) {
    const it = s.items[xi];
    const row = btn.closest('[data-set]');
    const w = row.querySelector('[name=w]')?.value;
    const body = it.timed ? { exerciseId: it.exerciseId, setNo, seconds: value } : { exerciseId: it.exerciseId, setNo, weight: w, reps: value };
    const res = await api(`/sessions/${id}/sets`, { method: 'PUT', body });
    btn.classList.add('done'); btn.innerHTML = icon('check');
    if (!it.logs.some(l => l.set_no === setNo)) it.logs.push({ set_no: setNo, weight: w, reps: value });
    app.querySelector(`[data-rpe="${xi}:${setNo}"]`)?.removeAttribute('hidden');
    // Personbästa: fira en gång per övning och typ (igen bara om det slås en gång till)
    const fresh = (res.pr || []).filter(p => { const k = it.exerciseId + p.type; if (shownPr[k] >= p.value) return false; shownPr[k] = p.value; return true; });
    if (fresh.length) celebrate(fresh[0], it);
    const next = app.querySelector(`[data-set="${xi}:${setNo + 1}"]`);
    if (next) {
      const nw = next.querySelector('[name=w]'); if (nw && !nw.value) nw.value = w;
      const nr = next.querySelector('[name=r]'); if (!nr.value) nr.value = value;
    }
    const card = btn.closest('.ex-card');
    card.classList.toggle('complete', [...card.querySelectorAll('.check:not(.play)')].every(c => c.classList.contains('done')));
    if (location.hash !== `#/pass/${id}`) return;
    // Superset: gå direkt till nästa övning i kedjan, vila efter den sista
    if (it.linkNext && s.items[xi + 1]) {
      const nextCard = app.querySelectorAll('.ex-card')[xi + 1];
      nextCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(t('supersetGo', { name: exName(s.items[xi + 1].exercise) }));
      say(t('voiceSuperset', { name: exName(s.items[xi + 1].exercise) }));
      return;
    }
    let first = xi; while (first > 0 && s.items[first - 1].linkNext) first--;
    // Nästa set: samma övning (eller första i supersetet) eller nästa övning
    const nextUp = first < xi ? (setNo < s.items[first].sets ? setInfo(first, setNo + 1) : setInfo(xi + 1, 1)) : setNo < it.sets ? setInfo(xi, setNo + 1) : setInfo(xi + 1, 1);
    startTimer(it.rest, first < xi ? exName(s.items[first].exercise) : (setNo < it.sets ? exName(it.exercise) : exName(s.items[xi + 1]?.exercise)), nextUp);
  }
  // Fyll i förslaget i alla set som inte är loggade
  app.querySelectorAll('[data-apply]').forEach(b => b.onclick = () => {
    const xi = Number(b.dataset.apply), sug = s.items[xi].suggestion;
    app.querySelectorAll(`[data-set^="${xi}:"]`).forEach(row => {
      if (row.querySelector('.check.done')) return;
      const w = row.querySelector('[name=w]'), r = row.querySelector('[name=r]');
      if (w && sug.weight > 0) w.value = sug.weight;
      if (r && (sug.seconds || sug.reps)) r.value = sug.seconds || sug.reps;
    });
    toast(t('suggestionApplied'));
  });
  app.querySelectorAll('[data-plates]').forEach(b => b.onclick = () => {
    const xi = Number(b.dataset.plates);
    const vals = [...app.querySelectorAll(`[data-set^="${xi}:"] [name=w]`)].map(i => Number(i.value) || 0);
    plateCalc(Math.max(...vals, s.items[xi].suggestion?.weight || 0) || 60);
  });
  app.querySelectorAll('.check:not(.play)').forEach(btn => btn.onclick = async () => {
    const row = btn.closest('[data-set]');
    const [xi, setNo] = row.dataset.set.split(':').map(Number);
    const it = s.items[xi];
    if (btn.classList.contains('done')) {
      await api(`/sessions/${id}/sets`, { method: 'DELETE', body: { exerciseId: it.exerciseId, setNo } });
      btn.classList.remove('done'); btn.innerHTML = icon('circle');
      btn.closest('.ex-card').classList.remove('complete');
      app.querySelector(`[data-rpe="${xi}:${setNo}"]`)?.setAttribute('hidden', '');
      it.logs = it.logs.filter(l => l.set_no !== setNo);
      return;
    }
    const r = row.querySelector('[name=r]').value;
    if (!r) return toast(t(it.timed ? 'fillSeconds' : 'fillReps'));
    logSet(btn, xi, setNo, r);
  });
  // Tidsövning: starta nedräkning, logga tiden när den är klar
  app.querySelectorAll('.check.play').forEach(btn => btn.onclick = () => {
    const row = btn.closest('[data-set]');
    const [xi, setNo] = row.dataset.set.split(':').map(Number);
    const it = s.items[xi];
    const target = Number(row.querySelector('[name=r]').value) || it.secMax;
    stopTimer();
    runSteps([{ name: exName(it.exercise), desc: `${t('colSet')} ${setNo}`, seconds: target }], {
      title: `${t('colSet')} ${setNo}/${it.sets}`, getReady: 5,
      onDone: (secs, aborted) => {
        if (!secs) return;
        row.querySelector('[name=r]').value = aborted ? secs : target;
        logSet(row.querySelector('.check:not(.play)'), xi, setNo, aborted ? secs : target);
        toast(t('timeLogged', { n: aborted ? secs : target }));
      },
    });
  });
  $('#finish')?.addEventListener('click', async () => {
    const logged = app.querySelectorAll('.check.done').length;
    if (!logged && !confirm(t('noSetsConfirm'))) return;
    await api(`/sessions/${id}/finish`, { method: 'POST', body: { note: $('#note').value } });
    stopTimer(); toast(t('greatJob')); location.hash = '#/statistik';
  });
  $('#del').onclick = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    await api(`/sessions/${id}`, { method: 'DELETE' }); stopTimer(); location.hash = '#/';
  };
};
function setRow(it, xi, n, log, done) {
  const sug = it.suggestion;
  const last = sug?.lastSets?.find(l => l.set_no === n);
  const prevRow = (last ? `<div class="prev">${t('lastShort')}: ${esc(lastSetTxt(it, last))}${last.rpe ? ` · ${esc(rpeLabel(last.rpe))}` : ''}</div>` : '')
    + (done ? (log?.rpe ? `<div class="prev">${esc(rpeLabel(log.rpe))}</div>` : '') : `<div class="rpe" data-rpe="${xi}:${n}" ${log ? '' : 'hidden'}><span>${t('howHard')}</span>${RPE.map(([v, k]) => `<button type="button" data-v="${v}" class="${log?.rpe === v ? 'on' : ''}">${t(k)}</button>`).join('')}</div>`);
  if (it.timed) {
    const v = log?.seconds ?? (sug?.seconds || '');
    return `<div class="set-no">${n}</div>
      <div data-set="${xi}:${n}" style="display:contents">
        <input name="r" type="number" inputmode="numeric" min="0" value="${v}" placeholder="${last?.seconds ?? it.secMin + '–' + it.secMax}" ${done ? 'disabled' : ''} aria-label="${t('colSec')} ${n}">
        <button class="check play" ${done ? 'disabled' : ''} aria-label="${t('start')} ${n}">${icon('play', 'sm')}</button>
        <button class="check ${log ? 'done' : ''}" ${done ? 'disabled' : ''} aria-label="${t('done')} ${n}">${icon(log ? 'check' : 'circle')}</button>
      </div>${prevRow}`;
  }
  const w = log?.weight ?? (sug?.weight || '');
  const r = log?.reps ?? '';
  return `<div class="set-no">${n}</div>
    <div data-set="${xi}:${n}" style="display:contents">
      <input name="w" type="number" inputmode="decimal" step="0.5" min="0" value="${w}" placeholder="${last?.weight ?? t('kg')}" ${done ? 'disabled' : ''} aria-label="${t('colKg')} ${n}">
      <input name="r" type="number" inputmode="numeric" min="0" value="${r}" placeholder="${last?.reps ?? it.repsMin + '–' + it.repsMax}" ${done ? 'disabled' : ''} aria-label="${t('colReps')} ${n}">
      <button class="check ${log ? 'done' : ''}" ${done ? 'disabled' : ''} aria-label="${t('done')} ${n}">${icon(log ? 'check' : 'circle')}</button>
    </div>${prevRow}`;
}

const RPE = [[7, 'rpeEasyL'], [8, 'rpeOkL'], [9, 'rpeHardL'], [10, 'rpeMaxL']];
const rpeLabel = v => t(RPE.find(([x]) => x >= v)?.[1] || 'rpeMaxL').toLowerCase();

// ---------- Personbästa ----------
function celebrate(pr, it) {
  const val = pr.type === 'seconds' ? `${pr.value} s` : pr.type === 'reps' ? `${pr.value} ${t('reps')}` : `${fmt(pr.value)} kg`;
  document.querySelectorAll('.pr-pop').forEach(x => x.remove());
  const el = document.createElement('div');
  el.className = 'pr-pop';
  el.innerHTML = `<div class="burst">${Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * 360 / 14}deg;--c:${['var(--brand)', 'var(--ok)', 'var(--warn)', '#eab308'][i % 4]}"></i>`).join('')}</div>
    ${icon('trophy')}<div><b>${t('newPr')}</b><div class="small">${esc(exName(it.exercise))}: ${t('prType')[pr.type]} ${esc(val)}${pr.previous ? ` <span style="opacity:.75">(${t('prBefore')} ${pr.type === 'seconds' ? pr.previous + ' s' : pr.type === 'reps' ? pr.previous : fmt(pr.previous) + ' kg'})</span>` : ''}</div></div>`;
  document.body.append(el);
  el.onclick = () => el.remove();
  [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => beep(f, 140), i * 120));
  navigator.vibrate?.([80, 60, 80, 60, 200]);
  setTimeout(() => el.remove(), 4500);
}

// ---------- Skivkalkylator ----------
const PLATE_SET = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
function platesFor(target, bar, avail) {
  let side = (target - bar) / 2;
  const out = [];
  if (side < 0) return { out, rest: side * 2 };
  for (const p of avail.sort((a, b) => b - a)) while (side >= p - 1e-9) { out.push(p); side -= p; }
  return { out, rest: Math.round(side * 2 * 100) / 100 };
}
function plateCalc(target) {
  const cfg = { bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25], ...(store.get('plateCfg') || {}) };
  const d = modal(`<h3>${t('plateCalc')}</h3>
    <div class="row" style="margin-top:12px"><div class="grow"><label class="field" for="pt">${t('targetWeight')}</label><input type="number" id="pt" step="0.5" min="0" inputmode="decimal" value="${target}"></div>
      <div class="grow"><label class="field" for="pb">${t('barWeight')}</label><select id="pb">${[20, 15, 10, 7.5, 5].map(b => `<option value="${b}" ${b === cfg.bar ? 'selected' : ''}>${fmt(b)} kg</option>`).join('')}</select></div></div>
    <div id="pres" style="margin-top:14px"></div>
    <label class="field" style="margin-top:12px">${t('platesAvailable')}</label>
    <div class="choices" style="grid-template-columns:repeat(4,1fr)">${PLATE_SET.map(p => `<div class="choice"><input type="checkbox" id="pp-${p}" value="${p}" ${cfg.plates.includes(p) ? 'checked' : ''}><label for="pp-${p}" style="min-height:40px;align-items:center">${fmt(p, 2)}</label></div>`).join('')}</div>
    <button class="btn ghost block" data-close style="margin-top:14px">${t('close')}</button>`);
  const draw = () => {
    cfg.bar = Number($('#pb', d).value); cfg.plates = [...d.querySelectorAll('.choices input:checked')].map(i => Number(i.value));
    store.set('plateCfg', cfg);
    const tw = Number($('#pt', d).value) || 0;
    const { out, rest } = platesFor(tw, cfg.bar, [...cfg.plates]);
    $('#pres', d).innerHTML = tw < cfg.bar ? `<p class="muted">${t('lighterThanBar')}</p>` : `
      <div class="barviz"><span class="sleeve"></span>${out.map(p => `<span class="plate" style="--h:${40 + p * 2.4}px;--c:${{ 25: '#dc2626', 20: '#2563eb', 15: '#eab308', 10: '#16a34a', 5: '#f8fafc', 2.5: '#0f172a', 1.25: '#94a3b8', 0.5: '#94a3b8' }[p]}">${fmt(p, 2)}</span>`).join('')}<span class="collar"></span></div>
      <p style="margin:10px 0 0"><b>${t('perSideLabel')}:</b> ${out.length ? out.map(p => fmt(p, 2)).join(' + ') + ' kg' : t('emptyBar')}</p>
      ${rest ? `<p class="small" style="color:var(--warn)">${t('plateRest', { n: fmt(rest, 2) })}</p>` : ''}`;
  };
  d.querySelectorAll('input, select').forEach(i => i.oninput = i.onchange = draw);
  draw();
}
const lastSetTxt = (it, l) => it.timed ? `${l.seconds ?? '–'} s` : l.weight > 0 ? `${fmt(l.weight)} kg × ${l.reps ?? '–'}` : `${l.reps ?? '–'} ${t('reps')}`;
function sugText(it, sug) {
  if (it.timed) return sug.seconds ? `${sug.seconds} s` : '';
  if (sug.weight > 0) return `${fmt(sug.weight)} kg${sug.reps ? ` × ${sug.reps}` : ''}`;
  return sug.reps ? `${sug.reps} ${t('reps')}` : '';
}
function exCard(it, xi, done, prev) {
  const n = Math.max(it.sets, ...it.logs.map(l => l.set_no));
  const rows = Array.from({ length: n }, (_, i) => setRow(it, xi, i + 1, it.logs.find(l => l.set_no === i + 1), done)).join('');
  const sug = it.suggestion;
  const complete = it.logs.length >= n;
  const reason = sug?.reason ? t(sug.reason, { n: sug.repsMax, w: fmt(sug.weight) }) : null;
  const target = sug ? sugText(it, sug) : '';
  const inSuperset = it.linkNext || prev?.linkNext;
  const barbell = !it.timed && it.exercise.equipment === 'barbell';
  return `<div class="card ex-card ${complete ? 'complete' : ''} ${it.linkNext ? 'linked' : ''} ${prev?.linkNext ? 'linked-prev' : ''}">
    ${inSuperset ? `<div class="eyebrow" style="color:var(--brand);margin-bottom:6px">${icon('link', 'sm')} ${t('superset')}</div>` : ''}
    <div class="row">${thumb(it.exercise)}
      <div class="grow"><a href="#/ovning/${encodeURIComponent(it.exerciseId)}" style="color:inherit;text-decoration:none"><b>${esc(exName(it.exercise))}</b></a>
      <div class="muted small">${itemScheme(it)}</div></div>${it.timed ? `<span class="pill">${icon('clock', 'sm')}</span>` : ''}
      ${barbell && !done ? `<button class="btn ghost sm" data-plates="${xi}" aria-label="${t('plateCalc')}" title="${t('plateCalc')}">${icon('plates', 'sm')}</button>` : ''}
      ${!done && it.index != null && !it.logs.length ? `<button class="btn ghost sm" data-sswap="${xi}" aria-label="${t('swapInWorkoutBtn')}" title="${t('swapInWorkoutBtn')}">${icon('swap', 'sm')}</button>` : ''}</div>
    ${it.swappedFrom ? `<div class="muted small" style="margin-top:6px">${icon('swap', 'sm')} ${t('swappedFrom', { name: esc(SVN[it.swappedFrom] || it.swappedFromName || '') })}</div>` : ''}
    ${!done && sug ? `<div class="hint ${sug.deload ? 'warn' : ''}">${icon(sug.deload ? 'info' : sug.increase ? 'trend' : 'info')}<div class="grow"><span>${esc(reason || t('keepGoing'))}</span>
      ${target ? `<div class="row between" style="margin-top:6px"><b>${t('suggestion')}: ${esc(target)}</b><button class="btn secondary sm" data-apply="${xi}">${t('useSuggestion')}</button></div>` : ''}</div></div>` : ''}
    <div class="set-grid ${it.timed ? 'timed' : ''}"><div class="hdr">${t('colSet')}</div>${it.timed ? `<div class="hdr">${t('colSec')}</div><div></div>` : `<div class="hdr">${t('colKg')}</div><div class="hdr">${t('colReps')}</div>`}<div></div>${rows}</div>
  </div>`;
}

// ---------- Cardiopass ----------
function cardioView(s) {
  const done = !!s.finished_at;
  const started = parseDate(s.started_at);
  const elapsedMin = () => Math.max(1, Math.round((Date.now() - started) / 60000));
  app.innerHTML = `
    <div class="row between"><h1 class="grow">${esc(cardioName(s.cardio_type))}</h1>${done ? `<span class="pill ok">${icon('check', 'sm')}${t('finished')}</span>` : `<span class="pill">${t('cardio')}</span>`}</div>
    ${done ? `<div class="stats"><div class="stat"><b>${fmt(s.duration_min, 0)} ${t('min')}</b><span>${t('duration')}</span></div><div class="stat"><b>${s.distance_km ? fmt(s.distance_km) + ' ' + t('km') : '–'}</b><span>${t('distanceKm').split(' (')[0]}</span></div></div>
      ${s.note ? `<div class="card" style="margin-top:12px"><b>${t('noteFinished')}:</b> ${esc(s.note)}</div>` : ''}
      <button class="btn danger block" id="del" style="margin-top:12px">${icon('trash', 'sm')}${t('deleteWorkout')}</button>`
    : `<div class="card center"><div class="eyebrow">${t('elapsed')}</div><div style="font-size:3rem;font-weight:800;font-variant-numeric:tabular-nums" id="cclock">0:00</div>
        ${s.duration_min ? `<div class="muted small">${t('plannedMin', { n: fmt(s.duration_min, 0) })}</div><div class="progress" style="margin-top:10px"><i id="cbar" style="width:0"></i></div>` : ''}</div>
      <div class="card stack">
        <div><label class="field" for="cmin">${t('durationMin')}</label><input type="number" id="cmin" min="1" max="600" inputmode="numeric"></div>
        <div><label class="field" for="ckm">${t('distanceKm')}</label><input type="number" id="ckm" min="0" step="0.1" inputmode="decimal"></div>
        <textarea id="note" rows="2" placeholder="${t('notePlaceholder')}"></textarea>
        <button class="btn block" id="finish">${icon('check', 'sm')}${t('finishCardio')}</button>
      </div>
      <button class="btn danger block" id="del">${t('abortWorkout')}</button>`}`;
  if (!done) {
    const tick = () => {
      const el = $('#cclock'); if (!el) return clearInterval(iv);
      const secs = (Date.now() - started) / 1000;
      el.textContent = secs >= 3600 ? `${Math.floor(secs / 3600)}:${fmtTime(secs % 3600).padStart(5, '0')}` : fmtTime(secs);
      if ($('#cbar')) $('#cbar').style.width = Math.min(100, secs / 60 / s.duration_min * 100) + '%';
      const inp = $('#cmin'); if (inp && !inp.dataset.touched) inp.value = elapsedMin();
    };
    const iv = setInterval(tick, 1000); tick();
    $('#cmin').oninput = e => { e.target.dataset.touched = 1; };
    $('#finish').onclick = async () => {
      await api(`/sessions/${s.id}/finish`, { method: 'POST', body: { note: $('#note').value, duration_min: $('#cmin').value || elapsedMin(), distance_km: $('#ckm').value } });
      toast(t('greatJob')); location.hash = '#/statistik';
    };
  }
  $('#del').onclick = async () => { if (!confirm(t('deleteConfirm'))) return; await api(`/sessions/${s.id}`, { method: 'DELETE' }); location.hash = '#/'; };
}

// ---------- Vilotimer ----------
let timerIv = null;
function startTimer(sec, nextName, nextUp, resumed) {
  stopTimer();
  if (!sec) { say(nextUpText(nextUp)); return; }
  if (!resumed) say(`${t('voiceRest', { n: sec })} ${nextUpText(nextUp)}`);
  const el = $('#timer');
  const total = sec, end = Date.now() + sec * 1000;
  el.hidden = false;
  el.innerHTML = `${icon('clock')}<div class="lbl">${t('restTimer')}${nextName ? `<small>${esc(t('upNext', { name: nextName }))}</small>` : ''}</div><span class="t"></span>
    <button id="tsound" aria-label="${t('soundSetting')}" title="${t('soundSetting')}" style="opacity:${soundOn() ? 1 : .45}">${icon('sound', 'sm')}</button>
    <button id="tplus">${t('plus30')}</button><button id="tstop">${t('done')}</button><span class="bar"></span>`;
  $('#tplus').onclick = () => startTimer(Math.max(0, Math.round((end - Date.now()) / 1000)) + 30, nextName, nextUp, true);
  $('#tstop').onclick = stopTimer;
  $('#tsound').onclick = e => { store.set('sound', !soundOn()); e.currentTarget.style.opacity = soundOn() ? 1 : .45; toast(t(soundOn() ? 'soundOn' : 'soundOff')); };
  let lastLeft = null;
  const draw = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    if (left === lastLeft) return;
    lastLeft = left;
    $('.t', el).textContent = fmtTime(left);
    $('.bar', el).style.width = `${100 * (1 - left / total)}%`;
    if (left === 10 && total > 15) say(t('voiceTen'));
    if (left <= 3 && left > 0) beep(660, 80);
    if (left === 0) {
      stopTimer(); beep(990, 300); navigator.vibrate?.([200, 100, 200]); toast(t('nextSet'));
      say(nextUp ? t('voiceGo', { name: nextUp.name }) : t('voiceGoShort'));
      notify(t('restOver'), nextName ? t('upNext', { name: nextName }) : t('nextSet'));
    }
  };
  draw(); timerIv = setInterval(draw, 250);
  // Bakgrund: setInterval kan strypas, så en egen timeout säkrar notisen
  clearTimeout(timerEnd); timerEnd = setTimeout(draw, sec * 1000 + 50);
}
let timerEnd = null;
function stopTimer() { clearInterval(timerIv); clearTimeout(timerEnd); $('#timer').hidden = true; }

// ---------- Övning ----------
function recordsBlock(r) {
  const rows = [];
  if (r.weight) rows.push([t('heaviest'), `${fmt(r.weight.value)} kg${r.weight.reps ? ` × ${r.weight.reps}` : ''}`, r.weight.date]);
  if (r.e1rm) rows.push([t('estimated1rm'), `${fmt(r.e1rm.value)} kg (${fmt(r.e1rm.weight)} × ${r.e1rm.reps})`, r.e1rm.date]);
  if (r.reps) rows.push([t('mostReps'), `${r.reps.value}`, r.reps.date]);
  if (r.seconds) rows.push([t('longest'), `${r.seconds.value} s`, r.seconds.date]);
  if (!rows.length) return '';
  return `<div class="card"><div class="row"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('trophy')}</span><h3 class="grow">${t('records')}</h3><span class="muted small">${t('sessionsCount', { n: r.sessions })}</span></div>
    ${rows.map(([k, v, d]) => `<div class="ex-row"><div class="grow"><div class="muted small">${k}</div><b>${esc(v)}</b></div><span class="muted small">${dateFmt(d, { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>`).join('')}</div>`;
}
views.ovning = async id => {
  setTab('library');
  const [ex, rec] = await Promise.all([api(`/exercises/${encodeURIComponent(id)}?lang=${lang}`), api(`/users/${user.id}/exercises/${encodeURIComponent(id)}/records`).catch(() => ({}))]);
  const v = ex.video;
  const media = v
    ? `<video class="player" controls playsinline preload="metadata" src="${v.url}"></video>
       <div class="saved-box">${icon('check')}<div class="grow"><b>${t('savedOnServer')}</b><div class="small">${t('savedOnServerHint')}${v.title ? ` · ${esc(v.title)}${v.channel ? ' · ' + esc(v.channel) : ''}` : ''}</div></div>
         <button class="btn sm" id="vdel">${icon('trash', 'sm')}${t('removeVideoShort')}</button></div>`
    : `<div id="embedBox">${ex.embed ? embedHtml(ex.embed) : `${ex.images?.length ? `<div class="anim">${ex.images.slice(0, 2).map((_, i) => `<img src="${img(ex, i)}" alt="">`).join('')}</div>` : ''}<p class="muted small" id="embedMsg">${t('findingVideo')}</p>`}</div>`;
  app.innerHTML = `
    <a href="javascript:history.back()" class="small row" style="gap:4px;text-decoration:none">${icon('arrow', 'sm')}${t('back')}</a>
    <h1 style="margin-top:8px">${esc(ex.name)}</h1>
    ${lang === 'sv' && ex.name_en !== ex.name ? `<p class="muted small" style="margin-top:-6px">${esc(ex.name_en)}</p>` : ''}
    ${media}
    <div class="card" style="margin-top:12px">
      <div class="row wrap">
        <span class="pill">${esc(ex.equipment ? equip(ex.equipment) : t('noEquipment'))}</span>
        <span class="pill">${esc(t('levelDb')[ex.level] || ex.level)}</span>
        ${ex.mechanic ? `<span class="pill">${ex.mechanic === 'compound' ? t('compound') : t('isolation')}</span>` : ''}
        ${ex.timed ? `<span class="pill">${icon('clock', 'sm')}${t('timedExercise')}</span>` : ''}
      </div>
      <p><b>${t('primary')}:</b> ${ex.primaryMuscles.map(muscle).join(', ')}${ex.secondaryMuscles.filter(m => !ex.primaryMuscles.includes(m)).length ? `<br><b>${t('secondary')}:</b> ${ex.secondaryMuscles.filter(m => !ex.primaryMuscles.includes(m)).map(muscle).join(', ')}` : ''}</p>
      ${ex.equipment === 'barbell' ? `<button class="btn ghost block" id="plates" style="margin-bottom:8px">${icon('plates', 'sm')}${t('plateCalc')}</button>` : ''}
      ${ex.custom ? `<div class="row" style="gap:8px;margin-bottom:8px"><button class="btn ghost grow" id="cedit">${icon('edit', 'sm')}${t('editCustom')}</button><button class="btn danger" id="cdel" aria-label="${t('remove')}">${icon('trash', 'sm')}</button></div>` : ''}
      <button class="btn ghost block" id="addToProg" style="margin-bottom:8px">${icon('plus', 'sm')}${t('addToProgram')}</button>
      ${v ? '' : `<details class="mob"><summary class="small">${t('videoOptions')}</summary>
        <div class="stack" style="margin-top:10px">
          <button class="btn secondary block" id="vdl">${icon('download', 'sm')}${t('downloadVideo')}</button>
          <label class="btn ghost block" style="cursor:pointer">${icon('upload', 'sm')}${t('uploadVideo')}<input type="file" accept="video/mp4,video/*" id="vup" hidden></label>
          <button class="btn ghost block" id="vpick">${icon('link', 'sm')}${t('chooseVideo')}</button>
          <a class="btn ghost block" href="${videoSearchUrl(ex.name_en || ex.name)}" target="_blank" rel="noopener">${icon('external', 'sm')}${t('watchYoutube')}</a>
        </div>
        <p class="muted small">${t('embedNote')}</p>
      </details>`}
      <p class="small" id="vstatus" style="margin-bottom:0"></p>
    </div>
    ${rec?.points?.length ? progressBlock(rec.points) : ''}
    ${rec ? recordsBlock(rec) : ''}
    <div class="card"><h3>${t('howTo')}</h3>${!ex.translated && lang === 'sv' ? `<p class="muted small">${t('englishNote')}</p>` : ''}
      ${ex.instructions.length ? `<ol class="instructions">${ex.instructions.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : `<p class="muted small">${t('noInstructions')}</p>`}</div>`;
  // Hitta en video att bädda in första gången övningen visas
  if (!v && !ex.embed) {
    api(`/exercises/${encodeURIComponent(ex.id)}/embed`).then(e => {
      if (e?.videoId && $('#embedBox')) $('#embedBox').innerHTML = embedHtml(e); else if ($('#embedMsg')) $('#embedMsg').textContent = '';
    }).catch(err => { if ($('#embedMsg')) $('#embedMsg').textContent = t('noEmbed', { err: err.message }); });
  }
  $('#plates')?.addEventListener('click', () => plateCalc(rec?.weight?.value || 60));
  $('#vdel')?.addEventListener('click', async () => {
    if (!confirm(t('removeVideoConfirm'))) return;
    await api(`/videos/${encodeURIComponent(ex.id)}`, { method: 'DELETE' }); toast(t('videoRemoved')); render.keepScroll = true; render();
  });
  $('#cedit')?.addEventListener('click', () => customForm(ex));
  $('#cdel')?.addEventListener('click', async () => {
    if (!confirm(t('removeCustomConfirm', { name: ex.name }))) return;
    await api(`/custom-exercises/${encodeURIComponent(ex.id)}`, { method: 'DELETE' }); toast(t('removed')); location.hash = '#/ovningar';
  });
  $('#addToProg').onclick = () => addToProgram(ex);
  $('#vpick') && ($('#vpick').onclick = () => {
    const d = modal(`<h3>${t('chooseVideo')}</h3><p class="muted small">${t('chooseVideoHint')}</p>
      <input type="url" id="vurl" placeholder="https://www.youtube.com/watch?v=…" value="${ex.embed?.custom ? `https://youtu.be/${esc(ex.embed.videoId)}` : ''}">
      <div class="wizard-nav">${ex.embed ? `<button class="btn ghost" id="vreset">${t('findNew')}</button>` : `<button class="btn ghost" data-close>${t('cancel')}</button>`}<button class="btn" id="vok">${t('save')}</button></div>`);
    $('#vok', d).onclick = async () => { try { await api(`/exercises/${encodeURIComponent(ex.id)}/embed`, { method: 'PUT', body: { url: $('#vurl', d).value } }); d.close(); render(); } catch (err) { toast(err.message); } };
    $('#vreset', d)?.addEventListener('click', async () => { await api(`/exercises/${encodeURIComponent(ex.id)}/embed`, { method: 'PUT', body: { url: '' } }); d.close(); render(); });
  });
  $('#vdl')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    btn.disabled = true; $('#vstatus').textContent = t('videoDownloading'); $('#vstatus').style.color = '';
    try { await api('/videos/download', { method: 'POST', body: { scope: 'one', id: ex.id } }); } catch (err) { $('#vstatus').textContent = err.message; btn.disabled = false; return; }
    const poll = setInterval(async () => {
      if (!location.hash.startsWith('#/ovning/')) return clearInterval(poll);
      const st = await api('/videos');
      if (!st.job.running) {
        clearInterval(poll);
        const info = await api(`/exercises/${encodeURIComponent(ex.id)}`);
        if (info.video) { toast(t('videoReady')); render(); }
        else { $('#vstatus').textContent = t('videoFailed', { err: st.job.error || st.job.lastError || t('unknownError') }); $('#vstatus').style.color = 'var(--danger)'; btn.disabled = false; }
      }
    }, 2500);
  });
  $('#vup')?.addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    $('#vstatus').textContent = t('uploading');
    const r = await fetch(`/api/videos/${encodeURIComponent(ex.id)}/upload`, { method: 'POST', body: f, headers: { 'Content-Type': f.type || 'video/mp4', 'X-Filename': encodeURIComponent(f.name) } });
    if (r.ok) render(); else $('#vstatus').textContent = (await r.json().catch(() => ({}))).error || t('error');
  });
};
// Utveckling för en övning: uppskattat 1RM (eller tid/reps) över tid
function progressBlock(points) {
  const key = points.some(p => p.e1rm > 0) ? 'e1rm' : points.some(p => p.seconds > 0) ? 'seconds' : 'reps';
  const unit = key === 'seconds' ? 's' : key === 'reps' ? t('reps') : 'kg';
  const pts = points.filter(p => p[key] > 0);
  if (!pts.length) return '';
  const now = pts.at(-1)[key], first = pts[0][key], best = Math.max(...pts.map(p => p[key])), diff = now - first;
  return `<div class="card"><div class="row"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('trend')}</span><div class="grow"><div class="muted small">${t(key === 'e1rm' ? 'estimated1rm' : key === 'seconds' ? 'longest' : 'mostReps')}</div>
    <b style="font-size:1.4rem">${fmt(now)} ${unit}</b>${pts.length > 1 && diff ? ` <span class="pill ${diff > 0 ? 'ok' : 'warn'}">${diff > 0 ? '+' : ''}${fmt(diff)} ${unit}</span>` : ''}</div>
    ${best > now ? `<div class="muted small" style="text-align:right">${t('bestEver')}<br><b>${fmt(best)} ${unit}</b></div>` : ''}</div>
    ${pts.length > 1 ? `<p class="muted small">${t('sinceFirst', { date: dateFmt(pts[0].date, { day: 'numeric', month: 'short', year: 'numeric' }) })}</p>` : ''}
    ${lineChart(pts, key, unit)}${key === 'e1rm' ? `<p class="muted small" style="margin-bottom:0">${t('e1rmExplain')}</p>` : ''}</div>`;
}
// Lägg till en övning sist i ett pass i det aktiva schemat
async function addToProgram(ex) {
  const { active } = await activeProgram();
  if (!active) return toast(t('noProgram'));
  const d = modal(`<h3>${t('addToProgram')}</h3><p class="muted small">${t('addToProgramHint', { name: esc(ex.name), program: esc(tplName(active.name)) })}</p>
    ${active.plan.templates.map((tp, i) => `<button class="card link block" data-tpl="${i}" style="width:100%;text-align:left;font:inherit;cursor:pointer;margin:8px 0 0"><b>${esc(tplName(tp.name))}</b><div class="muted small">${t('exercisesCount', { n: tp.items.length })}</div></button>`).join('')}
    <button class="btn ghost block" data-close style="margin-top:12px">${t('cancel')}</button>`);
  d.querySelectorAll('[data-tpl]').forEach(b => b.onclick = async () => {
    await api(`/programs/${active.id}/add`, { method: 'POST', body: { t: Number(b.dataset.tpl), exerciseId: ex.id } });
    d.close(); toast(t('addedToProgram', { name: tplName(active.plan.templates[b.dataset.tpl].name) }));
  });
}
// Skapa eller ändra en egen övning
const EQUIP_KEYS = ['body only', 'dumbbell', 'barbell', 'e-z curl bar', 'kettlebells', 'cable', 'machine', 'bands', 'medicine ball', 'exercise ball', 'other'];
function customForm(ex) {
  const M = t('muscles');
  const mus = Object.keys(M).sort((a, b) => M[a].localeCompare(M[b], L.locale));
  const chk = (name, list) => `<div class="choices" style="grid-template-columns:repeat(2,1fr)">${mus.map(m => `<div class="choice"><input type="checkbox" name="${name}" id="${name}-${m.replace(' ', '_')}" value="${m}" ${list?.includes(m) ? 'checked' : ''}><label for="${name}-${m.replace(' ', '_')}" style="min-height:40px">${esc(M[m])}</label></div>`).join('')}</div>`;
  const d = modal(`<h3>${ex ? t('editCustom') : t('newCustom')}</h3>
    <form id="cform" class="stack" style="margin-top:12px">
      <div><label class="field" for="cname">${t('name')}</label><input type="text" id="cname" maxlength="80" required value="${esc(ex?.name || '')}"></div>
      <div class="row"><div class="grow"><label class="field" for="cequip">${t('equipmentLabel')}</label><select id="cequip">${EQUIP_KEYS.map(k => `<option value="${k}" ${(ex?.equipment || 'body only') === k ? 'selected' : ''}>${esc(equip(k))}</option>`).join('')}</select></div>
        <div class="grow"><label class="field" for="clevel">${t('levelLabel')}</label><select id="clevel">${['beginner', 'intermediate', 'expert'].map(k => `<option value="${k}" ${(ex?.level || 'beginner') === k ? 'selected' : ''}>${esc(t('levelDb')[k] || k)}</option>`).join('')}</select></div></div>
      <div><label class="field">${t('primary')}</label>${chk('cprim', ex?.primaryMuscles)}</div>
      <details class="mob"><summary class="small">${t('secondary')}</summary>${chk('csec', ex?.secondaryMuscles)}</details>
      <div class="setting" style="border-top:0"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('clock')}</span><div class="grow"><b>${t('measureTime')}</b><div class="muted small">${t('customTimedHint')}</div></div><label class="switch"><input type="checkbox" id="ctimed" ${ex?.timed ? 'checked' : ''}><span></span></label></div>
      <div><label class="field" for="cinstr">${t('howTo')}</label><textarea id="cinstr" rows="4" placeholder="${t('customInstrHint')}">${esc((ex?.instructions || []).join('\n'))}</textarea></div>
      <div><label class="field" for="cvideo">${t('customVideo')}</label><input type="url" id="cvideo" placeholder="https://www.youtube.com/watch?v=…" value="${ex?.embed?.custom ? `https://youtu.be/${esc(ex.embed.videoId)}` : ''}"></div>
      <div class="wizard-nav"><button type="button" class="btn ghost" data-close>${t('cancel')}</button><button class="btn">${t('save')}</button></div>
    </form>`);
  $('#cform', d).onsubmit = async e => {
    e.preventDefault();
    const vals = n => [...d.querySelectorAll(`input[name=${n}]:checked`)].map(i => i.value);
    const body = { name: $('#cname', d).value, equipment: $('#cequip', d).value, level: $('#clevel', d).value, primaryMuscles: vals('cprim'), secondaryMuscles: vals('csec'), timed: $('#ctimed', d).checked, instructions: $('#cinstr', d).value, videoUrl: $('#cvideo', d).value.trim() };
    if (!body.primaryMuscles.length) return toast(t('pickMuscle'));
    try {
      const out = await api(ex ? `/custom-exercises/${encodeURIComponent(ex.id)}` : '/custom-exercises', { method: ex ? 'PUT' : 'POST', body });
      d.close(); toast(t('saved'));
      if (ex) { render.keepScroll = true; render(); } else location.hash = `#/ovning/${encodeURIComponent(out.id)}`;
    } catch (err) { toast(err.message); }
  };
}
function embedHtml(e) {
  return `<div class="player embed"><iframe src="${ytEmbed(e.videoId)}" title="${esc(e.title || 'YouTube')}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    ${e.title ? `<p class="muted small">${esc(e.title)}</p>` : ''}`;
}

// ---------- Övningsbibliotek ----------
views.ovningar = async () => {
  setTab('library');
  const state = { q: '', muscle: '', equipment: '', custom: false, ...(store.get('libFilter') || {}) };
  const M = t('muscles'), E = t('equipDb');
  app.innerHTML = `
    <h1>${t('tabs.library')}</h1>
    <div class="card stack">
      <input type="search" id="q" placeholder="${t('searchPlaceholder')}" value="${esc(state.q)}">
      <div class="row"><select id="m"><option value="">${t('allMuscles')}</option>${Object.entries(M).sort((a, b) => a[1].localeCompare(b[1], L.locale)).map(([k, v]) => `<option value="${k}" ${state.muscle === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="e"><option value="">${t('allEquipment')}</option>${Object.entries(E).map(([k, v]) => `<option value="${k}" ${state.equipment === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="row" style="gap:8px">${`<div class="seg grow" id="libSeg"><button type="button" data-v="0" class="${state.custom ? '' : 'on'}">${t('allExercises')}</button><button type="button" data-v="1" class="${state.custom ? 'on' : ''}">${t('myExercises')}</button></div>`}
        <button class="btn secondary sm" id="newCustom">${icon('plus', 'sm')}${t('newCustomShort')}</button></div>
    </div>
    <div class="card" id="list"></div>`;
  let tm;
  const load = async () => {
    state.q = $('#q').value; state.muscle = $('#m').value; state.equipment = $('#e').value; store.set('libFilter', state);
    const list = await api(`/exercises?q=${encodeURIComponent(state.q)}&muscle=${encodeURIComponent(state.muscle)}&equipment=${encodeURIComponent(state.equipment)}${state.custom ? '&custom=1' : ''}`);
    $('#list').innerHTML = list.length ? list.map(a => `<a class="ex-row" href="#/ovning/${encodeURIComponent(a.id)}" style="color:inherit;text-decoration:none">${a.images?.length ? `${thumb(a)}` : `<span class="thumb icon-thumb">${icon('dumbbell')}</span>`}<div class="grow"><b>${esc(exName(a))}</b><div class="muted small">${a.custom ? `${t('customTag')} · ` : ''}${esc(equip(a.equipment || ''))} · ${a.primaryMuscles.map(muscle).join(', ')}</div></div>${a.video ? `<span class="pill ok" title="${t('savedOnServer')}">${icon('video', 'sm')}</span>` : ''}</a>`).join('')
      : state.custom ? `<p class="muted">${t('noCustom')}</p>` : `<p class="muted">${t('noHits')}</p>`;
  };
  app.querySelectorAll('#libSeg button').forEach(b => b.onclick = () => { state.custom = b.dataset.v === '1'; app.querySelectorAll('#libSeg button').forEach(x => x.classList.toggle('on', x === b)); load(); });
  $('#newCustom').onclick = () => customForm(null);
  $('#q').oninput = () => { clearTimeout(tm); tm = setTimeout(load, 250); };
  $('#m').onchange = $('#e').onchange = load;
  load();
};

// ---------- Statistik ----------
function lineChart(points, key, unit, emptyMsg) {
  if (points.length < 2) return `<p class="muted small">${emptyMsg || t('twoSessions')}</p>`;
  const W = 320, H = 150, P = 30;
  const vals = points.map(p => p[key]);
  const min = Math.min(...vals) * 0.95, max = Math.max(...vals) * 1.05 || 1;
  const x = i => P + (i * (W - P - 8)) / (points.length - 1);
  const y = v => H - 20 - ((v - min) / (max - min || 1)) * (H - 36);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    ${[min, (min + max) / 2, max].map(v => `<line class="grid" x1="${P}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}"/><text x="0" y="${y(v) + 3}">${Math.round(v)}</text>`).join('')}
    <path class="area" d="${d} L${x(points.length - 1)},${H - 20} L${x(0)},${H - 20} Z"/>
    <path class="line" d="${d}"/>${points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p[key])}" r="3.5"><title>${p.date}: ${fmt(p[key])} ${unit}</title></circle>`).join('')}
    <text x="${P}" y="${H - 4}">${dateFmt(points[0].date, { day: 'numeric', month: 'short' })}</text><text x="${W - 8}" y="${H - 4}" text-anchor="end">${dateFmt(points.at(-1).date, { day: 'numeric', month: 'short' })}</text>
  </svg>`;
}
function barChart(weeks) {
  if (!weeks.length) return `<p class="muted small">${t('noFinished')}</p>`;
  const data = weeks.slice(-12), W = 320, H = 130, max = Math.max(...data.map(w => w.sessions), 1);
  const bw = (W - 10) / data.length, ph = H - 34;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    ${data.map((w, i) => {
      const hs = (w.strength / max) * ph, hc = (w.cardio / max) * ph, x0 = 5 + i * bw + 3, top = H - 18 - hs - hc;
      return `<rect class="bar" x="${x0}" y="${H - 18 - hs}" width="${bw - 6}" height="${hs}" rx="3"/><rect class="bar2" x="${x0}" y="${top}" width="${bw - 6}" height="${hc}" rx="3"/>
        <text x="${5 + i * bw + bw / 2}" y="${top - 4}" text-anchor="middle">${w.sessions}</text><title>${t('week')} ${w.week}: ${w.strength} + ${w.cardio}</title>`;
    }).join('')}
    <text x="5" y="${H - 4}">${dateFmt(data[0].week, { day: 'numeric', month: 'short' })}</text><text x="${W - 5}" y="${H - 4}" text-anchor="end">${dateFmt(data.at(-1).week, { day: 'numeric', month: 'short' })}</text>
  </svg><div class="legend"><span><i style="background:var(--brand)"></i>${t('strength')}</span><span><i style="background:var(--ok)"></i>${t('cardio')}</span></div>`;
}
function bmiInfo(bmi) {
  const cat = bmi < 18.5 ? 'under' : bmi < 25 ? 'normal' : bmi < 30 ? 'over' : 'obese';
  const pos = Math.min(100, Math.max(0, (bmi - 15) / (35 - 15) * 100));
  return { cat, pos };
}
function bmiBlock(u) {
  if (!u.height_cm) return `<p class="muted small">${t('bmiNeedsHeight')} <a href="#/installningar">${t('settings')}</a></p>`;
  if (!u.bmi) return `<p class="muted small">${t('bmiNeedsWeight')}</p>`;
  const { cat, pos } = bmiInfo(u.bmi);
  return `<div class="row between"><div><div class="eyebrow">${t('bmi')}</div><b style="font-size:1.6rem">${fmt(u.bmi)}</b> <span class="pill ${cat === 'normal' ? 'ok' : 'warn'}">${t('bmiCat')[cat]}</span></div>
    <div class="muted small" style="text-align:right">${fmt(u.weight)} kg<br>${fmt(u.height_cm, 0)} cm</div></div>
    <div class="bmi-scale"><i style="left:${pos}%"></i></div>
    <div class="row between muted small"><span>18,5</span><span>25</span><span>30</span></div>
    <p class="muted small">${t('bmiNote')}</p>`;
}
views.statistik = async (section) => {
  setTab('stats');
  const [st, bw, ms, mus, { active }] = await Promise.all([api(`/users/${user.id}/stats`), api(`/users/${user.id}/bodyweight`), api(`/users/${user.id}/measurements`), api(`/users/${user.id}/muscles`).catch(() => null), activeProgram().catch(() => ({})), refreshUser()]);
  const sel = store.get('statEx') && st.exercises.find(e => e.exercise.id === store.get('statEx')) ? store.get('statEx') : st.exercises[0]?.exercise.id;
  app.innerHTML = `
    <h1>${t('tabs.stats')}</h1>
    <div class="stats">
      <div class="stat"><b>${st.totalSessions}</b><span>${t('totalWorkouts')}</span></div>
      <div class="stat"><b>${st.weekStreak}</b><span>${t('weekStreak')}</span></div>
      <div class="stat"><b>${fmt(st.totalVolume / 1000)} t</b><span>${t('totalLifted')}</span></div>
      <div class="stat"><b>${fmt(st.cardioMinutes / 60)} h</b><span>${t('cardioTotal')}</span></div>
    </div>
    <h2>${t('monthReport')}</h2><div class="card" id="reportCard"></div>
    <h2 id="muskler">${t('muscleMap')}</h2><div class="card" id="muscleCard"></div>
    <h2>${t('perWeekChart')}</h2><div class="card">${barChart(st.weeks)}</div>
    <h2>${t('progressPerExercise')}</h2>
    <div class="card">
      ${st.exercises.length ? `<select id="exSel">${st.exercises.map(e => `<option value="${esc(e.exercise.id)}" ${e.exercise.id === sel ? 'selected' : ''}>${esc(exName(e.exercise))}</option>`).join('')}</select><div id="exChart" style="margin-top:12px"></div>` : `<p class="muted">${t('logToSee')}</p>`}
    </div>
    <h2>${t('records')}</h2>
    <div class="card">${st.exercises.length ? st.exercises.slice(0, 12).map(e => `<a class="ex-row" href="#/ovning/${encodeURIComponent(e.exercise.id)}" style="color:inherit;text-decoration:none"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('trophy')}</span><div class="grow"><b>${esc(exName(e.exercise))}</b><div class="muted small">${e.bestSeconds ? `${t('longest')}: ${e.bestSeconds} s` : e.bestWeight > 0 ? `${t('heaviest')}: ${fmt(e.bestWeight)} kg · ${t('estimated1rm')}: ${fmt(e.bestE1rm)} kg` : `${t('mostReps')}: ${e.bestReps}`}</div></div><span class="muted small">${(e.bestSecondsDate || e.bestWeightDate) ? dateFmt(e.bestSecondsDate || e.bestWeightDate, { day: 'numeric', month: 'short' }) : ''}</span></a>`).join('') : `<p class="muted">${t('noRecords')}</p>`}</div>
    ${st.cardioByType.length ? `<h2>${t('cardioStats')}</h2><div class="card">${st.cardioByType.map(c => `<div class="ex-row"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('heart')}</span><div class="grow"><b>${esc(cardioName(c.type))}</b><div class="muted small">${c.sessions} ${t('sessionsShort')} · ${fmt(c.minutes, 0)} ${t('min')}${c.km ? ` · ${fmt(c.km)} ${t('km')}` : ''}</div></div></div>`).join('')}</div>` : ''}
    <h2>${t('bodyAndBmi')}</h2>
    <div class="card">
      ${bmiBlock(user)}
      <hr class="divider">
      ${lineChart(bw.map(b => ({ date: b.date, weight: b.weight })), 'weight', 'kg', t('twoDays'))}
      <form id="bwForm" class="row" style="margin-top:12px"><input type="number" name="w" step="0.1" min="20" max="400" inputmode="decimal" placeholder="${t('weightToday')}" required><button class="btn">${t('save')}</button></form>
    </div>
    <h2>${t('measurements')}</h2>
    <div class="card" id="measCard"></div>
    <a class="btn ghost block" href="/api/users/${user.id}/export.csv" download>${icon('download', 'sm')}${t('export')}</a>`;
  drawMeasurements(ms);
  drawReport(store.get('reportMonth'));
  if (mus) drawMuscles(mus, active);
  if (section === 'muskler') setTimeout(() => $('#muskler')?.scrollIntoView({ block: 'start' }), 50);
  const drawEx = () => {
    const id = $('#exSel').value; store.set('statEx', id);
    const e = st.exercises.find(x => x.exercise.id === id);
    const timed = e.points.some(p => p.seconds > 0);
    const hasWeight = e.points.some(p => p.e1rm > 0);
    const pts = e.points.map(p => ({ ...p, e1rm: Math.round(p.e1rm * 10) / 10 }));
    const mode = hasWeight && store.get('statMode') === 'weight' ? 'weight' : 'e1rm';
    const key = timed ? 'seconds' : mode, vals = pts.filter(p => p[key] > 0);
    const head = vals.length ? `<div class="row between" style="margin-bottom:6px"><div><b style="font-size:1.3rem">${fmt(vals.at(-1)[key])} ${timed ? 's' : 'kg'}</b>${vals.length > 1 && vals.at(-1)[key] !== vals[0][key] ? ` <span class="pill ${vals.at(-1)[key] > vals[0][key] ? 'ok' : 'warn'}">${vals.at(-1)[key] > vals[0][key] ? '+' : ''}${fmt(vals.at(-1)[key] - vals[0][key])}</span>` : ''}</div>
      ${hasWeight && !timed ? `<div class="seg" id="modeSeg" style="width:auto"><button type="button" data-v="e1rm" class="${mode === 'e1rm' ? 'on' : ''}">1RM</button><button type="button" data-v="weight" class="${mode === 'weight' ? 'on' : ''}">${t('heaviestShort')}</button></div>` : ''}</div>` : '';
    $('#exChart').innerHTML = timed ? `${head}<p class="muted small" style="margin-top:0">${t('secondsLabel')}</p>${lineChart(vals, 'seconds', 's')}`
      : hasWeight ? `${head}<p class="muted small" style="margin-top:0">${mode === 'e1rm' ? t('e1rmLabel') : t('heaviestLabel')}</p>${lineChart(vals, key, 'kg')}` : `<p class="muted small" style="margin-top:0">${t('noWeight')}</p>`;
    $('#exChart').querySelectorAll('#modeSeg button').forEach(b => b.onclick = () => { store.set('statMode', b.dataset.v); drawEx(); });
  };
  if ($('#exSel')) { $('#exSel').onchange = drawEx; drawEx(); }
  $('#bwForm').onsubmit = async ev => { ev.preventDefault(); user = await api(`/users/${user.id}/bodyweight`, { method: 'POST', body: { weight: ev.target.w.value } }); store.set('user', user); toast(t('saved')); render.keepScroll = true; render(); };
};

// ---------- Månadsrapport ----------
async function drawReport(month) {
  const card = $('#reportCard'); if (!card) return;
  const r = await api(`/users/${user.id}/report${month ? `?month=${month}` : ''}`).catch(() => null);
  if (!r || !$('#reportCard')) return;
  const idx = r.months.indexOf(r.month);
  const mName = m => new Date(m + '-15T12:00:00').toLocaleDateString(L.locale, { month: 'long', year: 'numeric' });
  const delta = (a, b, unit = '') => b ? `<small class="${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${fmt(Math.abs(a - b), 1)}${unit}</small>` : '';
  const prVal = p => p.type === 'seconds' ? `${p.value} s` : p.type === 'reps' ? `${p.value} ${t('reps')}` : `${fmt(p.value)} kg`;
  const signed = v => `${v > 0 ? '+' : ''}${fmt(v)}`;
  card.innerHTML = `
    <div class="row between"><button class="btn ghost sm ic" id="rPrev" ${idx > 0 ? '' : 'disabled'} aria-label="${t('prevMonth')}">${icon('arrow', 'sm')}</button>
      <b style="text-transform:capitalize">${esc(mName(r.month))}</b>
      <button class="btn ghost sm ic" id="rNext" ${idx < r.months.length - 1 ? '' : 'disabled'} aria-label="${t('nextMonth')}" style="transform:scaleX(-1)">${icon('arrow', 'sm')}</button></div>
    ${r.sessions ? `<div class="stats report" style="margin-top:12px">
      <div class="stat"><b>${r.sessions}</b><span>${t('rWorkouts', { s: r.strength, c: r.cardio })}</span>${delta(r.sessions, r.previous.sessions)}</div>
      <div class="stat"><b>${fmt(r.volume / 1000)} t</b><span>${t('totalLifted')}</span>${delta(r.volume / 1000, r.previous.volume / 1000, ' t')}</div>
      <div class="stat"><b>${fmt(r.minutes / 60)} h</b><span>${t('rTime', { d: r.days })}</span>${delta(r.minutes / 60, r.previous.minutes / 60, ' h')}</div>
      <div class="stat"><b>${r.prs.length}</b><span>${t('rRecords')}</span></div>
    </div>
    ${r.weight || Object.keys(r.measures).length ? `<div class="row wrap" style="margin-top:12px;gap:6px">${r.weight ? `<span class="pill ${r.weight.change <= 0 ? 'ok' : 'neutral'}">${t('weight').split(' (')[0]} ${signed(r.weight.change)} kg</span>` : ''}${Object.entries(r.measures).map(([k, v]) => `<span class="pill neutral">${esc(t('measureTypes')[k])} ${signed(v.change)} ${mUnit(k)}</span>`).join('')}</div>` : ''}
    ${r.cardio ? `<p class="small" style="margin:12px 0 0">${icon('heart', 'sm')} ${t('rCardio', { n: r.cardio, min: fmt(r.cardioMinutes, 0) })}${r.km ? ` · ${fmt(r.km)} ${t('km')}` : ''}</p>` : ''}
    ${r.prs.length ? `<hr class="divider"><div class="eyebrow">${t('rNewRecords')}</div>${r.prs.slice(0, 8).map(p => `<div class="ex-row" style="padding:6px 0">${icon('trophy', 'sm')}<div class="grow small"><b>${esc(exName(p.exercise))}</b> · ${t('prType')[p.type]} ${esc(prVal(p))}</div><span class="muted small">${dateFmt(p.date, { day: 'numeric', month: 'short' })}</span></div>`).join('')}${r.prs.length > 8 ? `<p class="muted small">${t('andMore', { n: r.prs.length - 8 })}</p>` : ''}` : ''}
    ${r.topExercises.length ? `<hr class="divider"><div class="eyebrow">${t('rTop')}</div><p class="small" style="margin:4px 0 0">${r.topExercises.map(x => `${esc(exName(x.exercise))} (${x.sets})`).join(', ')}</p>` : ''}`
    : `<p class="muted small" style="margin-bottom:0">${t('rEmpty')}</p>`}`;
  $('#rPrev').onclick = () => { store.set('reportMonth', r.months[idx - 1]); drawReport(r.months[idx - 1]); };
  $('#rNext').onclick = () => { store.set('reportMonth', r.months[idx + 1]); drawReport(r.months[idx + 1]); };
}

// ---------- Muskelkarta ----------
// Förenklad kropp framifrån och bakifrån. Varje form hör till en muskel i övningsdatabasen.
const BODY_FRONT = [
  ['shoulders', 'e', 29, 44, 7, 6], ['shoulders', 'e', 71, 44, 7, 6],
  ['chest', 'e', 41, 54, 9.5, 7], ['chest', 'e', 59, 54, 9.5, 7],
  ['biceps', 'e', 25, 62, 4.5, 9], ['biceps', 'e', 75, 62, 4.5, 9],
  ['forearms', 'e', 21, 84, 4, 10], ['forearms', 'e', 79, 84, 4, 10],
  ['abdominals', 'r', 42, 63, 16, 30, 5],
  ['abductors', 'e', 34, 104, 4, 7], ['abductors', 'e', 66, 104, 4, 7],
  ['adductors', 'e', 46.5, 116, 3.5, 11], ['adductors', 'e', 53.5, 116, 3.5, 11],
  ['quadriceps', 'e', 39.5, 126, 6.5, 19], ['quadriceps', 'e', 60.5, 126, 6.5, 19],
  ['calves', 'e', 40, 166, 4.5, 12], ['calves', 'e', 60, 166, 4.5, 12],
  ['neck', 'r', 46, 25, 8, 7, 3],
];
const BODY_BACK = [
  ['traps', 'p', 'M50 27 L62 38 L56 50 L50 54 L44 50 L38 38 Z'],
  ['shoulders', 'e', 29, 44, 7, 6], ['shoulders', 'e', 71, 44, 7, 6],
  ['middle back', 'r', 43, 52, 14, 14, 3],
  ['lats', 'p', 'M36 50 L43 54 L44 76 L38 72 Q34 62 36 50 Z'], ['lats', 'p', 'M64 50 L57 54 L56 76 L62 72 Q66 62 64 50 Z'],
  ['lower back', 'r', 43, 72, 14, 18, 4],
  ['triceps', 'e', 25, 62, 4.5, 9], ['triceps', 'e', 75, 62, 4.5, 9],
  ['forearms', 'e', 21, 84, 4, 10], ['forearms', 'e', 79, 84, 4, 10],
  ['glutes', 'e', 42, 103, 8.5, 9], ['glutes', 'e', 58, 103, 8.5, 9],
  ['hamstrings', 'e', 40, 130, 6.5, 17], ['hamstrings', 'e', 60, 130, 6.5, 17],
  ['calves', 'e', 40, 165, 5.5, 13], ['calves', 'e', 60, 165, 5.5, 13],
];
function bodySvg(shapes, fill, label) {
  const base = `<circle cx="50" cy="14" r="9"/><rect x="45" y="21" width="10" height="10" rx="3"/><rect x="31" y="34" width="38" height="64" rx="12"/>
    <rect x="18" y="38" width="12" height="58" rx="6"/><rect x="70" y="38" width="12" height="58" rx="6"/><rect x="31" y="92" width="18" height="90" rx="8"/><rect x="51" y="92" width="18" height="90" rx="8"/>`;
  const sh = ([m, kind, ...a]) => {
    const attrs = `class="mus" fill="${fill(m)}" data-mus="${m}"`;
    const title = `<title>${esc(muscle(m))}</title>`;
    if (kind === 'e') return `<ellipse cx="${a[0]}" cy="${a[1]}" rx="${a[2]}" ry="${a[3]}" ${attrs}>${title}</ellipse>`;
    if (kind === 'r') return `<rect x="${a[0]}" y="${a[1]}" width="${a[2]}" height="${a[3]}" rx="${a[4]}" ${attrs}>${title}</rect>`;
    return `<path d="${a[0]}" ${attrs}>${title}</path>`;
  };
  return `<figure><svg viewBox="8 0 84 186" class="bodymap" role="img" aria-label="${esc(label)}"><g class="silhouette">${base}</g>${shapes.map(sh).join('')}</svg><figcaption>${esc(label)}</figcaption></figure>`;
}
function drawMuscles(mus, active) {
  const card = $('#muscleCard'); if (!card) return;
  const mode = store.get('muscleMode') === 'recovery' ? 'recovery' : 'week';
  const M = mus.muscles;
  const wk = s => s >= 10 ? 'var(--brand)' : s >= 5 ? 'color-mix(in srgb, var(--brand) 65%, var(--surface-2))' : s > 0 ? 'color-mix(in srgb, var(--brand) 35%, var(--surface-2))' : 'var(--line)';
  const rc = m => !M[m]?.last ? 'var(--line)' : M[m].recovery >= 100 ? 'var(--ok)' : M[m].recovery >= 50 ? 'var(--warn)' : 'var(--danger)';
  const fill = m => mode === 'week' ? wk(M[m]?.week || 0) : rc(m);
  // Muskler som schemat tränar men som inte fått något den här veckan
  const planned = [...new Set((active?.plan?.templates || []).flatMap(tp => tp.items.flatMap(i => i.exercise?.primaryMuscles || [])))];
  const missed = planned.filter(m => !(M[m]?.week > 0));
  const tired = Object.entries(M).filter(([, v]) => v.last && v.recovery < 100).sort((a, b) => a[1].recovery - b[1].recovery);
  card.innerHTML = `
    <div class="seg" id="musSeg"><button type="button" data-v="week" class="${mode === 'week' ? 'on' : ''}">${t('thisWeek')}</button><button type="button" data-v="recovery" class="${mode === 'recovery' ? 'on' : ''}">${t('recovery')}</button></div>
    <div class="bodymaps">${bodySvg(BODY_FRONT, fill, t('frontView'))}${bodySvg(BODY_BACK, fill, t('backView'))}</div>
    ${mode === 'week' ? `<div class="legend"><span><i style="background:var(--line)"></i>0</span><span><i style="background:${wk(1)}"></i>1–4 ${t('sets')}</span><span><i style="background:${wk(5)}"></i>5–9</span><span><i style="background:var(--brand)"></i>10+</span></div>
      ${missed.length ? `<p class="small" style="margin-bottom:0"><b>${t('missedThisWeek')}:</b> ${missed.map(muscle).join(', ')}</p>` : planned.length ? `<p class="small" style="margin-bottom:0;color:var(--ok)">${icon('check', 'sm')} ${t('allTrained')}</p>` : ''}`
    : `<div class="legend"><span><i style="background:var(--ok)"></i>${t('recovered')}</span><span><i style="background:var(--warn)"></i>${t('halfway')}</span><span><i style="background:var(--danger)"></i>${t('needsRest')}</span></div>
      ${tired.length ? tired.map(([m, v]) => `<div class="ex-row" style="padding:6px 0"><div class="grow small"><b>${esc(muscle(m))}</b><div class="muted">${t('readyAt', { when: new Date(v.readyAt).toLocaleString(L.locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) })}</div></div><div class="progress" style="width:90px"><i style="width:${v.recovery}%;background:${rc(m)}"></i></div></div>`).join('') : `<p class="small" style="margin-bottom:0;color:var(--ok)">${icon('check', 'sm')} ${t('allRecovered')}</p>`}
      ${mus.advice && mus.advice.type !== 'ok' ? `<p class="muted small">${esc(mus.advice.type === 'rest' ? t('adviceRest', { n: mus.advice.days }) : mus.advice.type === 'cardio' ? t('adviceCardio', { m: mus.advice.muscles.slice(0, 4).map(muscle).join(', ').toLowerCase() }) : t('advicePartial', { m: mus.advice.muscles.slice(0, 4).map(muscle).join(', ').toLowerCase() }))}</p>` : ''}
      <p class="muted small" style="margin-bottom:0">${t('recoveryNote')}</p>`}`;
  card.querySelectorAll('#musSeg button').forEach(b => b.onclick = () => { store.set('muscleMode', b.dataset.v); drawMuscles(mus, active); });
}

// ---------- Kroppsmått ----------
const MEASURES = ['waist', 'chest', 'hips', 'arm', 'thigh', 'calf', 'neck', 'bodyfat'];
const mUnit = k => k === 'bodyfat' ? '%' : 'cm';
function drawMeasurements(ms) {
  const card = $('#measCard'); if (!card) return;
  const has = MEASURES.filter(k => ms.some(m => m.type === k));
  let sel = store.get('measSel');
  if (!has.includes(sel)) sel = has[0];
  const latest = k => ms.filter(m => m.type === k).at(-1);
  card.innerHTML = `
    ${has.length ? `<div class="stats" style="grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">${has.map(k => { const l = latest(k), first = ms.find(m => m.type === k), diff = l.value - first.value; return `<button class="stat meas ${k === sel ? 'on' : ''}" data-m="${k}"><b>${fmt(l.value)} ${mUnit(k)}</b><span>${t('measureTypes')[k]}${diff ? ` · ${diff > 0 ? '+' : ''}${fmt(diff)}` : ''}</span></button>`; }).join('')}</div>
      <div style="margin-top:12px">${lineChart(ms.filter(m => m.type === sel), 'value', mUnit(sel), t('twoDaysMeasure'))}</div><hr class="divider">` : `<p class="muted small" style="margin-top:0">${t('measureEmpty')}</p>`}
    <form id="measForm">
      <div class="meas-grid">${MEASURES.map(k => `<div><label class="field" for="m-${k}">${t('measureTypes')[k]} (${mUnit(k)})</label><input type="number" id="m-${k}" name="${k}" step="0.1" min="1" max="399" inputmode="decimal" placeholder="${latest(k) ? fmt(latest(k).value) : ''}"></div>`).join('')}</div>
      <button class="btn block" style="margin-top:12px">${icon('ruler', 'sm')}${t('saveMeasurements')}</button>
    </form>`;
  card.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { store.set('measSel', b.dataset.m); drawMeasurements(ms); });
  $('#measForm').onsubmit = async e => {
    e.preventDefault();
    const values = Object.fromEntries(MEASURES.map(k => [k, e.target[k].value]).filter(([, v]) => v));
    if (!Object.keys(values).length) return toast(t('measureFillOne'));
    try { const fresh = await api(`/users/${user.id}/measurements`, { method: 'POST', body: { values } }); toast(t('saved')); drawMeasurements(fresh); } catch (err) { toast(err.message); }
  };
}

// ---------- Inställningar ----------
let videoPoll = null;
views.installningar = async () => {
  setTab(null);
  $('#tabbar').hidden = false;
  await refreshUser();
  const health = await api('/health');
  const base = location.origin;
  const seg = (name, opts, cur) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const sw = (name, on) => `<label class="switch"><input type="checkbox" data-pref="${name}" ${on ? 'checked' : ''}><span></span></label>`;
  app.innerHTML = `
    <h1>${t('settings')}</h1>
    <h2>${t('profile')}</h2>
    <form class="card stack" id="profileForm">
      <div><label class="field" for="pn">${t('name')}</label><input type="text" id="pn" value="${esc(user.name)}" maxlength="50"></div>
      <div class="row"><div class="grow"><label class="field" for="ph">${t('height')}</label><input type="number" id="ph" min="80" max="250" inputmode="numeric" value="${user.height_cm ?? ''}"></div>
        <div class="grow"><label class="field" for="pw">${t('weight')}</label><input type="number" id="pw" min="20" max="400" step="0.1" inputmode="decimal" value="${user.weight ?? ''}"></div></div>
      <button class="btn block">${t('save')}</button>
      <div id="bmiBox">${user.bmi ? bmiBlock(user) : ''}</div>
      <div class="row"><a class="btn ghost grow" href="#/profil">${icon('user', 'sm')}${t('switchProfile')}</a><button type="button" class="btn danger" id="delUser">${icon('trash', 'sm')}</button></div>
    </form>
    <h2>${t('appearance')}</h2>
    <div class="card stack">
      <div><label class="field">${t('language')}</label>${seg('lang', [['sv', 'Svenska'], ['en', 'English']], lang)}</div>
      <div><label class="field">${t('theme')}</label>${seg('theme', [['auto', t('themeAuto')], ['light', t('themeLight')], ['dark', t('themeDark')]], store.get('theme') || 'auto')}</div>
    </div>
    <h2>${t('workoutSettings')}</h2>
    <div class="card" style="padding-top:4px;padding-bottom:4px">
      <div class="setting"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('flame')}</span><div class="grow"><b>${t('warmupSetting')}</b><div class="muted small">${t('warmupSettingHint')}</div></div>${sw('warmup', user.prefs.warmup)}</div>
      <div class="setting"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('stretch')}</span><div class="grow"><b>${t('stretchSetting')}</b><div class="muted small">${t('stretchSettingHint')}</div></div>${sw('stretch', user.prefs.stretch)}</div>
      <div class="setting"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('target')}</span><div class="grow"><b>${t('weeklyGoal')}</b><div class="muted small">${t('weeklyGoalHint')}</div></div>
        <select id="goalSel" style="width:auto">${[['', t('goalAuto')], ...Array.from({ length: 14 }, (_, i) => [i + 1, t('perWeek', { n: i + 1 })])].map(([v, l]) => `<option value="${v}" ${String(user.prefs.weekly_goal ?? '') === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="setting"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('sound')}</span><div class="grow"><b>${t('soundSetting')}</b><div class="muted small">${t('soundSettingHint')}</div></div><label class="switch"><input type="checkbox" id="soundSw" ${soundOn() ? 'checked' : ''}><span></span></label></div>
      <div class="setting"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('voice')}</span><div class="grow"><b>${t('voiceCoach')}</b><div class="muted small">${t('voiceCoachHint')}</div></div><label class="switch"><input type="checkbox" id="voiceSw" ${voiceOn() ? 'checked' : ''}><span></span></label></div>
      <div class="setting"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('bell')}</span><div class="grow"><b>${t('notifySetting')}</b><div class="muted small" id="notifyHint">${t('notifySettingHint')}</div></div><label class="switch"><input type="checkbox" id="notifySw" ${store.get('notify') && window.Notification?.permission === 'granted' ? 'checked' : ''}><span></span></label></div>
    </div>
    <h2>${t('videos')}</h2>
    <div class="card stack" id="videoCard"></div>
    <h2>${t('homeAssistant')}</h2>
    <div class="card">
      <div class="row"><span class="thumb icon-thumb" style="width:40px;height:40px">${icon('ha')}</span><p class="grow small" style="margin:0">${t('haText')}</p></div>
      <ol class="instructions small" style="margin-top:12px">
        <li>${t('haStep1')}<pre class="cmd" id="haCmd">curl -fsSL ${base}/ha/install.sh | sh</pre><button class="btn ghost sm" data-copy="haCmd">${icon('copy', 'sm')}${t('copy')}</button></li>
        <li>${t('haStep2')}</li>
        <li>${t('haStep3')}<pre class="cmd" id="haUrl">${base}</pre></li>
        <li>${t('haStep4')}</li>
        <li>${t('haStep5')}</li>
      </ol>
    </div>
    <h2>${t('backup')}</h2>
    <div class="card stack" id="backupCard"></div>
    <h2>${t('about')}</h2>
    <div class="card row"><img src="/icon.svg" alt="" style="width:44px;height:44px"><div class="grow"><b>HomeLift</b><div class="muted small">${t('version', { v: health.version })} · ${t('dataNote')}</div></div></div>`;

  $('#profileForm').onsubmit = async e => {
    e.preventDefault();
    try {
      user = await api(`/users/${user.id}`, { method: 'PATCH', body: { name: $('#pn').value, height_cm: $('#ph').value } });
      if ($('#pw').value && Number($('#pw').value) !== user.weight) user = await api(`/users/${user.id}/bodyweight`, { method: 'POST', body: { weight: $('#pw').value } });
      store.set('user', user); setTab(null); $('#tabbar').hidden = false;
      $('#bmiBox').innerHTML = user.bmi ? bmiBlock(user) : '';
      toast(t('saved'));
    } catch (err) { toast(err.message); }
  };
  $('#delUser').onclick = async () => {
    if (!confirm(t('deleteProfileConfirm', { name: user.name }))) return;
    await api(`/users/${user.id}`, { method: 'DELETE' }); store.del('user'); user = null; location.hash = '#/profil';
  };
  app.querySelectorAll('[data-seg] button').forEach(b => b.onclick = async () => {
    const k = b.closest('[data-seg]').dataset.seg;
    if (k === 'lang') await setLang(b.dataset.v); else setTheme(b.dataset.v);
    render.keepScroll = true; render();
  });
  app.querySelectorAll('[data-pref]').forEach(i => i.onchange = async () => {
    user = await api(`/users/${user.id}`, { method: 'PATCH', body: { prefs: { [i.dataset.pref]: i.checked } } }); store.set('user', user); toast(t('saved'));
  });
  $('#goalSel').onchange = async e => {
    user = await api(`/users/${user.id}`, { method: 'PATCH', body: { prefs: { weekly_goal: e.target.value || null } } }); store.set('user', user); toast(t('saved'));
  };
  $('#soundSw').onchange = e => { store.set('sound', e.target.checked); if (e.target.checked) beep(880, 150); };
  $('#voiceSw').onchange = e => {
    if (e.target.checked && !('speechSynthesis' in window)) { e.target.checked = false; return toast(t('voiceUnsupported')); }
    store.set('voice', e.target.checked); if (e.target.checked) say(t('voiceTest'));
  };
  $('#notifySw').onchange = async e => {
    if (!e.target.checked) { store.set('notify', false); return; }
    if (!('Notification' in window) || !window.isSecureContext) { e.target.checked = false; $('#notifyHint').textContent = t('notifyInsecure'); $('#notifyHint').style.color = 'var(--warn)'; return; }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { e.target.checked = false; $('#notifyHint').textContent = t('notifyDenied'); $('#notifyHint').style.color = 'var(--warn)'; return; }
    store.set('notify', true); toast(t('saved'));
  };
  const drawBackups = async () => {
    const card = $('#backupCard'); if (!card) return;
    const list = await api('/backups').catch(() => []);
    card.innerHTML = `<p class="small" style="margin:0">${t('backupText')}</p>
      <a class="btn secondary block" href="/api/export.json" download>${icon('download', 'sm')}${t('exportJson')}</a>
      <label class="btn ghost block" style="cursor:pointer">${icon('upload', 'sm')}${t('importJson')}<input type="file" accept="application/json,.json" id="impFile" hidden></label>
      <div><div class="row between"><b class="small">${t('nightlyBackups')}</b><button class="btn ghost sm" id="bkNow">${icon('save', 'sm')}${t('backupNow')}</button></div>
        ${list.length ? list.map(b => `<div class="ex-row" style="padding:6px 0"><div class="grow small">${dateFmt(b.name.slice(9, 19), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}<span class="muted"> · ${fmtBytes(b.size)}</span></div><a class="btn ghost sm" href="/api/backups/${encodeURIComponent(b.name)}" download aria-label="${t('download')}">${icon('download', 'sm')}</a></div>`).join('') : `<p class="muted small">${t('noBackups')}</p>`}
        <p class="muted small" style="margin-bottom:0">${t('backupFolder')}</p></div>`;
    $('#bkNow', card).onclick = async () => { await api('/backups', { method: 'POST' }); toast(t('backupDone')); drawBackups(); };
    $('#impFile', card).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      if (!confirm(t('importConfirm'))) { e.target.value = ''; return; }
      const r = await fetch('/api/import', { method: 'POST', body: f, headers: { 'Content-Type': 'application/json' } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { toast(data.error || t('error')); e.target.value = ''; return; }
      toast(t('importDone', { n: data.imported?.sessions ?? 0 }));
      const users = await api('/users');
      user = users.find(u => u.id === user.id) || users[0] || null;
      if (user) store.set('user', user); else store.del('user');
      location.hash = user ? '#/' : '#/profil';
    };
  };
  drawBackups();
  app.querySelectorAll('[data-copy]').forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText($('#' + b.dataset.copy).textContent); toast(t('copied')); }
    catch { const r = document.createRange(); r.selectNodeContents($('#' + b.dataset.copy)); getSelection().removeAllRanges(); getSelection().addRange(r); }
  });

  const drawVideos = async () => {
    const card = $('#videoCard'); if (!card) { clearInterval(videoPoll); videoPoll = null; return; }
    const v = await api('/videos');
    const j = v.job;
    card.innerHTML = `
      <p class="small" style="margin-top:0">${t('videosText')}</p>
      <p class="muted small">${t('videosEmbedText')}</p>
      <p class="small"><b>${t('videosStatus', { count: v.count, size: fmtBytes(v.bytes) })}</b><br><span class="muted">${t('videosProgram', { done: v.programDownloaded, total: v.programExercises })}</span></p>
      ${j.running ? `<div><div class="row between small"><b>${t('downloading', { done: j.done, total: j.total })}</b>${j.failed ? `<span class="muted">${t('downloadFailed', { n: j.failed })}</span>` : ''}</div>
          <div class="progress" style="margin:8px 0"><i style="width:${j.total ? 100 * j.done / j.total : 0}%"></i></div>
          ${j.current ? `<div class="muted small">${t('downloadingNow', { name: esc(j.current) })}</div>` : ''}</div>
          <button class="btn ghost block" id="vstop">${t('stopDownload')}</button>`
        : `${j.error ? `<p class="small" style="color:var(--danger)">${t('downloadError', { err: esc(j.error) })}</p>` : ''}
          ${j.total && !j.error ? `<p class="muted small">${t('downloading', { done: j.done, total: j.total })}${j.failed ? ' · ' + t('downloadFailed', { n: j.failed }) : ''}</p>` : ''}
          ${j.failures?.length && !j.error ? `<details class="mob"><summary class="small">${t('showErrors')}</summary><ul class="mob-list small">${j.failures.map(f => `<li><div><b>${esc(SVN[f.id] || f.name || f.id)}</b><div class="muted">${esc(f.error)}</div></div></li>`).join('')}</ul></details>` : ''}
          <button class="btn secondary block" id="vprog" ${v.programExercises && v.programDownloaded < v.programExercises ? '' : 'disabled'}>${icon('download', 'sm')}${t('downloadProgram', { mb: v.estimateProgramMB })}</button>
          <button class="btn ghost block" id="vall">${icon('download', 'sm')}${t('downloadAll', { n: v.totalExercises, gb: fmt(v.estimateAllGB) })}</button>
          ${v.count ? `<button class="btn danger block" id="vrm">${icon('trash', 'sm')}${t('removeAllVideos')}</button>` : ''}`}`;
    const go = scope => async () => { try { await api('/videos/download', { method: 'POST', body: { scope } }); } catch (e) { toast(e.message); } drawVideos(); };
    $('#vprog', card) && ($('#vprog', card).onclick = go('program'));
    $('#vall', card) && ($('#vall', card).onclick = go('all'));
    $('#vstop', card) && ($('#vstop', card).onclick = async () => { await api('/videos/stop', { method: 'POST' }); drawVideos(); });
    $('#vrm', card) && ($('#vrm', card).onclick = async () => { if (confirm(t('removeAllConfirm'))) { await api('/videos', { method: 'DELETE' }); drawVideos(); } });
    clearInterval(videoPoll); videoPoll = j.running ? setInterval(drawVideos, 3000) : null;
  };
  drawVideos();
};

// ---------- Start ----------
$('#settingsBtn').onclick = () => { location.hash = '#/installningar'; };
drawChrome();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
loadNames().finally(render);
setOffline(false);
if (outbox().length) flushOutbox();

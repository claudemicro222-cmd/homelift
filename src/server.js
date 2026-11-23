'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { generate, alternatives, isTimed, timedScheme, scheme, GROUPS, CARDIO_TYPES } = require('./generator');

const VERSION = require('../package.json').version;
const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'userdata');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMG_CACHE = path.join(DATA_DIR, 'bilder');
const IMG_SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

fs.mkdirSync(IMG_CACHE, { recursive: true });

const exercises = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'exercises.json'), 'utf8'));
const exById = new Map(exercises.map(e => [e.id, e]));
// Svenska namn och instruktioner (data/exercises.sv.json: { id: { name, instructions } })
let exSv = {};
try { exSv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'exercises.sv.json'), 'utf8')); } catch {}
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// ---------- Databas ----------
// v0.1 hette databasen traning.db, flytta den till det nya namnet
if (!fs.existsSync(path.join(DATA_DIR, 'homelift.db')) && fs.existsSync(path.join(DATA_DIR, 'traning.db'))) {
  for (const ext of ['', '-wal', '-shm']) {
    const from = path.join(DATA_DIR, 'traning.db' + ext);
    if (fs.existsSync(from)) fs.renameSync(from, path.join(DATA_DIR, 'homelift.db' + ext));
  }
}
const db = new DatabaseSync(path.join(DATA_DIR, 'homelift.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, settings TEXT NOT NULL, plan TEXT NOT NULL, active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL, template_index INTEGER,
    name TEXT, started_at TEXT DEFAULT (datetime('now')), finished_at TEXT, note TEXT
  );
  CREATE TABLE IF NOT EXISTS set_logs (
    id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL, set_no INTEGER NOT NULL, weight REAL, reps INTEGER,
    logged_at TEXT DEFAULT (datetime('now')), UNIQUE(session_id, exercise_id, set_no)
  );
  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL, UNIQUE(user_id, date, type)
  );
  CREATE TABLE IF NOT EXISTS bodyweight (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, weight REAL NOT NULL, UNIQUE(user_id, date)
  );
`);
// Nya kolumner i v0.2 (läggs till om de saknas)
for (const [table, col] of [
  ['users', 'height_cm REAL'], ['users', "prefs TEXT DEFAULT '{}'"],
  ['sessions', "kind TEXT DEFAULT 'strength'"], ['sessions', 'cardio_type TEXT'],
  ['sessions', 'duration_min REAL'], ['sessions', 'distance_km REAL'],
  ['set_logs', 'seconds INTEGER'],
  // v0.4
  ['set_logs', 'rpe REAL'], ['sessions', 'swaps TEXT'], ['sessions', 'quick INTEGER DEFAULT 0'],
]) {
  const name = col.split(' ')[0];
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col}`);
}

db.exec(`CREATE TABLE IF NOT EXISTS custom_exercises (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, equipment TEXT, category TEXT DEFAULT 'strength', level TEXT DEFAULT 'beginner',
  mechanic TEXT, primary_muscles TEXT NOT NULL DEFAULT '[]', secondary_muscles TEXT NOT NULL DEFAULT '[]',
  instructions TEXT NOT NULL DEFAULT '[]', timed INTEGER DEFAULT 0, deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

const q = (sql) => db.prepare(sql);

// ---------- Egna övningar ----------
// Läggs in i samma lista som övningsdatabasen så att sök, schema och byten fungerar likadant.
const MUSCLES = ['abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps'];
const EQUIPMENTS = ['body only', 'dumbbell', 'barbell', 'e-z curl bar', 'kettlebells', 'cable', 'machine', 'bands', 'medicine ball', 'exercise ball', 'foam roll', 'other'];
const customIds = new Set();
function customRowToEx(r) {
  return {
    id: r.id, name: r.name, equipment: r.equipment || 'body only', category: r.category || 'strength', level: r.level || 'beginner',
    mechanic: r.mechanic || null, force: null, primaryMuscles: JSON.parse(r.primary_muscles), secondaryMuscles: JSON.parse(r.secondary_muscles),
    instructions: JSON.parse(r.instructions), images: [], custom: true, timedCustom: !!r.timed, deleted: !!r.deleted,
  };
}
function loadCustom() {
  for (const id of customIds) { exById.delete(id); const i = exercises.findIndex(e => e.id === id); if (i >= 0) exercises.splice(i, 1); }
  customIds.clear();
  for (const r of q('SELECT * FROM custom_exercises').all()) {
    const ex = customRowToEx(r);
    customIds.add(ex.id); exById.set(ex.id, ex);
    if (!ex.deleted) exercises.push(ex);
  }
}
loadCustom();

// ---------- Hjälpare ----------
function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', ...headers });
  res.end(isJson ? JSON.stringify(body) : body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new HttpError(400, 'Invalid JSON')); } });
    req.on('error', reject);
  });
}
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
function exSummary(id) {
  const e = exById.get(id);
  if (!e) return { id, name: id };
  return { id: e.id, name: e.name, equipment: e.equipment, primaryMuscles: e.primaryMuscles, secondaryMuscles: e.secondaryMuscles, images: e.images, level: e.level, timed: exTimed(e), custom: !!e.custom };
}
function parseProgram(row) {
  if (!row) return null;
  return { ...row, settings: JSON.parse(row.settings), plan: JSON.parse(row.plan), active: !!row.active };
}
const exTimed = isTimed;
function e1rm(weight, reps) { return reps > 0 && weight > 0 ? weight * (1 + reps / 30) : 0; } // Epley
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: process.env.TZ || 'Europe/Stockholm' });
// Veckodag 0 = måndag, i serverns tidszon
function weekday(d = new Date()) {
  const name = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: process.env.TZ || 'Europe/Stockholm' });
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name);
}

function getUser(id) {
  const u = q('SELECT * FROM users WHERE id = ?').get(id);
  if (!u) throw new HttpError(404, 'Profile not found');
  const w = q('SELECT weight, date FROM bodyweight WHERE user_id = ? ORDER BY date DESC LIMIT 1').get(id);
  const bmi = w && u.height_cm ? w.weight / (u.height_cm / 100) ** 2 : null;
  return { id: u.id, name: u.name, created_at: u.created_at, height_cm: u.height_cm, prefs: { warmup: true, stretch: true, weekly_goal: null, media: 'anim', ...JSON.parse(u.prefs || '{}') }, weight: w?.weight ?? null, weight_date: w?.date ?? null, bmi: bmi ? Math.round(bmi * 10) / 10 : null };
}

// Förslag på vikt (eller tid): samma som förra gången, eller ökning om alla set nådde övre gränsen
function suggestion(userId, exerciseId, item) {
  const last = q(`SELECT s.id FROM sessions s JOIN set_logs l ON l.session_id = s.id
    WHERE s.user_id = ? AND l.exercise_id = ? AND s.finished_at IS NOT NULL ORDER BY s.started_at DESC, s.id DESC LIMIT 1`).get(userId, exerciseId);
  if (!last) return null;
  const sets = q('SELECT set_no, weight, reps, seconds, rpe FROM set_logs WHERE session_id = ? AND exercise_id = ? ORDER BY set_no').all(last.id, exerciseId);
  if (!sets.length) return null;
  // Ansträngning (RPE) från förra passet, om minst hälften av seten fick ett betyg
  const rated = sets.filter(x => x.rpe > 0);
  const rpe = rated.length && rated.length * 2 >= sets.length ? rated.reduce((a, x) => a + x.rpe, 0) / rated.length : null;
  const hard = rpe != null && rpe >= 9.5, easy = rpe != null && rpe <= 7;
  if (item?.timed) {
    const allHit = sets.length >= item.sets && sets.every(s => (s.seconds || 0) >= item.secMax);
    return { lastSets: sets, seconds: Math.max(...sets.map(s => s.seconds || 0)) + (allHit ? 10 : 0), increase: allHit, reason: allHit ? 'timeUp' : null };
  }
  const topWeight = Math.max(...sets.map(s => s.weight || 0));
  const allHit = item && sets.length >= item.sets && sets.every(s => (s.reps || 0) >= item.repsMax);
  const topReps = Math.max(...sets.map(s => s.reps || 0));
  // Utan vikt: föreslå fler reps
  if (!topWeight) {
    if (allHit && hard) return { lastSets: sets, rpe, weight: 0, reps: topReps, increase: false, reason: 'rpeHard', repsMax: item?.repsMax };
    return { lastSets: sets, rpe, weight: 0, reps: allHit ? topReps + (easy ? 3 : 2) : Math.min(item?.repsMax || topReps + 1, topReps + (easy ? 2 : 1)), increase: allHit, reason: allHit ? (easy ? 'rpeEasy' : 'repsUp') : easy ? 'rpeEasyReps' : null, repsMax: item?.repsMax };
  }
  // Stått still tre pass i rad utan att klara alla reps: föreslå en lättare vecka
  const recent = q(`SELECT s.id, MAX(l.weight) AS w FROM sessions s JOIN set_logs l ON l.session_id = s.id
    WHERE s.user_id = ? AND l.exercise_id = ? AND s.finished_at IS NOT NULL GROUP BY s.id ORDER BY s.started_at DESC, s.id DESC LIMIT 3`).all(userId, exerciseId);
  if (!allHit && !easy && recent.length === 3 && recent.every(r => r.w === recent[0].w)) {
    return { lastSets: sets, rpe, weight: Math.max(0, Math.round(topWeight * 0.9 / 2.5) * 2.5), reps: item?.repsMax, increase: false, deload: true, reason: 'deload', repsMax: item?.repsMax };
  }
  const eq = exById.get(exerciseId)?.equipment;
  const step = eq === 'barbell' || topWeight >= 40 ? 2.5 : eq === 'dumbbell' || eq === 'kettlebells' ? 2 : 1;
  // Alla reps men maxat: stanna kvar. Alla reps och lätt: dubbelt steg. Inte alla reps men lätt: sikta på fler reps.
  if (allHit && hard) return { lastSets: sets, rpe, weight: topWeight, reps: item?.repsMax, increase: false, reason: 'rpeHard', repsMax: item?.repsMax };
  return {
    lastSets: sets, rpe,
    weight: allHit ? topWeight + step * (easy ? 2 : 1) : topWeight,
    reps: allHit ? item?.repsMin : Math.min(item?.repsMax || topReps + 1, topReps + (easy ? 2 : 1)),
    increase: !!allHit,
    reason: allHit ? (easy ? 'rpeEasy' : 'weightUp') : easy ? 'rpeEasyReps' : null,
    repsMax: item?.repsMax,
  };
}

// Schemat i databasen sparas utan övningsdetaljer, de läggs på vid läsning.
// Övningar som mäts i tid (t.ex. plankan) får tidsupplägg även i äldre scheman.
function hydrateItem(i, level) {
  const ex = exSummary(i.exerciseId);
  const item = { ...i, exercise: ex };
  if (item.timed === undefined && ex.timed) Object.assign(item, timedScheme(level), { sets: i.sets || 3 });
  return item;
}
function hydratePlan(plan, settings = {}) {
  return {
    ...plan,
    cardio: plan.cardio || [],
    templates: plan.templates.map(t => ({ ...t, items: t.items.map(i => hydrateItem(i, settings.level)) })),
  };
}
function stripPlan(plan) {
  return { ...plan, templates: plan.templates.map(t => ({ ...t, items: t.items.map(({ exercise, ...i }) => i) })) };
}
function getProgram(id) {
  const p = parseProgram(q('SELECT * FROM programs WHERE id = ?').get(id));
  if (!p) throw new HttpError(404, 'Program not found');
  return { ...p, plan: hydratePlan(p.plan, p.settings) };
}
function saveProgram(p) {
  q('UPDATE programs SET plan = ?, settings = ? WHERE id = ?').run(JSON.stringify(stripPlan(p.plan)), JSON.stringify(p.settings), p.id);
  return getProgram(p.id);
}
function activeProgramFor(uid) {
  const row = q('SELECT id FROM programs WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1').get(uid);
  return row ? getProgram(row.id) : null;
}
// Styrkedagar: sparade veckodagar, eller jämnt utspridda för scheman från v0.1
function strengthDays(p) {
  if (Array.isArray(p.settings.days) && p.settings.days.length) return p.settings.days;
  const n = p.plan.week?.length || p.settings.daysPerWeek || 3;
  return { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] }[n] || [0, 2, 4];
}

// Sammanfattning per profil: används av startsidan och Home Assistant
function summary(uid) {
  const user = getUser(uid);
  const p = activeProgramFor(uid);
  const sessions = q("SELECT * FROM sessions WHERE user_id = ? AND finished_at IS NOT NULL ORDER BY started_at DESC, id DESC").all(uid);
  const weekAgo = Date.now() - 7 * 864e5;
  const ts = s => new Date(s.started_at.replace(' ', 'T') + 'Z').getTime();
  const weekStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - weekday(d)); return d.getTime(); })();
  const out = {
    id: user.id, name: user.name, weight: user.weight, height_cm: user.height_cm, bmi: user.bmi,
    total_sessions: sessions.length,
    sessions_last_7_days: sessions.filter(s => ts(s) >= weekAgo).length,
    sessions_this_week: sessions.filter(s => ts(s) >= weekStart).length,
    last_session: sessions[0] ? { name: sessions[0].name, kind: sessions[0].kind || 'strength', date: sessions[0].started_at.slice(0, 10) } : null,
    week_streak: weekStreak(uid),
    weekly_goal: null, weekly_goal_reached: false, goal_streak: 0,
    program: null, planned_per_week: 0, next_workout: null, today: null, next_training_date: null,
  };
  const goal = user.prefs.weekly_goal || (p ? strengthDays(p).length + (p.plan.cardio || []).length : null);
  if (goal) {
    out.weekly_goal = goal;
    out.weekly_goal_reached = out.sessions_this_week >= goal;
    out.goal_streak = goalStreak(uid, goal);
  }
  if (!p) return out;
  const sDays = strengthDays(p);
  const cardio = p.plan.cardio || [];
  const t = p.plan.templates;
  const lastStrength = sessions.find(s => (s.kind || 'strength') === 'strength' && s.program_id === p.id);
  const nextIdx = lastStrength ? (lastStrength.template_index + 1) % t.length : 0;
  const nextStrength = { kind: 'strength', name: t[nextIdx]?.name, template_index: nextIdx, exercises: t[nextIdx]?.items.length || 0, minutes: p.settings.minutes };
  const planFor = wd => {
    const c = cardio.find(c => c.day === wd);
    if (sDays.includes(wd)) return nextStrength;
    if (c) return { kind: 'cardio', name: c.type, cardio_type: c.type, minutes: c.minutes };
    return null;
  };
  const wd = weekday();
  const doneToday = sessions.some(s => s.started_at.slice(0, 10) === new Date().toISOString().slice(0, 10));
  out.program = p.name;
  out.planned_per_week = sDays.length + cardio.length;
  out.training_days = [...new Set([...sDays, ...cardio.map(c => c.day)])].sort();
  out.today = planFor(wd) ? { ...planFor(wd), done: doneToday } : null;
  out.next_workout = nextStrength;
  for (let i = out.today && !doneToday ? 0 : 1; i <= 7; i++) {
    const d = new Date(Date.now() + i * 864e5);
    const plan = planFor(weekday(d));
    if (plan) { out.next_training_date = d.toLocaleDateString('sv-SE', { timeZone: process.env.TZ || 'Europe/Stockholm' }); out.next_training = plan; break; }
  }
  return out;
}
function weekKey(d) { const x = new Date(d.replace(' ', 'T') + 'Z'); const day = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - day); return x.toISOString().slice(0, 10); }
// Antal veckor i rad där veckomålet nåtts (innevarande vecka räknas om den redan nått målet)
function goalStreak(uid, goal) {
  const counts = {};
  for (const s of q('SELECT started_at FROM sessions WHERE user_id = ? AND finished_at IS NOT NULL').all(uid)) counts[weekKey(s.started_at)] = (counts[weekKey(s.started_at)] || 0) + 1;
  const d = new Date(weekKey(new Date().toISOString().replace('T', ' ').slice(0, 19)) + 'T00:00:00Z');
  if ((counts[d.toISOString().slice(0, 10)] || 0) < goal) d.setUTCDate(d.getUTCDate() - 7);
  let n = 0;
  for (; (counts[d.toISOString().slice(0, 10)] || 0) >= goal; d.setUTCDate(d.getUTCDate() - 7)) n++;
  return n;
}
function weekStreak(uid) {
  const weeks = new Set(q('SELECT started_at FROM sessions WHERE user_id = ? AND finished_at IS NOT NULL').all(uid).map(s => weekKey(s.started_at)));
  let streak = 0;
  const d = new Date(weekKey(new Date().toISOString().replace('T', ' ').slice(0, 19)) + 'T00:00:00Z');
  if (!weeks.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 7); // innevarande vecka räknas inte bort
  for (; weeks.has(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() - 7)) streak++;
  return streak;
}

// Personbästa per övning med datum
function records(uid, exerciseId) {
  const logs = q(`SELECT s.id AS sid, l.weight, l.reps, l.seconds, s.started_at FROM set_logs l JOIN sessions s ON s.id = l.session_id
    WHERE s.user_id = ? AND l.exercise_id = ? AND s.finished_at IS NOT NULL ORDER BY s.started_at, s.id`).all(uid, exerciseId);
  const best = {};
  const upd = (k, v, l, extra = {}) => { if (v > 0 && (!best[k] || v > best[k].value)) best[k] = { value: Math.round(v * 10) / 10, date: l.started_at.slice(0, 10), ...extra }; };
  for (const l of logs) {
    upd('weight', l.weight, l, { reps: l.reps });
    upd('e1rm', e1rm(l.weight, l.reps), l, { weight: l.weight, reps: l.reps });
    if (!(l.weight > 0)) upd('reps', l.reps, l);
    upd('seconds', l.seconds, l);
  }
  // Uppskattat 1RM och tyngsta vikt per pass, för grafen på övningssidan
  const per = new Map();
  for (const l of logs) {
    const pt = per.get(l.sid) || { date: l.started_at.slice(0, 10), e1rm: 0, weight: 0, seconds: 0, reps: 0 };
    pt.e1rm = Math.max(pt.e1rm, Math.round(e1rm(l.weight, l.reps) * 10) / 10); pt.weight = Math.max(pt.weight, l.weight || 0);
    pt.seconds = Math.max(pt.seconds, l.seconds || 0); pt.reps = Math.max(pt.reps, l.reps || 0);
    per.set(l.sid, pt);
  }
  return { sessions: per.size, ...best, points: [...per.values()] };
}

// ---------- Muskler: veckans träning och återhämtning ----------
const BIG_MUSCLES = ['quadriceps', 'hamstrings', 'glutes', 'lower back', 'lats', 'middle back', 'chest'];
const tsOf = d => new Date(d.replace(' ', 'T') + 'Z').getTime();
function weekStartTs() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - weekday(d)); return d.getTime(); }
function muscleStatus(uid) {
  const since = new Date(Date.now() - 14 * 864e5).toISOString().replace('T', ' ').slice(0, 19);
  const logs = q(`SELECT l.exercise_id, l.session_id, s.started_at FROM set_logs l JOIN sessions s ON s.id = l.session_id
    WHERE s.user_id = ? AND s.started_at >= ? AND (s.finished_at IS NOT NULL OR s.started_at >= datetime('now', '-1 day'))`).all(uid, since);
  const ws = weekStartTs(), now = Date.now();
  const m = Object.fromEntries(MUSCLES.map(k => [k, { week: 0, last: null, lastSets: 0, recovery: 100 }]));
  const bySession = {};
  for (const l of logs) {
    const ex = exById.get(l.exercise_id); if (!ex) continue;
    const ts = tsOf(l.started_at);
    for (const [list, w] of [[ex.primaryMuscles, 1], [ex.secondaryMuscles || [], 0.5]]) for (const mu of list) {
      if (!m[mu] || (w < 1 && ex.primaryMuscles.includes(mu))) continue;
      if (ts >= ws) m[mu].week += w;
      const k = mu + ':' + l.session_id;
      bySession[k] = (bySession[k] || 0) + w;
      if (w === 1 && (!m[mu].last || ts >= tsOf(m[mu].last))) { m[mu].last = l.started_at; m[mu].lastSets = bySession[k]; }
    }
  }
  for (const [mu, v] of Object.entries(m)) {
    if (!v.last) continue;
    const need = BIG_MUSCLES.includes(mu) && v.lastSets >= 6 ? 72 : 48; // timmar
    v.hoursAgo = Math.round((now - tsOf(v.last)) / 36e5);
    v.recovery = Math.min(100, Math.round(100 * v.hoursAgo / need));
    v.readyAt = new Date(tsOf(v.last) + need * 36e5).toISOString();
  }
  // Träningsdagar i rad fram till idag eller igår
  const days = new Set(q("SELECT date(started_at, 'localtime') AS d FROM sessions WHERE user_id = ? AND finished_at IS NOT NULL").all(uid).map(r => r.d));
  let streak = 0;
  const d = new Date();
  const ymd = x => x.toLocaleDateString('sv-SE', { timeZone: process.env.TZ || 'Europe/Stockholm' });
  if (!days.has(ymd(d))) d.setDate(d.getDate() - 1);
  for (; days.has(ymd(d)); d.setDate(d.getDate() - 1)) streak++;
  // Råd för idag utifrån dagens planerade pass
  const sum = summary(uid);
  let advice = null;
  const today = sum.today;
  const p = activeProgramFor(uid);
  if (today && !today.done && today.kind === 'strength' && p) {
    const target = [...new Set(p.plan.templates[today.template_index]?.items.flatMap(i => i.exercise.primaryMuscles || []) || [])];
    const tired = target.filter(mu => m[mu] && m[mu].recovery < 80);
    if (streak >= 4) advice = { type: 'rest', days: streak };
    else if (tired.length && tired.length * 2 >= target.length) advice = { type: 'cardio', muscles: tired };
    else if (tired.length) advice = { type: 'partial', muscles: tired };
    else advice = { type: 'ok' };
  } else if (streak >= 5) advice = { type: 'rest', days: streak };
  return { muscles: m, streakDays: streak, advice, groups: GROUPS };
}

// ---------- Månadsrapport ----------
function monthReport(uid, month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) month = today().slice(0, 7);
  const [y, mo] = month.split('-').map(Number);
  const prevMonth = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  const inMonth = (d, mm = month) => d.slice(0, 7) === mm;
  const sessions = q('SELECT * FROM sessions WHERE user_id = ? AND finished_at IS NOT NULL ORDER BY started_at, id').all(uid);
  const logs = q(`SELECT l.*, s.started_at FROM set_logs l JOIN sessions s ON s.id = l.session_id
    WHERE s.user_id = ? AND s.finished_at IS NOT NULL ORDER BY s.started_at, s.id, l.set_no`).all(uid);
  const agg = mm => {
    const ss = sessions.filter(x => inMonth(x.started_at, mm)), ll = logs.filter(l => inMonth(l.started_at, mm));
    const cardio = ss.filter(x => x.kind === 'cardio');
    const strength = ss.filter(x => (x.kind || 'strength') !== 'cardio');
    return {
      sessions: ss.length, strength: strength.length, cardio: cardio.length,
      minutes: Math.round(strength.reduce((a, x) => a + Math.max(0, Math.min(240, (tsOf(x.finished_at) - tsOf(x.started_at)) / 6e4)), 0) + cardio.reduce((a, x) => a + (x.duration_min || 0), 0)),
      cardioMinutes: Math.round(cardio.reduce((a, x) => a + (x.duration_min || 0), 0)),
      km: Math.round(cardio.reduce((a, x) => a + (x.distance_km || 0), 0) * 10) / 10,
      sets: ll.length, volume: Math.round(ll.reduce((a, l) => a + (l.weight || 0) * (l.reps || 0), 0)),
      days: new Set(ss.map(x => x.started_at.slice(0, 10))).size,
    };
  };
  // Nya rekord: första gången ett värde slår allt tidigare för övningen
  const best = {}, prs = {};
  for (const l of logs) {
    const b = (best[l.exercise_id] ??= { weight: 0, e1rm: 0, seconds: 0, reps: 0, seen: false });
    const cand = [['weight', l.weight || 0], ['e1rm', e1rm(l.weight, l.reps)], ['seconds', l.seconds || 0]];
    if (!(l.weight > 0)) cand.push(['reps', l.reps || 0]);
    for (const [k, v] of cand) {
      if (v > b[k] + 0.01) {
        if (b.seen && b[k] > 0 && inMonth(l.started_at)) {
          const key = l.exercise_id + ':' + (k === 'e1rm' ? 'weight' : k);
          if (k !== 'e1rm' || !prs[key] || prs[key].type === 'e1rm') prs[key] = { exercise: exSummary(l.exercise_id), type: k, value: Math.round(v * 10) / 10, previous: Math.round(b[k] * 10) / 10, date: l.started_at.slice(0, 10) };
        }
        b[k] = v;
      }
    }
    b.seen = true;
  }
  const bw = q('SELECT date, weight FROM bodyweight WHERE user_id = ? ORDER BY date').all(uid);
  const end = bw.filter(b => b.date.slice(0, 7) <= month).at(-1);
  const start = bw.filter(b => b.date.slice(0, 7) < month).at(-1) || bw.find(b => inMonth(b.date));
  const ms = q('SELECT date, type, value FROM measurements WHERE user_id = ? ORDER BY date').all(uid);
  const measures = {};
  for (const type of [...new Set(ms.map(x => x.type))]) {
    const list = ms.filter(x => x.type === type);
    const e = list.filter(x => x.date.slice(0, 7) <= month).at(-1), st = list.filter(x => x.date.slice(0, 7) < month).at(-1) || list.find(x => inMonth(x.date));
    if (e && st && e !== st && inMonth(e.date)) measures[type] = { from: st.value, to: e.value, change: Math.round((e.value - st.value) * 10) / 10 };
  }
  const top = {};
  for (const l of logs) if (inMonth(l.started_at)) top[l.exercise_id] = (top[l.exercise_id] || 0) + 1;
  return {
    month, ...agg(month), previous: { month: prevMonth, ...agg(prevMonth) },
    prs: Object.values(prs).sort((a, b) => a.date.localeCompare(b.date)),
    weight: end && start && inMonth(end.date) ? { from: start.weight, to: end.weight, change: Math.round((end.weight - start.weight) * 10) / 10 } : null,
    measures,
    topExercises: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ exercise: exSummary(id), sets: n })),
    months: [...new Set([...sessions.map(x => x.started_at.slice(0, 7)), today().slice(0, 7)])].sort(),
  };
}

// Övning som bytts ut i ett pågående pass: ny övning med samma upplägg
function swapped(item, exerciseId, level) {
  if (!exerciseId || exerciseId === item.exerciseId || !exById.has(exerciseId)) return item;
  const ex = exById.get(exerciseId);
  const out = { ...item, exerciseId, swappedFrom: item.exerciseId, swappedFromName: exById.get(item.exerciseId)?.name };
  delete out.timed; delete out.secMin; delete out.secMax;
  if (exTimed(ex)) Object.assign(out, timedScheme(level));
  else { out.timed = false; out.repsMin ??= 8; out.repsMax ??= 12; }
  return hydrateItem(out, level);
}
// Snabbpass (15–20 min): en övning per muskelgrupp, högst fyra, två set och övningarna parvis i superset
function quickItems(items) {
  const seen = new Set(), pick = [];
  for (const it of items) { const g = it.group || it.exerciseId; if (seen.has(g) || pick.length >= 4) continue; seen.add(g); pick.push(it); }
  if (pick.length < Math.min(3, items.length)) for (const it of items) if (!pick.includes(it) && pick.length < 3) pick.push(it);
  pick.sort((a, b) => a.index - b.index);
  return pick.map((it, i) => {
    const out = { ...it, sets: 2, rest: Math.min(it.rest || 60, 60) };
    if (i % 2 === 0 && i < pick.length - 1) out.linkNext = true; else delete out.linkNext;
    return out;
  });
}

// ---------- Routes ----------
const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler });
};

route('GET', '/api/health', () => ({ ok: true, version: VERSION }));

// Användare
route('GET', '/api/users', () => q('SELECT id FROM users ORDER BY name').all().map(u => getUser(u.id)));
route('POST', '/api/users', (_, body) => {
  const name = String(body.name || '').trim().slice(0, 50);
  if (!name) throw new HttpError(400, 'Name missing');
  const r = q('INSERT INTO users (name) VALUES (?)').run(name);
  return getUser(r.lastInsertRowid);
});
route('GET', '/api/users/:uid', ({ uid }) => getUser(uid));
route('PATCH', '/api/users/:uid', ({ uid }, body) => {
  const u = getUser(uid);
  if (body.name !== undefined) { const n = String(body.name).trim().slice(0, 50); if (n) q('UPDATE users SET name = ? WHERE id = ?').run(n, uid); }
  if (body.height_cm !== undefined) {
    const h = body.height_cm === null || body.height_cm === '' ? null : Number(body.height_cm);
    if (h !== null && !(h >= 80 && h <= 250)) throw new HttpError(400, 'Invalid height');
    q('UPDATE users SET height_cm = ? WHERE id = ?').run(h, uid);
  }
  if (body.prefs && typeof body.prefs === 'object') {
    const prefs = { ...u.prefs };
    for (const k of ['warmup', 'stretch']) if (k in body.prefs) prefs[k] = !!body.prefs[k];
    if (['anim', 'video', 'both'].includes(body.prefs.media)) prefs.media = body.prefs.media;
    if ('weekly_goal' in body.prefs) { const g = Number(body.prefs.weekly_goal); prefs.weekly_goal = g >= 1 && g <= 14 ? Math.round(g) : null; }
    q('UPDATE users SET prefs = ? WHERE id = ?').run(JSON.stringify(prefs), uid);
  }
  return getUser(uid);
});
route('DELETE', '/api/users/:uid', ({ uid }) => { q('DELETE FROM users WHERE id = ?').run(uid); return { ok: true }; });
route('GET', '/api/users/:uid/summary', ({ uid }) => summary(uid));

// Övningar
route('GET', '/api/exercises', (_, __, url) => {
  const s = norm(url.searchParams.get('q'));
  const muscle = url.searchParams.get('muscle');
  const equipment = url.searchParams.get('equipment');
  const custom = url.searchParams.get('custom') === '1';
  return exercises
    .filter(e => (!custom || e.custom) && (!s || norm(e.name).includes(s) || norm(exSv[e.id]?.name).includes(s)) && (!muscle || e.primaryMuscles.includes(muscle)) && (!equipment || e.equipment === equipment))
    .sort((a, b) => (b.custom ? 1 : 0) - (a.custom ? 1 : 0))
    .slice(0, 100).map(e => ({ ...exSummary(e.id), video: videos.has(e.id) }));
});
route('GET', '/api/exercise-names', (_, __, url) => {
  if (url.searchParams.get('lang') !== 'sv') return {};
  return Object.fromEntries(Object.entries(exSv).map(([id, v]) => [id, v.name]));
});
route('GET', '/api/exercises/:id', ({ id }, _, url) => {
  const e = exById.get(decodeURIComponent(id));
  if (!e) throw new HttpError(404, 'Exercise not found');
  const sv = url.searchParams.get('lang') === 'sv' && exSv[e.id];
  return { ...e, name_en: e.name, name: sv?.name || e.name, instructions: sv?.instructions?.length ? sv.instructions : e.instructions, translated: !!sv || !!e.custom, timed: exTimed(e), custom: !!e.custom, video: videos.info(e.id), embed: videos.embedInfo(e.id) };
});
route('GET', '/api/exercises/:id/embed', async ({ id }) => videos.findEmbed(decodeURIComponent(id)));
route('PUT', '/api/exercises/:id/embed', ({ id }, body) => videos.setEmbed(decodeURIComponent(id), body.url));
route('GET', '/api/users/:uid/exercises/:id/records', ({ uid, id }) => records(uid, decodeURIComponent(id)));
route('GET', '/api/users/:uid/muscles', ({ uid }) => muscleStatus(uid));
route('GET', '/api/users/:uid/report', ({ uid }, _, url) => monthReport(uid, url.searchParams.get('month')));

// Egna övningar
function customBody(body, old = {}) {
  const name = String(body.name ?? old.name ?? '').trim().slice(0, 80);
  if (!name) throw new HttpError(400, 'Name missing');
  const primary = (Array.isArray(body.primaryMuscles) ? body.primaryMuscles : old.primaryMuscles || []).filter(m => MUSCLES.includes(m));
  if (!primary.length) throw new HttpError(400, 'Pick at least one muscle');
  const secondary = (Array.isArray(body.secondaryMuscles) ? body.secondaryMuscles : old.secondaryMuscles || []).filter(m => MUSCLES.includes(m) && !primary.includes(m));
  const instr = body.instructions !== undefined ? (Array.isArray(body.instructions) ? body.instructions : String(body.instructions).split(/\n+/)) : old.instructions || [];
  return {
    name, equipment: EQUIPMENTS.includes(body.equipment) ? body.equipment : old.equipment || 'body only',
    level: ['beginner', 'intermediate', 'expert'].includes(body.level) ? body.level : old.level || 'beginner',
    mechanic: ['compound', 'isolation'].includes(body.mechanic) ? body.mechanic : old.mechanic || null,
    primary_muscles: JSON.stringify(primary), secondary_muscles: JSON.stringify(secondary),
    instructions: JSON.stringify(instr.map(x => String(x).trim().slice(0, 500)).filter(Boolean).slice(0, 20)),
    timed: body.timed !== undefined ? (body.timed ? 1 : 0) : old.timedCustom ? 1 : 0,
  };
}
function setCustomVideo(id, url) {
  if (url === undefined) return;
  try { videos.setEmbed(id, url || ''); } catch (e) { if (url) throw e; }
}
route('GET', '/api/custom-exercises', () => [...customIds].map(id => exById.get(id)).filter(e => !e.deleted).map(e => exSummary(e.id)));
route('POST', '/api/custom-exercises', (_, body) => {
  const v = customBody(body);
  const n = (q("SELECT COUNT(*) AS n FROM custom_exercises").get().n || 0) + 1;
  let id = 'custom-' + n; while (exById.has(id)) id += 'x';
  q('INSERT INTO custom_exercises (id, name, equipment, level, mechanic, primary_muscles, secondary_muscles, instructions, timed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, v.name, v.equipment, v.level, v.mechanic, v.primary_muscles, v.secondary_muscles, v.instructions, v.timed);
  loadCustom();
  setCustomVideo(id, body.videoUrl);
  return exSummary(id);
});
route('PUT', '/api/custom-exercises/:id', ({ id }, body) => {
  id = decodeURIComponent(id);
  const old = exById.get(id);
  if (!old?.custom) throw new HttpError(404, 'Exercise not found');
  const v = customBody(body, old);
  q('UPDATE custom_exercises SET name = ?, equipment = ?, level = ?, mechanic = ?, primary_muscles = ?, secondary_muscles = ?, instructions = ?, timed = ? WHERE id = ?')
    .run(v.name, v.equipment, v.level, v.mechanic, v.primary_muscles, v.secondary_muscles, v.instructions, v.timed, id);
  loadCustom();
  setCustomVideo(id, body.videoUrl);
  return exSummary(id);
});
// Borttagna egna övningar finns kvar i bakgrunden så att gamla pass och rekord behåller namnet
route('DELETE', '/api/custom-exercises/:id', ({ id }) => {
  id = decodeURIComponent(id);
  if (!exById.get(id)?.custom) throw new HttpError(404, 'Exercise not found');
  q('UPDATE custom_exercises SET deleted = 1 WHERE id = ?').run(id);
  loadCustom();
  return { ok: true };
});

// Program
route('GET', '/api/cardio-types', () => CARDIO_TYPES);
route('POST', '/api/generate', (_, body) => {
  try { return hydratePlan(generate(exercises, body), body); } catch (e) { throw new HttpError(400, e.message); }
});
route('GET', '/api/users/:uid/programs', ({ uid }) =>
  q('SELECT id FROM programs WHERE user_id = ? ORDER BY created_at DESC').all(uid).map(r => getProgram(r.id)));
route('POST', '/api/users/:uid/programs', ({ uid }, body) => {
  if (!body.plan || !body.settings) throw new HttpError(400, 'Program missing');
  const name = String(body.name || 'HomeLift').slice(0, 80);
  q('UPDATE programs SET active = 0 WHERE user_id = ?').run(uid);
  const r = q('INSERT INTO programs (user_id, name, settings, plan, active) VALUES (?, ?, ?, ?, 1)')
    .run(uid, name, JSON.stringify(body.settings), JSON.stringify(stripPlan(body.plan)));
  return getProgram(r.lastInsertRowid);
});
route('GET', '/api/programs/:id', ({ id }) => getProgram(id));
route('POST', '/api/programs/:id/activate', ({ id }) => {
  const p = getProgram(id);
  q('UPDATE programs SET active = 0 WHERE user_id = ?').run(p.user_id);
  q('UPDATE programs SET active = 1 WHERE id = ?').run(id);
  return getProgram(id);
});
route('PATCH', '/api/programs/:id', ({ id }, body) => {
  const name = String(body.name || '').trim().slice(0, 80);
  if (name) q('UPDATE programs SET name = ? WHERE id = ?').run(name, id);
  return getProgram(id);
});
route('DELETE', '/api/programs/:id', ({ id }) => {
  const p = getProgram(id);
  q('DELETE FROM programs WHERE id = ?').run(id);
  // Togs det aktiva schemat bort blir det senast skapade kvarvarande aktivt
  if (p.active) {
    const next = q('SELECT id FROM programs WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1').get(p.user_id);
    if (next) q('UPDATE programs SET active = 1 WHERE id = ?').run(next.id);
  }
  return { ok: true };
});
// Ändra set, vila och superset för en övning i schemat
route('POST', '/api/programs/:id/item', ({ id }, body) => {
  const p = getProgram(id);
  const items = p.plan.templates[body.t]?.items;
  const item = items?.[body.i];
  if (!item) throw new HttpError(400, 'Invalid exercise');
  if (body.rest !== undefined) item.rest = Math.min(600, Math.max(0, Math.round(Number(body.rest) || 0)));
  if (body.sets !== undefined) item.sets = Math.min(10, Math.max(1, Math.round(Number(body.sets) || 1)));
  if (body.linkNext !== undefined) { if (body.linkNext && body.i < items.length - 1) item.linkNext = true; else delete item.linkNext; }
  return saveProgram(p);
});
route('GET', '/api/programs/:id/alternatives', ({ id }, _, url) => {
  const p = getProgram(id);
  const t = Number(url.searchParams.get('t')), i = Number(url.searchParams.get('i'));
  const item = p.plan.templates[t]?.items[i];
  if (!item) throw new HttpError(404, 'Exercise not in program');
  const inDay = p.plan.templates[t].items.map(x => x.exerciseId);
  return alternatives(exercises, p.settings, item.exerciseId, item.group, inDay).map(e => exSummary(e.id));
});
route('POST', '/api/programs/:id/swap', ({ id }, body) => {
  const p = getProgram(id);
  const { t, i, exerciseId } = body;
  const item = p.plan.templates[t]?.items[i];
  if (!item || !exById.has(exerciseId)) throw new HttpError(400, 'Invalid swap');
  item.exerciseId = exerciseId;
  delete item.timed;
  const ex = exById.get(exerciseId);
  if (isTimed(ex)) Object.assign(item, timedScheme(p.settings.level));
  return saveProgram(p);
});
// Lägg till en övning (t.ex. en egen) sist i ett pass
route('POST', '/api/programs/:id/add', ({ id }, body) => {
  const p = getProgram(id);
  const tpl = p.plan.templates[body.t];
  const ex = exById.get(body.exerciseId);
  if (!tpl || !ex || ex.deleted) throw new HttpError(400, 'Invalid exercise');
  const group = Object.keys(GROUPS).find(g => GROUPS[g].some(m => ex.primaryMuscles.includes(m)));
  const item = { exerciseId: ex.id, group, ...scheme(p.settings.level, ex, group) };
  if (!exTimed(ex)) item.timed = false;
  tpl.items.push(item);
  return saveProgram(p);
});
// Växla mellan reps och tid för en övning i schemat
route('POST', '/api/programs/:id/timed', ({ id }, body) => {
  const p = getProgram(id);
  const item = p.plan.templates[body.t]?.items[body.i];
  if (!item) throw new HttpError(400, 'Invalid exercise');
  if (body.timed) Object.assign(item, timedScheme(p.settings.level));
  else { item.timed = false; delete item.secMin; delete item.secMax; }
  return saveProgram(p);
});
// Veckodagar och cardiopass
route('PUT', '/api/programs/:id/days', ({ id }, body) => {
  const p = getProgram(id);
  const days = [...new Set((body.days || []).map(Number).filter(d => d >= 0 && d <= 6))].sort();
  if (!days.length) throw new HttpError(400, 'Pick at least one day');
  p.settings.days = days;
  p.settings.daysPerWeek = days.length;
  p.plan.week = days.map((_, i) => i % p.plan.templates.length);
  return saveProgram(p);
});
route('POST', '/api/programs/:id/cardio', ({ id }, body) => {
  const p = getProgram(id);
  const type = CARDIO_TYPES.some(c => c.id === body.type) ? body.type : 'lopning';
  const day = Math.min(6, Math.max(0, Number(body.day) || 0));
  const minutes = Math.min(240, Math.max(5, Number(body.minutes) || 30));
  p.plan.cardio = [...(p.plan.cardio || []), { type, day, minutes }].sort((a, b) => a.day - b.day);
  return saveProgram(p);
});
route('DELETE', '/api/programs/:id/cardio/:idx', ({ id, idx }) => {
  const p = getProgram(id);
  p.plan.cardio = (p.plan.cardio || []).filter((_, i) => i !== Number(idx));
  return saveProgram(p);
});

// Pass
route('POST', '/api/users/:uid/sessions', ({ uid }, body) => {
  if (body.kind === 'cardio') {
    const type = CARDIO_TYPES.some(c => c.id === body.cardioType) ? body.cardioType : 'lopning';
    const r = q("INSERT INTO sessions (user_id, program_id, name, kind, cardio_type, duration_min) VALUES (?, ?, ?, 'cardio', ?, ?)")
      .run(uid, body.programId || null, type, type, Number(body.minutes) || null);
    return { id: Number(r.lastInsertRowid) };
  }
  const p = getProgram(body.programId);
  const t = p.plan.templates[body.templateIndex];
  if (!t) throw new HttpError(400, 'Unknown workout');
  const r = q('INSERT INTO sessions (user_id, program_id, template_index, name, quick) VALUES (?, ?, ?, ?, ?)').run(uid, p.id, body.templateIndex, t.name, body.quick ? 1 : 0);
  return { id: Number(r.lastInsertRowid) };
});
route('GET', '/api/sessions/:id', ({ id }) => {
  const s = q('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!s) throw new HttpError(404, 'Workout not found');
  s.kind = s.kind || 'strength';
  if (s.kind === 'cardio') return { ...s, items: [] };
  const p = s.program_id ? getProgram(s.program_id) : null;
  const template = p?.plan.templates[s.template_index];
  const logs = q('SELECT * FROM set_logs WHERE session_id = ? ORDER BY exercise_id, set_no').all(id);
  // Övningar som loggats men inte finns i schemat (t.ex. efter byte) tas också med
  const level = p?.settings.level;
  const swaps = JSON.parse(s.swaps || '{}');
  let items = template ? template.items.map((i, index) => swapped({ ...i, index }, swaps[index], level)) : [];
  if (s.quick) items = quickItems(items);
  for (const l of logs) if (!items.some(i => i.exerciseId === l.exercise_id)) items.push(hydrateItem({ exerciseId: l.exercise_id, sets: 3, repsMin: 8, repsMax: 12, rest: 90, timed: l.seconds != null ? undefined : false }, p?.settings.level));
  return {
    ...s,
    groups: [...new Set(items.map(i => i.group).filter(Boolean))],
    items: items.map(i => ({ ...i, logs: logs.filter(l => l.exercise_id === i.exerciseId), suggestion: suggestion(s.user_id, i.exerciseId, i) })),
  };
});
// Byt en övning bara i det här passet (schemat ändras inte)
route('GET', '/api/sessions/:id/alternatives', ({ id }, _, url) => {
  const s = q('SELECT * FROM sessions WHERE id = ?').get(id);
  const p = s?.program_id ? getProgram(s.program_id) : null;
  const tpl = p?.plan.templates[s.template_index];
  const index = Number(url.searchParams.get('index'));
  const item = tpl?.items[index];
  if (!item) throw new HttpError(404, 'Exercise not in workout');
  const swaps = JSON.parse(s.swaps || '{}');
  const current = swaps[index] || item.exerciseId;
  const inDay = tpl.items.map((x, i) => swaps[i] || x.exerciseId).concat(item.exerciseId);
  const alts = alternatives(exercises, p.settings, current, item.group, inDay).map(e => exSummary(e.id));
  return { original: swaps[index] ? exSummary(item.exerciseId) : null, alternatives: alts };
});
route('POST', '/api/sessions/:id/swap', ({ id }, body) => {
  const s = q('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!s) throw new HttpError(404, 'Workout not found');
  const p = s.program_id ? getProgram(s.program_id) : null;
  const item = p?.plan.templates[s.template_index]?.items[body.index];
  if (!item || !exById.has(body.exerciseId)) throw new HttpError(400, 'Invalid swap');
  const swaps = JSON.parse(s.swaps || '{}');
  if (body.exerciseId === item.exerciseId) delete swaps[body.index]; else swaps[body.index] = body.exerciseId;
  q('UPDATE sessions SET swaps = ? WHERE id = ?').run(JSON.stringify(swaps), id);
  return { ok: true };
});
route('PUT', '/api/sessions/:id', ({ id }, body) => {
  const num = v => v == null || v === '' ? null : Number(v);
  q('UPDATE sessions SET duration_min = COALESCE(?, duration_min), distance_km = ?, note = COALESCE(?, note) WHERE id = ?')
    .run(num(body.duration_min), num(body.distance_km), body.note ?? null, id);
  return { ok: true };
});
route('PUT', '/api/sessions/:id/sets', ({ id }, body) => {
  const { exerciseId, setNo, weight, reps, seconds, rpe } = body;
  if (!exerciseId || !setNo) throw new HttpError(400, 'Incomplete set');
  const num = v => v == null || v === '' ? null : Number(v);
  const sess = q('SELECT user_id FROM sessions WHERE id = ?').get(id);
  const prev = sess && q(`SELECT MAX(l.weight) AS w, MAX(l.reps) AS r, MAX(l.seconds) AS sec, MAX(CASE WHEN l.weight > 0 AND l.reps > 0 THEN l.weight * (1 + l.reps / 30.0) END) AS e
    FROM set_logs l JOIN sessions s ON s.id = l.session_id WHERE s.user_id = ? AND l.exercise_id = ? AND s.id != ?`).get(sess.user_id, exerciseId, id);
  const pr = [];
  if (prev && (prev.w != null || prev.r != null || prev.sec != null)) {
    const w = num(weight), r = num(reps), sec = num(seconds);
    if (w > 0 && w > (prev.w || 0)) pr.push({ type: 'weight', value: w, previous: prev.w });
    else if (w > 0 && r > 0 && e1rm(w, r) > (prev.e || 0) + 0.01) pr.push({ type: 'e1rm', value: Math.round(e1rm(w, r) * 10) / 10, previous: prev.e && Math.round(prev.e * 10) / 10 });
    if (!(w > 0) && r > (prev.r || 0) && !(prev.w > 0)) pr.push({ type: 'reps', value: r, previous: prev.r });
    if (sec > (prev.sec || 0) && prev.sec != null) pr.push({ type: 'seconds', value: sec, previous: prev.sec });
  }
  q(`INSERT INTO set_logs (session_id, exercise_id, set_no, weight, reps, seconds, rpe) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id, exercise_id, set_no) DO UPDATE SET weight = excluded.weight, reps = excluded.reps, seconds = excluded.seconds, rpe = COALESCE(excluded.rpe, rpe), logged_at = datetime('now')`)
    .run(id, exerciseId, setNo, num(weight), num(reps), num(seconds), validRpe(rpe));
  return { ok: true, pr };
});
const validRpe = v => { const n = Number(v); return v != null && v !== '' && n >= 5 && n <= 10 ? n : null; };
// Ansträngning (RPE 5–10) för ett loggat set
route('PUT', '/api/sessions/:id/rpe', ({ id }, body) => {
  q('UPDATE set_logs SET rpe = ? WHERE session_id = ? AND exercise_id = ? AND set_no = ?').run(validRpe(body.rpe), id, body.exerciseId, body.setNo);
  return { ok: true };
});
route('DELETE', '/api/sessions/:id/sets', ({ id }, body) => {
  q('DELETE FROM set_logs WHERE session_id = ? AND exercise_id = ? AND set_no = ?').run(id, body.exerciseId, body.setNo);
  return { ok: true };
});
route('POST', '/api/sessions/:id/finish', ({ id }, body) => {
  const s = q('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!s) throw new HttpError(404, 'Workout not found');
  const num = v => v == null || v === '' ? null : Number(v);
  q("UPDATE sessions SET finished_at = datetime('now'), note = ?, duration_min = COALESCE(?, duration_min), distance_km = COALESCE(?, distance_km) WHERE id = ?")
    .run(body.note || null, num(body.duration_min), num(body.distance_km), id);
  return { ok: true };
});
route('DELETE', '/api/sessions/:id', ({ id }) => { q('DELETE FROM sessions WHERE id = ?').run(id); return { ok: true }; });
route('GET', '/api/users/:uid/sessions', ({ uid }) =>
  q(`SELECT s.*, COUNT(l.id) AS set_count, COALESCE(SUM(l.weight * l.reps), 0) AS volume
     FROM sessions s LEFT JOIN set_logs l ON l.session_id = s.id WHERE s.user_id = ?
     GROUP BY s.id ORDER BY s.started_at DESC, s.id DESC LIMIT 50`).all(uid).map(s => ({ ...s, kind: s.kind || 'strength' })));

// Kroppsvikt
route('GET', '/api/users/:uid/bodyweight', ({ uid }) => q('SELECT date, weight FROM bodyweight WHERE user_id = ? ORDER BY date').all(uid));
route('POST', '/api/users/:uid/bodyweight', ({ uid }, body) => {
  const w = Number(body.weight);
  if (!(w >= 20 && w <= 400)) throw new HttpError(400, 'Invalid weight');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : today();
  q('INSERT INTO bodyweight (user_id, date, weight) VALUES (?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET weight = excluded.weight').run(uid, date, w);
  return getUser(uid);
});
route('DELETE', '/api/users/:uid/bodyweight/:date', ({ uid, date }) => { q('DELETE FROM bodyweight WHERE user_id = ? AND date = ?').run(uid, date); return getUser(uid); });

// Kroppsmått (midja, bröst m.m.)
const MEASURE_TYPES = ['waist', 'chest', 'hips', 'arm', 'thigh', 'calf', 'neck', 'bodyfat'];
route('GET', '/api/users/:uid/measurements', ({ uid }) => q('SELECT date, type, value FROM measurements WHERE user_id = ? ORDER BY date').all(uid));
route('POST', '/api/users/:uid/measurements', ({ uid }, body) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : today();
  const vals = Object.entries(body.values || {}).filter(([k, v]) => MEASURE_TYPES.includes(k) && v !== '' && v != null && Number(v) > 0 && Number(v) < 400);
  if (!vals.length) throw new HttpError(400, 'No measurements');
  for (const [k, v] of vals) q('INSERT INTO measurements (user_id, date, type, value) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, date, type) DO UPDATE SET value = excluded.value').run(uid, date, k, Number(v));
  return q('SELECT date, type, value FROM measurements WHERE user_id = ? ORDER BY date').all(uid);
});
route('DELETE', '/api/users/:uid/measurements/:date/:type', ({ uid, date, type }) => {
  q('DELETE FROM measurements WHERE user_id = ? AND date = ? AND type = ?').run(uid, date, type);
  return { ok: true };
});

// Statistik
route('GET', '/api/users/:uid/stats', ({ uid }) => {
  const finished = q('SELECT * FROM sessions WHERE user_id = ? AND finished_at IS NOT NULL ORDER BY started_at, id').all(uid);
  const logs = q(`SELECT l.*, s.started_at FROM set_logs l JOIN sessions s ON s.id = l.session_id
                  WHERE s.user_id = ? AND s.finished_at IS NOT NULL ORDER BY s.started_at, s.id`).all(uid);
  const weeks = {};
  const wk = s => (weeks[weekKey(s.started_at)] ??= { week: weekKey(s.started_at), sessions: 0, strength: 0, cardio: 0, volume: 0, cardioMinutes: 0 });
  for (const s of finished) {
    const w = wk(s); w.sessions++;
    if ((s.kind || 'strength') === 'cardio') { w.cardio++; w.cardioMinutes += s.duration_min || 0; } else w.strength++;
  }
  for (const l of logs) if (weeks[weekKey(l.started_at)]) weeks[weekKey(l.started_at)].volume += (l.weight || 0) * (l.reps || 0);
  const per = {};
  for (const l of logs) {
    const e = (per[l.exercise_id] ??= { exercise: exSummary(l.exercise_id), points: {}, bestWeight: 0, bestE1rm: 0, bestReps: 0, bestSeconds: 0, sets: 0 });
    const v = e1rm(l.weight, l.reps);
    const pt = e.points[l.session_id] ??= { date: l.started_at.slice(0, 10), e1rm: 0, weight: 0, seconds: 0 };
    e.sets++;
    pt.e1rm = Math.max(pt.e1rm, v); pt.weight = Math.max(pt.weight, l.weight || 0); pt.seconds = Math.max(pt.seconds, l.seconds || 0);
    if ((l.weight || 0) > e.bestWeight) e.bestWeightDate = l.started_at.slice(0, 10);
    if ((l.seconds || 0) > e.bestSeconds) e.bestSecondsDate = l.started_at.slice(0, 10);
    e.bestWeight = Math.max(e.bestWeight, l.weight || 0);
    e.bestE1rm = Math.max(e.bestE1rm, v);
    e.bestReps = Math.max(e.bestReps, l.reps || 0);
    e.bestSeconds = Math.max(e.bestSeconds, l.seconds || 0);
  }
  const cardio = finished.filter(s => s.kind === 'cardio');
  const cardioByType = {};
  for (const s of cardio) { const c = (cardioByType[s.cardio_type] ??= { type: s.cardio_type, sessions: 0, minutes: 0, km: 0 }); c.sessions++; c.minutes += s.duration_min || 0; c.km += s.distance_km || 0; }
  return {
    totalSessions: finished.length,
    totalSets: logs.length,
    totalVolume: logs.reduce((a, l) => a + (l.weight || 0) * (l.reps || 0), 0),
    cardioSessions: cardio.length,
    cardioMinutes: cardio.reduce((a, s) => a + (s.duration_min || 0), 0),
    cardioKm: cardio.reduce((a, s) => a + (s.distance_km || 0), 0),
    cardioByType: Object.values(cardioByType).sort((a, b) => b.minutes - a.minutes),
    weekStreak: weekStreak(uid),
    weeks: Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)),
    exercises: Object.values(per).map(e => ({ ...e, points: Object.values(e.points) })).sort((a, b) => b.sets - a.sets),
  };
});

// Export
route('GET', '/api/users/:uid/export.csv', ({ uid }) => {
  const rows = q(`SELECT s.started_at, s.name, s.kind, s.duration_min, s.distance_km, l.exercise_id, l.set_no, l.weight, l.reps, l.seconds
                  FROM sessions s LEFT JOIN set_logs l ON l.session_id = s.id WHERE s.user_id = ? AND s.finished_at IS NOT NULL
                  ORDER BY s.started_at, l.exercise_id, l.set_no`).all(uid);
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['date;workout;type;exercise;set;weight_kg;reps;seconds;duration_min;distance_km',
    ...rows.map(r => [r.started_at, r.name, r.kind || 'strength', r.exercise_id ? (exById.get(r.exercise_id)?.name || r.exercise_id) : '', r.set_no, r.weight, r.reps, r.seconds, r.duration_min, r.distance_km].map(esc).join(';'))].join('\n');
  return { __raw: '﻿' + csv, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="homelift.csv"' } };
});

// Videor
const videos = require('./videos')({ dataDir: DATA_DIR, exById, exercises, HttpError, programExerciseIds });
function programExerciseIds() {
  const ids = new Set();
  for (const r of q('SELECT id FROM programs WHERE active = 1').all()) for (const t of getProgram(r.id).plan.templates) for (const i of t.items) ids.add(i.exerciseId);
  return [...ids];
}
route('GET', '/api/videos', () => videos.status());
route('POST', '/api/videos/download', (_, body) => videos.start(body.scope, body.id));
route('POST', '/api/videos/stop', () => videos.stop());
route('DELETE', '/api/videos', () => videos.removeAll());
route('DELETE', '/api/videos/:id', ({ id }) => videos.remove(decodeURIComponent(id)));

// Backup, export och import
const backup = require('./backup')({ db, dataDir: DATA_DIR, HttpError, VERSION, onImport: loadCustom });
route('GET', '/api/backups', () => backup.list());
route('POST', '/api/backups', () => backup.run());
route('GET', '/api/export.json', () => ({ __raw: JSON.stringify(backup.exportAll()), headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="homelift-${today()}.json"` } }));

// Home Assistant
const ha = require('./ha')({ VERSION, q, summary });
route('GET', '/api/ha/summary', () => ha.summaryAll());

// ---------- Bilder (hämtas en gång och sparas lokalt) ----------
async function serveImage(res, rel) {
  if (!/^[\w\-().,'%]+\/\d+\.jpg$/.test(rel)) return send(res, 400, 'Invalid image');
  const file = path.join(IMG_CACHE, rel.replace('/', '__'));
  if (!fs.existsSync(file)) {
    try {
      const r = await fetch(IMG_SOURCE + rel);
      if (!r.ok) return send(res, 404, 'Image not found');
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    } catch { return send(res, 502, 'Could not fetch image'); }
  }
  res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' });
  fs.createReadStream(file).pipe(res);
}

// ---------- Statiska filer ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
function serveStatic(res, pathname) {
  let file = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, 'No');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/img/')) return await serveImage(res, decodeURIComponent(url.pathname.slice(5)));
    if (url.pathname.startsWith('/videos/')) return videos.serve(req, res, decodeURIComponent(url.pathname.slice(8)));
    if (url.pathname.startsWith('/ha/')) return ha.serve(req, res, url);
    const up = url.pathname.match(/^\/api\/videos\/([^/]+)\/upload$/);
    if (up && req.method === 'POST') return send(res, 200, await videos.upload(req, decodeURIComponent(up[1])));
    if (url.pathname === '/api/import' && req.method === 'POST') return send(res, 200, await backup.importFrom(req));
    const bk = url.pathname.match(/^\/api\/backups\/([\w.-]+)$/);
    if (bk && req.method === 'GET') return backup.serve(res, bk[1]);
    if (url.pathname.startsWith('/api/')) {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = url.pathname.match(r.re);
        if (!m) continue;
        const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
        const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? await readBody(req) : {};
        const out = await r.handler(params, body, url);
        if (out && out.__raw) return send(res, 200, out.__raw, out.headers);
        return send(res, 200, out ?? { ok: true });
      }
      return send(res, 404, { error: 'Not found' });
    }
    serveStatic(res, url.pathname);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Server error' });
  }
});

server.listen(PORT, () => console.log(`HomeLift ${VERSION} körs på http://localhost:${PORT} (data: ${DATA_DIR})`));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { videos.stop(); backup.stopSchedule(); try { db.close(); } catch {} process.exit(0); });

'use strict';
// Säkerhetskopior (nattliga kopior av databasen), JSON-export och import.
const fs = require('node:fs');
const path = require('node:path');

const TABLES = ['users', 'programs', 'sessions', 'set_logs', 'bodyweight', 'measurements']; // i beroendeordning
const KEEP = 14;

module.exports = function backup({ db, dataDir, HttpError, VERSION }) {
  const DIR = path.join(dataDir, 'backups');
  fs.mkdirSync(DIR, { recursive: true });

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  function list() {
    return fs.readdirSync(DIR).filter(f => /^homelift-[\d-]+\.db$/.test(f)).sort().reverse()
      .map(name => { const st = fs.statSync(path.join(DIR, name)); return { name, size: st.size, created: st.mtime.toISOString() }; });
  }

  function run() {
    const name = `homelift-${today()}.db`;
    const file = path.join(DIR, name);
    fs.rmSync(file, { force: true });
    db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    // Behåll de senaste KEEP kopiorna
    for (const old of list().slice(KEEP)) fs.rmSync(path.join(DIR, old.name), { force: true });
    return { ok: true, name, backups: list() };
  }

  function serve(res, name) {
    const file = path.join(DIR, path.basename(name));
    if (!/^homelift-[\d-]+\.db$/.test(name) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${name}"`, 'Content-Length': fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  }

  function exportAll() {
    const data = {};
    for (const t of TABLES) data[t] = db.prepare(`SELECT * FROM ${t}`).all();
    return { app: 'HomeLift', version: VERSION, exported_at: new Date().toISOString(), tables: data };
  }

  // Ersätter all data med innehållet i en JSON-export. En säkerhetskopia tas först.
  function importFrom(req) {
    return new Promise((resolve, reject) => {
      const chunks = []; let size = 0;
      req.on('data', c => { size += c.length; if (size > 50 * 1024 * 1024) { req.destroy(); reject(new HttpError(413, 'File too large')); } else chunks.push(c); });
      req.on('error', reject);
      req.on('end', () => {
        let doc;
        try { doc = JSON.parse(Buffer.concat(chunks).toString('utf8').replace(/^﻿/, '')); } catch { return reject(new HttpError(400, 'Invalid JSON file')); }
        if (doc?.app !== 'HomeLift' || !doc.tables || !Array.isArray(doc.tables.users)) return reject(new HttpError(400, 'Not a HomeLift export'));
        try { run(); } catch {}
        const counts = {};
        db.exec('PRAGMA foreign_keys = OFF');
        db.exec('BEGIN');
        try {
          for (const t of [...TABLES].reverse()) db.exec(`DELETE FROM ${t}`);
          for (const t of TABLES) {
            const rows = Array.isArray(doc.tables[t]) ? doc.tables[t] : [];
            const cols = db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
            for (const row of rows) {
              const keys = Object.keys(row).filter(k => cols.includes(k));
              if (!keys.length) continue;
              db.prepare(`INSERT INTO ${t} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`)
                .run(...keys.map(k => row[k] === undefined ? null : row[k]));
            }
            counts[t] = rows.length;
          }
          db.exec('COMMIT');
        } catch (e) {
          db.exec('ROLLBACK');
          db.exec('PRAGMA foreign_keys = ON');
          return reject(new HttpError(400, 'Import failed: ' + e.message));
        }
        db.exec('PRAGMA foreign_keys = ON');
        resolve({ ok: true, imported: counts });
      });
    });
  }

  // Nattlig kopia kl 03:00 (och vid start om dagens saknas)
  let timer = null;
  function schedule() {
    const now = new Date();
    const next = new Date(now); next.setHours(3, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    timer = setTimeout(() => { try { run(); } catch (e) { console.error('Backup failed:', e.message); } schedule(); }, next - now);
    timer.unref?.();
  }
  schedule();
  setTimeout(() => {
    try { if (!list().length || !fs.existsSync(path.join(DIR, `homelift-${today()}.db`))) run(); } catch (e) { console.error('Backup failed:', e.message); }
  }, 5000).unref?.();
  const stopSchedule = () => clearTimeout(timer);

  return { list, run, serve, exportAll, importFrom, stopSchedule };
};

'use strict';
// Lokala instruktionsvideor: laddas ner till /data/videos och spelas upp därifrån, utan reklam.
// Nedladdning sker med yt-dlp (hämtas automatiskt till /data/bin och hålls uppdaterad).
const fs = require('node:fs');
const path = require('node:path');
const { spawn, execFile } = require('node:child_process');

const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const AVG_MB = 9; // ungefärlig storlek per video i 360p, för uppskattning

module.exports = function videos({ dataDir, exById, exercises, HttpError, programExerciseIds }) {
  const DIR = path.join(dataDir, 'videos');
  const BIN = path.join(dataDir, 'bin', 'yt-dlp');
  const INDEX = path.join(DIR, 'index.json');
  fs.mkdirSync(DIR, { recursive: true });

  const fileName = id => id.replace(/[^\w-]/g, '_') + '.mp4';
  let index = {};
  try { index = JSON.parse(fs.readFileSync(INDEX, 'utf8')); } catch {}
  // Rensa poster vars fil försvunnit
  for (const id of Object.keys(index)) if (!fs.existsSync(path.join(DIR, fileName(id)))) delete index[id];
  const saveIndex = () => fs.writeFileSync(INDEX, JSON.stringify(index));

  // Inbäddade videor: ett YouTube-id per övning, hittas vid första visningen och sparas
  const EMBEDS = path.join(DIR, 'embeds.json');
  let embeds = {};
  try { embeds = JSON.parse(fs.readFileSync(EMBEDS, 'utf8')); } catch {}
  const saveEmbeds = () => fs.writeFileSync(EMBEDS, JSON.stringify(embeds));
  const query = ex => `${ex.name} exercise how to proper form`;

  const job = { running: false, stopRequested: false, queue: [], total: 0, done: 0, failed: [], current: null, error: null, scope: null, child: null };

  const has = id => !!index[id];
  const info = id => index[id] ? { url: '/videos/' + encodeURIComponent(fileName(id)), ...index[id] } : null;

  function dirSize() {
    let bytes = 0;
    for (const f of fs.readdirSync(DIR)) if (f.endsWith('.mp4')) bytes += fs.statSync(path.join(DIR, f)).size;
    return bytes;
  }
  function status() {
    const prog = programExerciseIds();
    return {
      count: Object.keys(index).length,
      bytes: dirSize(),
      totalExercises: exercises.length,
      programExercises: prog.length,
      programDownloaded: prog.filter(has).length,
      estimateAllGB: Math.round(exercises.length * AVG_MB / 100) / 10,
      estimateProgramMB: prog.filter(id => !has(id)).length * AVG_MB,
      job: {
        running: job.running, total: job.total, done: job.done, failed: job.failed.length,
        current: job.current && exById.get(job.current)?.name, error: job.error, scope: job.scope,
        lastError: job.failed.length ? job.failed[job.failed.length - 1].error : null,
        failures: job.failed.slice(-5).map(f => ({ id: f.id, name: exById.get(f.id)?.name, error: f.error })),
      },
    };
  }

  // Gör om yt-dlp:s felutskrift till en läsbar rad
  const cleanError = (text, fallback) => {
    const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
    const line = lines.filter(l => /ERROR/.test(l)).pop() || lines.pop() || fallback || 'Unknown error';
    return line.replace(/^ERROR:\s*/, '').replace(/\[youtube\]\s*[\w-]{11}:\s*/, '').slice(0, 300);
  };
  const run = (cmd, args, opts = {}) => new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 120000, ...opts }, (err, stdout, stderr) => err ? reject(new Error(cleanError(stderr, err.message))) : resolve(stdout));
  });
  // YouTube kräver numera att en JavaScript-motor löser deras utmaningar. Node finns redan i containern.
  const ytArgs = () => ['--js-runtimes', `node:${process.execPath}`, '--remote-components', 'ejs:github', '--cache-dir', path.join(dataDir, 'bin', 'cache')];

  // Hämta yt-dlp första gången, uppdatera den sedan inför varje omgång (YouTube ändras ofta)
  async function ensureYtdlp() {
    try { await run('python3', ['--version']); } catch { throw new Error('python3 is missing in the container. Update the HomeLift image.'); }
    if (!fs.existsSync(BIN)) {
      fs.mkdirSync(path.dirname(BIN), { recursive: true });
      let r;
      try { r = await fetch(YTDLP_URL); } catch (e) { throw new Error('Could not download yt-dlp from GitHub: ' + (e.cause?.code || e.message)); }
      if (!r.ok) throw new Error('Could not download yt-dlp from GitHub (HTTP ' + r.status + ')');
      fs.writeFileSync(BIN, Buffer.from(await r.arrayBuffer()), { mode: 0o755 });
    } else {
      await run('python3', [BIN, '-U'], { timeout: 180000 }).catch(() => {});
    }
  }

  // Sök fram ett YouTube-id. Först via sökresultatsidan (snabbt), annars via yt-dlp.
  async function searchYoutube(ex) {
    try {
      const r = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(query(ex)) + '&hl=en', {
        headers: { 'Accept-Language': 'en', Cookie: 'CONSENT=YES+1; SOCS=CAI', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' },
        signal: AbortSignal.timeout(15000),
      });
      const html = await r.text();
      const ids = [...html.matchAll(/"videoRenderer":\{"videoId":"([\w-]{11})"/g)].map(m => m[1]);
      if (ids.length) {
        const title = /"videoRenderer":\{"videoId":"[\w-]{11}".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/s.exec(html)?.[1];
        return { videoId: ids[0], title: title ? JSON.parse('"' + title + '"') : null };
      }
    } catch {}
    await ensureYtdlp();
    const out = await run('python3', [BIN, ...ytArgs(), `ytsearch1:${query(ex)}`, '--flat-playlist', '--print', '%(id)s\t%(title)s', '--quiet', '--no-warnings'], { timeout: 60000 });
    const [videoId, title] = out.trim().split('\n').pop().split('\t');
    if (!/^[\w-]{11}$/.test(videoId || '')) throw new HttpError(404, 'No video found');
    return { videoId, title: title || null };
  }

  const embedInfo = id => embeds[id] ? { ...embeds[id] } : null;
  const searching = new Map();
  async function findEmbed(id) {
    const ex = exById.get(id);
    if (!ex) throw new HttpError(404, 'Exercise not found');
    if (embeds[id]) return embedInfo(id);
    if (!searching.has(id)) searching.set(id, searchYoutube(ex).finally(() => searching.delete(id)));
    try {
      const found = await searching.get(id);
      embeds[id] = { ...found, found: new Date().toISOString() };
      saveEmbeds();
      return embedInfo(id);
    } catch (e) {
      throw e instanceof HttpError ? e : new HttpError(502, 'Could not search YouTube: ' + e.message);
    }
  }
  // Välj en egen video (klistra in en YouTube-länk), eller tom för att söka om
  function setEmbed(id, url) {
    if (!exById.has(id)) throw new HttpError(404, 'Exercise not found');
    if (!url) { delete embeds[id]; saveEmbeds(); return null; }
    const m = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/.exec(url) || /^([\w-]{11})$/.exec(String(url).trim());
    if (!m) throw new HttpError(400, 'Not a YouTube link');
    embeds[id] = { videoId: m[1], title: null, custom: true, found: new Date().toISOString() };
    saveEmbeds();
    return embedInfo(id);
  }

  function downloadOne(id) {
    const ex = exById.get(id);
    const tmp = path.join(DIR, '.tmp-' + fileName(id));
    return new Promise((resolve, reject) => {
      // Samma video som visas inbäddad laddas ner, annars den första sökträffen
      const target = embeds[id]?.videoId ? `https://www.youtube.com/watch?v=${embeds[id].videoId}` : `ytsearch1:${query(ex)}`;
      const args = [BIN, ...ytArgs(), target,
        '-f', '18/b[ext=mp4][height<=480]/b[ext=mp4]/b',
        '--match-filter', 'duration < 600', '--max-filesize', '80M', '--no-playlist', '--no-part',
        '--no-simulate', '--print', '%(title)s\t%(channel)s\t%(webpage_url)s\t%(duration)s',
        '--quiet', '--force-overwrites', '-o', tmp];
      const child = job.child = spawn('python3', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '', err = '';
      child.stdout.on('data', d => out += d);
      child.stderr.on('data', d => err += d);
      const timer = setTimeout(() => child.kill('SIGKILL'), 10 * 60 * 1000);
      child.on('close', code => {
        clearTimeout(timer); job.child = null;
        if (code === 0 && fs.existsSync(tmp) && fs.statSync(tmp).size > 10000) {
          fs.renameSync(tmp, path.join(DIR, fileName(id)));
          const [title, channel, url] = out.trim().split('\n').pop().split('\t');
          index[id] = { title, channel, source: url, size: fs.statSync(path.join(DIR, fileName(id))).size, added: new Date().toISOString() };
          saveIndex();
          resolve();
        } else {
          fs.rmSync(tmp, { force: true });
          reject(new Error(cleanError(err, code === null ? 'Stopped or timed out' : 'No matching video found')));
        }
      });
    });
  }

  async function loop() {
    try {
      await ensureYtdlp();
      while (job.queue.length && !job.stopRequested) {
        job.current = job.queue.shift();
        try { await downloadOne(job.current); } catch (e) {
          job.failed.push({ id: job.current, error: e.message });
          // Spärrar YouTube nedladdningar är det ingen idé att fortsätta
          if (/Sign in to confirm|HTTP Error 429|python3|yt-dlp/i.test(e.message) && job.failed.length >= 3) { job.error = e.message; break; }
        }
        job.done++;
      }
    } catch (e) { job.error = e.message; }
    job.running = false; job.current = null; job.stopRequested = false;
  }

  function start(scope, id) {
    if (job.running) throw new HttpError(409, 'A download is already running');
    let ids;
    if (scope === 'one') { if (!exById.has(id)) throw new HttpError(404, 'Exercise not found'); ids = [id]; }
    else if (scope === 'all') ids = exercises.map(e => e.id);
    else ids = programExerciseIds();
    ids = ids.filter(i => !has(i));
    Object.assign(job, { running: true, stopRequested: false, queue: ids, total: ids.length, done: 0, failed: [], current: null, error: null, scope: scope || 'program' });
    loop();
    return status();
  }
  function stop() {
    if (job.running) { job.stopRequested = true; job.queue = []; job.child?.kill('SIGKILL'); }
    return status();
  }
  function remove(id) {
    fs.rmSync(path.join(DIR, fileName(id)), { force: true });
    delete index[id]; saveIndex();
    return status();
  }
  function removeAll() {
    stop();
    for (const id of Object.keys(index)) fs.rmSync(path.join(DIR, fileName(id)), { force: true });
    index = {}; saveIndex();
    return status();
  }

  // Egen videofil för en övning (t.ex. inspelad själv)
  function upload(req, id) {
    if (!exById.has(id)) throw new HttpError(404, 'Exercise not found');
    const tmp = path.join(DIR, '.up-' + fileName(id));
    return new Promise((resolve, reject) => {
      let size = 0;
      const out = fs.createWriteStream(tmp);
      req.on('data', c => { size += c.length; if (size > 500 * 1024 * 1024) { req.destroy(); out.destroy(); fs.rmSync(tmp, { force: true }); reject(new HttpError(413, 'File too large (max 500 MB)')); } });
      req.pipe(out);
      out.on('finish', () => {
        if (size < 1000) { fs.rmSync(tmp, { force: true }); return reject(new HttpError(400, 'Empty file')); }
        fs.renameSync(tmp, path.join(DIR, fileName(id)));
        index[id] = { title: decodeURIComponent(req.headers['x-filename'] || 'Egen video'), channel: null, source: null, size, added: new Date().toISOString(), uploaded: true };
        saveIndex();
        resolve(info(id));
      });
      out.on('error', reject);
    });
  }

  // Uppspelning med stöd för Range (krävs av Safari på iPhone)
  function serve(req, res, name) {
    const file = path.join(DIR, path.basename(name));
    if (!name.endsWith('.mp4') || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    const size = fs.statSync(file).size;
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    const headers = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=86400' };
    if (m) {
      const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
      const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
      if (start >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { ...headers, 'Content-Length': size });
      fs.createReadStream(file).pipe(res);
    }
  }

  return { has, info, status, start, stop, remove, removeAll, upload, serve, embedInfo, findEmbed, setEmbed };
};

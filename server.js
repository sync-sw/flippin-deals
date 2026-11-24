// Flippin Deals – control server.
// Serves the game and keeps every open screen in sync: one shared settings
// file, plus commands (flip back, reshuffle, peek, start screen, play) that
// are pushed live to every connected device. No dependencies.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const CFG_FILE = path.join(DATA_DIR, 'config.json');
const SCORE_FILE = path.join(DATA_DIR, 'scores.json');
const LOG_FILE = path.join(DATA_DIR, 'log.json');
const MAX_LOG = 2000, MAX_SCORES = 500;
const INDEX = path.join(__dirname, 'index.html');
const MAX_BODY = 25 * 1024 * 1024;           // settings can carry uploaded images
const COMMANDS = ['flipBack', 'shuffle', 'peek', 'home', 'play'];

fs.mkdirSync(DATA_DIR, { recursive: true });
let cfg = null, rev = 0;
try { cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')); rev = 1; } catch (e) { /* no saved settings yet */ }
let scores = [], logs = [];
try { scores = JSON.parse(fs.readFileSync(SCORE_FILE, 'utf8')); } catch (e) { /* none yet */ }
try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch (e) { /* none yet */ }

// Written a moment after the last change, so a burst of events is one disk write.
const timers = {};
function saveSoon(file, get) {
  clearTimeout(timers[file]);
  timers[file] = setTimeout(() => {
    const tmp = file + '.tmp';
    fs.writeFile(tmp, JSON.stringify(get()), e => { if (!e) fs.rename(tmp, file, () => {}); else console.error('save failed:', e.message); });
  }, 1000);
}

const clients = new Set();                   // open event streams
function send(res, event, data) { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
function broadcast(event, data) { for (const c of clients) send(c, event, data); }
const announce = () => broadcast('clients', { count: clients.size });

// Event log: the last MAX_LOG events from every screen plus the server's own, shown live on admin pages.
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
function addLogs(entries) {
  logs = logs.concat(entries).slice(-MAX_LOG);
  broadcast('log', { entries });
  saveSoon(LOG_FILE, () => logs);
}
const slog = (ev, d) => addLogs([{ ts: Date.now(), dev: 'srv', role: 'server', ev, d: d || '' }]);

function readJson(req, cb) {
  let size = 0; const chunks = [];
  req.on('data', d => { size += d.length; if (size > MAX_BODY) { req.destroy(); return; } chunks.push(d); });
  req.on('end', () => { try { cb(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { cb(e); } });
  req.on('error', cb);
}
function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  // The same page serves both roles: at "/" it is the game only, at "/admin" it is the options panel.
  if (req.method === 'GET' && (p === '/' || p === '/index.html' || p === '/admin' || p === '/admin/')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    return fs.createReadStream(INDEX).pipe(res);
  }
  if (req.method === 'GET' && p === '/healthz') return json(res, 200, { ok: true });

  if (req.method === 'GET' && p === '/api/state') return json(res, 200, { rev, cfg });

  if (req.method === 'GET' && p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    const who = str(url.searchParams.get('role') || 'screen', 10) + '·' + str(url.searchParams.get('id') || '?', 8);
    clients.add(res); announce(); slog('connected', who + ' · ' + clients.size + ' online');
    req.on('close', () => { clients.delete(res); announce(); slog('disconnected', who + ' · ' + clients.size + ' online'); });
    return;
  }

  if (req.method === 'PUT' && p === '/api/config') {
    return readJson(req, (err, body) => {
      if (err || !body || typeof body.cfg !== 'object' || !Array.isArray(body.cfg.products) || !body.cfg.products.length)
        return json(res, 400, { error: 'invalid settings' });
      cfg = body.cfg; rev++;
      const tmp = CFG_FILE + '.tmp';
      fs.writeFile(tmp, JSON.stringify(cfg), e => { if (!e) fs.rename(tmp, CFG_FILE, () => {}); else console.error('save failed:', e.message); });
      broadcast('config', { from: body.from || '', rev, cfg });
      slog('settings-saved', 'rev ' + rev + ' from ' + str(body.from, 4) + ' · ' + cfg.cols + '×' + cfg.rows + ' · seed ' + cfg.seed);
      json(res, 200, { rev });
    });
  }

  if (req.method === 'POST' && p === '/api/command') {
    return readJson(req, (err, body) => {
      if (err || !body || !COMMANDS.includes(body.cmd)) return json(res, 400, { error: 'unknown command' });
      broadcast('command', { from: body.from || '', cmd: body.cmd });
      slog('command', body.cmd + ' from ' + str(body.from, 4));
      json(res, 200, { ok: true, screens: clients.size });
    });
  }

  if (p === '/api/log') {
    if (req.method === 'GET') return json(res, 200, { entries: logs });
    if (req.method === 'DELETE') { logs = []; saveSoon(LOG_FILE, () => logs); broadcast('logclear', {}); return json(res, 200, { ok: true }); }
    if (req.method === 'POST') return readJson(req, (err, body) => {
      if (err || !body || !Array.isArray(body.entries)) return json(res, 400, { error: 'invalid log' });
      const now = Date.now();
      addLogs(body.entries.slice(0, 50).map(e => ({ ts: now, dev: str(e.dev, 8), role: e.role === 'admin' ? 'admin' : 'game', ev: str(e.ev, 40), d: str(e.d, 300),
        ...(Number.isFinite(e.ts) ? { ts: e.ts } : {}) })));
      json(res, 200, { ok: true });
    });
  }

  if (p === '/api/scores' && req.method === 'GET') return json(res, 200, { scores });
  if (p === '/api/scores' && req.method === 'DELETE') {
    scores = []; saveSoon(SCORE_FILE, () => scores); broadcast('scores', { scores }); slog('scores-cleared');
    return json(res, 200, { ok: true });
  }
  if (p === '/api/score' && req.method === 'POST') {
    return readJson(req, (err, b) => {
      const n = v => Number.isFinite(v) && v >= 0 && v < 1e6;
      if (err || !b || ![b.turns, b.secs, b.cols, b.rows, b.pairs].every(n)) return json(res, 400, { error: 'invalid score' });
      const sc = { ts: Date.now(), turns: b.turns | 0, secs: b.secs | 0, cols: b.cols | 0, rows: b.rows | 0, pairs: b.pairs | 0, sur: b.sur | 0, dev: str(b.dev, 8) };
      scores = scores.concat([sc]).slice(-MAX_SCORES);
      saveSoon(SCORE_FILE, () => scores); broadcast('scores', { scores });
      slog('score', sc.turns + ' turns · ' + sc.secs + 's · ' + sc.cols + '×' + sc.rows + ' from ' + sc.dev);
      json(res, 200, { ok: true });
    });
  }

  json(res, 404, { error: 'not found' });
}).listen(PORT, () => { console.log(`Flippin Deals on http://localhost:${PORT}  (admin: /admin)`); slog('server-started', 'port ' + PORT); });

setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 25000);   // keeps proxies from closing idle streams

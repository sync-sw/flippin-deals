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
const INDEX = path.join(__dirname, 'index.html');
const MAX_BODY = 25 * 1024 * 1024;           // settings can carry uploaded images
const COMMANDS = ['flipBack', 'shuffle', 'peek', 'home', 'play'];

fs.mkdirSync(DATA_DIR, { recursive: true });
let cfg = null, rev = 0;
try { cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')); rev = 1; } catch (e) { /* no saved settings yet */ }

const clients = new Set();                   // open event streams
function send(res, event, data) { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
function broadcast(event, data) { for (const c of clients) send(c, event, data); }
const announce = () => broadcast('clients', { count: clients.size });

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

  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    return fs.createReadStream(INDEX).pipe(res);
  }
  if (req.method === 'GET' && p === '/admin') { res.writeHead(302, { Location: '/#admin' }); return res.end(); }
  if (req.method === 'GET' && p === '/healthz') return json(res, 200, { ok: true });

  if (req.method === 'GET' && p === '/api/state') return json(res, 200, { rev, cfg });

  if (req.method === 'GET' && p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    clients.add(res); announce();
    req.on('close', () => { clients.delete(res); announce(); });
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
      json(res, 200, { rev });
    });
  }

  if (req.method === 'POST' && p === '/api/command') {
    return readJson(req, (err, body) => {
      if (err || !body || !COMMANDS.includes(body.cmd)) return json(res, 400, { error: 'unknown command' });
      broadcast('command', { from: body.from || '', cmd: body.cmd });
      json(res, 200, { ok: true, screens: clients.size });
    });
  }

  json(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log(`Flippin Deals on http://localhost:${PORT}  (admin: /admin)`));

setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 25000);   // keeps proxies from closing idle streams

// Node-Server für den Betrieb auf eigenem Server (z. B. Docker). Liefert public/ aus und bedient /api/*.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler, readConfig } from './src/handler.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT ?? 3000);
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(self), geolocation=(), microphone=()',
};

// Bricht Uploads ab, die grösser als erlaubt sind (auch ohne Content-Length-Header)
function limitStream(maxBytes) {
  let seen = 0;
  return new Transform({
    transform(chunk, _enc, cb) {
      seen += chunk.length;
      if (seen > maxBytes) cb(new Error('Anfrage zu gross'));
      else cb(null, chunk);
    },
  });
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

async function sendResponse(res, response) {
  const headers = Object.fromEntries(response.headers);
  res.writeHead(response.status, { ...SECURITY_HEADERS, ...headers });
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function serveStatic(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403, SECURITY_HEADERS).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
  }
}

export function createServer(handler, { maxBodyBytes } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname === '/api/config') return await sendResponse(res, await handler.handleConfig());
      if (pathname === '/api/submit') {
        const request = new Request(new URL(req.url, 'http://localhost'), {
          method: req.method,
          headers: req.headers,
          body: req.method === 'POST' ? Readable.toWeb(maxBodyBytes ? req.pipe(limitStream(maxBodyBytes)) : req) : undefined,
          duplex: 'half',
        });
        return await sendResponse(res, await handler.handleSubmit(request, { ip: clientIp(req) }));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, SECURITY_HEADERS).end();
        return;
      }
      await serveStatic(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.writeHead(500, SECURITY_HEADERS);
      res.end();
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = readConfig(process.env);
  const server = createServer(createHandler({ config }), { maxBodyBytes: config.maxTotalBytes + 1024 * 1024 });
  server.listen(PORT, () => console.log(`Schadenmeldung läuft auf http://localhost:${PORT}`));
}

// A small static file server for src/, using only Node's built-in modules.
// Browsers refuse to load JavaScript modules from a page opened directly from
// disk, so the app has to be served over HTTP (D-17, D-23).
//
// Usage: npm start            (http://localhost:8080)
//        PORT=3000 npm start  (any other port)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../src', import.meta.url)));
const PORT = Number.parseInt(process.env.PORT ?? '8080', 10);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', // must be a JavaScript type, or modules are blocked
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  let path;
  try {
    path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  if (path.endsWith('/')) path += 'index.html';

  // Refuse anything that resolves outside src/, such as /../package.json.
  const file = resolve(ROOT, '.' + path);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Start on another port, for example: PORT=3000 npm start`);
  } else {
    console.error(`Could not start the server: ${error.message}`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Tip and Bill Splitter is running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});

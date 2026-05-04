// server.js — Local dev server with TTS proxy for Arabic speech
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8085;
const STATIC_ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

function serveStatic(req, res) {
  let filePath = path.join(STATIC_ROOT, decodeURIComponent(url.parse(req.url).pathname));

  // Default to index.html
  if (filePath.endsWith(path.sep) || filePath === STATIC_ROOT) {
    filePath = path.join(filePath, 'index.html');
  }

  // Try with .html extension if file doesn't exist
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

function proxyTTS(req, res) {
  const parsed = url.parse(req.url, true);
  const text = parsed.query.q;
  const lang = parsed.query.tl || 'ar';

  if (!text) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Missing q parameter');
    return;
  }

  const encodedText = encodeURIComponent(text);
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
    }
  };

  https.get(ttsUrl, options, (ttsRes) => {
    if (ttsRes.statusCode !== 200) {
      // Try alternative URL
      const altUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${lang}&client=gtx&q=${encodedText}`;
      https.get(altUrl, options, (altRes) => {
        if (altRes.statusCode !== 200) {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end('TTS service unavailable');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        });
        altRes.pipe(res);
      }).on('error', () => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('TTS fetch error');
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });
    ttsRes.pipe(res);
  }).on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('TTS fetch error');
  });
}

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;

  // TTS proxy endpoint
  if (pathname === '/api/tts') {
    proxyTTS(req, res);
    return;
  }

  // Everything else: static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  🎓 NeuroPedago Server running at:`);
  console.log(`  ➜  http://localhost:${PORT}/`);
  console.log(`  ➜  TTS API: http://localhost:${PORT}/api/tts?q=مرحبا&tl=ar`);
  console.log(`\n  Press Ctrl+C to stop.\n`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8323;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // 防止路径穿越
  const realRoot = path.resolve(ROOT);
  const realFile = path.resolve(filePath);
  if (!realFile.startsWith(realRoot + path.sep) && realFile !== realRoot) {
    filePath = path.join(ROOT, 'index.html');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      fs.readFile(path.join(ROOT, 'index.html'), (e, data) => {
        if (e) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(data);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e, data) => {
      if (e) {
        res.writeHead(500);
        res.end('Read error');
        return;
      }
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
}).listen(PORT, () => {
  console.log(`Blog preview running at http://localhost:${PORT}`);
});

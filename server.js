const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { calculateTotal } = require('./src/checkout');
const PORT = Number(process.env.PORT || 3000);
const products = [{ id: 'headphones', name: 'Wireless Headphones', price: 25, quantity: 1 }];
const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'application/javascript; charset=utf-8'] };
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/checkout') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 10000) req.destroy(); });
    req.on('end', () => {
      try {
        const { discountCode = '' } = JSON.parse(body);
        if (typeof discountCode !== 'string') throw Error('Invalid discount code');
        const code = discountCode.trim().toUpperCase();
        const subtotal = 25;
        const total = calculateTotal(products, code);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ subtotal, discount: code === 'SAVE30' ? 30 : code === 'SAVE25' ? 25 : code === 'SAVE10' ? 10 : 0, total, code }));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Invalid request' })); }
    });
    return;
  }
  const file = files[req.url];
  if (req.method !== 'GET' || !file) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(__dirname, 'public', file[0]), (err, data) => {
    if (err) { res.writeHead(500); res.end('File unavailable'); return; }
    res.writeHead(200, { 'Content-Type': file[1] }); res.end(data);
  });
});
if (require.main === module) server.listen(PORT, () => console.log(`CartFlow running at http://localhost:${PORT}`));
module.exports = { server };

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { products } = require('./src/catalog');
const { getDiscount } = require('./src/checkout');
const { createOrder } = require('./src/orders');
const PORT = Number(process.env.PORT || 3000);
const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'application/javascript; charset=utf-8'] };
function sendJson(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
function readJson(req, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk; if (body.length > 10000) req.destroy(); });
  req.on('end', () => {
    let data;
    try { data = JSON.parse(body || '{}'); } catch { sendJson(req.res, 400, { error: 'Invalid JSON' }); return; }
    callback(data);
  });
}
const server = http.createServer((req, res) => {
  req.res = res;
  if (req.method === 'GET' && req.url === '/api/products') { sendJson(res, 200, { products }); return; }
  if (req.method === 'POST' && req.url === '/api/discount') {
    readJson(req, ({ code = '' }) => {
      const normalized = String(code).trim().toUpperCase();
      const discount = getDiscount(normalized);
      if (!discount) { sendJson(res, 404, { error: 'That discount code is not valid' }); return; }
      sendJson(res, 200, { code: normalized, discount });
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/api/orders') {
    readJson(req, ({ items, discountCode = '' }) => {
      try {
        const order = createOrder(items, String(discountCode).trim().toUpperCase() || null);
        sendJson(res, 201, order);
      } catch (error) {
        console.error('Checkout failed:', error);
        sendJson(res, 500, { error: 'We couldn\'t place your order. Please try again.' });
      }
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
if (require.main === module) server.listen(PORT, () => console.log(`Brightwell Goods running at http://localhost:${PORT}`));
module.exports = { server };

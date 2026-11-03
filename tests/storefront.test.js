const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { server } = require('../server');

let baseUrl;
test.before(() => new Promise(resolve => server.listen(0, () => { baseUrl = `http://localhost:${server.address().port}`; resolve(); })));
test.after(() => new Promise(resolve => server.close(resolve)));

// Runs public/app.js against a minimal DOM stub so the test exercises the exact payload the browser sends.
function loadStorefront() {
  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', innerHTML: '', className: '', hidden: false, disabled: false, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; } });
    return elements.get(id);
  };
  const documentHandlers = {};
  const document = { getElementById: $, addEventListener: (type, fn) => { documentHandlers[type] = fn; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'), { document, fetch: (url, options) => fetch(baseUrl + url, options) });
  return { $, click: dataset => documentHandlers.click({ target: { dataset } }) };
}

async function waitFor(condition) {
  for (let i = 0; i < 100 && !condition(); i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.ok(condition(), 'timed out waiting for storefront');
}

test('storefront checkout places an order after a discount code is applied', async () => {
  const { $, click } = loadStorefront();
  await waitFor(() => $('products').innerHTML !== '');
  click({ add: 'keyboard' });
  $('code').value = 'save10';
  await $('discount-form').handlers.submit({ preventDefault() {} });
  assert.equal($('notice').textContent, 'Discount SAVE10 applied.');
  await $('checkout').handlers.click();
  assert.notEqual($('notice').className, 'notice error', $('notice').textContent);
  assert.match($('order-id').textContent, /^BW-\d+$/);
  assert.equal($('order-total').textContent, '$79.00');
});

test('storefront checkout places an order after a percentage discount code is applied', async () => {
  const { $, click } = loadStorefront();
  await waitFor(() => $('products').innerHTML !== '');
  click({ add: 'keyboard' });
  $('code').value = 'welcome15';
  await $('discount-form').handlers.submit({ preventDefault() {} });
  assert.equal($('notice').textContent, 'Discount WELCOME15 applied.');
  assert.equal($('discount').textContent, '−$13.35');
  assert.equal($('total').textContent, '$75.65');
  await $('checkout').handlers.click();
  assert.notEqual($('notice').className, 'notice error', $('notice').textContent);
  assert.match($('order-id').textContent, /^BW-\d+$/);
  assert.equal($('order-total').textContent, '$75.65');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrder } = require('../src/orders');
test('creates an order with priced items', () => {
  const order = createOrder([{ id: 'headphones', quantity: 2 }, { id: 'speaker', quantity: 1 }]);
  assert.equal(order.subtotal, 90); assert.equal(order.total, 90); assert.match(order.orderId, /^BW-\d+$/);
});
test('applies a discount code to the order', () => { assert.equal(createOrder([{ id: 'keyboard', quantity: 1 }], 'SAVE10').total, 79); });
test('prices a percentage discount code on the order', () => {
  const order = createOrder([{ id: 'keyboard', quantity: 1 }], 'WELCOME15');
  assert.equal(order.discount, 13.35); assert.equal(order.total, 75.65);
});
test('rejects an empty cart', () => { assert.throws(() => createOrder([]), /Cart is empty/); });

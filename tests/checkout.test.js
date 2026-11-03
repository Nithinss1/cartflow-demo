const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTotal } = require('../src/checkout');
test('calculates total without discount', () => { assert.equal(calculateTotal([{ price: 25, quantity: 1 }]), 25); });
test('applies a valid discount', () => { assert.equal(calculateTotal([{ price: 50, quantity: 1 }], 'SAVE10'), 40); });
test('applies a discount equal to subtotal', () => { assert.equal(calculateTotal([{ price: 25, quantity: 1 }], 'SAVE25'), 0); });
test('caps the total at zero for discounts larger than the subtotal', () => { assert.equal(calculateTotal([{ price: 25, quantity: 1 }], 'SAVE30'), 0); });
test('applies a percentage discount to the subtotal', () => {
  assert.equal(calculateTotal([{ price: 89, quantity: 1 }], 'WELCOME15'), 75.65);
  assert.equal(calculateTotal([{ price: 89, quantity: 1 }], 'VIP20'), 71.2);
});
// The missing edge case should be discovered and tested by Factory.

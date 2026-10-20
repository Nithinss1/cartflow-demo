const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTotal } = require('../src/checkout');

test('calculates total without a discount', () => {
  assert.equal(calculateTotal([{ price: 20, quantity: 2 }]), 40);
});

test('applies a valid discount', () => {
  assert.equal(calculateTotal([{ price: 50, quantity: 1 }], 'SAVE10'), 40);
});

// Regression test for the incoming bug report will be added during investigation.

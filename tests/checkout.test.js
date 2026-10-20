const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTotal } = require('../src/checkout');
test('calculates total without discount', () => { assert.equal(calculateTotal([{ price: 25, quantity: 1 }]), 25); });
test('applies a valid discount', () => { assert.equal(calculateTotal([{ price: 50, quantity: 1 }], 'SAVE10'), 40); });
test('applies a discount equal to subtotal', () => { assert.equal(calculateTotal([{ price: 25, quantity: 1 }], 'SAVE25'), 0); });
// The missing edge case should be discovered and tested by Factory.

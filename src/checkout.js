/** CartFlow checkout calculation. Prices are in USD. */
function calculateTotal(items, discountCode = null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discounts = { SAVE10: 10, SAVE25: 25, SAVE30: 30 };
  const discount = discountCode ? (discounts[discountCode] || 0) : 0;
  // BUG: fixed discounts greater than the subtotal produce negative totals.
  return Math.round((subtotal - discount) * 100) / 100;
}
module.exports = { calculateTotal };

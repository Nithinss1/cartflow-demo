/** CartFlow checkout calculation. Prices are in USD. */
function calculateTotal(items, discountCode = null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discounts = { SAVE10: 10, SAVE25: 25, SAVE30: 30 };
  const discount = discountCode ? (discounts[discountCode] || 0) : 0;
  // Fixed discounts are capped at the subtotal so the total can never go negative.
  return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
}
module.exports = { calculateTotal };

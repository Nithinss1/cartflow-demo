/** CartFlow checkout calculation. Prices are in USD. */
const DISCOUNTS = { SAVE10: 10, SAVE25: 25, SAVE30: 30 };
function getDiscount(discountCode) { return discountCode ? (DISCOUNTS[discountCode] || 0) : 0; }
function calculateTotal(items, discountCode = null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = getDiscount(discountCode);
  // Fixed discounts are capped at the subtotal so the total can never go negative.
  return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
}
module.exports = { calculateTotal, getDiscount };

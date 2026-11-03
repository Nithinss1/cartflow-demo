/** Brightwell Goods checkout calculation. Prices are in USD. */
const DISCOUNTS = { SAVE10: 10, SAVE25: 25, SAVE30: 30 };
// Percentage codes take a share of the subtotal instead of a fixed amount.
const PERCENT_DISCOUNTS = { WELCOME15: 15, VIP20: 20 };
function isPercentCode(discountCode) { return Boolean(discountCode && PERCENT_DISCOUNTS[discountCode]); }
function getDiscount(discountCode, subtotal) {
  if (!discountCode) return 0;
  if (isPercentCode(discountCode)) return Math.round(subtotal * PERCENT_DISCOUNTS[discountCode]) / 100 * 100;
  return DISCOUNTS[discountCode] || 0;
}
function calculateTotal(items, discountCode = null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = getDiscount(discountCode, subtotal);
  return Math.round((subtotal - discount) * 100) / 100;
}
module.exports = { calculateTotal, getDiscount, isPercentCode };

/** Calculate a checkout total in dollars. */
function calculateTotal(items, discountCode = null) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discounts = { SAVE10: 10, SAVE25: 25 };
  const discount = discountCode ? (discounts[discountCode] || 0) : 0;
  // Intentional defect: a fixed discount can make the final total negative.
  return Math.round((subtotal - discount) * 100) / 100;
}
module.exports = { calculateTotal };

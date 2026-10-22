/** CartFlow order placement. Validates cart lines against the catalog and prices the order. */
const { findProduct } = require('./catalog');
const { calculateTotal, getDiscount } = require('./checkout');
let nextOrderNumber = 1001;
function createOrder(lines, discountCode = null) {
  if (!Array.isArray(lines) || lines.length === 0) throw new Error('Cart is empty');
  const items = lines.map(line => {
    const product = findProduct(line.id);
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error(`Invalid quantity for ${product.name}`);
    return { id: product.id, name: product.name, price: product.price, quantity: line.quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { orderId: `CF-${nextOrderNumber++}`, items, subtotal, discount: getDiscount(discountCode), total: calculateTotal(items, discountCode) };
}
module.exports = { createOrder };

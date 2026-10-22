const $ = id => document.getElementById(id);
const money = value => `$${value.toFixed(2)}`;
const cart = new Map();
let products = [];
let applied = { code: '', discount: 0 };
function setNotice(text, isError = false) { $('notice').textContent = text; $('notice').className = isError ? 'notice error' : 'notice'; }
function renderProducts() {
  $('products').innerHTML = products.map(p => `<article class="card product-card"><div class="product-art" style="background:${p.tint}">${p.emoji}</div><strong>${p.name}</strong><span class="variant">${p.variant}</span><div class="buy"><strong>${money(p.price)}</strong><button type="button" data-add="${p.id}">Add to bag</button></div></article>`).join('');
}
function renderCart() {
  const lines = [...cart].map(([id, quantity]) => ({ ...products.find(p => p.id === id), quantity }));
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  $('cart-lines').innerHTML = lines.map(line => `<li><span class="mini-art" style="background:${line.tint}">${line.emoji}</span><div><strong>${line.name}</strong><span>${money(line.price)} each</span></div><div class="qty"><button type="button" data-dec="${line.id}" aria-label="Remove one">−</button><span>${line.quantity}</span><button type="button" data-inc="${line.id}" aria-label="Add one">+</button></div></li>`).join('');
  $('empty').hidden = count > 0;
  $('cart-count').textContent = count;
  $('item-count').textContent = `${count} item${count === 1 ? '' : 's'}`;
  $('subtotal').textContent = money(subtotal);
  $('discount').textContent = `−${money(Math.min(applied.discount, subtotal))}`;
  $('total').textContent = money(Math.max(0, subtotal - applied.discount));
  $('checkout').disabled = count === 0;
}
function changeQuantity(id, delta) {
  const quantity = (cart.get(id) || 0) + delta;
  if (quantity > 0) cart.set(id, quantity); else cart.delete(id);
  renderCart();
}
document.addEventListener('click', event => {
  const { add, inc, dec } = event.target.dataset;
  if (add) { changeQuantity(add, 1); setNotice(`${products.find(p => p.id === add).name} added to your bag.`); }
  if (inc) changeQuantity(inc, 1);
  if (dec) changeQuantity(dec, -1);
});
$('discount-form').addEventListener('submit', async event => {
  event.preventDefault();
  setNotice('Checking code...');
  const response = await fetch('/api/discount', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: $('code').value }) });
  const data = await response.json();
  if (!response.ok) { applied = { code: '', discount: 0 }; setNotice(data.error, true); } else { applied = data; setNotice(`Discount ${data.code} applied.`); }
  renderCart();
});
$('checkout').addEventListener('click', async () => {
  $('checkout').disabled = true;
  setNotice('Placing your order...');
  try {
    const items = [...cart].map(([productId, quantity]) => ({ productId, quantity }));
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, discountCode: applied.code }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Checkout failed');
    $('order-id').textContent = data.orderId;
    $('order-total').textContent = money(data.total);
    $('cart-view').hidden = true; $('confirmation').hidden = false;
    cart.clear(); applied = { code: '', discount: 0 }; $('code').value = ''; setNotice('');
  } catch (error) { setNotice(error.message, true); }
  renderCart();
});
$('continue').addEventListener('click', () => { $('confirmation').hidden = true; $('cart-view').hidden = false; });
fetch('/api/products').then(r => r.json()).then(data => { products = data.products; renderProducts(); renderCart(); });

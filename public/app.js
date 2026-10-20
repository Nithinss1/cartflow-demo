const form = document.getElementById('discount-form');
const codeInput = document.getElementById('code');
const totalEl = document.getElementById('total');
const discountEl = document.getElementById('discount');
const notice = document.getElementById('notice');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  notice.textContent = 'Calculating...'; notice.className = 'notice';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ discountCode: codeInput.value }) });
    if (!response.ok) throw new Error('Unable to calculate total');
    const data = await response.json();
    discountEl.textContent = `−$${data.discount.toFixed(2)}`;
    totalEl.textContent = `${data.total < 0 ? '-' : ''}$${Math.abs(data.total).toFixed(2)}`;
    totalEl.classList.toggle('negative', data.total < 0);
    notice.textContent = data.discount ? `Discount ${data.code} applied.` : 'No discount applied.';
    if (data.total < 0) { notice.textContent += ' Warning: negative checkout total detected.'; notice.className = 'notice error'; }
  } catch (error) { notice.textContent = error.message; notice.className = 'notice error'; }
});
document.getElementById('checkout').addEventListener('click', () => { notice.textContent = 'Demo checkout only — no payment will be collected.'; notice.className = 'notice'; });

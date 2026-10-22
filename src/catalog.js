/** Brightwell Goods product catalog. Prices are in USD. */
const products = [
  { id: 'headphones', name: 'Wireless Headphones', variant: 'Midnight Black', price: 25, emoji: '🎧', tint: '#e9edff' },
  { id: 'speaker', name: 'Portable Speaker', variant: 'Ocean Blue', price: 40, emoji: '🔊', tint: '#e3f4fb' },
  { id: 'keyboard', name: 'Mechanical Keyboard', variant: 'Brown switches', price: 89, emoji: '⌨️', tint: '#f1efe9' },
  { id: 'mouse', name: 'Ergonomic Mouse', variant: 'Graphite', price: 32, emoji: '🖱️', tint: '#ecebf5' },
  { id: 'watch', name: 'Fitness Watch', variant: 'Sage strap', price: 120, emoji: '⌚', tint: '#e7f5ec' },
  { id: 'camera', name: 'Instant Camera', variant: 'Blush pink', price: 75, emoji: '📷', tint: '#fbeaea' }
];
function findProduct(id) { return products.find(product => product.id === id); }
module.exports = { products, findProduct };

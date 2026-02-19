/* Product Page JS */

console.log('Product page loaded');

// Example: Filter change simulation
const priceRange = document.querySelector('.price-range');
if (priceRange) {
    priceRange.addEventListener('input', function (e) {
        // In a real app, this would filter products
        console.log('Price filter changed:', e.target.value);
    });
}

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

// --- DYNAMIC PRODUCT FETCHING ---
document.addEventListener("DOMContentLoaded", async () => {
    const shopContainer = document.getElementById("shop-products");

    if (!shopContainer) return;

    try {
        const response = await fetch("http://localhost:5000/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        const products = await response.json();

        if (products.length === 0) {
            shopContainer.innerHTML = "<p class='text-center text-muted'>No products found.</p>";
            return;
        }

        shopContainer.innerHTML = products.map(product => {
            const imageUrl = product.images && product.images.length > 0
                ? `http://localhost:5000/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg";

            const price = product.price ? product.price.toFixed(2) : "0.00";

            return `
                <div class="col-lg-4 col-md-6 col-6 mb-4">
                    <div class="product-card">
                        <div class="product-img-wrapper">
                            <a href="single-product.html?id=${product._id}" class="d-block w-100 h-100">
                                <img src="${imageUrl}" class="product-img" alt="${product.name}" style="height: 280px; object-fit: cover;">
                            </a>
                            <div class="product-actions">
                                <a href="cart.html" class="btn btn-sm btn-dark"><i class="bi bi-cart-plus"></i> Add</a>
                                <button class="btn btn-sm btn-outline-dark btn-wishlist" data-id="${product._id}">
                                    <i class="bi bi-heart"></i>
                                </button>
                            </div>
                        </div>
                        <div class="product-info">
                            <h3 class="product-title"><a href="single-product.html?id=${product._id}">${product.name}</a></h3>
                            <div class="product-price">$${price}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Error loading shop products:", error);
        shopContainer.innerHTML = "<p class='text-center text-danger'>Error loading products.</p>";
    }
});

/* Home Page Specific JS */

console.log('Home page loaded');

// Example: Newsletter form submission handler
document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for subscribing!');
});

// Restricted Access Modal Handler
document.addEventListener('DOMContentLoaded', function () {
    const restrictedLinks = document.querySelectorAll('.restricted-link');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));

    restrictedLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            loginModal.show();
        });
    });
});

// --- DYNAMIC PRODUCT FETCHING ---
document.addEventListener("DOMContentLoaded", async () => {
    const productsContainer = document.getElementById("home-products");

    if (!productsContainer) return;

    try {
        const response = await fetch("http://localhost:5000/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        const products = await response.json();

        // Show only latest 8 products
        const latestProducts = products.slice(0, 8);

        if (latestProducts.length === 0) {
            productsContainer.innerHTML = "<p class='text-center text-muted'>No products available.</p>";
            return;
        }

        productsContainer.innerHTML = latestProducts.map(product => {
            const imageUrl = product.images && product.images.length > 0
                ? `http://localhost:5000/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg"; // fallback

            const price = product.price ? product.price.toFixed(2) : "0.00";

            return `
                <div class="col-lg-3 col-md-4 col-6 mb-4">
                    <div class="product-card">
                        <div class="product-img-wrapper">
                            <a href="single-product.html?id=${product._id}" class="d-block w-100 h-100">
                                <img src="${imageUrl}" class="product-img" alt="${product.name}" style="height: 250px; object-fit: cover;">
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
        console.error("Error loading home products:", error);
        productsContainer.innerHTML = "<p class='text-center text-danger'>Error loading products.</p>";
    }

    // FETCH CATEGORIES
    const categoriesContainer = document.getElementById("home-categories");
    if (categoriesContainer) {
        try {
            // Fetch only active categories, or filter on frontend (we'll fetch all active)
            const catResponse = await fetch("http://localhost:5000/api/categories?status=active");
            if (!catResponse.ok) throw new Error("Failed to fetch categories");

            const catData = await catResponse.json();
            const categories = catData.categories || [];

            if (categories.length === 0) {
                categoriesContainer.innerHTML = "<p class='text-center text-muted'>No categories available.</p>";
            } else {
                categoriesContainer.innerHTML = categories.map(cat => {
                    const catImage = cat.image
                        ? `http://localhost:5000/uploads/${cat.image}`
                        : "images/ceramic-cup.jpg";

                    // We don't have accurate count from backend automatically, placeholder it or omit it
                    return `
                        <div class="col-lg-3 col-md-6 col-6">
                            <a href="product.html?category=${cat._id}" class="text-decoration-none">
                                <div class="category-card text-center">
                                    <div class="category-img-wrapper mb-3">
                                        <img src="${catImage}" alt="${cat.name}" class="category-img" style="object-fit:cover; height: 100%; width: 100%;">
                                    </div>
                                    <h5 class="category-title">${cat.name.toUpperCase()}</h5>
                                </div>
                            </a>
                        </div>
                    `;
                }).join("");
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            categoriesContainer.innerHTML = "<p class='text-center text-danger'>Error loading categories.</p>";
        }
    }
});

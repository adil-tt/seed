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

// --- DYNAMIC PRODUCT FETCHING & FILTERING ---
let allProducts = []; // Store fetched products globally for quick client-side filtering

document.addEventListener("DOMContentLoaded", async () => {
    const shopContainer = document.getElementById("shop-products");
    const categoryList = document.getElementById("category-filter-list");

    if (!shopContainer) return;

    try {
        // 1. Fetch Categories
        if (categoryList) {
            const catResponse = await fetch("http://localhost:5000/api/categories?status=active");
            if (catResponse.ok) {
                const catData = await catResponse.json();
                const categories = catData.categories || [];

                // Keep "All Categories" and append dynamic ones
                let categoryHTML = '<li><a href="#" data-category-id="all" class="category-filter-link fw-bold text-primary">All Categories</a></li>';

                categories.forEach(cat => {
                    if (cat.status === 'active') {
                        categoryHTML += `<li><a href="#" data-category-id="${cat._id}" class="category-filter-link">${cat.name}</a></li>`;
                    }
                });
                categoryList.innerHTML = categoryHTML;

                // Add click listeners to category links
                attachCategoryListeners();
            }
        }

        // 2. Fetch Products
        const response = await fetch("http://localhost:5000/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        allProducts = await response.json(); // Store permanently

        // Initial render: show all active products
        const activeProducts = allProducts.filter(p => p.status === 'active');
        renderProducts(activeProducts);

    } catch (error) {
        console.error("Error loading shop data:", error);
        shopContainer.innerHTML = "<p class='text-center text-danger'>Error loading products or categories.</p>";
    }

    // Function to render products grid
    function renderProducts(productsToRender) {
        if (productsToRender.length === 0) {
            shopContainer.innerHTML = "<p class='text-center text-muted'>No products found in this category.</p>";
            // Update counts if needed here
            return;
        }

        shopContainer.innerHTML = productsToRender.map(product => {
            const imageUrl = product.images && product.images.length > 0
                ? `http://localhost:5000/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg";

            const price = product.price ? product.price.toFixed(2) : "0.00";
            const isOutOfStock = product.stock === 0;

            return `
                <div class="col-lg-4 col-md-6 col-6 mb-4">
                    <div class="product-card">
                        <div class="product-img-wrapper">
                            <a href="single-product.html?id=${product._id}" class="d-block w-100 h-100">
                                <img src="${imageUrl}" class="product-img" alt="${product.name}">
                            </a>
                            <div class="product-actions" style="${isOutOfStock ? 'opacity: 0.5;' : ''}">
                                ${isOutOfStock
                    ? `<button class="btn btn-sm btn-secondary" disabled>Out of Stock</button>`
                    : `<button class="btn btn-sm btn-dark add-to-cart" data-id="${product._id}"><i class="bi bi-cart-plus"></i> Add</button>`
                }
                                <button class="btn btn-sm btn-outline-dark add-to-wishlist" data-id="${product._id}">
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
    }

    // Function to attach category click listeners
    function attachCategoryListeners() {
        const links = document.querySelectorAll('.category-filter-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Highlight active link
                links.forEach(l => {
                    l.classList.remove('fw-bold', 'text-primary');
                    l.style.color = ''; // Reset standard styling
                });

                e.target.classList.add('fw-bold', 'text-primary');

                const categoryId = e.target.getAttribute('data-category-id');

                // Filter logic
                if (categoryId === 'all') {
                    const activeProducts = allProducts.filter(p => p.status === 'active');
                    renderProducts(activeProducts);
                } else {
                    const filteredProducts = allProducts.filter(p => {
                        if (p.status !== 'active') return false;

                        // Check if the selected category _id is in the product's populated categories array
                        if (p.categories && Array.isArray(p.categories)) {
                            return p.categories.some(cat => cat._id === categoryId);
                        }
                        return false;
                    });
                    renderProducts(filteredProducts);
                }
            });
        });
    }

    // --- ADD TO CART FUNCTIONALITY ---
    shopContainer.addEventListener("click", (e) => {
        const addBtn = e.target.closest(".add-to-cart");
        if (addBtn) {
            const productId = addBtn.getAttribute("data-id");
            handleAddToCart(productId);
        }
    });

    async function handleAddToCart(productId) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            if (window.showPopup) {
                window.showPopup("Please login to add items to the cart.", "warning");
            } else {
                alert("Please login to add items to the cart.");
            }
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
            return;
        }

        const originalText = document.querySelector(`.add-to-cart[data-id="${productId}"]`).innerHTML;
        const btn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);

        if (btn) btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';

        try {
            const response = await fetch("http://localhost:5000/api/cart/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ productId, quantity: 1 })
            });

            const data = await response.json();

            if (response.ok) {
                if (window.showPopup) showPopup("Successfully added to cart!", "success");
                if (btn) btn.innerHTML = '<i class="bi bi-check-lg"></i> Added';
                setTimeout(() => { if (btn) btn.innerHTML = originalText; }, 2000);
            } else {
                if (window.showPopup) showPopup(data.message || "Failed to add to cart", "danger");
                else alert(data.message || "Failed to add to cart");
                if (btn) btn.innerHTML = originalText;
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            if (window.showPopup) showPopup("An error occurred while adding to cart.", "danger");
            else alert("An error occurred while adding to cart.");
            if (btn) btn.innerHTML = originalText;
        }
    }
});

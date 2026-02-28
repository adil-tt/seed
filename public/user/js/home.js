/* Home Page Specific JS */

console.log('Home page loaded');

// Example: Newsletter form submission handler
document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for subscribing!');
});

// Restricted Access & Global Auth Handler
document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // UI Elements
    const authContainer = document.getElementById('authContainer'); // Contains Login & Sign Up
    const profileIcon = document.querySelector('a[href="account.html"]');
    const restrictedLinks = document.querySelectorAll('.restricted-link');

    let loginModal;
    const loginModalElement = document.getElementById('loginModal');
    if (loginModalElement) {
        loginModal = new bootstrap.Modal(loginModalElement);
    }

    // --- Core Logic ---
    if (token) {
        // 1️⃣ USER IS LOGGED IN
        // Hide Login and Sign Up
        if (authContainer) authContainer.classList.add('d-none');

        // Show Profile icon
        if (profileIcon) {
            profileIcon.classList.remove('d-none');
            // Remove restricted class so it doesn't trigger modal
            profileIcon.classList.remove('restricted-link');
        }

        // Disable Login Required popup for all restricted links (Cart, Wishlist, etc)
        restrictedLinks.forEach(link => {
            link.classList.remove('restricted-link');
            // Optional: Re-clone the node to wipe any leftover event listeners if issues arise, 
            // but simply removing the class prevents our below listener from interfering later.
        });

        // Verify token in background
        try {
            const response = await fetch("http://localhost:5000/api/users/profile", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Token expired");
        } catch (error) {
            console.error(error);
            // If token is invalid, clear it and reset UI
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.reload();
        }

    } else {
        // 2️⃣ USER IS NOT LOGGED IN
        // Show Login and Sign Up
        if (authContainer) authContainer.classList.remove('d-none');

        // Hide Profile icon entirely from DOM
        if (profileIcon) profileIcon.classList.add('d-none');

        // When user clicks Cart / Wishlist / Profile → show Login Required modal
        restrictedLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                if (loginModal) {
                    loginModal.show();
                } else {
                    window.location.href = "login.html"; // Handle edge case if modal doesn't exist on page
                }
            });
        });
    }
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

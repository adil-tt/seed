/* Home Page Specific JS */

console.log('Home page loaded');

// Example: Newsletter form submission handler
document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for subscribing!');
});

// Restricted Access & Global Auth Handler
function updateNavbar() {
    // Check both localStorage (Remember Me checked) and sessionStorage (Remember Me unchecked)
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const userString = localStorage.getItem("user") || sessionStorage.getItem("user");

    const authContainer = document.getElementById("authContainer");

    if (token && userString) {
        try {
            const user = JSON.parse(userString);

            // USER IS LOGGED IN - Replace Login/SignUp with Welcome & Logout
            if (authContainer) {
                // We must use innerHTML because the user's HTML doesn't have loginBtn or signupBtn IDs
                authContainer.innerHTML = `
                    <span class="me-3 fw-medium text-dark">Welcome, ${user.name.split(' ')[0]}!</span>
                    <button id="logoutBtn" class="btn btn-outline-danger btn-sm">Logout</button>
                `;

                // Add logout logic native to the new button
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    window.location.reload();
                });
            }
        } catch (error) {
            console.error("Error parsing user data", error);
        }
    } else {
        // USER NOT LOGGED IN - Restore Login/SignUp buttons
        if (authContainer) {
            authContainer.innerHTML = `
                <a href="login.html" class="btn btn-outline-terracotta me-2 d-none d-lg-block">Login</a>
                <a href="signup.html" class="btn btn-terracotta me-3 d-none d-lg-block">Sign Up</a>
            `;
        }
    }

    // Modal Handler for restricted links (Cart / Wishlist / Profile icon)
    const restrictedLinks = document.querySelectorAll(".restricted-link");
    const loginModalElement = document.getElementById("loginModal");
    let loginModal;

    if (loginModalElement && typeof bootstrap !== "undefined") {
        loginModal = new bootstrap.Modal(loginModalElement);
    }

    restrictedLinks.forEach(link => {
        // Clone node to clear old event listeners in case updateNavbar runs multiple times
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);

        newLink.addEventListener("click", function (e) {
            // Check token on click (check both storages)
            const currentToken = localStorage.getItem("token") || sessionStorage.getItem("token");
            if (!currentToken) {
                e.preventDefault();
                if (loginModal) {
                    loginModal.show();
                } else {
                    window.location.href = "login.html";
                }
            } else {
                // If token exists, they should be allowed to go to Account/Cart without Login modal
                // No preventDefault needed here.
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", updateNavbar);

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
                                <img src="${imageUrl}" class="product-img w-100" alt="${product.name}" style="height: 250px; object-fit: cover;">
                            </a>
                            <div class="product-actions">
                                <button class="btn btn-sm btn-dark add-to-cart" data-id="${product._id}"><i class="bi bi-cart-plus"></i> Add</button>
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

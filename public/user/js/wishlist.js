// --- SHOPPING ACTIONS (Cart & Wishlist Event Delegation) ---
document.addEventListener('DOMContentLoaded', () => {
    // Shared toast notification function
    const showToast = (message, isError = false) => {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = isError ? '#dc3545' : '#198754';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.opacity = '1';
        toast.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(toast);
        setTimeout(() => toast.style.opacity = '0', 2500);
        setTimeout(() => toast.remove(), 2800);
    };

    // Update Navbar Badges
    const updateBadges = async () => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        try {
            // Fetch cart tally
            const cartRes = await fetch("http://localhost:5000/api/cart", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (cartRes.ok) {
                const cartArray = await cartRes.json();
                let cartIcon = document.querySelector('a.icon-link[href="cart.html"]');
                if (cartIcon) {
                    let badge = cartIcon.querySelector('.badge');
                    if (!badge) {
                        cartIcon.style.position = 'relative';
                        badge = document.createElement('span');
                        badge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
                        badge.style.fontSize = '0.55rem';
                        cartIcon.appendChild(badge);
                    }
                    badge.textContent = cartArray.length || 0;
                    badge.style.display = cartArray.length ? 'inline-block' : 'none';
                }
            }

            // Fetch wishlist tally
            const wlRes = await fetch("http://localhost:5000/api/wishlist", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (wlRes.ok) {
                const wlArray = await wlRes.json();
                let wlIcon = document.querySelector('a.icon-link[href="wishlist.html"]');
                if (wlIcon) {
                    let badge = wlIcon.querySelector('.badge');
                    if (!badge) {
                        wlIcon.style.position = 'relative';
                        badge = document.createElement('span');
                        badge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
                        badge.style.fontSize = '0.55rem';
                        wlIcon.appendChild(badge);
                    }
                    badge.textContent = wlArray.length || 0;
                    badge.style.display = wlArray.length ? 'inline-block' : 'none';
                }
            }
        } catch (e) { console.error("Badge sync error:", e); }
    };

    // Initial badge load on any authenticated page
    updateBadges();

    // Event Delegation for both grids and single product pages
    document.body.addEventListener('click', async (e) => {
        // --- ADD TO CART ---
        if (e.target.closest('.add-to-cart')) {
            e.preventDefault();
            const btn = e.target.closest('.add-to-cart');
            const productId = btn.getAttribute('data-id');

            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            if (!token) {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    const modal = new bootstrap.Modal(loginModal);
                    modal.show();
                } else {
                    window.location.href = "login.html";
                }
                return;
            }

            try {
                // Determine quantity (default 1, unless Single Product page specifies otherwise)
                let quantity = 1;
                const qtyInput = document.getElementById('quantity');
                if (qtyInput && window.location.pathname.includes('single-product.html')) {
                    quantity = parseInt(qtyInput.value) || 1;
                }

                // Temporary loading state
                const originalText = btn.innerHTML;
                btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...`;
                btn.disabled = true;

                const response = await fetch("http://localhost:5000/api/cart/add", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ productId, quantity })
                });

                // Reset button
                btn.innerHTML = originalText;
                btn.disabled = false;

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to add to cart');

                showToast("Item successfully added to cart!");
                updateBadges();

            } catch (error) {
                showToast(error.message, true);
            }
        }

        // --- REMOVE FROM WISHLIST (Dashboard X Button) ---
        if (e.target.closest('.remove-wishlist')) {
            e.preventDefault();
            const btn = e.target.closest('.remove-wishlist');
            const productId = btn.getAttribute('data-id');
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");

            if (!token) return;

            if (!confirm("Remove this item from your wishlist?")) return;

            try {
                // Determine icon safely
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = 'spinner-border spinner-border-sm';
                }
                btn.disabled = true;

                const response = await fetch(`http://localhost:5000/api/wishlist/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 401 || response.status === 403) {
                    window.location.href = 'login.html';
                    return;
                }

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to remove from wishlist');
                }

                showToast("Item removed from wishlist!");
                updateBadges();

                // Immediately remove the visual card
                const card = btn.closest('.col-md-6, .col-lg-4');
                if (card) {
                    card.remove();
                    // If grid is now empty, refresh page to show empty state
                    const grid = document.querySelector("#wishlist .row.g-4") || document.querySelector(".dashboard-content .row.g-4");
                    if (grid && grid.children.length === 0) {
                        window.location.reload();
                    }
                }

            } catch (error) {
                showToast(error.message, true);
                btn.disabled = false;
                if (icon) icon.className = 'bi bi-x-lg';
            }
        }

        // --- ADD TO WISHLIST ---
        if (e.target.closest('.add-to-wishlist')) {
            e.preventDefault();
            const btn = e.target.closest('.add-to-wishlist');
            const productId = btn.getAttribute('data-id');

            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            if (!token) {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    const modal = new bootstrap.Modal(loginModal);
                    modal.show();
                } else {
                    window.location.href = "login.html";
                }
                return;
            }

            try {
                // Temporary loading state
                btn.disabled = true;

                const response = await fetch("http://localhost:5000/api/wishlist/add", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ productId })
                });

                btn.disabled = false;

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }

                const data = await response.json();

                if (!response.ok) {
                    if (data.message === "Product already in wishlist") {
                        showToast("Product is already in your wishlist!");
                    } else {
                        throw new Error(data.message || 'Failed to add to wishlist');
                    }
                } else {
                    showToast("Item saved to wishlist!");
                    updateBadges();
                    // Toggle icon visually
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('bi-heart');
                        icon.classList.add('bi-heart-fill', 'text-danger');
                    }
                }

            } catch (error) {
                console.error("Wishlist Add Error Details:", error);
                alert("Server rejected: " + error.message);
                showToast(error.message, true);
            }
        }
    });
});

// --- WISHLIST API FETCH LOGIC ---
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        if (window.location.pathname.includes('wishlist.html')) {
            window.location.href = "login.html";
        }
        return;
    }

    const wishlistContainer = document.querySelector("#wishlist .row.g-4") || document.querySelector(".dashboard-content .row.g-4");
    if (!wishlistContainer) return; // Only runs on wishlist section

    try {
        const response = await fetch("http://localhost:5000/api/wishlist", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        // FIX 1: Read the actual backend error instead of throwing a generic "Failed"
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Server Error fetching wishlist");
        }

        let items = await response.json();
        // Extract array from response if nested
        items = Array.isArray(items) ? items : items.wishlist || items.items || [];

        if (items.length === 0) {
            wishlistContainer.innerHTML = "<div class='col-12 py-5 text-center text-muted'>Your wishlist is empty.</div>";
            return;
        }

        wishlistContainer.innerHTML = items.map(item => {
            const product = item.product || item;
            if (!product || !product._id) return ''; // Skip invalid/deleted products

            const imageUrl = product.images && product.images.length > 0
                ? `http://localhost:5000/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg";

            const price = product.price ? product.price.toFixed(2) : "0.00";
            const categoryName = product.category ? product.category.name : "Uncategorized";

            return `
                <div class="col-md-6 col-lg-4">
                    <div class="wishlist-card shadow-sm border-0 rounded overflow-hidden position-relative p-0 h-100">
                        <button class="remove-wishlist wishlist-remove-btn position-absolute top-0 end-0 m-2 btn btn-sm btn-light rounded-circle text-danger border-0 z-1" data-id="${product._id}" style="z-index: 10;">
                            <i class="bi bi-x-lg"></i>
                        </button>
                        <a href="single-product.html?id=${product._id}" class="text-decoration-none text-dark">
                            <img src="${imageUrl}" alt="${product.name}" class="wishlist-img w-100" style="height: 250px; object-fit: cover;">
                            <div class="wishlist-body p-3">
                                <h6 class="wishlist-title mb-1">${product.name}</h6>
                                <p class="text-muted small mb-2">Category: ${categoryName}</p>
                                <div class="d-flex justify-content-between align-items-center mb-3 mt-2">
                                    <span class="wishlist-price fw-bold">$${price}</span>
                                </div>
                            </div>
                        </a>
                        <div class="px-3 pb-3">
                            <button class="btn btn-dark w-100 btn-sm add-to-cart" data-id="${product._id}"><i class="bi bi-cart-plus me-1"></i> Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Wishlist error:", error);
        
        // FIX 2: Stop the automatic redirect and show the error on the screen!
        wishlistContainer.innerHTML = `
            <div class='col-12 py-5 text-center text-danger'>
                <h4>Oops! Error loading wishlist.</h4>
                <p>${error.message}</p>
                <button onclick="localStorage.removeItem('token'); window.location.href='login.html'" class="btn btn-outline-danger mt-3">
                    Clear Token & Log In Again
                </button>
            </div>
        `;
    }
});

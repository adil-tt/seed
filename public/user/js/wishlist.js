document.addEventListener('DOMContentLoaded', () => {
    const wishlistButtons = document.querySelectorAll('.btn-wishlist');

    // Load wishlist from localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // Initialize buttons
    wishlistButtons.forEach(btn => {
        const productId = btn.getAttribute('data-id');
        if (wishlist.includes(productId)) {
            setButtonState(btn, true);
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleWishlist(productId, btn);
        });
    });

    function toggleWishlist(id, btn) {
        const index = wishlist.indexOf(id);
        let isAdded = false;

        if (index === -1) {
            wishlist.push(id);
            isAdded = true;
        } else {
            wishlist.splice(index, 1);
            isAdded = false;
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        setButtonState(btn, isAdded);

        // Update wishlist count in navbar if it exists
        updateWishlistCount();
    }

    function setButtonState(btn, isAdded) {
        const icon = btn.querySelector('i');
        if (isAdded) {
            btn.classList.add('active');
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
            icon.classList.add('text-danger'); // Optional: make it red
        } else {
            btn.classList.remove('active');
            icon.classList.remove('bi-heart-fill');
            icon.classList.remove('text-danger');
            icon.classList.add('bi-heart');
        }
    }

    function updateWishlistCount() {
        // Implementation for updating navbar count if user requests it later
        // const count = wishlist.length;
        // const countEl = document.querySelector('.wishlist-count');
        // if(countEl) countEl.innerText = count;
    }
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

    const wishlistContainer = document.querySelector(".dashboard-content .row.g-4");
    if (!wishlistContainer) return; // Only runs on wishlist page

    try {
        const response = await fetch("http://localhost:5000/api/users/wishlist", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch wishlist");

        let items = await response.json();
        // Extract array from response if nested
        items = Array.isArray(items) ? items : items.wishlist || items.items || [];

        if (items.length === 0) {
            wishlistContainer.innerHTML = "<div class='col-12 py-5 text-center text-muted'>Your wishlist is empty.</div>";
            return;
        }

        wishlistContainer.innerHTML = items.map(item => {
            const product = item.product || item;
            const imageUrl = product.images && product.images.length > 0
                ? `http://localhost:5000/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg";

            const price = product.price ? product.price.toFixed(2) : "0.00";
            const categoryName = product.category ? product.category.name : "Uncategorized";

            return `
                <div class="col-md-6 col-lg-4">
                    <div class="wishlist-card shadow-sm border-0 rounded overflow-hidden position-relative p-0 h-100">
                        <button class="wishlist-remove-btn position-absolute top-0 end-0 m-2 btn btn-sm btn-light rounded-circle text-danger border-0 z-1" style="z-index: 10;">
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
                            <button class="btn btn-dark w-100 btn-sm"><i class="bi bi-cart-plus me-1"></i> Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Wishlist error:", error);
        if (error.message.includes("Failed")) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
        } else {
            wishlistContainer.innerHTML = "<div class='col-12 py-5 text-center text-danger'>Error loading wishlist.</div>";
        }
    }
});

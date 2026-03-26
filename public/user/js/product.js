/* Product Page JS */

console.log('Product page loaded');



// --- DYNAMIC PRODUCT FETCHING & FILTERING ---
let allProducts = []; // Store fetched products globally for quick client-side filtering

document.addEventListener("DOMContentLoaded", async () => {
    const shopContainer = document.getElementById("shop-products");
    const categoryList = document.getElementById("category-filter-list");

    if (!shopContainer) return;

    let currentCategoryId = 'all';
    let currentMaxPrice = 200;

    let activeOffers = [];

    try {
        // 0. Fetch Active Offers for displacement
        const offResponse = await fetch("http://localhost:5000/api/offers/active");
        if (offResponse.ok) {
            const offData = await offResponse.json();
            activeOffers = offData.offers || [];
        }

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

        // ... rest of filtering init ...
        const maxProductPrice = Math.max(...allProducts.map(p => p.price || 0), 200);
        const priceInput = document.getElementById('priceRangeInput');
        const priceDisplay = document.getElementById('priceRangeDisplay');
        if (priceInput && priceDisplay) {
            priceInput.max = Math.ceil(maxProductPrice);
            priceInput.value = Math.ceil(maxProductPrice);
            priceDisplay.innerText = `₹${Math.ceil(maxProductPrice)}`;
            currentMaxPrice = Math.ceil(maxProductPrice);

            priceInput.addEventListener('input', (e) => {
                currentMaxPrice = parseFloat(e.target.value);
                priceDisplay.innerText = `₹${currentMaxPrice}`;
                applyFilters();
            });
        }

        applyFilters();

    } catch (error) {
        console.error("Error loading shop data:", error);
        shopContainer.innerHTML = "<p class='text-center text-danger'>Error loading products or categories.</p>";
    }

    function calculateDiscount(product, offers) {
        let bestDiscount = 0;
        let discountedPrice = product.price;
        let activeOffer = null;

        offers.forEach(offer => {
            let applies = false;
            if (offer.offerType === 'Product' && offer.targetId === product._id) {
                applies = true;
            } else if (offer.offerType === 'Category') {
                const productCatIds = (product.categories || []).map(c => typeof c === 'object' ? c._id : c);
                if (productCatIds.includes(offer.targetId)) {
                    applies = true;
                }
            } else if (offer.offerType === 'All') {
                applies = true;
            }

            if (applies) {
                let currentDiscount = 0;
                if (offer.discountType === 'Percentage') {
                    currentDiscount = (product.price * offer.discountValue) / 100;
                } else {
                    currentDiscount = offer.discountValue;
                }

                if (currentDiscount > bestDiscount) {
                    bestDiscount = currentDiscount;
                    discountedPrice = Math.max(0, product.price - currentDiscount);
                    activeOffer = offer;
                }
            }
        });

        return { 
            hasDiscount: bestDiscount > 0, 
            discountedPrice, 
            originalPrice: product.price,
            activeOffer 
        };
    }

    // Function to render products grid
    function renderProducts(productsToRender) {
        if (productsToRender.length === 0) {
            shopContainer.innerHTML = "<p class='text-center text-muted'>No products found in this category.</p>";
            return;
        }

        shopContainer.innerHTML = productsToRender.map(product => {
            const { hasDiscount, discountedPrice, originalPrice, activeOffer } = calculateDiscount(product, activeOffers);
            
            const imageUrl = product.images && product.images.length > 0
                ? `/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg";

            const displayOriginal = originalPrice.toFixed(2);
            const displayDiscounted = discountedPrice.toFixed(2);

            let priceHTML = `<div class="product-price">₹${displayOriginal}</div>`;
            if (hasDiscount) {
                const badgeText = activeOffer.discountType === 'Percentage' 
                    ? `${activeOffer.discountValue}% OFF` 
                    : `₹${activeOffer.discountValue} OFF`;
                    
                priceHTML = `
                    <div class="product-price-wrapper">
                        <span class="original-price text-muted text-decoration-line-through me-2">₹${displayOriginal}</span>
                        <span class="discounted-price fw-bold text-danger">₹${displayDiscounted}</span>
                        <div class="discount-label-mini">${badgeText}</div>
                    </div>
                `;
            }

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
                        <div class="product-info p-3">
                            <h3 class="product-title m-0 mb-1"><a href="single-product.html?id=${product._id}">${product.name}</a></h3>
                            ${priceHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Function to apply active filters (category & price)
    function applyFilters() {
        let filtered = allProducts.filter(p => p.status === 'active');

        // Apply Category Filter
        if (currentCategoryId !== 'all') {
            filtered = filtered.filter(p => {
                if (p.categories && Array.isArray(p.categories)) {
                    return p.categories.some(cat => cat._id === currentCategoryId);
                }
                return false;
            });
        }

        // Apply Price Filter
        filtered = filtered.filter(p => {
            const price = parseFloat(p.price) || 0;
            return price <= currentMaxPrice;
        });

        renderProducts(filtered);
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

                currentCategoryId = e.target.getAttribute('data-category-id');
                applyFilters();
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
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            Swal.fire({ text: "Please login to add items to the cart.", icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
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
                Swal.fire({ text: "Successfully added to cart!", icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                if (btn) btn.innerHTML = '<i class="bi bi-check-lg"></i> Added';
                setTimeout(() => { if (btn) btn.innerHTML = originalText; }, 2000);
            } else {
                Swal.fire({ text: data.message || "Failed to add to cart", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
if (btn) btn.innerHTML = originalText;
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            Swal.fire({ text: "An error occurred while adding to cart.", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
if (btn) btn.innerHTML = originalText;
        }
    }
});

/* Single Product JS */

console.log('Single Product page loaded');

let basePrice = 0;
let maxStock = 0;
let activeOffers = [];

function updatePriceDisplay() {
    const priceEl = document.getElementById("product-price");
    const input = document.getElementById('quantity');
    const quantity = parseInt(input.value) || 1;
    
    // We only update if we have a simple price. 
    // If it's a discount wrapper, we might need a more complex update, 
    // but usually, product details show the unit price.
    // For now, let's keep the unit price display and maybe update the 'Total' elsewhere if needed.
}

function increaseQty() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) < maxStock) {
        input.value = parseInt(input.value) + 1;
        updatePriceDisplay();
    } else {
        Swal.fire({ text: "Stock limit reached", icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
}

function decreaseQty() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        updatePriceDisplay();
    }
}

// --- DYNAMIC PRODUCT FETCHING ---
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        document.body.innerHTML = "<h2 class='text-center mt-5 text-danger'>Product ID not found</h2>";
        return;
    }

    // 1. Fetch Active Offers first
    try {
        const offRes = await fetch("/api/offers/active");
        if (offRes.ok) {
            const offData = await offRes.json();
            activeOffers = offData.offers || [];
        }
    } catch (e) { console.error("Error fetching offers:", e); }

    try {
        // 2. Fetch Product Details
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error("Failed to load product details");

        const product = await response.json();

        // 3. Clear Skeletons & Update DOM Elements
        document.querySelectorAll('.skeleton').forEach(el => {
            el.classList.remove('skeleton', 'skeleton-text', 'skeleton-img');
            el.removeAttribute('style'); 
        });

        const nameEl = document.getElementById("product-name");
        const priceEl = document.getElementById("product-price");
        if (priceEl) priceEl.style.marginBottom = "20px"; // Ensure spacing is kept without restricting height
        const descEl = document.getElementById("product-description");
        const categoryEl = document.getElementById("product-category");
        const skuEl = document.getElementById("product-sku");
        const imagesContainer = document.getElementById("product-images");

        if (nameEl) nameEl.textContent = product.name;
        
        // Calculate Discount
        const { hasDiscount, discountedPrice, originalPrice, activeOffer } = calculateDiscount(product, activeOffers);
        basePrice = hasDiscount ? discountedPrice : product.price;

        if (priceEl) {
            if (hasDiscount) {
                const badgeText = activeOffer.discountType === 'Percentage' 
                    ? `${activeOffer.discountValue}% OFF` 
                    : `₹${activeOffer.discountValue} OFF`;
                
                priceEl.innerHTML = `
                    <div class="product-price-wrapper d-flex align-items-center flex-wrap gap-2">
                        <span class="original-price text-muted text-decoration-line-through" style="font-size: 1.2rem;">₹${originalPrice.toFixed(2)}</span>
                        <span class="discounted-price fw-bold text-danger" style="font-size: 2rem;">₹${discountedPrice.toFixed(2)}</span>
                        <span class="badge bg-danger ms-2">${badgeText}</span>
                    </div>
                `;
            } else {
                priceEl.textContent = `₹${product.price.toFixed(2)}`;
            }
        }

        if (descEl) descEl.textContent = product.description || "No description available.";
        if (categoryEl) categoryEl.textContent = product.category ? (product.category.name || product.category) : "Uncategorized";
        if (skuEl) skuEl.textContent = product.sku || product._id.toString().substring(18).toUpperCase();
        
        const tagsEl = document.getElementById("product-tags");
        if (tagsEl) tagsEl.textContent = "Minimalist, Handmade";

        const ratingEl = document.getElementById("product-rating-placeholder");
        if (ratingEl) {
            const avgRating = product.averageRating || 0;
            const revCount = product.reviewCount || 0;
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= avgRating) {
                    starsHtml += `<i class="bi bi-star-fill text-warning"></i>`;
                } else if (i - 0.5 <= avgRating) {
                    starsHtml += `<i class="bi bi-star-half text-warning"></i>`;
                } else {
                    starsHtml += `<i class="bi bi-star text-warning"></i>`;
                }
            }
            ratingEl.innerHTML = `
                <span class="fs-5 me-2">${starsHtml}</span>
                <span class="fw-bold">${avgRating.toFixed(1)}</span>
                <span class="text-muted ms-2">(${revCount} Reviews)</span>
            `;
        }

        const descPlaceholder = document.getElementById("desc-placeholder");
        if(descPlaceholder) {
            descPlaceholder.innerHTML = `<p>${product.description || "No description available."}</p>`;
        }

        maxStock = product.stock || 0;

        const singleAddToCartBtn = document.getElementById('single-add-cart');
        const qtyInput = document.getElementById('quantity');
        const qtyBtns = document.querySelectorAll('.quantity-btn');

        if (maxStock === 0) {
            if (singleAddToCartBtn) {
                singleAddToCartBtn.innerHTML = "Out of Stock";
                singleAddToCartBtn.disabled = true;
                singleAddToCartBtn.classList.remove('btn-primary');
                singleAddToCartBtn.classList.add('btn-secondary');
            }
            if (qtyInput) qtyInput.disabled = true;
            qtyBtns.forEach(btn => btn.disabled = true);
        }

        document.getElementById('single-add-cart')?.setAttribute('data-id', product._id);
        document.getElementById('single-add-wishlist')?.setAttribute('data-id', product._id);

        // Images Gallery
        if (imagesContainer) {
            renderGallery(product);
        }

        // Fetch and display related products
        await loadRelatedProducts(product);

    } catch (error) {
        console.error("Error loading single product:", error);
        if (document.getElementById("product-name")) document.getElementById("product-name").textContent = "Error loading product.";
    }

    // --- UTILS ---

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

        return { hasDiscount: bestDiscount > 0, discountedPrice, originalPrice: product.price, activeOffer };
    }

    function renderGallery(product) {
        let imagesHtml = "";
        let thumbsHtml = "";

        if (product.images && product.images.length > 0) {
            const mainImgUrl = `/uploads/${product.images[0]}`;
            imagesHtml = `
                <div class="product-gallery-main mb-3">
                    <img src="${mainImgUrl}" id="mainImage" class="w-100 rounded shadow-sm" alt="${product.name}">
                </div>
            `;

            if (product.images.length > 1) {
                thumbsHtml = `<div class="product-gallery-thumbs d-flex gap-2 mt-2 overflow-auto pb-2">`;
                product.images.forEach((img, index) => {
                    const thumbUrl = `/uploads/${img}`;
                    thumbsHtml += `
                        <img src="${thumbUrl}" class="thumb-img rounded ${index === 0 ? 'active border-primary' : 'border'}" 
                            style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;"
                            onclick="document.getElementById('mainImage').src=this.src; document.querySelectorAll('.thumb-img').forEach(t=>t.classList.remove('border-primary', 'active')); this.classList.add('border-primary', 'active');" 
                            alt="Thumb ${index + 1}">
                    `;
                });
                thumbsHtml += `</div>`;
            }
        } else {
            imagesHtml = `<div class="product-gallery-main mb-3"><img src="images/ceramic-cup.jpg" id="mainImage" class="w-100 rounded shadow-sm" alt="No image"></div>`;
        }
        document.getElementById("product-images").innerHTML = imagesHtml + thumbsHtml;
    }

    async function loadRelatedProducts(currentProduct) {
        const relatedContainer = document.getElementById("related-products");
        if (!relatedContainer) return;

        try {
            // Fetch all active products
            const response = await fetch("/api/products");
            if (!response.ok) throw new Error("Failed to load products");
            
            let allProducts = await response.json();
            
            // Filter by active status, exclude current product
            let related = allProducts.filter(p => p.status === 'active' && p._id !== currentProduct._id);
            
            // Prioritize matching category
            if (currentProduct.categories && currentProduct.categories.length > 0) {
                const currentCatIds = currentProduct.categories.map(c => typeof c === 'object' ? c._id : c);
                const categoryMatches = related.filter(p => {
                    if (!p.categories) return false;
                    return p.categories.some(c => {
                        const catId = typeof c === 'object' ? c._id : c;
                        return currentCatIds.includes(catId);
                    });
                });
                
                // Use category matches if available, otherwise just fallback to other active products
                if (categoryMatches.length > 0) {
                    related = categoryMatches;
                }
            }

            // Limit to 4 products max for display
            related = related.slice(0, 4);

            if (related.length === 0) {
                relatedContainer.innerHTML = "<p class='col-12 text-muted px-3'>No related products found.</p>";
                return;
            }

            // Render related products dynamically using consistent product-card layout
            relatedContainer.innerHTML = related.map(product => {
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
                    <div class="col-lg-3 col-md-4 col-6 mb-4">
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

        } catch (error) {
            console.error("Error loading related products:", error);
            relatedContainer.innerHTML = "<p class='col-12 text-danger px-3'>Failed to load related products.</p>";
        }
    }

    // Add to Cart
    const addToCartBtn = document.getElementById('single-add-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async () => {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            if (!token) {
                Swal.fire({ text: "Please login to add items to the cart.", icon: 'warning' });
                return;
            }
            const qty = parseInt(document.getElementById('quantity').value) || 1;
            const pid = addToCartBtn.getAttribute('data-id');

            try {
                const res = await fetch("/api/cart/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ productId: pid, quantity: qty })
                });
                if (res.ok) {
                    Swal.fire({ text: "Added to Cart!", icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                } else {
                    const d = await res.json();
                    Swal.fire({ text: d.message || "Failed", icon: 'error' });
                }
            } catch (e) { console.error(e); }
        });
    }
});

// --- PRODUCT REVIEWS LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    if (!productId) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const reviewsListContainer = document.getElementById("reviews-list-container");
    const reviewsTabBtn = document.getElementById("reviews-tab");
    
    // Form Elements
    const formContainer = document.getElementById("review-form-container");
    const reviewForm = document.getElementById("review-form");
    const formTitle = document.getElementById("review-form-title");
    const ratingInput = document.getElementById("review-rating");
    const reviewIdInput = document.getElementById("review-id");
    const starIcons = document.querySelectorAll(".star-icon");
    const reviewTextInput = document.getElementById("review-text");
    const submitBtnText = document.getElementById("review-btn-text");
    const spinner = document.getElementById("review-spinner");
    
    // Message Elements
    const loginMsg = document.getElementById("review-login-msg");
    const unverifiedMsg = document.getElementById("review-unverified-msg");

    // Validation Elements
    const ratingError = document.getElementById("rating-error");
    const textError = document.getElementById("review-text-error");

    let userExistingReview = null;

    // 1. Fetch all reviews for this product
    async function fetchReviews() {
        try {
            const res = await fetch(`/api/reviews/${productId}`);
            if (res.ok) {
                const data = await res.json();
                renderReviews(data.reviews, data.total);
            }
        } catch (e) {
            console.error("Error fetching reviews:", e);
        }
    }

    function renderReviews(reviews, totalCount) {
        if (reviewsTabBtn) reviewsTabBtn.textContent = `Reviews (${totalCount})`;
        
        if (!reviews || reviews.length === 0) {
            reviewsListContainer.innerHTML = `<p class="text-muted">No reviews yet. Be the first to review this product.</p>`;
            return;
        }

        let html = '';
        reviews.forEach(review => {
            const d = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            let stars = '';
            for(let i=1; i<=5; i++) {
                stars += `<i class="bi bi-star${i <= review.rating ? '-fill text-warning' : ' text-muted'}"></i>`;
            }
            
            let avatar = 'images/default-avatar.png';
            if (review.user && review.user.profileImage) {
                avatar = `/uploads/${review.user.profileImage}`;
            }

            html += `
                <div class="review-item d-flex mb-4 border-bottom pb-3">
                    <img src="${avatar}" alt="Avatar" class="rounded-circle border" style="width: 50px; height: 50px; object-fit: cover;">
                    <div class="w-100 ms-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0 fw-bold">${review.user ? (review.user.firstName ? review.user.firstName + ' ' + review.user.lastName : review.user.name) : 'Anonymous'}</h6>
                            <small class="text-muted">${d}</small>
                        </div>
                        <div class="mb-2">
                            ${stars}
                        </div>
                        <p class="mb-0 text-secondary">${review.review}</p>
                    </div>
                </div>
            `;
        });
        reviewsListContainer.innerHTML = html;
    }

    // 2. Check User Eligibility to Review
    async function checkEligibility() {
        if (!token) {
            if(loginMsg) loginMsg.style.display = 'block';
            return;
        }

        try {
            const res = await fetch(`/api/reviews/${productId}/user-status`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                
                if (!data.hasPurchased) {
                    if(unverifiedMsg) unverifiedMsg.style.display = 'block';
                } else {
                    if(formContainer) formContainer.style.display = 'block';
                    if (data.existingReview) {
                        userExistingReview = data.existingReview;
                        prefillForm(data.existingReview);
                    }
                }
            }
        } catch (e) {
            console.error("Error checking eligibility:", e);
        }
    }

    function prefillForm(review) {
        if(formTitle) formTitle.textContent = "Update Your Review";
        if(submitBtnText) submitBtnText.textContent = "Update Review";
        if(reviewIdInput) reviewIdInput.value = review._id;
        if(reviewTextInput) reviewTextInput.value = review.review;
        if(ratingInput) ratingInput.value = review.rating;
        
        if(starIcons) {
            starIcons.forEach(star => {
                const val = parseInt(star.getAttribute("data-value"));
                if (val <= review.rating) {
                    star.classList.remove('bi-star');
                    star.classList.add('bi-star-fill');
                } else {
                    star.classList.remove('bi-star-fill');
                    star.classList.add('bi-star');
                }
            });
        }
    }

    // 3. Star Rating Interaction
    if (starIcons) {
        starIcons.forEach(star => {
            star.addEventListener('click', (e) => {
                const val = parseInt(e.target.getAttribute("data-value"));
                if(ratingInput) ratingInput.value = val;
                if(ratingError) ratingError.style.display = 'none';

                starIcons.forEach(s => {
                    const sVal = parseInt(s.getAttribute("data-value"));
                    if (sVal <= val) {
                        s.classList.remove('bi-star');
                        s.classList.add('bi-star-fill');
                    } else {
                        s.classList.remove('bi-star-fill');
                        s.classList.add('bi-star');
                    }
                });
            });
        });
    }

    // 4. Form Submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if(ratingError) ratingError.style.display = 'none';
            if(textError) textError.style.display = 'none';
            
            const rating = parseInt(ratingInput.value);
            const text = reviewTextInput.value.trim();
            
            let isValid = true;
            
            if (rating < 1 || rating > 5) {
                if(ratingError) ratingError.style.display = 'block';
                isValid = false;
            }
            if (text.length < 10 || text.length > 500) {
                if(textError) textError.style.display = 'block';
                isValid = false;
            }
            
            if (!isValid) return;

            // Loading state
            if(submitBtnText) submitBtnText.textContent = "Submitting...";
            if(spinner) spinner.classList.remove('d-none');
            const submitBtn = document.getElementById("submit-review-btn");
            if(submitBtn) submitBtn.disabled = true;

            const isUpdate = !!userExistingReview;
            const url = isUpdate ? `/api/reviews/${userExistingReview._id}` : `/api/reviews/${productId}`;
            const method = isUpdate ? "PUT" : "POST";

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating, review: text })
                });

                const data = await res.json();

                if (res.ok) {
                    Swal.fire({ text: data.message, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                    userExistingReview = data.review;
                    prefillForm(data.review);
                    fetchReviews(); // Refresh list
                    
                    // Reload the page to reflect average rating changes? 
                    // Or we can dynamically update product info, but a reload might be simpler to ensure full state sync
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    Swal.fire({ text: data.message || "Failed to submit review.", icon: 'error' });
                }
            } catch (err) {
                console.error(err);
                Swal.fire({ text: "An error occurred.", icon: 'error' });
            } finally {
                if(submitBtnText) submitBtnText.textContent = isUpdate ? "Update Review" : "Submit Review";
                if(spinner) spinner.classList.add('d-none');
                if(submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Init
    fetchReviews();
    checkEligibility();
});

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

        // 3. Update DOM Elements
        const nameEl = document.getElementById("product-name");
        const priceEl = document.getElementById("product-price");
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

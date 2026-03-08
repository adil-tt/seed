/* Single Product JS */

console.log('Single Product page loaded');

function changeImage(element) {
    const mainImg = document.getElementById('mainImage');
    mainImg.src = element.src;

    // Update active class
    document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
    element.classList.add('active');
}

let basePrice = 0;
let maxStock = 0;

function updatePriceDisplay() {
    const priceEl = document.getElementById("product-price");
    const input = document.getElementById('quantity');
    const quantity = parseInt(input.value) || 1;
    if (priceEl && basePrice > 0) {
        priceEl.textContent = `$${(basePrice * quantity).toFixed(2)}`;
    }
}

function increaseQty() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) < maxStock) {
        input.value = parseInt(input.value) + 1;
        updatePriceDisplay();
    } else {
        if (window.showPopup) showPopup("Stock limit reached", "warning");
        else alert("Stock limit reached");
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
    // 1. Get Product ID from URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        document.body.innerHTML = "<h2 class='text-center mt-5 text-danger'>Product ID not found</h2>";
        return;
    }

    try {
        // 2. Fetch Product Details
        const response = await fetch(`http://localhost:5000/api/products/${productId}`);
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
        if (priceEl) {
            basePrice = product.price || 0;
            priceEl.textContent = `$${basePrice.toFixed(2)}`;
            updatePriceDisplay();
        }
        if (descEl) descEl.textContent = product.description || "No description available.";
        if (categoryEl) categoryEl.textContent = product.category ? product.category.name : "Uncategorized";
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

        // Update Images (Main Gallery + Thumbs)
        if (imagesContainer) {
            let imagesHtml = "";
            let thumbsHtml = "";

            if (product.images && product.images.length > 0) {
                const mainImgUrl = `http://localhost:5000/uploads/${product.images[0]}`;
                imagesHtml = `
                    <div class="product-gallery-main mb-3">
                        <img src="${mainImgUrl}" id="mainImage" class="w-100 rounded shadow-sm" alt="${product.name}">
                    </div>
                `;

                if (product.images.length > 1) {
                    thumbsHtml = `<div class="product-gallery-thumbs d-flex gap-2 mt-2">`;
                    product.images.forEach((img, index) => {
                        const thumbUrl = `http://localhost:5000/uploads/${img}`;
                        thumbsHtml += `
                            <img src="${thumbUrl}" class="thumb-img rounded ${index === 0 ? 'active border-primary' : 'border'}" 
                                onclick="document.getElementById('mainImage').src=this.src; document.querySelectorAll('.thumb-img').forEach(t=>t.classList.remove('border-primary')); this.classList.add('border-primary');" 
                                alt="Thumb ${index + 1}">
                        `;
                    });
                    thumbsHtml += `</div>`;
                }
            } else {
                // Fallback image
                imagesHtml = `
                    <div class="product-gallery-main mb-3">
                        <img src="images/ceramic-cup.jpg" id="mainImage" class="w-100 rounded shadow-sm" alt="Fallback">
                    </div>
                `;
            }

            imagesContainer.innerHTML = imagesHtml + thumbsHtml;
        }

    } catch (error) {
        console.error("Error loading single product:", error);
        const nameEl = document.getElementById("product-name");
        if (nameEl) nameEl.textContent = "Error loading product.";
    }

    // --- ADD TO CART FUNCTIONALITY ---
    const addToCartBtn = document.getElementById('single-add-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            if (!token) {
                if (window.showPopup) showPopup("Please login to add items to the cart.", "warning");
                else alert("Please login to add items to the cart.");
                setTimeout(() => { window.location.href = "login.html"; }, 1500);
                return;
            }

            const productId = addToCartBtn.getAttribute('data-id');
            const quantityInput = document.getElementById('quantity');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

            if (!productId) {
                alert("Product ID is missing or still loading.");
                return;
            }

            const originalText = addToCartBtn.innerHTML;
            addToCartBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
            addToCartBtn.disabled = true;

            try {
                const response = await fetch("http://localhost:5000/api/cart/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ productId, quantity })
                });

                const data = await response.json();

                if (response.ok) {
                    if (window.showPopup) showPopup("Added to Cart successfully!", "success");
                    addToCartBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Added to Cart';
                    setTimeout(() => {
                        addToCartBtn.innerHTML = originalText;
                        addToCartBtn.disabled = false;
                    }, 2000);
                } else {
                    if (window.showPopup) showPopup(data.message || "Failed to add to cart", "danger");
                    else alert(data.message || "Failed to add to cart");
                    addToCartBtn.innerHTML = originalText;
                    addToCartBtn.disabled = false;
                }
            } catch (error) {
                console.error("Add to cart error:", error);
                if (window.showPopup) showPopup("An error occurred while adding to cart.", "danger");
                else alert("An error occurred while adding to cart.");
                addToCartBtn.innerHTML = originalText;
                addToCartBtn.disabled = false;
            }
        });
    }
});

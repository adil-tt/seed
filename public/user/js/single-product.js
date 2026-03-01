/* Single Product JS */

console.log('Single Product page loaded');

function changeImage(element) {
    const mainImg = document.getElementById('mainImage');
    mainImg.src = element.src;

    // Update active class
    document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
    element.classList.add('active');
}

function increaseQty() {
    const input = document.getElementById('quantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseQty() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
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
        if (priceEl) priceEl.textContent = `$${product.price ? product.price.toFixed(2) : "0.00"}`;
        if (descEl) descEl.textContent = product.description || "No description available.";
        if (categoryEl) categoryEl.textContent = product.category ? product.category.name : "Uncategorized";
        if (skuEl) skuEl.textContent = product.sku || product._id.toString().substring(18).toUpperCase();

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
                        <img src="${mainImgUrl}" id="mainImage" class="img-fluid w-100 rounded shadow-sm" style="object-fit: cover; height: 500px;" alt="${product.name}">
                    </div>
                `;

                if (product.images.length > 1) {
                    thumbsHtml = `<div class="product-gallery-thumbs d-flex gap-2 mt-2">`;
                    product.images.forEach((img, index) => {
                        const thumbUrl = `http://localhost:5000/uploads/${img}`;
                        thumbsHtml += `
                            <img src="${thumbUrl}" class="thumb-img rounded ${index === 0 ? 'active border-primary' : 'border'}" style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;" 
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
                        <img src="images/ceramic-cup.jpg" id="mainImage" class="img-fluid w-100 rounded shadow-sm" style="object-fit: cover; height: 500px;" alt="Fallback">
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
});

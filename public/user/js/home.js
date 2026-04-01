/* Home Page Specific JS */

console.log('Home page loaded');

// Newsletter form submission handler
const newsletterForm = document.querySelector('form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        Swal.fire({ text: 'Thank you for subscribing!', icon: 'info' });
    });
}

// --- DYNAMIC CONTENT LOADER ---
document.addEventListener("DOMContentLoaded", async () => {
    let activeOffers = [];

    // 1. FETCH ACTIVE OFFERS
    const carouselInner = document.getElementById("carousel-inner");
    const carouselIndicators = document.getElementById("carousel-indicators");

    try {
        const offResponse = await fetch("/api/offers/active");
        if (offResponse.ok) {
            const offData = await offResponse.json();
            activeOffers = offData.offers || [];
            
            if (activeOffers.length > 0 && carouselInner) {
                renderCarousel(activeOffers);
            }
        }
    } catch (error) {
        console.error("Error loading offers:", error);
    }

    // 2. FETCH LATEST PRODUCTS
    const productsContainer = document.getElementById("home-products");
    if (productsContainer) {
        try {
            const response = await fetch("/api/products");
            if (response.ok) {
                const products = await response.json();
                const latestProducts = products.slice(0, 8);
                renderProducts(latestProducts, activeOffers);
            }
        } catch (error) {
            console.error("Error loading home products:", error);
            productsContainer.innerHTML = "<p class='text-center text-danger'>Error loading products.</p>";
        }
    }

    // 3. FETCH CATEGORIES
    const categoriesContainer = document.getElementById("home-categories");
    if (categoriesContainer) {
        try {
            const catResponse = await fetch("/api/categories?status=active");
            if (catResponse.ok) {
                const catData = await catResponse.json();
                const categories = catData.categories || [];
                renderCategories(categories);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            categoriesContainer.innerHTML = "<p class='text-center text-danger'>Error loading categories.</p>";
        }
    }

    // --- RENDER FUNCTIONS ---

    function renderCarousel(offers) {
        carouselInner.innerHTML = "";
        carouselIndicators.innerHTML = "";

        offers.forEach((offer, index) => {
            // Indicator
            const indicator = document.createElement("button");
            indicator.type = "button";
            indicator.dataset.bsTarget = "#offersCarousel";
            indicator.dataset.bsSlideTo = index;
            if (index === 0) {
                indicator.classList.add("active");
                indicator.ariaCurrent = "true";
            }
            indicator.ariaLabel = `Slide ${index + 1}`;
            carouselIndicators.appendChild(indicator);

            // Slide
            const slide = document.createElement("div");
            slide.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            
            let imageUrl = "https://placehold.co/1920x800/1a1a1a/ffffff?text=Exclusive+Offer";
            if (offer.bannerImage) {
                const cleanPath = offer.bannerImage.startsWith('/') ? offer.bannerImage.substring(1) : offer.bannerImage;
                imageUrl = `/${cleanPath}`;
            }

            slide.style.backgroundImage = `url('${imageUrl}')`;

            const discountBadge = offer.discountType === 'Percentage' 
                ? `${offer.discountValue}% OFF` 
                : `₹${offer.discountValue} OFF`;

            const targetLink = offer.offerType === 'Category' 
                ? `product.html?category=${offer.targetId}` 
                : (offer.offerType === 'Product' ? `single-product.html?id=${offer.targetId}` : 'product.html');

            slide.innerHTML = `
                <div class="banner-content">
                    <span class="banner-badge">${discountBadge}</span>
                    <h1 class="banner-title">${offer.title}</h1>
                    <p class="banner-description">${offer.description || ''}</p>
                    <a href="${targetLink}" class="banner-btn">Shop Now</a>
                </div>
                <div class="countdown-container" data-end="${offer.endDate}">
                    <div class="countdown-box">
                        <span class="number days">00</span>
                        <span class="label">Days</span>
                    </div>
                    <div class="countdown-divider">:</div>
                    <div class="countdown-box">
                        <span class="number hours">00</span>
                        <span class="label">Hrs</span>
                    </div>
                    <div class="countdown-divider">:</div>
                    <div class="countdown-box">
                        <span class="number minutes">00</span>
                        <span class="label">Min</span>
                    </div>
                    <div class="countdown-divider">:</div>
                    <div class="countdown-box">
                        <span class="number seconds">00</span>
                        <span class="label">Sec</span>
                    </div>
                </div>
            `;
            carouselInner.appendChild(slide);
        });

        startCountdownTimers();
    }

    function renderProducts(products, offers) {
        if (products.length === 0) {
            productsContainer.innerHTML = "<p class='text-center text-muted'>No products available.</p>";
            return;
        }

        productsContainer.innerHTML = products.map(product => {
            const { hasDiscount, discountedPrice, originalPrice, activeOffer } = calculateDiscount(product, offers);
            
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

            return `
                <div class="col-lg-3 col-md-4 col-6 mb-4">
                    <div class="product-card">
                        <div class="product-img-wrapper">
                            <a href="single-product.html?id=${product._id}" class="d-block w-100 h-100">
                                <img src="${imageUrl}" class="product-img" alt="${product.name}">
                            </a>
                            <div class="product-actions">
                                <button class="btn btn-sm btn-dark add-to-cart" data-id="${product._id}"><i class="bi bi-cart-plus"></i> Add</button>
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

    function renderCategories(categories) {
        if (categories.length === 0) {
            categoriesContainer.innerHTML = "<p class='text-center text-muted'>No categories available.</p>";
            return;
        }

        categoriesContainer.innerHTML = categories.map(cat => {
            const catImage = cat.image ? `/uploads/${cat.image}` : "images/ceramic-cup.jpg";
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

    function startCountdownTimers() {
        const timerElements = document.querySelectorAll('.countdown-container');
        setInterval(() => {
            const now = new Date().getTime();
            timerElements.forEach(timer => {
                const endDate = new Date(timer.dataset.end).getTime();
                const distance = endDate - now;

                if (distance < 0) {
                    timer.innerHTML = "<div class='text-white fw-bold py-2'>OFFER EXPIRED</div>";
                    return;
                }

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                const dEl = timer.querySelector('.days');
                const hEl = timer.querySelector('.hours');
                const mEl = timer.querySelector('.minutes');
                const sEl = timer.querySelector('.seconds');

                if (dEl) dEl.innerText = String(days).padStart(2, '0');
                if (hEl) hEl.innerText = String(hours).padStart(2, '0');
                if (mEl) mEl.innerText = String(minutes).padStart(2, '0');
                if (sEl) sEl.innerText = String(seconds).padStart(2, '0');
            });
        }, 1000);
    }
});

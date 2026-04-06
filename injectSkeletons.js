const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/user/single-product.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Gallery
content = content.replace(/<div class="product-gallery-main">[\s\S]*?<\/div>\s*<div class="product-gallery-thumbs">[\s\S]*?<\/div>/, `<div class="product-gallery-main skeleton skeleton-img w-100 rounded" style="min-height: 400px; background-color: #eee;"></div>`);

// Replace Name
content = content.replace(/<h1 class="mb-2" id="product-name">.*?<\/h1>/, `<h1 class="mb-2 skeleton skeleton-text" id="product-name" style="height: 3rem; width: 80%;"></h1>`);

// Replace Rating
content = content.replace(/<div class="mb-3">\s*<i class="bi bi-star-fill text-warning"><\/i>[\s\S]*?<\/div>/, `<div class="mb-3 skeleton skeleton-text" style="width: 30%; height: 1.5rem;" id="product-rating-placeholder"></div>`);

// Replace Price
content = content.replace(/<div class="product-price-large" id="product-price">.*?<\/div>/, `<div class="product-price-large skeleton skeleton-text" id="product-price" style="height: 2.5rem; width: 40%; margin-bottom: 20px;"></div>`);

// Replace Description snippet
content = content.replace(/<p class="text-secondary mb-4" id="product-description">[\s\S]*?<\/p>/, `<p class="text-secondary mb-4 skeleton skeleton-text" id="product-description" style="height: 4rem; width: 100%;"></p>`);

// Replace SKU, Cat, Tags
content = content.replace(/<li><span class="fw-bold text-dark">SKU:<\/span> <span id="product-sku">.*?<\/span><\/li>/, `<li class="skeleton skeleton-text" style="width: 50%;"><span class="fw-bold text-dark">SKU:</span> <span id="product-sku"></span></li>`);
content = content.replace(/<li><span class="fw-bold text-dark">Category:<\/span> <span id="product-category">[\s\S]*?<\/span><\/li>/, `<li class="skeleton skeleton-text" style="width: 70%; margin-top: 5px;"><span class="fw-bold text-dark">Category:</span> <span id="product-category"></span></li>`);
content = content.replace(/<li><span class="fw-bold text-dark">Tags:<\/span>.*?<\/li>/, `<li class="skeleton skeleton-text" style="width: 60%; margin-top: 5px;"><span class="fw-bold text-dark">Tags:</span> <span id="product-tags"></span></li>`);

// Replace Tab Description
content = content.replace(/<div class="tab-pane fade show active" id="desc" role="tabpanel">[\s\S]*?<\/div>\s*<div class="tab-pane fade" id="reviews"/, `<div class="tab-pane fade show active" id="desc" role="tabpanel">\n                <div id="desc-placeholder" class="skeleton skeleton-text" style="height: 6rem; width: 100%;"></div>\n            </div>\n            <div class="tab-pane fade" id="reviews"`);

// Replace Reviews
content = content.replace(/<div class="review-item d-flex">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Add Review Form -->/, `<div class="review-item d-flex">\n                    <div class="review-avatar skeleton" style="border-radius: 50%; width: 50px; height: 50px;"></div>\n                    <div class="w-100 ms-3">\n                        <div class="skeleton skeleton-text" style="width: 30%;"></div>\n                        <div class="skeleton skeleton-text" style="width: 80%; height: 2rem;"></div>\n                    </div>\n                </div>\n                <!-- Add Review Form -->`);

fs.writeFileSync(filePath, content);
console.log('Single product successfully skeletonized.');

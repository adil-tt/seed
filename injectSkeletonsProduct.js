const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/user/product.html');
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `<div class="row" id="shop-products">
                    <!-- Skeletons loaded initially -->
                    <div class="col-md-4 col-6 mb-4">
                        <div class="skeleton skeleton-img border-0 rounded" style="min-height:280px; width: 100%;"></div>
                        <div class="skeleton skeleton-text mt-3" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text mt-2" style="width: 40%;"></div>
                    </div>
                    <div class="col-md-4 col-6 mb-4">
                        <div class="skeleton skeleton-img border-0 rounded" style="min-height:280px; width: 100%;"></div>
                        <div class="skeleton skeleton-text mt-3" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text mt-2" style="width: 40%;"></div>
                    </div>
                    <div class="col-md-4 col-6 mb-4">
                        <div class="skeleton skeleton-img border-0 rounded" style="min-height:280px; width: 100%;"></div>
                        <div class="skeleton skeleton-text mt-3" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text mt-2" style="width: 40%;"></div>
                    </div>
                    <div class="col-md-4 col-6 mb-4 d-none d-md-block">
                        <div class="skeleton skeleton-img border-0 rounded" style="min-height:280px; width: 100%;"></div>
                        <div class="skeleton skeleton-text mt-3" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text mt-2" style="width: 40%;"></div>
                    </div>
                    <div class="col-md-4 col-6 mb-4 d-none d-md-block">
                        <div class="skeleton skeleton-img border-0 rounded" style="min-height:280px; width: 100%;"></div>
                        <div class="skeleton skeleton-text mt-3" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text mt-2" style="width: 40%;"></div>
                    </div>
                    <div class="col-md-4 col-6 mb-4 d-none d-md-block">
                        <div class="skeleton skeleton-img border-0 rounded" style="min-height:280px; width: 100%;"></div>
                        <div class="skeleton skeleton-text mt-3" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text mt-2" style="width: 40%;"></div>
                    </div>
                </div>`;

// Use regex to replace everything between <div class="row" id="shop-products"> and its closing </div>
content = content.replace(/<div class="row" id="shop-products">[\s\S]*?<!-- Products will be loaded dynamically by JS -->[\s\S]*?<\/div>/, replacement);

fs.writeFileSync(filePath, content);
console.log('Product.html successfully skeletonized.');

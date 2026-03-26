/**
 * navbar.js
 * Handles global navbar authentication state and restricted links.
 */

function updateNavbar() {
    // Check both localStorage and sessionStorage for token and user data
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const userString = sessionStorage.getItem("user") || localStorage.getItem("user");

    const authContainer = document.getElementById("authContainer");

    if (token && userString) {
        try {
            const user = JSON.parse(userString);
            const displayName = user.firstName || (user.name ? user.name.split(' ')[0] : 'User');

            // USER IS LOGGED IN - Replace Login/SignUp with Welcome & Logout
            if (authContainer) {
                let adminLink = '';
                if (user.role === 'admin') {
                    adminLink = `<a href="../admin/dashboard.html" class="btn btn-outline-primary btn-sm me-2">Admin Panel</a>`;
                }
                
                authContainer.innerHTML = `
                    <span class="me-3 fw-medium text-dark">Welcome, ${displayName}!</span>
                    ${adminLink}
                    <button id="logoutBtn" class="btn btn-outline-danger btn-sm">Logout</button>
                `;

                // Add logout logic
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("user");
                    window.location.reload();
                });
            }
        } catch (error) {
            console.error("Error parsing user data:", error);
        }
    } else {
        // USER NOT LOGGED IN - Restore Login/SignUp buttons
        if (authContainer) {
            authContainer.innerHTML = `
                <a href="login.html" class="btn btn-outline-terracotta me-2 d-none d-lg-block">Login</a>
                <a href="signup.html" class="btn btn-terracotta me-3 d-none d-lg-block">Sign Up</a>
            `;
        }
    }

    // Modal Handler for restricted links (Cart / Wishlist / Profile icon)
    const restrictedLinks = document.querySelectorAll(".restricted-link");
    const loginModalElement = document.getElementById("loginModal");
    let loginModal;

    if (loginModalElement && typeof bootstrap !== "undefined") {
        loginModal = new bootstrap.Modal(loginModalElement);
    }

    restrictedLinks.forEach(link => {
        // Clear old event listeners by cloning
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);

        newLink.addEventListener("click", function (e) {
            const currentToken = sessionStorage.getItem("token") || localStorage.getItem("token");
            if (!currentToken) {
                e.preventDefault();
                if (loginModal) {
                    loginModal.show();
                } else {
                    window.location.href = "login.html";
                }
            }
        });
    });
}

// Optional: Fetch fresh profile data if logged in
async function syncProfile() {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Update storage with fresh data
            const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
            storage.setItem("user", JSON.stringify(data.user));
            
            // Re-run navbar update with fresh name
            updateNavbar();
        }
    } catch (error) {
        console.error("Profile sync failed:", error);
    }
}

// Throttle function to limit rate of execution (e.g. for analytics or heavy visual updates)
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Debounce function to delay execution until user stops typing
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

function setupSearch() {
    const searchLinks = document.querySelectorAll('.icon-link[href="search.html"]');
    
    searchLinks.forEach(link => {
        link.addEventListener('click', (e) => e.preventDefault());
        
        const parent = link.parentNode;
        
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        searchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <i class="bi bi-search text-muted ms-2"></i>
                <input type="text" class="search-input ms-2" placeholder="Search products..." id="navbarSearchInput">
            </div>
            <div class="search-results-dropdown" id="searchDropdown"></div>
        `;
        
        parent.replaceChild(searchContainer, link);
        
        const searchInput = searchContainer.querySelector('#navbarSearchInput');
        const dropdown = searchContainer.querySelector('#searchDropdown');
        
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        const performSearch = async (query) => {
            if (!query) {
                dropdown.style.display = 'none';
                return;
            }
            
            try {
                const response = await fetch("http://localhost:5000/api/products");
                if (response.ok) {
                    let products = await response.json();
                    if(products.data) products = products.data;
                    else if(products.products) products = products.products;
                    
                    const filtered = products.filter(p => 
                        p.name.toLowerCase().includes(query.toLowerCase()) || 
                        (p.category && (typeof p.category === 'string' ? p.category.toLowerCase().includes(query.toLowerCase()) : p.category.name && p.category.name.toLowerCase().includes(query.toLowerCase()))) ||
                        (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
                    );
                    
                    dropdown.innerHTML = '';
                    if (filtered.length === 0) {
                        dropdown.innerHTML = '<div class="search-no-results">No products found</div>';
                    } else {
                        filtered.slice(0, 5).forEach(product => {
                            const item = document.createElement('a');
                            item.className = 'search-result-item';
                            item.href = `single-product.html?id=${product._id}`;
                            
                            const imgPath = product.images && product.images.length > 0
                                ? (`/uploads/${product.images[0]}`)
                                : 'images/default-product.jpg';
                            
                            const price = product.price;
                            
                            item.innerHTML = `
                                <img src="${imgPath}" alt="${product.name}" class="search-result-img" onerror="this.src='https://placehold.co/40x40/f1f1f1/999999?text=No+Img'">
                                <div class="search-result-info">
                                    <div class="search-result-title">${product.name}</div>
                                    <div class="search-result-price">₹${price}</div>
                                </div>
                            `;
                            dropdown.appendChild(item);
                        });
                    }
                    dropdown.style.display = 'block';
                }
            } catch (error) {
                console.error("Search error:", error);
                dropdown.innerHTML = '<div class="search-no-results text-danger">Error loading results</div>';
                dropdown.style.display = 'block';
            }
        };

        const debouncedSearch = debounce((query) => {
            performSearch(query);
        }, 300);

        const throttledInputLog = throttle((query) => {
            // we use throttle to demonstrate its usage as requested, e.g. for analytics
            // console.log("User currently searching for:", query);
        }, 1000);

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                dropdown.innerHTML = '<div class="search-no-results">Searching...</div>';
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
            debouncedSearch(query);
            throttledInputLog(query);
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) {
                dropdown.style.display = 'block';
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
    syncProfile();
    setupSearch();
});

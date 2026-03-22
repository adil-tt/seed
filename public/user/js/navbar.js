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

document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
    syncProfile();
});

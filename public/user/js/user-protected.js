/**
 * user-protected.js
 * Included in private user pages to ensure only logged-in users can access them.
 */

(function () {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Verify token is still valid with the backend
    fetch("/api/auth/profile", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) {
            // Token is invalid, expired, or user is blocked
            sessionStorage.removeItem("token");
            localStorage.removeItem("token");
            sessionStorage.removeItem("user");
            localStorage.removeItem("user");
            window.location.href = "login.html";
        }
    })
    .catch(err => {
        console.error("Auth check failed:", err);
    });
})();

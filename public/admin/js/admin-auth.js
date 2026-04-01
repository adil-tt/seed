/**
 * admin-auth.js
 * Included in all admin pages to ensure only authorized admins can access them.
 */

(function () {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Verify token and role on every page load
    fetch("/api/auth/profile", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.user && data.user.role === "admin") {
                // Authorized
                localStorage.setItem("adminData", JSON.stringify(data.user));
            } else {
                // Not an admin or invalid token
                localStorage.removeItem("token");
                localStorage.removeItem("adminData");
                window.location.href = "login.html";
            }
        })
        .catch(err => {
            console.error("Auth check failed:", err);
            // If network error, maybe don't redirect immediately to allow offline use if needed,
            // but for security, usually best to redirect if verification fails.
        });
})();

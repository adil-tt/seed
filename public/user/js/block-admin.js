/**
 * block-admin.js
 * Blocks admins from accessing user portal pages, while allowing Guests.
 */

(function () {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));

            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                // Don't redirect, just let them act as a guest.
                return;
            }

            if (payload.role === "admin") {
                window.location.href = "../admin/dashboard.html"; 
                // Wait, user asked to redirect to user login page.
                // window.location.href = "login.html";
                // Let's redirect admins to their dashboard or logout if we just want them removed.
                window.location.href = "login.html";
            }

        } catch (err) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
        }
    }
})();

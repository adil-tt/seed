/**
 * user-protected.js
 * Strictly protects user pages from unauthorized access, including Guests and Admins.
 */

(function () {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (payload.role === "admin") {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

    } catch (err) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        window.location.href = "login.html";
    }
})();

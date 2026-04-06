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

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    const decoded = parseJwt(token);

    if (!decoded || !decoded.role || decoded.role !== "admin") {
        console.error("Not an admin or invalid token");
        localStorage.removeItem("token");
        localStorage.removeItem("adminData");
        window.location.href = "login.html";
        return;
    }

    if (decoded.exp && (decoded.exp * 1000) < Date.now()) {
        console.error("Token expired");
        localStorage.removeItem("token");
        localStorage.removeItem("adminData");
        window.location.href = "login.html";
        return;
    }
})();

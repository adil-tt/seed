document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("adminLoginForm");
    const errorAlert = document.getElementById("loginErrorAlert");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Hide previous errors
            if (errorAlert) {
                errorAlert.classList.add("d-none");
                errorAlert.textContent = "";
            }

            const email = document.getElementById("emailInput").value.trim();
            const password = document.getElementById("passwordInput").value.trim();
            const submitBtn = loginForm.querySelector("button[type='submit']");

            if (!email || !password) {
                showError("Please enter both email and password.");
                return;
            }

            try {
                // Disable button and show loading state
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing In...';
                submitBtn.disabled = true;

                const response = await fetch("http://localhost:5000/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to login");
                }

                // Check if user is an admin
                if (data.user && data.user.role === "admin") {
                    // Save token
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("adminData", JSON.stringify(data.user));

                    // Success - redirect to dashboard
                    window.location.href = "dashboard.html";
                } else {
                    // Not an admin
                    throw new Error("Access denied. Admin privileges required.");
                }

            } catch (error) {
                showError(error.message || "An error occurred during login. Please try again.");
                // Reset button
                submitBtn.innerHTML = "Sign In";
                submitBtn.disabled = false;
            }
        });
    }

    function showError(message) {
        if (errorAlert) {
            errorAlert.textContent = message;
            errorAlert.classList.remove("d-none");
        } else {
            Swal.fire({ text: message, icon: 'info' });
        }
    }
});

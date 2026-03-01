/* Cart JS */
console.log('Cart page loaded');

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
        // Only redirect if we are actually on the cart page
        if (window.location.pathname.includes('cart.html')) {
            window.location.href = "login.html";
        }
        return;
    }

    const cartTableBody = document.querySelector(".cart-table tbody");
    if (!cartTableBody) return;

    try {
        const response = await fetch("http://localhost:5000/api/cart", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Unauthorized");
            }
            throw new Error("Failed to fetch cart");
        }

        const cartData = await response.json();

        // Handle variations of API response structure
        const items = Array.isArray(cartData) ? cartData : cartData.items || [];

        if (items.length === 0) {
            cartTableBody.innerHTML = "<tr><td colspan='5' class='text-center py-4'>Your cart is empty.</td></tr>";
            // Update Totals
            document.querySelectorAll('.cart-summary .fw-bold').forEach(el => {
                if (el.textContent.includes('$')) el.textContent = '$0.00';
            });
            return;
        }

        let subtotalTotal = 0;

        cartTableBody.innerHTML = items.map(cartItem => {
            const product = cartItem.product || cartItem;

            const imageUrl = product.images && product.images.length > 0
                ? `http://localhost:5000/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg";

            const price = product.price || 0;
            const subtotal = price * (cartItem.quantity || 1);
            subtotalTotal += subtotal;

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${imageUrl}" alt="${product.name}" class="cart-img" style="width: 60px; height: 60px; object-fit:cover; margin-right:15px; border-radius:5px;">
                            <div><h6 class="mb-0">${product.name}</h6></div>
                        </div>
                    </td>
                    <td class="align-middle">$${price.toFixed(2)}</td>
                    <td class="align-middle">
                        <input type="number" class="form-control" value="${cartItem.quantity || 1}" min="1" style="width: 70px;" readonly>
                    </td>
                    <td class="align-middle fw-medium">$${subtotal.toFixed(2)}</td>
                    <td class="align-middle"><button class="btn text-danger bg-transparent border-0 p-0"><i class="bi bi-trash"></i></button></td>
                </tr>
            `;
        }).join("");

        // Update Summary Totals
        const summaryValues = document.querySelectorAll('.cart-summary .fw-bold');
        if (summaryValues.length >= 2) {
            summaryValues[0].textContent = `$${subtotalTotal.toFixed(2)}`; // Subtotal
            summaryValues[1].textContent = `$${subtotalTotal.toFixed(2)}`; // Total
        }

    } catch (error) {
        console.error("Cart error:", error);
        if (error.message.includes("Unauthorized")) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
            window.location.href = "login.html";
        } else {
            cartTableBody.innerHTML = "<tr><td colspan='5' class='text-center text-danger'>Error loading cart. Check console.</td></tr>";
        }
    }
});

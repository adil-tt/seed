/* Cart JS */
console.log('Cart page loaded');

document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
        let canCheckout = true;

        cartTableBody.innerHTML = items.map(cartItem => {
            const product = cartItem.product || cartItem;

            const imageUrl = product.images && product.images.length > 0
                ? `http://localhost:5000/uploads/${product.images[0]}`
                : "images/ceramic-cup.jpg";

            const price = product.price || 0;
            const stock = product.stock || 0;
            const quantity = cartItem.quantity || 1;

            let stockWarning = "";
            let itemDisabled = false;

            if (stock === 0) {
                stockWarning = `<div class="text-danger small fw-bold mt-1">Out of Stock!</div>`;
                canCheckout = false;
                itemDisabled = true;
            } else if (Math.min(quantity, stock) !== quantity) {
                stockWarning = `<div class="text-danger small mt-1">Only ${stock} left in stock.</div>`;
                canCheckout = false;
                itemDisabled = true;
            }

            const subtotal = price * quantity;
            subtotalTotal += subtotal;

            return `
                <tr class="${itemDisabled ? 'opacity-75 bg-light' : ''}">
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${imageUrl}" alt="${product.name}" class="cart-img" style="width: 60px; height: 60px; object-fit:cover; margin-right:15px; border-radius:5px;">
                            <div>
                                <h6 class="mb-0">${product.name}</h6>
                                ${stockWarning}
                            </div>
                        </div>
                    </td>
                    <td class="align-middle">$${price.toFixed(2)}</td>
                    <td class="align-middle">
                        <input type="number" class="form-control cart-qty-input" data-product-id="${product._id}" data-stock="${stock}" value="${quantity}" min="1" max="${stock}" style="width: 70px;" ${stock === 0 ? 'disabled' : ''}>
                    </td>
                    <td class="align-middle fw-medium">$${subtotal.toFixed(2)}</td>
                    <td class="align-middle"><button class="btn text-danger bg-transparent border-0 p-0" onclick="removeFromCart('${product._id}')"><i class="bi bi-trash fs-5"></i></button></td>
                </tr>
            `;
        }).join("");

        // Update Summary Totals
        const summaryValues = document.querySelectorAll('.cart-summary .fw-bold');
        if (summaryValues.length >= 2) {
            summaryValues[0].textContent = `$${subtotalTotal.toFixed(2)}`; // Subtotal
            summaryValues[1].textContent = `$${subtotalTotal.toFixed(2)}`; // Total
        }

        const checkoutBtn = document.querySelector('a[href="checkout.html"]');
        if (!canCheckout && checkoutBtn) {
            checkoutBtn.classList.add('disabled', 'btn-secondary');
            checkoutBtn.classList.remove('btn-primary');
            checkoutBtn.style.pointerEvents = 'none';
            checkoutBtn.innerHTML = 'Review Cart Items';

            // Show alert box
            const cartSummary = document.querySelector('.cart-summary');
            const alertBox = document.createElement('div');
            alertBox.className = 'alert alert-warning mt-3 p-2 small';
            alertBox.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> Please remove out-of-stock items or adjust quantities to proceed.';
            cartSummary.insertBefore(alertBox, checkoutBtn);
        }

        // Listeners for quantity updates
        document.querySelectorAll('.cart-qty-input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const newQty = parseInt(e.target.value);
                const maxStock = parseInt(e.target.dataset.stock);
                const productId = e.target.dataset.productId;

                if (newQty > maxStock) {
                    Swal.fire({ text: `Only ${maxStock} items available`, icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                    e.target.value = maxStock;
                    return;
                }

                if (newQty < 1) {
                    e.target.value = 1;
                    return;
                }

                try {
                    const updateRes = await fetch(`http://localhost:5000/api/cart/update/${productId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ quantity: e.target.value })
                    });

                    if (updateRes.ok) {
                        window.location.reload();
                    } else {
                        const data = await updateRes.json();
                        Swal.fire({ text: data.message || "Failed to update cart", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                    }
                } catch (err) {
                    console.error("Cart update error:", err);
                    Swal.fire({ text: "Failed to update cart", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                }
            });
        });

    } catch (error) {
        console.error("Cart error:", error);
        if (error.message.includes("Unauthorized")) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
            window.location.href = "login.html";
        } else {
            const tbody = document.querySelector(".cart-table tbody");
            if (tbody) tbody.innerHTML = "<tr><td colspan='5' class='text-center text-danger'>Error loading cart. Check console.</td></tr>";
        }
    }
});

// Global function for removing items
window.removeFromCart = async (productId) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;

    // Optional confirmation
    if (!confirm("Remove item from cart?")) return;

    try {
        const response = await fetch(`http://localhost:5000/api/cart/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            Swal.fire({ text: "Item removed", icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            const data = await response.json();
            Swal.fire({ text: data.message || "Failed to remove item", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        }
    } catch (err) {
        console.error("Remove from cart error:", err);
        Swal.fire({ text: "Failed to remove item", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
};

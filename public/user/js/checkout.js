document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const addressContainer = document.getElementById("deliveryAddressesContainer");
    const summaryContainer = document.getElementById("orderSummaryContainer");

    let cartTotal = 0;
    let addresses = [];

    try {

        /* =========================
           FETCH DELIVERY ADDRESSES
        ========================= */

        const addressRes = await fetch("http://localhost:5000/api/address/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (addressRes.ok) {

            const addressData = await addressRes.json();
            addresses = addressData.addresses || [];

            if (addresses.length > 0) {

                let html = `<div class="d-flex flex-nowrap gap-3 overflow-auto pb-2">`;

                addresses.forEach((addr, idx) => {

                    const checked = addr.isDefault || idx === 0 ? "checked" : "";

                    html += `
                    <div class="border rounded p-3 position-relative" style="min-width:280px;">
                    
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio"
                            name="selectedShippingAddress"
                            value="${addr._id}" ${checked}>

                            <label class="form-check-label fw-bold">
                                ${addr.fullName}
                            </label>
                        </div>

                        <div class="ps-4 small text-muted">
                            ${addr.house}, ${addr.street}<br>
                            ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                            Phone: ${addr.phone}
                        </div>

                    </div>
                    `;
                });

                html += `</div>`;
                addressContainer.innerHTML = html;

            } else {

                addressContainer.innerHTML = `
                <div class="text-center p-4 bg-light rounded">
                    No address found.
                    <br>
                    <a href="add-address.html" class="btn btn-sm btn-primary mt-2">
                        Add Address
                    </a>
                </div>
                `;
            }
        }


        /* =========================
           FETCH CART
        ========================= */

        const cartRes = await fetch("http://localhost:5000/api/cart", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (cartRes.ok) {

            const cartData = await cartRes.json();
            const items = Array.isArray(cartData) ? cartData : cartData.items || [];

            if (items.length === 0) {

                summaryContainer.innerHTML = `
                <div class="text-center py-4">
                    Cart is empty
                </div>`;

                // Disable place order button
                const placeOrderObj = document.getElementById("placeOrderBtn");
                if (placeOrderObj) {
                    placeOrderObj.disabled = true;
                    placeOrderObj.textContent = "Cart is Empty";
                }

                return;
            }

            let subtotal = 0;
            let itemsHtml = "";

            items.forEach(item => {

                const product = item.product || item;
                const price = product.price || 0;
                const qty = item.quantity || 1;

                const itemTotal = price * qty;
                subtotal += itemTotal;

                const img =
                    product.images && product.images.length > 0
                        ? `http://localhost:5000/uploads/${product.images[0]}`
                        : "images/placeholder.jpg";

                itemsHtml += `
                <div class="d-flex align-items-center mb-3 border-bottom pb-3">

                    <img src="${img}"
                    style="width:50px;height:50px;object-fit:cover"
                    class="me-3 rounded">

                    <div class="flex-grow-1">
                        <strong>${product.name}</strong>
                        <br>
                        <small>${qty} x ₹${price}</small>
                    </div>

                    <strong>₹${itemTotal}</strong>

                </div>
                `;
            });

            const deliveryFee = 25;
            const handlingFee = 2;

            cartTotal = subtotal + deliveryFee + handlingFee;

            summaryContainer.innerHTML = `

                ${itemsHtml}

                <hr>

                <div class="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span>₹${subtotal}</span>
                </div>

                <div class="d-flex justify-content-between">
                    <span>Delivery</span>
                    <span>₹${deliveryFee}</span>
                </div>

                <div class="d-flex justify-content-between">
                    <span>Handling Fee</span>
                    <span>₹${handlingFee}</span>
                </div>

                <hr>

                <div class="d-flex justify-content-between">
                    <strong>Total</strong>
                    <strong>₹${cartTotal}</strong>
                </div>

                <button id="placeOrderBtn"
                class="btn btn-dark w-100 mt-3">
                Place Order
                </button>

            `;

        }


        /* =========================
           PLACE ORDER BUTTON
        ========================= */

        document.addEventListener("click", async function (e) {

            if (e.target.id === "placeOrderBtn" || e.target.closest("#placeOrderBtn")) {
                e.preventDefault();

                const selectedAddress =
                    document.querySelector('input[name="selectedShippingAddress"]:checked');

                if (!selectedAddress) {
                    Swal.fire({ text: "Select delivery address", icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
return;
                }

                const paymentMethod =
                    document.querySelector('input[name="paymentMethod"]:checked')?.value || "cod";

                try {

                    const orderRes = await fetch("http://localhost:5000/api/orders", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            addressId: selectedAddress.value,
                            totalAmount: cartTotal,
                            paymentMethod
                        })
                    });

                    const orderData = await orderRes.json();

                    if (!orderRes.ok) {
                        Swal.fire({ text: orderData.message || "Order failed", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
return;
                    }

                    const orderId = orderData.order._id;

                    /* ===== COD ===== */

                    if (paymentMethod === "cod") {
                        Swal.fire({ text: "Order placed successfully!", icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
window.location.href = "order-success.html";
                        return;
                    }

                    /* ===== RAZORPAY ===== */

                    if (paymentMethod === "razorpay") {

                        openRazorpay(orderId, cartTotal);
                    }

                } catch (err) {
                    console.error("Order error", err);
                }

            }

        });

    } catch (error) {
        console.error("Checkout error:", error);
    }

});


/* =====================================
   RAZORPAY PAYMENT
===================================== */

async function openRazorpay(orderId, amount) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/payment/create-order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            amount,
            orderId
        })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        Swal.fire({ text: data.message || "Failed to initialize payment", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        return;
    }

    const options = {
        key: data.key,
        amount: data.order.amount,
        currency: "INR",
        order_id: data.order.id,
        handler: async function (response) {
            try {
                const verifyRes = await fetch("http://localhost:5000/api/payment/verify-payment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderId
                    })
                });

                const verifyData = await verifyRes.json();

                if (verifyRes.ok && verifyData.success) {
                    Swal.fire({ text: "Payment Successful!", icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                    window.location.href = "order-success.html";
                } else {
                    Swal.fire({ text: verifyData.message || "Payment verification failed.", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                }
            } catch (err) {
                console.error("Verification error:", err);
                Swal.fire({ text: "An error occurred during payment verification.", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
        }
    };

    try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            console.error("Payment Failed", response.error);
            Swal.fire({ text: "Payment failed: " + response.error.description, icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        });
        rzp.open();
    } catch (err) {
        console.error("Razorpay SDK Error:", err);
        Swal.fire({ text: "Could not load Razorpay. Please verify you are connected to the internet and check the console.", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
}

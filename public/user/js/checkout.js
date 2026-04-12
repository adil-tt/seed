document.addEventListener("DOMContentLoaded", async () => {

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const addressContainer = document.getElementById("deliveryAddressesContainer");
    const summaryContainer = document.getElementById("orderSummaryContainer");

    let cartTotal = 0;
    let addresses = [];
    let appliedCoupon = null;
    let availableCoupons = [];
    let finalTotalAmount = 0;
    let cartItems = [];

    try {

        /* =========================
           FETCH DELIVERY ADDRESSES
        ========================= */

        const addressRes = await fetch("/api/address/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (addressRes.ok) {
            const addressData = await addressRes.json();
            addresses = addressData.addresses || [];

            if (addresses.length > 0) {
                let html = `<div class="d-flex flex-column gap-3">`;
                addresses.forEach((addr, idx) => {
                    const checked = addr.isDefault || idx === 0 ? "checked" : "";
                    html += `
                    <div class="border rounded p-3 bg-white shadow-xs">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="selectedShippingAddress" value="${addr._id}" id="addr_${addr._id}" ${checked}>
                            <label class="form-check-label fw-bold small text-uppercase" for="addr_${addr._id}">
                                ${addr.fullName} <span class="badge bg-light text-dark border ms-2 fw-normal">${addr.addressType || 'HOME'}</span>
                            </label>
                            <div class="ps-1 pt-2 small text-muted">
                                ${addr.house}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                                <span class="fw-bold">Phone:</span> ${addr.phone}
                            </div>
                        </div>
                    </div>`;
                });
                html += `</div>`;
                addressContainer.innerHTML = html;
            } else {
                addressContainer.innerHTML = `<div class="text-center p-4 bg-light rounded small fw-bold">NO ADDRESS FOUND</div>`;
            }
        }

        /* =========================
           FETCH CART & SUMMARY
        ========================= */

        const cartRes = await fetch("/api/cart", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (cartRes.ok) {
            const cartData = await cartRes.json();
            cartItems = Array.isArray(cartData) ? cartData : cartData.items || [];

            if (cartItems.length === 0) {
                summaryContainer.innerHTML = `<div class="text-center py-5 fw-bold text-uppercase">YOUR CART IS EMPTY</div>`;
                return;
            }

            renderSummary();
            loadCoupons();
        }

        /* =========================
           PLACE ORDER SUBMISSION
        ========================= */

        document.addEventListener("click", async function (e) {
            if (e.target.id === "placeOrderBtn" || e.target.closest("#placeOrderBtn")) {
                e.preventDefault();
                const selectedAddress = document.querySelector('input[name="selectedShippingAddress"]:checked');
                if (!selectedAddress) return Swal.fire({ text: "Please select a delivery address", icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

                const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "cod";

                try {
                    const orderRes = await fetch("/api/orders", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            addressId: selectedAddress.value,
                            totalAmount: finalTotalAmount,
                            paymentMethod,
                            couponCode: appliedCoupon ? appliedCoupon.code : null,
                            discountAmount: cartItems.reduce((acc, item) => acc + ((item.product?.oldPrice || item.product?.price || item.price) * (item.quantity || 1)), 0) - finalTotalAmount
                        })
                    });

                    const orderData = await orderRes.json();
                    if (!orderRes.ok) return Swal.fire({ text: orderData.message || "Order failed", icon: 'error' });

                    if (paymentMethod === "cod") {
                        Swal.fire({ text: "Order placed successfully!", icon: 'success' });
                        window.location.href = "order-success.html";
                    } else if (paymentMethod === "razorpay") {
                        openRazorpay(orderData.order._id, finalTotalAmount);
                    }
                } catch (err) {
                    console.error("Order error", err);
                }
            }
        });

    } catch (error) {
        console.error("Checkout initial error:", error);
    }

    /* =========================
       DYNAMIC SUMMARY RENDER
    ========================= */

    function renderSummary() {
        let subtotal = 0;
        let totalOriginalPrice = 0;
        let itemsCount = 0;
        let phtml = "";

        cartItems.forEach(item => {
            const product = item.product || item;
            const price = product.price || 0;
            const oldPrice = product.oldPrice || price; // Assumed field
            const qty = item.quantity || 1;

            subtotal += (price * qty);
            totalOriginalPrice += (oldPrice * qty);
            itemsCount += qty;

            const img = product.images && product.images.length > 0
                ? `/uploads/${product.images[0]}`
                : "images/placeholder.jpg";

            phtml += `
            <div class="summary-product">
                <img src="${img}" class="summary-product-img">
                <div class="summary-product-info">
                    <h6>${product.name}</h6>
                    <div class="summary-product-meta">Size: ${item.size || 'N/A'} | Qty: ${qty}</div>
                </div>
                <div class="summary-product-price">
                    <span class="current-price">₹${price.toFixed(2)}</span>
                    ${oldPrice > price ? `<span class="original-price">₹${oldPrice.toFixed(2)}</span>` : ""}
                    <a href="#" class="remove-item-btn small text-danger text-decoration-none" data-id="${product._id}"><i class="bi bi-trash border border-danger text-danger p-1 rounded me-1"></i> Remove</a>
                </div>
            </div>`;
        });

        const productDiscount = totalOriginalPrice - subtotal;
        let couponDiscount = 0;

        if (appliedCoupon) {
            if (appliedCoupon.valueType === 'Percentage') {
                couponDiscount = (subtotal * (appliedCoupon.discountValue / 100));
                if (appliedCoupon.maxCap) couponDiscount = Math.min(couponDiscount, appliedCoupon.maxCap);
            } else {
                couponDiscount = appliedCoupon.discountValue;
            }
        }

        const shipping = 0; // FREE as per design
        finalTotalAmount = subtotal - couponDiscount + shipping;
        const totalSaved = productDiscount + couponDiscount;

        let couponHtml = "";
        if (appliedCoupon) {
            couponHtml = `
            <div class="coupon-section mt-4">
                <div class="coupon-section-label">Coupon code applied</div>
                <div class="input-group">
                    <input type="text" class="form-control text-uppercase fw-bold" value="${appliedCoupon.code}" readonly>
                    <button class="btn btn-danger px-4 fw-bold" id="removeCouponBtn">REMOVE</button>
                </div>
                <div class="coupon-applied-msg">Coupon applied! You saved ₹${couponDiscount.toFixed(2)}</div>
            </div>`;
        } else {
            couponHtml = `
            <div class="coupon-section mt-4">
                <div class="coupon-section-label">Have a coupon?</div>
                <div class="input-group">
                    <input type="text" id="couponInput" class="form-control text-uppercase" placeholder="ENTER CODE">
                    <button class="btn btn-dark px-4 fw-bold" id="applyCouponBtn">APPLY</button>
                </div>
            </div>`;
        }

        summaryContainer.innerHTML = `
            <div class="summary-header">ORDER SUMMARY</div>
            
            <div class="summary-product-list my-4">
                ${phtml}
            </div>

            ${couponHtml}
            
            <a href="#" class="view-offers-link" id="viewOffersBtn">
                <i class="bi bi-ticket-perforated"></i> VIEW AVAILABLE OFFERS
            </a>

            <div class="price-breakdown">
                <div class="price-row">
                    <span>Price (${itemsCount} items)</span>
                    <span>₹${totalOriginalPrice.toFixed(2)}</span>
                </div>
                <div class="price-row discount-row">
                    <span>Product Discount</span>
                    <span>-₹${productDiscount.toFixed(2)}</span>
                </div>
                ${couponDiscount > 0 ? `
                <div class="price-row discount-row">
                    <span>Coupon (${appliedCoupon.code})</span>
                    <span>-₹${couponDiscount.toFixed(2)}</span>
                </div>` : ""}
                <div class="price-row">
                    <span>Shipping</span>
                    <span class="text-success fw-bold">FREE</span>
                </div>
                <div class="price-row total-saved-row">
                    <span>Total Saved</span>
                    <span>₹${totalSaved.toFixed(2)}</span>
                </div>
            </div>

            <div class="total-payable-section">
                <div class="total-payable-label">Total Payable</div>
                <div class="total-payable-value">₹${finalTotalAmount.toFixed(2)}</div>
            </div>

            <div class="savings-encouragement">
                <i class="bi bi-check-circle-fill"></i> You saved ₹${totalSaved.toFixed(2)} on this order!
            </div>

            <button id="placeOrderBtn" class="btn-place-order-premium mt-4">
                PLACE ORDER <i class="bi bi-arrow-right"></i>
            </button>
        `;

        // Attach dynamic events
        attachSummaryEvents();
    }

    /* =========================
       COUPON LOGIC
    ========================= */

    async function loadCoupons() {
        try {
            const res = await fetch("/api/coupons/available");
            const data = await res.json();
            if (data.success) availableCoupons = data.coupons || [];
        } catch (err) { console.error("Coupon fetch error", err); }
    }

    function attachSummaryEvents() {
        // Apply Coupon
        const btnApply = document.getElementById('applyCouponBtn');
        if (btnApply) {
            btnApply.addEventListener('click', () => {
                const code = document.getElementById('couponInput').value.trim().toUpperCase();
                if (!code) return Swal.fire({ text: "Please enter a code", icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                applyCouponCore(code);
            });
        }

        // Remove Coupon
        const btnRemove = document.getElementById('removeCouponBtn');
        if (btnRemove) {
            btnRemove.addEventListener('click', () => {
                appliedCoupon = null;
                renderSummary();
            });
        }

        // View Offers
        const btnOffers = document.getElementById('viewOffersBtn');
        if (btnOffers) {
            btnOffers.addEventListener('click', (e) => {
                e.preventDefault();
                showOffersModal();
            });
        }

        // Remove item from checkout explicitly
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = e.currentTarget.getAttribute('data-id');
                if (!confirm("Remove item from your order?")) return;
                
                try {
                    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
                    e.currentTarget.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                    
                    const response = await fetch(`/api/cart/${productId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.ok) {
                        Swal.fire({ text: "Item removed", icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                        
                        const cartRes = await fetch("/api/cart", { headers: { "Authorization": `Bearer ${token}` } });
                        if (cartRes.ok) {
                            const cartData = await cartRes.json();
                            cartItems = Array.isArray(cartData) ? cartData : cartData.items || [];
                            if (cartItems.length === 0) {
                                document.getElementById('orderSummaryContainer').innerHTML = `<div class="text-center py-5 fw-bold text-uppercase">YOUR CART IS EMPTY</div>`;
                            } else {
                                renderSummary();
                            }
                        }
                    } else {
                        const data = await response.json();
                        Swal.fire({ text: data.message || "Failed to remove item", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                        renderSummary();
                    }
                } catch (err) {
                    console.error("Remove from checkout error:", err);
                    Swal.fire({ text: "Failed to remove item", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                    renderSummary();
                }
            });
        });
    }

    function applyCouponCore(code) {
        const coupon = availableCoupons.find(c => c.code === code);
        if (!coupon) return Swal.fire({ text: "Invalid or expired coupon", icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });

        // Check minimum purchase if applicable
        const subtotal = cartItems.reduce((acc, item) => acc + ((item.product?.price || item.price) * (item.quantity || 1)), 0);
        if (coupon.minPurchase && subtotal < coupon.minPurchase) {
            return Swal.fire({ text: `Min purchase of ₹${coupon.minPurchase} required`, icon: 'warning' });
        }

        appliedCoupon = coupon;
        renderSummary();
        Swal.fire({ text: "Coupon applied!", icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    }

    function showOffersModal() {
        const modalBody = document.getElementById('couponsModalBody');
        if (availableCoupons.length === 0) {
            modalBody.innerHTML = `<div class="text-center py-4 text-muted">No offers available at this moment.</div>`;
        } else {
            let html = "";
            availableCoupons.forEach(c => {
                const val = c.valueType === 'Percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`;
                html += `
                <div class="border rounded p-3 mb-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
                    <div>
                        <span class="badge bg-success mb-2">${c.code}</span><br>
                        <strong class="text-dark d-block mb-1">${val}</strong>
                        <div class="text-muted small">${c.title}</div>
                        ${c.minPurchase ? `<div class="text-danger extra-small fw-bold mt-1">Min. order ₹${c.minPurchase}</div>` : ""}
                    </div>
                    <button class="btn btn-sm btn-dark px-3 fw-bold apply-modal-btn" data-code="${c.code}">APPLY</button>
                </div>`;
            });
            modalBody.innerHTML = html;

            document.querySelectorAll('.apply-modal-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const code = e.target.getAttribute('data-code');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('couponsModal'));
                    if (modal) modal.hide();
                    applyCouponCore(code);
                });
            });
        }

        const myModal = new bootstrap.Modal(document.getElementById('couponsModal'));
        myModal.show();
    }

});

/* =====================================
   RAZORPAY PAYMENT
===================================== */

async function openRazorpay(orderId, amount) {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount, orderId })
    });

    const data = await res.json();
    if (!res.ok || !data.success) return Swal.fire({ text: data.message || "Failed to initialize payment", icon: 'error' });

    const options = {
        key: data.key,
        amount: data.order.amount,
        currency: "INR",
        order_id: data.order.id,
        handler: async function (response) {
            try {
                const verifyRes = await fetch("/api/payment/verify-payment", {
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
                    Swal.fire({ text: "Payment Successful!", icon: 'success' });
                    window.location.href = "order-success.html";
                } else {
                    Swal.fire({ text: verifyData.message || "Payment verification failed.", icon: 'error' });
                }
            } catch (err) {
                console.error("Verification error:", err);
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    // Helper to format dates
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    try {
        // Fetch Orders
        const ordersRes = await fetch("http://localhost:5000/api/orders/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            const orders = ordersData.orders || [];

            // Update Total Orders Count (if the ID exists)
            const countEl = document.getElementById('total-orders-count');
            if (countEl) countEl.textContent = orders.length;

            // Update Recent Orders List
            const listEl = document.getElementById('recent-orders-list');
            if (listEl) {
                if (orders.length === 0) {
                    listEl.innerHTML = '<div class="text-center py-4 text-muted">No recent orders found.</div>';
                } else {
                    const recent = orders.slice(0, 2);
                    let html = '';
                    recent.forEach(order => {
                        const statusClass = order.status === 'Delivered' ? 'delivered' : 'processing';
                        let itemsHtml = '';

                        order.products.forEach(item => {
                            const img = item.image
                                ? `http://localhost:5000/uploads/${item.image}`
                                : 'images/ceramic-cup.jpg';
                            itemsHtml += `<img src="${img}" class="order-product-thumb" alt="Product">`;
                        });

                        html += `
                        <div class="order-item-card mb-3">
                            <div class="order-header">
                                <div>
                                    <span class="fw-bold d-block">Order #${order._id.toString().substring(18).toUpperCase()}</span>
                                    <small class="text-muted">Placed on ${formatDate(order.createdAt)}</small>
                                </div>
                                <div class="text-end">
                                    <div class="fw-bold mb-1">$${order.totalAmount.toFixed(2)}</div>
                                    <span class="order-status ${statusClass}">${order.status}</span>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div class="order-products">
                                    ${itemsHtml}
                                </div>
                                <a href="my-orders.html" class="btn btn-sm btn-outline-secondary">View Details</a>
                            </div>
                        </div>`;
                    });
                    listEl.innerHTML = html;
                }
            }
        }

        // Fetch Addresses
        const addressRes = await fetch("http://localhost:5000/api/address/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (addressRes.ok) {
            const addressData = await addressRes.json();
            const countEl = document.getElementById('total-addresses-count');
            if (countEl) countEl.textContent = addressData.addresses ? addressData.addresses.length : 0;
        }

    } catch (err) {
        console.error("Dashboard fetch error:", err);
    }
});

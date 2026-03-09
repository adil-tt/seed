document.addEventListener("DOMContentLoaded", () => {
    fetchOrders();
    setupEventListeners();
});

// State
let currentPage = 1;
const limit = 10;
let searchQuery = "";
let currentStatusFilter = "All";

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                searchQuery = e.target.value.trim();
                currentPage = 1;
                fetchOrders();
            }, 500);
        });
    }

    const filterTabs = document.querySelectorAll('#statusFilters .filter-tab');
    if (filterTabs) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active from all
                filterTabs.forEach(t => t.classList.remove('active'));
                // Add active to clicked
                e.target.classList.add('active');

                currentStatusFilter = e.target.getAttribute('data-status') || "All";
                currentPage = 1; // Reset page
                fetchOrders();
            });
        });
    }
}

async function fetchOrders() {
    try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            console.error("No valid token found. Admin may not be logged in.");
            window.location.href = "login.html";
            return;
        }

        const params = new URLSearchParams({
            page: currentPage,
            limit: limit,
            status: currentStatusFilter,
            search: searchQuery
        });

        const response = await fetch(`http://localhost:5000/api/admin/orders?${params.toString()}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to fetch orders: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            renderStats(data.stats);
            renderOrders(data.orders);
            renderPagination(data.pagination);

            // Map total to the all button text
            const allBtn = document.querySelector('.filter-tab[data-status="All"]');
            if (allBtn && currentStatusFilter === "All") {
                allBtn.textContent = `All order (${data.stats.totalOrders})`;
            }
        }
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        const tbody = document.querySelector("#orderTableBody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan='8' class='text-center py-4 text-danger'><i class="bi bi-exclamation-triangle"></i> Error loading orders: ${error.message} <br> <a href="login.html" class="btn btn-sm btn-outline-primary mt-2">Go to Login</a></td></tr>`;
        }
    }
}

function renderStats(stats) {
    const elTotal = document.getElementById('totalOrders');
    const elNew = document.getElementById('newOrders');
    const elCompleted = document.getElementById('completedOrders');
    const elCanceled = document.getElementById('canceledOrders');

    if (elTotal) elTotal.textContent = stats.totalOrders.toLocaleString();
    if (elNew) elNew.textContent = stats.newOrders.toLocaleString();
    if (elCompleted) elCompleted.textContent = stats.completedOrders.toLocaleString();
    if (elCanceled) elCanceled.textContent = stats.canceledOrders.toLocaleString();
}

function renderOrders(orders) {
    const tbody = document.querySelector("#orderTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='8' class='text-center py-4'>No orders found matching criteria.</td></tr>";
        return;
    }

    orders.forEach((order, index) => {
        // We will just show the first product in the table for preview if there are multiple.
        const mainProduct = order.products && order.products.length > 0 ? order.products[0] : null;
        const productName = mainProduct ? mainProduct.name : 'Unknown Product';
        const productImg = mainProduct && mainProduct.image ? `http://localhost:5000/uploads/${mainProduct.image.split('\\').pop().split('/').pop()}` : 'images/default-product.png';
        const productExtra = order.products.length > 1 ? ` <span class="badge bg-secondary ms-1">+${order.products.length - 1} more</span>` : '';

        const shortId = `#ORD-${order._id.toString().slice(-6).toUpperCase()}`;
        const dateObj = new Date(order.createdAt);
        const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;

        let paymentClass = "text-secondary";
        let paymentText = order.paymentStatus;
        let paymentIcon = "bi-circle-fill";
        if (order.paymentStatus === 'Completed') {
            paymentClass = "text-success";
            paymentText = "Paid";
        } else if (order.paymentStatus === 'Pending') {
            paymentClass = "text-danger";
            paymentText = "Unpaid";
        }

        const validStatuses = ["Processing", "Pending", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"];
        let statusOptionsHtml = "";
        validStatuses.forEach(status => {
            const isSelected = order.deliveryStatus === status ? "selected" : "";
            statusOptionsHtml += `<option value="${status}" ${isSelected}>${status}</option>`;
        });

        let selectColorClass = "";
        if (order.deliveryStatus === "Delivered") selectColorClass = "text-success bg-soft-success";
        else if (order.deliveryStatus === "Cancelled") selectColorClass = "text-danger bg-soft-danger";
        else if (order.deliveryStatus === "Shipped" || order.deliveryStatus === "Out for Delivery") selectColorClass = "text-dark";
        else selectColorClass = "text-warning bg-soft-warning";

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input class="form-check-input" type="checkbox"></td>
            <td>${(currentPage - 1) * limit + index + 1}</td>
            <td class="fw-bold">${shortId}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${productImg}" class="product-img-small me-2 rounded" style="object-fit:cover; width:40px; height:40px;" alt="Product" onerror="this.src='images/ceramic-cup.jpg'">
                    <span>${productName}${productExtra}</span>
                </div>
            </td>
            <td>${dateStr}</td>
            <td>$${order.totalAmount.toFixed(2)}</td>
            <td><span class="${paymentClass} small fw-bold"><i class="bi ${paymentIcon}" style="font-size: 6px;"></i> ${paymentText}</span></td>
            <td>
                <select class="form-select form-select-sm border-0 fw-bold ${selectColorClass}" onchange="changeOrderStatus('${order._id}', this.value)" style="box-shadow:none; cursor:pointer; font-size: 0.8rem;">
                    ${statusOptionsHtml}
                </select>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function renderPagination(pagination) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button class="btn btn-white border px-3" onclick="changePage(${pagination.currentPage - 1})" ${pagination.currentPage === 1 ? 'disabled' : ''}>← Previous</button>
        <nav aria-label="Page navigation">
            <ul class="pagination mb-0">
    `;

    for (let i = 1; i <= pagination.totalPages; i++) {
        html += `<li class="page-item ${i === pagination.currentPage ? 'active' : ''}"><button class="page-link" onclick="changePage(${i})">${i}</button></li>`;
    }

    html += `
            </ul>
        </nav>
        <button class="btn btn-white border px-3" onclick="changePage(${pagination.currentPage + 1})" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}>Next →</button>
    `;

    container.innerHTML = html;
}

window.changePage = function (page) {
    currentPage = page;
    fetchOrders();
}

window.changeOrderStatus = async function (orderId, newStatus) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    if (!confirm(`Are you sure you want to change this order's status to ${newStatus}?`)) {
        fetchOrders(); // Re-render to revert dropdown visual state
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ deliveryStatus: newStatus })
        });

        const data = await response.json();
        if (response.ok) {
            // Success
            fetchOrders(); // Re-fetch to update stats, badges, and ensure sync
        } else {
            alert(data.message || `Failed to update status`);
            fetchOrders(); // Revert
        }
    } catch (error) {
        console.error(`Error updating order:`, error);
        alert(`An error occurred while trying to update order status.`);
        fetchOrders(); // Revert
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchTransactions();
    setupEventListeners();
});

let currentPage = 1;
const limit = 10;
let searchQuery = "";
let currentStatusFilter = "All";
let allFetchedOrders = []; // To store orders for the modal

function setupEventListeners() {
    const searchInput = document.querySelector('input[placeholder="Search payment history"]');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                searchQuery = e.target.value.trim();
                currentPage = 1;
                fetchTransactions();
            }, 500);
        });
    }

    const filterTabs = document.querySelectorAll('#statusFilters .filter-tab');
    if (filterTabs.length > 0) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentStatusFilter = e.target.getAttribute('data-status') || "All";
                currentPage = 1;
                fetchTransactions();
            });
        });
    }

    const btnGenerate = document.getElementById("btnGenerateReport");
    if (btnGenerate) {
        btnGenerate.addEventListener("click", generateReport);
    }
}

async function generateReport() {
    try {
        const fromDate = document.getElementById("exportFromDate").value;
        const toDate = document.getElementById("exportToDate").value;
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");

        if (!token) return;

        const btn = document.getElementById("btnGenerateReport");
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
        btn.disabled = true;

        const params = new URLSearchParams();
        if (fromDate) params.append("startDate", fromDate);
        if (toDate) params.append("endDate", toDate);

        const response = await fetch(`/api/admin/orders/export?${params.toString()}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to download report');
        }

        // Handle File Download securely
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `Sales_Report_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

        btn.innerHTML = originalText;
        btn.disabled = false;
        
        Swal.fire({ text: 'Report generated successfully!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (error) {
        console.error("Export Error:", error);
        Swal.fire({ text: error.message || 'Failed to generate report', icon: 'error' });
        const btn = document.getElementById("btnGenerateReport");
        btn.innerHTML = '<i class="bi bi-download"></i> Generate Excel Report';
        btn.disabled = false;
    }
}

async function fetchTransactions() {
    try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        const params = new URLSearchParams({
            page: currentPage,
            limit: limit,
            status: currentStatusFilter, // Admin orders endpoint uses status for deliveryStatus but we want transaction page
            search: searchQuery
        });

        const response = await fetch(`/api/admin/orders?${params.toString()}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch transactions: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            allFetchedOrders = data.orders; // Save for modal usage
            renderStats(data.stats);
            renderTransactions(data.orders);
            renderPagination(data.pagination);

            const allBtn = document.querySelector('.filter-tab[data-status="All"]');
            if (allBtn && currentStatusFilter === "All") {
                allBtn.textContent = `All order (${data.stats.totalOrders})`;
            }
        }
    } catch (error) {
        console.error("Error fetching transactions:", error);
        const tbody = document.querySelector("#transactionTableBody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan='7' class='text-center py-4 text-danger'><i class="bi bi-exclamation-triangle"></i> Error loading transactions</td></tr>`;
        }
    }
}

function renderStats(stats) {
    const elRevenue = document.getElementById('total-revenue');
    const elCompleted = document.getElementById('total-completed');
    const elPending = document.getElementById('total-pending');
    const elFailed = document.getElementById('total-failed');

    if (elRevenue) elRevenue.textContent = `$${(stats.totalRevenue || 0).toLocaleString()}`;
    if (elCompleted) elCompleted.textContent = (stats.completedOrders || 0).toLocaleString();
    if (elPending) elPending.textContent = (stats.newOrders || 0).toLocaleString(); // Mapping new orders as pending for transactions
    if (elFailed) elFailed.textContent = (stats.canceledOrders || 0).toLocaleString();
}

function renderTransactions(orders) {
    const tbody = document.querySelector("#transactionTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' class='text-center py-4'>No transactions found.</td></tr>";
        return;
    }

    orders.forEach((order) => {
        // Customer Info
        const customerName = order.user && order.user.name ? order.user.name : "Unknown User";
        const shortCustId = order.user && order.user._id ? `#CUST${order.user._id.toString().slice(-3).toUpperCase()}` : "#CUST000";

        // Date
        const dateObj = new Date(order.createdAt);
        const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;

        // Payment status badge
        let paymentStatusClass = "danger";
        let paymentDot = "danger";
        if (order.paymentStatus === "Completed") {
            paymentStatusClass = "success";
            paymentDot = "success";
        } else if (order.paymentStatus === "Pending") {
            paymentStatusClass = "warning";
            paymentDot = "warning";
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${shortCustId}</td>
            <td>${customerName}</td>
            <td>${dateStr}</td>
            <td class="fw-bold">$${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${order.paymentMethod || 'N/A'}</td>
            <td><span class="badge bg-transparent text-${paymentStatusClass} p-0 fw-normal"><span class="status-dot bg-${paymentDot}"></span> ${order.paymentStatus}</span></td>
            <td class="text-end">
                <button onclick="viewOrderDetails('${order._id}')" class="btn btn-link btn-sm text-decoration-none text-primary p-0">View Details</button>
            </td>
        `;
        tbody.appendChild(tr);
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
    fetchTransactions();
};

window.viewOrderDetails = function (orderId) {
    const order = allFetchedOrders.find(o => o._id === orderId);
    if (!order) return;

    // customer info
    document.getElementById("modalCustomerName").textContent = order.user && order.user.name ? order.user.name : "Unknown User";
    document.getElementById("modalCustomerEmail").textContent = order.user && order.user.email ? order.user.email : "N/A";
    
    // Address
    if (order.shippingAddress) {
        const addr = order.shippingAddress;
        document.getElementById("modalShippingAddress").innerHTML = `
            ${addr.fullName} <br>
            ${addr.streetAddress || ''} ${addr.apartment ? ', ' + addr.apartment : ''} <br>
            ${addr.city}, ${addr.state} ${addr.pinCode} <br>
            Phone: ${addr.phone || 'N/A'}
        `;
        document.getElementById("modalCustomerPhone").textContent = addr.phone || 'N/A';
    } else {
        document.getElementById("modalShippingAddress").textContent = "N/A";
        document.getElementById("modalCustomerPhone").textContent = "N/A";
    }

    // Payment and Order
    document.getElementById("modalPaymentMethod").textContent = order.paymentMethod || 'N/A';
    
    const payBadge = document.getElementById("modalPaymentStatus");
    payBadge.textContent = order.paymentStatus || 'N/A';
    payBadge.className = `badge bg-${order.paymentStatus === 'Completed' ? 'success' : 'danger'}`;

    document.getElementById("modalDeliveryStatus").textContent = order.deliveryStatus || 'Pending';
    document.getElementById("modalDeliveryStatus").className = `badge bg-${order.deliveryStatus === 'Delivered' ? 'success' : (order.deliveryStatus === 'Cancelled' ? 'danger' : 'warning text-dark')}`;

    const dateObj = new Date(order.createdAt);
    document.getElementById("modalOrderDate").textContent = dateObj.toLocaleString();

    // Products
    const tbody = document.getElementById("modalProductsList");
    tbody.innerHTML = "";
    if (order.products && order.products.length > 0) {
        order.products.forEach(item => {
            // safely handle varying path separators without relying on deep escaping
            const imagePath = item.image ? item.image.replace(/\\/g, '/').split('/').pop() : '';
            const img = item.image ? `/uploads/${imagePath}` : 'images/default-product.png';
            const price = item.price || 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${img}" class="rounded me-2" width="40" height="40" style="object-fit:cover;" onerror="this.src='images/ceramic-cup.jpg'">
                        <span class="small">${item.name || 'Unknown Item'}</span>
                    </div>
                </td>
                <td class="text-center align-middle">${item.quantity || 1}</td>
                <td class="text-end align-middle fw-bold">$${(price * (item.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = "<tr><td colspan='3' class='text-center py-2'>No items found</td></tr>";
    }

    // Totals
    const subtotal = order.totalAmount + (order.discount || 0);
    document.getElementById("modalSubtotal").textContent = `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById("modalDiscount").textContent = order.discount ? `-$${order.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00";
    document.getElementById("modalShipping").textContent = order.shippingFee ? `$${order.shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Free";
    document.getElementById("modalTotal").textContent = `$${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
};

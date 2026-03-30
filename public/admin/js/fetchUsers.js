document.addEventListener("DOMContentLoaded", () => {
    fetchUsers();
    setupEventListeners();
});

// State
let currentPage = 1;
const limit = 10;
let searchQuery = "";
let selectedUser = null;
let allUsersData = [];

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                searchQuery = e.target.value;
                currentPage = 1; // Reset to first page on search
                fetchUsers();
            }, 500); // Debounce search
        });
    }

    const blockBtn = document.getElementById('blockCustomerBtn');
    if (blockBtn) {
        blockBtn.addEventListener('click', handleBlockUser);
    }
}

async function fetchUsers() {
    try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            console.error("No valid token found. Admin may not be logged in.");
            window.location.href = "login.html";
            return;
        }

        const params = new URLSearchParams({
            page: currentPage,
            limit: limit,
            search: searchQuery
        });

        const response = await fetch(`http://localhost:5000/api/admin/users?${params.toString()}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to fetch users: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            allUsersData = data.users;
            renderUsers(data.users);
            renderPagination(data.pagination);
            
            // Populate summary stats if available
            if (data.summary) {
                updateSummaryStats(data.summary);
                if (window.updateCustomerChart) {
                    window.updateCustomerChart(data.summary.weeklyRegistrations);
                }
            }

            // Auto-select first user if none selected
            if (data.users.length > 0 && !selectedUser) {
                selectUser(data.users[0]._id);
            }
        }
    } catch (error) {
        console.error("Error fetching admin users:", error);
        const tbody = document.querySelector("#customerTableBody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan='7' class='text-center py-4 text-danger'><i class="bi bi-exclamation-triangle"></i> Error loading customers: ${error.message} <br> <a href="login.html" class="btn btn-sm btn-outline-primary mt-2">Go to Login</a></td></tr>`;
        }
    }
}

function updateSummaryStats(summary) {
    const totalEl = document.getElementById('customer-total');
    const activeEl = document.getElementById('customer-active');
    const newEl = document.getElementById('customer-new');
    
    if (totalEl) totalEl.textContent = summary.total.toLocaleString();
    if (activeEl) activeEl.textContent = summary.active.toLocaleString();
    if (newEl) newEl.textContent = summary.new.toLocaleString();

    // Also update the chart metrics header if they exist
    const chartActive = document.querySelector('.col-lg-9 h4:nth-of-type(1)');
    if (chartActive) chartActive.textContent = (summary.active >= 1000 ? (summary.active / 1000).toFixed(1) + 'k' : summary.active);
}

function renderUsers(users) {
    const tbody = document.querySelector("#customerTableBody");
    if (!tbody) {
        console.error("Could not find table body with ID #customerTableBody");
        return;
    }

    tbody.innerHTML = ""; // Clear existing dummy table rows

    if (users.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' class='text-center py-4'>No customers found.</td></tr>";
        return;
    }

    users.forEach(user => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
        const phone = user.phone && user.phone !== 'N/A' ? user.phone : 'No Phone';
        const shortId = `#CUST-${user._id.toString().slice(-6).toUpperCase()}`;

        let statusClass = "text-secondary";
        let statusText = "Unknown";
        if (user.status === 'Active') {
            statusClass = "text-success";
            statusText = "Active";
        } else if (user.status === 'Pending') {
            statusClass = "text-warning";
            statusText = "Pending";
        }

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => selectUser(user._id);

        if (selectedUser && selectedUser._id === user._id) {
            row.classList.add('table-active');
        }

        row.innerHTML = `
            <td>${shortId}</td>
            <td>${name}</td>
            <td>${phone}</td>
            <td>${user.orderCount || 0}</td>
            <td>${(user.totalSpend || 0).toFixed(2)}</td>
            <td><span class="${statusClass} small fw-bold"><i class="bi bi-circle-fill" style="font-size: 6px;"></i> ${statusText}</span></td>
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
    fetchUsers();
}

function selectUser(userId) {
    const user = allUsersData.find(u => u._id === userId);
    if (!user) return;

    selectedUser = user;

    // Re-render table to show active selection
    renderUsers(allUsersData);

    // Update side panel
    updateSidePanel(user);
}

async function updateSidePanel(user) {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Customer';
    const email = user.email;
    const phone = user.phone && user.phone !== 'N/A' ? user.phone : 'Not provided';
    const joined = new Date(user.createdAt).toLocaleDateString('en-GB');

    const panelName = document.getElementById('sidePanelName');
    const panelEmail = document.getElementById('sidePanelEmail');
    const panelPhone = document.getElementById('sidePanelPhone');
    const panelJoined = document.getElementById('sidePanelJoined');
    const blockBtn = document.getElementById('blockCustomerBtn');

    // UI elements to update with fetched data
    const panelAddress = document.getElementById('sidePanelAddress');
    const panelLastPurchase = document.getElementById('sidePanelLastPurchase');
    const panelTotalOrders = document.getElementById('sidePanelTotalOrders');
    const panelCompletedOrders = document.getElementById('sidePanelCompletedOrders');
    const panelCanceledOrders = document.getElementById('sidePanelCanceledOrders');

    if (panelName) panelName.textContent = name;
    if (panelEmail) panelEmail.textContent = email;
    if (panelPhone) panelPhone.value = phone;
    if (panelJoined) panelJoined.textContent = `Registration: ${joined}`;

    // Show loading text while fetching
    if (panelAddress) panelAddress.value = "Loading...";
    if (panelLastPurchase) panelLastPurchase.textContent = "Last purchase: Loading...";
    if (panelTotalOrders) panelTotalOrders.textContent = "...";
    if (panelCompletedOrders) panelCompletedOrders.textContent = "...";
    if (panelCanceledOrders) panelCanceledOrders.textContent = "...";

    if (blockBtn) {
        if (user.isBlocked) {
            blockBtn.innerHTML = `<i class="bi bi-unlock"></i> Unblock Customer`;
            blockBtn.classList.replace('btn-outline-danger', 'btn-outline-success');
        } else {
            blockBtn.innerHTML = `<i class="bi bi-slash-circle"></i> Block Customer`;
            blockBtn.classList.replace('btn-outline-success', 'btn-outline-danger');
        }
    }

    try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/admin/users/${user._id}/details`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const fullUser = data.user;
            const stats = data.stats;

            // Determine address
            let addressStr = "Not provided";
            if (fullUser.addresses && fullUser.addresses.length > 0) {
                const defAddr = fullUser.addresses.find(a => a.isDefault) || fullUser.addresses[0];
                addressStr = `${defAddr.house}, ${defAddr.city}, ${defAddr.state}`;
            }

            if (panelAddress) panelAddress.value = addressStr;

            if (panelLastPurchase) {
                if (stats.lastPurchaseDate) {
                    panelLastPurchase.textContent = `Last purchase: ${new Date(stats.lastPurchaseDate).toLocaleDateString('en-GB')}`;
                } else {
                    panelLastPurchase.textContent = `Last purchase: Never`;
                }
            }

            if (panelTotalOrders) panelTotalOrders.textContent = stats.totalOrders;
            if (panelCompletedOrders) panelCompletedOrders.textContent = stats.completedOrders;
            if (panelCanceledOrders) panelCanceledOrders.textContent = stats.canceledOrders;
        }
    } catch (err) {
        console.error("Error fetching user details:", err);
        if (panelAddress) panelAddress.value = "Error loading";
    }
}

async function handleBlockUser() {
    if (!selectedUser) return;

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;

    const actionText = selectedUser.isBlocked ? 'unblock' : 'block';
    
    const result = await Swal.fire({
        title: 'Confirm Action',
        text: `Are you sure you want to ${actionText} this customer?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e3a8a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, ${actionText}!`
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser._id}/block`, {
            method: 'PUT',
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok) {
            // Re-fetch users to update table and state
            fetchUsers();
        } else {
            Swal.fire({ text: data.message || `Failed to ${actionText} user`, icon: 'info' });
        }
    } catch (error) {
        console.error(`Error ${actionText}ing user:`, error);
        Swal.fire({ text: `An error occurred while trying to ${actionText} the user.`, icon: 'info' });
    }
}

async function deleteUser(userId) {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;

    const result = await Swal.fire({
        title: 'Delete Customer?',
        text: "Are you sure you want to permanently delete this customer? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok) {
            // Re-fetch users
            if (selectedUser && selectedUser._id === userId) {
                selectedUser = null; // Clear selection if deleted
            }
            fetchUsers();
        } else {
            Swal.fire({ text: data.message || "Failed to delete user", icon: 'info' });
        }
    } catch (error) {
        console.error(`Error deleting user:`, error);
        Swal.fire({ text: `An error occurred while trying to delete the user.`, icon: 'info' });
    }
}

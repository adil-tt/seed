// Sidebar Toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebar = document.querySelector('.sidebar');

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.add('active');
    });
}

if (sidebarClose) {
    sidebarClose.addEventListener('click', function () {
        sidebar.classList.remove('active');
    });
}

document.addEventListener('click', function (event) {
    if (window.innerWidth < 992) {
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    }
});


let salesChart;

// Charts Initialization
document.addEventListener('DOMContentLoaded', function () {
    const ctxSales = document.getElementById('salesChart').getContext('2d');
    const gradientSales = ctxSales.createLinearGradient(0, 0, 0, 400);
    gradientSales.addColorStop(0, 'rgba(25, 135, 84, 0.4)');
    gradientSales.addColorStop(1, 'rgba(25, 135, 84, 0)');

    salesChart = new Chart(ctxSales, {
        type: 'line',
        data: {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                label: 'Sales ($)',
                data: [0, 0, 0, 0, 0, 0, 0], // Initial empty data
                borderColor: '#198754',
                backgroundColor: gradientSales,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#198754',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#212529',
                    bodyColor: '#212529',
                    borderColor: '#dee2e6',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value >= 1000 ? (value / 1000) + 'k' : value;
                        }
                    }
                }
            }
        }
    });

    fetchDashboardData();
});

function updateSalesChart(weeklySales) {
    if (salesChart && weeklySales) {
        salesChart.data.datasets[0].data = weeklySales;
        salesChart.update();
    }
}

async function fetchDashboardData() {
    try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            console.error("No valid token found. Admin may not be logged in.");
            window.location.href = "login.html";
            return;
        }

        const response = await fetch('/api/admin/dashboard', {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Populate metrics
            document.getElementById('total-sales').innerText = `$${data.metrics.totalSales.toLocaleString()}`;
            document.getElementById('metrics-revenue').innerText = `$${data.metrics.totalSales.toLocaleString()}`;

            // Format total orders (e.g., 10.7K if > 1000)
            let ordersDisplay = data.metrics.totalOrders;
            const rawOrders = ordersDisplay;
            if (ordersDisplay >= 1000) {
                ordersDisplay = (ordersDisplay / 1000).toFixed(1) + 'K';
            }
            document.getElementById('total-orders').innerText = ordersDisplay;
            document.getElementById('metrics-orders').innerText = rawOrders;

            document.getElementById('total-pending').innerText = data.metrics.pending;
            document.getElementById('metrics-pending').innerText = data.metrics.pending;
            
            document.getElementById('total-canceled').innerText = data.metrics.canceled;
            document.getElementById('metrics-canceled').innerText = data.metrics.canceled;

            const avgValue = rawOrders > 0 ? (data.metrics.totalSales / rawOrders) : 0;
            document.getElementById('metrics-avg-value').innerText = `$${avgValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`;

            // Populate transactions
            const tbody = document.getElementById('transactions-tbody');
            tbody.innerHTML = '';
            if (data.recentTransactions && data.recentTransactions.length > 0) {
                data.recentTransactions.forEach((order, index) => {
                    const dateObj = new Date(order.createdAt);
                    const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase();

                    let statusBadgeClass = 'bg-warning bg-opacity-10 text-warning';
                    let statusText = order.deliveryStatus;

                    if (statusText === 'Delivered') {
                        statusBadgeClass = 'bg-success bg-opacity-10 text-success';
                    } else if (statusText === 'Cancelled') {
                        statusBadgeClass = 'bg-danger bg-opacity-10 text-danger';
                    } else if (statusText === 'Shipped' || statusText === 'Out for Delivery') {
                        statusBadgeClass = 'bg-info bg-opacity-10 text-info';
                    }

                    const hexId = `#${order._id.substring(order._id.length - 6).toUpperCase()}`;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}.</td>
                        <td>${hexId}</td>
                        <td>${date} / ${time}</td>
                        <td><span class="badge ${statusBadgeClass} rounded-pill px-3">${statusText}</span></td>
                        <td class="text-end fw-bold">$${order.totalAmount.toLocaleString()}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No recent transactions</td></tr>';
            }

            // Populate top products
            const productsContainer = document.getElementById('top-products-container');
            productsContainer.innerHTML = '';
            if (data.topProducts && data.topProducts.length > 0) {
                data.topProducts.forEach((product) => {
                    let imageSrc = product.image ? `/${product.image.replace(/\\\\/g, '/')}` : 'images/default-product.png';
                    // To handle backend path with uploads correctly like order-management.js
                    imageSrc = product.image ? `http://localhost:5000/uploads/${product.image.split('\\\\').pop().split('/').pop()}` : 'images/default-product.png';

                    const div = document.createElement('div');
                    div.className = 'd-flex align-items-center mb-3 pb-3 border-bottom';
                    div.innerHTML = `
                        <img src="${imageSrc}" class="rounded me-3" width="50" height="50" style="object-fit: cover;" onerror="this.src='images/ceramic-cup.jpg'">
                        <div class="flex-grow-1">
                            <h6 class="mb-0 fw-bold">${product.name}</h6>
                            <small class="text-muted">ID: #${String(product._id).substring(product._id.length - 6).toUpperCase()} | Sold: ${product.totalSold}</small>
                        </div>
                        <div class="text-end">
                            <span class="fw-bold d-block">$${parseFloat(product.price).toLocaleString()}</span>
                        </div>
                    `;
                    productsContainer.appendChild(div);
                });

                // Remove border bottom from the last element for styling consistency
                if (productsContainer.lastElementChild) {
                    productsContainer.lastElementChild.classList.remove('border-bottom', 'mb-3', 'pb-3');
                }
            } else {
                productsContainer.innerHTML = '<div class="text-center py-4 text-muted">No top products found</div>';
            }

            // Update sales chart
            if (data.weeklySales) {
                updateSalesChart(data.weeklySales);
            }
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}


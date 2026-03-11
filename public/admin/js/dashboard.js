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


// Charts Initialization
document.addEventListener('DOMContentLoaded', function () {
    fetchDashboardData();

    // 1. Weekly Sales Chart (Line)
    const ctxSales = document.getElementById('salesChart').getContext('2d');

    // Create gradient
    const gradientSales = ctxSales.createLinearGradient(0, 0, 0, 400);
    gradientSales.addColorStop(0, 'rgba(25, 135, 84, 0.4)');   // Top: semi-transparent green
    gradientSales.addColorStop(1, 'rgba(25, 135, 84, 0)');     // Bottom: transparent

    new Chart(ctxSales, {
        type: 'line',
        data: {
            labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                label: 'Metric',
                // Curve data
                data: [15000, 32000, 20000, 48000, 30000, 40000, 38000],
                borderColor: '#198754',
                backgroundColor: gradientSales,
                borderWidth: 3,

                // Point Styles
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#198754',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#198754',

                fill: true,
                tension: 0.4 // Spline/Area chart effect
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#212529',
                    bodyColor: '#212529',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    borderColor: '#dee2e6',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function (context) {
                            return (context.parsed.y / 1000) + 'k';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 50000,
                    grid: {
                        borderDash: [], // Solid lines as per default/request (or default dashed)
                        color: '#f0f0f0',
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 5000, // 0k, 5k, 10k...
                        font: {
                            size: 12,
                            family: "'Outfit', sans-serif"
                        },
                        color: '#999',
                        padding: 10,
                        callback: function (value) {
                            return (value / 1000) + 'k';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: "'Outfit', sans-serif"
                        },
                        color: '#999',
                        padding: 10
                    }
                }
            },
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 20,
                    bottom: 0
                }
            }
        }
    });

});

async function fetchDashboardData() {
    try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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

            // Format total orders (e.g., 10.7K if > 1000)
            let ordersDisplay = data.metrics.totalOrders;
            if (ordersDisplay >= 1000) {
                ordersDisplay = (ordersDisplay / 1000).toFixed(1) + 'K';
            }
            document.getElementById('total-orders').innerText = ordersDisplay;

            document.getElementById('total-pending').innerText = data.metrics.pending;
            document.getElementById('total-canceled').innerText = data.metrics.canceled;

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
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}


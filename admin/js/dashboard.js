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

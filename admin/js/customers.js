
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {

    // Customer Overview Chart
    const ctx = document.getElementById('customerChart');

    if (ctx) {
        const ctx2d = ctx.getContext('2d');

        // Gradient Fill
        const gradient = ctx2d.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(25, 135, 84, 0.2)');
        gradient.addColorStop(1, 'rgba(25, 135, 84, 0)');

        new Chart(ctx2d, {
            type: 'line',
            data: {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    label: 'Active Customers',
                    data: [22000, 38000, 38000, 25000, 50000, 30000, 42000],
                    borderColor: '#198754', // Success Green
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#198754',
                    pointBorderWidth: 2,
                    pointRadius: 0, // Hidden by default
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#198754',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y / 1000 + 'k Active Customers';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 60000,
                        grid: {
                            borderDash: [5, 5],
                            color: '#f0f0f0',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 10000,
                            callback: function (value) {
                                return value / 1000 + 'k'; // 10k, 20k...
                            },
                            color: '#adb5bd',
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#adb5bd',
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
});

let customerChart;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('customerChart');
    if (ctx) {
        const ctx2d = ctx.getContext('2d');
        const gradient = ctx2d.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(25, 135, 84, 0.2)');
        gradient.addColorStop(1, 'rgba(25, 135, 84, 0)');

        customerChart = new Chart(ctx2d, {
            type: 'line',
            data: {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    label: 'Registrations',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#198754',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#198754',
                    pointBorderWidth: 2,
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
                        backgroundColor: '#198754',
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + ' New Customers';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        });
    }
});

window.updateCustomerChart = function(data) {
    if (customerChart && data) {
        customerChart.data.datasets[0].data = data;
        customerChart.update();
    }
};


document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            const user = data.user;
            
            // Render Balance
            const balanceEl = document.getElementById("walletBalanceDisplay");
            if (balanceEl) {
                balanceEl.innerHTML = `$${(user.walletBalance || 0).toFixed(2)}`;
            }

            // Render Transactions
            const tbody = document.getElementById("transactionsTbody");
            if (tbody) {
                const transactions = user.walletTransactions || [];
                
                if (transactions.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No transactions found.</td></tr>`;
                    return;
                }

                // Sort transactions by date descending
                transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                const html = transactions.map(tx => {
                    const dateObj = new Date(tx.date);
                    const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    
                    const isCredit = tx.type === 'credit';
                    const amountClass = isCredit ? 'text-success' : '';
                    const amountPrefix = isCredit ? '+' : '-';
                    const iconClass = isCredit ? 'bi-arrow-down-left-circle text-success' : 'bi-arrow-up-right-circle text-danger';
                    const refId = tx._id ? tx._id.toString().substring(18).toUpperCase() : Math.floor(Math.random() * 10000);

                    return `
                        <tr>
                            <td class="py-3 ps-4">
                                <div class="d-flex flex-column">
                                    <span class="fw-medium">${dateStr}</span>
                                    <small class="text-muted" style="font-size: 0.8rem;">${timeStr}</small>
                                </div>
                            </td>
                            <td class="py-3">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="bi ${iconClass} fs-5"></i>
                                    <span>${tx.description || (isCredit ? 'Refund / Add Fund' : 'Payment')}</span>
                                </div>
                            </td>
                            <td class="py-3 text-muted">#TXN${refId}</td>
                            <td class="py-3">
                                <span class="badge ${isCredit ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary'} border-0 px-2 py-1 rounded-pill">Completed</span>
                            </td>
                            <td class="py-3 text-end pe-4 fw-bold ${amountClass}">
                                ${amountPrefix}$${tx.amount.toFixed(2)}
                            </td>
                        </tr>
                    `;
                }).join('');

                tbody.innerHTML = html;
            }

        } else {
            console.error("Failed to fetch profile");
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error("Error fetching wallet data:", error);
        const balanceEl = document.getElementById("walletBalanceDisplay");
        if(balanceEl) balanceEl.innerText = "Error";
        
        const tbody = document.getElementById("transactionsTbody");
        if(tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load transactions.</td></tr>`;
    }
});

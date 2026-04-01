document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // --- REFRESH WALLET & PROFILE DATA ---
    async function loadWalletData() {
        try {
            const res = await fetch("/api/auth/profile", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                const user = data.user;

                // 1. Sidebar Profile
                const nameSidebar = document.getElementById("sidebar-user-name");
                const emailSidebar = document.getElementById("sidebar-user-email");
                if (nameSidebar) nameSidebar.innerText = user.name;
                if (emailSidebar) emailSidebar.innerText = user.email;

                // 2. Render Balance
                const balanceEl = document.getElementById("walletBalanceDisplay");
                if (balanceEl) {
                    balanceEl.innerHTML = `₹${(user.walletBalance || 0).toFixed(2)}`;
                }

                // 3. Render Transactions
                const tbody = document.getElementById("transactionsTbody");
                if (tbody) {
                    const transactions = user.walletTransactions || [];
                    if (transactions.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No transactions found.</td></tr>`;
                    } else {
                        // Sort descending by date
                        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                        tbody.innerHTML = transactions.map(tx => {
                            const dateObj = new Date(tx.date);
                            const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                            const isCredit = tx.type === 'credit';
                            const amountClass = isCredit ? 'text-success' : '';
                            const amountPrefix = isCredit ? '+' : '-';
                            const iconClass = isCredit ? 'bi-arrow-down-left-circle text-success' : 'bi-arrow-up-right-circle text-danger';
                            const refId = tx._id ? tx._id.toString().substring(18).toUpperCase() : 'N/A';

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
                                            <span>${tx.description || (isCredit ? 'Fund Added' : 'Payment')}</span>
                                        </div>
                                    </td>
                                    <td class="py-3 text-muted">#TXN${refId}</td>
                                    <td class="py-3">
                                        <span class="badge ${isCredit ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary'} border-0 px-2 py-1 rounded-pill">Completed</span>
                                    </td>
                                    <td class="py-3 text-end pe-4 fw-bold ${amountClass}">
                                        ${amountPrefix}₹${tx.amount.toFixed(2)}
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    }
                }
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error("Error loading wallet data:", error);
        }
    }

    function handleLogout() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "login.html";
    }

    // --- ADD FUND LOGIC ---
    const addFundBtn = document.getElementById("addFundBtn");
    if (addFundBtn) {
        addFundBtn.addEventListener("click", async () => {
            const { value: amount } = await Swal.fire({
                title: 'Add Funds to Wallet',
                input: 'number',
                inputLabel: 'Amount (in ₹)',
                inputPlaceholder: 'Enter amount...',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value || value <= 0) {
                        return 'Please enter a valid amount (greater than 0)!';
                    }
                },
                confirmButtonColor: '#1a2a44',
                cancelButtonColor: '#d33'
            });

            if (amount) {
                try {
                    Swal.fire({
                        title: 'Processing...',
                        text: 'Preparing secure payment gateway',
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                    });

                    // 1. Create Order
                    const orderRes = await fetch("/api/payment/wallet/create-order", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ amount: parseFloat(amount) })
                    });

                    if (!orderRes.ok) throw new Error("Failed to create payment order");

                    const orderData = await orderRes.json();
                    Swal.close();

                    const options = {
                        key: orderData.key,
                        amount: orderData.order.amount,
                        currency: "INR",
                        name: "Ceramico",
                        description: "Wallet Fund Addition",
                        order_id: orderData.order.id,
                        handler: async function (response) {
                            Swal.fire({
                                title: 'Verifying...',
                                text: 'Updating your balance',
                                allowOutsideClick: false,
                                didOpen: () => { Swal.showLoading(); }
                            });

                            // 2. Verify Payment
                            const verifyRes = await fetch("/api/payment/wallet/verify", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    amount: amount
                                })
                            });

                            if (verifyRes.ok) {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Added Successfully!',
                                    text: `₹${amount} has been added to your wallet.`,
                                    confirmButtonColor: '#1a2a44'
                                }).then(() => {
                                    loadWalletData(); // Refresh UI
                                });
                            } else {
                                Swal.fire('Error', 'Payment verification failed. Please contact support.', 'error');
                            }
                        },
                        modal: {
                            ondismiss: function() {
                                console.log('Payment window closed');
                            }
                        },
                        prefill: {
                            name: document.getElementById("sidebar-user-name")?.innerText || "",
                            email: document.getElementById("sidebar-user-email")?.innerText || ""
                        },
                        theme: { color: "#1a2a44" }
                    };

                    const rzp = new Razorpay(options);
                    rzp.open();

                } catch (err) {
                    console.error("Fund addition error:", err);
                    Swal.fire('Error', 'Unable to initiate payment. Try again later.', 'error');
                }
            }
        });
    }

    // Initial Load
    loadWalletData();

    // Logout Handler
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});

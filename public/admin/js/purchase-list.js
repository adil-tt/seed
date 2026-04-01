/*
* Purchase List Page Logic
*/

document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.getElementById('purchaseHistoryTable');
    let purchases = [];
    let suppliers = [];

    async function loadSuppliers() {
        try {
            const res = await fetch('/api/suppliers');
            suppliers = await res.json();
        } catch (error) {
            console.error("Load suppliers error:", error);
        }
    }

    async function loadPurchases() {
        try {
            const res = await fetch('/api/purchases');
            purchases = await res.json();

            renderPurchases();
        } catch (error) {
            console.error("Load error:", error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load purchase history</td></tr>';
        }
    }

    function renderPurchases() {
        tableBody.innerHTML = purchases.map(p => `
            <tr>
                <td>#PUR-${p._id.substring(0, 6).toUpperCase()}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-light d-flex align-items-center justify-content-center me-2" 
                             style="width:35px; height:35px; font-weight:bold; color:#0d6efd;">
                            ${p.supplier ? p.supplier.supplier_name.charAt(0) : 'S'}
                        </div>
                        <span>${p.supplier ? p.supplier.supplier_name : 'Unknown Supplier'}</span>
                    </div>
                </td>
                <td>${p.invoiceNumber || 'N/A'}</td>
                <td>${new Date(p.purchaseDate || p.createdAt).toLocaleDateString()}</td>
                <td class="fw-bold">$${p.totalAmount.toFixed(2)}</td>
                <td><span class="badge bg-success bg-opacity-10 text-success">Completed</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-white border view-btn" data-id="${p._id}" title="View"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-white border edit-btn" data-id="${p._id}" title="Edit"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `).join('');

        // Attach listeners
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => viewPurchase(btn.dataset.id));
        });
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editPurchase(btn.dataset.id));
        });
    }

    async function viewPurchase(id) {
        const p = purchases.find(item => item._id === id);
        if (!p) return;

        let itemsHtml = p.items.map(item => `
            <tr>
                <td>${item.product ? item.product.name : 'Unknown'}</td>
                <td>${item.batchNo}</td>
                <td>${item.quantity}</td>
                <td>$${item.purchasePrice.toFixed(2)}</td>
                <td>$${(item.quantity * item.purchasePrice).toFixed(2)}</td>
            </tr>
        `).join('');

        Swal.fire({
            title: `Purchase Details (#${id.substring(0, 8).toUpperCase()})`,
            html: `
                <div class="text-start">
                    <p><strong>Supplier:</strong> ${p.supplier ? p.supplier.supplier_name : 'N/A'}</p>
                    <p><strong>Invoice No:</strong> ${p.invoiceNumber || 'N/A'}</p>
                    <p><strong>Date:</strong> ${new Date(p.purchaseDate).toLocaleDateString()}</p>
                    <table class="table table-sm mt-3">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Batch</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <div class="text-end mt-2">
                        <h5 class="fw-bold">Total: $${p.totalAmount.toFixed(2)}</h5>
                    </div>
                </div>
            `,
            width: '600px',
            confirmButtonText: 'Close',
            confirmButtonColor: '#0d6efd'
        });
    }

    async function editPurchase(id) {
        const p = purchases.find(item => item._id === id);
        if (!p) return;

        if (suppliers.length === 0) await loadSuppliers();

        const supplierOptions = suppliers.map(s => 
            `<option value="${s._id}" ${p.supplier && p.supplier._id === s._id ? 'selected' : ''}>${s.supplier_name}</option>`
        ).join('');

        const { value: formValues } = await Swal.fire({
            title: 'Edit Purchase Details',
            html: `
                <div class="text-start">
                    <div class="mb-3">
                        <label class="form-label">Supplier</label>
                        <select id="swal-supplier" class="form-select">${supplierOptions}</select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Invoice Number</label>
                        <input id="swal-invoice" class="form-control" value="${p.invoiceNumber || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Purchase Date</label>
                        <input id="swal-date" type="date" class="form-control" value="${p.purchaseDate ? p.purchaseDate.split('T')[0] : ''}">
                    </div>
                    <div class="alert alert-info py-2" style="font-size: 0.85rem;">
                        <i class="bi bi-info-circle me-1"></i> Item quantities and prices cannot be edited directly to preserve inventory integrity.
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Update',
            confirmButtonColor: '#0d6efd',
            preConfirm: () => {
                return {
                    supplier: document.getElementById('swal-supplier').value,
                    invoiceNumber: document.getElementById('swal-invoice').value,
                    purchaseDate: document.getElementById('swal-date').value
                };
            }
        });

        if (formValues) {
            try {
                const res = await fetch(`/api/purchases/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formValues)
                });

                if (res.ok) {
                    Swal.fire('Updated!', 'Purchase details have been updated.', 'success');
                    loadPurchases();
                } else {
                    const err = await res.json();
                    Swal.fire('Error', err.message || 'Update failed', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Network error occurred', 'error');
            }
        }
    }

    loadPurchases();
});

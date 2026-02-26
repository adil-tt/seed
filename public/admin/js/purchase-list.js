/*
* Purchase List Page Logic
*/

document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.getElementById('purchaseHistoryTable');

    async function loadPurchases() {
        try {
            const res = await fetch('http://localhost:5000/api/purchases');
            const purchases = await res.json();

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
                        <button class="btn btn-sm btn-white border" title="View"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-sm btn-white border" title="Edit"><i class="bi bi-pencil"></i></button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error("Load error:", error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load purchase history</td></tr>';
        }
    }

    loadPurchases();
});

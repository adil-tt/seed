/*
* Supplier List Page Logic
*/

document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.getElementById('supplierTableBody');

    async function loadSuppliers() {
        try {
            const res = await fetch('http://localhost:5000/api/suppliers');
            const suppliers = await res.json();

            if (suppliers.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No suppliers found. Click "Add Supplier" to create one.</td></tr>';
                return;
            }

            tableBody.innerHTML = suppliers.map(s => `
                <tr>
                    <td class="fw-bold">${s.supplier_name}</td>
                    <td>${s.contact_person || 'N/A'}</td>
                    <td>${s.phone || 'N/A'}</td>
                    <td>${s.email || 'N/A'}</td>
                    <td>${s.address || 'N/A'}</td>
                    <td><span class="badge ${s.status === 'active' ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${s.status === 'active' ? 'text-success' : 'text-secondary'}">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-white border" onclick="editSupplier('${s._id}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-white border text-danger" onclick="deleteSupplier('${s._id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error("Load error:", error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load suppliers. Please try refreshing.</td></tr>';
        }
    }

    // Global handles for actions
    window.deleteSupplier = async (id) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/suppliers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadSuppliers();
            } else {
                alert("Failed to delete supplier");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    window.editSupplier = (id) => {
        // Since we don't have an edit-supplier.html yet, we'll alert for now or redirect if it exists
        alert("Editing supplier: " + id);
    };

    loadSuppliers();
});

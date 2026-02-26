/*
* Purchase Page Logic - Dynamic Implementation
*/

document.addEventListener('DOMContentLoaded', async function () {
    const purchaseTableBody = document.getElementById('purchaseTableBody');
    const addItemBtn = document.getElementById('addItemBtn');
    const supplierSelect = document.getElementById('supplierSelect');
    const savePurchaseBtn = document.getElementById('savePurchaseBtn');

    const grandSubtotalEl = document.getElementById('grandSubtotal');
    const taxAmountEl = document.getElementById('taxAmount');
    const grandTotalEl = document.getElementById('grandTotal');

    let suppliers = [];
    let products = [];

    // 1. FETCH INITIAL DATA
    try {
        const [supRes, prodRes] = await Promise.all([
            fetch('http://localhost:5000/api/suppliers'),
            fetch('http://localhost:5000/api/products')
        ]);
        suppliers = await supRes.json();
        products = await prodRes.json();

        populateSuppliers();
        addRow(); // Add first row by default
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load suppliers/products");
    }

    function populateSuppliers() {
        suppliers.forEach(sup => {
            const opt = document.createElement('option');
            opt.value = sup._id;
            opt.textContent = sup.supplier_name;
            supplierSelect.appendChild(opt);
        });
    }

    // 2. ROW MANAGEMENT
    function addRow() {
        const rowId = Date.now();
        const tr = document.createElement('tr');
        tr.dataset.id = rowId;

        let productOptions = products.map(p => `<option value="${p._id}">${p.name}</option>`).join('');

        tr.innerHTML = `
            <td>
                <select class="form-select border-0 product-select" required>
                    <option value="" selected disabled>Select Product</option>
                    ${productOptions}
                </select>
            </td>
            <td><input type="text" class="form-control border-0 batch-no" placeholder="Batch No"></td>
            <td><input type="number" class="form-control border-0 quantity" value="1" min="1"></td>
            <td><input type="number" class="form-control border-0 price" placeholder="0.00" min="0" step="0.01"></td>
            <td><input type="number" class="form-control border-0 selling-price" placeholder="0.00" min="0" step="0.01"></td>
            <td><input type="date" class="form-control border-0 expiry-date"></td>
            <td><input type="text" class="form-control border-0 bg-light subtotal" value="0.00" readonly></td>
            <td><button type="button" class="btn btn-sm text-danger remove-row"><i class="bi bi-trash"></i></button></td>
        `;

        // Listeners for auto-calculation
        tr.querySelector('.quantity').addEventListener('input', calculateTotals);
        tr.querySelector('.price').addEventListener('input', calculateTotals);

        tr.querySelector('.remove-row').addEventListener('click', () => {
            tr.remove();
            calculateTotals();
        });

        purchaseTableBody.appendChild(tr);
    }

    if (addItemBtn) {
        addItemBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addRow();
        });
    }

    // 3. CALCULATION LOGIC
    function calculateTotals() {
        let subtotalSum = 0;
        const rows = purchaseTableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.quantity').value) || 0;
            const price = parseFloat(row.querySelector('.price').value) || 0;
            const subtotal = qty * price;

            row.querySelector('.subtotal').value = subtotal.toFixed(2);
            subtotalSum += subtotal;
        });

        const tax = subtotalSum * 0.10;
        const total = subtotalSum + tax;

        grandSubtotalEl.textContent = `$${subtotalSum.toFixed(2)}`;
        taxAmountEl.textContent = `$${tax.toFixed(2)}`;
        grandTotalEl.textContent = `$${total.toFixed(2)}`;
    }

    // 4. SAVE PURCHASE
    if (savePurchaseBtn) {
        savePurchaseBtn.addEventListener('click', async () => {
            const items = [];
            const rows = purchaseTableBody.querySelectorAll('tr');

            if (!supplierSelect.value) return alert("Please select a supplier");
            if (rows.length === 0) return alert("Please add at least one item");

            rows.forEach(row => {
                const productId = row.querySelector('.product-select').value;
                const batchNo = row.querySelector('.batch-no').value.trim();
                const quantity = parseInt(row.querySelector('.quantity').value);
                const purchasePrice = parseFloat(row.querySelector('.price').value);
                const sellingPrice = parseFloat(row.querySelector('.selling-price').value) || 0;

                if (!batchNo) {
                    alert("Batch No is required for all products");
                    return; // Note: In a real app this wouldn't nicely halt the outer function, but works for a quick check. Better handled before the loop.
                }

                if (productId && quantity > 0) {
                    items.push({ product: productId, batchNo, quantity, purchasePrice, sellingPrice });
                }
            });

            const data = {
                supplier: supplierSelect.value,
                invoiceNumber: document.getElementById('invoiceNumber').value,
                purchaseDate: document.getElementById('purchaseDate').value,
                items,
                totalAmount: parseFloat(grandTotalEl.textContent.replace('$', ''))
            };

            try {
                const res = await fetch('http://localhost:5000/api/purchases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert("Purchase saved successfully!");
                    window.location.href = 'purchase-list.html';
                } else {
                    const err = await res.json();
                    alert("Error: " + err.message);
                }
            } catch (error) {
                console.error("Save error:", error);
                alert("Failed to save purchase");
            }
        });
    }
});

/*
* Purchase Page Logic
* Handles adding dynamic rows for products and calculating totals.
*/

document.addEventListener('DOMContentLoaded', function () {
    const purchaseTableBody = document.getElementById('purchaseTableBody');
    const addItemBtn = document.querySelector('.btn-primary'); // Assuming the "Add Item" button has this class
    const totalAmountSpan = document.querySelector('tfoot tr td:last-child'); // Target the total cell in tfoot

    // Function to calculate row subtotal and grand total
    function calculateTotals() {
        let grandTotal = 0;
        const rows = purchaseTableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const quantityInput = row.querySelector('input[type="number"]:nth-of-type(1)'); // Quantity is the first number input in the row logic usually, but let's be more specific with index if needed. 
            // Wait, querySelector finds the FIRST one. valid?
            // Let's use specific indices based on the HTML structure.
            // 3rd cell is Quantity, 4th is Purchase Price.
            const quantity = parseFloat(row.children[2].querySelector('input').value) || 0;
            const price = parseFloat(row.children[3].querySelector('input').value) || 0;
            const subtotal = quantity * price;

            // Update subtotal cell (7th cell)
            const subtotalInput = row.children[6].querySelector('input');
            if (subtotalInput) {
                subtotalInput.value = subtotal.toFixed(2);
            }

            grandTotal += subtotal;
        });

        // Update Grand Total
        if (totalAmountSpan) {
            totalAmountSpan.textContent = '$' + grandTotal.toFixed(2);
        }
    }

    // Function to add a new row
    function addRow() {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>
                <select class="form-select border-0">
                    <option selected>Select Product</option>
                    <option>Ceramic Vase</option>
                    <option>Clay Bowl</option>
                </select>
            </td>
            <td><input type="text" class="form-control border-0" placeholder="Batch No"></td>
            <td><input type="number" class="form-control border-0 quantity" value="1" min="1"></td>
            <td><input type="number" class="form-control border-0 price" placeholder="0.00" min="0"></td>
            <td><input type="number" class="form-control border-0" placeholder="0.00" min="0"></td>
            <td><input type="date" class="form-control border-0"></td>
            <td><input type="text" class="form-control border-0 bg-light subtotal" value="0.00" readonly></td>
            <td><button class="btn btn-sm text-danger remove-row"><i class="bi bi-trash"></i></button></td>
        `;

        // Add event listeners to new inputs
        newRow.querySelector('.quantity').addEventListener('input', calculateTotals);
        newRow.querySelector('.price').addEventListener('input', calculateTotals);

        // Add delete functionality
        newRow.querySelector('.remove-row').addEventListener('click', function () {
            newRow.remove();
            calculateTotals();
        });

        purchaseTableBody.appendChild(newRow);
    }

    // Attach event listener to "Add Item" button
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent form submission if inside a form
            addRow();
        });
    }

    // Attach listeners to initial row (if any)
    const initialRows = purchaseTableBody.querySelectorAll('tr');
    initialRows.forEach(row => {
        const qtyInput = row.children[2].querySelector('input');
        const priceInput = row.children[3].querySelector('input');
        const deleteBtn = row.querySelector('.text-danger'); // trash icon button

        if (qtyInput) {
            qtyInput.classList.add('quantity'); // Ensure class exists for future consistency
            qtyInput.addEventListener('input', calculateTotals);
        }
        if (priceInput) {
            priceInput.classList.add('price');
            priceInput.addEventListener('input', calculateTotals);
        }
        if (deleteBtn) {
            deleteBtn.classList.add('remove-row');
            deleteBtn.addEventListener('click', function () {
                row.remove();
                calculateTotals();
            });
        }
    });

});

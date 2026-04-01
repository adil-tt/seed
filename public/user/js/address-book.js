document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const addressContainer = document.getElementById("addressContainer");
    if (!addressContainer) return;

    // Fetch addresses
    try {
        const response = await fetch("/api/address/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const addresses = data.addresses || [];

            if (addresses.length === 0) {
                addressContainer.innerHTML = `
                    <div class="col-12 text-center p-5 bg-light rounded text-muted">
                        You have not saved any addresses yet.
                    </div>
                `;
                return;
            }

            let html = "";
            addresses.forEach((addr) => {
                const isDefaultHtml = addr.isDefault
                    ? `<span class="badge bg-dark float-end">Default</span>`
                    : "";

                const actionHtml = addr.isDefault
                    ? `
                        <div class="address-actions text-end w-100 mt-3 border-top pt-3">
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteAddress('${addr._id}')"><i class="bi bi-trash"></i></button>
                        </div>
                    `
                    : `
                        <div class="address-actions d-flex justify-content-between align-items-center w-100 mt-3 border-top pt-3">
                            <button class="btn btn-sm btn-outline-secondary flex-grow-1 me-2" onclick="setDefaultAddress('${addr._id}')">Set as Default</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteAddress('${addr._id}')"><i class="bi bi-trash"></i></button>
                        </div>
                    `;

                html += `
                    <div class="col-md-6 mb-4">
                        <div class="address-card h-100 p-4 border rounded shadow-sm bg-white d-flex flex-column">
                            <div>
                                ${isDefaultHtml}
                                <h5 class="mt-2 text-dark fw-bold">${addr.fullName}</h5>
                                <p class="text-muted mb-1">${addr.house}, ${addr.street}</p>
                                <p class="text-muted mb-1">${addr.landmark ? addr.landmark + '<br>' : ''}${addr.city}, ${addr.state} - ${addr.pincode}</p>
                                <p class="text-muted mb-3">Phone: ${addr.phone}</p>
                            </div>
                            <div class="mt-auto">
                                ${actionHtml}
                            </div>
                        </div>
                    </div>
                `;
            });

            addressContainer.innerHTML = html;
        } else {
            addressContainer.innerHTML = `<div class="col-12 text-danger">Failed to load addresses.</div>`;
        }
    } catch (err) {
        console.error("Error fetching addresses:", err);
        addressContainer.innerHTML = `<div class="col-12 text-danger">Error fetching addresses.</div>`;
    }
});

window.setDefaultAddress = async (id) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    try {
        const response = await fetch(`/api/address/${id}/default`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            Swal.fire({ text: "Default address updated!", icon: 'info' });
            window.location.reload();
        } else {
            const data = await response.json();
            Swal.fire({ text: data.message || "Failed to set default", icon: 'info' });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({ text: "Server error", icon: 'info' });
    }
};

window.deleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    try {
        const response = await fetch(`/api/address/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            Swal.fire({ text: "Address deleted!", icon: 'info' });
            window.location.reload();
        } else {
            const data = await response.json();
            Swal.fire({ text: data.message || "Failed to delete address", icon: 'info' });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({ text: "Server error", icon: 'info' });
    }
};

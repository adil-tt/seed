document.addEventListener("DOMContentLoaded", () => {
    fetchOffers();

    // Sidebar logic
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.add('active'));
    }
    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => sidebar.classList.remove('active'));
    }
});

async function fetchOffers() {
    try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) return window.location.href = "login.html";

        const res = await fetch("http://localhost:5000/api/admin/offers", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch offers");
        const data = await res.json();
        
        if (data.success) {
            renderOffersTable(data.offers);
        }
    } catch (error) {
        console.error(error);
        const tbody = document.querySelector("tbody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error fetching offers</td></tr>`;
    }
}

function renderOffersTable(offers) {
    const tbody = document.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (offers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No offers available.</td></tr>`;
        return;
    }

    offers.forEach(offer => {
        const discountText = offer.discountType === 'Percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue.toFixed(2)} OFF`;
        const appliesToText = offer.offerType === 'All' ? 'All Products' : `${offer.offerType}`; // In a real app, you'd fetch the name of the target
        const startDate = new Date(offer.startDate).toLocaleDateString();
        const endDate = new Date(offer.endDate).toLocaleDateString();
        
        const now = new Date();
        const start = new Date(offer.startDate);
        const end = new Date(offer.endDate);
        
        let statusBadge = '';
        if (!offer.isActive) {
            statusBadge = `<span class="badge bg-danger bg-opacity-10 text-danger">Inactive</span>`;
        } else if (now < start) {
            statusBadge = `<span class="badge bg-info bg-opacity-10 text-info">Scheduled</span>`;
        } else if (now > end) {
            statusBadge = `<span class="badge bg-secondary bg-opacity-10 text-secondary">Expired</span>`;
        } else {
            statusBadge = `<span class="badge bg-success bg-opacity-10 text-success">Active</span>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${offer.title}</td>
            <td><span class="fw-bold text-success">${discountText}</span></td>
            <td>${appliesToText}</td>
            <td>
                <small class="d-block text-muted">Start: ${startDate}</small>
                <small class="d-block text-muted">End: ${endDate}</small>
            </td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-action btn-light text-secondary" title="Edit" onclick="editOffer('${offer._id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-action btn-light text-danger" title="Delete" onclick="deleteOffer('${offer._id}')"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteOffer = async function(id) {
    const result = await Swal.fire({
        title: 'Delete this offer?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/admin/offers/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                Swal.fire('Deleted!', 'Offer has been successfully deleted.', 'success');
                fetchOffers();
            } else {
                Swal.fire({ text: data.message, icon: 'error' });
            }
        } catch (error) {
            Swal.fire({ text: 'Error deleting offer', icon: 'error' });
        }
    }
};

window.editOffer = function(id) {
    // Redirect to add-offer.html with ID for editing (future improvement)
    window.location.href = `add-offer.html?id=${id}`;
};

document.addEventListener("DOMContentLoaded", () => {
    fetchCoupons();

    const saveBtn = document.getElementById("btnSaveCoupon");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveCoupon);
    }

    // Modal reset on close
    const modalEl = document.getElementById("couponCampaignModal");
    if (modalEl) {
        modalEl.addEventListener("hidden.bs.modal", () => {
            document.getElementById("couponForm").reset();
            document.getElementById("couponId").value = "";
            document.getElementById("couponModalTitle").textContent = "Create New Campaign";
        });
    }
});

let couponsList = [];

async function fetchCoupons() {
    try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) return window.location.href = "login.html";

        const res = await fetch("http://localhost:5000/api/admin/coupons", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch coupons");
        const data = await res.json();
        
        if (data.success) {
            couponsList = data.coupons;
            renderCouponsTable(data.coupons);

            // Update stats cards
            if (data.stats) {
                const totalEl = document.getElementById("totalCouponCount");
                const activeEl = document.getElementById("activeCouponCount");
                const expiredEl = document.getElementById("expiredCouponCount");
                const usageEl = document.getElementById("totalUsageCount");

                if (totalEl) totalEl.textContent = data.stats.totalCoupons;
                if (activeEl) activeEl.textContent = data.stats.activeCoupons;
                if (expiredEl) expiredEl.textContent = data.stats.expiredCoupons;
                if (usageEl) usageEl.textContent = (data.stats.totalUsage || 0).toLocaleString();
            }
        }
    } catch (error) {
        console.error(error);
        const tbody = document.getElementById("couponTableBody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error fetching coupons</td></tr>`;
    }
}

function renderCouponsTable(coupons) {
    const tbody = document.getElementById("couponTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (coupons.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">No coupons available.</td></tr>`;
        return;
    }

    coupons.forEach(coupon => {
        const discountText = coupon.valueType === 'Percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`;
        const expiryDate = coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never';
        const limitText = coupon.totalLimit ? coupon.totalLimit : 'Unlimited';
        const statusBadge = coupon.status === 'Active' 
            ? `<span class="badge bg-success bg-opacity-10 text-success">Active</span>`
            : `<span class="badge bg-danger bg-opacity-10 text-danger">Inactive</span>`;

        // We map ValueType to "Discount Type" column, but the UI expects "Value" as well
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <span class="fw-bold d-block">${coupon.code}</span>
                <span class="small text-muted">${coupon.title || 'No Title'}</span>
            </td>
            <td>${coupon.valueType}</td>
            <td class="fw-bold">${discountText}</td>
            <td>${coupon.minPurchase ? '$' + coupon.minPurchase.toFixed(2) : '-'}</td>
            <td>${expiryDate}</td>
            <td>${limitText}</td>
            <td>${coupon.usedCount || 0}</td>
            <td>${statusBadge}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-white border" onclick="editCoupon('${coupon._id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-white border text-danger" onclick="deleteCoupon('${coupon._id}')"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function saveCoupon() {
    const couponId = document.getElementById("couponId").value;
    const isEditing = !!couponId;

    const payload = {
        title: document.getElementById("title").value.trim(),
        code: document.getElementById("code").value.trim().toUpperCase(),
        description: document.getElementById("description").value.trim(),
        applicableOn: document.getElementById("applicableOn").value,
        status: document.getElementById("status").value,
        visibleToUsers: document.getElementById("visibleToUsers").checked,
        valueType: document.getElementById("valueType").value,
        discountValue: parseFloat(document.getElementById("discountValue").value),
        minPurchase: parseFloat(document.getElementById("minPurchase").value) || 0,
        maxCap: parseFloat(document.getElementById("maxCap").value) || null,
        allowOnSaleProducts: document.getElementById("allowOnSaleProducts").checked,
        totalLimit: parseInt(document.getElementById("totalLimit").value) || null,
        perUserLimit: parseInt(document.getElementById("perUserLimit").value) || 1,
        startDate: document.getElementById("startDate").value || null,
        expiryDate: document.getElementById("expiryDate").value || null
    };

    if (!payload.title || !payload.code || isNaN(payload.discountValue)) {
        return Swal.fire({ text: 'Please fill in Title, Code, and Discount Value', icon: 'warning' });
    }

    try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        const url = isEditing ? `/api/admin/coupons/${couponId}` : "/api/admin/coupons";
        const method = isEditing ? "PUT" : "POST";
        
        const saveBtn = document.getElementById("btnSaveCoupon");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        saveBtn.disabled = false;
        saveBtn.textContent = "Confirm & Save";

        if (data.success) {
            Swal.fire({ text: data.message, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
            bootstrap.Modal.getInstance(document.getElementById("couponCampaignModal")).hide();
            fetchCoupons();
        } else {
            Swal.fire({ text: data.message, icon: 'error' });
        }
    } catch (error) {
        console.error(error);
        Swal.fire({ text: 'An error occurred while saving the coupon', icon: 'error' });
        const saveBtn = document.getElementById("btnSaveCoupon");
        saveBtn.disabled = false;
        saveBtn.textContent = "Confirm & Save";
    }
}

window.editCoupon = function(id) {
    const coupon = couponsList.find(c => c._id === id);
    if (!coupon) return;

    document.getElementById("couponModalTitle").textContent = "Edit Campaign";
    document.getElementById("couponId").value = coupon._id;
    document.getElementById("title").value = coupon.title || "";
    document.getElementById("code").value = coupon.code;
    document.getElementById("description").value = coupon.description || "";
    document.getElementById("applicableOn").value = coupon.applicableOn || "Everywhere";
    document.getElementById("status").value = coupon.status;
    document.getElementById("visibleToUsers").checked = coupon.visibleToUsers;
    document.getElementById("valueType").value = coupon.valueType;
    document.getElementById("discountValue").value = coupon.discountValue;
    document.getElementById("minPurchase").value = coupon.minPurchase || "";
    document.getElementById("maxCap").value = coupon.maxCap || "";
    document.getElementById("allowOnSaleProducts").checked = coupon.allowOnSaleProducts;
    document.getElementById("totalLimit").value = coupon.totalLimit || "";
    document.getElementById("perUserLimit").value = coupon.perUserLimit || 1;
    
    if (coupon.startDate) {
        document.getElementById("startDate").value = coupon.startDate.split('T')[0];
    } else {
        document.getElementById("startDate").value = "";
    }
    
    if (coupon.expiryDate) {
        document.getElementById("expiryDate").value = coupon.expiryDate.split('T')[0];
    } else {
        document.getElementById("expiryDate").value = "";
    }

    const modal = new bootstrap.Modal(document.getElementById("couponCampaignModal"));
    modal.show();
};

window.deleteCoupon = async function(id) {
    const result = await Swal.fire({
        title: 'Delete this coupon?',
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
            const res = await fetch(`/api/admin/coupons/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                Swal.fire('Deleted!', 'Coupon has been successfully deleted.', 'success');
                fetchCoupons();
            } else {
                Swal.fire({ text: data.message, icon: 'error' });
            }
        } catch (error) {
            Swal.fire({ text: 'Error deleting coupon', icon: 'error' });
        }
    }
};

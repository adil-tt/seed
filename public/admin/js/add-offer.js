document.addEventListener('DOMContentLoaded', async () => {
    const offerType = document.getElementById('offerType');
    const targetId = document.getElementById('targetId');
    const targetLabel = document.getElementById('targetLabel');
    const targetContainer = document.getElementById('targetContainer');
    const bannerInput = document.getElementById('bannerInput');
    const bannerDropzone = document.getElementById('bannerDropzone');
    const bannerPreview = document.getElementById('bannerPreview');
    const offerForm = document.getElementById('offerForm');
    const btnSave = document.getElementById('btnSaveOffer');
    const pageTitle = document.querySelector('.offer-header h5');

    // Get Offer ID from URL if editing
    const urlParams = new URLSearchParams(window.location.search);
    const offerId = urlParams.get('id');
    const isEditing = !!offerId;

    if (isEditing) {
        pageTitle.textContent = 'Edit Offer';
        btnSave.textContent = 'Update Offer';
    }

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

    // Initial load of targets
    await fetchTargets('Category');

    // If editing, fetch and populate offer data
    if (isEditing) {
        await loadOfferData(offerId);
    }

    offerType.addEventListener('change', async (e) => {
        const type = e.target.value;
        if (type === 'All') {
            targetContainer.style.display = 'none';
        } else {
            targetContainer.style.display = 'block';
            targetLabel.textContent = `Target ${type}`;
            await fetchTargets(type);
        }
    });

    bannerDropzone.addEventListener('click', () => bannerInput.click());

    bannerInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                bannerPreview.src = event.target.result;
                bannerPreview.style.display = 'block';
                bannerDropzone.querySelector('i').style.display = 'none';
                bannerDropzone.querySelector('p').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    async function fetchTargets(type) {
        targetId.innerHTML = '<option value="">Loading...</option>';
        try {
            const endpoint = type === 'Category' ? '/api/categories?limit=100' : '/api/products';
            const res = await fetch(endpoint);
            
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            
            const data = await res.json();
            targetId.innerHTML = `<option value="">Select ${type}</option>`;
            const items = type === 'Category' ? data.categories : data;
            
            if (items && Array.isArray(items)) {
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item._id;
                    option.textContent = item.name;
                    targetId.appendChild(option);
                });
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            targetId.innerHTML = `<option value="">Error loading ${type}</option>`;
        }
    }

    async function loadOfferData(id) {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`/api/admin/offers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (!data.success) throw new Error(data.message);
            
            const offer = data.offers.find(o => o._id === id);
            if (!offer) throw new Error("Offer not found");

            document.getElementById('offerTitle').value = offer.title;
            offerType.value = offer.offerType;
            
            if (offer.offerType === 'All') {
                targetContainer.style.display = 'none';
            } else {
                targetContainer.style.display = 'block';
                targetLabel.textContent = `Target ${offer.offerType}`;
                await fetchTargets(offer.offerType);
                targetId.value = offer.targetId;
            }

            document.getElementById('discountType').value = offer.discountType;
            document.getElementById('discountValue').value = offer.discountValue;
            
            if (offer.startDate) document.getElementById('startDate').value = offer.startDate.split('T')[0];
            if (offer.endDate) document.getElementById('endDate').value = offer.endDate.split('T')[0];
            
            document.getElementById('description').value = offer.description || '';
            document.getElementById('isActive').checked = offer.isActive;

            if (offer.bannerImage) {
                let bannerUrl = offer.bannerImage.startsWith("http") 
                    ? offer.bannerImage 
                    : `/${offer.bannerImage.replace(/\\/g, '/')}`;
                bannerUrl = bannerUrl.replace(/\/+/g, '/'); // Remove double slashes

                bannerPreview.src = bannerUrl;
                bannerPreview.style.display = 'block';
                bannerDropzone.querySelector('i').style.display = 'none';
                bannerDropzone.querySelector('p').style.display = 'none';
                // Store existing image path to use if not changed
                bannerDropzone.dataset.existingImage = offer.bannerImage;
            }
        } catch (error) {
            console.error("Error loading offer:", error);
            Swal.fire({ icon: 'error', title: 'Load Error', text: error.message });
        }
    }

    offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalText = btnSave.textContent;
        
        try {
            // 1. Upload Banner OR use existing
            let bannerImagePath = bannerDropzone.dataset.existingImage || '';
            if (bannerInput.files[0]) {
                btnSave.disabled = true;
                btnSave.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading...';
                
                const formData = new FormData();
                formData.append('images', bannerInput.files[0]);
                
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                const uploadData = await uploadRes.json();
                if (!uploadData.success && !uploadData.files) throw new Error('Image upload failed');
                bannerImagePath = uploadData.files[0].path;
            } else if (!isEditing && !bannerImagePath) {
                return Swal.fire({ icon: 'warning', text: 'Please upload a banner image' });
            }

            // 2. Save/Update Offer
            btnSave.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
            const payload = {
                title: document.getElementById('offerTitle').value,
                bannerImage: bannerImagePath,
                offerType: offerType.value,
                targetId: offerType.value === 'All' ? null : targetId.value,
                discountType: document.getElementById('discountType').value,
                discountValue: parseFloat(document.getElementById('discountValue').value),
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                description: document.getElementById('description').value,
                isActive: document.getElementById('isActive').checked
            };

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const url = isEditing ? `/api/admin/offers/${offerId}` : '/api/admin/offers';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', text: isEditing ? 'Offer updated successfully' : 'Offer created successfully', timer: 2000, showConfirmButton: false });
                setTimeout(() => window.location.href = 'sales-offers.html', 1500);
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', text: error.message });
            btnSave.disabled = false;
            btnSave.textContent = originalText;
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const offerType = document.getElementById('offerType');
    const targetId = document.getElementById('targetId');
    const targetLabel = document.getElementById('targetLabel');
    const targetContainer = document.getElementById('targetContainer');
    const bannerInput = document.getElementById('bannerInput');
    const bannerDropzone = document.getElementById('bannerDropzone');
    const bannerPreview = document.getElementById('bannerPreview');
    const offerForm = document.getElementById('offerForm');

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

    // Initial load
    fetchTargets('Category');

    offerType.addEventListener('change', (e) => {
        const type = e.target.value;
        if (type === 'All') {
            targetContainer.style.display = 'none';
        } else {
            targetContainer.style.display = 'block';
            targetLabel.textContent = `Target ${type}`;
            fetchTargets(type);
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
            
            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }
            
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
            } else {
                throw new Error('Invalid data format received');
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            targetId.innerHTML = `<option value="">Error loading ${type}</option>`;
            Swal.fire({
                icon: 'error',
                title: 'Data Load Error',
                text: `Failed to load ${type}s: ${error.message}`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    }

    offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSave = document.getElementById('btnSaveOffer');
        const originalText = btnSave.textContent;
        
        try {
            // 1. Upload Banner first if changed
            let bannerImagePath = '';
            if (bannerInput.files[0]) {
                btnSave.disabled = true;
                btnSave.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading...';
                
                const formData = new FormData();
                formData.append('images', bannerInput.files[0]);
                
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (!uploadData.success && !uploadData.files) throw new Error('Image upload failed');
                bannerImagePath = uploadData.files[0].path;
            } else {
                return Swal.fire({ icon: 'warning', text: 'Please upload a banner image', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }

            // 2. Create Offer
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
            const res = await fetch('/api/admin/offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', text: 'Offer created successfully', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
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

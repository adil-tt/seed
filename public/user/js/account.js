document.addEventListener('DOMContentLoaded', async () => {

    // --- ELEMENT REFERENCES ---
    const profileForm = document.getElementById('profileUpdateForm');
    const imageInput = document.getElementById('profileImageInput');
    const imagePreview = document.getElementById('profileImagePreview');

    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const phoneInput = document.getElementById('phoneInput');

    const alertBox = document.getElementById('profileAlert');
    const saveBtn = document.getElementById('profileSaveBtn');
    const spinner = document.getElementById('profileSpinner');

    // Make sure we are logged in
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- 1. LOAD USER DATA ---
    async function loadUserData() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch profile");

            const data = await response.json();
            const user = data.user;

            // Populate text inputs
            if (user.firstName) firstNameInput.value = user.firstName;
            if (user.lastName) lastNameInput.value = user.lastName;
            if (user.phone) phoneInput.value = user.phone;

            // Populate avatar if exists
            if (user.profileImage) {
                imagePreview.src = `/uploads/${user.profileImage}`;
            } else if (user.name || user.firstName) {
                // Initial fallback using ui-avatars
                const initial = user.firstName || user.name;
                imagePreview.src = `https://ui-avatars.com/api/?name=${initial}&background=random`;
            }

            // The sidebar is now handled dynamically by auth-sync.js
        } catch (error) {
            console.error("Error loading profile:", error);
            showAlert('danger', 'Error loading profile data.');
        }
    }

    await loadUserData();


    // --- 2. IMAGE PREVIEW WIDGET ---
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                // Validate size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    showAlert('danger', 'Image size exceeds 2MB limit.');
                    this.value = ''; // clear
                    return;
                }

                // Read and show preview instantly without uploading
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 3. HANDLE FORM SUBMISSION ---
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Reset alerts
            alertBox.classList.add('d-none');

            // Basic Frontend Validation
            if (!firstNameInput.value.trim() && !lastNameInput.value.trim() && !phoneInput.value.trim() && !imageInput.files[0]) {
                showAlert('warning', 'Please modify at least one field to save changes.');
                return;
            }

            // Lock UI
            saveBtn.disabled = true;
            spinner.classList.remove('d-none');

            try {
                // Construct FormData (required for files)
                const formData = new FormData();
                formData.append('firstName', firstNameInput.value.trim());
                formData.append('lastName', lastNameInput.value.trim());
                formData.append('phone', phoneInput.value.trim());

                if (imageInput.files[0]) {
                    formData.append('profileImage', imageInput.files[0]);
                }

                const updateResponse = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Note: DO NOT set 'Content-Type' manually when using FormData. The browser sets it to 'multipart/form-data' automatically with boundaries.
                    },
                    body: formData
                });

                const updatedData = await updateResponse.json();

                if (updateResponse.ok) {
                    showAlert('success', 'Profile updated successfully!');
                    // Optionally update localStorage user object if you store it there
                    localStorage.setItem('user', JSON.stringify({
                        id: updatedData.user._id,
                        name: updatedData.user.name,
                        email: updatedData.user.email,
                        role: updatedData.user.role
                    }));

                    // Reload data lightly
                    loadUserData();
                } else {
                    showAlert('danger', updatedData.message || 'Error updating profile.');
                }
            } catch (error) {
                console.error("Error updating profile:", error);
                showAlert('danger', 'Network error occurred while saving.');
            } finally {
                // Unlock UI
                saveBtn.disabled = false;
                spinner.classList.add('d-none');
            }
        });
    }

    // Helper to generic show alerts
    function showAlert(type, message) {
        alertBox.className = `alert alert-${type} mt-3`;
        alertBox.textContent = message;
        alertBox.classList.remove('d-none');

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => alertBox.classList.add('d-none'), 5000);
        }
    }
});

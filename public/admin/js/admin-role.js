/**
 * admin-role.js
 * Logic for the admin profile page
 */

document.addEventListener("DOMContentLoaded", () => {
    const firstNameInput = document.getElementById("firstNameInput");
    const lastNameInput = document.getElementById("lastNameInput");
    const phoneInput = document.getElementById("phoneInput");
    const emailInput = document.getElementById("emailInput");
    const adminAvatarThumb = document.getElementById("adminAvatarThumb");
    const adminAvatarThumbSidebar = document.getElementById("adminAvatarThumbSidebar");
    const largeAdminAvatar = document.getElementById("largeAdminAvatar");
    const profileNameDisplay = document.getElementById("profileNameDisplay");
    const profileEmailDisplay = document.getElementById("profileEmailDisplay");
    const avatarInput = document.getElementById("avatarInput");
    const saveProfileBtn = document.getElementById("saveProfileBtn");

    async function loadProfile() {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch("/api/auth/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.user) {
                const user = data.user;
                firstNameInput.value = user.firstName || "";
                lastNameInput.value = user.lastName || "";
                phoneInput.value = user.phone || "";
                emailInput.value = user.email || "";
                
                profileNameDisplay.textContent = user.firstName ? `${user.firstName} ${user.lastName}` : user.name;
                profileEmailDisplay.textContent = user.email;

                if (user.profileImage) {
                    let imgUrl = user.profileImage.startsWith("http") 
                        ? user.profileImage 
                        : `/${user.profileImage.replace(/\\/g, '/')}`;
                    
                    // Normalize: Ensure single leading slash and handle filename-only cases
                    imgUrl = imgUrl.replace(/\/+/g, '/');
                    if (!imgUrl.startsWith("http") && !imgUrl.startsWith("/uploads/")) {
                        imgUrl = `/uploads${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
                        imgUrl = imgUrl.replace(/\/+/g, '/');
                    }
                    
                    if (adminAvatarThumb) adminAvatarThumb.src = imgUrl;
                    if (adminAvatarThumbSidebar) adminAvatarThumbSidebar.src = imgUrl;
                    if (largeAdminAvatar) largeAdminAvatar.src = imgUrl;
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
    }

    saveProfileBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            Swal.fire("Error", "Session expired. Please login again.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("firstName", firstNameInput.value);
        formData.append("lastName", lastNameInput.value);
        formData.append("phone", phoneInput.value);
        formData.append("name", `${firstNameInput.value} ${lastNameInput.value}`);

        if (avatarInput.files[0]) {
            formData.append("profileImage", avatarInput.files[0]);
        }

        try {
            saveProfileBtn.disabled = true;
            saveProfileBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const result = await res.json();
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Profile updated successfully!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                
                // Update local storage if needed
                if (result.user) {
                    localStorage.setItem("user", JSON.stringify(result.user));
                }
                
                loadProfile();
                if (window.refreshAdminUI) window.refreshAdminUI();
            } else {
                Swal.fire("Error", result.message || "Update failed", "error");
            }
        } catch (error) {
            console.error("Update error:", error);
            Swal.fire("Error", "Network error. Failed to update profile.", "error");
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = "Save Profile";
        }
    });

    avatarInput.addEventListener("change", (e) => {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (largeAdminAvatar) largeAdminAvatar.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    loadProfile();
});

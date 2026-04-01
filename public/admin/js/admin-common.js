/**
 * admin-common.js
 * Updates sidebar and header with real admin data.
 */

document.addEventListener("DOMContentLoaded", () => {
    function updateAdminUI() {
        const adminDataStr = localStorage.getItem("adminData");
        if (!adminDataStr) return;

        try {
            const admin = JSON.parse(adminDataStr);
            
            // Sidebar Update
            const sidebarName = document.querySelector(".user-info h6");
            const sidebarEmail = document.querySelector(".user-info small");
            const sidebarAvatar = document.querySelector(".user-avatar");

            if (sidebarName) sidebarName.textContent = admin.name || (admin.firstName + " " + admin.lastName);
            if (sidebarEmail) sidebarEmail.textContent = admin.email;
            if (sidebarAvatar && admin.profileImage) {
                sidebarAvatar.src = admin.profileImage.startsWith("http") 
                    ? admin.profileImage 
                    : `${admin.profileImage}`;
            }

            // Header Dropdown Update
            const headerAvatar = document.querySelector(".admin-header .dropdown img");
            const headerName = document.querySelector(".admin-header .dropdown span");
            
            if (headerAvatar && admin.profileImage) {
                headerAvatar.src = admin.profileImage.startsWith("http") 
                    ? admin.profileImage 
                    : `${admin.profileImage}`;
            }
            if (headerName) {
                headerName.textContent = admin.firstName || "Admin";
            }

        } catch (e) {
            console.error("Error updating Admin UI:", e);
        }
    }

    updateAdminUI();

    // Export for use in profile page after updates
    window.refreshAdminUI = updateAdminUI;
});

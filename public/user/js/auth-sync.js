document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check for token in storage
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    // If not logged in, quietly exit (some pages have built-in redirects already)
    if (!token) return;

    try {
        // 2. Fetch the latest live profile data from MongoDB
        const response = await fetch("http://localhost:5000/api/auth/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user;

            // 3. Select standard Sidebar Elements present on all Account Pages
            const sidebarName = document.querySelector('.user-profile-summary h5');
            const sidebarEmail = document.querySelector('.user-profile-summary small');
            const avatarContainer = document.querySelector('.user-profile-summary .user-avatar');

            // 4. Update Name dynamically (Supporting both legacy 'name' and new 'firstName + lastName')
            if (sidebarName) {
                if (user.firstName || user.lastName) {
                    sidebarName.textContent = `${user.firstName || ""} ${user.lastName || ""}`.trim();
                } else {
                    sidebarName.textContent = user.name || "User";
                }
            }

            // 5. Update Email dynamically
            if (sidebarEmail && user.email) {
                sidebarEmail.textContent = user.email;
            }

            // 6. Update Profile Avatar dynamically
            if (avatarContainer) {
                if (user.profileImage) {
                    // Inject uploaded image
                    avatarContainer.innerHTML = `<img src="http://localhost:5000/uploads/${user.profileImage}" class="rounded-circle object-fit-cover shadow-sm border border-white border-2" style="width: 100%; height: 100%;" alt="Profile Avatar">`;
                    avatarContainer.style.background = 'transparent'; // Remove generic grey circle bg if it exists
                } else {
                    // Fallback letter avatar
                    const initialStr = user.firstName || user.name || "U";
                    avatarContainer.innerHTML = `<img src="https://ui-avatars.com/api/?name=${initialStr}&background=random&color=fff&size=80" class="rounded-circle shadow-sm" style="width: 100%; height: 100%;">`;
                    avatarContainer.style.background = 'transparent';
                }
            }

            // 7. Update Dashboard Welcome Banner specifically (only exists on account.html)
            const welcomeText = document.querySelector('.welcome-text h4');
            if (welcomeText) {
                const displayName = user.firstName || (user.name ? user.name.split(' ')[0] : 'User');
                welcomeText.textContent = `Welcome back, ${displayName}!`;
            }

        } else if (response.status === 401) {
            console.error("Token is invalid or expired. Silent logout.");
        }
    } catch (error) {
        console.error("Error communicating with profile sync API:", error);
    }
});

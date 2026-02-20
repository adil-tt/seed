document.addEventListener('DOMContentLoaded', () => {
    const wishlistButtons = document.querySelectorAll('.btn-wishlist');

    // Load wishlist from localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // Initialize buttons
    wishlistButtons.forEach(btn => {
        const productId = btn.getAttribute('data-id');
        if (wishlist.includes(productId)) {
            setButtonState(btn, true);
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleWishlist(productId, btn);
        });
    });

    function toggleWishlist(id, btn) {
        const index = wishlist.indexOf(id);
        let isAdded = false;

        if (index === -1) {
            wishlist.push(id);
            isAdded = true;
        } else {
            wishlist.splice(index, 1);
            isAdded = false;
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        setButtonState(btn, isAdded);

        // Update wishlist count in navbar if it exists
        updateWishlistCount();
    }

    function setButtonState(btn, isAdded) {
        const icon = btn.querySelector('i');
        if (isAdded) {
            btn.classList.add('active');
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
            icon.classList.add('text-danger'); // Optional: make it red
        } else {
            btn.classList.remove('active');
            icon.classList.remove('bi-heart-fill');
            icon.classList.remove('text-danger');
            icon.classList.add('bi-heart');
        }
    }

    function updateWishlistCount() {
        // Implementation for updating navbar count if user requests it later
        // const count = wishlist.length;
        // const countEl = document.querySelector('.wishlist-count');
        // if(countEl) countEl.innerText = count;
    }
});

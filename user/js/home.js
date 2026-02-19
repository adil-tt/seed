/* Home Page Specific JS */

console.log('Home page loaded');

// Example: Newsletter form submission handler
document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for subscribing!');
});

// Restricted Access Modal Handler
document.addEventListener('DOMContentLoaded', function () {
    const restrictedLinks = document.querySelectorAll('.restricted-link');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));

    restrictedLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            loginModal.show();
        });
    });
});

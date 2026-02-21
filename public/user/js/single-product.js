/* Single Product JS */

console.log('Single Product page loaded');

function changeImage(element) {
    const mainImg = document.getElementById('mainImage');
    mainImg.src = element.src;

    // Update active class
    document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
    element.classList.add('active');
}

function increaseQty() {
    const input = document.getElementById('quantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseQty() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

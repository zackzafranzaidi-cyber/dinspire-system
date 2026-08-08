// Memilih semua elemen senarai <li>
const list = document.querySelectorAll('.list');

function activeLink() {
    // Membuang kelas 'active' dari semua li
    list.forEach((item) => {
        item.classList.remove('active');
    });
    // Menambah kelas 'active' pada item yang diklik
    this.classList.add('active');
}

// Menambah event listener (Klik) pada setiap item
list.forEach((item) => {
    item.addEventListener('click', activeLink);
});
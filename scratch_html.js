const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

const oldBlock = `<div class="checkout-bar" id="checkout-bar">
        <div>
          <span class="checkout-label" data-i18n="bar-total">Jumlah Pembelian</span>
          <span id="checkout-total" class="checkout-price">RM 0.00</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center">
          <button
            type="button"
            class="cart-edit-icon-btn"
            onclick="openEditCartPopup()"
            title="Edit Barang Troli"
          >
            <i class="fas fa-shopping-bag"></i>
          </button>
          <button
            type="button"
            id="checkout-btn"
            class="buy-now-btn"
            style="margin: 0"
            data-i18n="bar-checkout"
          >
            Checkout
          </button>
        </div>
      </div>`;

const newBlock = `<div class="checkout-bar" id="checkout-bar">
        <div class="checkout-bar-header">
          <h2 style="font-size: 18px; font-weight: 800; color: #111827;">Your Cart</h2>
          <p style="font-size: 12px; color: #6b7280; margin-top: 2px;">Review your items</p>
        </div>
        <div class="checkout-bar-items custom-scrollbar" id="desktop-cart-items-container">
        </div>
        <div class="checkout-bar-total">
          <span class="checkout-label" data-i18n="bar-total">Jumlah Pembelian</span>
          <span id="checkout-total" class="checkout-price">RM 0.00</span>
        </div>
        <div class="checkout-bar-actions" style="display: flex; gap: 8px; align-items: center; width: 100%;">
          <button
            type="button"
            class="cart-edit-icon-btn mobile-only-btn"
            onclick="openEditCartPopup()"
            title="Edit Barang Troli"
          >
            <i class="fas fa-shopping-bag"></i>
          </button>
          <button
            type="button"
            id="checkout-btn"
            class="buy-now-btn"
            style="margin: 0; flex: 1;"
            data-i18n="bar-checkout"
          >
            Checkout
          </button>
        </div>
      </div>`;

// Use simple whitespace agnostic replace
const regex = /<div class="checkout-bar" id="checkout-bar">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;

if (html.match(regex)) {
    html = html.replace(regex, newBlock);
    fs.writeFileSync('public/customer/index.html', html);
    console.log("Replaced HTML block.");
} else {
    console.log("Could not find block.");
}

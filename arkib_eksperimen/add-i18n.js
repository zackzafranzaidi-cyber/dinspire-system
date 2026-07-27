const fs = require('fs');
let text = fs.readFileSync('public/js/i18n-index.js', 'utf8');
text = text.replace(/"notif-location": "Kemas Kini Tempahan Terkini",/, `"notif-location": "Kemas Kini Tempahan Terkini",
  "notif-tab-all": "Semua",
  "notif-tab-services": "Servis Tempahan",
  "notif-tab-products": "Pesanan Produk",`);

text = text.replace(/"notif-location": "Latest Booking Updates",/, `"notif-location": "Latest Booking Updates",
  "notif-tab-all": "All",
  "notif-tab-services": "Service Bookings",
  "notif-tab-products": "Product Orders",`);

fs.writeFileSync('public/js/i18n-index.js', text);
console.log("Updated i18n");

const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

html = html.replace('<div class="custom-modal-overlay" id="avatar-modal-overlay">', '<div class="custom-modal-overlay" id="avatar-modal-overlay" style="z-index: 400 !important;">');

fs.writeFileSync('public/customer/index.html', html);
console.log("Fixed avatar modal z-index.");

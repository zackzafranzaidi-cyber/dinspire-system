const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

html = html.replace('<div id="edit-profile-modal" class="modal-overlay">', '<div id="edit-profile-modal" class="custom-modal-overlay">');
html = html.replace('<div class="modal-content" style="max-width: 400px; padding: 20px;">', '<div class="custom-modal" style="max-width: 400px; padding: 20px;">');

fs.writeFileSync('public/customer/index.html', html);
console.log("Fixed modal class names.");

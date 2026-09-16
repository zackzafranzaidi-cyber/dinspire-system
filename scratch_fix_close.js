const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

html = html.replace('<button type="button" class="close-btn" onclick="closeModal(\'edit-profile-modal\')">&times;</button>', '<button type="button" style="background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer;" onclick="closeModal(\'edit-profile-modal\')">&times;</button>');

fs.writeFileSync('public/customer/index.html', html);
console.log("Fixed close-btn styling.");

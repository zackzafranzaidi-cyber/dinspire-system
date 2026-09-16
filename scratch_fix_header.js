const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

html = html.replace('<div class="modal-header">', '<div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%">');

fs.writeFileSync('public/customer/index.html', html);
console.log("Fixed modal-header inline styles.");

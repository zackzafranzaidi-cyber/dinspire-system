const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// Replace width: 100% with flex: 1; justify-content: flex-end;
html = html.replace(
  '<div class="checkout-bar-actions" style="display: flex; gap: 8px; align-items: center; width: 100%;">',
  '<div class="checkout-bar-actions" style="display: flex; gap: 8px; align-items: center; flex: 1; justify-content: flex-end;">'
);

fs.writeFileSync('public/customer/index.html', html);
console.log("Fixed checkout-bar-actions width in HTML.");

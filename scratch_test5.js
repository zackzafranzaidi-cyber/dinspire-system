const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const idx = js.indexOf('function switchView(id) {');
console.log(js.substring(idx, idx + 1000));

const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const idx = js.indexOf('function type() {');
console.log(js.substring(idx, idx + 800));

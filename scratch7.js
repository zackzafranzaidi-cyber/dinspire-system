const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');
code = code.replace(/Preparing"\);`n    let tableOrders/, 'Preparing");\n    let tableOrders');
fs.writeFileSync('public/js/owner.js', code);

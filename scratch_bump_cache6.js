const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

html = html.replace(/index\.css\?v=\d+/, "index.css?v=65");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=65");

fs.writeFileSync('public/customer/index.html', html);
console.log("Bumped cache versions.");

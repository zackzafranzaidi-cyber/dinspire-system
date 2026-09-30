const fs = require('fs');
let sw = fs.readFileSync('public/staff/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-staff-v\d+/, 'dinspire-pwa-staff-v10');
fs.writeFileSync('public/staff/sw.js', sw);

let html = fs.readFileSync('public/staff/index.html', 'utf8');
html = html.replace('staff.js?v=37', 'staff.js?v=38');
fs.writeFileSync('public/staff/index.html', html);
console.log("Bumped SW and HTML");

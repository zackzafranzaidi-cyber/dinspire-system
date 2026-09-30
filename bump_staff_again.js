const fs = require('fs');
let html = fs.readFileSync('public/staff/index.html', 'utf8');
html = html.replace('staff.js?v=38', 'staff.js?v=39');
fs.writeFileSync('public/staff/index.html', html);

let sw = fs.readFileSync('public/staff/sw.js', 'utf8');
sw = sw.replace('dinspire-pwa-staff-v10', 'dinspire-pwa-staff-v11');
fs.writeFileSync('public/staff/sw.js', sw);

console.log("Bumped to v11/39");

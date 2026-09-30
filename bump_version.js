const fs = require('fs');
let html = fs.readFileSync('public/staff/index.html', 'utf8');
html = html.replace('staff.js?v=36', 'staff.js?v=37');
fs.writeFileSync('public/staff/index.html', html);
let ownerHtml = fs.readFileSync('public/owner/index.html', 'utf8');
ownerHtml = ownerHtml.replace('owner.js?v=52', 'owner.js?v=53');
fs.writeFileSync('public/owner/index.html', ownerHtml);
console.log("Bumped version");

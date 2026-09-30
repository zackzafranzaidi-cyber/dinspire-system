const fs = require('fs');

let swStaff = fs.readFileSync('public/staff/sw.js', 'utf8');
swStaff = swStaff.replace("dinspire-pwa-staff-v16", "dinspire-pwa-staff-v17");
fs.writeFileSync('public/staff/sw.js', swStaff);

let swOwner = fs.readFileSync('public/owner/sw.js', 'utf8');
swOwner = swOwner.replace("dinspire-pwa-owner-v14", "dinspire-pwa-owner-v17");
fs.writeFileSync('public/owner/sw.js', swOwner);

console.log("Bumped SW version to v17");

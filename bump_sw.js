const fs = require('fs');

let swStaff = fs.readFileSync('public/staff/sw.js', 'utf8');
swStaff = swStaff.replace("dinspire-pwa-staff-v13", "dinspire-pwa-staff-v14");
fs.writeFileSync('public/staff/sw.js', swStaff);

let swOwner = fs.readFileSync('public/owner/sw.js', 'utf8');
swOwner = swOwner.replace("dinspire-pwa-owner-v13", "dinspire-pwa-owner-v14");
fs.writeFileSync('public/owner/sw.js', swOwner);
console.log("Bumped SW versions to v14");

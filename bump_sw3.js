const fs = require('fs');

let swStaff = fs.readFileSync('public/staff/sw.js', 'utf8');
swStaff = swStaff.replace("dinspire-pwa-staff-v15", "dinspire-pwa-staff-v16");
fs.writeFileSync('public/staff/sw.js', swStaff);

console.log("Bumped SW version to v16");

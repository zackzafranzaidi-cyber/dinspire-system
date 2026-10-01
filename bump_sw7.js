const fs = require('fs');
let swStaff = fs.readFileSync('public/staff/sw.js', 'utf8');
swStaff = swStaff.replace("dinspire-pwa-staff-v19", "dinspire-pwa-staff-v20");
fs.writeFileSync('public/staff/sw.js', swStaff);
console.log("Bumped SW to v20");

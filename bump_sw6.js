const fs = require('fs');
let swStaff = fs.readFileSync('public/staff/sw.js', 'utf8');
swStaff = swStaff.replace("dinspire-pwa-staff-v18", "dinspire-pwa-staff-v19");
fs.writeFileSync('public/staff/sw.js', swStaff);
console.log("Bumped SW to v19");

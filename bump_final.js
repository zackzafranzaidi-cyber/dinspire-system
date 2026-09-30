const fs = require('fs');

let staffhtml = fs.readFileSync('public/staff/index.html', 'utf8');
staffhtml = staffhtml.replace('staff.js?v=40', 'staff.js?v=41');
fs.writeFileSync('public/staff/index.html', staffhtml);

let ownerhtml = fs.readFileSync('public/owner/index.html', 'utf8');
ownerhtml = ownerhtml.replace('owner.js?v=54', 'owner.js?v=55');
fs.writeFileSync('public/owner/index.html', ownerhtml);

let staffsw = fs.readFileSync('public/staff/sw.js', 'utf8');
staffsw = staffsw.replace('dinspire-pwa-staff-v12', 'dinspire-pwa-staff-v13');
fs.writeFileSync('public/staff/sw.js', staffsw);

let ownersw = fs.readFileSync('public/owner/sw.js', 'utf8');
ownersw = ownersw.replace('dinspire-pwa-owner-v11', 'dinspire-pwa-owner-v12');
fs.writeFileSync('public/owner/sw.js', ownersw);

console.log("Bumped versions again");

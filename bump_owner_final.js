const fs = require('fs');

let ownerhtml = fs.readFileSync('public/owner/index.html', 'utf8');
ownerhtml = ownerhtml.replace('owner.js?v=55', 'owner.js?v=56');
fs.writeFileSync('public/owner/index.html', ownerhtml);

let ownersw = fs.readFileSync('public/owner/sw.js', 'utf8');
ownersw = ownersw.replace('dinspire-pwa-owner-v12', 'dinspire-pwa-owner-v13');
fs.writeFileSync('public/owner/sw.js', ownersw);

console.log("Bumped owner versions");

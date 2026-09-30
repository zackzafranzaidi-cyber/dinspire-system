const fs = require('fs');
let sw = fs.readFileSync('public/owner/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-owner-v\d+/, 'dinspire-pwa-owner-v10');
fs.writeFileSync('public/owner/sw.js', sw);
console.log("Bumped Owner SW");

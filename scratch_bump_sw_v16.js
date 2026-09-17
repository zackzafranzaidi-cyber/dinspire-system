const fs = require('fs');
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-v\d+/, 'dinspire-pwa-v16');
fs.writeFileSync('public/customer/sw.js', sw);
console.log("Bumped SW to v16");

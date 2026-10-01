const fs = require('fs');
let sw = fs.readFileSync('public/staff/sw.js', 'utf8');
sw = sw.replace(/const CACHE_NAME = "dinspire-staff-v28";/, 'const CACHE_NAME = "dinspire-staff-v29";');
fs.writeFileSync('public/staff/sw.js', sw);
console.log("Bumped sw.js to v29");

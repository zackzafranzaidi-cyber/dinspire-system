const fs = require('fs');

let sw = fs.readFileSync('public/staff/sw.js', 'utf8');
sw = sw.replace(/const CACHE_NAME = "dinspire-staff-v\d+";/, 'const CACHE_NAME = "dinspire-staff-v28";');
fs.writeFileSync('public/staff/sw.js', sw);

console.log("Bumped staff sw.js version!");

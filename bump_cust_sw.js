const fs = require('fs');
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/const CACHE_NAME = "dinspire-customer-v\d+";/, 'const CACHE_NAME = "dinspire-customer-v30";');
fs.writeFileSync('public/customer/sw.js', sw);
console.log("Bumped sw.js to v30");

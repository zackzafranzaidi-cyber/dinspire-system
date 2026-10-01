const fs = require('fs');

let swOwner = fs.readFileSync('public/owner/sw.js', 'utf8');
swOwner = swOwner.replace(/const CACHE_NAME = "dinspire-owner-v\d+";/, 'const CACHE_NAME = "dinspire-owner-v28";');
fs.writeFileSync('public/owner/sw.js', swOwner);

let swCust = fs.readFileSync('public/customer/sw.js', 'utf8');
swCust = swCust.replace(/const CACHE_NAME = "dinspire-customer-v\d+";/, 'const CACHE_NAME = "dinspire-customer-v28";');
fs.writeFileSync('public/customer/sw.js', swCust);

console.log("Bumped owner and customer sw.js version!");

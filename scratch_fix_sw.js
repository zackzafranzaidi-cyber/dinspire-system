const fs = require('fs');
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/'\/customer\/css\//g, "'/css/");
sw = sw.replace(/'\/customer\/js\//g, "'/js/");
fs.writeFileSync('public/customer/sw.js', sw);
console.log("Fixed customer sw.js");

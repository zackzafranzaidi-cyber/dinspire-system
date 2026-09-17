const fs = require('fs');
let js = fs.readFileSync('public/customer/js/index.js', 'utf8');

// We remove the 010212 conversion. Keep it 010211.
js = js.replace('baseStr = baseStr.replace("010211", "010212");', '// baseStr = baseStr.replace("010211", "010212"); // Kekalkan Static');

fs.writeFileSync('public/customer/js/index.js', js);
console.log("Fixed Dynamic QR to remain Static");

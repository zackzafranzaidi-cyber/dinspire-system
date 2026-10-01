const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

const target1 = /Barbers: \(stData \|\| \[\]\)\n\s*\.filter\(\(s\) => s\.jenis_staf === "In-Branch"\)/g;
shop = shop.replace(target1, 'Barbers: (stData || [])\n          .filter((s) => s.jenis_staf === "In-Branch" && !s.username.toUpperCase().includes("(BERHENTI)"))');

const target2 = /OnCallBarbers: \(stData \|\| \[\]\)\n\s*\.filter\(\(s\) => s\.jenis_staf === "On-Call"\)/g;
shop = shop.replace(target2, 'OnCallBarbers: (stData || [])\n          .filter((s) => s.jenis_staf === "On-Call" && !s.username.toUpperCase().includes("(BERHENTI)"))');

fs.writeFileSync('routes/shop.js', shop);
console.log("Updated shop.js with BERHENTI filter");

const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

// Filter Barbers
shop = shop.replace(
  /Barbers: \(stData \|\| \[\]\)\n\s*\.filter\(\(s\) => s\.jenis_staf === "In-Branch"\)/,
  `Barbers: (stData || [])\n        .filter((s) => s.jenis_staf === "In-Branch" && !s.username.toUpperCase().includes("(BERHENTI)"))`
);

// Filter OnCallBarbers
shop = shop.replace(
  /OnCallBarbers: \(stData \|\| \[\]\)\n\s*\.filter\(\(s\) => s\.jenis_staf === "On-Call"\)/,
  `OnCallBarbers: (stData || [])\n        .filter((s) => s.jenis_staf === "On-Call" && !s.username.toUpperCase().includes("(BERHENTI)"))`
);

fs.writeFileSync('routes/shop.js', shop);
console.log("Updated shop.js to filter out (BERHENTI) staff!");

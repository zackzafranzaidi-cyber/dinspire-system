const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

shop = shop.replace(
  /Barbers:\s*\(stData\s*\|\|\s*\[\]\)\s*\.filter\(\(s\)\s*=>\s*s\.jenis_staf\s*===\s*"In-Branch"\)/,
  'Barbers: (stData || []).filter((s) => s.jenis_staf === "In-Branch" && !String(s.username).toUpperCase().includes("(BERHENTI)"))'
);

shop = shop.replace(
  /OnCallBarbers:\s*\(stData\s*\|\|\s*\[\]\)\s*\.filter\(\(s\)\s*=>\s*s\.jenis_staf\s*===\s*"On-Call"\)/,
  'OnCallBarbers: (stData || []).filter((s) => s.jenis_staf === "On-Call" && !String(s.username).toUpperCase().includes("(BERHENTI)"))'
);

fs.writeFileSync('routes/shop.js', shop);
console.log("Updated shop.js with BERHENTI filter");

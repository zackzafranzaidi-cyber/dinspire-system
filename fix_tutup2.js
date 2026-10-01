const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

shop = shop.replace(
  /Haircuts: \(hcData \|\| \[\]\)\n\s*\.filter\(\(h\) => h\.kategori === "Booking"\)/,
  `Haircuts: (hcData || [])\n        .filter((h) => h.kategori === "Booking" && !h.nama_potongan.toUpperCase().includes("(TUTUP)"))`
);

shop = shop.replace(
  /OnCall: \(hcData \|\| \[\]\)\n\s*\.filter\(\(h\) => h\.kategori === "On-Call"\)/,
  `OnCall: (hcData || [])\n        .filter((h) => h.kategori === "On-Call" && !h.nama_potongan.toUpperCase().includes("(TUTUP)"))`
);

fs.writeFileSync('routes/shop.js', shop);
console.log("shop.js updated for Haircuts and OnCall!");

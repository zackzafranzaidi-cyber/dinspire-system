const fs = require('fs');

let shop = fs.readFileSync('routes/shop.js', 'utf8');

// Filter out (TUTUP) from Haircuts
shop = shop.replace(
  /Haircuts: \(hcData \|\| \[\]\)\n\s*\.filter\(\(h\) => h\.kategori === "Booking"\)/,
  `Haircuts: (hcData || [])
        .filter((h) => h.kategori === "Booking" && !h.nama_potongan.toUpperCase().includes("(TUTUP)"))`
);

// Filter out (TUTUP) from WalkInAll
shop = shop.replace(
  /WalkInAll: \(hcData \|\| \[\]\)\.filter\(h => h\.kategori === 'Walk-in' \|\| h\.kategori === 'Treatment Walk-in' \|\| h\.kategori === 'Combo Walk-in'\)/,
  `WalkInAll: (hcData || []).filter(h => (h.kategori === 'Walk-in' || h.kategori === 'Treatment Walk-in' || h.kategori === 'Combo Walk-in') && !h.nama_potongan.toUpperCase().includes("(TUTUP)"))`
);

// Filter out (TUTUP) from OnCall
shop = shop.replace(
  /OnCall: \(hcData \|\| \[\]\)\n\s*\.filter\(\(h\) => h\.kategori === "On-Call"\)/,
  `OnCall: (hcData || [])
        .filter((h) => h.kategori === "On-Call" && !h.nama_potongan.toUpperCase().includes("(TUTUP)"))`
);

// Filter out (TUTUP) from Treatments
shop = shop.replace(
  /Treatments: \(trData \|\| \[\]\)\.map\(\(t\) => \(\{/,
  `Treatments: (trData || [])
        .filter((t) => !t.nama_rawatan.toUpperCase().includes("(TUTUP)"))
        .map((t) => ({`
);

fs.writeFileSync('routes/shop.js', shop);
console.log("shop.js updated with (TUTUP) filter!");

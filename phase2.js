const fs = require('fs');

let shop = fs.readFileSync('routes/shop.js', 'utf8');
shop = shop.replace(/WalkInServices:\s*\(hcData\s*\|\|\s*\[\]\)[\s\S]*?kategori:\s*h\.kategori\s*}\)\),/g, `WalkInAll: (hcData || []).filter(h => h.kategori === 'Walk-in' || h.kategori === 'Treatment Walk-in' || h.kategori === 'Combo Walk-in').map(h => ({ id: h.id, name: h.nama_potongan, price: h.harga, kategori: h.kategori })),`);
fs.writeFileSync('routes/shop.js', shop);

let admin = fs.readFileSync('routes/admin.js', 'utf8');
admin = admin.replace(/WalkInServices:\s*\(hcData\s*\|\|\s*\[\]\)[\s\S]*?name:\s*h\.nama_potongan,\s*price:\s*h\.harga\s*}\)\),/g, `WalkInAll: (hcData || []).filter(h => h.kategori === 'Walk-in' || h.kategori === 'Treatment Walk-in' || h.kategori === 'Combo Walk-in').map(h => ({ id: h.id, name: h.nama_potongan, price: h.harga, kategori: h.kategori })),`);

admin = admin.replace(/\.\.\.\(data\.WalkInServices\s*\|\|\s*\[\]\)[\s\S]*?kategori:\s*"Treatment Walk-in",\s*}\)\),/g, `...(data.WalkInAll || []).map(x => ({ ...x, kategori: x.kategori || 'Walk-in' })),`);
fs.writeFileSync('routes/admin.js', admin);
console.log("Re-ran replacement");

const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');
admin = admin.replace(/WalkInTreatments:\s*\(hcData\s*\|\|\s*\[\]\)[\s\S]*?name:\s*h\.nama_potongan,\s*price:\s*h\.harga\s*}\)\),/g, '');
fs.writeFileSync('routes/admin.js', admin);
console.log("Removed WalkInTreatments");

const fs = require('fs');
let code = fs.readFileSync('routes/staff.js', 'utf8');

// I want to inject a console.log into the backend to see what it's actually returning!
code = code.replace(
  'return res.json({ found: true, name: data.real_name });',
  'console.log("LOOKUP DIR FOUND:", data.real_name); return res.json({ found: true, name: data.real_name });'
);
code = code.replace(
  'return res.json({ found: true, name: cData.name });',
  'console.log("LOOKUP CUST FOUND:", cData.name); return res.json({ found: true, name: cData.name });'
);
code = code.replace(
  'return res.json({ found: true, name: wData.nama_pelanggan });',
  'console.log("LOOKUP WALK FOUND:", wData.nama_pelanggan); return res.json({ found: true, name: wData.nama_pelanggan });'
);
fs.writeFileSync('routes/staff.js', code);
console.log("Injected backend logs");

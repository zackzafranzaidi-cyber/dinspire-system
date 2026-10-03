const fs = require('fs');

let bookingsCode = fs.readFileSync('routes/bookings.js', 'utf8');
bookingsCode = bookingsCode.replace(/\}\, \{ onConflict: 'phone_number', ignoreDuplicates: true \}\)\.catch\(console\.error\)\;/g, "}, { onConflict: 'phone_number', ignoreDuplicates: true });");
fs.writeFileSync('routes/bookings.js', bookingsCode);

let authCode = fs.readFileSync('routes/auth.js', 'utf8');
authCode = authCode.replace(/\}\, \{ onConflict: 'phone_number', ignoreDuplicates: true \}\)\.catch\(console\.error\)\;/g, "}, { onConflict: 'phone_number', ignoreDuplicates: true });");
fs.writeFileSync('routes/auth.js', authCode);

console.log("Fixed `.catch is not a function` bug in both files!");

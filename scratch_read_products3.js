const fs = require('fs');
const js = fs.readFileSync('routes/bookings.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('fpxResult = await toyyibpay.createPayment('));
console.log(lines.slice(idx + 15, idx + 60).join('\n'));

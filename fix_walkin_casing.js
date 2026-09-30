const fs = require('fs');
let owner = fs.readFileSync('routes/owner.js', 'utf8');

const regex = /if \(request\.new_payment_method && request\.transaction_table === 'walkin_records'\) \{[\s\S]*?\}/;

const replacement = `if (request.new_payment_method && request.transaction_table === 'walkin_records') {
            let pm = request.new_payment_method;
            if (pm.toUpperCase() === 'CASH') pm = 'Cash';
            if (pm.toUpperCase() === 'QR' || pm.includes('QR')) pm = 'QR';
            updatePayload.jenis_bayaran = pm;
          }`;

owner = owner.replace(regex, replacement);
fs.writeFileSync('routes/owner.js', owner);
console.log("Fixed walkin payment method casing constraint");

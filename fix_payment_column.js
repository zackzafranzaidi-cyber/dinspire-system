const fs = require('fs');

let owner = fs.readFileSync('routes/owner.js', 'utf8');

const regex = /if \(request\.new_payment_method\) \{[\s\S]*?\}/;

const replacement = `if (request.new_payment_method) {
          updatePayload.jenis_bayaran = request.new_payment_method;
        }`;

owner = owner.replace(regex, replacement);

fs.writeFileSync('routes/owner.js', owner);
console.log("Fixed payment column name");

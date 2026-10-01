const fs = require('fs');

let owner = fs.readFileSync('routes/owner.js', 'utf8');

const targetLogic = /if \(request\.new_payment_method && request\.transaction_table === 'walkin_records'\) \{([\s\S]*?)\}/;

const newLogic = `if (request.new_payment_method && request.transaction_table === 'walkin_records') {$1}
        
        // Parse TUKAR_SERVIS | ID: xxx dari reason
        if (request.reason && request.reason.includes("| TUKAR_SERVIS:")) {
           const matchId = request.reason.match(/\\| ID: ([a-zA-Z0-9_-]+)/);
           if (matchId && matchId[1]) {
               const newSrvId = matchId[1];
               if (request.transaction_table === 'walkin_records') updatePayload.jenis_potongan = newSrvId;
               else if (request.transaction_table === 'booking_records') updatePayload.jenis_haircut = newSrvId;
               else if (request.transaction_table === 'oncall_records') updatePayload.jenis_haircut = newSrvId;
               else if (request.transaction_table === 'treatment_records') updatePayload.jenis_rawatan = newSrvId;
           }
        }`;

owner = owner.replace(targetLogic, newLogic);
fs.writeFileSync('routes/owner.js', owner);
console.log("Owner backend parse service ID updated!");

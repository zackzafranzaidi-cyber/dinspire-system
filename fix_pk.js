const fs = require('fs');
let owner = fs.readFileSync('routes/owner.js', 'utf8');

const regex = /const \{ error: updateErr \} = await supabase\s*\.from\(request\.transaction_table\)\s*\.update\(updatePayload\)\s*\.eq\("id", request\.transaction_id\);/;

const replacement = `let pkColumn = "id";
        if (request.transaction_table === "booking_records" || request.transaction_table === "oncall_records") {
            pkColumn = "no_booking";
        }
        
        const { error: updateErr } = await supabase
          .from(request.transaction_table)
          .update(updatePayload)
          .eq(pkColumn, request.transaction_id);`;

owner = owner.replace(regex, replacement);
fs.writeFileSync('routes/owner.js', owner);
console.log("Fixed primary key dynamic mapping");

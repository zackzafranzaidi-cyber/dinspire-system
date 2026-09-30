const fs = require('fs');

let owner = fs.readFileSync('routes/owner.js', 'utf8');

const regex = /const { error: updateErr } = await supabase\s*\.from\(request\.transaction_table\)\s*\.update\(updatePayload\)\s*\.eq\("id", request\.transaction_id\);/;

const replacement = `let actualTable = request.transaction_table;
        if (actualTable === 'booking_records') actualTable = 'bookings';
        if (actualTable === 'walkin_records') actualTable = 'walkins';
        if (actualTable === 'treatment_records') actualTable = 'treatments';
        if (actualTable === 'oncall_records') actualTable = 'oncalls';

        const { error: updateErr } = await supabase
          .from(actualTable)
          .update(updatePayload)
          .eq("id", request.transaction_id);`;

owner = owner.replace(regex, replacement);

fs.writeFileSync('routes/owner.js', owner);
console.log("Fixed table name mapping");

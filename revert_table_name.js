const fs = require('fs');

let owner = fs.readFileSync('routes/owner.js', 'utf8');

const regex = /let actualTable = request\.transaction_table;[\s\S]*?\.eq\("id", request\.transaction_id\);/;

const replacement = `const { error: updateErr } = await supabase
          .from(request.transaction_table)
          .update(updatePayload)
          .eq("id", request.transaction_id);`;

owner = owner.replace(regex, replacement);

fs.writeFileSync('routes/owner.js', owner);
console.log("Reverted table name mapping");

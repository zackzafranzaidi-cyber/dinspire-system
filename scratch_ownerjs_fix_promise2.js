const fs = require('fs');
let content = fs.readFileSync('routes/owner.js', 'utf8');

const regex = /supabase\s*\.from\("treatment_records"\)\s*\.select\("\*, staff\(username\), treatments\(nama_rawatan\)"\)\s*\.order\("created_at", \{ ascending: false \}\),/;

const newCode = `supabase
          .from("treatment_records")
          .select("*, staff(username), treatments(nama_rawatan)")
          .order("created_at", { ascending: false }),
        supabase
          .from("staff")
          .select("username, status_pekerja"),`;

content = content.replace(regex, newCode);
fs.writeFileSync('routes/owner.js', content);
console.log("Fixed Promise.all array in owner.js with regex");

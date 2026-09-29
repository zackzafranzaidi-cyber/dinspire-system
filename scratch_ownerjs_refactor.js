const fs = require('fs');
let content = fs.readFileSync('routes/owner.js', 'utf8');

// 1. Remove the first fetch
content = content.replace('{ data: treatments },\n        { data: staffData }\n      ] = await Promise.all([', '{ data: treatments }\n      ] = await Promise.all([');
content = content.replace(/,\s*supabase\s*\.from\("staff"\)\s*\.select\("username, status_pekerja"\)/, '');

// 2. Remove the first staffList const
content = content.replace('const staffList = staffData || [];\n', '');
content = content.replace('const staffList = staffData || [];', '');

// 3. Update the second fetch
content = content.replace('supabase.from("staff").select("username, jenis_staf, branch_id")', 'supabase.from("staff").select("username, jenis_staf, branch_id, status_pekerja")');

// 4. Update the final payload (actually it was staffList: staffList already, so it's fine)

fs.writeFileSync('routes/owner.js', content);
console.log("Fixed SyntaxError and optimized staff query.");

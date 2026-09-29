const fs = require('fs');
let content = fs.readFileSync('routes/shop.js', 'utf8');
content = content.replace('supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment")', 'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment").neq("is_active", false)');
fs.writeFileSync('routes/shop.js', content);
console.log("Updated shop.js to filter out inactive staff");

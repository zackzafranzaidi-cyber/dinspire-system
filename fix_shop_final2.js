const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

const targetStr1 = 'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, is_active").limit(100)';
const newStr1 = 'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, is_active, status_pekerja").limit(100)';

shop = shop.replace(targetStr1, newStr1);
fs.writeFileSync('routes/shop.js', shop);
console.log("Added status_pekerja to both queries!");

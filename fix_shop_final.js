const fs = require('fs');
let shop = fs.readFileSync('routes/shop.js', 'utf8');

const oldStr = 'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment")';
const newStr = 'supabase.from("staff").select("id, username, jenis_staf, branch_id, can_haircut, can_treatment, status_pekerja")';

if (shop.includes(oldStr)) {
    shop = shop.replace(oldStr, newStr);
    fs.writeFileSync('routes/shop.js', shop);
    console.log("Updated shop.js successfully!");
} else {
    console.log("String not found. Already updated or different format.");
}

const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

// Insert after syncData("staff", ...)
const targetStr = /\s*await syncData\(\s*"staff",\s*data\.Staff \|\| \[\],\s*\(\s*i\s*\) => \(\{[\s\S]*?\}\),\s*\);/;

const insertStr = `
        const staffStatuses = {};
        (data.Staff || []).forEach(s => {
             if (s.id && s.id.length > 5) staffStatuses[s.id] = s.status_pekerja || "full_time";
        });
        
        await supabase.from("settings").upsert([{ setting_key: "staff_status", setting_value: JSON.stringify(staffStatuses) }], { onConflict: "setting_key" });
`;

if (!admin.includes('staffStatuses')) {
  admin = admin.replace(targetStr, match => match + insertStr);
  fs.writeFileSync('routes/admin.js', admin);
  console.log("Injected staff_status saving!");
} else {
  console.log("Already injected.");
}

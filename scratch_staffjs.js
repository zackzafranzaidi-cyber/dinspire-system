const fs = require('fs');
let content = fs.readFileSync('routes/staff.js', 'utf8');

// Add staff_info query
content = content.replace('{ data: branchesData }', '{ data: branchesData },\n        { data: staffInfo }');
content = content.replace('supabase.from("branches").select("id, nama_cawangan")', 'supabase.from("branches").select("id, nama_cawangan"),\n        supabase.from("staff").select("status_pekerja").eq("id", staff_id).single()');

// Update setting_key query
content = content.replace('.in("setting_key", ["peratus_komisen", "gaji_asas"]),', '.in("setting_key", ["peratus_komisen", "gaji_asas", "komisen_part_time"]),');

// Update basicSalary/commission calculation
const calcReplace = `
      let commissionPercent = 50;
      let basicSalary = 1800;
      
      const isPartTime = staffInfo && staffInfo.status_pekerja === 'part_time';

      (settingData || []).forEach(s => {
        if (s.setting_key === 'peratus_komisen' && !isPartTime) commissionPercent = parseFloat(s.setting_value) || 50;
        if (s.setting_key === 'komisen_part_time' && isPartTime) commissionPercent = parseFloat(s.setting_value) || 50;
        if (s.setting_key === 'gaji_asas') basicSalary = parseFloat(s.setting_value) || 1800;
      });
`;
content = content.replace(/let commissionPercent = 50;\s+let basicSalary = 1800;\s+\(settingData \|\| \[\]\)\.forEach\(s => \{\s+if \(s\.setting_key === 'peratus_komisen'\) commissionPercent = parseFloat\(s\.setting_value\) \|\| 50;\s+if \(s\.setting_key === 'gaji_asas'\) basicSalary = parseFloat\(s\.setting_value\) \|\| 1800;\s+\}\);/, calcReplace);

// Inject status_pekerja into response JSON
content = content.replace('res.json({', 'res.json({\n        status_pekerja: isPartTime ? "part_time" : "full_time",');

fs.writeFileSync('routes/staff.js', content);
console.log("Updated staff.js calculation logic");

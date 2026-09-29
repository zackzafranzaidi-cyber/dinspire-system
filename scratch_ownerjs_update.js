const fs = require('fs');
let content = fs.readFileSync('routes/owner.js', 'utf8');

const regexOldSetting = /supabase\s*\.from\("settings"\)\s*\.select\("setting_value"\)\s*\.eq\("setting_key",\s*"peratus_komisen"\)\s*\.single\(\),/;

const newSettingBlock = `supabase
          .from("settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["peratus_komisen", "komisen_part_time"]),`;

content = content.replace(regexOldSetting, newSettingBlock);

// Also need to fetch staff list to get status_pekerja for each staff
const regexStaffList = /supabase\s*\.from\("staff"\)\s*\.select\("\*"\)/;
const regexWaitPromiseAll = /supabase\s*\.from\("treatment_records"\)\s*\.select\("\*, staff\(username\), treatments\(nama_rawatan\)"\)\s*\.order\("created_at", \{ ascending: false \}\),/g;

// Wait, I will just add staff fetch to the Promise.all
const newStaffBlock = `supabase
          .from("staff")
          .select("username, status_pekerja"),`;
          
content = content.replace('      ]);\n      const commissionPercent', newStaffBlock + '\n      ]);\n      const commissionPercent');

const parseSettingsLogic = `
      let commissionPercent = 50;
      let partTimeCommissionPercent = 50;
      (settingData || []).forEach(s => {
         if (s.setting_key === 'peratus_komisen') commissionPercent = parseFloat(s.setting_value) || 50;
         if (s.setting_key === 'komisen_part_time') partTimeCommissionPercent = parseFloat(s.setting_value) || 50;
      });
      const staffList = staffData || [];
`;

content = content.replace(/const commissionPercent = settingData\s*\?\s*parseFloat\(settingData\.setting_value\)\s*:\s*50;/, parseSettingsLogic);

// Add to the final payload
content = content.replace('commissionPercent: commissionPercent,', 'commissionPercent: commissionPercent,\n          partTimeCommissionPercent: partTimeCommissionPercent,\n          staffList: staffList,');

fs.writeFileSync('routes/owner.js', content);
console.log("Updated owner.js dashboard route.");

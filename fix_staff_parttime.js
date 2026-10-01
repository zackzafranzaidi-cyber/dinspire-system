const fs = require('fs');
let staff = fs.readFileSync('routes/staff.js', 'utf8');

const targetStr = /const isPartTime = staffInfo && staffInfo\.status_pekerja === 'part_time';/;
const newStr = `let isPartTime = false;
        (settingData || []).forEach(s => {
          if (s.setting_key === 'staff_status') {
             try {
                const statuses = JSON.parse(s.setting_value);
                if (statuses[staff_id] === 'part_time') isPartTime = true;
             } catch(e) {}
          }
        });`;

staff = staff.replace(targetStr, newStr);
fs.writeFileSync('routes/staff.js', staff);
console.log("Updated staff.js to read staff_status from settings!");

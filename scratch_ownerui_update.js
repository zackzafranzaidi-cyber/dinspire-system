const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner.js', 'utf8');

// Insert the helper function near the top
const helperFunction = `
function getStaffCommissionRate(staffName) {
  if (!masterData.staffList) return masterData.commissionPercent;
  const staff = masterData.staffList.find(s => s.username === staffName);
  if (staff && staff.status_pekerja === 'part_time') {
    return masterData.partTimeCommissionPercent !== undefined ? masterData.partTimeCommissionPercent : masterData.commissionPercent;
  }
  return masterData.commissionPercent;
}
`;

content = content.replace('let mapBarberBranch = {};', helperFunction + '\nlet mapBarberBranch = {};');

// Replace masterData.commissionPercent calculations
// In processDashboardData:
content = content.replace('const totalComm = serviceRev * (masterData.commissionPercent / 100);', 
`
    let totalComm = 0;
    tableBookings.forEach(b => {
      let price = parseFloat(b.Price) || 0;
      let rate = getStaffCommissionRate(b.Barber) / 100;
      totalComm += (price * rate);
    });
`);

content = content.replace('let p_totalComm = p_sRev * (masterData.commissionPercent / 100);',
`
        let p_totalComm = 0;
        prevBookings.forEach(b => {
          let price = parseFloat(b.Price) || 0;
          let rate = getStaffCommissionRate(b.Barber) / 100;
          p_totalComm += (price * rate);
        });
`);

content = content.replace('const comm = stats[name].sales * (masterData.commissionPercent / 100);',
`const comm = stats[name].sales * (getStaffCommissionRate(name) / 100);`);

content = content.replace('let exp = price * (masterData.commissionPercent / 100);',
`let exp = price * (getStaffCommissionRate(b.Barber) / 100);`);


fs.writeFileSync('public/owner/js/owner.js', content);
console.log("Updated owner.js for part_time commission rate.");

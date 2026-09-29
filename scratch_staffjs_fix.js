const fs = require('fs');
let content = fs.readFileSync('routes/staff.js', 'utf8');

content = content.replace('status_pekerja: isPartTime ? "part_time" : "full_time", status: "success", publicKey: cleanKey', 'status: "success", publicKey: cleanKey');

const dashboardResJson = `      res.json({
        status: "success",`;
content = content.replace(dashboardResJson, `      res.json({
        status_pekerja: isPartTime ? "part_time" : "full_time",
        status: "success",`);

fs.writeFileSync('routes/staff.js', content);
console.log("Fixed status_pekerja injection in staff.js");

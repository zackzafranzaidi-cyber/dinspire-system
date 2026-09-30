const fs = require('fs');
let owner = fs.readFileSync('public/owner/js/owner.js', 'utf8');

const regex = /fetchEditRequests\(\);\s*if\(action === 'Approve'\) \{\s*loadDashboardData\(\);\s*fetchEditRequests\(\);\s*\}/g;

const replacement = `fetchEditRequests();
          if(action === 'Approve') {
              fetchOwnerDashboardData();
          }`;

owner = owner.replace(regex, replacement);
fs.writeFileSync('public/owner/js/owner.js', owner);
console.log("Fixed loadDashboardData to fetchOwnerDashboardData");

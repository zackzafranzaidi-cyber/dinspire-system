const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

html = html.replace(
  "exportTableToCSV('table-branch-perf'",
  "exportTableToCSV('table-branches'"
);

html = html.replace(
  "exportTableToCSV('table-staf-perf'",
  "exportTableToCSV('table-staff'"
);

fs.writeFileSync('public/owner/index.html', html);
console.log("Fixed CSV export table IDs");

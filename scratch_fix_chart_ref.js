const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

js = js.replace(/window\.branchLineChartObj/g, 'branchLineChartObj');

fs.writeFileSync('public/js/owner.js', js);
console.log("Fixed window.branchLineChartObj reference.");

const fs = require('fs');
let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const target = /document\s*\.getElementById\("wi-service"\)\s*\?\.addEventListener\("change", autoFillPrice\);/;
const replacement = `document.getElementById("wi-category")?.addEventListener("change", handleCategoryChange);
    document.getElementById("wi-service")?.addEventListener("change", autoFillPrice);`;

staff = staff.replace(target, replacement);
fs.writeFileSync('public/staff/js/staff.js', staff);
console.log("Added wi-category event listener!");

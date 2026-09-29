const fs = require('fs');
const content = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');
const startIndex = content.indexOf('if (tabName === "Settings")');
console.log(content.substring(startIndex + 3500, startIndex + 5500));

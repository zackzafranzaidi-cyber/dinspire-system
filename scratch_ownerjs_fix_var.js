const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner.js', 'utf8');

content = content.replace('tableBookings.forEach(b => {', 'filteredBookings.forEach(b => {');

fs.writeFileSync('public/owner/js/owner.js', content);
console.log("Fixed tableBookings to filteredBookings");

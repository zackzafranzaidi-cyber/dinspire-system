const fs = require('fs');
let staffjs = fs.readFileSync('public/staff/js/staff.js', 'utf8');

staffjs = staffjs.replace(/\$\{b\.final_price \|\| b\.price\}/g, '${b.final_price || b.price || 0}');

fs.writeFileSync('public/staff/js/staff.js', staffjs);
console.log("Fixed undefined price syntax");

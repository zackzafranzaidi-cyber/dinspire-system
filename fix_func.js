const fs = require('fs');
let owner = fs.readFileSync('public/owner/js/owner.js', 'utf8');

owner = owner.replace('renderOrdersAndFlow(masterData); // Render semula tab', 'processData(); // Render semula tab');

fs.writeFileSync('public/owner/js/owner.js', owner);
console.log("Fixed function name to processData");

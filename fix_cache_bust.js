const fs = require('fs');

let staff = fs.readFileSync('public/staff/js/staff.js', 'utf8');
staff = staff.replace(/fetch\(\`\$\{API_BASE_URL\}\/shop-data\`\)/g, 'fetch(`${API_BASE_URL}/shop-data?v=walkin_all_fix`)');
fs.writeFileSync('public/staff/js/staff.js', staff);

let owner = fs.readFileSync('public/owner/js/owner.js', 'utf8');
owner = owner.replace(/fetch\(\`\$\{API_BASE_URL\}\/shop-data\`\)/g, 'fetch(`${API_BASE_URL}/shop-data?v=walkin_all_fix`)');
fs.writeFileSync('public/owner/js/owner.js', owner);

console.log("Cache busting added to fetch!");

const fs = require('fs');

let admin = fs.readFileSync('routes/admin.js', 'utf8');

const targetStr = /(await syncData\(\s*"staff",\s*data\.Staff \|\| \[\],\s*\(i\) => \(\{)([\s\S]*?)(\}\),\s*\);)/;

const newStr = `$1
            id: i.id,
            username: i.name,
            jenis_staf: i.jenis_staf || "In-Branch",
            branch_id: i.branch_id || null,
            can_haircut: i.can_haircut !== false,
            can_treatment: i.can_treatment !== false,
          $3`;

admin = admin.replace(targetStr, newStr);
fs.writeFileSync('routes/admin.js', admin);
console.log("Fixed Staff syncData mapping!");

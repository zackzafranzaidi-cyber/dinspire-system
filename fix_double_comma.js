const fs = require('fs');
let admin = fs.readFileSync('routes/admin.js', 'utf8');

admin = admin.replace(
  /can_treatment: s\.can_treatment !== false,\s*,\s*status_pekerja:/g,
  'can_treatment: s.can_treatment !== false,\n              status_pekerja:'
);

fs.writeFileSync('routes/admin.js', admin);
console.log("Fixed double comma!");

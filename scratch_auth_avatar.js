const fs = require('fs');
let js = fs.readFileSync('routes/auth.js', 'utf8');

js = js.replace(/name: safeUsername,\s*phone: safePhone,\s*address: safeAddress,\s*avatar_url,\s*password_hash,/, `name: safeUsername,
        phone: safePhone,
        address: safeAddress,
        avatar_url: String(avatar_url || "").substring(0, 255), // [DIBAIKI] Hadkan avatar_url
        password_hash,`);

fs.writeFileSync('routes/auth.js', js);
console.log('Fixed avatar_url length');

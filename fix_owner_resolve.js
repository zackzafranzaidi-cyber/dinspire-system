const fs = require('fs');

let ownerjs = fs.readFileSync('public/owner/js/owner.js', 'utf8');

// Replace function name
ownerjs = ownerjs.replace('async function resolveEditRequest(', 'window.resolveEdit = async function(');

fs.writeFileSync('public/owner/js/owner.js', ownerjs);
console.log("Fixed resolveEdit function name");

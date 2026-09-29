const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner.js', 'utf8');

const badge1 = /updateBadgeNumber\("badge-tx-servis", window\.newSelesaiCount\);/;
content = content.replace(badge1, 'updateBadgeNumber("badge-tx-servis", window.newSelesaiCount + (masterData.editRequests || []).length);');

const badge2 = /updateBadgeDot\("badge-mob-transactions", \(window\.newSelesaiCount > 0 \|\| countTxProduk > 0\)\);/;
content = content.replace(badge2, 'updateBadgeDot("badge-mob-transactions", (window.newSelesaiCount > 0 || countTxProduk > 0 || (masterData.editRequests || []).length > 0));');

fs.writeFileSync('public/owner/js/owner.js', content);
console.log("Updated owner.js badges");

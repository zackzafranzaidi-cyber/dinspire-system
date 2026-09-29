const fs = require('fs');
let content = fs.readFileSync('public/owner/js/owner_cms.js', 'utf8');

content = content.replace('html += `<th class="px-6 py-4">${c === \'imageUrl\' ? \'GAMBAR\' : c}</th>`;', 'html += `<th class="px-6 py-4">${c === \'imageUrl\' ? \'GAMBAR\' : (c === \'status_pekerja\' ? \'STATUS (FT/PT)\' : c)}</th>`;');

fs.writeFileSync('public/owner/js/owner_cms.js', content);
console.log("Updated header logic");

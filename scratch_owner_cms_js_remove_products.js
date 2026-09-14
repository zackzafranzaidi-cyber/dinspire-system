const fs = require('fs');
let code = fs.readFileSync('public/js/owner_cms.js', 'utf8');

// 1. Remove if (tabName === "Products") block
code = code.replace(/if\s*\(tabName\s*===\s*"Products"\)\s*\{\s*renderProducts\(appData\[tabName\]\s*\|\|\s*\[\],\s*container\);\s*return;\s*\}/, '');

// 2. Remove renderProducts function completely
code = code.replace(/function renderProducts\(dataArr, container\) \{[\s\S]*?\n\}\s*(?=function renderPosters|if)/, '');

// 3. Update renderTable for IMAGEURL header and bigger thumbnail
code = code.replace(/<th class="px-6 py-4">\$\{c\}<\/th>/, `<th class="px-6 py-4">\${c === 'imageUrl' ? 'GAMBAR' : c}</th>`);
code = code.replace(/w-12 h-12/g, 'w-16 h-16');

fs.writeFileSync('public/js/owner_cms.js', code);

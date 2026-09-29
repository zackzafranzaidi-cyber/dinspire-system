const fs = require('fs');
let content = fs.readFileSync('public/owner/index.html', 'utf8');

const regex = /<div class="flex justify-end mb-2 pr-4">/;
content = content.replace(regex, `<div id="edit-requests-container" class="mb-4 hidden w-full"></div>\n          <div class="flex justify-end mb-2 pr-4">`);

fs.writeFileSync('public/owner/index.html', content);
console.log("Added edit-requests-container to owner HTML");

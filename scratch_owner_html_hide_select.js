const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

html = html.replace(/<select onchange="switchAdminTab\(this\.value\)" class="(.*?)"/g, '<select id="cms-dropdown" onchange="switchAdminTab(this.value)" class="$1 md:hidden"');

fs.writeFileSync('public/owner/index.html', html);

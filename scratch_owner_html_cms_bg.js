const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

// Find tab-cms
const regex = /<div id="tab-cms" class="tab-content hidden">[\s\S]*?<div id="dynamic-content" class="w-full overflow-x-auto min-h-\[300px\]">/;

const newHtml = `<div id="tab-cms" class="tab-content hidden">
            <!-- No white card wrapper, just let the CMS content breathe on the grey background like admin page -->
            <div id="dynamic-content" class="w-full overflow-x-auto min-h-[500px]">`;

html = html.replace(regex, newHtml);
fs.writeFileSync('public/owner/index.html', html);

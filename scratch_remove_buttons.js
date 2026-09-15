const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const regex = /<div class="flex bg-gray-50 border border-gray-100 rounded-lg p-1 text-\[10px\] font-bold">[\s\S]*?1Y<\/button>\s*<\/div>/;
if (regex.test(html)) {
    html = html.replace(regex, "");
    fs.writeFileSync('public/owner/index.html', html);
    console.log("Removed redundant buttons via regex");
} else {
    console.log("Regex didn't match");
}

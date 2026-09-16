const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const regex = /<header\s+class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 w-full"\s*>/;

if (regex.test(html)) {
    const newHeader = `<header
          id="global-top-header"
          class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 w-full transition-all duration-300"
        >`;
    html = html.replace(regex, newHeader);
    fs.writeFileSync('public/owner/index.html', html);
    console.log("Added ID via regex.");
} else {
    console.log("Regex failed.");
}

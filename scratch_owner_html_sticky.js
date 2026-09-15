const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

// replace sticky top-0 with sticky top-0 z-10
html = html.replace(/sticky top-0 (?!z-)/g, 'sticky top-0 z-10 ');

// also bump version
html = html.replace(/v=48/, 'v=49');
html = html.replace(/CURRENT_APP_VERSION = "1.3.1"/, 'CURRENT_APP_VERSION = "1.3.2"');

fs.writeFileSync('public/owner/index.html', html);
console.log("Updated HTML!");

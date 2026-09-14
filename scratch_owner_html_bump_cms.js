const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

html = html.replace(/owner_cms\.js\?v=1/g, 'owner_cms.js?v=2');
html = html.replace(/owner_cms\.css\?v=1/g, 'owner_cms.css?v=2');
html = html.replace(/v=42/, 'v=43');
html = html.replace(/CURRENT_APP_VERSION = "1.2.5"/, 'CURRENT_APP_VERSION = "1.2.6"');

fs.writeFileSync('public/owner/index.html', html);

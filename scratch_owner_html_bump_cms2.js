const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

html = html.replace(/owner_cms\.js\?v=2/g, 'owner_cms.js?v=3');
html = html.replace(/owner_cms\.css\?v=2/g, 'owner_cms.css?v=3');
html = html.replace(/v=43/, 'v=44');
html = html.replace(/CURRENT_APP_VERSION = "1.2.6"/, 'CURRENT_APP_VERSION = "1.2.7"');

fs.writeFileSync('public/owner/index.html', html);

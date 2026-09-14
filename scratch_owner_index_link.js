const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

html = html.replace(/admin\.css\?v=2/, 'owner_cms.css?v=1');
html = html.replace(/admin\.js\?v=3/, 'owner_cms.js?v=1');

fs.writeFileSync('public/owner/index.html', html);

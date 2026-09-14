const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const regex = /<button onclick="switchTab\('cms'\).*?mob-nav-cms.*?<\/button>/s;
html = html.replace(regex, '');

fs.writeFileSync('public/owner/index.html', html);

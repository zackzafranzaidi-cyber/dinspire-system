const fs = require('fs');
const html = fs.readFileSync('public/owner/index.html', 'utf8');

const startTag = '<!-- [BAHARU] AI QUICK INSIGHTS -->';
const endTag = '<!-- CARTA -->';
const startIdx = html.indexOf(startTag);
const endIdx = html.indexOf(endTag);
console.log("Found:", startIdx !== -1 && endIdx !== -1);

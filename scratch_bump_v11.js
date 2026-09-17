const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/\?v=(\d+)/g, (match, p1) => '?v=' + (parseInt(p1) + 1));
fs.writeFileSync('public/customer/index.html', html);

let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/(CACHE_NAME\s*=\s*['"][\w-]+-v)(\d+)(['"])/, (match, p1, p2, p3) => p1 + (parseInt(p2) + 1) + p3);
fs.writeFileSync('public/customer/sw.js', sw);

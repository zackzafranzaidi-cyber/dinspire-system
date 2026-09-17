const fs = require('fs');
const path = require('path');

// Rename file
fs.renameSync('public/customer/js/index.js', 'public/customer/js/customer.js');

// Update HTML
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace('/customer/js/index.js', '/customer/js/customer.js');
fs.writeFileSync('public/customer/index.html', html);

// Update SW
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace("'/js/index.js'", "'/js/customer.js'");
// bump sw cache version just in case
sw = sw.replace(/(CACHE_NAME\s*=\s*['"][\w-]+-v)(\d+)(['"])/, (match, p1, p2, p3) => {
    return p1 + (parseInt(p2) + 1) + p3;
});
fs.writeFileSync('public/customer/sw.js', sw);

// Also Vercel rewrites!!!
let vercel = fs.readFileSync('vercel.json', 'utf8');
// wait, the vercel rewrite is:
// "source": "/js/:path*", "destination": "/customer/js/:path*"
// so we don't need to change vercel.json because /js/customer.js will automatically route to /customer/js/customer.js !

console.log("Renamed index.js to customer.js");

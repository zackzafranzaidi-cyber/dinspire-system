const fs = require('fs');

// 1. Slow down CSS spinBorder
let css = fs.readFileSync('public/css/index.css', 'utf8');
css = css.replace(/animation: spinBorder 3s linear infinite;/g, 'animation: spinBorder 6s linear infinite;');
fs.writeFileSync('public/css/index.css', css);

// 2. Slow down JS slider interval
let js = fs.readFileSync('public/js/index.js', 'utf8');
js = js.replace(/}, 4000\);/g, '}, 7000);');
fs.writeFileSync('public/js/index.js', js);

// 3. Bump cache versions
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/index\.css\?v=\d+/, "index.css?v=71");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=71");
fs.writeFileSync('public/customer/index.html', html);

console.log("Slowed down animations and bumped cache.");

const fs = require('fs');

let css = fs.readFileSync('public/css/index.css', 'utf8');

// Detail: Fix cart badge color
css = css.replace(
  /\.cart-badge\s*\{[\s\S]*?color:\s*var\(--btn-dark\);/g,
  match => match.replace('var(--btn-dark)', 'var(--text-main)')
);

fs.writeFileSync('public/css/index.css', css);

// BUMP CACHE IN HTML
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/index\.css\?v=\d+/, "index.css?v=86");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=86");
fs.writeFileSync('public/customer/index.html', html);

// BUMP SERVICE WORKER
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-v\d+/, 'dinspire-pwa-v20');
fs.writeFileSync('public/customer/sw.js', sw);

console.log("Fixed cart badge text color.");

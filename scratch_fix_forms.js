const fs = require('fs');

// 1. UPDATE HTML
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// Fix Review Title
html = html.replace(
  /<span data-i18n="review-title" style="font-size:\s*16px;\s*font-weight:\s*700;">Give Customer Review<\/span>/g,
  '<span data-i18n="review-title" style="font-size: 16px; font-weight: 700; color: var(--text-main);">Give Customer Review</span>'
);

// Fix Edit Profile Title
html = html.replace(
  /<h2 style="font-size:18px;\s*font-weight:bold;">Edit Profile<\/h2>/g,
  '<h2 style="font-size:18px; font-weight:bold; color: var(--text-main);">Edit Profile</h2>'
);

// Bump Cache
html = html.replace(/index\.css\?v=\d+/, "index.css?v=87");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=87");
fs.writeFileSync('public/customer/index.html', html);

// 2. UPDATE CSS
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Fix input-field focus color
css = css.replace(
  /\.input-field:focus\s*\{\s*background-color:\s*#dcdce0;\s*\}/g,
  '.input-field:focus {\n  background-color: #dcdce0;\n  color: #000000 !important;\n}'
);

fs.writeFileSync('public/css/index.css', css);

// BUMP SERVICE WORKER
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-v\d+/, 'dinspire-pwa-v21');
fs.writeFileSync('public/customer/sw.js', sw);

console.log("Fixed modal titles and input field focus color.");

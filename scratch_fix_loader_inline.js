const fs = require('fs');

let html = fs.readFileSync('public/customer/index.html', 'utf8');

// Replace the inline background color of the loader
html = html.replace(
  /id="preloader"[\s\S]*?background-color:\s*rgba\(255,\s*255,\s*255,\s*0\.75\);/,
  match => match.replace('rgba(255, 255, 255, 0.75)', 'rgba(0, 0, 0, 0.85)')
);

// Bump Cache
html = html.replace(/index\.css\?v=\d+/, "index.css?v=84");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=84");
fs.writeFileSync('public/customer/index.html', html);

// BUMP SERVICE WORKER
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-v\d+/, 'dinspire-pwa-v18');
fs.writeFileSync('public/customer/sw.js', sw);

console.log("Fixed inline loader background.");

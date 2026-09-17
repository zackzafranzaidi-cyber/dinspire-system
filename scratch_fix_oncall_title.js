const fs = require('fs');

let html = fs.readFileSync('public/customer/index.html', 'utf8');

// Use a more flexible regex to add color: var(--text-main);
html = html.replace(
  /style="font-size:\s*18px;\s*font-weight:\s*700;\s*margin-bottom:\s*4px"/g,
  'style="font-size: 18px; font-weight: 700; margin-bottom: 4px; color: var(--text-main);"'
);

// Bump Cache
html = html.replace(/index\.css\?v=\d+/, "index.css?v=85");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=85");
fs.writeFileSync('public/customer/index.html', html);

// BUMP SERVICE WORKER
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-v\d+/, 'dinspire-pwa-v19');
fs.writeFileSync('public/customer/sw.js', sw);

console.log("Fixed Barber OnCall title color.");

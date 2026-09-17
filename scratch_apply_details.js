const fs = require('fs');

// 1. UPDATE HTML
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// Detail 1: Barber OnCall title color
html = html.replace(
  /<h2 data-i18n="services-oncall-title" style="font-size: 18px; font-weight: 700; margin-bottom: 4px">/g,
  '<h2 data-i18n="services-oncall-title" style="font-size: 18px; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">'
);

// Detail 2: Done Checking button background
html = html.replace(
  /style="([\s\S]*?)background:\s*#111827;([\s\S]*?)"\s*onclick="closeModal\('edit-cart-modal'\)"/g,
  'style="$1background: var(--primary-blue);$2" onclick="closeModal(\'edit-cart-modal\')"'
);

// Detail 4: QR Text colors
html = html.replace(/color:\s*#1e293b;/g, 'color: var(--text-main);');
html = html.replace(/color:\s*#64748b;/g, 'color: var(--text-muted);');
html = html.replace(/color:\s*#4b5563;/g, 'color: var(--text-muted);');

// Detail 6: Intro Animation background
html = html.replace(
  /background-color:\s*#1877f2;/g,
  'background-color: #000000;'
);

// Bump Cache
html = html.replace(/index\.css\?v=\d+/, "index.css?v=82");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=82");
fs.writeFileSync('public/customer/index.html', html);

// 2. UPDATE CSS
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Detail 3: Notification Badge borders
css = css.replace(/border:\s*1\.5px\s*solid\s*white;/g, 'border: 1.5px solid var(--bg-surface);');

// Detail 5: Confirm Payment / Checkout Sheet background
css = css.replace(/\.checkout-sheet\s*\{[\s\S]*?background:\s*#f4f5f8;/g, match => match.replace('#f4f5f8', 'var(--bg-main)'));
css = css.replace(/\.checkout-header\s*\{[\s\S]*?background:\s*#f4f5f8;/g, match => match.replace('#f4f5f8', 'var(--bg-main)'));

// Detail 7: Thin the RGB line
css = css.replace(/\.rgb-border-container\s*\{[\s\S]*?padding:\s*1\.5px;/g, match => match.replace('1.5px', '1px'));

fs.writeFileSync('public/css/index.css', css);

console.log("Applied all detail fixes, changed intro background, and thinned RGB line.");

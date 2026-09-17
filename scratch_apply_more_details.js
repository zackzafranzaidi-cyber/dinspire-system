const fs = require('fs');

// 1. UPDATE CSS (index.css)
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Detail 1: Choose Schedule time panel background
css = css.replace(/\.schedule-time-panel\s*\{[\s\S]*?background:\s*#f0f4f9;/g, match => match.replace('#f0f4f9', 'var(--bg-main)'));

// Detail 3: Main Address & Payment Method icons
css = css.replace(/\.pm-icon,\s*\.si-icon\s*\{[\s\S]*?background:\s*#f9fafb;/g, match => match.replace('#f9fafb', 'var(--bg-input)'));

// Detail 4: Confirm Payment footer
css = css.replace(/\.checkout-footer\s*\{[\s\S]*?background:\s*#f4f5f8;/g, match => match.replace('#f4f5f8', 'var(--bg-main)'));

// Detail 5: Payment Success Screen (Background, Icon, Button)
css = css.replace(/\.success-screen\s*\{[\s\S]*?background:\s*#1877f2;/g, match => match.replace('#1877f2', 'var(--bg-main)'));
css = css.replace(/\.success-icon\s*\{[\s\S]*?background:\s*var\(--bg-surface\);\s*color:\s*#1877f2;/g, match => match.replace('var(--bg-surface)', 'var(--primary-blue)').replace('#1877f2', 'white'));
css = css.replace(/\.continue-btn\s*\{[\s\S]*?background:\s*var\(--bg-surface\);\s*color:\s*#1877f2;/g, match => match.replace('var(--bg-surface)', 'var(--primary-blue)').replace('#1877f2', 'white'));

fs.writeFileSync('public/css/index.css', css);

// 2. UPDATE LOADER CSS (loader.css)
let loader = fs.readFileSync('public/css/loader.css', 'utf8');
loader = loader.replace(/background-color:\s*rgba\(255,\s*255,\s*255,\s*0\.75\);/g, 'background-color: rgba(0, 0, 0, 0.85);');
fs.writeFileSync('public/css/loader.css', loader);

// 3. BUMP CACHE IN HTML
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/index\.css\?v=\d+/, "index.css?v=83");
html = html.replace(/loader\.css\?v=\d+/, "loader.css?v=4"); // Bump loader cache too!
fs.writeFileSync('public/customer/index.html', html);

// 4. BUMP SERVICE WORKER
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/dinspire-pwa-v\d+/, 'dinspire-pwa-v17');
fs.writeFileSync('public/customer/sw.js', sw);

console.log("Applied dark mode fixes to schedule panel, loader, checkout icons, footer, and reversed payment success screen.");

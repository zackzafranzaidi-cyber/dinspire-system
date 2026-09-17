const fs = require('fs');

// 1. Fix Profile Name color and Button shadows in HTML
let html = fs.readFileSync('public/customer/index.html', 'utf8');

// Fix profile name color
html = html.replace(/<h2 style="font-size: 18px; font-weight: 700" id="profile-name">/g, 
  '<h2 style="font-size: 18px; font-weight: 700; color: var(--text-main);" id="profile-name">');

// Fix Edit Profile button shadow
html = html.replace(/style="background:\s*var\(--bg-input\);\s*color:\s*var\(--text-main\);\s*width:\s*100%;\s*font-weight:\s*bold;\s*border:\s*1px\s*solid\s*var\(--border-color\);\s*border-radius:\s*12px;"/g,
  'style="background: var(--bg-input); color: var(--text-main); width: 100%; font-weight: bold; border: 1px solid var(--border-color); border-radius: 12px; box-shadow: none;"');

// Fix Logout button shadow
html = html.replace(/style="background:\s*var\(--bg-input\);\s*color:\s*#F87171;\s*width:\s*100%;\s*font-weight:\s*bold;\s*border:\s*none;\s*border-radius:\s*12px;"/g,
  'style="background: var(--bg-input); color: #F87171; width: 100%; font-weight: bold; border: none; border-radius: 12px; box-shadow: none;"');

// Bump cache
html = html.replace(/index\.css\?v=\d+/, "index.css?v=81");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=81");
fs.writeFileSync('public/customer/index.html', html);

// 2. Fix Nav Icons filter in CSS
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace(/\.nav-item:not\(\.active\)\s*\.icon-outline\s*\{\s*filter:\s*grayscale\(100%\)\s*opacity\(0\.5\);\s*\}/g,
`.nav-item:not(.active) .icon-outline {
  filter: brightness(0) invert(0.6);
}`);

fs.writeFileSync('public/css/index.css', css);

console.log("Fixed profile name color, button shadows, and nav icons visibility.");

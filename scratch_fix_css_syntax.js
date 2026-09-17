const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Replace the main :root
const newRoot = `:root {
  --bg-main: #000000;
  --bg-surface: #1C1C1E;
  --bg-input: #2C2C2E;
  --text-main: #F3F4F6;
  --text-muted: #9CA3AF;
  --primary-blue: #0A84FF;
  --border-color: #38383A;
  --star-color: #FFD60A;
  --btn-dark: #3A3A3C;
  --text-price: #D1D5DB;
}`;
css = css.replace(/:root\s*\{[\s\S]*?--text-price:\s*#a0a0a5;\s*\}/, newRoot);

// Remove the ENTIRE @media (prefers-color-scheme: dark) block safely
css = css.replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\}\s*\n\}\s*\n/, '');

// Replace body background
css = css.replace(/background-color:\s*#e2e8f0;/, 'background-color: #000000;');

fs.writeFileSync('public/css/index.css', css);

let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/index\.css\?v=\d+/, "index.css?v=79");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=79");
fs.writeFileSync('public/customer/index.html', html);

console.log("Fixed syntax error and applied global dark mode.");

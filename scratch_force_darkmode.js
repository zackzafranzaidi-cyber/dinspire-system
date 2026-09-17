const fs = require('fs');

let css = fs.readFileSync('public/css/index.css', 'utf8');

// The current root block:
/*
:root {
  --bg-main: #f4f5f8;
  --bg-surface: #ffffff;
  --bg-input: #e4e4e6;
  --text-main: #1c1c1e;
  --text-muted: #8e8e93;
  --primary-blue: #1877f2;
  --border-color: #e5e5ea;
  --star-color: #ffc107;
  --btn-dark: #5a5a5e;
  --text-price: #a0a0a5;
}
*/

// Replace the main :root variables with the dark mode ones
css = css.replace(
  /:root\s*\{[\s\S]*?--text-price:\s*#a0a0a5;\s*\}/,
  `:root {
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
}`
);

// Also change the global body background
css = css.replace(/body\s*\{[\s\S]*?background-color:\s*#e2e8f0;/, 'body {\n  touch-action: manipulation;\n  background-color: #000000;');

// Remove the @media prefers-color-scheme block to avoid duplication
css = css.replace(/@media \(prefers-color-scheme: dark\)\s*\{[\s\S]*?body\s*\{\s*background-color:\s*#000000;\s*\}\s*\}/, '');

fs.writeFileSync('public/css/index.css', css);

let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/index\.css\?v=\d+/, "index.css?v=78");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=78");
// Also update the theme-color meta tag for the status bar
html = html.replace(/<meta name="theme-color" content=".*?">/, '<meta name="theme-color" content="#000000">');
fs.writeFileSync('public/customer/index.html', html);

console.log("Forced Dark Mode globally.");

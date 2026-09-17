const fs = require('fs');

function replaceColors(content) {
  let text = content;
  // Replace hardcoded backgrounds
  text = text.replace(/background:\s*(white|#fff|#ffffff)/gi, 'background: var(--bg-surface)');
  text = text.replace(/background-color:\s*(white|#fff|#ffffff)/gi, 'background-color: var(--bg-surface)');
  text = text.replace(/background:\s*#f8fafc/gi, 'background: var(--bg-main)');
  text = text.replace(/background-color:\s*#f8fafc/gi, 'background-color: var(--bg-main)');
  
  // Replace text colors
  text = text.replace(/color:\s*#111827/gi, 'color: var(--text-main)');
  text = text.replace(/color:\s*#6b7280/gi, 'color: var(--text-muted)');
  text = text.replace(/color:\s*#374151/gi, 'color: var(--text-main)');
  text = text.replace(/color:\s*#9CA3AF/gi, 'color: var(--text-muted)');
  
  // Replace hardcoded borders
  text = text.replace(/border:\s*1px solid #E5E5EA/gi, 'border: 1px solid var(--border-color)');
  text = text.replace(/border-bottom:\s*1px solid #e5e5ea/gi, 'border-bottom: 1px solid var(--border-color)');
  text = text.replace(/border-top:\s*1px solid #e5e5ea/gi, 'border-top: 1px solid var(--border-color)');
  text = text.replace(/border-bottom:\s*1px solid #ddd/gi, 'border-bottom: 1px solid var(--border-color)');
  text = text.replace(/border:\s*1px dashed #cbd5e1/gi, 'border: 1px dashed var(--border-color)');
  text = text.replace(/border:\s*2px dashed #94a3b8/gi, 'border: 2px dashed var(--border-color)');
  text = text.replace(/background:\s*#e5e5ea/gi, 'background: var(--bg-input)'); // cart edit btn
  
  // Replace tailwind-like classes in JS literals
  text = text.replace(/class="(.*?)bg-white(.*?)"/g, 'class="$1$2" style="background: var(--bg-surface);"');
  
  return text;
}

// 1. Process JS
let js = fs.readFileSync('public/js/index.js', 'utf8');
js = replaceColors(js);
fs.writeFileSync('public/js/index.js', js);

// 2. Process HTML
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = replaceColors(html);
html = html.replace(/index\.css\?v=\d+/, "index.css?v=76");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=76");
fs.writeFileSync('public/customer/index.html', html);

// 3. Process CSS
let css = fs.readFileSync('public/css/index.css', 'utf8');
css = replaceColors(css);

const darkVars = `
@media (prefers-color-scheme: dark) {
  :root {
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
  }
  body {
    background-color: #000000;
  }
}
`;
css = css.replace(/(:root\s*\{[\s\S]*?\})/, `$1\n${darkVars}`);
fs.writeFileSync('public/css/index.css', css);

console.log("Applied OLED Dark Mode variables and replaced hardcoded colors.");

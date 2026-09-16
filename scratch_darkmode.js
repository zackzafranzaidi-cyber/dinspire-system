const fs = require('fs');

function replaceColors(content) {
  let text = content;
  text = text.replace(/background:\s*(white|#fff|#ffffff)/g, 'background: var(--bg-surface)');
  text = text.replace(/background-color:\s*(white|#fff|#ffffff)/g, 'background-color: var(--bg-surface)');
  text = text.replace(/background:\s*#f8fafc/g, 'background: var(--bg-main)');
  text = text.replace(/background-color:\s*#f8fafc/g, 'background-color: var(--bg-main)');
  
  text = text.replace(/color:\s*#111827/g, 'color: var(--text-main)');
  text = text.replace(/color:\s*#6b7280/g, 'color: var(--text-muted)');
  text = text.replace(/color:\s*#374151/g, 'color: var(--text-main)');
  text = text.replace(/color:\s*#9CA3AF/g, 'color: var(--text-muted)');
  
  text = text.replace(/border: 1px solid #e5e5ea/g, 'border: 1px solid var(--border-color)');
  text = text.replace(/border-bottom: 1px solid #e5e5ea/g, 'border-bottom: 1px solid var(--border-color)');
  text = text.replace(/border-top: 1px solid #e5e5ea/g, 'border-top: 1px solid var(--border-color)');
  
  return text;
}

let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = replaceColors(html);
html = html.replace(/index\.css\?v=\d+/, "index.css?v=73");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=73");
fs.writeFileSync('public/customer/index.html', html);

let css = fs.readFileSync('public/css/index.css', 'utf8');
css = replaceColors(css);

// Insert @media (prefers-color-scheme: dark) at the top right after :root {}
const darkVars = `
@media (prefers-color-scheme: dark) {
  :root {
    --bg-main: #0F172A;
    --bg-surface: #1E293B;
    --bg-input: #334155;
    --text-main: #F8FAFC;
    --text-muted: #94A3B8;
    --primary-blue: #3B82F6;
    --border-color: #334155;
    --star-color: #FBBF24;
    --btn-dark: #475569;
    --text-price: #94A3B8;
  }
  body {
    background-color: #020617; /* Darker outer bg */
  }
}
`;

css = css.replace(/(:root\s*\{[\s\S]*?\})/, `$1\n${darkVars}`);

fs.writeFileSync('public/css/index.css', css);
console.log("Applied dark mode variables and replaced hardcoded colors.");

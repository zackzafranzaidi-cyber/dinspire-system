const fs = require('fs');

function replaceColors(content) {
  let text = content;
  text = text.replace(/background:\s*(white|#fff|#ffffff)/gi, 'background: var(--bg-surface)');
  text = text.replace(/background-color:\s*(white|#fff|#ffffff)/gi, 'background-color: var(--bg-surface)');
  text = text.replace(/background:\s*#f8fafc/gi, 'background: var(--bg-main)');
  text = text.replace(/background-color:\s*#f8fafc/gi, 'background-color: var(--bg-main)');
  
  text = text.replace(/color:\s*#111827/gi, 'color: var(--text-main)');
  text = text.replace(/color:\s*#6b7280/gi, 'color: var(--text-muted)');
  text = text.replace(/color:\s*#374151/gi, 'color: var(--text-main)');
  text = text.replace(/color:\s*#9CA3AF/gi, 'color: var(--text-muted)');
  
  text = text.replace(/border:\s*1px solid #E5E5EA/gi, 'border: 1px solid var(--border-color)');
  text = text.replace(/border-bottom:\s*1px solid #e5e5ea/gi, 'border-bottom: 1px solid var(--border-color)');
  text = text.replace(/border-top:\s*1px solid #e5e5ea/gi, 'border-top: 1px solid var(--border-color)');
  text = text.replace(/border-bottom:\s*1px solid #ddd/gi, 'border-bottom: 1px solid var(--border-color)');
  
  text = text.replace(/bg-white/g, ''); // Tailwind class bg-white in JS templates shouldn't just be removed, wait.
  // Actually, replacing `bg-white` with `bg-[var(--bg-surface)]` or just removing it if it's already styled.
  // Let's replace bg-white with a style or let CSS handle it.
  return text;
}

let js = fs.readFileSync('public/js/index.js', 'utf8');
js = replaceColors(js);
// Handle specific tailwind classes inside JS strings like `bg-white` in qty buttons
js = js.replace(/class="(.*?)bg-white(.*?)"/g, 'class="$1$2" style="background: var(--bg-surface);"');

fs.writeFileSync('public/js/index.js', js);
console.log("Replaced colors in JS.");

let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/index\.css\?v=\d+/, "index.css?v=74");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=74");
fs.writeFileSync('public/customer/index.html', html);

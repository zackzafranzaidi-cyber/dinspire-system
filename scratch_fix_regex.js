const fs = require('fs');

function fixBrokenRegex(file) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/var\(--bg-surface\)fff/g, 'var(--bg-surface)');
  fs.writeFileSync(file, text);
}

fixBrokenRegex('public/css/index.css');
fixBrokenRegex('public/customer/index.html');
fixBrokenRegex('public/js/index.js');

let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/index\.css\?v=\d+/, "index.css?v=77");
html = html.replace(/index\.js\?v=\d+/, "index.js?v=77");
fs.writeFileSync('public/customer/index.html', html);

console.log("Fixed broken regex replacement.");

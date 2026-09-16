const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

const regex = /<div class="search-box">\s*<input/g;
const replacement = `<div class="search-box" style="box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid var(--border-color); background: #ffffff;">
              <i class="fas fa-search" style="color: #9CA3AF; margin-left: 4px;"></i>
              <input`;

html = html.replace(regex, replacement);
fs.writeFileSync('public/customer/index.html', html);
console.log("Replaced search box.");

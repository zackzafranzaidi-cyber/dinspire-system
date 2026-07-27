const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// First, remove the top bar I added earlier
html = html.replace(/<div style="display: flex; justify-content: flex-end; padding: 12px 20px 0; background: var\(--bg-surface\);">[\s\S]*?<\/div>/, '');

// Now replace each header
const headerRegex = /<div class="header">\s*<h1([\s\S]*?)<\/h1>\s*<div class="location"([^>]*)>([^<]*)<\/div>\s*<\/div>/g;

html = html.replace(headerRegex, (match, h1Content, locAttr, locText) => {
  return `<div class="header">
              <div>
                <h1${h1Content}</h1>
                <div class="location"${locAttr}>${locText}</div>
              </div>
              <button class="lang-btn" onclick="toggleLanguage()">
                <span class="lang-indicator">EN</span> <i class="fas fa-language"></i>
              </button>
            </div>`;
});

fs.writeFileSync('public/index.html', html);
console.log("Updated headers");

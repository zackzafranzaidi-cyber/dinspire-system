const fs = require('fs');
const html = fs.readFileSync('public/customer/index.html', 'utf8');

// Check what the preloader looks like - it might be blocking the view
const preloaderIdx = html.indexOf('id="preloader"');
console.log('=== PRELOADER HTML ===');
console.log(html.substring(preloaderIdx - 100, preloaderIdx + 500));

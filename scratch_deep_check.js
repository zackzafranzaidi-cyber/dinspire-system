const fs = require('fs');
const html = fs.readFileSync('public/customer/index.html', 'utf8');

// Check if there's a visibility:hidden or display:none initially
const preloaderIdx = html.indexOf('id="preloader"');
const preloaderLine = html.substring(preloaderIdx - 20, preloaderIdx + 300);

// Does it have visibility: hidden initially? No - it's visible by default
console.log('Preloader has display:flex - it shows immediately');

// THE REAL ISSUE: Let's check if the script is actually loaded and executed
// Check the script tag location vs the preloader
const scriptTag = html.indexOf('customer.js');
const preloaderDiv = html.indexOf('id="preloader"');
console.log('Script tag at char:', scriptTag);
console.log('Preloader at char:', preloaderDiv);
console.log('Script BEFORE preloader:', scriptTag < preloaderDiv);

// Check: is there a second DOMContentLoaded that might clobber the first?
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const matches = js.match(/DOMContentLoaded/g);
console.log('DOMContentLoaded occurrences:', matches ? matches.length : 0);

// Check: does the i18n-index.js exist and load properly?
const i18nExists = fs.existsSync('public/customer/js/i18n-index.js');
console.log('i18n-index.js exists:', i18nExists);

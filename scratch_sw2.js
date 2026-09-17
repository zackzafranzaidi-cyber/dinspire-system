const fs = require('fs');
let sw = fs.readFileSync('public/customer/sw.js', 'utf8');

const regex = /const urlsToCache = \[[\s\S]*?\];/;
const newUrls = `const urlsToCache = [
  '/',
  '/index.html',
  '/css/index.css',
  '/css/loader.css',
  '/js/index.js',
  '/js/i18n-index.js'
];`;

sw = sw.replace(regex, newUrls);
fs.writeFileSync('public/customer/sw.js', sw);
console.log("Fixed urlsToCache in customer sw.js");

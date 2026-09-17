const fs = require('fs');
let sw = fs.readFileSync('public/owner/sw.js', 'utf8');

const regex = /const urlsToCache = \[[\s\S]*?\];/;
const newUrls = `const urlsToCache = [
  './',
  './index.html',
  './css/owner.css',
  './css/owner_cms.css',
  './css/loader.css',
  './js/owner.js',
  './js/owner_cms.js'
];`;

sw = sw.replace(regex, newUrls);
fs.writeFileSync('public/owner/sw.js', sw);
console.log("Fixed urlsToCache in owner sw.js");

const fs = require('fs');

['public/owner'].forEach(dir => {
  let htmlPath = dir + '/index.html';
  if (!fs.existsSync(htmlPath)) return;
  
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/\?v=(\d+)/g, (match, p1) => '?v=' + (parseInt(p1) + 1));
  fs.writeFileSync(htmlPath, html);
  
  let swPath = dir + '/sw.js';
  if (fs.existsSync(swPath)) {
    let sw = fs.readFileSync(swPath, 'utf8');
    sw = sw.replace(/(CACHE_NAME\s*=\s*['"][\w-]+-v)(\d+)(['"])/, (match, p1, p2, p3) => p1 + (parseInt(p2) + 1) + p3);
    fs.writeFileSync(swPath, sw);
  }
});
console.log('Cache versions bumped for owner app');

const fs = require('fs');

let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Find the start of fetchShopData
const functionStart = js.indexOf('async function fetchShopData() {');
const endOfLoop = js.indexOf('try {', functionStart + 30);

const replacement = `async function fetchShopData() {
  showGlobalLoader();
  let success = false;
  let retries = 0;
  while (!success && retries < 3) {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(\`\${API_BASE_URL}/shop-data?t=\${timestamp}\`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      shopData = await res.json();
      success = true;
    } catch (err) {
      retries++;
      console.warn("Sedang memuatkan pangkalan data (Cold Start)... Percubaan " + retries, err.message);
      if (retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        alert("Gagal berhubung dengan pelayan (" + err.message + "). Sila pastikan line internet Tuan okay.");
        hideGlobalLoader();
        return;
      }
    }
  }
  
  `;

// Replace it!
js = js.substring(0, functionStart) + replacement + js.substring(endOfLoop);
fs.writeFileSync('public/customer/js/customer.js', js);
console.log("Replaced successfully!");

let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace(/\?v=(\d+)/g, (match, p1) => '?v=' + (parseInt(p1) + 1));
fs.writeFileSync('public/customer/index.html', html);

let sw = fs.readFileSync('public/customer/sw.js', 'utf8');
sw = sw.replace(/(CACHE_NAME\s*=\s*['"][\w-]+-v)(\d+)(['"])/, (match, p1, p2, p3) => p1 + (parseInt(p2) + 1) + p3);
fs.writeFileSync('public/customer/sw.js', sw);


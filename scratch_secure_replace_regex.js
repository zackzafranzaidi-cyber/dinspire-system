const fs = require('fs');
let js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

const regex = /async function fetchShopData\(\) \{[\s\S]*?try \{[\s\r\n]+let bOpts/m;

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
      console.warn("Sedang memuatkan pangkalan data (Cold Start)...", err.message);
      if (retries < 3) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        alert("Gagal berhubung dengan pelayan. Sila pastikan internet Tuan okay.");
        hideGlobalLoader();
        return; // Stop rendering
      }
    }
  }
  
  try {
    let bOpts`;

if (regex.test(js)) {
    js = js.replace(regex, replacement);
    fs.writeFileSync('public/customer/js/customer.js', js);
    console.log("Successfully replaced fetchShopData loop securely using regex!");
} else {
    console.log("Regex failed to match!");
}

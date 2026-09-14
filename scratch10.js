const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const newFetchMarketing = `async function fetchMarketingData(silent = false) {
  if (!silent) showGlobalLoader();
  try {
    const res = await fetch(\`\${API_BASE_URL}/owner/marketing-customers\`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch marketing data");
    marketingCustomers = await res.json();
    renderMarketingTable();
    updateOwnerBadges();
  } catch (err) {
    console.error(err);
    document.getElementById("table-marketing").innerHTML = \`<div class="text-center p-4 text-red-500">Gagal memuat turun data pelanggan.</div>\`;
  } finally {
    if (!silent) hideGlobalLoader();
  }
}`;

code = code.replace(/async function fetchMarketingData\(\)\s*\{[\s\S]*?(?=\nwindow.markWaClicked)/, newFetchMarketing + '\n');
fs.writeFileSync('public/js/owner.js', code);

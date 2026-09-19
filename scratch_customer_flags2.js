const fs = require('fs');

const updateJS = (file, portalName) => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the old shopData.feature_flags check
  content = content.replace(/\/\/ Check Switchboard Flags[\s\S]*?hideGlobalLoader\(\);\s*return;\s*}\s*}\s*}/g, '');
  content = content.replace(/\/\/ Check Switchboard Flags[\s\S]*?return;\s*}\s*}\s*}/g, '');
  
  const newFlagCheck = `
    // Check Real-time Feature Flags (NO CACHE)
    try {
      const flagRes = await fetch(\`\${API_BASE_URL}/shop-data/flags\`);
      const flagData = await flagRes.json();
      if (flagData.flags) {
        if (flagData.flags.maintenance_mode === true || flagData.flags.${portalName}_portal === false) {
          document.body.innerHTML = \`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#111;color:#fff;text-align:center;padding:20px;font-family:sans-serif;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;color:#facc15;margin-bottom:20px;"></i>
              <h1 style="font-size:1.5rem;font-weight:bold;margin-bottom:10px;">Portal Ditutup Sementara</h1>
              <p style="color:#aaa;line-height:1.5;">Pembangun sedang menyelenggara pangkalan data atau perisian sistem.<br>Sila kembali sebentar lagi.</p>
            </div>
          \`;
          if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
          return;
        }
      }
    } catch(e) { console.error("Flag check failed", e); }
  `;
  
  // Insert at the VERY BEGINNING of the initialization function
  // Look for `async function initApp() {` or similar
  content = content.replace('async function initCustomerApp() {', 'async function initCustomerApp() {\n' + newFlagCheck);
  content = content.replace('async function initStaffApp() {', 'async function initStaffApp() {\n' + newFlagCheck);
  
  fs.writeFileSync(file, content);
  console.log('Updated flags logic in', file);
};

updateJS('public/customer/js/customer.js', 'customer');
updateJS('public/staff/js/staff.js', 'staff');

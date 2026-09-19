const fs = require('fs');
let content = fs.readFileSync('public/customer/js/customer.js', 'utf8');

const flagCheckCode = `
    // Check Switchboard Flags
    if (shopData.feature_flags) {
      if (shopData.feature_flags.maintenance_mode === true || shopData.feature_flags.customer_portal === false) {
        document.body.innerHTML = \`
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#111;color:#fff;text-align:center;padding:20px;font-family:sans-serif;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;color:#facc15;margin-bottom:20px;"></i>
            <h1 style="font-size:1.5rem;font-weight:bold;margin-bottom:10px;">Portal Ditutup Sementara</h1>
            <p style="color:#aaa;line-height:1.5;">Pembangun sedang menyelenggara pangkalan data atau perisian sistem.<br>Sila kembali sebentar lagi.</p>
          </div>
        \`;
        hideGlobalLoader();
        return;
      }
    }
`;

// Insert it right after shopData is fetched
content = content.replace('if (!shopData) return;', 'if (!shopData) return;\n' + flagCheckCode);
fs.writeFileSync('public/customer/js/customer.js', content);
console.log('Added UI flag check to customer.js');

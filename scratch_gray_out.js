const fs = require('fs');
let content = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// 1. Store flags globally and gray out icons
const newFlagCheck = `
    // Check Real-time Feature Flags (NO CACHE)
    try {
      const flagRes = await fetch(\`\${API_BASE_URL}/shop-data/flags\`);
      const flagData = await flagRes.json();
      if (flagData.flags) {
        window.dinspireFlags = flagData.flags; // Simpan untuk switchView
        
        if (flagData.flags.maintenance_mode === true || flagData.flags.customer_portal === false) {
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

        // Gray out Booking
        if (flagData.flags.booking === false) {
          ['nav-services', 'desktop-nav-services', 'sidebar-nav-services'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
               el.style.opacity = '0.3';
               el.style.filter = 'grayscale(100%)';
            }
          });
          document.querySelectorAll('.btn-home-book').forEach(el => {
              el.style.opacity = '0.5';
              el.style.pointerEvents = 'none';
              el.innerHTML = '<i class="fa-solid fa-lock"></i> Diselenggara';
          });
        }

        // Gray out E-commerce
        if (flagData.flags.ecommerce === false) {
          ['nav-products', 'desktop-nav-products', 'sidebar-nav-products'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
               el.style.opacity = '0.3';
               el.style.filter = 'grayscale(100%)';
            }
          });
        }
      }
    } catch(e) { console.error("Flag check failed", e); }
`;

content = content.replace(/\/\/ Check Real-time Feature Flags \(NO CACHE\)[\s\S]*?\} catch\(e\) \{ console\.error\("Flag check failed", e\); \}/, newFlagCheck);

// 2. Prevent switchView
const newSwitchView = `
  function switchView(id) {
    if (id === "services" && window.dinspireFlags && window.dinspireFlags.booking === false) {
      if(typeof showToast === 'function') showToast("Fungsi Tempahan sedang diselenggara.");
      return;
    }
    if (id === "products" && window.dinspireFlags && window.dinspireFlags.ecommerce === false) {
      if(typeof showToast === 'function') showToast("E-Commerce sedang diselenggara.");
      return;
    }
`;
content = content.replace('function switchView(id) {', newSwitchView);

fs.writeFileSync('public/customer/js/customer.js', content);
console.log('Customer UI gray out applied');

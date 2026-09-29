const fs = require('fs');
let content = fs.readFileSync('public/customer/js/customer.js', 'utf8');

const newFlagCheck = `
    // Check Real-time Feature Flags (NO CACHE)
    try {
      const flagRes = await fetch(\`\${API_BASE_URL}/shop-data/flags?t=\${new Date().getTime()}\`, { cache: 'no-store' });
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
        ['nav-services', 'desktop-nav-services', 'sidebar-nav-services'].forEach(id => {
          const el = document.getElementById(id);
          if(el) {
             if (flagData.flags.booking === false) {
               el.style.opacity = '0.3';
               el.style.filter = 'grayscale(100%)';
             } else {
               el.style.opacity = '1';
               el.style.filter = 'none';
             }
          }
        });
        document.querySelectorAll('.btn-home-book').forEach(el => {
            if (flagData.flags.booking === false) {
              el.style.opacity = '0.5';
              el.style.pointerEvents = 'none';
              el.innerHTML = '<i class="fa-solid fa-lock"></i> Diselenggara';
            } else {
              el.style.opacity = '1';
              el.style.pointerEvents = 'auto';
              // If it's true, we leave the HTML alone (or set it back, but it's hard to know the original text. Let's assume it was Tempah Servis)
              if (el.innerHTML.includes('Diselenggara')) {
                 el.innerHTML = 'Tempah Servis';
              }
            }
        });

        // Gray out E-commerce
        ['nav-products', 'desktop-nav-products', 'sidebar-nav-products'].forEach(id => {
          const el = document.getElementById(id);
          if(el) {
             if (flagData.flags.ecommerce === false) {
               el.style.opacity = '0.3';
               el.style.filter = 'grayscale(100%)';
             } else {
               el.style.opacity = '1';
               el.style.filter = 'none';
             }
          }
        });
      }
    } catch(e) { console.error("Flag check failed", e); }
`;

content = content.replace(/\/\/ Check Real-time Feature Flags \(NO CACHE\)[\s\S]*?\} catch\(e\) \{ console\.error\("Flag check failed", e\); \}/, newFlagCheck);

fs.writeFileSync('public/customer/js/customer.js', content);
console.log('Customer UI gray out revert logic applied');

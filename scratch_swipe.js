const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const regexRender = /function renderDesktopCartItems\(\) \{[\s\S]*?listContainer\.innerHTML = html;\s*\}/;

const newRender = `function renderDesktopCartItems() {
      const listContainer = document.getElementById("desktop-cart-items-container");
      if (!listContainer) return;
      
      if (Object.keys(cartState).length === 0) {
        listContainer.innerHTML = \`<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#9CA3AF; text-align:center; padding:20px;">
          <i class="fas fa-shopping-basket" style="font-size:32px; margin-bottom:12px; color:#D1D5DB;"></i>
          <p style="font-size:14px; font-weight:500;">Troli anda kosong</p>
          <p style="font-size:12px; margin-top:4px;">Sila pilih produk di sebelah.</p>
        </div>\`;
        return;
      }
    
      let html = "";
      for (let id in cartState) {
        let item = cartState[id];
        html += \`<div style="position: relative; border-radius:12px; overflow: hidden; min-height: 70px; border:1px solid #E5E5EA;">
              <div style="position: absolute; right: 0; top: 0; height: 100%; width: 80px; background: #FF3B30; color: white; display: flex; justify-content: center; align-items: center; font-weight: normal; font-size: 13px; cursor: pointer;" onclick="deleteEditCartItem('\${id}')">\${i18n_index[currentLang]["cart-delete-btn"]}</div>
              <div id="swipe-content-desktop-\${id}" 
                   ontouchstart="handleTouchStart(event, 'desktop-\${id}')" ontouchmove="handleTouchMove(event, 'desktop-\${id}')" ontouchend="handleTouchEnd(event, 'desktop-\${id}')"
                   onmousedown="handleTouchStart(event, 'desktop-\${id}')" onmousemove="handleTouchMove(event, 'desktop-\${id}')" onmouseup="handleTouchEnd(event, 'desktop-\${id}')" onmouseleave="handleTouchEnd(event, 'desktop-\${id}')"
                   style="position: relative; background: #fff; z-index: 1; display:flex; justify-content:space-between; align-items:center; padding:12px; width: 100%; box-sizing: border-box; transition: transform 0.3s ease; cursor: grab;">
                  <div style="display:flex; gap:10px; align-items:center;">
                      <img src="\${item.imgUrl || "https://via.placeholder.com/40"}" style="width:45px; height:45px; border-radius:8px; object-fit:cover; pointer-events: none;">
                      <div>
                          <div style="font-weight:600; font-size:13px; color:#111827;">\${escapeHTML(item.name)}</div>
                          <div style="color:var(--primary-blue); font-size:12px; font-weight:700; margin-top:2px;">RM \${parseFloat(item.price).toFixed(2)}</div>
                      </div>
                  </div>
                  <div class="qty-control" style="width:75px; flex:none; display:flex; align-items:center; justify-content:space-between; background:#F3F4F6; border-radius:8px; padding:4px;">
                      <button type="button" class="qty-btn" style="width:28px; height:28px; border-radius:4px; background:white; font-weight:bold; color:#374151; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:none;" onclick="updateEditCartQty('\${id}', -1)">-</button>
                      <span class="qty-num" style="font-size:12px; font-weight:bold; text-align:center; width:20px;">\${item.qty}</span>
                      <button type="button" class="qty-btn" style="width:28px; height:28px; border-radius:4px; background:white; font-weight:bold; color:#374151; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:none;" onclick="updateEditCartQty('\${id}', 1)">+</button>
                  </div>
              </div>
          </div>\`;
      }
      listContainer.innerHTML = html;
    }`;

js = js.replace(regexRender, newRender);
fs.writeFileSync('public/js/index.js', js);
console.log("Updated desktop render to include swipe functionality.");

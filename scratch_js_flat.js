const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const regexDesktopItem = /html \+= \`<div style="position: relative; border-radius:12px; overflow: hidden; min-height: 70px; border:1px solid #E5E5EA;">[\s\S]*?<\/div>\`;/;
const newDesktopItem = `html += \`<div style="position: relative; overflow: hidden; min-height: 75px; border-bottom:1px solid #E5E5EA;">
              <div style="position: absolute; right: 0; top: 0; height: 100%; width: 80px; background: #FF3B30; color: white; display: flex; justify-content: center; align-items: center; font-weight: normal; font-size: 13px; cursor: pointer;" onclick="deleteEditCartItem('\${id}')">\${i18n_index[currentLang]["cart-delete-btn"]}</div>
              <div id="swipe-content-desktop-\${id}" 
                   ontouchstart="handleTouchStart(event, 'desktop-\${id}')" ontouchmove="handleTouchMove(event, 'desktop-\${id}')" ontouchend="handleTouchEnd(event, 'desktop-\${id}')"
                   onmousedown="handleTouchStart(event, 'desktop-\${id}')" onmousemove="handleTouchMove(event, 'desktop-\${id}')" onmouseup="handleTouchEnd(event, 'desktop-\${id}')" onmouseleave="handleTouchEnd(event, 'desktop-\${id}')"
                   style="position: relative; background: #f8fafc; z-index: 1; display:flex; justify-content:space-between; align-items:center; padding:15px 25px; width: 100%; box-sizing: border-box; transition: transform 0.3s ease; cursor: grab;">
                  <div style="display:flex; gap:12px; align-items:center;">
                      <img src="\${item.imgUrl || "https://via.placeholder.com/40"}" style="width:45px; height:45px; border-radius:8px; object-fit:cover; pointer-events: none; border:1px solid #E5E5EA;">
                      <div>
                          <div style="font-weight:600; font-size:13px; color:#111827;">\${escapeHTML(item.name)}</div>
                          <div style="color:var(--primary-blue); font-size:12px; font-weight:700; margin-top:2px;">RM \${parseFloat(item.price).toFixed(2)}</div>
                      </div>
                  </div>
                  <div class="qty-control" style="width:75px; flex:none; display:flex; align-items:center; justify-content:space-between; background:white; border:1px solid #E5E5EA; border-radius:8px; padding:4px;">
                      <button type="button" class="qty-btn" style="width:28px; height:28px; border-radius:4px; background:white; font-weight:bold; color:#374151; border:none;" onclick="updateEditCartQty('\${id}', -1)">-</button>
                      <span class="qty-num" style="font-size:12px; font-weight:bold; text-align:center; width:20px;">\${item.qty}</span>
                      <button type="button" class="qty-btn" style="width:28px; height:28px; border-radius:4px; background:white; font-weight:bold; color:#374151; border:none;" onclick="updateEditCartQty('\${id}', 1)">+</button>
                  </div>
              </div>
          </div>\`;`;

js = js.replace(regexDesktopItem, newDesktopItem);
fs.writeFileSync('public/js/index.js', js);
console.log("Updated JS for full-width flat cart items.");

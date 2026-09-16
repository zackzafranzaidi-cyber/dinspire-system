const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const injection = `
  function renderDesktopCartItems() {
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
      html += \`<div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:white; border-radius:12px; border:1px solid #E5E5EA;">
        <div style="display:flex; gap:10px; align-items:center;">
            <img src="\${item.imgUrl || "https://via.placeholder.com/40"}" style="width:45px; height:45px; border-radius:8px; object-fit:cover;">
            <div>
                <div style="font-weight:600; font-size:13px; color:#111827;">\${escapeHTML(item.name)}</div>
                <div style="color:var(--primary-blue); font-size:12px; font-weight:700; margin-top:2px;">RM \${parseFloat(item.price).toFixed(2)}</div>
            </div>
        </div>
        <div class="qty-control flex items-center justify-between bg-gray-100 rounded-lg p-1" style="width:75px; flex:none;">
            <button type="button" class="qty-btn w-7 h-7 rounded bg-white font-bold text-gray-700 shadow-sm" onclick="updateEditCartQty('\${id}', -1)">-</button>
            <span class="qty-num text-xs font-bold text-center w-5">\${item.qty}</span>
            <button type="button" class="qty-btn w-7 h-7 rounded bg-white font-bold text-gray-700 shadow-sm" onclick="updateEditCartQty('\${id}', 1)">+</button>
        </div>
      </div>\`;
    }
    listContainer.innerHTML = html;
  }
`;

const targetUI = `if (totalItems > 0) {
      document.getElementById("checkout-bar").classList.add("visible");
    } else {
      document.getElementById("checkout-bar").classList.remove("visible");
    }`;

if (js.includes(targetUI)) {
    js = js.replace(targetUI, targetUI + "\n    renderDesktopCartItems();");
    
    // Also inject the function at the end or near it
    js += injection;
    
    fs.writeFileSync('public/js/index.js', js);
    console.log("Injected desktop cart renderer.");
} else {
    console.log("Could not find targetUI in index.js");
}

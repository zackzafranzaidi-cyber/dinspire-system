const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const regexDesktopHtml = /<div class="qty-control flex items-center justify-between bg-gray-100 rounded-lg p-1" style="width:75px; flex:none;">[\s\S]*?<\/div>/;

const newDesktopHtml = `<div class="qty-control" style="width:75px; flex:none; display:flex; align-items:center; justify-content:space-between; background:#F3F4F6; border-radius:8px; padding:4px;">
            <button type="button" class="qty-btn" style="width:28px; height:28px; border-radius:4px; background:white; font-weight:bold; color:#374151; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:none;" onclick="updateEditCartQty('\${id}', -1)">-</button>
            <span class="qty-num" style="font-size:12px; font-weight:bold; text-align:center; width:20px;">\${item.qty}</span>
            <button type="button" class="qty-btn" style="width:28px; height:28px; border-radius:4px; background:white; font-weight:bold; color:#374151; box-shadow:0 1px 2px rgba(0,0,0,0.05); border:none;" onclick="updateEditCartQty('\${id}', 1)">+</button>
        </div>`;

js = js.replace(regexDesktopHtml, newDesktopHtml);
fs.writeFileSync('public/js/index.js', js);
console.log("Updated inline styles for desktop cart items.");

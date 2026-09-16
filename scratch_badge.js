const fs = require('fs');
let js = fs.readFileSync('public/js/index.js', 'utf8');

const oldBadge = "stockBadge = `<div style=\"position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold; z-index:11;\">Baki Stok: ${stockLeft}</div>`;";
const newBadge = "stockBadge = `<div style=\"position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.65); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); color:#fff; font-size:9.5px; padding:4px 8px; border-radius:8px; font-weight:700; z-index:11; display:flex; align-items:center; gap:4px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 10px rgba(0,0,0,0.2);\"><i class=\"fas fa-box-open text-purple-400\"></i> Stok: ${stockLeft}</div>`;";

if (js.includes(oldBadge)) {
    js = js.replace(oldBadge, newBadge);
    fs.writeFileSync('public/js/index.js', js);
    console.log("Updated stock badge.");
} else {
    console.log("Could not find stock badge string.");
}

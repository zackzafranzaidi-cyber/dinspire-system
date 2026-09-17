const fs = require('fs');

// Revert index.html
let html = fs.readFileSync('public/customer/index.html', 'utf8');
html = html.replace('<a id="dynamic-qr-link" href="/qr.png" download="QR_Dinspire.png">', '<a href="/QR_download.PNG" download="QR_download.PNG">');
html = html.replace('<img id="dynamic-qr-img" src="/qr.png" style="width: 150px;', '<img src="/qr.png" style="width: 150px;');
fs.writeFileSync('public/customer/index.html', html);

// Revert index.js
let js = fs.readFileSync('public/customer/js/index.js', 'utf8');
js = js.replace('function openCheckout(type) {\n  setTimeout(updateDynamicQR, 100);', 'function openCheckout(type) {');
js = js.replace('function selectPaymentMethod(method) {\n  if(method === "qr") updateDynamicQR();', 'function selectPaymentMethod(method) {');

// We can leave the generateDynamicDuitNow function there, it won't hurt, but let's remove it to keep it clean.
const qrLogicStart = js.indexOf('// ==========================================');
const qrLogicEnd = js.indexOf('}', js.indexOf('if(qrDownloadLink) qrDownloadLink.href = qrUrl;')) + 1;
if (qrLogicStart !== -1 && qrLogicEnd !== -1) {
    js = js.substring(0, qrLogicStart) + js.substring(qrLogicEnd);
}
fs.writeFileSync('public/customer/js/index.js', js);
console.log("Reverted QR logic");

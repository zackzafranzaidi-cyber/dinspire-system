const fs = require('fs');
let js = fs.readFileSync('public/customer/js/index.js', 'utf8');

const dynamicQrLogic = `
// ==========================================
// DYNAMIC DUITNOW QR GENERATOR
// ==========================================
function generateDynamicDuitNow(amount) {
  let baseStr = "00020201021126420014A000000615000101066033460210MD001712895204723053034585802MY5917DIEYN BARBERSHOP 6002MY62730325176576767190600620138800005201765767683838002566307161765767037979009";
  baseStr = baseStr.replace("010211", "010212");
  let amountStr = amount.toFixed(2);
  let tag54 = "54" + amountStr.length.toString().padStart(2, '0') + amountStr;
  baseStr = baseStr.replace("5802MY", tag54 + "5802MY");
  let strToCrc = baseStr + "6304";
  
  let crc = 0xFFFF;
  for (let i = 0; i < strToCrc.length; i++) {
    crc ^= strToCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  let crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return strToCrc + crcHex;
}

function updateDynamicQR() {
  const qrImg = document.getElementById("dynamic-qr-img");
  const qrDownloadLink = document.getElementById("dynamic-qr-link");
  if (!qrImg) return;
  const totalText = document.getElementById("checkout-total-price").innerText;
  const amount = parseFloat(totalText.replace(/[^0-9.]/g, ''));
  if (isNaN(amount) || amount <= 0) return;
  
  const qrString = generateDynamicDuitNow(amount);
  const qrUrl = "https://quickchart.io/qr?size=300&text=" + encodeURIComponent(qrString);
  qrImg.src = qrUrl;
  if(qrDownloadLink) qrDownloadLink.href = qrUrl;
}
`;

if (!js.includes('function generateDynamicDuitNow')) {
    js = js + '\n' + dynamicQrLogic;
    js = js.replace('function openCheckout(type) {', 'function openCheckout(type) {\n  setTimeout(updateDynamicQR, 100);');
    js = js.replace('function selectPaymentMethod(method) {', 'function selectPaymentMethod(method) {\n  if(method === "qr") updateDynamicQR();');
    fs.writeFileSync('public/customer/js/index.js', js);
    console.log("Injected dynamic QR into index.js");
} else {
    console.log("Already injected.");
}

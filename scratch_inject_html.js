const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

html = html.replace(
  '<a href="/QR_download.PNG" download="QR_download.PNG">',
  '<a id="dynamic-qr-link" href="/qr.png" download="QR_Dinspire.png">'
);
html = html.replace(
  '<img src="/qr.png" style="width: 150px;',
  '<img id="dynamic-qr-img" src="/qr.png" style="width: 150px;'
);
fs.writeFileSync('public/customer/index.html', html);
console.log("Updated HTML with QR IDs");

const fs = require('fs');
const jsQR = require('jsqr');
const Jimp = require('jimp');

Jimp.read('public/qr.png').then(image => {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const imgData = new Uint8ClampedArray(image.bitmap.data);
  const code = jsQR(imgData, width, height);
  
  if (code) {
    console.log("FOUND QR DATA:", code.data);
  } else {
    console.log("NO QR FOUND");
  }
}).catch(err => {
  console.error(err);
});

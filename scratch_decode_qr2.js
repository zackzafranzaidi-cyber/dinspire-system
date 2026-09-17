const fs = require('fs');
const PNG = require('pngjs').PNG;
const jsQR = require('jsqr');

fs.createReadStream('public/qr.png')
  .pipe(new PNG())
  .on('parsed', function() {
    const code = jsQR(this.data, this.width, this.height);
    if (code) {
      console.log("FOUND QR DATA:", code.data);
    } else {
      console.log("NO QR FOUND");
    }
  });

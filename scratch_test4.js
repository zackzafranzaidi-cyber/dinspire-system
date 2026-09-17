const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const idx = js.indexOf('setupOtpInputs("log-otp-inputs", "log-otp");');
console.log(js.substring(idx - 1000, idx + 200));

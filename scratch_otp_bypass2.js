const fs = require('fs');
let authJs = fs.readFileSync('routes/auth.js', 'utf8');

if (!authJs.includes('otp_bypass')) {
    authJs = authJs.replace(
        /const otpCode = crypto\.randomInt\(100000, 1000000\)\.toString\(\);/g,
        `
  let otpCode = crypto.randomInt(100000, 1000000).toString();
  const isBypass = global.featureFlags && global.featureFlags.otp_bypass === true;
  if (isBypass) otpCode = "123456";
        `
    );
    
    // Also skip sending SMS if bypass
    authJs = authJs.replace(
        /await sendSMS\(phone, otpMsg, true\);/g,
        `
    if (!isBypass) {
      await sendSMS(phone, otpMsg, true);
    } else {
      console.log("[DEV BYPASS] SMS dipintas. Kod OTP: 123456");
    }
        `
    );
    
    fs.writeFileSync('routes/auth.js', authJs);
    console.log('Successfully injected OTP bypass.');
}

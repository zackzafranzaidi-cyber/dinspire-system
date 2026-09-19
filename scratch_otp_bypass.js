const fs = require('fs');
let authJs = fs.readFileSync('routes/auth.js', 'utf8');

if (!authJs.includes('otp_bypass')) {
    authJs = authJs.replace(
        'const otpCode = Math.floor(100000 + Math.random() * 900000).toString();',
        `
    let otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const isBypass = global.featureFlags && global.featureFlags.otp_bypass === true;
    if (isBypass) {
       otpCode = "123456"; // Kunci statik sementara untuk kecemasan
    }
        `
    );
    
    // Skip SMS sending if bypass
    // We look for where it actually sends the SMS. Wait, I'll just find "sendOTP" or similar.
}
fs.writeFileSync('routes/auth.js', authJs);
console.log('Added OTP Bypass logic to auth.js');

const fs = require('fs');
let js = fs.readFileSync('routes/auth.js', 'utf8');

// Replace the weird phone normalization in /register
const badPhoneLogic = `    // Sanitize phone number to standard format
    let cleanPhone = safePhoneStr.replace(/\\\\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "6" + cleanPhone;
    else if (!cleanPhone.startsWith("6")) cleanPhone = "60" + cleanPhone;
    const safePhone = cleanPhone.substring(0, 20);`;

const goodPhoneLogic = `    // [DIBAIKI] Guna nombor telefon secara terus seperti yang dimasukkan (cth: 01X)
    let cleanPhone = safePhoneStr.replace(/\\D/g, "");
    const safePhone = cleanPhone.substring(0, 20);`;

if (js.includes('if (cleanPhone.startsWith("0")) cleanPhone = "6" + cleanPhone;')) {
    // Actually just replace the whole block with regex to be safe
    js = js.replace(/let cleanPhone = safePhoneStr\.replace\(\/\\\\D\/g, ""\);\s*if \(cleanPhone\.startsWith\("0"\)\) cleanPhone = "6" \+ cleanPhone;\s*else if \(!cleanPhone\.startsWith\("6"\)\) cleanPhone = "60" \+ cleanPhone;\s*const safePhone = cleanPhone\.substring\(0, 20\);/g, goodPhoneLogic);
    
    // Check if it really got replaced
    if (!js.includes('cleanPhone.startsWith("0")')) {
        fs.writeFileSync('routes/auth.js', js);
        console.log('Fixed register phone logic');
    } else {
        console.log('Regex replace failed, doing manual replacement...');
        // Let's do string split and replace
    }
} else {
    console.log('Bad logic not found?');
}

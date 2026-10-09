const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// Find the string "const data = await res.json();" anywhere near the end and cut from there
let badCodeStart = code.indexOf('const data = await res.json();');
if (badCodeStart > -1) {
    // Find where the previous valid line ends. Let's just find the last "});" before the bad code.
    let beforeBad = code.substring(0, badCodeStart);
    let lastValid = beforeBad.lastIndexOf('});');
    if (lastValid > -1) {
        code = beforeBad.substring(0, lastValid + 3) + '\n';
        fs.writeFileSync('public/staff/js/staff.js', code);
        console.log("SUCCESSFULLY CLEANED UP STAFF.JS!");
    }
} else {
    console.log("NOT FOUND");
}

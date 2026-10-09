const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// The injected block ends at `});` but then there is garbage code left.
// Let's find the marker for the new injection we just added
const startMarker = '// AUTO-FILL PHONE LOOKUP (KLIK NAMA)';
const idxStart = code.indexOf(startMarker);
if (idxStart > -1) {
    // Find where the valid injection ends
    let endOfInjection = code.indexOf('});\n', code.indexOf('});\n', code.indexOf('});\n', idxStart) + 4) + 4);
    // Wait, let's just find the exact string of the new injection!
    
    // The garbage is appended after `});\n` of the new injection
    // Let's search for `             const data = await res.json();`
    let badCodeStart = code.indexOf('             const data = await res.json();');
    if (badCodeStart > -1) {
       // Where does the bad code end?
       // It's the old debounce logic. The end of the file!
       let endOfFile = code.length;
       // The bad code is literally at the very end of the file.
       code = code.substring(0, badCodeStart);
       fs.writeFileSync('public/staff/js/staff.js', code);
       console.log("Cleaned up garbage code at the end of staff.js!");
    } else {
       console.log("Could not find garbage code.");
    }
}

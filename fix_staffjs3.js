const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const searchStr = '          const data = await res.json();\r\n          if (data.found && data.name) {';
let garbageStart = code.lastIndexOf(searchStr);

if (garbageStart === -1) {
    // try LF
    garbageStart = code.lastIndexOf('          const data = await res.json();\n          if (data.found && data.name) {');
}

if (garbageStart > -1) {
    code = code.substring(0, garbageStart);
    fs.writeFileSync('public/staff/js/staff.js', code);
    console.log("GARBAGE REMOVED SAFELY!");
} else {
    console.log("GARBAGE NOT FOUND");
}

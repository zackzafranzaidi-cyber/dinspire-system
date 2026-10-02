const fs = require('fs');
let code = fs.readFileSync('routes/auth.js', 'utf8');
let idx = code.indexOf('customer_directory');
if (idx > -1) {
    console.log(code.substring(idx - 200, idx + 200));
} else {
    console.log("NOT FOUND");
}

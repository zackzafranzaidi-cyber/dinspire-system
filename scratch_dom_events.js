const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');

// Find BOTH DOMContentLoaded listeners
let idx = 0;
let count = 0;
while (true) {
  const found = js.indexOf('DOMContentLoaded', idx);
  if (found === -1) break;
  count++;
  console.log(`\n=== DOMContentLoaded #${count} at char ${found} ===`);
  console.log(js.substring(found - 50, found + 200));
  idx = found + 1;
}

const fs = require('fs');
const js = fs.readFileSync('public/customer/js/customer.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function switchView'));
if (idx !== -1) {
  console.log(lines.slice(Math.max(0, idx - 5), idx + 25).join('\n'));
} else {
  console.log('Not found');
}

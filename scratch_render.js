const fs = require('fs');
const js = fs.readFileSync('public/owner/js/owner.js', 'utf8');
const lines = js.split('\n');
let idx = lines.findIndex(l => l.includes('function renderOrdersList(') || l.includes('function renderProductOrders('));
if (idx !== -1) {
  console.log(lines.slice(idx, idx + 100).join('\n'));
} else {
  console.log('Function not found');
}

const fs = require('fs');
let js = fs.readFileSync('public/owner/js/owner.js', 'utf8');

const targetStr = `  let allPendingOrders = masterData.orders.filter(o => o.status === "Pending Verification" || o.status === "Preparing");`;
const injectStr = `  masterData.orders.forEach(o => {
    try {
      let rawItems = o.Items || o.senarai_produk;
      let items = typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
      let cost = 0;
      for (let k in items) cost += items[k].qty * items[k].price;
      o._calculatedTotal = cost;
    } catch(e) {}
  });\n\n  let allPendingOrders = masterData.orders.filter(o => o.status === "Pending Verification" || o.status === "Preparing");`;

if (js.includes(targetStr)) {
  js = js.replace(targetStr, injectStr);
  fs.writeFileSync('public/owner/js/owner.js', js);
  console.log('Fixed processData allPendingOrders');
} else {
  console.log('Target string not found');
}

const fs = require('fs');
let js = fs.readFileSync('public/owner/js/owner.js', 'utf8');

js = js.replace('for (let k in items) cost += items[k].qty * items[k].price;\n      o._calculatedTotal = cost;',
`for (let k in items) cost += items[k].qty * items[k].price;\n      o._calculatedTotal = cost + (parseFloat(o.shipping_fee) || 0);`);

fs.writeFileSync('public/owner/js/owner.js', js);
console.log('Fixed shipping fee display');

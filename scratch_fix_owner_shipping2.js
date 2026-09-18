const fs = require('fs');
let js = fs.readFileSync('public/owner/js/owner.js', 'utf8');

js = js.replace('for (let k in items) cost += items[k].qty * items[k].price;\n      o._calculatedTotal = cost;\n    } catch(e) {}',
`for (let k in items) cost += items[k].qty * items[k].price;\n      o._calculatedTotal = cost + (parseFloat(o.shipping_fee) || 0);\n    } catch(e) {}`);

fs.writeFileSync('public/owner/js/owner.js', js);
console.log('Fixed shipping fee in initial loop');

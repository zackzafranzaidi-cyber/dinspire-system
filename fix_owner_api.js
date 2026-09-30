const fs = require('fs');
let owner = fs.readFileSync('routes/owner.js', 'utf8');

owner = owner.replace(
    'orders: productOrders || [],',
    'orders: productOrders || [],\n          editRequests: editRequests || [],'
);

fs.writeFileSync('routes/owner.js', owner);
console.log("Fixed owner.js API");

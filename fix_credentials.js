const fs = require('fs');

let staffjs = fs.readFileSync('public/staff/js/staff.js', 'utf8');
staffjs = staffjs.replace(
    `'Authorization': 'Bearer ' + localStorage.getItem("din_token_sys")`,
    `// removed authorization header`
);
staffjs = staffjs.replace(
    `body: JSON.stringify({`,
    `credentials: 'include',\n            body: JSON.stringify({`
);
fs.writeFileSync('public/staff/js/staff.js', staffjs);

let ownerjs = fs.readFileSync('public/owner/js/owner.js', 'utf8');
ownerjs = ownerjs.replace(
    `headers: { 'Authorization': 'Bearer ' + localStorage.getItem("din_token_sys") }`,
    `credentials: 'include'`
);
ownerjs = ownerjs.replace(
    `headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("din_token_sys") 
            },`,
    `headers: { 'Content-Type': 'application/json' },
            credentials: 'include',`
);
fs.writeFileSync('public/owner/js/owner.js', ownerjs);

console.log("Fixed credentials logic");

const fs = require('fs');

let staffjs = fs.readFileSync('public/staff/js/staff.js', 'utf8');
staffjs = staffjs.replace("fetch('/api/staff/request-edit'", "fetch(`${API_BASE_URL}/staff/request-edit`");
fs.writeFileSync('public/staff/js/staff.js', staffjs);

let ownerjs = fs.readFileSync('public/owner/js/owner.js', 'utf8');
ownerjs = ownerjs.replace("fetch('/api/owner/edit-requests'", "fetch(`${API_BASE_URL}/owner/edit-requests`");
ownerjs = ownerjs.replace("fetch('/api/owner/resolve-edit-request'", "fetch(`${API_BASE_URL}/owner/resolve-edit-request`");
fs.writeFileSync('public/owner/js/owner.js', ownerjs);

console.log("Fixed missing API_BASE_URL in fetch calls");

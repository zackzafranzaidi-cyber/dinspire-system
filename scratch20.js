const fs = require('fs');
let code = fs.readFileSync('public/js/owner.js', 'utf8');

const helperFunction = `
function syncSeenBadge(type, count) {
    fetch(API_BASE_URL + '/owner/update-seen-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, count }),
        credentials: 'include'
    }).catch(e => console.error(e));
}
`;

code = code.replace(/function updateOwnerBadges\(\)\s*\{/, helperFunction + "\nfunction updateOwnerBadges() {");
fs.writeFileSync('public/js/owner.js', code);

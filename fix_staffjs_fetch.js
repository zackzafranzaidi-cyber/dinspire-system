const fs = require('fs');

let staffjs = fs.readFileSync('public/staff/js/staff.js', 'utf8');

// revert the corruption
staffjs = staffjs.replace(
    `credentials: "include",\n      credentials: 'include',\n            body: JSON.stringify({ username, password, allowed_roles: ["staff"], remember }),`,
    `credentials: "include",\n        body: JSON.stringify({ username, password, allowed_roles: ["staff"], remember }),`
);

// properly add credentials: 'include' to request-edit
const regex = /const res = await fetch\(`\$\{API_BASE_URL\}\/staff\/request-edit`, \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\/\/ removed authorization header\s*\},/g;
const replacement = `const res = await fetch(\`\${API_BASE_URL}/staff/request-edit\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',`;
staffjs = staffjs.replace(regex, replacement);

fs.writeFileSync('public/staff/js/staff.js', staffjs);
console.log("Fixed staff.js again");

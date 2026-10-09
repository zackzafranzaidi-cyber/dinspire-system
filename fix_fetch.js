const fs = require('fs');
let code = fs.readFileSync('public/staff/js/staff.js', 'utf8');

const badFetch = `          const res = await fetch(\`\${baseUrl}/staff/lookup-phone?phone=\${val}\`, {
              headers: { Authorization: \`Bearer \${sysToken}\` }
          });`;

const goodFetch = `          const res = await fetch(\`\${baseUrl}/staff/lookup-phone?phone=\${val}\`, {
              credentials: "include"
          });`;

if (code.includes(badFetch)) {
    code = code.replace(badFetch, goodFetch);
    fs.writeFileSync('public/staff/js/staff.js', code);
    console.log("Fixed fetch credentials");
} else {
    console.log("Could not find badFetch string exactly.");
}

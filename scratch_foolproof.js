const fs = require('fs');

let html = fs.readFileSync('public/customer/index.html', 'utf8');

// Insert a foolproof fallback script at the bottom of the body
const fallbackScript = `
<script>
  // FOOLPROOF FALLBACK: HIDE LOADER AFTER 6 SECONDS NO MATTER WHAT
  setTimeout(() => {
    const p = document.getElementById('preloader');
    if (p && p.style.visibility !== 'hidden') {
       console.warn("Fallback: Forcing loader to hide");
       p.style.opacity = '0';
       setTimeout(() => p.style.visibility = 'hidden', 500);
    }
  }, 6000);
</script>
</body>
`;

if (!html.includes('FOOLPROOF FALLBACK')) {
    html = html.replace('</body>', fallbackScript);
}

// Bump version
html = html.replace(/\?v=(\d+)/g, (match, p1) => {
    return '?v=' + (parseInt(p1) + 1);
});
html = html.replace(/CURRENT_APP_VERSION = "(\d+\.\d+\.)(\d+)"/, (match, p1, p2) => {
    return 'CURRENT_APP_VERSION = "' + p1 + (parseInt(p2) + 1) + '"';
});

fs.writeFileSync('public/customer/index.html', html);
console.log("Added foolproof fallback to customer HTML");

let htmlOwner = fs.readFileSync('public/owner/index.html', 'utf8');
if (!htmlOwner.includes('FOOLPROOF FALLBACK')) {
    htmlOwner = htmlOwner.replace('</body>', fallbackScript);
    htmlOwner = htmlOwner.replace(/\?v=(\d+)/g, (match, p1) => '?v=' + (parseInt(p1) + 1));
    fs.writeFileSync('public/owner/index.html', htmlOwner);
}

let htmlStaff = fs.readFileSync('public/staff/index.html', 'utf8');
if (!htmlStaff.includes('FOOLPROOF FALLBACK')) {
    htmlStaff = htmlStaff.replace('</body>', fallbackScript);
    htmlStaff = htmlStaff.replace(/\?v=(\d+)/g, (match, p1) => '?v=' + (parseInt(p1) + 1));
    fs.writeFileSync('public/staff/index.html', htmlStaff);
}


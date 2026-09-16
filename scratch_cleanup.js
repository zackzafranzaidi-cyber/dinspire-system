const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Remove the standalone bad rule
const badNav = `.bottom-nav {
      padding-right: calc(max(0px, (100% - 400px) / 2) + 280px) !important;
    }`;
if (css.includes(badNav)) {
    css = css.replace(badNav, "");
}

fs.writeFileSync('public/css/index.css', css);
console.log("Cleaned up CSS");

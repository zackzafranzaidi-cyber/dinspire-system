const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexDesktopGrid = /grid-template-columns: repeat\(auto-fill, minmax\(200px, 1fr\)\) !important;/;

if (css.match(regexDesktopGrid)) {
    css = css.replace(regexDesktopGrid, "grid-template-columns: repeat(4, 1fr) !important;");
    fs.writeFileSync('public/css/index.css', css);
    console.log("Updated product grid to exactly 4 columns on desktop.");
} else {
    console.log("Could not find the desktop product grid rule.");
}

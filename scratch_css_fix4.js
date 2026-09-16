const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexHeight = /height: 100dvh !important;/g;
css = css.replace(regexHeight, ''); // removes height to rely purely on top:0 bottom:0

const regexNav = /\.mobile-container\.tab-products-active \.bottom-nav \{[\s\S]*?\}\s*/;
const newNav = `.mobile-container.tab-products-active .bottom-nav {
      padding-left: calc(max(0px, (100% - 680px) / 2)) !important;
      padding-right: calc(max(0px, (100% - 680px) / 2) + 280px) !important;
    }\n`;

if (css.match(regexNav)) {
    css = css.replace(regexNav, newNav);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Fixed bottom-nav and removed height:100dvh.");
} else {
    console.log("Could not find bottom-nav rule.");
}

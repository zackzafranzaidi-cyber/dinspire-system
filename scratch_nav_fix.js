const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexOldNav = /\.bottom-nav \{\s*padding-left: calc\(max\(0px, \(100% - 400px\) \/ 2\)\) !important;\s*padding-right: calc\(max\(0px, \(100% - 400px\) \/ 2\)\) !important;\s*justify-content: space-around !important;\s*\}/;

const newNav = `.bottom-nav {
    padding-left: calc(max(0px, (100% - 400px) / 2)) !important;
    padding-right: calc(max(0px, (100% - 400px) / 2) + 280px) !important;
    justify-content: space-around !important;
  }`;

if (regexOldNav.test(css)) {
    css = css.replace(regexOldNav, newNav);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Updated bottom-nav padding correctly.");
} else {
    console.log("Could not find old bottom-nav rule.");
}

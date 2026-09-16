const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const rogueNav = `    .bottom-nav {
      padding-right: calc(max(0px, (100% - 400px) / 2) + 280px) !important;
    }`;

if (css.includes(rogueNav)) {
    css = css.replace(rogueNav, "");
    fs.writeFileSync('public/css/index.css', css);
    console.log("Removed rogue nav");
} else {
    console.log("Could not find rogue nav");
}

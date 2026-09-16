const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regex = /\.header \{\s*padding-left: 40px !important;\s*padding-right: 40px !important;\s*\}/;

const newHeaderDesktop = `.header {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }`;

if (regex.test(css)) {
    css = css.replace(regex, newHeaderDesktop);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Updated .header desktop padding.");
} else {
    console.log("Could not find .header desktop padding.");
}

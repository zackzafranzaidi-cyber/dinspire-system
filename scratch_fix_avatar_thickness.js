const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace(/top: -2px;/g, 'top: -1px;');
css = css.replace(/left: -2px;/g, 'left: -1px;');
css = css.replace(/right: -2px;/g, 'right: -1px;');
css = css.replace(/bottom: -2px;/g, 'bottom: -1px;');

fs.writeFileSync('public/css/index.css', css);
console.log("Changed profile-avatar-wrapper to 1px border.");

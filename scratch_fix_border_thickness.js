const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

// Change top/left/right/bottom from -1px to 0
css = css.replace(/top: -1px;/g, 'top: 0;');
css = css.replace(/left: -1px;/g, 'left: 0;');
css = css.replace(/right: -1px;/g, 'right: 0;');
css = css.replace(/bottom: -1px;/g, 'bottom: 0;');

fs.writeFileSync('public/css/index.css', css);
console.log("Changed pseudo elements to inset 0 for true 1px border.");

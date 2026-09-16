const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

css = css.replace('filter: blur(8px);', 'filter: blur(4px);');

fs.writeFileSync('public/css/index.css', css);
console.log("Reduced blur on profile avatar as well.");

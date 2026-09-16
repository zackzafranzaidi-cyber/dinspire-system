const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const regexSpinBorder = /@keyframes spinBorder \{\s*0% \{\s*transform: rotate\(0deg\);\s*\}\s*100% \{\s*transform: rotate\(360deg\);\s*\}\s*\}/;

css = css.replace(regexSpinBorder, '');
fs.writeFileSync('public/css/index.css', css);
console.log("Removed dead spinBorder keyframes.");

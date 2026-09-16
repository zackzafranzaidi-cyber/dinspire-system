const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const oldGrid = `grid-template-columns: repeat(2, 1fr);`;
const newGrid = `grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));`;

if (css.includes(oldGrid)) {
    css = css.replace(oldGrid, newGrid);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Updated product-grid columns successfully.");
} else {
    console.log("Could not find grid string.");
}

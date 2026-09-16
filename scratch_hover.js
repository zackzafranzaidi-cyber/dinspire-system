const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const injection = `
.product-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}`;

if (!css.includes('.product-card:hover')) {
    css += injection;
    fs.writeFileSync('public/css/index.css', css);
    console.log("Added hover effect.");
} else {
    console.log("Hover effect already exists.");
}

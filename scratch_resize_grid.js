const fs = require('fs');
let css = fs.readFileSync('public/css/index.css', 'utf8');

const desktopMediaQueryStart = css.indexOf('@media (min-width: 768px) {');

if (desktopMediaQueryStart !== -1) {
    const desktopGridRule = `
    .product-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
      gap: 20px !important;
    }
    
    .product-title {
      font-size: 15px !important;
    }
    
    .product-price {
      font-size: 14px !important;
    }
`;
    css = css.slice(0, desktopMediaQueryStart + 27) + desktopGridRule + css.slice(desktopMediaQueryStart + 27);
    fs.writeFileSync('public/css/index.css', css);
    console.log("Injected desktop product-grid resizing CSS.");
} else {
    console.log("Could not find @media (min-width: 768px)");
}

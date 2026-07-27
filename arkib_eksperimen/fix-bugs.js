const fs = require('fs');

// Fix index.html
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace('<script src="js/i18n-index.js"></script>', ''); // Remove first occurrence from head
html = html.replace(/src="\.\/SVG\/services-outline\.svg"/g, 'src="./Icon Outline/services.png"');
html = html.replace(/src="\.\/SVG\/services-solid\.svg"/g, 'src="./Icon Full/services.png"');
html = html.replace(/src="\.\/SVG\/products-outline\.svg"/g, 'src="./Icon Outline/products.png"');
html = html.replace(/src="\.\/SVG\/products-solid\.svg"/g, 'src="./Icon Full/products.png"');
html = html.replace(/src="\.\/SVG\/home-outline\.svg"/g, 'src="./Icon Outline/home.png"');
html = html.replace(/src="\.\/SVG\/home-solid\.svg"/g, 'src="./Icon Full/home.png"');
html = html.replace(/src="\.\/SVG\/notifications-outline\.svg"/g, 'src="./Icon Outline/notifications.png"');
html = html.replace(/src="\.\/SVG\/notifications-solid\.svg"/g, 'src="./Icon Full/notifications.png"');
html = html.replace(/src="\.\/SVG\/account-outline\.svg"/g, 'src="./Icon Outline/account.png"');
html = html.replace(/src="\.\/SVG\/account-solid\.svg"/g, 'src="./Icon Full/account.png"');
html = html.replace('href="/manifest.json"', 'href="./manifest.json"');
html = html.replace('register("/sw.js")', 'register("./sw.js")');

fs.writeFileSync('public/index.html', html);

// Fix index.js
let js = fs.readFileSync('public/js/index.js', 'utf8');
const originalAPI = 'const IS_LOCALHOST = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";\nconst API_BASE_URL = IS_LOCALHOST ? "http://localhost:3000/api" : "https://[NAMA-SERVER-AWAK].onrender.com/api";\nconst VAPID_PUBLIC_KEY = "BDwYmNxy-sQG489E0z2c0-gM9i22V-7X0q4Vq-j4_9Nq8Q0O2-l5P9T4n9X0-4_4Q";';
js = js.replace(/const BASE_URL = window\.location\.origin;\r?\nconst API_BASE_URL = \$\{BASE_URL\}\/api;\r?\nconst VAPID_PUBLIC_KEY = "[^"]+";/, originalAPI);

fs.writeFileSync('public/js/index.js', js);
console.log("Fixed all bugs");

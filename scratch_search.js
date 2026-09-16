const fs = require('fs');
let html = fs.readFileSync('public/customer/index.html', 'utf8');

const searchHtmlOld = `<div class="search-box">
              <input
                type="text"
                id="product-search"`;
const searchHtmlNew = `<div class="search-box" style="box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid var(--border-color); background: #ffffff;">
              <i class="fas fa-search text-gray-400 text-sm ml-2"></i>
              <input
                type="text"
                id="product-search"`;

if (html.includes(searchHtmlOld)) {
    html = html.replace(searchHtmlOld, searchHtmlNew);
    fs.writeFileSync('public/customer/index.html', html);
    console.log("Updated search box html.");
} else {
    console.log("Could not find search box html.");
}

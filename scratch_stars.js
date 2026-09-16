const fs = require('fs');
let html = fs.readFileSync('public/owner/index.html', 'utf8');

const regex = /<div class="flex text-yellow-400 text-sm">[\s\S]*?<\/div>/;

if (regex.test(html)) {
    const newStars = `<div class="flex text-yellow-400 text-sm gap-1" id="val-rating-stars">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                  </div>`;
    html = html.replace(regex, newStars);
    fs.writeFileSync('public/owner/index.html', html);
    console.log("Added ID via regex.");
} else {
    console.log("Regex failed.");
}

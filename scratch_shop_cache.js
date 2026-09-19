const fs = require('fs');
let js = fs.readFileSync('routes/shop.js', 'utf8');

const cacheHeaderStr = `res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=86400");`;

// Replace in cache hit
js = js.replace(/res\.setHeader\("Cache-Control", "public, max-age=300"\); \/\/ \[DIBAIKI\] Browser Caching 5 Minit/g, cacheHeaderStr);

// Add to cache miss (before res.json(result);)
js = js.replace(/cache\.set\("shop_data", result, 300\);(?:[^\n]*\n)*?\s*res\.json\(result\);/g, `cache.set("shop_data", result, 300); // Set cache selama 5 minit\n    ${cacheHeaderStr}\n    res.json(result);`);

fs.writeFileSync('routes/shop.js', js);
console.log('shop.js edge caching improved');

const fs = require('fs');
let shopJs = fs.readFileSync('routes/shop.js', 'utf8');

if (!shopJs.includes('feature_flags')) {
  // Add feature_flags to the response payload
  shopJs = shopJs.replace('res.json({', 'res.json({\n      feature_flags: global.featureFlags || {},');
  fs.writeFileSync('routes/shop.js', shopJs);
  console.log('Added feature_flags to shop-data API');
}

const fs = require('fs');
let shopJs = fs.readFileSync('routes/shop.js', 'utf8');

const flagRoute = `
// PUBLIC FEATURE FLAGS (NO CACHE)
router.get("/flags", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json({ status: "success", flags: global.featureFlags || {} });
});
`;

if (!shopJs.includes('/flags')) {
  shopJs = shopJs.replace('const router = express.Router();', 'const router = express.Router();\n' + flagRoute);
  fs.writeFileSync('routes/shop.js', shopJs);
  console.log('Added /flags to shop-data API');
}

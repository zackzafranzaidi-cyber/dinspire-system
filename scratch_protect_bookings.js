const fs = require('fs');
let content = fs.readFileSync('routes/bookings.js', 'utf8');

// Add import if not exists
if (!content.includes('checkFlag')) {
  content = content.replace('const { authenticate, requireRole } = require("../middleware/auth");', 'const { authenticate, requireRole } = require("../middleware/auth");\nconst { checkFlag } = require("../utils/featureFlags");');
}

// Block Booking (Customer haircuts/treatments)
content = content.replace('router.post("/", authenticate, requireRole(["customer"]), async (req, res) => {', 'router.post("/", checkFlag("booking"), authenticate, requireRole(["customer"]), async (req, res) => {');

// Block E-Commerce Products
content = content.replace('router.post(\n  "/products",\n  authenticate,', 'router.post(\n  "/products",\n  checkFlag("ecommerce"),\n  authenticate,');

fs.writeFileSync('routes/bookings.js', content);
console.log('Bookings routes protected by checkFlag');

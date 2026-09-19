const fs = require('fs');
let devJs = fs.readFileSync('routes/dev.js', 'utf8');

const pushRoutes = `
const { addDevSubscription, notifyDev, publicVapidKey } = require("../utils/push");

// PUSH NOTIFICATION
router.get("/vapidPublicKey", (req, res) => {
  res.send(publicVapidKey);
});

router.post("/subscribe", authenticateDev, async (req, res) => {
  try {
    const subscription = req.body;
    await addDevSubscription(subscription);
    res.status(201).json({ status: "success", message: "Push notification diaktifkan untuk portal pembangun." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/test-push", authenticateDev, async (req, res) => {
  try {
    await notifyDev("Test God Mode", "Pusat kawalan pelayan beroperasi dengan lancar.");
    res.json({ status: "success", message: "Push notification dihantar." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
`;

devJs = devJs.replace('module.exports = router;', pushRoutes + '\nmodule.exports = router;');
fs.writeFileSync('routes/dev.js', devJs);
console.log('Added dev push routes');
